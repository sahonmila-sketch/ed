import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Remove all LANDING-related definitions early in the file
# Looking for let LANDING_DATA and following functions
landing_patter_early = r"let LANDING_DATA = \{[\s\S]*?async \(\) => \{[\s\S]*?\};\s*"
js = re.sub(landing_patter_early, "", js)

# 2. Fix Initialization code (DOMContentLoaded)
# Remove duplicate syncLandingData() calls
js = js.replace("syncLandingData(); syncLandingData();", "syncLandingData();")

# 3. Fix handleRoute (clean margins and redundant calls)
# We'll replace the whole function to be safe
handle_route_pattern = r"function handleRoute\(\) \{[\s\S]*?safeLucide\(\);\s*\}"
new_handle_route = """function handleRoute() {
    let hash = window.location.hash.replace('#', '') || 'home';
    if (!STATE.user && !['register', 'login', 'home'].includes(hash)) hash = 'home';
    if (STATE.user && (hash === 'login' || hash === 'register' || hash === 'home')) hash = `${STATE.user.role}-dashboard`;
    STATE.view = hash;

    const wrapper = document.getElementById('dashboard-wrapper');
    const sidebar = document.getElementById('sidebar-container');
    const main = document.getElementById('main-content');
    
    // Hide all main views first
    ['login', 'register', 'home'].forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if(el) { el.style.display = 'none'; el.style.opacity = '0'; }
    });

    if (hash === 'login' || hash === 'register' || hash === 'home') {
        const v = document.getElementById(`view-${hash}`);
        if (v) {
            v.style.display = hash === 'home' ? 'block' : 'flex';
            v.style.opacity = '1';
            v.classList.remove('hidden');
            v.classList.add('animate-slide-up');
        }
        wrapper.style.display = 'none';
        sidebar.classList.add('hidden');
        main.classList.remove('lg:ml-72');
        if (hash === 'register') renderRegisterGroups();
        if (hash === 'home') renderView('home');
    } else {
        wrapper.style.display = 'block';
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
        main.classList.add('lg:ml-72');
        renderSidebar();
        renderView(hash);
        syncBackend();
        syncLandingData();
    }
    safeLucide();
}"""
js = re.sub(handle_route_pattern, new_handle_route, js)

# 4. Fix renderView
render_view_pattern = r"function renderView\(view\) \{[\s\S]*?const m = \{[\s\S]*?a\.innerHTML = m\[view\]\(\);\s*safeLucide\(a\);\s*\}"
new_render_view = """function renderView(view) {
    if (view === 'home') {
        const lc = document.getElementById('landing-content');
        if (lc) { lc.innerHTML = v_home(); safeLucide(lc); }
        return;
    }
    const a = document.getElementById('dynamic-view-area');
    a.innerHTML = '';
    a.className = window.innerWidth < 1024 ? 'view-slide-in' : 'animate-fade';
    if (view !== 'course-detail') stopLessonTimer();
    
    const m = {
        'student-dashboard': d_student,
        'ustoz-dashboard': d_ustoz,
        'admin-dashboard': d_admin,
        'tech_admin-dashboard': d_tech_admin,
        'director-dashboard': d_director,
        'courses': v_courses,
        'course-detail': v_course_detail,
        'posts': v_posts,
        'support': v_support,
        'profile': v_profile,
        'chat': v_chat,
        'leaderboard': v_leaderboard,
        'library': v_library,
        'duel': v_duel,
        'game': v_game,
        'staff-chat': v_staff_chat
    };
    
    if (m[view]) {
        a.innerHTML = m[view]();
        safeLucide(a);
    }
}"""
js = re.sub(render_view_pattern, new_render_view, js)

# 5. Clean up the end of the file and re-inject landing logic
# Find the last "original" function: deleteStaffChatMessage
end_marker = "window.deleteStaffChatMessage = (id) => {"
if end_marker in js:
    # Find the closing brace of this function
    idx = js.find(end_marker)
    # Move past the marker
    # We'll just find the first }; after this marker
    close_idx = js.find("};", idx) + 2
    js = js[:close_idx]

# 6. Append fresh, clean landing definitions
landing_logic = """

// ======================== LANDING PAGE STATE & SYNC ========================
let LANDING_DATA = {};
const syncLandingData = async () => {
    try {
        const res = await fetch(`${API_BASE}/landing`);
        if (res.ok) {
            LANDING_DATA = await res.json();
            if (STATE.view === 'home') renderView('home');
        }
    } catch (e) { console.warn("Landing sync failed", e); }
};

window.saveLandingData = async (data) => {
    try {
        const res = await fetch(`${API_BASE}/landing`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            LANDING_DATA = await res.json();
            showToast("Landing yangilandi!");
            if (STATE.view === 'home') renderView('home');
        }
    } catch (e) { showToast("Xatolik!", "error"); }
};

// ======================== LANDING PAGE VIEWS ========================
const v_home = () => {
    if (STATE.user) return "";
    const d = LANDING_DATA || {};
    const teachers = d.best_teachers || [];
    const indicators = d.indicators || [];

    return `
        <div class="w-full space-y-0 animate-fade">
            <!-- Hero -->
            <div class="bg-white py-20 px-4">
                <div class="max-w-6xl mx-auto text-center space-y-8 animate-slide-up">
                    <div class="inline-block px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 mb-4 animate-bounce-subtle">
                        🚀 O'quv.uz | Kelajak Ta'limi
                    </div>
                    <h1 class="text-6xl md:text-8xl font-black text-slate-800 leading-[0.9] tracking-tighter">
                        Bilim bilan <br><span class="text-indigo-600">Yuksaling</span>
                    </h1>
                    <p class="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Eng so'nggi texnologiyalar va tajribali mentorlar bilan o'z sohangizda yetakchi bo'ling. 
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <button onclick="window.location.hash='login'" class="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
                            Boshlash <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </button>
                        <button onclick="window.location.hash='register'" class="bg-white text-slate-800 border border-slate-200 px-10 py-5 rounded-2xl font-black hover:bg-slate-50 transition-all">
                            Ro'yxatdan o'tish
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="portal-blue-bg py-20 px-4">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-800">
                    ${indicators.map(ind => `
                    <div class="indicator-card">
                        <div class="indicator-icon-wrap">
                            <i data-lucide="${ind.icon || 'star'}" class="w-8 h-8"></i>
                        </div>
                        <div class="text-4xl font-black mb-1">${ind.count}</div>
                        <div class="text-slate-400 font-bold uppercase tracking-widest text-[10px]">${ind.label}</div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Director -->
            <div class="bg-slate-50 py-24 px-4 overflow-hidden">
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
                    <div class="w-full md:w-1/2 aspect-square relative">
                        <div class="absolute inset-0 bg-indigo-600/10 rounded-3xl rotate-3"></div>
                        <img src="${d.director_photo || ''}" class="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl ring-4 ring-white">
                    </div>
                    <div class="w-full md:w-1/2 space-y-6">
                        <p class="text-indigo-600 font-black text-xs uppercase tracking-widest">Markaz Rahbari</p>
                        <h2 class="text-4xl md:text-6xl font-black text-slate-800">${d.director_name || ''}</h2>
                        <p class="text-slate-500 text-xl font-medium italic border-l-4 border-indigo-600 pl-6">
                            "Biz har bir talabaning individual o'sishiga ishonamiz."
                        </p>
                    </div>
                </div>
            </div>

            <!-- Teachers -->
            <div class="bg-white py-24 px-4">
                <div class="max-w-6xl mx-auto text-center mb-16">
                    <h2 class="text-4xl font-black text-slate-800">Bizning Ustozlar</h2>
                </div>
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${teachers.map(t => `
                    <div class="portal-news-card group">
                        <div class="relative h-64 overflow-hidden">
                            <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500">
                            <div class="date-badge"><i data-lucide="calendar" class="w-3 h-3"></i> ${t.date || ''}</div>
                        </div>
                        <div class="p-6">
                            <h3 class="portal-news-title text-xl mb-2">${t.name}</h3>
                            <p class="text-slate-400 text-sm font-medium">${t.title || ''}</p>
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Footer -->
            <div class="portal-blue-bg pt-20 pb-10 px-4">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
                    <div class="space-y-6">
                        <h2 class="text-2xl font-black">O'quv.uz</h2>
                        <p class="text-white/60">Sizning bilim poydevoringiz.</p>
                        <div class="flex gap-4">
                            <i data-lucide="send" class="w-6 h-6 cursor-pointer opacity-70 hover:opacity-100"></i>
                            <i data-lucide="facebook" class="w-6 h-6 cursor-pointer opacity-70 hover:opacity-100"></i>
                            <i data-lucide="instagram" class="w-6 h-6 cursor-pointer opacity-70 hover:opacity-100"></i>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h4 class="font-bold">Bog'lanish</h4>
                        <p class="text-white/80">+998 71 200 00 00</p>
                        <p class="text-white/80">info@oquv.uz</p>
                    </div>
                    <div class="space-y-4">
                        <h4 class="font-bold">Manzil</h4>
                        <p class="text-white/80">Toshkent sh., Yunusobod</p>
                    </div>
                </div>
                <div class="text-center border-t border-white/10 pt-10 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                    © 2026 O'QUV.UZ | Barcha huquqlar himoyalangan
                </div>
            </div>
        </div>
    `;
};

window.oLandingEdit = () => {
    const d = LANDING_DATA || {};
    const content = `
    <div class="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
        <h2 class="text-3xl font-black text-slate-800">Landing Tahrirlash</h2>
        <div class="space-y-4">
            <input type="text" id="edit-d-name" value="${d.director_name || ''}" class="w-full bg-slate-50 p-4 rounded-xl" placeholder="Director Ismi">
            <input type="text" id="edit-d-photo" value="${d.director_photo || ''}" class="w-full bg-slate-50 p-4 rounded-xl" placeholder="Director Foto">
            <textarea id="edit-indicators" class="w-full h-32 bg-slate-50 p-4 rounded-xl font-mono text-[10px]">${JSON.stringify(d.indicators || [], null, 2)}</textarea>
            <textarea id="edit-teachers" class="w-full h-40 bg-slate-50 p-4 rounded-xl font-mono text-[10px]">${JSON.stringify(d.best_teachers || [], null, 2)}</textarea>
        </div>
        <button onclick="saveLandingChanges()" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black">Saqlash</button>
    </div>`;
    document.getElementById('modal-content-area').innerHTML = content;
    document.getElementById('modal-root').classList.replace('hidden', 'flex');
    safeLucide(document.getElementById('modal-root'));
};

window.saveLandingChanges = () => {
    try {
        const teachers = JSON.parse(document.getElementById('edit-teachers').value);
        const indicators = JSON.parse(document.getElementById('edit-indicators').value);
        const data = {
            ...LANDING_DATA,
            director_name: document.getElementById('edit-d-name').value,
            director_photo: document.getElementById('edit-d-photo').value,
            best_teachers: teachers,
            indicators: indicators
        };
        saveLandingData(data);
        document.getElementById('modal-root').classList.add('hidden');
    } catch (e) { alert("JSON xato!"); }
};
"""

js += landing_logic

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print("App.js fully synchronized and cleaned up.")
