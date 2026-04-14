import os

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the broken setInterval in DOMContentLoaded
bad_interval = "setInterval(() => { syncBackend(); syncLandingData(); }, 30000); for multi-user real-time feel\n    setInterval(() => { syncBackend(); syncLandingData(); }, 30000); // 30 seconds"
good_interval = "setInterval(() => { syncBackend(); syncLandingData(); }, 30000); // Background Sync for multi-user real-time feel"
content = content.replace(bad_interval, good_interval)

# 2. Fix the mangled Landing System block
start_marker = "// ============ START LANDING SYSTEM ============"
end_marker = "// ============ END LANDING SYSTEM ============"

landing_block = """// ============ START LANDING SYSTEM ============
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

const v_home = () => {
    if (STATE.user) return "";
    const d = LANDING_DATA || {};
    const teachers = d.best_teachers || [];
    const indicators = d.indicators || [];

    return `
        <div class="w-full overflow-hidden">
            <!-- Hero -->
            <div class="bg-white pt-20 pb-16 px-6 md:px-12 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                <div class="max-w-6xl mx-auto text-center space-y-8 relative z-10">
                    <div class="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 mb-2 animate-bounce-subtle">
                        🚀 O'quv.uz | Kelajakingiz uchun eng yaxshi LMS
                    </div>
                    <h1 class="text-4xl md:text-7xl lg:text-8xl font-black text-slate-800 leading-[1.1] tracking-tighter animate-slide-up">
                        Bilim bilan <br><span class="text-indigo-600">Chegarasiz</span> <br>Yuksaling
                    </h1>
                    <p class="text-slate-400 text-base md:text-lg lg:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade" style="animation-delay: 0.3s">
                        Sizga eng so'nggi texnologiyalar va tajribali mentoralr yordamida o'z sohangizda yetakchi bo'lishingizga yordam beramiz.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 opacity-0 animate-fade" style="animation-delay: 0.6s">
                        <button onclick="window.location.hash='login'" class="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2">
                            Boshlash <i data-lucide="arrow-right" class="w-5 h-5"></i>
                        </button>
                        <button onclick="window.location.hash='register'" class="w-full sm:w-auto bg-white text-slate-800 border-2 border-slate-50 px-10 py-5 rounded-2xl font-black hover:bg-slate-50 hover:-translate-y-1 active:scale-95 transition-all text-center">
                            Ro'yxatdan o'tish
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="portal-blue-bg py-20 px-6">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                    ${indicators.map((ind, i) => `
                    <div class="indicator-card opacity-0 animate-slide-up" style="animation-delay: ${i * 0.1}s">
                        <div class="indicator-icon-wrap">
                            <i data-lucide="${ind.icon || 'star'}" class="w-8 h-8"></i>
                        </div>
                        <div class="text-3xl md:text-5xl font-black mb-1 tabular-nums">${ind.count}</div>
                        <div class="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">${ind.label}</div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Director -->
            <div class="bg-slate-50 py-24 px-6 relative">
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
                    <div class="w-full md:w-1/2 aspect-square relative group">
                        <div class="absolute inset-0 bg-indigo-600/10 rounded-[3rem] rotate-3 transition-transform group-hover:rotate-6"></div>
                        <img src="${d.director_photo || ''}" class="absolute inset-0 w-full h-full object-cover rounded-[3rem] shadow-2xl ring-4 ring-white transition-transform group-hover:scale-105 duration-700">
                    </div>
                    <div class="w-full md:w-1/2 space-y-8 animate-fade">
                        <p class="text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">Markaz Rahbari</p>
                        <h2 class="text-4xl md:text-7xl font-black text-slate-800 leading-none">${d.director_name || ''}</h2>
                        <p class="text-slate-600 text-lg md:text-2xl font-medium leading-relaxed italic border-l-4 border-indigo-600 pl-8">
                            "Sifatli ta'lim - muvaffaqiyatli kelajak garovidir."
                        </p>
                    </div>
                </div>
            </div>

            <!-- Teachers -->
            <div class="bg-white py-24 px-6">
                <div class="max-w-6xl mx-auto text-center mb-20">
                    <h2 class="text-4xl md:text-6xl font-black text-slate-800">Eng Yaxshi Ustozlar</h2>
                </div>
                <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    ${teachers.map((t, i) => `
                    <div class="portal-news-card group opacity-0 animate-slide-up" style="animation-delay: ${i * 0.15}s">
                        <div class="relative aspect-[4/5] overflow-hidden">
                            <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700">
                            <div class="date-badge"><i data-lucide="calendar" class="w-3 h-3"></i> ${t.date || ''}</div>
                        </div>
                        <div class="p-6">
                            <h3 class="portal-news-title text-xl mb-2">${t.name}</h3>
                            <p class="text-slate-400 text-sm font-medium line-clamp-2">${t.title || ''}</p>
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Footer -->
            <div class="portal-blue-bg pt-20 pb-12 px-6">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 mb-20 text-center md:text-left">
                    <div class="space-y-6">
                        <h2 class="text-3xl font-black italic uppercase">O'quv.uz</h2>
                        <div class="flex justify-center md:justify-start gap-4">
                            <i data-lucide="send"></i> <i data-lucide="facebook"></i> <i data-lucide="instagram"></i>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h4 class="font-bold uppercase tracking-widest text-xs opacity-50">Manzil</h4>
                        <p class="font-bold">Toshkent sh., Yunusobod</p>
                    </div>
                    <div class="space-y-4">
                        <h4 class="font-bold uppercase tracking-widest text-xs opacity-50">Bog'lanish</h4>
                        <p class="font-bold">+998 71 200 00 00</p>
                    </div>
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
            <input type="text" id="edit-d-photo" value="${d.director_photo || ''}" class="w-full bg-slate-50 p-4 rounded-xl" placeholder="Director Foto URL">
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
// ============ END LANDING SYSTEM ============"""

if (start_marker in content and end_marker in content):
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker) + len(end_marker)
    content = content[:start_idx] + landing_block + content[end_idx:]
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("App.js definitively fixed and cleaned.")
else:
    print("Markers not found correctly.")
