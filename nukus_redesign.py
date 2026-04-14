import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# ... (the rest of the script remains the same, I'll just provide the fix)
new_initial = """const INITIAL_LANDING = {
    director_name: "A. Djumamuratov",
    director_photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=DirectorAnvar",
    director_title: "Texnikum Direktori",
    indicators: [
        { id: 1, label: "Professorlar", count: "25+", icon: "award" },
        { id: 2, label: "Talabalar", count: "1,200+", icon: "users" },
        { id: 3, label: "Muvaffaqiyatlar", count: "50+", icon: "star" }
    ],
    best_teachers: [
        { id: 1, name: "Samat Jienbaev", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samat", title: "Katta O'qituvchi", date: "06.04.2026" },
        { id: 2, name: "Gulnaz Turdimuratova", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnaz", title: "Metodist", date: "05.04.2026" },
        { id: 3, name: "Azamat Berdimuratov", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Azamat", title: "IT Mentor", date: "06.04.2026" }
    ]
};"""

new_v_home = """const v_home = () => {
    if (STATE.user) return "";
    const d = LANDING_DATA || INITIAL_LANDING;
    const teachers = d.best_teachers || INITIAL_LANDING.best_teachers;
    const indicators = d.indicators || INITIAL_LANDING.indicators;

    return `
        <div class="w-full relative overflow-hidden bg-slate-50/50 min-h-screen">
            <div class="floating-blob top-[-100px] left-[-100px]"></div>
            <div class="floating-blob bottom-[-100px] right-[-100px]" style="animation-delay: -10s;"></div>

            <!-- Hero: Ultra Glass -->
            <div class="max-w-7xl mx-auto pt-24 pb-20 px-6 relative z-10">
                <div class="hero-glass rounded-[4rem] p-12 md:p-24 text-center space-y-10 animate-fade">
                    <div class="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600/10 text-indigo-700 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-indigo-200 animate-bounce-subtle">
                         🏛️ Nukus Professional Ta'lim Texnikumi
                    </div>
                    <h1 class="text-5xl md:text-8xl font-black text-slate-800 leading-[0.9] tracking-tighter">
                        Kelajakingizni <br><span class="text-gradient">Aqlli Avlod</span> <br>Bilan Yarating
                    </h1>
                    <p class="text-slate-500 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed opacity-80">
                        Nukus shahridagi eng zamonaviy bilim maskani. Biz bilan orzularingizni professional darajada amalga oshiring.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                        <button onclick="window.location.hash='login'" class="w-full sm:w-auto bg-indigo-600 text-white px-12 py-6 rounded-3xl font-black text-lg shadow-2xl shadow-indigo-600/30 hover:bg-slate-900 transition-all transform hover:-translate-y-2 flex items-center justify-center gap-3">
                            Tizimga Kirish <i data-lucide="arrow-right" class="w-6 h-6"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats: Floating Cards -->
            <div class="max-w-7xl mx-auto px-6 py-20">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-slate-800">
                    ${indicators.map((ind, i) => `
                    <div class="portal-card p-10 text-center space-y-4 opacity-0 animate-slide-up" style="animation-delay: ${i * 0.1}s">
                        <div class="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                             <i data-lucide="${ind.icon || 'star'}" class="w-10 h-10"></i>
                        </div>
                        <div class="text-5xl font-black text-slate-800 tabular-nums">${ind.count}</div>
                        <div class="text-indigo-400 font-black uppercase tracking-widest text-xs">${ind.label}</div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Director: Cinematic Section -->
            <div class="max-w-7xl mx-auto px-6 py-32 rounded-[5rem] overflow-hidden relative">
                 <div class="absolute inset-0 bg-slate-900 opacity-[0.03] pattern-grid"></div>
                 <div class="flex flex-col lg:flex-row items-center gap-20 relative z-10">
                    <div class="w-full lg:w-1/2 group">
                        <div class="relative aspect-square">
                            <div class="absolute inset-0 bg-indigo-600/20 rounded-[4rem] rotate-6 group-hover:rotate-12 transition-transform duration-700"></div>
                            <img src="${d.director_photo || INITIAL_LANDING.director_photo}" 
                                 class="absolute inset-0 w-full h-full object-cover rounded-[4rem] shadow-2xl border-8 border-white group-hover:scale-105 transition-transform duration-700 grayscale hover:grayscale-0">
                        </div>
                    </div>
                    <div class="w-full lg:w-1/2 space-y-10">
                        <div class="space-y-4">
                            <span class="text-indigo-600 font-black tracking-widest text-sm uppercase px-4 py-1 bg-white rounded-lg shadow-sm">Rahbariyat</span>
                            <h2 class="text-5xl md:text-7xl font-black text-slate-800 leading-none">${d.director_name || INITIAL_LANDING.director_name}</h2>
                            <p class="text-slate-400 font-bold text-2xl">${d.director_title || INITIAL_LANDING.director_title}</p>
                        </div>
                        <div class="relative">
                            <i data-lucide="quote" class="absolute -top-10 -left-10 w-20 h-20 text-indigo-600/5 rotate-12"></i>
                            <p class="text-slate-500 text-2xl md:text-3xl leading-relaxed italic font-medium">
                                "Nukus Professional ta'lim texnikumi - bu nafaqat ta'lim maskani, balki yangi cho'qqilarni zabt etuvchi do'stona oiladir."
                            </p>
                        </div>
                    </div>
                 </div>
            </div>

            <!-- Teachers: Grid Overlay -->
            <div class="max-w-7xl mx-auto px-6 py-32">
                <div class="flex items-end justify-between mb-20">
                    <div class="space-y-4">
                        <h2 class="text-5xl md:text-7xl font-black text-slate-800">Bizning <span class="text-indigo-600">Ustozlar</span></h2>
                        <div class="w-24 h-2 bg-indigo-600 rounded-full"></div>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    ${teachers.map((t, i) => `
                    <div class="portal-card group overflow-hidden opacity-0 animate-slide-up" style="animation-delay: ${i * 0.15}s">
                         <div class="relative h-[450px]">
                            <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent p-10 flex flex-col justify-end">
                                <p class="text-white/60 text-xs font-bold uppercase tracking-widest mb-1 italic">Professional Mentor</p>
                                <h3 class="text-white text-3xl font-black leading-tight">${t.name}</h3>
                                <p class="text-indigo-300 font-bold mt-2">${t.title || 'Dars berish metodikasi bo\\'yicha mutaxassis'}</p>
                            </div>
                         </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Final Footer: The Address -->
            <div class="portal-blue-bg pt-32 pb-16 px-6">
                <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-24 mb-24">
                    <div class="space-y-10">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
                                <i data-lucide="graduation-cap" class="text-indigo-600 w-10 h-10"></i>
                            </div>
                            <span class="text-4xl font-black text-white italic tracking-tighter">O'quv.uz</span>
                        </div>
                        <p class="text-white/60 text-xl font-medium leading-relaxed">
                            Qoraqalpog'istonning ilm-fan dargohi. Sifatli va zamonaviy ta'lim bilan kelajak tomon qadam bosamiz.
                        </p>
                        <div class="flex gap-6">
                             ${['send', 'facebook', 'instagram', 'youtube'].map(icon => `
                             <a href="#" class="w-14 h-14 rounded-2xl border border-white/20 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all text-white group">
                                <i data-lucide="${icon}" class="w-7 h-7 group-hover:scale-110 transition-transform"></i>
                             </a>`).join('')}
                        </div>
                    </div>
                    <div class="space-y-10">
                        <h4 class="text-white text-xl font-black uppercase tracking-widest">Nukus Texnikumi</h4>
                        <ul class="space-y-8 text-white/70 font-bold text-lg">
                            <li class="flex items-start gap-4">
                                <i data-lucide="map-pin" class="w-8 h-8 text-indigo-300 mt-1"></i>
                                <span>Qoraqalpog'iston Respublikasi, <br>Nukus sh., Ernazar Alako'z ko'chasi, 162-uy</span>
                            </li>
                            <li class="flex items-center gap-4">
                                <i data-lucide="phone" class="w-8 h-8 text-indigo-300"></i>
                                <span>+998 61 222 33 44</span>
                            </li>
                            <li class="flex items-center gap-4">
                                <i data-lucide="mail" class="w-8 h-8 text-indigo-300"></i>
                                <span>nukus-texnikum@lms.uz</span>
                            </li>
                        </ul>
                    </div>
                    <div class="space-y-10">
                         <h4 class="text-white text-xl font-black uppercase tracking-widest">Mo'ljal</h4>
                         <div class="rounded-[2.5rem] overflow-hidden h-64 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700 ring-4 ring-white/10">
                             <img src="https://api.dicebear.com/7.x/initials/svg?seed=NukusMap&backgroundColor=1e3a8a" class="w-full h-full object-cover">
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};"""

# Use smarter replacement that doesn't rely on exact large block matches if they differ slightly
# We'll use marker-based replacement if possible, or just re-write the top part.
# Let's try marker-based.

if "const INITIAL_LANDING =" in content:
    content = re.sub(r"const INITIAL_LANDING = \{[\s\S]*?\};", new_initial, content)

if "const v_home =" in content:
    content = re.sub(r"const v_home = \(\) => \{[\s\S]*?return `[\s\S]*?`;\s*?\};", new_v_home, content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Redesign complete (Fixed). Nukus address and premium glassmorphism integrated.")
