import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Add Background Sync (Polling)
# I'll add it after handleRoute() in the DOMContentLoaded listener
sync_call = "syncBackend(); syncLandingData();"
if sync_call in js:
    js = js.replace(sync_call, sync_call + "\n    // Background Sync for multi-user real-time feel\n    setInterval(() => { syncBackend(); syncLandingData(); }, 30000); // 30 seconds")

# 2. Refine v_home for better mobile and animations
v_home_pattern = r"const v_home = \(\) => \{[\s\S]*?\};"
new_v_home = """const v_home = () => {
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

            <!-- Portal Stats (Visible to others in real-time) -->
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

            <!-- Director Spotlight -->
            <div class="bg-slate-50 py-24 px-6 relative">
                 <!-- Subtle background pattern -->
                <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#4f46e5 1px, transparent 1px); background-size: 24px 24px;"></div>
                <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
                    <div class="w-full md:w-1/2 aspect-square relative group">
                        <div class="absolute inset-0 bg-indigo-600/10 rounded-[3rem] md:rounded-[4rem] rotate-3 transition-transform group-hover:rotate-6 duration-500"></div>
                        <img src="${d.director_photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Director'}" 
                             class="absolute inset-0 w-full h-full object-cover rounded-[3rem] md:rounded-[4rem] shadow-2xl ring-4 ring-white transition-all duration-700 group-hover:scale-105">
                    </div>
                    <div class="w-full md:w-1/2 space-y-8 animate-fade">
                        <div>
                            <p class="text-indigo-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Markaz Rahbari</p>
                            <h2 class="text-4xl md:text-7xl font-black text-slate-800 leading-none">${d.director_name || 'Ism Familiya'}</h2>
                            <p class="text-slate-400 font-bold text-lg md:text-xl mt-2">${d.director_title || 'Platforma Direktori'}</p>
                        </div>
                        <div class="relative">
                            <i data-lucide="quote" class="absolute -top-6 -left-6 w-12 h-12 text-indigo-600/10 rotate-12"></i>
                            <p class="text-slate-600 text-lg md:text-2xl font-medium leading-relaxed italic border-l-4 border-indigo-600 pl-8">
                                "Sifatli ta'lim - muvaffaqiyatli kelajak garovidir. Biz har bir talabaning salohiyatini ochishga yordam beramiz."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Featured Teachers Grid -->
            <div class="bg-white py-24 px-6">
                <div class="max-w-6xl mx-auto text-center mb-20 space-y-4">
                    <h2 class="text-4xl md:text-6xl font-black text-slate-800">Eng Yaxshi Ustozlar</h2>
                    <div class="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
                </div>
                <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    ${teachers.map((t, i) => `
                    <div class="portal-news-card group opacity-0 animate-slide-up" style="animation-delay: ${i * 0.15}s">
                        <div class="relative aspect-[4/5] overflow-hidden">
                            <img src="${t.photo || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher'}" 
                                 class="w-full h-full object-cover group-hover:scale-105 transition-all duration-700">
                            <div class="date-badge">
                                <i data-lucide="award" class="w-3 h-3 text-emerald-500"></i> ${t.date || '06.04.2026'}
                            </div>
                            <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                                <p class="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Mentor Expert</p>
                                <h3 class="text-white text-xl font-bold">${t.name}</h3>
                            </div>
                        </div>
                        <div class="p-6 space-y-4">
                            <h3 class="portal-news-title text-xl group-hover:text-indigo-600 transition-colors">${t.name}</h3>
                            <p class="text-slate-400 text-sm font-medium line-clamp-2">${t.title || 'Dars berish metodikasi bo\\'yicha yuqori tajribaga ega mutaxassis.'}</p>
                            <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Active State</span>
                                <i data-lucide="arrow-up-right" class="w-5 h-5 text-indigo-200 group-hover:text-indigo-600 transition-colors"></i>
                            </div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Real-time Portal Footer -->
            <div class="portal-blue-bg pt-24 pb-12 px-6">
                <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
                    <div class="md:col-span-2 space-y-8">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-xl">
                                <i data-lucide="graduation-cap" class="text-indigo-600 w-8 h-8"></i>
                            </div>
                            <span class="font-black text-3xl tracking-tight text-white uppercase italic">O'quv.uz</span>
                        </div>
                        <p class="text-white/60 text-lg md:text-xl font-medium max-w-sm">
                            Platformamiz har kuni minglab talabalarga o'z orzularini amalga oshirishga yordam bermoqda. 
                        </p>
                        <div class="flex gap-4">
                            ${['send', 'facebook', 'instagram', 'youtube'].map(icon => `
                            <a href="#" class="w-12 h-12 rounded-2xl border border-white/20 flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all text-white group">
                                <i data-lucide="${icon}" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                            </a>`).join('')}
                        </div>
                    </div>
                    <div class="space-y-6">
                        <h4 class="text-white text-xl font-black uppercase tracking-widest">Aloqa</h4>
                        <ul class="space-y-4 text-white/70 font-bold">
                            <li class="flex items-center gap-3"><i data-lucide="phone" class="w-5 h-5 text-indigo-300"></i> +998 71 200 11 22</li>
                            <li class="flex items-center gap-3"><i data-lucide="mail" class="w-5 h-5 text-indigo-300"></i> info@oquv.uz</li>
                            <li class="flex items-start gap-3"><i data-lucide="map-pin" class="w-5 h-5 text-indigo-300 mt-1"></i> Toshkent sh., Chilonzor</li>
                        </ul>
                    </div>
                    <div class="space-y-6">
                        <h4 class="text-white text-xl font-black uppercase tracking-widest">Harakat</h4>
                        <ul class="space-y-4">
                             <li><a href="#" class="text-white/70 hover:text-white font-bold transition-colors">Biz haqimizda</a></li>
                             <li><a href="#" class="text-white/70 hover:text-white font-bold transition-colors">Yordam burchagi</a></li>
                             <li><a href="#" class="text-white/70 hover:text-white font-bold transition-colors">Xavfsizlik</a></li>
                        </ul>
                    </div>
                </div>
                <div class="text-center pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p class="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase">© 2026 O'QUV.UZ LMS PORTAL V.3.0</p>
                    <div class="flex gap-8 text-white/20 text-[9px] font-black uppercase tracking-widest">
                        <span>Maxfiylik siyosati</span>
                        <span>Foydalanish shartlari</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};"""

js = re.sub(v_home_pattern, new_v_home, js)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print("App.js updated with polling and premium mobile style.")
