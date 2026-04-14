import os

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    js_content = f.read()

v_home_replacement = """
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

            <!-- Indicators Section (Portal Blue Style) -->
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

            <!-- Director Section -->
            <div class="bg-slate-50 py-24 px-4 overflow-hidden relative">
                <div class="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 -skew-x-12 translate-x-20"></div>
                <div class="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
                    <div class="relative w-72 h-72 md:w-[450px] md:h-[450px] shrink-0">
                        <div class="absolute inset-0 bg-indigo-600 rounded-3xl rotate-3 shadow-xl opacity-10"></div>
                        <img src="${d.director_photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Director'}" 
                             class="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl transition-all hover:scale-105 duration-700 ring-4 ring-white">
                    </div>
                    <div class="space-y-8 text-center lg:text-left flex-1">
                        <div>
                            <p class="text-indigo-500 font-black text-sm uppercase tracking-[0.3em] mb-4">Markaz Rahbari</p>
                            <h2 class="text-4xl md:text-6xl font-black text-slate-800 mb-2">${d.director_name || 'Ism Familiya'}</h2>
                            <p class="text-slate-400 font-bold text-xl">${d.director_title || 'Platforma Direktori'}</p>
                        </div>
                        <p class="text-slate-500 font-medium text-xl leading-relaxed italic border-l-4 border-indigo-600 pl-8">
                            "Bizning markazimizda har bir o'quvchi nafaqat bilim, balki kelajakdagi muvaffaqiyati uchun mustahkam poydevor oladi. Biz bilan orzularingizga yetishish oson!"
                        </p>
                        <div class="flex items-center justify-center lg:justify-start gap-4">
                             <div class="flex -space-x-4">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=1" class="w-12 h-12 rounded-full border-2 border-white bg-white">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=2" class="w-12 h-12 rounded-full border-2 border-white bg-white">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=3" class="w-12 h-12 rounded-full border-2 border-white bg-white">
                             </div>
                             <p class="text-slate-400 text-sm font-bold">Biz bilan 10,000+ talaba</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Teachers / News Grid -->
            <div class="bg-white py-24 px-4">
                <div class="max-w-6xl mx-auto">
                    <div class="flex items-center justify-between mb-16">
                        <div class="space-y-2">
                             <h2 class="text-4xl font-black text-slate-800">Bizning Ustozlar</h2>
                             <div class="w-16 h-1 bg-indigo-600"></div>
                        </div>
                        <p class="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] hidden md:block">O'z sohasining eng sara mutaxassislari</p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        ${teachers.map(t => `
                        <div class="portal-news-card group">
                            <div class="relative h-64 overflow-hidden">
                                <img src="${t.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher'}" 
                                     class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                                <div class="date-badge">
                                    <i data-lucide="calendar" class="w-3 h-3"></i> ${t.date || '06.04.2026'}
                                </div>
                            </div>
                            <div class="p-6 space-y-4">
                                <h3 class="portal-news-title text-xl">${t.name}</h3>
                                <p class="text-slate-400 font-medium text-sm leading-relaxed">${t.title || 'Dars berish metodikasi bo\\'yicha mutaxassis.'}</p>
                                <div class="flex justify-between items-center pt-4 border-t border-slate-50">
                                     <span class="text-xs font-black text-indigo-500 uppercase tracking-widest">Expert Mentor</span>
                                     <i data-lucide="chevron-right" class="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform"></i>
                                </div>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>

            <!-- Footer / Contact Section (Portal Style) -->
            <div class="portal-blue-bg pt-20 pb-16 px-4">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
                    <div class="space-y-8">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                                <i data-lucide="graduation-cap" class="text-indigo-600 w-6 h-6"></i>
                            </div>
                            <span class="font-black text-2xl tracking-tight text-white">O'quv.uz</span>
                        </div>
                        <p class="text-white/70 font-medium leading-relaxed">
                            Bizning maqsadimiz - har bir talabaga individual yondashuv orqali uning imkoniyatlarini maksimal darajada ochishdir.
                        </p>
                        <div class="flex gap-4">
                             <a href="#" class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"><i data-lucide="telegram" class="w-5 h-5"></i></a>
                             <a href="#" class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"><i data-lucide="facebook" class="w-5 h-5"></i></a>
                             <a href="#" class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"><i data-lucide="youtube" class="w-5 h-5"></i></a>
                             <a href="#" class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all"><i data-lucide="instagram" class="w-5 h-5"></i></a>
                        </div>
                    </div>
                    
                    <div class="space-y-8">
                        <h3 class="text-xl font-bold tracking-tight">Bog'lanish</h3>
                        <ul class="space-y-4">
                            <li class="flex items-start gap-4">
                                <i data-lucide="map-pin" class="w-6 h-6 text-white/50 shrink-0"></i>
                                <span class="font-medium">O'zbekiston, Toshkent sh., <br>Yunusobod tumani, 5-mavze</span>
                            </li>
                            <li class="flex items-center gap-4">
                                <i data-lucide="phone" class="w-6 h-6 text-white/50 shrink-0"></i>
                                <span class="font-medium">+998 71 234 56 78</span>
                            </li>
                            <li class="flex items-center gap-4">
                                <i data-lucide="mail" class="w-6 h-6 text-white/50 shrink-0"></i>
                                <span class="font-medium">info@oquv.uz</span>
                            </li>
                        </ul>
                    </div>

                    <div class="space-y-8">
                        <h3 class="text-xl font-bold tracking-tight">Manzilimiz</h3>
                        <div class="map-container relative">
                            <img src="https://api.dicebear.com/7.x/initials/svg?seed=Map&backgroundColor=cbd5e1" class="w-full h-full object-cover grayscale opacity-50">
                            <div class="absolute inset-0 flex items-center justify-center">
                                <i data-lucide="map-pin" class="w-12 h-12 text-indigo-100 animate-bounce"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="max-w-6xl mx-auto pt-16 mt-16 border-t border-white/10 text-center">
                    <p class="text-white/40 font-medium text-xs">© 2026 O'quv.uz Platformasi. Barcha huquqlar himoyalangan.</p>
                </div>
            </div>
        </div>
    `;
};
"""

o_landing_edit_replacement = """
window.oLandingEdit = () => {
    const d = LANDING_DATA || {};
    const content = `
    <div class="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <h2 class="text-3xl font-black text-slate-800">Landing Page Tahrirlash</h2>
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Director Ismi</label>
                <input type="text" id="edit-d-name" value="${d.director_name || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold focus:border-indigo-500 outline-none">
            </div>
            <div>
                <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Director Foto URL</label>
                <input type="text" id="edit-d-photo" value="${d.director_photo || ''}" class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold focus:border-indigo-500 outline-none">
            </div>
        </div>
        <hr class="border-slate-100">
        <h3 class="font-black text-slate-800 text-sm italic">Ko'rsatkichlar & Ustozlar (JSON)</h3>
        <div class="grid grid-cols-1 gap-4">
            <div>
                 <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ko'rsatkichlar JSON</label>
                 <textarea id="edit-indicators" class="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-mono text-xs focus:border-indigo-500 outline-none">${JSON.stringify(d.indicators || [], null, 2)}</textarea>
            </div>
            <div>
                 <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ustozlar JSON</label>
                 <textarea id="edit-teachers" class="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-mono text-xs focus:border-indigo-500 outline-none">${JSON.stringify(d.best_teachers || [], null, 2)}</textarea>
            </div>
        </div>
        
        <button onclick="saveLandingChanges()" class="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all">Yangilash</button>
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
    } catch (e) { alert("JSON noto'g'ri shaklda!"); }
};
"""

# Patching v_home
import re
# Finding v_home function block
v_home_pattern = r"const v_home = \(\) => \{[\s\S]*?\};"
js_content = re.sub(v_home_pattern, v_home_replacement.strip(), js_content)

# Patching oLandingEdit and saveLandingChanges
o_landing_edit_pattern = r"window\.oLandingEdit = \(\) => \{[\s\S]*?window\.saveLandingChanges = \(\) => \{[\s\S]*?\};"
js_content = re.sub(o_landing_edit_pattern, o_landing_edit_replacement.strip(), js_content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Landing style updated successfully")
