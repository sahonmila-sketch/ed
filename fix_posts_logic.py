import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix svPost redundant interval and set auto-approve for certain roles
# We'll make it so Admin/Director/Ustoz posts are auto-approved
old_svPost_snippet = """    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        image: image,
        authorId: STATE.user.id,
        author: STATE.user.ism,
        date: today,
        createdAt: new Date().toISOString(),
        approved: false,
        status: 'pending',
        likes: 0,
        liked_users: []
    };"""

new_svPost_snippet = """    // Auto-approve for privileged roles
    const isAutoApprove = ['admin', 'director', 'ustoz'].includes(STATE.user.role);
    
    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        image: image,
        authorId: STATE.user.id,
        author: STATE.user.ism,
        date: today,
        createdAt: new Date().toISOString(),
        approved: isAutoApprove,
        status: isAutoApprove ? 'approved' : 'pending',
        likes: 0,
        liked_users: [],
        comments: []
    };"""

content = content.replace(old_svPost_snippet, new_svPost_snippet)

# 2. Fix the double/misplaced interval in svPost
bad_svPost_interval = """        syncBackend(); syncLandingData();
    setInterval(() => { syncBackend(); syncLandingData(); }, 30000); // Background Sync for multi-user real-time feel"""
good_svPost_interval = """        syncBackend(); syncLandingData();"""
content = content.replace(bad_svPost_interval, good_svPost_interval)

# 3. Update v_posts visibility to include Director
old_posts_filter = "const posts = (db.posts || []).filter(p => p.status === 'approved' || p.authorId === STATE.user.id || STATE.user.role === 'admin').reverse();"
new_posts_filter = "const posts = (db.posts || []).filter(p => p.status === 'approved' || p.authorId === STATE.user.id || ['admin', 'director'].includes(STATE.user.role)).reverse();"
content = content.replace(old_posts_filter, new_posts_filter)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.js fixed: Auto-approve for posts, visibility for Director, and cleaned intervals.")
