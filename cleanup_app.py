import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    js_content = f.read()

# 1. Clean up duplicate syncLandingData() calls
js_content = js_content.replace("syncLandingData(); syncLandingData();", "syncLandingData();")

# 2. Find the point where my landing additions began
# I'll look for the comment marker
marker = "// ======================== PRE-LOGIN LANDING PAGE ========================"
if marker in js_content:
    idx = js_content.find(marker)
    js_content = js_content[:idx]

# 3. Append the DEFINITIVE versions
landing_definitions = """
let LANDING_DATA = {};
const syncLandingData = async () => {
    try {
        const res = await fetch(`${API_BASE}/landing`);
        if (res.ok) {
            LANDING_DATA = await res.json();
            if (STATE.view === 'home') renderView('home');
        }
    } catch (e) { console.warn("Landing data sync failed", e); }
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
            showToast("Landing sahifasi yangilandi!");
            if (STATE.view === 'home') renderView('home');
        }
    } catch (e) { showToast("Xatolik yuz berdi", "error"); }
};

""" + marker + """
const v_home = () => {
    if (STATE.user) return "Redirecting...";
    
    const d = LANDING_DATA || {};
    const teachers = d.best_teachers || [];
    const indicators = d.indicators || [];

    return `
        <div class="w-full space-y-0 animate-fade">
            <!-- Hero Section -->
            <div class="bg-white py-16 px-4">
                <div class="max-w-6xl mx-auto text-center space-y-8 animate-slide-up">
                    <div class="inline-block px-6 py-2 bg-indigo-50 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 mb-4 animate-bounce-subtle">
                        🚀 O'quv.uz | Sifatli Ta'lim Markazi
                    </div>
                    <h1 class="text-5xl md:text-8xl font-black text-slate-800 leading-tight tracking-tighter">
                        Kelajagingizni <br><span class="text-indigo-600">Portalimiz</span> bilan Yaratasiz
                    </h1>
                    <p class="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Zamonaviy pedagogik texnologiyalar va tajribali ustozlar yordamida o'z sohangizning eng yaxshi mutaxassisi bo'ling.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <button onclick="window.location.hash='login'" class="bg-indigo-600 text-white px-12 py-6 rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3">
                            Tizimga Kirish <i data-lucide="arrow-right" class="w-6 h-6"></i>
                        </button>
                        <button onclick="window.location.hash='register'" class="bg-white text-slate-800 border-2 border-slate-100 px-12 py-6 rounded-3xl font-black text-lg hover:bg-slate-50 hover:-translate-y-1 active:scale-95 transition-all">
                            Ro'yxatdan O'tish
                        </button>
                    </div>
                </div>
            </div>

            <!-- Indicators Section -->
            <div class="portal-blue-bg py-20 px-4">
                <div class="max-w-6xl mx-auto text-center">
                    <h2 class="text-3xl font-black mb-4">Asosiy ko'rsatkichlar</h2>
                    <div class="w-20 h-1 bg-white mx-auto mb-16 opacity-30"></div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-800">
                        ${indicators.map(ind => `
                        <div class="indicator-card">
                            <div class="indicator-icon-wrap">
                                <i data-lucide="${ind.icon || 'star'}" class="w-8 h-8"></i>
                            </div>
                            <div class="text-4xl font-black mb-2">${ind.count}</div>
                            <div class="text-slate-400 font-bold uppercase tracking-widest text-xs">${ind.label}</div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- Director -->
            <div class="bg-slate-50 py-24 px-4 overflow-hidden relative">
                <div class="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 -skew-x-12 translate-x-20"></div>
                <div class="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
                    <div class="relative w-72 h-72 md:w-[450px] md:h-[450px] shrink-0">
                        <div class="absolute inset-0 bg-indigo-600 rounded-3xl rotate-3 shadow-xl opacity-10"></div>
                        <img src="${d.director_photo || ''}" class="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl transition-all hover:scale-105 ring-4 ring-white">
                    </div>
                    <div class="space-y-8 text-center lg:text-left flex-1">
                        <div>
                            <p class="text-indigo-500 font-black text-sm uppercase tracking-[0.3em] mb-4">Markaz Rahbari</p>
                            <h2 class="text-4xl md:text-6xl font-black text-slate-800 mb-2">${d.director_name || ''}</h2>
                            <p class="text-slate-400 font-bold text-xl">${d.director_title || ''}</p>
                        </div>
                        <p class="text-slate-500 font-medium text-xl leading-relaxed italic border-l-4 border-indigo-600 pl-8">
                            "Bizning markazimizda har bir o'quvchi nafaqat bilim, balki kelajakdagi muvaffaqiyati uchun mustahkam poydevor oladi."
                        </p>
                    </div>
                </div>
            </div>

            <!-- Teachers -->
            <div class="bg-white py-24 px-4">
                <div class="max-w-6xl mx-auto">
                    <div class="flex items-center justify-between mb-16">
                        <h2 class="text-4xl font-black text-slate-800">Bizning Ustozlar</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        ${teachers.map(t => `
                        <div class="portal-news-card group">
                            <div class="relative h-64 overflow-hidden">
                                <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                                <div class="date-badge"><i data-lucide="calendar" class="w-3 h-3"></i> ${t.date || ''}</div>
                            </div>
                            <div class="p-6">
                                <h3 class="portal-news-title text-xl">${t.name}</h3>
                                <p class="text-slate-400 text-sm mt-3">${t.title || ''}</p>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="portal-blue-bg pt-20 pb-16 px-4">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
                    <div class="space-y-8">
                        <h3 class="text-2xl font-black">O'quv.uz</h3>
                        <p class="text-white/70">Sifatli ta'lim, yorqin kelajak!</p>
                        <div class="flex gap-4">
                            <i data-lucide="send" class="w-6 h-6 cursor-pointer"></i>
                            <i data-lucide="facebook" class="w-6 h-6 cursor-pointer"></i>
                            <i data-lucide="youtube" class="w-6 h-6 cursor-pointer"></i>
                            <i data-lucide="instagram" class="w-6 h-6 cursor-pointer"></i>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-xl font-bold">Bog'lanish</h3>
                        <p>+998 71 234 56 78</p>
                        <p>info@oquv.uz</p>
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-xl font-bold">Manzil</h3>
                        <p>Toshkent sh., Yunusobod tumani</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.oLandingEdit = () => {
    const d = LANDING_DATA || {};
    const content = `
    <div class="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <h2 class="text-3xl font-black text-slate-800">Landingni Tahrirlash</h2>
        <div class="space-y-4">
            <input type="text" id="edit-d-name" value="${d.director_name || ''}" class="w-full bg-slate-50 p-4 rounded-xl" placeholder="Director Ismi">
            <input type="text" id="edit-d-photo" value="${d.director_photo || ''}" class="w-full bg-slate-50 p-4 rounded-xl" placeholder="Director Foto URL">
            <textarea id="edit-indicators" class="w-full h-32 bg-slate-50 p-4 rounded-xl font-mono text-xs">${JSON.stringify(d.indicators || [], null, 2)}</textarea>
            <textarea id="edit-teachers" class="w-full h-40 bg-slate-50 p-4 rounded-xl font-mono text-xs">${JSON.stringify(d.best_teachers || [], null, 2)}</textarea>
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

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(js_content + landing_definitions)

print("App.js cleaned and landing page re-injected correctly.")
