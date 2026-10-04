"""
Dev-сид для EDUbeta: заполняет БД демо-данными, чтобы можно было проверить
каждый раздел под каждой ролью (student / ustoz / admin / tech_admin /
director / parent).

Запуск:  .\\venv\\Scripts\\python.exe seed_dev.py [--keep]
  --keep  не удалять существующие данные, а только добавить недостающее
"""
import json
import os
import shutil
import sys
from datetime import datetime, timedelta, timezone

from app import app, db
from models import (
    User, Group, Course, Lesson, LessonSession, Post, Ticket,
    Attendance, ChatMessage, Notification, Question, Book,
    Achievement, Setting, LandingData, Grade, ShopItem,
)

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, 'lms.db')

PASSWORD = '123456'
now = datetime.now(timezone.utc)
today = now.strftime('%Y-%m-%d')
d = lambda n: (now - timedelta(days=n)).strftime('%Y-%m-%d')


def dm(n):
    return f'{n:02d}.{now.month:02d}.{now.year}'


def wipe():
    # Achievement — справочник, его не трогаем
    for model in (Grade, LessonSession, Lesson, Course, ChatMessage, Attendance,
                  Notification, Ticket, Post, Question, Book, Group, User):
        db.session.query(model).delete()
    db.session.commit()


# ─── Аккаунты ────────────────────────────────────────────────────────
# (id, name, email, role, xp, group_id, achievements, parent_of, duel_wins)
USERS = [
    (1,  'Ali Valiyev',        'talaba@lms.uz',   'student',    1850, 1, ['first_lesson', 'active_5'],            None, 7),
    (2,  'Ustoz Anvar',       'ustoz@lms.uz',    'ustoz',         0, 1, [],                                   None, 0),
    (3,  'Asosiy Admin',      'admin@lms.uz',    'admin',         0, None, ['legend'],                         None, 0),
    (4,  'Tech Admin',        'tech@lms.uz',     'tech_admin',    0, None, [],                                 None, 0),
    (5,  'Director Xon',      'director@lms.uz', 'director',      0, None, [],                                 None, 0),
    (6,  'Valiyeva Ona',      'parent@lms.uz',   'parent',        0, None, [],                                   1,     0),
    (7,  'Ustoz Gulnora',     'ustoz2@lms.uz',   'ustoz',         0, 2, [],                                   None, 0),
    (8,  'Ustoz Bekzod',      'ustoz3@lms.uz',   'ustoz',         0, 3, [],                                   None, 0),
    (9,  'Malika Yusupova',   'malika@lms.uz',   'student',    1520, 1, ['first_lesson'],                     None, 5),
    (10, 'Jasur Rahimov',     'jasur@lms.uz',    'student',    1310, 1, ['first_lesson', 'attendance_7'],     None, 4),
    (11, 'Nodira Sattorova',  'nodira@lms.uz',   'student',    1105, 1, [],                                   None, 3),
    (12, 'Sardor Toshmatov',  'sardor@lms.uz',   'student',     860, 1, [],                                   None, 2),
    (13, 'Dilnoza Qodirova',  'dilnoza@lms.uz',  'student',     640, 2, ['first_lesson'],                     None, 1),
    (14, 'Ozod Niyozov',      'ozod@lms.uz',     'student',     430, 2, [],                                   None, 0),
    (15, 'Kamola Saidova',    'kamola@lms.uz',   'student',     280, 2, [],                                   None, 0),
    (16, 'Bekzod Tursunov',   'bekzod2@lms.uz',  'student',     120, 3, [],                                   None, 0),
    (17, 'Nurbek Aliyev',     'nurbek@lms.uz',   'student',      60, 3, [],                                   None, 0),
    (18, 'Dilbar Xolmatova',  'ona2@lms.uz',     'parent',        0, None, [],                                 9,     0),
]

GROUPS = [
    (1, 'D 02 25',  2, [1, 9, 10, 11, 12]),
    (2, 'IT 01 26', 7, [13, 14, 15]),
    (3, 'C 03 25',  8, [16, 17]),
]

# (id, title, description, teacher_id, category, status)
COURSES = [
    (1, 'JavaScript Asoslari',
     "JavaScript dasturlash tili bo‘yicha noldan professional darajagacha.",
     2, 'Dasturlash', 'Ochiq'),
    (2, 'Python Kirish',
     'Python bilan dasturlashni o‘rganish: sintaksis, funksiyalar, kutubxonalar.',
     7, 'Dasturlash', 'Ochiq'),
    (3, 'Ingliz tili — IELTS',
     'IELTS ga tayyorgarlik: grammar, vocabulary, writing va speaking.',
     8, 'Til', 'Ochiq'),
    (4, 'Matematika: Ehtimollik',
     'Ehtimollik nazariyasi, kombinatorika va statistika elementlari.',
     2, 'Fan', 'Yopiq'),
]

# (course_id, [(title, topic, content, minutes)])
LESSONS = {
    1: [
        ('Kirish va sozlash', 'JavaScript Kirish',
         'Dasturlash nima? JavaScript qayerda ishlatiladi? Brauzer va Node.js.', 20),
        ('O‘zgaruvchilar', 'let, const, var',
         'O‘zgaruvchi yaratish, `let` va `const` farqi, scope tushunchasi.', 25),
        ('Shart operatorlari', 'if / else / ternary',
         'Shartlarni tekshirish, if/else zanjiri va uchlik (ternary) operator.', 30),
        ('Funksiyalar', 'function / arrow',
         'Funksiya yaratish, arrow function, qaytarish qiymati.', 35),
        ('Massivlar', 'Array metodlari',
         'map, filter, reduce — eng ko‘p ishlatiladigan massiv metodlari.', 40),
    ],
    2: [
        ('Python o‘rnatish', 'Sozlash',
         'Python o‘rnatish va birinchi dasturni yozish.', 15),
        ('Ma’lumot turlari', 'int, str, float, bool',
         'Python’dagi asosiy tiplar va ularning o‘zgarishi.', 25),
        ('Shart va sikllar', 'if / for / while',
         'Shart operatorlari va takrorlanuvchi bloklar.', 30),
    ],
    3: [
        ('Present Simple', 'Grammar',
         'Hozirgi oddiy zamon grammatikasi.', 25),
        ('IELTS Writing 1-task', 'Writing',
         'Diagram yozish qoidalari va however bandida.', 40),
    ],
    4: [
        ('Kombinatorika', ' permutations',
         'Joylashuv va tanlov formulalari.', 45),
    ],
}

# (student_id, course_id, teacher_id, value, comment, days_ago)
GRADES = [
    (1, 1, 2, 5, 'Ajoyib natija! JavaScript vaqtini chuqur o‘zlashtirgan.', 0),
    (1, 2, 7, 4, 'Yaxshi, biroz ko‘p xato bor.', 2),
    (1, 1, 2, 5, 'Dom sahifasi ajoyib.', 6),
    (9, 1, 2, 4, 'Yaxshi ishladingiz.', 0),
    (9, 1, 2, 5, 'Ajoyib!', 5),
    (10, 1, 2, 3, 'O‘rtacha, mashq qiling.', 0),
    (11, 1, 2, 4, 'Yaxshi.', 1),
    (12, 1, 2, 2, 'Mavzuni qayta ko‘rib chiqing.', 0),
    (13, 2, 7, 5, 'Zo‘r!', 1),
    (14, 2, 7, 3, 'Bazaviy bilim yetishmaydi.', 0),
    (15, 2, 7, 4, 'Yaxshi.', 3),
    (16, 3, 8, 4, 'Good job!', 2),
    (17, 3, 8, 3, 'Grammar’ni mustahkamlang.', 0),
]

# (group_id, days_ago, {student_id: 'present'|'absent'|'late'})
ATTENDANCE = [
    (1, 0, {1: 'present', 9: 'present', 10: 'present', 11: 'present', 12: 'absent'}),
    (1, 1, {1: 'present', 9: 'present', 10: 'present', 11: 'absent', 12: 'present'}),
    (1, 2, {1: 'present', 9: 'present', 10: 'present', 11: 'present', 12: 'present'}),
    (1, 3, {1: 'absent', 9: 'present', 10: 'present', 11: 'present', 12: 'absent'}),
    (1, 4, {1: 'present', 9: 'present', 10: 'present', 11: 'present', 12: 'present'}),
    (2, 0, {13: 'present', 14: 'present', 15: 'absent'}),
    (2, 1, {13: 'present', 14: 'present', 15: 'present'}),
    (3, 0, {16: 'present', 17: 'present'}),
]

REASONS = {
    (1, 0): {12: 'Kasallik sababli'},
    (1, 3): {1: 'Oilaviy sabab', 12: 'Yo‘q oldi'},
    (2, 0): {15: 'Sababsiz'},
}

CHAT = [
    (1, 1, 'Ali Valiyev',      ' Salom ustoz, bugungi darsga tayyarmanmi?'),
    (1, 2, 'Ustoz Anvar',     ' Ha, 14:00 da onlayn bo‘lamiz. Videoni oldindan ko‘rib chiqing.'),
    (1, 1, 'Jasur Rahimov',   ' Video linki ishlamayapti, yordam berolasizmi?'),
    (1, 2, 'Ustoz Anvar',     ' Men yangiladim, endi to‘g‘ri ishlaydi.'),
    (1, 1, 'Malika Yusupova', ' Rahmat!'),
    (1, 2, 'Ustoz Anvar',     ' Bugun 5-savolga alohida e’tibor beramiz.'),
    (0, 3, 'Asosiy Admin',    ' Yangi guruh yaratildi: IT 01 26.'),
    (0, 2, 'Ustoz Gulnora',   ' Rahmat, dasturlarni qo‘shdim.'),
    (2, 13, 'Dilnoza Qodirova', ' Uyda ishni topshirdim.'),
]

POSTS = [
    (1, 2, 'Xush kelibsiz', 'Platformaga xush kelibsiz! Birinchi darsni ko‘rib chiqing va savollaringizni yozing.',
     None, 'approved', True, 24, dm(5), 'Ustoz Anvar'),
    (2, 1, 'Dasturlashda muvaffaqiyat sirlari', 'Har kuni 30 daqiqa mashq qilish — natijani o‘zgartiradi. O‘z ismingizni belgilang va rejaga amal qiling.',
     None, 'approved', True, 41, dm(3), 'Ali Valiyev'),
    (3, 9, 'Yangi kitoblar ro‘yxati', 'Clean Code va JavaScript: The Good Parts — ikkalasi ham o‘quvchilar uchun foydali.',
     None, 'pending', False, 3, dm(1), 'Malika Yusupova'),
    (4, 7, 'Python kursida yangi darslar', 'Bugun Ehtimollik darsini qo‘shdim. Hamma tayyor bo‘lsin.',
     None, 'approved', True, 12, dm(2), 'Ustoz Gulnora'),
]

TICKETS = [
    (101, 1, 'Ali Valiyev', 'Tizimga kirishda xato bor, parolni unutib qo‘ydim.',
     'Ochiq', [('Asosiy Admin', 'Parolni tiklash uchun “Parolni unutdingizmi” linkidan foydalaning.', dm(2))]),
    (102, 12, 'Sardor Toshmatov', 'Video darslar sekin yuklanmoqda.',
     'Yopiq', [('Asosiy Admin', 'Tarmoqni tekshirib bo‘ldik, muammo tuzatildi.', dm(1))]),
    (103, 9, 'Malika Yusupova', 'Reytingda o‘zimni ko‘rmayapman.',
     'Jarayonda', [('Asosiy Admin', 'Tekshirilyapti, sizga javob beramiz.', dm(0))]),
    (104, 13, 'Dilnoza Qodirova', 'Darsga qo‘shimcha materiallar qo‘shilsinmi?',
     'Ochiq', []),
    (105, 6, 'Valiyeva Ona', 'Farzandimning o‘zlashtirish darajasi qanday?',
     'Jarayonda', [('Asosiy Admin', 'Bu haqda batafsil hisobot tayyorlab beramiz.', dm(0))]),
]

NOTIFICATIONS = [
    (1, 'Yangi dars qo‘shildi: "Funksiyalar"', 'info'),
    (1, 'Reytingda 3-o‘ringa ko‘tarildingiz!', 'success'),
    (1, 'Davomat: bugun keldingiz', 'info'),
    (2, '3 ta yangi ticket keldi', 'warning'),
    (2, 'D 02 25 guruhida 5 talaba bor', 'info'),
    (3, 'Platformada 18 ta foydalanuvchi ro‘yxatda', 'info'),
    (3, 'Yangi kurs yaratildi: "Python Kirish"', 'success'),
    (4, 'Server ishlash holati: normal', 'info'),
    (4, 'Yangi versiya 30 o‘rnatildi', 'success'),
    (5, 'O‘quvchi reytingi e’lon qilindi', 'info'),
    (5, '4 ta kurs faoliyatda', 'info'),
    (6, 'Bolangizning bugungi bahosi 5 ball', 'success'),
    (18, 'Farzandingiz 3 ta darsni yakunladi', 'success'),
]

QUESTIONS = [
    (1, '2 + 2 * 2 = ?', '6', '8', '4', '10', 'A', 'duel', 'medium'),
    (2, "'1' + 1 JavaScriptda natijasi qanday?", '2', '11', 'NaN', 'Error', 'B', 'duel', 'easy'),
    (3, 'typeof null nima qaytaradi?', 'null', 'object', 'undefined', 'boolean', 'B', 'mini_game', 'medium'),
    (4, '0.1 + 0.2 === 0.3 ?', 'true', 'false', 'undefined', 'NaN', 'B', 'mini_game', 'hard'),
    (5, "HTML da 'href' atributi qaysi tegda ishlatiladi?", '<img>', '<a>', '<div>', '<span>', 'B', 'mini_game', 'easy'),
    (6, 'Array.prototype.map qanday ishlaydi?', 'Massivni saralaydi', 'Har bir elementga funksiya qo‘llaydi',
     'Massivni bo‘ladi', 'Elementni o‘chiradi', 'B', 'duel', 'medium'),
    (7, 'Python’da f-string qanday yoziladi?', 'f"qiymat"', '"qiymat"', 'format(qiymat)', '%qiymat', 'A', 'duel', 'easy'),
    (8, 'CSS da flex-wrap: none nimaga teng?', 'Qatorga sig‘maydi', 'Qatorlarga bo‘linadi',
     'Tekshirilmaydi', 'Faqat vertikal', 'B', 'mini_game', 'medium'),
]

BOOKS = [
    (1, 'Clean Code',
     'Robert C. Martin tomonidan yozilgan dasturlash odobi haqida kitob.',
     'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg', '#'),
    (2, 'JavaScript: The Good Parts',
     "JavaScriptning eng yaxshi qismlari haqida qo‘llanma.",
     'https://images-na.ssl-images-amazon.com/images/I/5131OWtQRaL._SX381_BO1,204,203,200_.jpg', '#'),
    (3, 'Eloquent JavaScript',
     'Bepul va ochiq manba — JavaScript’ni o‘rganishning eng yaxshi yo‘li.',
     'https://eloquentjavascript.net/cover.jpg', '#'),
    (4, 'Automate the Boring Stuff',
     'Python bilan vazifalarni avtomatlashtirish bo‘yicha amaliy qo‘llanma.',
     'https://covers.openlibrary.org/b/isbn/9781593279929-L.jpg', '#'),
]

SHOP_ITEMS = [
    # (id, nomi, tavsif, emoji, narx(XP), qoldi)
    (1, 'O‘quv.uz futbolka', 'Yukxoroga yozilgan rasmiy futbolka. O‘lcham: M, L, XL.',
     '👕', 850, 12),
    (2, 'O‘quv.uz kalka', 'Yumshoq trikotaj kalka — qish uchun issiq.', '🧣', 600, 20),
    (3, 'Termos idish', '500 ml, issiqni uzoq turib saqlaydi.', '🍵', 1200, 8),
    (4, 'O‘quv.uz daftar', 'Qatorli va katta varaqli, 96 varaq.', '📓', 350, 40),
    (5, 'Qalam va ruchka to‘plami', '5 ta rangli ruchka + qalam.', '✏️', 200, 50),
    (6, 'Stikerlar to‘plami', 'Yukxoraga mos brend stikerlari (10 dona).', '🌟', 250, 0),
    (7, 'Kutubxona kitobi', 'Tanlangan kitob PDF formatida.', '📚', 500, 15),
    (8, '1 oy XP boosted', 'Bir oy davomida kunlik XP ikki barobar.', '⚡', 3000, 5),
]

ACHIEVEMENTS = [
    ('first_lesson', 'Boshlovchi', '🌱', 'common', 'Birinchi darsni yakunladingiz'),
    ('active_5', 'Faol talaba', '🔥', 'rare', '5 ta darsni muvaffaqiyatli yakunladingiz'),
    ('attendance_7', 'Intizomli', '📅', 'epic', '7 kunlik mukammal davomat'),
    ('top_points', 'Top student', '👑', 'epic', 'Yuqori natija va ko‘p ballar'),
    ('legend', 'Afsona', '💎', 'legendary', 'Platformadagi eng yuqori daraja'),
]

SETTINGS = {
    # Kalit nomi API bilan bir xil bo'lishi shart (`Setting.get('platformName')`)
    'platformName': "O'quv.uz",
    'allowRegistration': 'true',
    'college_lat': '41.3111',
    'college_lng': '69.2797',
    'attendance_radius': '250',
    'telegram_bot_token': '',
}

LANDING = {
    "director_name": "Erko",
    "director_photo": "https://api.dicebear.com/7.x/initials/svg?seed=E",
    "director_title": "Texnikum Rahbari",
    "telegram_link": "https://t.me/ouruzbekistan",
    "instagram_link": "https://instagram.com/",
    "youtube_link": "https://youtube.com/",
    "indicators": [
        {"id": 1, "label": "Professorlar", "count": "25+", "icon": "award"},
        {"id": 2, "label": "Talabalar", "count": "1,200+", "icon": "users"},
        {"id": 3, "label": "Muvaffaqiyatlar", "count": "50+", "icon": "star"},
    ],
    "best_teachers": [
        {"id": 1, "name": "Samat Jienbaev", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Samat", "title": "Senior Mentor", "date": "06.04.2026"},
        {"id": 2, "name": "Gulnaz Turdimuratova", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnaz", "title": "Metodist", "date": "05.04.2026"},
        {"id": 3, "name": "Azamat Berdimuratov", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Azamat", "title": "IT Specialist", "date": "06.04.2026"},
    ],
}


def main():
    if os.path.exists(DB) and '--keep' not in sys.argv:
        bak = os.path.join(BASE, 'lms-backup-seed.db')
        shutil.copy2(DB, bak)
        print(f'  backup -> {bak}')

    with app.app_context():
        wipe()

        # --- Аккаунты ---
        # `completed` — o'sha kursga tegishli dars ID'lari bo'lishi kerak,
        # aks holda ota-ona panelida "0/3, lekin 33%" kabi chalkashlik chiqadi.
        progress = json.dumps({"1": {"completed": [1, 2], "percent": 40},
                               "2": {"completed": [6], "percent": 33}})
        for uid, name, email, role, xp, gid, achs, parent_of, duel in USERS:
            u = User(id=uid, full_name=name, email=email, role=role, xp=xp, group_id=gid,
                     achievements=json.dumps(achs), duel_wins=duel,
                     progress=progress if role == 'student' else '{}',
                     parent_of_id=parent_of,
                     created_at=now - timedelta(days=200 - uid * 3))
            u.set_password(PASSWORD)
            db.session.add(u)

        # --- Группы ---
        # Недельное расписание: предмет, преподаватель, аудитория.
        # Формат совпадает с тем, что редактирует openScheduleEditor в app.js.
        def week_plan(subject_prefix, teacher, room, start_h=8):
            plan = []
            subjects = ["Matematika", "Informatika", "O‘zbek tili", "Ingliz tili"]
            days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma"]
            for di, day in enumerate(days):
                # 3 yoki 2 dars, ketma-ket (1 soat + 15 daqiqa dam)
                count = 3 if di % 2 == 0 else 2
                for si, subj in enumerate(subjects[:count]):
                    h = start_h + di + si * 2          # 08:00, 10:00, 12:00 ...
                    plan.append({
                        "day": day,
                        "time": "%02d:00 — %02d:45" % (h % 24, h % 24),
                        "subject": f"{subj} ({subject_prefix})" if subject_prefix else subj,
                        "teacher": teacher,
                        "room": room,
                    })
            return plan

        schedules = {
            1: week_plan("101", "Alisher Karimov", "A-201", start_h=8),
            2: week_plan("102", "Nodira Saidova", "B-114", start_h=9),
            3: week_plan("103", "Bekzod Yusupov", "C-305", start_h=10),
        }
        for gid, name, ustoz, students in GROUPS:
            db.session.add(Group(id=gid, name=name, ustoz_id=ustoz,
                                 student_ids=json.dumps(students),
                                 schedule=json.dumps(schedules[gid])))

        # --- Курсы и уроки ---
        lesson_id = 1
        for cid, title, desc, teacher, cat, status in COURSES:
            db.session.add(Course(id=cid, title=title, description=desc, teacher_id=teacher,
                                  category=cat, status=status, created_at=now - timedelta(days=30)))
            for order, (lt, topic, content, minutes) in enumerate(LESSONS[cid], start=1):
                db.session.add(Lesson(id=lesson_id, course_id=cid, title=lt, topic=topic,
                                      content=content, order=order, duration_minutes=minutes))
                lesson_id += 1

        # --- Прогресс по урокам (lesson_sessions) ---
        for uid, done in ((1, [1, 2]), (9, [1, 2, 3]), (10, [1]), (11, [1, 2]),
                          (12, [1]), (13, [6]), (14, [6]), (16, [9])):
            for lid in done:
                db.session.add(LessonSession(user_id=uid, lesson_id=lid, completed=True,
                                             xp_awarded=True, start_time=now - timedelta(days=3)))

        # --- Баҳо ---
        for i, (sid, cid, tid, val, comment, days) in enumerate(GRADES, start=1):
            db.session.add(Grade(id=i, student_id=sid, course_id=cid, teacher_id=tid,
                                 value=val, comment=comment, date=d(days),
                                 created_at=now - timedelta(days=days)))

        # --- Davomat ---
        for i, (gid, days, records) in enumerate(ATTENDANCE, start=1):
            db.session.add(Attendance(id=i, group_id=gid, date=d(days),
                                      records=json.dumps(records),
                                      reasons=json.dumps(REASONS.get((gid, days), {}))))

        # --- Chat ---
        for i, (gid, uid, name, text) in enumerate(CHAT, start=1):
            db.session.add(ChatMessage(id=i, group_id=gid, user_id=uid, user_name=name,
                                       text=text, time=dm(i % 7),
                                       type='text'))

        # --- Postlar ---
        for pid, uid, title, content, image, status, approved, likes, date, author in POSTS:
            db.session.add(Post(id=pid, user_id=uid, title=title, content=content, image=image,
                                status=status, approved=approved, likes=likes,
                                liked_users=json.dumps([]), comments=json.dumps([]),
                                author_name=author, date=date, created_at=now))

        # --- Ticketlar ---
        for tid, uid, name, msg, status, replies in TICKETS:
            db.session.add(Ticket(id=tid, user_id=uid, user_name=name, message=msg,
                                  status=status, created_at=now,
                                  replies=json.dumps([
                                      {'user': u, 'text': t, 'date': dt} for u, t, dt in replies])))

        # --- Bildirishnomalar ---
        for i, (uid, msg, ntype) in enumerate(NOTIFICATIONS, start=1):
            db.session.add(Notification(id=i, user_id=uid, msg=msg, date=dm(i % 5),
                                        type=ntype, seen=(i % 3 == 0)))

        # --- Savollar ---
        for q in QUESTIONS:
            db.session.add(Question(id=q[0], question_text=q[1], option_a=q[2], option_b=q[3],
                                    option_c=q[4], option_d=q[5], correct_answer=q[6],
                                    question_type=q[7], difficulty=q[8]))

        # --- Kitoblar ---
        for b in BOOKS:
            db.session.add(Book(id=b[0], title=b[1], description=b[2], image=b[3], link=b[4]))

        # --- Magazin tovarlari ---
        for s in SHOP_ITEMS:
            row = db.session.get(ShopItem, s[0])
            if row:
                row.title, row.description, row.emoji, row.price = s[1], s[2], s[3], s[4]
                row.stock, row.active = s[5], True
            else:
                db.session.add(ShopItem(id=s[0], title=s[1], description=s[2],
                                        emoji=s[3], price=s[4], stock=s[5], active=True))

        # --- Yutuqlar (обновляем существующие) ---
        for a in ACHIEVEMENTS:
            row = db.session.get(Achievement, a[0])
            if row:
                row.title, row.icon, row.rarity, row.desc = a[1], a[2], a[3], a[4]
            else:
                db.session.add(Achievement(id=a[0], title=a[1], icon=a[2], rarity=a[3], desc=a[4]))

        for k, v in SETTINGS.items():
            Setting.set(k, v)

        LandingData.set_data(LANDING)

        db.session.commit()

        print('\n  Seeded:')
        for m, n in ((User, 'users'), (Group, 'groups'), (Course, 'courses'),
                     (Lesson, 'lessons'), (Grade, 'grades'), (Attendance, 'attendance'),
                     (ChatMessage, 'chat'), (Post, 'posts'), (Ticket, 'tickets'),
                     (Question, 'questions'), (Book, 'books'), (ShopItem, 'shop')):
            print(f'    {m.query.count():>4}  {n}')
        print('\n  Login: parol =', PASSWORD)
        for e, r in (('talaba@lms.uz', 'student'), ('ustoz@lms.uz', 'ustoz'),
                     ('admin@lms.uz', 'admin'), ('tech@lms.uz', 'tech_admin'),
                     ('director@lms.uz', 'director'), ('parent@lms.uz', 'parent')):
            print(f'    {e:<20} {r}')


if __name__ == '__main__':
    main()
