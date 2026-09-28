import { api_get, api_patch } from './api.js';
import { safeLucide, showToast, openModal } from './ui.js';

const INITIAL_LANDING = {
    director_name: "Erko",
    director_photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwwz5HpQmffG_Lq0QO6FtRIUxnWg7U8X9pNA&s",
    director_title: "Texnikum Rahbari",
    telegram_link: "https://t.me/your_telegram",
    instagram_link: "https://instagram.com/",
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
};

let LANDING_DATA = INITIAL_LANDING;

async function syncLandingData() {
    try {
        const data = await api_get('/landing');
        LANDING_DATA = data;
        if (window.STATE?.view === 'home') renderLanding();
    } catch (e) {}
}

function renderLanding() {
    const d = LANDING_DATA || INITIAL_LANDING;
    const teachers = d.best_teachers || INITIAL_LANDING.best_teachers;
    const indicators = d.indicators || INITIAL_LANDING.indicators;

    return `
        <div class="w-full relative overflow-hidden bg-white min-h-screen">
            <div class="floating-blob top-[-200px] left-[-200px] w-[400px] md:w-[800px] h-[400px] md:h-[800px]"></div>
            <div class="floating-blob bottom-[-200px] right-[-200px] w-[400px] md:w-[800px] h-[400px] md:h-[800px]" style="animation-delay: -10s;"></div>

            <div class="landing-hero max-w-[1600px] mx-auto pt-20 md:pt-32 pb-16 md:pb-24 px-4 md:px-12 relative z-10">
                <div class="landing-hero-inner hero-glass rounded-[2rem] md:rounded-[5rem] p-6 md:p-32 text-center space-y-6 md:space-y-12 animate-fade border-0 shadow-[0_30px_60px_-20px_rgba(99,102,241,0.15)]">
                    <div class="inline-flex items-center gap-2 md:gap-3 px-4 md:px-8 py-2 md:py-3 bg-indigo-600 text-white rounded-full text-[10px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-lg shadow-indigo-600/30">
                         🏛️ PROF TA'LIM TEXNIKUMI
                    </div>
                    <h1 class="landing-title text-3xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] md:leading-[0.9] tracking-tighter">
                        Innovatsion <br><span class="text-gradient">Kelajak</span> <br>Maskani
                    </h1>
                    <p class="landing-subtitle text-slate-500 text-sm md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Nukus shahridagi eng yirik texnologik va professional bilim dargohi. Biz bilan zamonaviy kasblarni egallang.
                    </p>
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 pt-6 md:pt-12">
                        <button onclick="window.location.hash='login'" class="landing-cta w-full sm:w-auto bg-indigo-600 text-white px-8 md:px-16 py-4 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-lg md:text-2xl shadow-xl md:shadow-2xl shadow-indigo-600/40 hover:bg-slate-900 transition-all transform hover:-translate-y-1 md:hover:-translate-y-2 flex items-center justify-center gap-3 md:gap-4">
                            Portalga Kirish <i data-lucide="arrow-right" class="w-5 h-5 md:w-8 md:h-8"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="landing-section max-w-[1400px] mx-auto px-4 md:px-6 py-16 md:py-24">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-16">
                    ${indicators.map((ind, i) => `
                    <div class="landing-card portal-card p-8 md:p-16 text-center space-y-4 md:space-y-6 opacity-0 animate-slide-up border-slate-100" style="animation-delay: ${i * 0.1}s">
                        <div class="landing-stat-icon w-16 md:w-24 h-16 md:h-24 bg-slate-50 text-indigo-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto shadow-xl transition-all duration-500">
                             <i data-lucide="${ind.icon || 'star'}" class="w-8 h-8 md:w-12 md:h-12"></i>
                        </div>
                        <div class="landing-stat-count text-3xl md:text-5xl font-black text-slate-800 tabular-nums">${ind.count}</div>
                        <div class="text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">${ind.label}</div>
                    </div>`).join('')}
                </div>
            </div>

            <div class="landing-section max-w-[1600px] mx-auto px-4 md:px-6 py-20 md:py-40">
                 <div class="flex flex-col lg:flex-row items-center gap-12 md:gap-24">
                    <div class="w-full lg:w-1/2 group relative">
                        <div class="absolute inset-0 bg-indigo-600/10 rounded-[2rem] md:rounded-[5rem] rotate-3 md:rotate-6 group-hover:rotate-6 md:group-hover:rotate-12 transition-transform duration-1000"></div>
                        <div class="relative aspect-square overflow-hidden rounded-[2rem] md:rounded-[5rem] border-[8px] md:border-[16px] border-white shadow-2xl">
                            <img src="${d.director_photo || INITIAL_LANDING.director_photo}" class="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="${d.director_name}">
                        </div>
                    </div>
                    <div class="w-full lg:w-1/2 space-y-6 md:space-y-8">
                        <div class="space-y-3 md:space-y-4">
                            <span class="text-indigo-600 font-black tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] uppercase px-3 md:px-4 py-1 md:py-1.5 bg-indigo-50 rounded-lg md:rounded-xl">Platforma Rahbari</span>
                            <h2 class="text-3xl md:text-7xl font-black text-slate-900 leading-tight md:leading-none tracking-tighter">${d.director_name || INITIAL_LANDING.director_name}</h2>
                            <p class="text-indigo-400 font-black text-base md:text-xl uppercase tracking-widest">${d.director_title || INITIAL_LANDING.director_title}</p>
                        </div>
                        <p class="text-slate-600 text-base md:text-2xl leading-relaxed md:leading-snug italic font-medium border-l-[4px] md:border-l-[8px] border-indigo-600 pl-4 md:pl-8 py-2">
                            "Bizning maqsadimiz — Nukus yoshlarini jahon andozalari darajasidagi kadrlar qilib yetishtirishdir."
                        </p>
                    </div>
                 </div>
            </div>

            <div class="bg-slate-50 py-20 md:py-40 px-4 md:px-6">
                <div class="max-w-[1400px] mx-auto mb-12 md:mb-24">
                    <h2 class="text-3xl md:text-6xl font-black text-slate-900">Eng Yaxshi <span class="text-indigo-600">Ustozlar</span></h2>
                </div>
                <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-16">
                    ${teachers.map((t, i) => `
                    <div class="portal-card group overflow-hidden opacity-0 animate-slide-up bg-white" style="animation-delay: ${i * 0.15}s">
                         <div class="relative h-[300px] md:h-[450px]">
                            <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" alt="${t.name}">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent p-4 md:p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <span class="text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1 md:mb-2">Mutaxassis Mentor</span>
                                <h3 class="text-white text-xl md:text-3xl font-black leading-tight mb-2 md:mb-3">${t.name}</h3>
                                <div class="w-8 md:w-12 h-0.5 md:h-1 bg-indigo-500 mb-2 md:mb-4"></div>
                                <p class="text-white/70 text-sm md:text-base font-medium">${t.title || 'Dars berish metodikasi'}</p>
                            </div>
                         </div>
                    </div>`).join('')}
                </div>
            </div>

            <div class="landing-section max-w-[1600px] mx-auto px-4 md:px-6 py-20 md:py-40">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
                    <div class="space-y-10 md:space-y-16">
                        <div class="space-y-4 md:space-y-6">
                            <h2 class="text-3xl md:text-6xl font-black text-slate-900">Bizning <span class="text-indigo-600">Manzil</span></h2>
                            <p class="text-slate-500 text-base md:text-xl font-medium">Sizni Nukus shahridagi zamonaviy kampusimizda kutib qolamiz.</p>
                        </div>
                        <div class="space-y-6 md:space-y-12">
                            <div class="flex items-center gap-4 md:gap-8 group">
                                <div class="w-14 h-14 md:w-20 md:h-20 bg-indigo-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                                    <i data-lucide="map-pin" class="w-6 h-6 md:w-10 md:h-10"></i>
                                </div>
                                <div class="space-y-0.5 md:space-y-1">
                                    <h4 class="text-slate-400 font-black uppercase tracking-widest text-[10px] md:text-sm">Joylashuv</h4>
                                    <p class="text-lg md:text-3xl font-black text-slate-800">Nukus sh., E.Alako'z ko'chasi, 162</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 md:gap-8 group">
                                <div class="w-14 h-14 md:w-20 md:h-20 bg-slate-900 text-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                                    <i data-lucide="phone" class="w-6 h-6 md:w-10 md:h-10"></i>
                                </div>
                                <div class="space-y-0.5 md:space-y-1">
                                    <h4 class="text-slate-400 font-black uppercase tracking-widest text-[10px] md:text-sm">Bog'lanish</h4>
                                    <p class="text-lg md:text-3xl font-black text-slate-800">+998 61 222 33 44</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="relative h-[300px] md:h-[600px] rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl border-[6px] md:border-[12px] border-white">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.802146430349!2d59.6053351!3d42.4533038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41dd9a473e13d50f%3A0x633390c5211b4097!2sNukus%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1712415000000!5m2!1sen!2s" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>
            </div>

            <div class="bg-slate-950 pt-20 md:pt-40 pb-16 md:pb-20 px-4 md:px-6">
                <div class="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12 md:gap-24 mb-20 md:mb-32">
                    <div class="lg:col-span-2 space-y-6 md:space-y-12">
                        <div class="flex items-center gap-4 md:gap-6">
                            <div class="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl">
                                <i data-lucide="graduation-cap" class="text-white w-7 h-7 md:w-10 md:h-10"></i>
                            </div>
                            <span class="text-2xl md:text-4xl font-black text-white italic tracking-tighter">O'quv.uz</span>
                        </div>
                        <p class="text-slate-400 text-base md:text-2xl font-medium leading-relaxed max-w-xl">Nukus Professional ta'lim texnikumi — bilim va tajriba maskani. Biz bilan kelajagingizni bugun quring.</p>
                    </div>
                    <div class="space-y-6 md:space-y-12">
                        <h4 class="text-white text-base md:text-xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Ijtimoiy Tarmoqlar</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-10">
                             <a href="${d.telegram_link || '#'}" target="_blank" class="flex items-center gap-4 md:gap-6 text-slate-400 hover:text-white font-black tracking-widest transition-all group">
                                <div class="w-14 h-14 md:w-20 md:h-20 bg-[#229ED9]/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center group-hover:bg-[#229ED9] group-hover:shadow-[0_20px_50px_rgba(34,158,217,0.4)] transition-all duration-500">
                                    <svg viewBox="0 0 24 24" class="w-6 h-6 md:w-10 md:h-10 fill-current"><path d="M11.944 0C5.352 0 0 5.352 0 11.944c0 6.592 5.352 11.944 11.944 11.944 6.592 0 11.944-5.352 11.944-11.944C23.888 5.352 18.536 0 11.944 0zm5.836 8.358l-1.954 9.222c-.15.68-.553.847-1.123.527l-2.977-2.195-1.436 1.382c-.159.159-.292.292-.598.292l.213-3.023 5.5-4.966c.239-.213-.052-.331-.371-.119L8.341 14.1l-2.929-.916c-.637-.199-.649-.637.133-.943l11.455-4.417c.531-.194.996.124.81.94l-.034-.406z"/></svg>
                                </div>
                                <span class="text-xs md:text-base">TELEGRAM</span>
                             </a>
                             <a href="${d.instagram_link || '#'}" target="_blank" class="flex items-center gap-4 md:gap-6 text-slate-400 hover:text-white font-black tracking-widest transition-all group">
                                <div class="w-14 h-14 md:w-20 md:h-20 bg-[#E4405F]/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center group-hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] group-hover:shadow-[0_20px_50px_rgba(238,42,123,0.4)] transition-all duration-500">
                                    <svg viewBox="0 0 24 24" class="w-6 h-6 md:w-10 md:h-10 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.267-.07-1.646-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                </div>
                                <span class="text-xs md:text-base">INSTAGRAM</span>
                             </a>
                             <a href="${d.youtube_link || '#'}" target="_blank" class="flex items-center gap-4 md:gap-6 text-slate-400 hover:text-white font-black tracking-widest transition-all group">
                                <div class="w-14 h-14 md:w-20 md:h-20 bg-[#FF0000]/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center group-hover:bg-[#FF0000] group-hover:shadow-[0_20px_50px_rgba(255,0,0,0.4)] transition-all duration-500">
                                    <svg viewBox="0 0 24 24" class="w-6 h-6 md:w-10 md:h-10 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                </div>
                                <span class="text-xs md:text-base">YOUTUBE</span>
                             </a>
                        </div>
                    </div>
                    <div class="space-y-6 md:space-y-12 text-white">
                         <h4 class="text-white text-base md:text-xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Xizmatlar</h4>
                         <ul class="space-y-4 md:space-y-6 text-slate-400 font-bold">
                            <li><a href="#" class="hover:text-white transition-colors text-sm md:text-base">Onlayn Ta'lim</a></li>
                            <li><a href="#" class="hover:text-white transition-colors text-sm md:text-base">Kutubxona</a></li>
                            <li><a href="#" class="hover:text-white transition-colors text-sm md:text-base">Yordam Markazi</a></li>
                         </ul>
                    </div>
                </div>
                <div class="text-center pt-12 md:pt-20 border-t border-white/5 text-slate-600 text-[10px] md:text-sm font-black uppercase tracking-[0.4em] md:tracking-[0.8em]">
                    © 2026 NUKUS PROFESSIONAL TA'LIM TEXNIKUMI PORTALI
                </div>
            </div>
        </div>
    `;
}

function openLandingEditor() {
    const d = LANDING_DATA || INITIAL_LANDING;
    const html = `
    <div class="p-6 md:p-10 space-y-6 max-h-[85vh] overflow-y-auto bg-white rounded-[2rem] md:rounded-[3rem]">
        <div class="flex items-center justify-between">
            <h2 class="text-2xl md:text-4xl font-black text-slate-800">Landing Sozlamalari</h2>
            <button onclick="window.cModal()" class="p-2 hover:bg-slate-100 rounded-full">
                <i data-lucide="x" class="w-5 h-5 md:w-6 md:h-6"></i>
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Director Malumotlari</label>
                <input type="text" id="edit-d-name" value="${d.director_name || ''}" class="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm" placeholder="Ism">
                <input type="text" id="edit-d-photo" value="${d.director_photo || ''}" class="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm" placeholder="Foto URL">
                <input type="text" id="edit-d-title" value="${d.director_title || ''}" class="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm" placeholder="Lavozimi">
            </div>
            <div class="space-y-4">
                <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ijtimoiy Tarmoqlar</label>
                <input type="text" id="edit-tg" value="${d.telegram_link || ''}" class="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm" placeholder="Telegram Link">
                <input type="text" id="edit-insta" value="${d.instagram_link || ''}" class="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm" placeholder="Instagram Link">
                <input type="text" id="edit-yt" value="${d.youtube_link || ''}" class="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm" placeholder="YouTube Link">
            </div>
        </div>
        <div class="space-y-4">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Ko'rsatkichlar & Ustozlar (JSON)</label>
            <textarea id="edit-indicators" class="w-full h-24 bg-slate-50 p-4 rounded-2xl border-none font-mono text-xs">${JSON.stringify(d.indicators || [], null, 2)}</textarea>
            <textarea id="edit-teachers" class="w-full h-32 bg-slate-50 p-4 rounded-2xl border-none font-mono text-xs">${JSON.stringify(d.best_teachers || [], null, 2)}</textarea>
        </div>
        <button onclick="window.saveLandingSettings()" class="w-full bg-indigo-600 text-white py-4 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-600/30 hover:bg-slate-900 transition-all">
            Hamma O'zgarishlarni Saqlash
        </button>
    </div>`;
    openModal(html);
}

async function saveLandingSettings() {
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
            youtube_link: document.getElementById('edit-yt').value,
            best_teachers: teachers,
            indicators: indicators
        };
        LANDING_DATA = data;
        await api_patch('/landing', data);
        showToast("Landing sahifasi yangilandi!");
        cModal();
        if (window.STATE?.view === 'home') renderLanding();
    } catch (e) { showToast("Xatolik: " + e.message, "error"); }
}

export { renderLanding, syncLandingData, LANDING_DATA, INITIAL_LANDING, openLandingEditor, saveLandingSettings };
