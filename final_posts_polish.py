import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update v_home teacher cards with better fallback images
old_teacher_img = 'img src="${t.photo || \'\'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"'
new_teacher_img = 'img src="${t.photo || \'https://api.dicebear.com/7.x/avataaars/svg?seed=\' + t.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"'
content = content.replace(old_teacher_img, new_teacher_img)

# 2. Make ALL posts approved by default (as per "Hamma korsin" request)
old_status_logic = """    // Auto-approve for privileged roles
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

new_status_logic = """    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        image: image,
        authorId: STATE.user.id,
        author: STATE.user.ism,
        date: today,
        createdAt: new Date().toISOString(),
        approved: true,
        status: 'approved',
        likes: 0,
        liked_users: [],
        comments: []
    };"""

content = content.replace(old_status_logic, new_status_logic)

# 3. Enhance v_posts visibility to truly SHOW TO ALL
old_posts_filter = "const posts = (db.posts || []).filter(p => p.status === 'approved' || p.authorId === STATE.user.id || ['admin', 'director'].includes(STATE.user.role)).reverse();"
new_posts_filter = "const posts = (db.posts || []).filter(p => p.status === 'approved' || p.authorId === STATE.user.id || ['admin', 'director', 'ustoz', 'student'].includes(STATE.user.role)).reverse();"
# Actually, since all are approved, we don't even need the filter... but let's keep it safe.
content = content.replace(old_posts_filter, new_posts_filter)

# 4. Enhance the "Add Post" modal design
old_post_modal = """             <h2 class="text-3xl font-black mb-8 text-slate-800 relative">Yangi Post</h2>
             <form onsubmit="svPost(event)" class="space-y-6 relative">
                 <div id="post-image-preview" class="hidden h-48 w-full rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-100 mb-6"></div>"""

new_post_modal = """             <h2 class="text-3xl font-black mb-8 text-slate-800 relative flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><i data-lucide="edit-3" class="w-6 h-6"></i></div>
                Yangi Post Yarating
             </h2>
             <form onsubmit="svPost(event)" class="space-y-6 relative">
                 <div id="post-image-preview" class="hidden h-64 w-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl mb-8 group relative">
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span class="text-white font-black text-xs uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full">Tanlangan Rasm</span>
                    </div>
                 </div>"""

content = content.replace(old_post_modal, new_post_modal)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final Posts Polish Complete: All posts auto-approved, teachers have fallback photos, and UI enhanced.")
