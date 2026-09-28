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
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') not in roles:
                return jsonify({"error": "Ruxsat yo'q"}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper

# ─── Helpers ─────────────────────────────────────────────────────
XP_LIMITS = {'lessons': 50, 'duels': 100, 'miniGame': 30, 'other': 20}

def get_current_user():
    uid = get_jwt_identity()
    return User.query.get(uid)

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

    checks = {
        'first_lesson': lambda: lesson_count >= 1,
        'active_5': lambda: lesson_count >= 15,
        'top_points': lambda: (user.xp or 0) >= 5000,
        'legend': lambda: (user.xp or 0) >= 15000,
        'attendance_7': lambda: (user.duel_wins or 0) >= 50
    }

    for ach_id, check_fn in checks.items():
        if ach_id not in unlocked and check_fn():
            unlocked.append(ach_id)
            new_achievements.append(ach_id)

    if new_achievements:
        user.achievements = json.dumps(unlocked)
        db.session.commit()

    return new_achievements

# ─── Init DB & Seed ──────────────────────────────────────────────
def seed_data():
    if User.query.first():
        return

    users_data = [
        (1, 'Ali Valiyev', 'talaba@lms.uz', '123', 'student', 1250, 1, ['first_lesson']),
        (2, 'Ustoz Anvar', 'ustoz@lms.uz', '123', 'ustoz', 0, 1, []),
        (3, 'Asosiy Admin', 'admin@lms.uz', '123', 'admin', 0, None, []),
        (4, 'Tech Admin', 'tech@lms.uz', '123', 'tech_admin', 0, None, []),
        (5, 'Director Xon', 'director@lms.uz', '123', 'director', 0, None, []),
        (6, 'Valiyeva Ona', 'parent@lms.uz', '123', 'parent', 0, None, []),
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

    for ach in [
        ('first_lesson', 'Boshlovchi', '🌱', 'common', 'Birinchi darsni yakunladingiz'),
        ('active_5', 'Faol talaba', '🔥', 'rare', '5 ta darsni muvaffaqiyatli yakunladingiz'),
        ('attendance_7', 'Intizomli', '📅', 'epic', '7 kunlik mukammal davomat'),
        ('top_points', 'Top student', '👑', 'epic', 'Yuqori natija va ko\'p ballar'),
        ('legend', 'Afsona', '💎', 'legendary', 'Platformadagi eng yuqori daraja'),
    ]:
        db.session.add(Achievement(id=ach[0], title=ach[1], icon=ach[2], rarity=ach[3], desc=ach[4]))

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
    if lat and lng:
        return float(lat), float(lng), float(radius)
    return None, None, 200

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
@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({"error": "Email yoki parol xato"}), 401

    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({"token": access_token, "user": user.to_dict()})

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    data = request.json
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"error": "Bu email allaqachon ro'yxatdan o'tilgan"}), 409

    group_id = data.get('groupId')
    if group_id:
        group = Group.query.get(int(group_id))
        if group:
            ids = json.loads(group.student_ids)
            ids.append(int(time.time() * 1000))

    user = User(full_name=data['name'], email=data['email'], role='student', xp=0)
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    if group_id:
        group = Group.query.get(int(group_id))
        if group:
            ids = json.loads(group.student_ids)
            ids.append(user.id)
            group.student_ids = json.dumps(ids)

    db.session.commit()
    access_token = create_access_token(identity=str(user.id), additional_claims={'role': 'student'})
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
@role_required('admin', 'tech_admin')
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/users/<int:uid>', methods=['PATCH'])
@jwt_required()
def update_user(uid):
    data = request.json
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "Foydalanuvchi topilmadi"}), 404

    current = get_current_user()
    if current.id != uid and current.role not in ('admin', 'tech_admin'):
        return jsonify({"error": "Ruxsat yo'q"}), 403

    if 'role' in data and current.role in ('admin', 'tech_admin'):
        user.role = data['role']
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'avatar' in data:
        user.avatar = data['avatar']
    if 'password' in data:
        user.set_password(data['password'])
    if 'xp' in data and current.role in ('admin', 'tech_admin'):
        user.xp = data['xp']

    db.session.commit()
    return jsonify(user.to_dict())

@app.route('/api/users/leaderboard', methods=['GET'])
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
    posts = Post.query.order_by(Post.created_at.desc()).all()
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
@role_required('admin')
def update_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post topilmadi"}), 404
    data = request.json
    if 'approved' in data:
        post.approved = data['approved']
        post.status = 'approved' if data['approved'] else 'rejected'
    db.session.commit()
    return jsonify(post.to_dict())

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"error": "Post topilmadi"}), 404
    user = get_current_user()
    if post.user_id != user.id and user.role not in ('admin', 'ustoz'):
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

@app.route('/api/courses', methods=['POST'])
@jwt_required()
def create_course():
    user = get_current_user()
    data = request.json
    course = Course(
        title=data['title'], description=data.get('description', ''),
        teacher_id=user.id, category=data.get('category', 'Dasturlash'),
        status=data.get('status', 'Ochiq')
    )
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201

@app.route('/api/courses/<int:course_id>', methods=['PATCH'])
@jwt_required()
def update_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Kurs topilmadi"}), 404
    user = get_current_user()
    if course.teacher_id != user.id and user.role not in ('admin', 'ustoz'):
        return jsonify({"error": "Ruxsat yo'q"}), 403
    data = request.json
    if 'title' in data: course.title = data['title']
    if 'description' in data: course.description = data['description']
    if 'lessons' in data:
        for existing in course.lessons.all():
            db.session.delete(existing)
        for i, l in enumerate(data['lessons']):
            lesson = Lesson(
                course_id=course.id, title=l.get('title', ''),
                topic=l.get('topic', ''), content=l.get('content', ''),
                video_url=l.get('videoUrl'), order=i+1
            )
            db.session.add(lesson)
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
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({"error": "Dars topilmadi"}), 404

    ls = LessonSession.query.filter_by(user_id=user.id, lesson_id=lesson_id, completed=False)\
        .order_by(LessonSession.start_time.desc()).first()
    if not ls:
        return jsonify({"error": "Dars sessiyasi topilmadi"}), 404

    elapsed = (datetime.now(timezone.utc) - ls.start_time).total_seconds()
    if elapsed < 1200:
        return jsonify({"error": f"20 daqiqa to'liq kuting ({1200 - int(elapsed)} soniya qoldi)"}), 400

    ls.completed = True
    xp_gained, msg = add_xp(user, 7, 'lessons')

    progress = json.loads(user.progress or '{}')
    cid = lesson.course_id
    if str(cid) not in progress:
        progress[str(cid)] = {"completed": [], "percent": 0}
    if lesson_id not in progress[str(cid)]["completed"]:
        progress[str(cid)]["completed"].append(lesson_id)
        course = Course.query.get(cid)
        total = course.lessons.count()
        progress[str(cid)]["percent"] = round((len(progress[str(cid)]["completed"]) / max(total, 1)) * 100)
    user.progress = json.dumps(progress)

    ls.xp_awarded = True
    db.session.commit()
    check_achievements(user)

    return jsonify({"xpGained": xp_gained, "message": msg or "Dars yakunlandi!"})

# ══════════════════════════════════════════════════════════════════
#  LANDING
# ══════════════════════════════════════════════════════════════════
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
    if user.role == 'admin':
        tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
    else:
        tickets = Ticket.query.filter_by(user_id=user.id).order_by(Ticket.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tickets])

@app.route('/api/tickets', methods=['POST'])
@jwt_required()
def create_ticket():
    user = get_current_user()
    data = request.json
    ticket = Ticket(user_id=user.id, user_name=user.full_name,
                    message=data.get('message', ''), status='Ochiq', replies='[]')
    db.session.add(ticket)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201

@app.route('/api/tickets/<int:ticket_id>/reply', methods=['POST'])
@jwt_required()
def reply_ticket(ticket_id):
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({"error": "Ticket topilmadi"}), 404
    user = get_current_user()
    data = request.json
    replies = json.loads(ticket.replies or '[]')
    replies.append({
        "id": int(time.time() * 1000),
        "user_id": user.id, "user_name": user.full_name,
        "text": data.get('text', '')
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
    groups = Group.query.all()
    return jsonify([g.to_dict() for g in groups])

@app.route('/api/groups/<int:gid>', methods=['PATCH'])
@jwt_required()
def update_group(gid):
    group = Group.query.get(gid)
    if not group:
        return jsonify({"error": "Guruh topilmadi"}), 404
    data = request.json
    if 'schedule' in data: group.schedule = json.dumps(data['schedule'])
    if 'studentIds' in data: group.student_ids = json.dumps(data['studentIds'])
    db.session.commit()
    return jsonify(group.to_dict())

@app.route('/api/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    records = Attendance.query.all()
    return jsonify([r.to_dict() for r in records])

@app.route('/api/attendance', methods=['POST'])
@jwt_required()
def mark_attendance():
    data = request.json
    record = Attendance.query.filter_by(group_id=data['groupId'], date=data['date']).first()
    if not record:
        record = Attendance(group_id=data['groupId'], date=data['date'], records='{}', reasons='{}')
        db.session.add(record)

    records = json.loads(record.records or '{}')
    old_status = records.get(str(data['studentId']))
    new_status = data['status']
    records[str(data['studentId'])] = new_status
    record.records = json.dumps(records)

    if 'reason' in data:
        reasons = json.loads(record.reasons or '{}')
        reasons[str(data['studentId'])] = data['reason']
        record.reasons = json.dumps(reasons)

    db.session.commit()

    if new_status == 'absent' and old_status != 'absent':
        student_id = data['studentId']
        student = User.query.get(student_id)
        group = Group.query.get(data['groupId'])
        group_name = group.name if group else ''
        msg = f"Siz {group_name} guruhida {data['date']} kuni darsga kelmadingiz!"
        notify_student(student_id, msg, 'warning')

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
    msgs = ChatMessage.query.filter_by(group_id=group_id).order_by(ChatMessage.id.asc()).all()
    return jsonify([m.to_dict() for m in msgs])

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def send_chat():
    user = get_current_user()
    data = request.json
    msg = ChatMessage(
        group_id=data['groupId'], user_id=user.id, user_name=user.full_name,
        text=data.get('text', ''), time=datetime.now(timezone.utc).strftime('%H:%M'),
        type=data.get('type', 'text')
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201

# ══════════════════════════════════════════════════════════════════
#  QUESTIONS, BOOKS, ACHIEVEMENTS
# ══════════════════════════════════════════════════════════════════
@app.route('/api/questions', methods=['GET'])
def get_questions():
    questions = Question.query.all()
    return jsonify([q.to_dict() for q in questions])

@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([b.to_dict() for b in books])

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
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify({
        "platformName": Setting.get('platformName', "O'quv.uz"),
        "allowRegistration": Setting.get('allowRegistration', 'true') == 'true',
        "collegeLat": Setting.get('college_lat'),
        "collegeLng": Setting.get('college_lng'),
        "attendanceRadius": int(Setting.get('attendance_radius', '200') or 200),
        "telegramBotToken": Setting.get('telegram_bot_token', ''),
    })

@app.route('/api/settings', methods=['PATCH'])
@role_required('tech_admin', 'admin')
def update_settings():
    data = request.json
    if 'platformName' in data: Setting.set('platformName', data['platformName'])
    if 'allowRegistration' in data: Setting.set('allowRegistration', str(data['allowRegistration']))
    if 'collegeLat' in data: Setting.set('college_lat', str(data['collegeLat']))
    if 'collegeLng' in data: Setting.set('college_lng', str(data['collegeLng']))
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
    data = request.json
    amount = data.get('amount', 0)
    category = data.get('category', 'other')
    gained, msg = add_xp(user, amount, category)
    check_achievements(user)
    db.session.refresh(user)
    return jsonify({"xpGained": gained, "totalXp": user.xp, "message": msg, "newAchievements": check_achievements(user)})

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
@jwt_required()
def get_staff_chat():
    msgs = ChatMessage.query.filter_by(group_id=0).order_by(ChatMessage.id.asc()).all()
    return jsonify([m.to_dict() for m in msgs])

@app.route('/api/staff-chat', methods=['POST'])
@jwt_required()
def send_staff_chat():
    user = get_current_user()
    data = request.json
    msg = ChatMessage(
        group_id=0, user_id=user.id, user_name=user.full_name,
        text=data.get('text', ''), time=datetime.now(timezone.utc).strftime('%H:%M'),
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
    status = 'present' if inside else 'absent'

    if user.group_id:
        record = Attendance.query.filter_by(group_id=user.group_id, date=today).first()
        if not record:
            record = Attendance(group_id=user.group_id, date=today, records='{}', reasons='{}')
            db.session.add(record)
        records = json.loads(record.records or '{}')
        old_status = records.get(str(user.id))
        records[str(user.id)] = status
        record.records = json.dumps(records)
        db.session.commit()

        if status == 'absent' and old_status != 'absent':
            notify_student(user.id,
                f"Siz {today} kuni kolledjga kelmadingiz! Masofa: {int(distance)}m", 'warning')

    return jsonify({
        "success": True,
        "status": status,
        "distance": int(distance),
        "radius": int(radius),
        "inside": inside,
        "message": f"Masofa: {int(distance)}m. {'Kolledjdasiz!' if inside else 'Siz kolledjdan tashqaridasiz!'}"
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
    data = request.json
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    grade = Grade(
        student_id=data['studentId'],
        course_id=data['courseId'],
        teacher_id=user.id,
        value=data['value'],
        comment=data.get('comment', ''),
        date=data.get('date', today)
    )
    db.session.add(grade)
    db.session.commit()

    notify_student(data['studentId'],
        f"Sizga yangi baho qo'yildi: {data['value']} ({today})", 'info')

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
