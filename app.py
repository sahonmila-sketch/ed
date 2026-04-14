from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Enable CORS for all API routes

# Data persistence
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'db_backend.json')

def get_db():
    if not os.path.exists(DB_FILE):
        return {"posts": [], "courses": [], "landing": {}}
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            db = json.load(f)
            if 'landing' not in db:
                db['landing'] = {
                    "director_photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Director",
                    "director_name": "Erko",
                    "director_title": "Texnikum Rahbari",
                    "telegram_link": "https://t.me/your_telegram",
                    "instagram_link": "https://instagram.com/",
                    "youtube_link": "https://youtube.com/",
                    "indicators": [
                        { "id": 1, "label": "Professorlar", "count": "25+", "icon": "award" },
                        { "id": 2, "label": "Talabalar", "count": "1,200+", "icon": "users" },
                        { "id": 3, "label": "Muvaffaqiyatlar", "count": "50+", "icon": "star" }
                    ],
                    "best_teachers": [
                        { "id": 1, "name": "Samat Jienbaev", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Samat", "title": "Senior Mentor", "date": "06.04.2026" },
                        { "id": 2, "name": "Gulnaz Turdimuratova", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnaz", "title": "Metodist", "date": "05.04.2026" },
                        { "id": 3, "name": "Azamat Berdimuratov", "photo": "https://api.dicebear.com/7.x/avataaars/svg?seed=Azamat", "title": "IT Specialist", "date": "06.04.2026" }
                    ]
                }
                save_db(db)
            return db
    except:
        return {"posts": [], "courses": [], "landing": {}}

def save_db(db):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=4, ensure_ascii=False)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/posts', methods=['GET'])
def get_posts():
    db = get_db()
    return jsonify(db.get('posts', []))

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.json
    db = get_db()
    new_post = {
        "id": data.get('id', int(os.urandom(4).hex(), 16)),
        "authorId": data.get('authorId'),
        "author": data.get('author'),
        "title": data.get('title'),
        "content": data.get('content'),
        "image": data.get('image'),
        "status": data.get('status', 'pending'),
        "approved": data.get('approved', False),
        "likes": 0,
        "liked_users": [],
        "date": data.get('date'),
        "createdAt": data.get('createdAt', data.get('date'))
    }
    db['posts'].append(new_post)
    save_db(db)
    return jsonify(new_post), 201

@app.route('/api/posts/<int:post_id>', methods=['PATCH'])
def update_post(post_id):
    data = request.json
    db = get_db()
    post = next((p for p in db['posts'] if p.get('id') == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    if 'approved' in data:
        post['approved'] = data['approved']
        post['status'] = 'approved' if data['approved'] else 'pending'
    save_db(db)
    return jsonify(post)

@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    db = get_db()
    db['posts'] = [p for p in db['posts'] if p.get('id') != post_id]
    save_db(db)
    return jsonify({"success": True})

@app.route('/api/courses', methods=['GET'])
def get_courses():
    db = get_db()
    return jsonify(db.get('courses', []))

@app.route('/api/courses', methods=['POST'])
def create_course():
    data = request.json
    db = get_db()
    new_course = {
        "id": data.get('id', int(os.urandom(4).hex(), 16)),
        "title": data.get('title'),
        "description": data.get('description'),
        "teacherId": data.get('teacherId'),
        "lessons": data.get('lessons', []),
        "category": data.get('category', 'Dasturlash'),
        "status": data.get('status', 'Ochiq')
    }
    db['courses'].append(new_course)
    save_db(db)
    return jsonify(new_course), 201

@app.route('/api/courses/<int:course_id>', methods=['PATCH'])
def update_course(course_id):
    data = request.json
    db = get_db()
    course = next((c for c in db['courses'] if c.get('id') == course_id), None)
    if not course:
        return jsonify({"error": "Course not found"}), 404
    if 'lessons' in data:
        course['lessons'] = data['lessons']
    if 'title' in data:
        course['title'] = data['title']
    if 'description' in data:
        course['description'] = data['description']
    save_db(db)
    return jsonify(course)

@app.route('/api/landing', methods=['GET'])
def get_landing():
    db = get_db()
    return jsonify(db.get('landing', {}))

@app.route('/api/landing', methods=['PATCH'])
def update_landing():
    data = request.json
    db = get_db()
    db['landing'] = data
    save_db(db)
    return jsonify(db['landing'])

@app.route('/api/db', methods=['GET'])
def get_full_db():
    db = get_db()
    return jsonify(db)

@app.route('/api/sync_db', methods=['POST'])
def sync_full_db():
    new_db = request.json
    # Basic merge or overwrite strategy. For this usecase, we just overwrite.
    db = get_db()
    # To prevent overwriting with an empty db, check some keys
    if new_db and 'users' in new_db:
        save_db(new_db)
    return jsonify({"success": True})


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
