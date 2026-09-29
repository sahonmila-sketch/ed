import json, os, time, re
from datetime import datetime, timezone, timedelta
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity,
    get_jwt
)

from models import db, User, Course, Lesson, LessonSession, Post, Ticket, Group
from models import Attendance, ChatMessage, Notification, Question, Book, Achievement, Setting, LandingData, Grade

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(BASE_DIR, "lms.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'oquv-uz-secret-key-2026'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, resources={r"/api/*": {"origins": "*"}})

jwt = JWTManager(app)
db.init_app(app)

# ─── Role-based access decorator ─────────────────────────────────
def role_required(*roles):
    """Rolni JSTM'dan emas, joriy bazadan olamiz — aks holda rol o'zgarganda
    eskirgan token 7 kun davomida eski huquqlar bilan ishlayveradi."""
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Foydalanuvchi topilmadi"}), 401
            if user.role not in roles:
                return jsonify({"error": "Ruxsat yo'q"}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper

# Rol bo'yicha umumiy to'plamlar
STAFF_ROLES = ('admin', 'tech_admin', 'director', 'ustoz')

# ─── Helpers ─────────────────────────────────────────────────────
XP_LIMITS = {'lessons': 50, 'duels': 100, 'miniGame': 30, 'other': 20}

def get_current_user():
    return db.session.get(User, get_jwt_identity())

def user_can_manage_students(user):
    """Guruhni boshqarish huquqi: admin/tex_admin/director — hammasi,
    ustoz — faqat o'z guruhlari."""
    if user.role in ('admin', 'tech_admin', 'director'):
        return True
    if user.role == 'ustoz':
        ids = db.session.query(Group.id).filter(Group.ustoz_id == user.id).all()
        return [r[0] for r in ids]
    return False

def user_group_ids(user):
    if user.role in ('admin', 'tech_admin', 'director'):
        return [g.id for g in Group.query.all()]
    if user.role == 'ustoz':
        return [g.id for g in Group.query.filter_by(ustoz_id=user.id).all()]
    if user.group_id:
        return [user.group_id]
    return []

def add_xp(user, amount, category='other'):
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    if user.last_point_date != today:
        user.daily_category_points = '{}'
        user.last_point_date = today

    daily = json.loads(user.daily_category_points or '{}')
    current = daily.get(category, 0)
    limit = XP_LIMITS.get(category, 20)

    if current >= limit:
        return 0, f"{category} bo'yicha kunlik limit tugadi"

    can_add = min(amount, limit - current)
    user.xp = (user.xp or 0) + can_add
    daily[category] = current + can_add
    user.daily_category_points = json.dumps(daily)
    db.session.commit()
    return can_add, ""

def check_achievements(user):
    unlocked = json.loads(user.achievements or '[]')
    progress = json.loads(user.progress or '{}')
    lesson_count = sum(1 for c in progress.values() if isinstance(c, dict) for _ in c.get('completed', []))
    new_achievements = []

    # Shartlar 'achievements' jadvalidagi matnlar bilan mos kelishi shart
    checks = {
        'first_lesson': lambda: lesson_count >= 1,       # "Birinchi darsni yakunladingiz"
        'active_5': lambda: lesson_count >= 5,          # "5 ta darsni yakunladingiz"
        'top_points': lambda: (user.xp or 0) >= 5000,   # "Yuqori natija va ko'p ballar"
        'legend': lambda: (user.xp or 0) >= 15000,      # "Platformadagi eng yuqori daraja"
        'attendance_7': lambda: count_present_days(user) >= 7,  # "7 kunlik mukammal davomat"
    }

    for ach_id, check_fn in checks.items():
        if ach_id not in unlocked and check_fn():
            unlocked.append(ach_id)
            new_achievements.append(ach_id)

    if new_achievements:
        user.achievements = json.dumps(unlocked)
        db.session.commit()

    return new_achievements

def count_present_days(user):
    """Talabaning kelgan (present) kunlari soni."""
    if not user.group_id:
        return 0
    days = 0
    for r in Attendance.query.filter_by(group_id=user.group_id).all():
        if json.loads(r.records or '{}').get(str(user.id)) == 'present':
            days += 1
    return days

# ─── Init DB & Seed ──────────────────────────────────────────────
def seed_data():
    if User.query.first():
        return

    # Parol minimal uzunligi (6 belgi) boshqa endpointlarda tekshiriladi —
    # shuning uchun demo-parollar ham shu qoidaga mos keladi.
    users_data = [
        (1, 'Ali Valiyev', 'talaba@lms.uz', '123456', 'student', 1250, 1, ['first_lesson']),
        (2, 'Ustoz Anvar', 'ustoz@lms.uz', '123456', 'ustoz', 0, 1, []),
        (3, 'Asosiy Admin', 'admin@lms.uz', '123456', 'admin', 0, None, []),
        (4, 'Tech Admin', 'tech@lms.uz', '123456', 'tech_admin', 0, None, []),
        (5, 'Director Xon', 'director@lms.uz', '123456', 'director', 0, None, []),
        (6, 'Valiyeva Ona', 'parent@lms.uz', '123456', 'parent', 0, None, []),
    ]
    for uid, name, email, pw, role, xp, gid, achs in users_data:
        u = User(id=uid, full_name=name, email=email, role=role, xp=xp, group_id=gid,
                 achievements=json.dumps(achs),
                 progress=json.dumps({"1": {"completed": [1], "percent": 100}}) if uid == 1 else '{}')
        u.set_password(pw)
        if uid == 6:
            u.parent_of_id = 1
        db.session.add(u)

    g = Group(id=1, name='D 02 25', ustoz_id=2, student_ids='[1]', schedule='[]')
    db.session.add(g)

    teacher = User.query.get(2)
    c = Course(id=1, title='JavaScript Asoslari', description="JavaScript dasturlash tili bo'yicha to'liq kurs.",
               teacher_id=2, category='Dasturlash', status='Ochiq')
    db.session.add(c)
    db.session.flush()

    l = Lesson(id=1, course_id=c.id, title='Kirish', topic='JavaScript Kirish',
               content='Dasturlash nima?', video_url='https://www.youtube.com/watch?v=dQw4w9WgXcQ', order=1)
    db.session.add(l)

    # Yutuqlar — справочник: обновляем, если уже есть (идемпотентно)
    for ach in [
        ('first_lesson', 'Boshlovchi', '🌱', 'common', 'Birinchi darsni yakunladingiz'),
        ('active_5', 'Faol talaba', '🔥', 'rare', '5 ta darsni muvaffaqiyatli yakunladingiz'),
        ('attendance_7', 'Intizomli', '📅', 'epic', '7 kunlik mukammal davomat'),
        ('top_points', 'Top student', '👑', 'epic', 'Yuqori natija va ko‘p ballar'),
        ('legend', 'Afsona', '💎', 'legendary', 'Platformadagi eng yuqori daraja'),
    ]:
        row = db.session.get(Achievement, ach[0])
        if row:
            row.title, row.icon, row.rarity, row.desc = ach[1], ach[2], ach[3], ach[4]
        else:
            db.session.add(Achievement(id=ach[0], title=ach[1], icon=ach[2],
                                      rarity=ach[3], desc=ach[4]))

    p = Post(id=1, user_id=2, title='Xush kelibsiz', content='Platformaga xush kelibsiz!',
             approved=True, status='approved', author_name='Ustoz Anvar', date=datetime.now(timezone.utc).strftime('%d.%m.%Y'),
             likes=24, liked_users='[]')
    db.session.add(p)

    t = Ticket(id=101, user_id=1, user_name='Ali Valiyev', message='Tizimga kirishda xato bor', status='Ochiq', replies='[]')
    db.session.add(t)

    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    for g in [
        (1, 1, 2, 1, 5, 'Ajoyib natija!', today),
        (2, 1, 2, 1, 4, 'Yaxshi', today),
        (3, 1, 2, 1, 3, 'O\'rtacha', today),
    ]:
        db.session.add(Grade(id=g[0], student_id=g[1], course_id=g[2],
                             teacher_id=g[3], value=g[4], comment=g[5], date=g[6]))

    for q in [
        (1, "2 + 2 * 2 = ?", "6", "8", "4", "10", "A", "duel", "medium"),
        (2, "'1' + 1 JavaScriptda natijasi qanday?", "2", "11", "NaN", "Error", "B", "duel", "easy"),
        (3, "typeof null nima qaytaradi?", "null", "object", "undefined", "boolean", "B", "mini_game", "medium"),
        (4, "0.1 + 0.2 === 0.3 ?", "true", "false", "undefined", "NaN", "B", "mini_game", "hard"),
        (5, "HTML da 'href' atributi qaysi tegda ishlatiladi?", "<img>", "<a>", "<div>", "<span>", "B", "mini_game", "easy"),
    ]:
        db.session.add(Question(id=q[0], question_text=q[1], option_a=q[2], option_b=q[3],
                                option_c=q[4], option_d=q[5], correct_answer=q[6],
                                question_type=q[7], difficulty=q[8]))

    for b in [
        (1, 'Clean Code', 'Robert C. Martin tomonidan yozilgan dasturlash odobi haqida kitob.',
         'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg', '#'),
        (2, 'JavaScript: The Good Parts', "JavaScriptning eng yaxshi qismlari haqida qo'llanma.",
         'https://images-na.ssl-images-amazon.com/images/I/5131OWtQRaL._SX381_BO1,204,203,200_.jpg', '#'),
    ]:
        db.session.add(Book(id=b[0], title=b[1], description=b[2], image=b[3], link=b[4]))

    LandingData.set_data({
        "director_name": "Erko",
        "director_photo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwwz5HpQmffG_Lq0QO6FtRIUxnWg7U8X9pNA&s",
        "director_title": "Texnikum Rahbari",
        "telegram_link": "https://t.me/your_telegram",
        "instagram_link": "https://instagram.com/",
        "youtube_link": "https://youtube.com/",
        "indicators": [
            {"id": 1, "label": "Professorlar", "count": "25+", "icon": "award"},
            {"id": 2, "label": "Talabalar", "count": "1,200+", "icon": "users"},
            {"id": 3, "label": "Muvaffaqiyatlar", "count": "50+", "icon": "star"}
        ],
        "best_teachers": [
            {"id": 1, "name": "Samat Jienbaev", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Samat", "title": "Senior Mentor", "date": "06.04.2026"},
            {"id": 2, "name": "Gulnaz Turdimuratova", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnaz", "title": "Metodist", "date": "05.04.2026"},
            {"id": 3, "name": "Azamat Berdimuratov", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Azamat", "title": "IT Specialist", "date": "06.04.2026"}
        ]
    })

    db.session.commit()

with app.app_context():
    db.create_all()

    def ensure_column(table, col, ddl):
        from sqlalchemy import text, inspect
        cols = [c['name'] for c in inspect(db.engine).get_columns(table)]
        if col not in cols:
            db.session.execute(text(ddl))
            db.session.commit()

    ensure_column('users', 'parent_of_id', "ALTER TABLE users ADD COLUMN parent_of_id INTEGER")
    ensure_column('users', 'telegram_chat_id', "ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(50)")

    seed_data()

# ─── Geolocation helper ───────────────────────────────────────
import math

def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def get_college_location():
    lat = Setting.get('college_lat')
    lng = Setting.get('college_lng')
    radius = Setting.get('attendance_radius', '200')
    # Sozlamalar qo'lda tahrirlangan bo'lishi mumkin — noto'g'ri qiymat
    # butun endpointni 500 qilmasligi kerak.
    try:
        radius = float(radius)
    except (TypeError, ValueError):
        radius = 200.0
    if lat and lng:
        try:
            return float(lat), float(lng), radius
        except (TypeError, ValueError):
            pass
    return None, None, 200.0

# ─── Telegram notification helper ────────────────────────────
import urllib.request, urllib.error

def send_telegram_message(chat_id, text):
    token = Setting.get('telegram_bot_token')
    if not token or not chat_id:
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

def notify_student(student_id, msg, ntype='warning'):
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')
    notif = Notification(user_id=student_id, msg=msg, date=now_str, type=ntype, seen=False)
    db.session.add(notif)
    db.session.commit()
    student = User.query.get(student_id)
    if student:
        send_telegram_message(student.telegram_chat_id, f"O'quv.uz: {msg}")

# ─── Serve Static ────────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    if path.startswith('assets/') or path in ('sw.js', 'manifest.json', 'favicon.ico'):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')

# ══════════════════════════════════════════════════════════════════
#  AUTH
# ══════════════════════════════════════════════════════════════════
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$')

# Rolni o'zi tanlay olmasin — anonim ro'yxatdan o'tishda har doim talaba.
PUBLIC_REGISTER_ROLES = ('student',)


def norm_email(value):
    """Emailni kichik harfga tushiradi va bo'sh joylarni olib tashlaydi —
    aks holda `Ali@` va `ali@` turli hisoblar bo'lib qolardi."""
    return (value or '').strip().lower()


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json or {}
    email = norm_email(data.get('email'))
    user = User.query.filter_by(email=email).first() if email else None
    if not user or not user.check_password(data.get('password') or ''):
        return jsonify({"error": "Email yoki parol xato"}), 401

    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({"token": access_token, "user": user.to_dict()})

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = norm_email(data.get('email'))
    password = data.get('password') or ''

    if not name or not email:
        return jsonify({"error": "Ism va email to'ldirilishi shart"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Email noto'g'ri shaklda"}), 400
    if len(password) < 6:
        return jsonify({"error": "Parol kamida 6 belgi bo'lishi kerak"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Bu email allaqachon ro'yxatdan o'tilgan"}), 409
    if Setting.get('allowRegistration', 'true') != 'true':
        return jsonify({"error": "Hozircha ro'yxatdan o'tish yopilgan"}), 403

    group = None
    if data.get('groupId'):
        group = db.session.get(Group, int(data['groupId']))

    user = User(full_name=name, email=email, role='student', xp=0,
                group_id=group.id if group else None)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    if group:
        ids = json.loads(group.student_ids or '[]')
        if user.id not in ids:
            ids.append(user.id)
        group.student_ids = json.dumps(ids)

    db.session.commit()
    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({"token": access_token, "user": user.to_dict()}), 201

@app.route('/api/auth/me', methods=['GET', 'POST'])
@jwt_required()
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404
    return jsonify(user.to_dict())

# ══════════════════════════════════════════════════════════════════
#  USERS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/users', methods=['GET'])
@role_required('admin', 'tech_admin', 'director', 'ustoz')
def get_users():
    """Ustoz faqat o'z guruh talabalarini ko'radi, direktor hisobot uchun
    o'qituvchilarni ham ko'radi. Parol hech qachon qaytarilmaydi."""
    current = get_current_user()
    q = User.query

    if current.role == 'ustoz':
        gids = user_group_ids(current)
        visible = set()
        for gid in gids:
            g = db.session.get(Group, gid)
            if g:
                visible.update(json.loads(g.student_ids or '[]'))
        visible.add(current.id)
        users = q.filter(User.id.in_(visible)).all() if visible else []
    elif current.role == 'director':
        users = q.filter(User.role.in_(('student', 'ustoz'))).all()
    else:
        users = q.all()

    return jsonify([u.to_dict() for u in users])

@app.route('/api/users', methods=['POST'])
@role_required('admin', 'tech_admin')
def create_user():
    data = request.json or {}
    email = norm_email(data.get('email'))
    if not email or not data.get('name'):
        return jsonify({"error": "Ism va email to'ldirilishi shart"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Email noto'g'ri shaklda"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Bu email allaqachon ro'yxatdan o'tilgan"}), 409
    if len(data.get('password') or '') < 6:
        return jsonify({"error": "Parol kamida 6 belgi bo'lishi kerak"}), 400
    role = data.get('role', 'student')
    if role not in ('student', 'ustoz', 'parent', 'admin', 'tech_admin', 'director'):
        return jsonify({"error": "Noma'lum rol"}), 400

    group_id = data.get('groupId') or None
    user = User(
        full_name=data['name'], email=email,
        role=role, xp=0, group_id=group_id
    )
    user.set_password(data.get('password'))
    db.session.add(user)
    db.session.flush()

    if group_id:
        group = db.session.get(Group, int(group_id))
        if group:
            ids = json.loads(group.student_ids or '[]')
            if user.id not in ids:
                ids.append(user.id)
            group.student_ids = json.dumps(ids)

    db.session.commit()
    return jsonify(user.to_dict()), 201

@app.route('/api/users/<int:uid>', methods=['DELETE'])
@role_required('admin')
def delete_user(uid):
    current = get_current_user()
    if uid == current.id:
        return jsonify({"error": "O'z akkauntingizni o'chira olmaysiz"}), 400
    user = db.session.get(User, uid)
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404

    for g in Group.query.all():
        ids = json.loads(g.student_ids or '[]')
        if uid in ids:
            g.student_ids = json.dumps([i for i in ids if i != uid])
        if g.ustoz_id == uid:
            g.ustoz_id = None
    Notification.query.filter_by(user_id=uid).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/users/<int:uid>', methods=['PATCH'])
@jwt_required()
def update_user(uid):
    data = request.json or {}
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404

    current = get_current_user()
    if current.id != uid and current.role not in ('admin', 'tech_admin'):
        return jsonify({"error": "Ruxsat yo'q"}), 403

    if 'role' in data and current.role == 'admin':
        if data['role'] not in ('student', 'ustoz', 'parent', 'admin', 'tech_admin', 'director'):
            return jsonify({"error": "Noma'lum rol"}), 400
        user.role = data['role']
    if 'groupId' in data and current.role in ('admin', 'tech_admin'):
        old_gid, new_gid = user.group_id, data['groupId']
        user.group_id = new_gid
        for gid in (old_gid, new_gid):
            if not gid:
                continue
            g = db.session.get(Group, gid)
            if not g:
                continue
            ids = json.loads(g.student_ids or '[]')
            ids = [i for i in ids if i != uid]
            if gid == new_gid and user.role == 'student':
                ids.append(uid)
            g.student_ids = json.dumps(ids)
    if 'full_name' in data and data['full_name'].strip():
        user.full_name = data['full_name'].strip()
    if 'avatar' in data:
        user.avatar = data['avatar']
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({"error": "Parol kamida 6 belgi bo'lishi kerak"}), 400
        user.set_password(data['password'])
    if 'xp' in data and current.role in ('admin', 'tech_admin'):
        user.xp = data['xp']

    db.session.commit()
    return jsonify(user.to_dict())

@app.route('/api/users/leaderboard', methods=['GET'])
@jwt_required()
def get_leaderboard():
    users = User.query.filter_by(role='student').order_by(User.xp.desc()).all()
    groups = Group.query.all()
    group_totals = []
    for g in groups:
        ids = json.loads(g.student_ids or '[]')
        total_xp = db.session.query(db.func.coalesce(db.func.sum(User.xp), 0)).filter(
            User.id.in_(ids), User.role == 'student').scalar()
        group_totals.append({"id": g.id, "name": g.name, "totalXP": total_xp, "studentCount": len(ids)})

    return jsonify({
        "students": [u.to_dict() for u in users],
        "groups": sorted(group_totals, key=lambda x: x['totalXP'], reverse=True)
    })

# ══════════════════════════════════════════════════════════════════
#  POSTS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/posts', methods=['GET'])
def get_posts():
    # Tasdiqlanmagan postlarni faqat muallif va xodimlar ko'radi
    try:
        user = get_current_user()
    except Exception:
        user = None
    if user and user.role in STAFF_ROLES:
        posts = Post.query.order_by(Post.created_at.desc()).all()
    else:
        q = Post.query.filter_by(approved=True)
        if user:
            q = q.filter(db.or_(Post.approved == True, Post.user_id == user.id))
        else:
            q = q.filter_by(approved=True)
        posts = q.order_by(Post.created_at.desc()).all()
    return jsonify([p.to_dict() for p in posts])

@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.json
    user = get_current_user()
    post = Post(
        user_id=user.id, author_name=user.full_name,
        title=data.get('title', ''), content=data.get('content', ''),
        image=data.get('image'), likes=0, liked_users='[]', comments='[]',
        date=datetime.now(timezone.utc).strftime('%d.%m.%Y'),
        status='approved' if user.role in ('admin', 'ustoz') else 'pending',
        approved=True if user.role in ('admin', 'ustoz') else False
    )
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201

@app.route('/api/posts/<int:post_id>', methods=['PATCH'])
@role_required('admin', 'tech_admin')
def update_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "Post topilmadi"}), 404
    data = request.json or {}
    if 'approved' in data:
        post.approved = bool(data['approved'])
        post.status = 'approved' if post.approved else 'pending'
    if 'title' in data: post.title = data['title']
    if 'content' in data: post.content = data['content']
    db.session.commit()
    return jsonify(post.to_dict())

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({"error": "Post topilmadi"}), 404
    user = get_current_user()
    if post.user_id != user.id and user.role != 'admin':
        return jsonify({"error": "Ruxsat yo'q"}), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/posts/<int:post_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post topilmadi"}), 404
    user = get_current_user()
    liked = json.loads(post.liked_users or '[]')
    if user.id in liked:
        liked.remove(user.id)
        post.likes = max(0, (post.likes or 0) - 1)
    else:
        liked.append(user.id)
        post.likes = (post.likes or 0) + 1
    post.liked_users = json.dumps(liked)
    db.session.commit()
    return jsonify({"likes": post.likes, "liked": user.id in liked})

@app.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post topilmadi"}), 404
    user = get_current_user()
    data = request.json
    comments = json.loads(post.comments or '[]')
    comments.append({
        "id": int(time.time() * 1000),
        "userId": user.id, "userName": user.full_name,
        "text": data.get('text', ''),
        "time": datetime.now(timezone.utc).strftime('%H:%M')
    })
    post.comments = json.dumps(comments)
    db.session.commit()
    return jsonify({"comments": comments})

# ══════════════════════════════════════════════════════════════════
#  COURSES & LESSONS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.all()
    return jsonify([c.to_dict() for c in courses])

def _apply_lessons(course, lessons_data):
    """Kurs darslarini sinxronlaydi.

    Eski darslarni o'chib yubormaymiz — aks holda har bir saqlashda
    lesson id'lar o'zgaradi va talabalarning progressi yo'qoladi.
    """
    existing = {l.id: l for l in course.lessons.all()}
    keep = []
    for i, l in enumerate(lessons_data or []):
        lid = l.get('id')
        lesson = existing.get(lid) if lid else None
        if lesson is None:
            lesson = Lesson(course_id=course.id)
            db.session.add(lesson)
        lesson.title = l.get('title') or 'Untitled'
        lesson.topic = l.get('topic') or ''
        lesson.content = l.get('content') or ''
        lesson.video_url = l.get('videoUrl') or None
        lesson.order = i + 1
        if l.get('duration'):
            try:
                lesson.duration_minutes = int(l['duration'])
            except (TypeError, ValueError):
                pass
        keep.append(lesson)
    for lid, lesson in existing.items():
        if lesson not in keep:
            db.session.delete(lesson)


@app.route('/api/courses', methods=['POST'])
@role_required('ustoz', 'admin', 'tech_admin')
def create_course():
    user = get_current_user()
    data = request.json or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({"error": "Kurs nomi to'ldirilishi shart"}), 400
    course = Course(
        title=title, description=data.get('description', ''),
        teacher_id=data.get('teacherId') or user.id, category=data.get('category', 'Dasturlash'),
        status=data.get('status', 'Ochiq')
    )
    db.session.add(course)
    if data.get('lessons'):
        _apply_lessons(course, data['lessons'])
    db.session.commit()
    return jsonify(course.to_dict()), 201

@app.route('/api/courses/<int:course_id>', methods=['PATCH'])
@jwt_required()
def update_course(course_id):
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404
    user = get_current_user()
    if course.teacher_id != user.id and user.role not in ('admin', 'ustoz'):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    data = request.json or {}
    if 'title' in data and data['title'].strip():
        course.title = data['title'].strip()
    if 'description' in data:
        course.description = data['description']
    if 'category' in data:
        course.category = data['category']
    if 'status' in data:
        course.status = data['status']

    if 'lessons' in data:
        _apply_lessons(course, data['lessons'])

    db.session.commit()
    return jsonify(course.to_dict())

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@role_required('admin', 'ustoz')
def delete_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404
    db.session.delete(course)
    db.session.commit()
    return jsonify({"success": True})

# ─── Lesson Timer (Anti-cheat) ────────────────────────────────
@app.route('/api/lessons/<int:lesson_id>/start', methods=['POST'])
@jwt_required()
def start_lesson(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({"error": "Dars topilmadi"}), 404

    session = LessonSession(user_id=user.id, lesson_id=lesson_id, start_time=datetime.now(timezone.utc))
    db.session.add(session)
    db.session.commit()
    return jsonify({"sessionId": session.id, "startTime": session.start_time.isoformat()})

@app.route('/api/lessons/<int:lesson_id>/complete', methods=['POST'])
@jwt_required()
def complete_lesson(lesson_id):
    user = get_current_user()
    lesson = db.session.get(Lesson, lesson_id)
    if not lesson:
        return jsonify({"error": "Dars topilmadi"}), 404

    ls = LessonSession.query.filter_by(user_id=user.id, lesson_id=lesson_id, completed=False)\
        .order_by(LessonSession.start_time.desc()).first()
    if not ls:
        return jsonify({"error": "Dars sessiyasi topilmadi"}), 404

    elapsed = (datetime.now(timezone.utc) - ls.start_time).total_seconds()
    if elapsed < 1200:
        return jsonify({"error": f"20 daqiqa to'liq kuting ({1200 - int(elapsed)} soniya qoldi)"}), 400

    progress = json.loads(user.progress or '{}')
    cid = lesson.course_id
    if str(cid) not in progress:
        progress[str(cid)] = {"completed": [], "percent": 0}
    already_done = lesson_id in progress[str(cid)].get('completed', [])

    ls.completed = True
    ls.xp_awarded = not already_done
    # XP faqat bir marta — darsni qayta ochsa ham ball ikkinchi marta berilmaydi
    xp_gained, msg = (0, "Bu dars allaqachon yakunlangan") if already_done \
        else add_xp(user, 7, 'lessons')

    if not already_done:
        progress[str(cid)]['completed'].append(lesson_id)
        course = db.session.get(Course, cid)
        total = course.lessons.count() if course else 0
        progress[str(cid)]['percent'] = round(
            (len(progress[str(cid)]['completed']) / max(total, 1)) * 100
        )
    user.progress = json.dumps(progress)

    db.session.commit()
    new_achievements = check_achievements(user)

    return jsonify({
        "xpGained": xp_gained,
        "message": msg or "Dars yakunlandi!",
        "percent": progress[str(cid)]['percent'],
        "newAchievements": new_achievements
    })

# ══════════════════════════════════════════════════════════════════
#  LANDING
# ══════════════════════════════════════════════════════════════════
@app.route('/api/public/groups', methods=['GET'])
def public_groups():
    """Ro'yxatdan o'tayotgan talaba guruhni tanlashi uchun.

    Atrofdan `/api/groups` talab qiladi (o'quvchilar ro'yxati sizib chiqmasligi
    uchun), shuning uchun ro'yxatdan o'tish oynasida ishlatiladigan alohida
    endpoint kerak. Faqat id va nom qaytaradi — boshqa hech narsa.
    """
    rows = db.session.query(Group.id, Group.name).order_by(Group.name).all()
    return jsonify([{"id": gid, "name": gname} for gid, gname in rows])


@app.route('/api/landing', methods=['GET'])
def get_landing():
    return jsonify(LandingData.get_data())

@app.route('/api/landing', methods=['PATCH'])
@role_required('admin')
def update_landing():
    data = request.json
    LandingData.set_data(data)
    db.session.commit()
    return jsonify(LandingData.get_data())

# ══════════════════════════════════════════════════════════════════
#  TICKETS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/tickets', methods=['GET'])
@jwt_required()
def get_tickets():
    user = get_current_user()
    if user.role in ('admin', 'tech_admin', 'director'):
        tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    else:
        tickets = Ticket.query.filter_by(user_id=user.id).order_by(Ticket.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tickets])

@app.route('/api/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    user = get_current_user()
    data = request.json or {}
    message = (data.get('message') or '').strip()
    if not message:
        return jsonify({"error": "Xabar bo'sh bo'lamaydi"}), 400
    ticket = Ticket(user_id=user.id, user_name=user.full_name,
                    message=message, status='Ochiq', replies='[]')
    db.session.add(ticket)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201

@app.route('/api/tickets/<int:ticket_id>/reply', methods=['POST'])
@jwt_required()
def reply_ticket(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket topilmadi"}), 404
    user = get_current_user()
    if ticket.user_id != user.id and user.role not in ('admin', 'tech_admin', 'director'):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    data = request.json or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "Javob bo'sh bo'lamaydi"}), 400
    replies = json.loads(ticket.replies or '[]')
    replies.append({
        "id": int(time.time() * 1000),
        "user_id": user.id, "user_name": user.full_name,
        "text": text
    })
    ticket.replies = json.dumps(replies)
    db.session.commit()
    return jsonify({"replies": replies})

@app.route('/api/tickets/<int:ticket_id>/status', methods=['PATCH'])
@role_required('admin')
def update_ticket_status(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket topilmadi"}), 404
    ticket.status = request.json.get('status', ticket.status)
    db.session.commit()
    return jsonify(ticket.to_dict())

# ══════════════════════════════════════════════════════════════════
#  GROUPS & ATTENDANCE
# ══════════════════════════════════════════════════════════════════
@app.route('/api/groups', methods=['GET'])
@jwt_required()
def get_groups():
    user = get_current_user()
    if user.role in ('admin', 'tech_admin', 'director'):
        groups = Group.query.all()
    else:
        gids = user_group_ids(user)
        groups = Group.query.filter(Group.id.in_(gids)).all() if gids else []
    return jsonify([g.to_dict() for g in groups])

@app.route('/api/groups', methods=['POST'])
@role_required('admin', 'tech_admin')
def create_group():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({"error": "Guruh nomi to'ldirilishi shart"}), 400
    group = Group(
        name=name, ustoz_id=data.get('ustozId') or None,
        student_ids=json.dumps(data.get('studentIds') or []),
        schedule=json.dumps(data.get('schedule') or [])
    )
    db.session.add(group)
    db.session.commit()
    return jsonify(group.to_dict()), 201

@app.route('/api/groups/<int:gid>', methods=['DELETE'])
@role_required('admin', 'tech_admin')
def delete_group(gid):
    group = db.session.get(Group, gid)
    if not group:
        return jsonify({"error": "Guruh topilmadi"}), 404
    for u in User.query.filter_by(group_id=gid).all():
        u.group_id = None
    db.session.delete(group)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/groups/<int:gid>', methods=['PATCH'])
@jwt_required()
def update_group(gid):
    group = db.session.get(Group, gid)
    if not group:
        return jsonify({"error": "Guruh topilmadi"}), 404
    user = get_current_user()
    allowed = user_group_ids(user)
    if gid not in allowed:
        return jsonify({"error": "Ruxsat yo'q"}), 403
    data = request.json or {}

    if 'schedule' in data:
        group.schedule = json.dumps(data['schedule'] or [])
    if 'name' in data and data['name'].strip():
        group.name = data['name'].strip()
    if 'studentIds' in data and user.role in ('admin', 'tech_admin', 'director'):
        new_ids = [int(i) for i in data['studentIds']]
        for u in User.query.filter_by(group_id=gid).all():
            if u.id not in new_ids:
                u.group_id = None
        for sid in new_ids:
            u = db.session.get(User, sid)
            if u:
                u.group_id = gid
        group.student_ids = json.dumps(new_ids)
    elif 'studentIds' in data and user.role == 'ustoz':
        # ustoz o'z guruhiga talaba qo'sha oladi, lekin olib tashlay olmaydi
        current = json.loads(group.student_ids or '[]')
        for sid in data['studentIds']:
            sid = int(sid)
            u = db.session.get(User, sid)
            if u and u.role == 'student' and sid not in current:
                current.append(sid)
                u.group_id = gid
        group.student_ids = json.dumps(current)
    if 'ustozId' in data and user.role in ('admin', 'tech_admin'):
        group.ustoz_id = data['ustozId'] or None
    db.session.commit()
    return jsonify(group.to_dict())

@app.route('/api/attendance', methods=['GET'])
@role_required(*STAFF_ROLES)
def get_attendance():
    """Davomat yozuvlari faqat xodimlarga — student o'z tarixini
    /api/attendance/my orqali oladi."""
    records = Attendance.query.all()
    return jsonify([r.to_dict() for r in records])

@app.route('/api/attendance', methods=['POST'])
@role_required('ustoz', 'admin', 'tech_admin', 'director')
def mark_attendance():
    user = get_current_user()
    data = request.json or {}
    gid = data.get('groupId')
    if gid is None or 'studentId' not in data or 'status' not in data:
        return jsonify({"error": "groupId, studentId va status talab qilinadi"}), 400
    if gid not in user_group_ids(user):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    if data['status'] not in ('present', 'absent'):
        return jsonify({"error": "status 'present' yoki 'absent' bo'lishi kerak"}), 400

    # Sana kelmagan bo'lsa — bugungi kun (avval `data['date']` KeyError berardi)
    date = data.get('date') or datetime.now(timezone.utc).strftime('%Y-%m-%d')

    record = Attendance.query.filter_by(group_id=gid, date=date).first()
    if not record:
        record = Attendance(group_id=gid, date=date, records='{}', reasons='{}')
        db.session.add(record)

    records = json.loads(record.records or '{}')
    old_status = records.get(str(data['studentId']))
    records[str(data['studentId'])] = data['status']
    record.records = json.dumps(records)

    reasons = json.loads(record.reasons or '{}')
    reasons[str(data['studentId'])] = data.get('reason', '')
    record.reasons = json.dumps(reasons)

    db.session.commit()

    if data['status'] == 'absent' and old_status != 'absent':
        group = db.session.get(Group, gid)
        group_name = group.name if group else ''
        notify_student(data['studentId'],
                       f"Siz {group_name} guruhida {date} kuni darsga kelmadingiz!", 'warning')

    return jsonify(record.to_dict())

@app.route('/api/attendance/date/<date>', methods=['GET'])
@jwt_required()
def get_attendance_by_date(date):
    records = Attendance.query.filter_by(date=date).all()
    return jsonify([r.to_dict() for r in records])

# ══════════════════════════════════════════════════════════════════
#  CHAT
# ══════════════════════════════════════════════════════════════════
@app.route('/api/chat/<int:group_id>', methods=['GET'])
@jwt_required()
def get_chat(group_id):
    user = get_current_user()
    if group_id != 0 and group_id not in user_group_ids(user):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    msgs = ChatMessage.query.filter_by(group_id=group_id).order_by(ChatMessage.id.asc()).all()
    return jsonify([m.to_dict() for m in msgs])

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def send_chat():
    user = get_current_user()
    data = request.json or {}
    gid = data.get('groupId')
    if gid is None or gid not in user_group_ids(user):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "Xabar bo'sh bo'lamaydi"}), 400
    msg = ChatMessage(
        group_id=gid, user_id=user.id, user_name=user.full_name,
        text=text, time=datetime.now(timezone.utc).strftime('%H:%M'),
        type=data.get('type', 'text')
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

# ══════════════════════════════════════════════════════════════════
#  QUESTIONS, BOOKS, ACHIEVEMENTS
# ══════════════════════════════════════════════════════════════════
QUIZ_TYPES = ('duel', 'mini_game', 'quiz')


def _norm_quiz_type(value, default='duel'):
    """Tur nomini bitta ko'rinishga keltiradi.

    Eski versiyalar 'miniGame' yozgan, yangilar 'mini_game' — ikkalasi ham
    qabul qilinadi, saqlanadigani har doim QUIZ_TYPES ichidan.
    """
    v = (value or '').strip().lower().replace('-', '_')
    if v in ('minigame', 'mini', 'game'):
        return 'mini_game'
    return v if v in QUIZ_TYPES else default


@app.route('/api/questions', methods=['GET'])
@jwt_required()
def get_questions():
    questions = Question.query.all()
    return jsonify([q.to_dict() for q in questions])


@app.route('/api/questions', methods=['POST'])
@role_required('ustoz', 'admin', 'tech_admin')
def create_question():
    data = request.json or {}
    text = (data.get('questionText') or '').strip()
    if not text:
        return jsonify({"error": "Savol matni to'ldirilishi shart"}), 400
    correct = (data.get('correctAnswer') or 'A').upper()
    if correct not in ('A', 'B', 'C', 'D'):
        return jsonify({"error": "To'g'ri javob A, B, C yoki D bo'lishi kerak"}), 400
    options = [data.get('optionA'), data.get('optionB'), data.get('optionC'), data.get('optionD')]
    if not all(o and str(o).strip() for o in options):
        return jsonify({"error": "Barcha 4 ta variant to'ldirilishi shart"}), 400

    q = Question(
        question_text=text,
        option_a=str(options[0]), option_b=str(options[1]),
        option_c=str(options[2]), option_d=str(options[3]),
        correct_answer=correct,
        question_type=_norm_quiz_type(data.get('type')),
        difficulty=data.get('difficulty', 'medium')
    )
    db.session.add(q)
    db.session.commit()
    return jsonify(q.to_dict()), 201

@app.route('/api/questions/<int:qid>', methods=['PATCH', 'DELETE'])
@role_required('ustoz', 'admin', 'tech_admin')
def update_question(qid):
    q = db.session.get(Question, qid)
    if not q:
        return jsonify({"error": "Savol topilmadi"}), 404

    if request.method == 'DELETE':
        db.session.delete(q)
        db.session.commit()
        return jsonify({"success": True})

    data = request.json or {}
    if 'questionText' in data: q.question_text = data['questionText']
    if 'optionA' in data: q.option_a = data['optionA']
    if 'optionB' in data: q.option_b = data['optionB']
    if 'optionC' in data: q.option_c = data['optionC']
    if 'optionD' in data: q.option_d = data['optionD']
    if 'correctAnswer' in data:
        c = str(data['correctAnswer']).upper()
        if c not in ('A', 'B', 'C', 'D'):
            return jsonify({"error": "To'g'ri javob A, B, C yoki D bo'lishi kerak"}), 400
        q.correct_answer = c
    if 'type' in data: q.question_type = _norm_quiz_type(data['type'], q.question_type)
    if 'difficulty' in data: q.difficulty = data['difficulty']
    db.session.commit()
    return jsonify(q.to_dict())

@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([b.to_dict() for b in books])

@app.route('/api/books', methods=['POST'])
@role_required('admin', 'tech_admin')
def create_book():
    data = request.json or {}
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({"error": "Kitob nomi to'ldirilishi shart"}), 400
    book = Book(
        title=title, description=data.get('description', ''),
        image=data.get('image') or '', link=data.get('link') or '#'
    )
    db.session.add(book)
    db.session.commit()
    return jsonify(book.to_dict()), 201

@app.route('/api/books/<int:bid>', methods=['DELETE'])
@role_required('admin', 'tech_admin')
def delete_book(bid):
    book = db.session.get(Book, bid)
    if not book:
        return jsonify({"error": "Kitob topilmadi"}), 404
    db.session.delete(book)
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/achievements', methods=['GET'])
def get_achievements():
    achs = Achievement.query.all()
    return jsonify([a.to_dict() for a in achs])

# ══════════════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user = get_current_user()
    notifs = Notification.query.filter(
        db.or_(Notification.user_id == user.id, Notification.user_id == None)
    ).order_by(Notification.id.desc()).limit(50).all()
    return jsonify([n.to_dict() for n in notifs])

@app.route('/api/notifications/read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    user = get_current_user()
    Notification.query.filter(
        db.or_(Notification.user_id == user.id, Notification.user_id == None),
        Notification.seen == False
    ).update({"seen": True})
    db.session.commit()
    return jsonify({"success": True})

# ══════════════════════════════════════════════════════════════════
#  SETTINGS
# ══════════════════════════════════════════════════════════════════
def _as_bool_text(value):
    """JS'dan kelgan boolean/har qanday qiymatni 'true'/'false' matniga.

    `str(True)` == 'True' bo'lgani uchun oddiy `str()` ishlamaydi —
    tulkarning `allowRegistration` tugmasi hech qachon qayta yoqilmay qolardi.
    """
    if isinstance(value, bool):
        return 'true' if value else 'false'
    return 'true' if str(value).strip().lower() in ('1', 'true', 'yes', 'on') else 'false'


@app.route('/api/settings', methods=['GET'])
def get_settings():
    # Bot tokeni hamma uchun ochiq bo'lmasligi kerak — faqat admin/tech_admin.
    data = {
        "platformName": Setting.get('platformName', "O'quv.uz"),
        "allowRegistration": Setting.get('allowRegistration', 'true') == 'true',
        "collegeLat": Setting.get('college_lat'),
        "collegeLng": Setting.get('college_lng'),
        "attendanceRadius": int(Setting.get('attendance_radius', '200') or 200),
    }
    try:
        user = get_current_user()
    except Exception:
        user = None
    if user and user.role in ('admin', 'tech_admin'):
        data["telegramBotToken"] = Setting.get('telegram_bot_token', '')
    return jsonify(data)

@app.route('/api/settings', methods=['PATCH'])
@role_required('tech_admin', 'admin')
def update_settings():
    data = request.json or {}
    if 'platformName' in data: Setting.set('platformName', str(data['platformName']).strip())
    if 'allowRegistration' in data: Setting.set('allowRegistration', _as_bool_text(data['allowRegistration']))
    if 'collegeLat' in data: Setting.set('college_lat', str(data['collegeLat']).strip())
    if 'collegeLng' in data: Setting.set('college_lng', str(data['collegeLng']).strip())
    if 'attendanceRadius' in data: Setting.set('attendance_radius', str(data['attendanceRadius']))
    if 'telegramBotToken' in data: Setting.set('telegram_bot_token', data['telegramBotToken'])
    db.session.commit()
    return get_settings()

# ══════════════════════════════════════════════════════════════════
#  XP & DUEL (gamification)
# ══════════════════════════════════════════════════════════════════
@app.route('/api/xp/add', methods=['POST'])
@jwt_required()
def add_xp_endpoint():
    user = get_current_user()
    data = request.json or {}
    gained, msg = add_xp(user, data.get('amount', 0), data.get('category', 'other'))
    # check_achievements o'z ichida commit qiladi — bitta marta chaqiramiz,
    # aks holda javobdagi ro'yxat har doim bo'sh qaytadi.
    new_achievements = check_achievements(user)
    db.session.refresh(user)
    return jsonify({
        "xpGained": gained,
        "totalXp": user.xp,
        "message": msg,
        "newAchievements": new_achievements
    })

@app.route('/api/duel/win', methods=['POST'])
@jwt_required()
def duel_win():
    user = get_current_user()
    data = request.json
    user.duel_wins = (user.duel_wins or 0) + 1
    gained, msg = add_xp(user, data.get('amount', 10), 'duels')
    check_achievements(user)
    db.session.commit()
    return jsonify({"xpGained": gained, "totalXp": user.xp, "duelWins": user.duel_wins})

# ══════════════════════════════════════════════════════════════════
#  STAFF CHAT
# ══════════════════════════════════════════════════════════════════
@app.route('/api/staff-chat', methods=['GET'])
@role_required(*STAFF_ROLES)
def get_staff_chat():
    msgs = ChatMessage.query.filter_by(group_id=0).order_by(ChatMessage.id.asc()).all()
    return jsonify([m.to_dict() for m in msgs])

@app.route('/api/staff-chat', methods=['POST'])
@role_required(*STAFF_ROLES)
def send_staff_chat():
    user = get_current_user()
    data = request.json or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "Xabar bo'sh bo'lamaydi"}), 400
    msg = ChatMessage(
        group_id=0, user_id=user.id, user_name=user.full_name,
        text=text, time=datetime.now(timezone.utc).strftime('%H:%M'),
        type=data.get('type', 'text')
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

# ══════════════════════════════════════════════════════════════════
#  GEOLOCATION CHECK-IN
# ══════════════════════════════════════════════════════════════════
@app.route('/api/attendance/checkin', methods=['POST'])
@jwt_required()
def attendance_checkin():
    user = get_current_user()
    data = request.json
    lat = data.get('lat')
    lng = data.get('lng')
    if lat is None or lng is None:
        return jsonify({"error": "GPS koordinatalari kiritilmadi"}), 400

    college_lat, college_lng, radius = get_college_location()
    if college_lat is None:
        return jsonify({"error": "Kolledj lokatsiyasi sozlanmagan"}), 400

    distance = haversine_distance(lat, lng, college_lat, college_lng)
    inside = distance <= radius

    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    # Kolledjdan tashqarida bo'lsa "absent" deb yozmaymiz — bu noto'g'ri
    # edi (GPS xatosi ham talabani kelmagan qilib belgilardi).
    if inside and user.group_id:
        record = Attendance.query.filter_by(group_id=user.group_id, date=today).first()
        if not record:
            record = Attendance(group_id=user.group_id, date=today, records='{}', reasons='{}')
            db.session.add(record)
        records = json.loads(record.records or '{}')
        records[str(user.id)] = 'present'
        record.records = json.dumps(records)
        db.session.commit()

    return jsonify({
        "success": True,
        "status": 'present' if inside else 'outside',
        "distance": int(distance),
        "radius": int(radius),
        "inside": inside,
        "message": (f"Masofa: {int(distance)}m. Kolledjdasiz — davomat belgilandi!"
                    if inside else
                    f"Masofa: {int(distance)}m. Kolledj radiusidan tashqaridasiz ({int(radius)}m), davomat belgilanmadi.")
    })

@app.route('/api/attendance/my', methods=['GET'])
@jwt_required()
def get_my_attendance():
    user = get_current_user()
    if not user.group_id:
        return jsonify([])
    records = Attendance.query.filter_by(group_id=user.group_id).all()
    result = []
    for r in records:
        parsed = json.loads(r.records or '{}')
        if str(user.id) in parsed:
            result.append({
                'date': r.date,
                'status': parsed[str(user.id)],
                'groupId': r.group_id
            })
    return jsonify(result)

# ══════════════════════════════════════════════════════════════════
#  GRADES (Успеваемость)
# ══════════════════════════════════════════════════════════════════
@app.route('/api/grades', methods=['GET'])
@jwt_required()
def get_grades():
    user = get_current_user()
    if user.role == 'student':
        grades = Grade.query.filter_by(student_id=user.id).order_by(Grade.created_at.desc()).all()
    elif user.role == 'parent':
        child_id = user.parent_of_id
        if not child_id:
            return jsonify([])
        grades = Grade.query.filter_by(student_id=child_id).order_by(Grade.created_at.desc()).all()
    elif user.role in ('ustoz', 'admin', 'tech_admin'):
        grades = Grade.query.filter_by(teacher_id=user.id).order_by(Grade.created_at.desc()).all()
    else:
        grades = Grade.query.order_by(Grade.created_at.desc()).all()
    return jsonify([g.to_dict() for g in grades])

@app.route('/api/grades', methods=['POST'])
@role_required('ustoz', 'admin', 'tech_admin')
def create_grade():
    user = get_current_user()
    data = request.json or {}
    sid, cid, value = data.get('studentId'), data.get('courseId'), data.get('value')
    if not sid or not cid or value is None:
        return jsonify({"error": "studentId, courseId va value talab qilinadi"}), 400
    try:
        value = int(value)
    except (TypeError, ValueError):
        return jsonify({"error": "Baho butun son bo'lishi kerak"}), 400
    if value < 1 or value > 5:
        return jsonify({"error": "Baho 1 dan 5 gacha bo'lishi kerak"}), 400
    if not db.session.get(User, int(sid)):
        return jsonify({"error": "Talaba topilmadi"}), 404
    if not db.session.get(Course, int(cid)):
        return jsonify({"error": "Kurs topilmadi"}), 404

    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    grade = Grade(
        student_id=int(sid), course_id=int(cid), teacher_id=user.id,
        value=value, comment=data.get('comment', ''), date=data.get('date', today)
    )
    db.session.add(grade)
    db.session.commit()

    notify_student(int(sid), f"Sizga yangi baho qo'yildi: {value} ({today})", 'info')

    return jsonify(grade.to_dict()), 201

@app.route('/api/grades/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_grades(student_id):
    user = get_current_user()
    if user.role == 'parent' and user.parent_of_id == student_id:
        pass
    elif user.id != student_id and user.role not in ('ustoz', 'admin', 'tech_admin'):
        return jsonify({"error": "Ruxsat yo'q"}), 403

    grades = Grade.query.filter_by(student_id=student_id).order_by(Grade.created_at.desc()).all()
    return jsonify([g.to_dict() for g in grades])

@app.route('/api/grades/<int:grade_id>', methods=['DELETE'])
@role_required('ustoz', 'admin', 'tech_admin')
def delete_grade(grade_id):
    grade = Grade.query.get(grade_id)
    if not grade:
        return jsonify({"error": "Baho topilmadi"}), 404
    user = get_current_user()
    if grade.teacher_id != user.id and user.role not in ('admin', 'tech_admin'):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    db.session.delete(grade)
    db.session.commit()
    return jsonify({"success": True})

# ══════════════════════════════════════════════════════════════════
#  PARENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/parent/child', methods=['GET'])
@role_required('parent')
def get_parent_child():
    user = get_current_user()
    if not user.parent_of_id:
        return jsonify({"error": "Bola bog'lanmagan"}), 404
    child = User.query.get(user.parent_of_id)
    if not child:
        return jsonify({"error": "Bola topilmadi"}), 404
    child_dict = child.to_dict()
    child_dict['groupName'] = ''
    if child.group_id:
        g = Group.query.get(child.group_id)
        if g:
            child_dict['groupName'] = g.name
    return jsonify(child_dict)

@app.route('/api/parent/child/attendance', methods=['GET'])
@role_required('parent')
def get_parent_child_attendance():
    user = get_current_user()
    if not user.parent_of_id:
        return jsonify([])
    child = User.query.get(user.parent_of_id)
    if not child or not child.group_id:
        return jsonify([])
    records = Attendance.query.filter_by(group_id=child.group_id).all()
    result = []
    for r in records:
        parsed = json.loads(r.records or '{}')
        if str(child.id) in parsed:
            result.append({'date': r.date, 'status': parsed[str(child.id)]})
    return jsonify(result)

@app.route('/api/telegram/bind', methods=['POST'])
@jwt_required()
def bind_telegram():
    user = get_current_user()
    data = request.json
    chat_id = data.get('chatId', '')
    user.telegram_chat_id = str(chat_id) if chat_id else None
    db.session.commit()
    return jsonify({"success": True})

# ══════════════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
