import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update INITIAL_LANDING with Social Links
new_initial = """const INITIAL_LANDING = {
    director_name: "Erko",
    director_photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwwz5HpQmffG_Lq0QO6FtRIUxnWg7U8X9pNA&s",
    director_title: "Texnikum Rahbari",
    telegram_link: "https://t.me/your_telegram", // SHU YERGA TELEGRAM SIZNIKINI QOYING
    instagram_link: "https://instagram.com/",
    facebook_link: "https://facebook.com/",
    youtube_link: "https://youtube.com/",
    indicators: [
        { id: 1, label: "Professorlar", count: "25+", icon: "award" },
        { id: 2, label: "Talabalar", count: "1,200+", icon: "users" },
        { id: 3, label: "Muvaffaqiyatlar", count: "50+", icon: "star" }
    ],
    best_teachers: [
        { id: 1, name: "Samat Jienbaev", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samat", title: "Senior Mentor", date: "06.04.2026" },
        { id: 2, name: "Gulnaz Turdimuratova", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnaz", title: "Metodist", date: "05.04.2026" },
        { id: 3, name: "Azamat Berdimuratov", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Azamat", title: "IT Specialist", date: "06.04.2026" }
    ]
};"""

# 2. Re-work v_home for LARGER TEXT and ACTUAL MAP
new_v_home = """const v_home = () => {
    if (STATE.user) return "";
    const d = LANDING_DATA || INITIAL_LANDING;
    const teachers = d.best_teachers || INITIAL_LANDING.best_teachers;
    const indicators = d.indicators || INITIAL_LANDING.indicators;

    return `
        <div class="w-full relative overflow-hidden bg-white min-h-screen">
            <div class="floating-blob top-[-200px] left-[-200px] w-[800px] h-[800px]"></div>
            <div class="floating-blob bottom-[-200px] right-[-200px] w-[800px] h-[800px]" style="animation-delay: -10s;"></div>

            <!-- Hero: Massive Impact -->
            <div class="max-w-[1600px] mx-auto pt-32 pb-24 px-6 md:px-12 relative z-10">
                <div class="hero-glass rounded-[5rem] p-16 md:p-32 text-center space-y-12 animate-fade border-0 shadow-[0_50px_100px_-20px_rgba(99,102,241,0.15)]">
                    <div class="inline-flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-full text-sm font-black uppercase tracking-[0.3em] shadow-lg shadow-indigo-600/30 animate-bounce-subtle">
                         🏛️ PROF TA'LIM TEXNIKUMI
                    </div>
                    <h1 class="text-6xl md:text-8xl lg:text-[10rem] font-black text-slate-900 leading-[0.85] tracking-tighter">
                        Innovatsion <br><span class="text-gradient">Kelajak</span> <br>Maskani
                    </h1>
                    <p class="text-slate-500 text-xl md:text-3xl font-medium max-w-4xl mx-auto leading-relaxed">
                        Nukus shahridagi eng yirik texnologik va professional bilim dargohi. 
                        Biz bilan zamonaviy kasblarni eng yuqori darajada egallang.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12">
                        <button onclick="window.location.hash='login'" class="w-full sm:w-auto bg-indigo-600 text-white px-16 py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-indigo-600/40 hover:bg-slate-900 transition-all transform hover:-translate-y-2 flex items-center justify-center gap-4">
                            Portalga Kirish <i data-lucide="arrow-right" class="w-8 h-8"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats: High Tech Grid -->
            <div class="max-w-[1400px] mx-auto px-6 py-24">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
                    ${indicators.map((ind, i) => `
                    <div class="portal-card p-16 text-center space-y-6 opacity-0 animate-slide-up border-slate-100" style="animation-delay: ${i * 0.1}s">
                        <div class="w-24 h-24 bg-slate-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                             <i data-lucide="${ind.icon || 'star'}" class="w-12 h-12"></i>
                        </div>
                        <div class="text-7xl font-black text-slate-800 tabular-nums">${ind.count}</div>
                        <div class="text-indigo-400 font-black uppercase tracking-[0.2em] text-sm">${ind.label}</div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Director: Massive Cinematic -->
            <div class="max-w-[1600px] mx-auto px-6 py-40">
                 <div class="flex flex-col lg:flex-row items-center gap-24">
                    <div class="w-full lg:w-1/2 group relative">
                        <div class="absolute inset-0 bg-indigo-600/10 rounded-[5rem] rotate-6 group-hover:rotate-12 transition-transform duration-1000"></div>
                        <div class="relative aspect-square overflow-hidden rounded-[5rem] border-[16px] border-white shadow-2xl">
                            <img src="${d.director_photo || INITIAL_LANDING.director_photo}" 
                                 class="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110">
                        </div>
                    </div>
                    <div class="w-full lg:w-1/2 space-y-12">
                        <div class="space-y-6">
                            <span class="text-indigo-600 font-black tracking-[0.4em] text-sm uppercase px-6 py-2 bg-indigo-50 rounded-2xl">Platforma Rahbari</span>
                            <h2 class="text-7xl md:text-9xl font-black text-slate-900 leading-none tracking-tighter">${d.director_name || INITIAL_LANDING.director_name}</h2>
                            <p class="text-indigo-400 font-black text-3xl uppercase tracking-widest">${d.director_title || INITIAL_LANDING.director_title}</p>
                        </div>
                        <p class="text-slate-600 text-3xl md:text-4xl leading-snug italic font-medium border-l-[12px] border-indigo-600 pl-12 py-4">
                            "Bizning maqsadimiz — Nukus yoshlarini jahon andozalari darajasidagi kadrlar qilib yetishtirishdir."
                        </p>
                    </div>
                 </div>
            </div>

            <!-- Teachers: Luxury Grid -->
            <div class="bg-slate-50 py-40 px-6">
                <div class="max-w-[1400px] mx-auto mb-24 flex items-center justify-between">
                    <h2 class="text-6xl md:text-8xl font-black text-slate-900">Eng Yaxshi <span class="text-indigo-600">Ustozlar</span></h2>
                </div>
                <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
                    ${teachers.map((t, i) => `
                    <div class="portal-card group overflow-hidden opacity-0 animate-slide-up bg-white" style="animation-delay: ${i * 0.15}s">
                         <div class="relative h-[600px]">
                            <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent p-12 flex flex-col justify-end transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                                <span class="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Mutaxassis Mentor</span>
                                <h3 class="text-white text-5xl font-black leading-tight mb-4">${t.name}</h3>
                                <div class="w-16 h-1.5 bg-indigo-500 mb-6"></div>
                                <p class="text-white/70 text-xl font-medium">${t.title || 'Dars berish metodikasi'}</p>
                            </div>
                         </div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- Map & Contact: Interactive -->
            <div class="max-w-[1600px] mx-auto px-6 py-40">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div class="space-y-16">
                        <div class="space-y-6">
                            <h2 class="text-6xl md:text-8xl font-black text-slate-900">Bizning <span class="text-indigo-600">Manzil</span></h2>
                            <p class="text-slate-500 text-2xl font-medium">Sizni Nukus shahridagi zamonaviy kampusimizda kutib qolamiz.</p>
                        </div>
                        <div class="space-y-12">
                            <div class="flex items-center gap-8 group">
                                <div class="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                                    <i data-lucide="map-pin" class="w-10 h-10"></i>
                                </div>
                                <div class="space-y-1">
                                    <h4 class="text-slate-400 font-black uppercase tracking-widest text-sm">Joylashuv</h4>
                                    <p class="text-3xl font-black text-slate-800">Nukus sh., E.Alako'z ko'chasi, 162</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-8 group">
                                <div class="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                                    <i data-lucide="phone" class="w-10 h-10"></i>
                                </div>
                                <div class="space-y-1">
                                    <h4 class="text-slate-400 font-black uppercase tracking-widest text-sm">Bog'lanish</h4>
                                    <p class="text-3xl font-black text-slate-800">+998 61 222 33 44</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="relative h-[600px] rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white">
                        <!-- REAL GOOGLE MAP EMBED FOR NUKUS -->
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.802146430349!2d59.6053351!3d42.4533038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41dd9a473e13d50f%3A0x633390c5211b4097!2sNukus%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1712415000000!5m2!1sen!2s" 
                            width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>
            </div>

            <!-- Footer: Global Socials -->
            <div class="bg-slate-950 pt-40 pb-20 px-6">
                <div class="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-24 mb-32">
                    <div class="lg:col-span-2 space-y-12">
                        <div class="flex items-center gap-6">
                            <div class="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                                <i data-lucide="graduation-cap" class="text-white w-12 h-12"></i>
                            </div>
                            <span class="text-5xl font-black text-white italic tracking-tighter">O'quv.uz</span>
                        </div>
                        <p class="text-slate-400 text-2xl font-medium leading-relaxed max-w-xl">
                            Nukus Professional ta'lim texnikumi — bilim va tajriba maskani. 
                            Biz bilan kelajagingizni bugun quring.
                        </p>
                    </div>
                    
                    <div class="space-y-12">
                        <h4 class="text-white text-xl font-black uppercase tracking-[0.3em]">Ijtimoiy Tarmoqlar</h4>
                        <div class="grid grid-cols-2 gap-6">
                             <a href="${d.telegram_link || '#'}" class="flex items-center gap-4 text-slate-400 hover:text-indigo-400 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <i data-lucide="send" class="w-6 h-6"></i>
                                </div>
                                Telegram
                             </a>
                             <a href="${d.instagram_link || '#'}" class="flex items-center gap-4 text-slate-400 hover:text-pink-400 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all">
                                    <i data-lucide="instagram" class="w-6 h-6"></i>
                                </div>
                                Instagram
                             </a>
                             <a href="${d.facebook_link || '#'}" class="flex items-center gap-4 text-slate-400 hover:text-blue-500 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <i data-lucide="facebook" class="w-6 h-6"></i>
                                </div>
                                Facebook
                             </a>
                             <a href="${d.youtube_link || '#'}" class="flex items-center gap-4 text-slate-400 hover:text-red-500 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                                    <i data-lucide="youtube" class="w-6 h-6"></i>
                                </div>
                                YouTube
                             </a>
                        </div>
                    </div>

                    <div class="space-y-12 text-white">
                         <h4 class="text-white text-xl font-black uppercase tracking-[0.3em]">Xizmatlar</h4>
                         <ul class="space-y-6 text-slate-400 font-bold">
                            <li><a href="#" class="hover:text-white transition-colors">Onlayn Ta'lim</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">Kutubxona</a></li>
                            <li><a href="#" class="hover:text-white transition-colors">Yordam Markazi</a></li>
                         </ul>
                    </div>
                </div>
                <div class="text-center pt-20 border-t border-white/5 text-slate-600 text-sm font-black uppercase tracking-[0.8em]">
                    © 2026 NUKUS PROFESSIONAL TA'LIM TEXNIKUMI PORTALI
                </div>
            </div>
        </div>
    `;
};"""

# 3. Update Admin Modal for Social Links
new_oLandingEdit = """window.oLandingEdit = () => {
    const d = LANDING_DATA || INITIAL_LANDING;
    const content = `
    <div class="p-10 space-y-8 max-h-[85vh] overflow-y-auto bg-white rounded-[3rem]">
        <div class="flex items-center justify-between">
            <h2 class="text-4xl font-black text-slate-800">Landing Sozlamalari</h2>
            <button onclick="document.getElementById('modal-root').classList.add('hidden')" class="p-2 hover:bg-slate-100 rounded-full">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
                <label class="text-xs font-black uppercase tracking-widest text-slate-400">Director Malumotlari</label>
                <input type="text" id="edit-d-name" value="${d.director_name || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Ism">
                <input type="text" id="edit-d-photo" value="${d.director_photo || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Foto URL">
                <input type="text" id="edit-d-title" value="${d.director_title || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Lavozimi">
            </div>
            
            <div class="space-y-4">
                <label class="text-xs font-black uppercase tracking-widest text-slate-400">Ijtimoiy Tarmoqlar</label>
                <input type="text" id="edit-tg" value="${d.telegram_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Telegram Link">
                <input type="text" id="edit-insta" value="${d.instagram_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Instagram Link">
                <input type="text" id="edit-fb" value="${d.facebook_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Facebook Link">
                <input type="text" id="edit-yt" value="${d.youtube_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="YouTube Link">
            </div>
        </div>

        <div class="space-y-4">
            <label class="text-xs font-black uppercase tracking-widest text-slate-400">Ko'rsatkichlar & Ustozlar (JSON)</label>
            <textarea id="edit-indicators" class="w-full h-32 bg-slate-50 p-6 rounded-2xl border-none font-mono text-xs">${JSON.stringify(d.indicators || [], null, 2)}</textarea>
            <textarea id="edit-teachers" class="w-full h-40 bg-slate-50 p-6 rounded-2xl border-none font-mono text-xs">${JSON.stringify(d.best_teachers || [], null, 2)}</textarea>
        </div>
        
        <button onclick="saveLandingChanges()" class="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-600/30 hover:bg-slate-900 transition-all">
            Hamma O'zgarishlarni Saqlash
        </button>
    </div>`;
    document.getElementById('modal-content-area').innerHTML = content;
    document.getElementById('modal-root').classList.replace('hidden', 'flex');
    safeLucide(document.getElementById('modal-root'));
};"""

# 4. Update saveLandingChanges for new fields
new_saveLandingChanges = """window.saveLandingChanges = () => {
    try {
        const teachers = JSON.parse(document.getElementById('edit-teachers').value);
        const indicators = JSON.parse(document.getElementById('edit-indicators').value);
        const data = {
            ...LANDING_DATA,
            director_name: document.getElementById('edit-d-name').value,
            director_photo: document.getElementById('edit-d-photo').value,
            director_title: document.getElementById('edit-d-title').value,
            telegram_link: document.getElementById('edit-tg').value,
            instagram_link: document.getElementById('edit-insta').value,
            facebook_link: document.getElementById('edit-fb').value,
            youtube_link: document.getElementById('edit-yt').value,
            best_teachers: teachers,
            indicators: indicators
        };
        saveLandingData(data);
        document.getElementById('modal-root').classList.add('hidden');
    } catch (e) { alert("JSON farmati xato!"); }
};"""

# Replacement Logic
content = re.sub(r"const INITIAL_LANDING = \{[\s\S]*?\};", new_initial, content)
content = re.sub(r"const v_home = \(\) => \{[\s\S]*?return `[\s\S]*?`;\s*?\};", new_v_home, content)
content = re.sub(r"window\.oLandingEdit = \(\) => \{[\s\S]*?safeLucide\(document\.getElementById\('modal-root'\)\);\s*\};", new_oLandingEdit, content)
content = re.sub(r"window\.saveLandingChanges = \(\) => \{[\s\S]*?alert\(\"JSON xato!\"\);\s*\}\s*;", new_saveLandingChanges, content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Cinematic Redesign Complete: Massive fonts, Real Map, and Social controls added.")
