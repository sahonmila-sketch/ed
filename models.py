from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default='student')
    xp = db.Column(db.Integer, default=0)
    avatar = db.Column(db.Text, nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=True)
    achievements = db.Column(db.Text, default='[]')
    progress = db.Column(db.Text, default='{}')
    duel_wins = db.Column(db.Integer, default=0)
    daily_category_points = db.Column(db.Text, default='{}')
    last_point_date = db.Column(db.String(20), nullable=True)
    parent_of_id = db.Column(db.Integer, nullable=True)
    telegram_chat_id = db.Column(db.String(50), nullable=True)
    # Ro'yxatdan o'tgan foydalanuvchi avval "pending" (kutilmoqda) bo'ladi —
    # admin tasdiqlagach kirish huquqi beriladi.
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'ism': self.full_name,
            'email': self.email,
            'role': self.role,
            'points': self.xp,
            'avatar': self.avatar,
            'groupId': self.group_id,
            'achievements': json.loads(self.achievements or '[]'),
            'progress': json.loads(self.progress or '{}'),
            'duelWins': self.duel_wins,
            'dailyCategoryPoints': json.loads(self.daily_category_points or '{}'),
            'lastPointDate': self.last_point_date,
            'parentId': self.parent_of_id,
            'telegramChatId': self.telegram_chat_id,
            'status': self.status or 'active'
        }

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    category = db.Column(db.String(100), default='Dasturlash')
    status = db.Column(db.String(20), default='Ochiq')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    lessons = db.relationship('Lesson', backref='course', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'authorId': self.teacher_id,
            'teacherId': self.teacher_id,
            'category': self.category,
            'status': self.status,
            'lessons': [l.to_dict() for l in self.lessons.all()]
        }

class Lesson(db.Model):
    __tablename__ = 'lessons'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(200), default='')
    content = db.Column(db.Text, default='')
    video_url = db.Column(db.String(500), nullable=True)
    order = db.Column(db.Integer, default=0)
    duration_minutes = db.Column(db.Integer, default=20)

    def to_dict(self):
        return {
            'id': self.id,
            'courseId': self.course_id,
            'title': self.title,
            'topic': self.topic,
            'content': self.content,
            'videoUrl': self.video_url,
            'order': self.order
        }

class LessonSession(db.Model):
    __tablename__ = 'lesson_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    start_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed = db.Column(db.Boolean, default=False)
    xp_awarded = db.Column(db.Boolean, default=False)

class Post(db.Model):
    __tablename__ = 'posts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    title = db.Column(db.String(300), default='')
    content = db.Column(db.Text, default='')
    image = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    approved = db.Column(db.Boolean, default=False)
    likes = db.Column(db.Integer, default=0)
    liked_users = db.Column(db.Text, default='[]')
    comments = db.Column(db.Text, default='[]')
    author_name = db.Column(db.String(120), default='')
    date = db.Column(db.String(50), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'authorId': self.user_id,
            'author': self.author_name,
            'title': self.title,
            'content': self.content,
            'image': self.image,
            'status': self.status,
            'approved': self.approved,
            'likes': self.likes,
            'liked_users': json.loads(self.liked_users or '[]'),
            'comments': json.loads(self.comments or '[]'),
            'date': self.date or '',
            'createdAt': self.created_at.isoformat() if self.created_at else ''
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user_name = db.Column(db.String(120))
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='Ochiq')
    replies = db.Column(db.Text, default='[]')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'message': self.message,
            'status': self.status,
            'replies': json.loads(self.replies or '[]')
        }

class Group(db.Model):
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ustoz_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    student_ids = db.Column(db.Text, default='[]')
    schedule = db.Column(db.Text, default='[]')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ustozId': self.ustoz_id,
            'studentIds': json.loads(self.student_ids or '[]'),
            'schedule': json.loads(self.schedule or '[]')
        }

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'))
    date = db.Column(db.String(20))
    records = db.Column(db.Text, default='{}')
    reasons = db.Column(db.Text, default='{}')

    def to_dict(self):
        return {
            'id': self.id,
            'groupId': self.group_id,
            'date': self.date,
            'records': json.loads(self.records or '{}'),
            'reasons': json.loads(self.reasons or '{}')
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer)
    user_id = db.Column(db.Integer)
    user_name = db.Column(db.String(120))
    text = db.Column(db.Text)
    time = db.Column(db.String(20))
    type = db.Column(db.String(20), default='text')

    def to_dict(self):
        return {
            'id': self.id,
            'groupId': self.group_id,
            'userId': self.user_id,
            'userName': self.user_name,
            'text': self.text,
            'time': self.time,
            'type': self.type
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    msg = db.Column(db.Text)
    date = db.Column(db.String(50))
    type = db.Column(db.String(20), default='info')
    seen = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'msg': self.msg,
            'date': self.date,
            'type': self.type,
            'seen': self.seen
        }

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text)
    option_a = db.Column(db.String(200))
    option_b = db.Column(db.String(200))
    option_c = db.Column(db.String(200))
    option_d = db.Column(db.String(200))
    correct_answer = db.Column(db.String(1))
    question_type = db.Column(db.String(20), default='duel')
    difficulty = db.Column(db.String(20), default='medium')

    def to_dict(self):
        return {
            'id': self.id,
            'questionText': self.question_text,
            'optionA': self.option_a,
            'optionB': self.option_b,
            'optionC': self.option_c,
            'optionD': self.option_d,
            'correctAnswer': self.correct_answer,
            'type': self.question_type,
            'difficulty': self.difficulty
        }

class Book(db.Model):
    __tablename__ = 'books'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image = db.Column(db.String(500))
    link = db.Column(db.String(500))

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'description': self.description, 'image': self.image, 'link': self.link}

class ShopItem(db.Model):
    __tablename__ = 'shop_items'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    image = db.Column(db.String(500), default='')
    emoji = db.Column(db.String(16), default='')     # rasm yo'q ko'rsatish uchun
    price = db.Column(db.Integer, default=100)      # necha XP turadi
    stock = db.Column(db.Integer, default=0)       # 0 = cheksiz
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'image': self.image,
            'emoji': self.emoji,
            'price': self.price,
            'stock': self.stock,
            'active': bool(self.active),
        }


class Purchase(db.Model):
    __tablename__ = 'purchases'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('shop_items.id'), nullable=True)
    title = db.Column(db.String(200), default='')
    price = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'itemId': self.item_id,
            'title': self.title,
            'price': self.price,
            'createdAt': self.created_at.isoformat() if self.created_at else '',
        }


class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(100))
    icon = db.Column(db.String(20))
    rarity = db.Column(db.String(20))
    desc = db.Column(db.Text)

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'icon': self.icon, 'rarity': self.rarity, 'desc': self.desc}

class Setting(db.Model):
    __tablename__ = 'settings'
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.Text)

    @classmethod
    def get(cls, key, default=None):
        s = cls.query.get(key)
        return s.value if s else default

    @classmethod
    def set(cls, key, value):
        s = cls.query.get(key)
        if s:
            s.value = value
        else:
            s = cls(key=key, value=value)
            db.session.add(s)

class LandingData(db.Model):
    __tablename__ = 'landing_data'
    id = db.Column(db.Integer, primary_key=True, default=1)
    data = db.Column(db.Text, default='{}')

    @classmethod
    def get_data(cls):
        ld = cls.query.get(1)
        if not ld:
            ld = cls(id=1, data='{}')
            db.session.add(ld)
            db.session.commit()
        return json.loads(ld.data)

    @classmethod
    def set_data(cls, data):
        ld = cls.query.get(1)
        if not ld:
            ld = cls(id=1, data=json.dumps(data))
            db.session.add(ld)
        else:
            ld.data = json.dumps(data, ensure_ascii=False)

class Grade(db.Model):
    __tablename__ = 'grades'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    value = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, default='')
    date = db.Column(db.String(20), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'studentId': self.student_id,
            'courseId': self.course_id,
            'teacherId': self.teacher_id,
            'value': self.value,
            'comment': self.comment,
            'date': self.date or '',
            'createdAt': self.created_at.isoformat() if self.created_at else ''
        }
