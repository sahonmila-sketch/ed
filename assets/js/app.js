// SHARED GLOBAL STATE
let STATE = { user: null, view: 'login', activeTicketId: null, activeCourseId: null };

// LANDING SYSTEM

const INITIAL_LANDING = {
    director_name: "Erko",
    director_photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwwz5HpQmffG_Lq0QO6FtRIUxnWg7U8X9pNA&s",
    director_title: "Texnikum Rahbari",
    telegram_link: "https://t.me/your_telegram", // SHU YERGA TELEGRAM SIZNIKINI QOYING
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
                    <h1 class="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                        Innovatsion <br><span class="text-gradient">Kelajak</span> <br>Maskani
                    </h1>
                    <p class="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                        Nukus shahridagi eng yirik texnologik va professional bilim dargohi. 
                        Biz bilan zamonaviy kasblarni egallang.
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
                        <div class="text-5xl font-black text-slate-800 tabular-nums">${ind.count}</div>
                        <div class="text-indigo-400 font-black uppercase tracking-[0.2em] text-xs">${ind.label}</div>
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
                    <div class="w-full lg:w-1/2 space-y-8">
                        <div class="space-y-4">
                            <span class="text-indigo-600 font-black tracking-[0.3em] text-[10px] uppercase px-4 py-1.5 bg-indigo-50 rounded-xl">Platforma Rahbari</span>
                            <h2 class="text-5xl md:text-7xl font-black text-slate-900 leading-none tracking-tighter">${d.director_name || INITIAL_LANDING.director_name}</h2>
                            <p class="text-indigo-400 font-black text-xl uppercase tracking-widest">${d.director_title || INITIAL_LANDING.director_title}</p>
                        </div>
                        <p class="text-slate-600 text-xl md:text-2xl leading-snug italic font-medium border-l-[8px] border-indigo-600 pl-8 py-2">
                            "Bizning maqsadimiz — Nukus yoshlarini jahon andozalari darajasidagi kadrlar qilib yetishtirishdir."
                        </p>
                    </div>
                 </div>
            </div>

            <!-- Teachers: Luxury Grid -->
            <div class="bg-slate-50 py-40 px-6">
                <div class="max-w-[1400px] mx-auto mb-24 flex items-center justify-between">
                    <h2 class="text-6xl font-black text-slate-900">Eng Yaxshi <span class="text-indigo-600">Ustozlar</span></h2>
                </div>
                <div class="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
                    ${teachers.map((t, i) => `
                    <div class="portal-card group overflow-hidden opacity-0 animate-slide-up bg-white" style="animation-delay: ${i * 0.15}s">
                         <div class="relative h-[450px]">
                            <img src="${t.photo || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]">
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent p-8 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <span class="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Mutaxassis Mentor</span>
                                <h3 class="text-white text-3xl font-black leading-tight mb-3">${t.name}</h3>
                                <div class="w-12 h-1 bg-indigo-500 mb-4"></div>
                                <p class="text-white/70 text-base font-medium">${t.title || 'Dars berish metodikasi'}</p>
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
                            <h2 class="text-5xl md:text-6xl font-black text-slate-900">Bizning <span class="text-indigo-600">Manzil</span></h2>
                            <p class="text-slate-500 text-xl font-medium">Sizni Nukus shahridagi zamonaviy kampusimizda kutib qolamiz.</p>
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
                            <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                                <i data-lucide="graduation-cap" class="text-white w-10 h-10"></i>
                            </div>
                            <span class="text-4xl font-black text-white italic tracking-tighter">O'quv.uz</span>
                        </div>
                        <p class="text-slate-400 text-2xl font-medium leading-relaxed max-w-xl">
                            Nukus Professional ta'lim texnikumi — bilim va tajriba maskani. 
                            Biz bilan kelajagingizni bugun quring.
                        </p>
                    </div>
                    
                    <div class="space-y-12">
                        <h4 class="text-white text-xl font-black uppercase tracking-[0.3em]">Ijtimoiy Tarmoqlar</h4>
                                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
                             <!-- Telegram: The Real Look -->
                             <a href="${d.telegram_link || '#'}" target="_blank" class="flex items-center gap-6 text-slate-400 hover:text-white font-black tracking-widest transition-all group">
                                <div class="w-20 h-20 bg-[#229ED9]/10 rounded-[2rem] flex items-center justify-center group-hover:bg-[#229ED9] group-hover:shadow-[0_20px_50px_rgba(34,158,217,0.4)] transition-all duration-500">
                                    <svg viewBox="0 0 24 24" class="w-10 h-10 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0C5.352 0 0 5.352 0 11.944c0 6.592 5.352 11.944 11.944 11.944 6.592 0 11.944-5.352 11.944-11.944C23.888 5.352 18.536 0 11.944 0zm5.836 8.358l-1.954 9.222c-.15.68-.553.847-1.123.527l-2.977-2.195-1.436 1.382c-.159.159-.292.292-.598.292l.213-3.023 5.5-4.966c.239-.213-.052-.331-.371-.119L8.341 14.1l-2.929-.916c-.637-.199-.649-.637.133-.943l11.455-4.417c.531-.194.996.124.81.94l-.034-.406z"/></svg>
                                </div>
                                TELEGRAM
                             </a>

                             <!-- Instagram: The Cinematic Mesh -->
                             <a href="${d.instagram_link || '#'}" target="_blank" class="flex items-center gap-6 text-slate-400 hover:text-white font-black tracking-widest transition-all group">
                                <div class="w-20 h-20 bg-[#E4405F]/10 rounded-[2rem] flex items-center justify-center group-hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] group-hover:shadow-[0_20px_50px_rgba(238,42,123,0.4)] transition-all duration-500">
                                    <svg viewBox="0 0 24 24" class="w-10 h-10 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.267-.07-1.646-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                </div>
                                INSTAGRAM
                             </a>

                             <!-- YouTube: The Red Power -->
                             <a href="${d.youtube_link || '#'}" target="_blank" class="flex items-center gap-6 text-slate-400 hover:text-white font-black tracking-widest transition-all group">
                                <div class="w-20 h-20 bg-[#FF0000]/10 rounded-[2rem] flex items-center justify-center group-hover:bg-[#FF0000] group-hover:shadow-[0_20px_50px_rgba(255,0,0,0.4)] transition-all duration-500">
                                    <svg viewBox="0 0 24 24" class="w-10 h-10 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                </div>
                                YOUTUBE
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
};

window.oLandingEdit = () => {
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
                <input type="text" id="edit-yt" value="${d.youtube_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="YouTube Link (Facebook olib tashlandi)">
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


const DEFAULT_DB = {
    users: [
        { id: 1, email: 'talaba@lms.uz', password: '123', ism: 'Ali Valiyev', role: 'student', points: 1250, avatar: null, achievements: ['first_lesson'], progress: { 1: { completed: [1], percent: 100 } }, groupId: 1 },
        { id: 2, email: 'ustoz@lms.uz', password: '123', ism: 'Ustoz Anvar', role: 'ustoz', points: 0, avatar: null, groupId: 1 },
        { id: 3, email: 'admin@lms.uz', password: '123', ism: 'Asosiy Admin', role: 'admin', points: 0, avatar: null },
        { id: 4, email: 'tech@lms.uz', password: '123', ism: 'Tech Admin', role: 'tech_admin', points: 0, avatar: null },
        { id: 5, email: 'director@lms.uz', password: '123', ism: 'Director Xon', role: 'director', points: 0, avatar: null }
    ],
    tickets: [
        { id: 101, user_id: 1, user_name: 'Ali Valiyev', message: 'Tizimga kirishda xato bor', status: 'Ochiq', replies: [] }
    ],
    posts: [
        { id: 1, text: 'Xush kelibsiz', authorId: 2, approved: true, likes: 24, liked_users: [] }
    ],
    courses: [
        { 
            id: 1, 
            title: 'JavaScript Asoslari', 
            description: 'JavaScript dasturlash tili bo\'yicha to\'liq kurs.', 
            authorId: 2, 
            category: 'Dasturlash', 
            status: 'Ochiq',
            lessons: [
                { id: 1, courseId: 1, title: 'Kirish', topic: 'JavaScript Kirish', content: 'Dasturlash nima?', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
            ]
        }
    ],
    books: [
        { id: 1, title: 'Clean Code', description: 'Robert C. Martin tomonidan yozilgan dasturlash odobi haqida kitob.', image: 'https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg', link: '#' },
        { id: 2, title: 'JavaScript: The Good Parts', description: 'JavaScriptning eng yaxshi qismlari haqida qo\'llanma.', image: 'https://images-na.ssl-images-amazon.com/images/I/5131OWtQRaL._SX381_BO1,204,203,200_.jpg', link: '#' }
    ],
    achievements: [
        { id: 'first_lesson', title: 'Boshlovchi', icon: '🌱', rarity: 'common', desc: 'Birinchi darsni yakunladingiz' },
        { id: 'active_5', title: 'Faol talaba', icon: '🔥', rarity: 'rare', desc: '5 ta darsni muvaffaqiyatli yakunladingiz' },
        { id: 'attendance_7', title: 'Intizomli', icon: '📅', rarity: 'epic', desc: '7 kunlik mukammal davomat' },
        { id: 'top_points', title: 'Top student', icon: '👑', rarity: 'epic', desc: 'Yuqori natija va ko\'p ballar' },
        { id: 'legend', title: 'Afsona', icon: '💎', rarity: 'legendary', desc: 'Platformadagi eng yuqori daraja' }
    ],
    settings: {
        platformName: "O'quv.uz",
        allowRegistration: true
    },
    groups: [
        { id: 1, name: 'D 02 25', ustozId: 2, studentIds: [1], schedule: [] },
        { id: 2, name: 'A 01 24', ustozId: 2, studentIds: [], schedule: [] }
    ],
    attendance: [
        { id: 1, groupId: 1, date: '2026-03-20', records: { 1: 'present' } },
        { id: 2, groupId: 1, date: '2026-03-21', records: { 1: 'absent' } }
    ],
    tournaments: [],
    chatMessages: [
        { id: 1, groupId: 1, userId: 2, userName: 'Ustoz Anvar', text: 'Assalomu alaykum, darsga tayyormisizlar?', time: '10:00', type: 'text' },
        { id: 2, groupId: 1, userId: 1, userName: 'Ali Valiyev', text: 'Va alaykum assalom, ha ustoz!', time: '10:05', type: 'text' }
    ],
    notifications: [],
    questions: [
        { id: 1, questionText: "2 + 2 * 2 = ?", optionA: "6", optionB: "8", optionC: "4", optionD: "10", correctAnswer: "A", type: "duel", difficulty: "medium" },
        { id: 2, questionText: "'1' + 1 JavaScriptda natijasi qanday?", optionA: "2", optionB: "11", optionC: "NaN", optionD: "Error", correctAnswer: "B", type: "duel", difficulty: "easy" },
        { id: 3, questionText: "typeof null nima qaytaradi?", optionA: "null", optionB: "object", optionC: "undefined", optionD: "boolean", correctAnswer: "B", type: "mini_game", difficulty: "medium" },
        { id: 4, questionText: "0.1 + 0.2 === 0.3 ?", optionA: "true", optionB: "false", optionC: "undefined", optionD: "NaN", correctAnswer: "B", type: "mini_game", difficulty: "hard" },
        { id: 5, questionText: "HTML da 'href' atributi qaysi tegda ishlatiladi?", optionA: "<img>", optionB: "<a>", optionC: "<div>", optionD: "<span>", correctAnswer: "B", type: "mini_game", difficulty: "easy" }
    ]
};

const getDB = () => JSON.parse(localStorage.getItem('lms_db') || JSON.stringify(DEFAULT_DB));
let isSyncing = false;
const saveDB = (db) => {
    localStorage.setItem('lms_db', JSON.stringify(db));
    if(!isSyncing) {
        fetch('/api/sync_db', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(db)
        }).catch(console.warn);
    }
};

const API_BASE = '/api';





// ======================== MULTILINGUAL SYSTEM ========================
const TRANSLATIONS = {
    uz: {
        dashboard: "Boshqaruv", courses: "Kurslar", posts: "Postlar", support: "Yordam",
        profile: "Profil", chat: "Guruh Chat", leaderboard: "Reyting", library: "Kutubxona",
        duel: "Duel 1vs1", game: "Mini O'yin", attendance: "Davomat", users: "Foydalanuvchilar",
        groups: "Guruhlar", questions: "Savollar", analytics: "Analitika", notifications: "Bildirishnomalar",
        logout: "Chiqish", student: "Talaba", ustoz: "Ustoz", admin: "Admin",
        tech_admin: "Tex Admin", director: "Direktor", schedule: "Jadval",
        today: "Bugun", present: "Keldi", absent: "Kelmadi",
        timerMsg: "20 daqiqa to'liq kuting — XP beriladi!",
        timerDone: "XP berildi! 🎉", timerPaused: "Tab o'zgardi — taymer to'xtatildi!",
        langLabel: "Til:"
    },
    ru: {
        dashboard: "Панель", courses: "Курсы", posts: "Посты", support: "Поддержка",
        profile: "Профиль", chat: "Чат группы", leaderboard: "Рейтинг", library: "Библиотека",
        duel: "Дуэль 1vs1", game: "Мини игра", attendance: "Посещаемость", users: "Пользователи",
        groups: "Группы", questions: "Вопросы", analytics: "Аналитика", notifications: "Уведомления",
        logout: "Выход", student: "Студент", ustoz: "Учитель", admin: "Администратор",
        tech_admin: "Тех Админ", director: "Директор", schedule: "Расписание",
        today: "Сегодня", present: "Присутствует", absent: "Отсутствует",
        timerMsg: "Подождите 20 минут — начислятся XP!",
        timerDone: "XP начислены! 🎉", timerPaused: "Вкладка изменена — таймер остановлен!",
        langLabel: "Язык:"
    }
};
let CURRENT_LANG = localStorage.getItem('lms_lang') || 'uz';
const t = (key) => (TRANSLATIONS[CURRENT_LANG] || TRANSLATIONS.uz)[key] || key;
window.switchLang = (lang) => {
    CURRENT_LANG = lang;
    localStorage.setItem('lms_lang', lang);
    renderSidebar();
    if (STATE.view) renderView(STATE.view);
};

// ======================== 20-MIN LESSON TIMER ========================
let LESSON_TIMER_INTERVAL = null;
let LESSON_TIMER_SEC = 0;
let LESSON_TIMER_ACTIVE = false;
let LESSON_TIMER_LESSON_ID = null;

function startLessonTimer(lessonId) {
    if (LESSON_TIMER_INTERVAL) clearInterval(LESSON_TIMER_INTERVAL);
    LESSON_TIMER_SEC = 0;
    LESSON_TIMER_ACTIVE = true;
    LESSON_TIMER_LESSON_ID = lessonId;
    updateLessonTimerUI();
    LESSON_TIMER_INTERVAL = setInterval(() => {
        if (!LESSON_TIMER_ACTIVE) return;
        LESSON_TIMER_SEC++;
        updateLessonTimerUI();
        if (LESSON_TIMER_SEC >= 1200) { // 20 minutes = 1200 seconds
            clearInterval(LESSON_TIMER_INTERVAL);
            LESSON_TIMER_ACTIVE = false;
            // Grant XP
            addPoints(15, "20 daqiqa dars o'qildi", "lessons");
            const timerEl = document.getElementById('lesson-timer-box');
            if (timerEl) {
                timerEl.className = 'lesson-timer-box done';
                timerEl.innerHTML = `<span class="timer-icon">✅</span><span>${t('timerDone')}</span>`;
            }
        }
    }, 1000);
}

function stopLessonTimer() {
    LESSON_TIMER_ACTIVE = false;
    if (LESSON_TIMER_INTERVAL) clearInterval(LESSON_TIMER_INTERVAL);
    LESSON_TIMER_SEC = 0;
    LESSON_TIMER_LESSON_ID = null;
}

function pauseLessonTimer() {
    if (!LESSON_TIMER_ACTIVE) return;
    LESSON_TIMER_ACTIVE = false;
    LESSON_TIMER_SEC = 0; // Reset on tab switch!
    updateLessonTimerUI();
    showToast(t('timerPaused'), 'error');
}

function updateLessonTimerUI() {
    const el = document.getElementById('lesson-timer-box');
    if (!el) return;
    const mins = Math.floor(LESSON_TIMER_SEC / 60);
    const secs = LESSON_TIMER_SEC % 60;
    const percent = Math.min(100, Math.round((LESSON_TIMER_SEC / 1200) * 100));
    el.innerHTML = `
        <div class="timer-ring-wrap">
            <svg viewBox="0 0 44 44" class="timer-ring">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#e0e7ff" stroke-width="4"/>
                <circle cx="22" cy="22" r="18" fill="none" stroke="#4f46e5" stroke-width="4"
                    stroke-dasharray="113" stroke-dashoffset="${113 - (113 * percent / 100)}"
                    stroke-linecap="round" style="transition:stroke-dashoffset 1s linear;transform:rotate(-90deg);transform-origin:center"/>
            </svg>
            <span class="timer-text">${mins}:${secs.toString().padStart(2,'0')}</span>
        </div>
        <div class="timer-msg">${t('timerMsg')} <b>${percent}%</b></div>
    `;
}

// Tab visibility control for lesson timer
document.addEventListener('visibilitychange', () => {
    if (document.hidden && LESSON_TIMER_ACTIVE) {
        pauseLessonTimer();
    }
});
window.addEventListener('blur', () => {
    if (LESSON_TIMER_ACTIVE) pauseLessonTimer();
});

const syncBackend = async () => {
    try {
        isSyncing = true;
        const res = await fetch(`${API_BASE}/db`);
        if(res.ok) {
            const serverDb = await res.json();
            if(serverDb && serverDb.users) {
                const oldDbString = localStorage.getItem('lms_db');
                const newDbString = JSON.stringify(serverDb);
                
                if (oldDbString !== newDbString) {
                    const localUser = JSON.parse(localStorage.getItem('lms_user'));
                    if (localUser && serverDb.users) {
                        const latestUser = serverDb.users.find(u => u.id === localUser.id);
                        if (latestUser) {
                            localStorage.setItem('lms_user', JSON.stringify(latestUser));
                            STATE.user = latestUser;
                        }
                    }
                    localStorage.setItem('lms_db', newDbString);
                    
                    const activeTag = document.activeElement ? document.activeElement.tagName : '';
                    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);
                    
                    if (!isTyping && ['posts', 'courses', 'course-detail', 'schedule', 'student-dashboard', 'ustoz-dashboard', 'admin-dashboard', 'chat'].includes(STATE.view)) {
                        renderView(STATE.view);
                    }
                }
            }
        }
    } catch(err) {
        console.warn("Backend sync failed:", err);
    } finally {
        isSyncing = false;
    }
};








document.addEventListener('DOMContentLoaded', () => {
    // Migration: ensure database has all required keys if coming from older version
    let db = getDB();
    let updated = false;
    
    if (!db.groups) { db.groups = DEFAULT_DB.groups; updated = true; }
    if (!db.attendance) { db.attendance = DEFAULT_DB.attendance; updated = true; }
    if (!db.chatMessages) { db.chatMessages = DEFAULT_DB.chatMessages; updated = true; }
    if (!db.books) { db.books = DEFAULT_DB.books; updated = true; }
    if (!db.questions) { db.questions = DEFAULT_DB.questions; updated = true; }
    if (!db.staffChatMessages) { db.staffChatMessages = []; updated = true; }
    
    db.users.forEach(u => {
        if (u.id === 1 && !u.groupId) { u.groupId = 1; updated = true; }
        if (u.id === 2 && !u.groupId) { u.groupId = 1; updated = true; }
    });
    
    if (updated) saveDB(db);
    
    STATE.user = JSON.parse(localStorage.getItem('lms_user'));
    // Update active session migration
    if (STATE.user && (STATE.user.id === 1 || STATE.user.id === 2) && !STATE.user.groupId) {
        STATE.user.groupId = 1;
        localStorage.setItem('lms_user', JSON.stringify(STATE.user));
    }
    setupInteractions();
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    checkOnboarding();
    
    // Initial sync with backend
    syncBackend(); syncLandingData();
    setInterval(() => { syncBackend(); syncLandingData(); }, 10000); // Background Sync for multi-user real-time feel
});


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

function safeLucide(root = document) { try { if (window.lucide) lucide.createIcons({ root }); } catch (e) { } }

function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    const bg = type === 'error' ? 'bg-red-500' : 'bg-slate-900';
    t.className = `p-4 rounded-xl shadow-xl text-white font-bold text-sm ${bg} animate-slide-right flex gap-3`;
    t.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}"></i><span>${msg}</span>`;
    c.appendChild(t); safeLucide(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function checkOnboarding() {
    if (!localStorage.getItem('intro_seen')) {
        const mdl = document.getElementById('intro-modal');
        mdl.classList.remove('hidden');

        let slide = 1;
        const fn = () => {
            const current = document.querySelector('.intro-slide.active');
            if (current) {
                current.classList.remove('active');
                current.classList.add('animate-fade'); // fade out effect
            }

            document.querySelectorAll('.slide-dot').forEach(d => d.classList.remove('active'));

            const nxt = document.querySelector(`.intro-slide[data-slide="${slide}"]`);
            if (nxt) {
                nxt.classList.add('active');
                nxt.classList.add('animate-slide-up'); // professional entrance
                document.querySelectorAll('.slide-dot')[slide - 1].classList.add('active');
                safeLucide(nxt);
            } else { closeIntro(); }
        };
        document.getElementById('btn-next-intro').onclick = () => { slide++; fn(); };
        document.getElementById('btn-skip-intro').onclick = closeIntro;
    }
}
function closeIntro() {
    localStorage.setItem('intro_seen', '1');
    document.getElementById('intro-modal').classList.add('hidden');
}

function handleRoute() {
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
}

// Premium Points & Levels System
// Hardened Point System with Anti-Spam Throttle
let LAST_POINT_TIME = 0;
const addPoints = (pts, reason = "", category = "other") => {
    const nowTime = Date.now();
    if (nowTime - LAST_POINT_TIME < 2000) { // 2 second throttle
        console.warn("Spam detected: point addition throttled");
        return;
    }
    LAST_POINT_TIME = nowTime;

    let db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    if (!u) return;
    
    const today = new Date().toISOString().split('T')[0];
    if (u.lastPointDate !== today) {
        u.dailyCategoryPoints = { lessons: 0, duels: 0, miniGame: 0, other: 0 };
        u.lastPointDate = today;
    }
    u.dailyCategoryPoints = u.dailyCategoryPoints || { lessons: 0, duels: 0, miniGame: 0, other: 0 };

    const LIMITS = {
        lessons: 50,
        duels: 100,
        miniGame: 30,
        other: 20
    };

    const currentPts = u.dailyCategoryPoints[category] || 0;
    const maxPts = LIMITS[category] || 20;

    if (currentPts >= maxPts) {
        showToast(`${category} bo'yicha kunlik limit tugadi`, "error");
        return;
    }

    const canAdd = Math.min(pts, maxPts - currentPts);
    u.points = (u.points || 0) + Math.max(0, canAdd);
    u.dailyCategoryPoints[category] = currentPts + canAdd;

    saveDB(db);
    STATE.user = JSON.parse(JSON.stringify(u)); 
    localStorage.setItem('lms_user', JSON.stringify(STATE.user));
    if (reason && canAdd > 0) showToast(`+${canAdd} XP: ${reason}`, 'success');
    
    checkAchievements(STATE.user, db);
};

const notifyAdmin = (msg) => {
    let db = getDB();
    db.notifications = db.notifications || [];
    db.notifications.push({
        id: Date.now() + Math.random(),
        userId: 'admin_broadcast', // Broad message for any admin to see
        msg: msg,
        date: new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }),
        type: 'info',
        seen: false
    });
    saveDB(db);
};

const getUserStats = (u) => {
    const db = getDB();
    const completedLessons = Object.keys(u.progress || {}).length;
    const postsCount = (db.posts || []).filter(p => p.authorId === u.id).length;
    
    const myAtt = (db.attendance || []).filter(a => a.groupId === u.groupId);
    const presentCount = myAtt.filter(a => a.records?.[u.id] === 'present').length;
    const attendancePercent = myAtt.length > 0 ? Math.round((presentCount / myAtt.length) * 100) : 100;

    // Slow Level Progress Formula: XP = 100 * (2^L - 1)
    let level = 1;
    let totalXP = u.points || 0;
    while (totalXP >= 100 * (Math.pow(2, level) - 1)) {
        level++;
    }
    const currentLevelThreshold = 100 * (Math.pow(2, level - 1) - 1);
    const nextLevelThreshold = 100 * (Math.pow(2, level) - 1);
    const progressXP = totalXP - currentLevelThreshold;
    const levelRange = nextLevelThreshold - currentLevelThreshold;
    const levelPercent = Math.min(100, Math.round((progressXP / levelRange) * 100));

    return {
        points: u.points || 0,
        completedLessons,
        duelWins: u.duelWins || 0,
        attendance: attendancePercent,
        posts: postsCount,
        level,
        levelPercent
    };
};

const checkAchievements = (u, db) => {
    const unlocked = u.achievements || [];
    const push = (id) => { 
        if (!unlocked.includes(id)) { 
            const dbU = db.users.find(x => x.id === u.id);
            if (!dbU.achievements) dbU.achievements = [];
            dbU.achievements.push(id);
            saveDB(db);
            showAchievementUnlock(id); 
        } 
    };
    
    const lessonCount = Object.keys(u.progress || {}).length;
    if (lessonCount >= 3) push('first_lesson');
    if (lessonCount >= 15) push('active_5'); // Harder: 15 lessons
    if (u.points >= 5000) push('top_points'); // Harder: 5000 XP
    if (u.points >= 15000) push('legend'); // Harder: 15000 XP
    if (u.duelWins >= 50) push('attendance_7'); // Repurposing badge for duel mastery
};

const showAchievementUnlock = (id) => {
    const db = getDB();
    const ach = db.achievements.find(a => a.id === id);
    if (!ach) return;

    const div = document.createElement('div');
    div.className = 'fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none';
    div.innerHTML = `
        <div class="bg-white p-12 rounded-[4rem] shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-indigo-50 text-center animate-achievement-pop pointer-events-auto relative">
            <div class="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[4.5rem] blur-xl animate-pulse"></div>
            <div class="relative">
                <div class="text-7xl mb-6">${ach.icon}</div>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Yangi Yutuq!</p>
                <h2 class="text-4xl font-black text-slate-800 mb-4">${ach.title}</h2>
                <p class="text-slate-500 font-bold mb-8">${ach.desc}</p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm">Ajoyib!</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);
};

function renderRegisterGroups() {
    try {
        const db = getDB();
        const container = document.getElementById('reg-group-container');
        if (!container) return;
        
        const groups = db.groups || [];
        if (groups.length === 0) {
            container.innerHTML = `<p class="text-[10px] text-red-500 font-bold p-1">Hozircha guruhlar mavjud emas</p>`;
            return;
        }

        container.innerHTML = `
            <select id="reg-group" required class="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold appearance-none">
                <option value="" selected>Guruhsiz davom etish (Yoki guruh tanlang)</option>
                ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
            <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <i data-lucide="chevron-down" class="w-5 h-5"></i>
            </div>
        `;
        safeLucide(container);
    } catch (e) {
        console.error("renderRegisterGroups error:", e);
    }
}

function renderMobileNav() { } // Removed as per UI cleanup request

function renderSidebar() {
    if (!STATE.user) return;
    const db = getDB();
    document.getElementById('sidebar-name').innerText = STATE.user.ism;
    const r = STATE.user.role;
    const roleLabel = t(r) || r.replace('_',' ').toUpperCase();
    document.getElementById('sidebar-role').innerText = roleLabel.toUpperCase();
    const avatarTxt = STATE.user.avatar ? `<img src="${STATE.user.avatar}" class="w-full h-full object-cover rounded-[14px]">` : STATE.user.ism[0].toUpperCase();
    document.getElementById('sidebar-avatar').innerHTML = avatarTxt;

    // Today's date display
    const todayStr = new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' });

    const links = [
        { id: `${r}-dashboard`, icon: 'layout-dashboard', label: t('dashboard') },
        { id: 'courses', icon: 'book', label: t('courses') },
        { id: 'posts', icon: 'message-square', label: t('posts') },
        { id: 'support', icon: 'help-circle', label: t('support') },
        { id: 'profile', icon: 'user', label: t('profile') }
    ];
    if (STATE.user.groupId) {
        links.splice(3, 0, { id: 'chat', icon: 'messages-square', label: t('chat') });
    }
    
    const unreadNotifs = (db.notifications || []).filter(n => !n.seen && (
        r === 'admin' || 
        (r === 'ustoz' && n.msg.includes(STATE.user.ism)) ||
        (r === 'student' && n.userId === STATE.user.id)
    )).length;
    
    links.splice(1, 0, { id: 'notifications', icon: 'bell', label: t('notifications'), badge: unreadNotifs });
    if (['admin', 'tech_admin', 'director', 'ustoz'].includes(r)) {
        links.push({ id: 'staff-chat', icon: 'message-circle', label: "Jamoa Chati" });
    }
    if (r === 'admin' || r === 'tech_admin') {
        links.push({ id: 'users', icon: 'users', label: t('users') });
        links.push({ id: 'groups', icon: 'database', label: t('groups') });
        links.push({ id: 'questions_mgmt', icon: 'list-checks', label: t('questions') });
    }
    if (r === 'student') {
        links.push({ id: 'leaderboard', icon: 'trophy', label: t('leaderboard') });
        links.push({ id: 'library', icon: 'library', label: t('library') });
        links.push({ id: 'duel', icon: 'zap', label: t('duel') });
        links.push({ id: 'game', icon: 'gamepad-2', label: t('game') });
        links.push({ id: 'attendance', icon: 'calendar-check', label: t('attendance') });
    }
    if (r === 'ustoz') {
        links.splice(1, 0, { id: 'library', icon: 'library', label: t('library') });
        links.push({ id: 'groups', icon: 'users', label: t('groups') });
        links.push({ id: 'schedule', icon: 'calendar', label: t('schedule') });
    }
    if (['director', 'ustoz', 'admin'].includes(r)) {
        links.push({ id: 'analytics', icon: 'bar-chart-3', label: t('analytics') });
    }

    // Lang toggle
    const langToggleHTML = ``;
    CURRENT_LANG = 'uz';

    // Date display
    const dateHTML = `<div class="mx-2 mb-2 px-3 py-2 bg-indigo-50 rounded-xl flex items-center gap-2">
        <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400 shrink-0"></i>
        <span class="text-[10px] font-black text-indigo-600 capitalize">${todayStr}</span>
    </div>`;

    document.getElementById('nav-menu').innerHTML = 
        dateHTML +
        langToggleHTML +
        links.map(l =>
        `<a href="#${l.id}" class="nav-link ${STATE.view === l.id ? 'active' : ''} relative">
            <i data-lucide="${l.icon}" class="w-5 mr-3"></i>
            ${l.label}
            ${l.badge ? `<span class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-md border border-white">${l.badge}</span>` : ''}
        </a>`
    ).join('') + `<div class="mt-8 pt-4"><a href="#" onclick="logout()" class="nav-link text-red-500 hover:text-red-600"><i data-lucide="log-out" class="w-5 mr-3"></i>${t('logout')}</a></div>`;
    
    const mBtn = document.getElementById('mobile-menu-btn');
    if (mBtn) {
        mBtn.className = 'relative p-2 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-600 hover:text-indigo-600 transition-all active:scale-95';
        mBtn.innerHTML = `<i data-lucide="menu" class="w-6 h-6"></i>${unreadNotifs > 0 ? '<span class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>' : ''}`;
        safeLucide(mBtn);
    }
    
    safeLucide(document.getElementById('sidebar-container'));
}

function logout() { STATE.user = null; localStorage.removeItem('lms_user'); window.location.hash = 'login'; }

function setupInteractions() {
    document.addEventListener('click', e => {
        const link = e.target.closest('[data-link]');
        if (link) { e.preventDefault(); window.location.hash = link.getAttribute('data-link'); }
    });

    const login = document.getElementById('form-login');
    if (login) login.onsubmit = e => {
        e.preventDefault();
        const em = document.getElementById('log-email').value, pw = document.getElementById('log-pass').value;
        const u = getDB().users.find(x => x.email === em && x.password === pw);
        if (u) { 
            STATE.user = u; 
            localStorage.setItem('lms_user', JSON.stringify(u)); 
            notifyAdmin(`Yangi foydalanuvchi tizimga kirdi: ${u.ism} (${u.role})`);
            window.location.hash = `${u.role}-dashboard`; 
            login.reset(); 
        }
        else document.getElementById('login-error-card').classList.remove('hidden');
    };

    const reg = document.getElementById('form-register');
    if (reg) reg.onsubmit = e => {
        try {
            e.preventDefault();
            let db = getDB();
            const nameEl = document.getElementById('reg-name'),
                  emailEl = document.getElementById('reg-email'),
                  passEl = document.getElementById('reg-pass'),
                  groupEl = document.getElementById('reg-group');

            if (!nameEl || !emailEl || !passEl) throw new Error("Input element missing");
            
            const name = nameEl.value.trim(),
                  em = emailEl.value.trim(),
                  pw = passEl.value.trim(),
                  gId = groupEl ? groupEl.value : "";
            
            if (!name || !em || pw.length < 6) {
                const msg = "Barcha maydonlarni to'g'ri to'ldiring (parol kamida 6 belgi)";
                document.getElementById('reg-error-msg').innerText = msg;
                document.getElementById('reg-error-card').classList.remove('hidden'); 
                return;
            }

            if (db.users.find(x => x.email === em)) {
                document.getElementById('reg-error-msg').innerText = "Bu email bilan allaqachon ro'yxatdan o'tilgan";
                document.getElementById('reg-error-card').classList.remove('hidden'); 
                return;
            }
            
            const nu = { 
                id: Date.now(), ism: name, email: em, password: pw, role: 'student', 
                points: 0, groupId: gId ? parseInt(gId) : null, avatar: null, achievements: [], progress: {}
            };
            
            db.users.push(nu);
            if (nu.groupId) {
                const group = db.groups.find(g => g.id === nu.groupId);
                if (group) {
                    group.studentIds = group.studentIds || [];
                    group.studentIds.push(nu.id);
                }
            }
            
            saveDB(db); 
            STATE.user = nu; 
            localStorage.setItem('lms_user', JSON.stringify(nu)); 
            notifyAdmin(`Yangi foydalanuvchi ro'yxatdan o'tdi: ${nu.ism} (${nu.role})`);
            
            showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
            window.location.hash = 'student-dashboard'; 
            reg.reset();
        } catch (err) {
            console.error("Reg error:", err);
            showToast("Hatolik yuz berdi. Iltimos sahifani yangilang.", "error");
        }
    };

    // Global Ripple Effect
    document.addEventListener('mousedown', e => {
        const target = e.target.closest('.btn-interactive, .glass-card, .bottom-nav-item');
        if (target) {
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            target.classList.add('ripple-container');
            target.appendChild(ripple);
            setTimeout(() => { ripple.remove(); if (target.querySelectorAll('.ripple').length === 0) target.classList.remove('ripple-container'); }, 600);
        }
    });

    // Global Tap Animation - Handled by CSS :active for better performance

    document.getElementById('mobile-menu-btn').onclick = () => {
        document.getElementById('sidebar-container').classList.toggle('-translate-x-full');
    };

    // Auto-close sidebar on mobile after clicking a nav link
    document.getElementById('nav-menu').addEventListener('click', e => {
        if (e.target.closest('a') && window.innerWidth < 1024) {
            document.getElementById('sidebar-container').classList.add('-translate-x-full');
        }
    });
}

function renderView(view) {
    if (view === 'home') { 
        const lc = document.getElementById('landing-content'); 
        if (lc) { lc.innerHTML = v_home(); safeLucide(lc); } 
        return; 
    }
    const a = document.getElementById('dynamic-view-area');
    a.innerHTML = ''; 
    a.className = window.innerWidth < 1024 ? 'view-slide-in' : 'animate-fade';
    // Stop lesson timer when navigating away from lesson
    if (view !== 'course-detail') stopLessonTimer();
    const m = { 
        'student-dashboard': d_student, 
        'ustoz-dashboard': d_ustoz, 
        'admin-dashboard': d_admin, 
        'tech_admin-dashboard': d_tech_admin,
        'director-dashboard': d_director,
        'courses': v_courses, 
        'course-detail': v_cdetail, 
        'posts': v_posts, 
        'profile': v_profile, 
        'leaderboard': v_lead, 
        'support': v_sup, 
        'users': v_users,
        'groups': v_groups,
        'attendance': v_attendance,
        'reports': v_reports,
        'chat': v_chat,
        'notifications': v_notifications,
        'library': v_library,
        'duel': v_duel,
        'game': v_game,
        'analytics': d_director,
        'questions_mgmt': v_questions_mgmt,
        'staff-chat': v_staff_chat,
        'schedule': v_schedule, 'home': v_home
    };
    if (m[view]) a.innerHTML = m[view]();
    else a.innerHTML = `<div class="text-center py-20"><i data-lucide="search-x" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i><h2 class="text-2xl font-black text-slate-800">Sahifa topilmadi</h2></div>`;
    safeLucide(a);
}

// ======================== DASHBOARDS ========================
// Dashboard placeholder

const d_ustoz = () => {
    const db = getDB();
    const myGroups = db.groups.filter(g => g.ustozId === STATE.user.id);
    const todayDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon...5=Sat
    const dayNames = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba','Yakshanba'];
    const todayName = dayNames[todayDayIndex];

    // Today's schedule from all my groups
    const todaySlots = [];
    myGroups.forEach(g => {
        (g.schedule || []).filter(s => s.dayIndex === todayDayIndex).forEach(s => {
            todaySlots.push({ ...s, groupName: g.name });
        });
    });
    todaySlots.sort((a, b) => a.time.localeCompare(b.time));

    return `
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 class="text-3xl font-black text-slate-800">${t('dashboard')}</h1>
            <p class="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">${todayName} — ${new Date().toLocaleDateString('uz-UZ',{day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
        <div class="flex gap-3 flex-wrap">
            <button onclick="renderView('schedule')" class="bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-bold border border-indigo-100 btn-interactive flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4"></i> Jadval</button>
            <button onclick="window.location.hash='groups'" class="bg-slate-50 text-slate-600 px-5 py-3 rounded-2xl font-bold border border-slate-100 btn-interactive flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Guruhlar</button>
            <button onclick="oModal('add-course')" class="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/30 btn-interactive flex items-center gap-2"><i data-lucide="plus" class="w-4 h-4"></i> Yangi Kurs</button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">

            <!-- TODAY'S SCHEDULE -->
            <div class="glass-card p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-100">
                <h2 class="text-xl font-black mb-5 flex items-center gap-2">
                    <i data-lucide="clock" class="text-indigo-600 w-5 h-5"></i>
                    ${'Bugungi darslar'}
                    <span class="ml-auto text-xs font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-xl">${todayName}</span>
                </h2>
                <div class="space-y-3">
                ${todaySlots.length === 0 ? `
                    <div class="text-center py-8">
                        <p class="text-slate-400 font-bold">${'Bugun dars yo\'q'}</p>
                        <button onclick="renderView('schedule')" class="mt-3 text-indigo-600 font-black text-sm hover:underline">+ Jadval qo'shish</button>
                    </div>` :
                    todaySlots.map(sl => `
                    <div class="flex items-center gap-4 p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                        <div class="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center font-black shadow-lg shadow-indigo-600/20">
                            <span class="text-lg leading-none">${sl.time.split(':')[0]}</span>
                            <span class="text-[10px] opacity-70">${sl.time.split(':')[1]}</span>
                        </div>
                        <div class="flex-1">
                            <p class="font-black text-slate-800">${sl.subject}</p>
                            <p class="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">${sl.groupName}</p>
                        </div>
                        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    </div>`).join('')}
                </div>
            </div>

            <!-- GROUPS -->
            <div class="glass-card p-8 rounded-[2.5rem]">
                <h2 class="text-xl font-black mb-6 flex items-center gap-2"><i data-lucide="users" class="text-indigo-600"></i> Faol Guruhlarim</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${myGroups.map(g => `
                        <div class="p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-300 transition-all group" onclick="viewGroupAttendance(${g.id})">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <span class="text-[10px] font-black uppercase text-indigo-500">${g.studentIds.length} O'quvchi</span>
                                    <h4 class="font-black text-slate-800 text-lg">${g.name}</h4>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="event.stopPropagation(); STATE.user.groupId=${g.id}; window.location.hash='chat';" class="p-2 bg-white text-indigo-500 rounded-xl shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all" title="Chat">
                                        <i data-lucide="message-square" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                            <!-- Group mini-schedule -->
                            ${(g.schedule||[]).filter(s=>s.dayIndex===todayDayIndex).length > 0 ? `
                            <div class="flex gap-2 flex-wrap">
                                ${(g.schedule||[]).filter(s=>s.dayIndex===todayDayIndex).map(s=>`
                                <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black">${s.time} ${s.subject}</span>`).join('')}
                            </div>` : ''}
                        </div>
                    `).join('')}
                    ${myGroups.length === 0 ? '<p class="text-slate-400 font-bold col-span-2">Hozircha guruhlaringiz yo\'q.</p>' : ''}
                </div>
            </div>

            <!-- COURSES -->
            <div class="glass-card p-8 rounded-[2.5rem]">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-black flex items-center gap-2"><i data-lucide="layers" class="text-indigo-600"></i> Kurslarim</h2>
                    <button onclick="oModal('add-course')" class="text-xs font-black text-indigo-600 hover:underline">+ Yangi kurs</button>
                </div>
                <div class="space-y-3">
                    ${db.courses.filter(c => c.authorId === STATE.user.id || c.teacherId === STATE.user.id).map(c => `
                        <div class="p-5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group" onclick="opCourse(${c.id})">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><i data-lucide="book-open"></i></div>
                                <div>
                                    <span class="font-extrabold text-slate-800 block">${c.title}</span>
                                    <span class="text-[10px] text-slate-400 font-bold">${(c.lessons||[]).length} dars</span>
                                </div>
                            </div>
                            <i data-lucide="arrow-right" class="text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1"></i>
                        </div>
                    `).join('')}
                    ${db.courses.filter(c => c.authorId === STATE.user.id || c.teacherId === STATE.user.id).length === 0 ? '<p class="text-slate-400 font-bold text-sm">Hali kurs yaratilmagan</p>' : ''}
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <!-- Quick Post -->
            <div class="glass-card p-8 rounded-[2.5rem] h-fit sticky top-8">
                <h2 class="text-xl font-black mb-4">Yangi Post</h2>
                <p class="text-sm text-slate-500 mb-6 font-medium">O'quvchilarga e'lon qoldirish.</p>
                <button onclick="oModal('add-post')" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><i data-lucide="edit" class="w-5 h-5"></i> Post yozish</button>
            </div>

            <!-- Weekly schedule summary for sidebar -->
            <div class="glass-card p-6 rounded-[2.5rem]">
                <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2 text-base">
                    <i data-lucide="calendar" class="text-indigo-600 w-4 h-4"></i> Hafta jadvali
                    <button onclick="renderView('schedule')" class="ml-auto text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Tahrirlash →</button>
                </h3>
                <div class="space-y-2">
                ${['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'].map((day,di) => {
                    const slots = [];
                    myGroups.forEach(g => (g.schedule||[]).filter(s=>s.dayIndex===di).forEach(s=>slots.push(s)));
                    return slots.length > 0 ? `
                    <div class="flex items-start gap-3">
                        <span class="text-[10px] font-black text-slate-400 uppercase w-20 pt-0.5 shrink-0">${day.slice(0,3)}</span>
                        <div class="flex flex-wrap gap-1 flex-1">
                            ${slots.map(s=>`<span class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black">${s.time}</span>`).join('')}
                        </div>
                    </div>` : '';
                }).filter(Boolean).join('') || '<p class="text-slate-300 font-bold text-xs">Jadval kiritilmagan</p>'}
                </div>
            </div>
        </div>
    </div>`;
};

const d_admin = () => {
    const psts = getDB().posts.filter(p => !p.approved);
    const tkts = getDB().tickets.filter(t => t.status === 'Ochiq');
    return `
    <div class="flex justify-between items-center mb-8"><h1 class="text-3xl font-black text-slate-800">Admin Boshqaruvi</h1><button onclick="oLandingEdit()" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 btn-interactive flex items-center gap-2"><i data-lucide="layout"></i> Landingni Tahrirlash</button></div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="glass-card p-8 rounded-[2.5rem]">
            <h2 class="font-black text-xl mb-6 text-amber-600 flex items-center gap-2"><i data-lucide="clock"></i> Kutish ro'yxati</h2>
            ${psts.length === 0 ? '<p class="text-slate-400 font-bold">Hech narsa yo`q.</p>' : psts.map(p => `
                <div class="p-5 bg-amber-50/30 border border-amber-100 rounded-2xl mb-4 flex justify-between items-center">
                    <p class="font-bold text-slate-700 line-clamp-2 pr-4">${p.text}</p>
                    <div class="flex gap-2 shrink-0">
                        <button onclick="apprPost(${p.id},true)" class="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 transition"><i data-lucide="check" class="w-5 h-5"></i></button>
                        <button onclick="apprPost(${p.id},false)" class="p-3 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 hover:scale-110 transition"><i data-lucide="trash" class="w-5 h-5"></i></button>
                    </div>
                </div>`).join('')}
        </div>
        <div class="glass-card p-8 rounded-[2.5rem]">
            <h2 class="font-black text-xl mb-6 text-indigo-600 flex items-center gap-2"><i data-lucide="help-circle"></i> Ochiq Ticketlar</h2>
            ${tkts.length === 0 ? '<p class="text-slate-400 font-bold">Hozircha ticketlar yo`q.</p>' : tkts.map(t => `
                <div class="p-5 bg-white border border-slate-100 rounded-2xl mb-4 cursor-pointer hover:shadow-xl transition-all" onclick="oModal('view-tkt', ${t.id})">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-black text-slate-800">#${t.id}</span>
                        <span class="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">${t.user_name}</span>
                    </div>
                    <p class="text-sm font-medium text-slate-500 line-clamp-1">${t.message}</p>
                </div>`).join('')}
        </div>
    </div>`;
}

const d_tech_admin = () => {
    const db = getDB();
    return `
    <h1 class="text-3xl font-black text-slate-800 mb-8">Texnik Admin</h1>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="glass-card p-8 rounded-[2.5rem] lg:col-span-2">
            <h2 class="text-xl font-black mb-6">Tizim Sozlamalari</h2>
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-black text-slate-500 uppercase mb-2">Platforma Nomi</label>
                    <input id="sys-name" type="text" value="${db.settings.platformName}" class="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold">
                </div>
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                        <p class="font-black text-slate-800">Registratsiya</p>
                        <p class="text-xs text-slate-500 font-bold">Yangi foydalanuvchilar qo'shilishi</p>
                    </div>
                    <button onclick="toggleSetting('allowRegistration')" class="w-14 h-8 bg-${db.settings.allowRegistration ? 'indigo-600' : 'slate-300'} rounded-full relative transition-colors">
                        <div class="absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform transform ${db.settings.allowRegistration ? 'translate-x-6' : ''}"></div>
                    </button>
                </div>
                <button onclick="saveSettings()" class="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20">Saqlash</button>
            </div>
        </div>
        <div class="glass-card p-8 rounded-[2.5rem]">
            <h2 class="text-xl font-black mb-4">Rol Boshqaruvi</h2>
            <p class="text-sm text-slate-500 font-medium mb-6">Foydalanuvchilar ro'yxatidan rollarni o'zgartiring.</p>
            <button onclick="window.location.hash='users'" class="w-full border-2 border-slate-200 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all">Foydalanuvchilarga o'tish</button>
        </div>
    </div>`;
};

const d_director = (selectedDate = null) => {
    const db = getDB();
    const students = db.users.filter(u => u.role === 'student');
    const ustozlar = db.users.filter(u => u.role === 'ustoz' || u.role === 'director' || u.role === 'admin');
    const avgScore = Math.round(students.reduce((acc, s) => acc + (s.points || 0), 0) / (students.length || 1));
    const totalCourses = db.courses.length;

    // Get all attendance dates
    const allDates = [...new Set((db.attendance || []).map(a => a.date))].sort().reverse();
    const activeDate = selectedDate || allDates[0] || new Date().toISOString().split('T')[0];

    // Attendance for selected date
    const dayRecords = (db.attendance || []).filter(a => a.date === activeDate);
    
    return `
    <div class="space-y-8 animate-fade">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h1 class="text-3xl font-black text-slate-800">${t('analytics')}</h1>
        <div class="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl">
            <i data-lucide="calendar" class="w-4 h-4 text-indigo-500"></i>
            <span class="text-xs font-black text-indigo-700">${new Date().toLocaleDateString('uz-UZ', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</span>
        </div>
    </div>

    <!-- Staff Photos Row (Director/Admin/Ustoz) -->
    <div class="glass-card p-6 rounded-[2.5rem] bg-white">
        <h2 class="text-lg font-black mb-5 flex items-center gap-2"><i data-lucide="shield" class="text-indigo-600 w-5 h-5"></i> ${'Xodimlar'}</h2>
        <div class="flex flex-wrap gap-4">
            ${ustozlar.map(u => `
            <div class="flex flex-col items-center gap-2 cursor-pointer group" title="${u.email}">
                <div class="w-16 h-16 rounded-[1.2rem] overflow-hidden border-2 border-slate-100 group-hover:border-indigo-400 transition-all shadow-sm bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center font-black text-indigo-600 text-xl">
                    ${u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : u.ism[0]}
                </div>
                <span class="text-[10px] font-black text-slate-600 text-center max-w-[70px] leading-tight truncate">${u.ism.split(' ')[0]}</span>
                <span class="text-[9px] font-black px-2 py-0.5 rounded-full ${ 
                    u.role==='director'?'bg-purple-100 text-purple-600':u.role==='admin'?'bg-red-100 text-red-600':'bg-indigo-100 text-indigo-600'
                }">${t(u.role)}</span>
            </div>`).join('')}
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-card p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/30">
            <p class="text-indigo-100 font-bold text-xs uppercase">${"O'quvchilar"}</p>
            <h3 class="text-4xl font-black mt-1">${students.length}</h3>
        </div>
        <div class="glass-card p-6 rounded-[2rem] bg-white border border-slate-100">
            <p class="text-slate-400 font-bold text-xs uppercase">${"O'rtacha Ball"}</p>
            <h3 class="text-4xl font-black mt-1 text-slate-800">${avgScore}</h3>
        </div>
        <div class="glass-card p-6 rounded-[2rem] bg-white border border-slate-100">
            <p class="text-slate-400 font-bold text-xs uppercase">${'Kurslar'}</p>
            <h3 class="text-4xl font-black mt-1 text-slate-800">${totalCourses}</h3>
        </div>
        <div class="glass-card p-6 rounded-[2rem] bg-white border border-slate-100">
            <p class="text-slate-400 font-bold text-xs uppercase">${'Ticketlar'}</p>
            <h3 class="text-4xl font-black mt-1 text-amber-500">${db.tickets.filter(tc => tc.status === 'Ochiq').length}</h3>
        </div>
    </div>

    <!-- Date-based Attendance Drilldown -->
    <div class="glass-card p-8 rounded-[2.5rem] bg-white shadow-premium">
        <h2 class="text-xl font-black mb-6 flex items-center gap-2"><i data-lucide="calendar-check" class="text-emerald-500"></i> ${'Sanaga ko\'ra davomat'}</h2>
        <!-- Date selector -->
        <div class="flex flex-wrap gap-2 mb-8">
            ${allDates.slice(0,14).map(d => `
            <button onclick="document.getElementById('dynamic-view-area').innerHTML=d_director('${d}'); safeLucide(document.getElementById('dynamic-view-area'))" 
                class="px-4 py-2 rounded-xl text-xs font-black transition-all ${ d===activeDate ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100'}">  
                ${new Date(d).toLocaleDateString('uz-UZ',{day:'numeric',month:'short'})}
            </button>`).join('')}
            ${allDates.length === 0 ? `<span class="text-slate-400 font-bold text-sm">${'Ma\'lumot yo\'q'}</span>` : ''}
        </div>
        <!-- Attendance table for selected date -->
        <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead><tr class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                <th class="pb-4">${'Talaba'}</th>
                <th class="pb-4">${'Guruh'}</th>
                <th class="pb-4 text-center">${'XP'}</th>
                <th class="pb-4 text-center">${'Holat'}</th>
            </tr></thead>
            <tbody class="divide-y divide-slate-50">
            ${students.map(s => {
                const g = (db.groups||[]).find(x => x.id === s.groupId);
                const dayRec = dayRecords.find(r => r.groupId === s.groupId);
                const status = dayRec ? dayRec.records[s.id] : null;
                const statusBadge = status === 'present'
                    ? `<span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black">${t('present')}</span>`
                    : status === 'absent'
                    ? `<span class="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black">${t('absent')}</span>`
                    : `<span class="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black">—</span>`;
                return `<tr class="hover:bg-indigo-50/30 transition">
                    <td class="py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-indigo-600 border border-slate-100">
                                ${s.avatar ? `<img src="${s.avatar}" class="w-full h-full object-cover rounded-xl">` : s.ism[0]}
                            </div>
                            <div>
                                <p class="font-bold text-slate-800 text-sm">${s.ism}</p>
                                <p class="text-[10px] font-bold text-indigo-500">${s.points} XP</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 text-sm font-bold text-slate-500">${g ? g.name : '—'}</td>
                    <td class="py-4 text-center">
                        <div class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                            <div class="h-full bg-indigo-500 rounded-full" style="width:${Math.min(s.points/20,100)}%"></div>
                        </div>
                    </td>
                    <td class="py-4 text-center">${statusBadge}</td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>
        </div>
    </div>
    </div>`;
};
window.d_director = d_director;

window.apprPost = async (id, st) => {
    let db = getDB();
    if (st) {
        let p = db.posts.find(x => x.id === id);
        if (p) {
            p.approved = true;
            p.status = 'approved';
        }
        try {
            await fetch(`${API_BASE}/posts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved: true })
            });
        } catch (e) { console.error(e); }
    } else {
        db.posts = db.posts.filter(x => x.id !== id);
        try {
            await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
        } catch (e) { console.error(e); }
    }
    saveDB(db);
    showToast('Natija saqlandi');
    renderView('admin-dashboard');
    syncBackend(); syncLandingData();
    setInterval(() => { syncBackend(); syncLandingData(); }, 30000); // Background Sync for multi-user real-time feel
}
window.toggleSetting = (key) => { let db = getDB(); db.settings[key] = !db.settings[key]; saveDB(db); renderView('tech_admin-dashboard'); }
window.saveSettings = () => { let db = getDB(); db.settings.platformName = document.getElementById('sys-name').value; saveDB(db); showToast('Xizmat sozlamalari saqlandi'); }

const v_profile = () => {
    const db = getDB();
    const achievements = db.achievements.map(a => {
        const unlocked = (STATE.user.achievements || []).includes(a.id);
        return { ...a, unlocked };
    });
    const stats = getUserStats(STATE.user);

    return `
    <div class="max-w-6xl mx-auto mt-10">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div class="lg:col-span-1 border-r border-slate-100 pr-8">
                <div class="premium-card rounded-[2.5rem] p-8 text-center bg-white border-slate-100 shadow-premium">
                    <div class="relative w-32 h-32 mx-auto mb-6 group">
                        <div class="w-full h-full rounded-[2.5rem] bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl overflow-hidden avatar-preview">
                            ${STATE.user.avatar ? `<img src="${STATE.user.avatar}" class="w-full h-full object-cover">` : STATE.user.ism[0].toUpperCase()}
                        </div>
                        <label class="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl shadow-xl border-4 border-white cursor-pointer hover:scale-110 transition active:scale-95 z-10">
                            <i data-lucide="camera" class="w-5 h-5 text-white"></i>
                            <input type="file" class="hidden" accept="image/*" onchange="uploadAvatar(this)">
                        </label>
                    </div>
                    
                    <div class="mb-6">
                        <div class="flex items-center justify-center gap-2 mb-1">
                            <h1 class="text-xl font-black text-slate-800">${STATE.user.ism}</h1>
                            <button onclick="editName()" class="text-slate-300 hover:text-indigo-600 transition"><i data-lucide="edit-3" class="w-3 h-3"></i></button>
                        </div>
                        <span class="inline-block px-4 py-1.5 bg-slate-50 text-indigo-500 text-[9px] font-black uppercase rounded-full tracking-widest border border-slate-100">${STATE.user.role.replace('_', ' ')}</span>
                    </div>

                    <div class="space-y-4 pt-6 border-t border-slate-50">
                        <button onclick="oModal('change-password')" class="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 py-3 rounded-xl border border-slate-100 flex items-center justify-center gap-2"><i data-lucide="key" class="w-3 h-3"></i> Parolni o'zgartirish</button>
                        <button onclick="logout()" class="w-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors bg-red-50 py-3 rounded-xl border border-red-100 flex items-center justify-center gap-2"><i data-lucide="log-out" class="w-3 h-3"></i> Chiqish</button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-3">
                <div class="mb-10">
                    <h2 class="text-3xl font-black text-slate-800 mb-6 flex items-center gap-3"><i data-lucide="bar-chart-2" class="text-indigo-600 w-8 h-8"></i> Shaxsiy Analitika</h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-list">
                        <div class="glass-card p-6 rounded-[2rem] bg-white">
                            <i data-lucide="zap" class="text-amber-500 w-6 h-6 mb-3"></i>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Jami Ballar</p>
                            <h3 class="text-2xl font-black text-slate-800 counter-up">${stats.points}</h3>
                        </div>
                        <div class="glass-card p-6 rounded-[2rem] bg-white">
                            <i data-lucide="book-open" class="text-indigo-600 w-6 h-6 mb-3"></i>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Darslar</p>
                            <h3 class="text-2xl font-black text-slate-800">${stats.completedLessons} ta</h3>
                        </div>
                        <div class="glass-card p-6 rounded-[2rem] bg-white">
                            <i data-lucide="swords" class="text-pink-500 w-6 h-6 mb-3"></i>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Duel Yutuqlari</p>
                            <h3 class="text-2xl font-black text-slate-800">${stats.duelWins} ta</h3>
                        </div>
                        <div class="glass-card p-6 rounded-[2rem] bg-white">
                            <i data-lucide="calendar" class="text-emerald-500 w-6 h-6 mb-3"></i>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Davomat</p>
                            <div class="flex items-center gap-3">
                                <h3 class="text-2xl font-black text-slate-800">${stats.attendance}%</h3>
                                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex-1">
                                    <div class="h-full bg-emerald-500 transition-all duration-1000" style="width: ${stats.attendance}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="glass-card p-6 rounded-[2rem] bg-white">
                            <i data-lucide="message-square" class="text-blue-500 w-6 h-6 mb-3"></i>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Postlar</p>
                            <h3 class="text-2xl font-black text-slate-800">${stats.posts} ta</h3>
                        </div>
                        <div class="glass-card p-6 rounded-[2rem] bg-white">
                            <i data-lucide="trending-up" class="text-purple-600 w-6 h-6 mb-3"></i>
                            <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Level Progress</p>
                            <div class="flex flex-col gap-1">
                                <span class="text-sm font-black text-slate-800">${stats.level}-Daraja</span>
                                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-purple-600 transition-all duration-1000" style="width: ${stats.levelPercent}%"></div>
                                </div>
                                <span class="text-[9px] text-slate-400 font-bold text-right">${stats.levelPercent}% keyingi darajagacha</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="glass-card p-8 rounded-[2.5rem] bg-white shadow-premium">
                    <h2 class="text-2xl font-black mb-8 flex items-center gap-3"><i data-lucide="award" class="text-amber-500 w-8 h-8"></i> Mukofotlar Zalы</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        ${achievements.map(a => `
                            <div class="p-6 rounded-[2rem] border-2 ${a.unlocked ? `badge-${a.rarity} animate-unlock` : 'border-slate-100 bg-slate-50 opacity-40 grayscale'} flex items-center gap-5 transition-all hover:translate-y-[-5px]">
                                <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-4xl ${a.unlocked ? 'animate-bounce-subtle' : ''}">${a.icon}</div>
                                <div>
                                    <h4 class="font-black text-slate-800 text-lg mb-1">${a.title}</h4>
                                    <div class="flex items-center gap-2">
                                        <span class="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-white border border-slate-100 text-${a.rarity}">${a.rarity}</span>
                                        ${a.unlocked ? '<span class="text-[9px] font-black text-emerald-500">OCHILGAN</span>' : '<span class="text-[9px] font-black text-slate-400">QULFLANGAN</span>'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};
window.uploadAvatar = (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) { showToast('Rasm hajmi juda katta (max 2MB)', 'error'); return; }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            let db = getDB();
            let u = db.users.find(x => x.id === STATE.user.id);
            if (u) {
                u.avatar = e.target.result;
                STATE.user.avatar = u.avatar;
                saveDB(db);
                localStorage.setItem('lms_user', JSON.stringify(STATE.user));
                
                // Update Sidebar immediately
                renderSidebar();
                // Re-render Profile view
                renderView('profile');
                showToast('Rasm muvaffaqiyatli saqlandi! ✨');
            }
        };
        reader.readAsDataURL(file);
    }
}
window.editName = () => {
    const newName = prompt("Ismingizni tahrirlang:", STATE.user.ism);
    if (newName && newName.trim()) {
        let db = getDB();
        let u = db.users.find(x => x.id === STATE.user.id);
        if (u) {
            u.ism = newName.trim();
            STATE.user.ism = u.ism;
            saveDB(db);
            localStorage.setItem('lms_user', JSON.stringify(STATE.user));
            renderSidebar();
            renderView('profile');
            showToast('Ism yangilandi');
        }
    }
}

// Helper function for course card rendering
const renderCourseCard = (c) => {
    const db = getDB();
    const userProgress = (STATE.user.progress && STATE.user.progress[c.id]) || { completed: [], percent: 0 };
    return `
        <div class="glass-card p-6 rounded-[2rem] tilt-card cursor-pointer flex flex-col" onclick="opCourse(${c.id})">
            <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><i data-lucide="book" class="w-6 h-6"></i></div>
            <h3 class="font-black text-slate-800 text-lg line-clamp-2">${c.title}</h3>
            <p class="text-sm text-slate-500 mt-2 mb-4 line-clamp-2 flex-grow">${c.description || 'Kurs haqida batafsil ma`lumot'}</p>
            <div class="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                <span class="text-xs font-bold text-slate-500">${c.category}</span>
                <span class="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">${userProgress.percent}%</span>
            </div>
        </div>`;
};

const d_student = () => {
    const db = getDB();
    const u = STATE.user;
    const stats = getUserStats(u);

    const myCourses = db.courses.filter(c => u.progress && u.progress[c.id]);
    const popularCourses = db.courses.slice(0, 2); 
    const approvedPosts = db.posts.filter(p => p.approved).reverse(); 
    const myGroups = db.groups.filter(g => g.studentIds && g.studentIds.includes(u.id)); 

    return `
    <div class="space-y-10 animate-fade">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center p-10 bg-white rounded-[3rem] shadow-premium relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
            <div class="relative z-10">
                <h1 class="text-4xl font-black text-slate-800 mb-2">Salom, ${u.ism}! 👋</h1>
                <div class="flex items-center gap-4">
                    <span class="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">LEVEL ${stats.level}</span>
                    <div class="flex-1 w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-600 rounded-full transition-all duration-1000" style="width: ${stats.levelPercent}%"></div>
                    </div>
                    <span class="text-xs font-bold text-slate-400">${u.points} XP</span>
                </div>
            </div>
            <div class="flex gap-4 mt-6 md:mt-0 relative z-10">
                <div class="bg-indigo-50 p-4 rounded-3xl text-center min-w-[100px]">
                    <p class="text-[10px] font-black uppercase text-indigo-400 mb-1">XP Points</p>
                    <p class="text-2xl font-black text-indigo-600">${u.points}</p>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-8">
                <!-- Courses -->
                <section>
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-black text-slate-800">Mening Kurslarim</h2>
                        <a href="#courses" class="text-indigo-600 font-black text-sm hover:underline">Hammasi</a>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${myCourses.length ? myCourses.map(c => renderCourseCard(c)).join('') : popularCourses.map(c => renderCourseCard(c)).join('')}
                    </div>
                </section>
                
                <!-- POST FEED ON LOGIN (DASHBOARD) -->
                <section>
                    <h2 class="text-2xl font-black text-slate-800 mb-6 flex items-center justify-between">
                        So'nggi Postlar 
                        <button onclick="renderView('posts')" class="text-sm font-bold text-indigo-600 hover:underline">Barchasi</button>
                    </h2>
                    <div class="space-y-6">
                        ${approvedPosts.length === 0 ? '<div class="glass-card p-10 text-center"><p class="text-slate-400 font-bold">Hozircha postlar yo\'q.</p></div>' : approvedPosts.map(p => `
                        <article class="glass-card overflow-hidden rounded-[2.5rem] border border-slate-100 group shadow-sm hover:shadow-xl transition-all">
                            ${p.image ? `
                            <div class="relative h-64 overflow-hidden cursor-zoom-in" onclick="zoomImage({src: '${p.image}'})">
                                <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                            </div>` : ''}
                            <div class="p-6 md:p-8 space-y-4 relative">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">${p.author?.[0] || 'A'}</div>
                                    <div>
                                        <p class="font-black text-slate-800">${p.author || 'Admin'}</p>
                                        <p class="text-xs text-slate-400 font-bold tracking-widest">${p.date}</p>
                                    </div>
                                </div>
                                <h3 class="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">${p.title}</h3>
                                <p class="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap">${p.content}</p>
                                <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <button onclick="toggleLike(${p.id}, this)" class="flex items-center gap-2 text-slate-400 hover:text-pink-500 font-bold transition-colors ${p.liked_users && p.liked_users.includes(u.id) ? '!text-pink-500' : ''}">
                                        <i data-lucide="heart" class="w-5 h-5 ${(p.liked_users && p.liked_users.includes(u.id)) ? 'fill-current' : ''}"></i>
                                        <span class="like-counter">${p.likes || 0}</span>
                                    </button>
                                </div>
                            </div>
                        </article>`).join('')}
                    </div>
                </section>
            </div>

            <!-- Stats & Leaderboard & Schedule -->
            <div class="space-y-8">
                <!-- Weekly schedule summary for sidebar -->
                <div class="glass-card p-6 rounded-[2.5rem]">
                    <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2 text-base">
                        <i data-lucide="calendar" class="text-indigo-600 w-4 h-4"></i> Hafta jadvali
                        <button onclick="renderView('schedule')" class="ml-auto text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">To'liq Ko'rish</button>
                    </h3>
                    <div class="space-y-2">
                    ${['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'].map((day,di) => {
                        const slots = [];
                        myGroups.forEach(g => (g.schedule||[]).filter(s=>s.dayIndex===di).forEach(s=>slots.push(s)));
                        return slots.length > 0 ? `
                        <div class="flex items-start gap-3">
                            <span class="text-[10px] font-black text-slate-400 uppercase w-20 pt-0.5 shrink-0">${day.slice(0,3)}</span>
                            <div class="flex flex-wrap gap-1 flex-1">
                                ${slots.map(s=>`<span class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black">${s.time}</span>`).join('')}
                            </div>
                        </div>` : '';
                    }).filter(Boolean).join('') || '<p class="text-slate-300 font-bold text-xs">Jadval belgilanmagan</p>'}
                    </div>
                </div>

                <div class="glass-card p-8 rounded-[2.5rem]">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="font-black text-slate-800 text-xl">Statistika</h3>
                        <div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><i data-lucide="activity"></i></div>
                    </div>
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400 font-bold">Ballar</span>
                            <span class="text-indigo-600 font-black text-xl">${u.points} XP</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-600 rounded-full" style="width: ${Math.min(u.points/10, 100)}%"></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400 font-bold">Guruh</span>
                            <span class="text-slate-800 font-black">${db.groups.find(g => g.id === u.groupId)?.name || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

const v_courses = () => `
    <h1 class="text-3xl font-black text-slate-800 mb-8">Barcha Kurslar</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${getDB().courses.map(c => `
            <div class="glass-card p-6 rounded-[2rem] tilt-card cursor-pointer flex flex-col" onclick="opCourse(${c.id})">
                <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><i data-lucide="book" class="w-6 h-6"></i></div>
                <h3 class="font-black text-slate-800 text-lg line-clamp-2">${c.title}</h3>
                <p class="text-sm text-slate-500 mt-2 mb-4 line-clamp-2 flex-grow">${c.description || 'Kurs haqida batafsil ma`lumot'}</p>
                <div class="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center"><span class="text-xs font-bold text-slate-500">${c.category}</span><span class="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">${c.status}</span></div>
            </div>
        `).join('')}
    </div>`;

window.opCourse = id => { STATE.activeCourseId = id; window.location.hash = 'course-detail'; };
const v_cdetail = () => {
    const db = getDB();
    const c = db.courses.find(x => x.id === STATE.activeCourseId); if (!c) return `Kurs topilmadi`;
    const les = c.lessons || [];
    const userProgress = (STATE.user.progress && STATE.user.progress[c.id]) || { completed: [], percent: 0 };

    return `
    <button onclick="window.location.hash='courses'" class="text-slate-500 hover:text-slate-800 mb-4 font-bold flex items-center transition-colors"><i data-lucide="arrow-left" class="w-4 h-4 mr-1"></i> Orqaga</button>
    <div class="glass-card p-8 rounded-[2.5rem] mb-8 bg-gradient-to-br from-white to-slate-50 border-white/50 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10"><i data-lucide="book" class="w-32 h-32"></i></div>
        <div class="relative z-10 flex justify-between items-start mb-6">
            <div>
                <h1 class="text-4xl font-black text-slate-800 tracking-tight leading-tight">${c.title}</h1>
                <p class="text-indigo-600 font-black mt-2 uppercase tracking-widest text-xs">${c.category}</p>
            </div>
            ${(STATE.user.id === c.authorId || STATE.user.id === c.teacherId || STATE.user.role === 'admin') ? `
                <button onclick="oModal('add-lesson')" class="bg-indigo-600 text-white px-6 py-3 font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
                    <i data-lucide="plus" class="w-5 h-5"></i> Dars qo'shish
                </button>` : ''}
        </div>
        <p class="text-slate-600 font-medium text-lg max-w-3xl mb-8">${c.description || 'Kurs haqida batafsil ma`lumot keltirilmagan.'}</p>
        
        <div class="w-full max-w-sm">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-black text-slate-400 uppercase tracking-widest">O'zlashtirish</span>
                <span class="text-sm font-black text-indigo-600">${userProgress.percent}%</span>
            </div>
            <div class="w-full h-3 bg-slate-200/50 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.4)]" style="width: ${userProgress.percent}%"></div>
            </div>
        </div>
    </div>
    
    <div class="space-y-4 max-w-4xl mx-auto pb-20">
        <h3 class="text-xl font-black text-slate-800 mb-6 px-2 flex items-center gap-2">
            <i data-lucide="play-circle" class="text-indigo-600"></i> Darslar ro'yxati (<span class="text-indigo-600">${les.length}</span>)
        </h3>
        ${les.length === 0 ? `
            <div class="text-center p-20 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
                <div class="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><i data-lucide="video" class="w-10 h-10 text-slate-200"></i></div>
                <p class="text-slate-400 font-black text-xl">Hozircha darslar yuklanmagan</p>
            </div>` : 
            les.map((l, i) => {
                const isCompleted = userProgress.completed.includes(l.id);
                return `
                <div class="p-6 bg-white border-2 ${isCompleted ? 'border-emerald-100' : 'border-slate-50'} rounded-[2rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all cursor-pointer flex gap-6 tilt-card items-center group relative overflow-hidden" onclick="oModal('read-lesson', ${l.id})">
                    ${isCompleted ? '<div class="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">Tugallangan</div>' : ''}
                    <div class="w-14 h-14 shrink-0 bg-slate-50 text-slate-400 rounded-2xl font-black flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl shadow-inner">${i + 1}</div>
                    <div class="flex-1">
                        <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">${l.topic || 'Mavzu belgilanmagan'}</p>
                        <h3 class="font-black text-slate-800 text-xl group-hover:text-indigo-600 transition-colors">${l.title}</h3>
                        <p class="text-sm text-slate-400 line-clamp-1 mt-1 font-medium italic">${l.content.substring(0, 100)}...</p>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                        <i data-lucide="${l.videoUrl ? 'play' : 'file-text'}" class="w-6 h-6 ${l.videoUrl ? 'fill-current' : ''}"></i>
                    </div>
                </div>`;
            }).join('')}
    </div>`;
};

// ======================== MODALS & OTHERS ========================
window.oModal = (type, lId) => {
    const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
    bg.classList.remove('hidden'); bg.classList.add('flex');
    let m = '';
    if (type === 'add-course') m = `<div class="bg-white p-10 rounded-[2.5rem] animate-zoom w-full max-w-lg shadow-2xl"><h2 class="text-3xl font-black mb-6 text-slate-800">Kurs Yaratish</h2><form onsubmit="svCourse(event)"><div class="space-y-4"><input id="mc-t" required placeholder="Kurs nomi" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white"><textarea id="mc-d" required placeholder="Kurs tavsifi..." class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white" rows="4"></textarea><button class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Kursni Saqlash</button></div></form></div>`;
    
    if (type === 'add-lesson') m = `<div class="bg-white p-10 rounded-[2.5rem] animate-zoom w-full max-w-xl shadow-2xl"><h2 class="text-3xl font-black mb-6 text-slate-800">Yangi Dars</h2><form onsubmit="svLesson(event)"><div class="space-y-4"><input id="ml-top" required placeholder="Mavzu nomi (masalan: JS Kirish)" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white"><input id="ml-t" required placeholder="Dars sarlavhasi (masalan: 1-dars)" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white"><input id="ml-vid" placeholder="YouTube URL (ixtiyoriy)" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white"><textarea id="ml-c" required placeholder="Dars matni / Konspekt..." class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white" rows="6"></textarea><button class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Darsni Kiritish</button></div></form></div>`;
    
    if (type === 'read-lesson') {
        const _db = getDB();
        let l = null;
        for (const _c of _db.courses) {
            const _found = (_c.lessons || []).find(x => x.id === lId);
            if (_found) { l = { ..._found, courseId: _c.id }; break; }
        }
        if (!l) { a.innerHTML = '<div class="p-10 text-center"><p class="text-red-500 font-black">Dars topilmadi!</p></div>'; return; }
        let ytEmbed = '';
        if (l.videoUrl) {
            let vid = l.videoUrl.split('v=')[1] || l.videoUrl.split('/').pop();
            if (vid) {
                const ampersandPosition = vid.indexOf('&');
                if (ampersandPosition !== -1) vid = vid.substring(0, ampersandPosition);
                ytEmbed = `<div class="video-container mb-8"><iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            }
        }
        m = `
        <div class="bg-white p-0 rounded-[3rem] max-h-[92vh] overflow-y-auto w-full max-w-4xl animate-slide-up shadow-2xl border border-white relative">
            <div class="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-slate-100 flex justify-between items-center z-20">
                <div>
                     <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">${l.topic || 'Mavzu: Kirish'}</p>
                     <h2 class="text-3xl font-black text-slate-800">Dars: ${l.title}</h2>
                </div>
                <button onclick="cModal()" class="bg-slate-100 p-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <div class="p-10">
                <div class="max-w-3xl mx-auto">
                    <!-- Smart 20-min Timer Box -->
                    ${STATE.user.role === 'student' ? `
                    <div id="lesson-timer-box" class="lesson-timer-box mb-10">
                        <div class="timer-ring-wrap">
                            <svg viewBox="0 0 44 44" class="timer-ring">
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#e0e7ff" stroke-width="4"/>
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#4f46e5" stroke-width="4" stroke-dasharray="113" stroke-dashoffset="113" stroke-linecap="round" style="transition:stroke-dashoffset 1s linear;transform:rotate(-90deg);transform-origin:center"/>
                            </svg>
                            <span class="timer-text">0:00</span>
                        </div>
                        <div class="timer-msg">${t('timerMsg')} <b>0%</b></div>
                    </div>` : ''}
                    <div class="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-2xl">
                        <p class="text-indigo-600 font-bold">Mavzu tavsifi: <span class="text-slate-700">${l.topic || ''}</span></p>
                    </div>
                    <div class="prose max-w-none text-slate-700 leading-relaxed font-medium text-lg whitespace-pre-wrap mb-10">
                        ${l.content}
                    </div>
                    ${ytEmbed ? `
                    <div class="mb-12">
                        <h3 class="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><i data-lucide="play-circle" class="text-indigo-600 w-8 h-8"></i> Video Darslik</h3>
                        ${ytEmbed}
                    </div>` : ''}
                    <div class="mt-16 pt-10 border-t border-slate-100">
                        <button onclick="completeLesson(${l.id}, ${l.courseId})" class="w-full bg-emerald-500 text-white font-black py-6 rounded-[2.5rem] hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                            <i data-lucide="check-circle" class="w-8 h-8"></i> Darsni yakunlash va Ball olish
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }
    if (type === 'add-post') {
        m = `
        <div class="bg-white p-10 rounded-[3rem] w-full max-w-xl animate-zoom relative overflow-hidden">
             <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>
             <h2 class="text-3xl font-black mb-8 text-slate-800 relative flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><i data-lucide="edit-3" class="w-6 h-6"></i></div>
                Yangi Post Yarating
             </h2>
             <form onsubmit="svPost(event)" class="space-y-6 relative">
                 <div id="post-image-preview" class="hidden h-64 w-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl mb-8 group relative">
                    <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span class="text-white font-black text-xs uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full">Tanlangan Rasm</span>
                    </div>
                 </div>
                 <input id="p-title" required placeholder="Sarlavha" class="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-bold focus:ring-4 ring-indigo-50 outline-none transition-all">
                 <textarea id="p-content" required placeholder="Mazmuni..." rows="6" class="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-semibold focus:ring-4 ring-indigo-50 outline-none transition-all resize-none"></textarea>
                 
                 <label class="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-600 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-all font-black">
                     <i data-lucide="image"></i> Rasm yuklash
                     <input type="file" id="p-image-input" class="hidden" accept="image/*" onchange="previewPostImage(this)">
                 </label>
                 
                 <div class="flex gap-4">
                     <button type="button" onclick="cModal()" class="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl">Bekor qilish</button>
                     <button class="flex-2 bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-indigo-200">Nashr etish</button>
                 </div>
             </form>
        </div>`;
    }
    if (type === 'add-tkt') m = `<div class="bg-white p-8 rounded-[2rem] animate-zoom"><h2 class="text-2xl font-black mb-4">Texnik Yordam</h2><form onsubmit="svTkt(event)"><textarea id="m-desc" required placeholder="Nima qiyinchilik tug'ildi?" class="w-full border p-3 rounded-xl mb-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold" rows="4"></textarea><button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all">Yuborish</button></form></div>`;
    if (type === 'view-tkt') {
        const t = getDB().tickets.find(x => x.id === lId);
        STATE.activeTicketId = lId;
        m = `<div class="bg-slate-50 p-0 rounded-[2rem] max-h-[85vh] flex flex-col w-full max-w-2xl animate-zoom overflow-hidden border border-slate-200 shadow-2xl">
            <div class="glass p-5 border-b border-slate-200 flex justify-between items-center z-10">
                <div><h3 class="font-black text-slate-800 text-lg">Ticket #${t.id}</h3><p class="text-sm text-slate-500 font-medium">${t.user_name}</p></div>
                <div class="flex items-center gap-3">
                    ${STATE.user.role === 'admin' ? `
                    <select id="tkt-status-${t.id}" onchange="changeTktStatus(${t.id}, this.value)" class="bg-white border border-slate-200 text-sm font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer">
                        <option value="Ochiq" ${t.status === 'Ochiq' ? 'selected' : ''}>Ochiq</option>
                        <option value="Jarayonda" ${t.status === 'Jarayonda' ? 'selected' : ''}>Jarayonda</option>
                        <option value="Yopilgan" ${t.status === 'Yopilgan' ? 'selected' : ''}>Yopilgan</option>
                    </select>` : `<span class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm">${t.status}</span>`}
                    <button onclick="cModal()" class="w-8 h-8 flex justify-center items-center bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="p-6 overflow-y-auto flex-1 bg-white space-y-4" id="tkt-replies">
                <div class="flex flex-col items-start gap-1"><div class="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-sm max-w-[85%] font-medium">${t.message}</div></div>
                ${t.replies.map(r => `<div class="flex flex-col ${r.user_id === STATE.user.id ? 'items-end' : 'items-start'} gap-1 mb-2 animate-slide-up"><span class="text-[10px] font-bold text-slate-400 px-1">${r.user_name}</span><div class="p-4 rounded-2xl ${r.user_id === STATE.user.id ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-800 rounded-tl-sm'} max-w-[85%] font-medium whitespace-pre-wrap">${r.text}</div></div>`).join('')}
            </div>
            <form onsubmit="svReply(event)" class="p-4 bg-white border-t border-slate-200 flex gap-2 items-end">
                <textarea id="reply-text" required placeholder="Javob yozish..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 transition-colors resize-none disabled:opacity-50" rows="1" ${t.status === 'Yopilgan' ? 'disabled' : ''}></textarea>
                <button ${t.status === 'Yopilgan' ? 'disabled' : ''} class="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"><i data-lucide="send" class="w-5 h-5"></i></button>
            </form>
        </div>`;
    }
    if (type === 'view-group-attendance') {
        const db = getDB();
        const gId = lId;
        const group = db.groups.find(g => g.id === gId);
        if (!group) return `Guruh topilmadi`;

        const today = new Date().toISOString().split('T')[0];
        const record = db.attendance.find(a => a.groupId === gId && a.date === today);
        
        m = `
        <div class="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] max-h-[95vh] overflow-y-auto w-full max-w-4xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] animate-slide-up border border-white relative">
            <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div class="flex justify-between items-center mb-8 relative z-10">
                <div>
                     <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Guruh Boshqaruvi</p>
                     <h2 class="text-3xl md:text-4xl font-black text-slate-800">${group.name}</h2>
                </div>
                <button onclick="cModal()" class="bg-slate-100 p-3 md:p-4 rounded-2xl md:rounded-3xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            
            <div class="space-y-6 relative z-10">
                <div class="hidden md:grid grid-cols-12 gap-4 px-8 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <div class="col-span-1">№</div>
                    <div class="col-span-5">O'quvchi va Telefon</div>
                    <div class="col-span-6 text-center">Davomat va Sabab</div>
                </div>
                ${group.studentIds.map((sid, idx) => {
                    const st = db.users.find(u => u.id === sid);
                    if (!st) return '';
                    const status = record ? record.records[sid] : null;
                    const reason = record ? (record.reasons?.[sid] || '') : '';
                    const phone = st.phone || '';
                    const isUstoz = STATE.user.role === 'ustoz';
                    
                    return `
                    <div class="premium-card p-5 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col gap-6 hover:translate-y-[-5px] transition-all bg-white border-slate-100 shadow-premium group">
                        <div class="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
                            <div class="hidden md:block col-span-1 font-black text-slate-200 text-3xl">${idx + 1}</div>
                            <div class="col-span-1 md:col-span-5 flex items-center gap-5">
                                <div class="w-16 h-16 bg-slate-50 rounded-[1.8rem] flex items-center justify-center font-black text-indigo-600 border border-slate-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6 text-xl">${st.ism[0]}</div>
                                <div class="flex-1">
                                    <h4 class="font-black text-slate-800 text-xl mb-1">${st.ism}</h4>
                                    <div class="flex flex-col gap-1">
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Talaba ID: #${st.id}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <i data-lucide="phone" class="w-3 h-3 text-slate-400"></i>
                                            ${isUstoz ? `
                                                <input type="text" value="${phone}" placeholder="Phone..." 
                                                    onchange="updateStudentPhone(${st.id}, this.value)"
                                                    class="text-xs font-bold text-indigo-600 bg-transparent border-b border-dashed border-slate-200 focus:border-indigo-500 outline-none p-0.5 w-full">
                                            ` : `<span class="text-xs font-bold text-slate-500">${phone || 'Kiritilmagan'}</span>`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-1 md:col-span-6 flex flex-col items-center gap-4">
                                <div class="attendance-switch-premium ${status === 'present' ? 'present' : (status === 'absent' ? 'absent' : '')}" onclick="markAttendance(${gId}, ${sid}, this)">
                                    <div class="bg-present">Keldi</div>
                                    <div class="bg-absent">Kelmadi</div>
                                    <div class="toggle-indicator"></div>
                                </div>
                                <div id="reason-container-${sid}" class="${status === 'absent' ? '' : 'hidden'} w-full">
                                    <input type="text" id="reason-${sid}" value="${reason}" 
                                        placeholder="Sabab yozing..." 
                                        onchange="updateAttendanceReason(${gId}, ${sid}, this.value)"
                                        class="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 text-sm font-bold text-red-600 focus:ring-2 ring-red-100 outline-none transition-all placeholder:text-red-300">
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
                ${group.studentIds.length === 0 ? '<div class="py-20 text-center text-slate-300 font-black italic">Guruhda talabalar mavjud emas</div>' : ''}
            </div>
            
            <div class="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                <button onclick="cModal()" class="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all btn-interactive">Saqlash va Yopish</button>
            </div>
        </div>`;
    }
    a.innerHTML = m; safeLucide(a);
    if (type === 'view-tkt') {
        const repBox = document.getElementById('tkt-replies');
        repBox.scrollTop = repBox.scrollHeight;
    }
    // Start lesson timer if opening a lesson
    if (type === 'read-lesson' && STATE.user.role === 'student') {
        setTimeout(() => startLessonTimer(lId), 200);
    }
}
window.cModal = () => { 
    STATE.activeTicketId = null; 
    document.getElementById('modal-root').classList.replace('flex', 'hidden');
    // Stop timer if lesson modal closes
    stopLessonTimer();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') cModal(); });
document.getElementById('modal-root').addEventListener('click', e => { if (e.target.id === 'modal-root') cModal(); });

window.svCourse = async (e) => { 
    e.preventDefault(); 
    const newCourse = { 
        id: Date.now(), 
        title: document.getElementById('mc-t').value, 
        description: document.getElementById('mc-d').value, 
        teacherId: STATE.user.id, 
        category: 'Dasturlash', 
        status: 'Ochiq',
        lessons: []
    };

    // Immediate UI update
    let db = getDB();
    db.courses.push(newCourse);
    saveDB(db);
    cModal();
    renderView(STATE.view);
    showToast('Kurs muvaffaqiyatli yaratildi');

    // Sync to backend
    try {
        await fetch(`${API_BASE}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCourse)
        });
        syncBackend(); syncLandingData(); // Full sync to ensure consistency
    } catch (err) {
        console.error("Backend save failed:", err);
    }
}
window.svLesson = async (e) => { 
    e.preventDefault(); 
    let db = getDB(); 
    const course = db.courses.find(c => c.id === STATE.activeCourseId);
    if (!course) return;

    const newLesson = { 
        id: Date.now(), 
        courseId: STATE.activeCourseId, 
        topic: document.getElementById('ml-top').value, 
        title: document.getElementById('ml-t').value, 
        videoUrl: document.getElementById('ml-vid').value, 
        content: document.getElementById('ml-c').value 
    };

    course.lessons = course.lessons || [];
    course.lessons.push(newLesson);
    
    saveDB(db); 
    cModal(); 
    renderView(STATE.view); 
    showToast('Yangi dars qo\'shildi'); 

    // Sync to backend
    try {
        await fetch(`${API_BASE}/courses/${STATE.activeCourseId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessons: course.lessons })
        });
        syncBackend(); syncLandingData();
    } catch (err) {
        console.error("Backend lesson save failed:", err);
    }
}

window.completeLesson = (lId, cId) => {
    let db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    if (!u) return;

    u.progress = u.progress || {};
    u.progress[cId] = u.progress[cId] || { completed: [], percent: 0 };
    
    if (!u.progress[cId].completed.includes(lId)) {
        u.progress[cId].completed.push(lId);
        const course = db.courses.find(c => c.id === cId);
        const lessons = course.lessons || [];
        u.progress[cId].percent = Math.round((u.progress[cId].completed.length / lessons.length) * 100);
        
        saveDB(db);
        addPoints(7, "Dars o'qildi", "lessons");
        cModal();
        renderView('course-detail');
    } else {
        showToast("Bu darsni allaqachon yakunlagansiz", "info");
    }
};
// Removed duplicate completeLesson (handled via window.completeLesson earlier)

let POST_IMAGE_READY = null;
window.previewPostImage = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            POST_IMAGE_READY = e.target.result;
            const preview = document.getElementById('post-image-preview');
            preview.innerHTML = `<img src="${POST_IMAGE_READY}" class="w-full h-full object-cover rounded-[2rem]">`;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.svPost = async (e) => {
    e.preventDefault();
    const title = document.getElementById('p-title').value.trim();
    const content = document.getElementById('p-content').value.trim();
    
    if (!title || !content) {
        showToast("Sarlavha va matn qisman bo'sh bo'lishi mumkin emas!", "error");
        return;
    }

    const image = POST_IMAGE_READY;
    const today = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });

    const newPost = {
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
    };

    // Immediate local update
    let db = getDB();
    db.posts.push(newPost);
    saveDB(db);
    cModal();
    renderView(STATE.view);
    showToast('Post yuborildi');
    POST_IMAGE_READY = null;

    // Send to backend
    try {
        await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        });
        syncBackend(); syncLandingData();
    } catch (err) {
        console.error("Backend save failed:", err);
    }
};

window.svTkt = (e) => { e.preventDefault(); let db = getDB(); db.tickets.push({ id: Date.now(), user_id: STATE.user.id, user_name: STATE.user.ism, message: document.getElementById('m-desc').value, status: 'Ochiq', replies: [] }); saveDB(db); cModal(); renderView('support'); showToast('So`rov tushdi'); };
window.svReply = (e) => {
    e.preventDefault();
    let db = getDB();
    let t = db.tickets.find(x => x.id === STATE.activeTicketId);
    if (t) {
        t.replies.push({ id: Date.now(), user_id: STATE.user.id, user_name: STATE.user.ism, text: document.getElementById('reply-text').value });
        saveDB(db);
        oModal('view-tkt', t.id);
        if (STATE.view === 'support') renderView('support');
    }
};
window.changeTktStatus = (id, st) => { let db = getDB(); let t = db.tickets.find(x => x.id === id); if (t) { t.status = st; saveDB(db); showToast('Holat: ' + st); renderView('support'); } };

// ======================== OTHERS (Posts, etc) ========================
const v_posts = () => {
    const db = getDB();
    // Requirement: Show only approved posts (but allow authors/admins to see pending ones too for management)
    const posts = (db.posts || []).filter(p => p.status === 'approved' || p.authorId === STATE.user.id || ['admin', 'director', 'ustoz', 'student'].includes(STATE.user.role)).reverse();
    const r = STATE.user.role;

    return `
    <div class="max-w-4xl mx-auto space-y-10 animate-fade pb-20">
        <div class="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-premium">
            <div>
                <h2 class="text-4xl font-black text-slate-800 mb-1">Yangiliklar</h2>
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Platforma hayoti va yangiliklari</p>
            </div>
            ${STATE.user.role === 'admin' || STATE.user.role === 'ustoz' ? `
            <button onclick="oModal('add-post')" class="bg-indigo-600 text-white p-5 rounded-2xl shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>` : ''}
        </div>
        <div class="space-y-8">
            ${posts.map(p => {
                const comments = p.comments || [];
                return `
                <article class="glass-card overflow-hidden rounded-[3rem] border-none group bg-white">
                    ${p.image ? `
                    <div class="relative h-72 overflow-hidden cursor-zoom-in" onclick="zoomImage({src: '${p.image}'})">
                        <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                            <span class="text-white font-black text-lg flex items-center gap-2"><i data-lucide="maximize-2"></i> Kattalashtirish</span>
                        </div>
                    </div>` : ''}
                    <div class="p-10 space-y-6 relative">
                        ${!p.approved ? '<span class="absolute top-6 right-6 px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black uppercase rounded-lg">Kutilyapti</span>' : ''}
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">${p.author?.[0] || 'A'}</div>
                                <div>
                                    <p class="font-black text-slate-800">${p.author || 'Admin'}</p>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${p.date || 'Bugun'}</p>
                                </div>
                            </div>
                            ${(p.authorId === STATE.user.id || r === 'admin') ? `
                                <button onclick="dlPost(${p.id})" class="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            ` : ''}
                        </div>
                        <h3 class="text-3xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">${p.title || 'Sarlavhasiz post'}</h3>
                        <p class="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">${p.content || p.text || ''}</p>
                        
                        <div class="pt-6 border-t border-slate-50">
                            <div class="flex items-center justify-between mb-6">
                                <button onclick="toggleLike(${p.id}, this)" class="flex items-center gap-2 font-black text-sm ${p.liked_users?.includes(STATE.user.id) ? 'text-pink-500' : 'text-slate-400'} hover:text-pink-500 transition-colors">
                                    <i data-lucide="heart" class="w-5 h-5 ${p.liked_users?.includes(STATE.user.id) ? 'fill-current' : ''}"></i>
                                    <span class="like-counter">${p.likes || 0}</span>
                                </button>
                                <div class="flex items-center gap-2 text-slate-400 font-black text-sm">
                                    <i data-lucide="message-circle" class="w-5 h-5"></i>
                                    <span>${comments.length} Fikrlar</span>
                                </div>
                            </div>

                            <!-- Comments Section -->
                            <div class="space-y-4 mb-6">
                                ${comments.map(c => `
                                    <div class="flex gap-4 p-4 bg-slate-50/50 rounded-2xl group/c relative">
                                        <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">${c.userName[0]}</div>
                                        <div class="flex-1">
                                            <div class="flex justify-between">
                                                <p class="text-xs font-black text-slate-800">${c.userName}</p>
                                                <p class="text-[9px] font-bold text-slate-400">${c.time}</p>
                                            </div>
                                            <p class="text-xs text-slate-600 font-medium mt-1">${c.text}</p>
                                        </div>
                                        ${(c.userId === STATE.user.id || r === 'admin') ? `
                                            <button onclick="deleteComment(${p.id}, ${c.id})" class="absolute top-2 right-2 opacity-0 group-hover/c:opacity-100 p-1.5 text-red-300 hover:text-red-500 transition-all">
                                                <i data-lucide="x" class="w-3 h-3"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Add Comment -->
                            <form onsubmit="addComment(event, ${p.id})" class="relative">
                                <input type="text" placeholder="Fikr qoldiring..." class="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-semibold text-sm outline-none focus:ring-2 ring-indigo-100 transition-all pr-16" id="comment-input-${p.id}">
                                <button class="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                                    <i data-lucide="send" class="w-4 h-4"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </article>`;
            }).join('')}
            ${posts.length === 0 ? '<div class="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200"><p class="text-slate-400 font-black text-xl">Hozircha postlar yo\'q</p></div>' : ''}
        </div>
    </div>`;
};

window.addComment = (e, postId) => {
    e.preventDefault();
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    let db = getDB();
    const p = db.posts.find(x => x.id === postId);
    if (p) {
        p.comments = p.comments || [];
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        p.comments.push({
            id: Date.now(),
            userId: STATE.user.id,
            userName: STATE.user.ism,
            text,
            time
        });
        saveDB(db);
        input.value = '';
        renderView('posts');
        showToast("Fikringiz saqlandi!");
    }
};

window.deleteComment = (postId, commentId) => {
    if (!confirm("Fikrni o'chirmoqchimisiz?")) return;
    let db = getDB();
    const p = db.posts.find(x => x.id === postId);
    if (p) {
        p.comments = p.comments.filter(c => c.id !== commentId);
        saveDB(db);
        renderView('posts');
        showToast("Fikr o'chirildi", "info");
    }
};
window.dlPost = id => { let db = getDB(); db.posts = db.posts.filter(x => x.id !== id); saveDB(db); renderView('posts'); showToast('Ochrildi', 'error'); }

window.toggleLike = (id, btn) => {
    let db = getDB();
    let p = db.posts.find(x => x.id === id);
    if (p) {
        p.liked_users = p.liked_users || [];
        let liked = p.liked_users.includes(STATE.user.id);
        if (liked) {
            p.liked_users = p.liked_users.filter(u => u !== STATE.user.id);
            p.likes = Math.max(0, p.likes - 1);
        } else {
            p.liked_users.push(STATE.user.id);
            p.likes++;
        }
        saveDB(db);

        // Instant UI update
        const countSpan = btn.querySelector('.like-counter');
        const icon = btn.querySelector('svg');
        countSpan.innerText = p.likes;
        if (!liked) {
            btn.classList.add('!text-pink-500');
            icon.classList.add('fill-current', 'scale-125');
            setTimeout(() => icon.classList.remove('scale-125'), 150);
        } else {
            btn.classList.remove('!text-pink-500');
            icon.classList.remove('fill-current');
        }
    }
}

// ======================== FULLY WORKING EXTRA VIEWS ========================
const v_lead = () => {
    const db = getDB();
    const allStudents = db.users.filter(x => x.role === 'student').sort((a, b) => b.points - a.points);
    const myGroupId = STATE.user.groupId;
    const myGroup = (db.groups||[]).find(g => g.id === myGroupId);
    const groupStudents = myGroupId ? allStudents.filter(s => s.groupId === myGroupId) : allStudents;

    // Weekly tournament: top group by total XP
    const groupTotals = (db.groups||[]).map(g => ({
        ...g,
        totalXP: db.users.filter(u => u.groupId === g.id && u.role==='student').reduce((s,u)=>s+(u.points||0),0)
    })).sort((a,b)=>b.totalXP-a.totalXP);

    const medalColors = ['text-yellow-500','text-slate-400','text-amber-600'];
    const medalIcons = ['🥇','🥈','🥉'];

    return `<div class="max-w-5xl mx-auto space-y-10 animate-fade">
    <div class="text-center">
        <h1 class="text-4xl font-black text-slate-800 mb-2">${t('leaderboard')}</h1>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">${'Reyting va turnirlar'}</p>
    </div>

    <!-- Group Tournament Leaderboard -->
    <div class="glass-card p-8 rounded-[2.5rem] bg-white shadow-premium">
        <h2 class="text-xl font-black mb-6 flex items-center gap-2">
            <i data-lucide="trophy" class="text-yellow-500 w-6 h-6"></i>
            ${'Guruhlar Musobaqasi'}
            <span class="ml-auto text-xs font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl uppercase tracking-widest">${'XP bo\'yicha'}</span>
        </h2>
        <div class="space-y-3">
        ${groupTotals.map((g,i) => `
            <div class="flex items-center gap-4 p-4 rounded-2xl transition-all ${ i===0?'bg-yellow-50 border-2 border-yellow-200':'bg-slate-50 border border-slate-100'} hover:shadow-md">
                <span class="text-3xl w-10 text-center">${medalIcons[i]||i+1}</span>
                <div class="flex-1">
                    <p class="font-black text-slate-800">${g.name}</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase">${g.studentIds.length} ${"o'quvchi"}</p>
                </div>
                <div class="text-right">
                    <p class="font-black text-indigo-700 text-xl">${g.totalXP}</p>
                    <p class="text-[10px] font-bold text-slate-400">XP</p>
                </div>
                ${i===0?'<span class="px-3 py-1 bg-yellow-400 text-white rounded-xl text-[10px] font-black uppercase">🏆 TOP</span>':''}
            </div>`).join('')}
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- My Group Leaderboard -->
    <div class="glass-card p-8 rounded-[2.5rem] bg-white shadow-premium">
        <h2 class="text-lg font-black mb-6 flex items-center gap-2">
            <i data-lucide="users" class="text-indigo-600 w-5 h-5"></i>
            ${myGroup ? myGroup.name : ("Mening guruhim")}
        </h2>
        <div class="space-y-3">
        ${groupStudents.map((x,i) => `
            <div class="flex items-center gap-3 p-3 rounded-2xl transition-all ${ x.id===STATE.user.id ? 'bg-indigo-50 border-2 border-indigo-200':'hover:bg-slate-50'}">
                <span class="font-black text-slate-300 w-6 text-center">${i+1}</span>
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex justify-center items-center font-black overflow-hidden">
                    ${x.avatar ? `<img src="${x.avatar}" class="w-full h-full object-cover">` : x.ism[0]}
                </div>
                <span class="flex-1 font-bold text-slate-800 ${ x.id===STATE.user.id?'text-indigo-700':''} truncate">${x.ism} ${ x.id===STATE.user.id?'<span class="text-[9px] text-indigo-400 font-black">(Sen)</span>':''}</span>
                <span class="font-black text-indigo-600">${x.points} XP</span>
            </div>`).join('')}
        ${groupStudents.length===0?`<p class="text-slate-400 font-bold text-center py-8">${"Talabalar yo'q"}</p>`:''}
        </div>
    </div>

    <!-- Global Top 10 -->
    <div class="glass-card p-8 rounded-[2.5rem] bg-white shadow-premium">
        <h2 class="text-lg font-black mb-6 flex items-center gap-2">
            <i data-lucide="globe" class="text-emerald-500 w-5 h-5"></i>
            ${'Umumiy Reyting'}
        </h2>
        <div class="space-y-3">
        ${allStudents.slice(0,10).map((x,i) => `
            <div class="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all ${ x.id===STATE.user.id?'bg-indigo-50 border border-indigo-200':''}">
                <span class="font-black ${medalColors[i]||'text-slate-300'} w-6 text-center text-lg">${medalIcons[i]||i+1}</span>
                <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex justify-center items-center font-black overflow-hidden">
                    ${x.avatar ? `<img src="${x.avatar}" class="w-full h-full object-cover">` : x.ism[0]}
                </div>
                <span class="flex-1 font-bold text-slate-800 truncate">${x.ism}</span>
                <span class="font-black text-indigo-600">${x.points} XP</span>
            </div>`).join('')}
        </div>
    </div>
    </div>
    </div>`;
};
const v_sup = () => {
    const db = getDB();
    const myTickets = STATE.user.role === 'admin' ? db.tickets : db.tickets.filter(t => t.user_id === STATE.user.id);
    myTickets.reverse();

    return `<div class="max-w-4xl mx-auto"><h1 class="text-3xl font-black text-slate-800 mb-8">Yordam Markazi</h1>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1">
            <div class="glass-card p-6 rounded-3xl bg-white text-center hover:shadow-xl transition-shadow tilt-card mb-6 border border-slate-100">
                <div class="w-16 h-16 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center mb-4"><i data-lucide="help-circle" class="w-8 h-8 text-indigo-600"></i></div>
                <h2 class="text-xl font-bold text-slate-800 mb-2">Yordam kerakmi?</h2>
                <p class="text-slate-500 mb-6 font-medium text-sm">Savol va muammolaringizni yozib qoldiring, biz tez orada javob beramiz.</p>
                <button onclick="oModal('add-tkt')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all">Yangi So'rov</button>
            </div>
        </div>
        <div class="lg:col-span-2 space-y-4">
            <h2 class="text-xl font-black text-slate-800 mb-4 px-2">Sizning so'rovlaringiz</h2>
            ${myTickets.length ? myTickets.map(t => {
        let statusColor = t.status === 'Ochiq' ? 'bg-amber-100 text-amber-700' : (t.status === 'Jarayonda' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700');
        let unread = t.replies.length > 0 && t.replies[t.replies.length - 1].user_id !== STATE.user.id;
        return `<div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative ${unread ? 'border-l-4 border-l-indigo-600' : ''}" onclick="oModal('view-tkt', ${t.id})">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="font-black text-slate-800">#${t.id}</span>
                            <span class="text-xs font-black px-2 py-1 rounded-lg ${statusColor}">${t.status}</span>
                            ${STATE.user.role === 'admin' ? `<span class="text-xs font-bold text-slate-400">@${t.user_name}</span>` : ''}
                        </div>
                        <p class="text-sm font-medium text-slate-500 line-clamp-1">${t.message}</p>
                    </div>
                    <div class="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-xl">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> ${t.replies.length}
                    </div>
                </div>`;
    }).join('') : '<div class="text-center p-10 bg-white border border-slate-200 rounded-[2rem]"><p class="text-slate-500 font-medium">Hozircha so`rovlar yo`q.</p></div>'}
        </div>
    </div></div>`;
};
const v_users = () => {
    return `
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-black text-slate-800 mb-8">Foydalanuvchilar Boshqaruvi</h1>
        <div class="glass-card rounded-[2.5rem] bg-white overflow-hidden border border-slate-100 shadow-xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <th class="p-6">Foydalanuvchi</th>
                            <th class="p-6">Email va Ball</th>
                            <th class="p-6">Rol Ozgartirish</th>
                            <th class="p-6 text-right">Amallar</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${getDB().users.map(u => `
                            <tr class="hover:bg-indigo-50/30 transition-colors group">
                                <td class="p-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-2xl bg-slate-100 font-black text-indigo-600 flex items-center justify-center group-hover:bg-white transition-colors">
                                            ${u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover rounded-2xl">` : u.ism[0]}
                                        </div>
                                        <div>
                                            <p class="font-extrabold text-slate-800">${u.ism}</p>
                                            <p class="text-xs font-black uppercase tracking-widest text-indigo-500 mt-1">${u.role.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <p class="text-slate-500 font-bold text-sm">${u.email}</p>
                                    <p class="text-xs font-black text-emerald-500 mt-1"><i data-lucide="zap" class="w-3 h-3 inline"></i> ${u.points} Ball</p>
                                </td>
                                <td class="p-6">
                                    <select onchange="changeRole(${u.id}, this.value)" class="bg-slate-50 border border-slate-100 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none focus:ring-2 ring-indigo-100 transition-all cursor-pointer">
                                        <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
                                        <option value="ustoz" ${u.role === 'ustoz' ? 'selected' : ''}>Ustoz</option>
                                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                        <option value="tech_admin" ${u.role === 'tech_admin' ? 'selected' : ''}>Tech Admin</option>
                                        <option value="director" ${u.role === 'director' ? 'selected' : ''}>Director</option>
                                    </select>
                                </td>
                                <td class="p-6 text-right">
                                    <button onclick="banUser(${u.id})" class="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center ml-auto border border-red-100">
                                        <i data-lucide="user-minus" class="w-5 h-5"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
};
window.changeRole = (id, newRole) => {
    let db = getDB();
    let u = db.users.find(x => x.id === id);
    if (u) {
        u.role = newRole;
        saveDB(db);
        showToast(`${u.ism} roli ${newRole}ga o'zgardi`);
        renderView('users');
    }
}
window.banUser = id => {
    if (id === STATE.user.id) { showToast('O\'zingizni o\'chira olmaysiz!', 'error'); return; }
    if (!confirm('Haqiqatdan ham ushbu foydalanuvchini platformadan chetlatmoqchimisiz?')) return;
    let db = getDB();
    db.users = db.users.filter(x => x.id !== id);
    saveDB(db);
    showToast('Foydalanuvchi tizimdan o\'chirildi', 'error');
    renderView('users');
};

// ======================== GROUPS & ATTENDANCE ========================
const v_groups = () => {
    const db = getDB();
    const r = STATE.user.role;
    let groups = [];
    if (r === 'admin' || r === 'tech_admin') groups = db.groups || [];
    else if (r === 'ustoz') groups = (db.groups || []).filter(g => g.ustozId === STATE.user.id);

    return `
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-black text-slate-800">Guruhlar Boshqaruvi</h1>
        ${r === 'admin' ? `<button onclick="oModal('add-group')" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold btn-interactive shadow-lg shadow-indigo-600/20">Yangi Guruh</button>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${groups.map(g => {
            const ustoz = db.users.find(u => u.id === g.ustozId);
            return `
            <div class="glass-card p-6 rounded-[2rem] tilt-card cursor-pointer" onclick="oModal('view-group-attendance', ${g.id})">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black">${g.name[0]}</div>
                    <span class="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">${(g.studentIds || []).length} O'quvchi</span>
                </div>
                <h3 class="font-black text-slate-800 text-xl mb-1">${g.name}</h3>
                <p class="text-xs font-bold text-slate-400 mb-4 uppercase tracking-tighter flex items-center gap-2">USTOZ: ${ustoz ? ustoz.ism : 'Tayinlanmagan'}
                    ${r === 'admin' ? `
                    <select onchange="event.stopPropagation(); assignUstozToGroup(${g.id}, this.value)" class="bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none ml-auto text-slate-800 cursor-pointer">
                        <option value="" disabled selected>O'zgartirish</option>
                        ${db.users.filter(u => u.role === 'ustoz').map(u => `<option value="${u.id}">${u.ism}</option>`).join('')}
                    </select>` : ''}
                </p>
                <div class="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span class="text-xs font-black text-indigo-600">DAVOMATNI KO'RISH</span>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

const v_attendance = () => {
    const db = getDB();
    const u = STATE.user;
    const r = u.role;

    if (r === 'student') {
        const myAtt = (db.attendance || []).filter(a => a.groupId === u.groupId).reverse();
        const presentCount = myAtt.filter(a => a.records[u.id] === 'present').length;
        const totalCount = myAtt.length;
        const percent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        return `
        <div class="max-w-4xl mx-auto space-y-10 animate-fade">
            <header class="flex justify-between items-center p-8 bg-white rounded-[2.5rem] shadow-premium">
                <div>
                    <h1 class="text-4xl font-black text-slate-800">Davomat Tarixi</h1>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Sizning platformadagi faolligingiz</p>
                </div>
                <div class="flex items-center gap-4 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl">
                    <i data-lucide="check-circle"></i>
                    <span class="font-black text-xl">${percent}%</span>
                </div>
            </header>

            <div class="space-y-4">
                ${myAtt.map((a, idx) => {
                    const isPresent = a.records[u.id] === 'present';
                    return `
                    <div class="glass-card p-6 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                        <div class="flex items-center gap-6">
                            <div class="w-12 h-12 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center font-black">${myAtt.length - idx}</div>
                            <div>
                                <p class="font-black text-slate-800 text-lg">${new Date(a.date).toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${a.date}</p>
                            </div>
                        </div>
                        <span class="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}">
                            ${isPresent ? 'Keldi' : 'Kelmadi'}
                        </span>
                    </div>`;
                }).join('')}
                ${myAtt.length === 0 ? '<div class="py-20 text-center text-slate-300 font-black italic">Ma\'lumotlar topilmadi</div>' : ''}
            </div>
        </div>`;
    }

    return `<div class="text-center py-20"><i data-lucide="info" class="w-16 h-16 text-indigo-200 mx-auto mb-4"></i><h2 class="text-2xl font-black text-slate-800">Guruhni tanlang</h2><p class="text-slate-400 font-bold mt-2">Davomatni boshqarish uchun avval guruhlarga o'ting.</p><button onclick="window.location.hash='groups'" class="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">Guruhlar</button></div>`;
}

const v_reports = () => {
    const db = getDB();
    const students = db.users.filter(u => u.role === 'student');
    
    return `
    <h1 class="text-3xl font-black text-slate-800 mb-8">Davomat Hisoboti</h1>
    <div class="glass-card p-8 rounded-[2.5rem] overflow-hidden shadow-premium">
        <table class="w-full text-left">
            <thead>
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                    <th class="pb-6">O'quvchi</th>
                    <th class="pb-6">Guruh</th>
                    <th class="pb-6 text-center">Davomat %</th>
                    <th class="pb-6 text-right">Amal</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
                ${students.map(s => {
                    const g = (db.groups || []).find(x => x.id === s.groupId);
                    const att = (db.attendance || []).filter(a => a.groupId === s.groupId);
                    const pDays = att.filter(a => a.records[s.id] === 'present').length;
                    const total = att.length;
                    const percent = total > 0 ? Math.round((pDays / total) * 100) : 0;
                    return `
                    <tr>
                        <td class="py-5 font-bold text-slate-800">${s.ism}</td>
                        <td class="py-5 text-sm text-slate-500 font-bold">${g ? g.name : '-'}</td>
                        <td class="py-5">
                            <div class="flex flex-col items-center gap-1">
                                <span class="text-xs font-black ${percent > 80 ? 'text-emerald-500' : 'text-amber-500'}">${percent}%</span>
                                <div class="w-20 h-1 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-indigo-500" style="width: ${percent}%"></div></div>
                            </div>
                        </td>
                        <td class="py-5 text-right">
                            <button class="bg-slate-50 p-2 rounded-lg text-slate-400 hover:text-indigo-600 transition"><i data-lucide="eye" class="w-4 h-4"></i></button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

// ======================== QUESTION MANAGEMENT ========================
const v_questions_mgmt = () => {
    const db = getDB();
    const questions = db.questions || [];
    
    return `
    <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-black text-slate-800">Savollar Boshqaruvi</h1>
        <button onclick="oModal('add-question')" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold btn-interactive shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <i data-lucide="plus" class="w-5 h-5"></i> Yangi Savol
        </button>
    </div>
    
    <div class="glass-card rounded-[2.5rem] bg-white overflow-hidden border border-slate-100 shadow-xl">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        <th class="p-6">Savol</th>
                        <th class="p-6">Turi va Qiyinchiligi</th>
                        <th class="p-6">Variantlar</th>
                        <th class="p-6 text-right">Amallar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    ${questions.length === 0 ? `<tr><td colspan="4" class="p-10 text-center text-slate-400 font-bold">Savollar hali mavjud emas.</td></tr>` : 
                    questions.map(q => `
                        <tr class="hover:bg-indigo-50/30 transition-colors group">
                            <td class="p-6 max-w-xs">
                                <p class="font-extrabold text-slate-800 line-clamp-2">${q.questionText}</p>
                                <p class="text-[10px] font-black text-indigo-500 mt-1 uppercase tracking-widest">ID: #${q.id}</p>
                            </td>
                            <td class="p-6">
                                <div class="flex flex-col gap-1">
                                    <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">${q.type.replace('_', ' ')}</span>
                                    <span class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">${q.difficulty}</span>
                                </div>
                            </td>
                            <td class="p-6">
                                <div class="grid grid-cols-2 gap-2 text-[10px] font-bold">
                                    <div class="${q.correctAnswer === 'A' ? 'text-emerald-600' : 'text-slate-400'}">A: ${q.optionA}</div>
                                    <div class="${q.correctAnswer === 'B' ? 'text-emerald-600' : 'text-slate-400'}">B: ${q.optionB}</div>
                                    <div class="${q.correctAnswer === 'C' ? 'text-emerald-600' : 'text-slate-400'}">C: ${q.optionC}</div>
                                    <div class="${q.correctAnswer === 'D' ? 'text-emerald-600' : 'text-slate-400'}">D: ${q.optionD}</div>
                                </div>
                            </td>
                            <td class="p-6 text-right">
                                <div class="flex justify-end gap-2">
                                    <button onclick="oModal('edit-question', ${q.id})" class="w-9 h-9 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-slate-200">
                                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="deleteQuestion(${id = q.id})" class="w-9 h-9 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>`;
};

window.deleteQuestion = (id) => {
    if (!confirm("Haqiqatdan ham ushbu savolni o'chirmoqchimisiz?")) return;
    let db = getDB();
    db.questions = db.questions.filter(q => q.id !== id);
    saveDB(db);
    showToast("Savol o'chirildi", "error");
    renderView('questions_mgmt');
};

window.svQuestion = (e, id = null) => {
    e.preventDefault();
    let db = getDB();
    const qData = {
        id: id || Date.now(),
        questionText: document.getElementById('mq-text').value.trim(),
        optionA: document.getElementById('mq-a').value.trim(),
        optionB: document.getElementById('mq-b').value.trim(),
        optionC: document.getElementById('mq-c').value.trim(),
        optionD: document.getElementById('mq-d').value.trim(),
        correctAnswer: document.getElementById('mq-correct').value,
        type: document.getElementById('mq-type').value,
        difficulty: document.getElementById('mq-diff').value
    };

    if (!qData.questionText || !qData.optionA || !qData.optionB || !qData.optionC || !qData.optionD) {
        showToast("Barcha maydonlarni to'ldiring!", "error");
        return;
    }

    if (id) {
        const idx = db.questions.findIndex(q => q.id === id);
        if (idx !== -1) db.questions[idx] = qData;
    } else {
        db.questions.push(qData);
    }

    saveDB(db);
    cModal();
    renderView('questions_mgmt');
    showToast(id ? "Savol yangilandi" : "Yangi savol qo'shildi");
};

window.markAttendance = (gId, sId, el) => {
    const today = new Date().toISOString().split('T')[0];
    let db = getDB();
    let record = db.attendance.find(a => a.groupId === gId && a.date === today);

    if (!record) {
        record = { id: Date.now(), groupId: gId, date: today, records: {}, reasons: {} };
        db.attendance.push(record);
    }

    const currentStatus = record.records[sId];
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    record.records[sId] = newStatus;

    // Toggle reason input visibility
    const reasonContainer = document.getElementById(`reason-container-${sId}`);
    if (reasonContainer) {
        if (newStatus === 'absent') {
            reasonContainer.classList.remove('hidden');
        } else {
            reasonContainer.classList.add('hidden');
            if (record.reasons) delete record.reasons[sId];
        }
    }

    // Logic for 3-day absence alert
    if (newStatus === 'absent') {
        const studentAttendanceRecords = db.attendance.filter(a => a.groupId === gId && a.records[sId] === 'absent');
        let consecutiveAbsences = 0;
        for (let i = studentAttendanceRecords.length - 1; i >= 0; i--) {
            if (studentAttendanceRecords[i].records[sId] === 'absent') {
                consecutiveAbsences++;
            } else {
                break;
            }
        }

        if (consecutiveAbsences >= 3) {
            const student = db.users.find(u => u.id === sId);
            const group = db.groups.find(g => g.id === gId);
            db.notifications = db.notifications || [];
            const alertMsg = `Diqqat! ${student.ism} (Guruh: ${group.name}) ketma-ket ${consecutiveAbsences} marta darsga kelmadi.`;
            
            const existingNotification = db.notifications.find(n => 
                n.msg.includes(student.ism) && 
                n.date === today && 
                n.type === 'warning'
            );

            if (!existingNotification) {
                db.notifications.push({ id: Date.now(), msg: alertMsg, date: today, type: 'warning', seen: false });
                showToast("3 kunlik dars qoldirish aniqlandi!", "error");
            }
        }
    }

    saveDB(db);
    el.className = `attendance-switch-premium ${newStatus}`;
};

window.updateAttendanceReason = (gId, sId, val) => {
    let db = getDB();
    const today = new Date().toISOString().split('T')[0];
    let record = db.attendance.find(a => a.groupId === gId && a.date === today);
    if (record) {
        record.reasons = record.reasons || {};
        record.reasons[sId] = val;
        saveDB(db);
    }
};

window.updateStudentPhone = (sId, val) => {
    let db = getDB();
    let u = db.users.find(x => x.id === sId);
    if (u) {
        u.phone = val;
        saveDB(db);
        showToast("Telefon raqami saqlandi");
    }
};

const originalOModal = window.oModal;
window.oModal = (type, lId) => {
    if (type === 'add-group') {
        const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
        bg.classList.remove('hidden'); bg.classList.add('flex');
        const db = getDB();
        const ustozlar = db.users.filter(u => u.role === 'ustoz');
        
        a.innerHTML = `
        <div class="bg-white p-10 rounded-[2.5rem] animate-zoom w-full max-w-lg shadow-2xl">
            <h2 class="text-3xl font-black mb-6 text-slate-800">Yangi Guruh</h2>
            <form onsubmit="svGroup(event)">
                <div class="space-y-4">
                    <input id="mg-name" required placeholder="Guruh nomi (masalan: D 02 25)" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold">
                    <select id="mg-ustoz" required class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold">
                        <option value="" disabled selected>Ustozni tanlang</option>
                        ${ustozlar.map(u => `<option value="${u.id}">${u.ism}</option>`).join('')}
                    </select>
                    <button class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700">Yaratish</button>
                </div>
            </form>
        </div>`;
        safeLucide(a);
        return;
    }
    if (type === 'add-book') {
        const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
        bg.classList.remove('hidden'); bg.classList.add('flex');
        a.innerHTML = `
        <div class="bg-white p-10 rounded-[2.5rem] animate-zoom w-full max-w-xl shadow-2xl">
            <h2 class="text-3xl font-black mb-6 text-slate-800">📚 Kitob Qo'shish</h2>
            <form onsubmit="svBook(event)">
                <div class="space-y-4">
                    <input id="bk-title" required placeholder="Kitob nomi" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none">
                    <textarea id="bk-desc" required placeholder="Tavsif yoki muallif..." class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none" rows="3"></textarea>
                    <input id="bk-img" placeholder="Muqova rasm URL (ixtiyoriy)" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none">
                    <input id="bk-link" placeholder="PDF yoki havola URL (ixtiyoriy)" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none">
                    <div class="flex gap-4 pt-2">
                        <button type="button" onclick="cModal()" class="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl">Bekor</button>
                        <button class="flex-2 bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">Saqlash</button>
                    </div>
                </div>
            </form>
        </div>`;
        safeLucide(a);
        return;
    }
    if (type === 'view-book') {
        const db = getDB();
        const b = (db.books || []).find(x => x.id === lId);
        if (!b) return;
        const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
        bg.classList.remove('hidden'); bg.classList.add('flex');
        a.innerHTML = `
        <div class="bg-white rounded-[3rem] overflow-hidden animate-zoom w-full max-w-2xl shadow-2xl">
            ${b.image ? `<div class="h-64 overflow-hidden relative">
                <img src="${b.image}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>` : '<div class="h-32 bg-gradient-to-br from-indigo-100 to-purple-100"></div>'}
            <div class="p-10">
                <h2 class="text-3xl font-black text-slate-800 mb-3">${b.title}</h2>
                <p class="text-slate-600 font-medium text-lg leading-relaxed mb-8">${b.description || ''}</p>
                ${b.link && b.link !== '#' ? `
                <a href="${b.link}" target="_blank" class="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all">
                    <i data-lucide="download" class="w-5 h-5"></i> Kitobni Yuklab Olish
                </a>` : '<p class="text-slate-300 font-bold italic text-sm">Yuklab olish havolasi yo\'q</p>'}
                <button onclick="cModal()" class="mt-6 block w-full text-center py-4 bg-slate-50 text-slate-500 font-black rounded-2xl hover:bg-slate-100 transition-all">Yopish</button>
            </div>
        </div>`;
        safeLucide(a);
        return;
    }
    if (type === 'add-question' || type === 'edit-question') {
        const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
        bg.classList.remove('hidden'); bg.classList.add('flex');
        const db = getDB();
        const q = type === 'edit-question' ? db.questions.find(x => x.id === lId) : null;
        
        a.innerHTML = `
        <div class="bg-white p-10 rounded-[2.5rem] animate-zoom w-full max-w-xl shadow-2xl relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl"></div>
            <h2 class="text-3xl font-black mb-8 text-slate-800 relative">${q ? 'Savolni Tahrirlash' : 'Yangi Savol'}</h2>
            <form onsubmit="svQuestion(event, ${q ? q.id : 'null'})" class="space-y-4 relative">
                <div>
                    <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Savol Matni</label>
                    <textarea id="mq-text" required placeholder="Savol matnini kiriting..." class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none focus:border-indigo-300 transition-all" rows="3">${q ? q.questionText : ''}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Variant A</label>
                        <input id="mq-a" required value="${q ? q.optionA : ''}" placeholder="Variant A" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none focus:border-indigo-300 transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Variant B</label>
                        <input id="mq-b" required value="${q ? q.optionB : ''}" placeholder="Variant B" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none focus:border-indigo-300 transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Variant C</label>
                        <input id="mq-c" required value="${q ? q.optionC : ''}" placeholder="Variant C" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none focus:border-indigo-300 transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Variant D</label>
                        <input id="mq-d" required value="${q ? q.optionD : ''}" placeholder="Variant D" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none focus:border-indigo-300 transition-all">
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">To'g'ri Javob</label>
                        <select id="mq-correct" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none cursor-pointer">
                            <option value="A" ${q && q.correctAnswer === 'A' ? 'selected' : ''}>A</option>
                            <option value="B" ${q && q.correctAnswer === 'B' ? 'selected' : ''}>B</option>
                            <option value="C" ${q && q.correctAnswer === 'C' ? 'selected' : ''}>C</option>
                            <option value="D" ${q && q.correctAnswer === 'D' ? 'selected' : ''}>D</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Turi</label>
                        <select id="mq-type" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none cursor-pointer">
                            <option value="mini_game" ${q && q.type === 'mini_game' ? 'selected' : ''}>Mini Game</option>
                            <option value="duel" ${q && q.type === 'duel' ? 'selected' : ''}>Duel</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Qiyinchilik</label>
                        <select id="mq-diff" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white outline-none cursor-pointer">
                            <option value="easy" ${q && q.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                            <option value="medium" ${q && q.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="hard" ${q && q.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-4 pt-6">
                    <button type="button" onclick="cModal()" class="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all">Bekor qilish</button>
                    <button class="flex-2 bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">Saqlash</button>
                </div>
            </form>
        </div>`;
        safeLucide(a);
        return;
    }
    if (type === 'change-password') {
        const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
        bg.classList.remove('hidden'); bg.classList.add('flex');
        a.innerHTML = `<div class="bg-white p-10 rounded-[2.5rem] animate-zoom w-full max-w-lg shadow-2xl">
            <h2 class="text-3xl font-black mb-6 text-slate-800 flex items-center gap-3"><i data-lucide="lock" class="text-indigo-600"></i> Parolni o'zgartirish</h2>
            <div class="space-y-4">
                <input type="password" id="cp-old" placeholder="Eski parol" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none">
                <input type="password" id="cp-new" placeholder="Yangi parol" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none">
                <input type="password" id="cp-confirm" placeholder="Yangi parolni tasdiqlang" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white focus:border-indigo-300 outline-none">
                <div class="flex gap-4 pt-4">
                    <button onclick="cModal()" class="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all">Bekor qilish</button>
                    <button onclick="changePasswordSubmit()" class="flex-2 bg-indigo-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all">O'zgartirish</button>
                </div>
            </div>
        </div>`;
        safeLucide(a);
        return;
    }
    originalOModal(type, lId);
};

window.changePasswordSubmit = () => {
    let db = getDB();
    const oldP = document.getElementById('cp-old')?.value || document.getElementById('prof-pw-old')?.value;
    const newP = document.getElementById('cp-new')?.value || document.getElementById('prof-pw-new')?.value;
    const confP = document.getElementById('cp-confirm')?.value || document.getElementById('prof-pw-conf')?.value;

    let u = db.users.find(x => x.id === STATE.user.id);
    if (!u) return;

    if (u.password !== oldP) { showToast("Eski parol noto'g'ri!", "error"); return; }
    if (!newP) { showToast("Yangi parol bo'sh bo'lishi mumkin emas!", "error"); return; }
    if (newP !== confP) { showToast("Yangi parollar mos kelmadi!", "error"); return; }

    u.password = newP;
    saveDB(db);
    STATE.user.password = newP;
    localStorage.setItem('lms_user', JSON.stringify(STATE.user));
    
    if(document.getElementById('prof-pw-old')) document.getElementById('prof-pw-old').value = '';
    if(document.getElementById('prof-pw-new')) document.getElementById('prof-pw-new').value = '';
    if(document.getElementById('prof-pw-conf')) document.getElementById('prof-pw-conf').value = '';
    
    if(document.getElementById('cp-old')) document.getElementById('cp-old').value = '';
    if(document.getElementById('cp-new')) document.getElementById('cp-new').value = '';
    if(document.getElementById('cp-confirm')) document.getElementById('cp-confirm').value = '';
    
    showToast("Parol o‘zgartirildi!");
    cModal();
};

window.assignUstozToGroup = (gId, uId) => {
    if (!uId) return;
    let db = getDB();
    const group = db.groups.find(g => g.id === gId);
    if (group) {
        group.ustozId = parseInt(uId);
        const today = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
        
        db.notifications = db.notifications || [];
        group.studentIds.forEach(sId => {
            db.notifications.push({
                id: Date.now() + Math.random(),
                userId: sId,
                msg: "Yangi ustoz sizning guruhingizga qo‘shildi",
                date: today,
                type: 'info',
                seen: false
            });
        });
        
        saveDB(db);
        showToast("Ustoz tayinlandi");
        renderView('groups');
    }
};

window.svBook = (e) => {
    e.preventDefault();
    let db = getDB();
    db.books = db.books || [];
    db.books.push({
        id: Date.now(),
        title: document.getElementById('bk-title').value,
        description: document.getElementById('bk-desc').value,
        image: document.getElementById('bk-img').value,
        link: document.getElementById('bk-link').value || '#'
    });
    saveDB(db);
    cModal();
    renderView('library');
    showToast("Kitob qo'shildi! 📚");
};

window.svGroup = (e) => {
    e.preventDefault();
    let db = getDB();
    db.groups = db.groups || [];
    db.groups.push({
        id: Date.now(),
        name: document.getElementById('mg-name').value,
        ustozId: parseInt(document.getElementById('mg-ustoz').value),
        studentIds: []
    });
    saveDB(db);
    cModal();
    renderView('groups');
    showToast('Guruh yaratildi');
};

// ======================== GROUP CHAT SYSTEM ========================
let VOICE_RECORDER = null;
let VOICE_CHUNKS = [];
let VOICE_BLOB = null;
let IS_RECORDING = false;

const v_chat = () => {
    const db = getDB();
    const r = STATE.user.role;
    let gid = STATE.user.groupId;
    
    // Pick first group if teacher has no fixed groupId but manages groups
    if (!gid && (r === 'ustoz' || r === 'admin')) {
        const mg = db.groups.find(x => r === 'admin' ? true : x.ustozId === STATE.user.id);
        if (mg) gid = mg.id;
    }
    
    if (!gid) return `<div class="p-10 text-center"><i data-lucide="info" class="w-16 h-16 text-slate-200 mx-auto mb-4"></i><h2 class="text-2xl font-black">Guruh topilmadi</h2><p class="text-slate-500 font-bold">Siz hali birorta guruhga a'zo emassiz.</p></div>`;

    const g = db.groups.find(x => x.id === gid);
    const msgs = (db.chatMessages || []).filter(m => r === 'admin' ? m.groupId === gid : m.groupId === gid);

    setTimeout(() => {
        const area = document.getElementById('chat-messages-area');
        if (area) area.scrollTop = area.scrollHeight;
    }, 100);

    return `
    <div class="chat-container">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black">
                    ${g ? g.name[0] : 'C'}
                </div>
                <div>
                    <div class="flex items-center gap-3">
                        <h2 class="text-xl font-black text-slate-800">${g ? g.name : 'Guruh Chat'}</h2>
                        ${r === 'admin' ? `
                            <select onchange="STATE.user.groupId=parseInt(this.value); renderView('chat')" class="bg-slate-50 border border-slate-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg outline-none cursor-pointer">
                                ${db.groups.map(gr => `<option value="${gr.id}" ${gr.id === gid ? 'selected' : ''}>${gr.name}</option>`).join('')}
                            </select>
                        ` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Guruh a'zolari bilan online</p>
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
            </div>
        </div>

        <div class="chat-messages" id="chat-messages-area">
            ${msgs.map(m => {
                const isMe = m.userId === STATE.user.id;
                return `
                <div class="msg-wrapper ${isMe ? 'me' : 'other'} w-full" id="msg-${m.id}">
                    <div class="flex items-center gap-2 mb-1 w-full ${isMe ? 'justify-end' : ''}">
                        <span class="msg-meta">${isMe ? 'Siz' : m.userName}</span>
                    </div>
                    <div class="msg-bubble relative group/inner flex ${isMe ? 'justify-end' : 'justify-start'}">
                        ${(isMe || r === 'admin' || r === 'ustoz') ? `
                            <button onclick="deleteChatMessage(${m.id})" class="absolute -top-3 ${isMe ? '-left-3' : '-right-3'} md:top-1/2 md:-translate-y-1/2 md:${isMe ? '-left-10' : '-right-10'} opacity-100 md:opacity-0 md:group-hover/inner:opacity-100 transition-opacity p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm active:scale-95 z-20">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        <div>
                            ${m.type === 'image' ? `<img src="${m.text}" class="msg-image rounded-xl mb-1 shadow-sm" onclick="zoomImage(this)">` : 
                              m.type === 'voice' ? `
                                <div class="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm min-w-[200px]">
                                    <button onclick="playVoice('${m.text}', this)" class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition active:scale-95">
                                        <i data-lucide="play" class="w-5 h-5"></i>
                                    </button>
                                    <div class="flex-1">
                                        <div class="h-1 bg-white/20 rounded-full overflow-hidden">
                                            <div class="h-full bg-white voice-progress w-0"></div>
                                        </div>
                                        <p class="text-[8px] font-bold uppercase mt-1 opacity-70">Ovozli xabar • ${m.duration || '0:00'}</p>
                                    </div>
                                </div>
                              ` : `<p class="whitespace-pre-wrap">${m.text}</p>`}
                            <div class="msg-time opacity-60 mt-1 ${isMe ? 'text-right' : 'text-left'}">${m.time}</div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
            ${msgs.length === 0 ? '<div class="text-center py-20 text-slate-300 font-bold">Xabarlar hali mavjud emas. Birinchi bo\'lib yozing!</div>' : ''}
        </div>

        <div class="p-4 border-t border-slate-100 relative bg-white">
            <div id="image-preview" class="hidden image-preview-container animate-zoom"></div>
            <div id="voice-preview" class="hidden voice-preview-container bg-indigo-50 p-4 rounded-2xl mb-4 animate-slide-up flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center animate-pulse">
                        <i data-lucide="mic" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800">Ovoz yozilmoqda...</p>
                        <p id="voice-timer" class="text-xs font-bold text-indigo-600">00:00</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="cancelRecording()" class="p-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="stopRecording()" class="p-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition">
                        <i data-lucide="check" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <div id="emoji-picker" class="hidden emoji-picker">
                ${['😊','😂','😍','😎','🤔','🙌','🔥','✨','👍','💯','📚','💻','✅','❌','⚠️','🚀','🏆','⭐'].map(e => `<span class="emoji-btn" onclick="addEmoji('${e}')">${e}</span>`).join('')}
            </div>
            
            <form onsubmit="sendChatMessage(event)" class="flex gap-3 items-center">
                <div class="flex gap-1.5">
                    <label id="chat-img-btn" class="p-3.5 bg-slate-50 text-slate-400 rounded-2xl cursor-pointer hover:bg-slate-100 hover:text-indigo-600 transition-all active:scale-90">
                        <i data-lucide="image" class="w-6 h-6"></i>
                        <input type="file" id="chat-image-input" class="hidden" accept="image/*" onchange="previewChatImage(this)">
                    </label>
                    <button type="button" onclick="toggleEmojiPicker()" id="emoji-trigger" class="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-amber-500 transition-all active:scale-90">
                        <i data-lucide="smile" class="w-6 h-6"></i>
                    </button>
                    <button type="button" id="voice-btn" onmousedown="startRecording()" onmouseup="stopRecording()" class="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 touch-none">
                        <i data-lucide="mic" class="w-6 h-6"></i>
                    </button>
                </div>
                
                <div class="flex-1 relative">
                    <input id="chat-input" autocomplete="off" placeholder="Xabar yozing..." class="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-semibold outline-none focus:ring-2 ring-indigo-100 transition-all">
                </div>
                
                <button class="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all">
                    <i data-lucide="send" class="w-6 h-6"></i>
                </button>
            </form>
        </div>
    </div>`;
};

window.playVoice = (src, btn) => {
    const audio = new Audio(src);
    const icon = btn.querySelector('i');
    const bar = btn.parentElement.querySelector('.voice-progress');
    
    if (window.CURRENT_AUDIO === audio && !audio.paused) {
        audio.pause();
        return;
    }
    
    if (window.CURRENT_AUDIO) window.CURRENT_AUDIO.pause();
    window.CURRENT_AUDIO = audio;
    
    audio.play();
    btn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
    safeLucide(btn);
    
    audio.ontimeupdate = () => {
        const p = (audio.currentTime / audio.duration) * 100;
        bar.style.width = p + '%';
    };
    
    audio.onended = () => {
        btn.innerHTML = '<i data-lucide="play" class="w-5 h-5"></i>';
        bar.style.width = '0%';
        safeLucide(btn);
    };
};

let RECORD_TIMER = null;
let RECORD_SEC = 0;

window.startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        VOICE_RECORDER = new MediaRecorder(stream);
        VOICE_CHUNKS = [];
        IS_RECORDING = true;
        
        VOICE_RECORDER.ondataavailable = (e) => VOICE_CHUNKS.push(e.data);
        VOICE_RECORDER.onstop = async () => {
            VOICE_BLOB = new Blob(VOICE_CHUNKS, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                const duration = formatVoiceTime(RECORD_SEC);
                sendVoiceMessage(base64, duration);
            };
            reader.readAsDataURL(VOICE_BLOB);
            stream.getTracks().forEach(t => t.stop());
        };
        
        VOICE_RECORDER.start();
        document.getElementById('voice-preview').classList.remove('hidden');
        RECORD_SEC = 0;
        RECORD_TIMER = setInterval(() => {
            RECORD_SEC++;
            document.getElementById('voice-timer').innerText = formatVoiceTime(RECORD_SEC);
        }, 1000);
        
    } catch (err) {
        showToast("Mikrofonga ruxsat berilmagan", "error");
    }
};

window.stopRecording = () => {
    if (!VOICE_RECORDER || VOICE_RECORDER.state === 'inactive') return;
    VOICE_RECORDER.stop();
    IS_RECORDING = false;
    clearInterval(RECORD_TIMER);
    document.getElementById('voice-preview').classList.add('hidden');
};

window.cancelRecording = () => {
    if (!VOICE_RECORDER) return;
    VOICE_RECORDER.onstop = null;
    VOICE_RECORDER.stop();
    IS_RECORDING = false;
    clearInterval(RECORD_TIMER);
    document.getElementById('voice-preview').classList.add('hidden');
    showToast("Ovoz yozish bekor qilindi", "info");
};

const formatVoiceTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

window.sendVoiceMessage = (base64, duration) => {
    let db = getDB();
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    let gid = STATE.user.groupId;
    if (!gid && (STATE.user.role === 'ustoz' || STATE.user.role === 'admin')) {
        const mg = db.groups.find(x => true);
        if (mg) gid = mg.id;
    }
    
    const newMsg = {
        id: Date.now(),
        groupId: gid,
        userId: STATE.user.id,
        userName: STATE.user.ism,
        text: base64,
        time: time,
        type: 'voice',
        duration: duration
    };

    db.chatMessages = db.chatMessages || [];
    db.chatMessages.push(newMsg);
    saveDB(db);
    renderView('chat');
};

window.toggleEmojiPicker = () => {
    const p = document.getElementById('emoji-picker');
    p.classList.toggle('hidden');
};

window.addEmoji = (emoji) => {
    const input = document.getElementById('chat-input');
    input.value += emoji;
    input.focus();
    document.getElementById('emoji-picker').classList.add('hidden');
};

let CHAT_IMAGE_READY = null;

window.previewChatImage = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            CHAT_IMAGE_READY = e.target.result;
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${CHAT_IMAGE_READY}"><div class="close-preview" onclick="clearChatImage()">&times;</div>`;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.clearChatImage = () => {
    CHAT_IMAGE_READY = null;
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('chat-image-input').value = '';
};

window.sendChatMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text && !CHAT_IMAGE_READY) return;

    let db = getDB();
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    let gid = STATE.user.groupId;
    if (!gid && STATE.user.role === 'ustoz') {
        const mg = db.groups.find(x => x.ustozId === STATE.user.id);
        if (mg) gid = mg.id;
    }
    
    const newMsg = {
        id: Date.now(),
        groupId: gid,
        userId: STATE.user.id,
        userName: STATE.user.ism,
        text: CHAT_IMAGE_READY || text,
        time: time,
        type: CHAT_IMAGE_READY ? 'image' : 'text'
    };

    db.chatMessages = db.chatMessages || [];
    db.chatMessages.push(newMsg);
    saveDB(db);
    
    input.value = '';
    clearChatImage();
    document.getElementById('emoji-picker').classList.add('hidden');
    renderView('chat');
};

window.deleteChatMessage = (id) => {
    const db = getDB();
    const msg = (db.chatMessages || []).find(m => m.id === id);
    if (!msg) return;

    if (msg.userId === STATE.user.id || STATE.user.role === 'admin' || STATE.user.role === 'ustoz') {
        if (!confirm("Haqiqatan o‘chirmoqchimisiz?")) return;
        db.chatMessages = db.chatMessages.filter(m => m.id !== id);
        saveDB(db);
        const el = document.getElementById('msg-' + id);
        if (el) el.remove();
        showToast("Xabar o'chirildi", "info");
    } else {
        showToast("Siz faqat o'zingizning xabarlaringizni o'chira olasiz!", "error");
    }
};

window.zoomImage = (img) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/90 z-[1000] flex items-center justify-center p-4 cursor-zoom-out animate-fade';
    overlay.innerHTML = `<img src="${img.src}" class="max-w-[90%] max-h-[90%] rounded-2xl animate-zoom shadow-2xl object-contain">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
};

// ======================== NOTIFICATIONS VIEW ========================
const v_notifications = () => {
    let db = getDB();
    const r = STATE.user.role;
    const notifs = (db.notifications || []).filter(n => r === 'admin' || (r === 'ustoz' && n.msg.includes(STATE.user.ism)) || (r === 'student' && n.userId === STATE.user.id)).reverse();
    
    // Mark as seen
    db.notifications.forEach(n => {
        if (r === 'admin' || (r === 'ustoz' && n.msg.includes(STATE.user.ism)) || (r === 'student' && n.userId === STATE.user.id)) n.seen = true;
    });
    saveDB(db);

    return `
    <div class="max-w-3xl mx-auto space-y-8 animate-fade">
        <h1 class="text-4xl font-black text-slate-800">Bildirishnomalar</h1>
        <div class="space-y-4">
            ${notifs.map(n => `
                <div class="glass-card p-6 flex items-center gap-6 border-l-4 ${n.type === 'warning' ? 'border-amber-500 bg-amber-50/10' : 'border-indigo-500 bg-indigo-50/10'}">
                    <div class="w-14 h-14 ${n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'} rounded-2xl flex items-center justify-center shrink-0">
                        <i data-lucide="${n.type === 'warning' ? 'alert-triangle' : 'bell'}"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-slate-800 text-lg">${n.msg}</p>
                        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">${n.date}</p>
                    </div>
                </div>
            `).join('')}
            ${notifs.length === 0 ? '<div class="text-center py-20 text-slate-300 font-black">Hozircha hech qanday bildirishnoma yo\'q</div>' : ''}
        </div>
    </div>`;
};

// ======================== LIBRARY SYSTEM (KUTUBXONA) ========================
const v_library = () => {
    const db = getDB();
    const books = db.books || [];
    const canManage = STATE.user.role === 'ustoz' || STATE.user.role === 'admin';

    return `
    <div class="max-w-6xl mx-auto animate-fade pb-20">
        <div class="flex justify-between items-center mb-10">
            <div>
                <h1 class="text-4xl font-black text-slate-800 mb-1">📚 Kutubxona</h1>
                <p class="text-slate-400 font-bold text-sm uppercase tracking-widest">O'quv materiallari va tavsiya etilgan kitoblar</p>
            </div>
            ${canManage ? `
            <button onclick="oModal('add-book')" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/30 btn-interactive flex items-center gap-3 hover:bg-indigo-700 transition-all">
                <i data-lucide="plus" class="w-5 h-5"></i> Kitob Qo'shish
            </button>` : ''}
        </div>

        ${books.length === 0 ? `
        <div class="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div class="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <i data-lucide="book-open" class="w-12 h-12 text-indigo-300"></i>
            </div>
            <h2 class="text-2xl font-black text-slate-400">Hali kitoblar yo'q</h2>
            <p class="text-slate-300 font-bold mt-2">Ustoz kitob qo'shgandan so'ng bu yerda ko'rsatiladi</p>
        </div>` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            ${books.map(b => `
            <div class="book-card bg-white rounded-[2.5rem] overflow-hidden shadow-premium border border-slate-100 cursor-pointer" onclick="oModal('view-book', ${b.id})">
                <div class="book-img-container h-56 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
                    ${b.image ? `<img src="${b.image}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                    <div class="hidden w-full h-full items-center justify-center">
                        <i data-lucide="book" class="w-16 h-16 text-indigo-300"></i>
                    </div>` : `<div class="w-full h-full flex items-center justify-center">
                        <i data-lucide="book" class="w-16 h-16 text-indigo-300"></i>
                    </div>`}
                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span class="text-white font-black text-sm flex items-center gap-1"><i data-lucide="eye" class="w-4 h-4"></i> Ko'rish</span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="font-black text-slate-800 text-lg mb-2 line-clamp-2 leading-tight">${b.title}</h3>
                    <p class="text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed">${b.description || ''}</p>
                    ${b.link && b.link !== '#' ? `
                    <div class="mt-4 pt-4 border-t border-slate-50">
                        <span class="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            <i data-lucide="download" class="w-3 h-3"></i> Yuklab olish mavjud
                        </span>
                    </div>` : ''}
                </div>
                ${canManage ? `
                <div class="px-6 pb-4 flex gap-2">
                    <button onclick="event.stopPropagation(); deleteBook(${b.id})" class="flex-1 text-center py-2 bg-red-50 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                        O'chirish
                    </button>
                </div>` : ''}
            </div>`).join('')}
        </div>`}
    </div>`;
};

window.deleteBook = (id) => {
    if (!confirm("Bu kitobni o'chirmoqchimisiz?")) return;
    let db = getDB();
    db.books = (db.books || []).filter(b => b.id !== id);
    saveDB(db);
    renderView('library');
    showToast("Kitob o'chirildi", "error");
};

// ======================== DUEL 1 VS 1 SYSTEM ========================
// Questions now loaded from database

let DUEL_STATE = {
    active: false,
    question: null,
    answered: false,
    playerScore: 0,
    opponentScore: 0,
    round: 0,
    totalRounds: 5,
    timer: null,
    timeLeft: 15,
    opponentName: 'Bot Opponent',
    opponentAvatar: '🤖'
};

const v_duel = () => {
    const db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    const today = new Date().toISOString().split('T')[0];
    const duelTries = u.lastDuelDate === today ? (u.duelTries || 0) : 0;
    const cooldownLeft = u.lastDuelEnd ? Math.max(0, 180 - Math.floor((Date.now() - u.lastDuelEnd) / 1000)) : 0;

    return `
    <div class="max-w-5xl mx-auto animate-fade pb-20">
        <!-- Header -->
        <div class="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-10 mb-10 text-center shadow-2xl">
            <div class="absolute -top-20 -left-20 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl"></div>
            <div class="relative z-10">
                <div class="text-6xl mb-4 duel-start-anim">⚔️</div>
                <h1 class="text-5xl font-black text-white mb-3 tracking-tight">DUEL <span class="text-pink-400">1 vs 1</span></h1>
                <p class="text-indigo-200 font-bold text-lg max-w-lg mx-auto">Raqib bilan 5 savol bo'yicha bellashing. Eng tez va to'g'ri javob bering!</p>
                <div class="flex justify-center gap-6 mt-8">
                    <div class="bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                        <div class="w-3 h-3 ${duelTries >= 5 ? 'bg-red-500' : 'bg-emerald-400'} rounded-full animate-pulse"></div>
                        <span class="text-white font-black text-sm">Bugungi: ${duelTries}/5 duel</span>
                    </div>
                    <div class="bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                        <i data-lucide="trophy" class="w-5 h-5 text-yellow-400"></i>
                        <span class="text-white font-black text-sm">+20 XP g'alaba (Ball olish qiyin 🔥)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cooldown notice -->
        ${cooldownLeft > 0 ? `
        <div class="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 mb-8 flex items-center gap-4">
            <div class="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
                <i data-lucide="clock" class="w-7 h-7 text-amber-600"></i>
            </div>
            <div>
                <p class="font-black text-amber-800">Keyingi duelgacha kuting</p>
                <p class="text-amber-600 font-bold text-sm">${cooldownLeft} soniya qoldi (anticheat cooldown)</p>
            </div>
        </div>` : ''}

        <!-- Duel Arena -->
        <div id="duel-arena" class="bg-slate-900 rounded-[3rem] overflow-hidden min-h-[500px] shadow-2xl border border-white/5 relative">

            <!-- VS Screen (default) -->
            <div id="duel-lobby" class="flex flex-col items-center justify-center h-full min-h-[500px] p-10 text-center">
                
                <!-- Player cards side-by-side -->
                <div class="flex items-center gap-6 md:gap-12 mb-12 w-full justify-center">
                    <!-- Player -->
                    <div class="flex flex-col items-center">
                        <div class="w-24 h-24 md:w-32 md:h-32 bg-indigo-600 rounded-[2rem] flex items-center justify-center font-black text-white text-4xl shadow-2xl shadow-indigo-600/50 border-4 border-indigo-400 mb-4">
                            ${STATE.user.avatar ? `<img src="${STATE.user.avatar}" class="w-full h-full object-cover rounded-[2rem]">` : STATE.user.ism[0]}
                        </div>
                        <p class="text-white font-black text-xl">${STATE.user.ism}</p>
                        <span class="text-indigo-400 text-sm font-black uppercase tracking-widest mt-1">SEN</span>
                    </div>

                    <!-- VS badge -->
                    <div class="flex flex-col items-center gap-2">
                        <div class="w-16 h-16 bg-gradient-to-br from-pink-600 to-orange-600 rounded-full flex items-center justify-center font-black text-white text-xl shadow-xl shadow-pink-600/40 border-4 border-pink-400 animate-pulse">VS</div>
                    </div>

                    <!-- Opponent (Bot) -->
                    <div class="flex flex-col items-center">
                        <div class="w-24 h-24 md:w-32 md:h-32 bg-pink-600 rounded-[2rem] flex items-center justify-center font-black text-white text-4xl shadow-2xl shadow-pink-600/50 border-4 border-pink-400 mb-4">
                            🤖
                        </div>
                        <p class="text-white font-black text-xl">Bot Raqib</p>
                        <span class="text-pink-400 text-sm font-black uppercase tracking-widest mt-1">RAQIB</span>
                    </div>
                </div>

                <!-- Start button -->
                ${duelTries >= 5 ? `
                <div class="bg-red-500/20 border border-red-500/30 rounded-2xl px-10 py-5 text-red-400 font-black text-lg">
                    Bugungi duel limiti tugadi (5/5)
                </div>` : (cooldownLeft > 0 ? `
                <div class="bg-amber-500/20 border border-amber-500/30 rounded-2xl px-10 py-5 text-amber-400 font-black text-lg">
                    ⏳ ${cooldownLeft}s kuting...
                </div>` : `
                <button onclick="startDuel()" class="bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-16 py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all border border-white/20 flex items-center gap-4 duel-start-anim">
                    <i data-lucide="zap" class="w-8 h-8"></i> Duelni Boshlash!
                </button>`)}

                <p class="text-slate-500 font-bold mt-8 text-sm">5 savol · 15 soniya har bir savol uchun · G'alaba: +30 XP</p>
            </div>

            <!-- Game content (hidden initially) -->
            <div id="duel-game-content" class="hidden"></div>
        </div>

        <!-- Rules -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div class="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm text-center">
                <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">⏱</div>
                <h3 class="font-black text-slate-800 mb-2">15 Soniya</h3>
                <p class="text-sm text-slate-400 font-medium">Har bir savol uchun 15 soniya vaqt bor</p>
            </div>
            <div class="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm text-center">
                <div class="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🎯</div>
                <h3 class="font-black text-slate-800 mb-2">Tez javob = Ko'p ball</h3>
                <p class="text-sm text-slate-400 font-medium">Tez javob bergan ko'proq ball to'playdi</p>
            </div>
            <div class="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm text-center">
                <div class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🏆</div>
                <h3 class="font-black text-slate-800 mb-2">G'alaba = +20 XP</h3>
                <p class="text-sm text-slate-400 font-medium">Yutgan o'yinchi 20 XP oladi. Mag'lubiyat: 0 XP</p>
            </div>
        </div>
    </div>`;
};

window.startDuel = () => {
    const db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    const today = new Date().toISOString().split('T')[0];
    const duelTries = u.lastDuelDate === today ? (u.duelTries || 0) : 0;
    
    if (duelTries >= 5) { showToast("Bugun limit tugadi!", "error"); return; }
    const cooldownLeft = u.lastDuelEnd ? Math.max(0, 180 - Math.floor((Date.now() - u.lastDuelEnd) / 1000)) : 0;
    if (cooldownLeft > 0) { showToast(`${cooldownLeft}s kuting!`, "error"); return; }

    // Init new duel
    DUEL_STATE = { active: true, answered: false, playerScore: 0, opponentScore: 0, round: 0, totalRounds: 5, timer: null, timeLeft: 15, opponentName: 'Bot Raqib', opponentAvatar: '🤖' };
    
    // Increment duel tries
    u.duelTries = (u.duelTries || 0) + 1;
    u.lastDuelDate = today;
    saveDB(db);

    const lobby = document.getElementById('duel-lobby');
    const gameEl = document.getElementById('duel-game-content');
    if (lobby) lobby.classList.add('hidden');
    if (gameEl) { gameEl.classList.remove('hidden'); }

    // Update db tries
    if (u.lastDuelDate !== today) { u.lastDuelDate = today; u.duelTries = 1; }
    else u.duelTries = (u.duelTries || 0) + 1;
    saveDB(db);

    duelNextRound();
};

function duelNextRound() {
    if (DUEL_STATE.round >= DUEL_STATE.totalRounds) {
        duelFinish();
        return;
    }
    DUEL_STATE.round++;
    DUEL_STATE.answered = false;
    DUEL_STATE.timeLeft = 15;
    
    // Pick random question from db
    const db = getDB();
    const pool = db.questions.filter(q => q.type === 'duel');
    if (pool.length === 0) {
        showToast("Duel uchun savollar mavjud emas!", "error");
        renderView('duel');
        return;
    }
    DUEL_STATE.question = pool[Math.floor(Math.random() * pool.length)];
    const q = DUEL_STATE.question;

    const gameEl = document.getElementById('duel-game-content');
    if (!gameEl) return;

    gameEl.innerHTML = `
    <div class="p-6 md:p-10">
        <!-- Scoreboard -->
        <div class="flex justify-between items-center mb-8 bg-white/5 rounded-[2rem] p-6 border border-white/10">
            <!-- Player -->
            <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-xl border-2 border-indigo-400">
                    ${STATE.user.ism[0]}
                </div>
                <div>
                    <p class="text-white font-black text-lg">${STATE.user.ism.split(' ')[0]}</p>
                    <p class="text-indigo-400 font-black text-2xl" id="player-score-d">${DUEL_STATE.playerScore}</p>
                </div>
            </div>
            <!-- Timer + Round -->
            <div class="flex flex-col items-center gap-2">
                <div class="text-slate-400 font-black text-xs uppercase tracking-widest">Savol ${DUEL_STATE.round}/${DUEL_STATE.totalRounds}</div>
                <div id="duel-timer" class="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl text-white border-4 border-indigo-500 shadow-lg shadow-indigo-500/30">15</div>
                <span class="text-xs font-black text-slate-500 uppercase tracking-wider">${q.type.replace('_', ' ')}</span>
            </div>
            <!-- Opponent -->
            <div class="flex items-center gap-4">
                <div>
                    <p class="text-white font-black text-lg text-right">${DUEL_STATE.opponentName.split(' ')[0]}</p>
                    <p class="text-pink-400 font-black text-2xl text-right" id="opp-score-d">${DUEL_STATE.opponentScore}</p>
                </div>
                <div class="w-14 h-14 bg-pink-600 rounded-2xl flex items-center justify-center font-black text-white text-xl border-2 border-pink-400">
                    ${DUEL_STATE.opponentAvatar}
                </div>
            </div>
        </div>

        <!-- Question -->
        <div class="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 mb-8 text-center">
            <p class="text-white font-black text-2xl md:text-3xl leading-relaxed">${q.questionText}</p>
        </div>

        <!-- Options -->
        <div class="grid gap-4 md:grid-cols-2" id="duel-options">
            ${['A','B','C','D'].map((code) => {
                const opt = q[`option${code}`];
                return `
                <button onclick="duelAnswer('${code}')" id="duel-opt-${code}"
                    class="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/15 hover:border-indigo-400/50 active:scale-95 transition-all backdrop-blur-sm">
                    <span class="text-indigo-500 mr-2">${code}:</span> ${opt}
                </button>`;
            }).join('')}
        </div>
    </div>`;
    safeLucide(gameEl);

    // Start timer
    if (DUEL_STATE.timer) clearInterval(DUEL_STATE.timer);
    DUEL_STATE.timer = setInterval(() => {
        DUEL_STATE.timeLeft--;
        const tel = document.getElementById('duel-timer');
        if (tel) {
            tel.innerText = DUEL_STATE.timeLeft;
            if (DUEL_STATE.timeLeft <= 5) {
                tel.style.borderColor = '#ef4444';
                tel.style.color = '#ef4444';
                tel.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
            }
        }
        // Bot answers between 3-12 seconds randomly
        if (!DUEL_STATE.answered && DUEL_STATE.botAnswerTime && DUEL_STATE.timeLeft <= DUEL_STATE.botAnswerTime) {
            // Bot answers (sometimes wrong)
            const botCorrect = Math.random() > 0.35;
            if (botCorrect) {
                const diffBonus = q.difficulty === 'hard' ? 15 : (q.difficulty === 'medium' ? 10 : 5);
                DUEL_STATE.opponentScore += diffBonus + Math.ceil(DUEL_STATE.timeLeft * 0.5);
            }
            const oScore = document.getElementById('opp-score-d');
            if (oScore) oScore.innerText = DUEL_STATE.opponentScore;
        }
        if (DUEL_STATE.timeLeft <= 0) {
            clearInterval(DUEL_STATE.timer);
            if (!DUEL_STATE.answered) duelAnswer(-1); // timeout
        }
    }, 1000);
    // Set random bot answer time
    DUEL_STATE.botAnswerTime = Math.floor(Math.random() * 9) + 3;
}

window.duelAnswer = (idx) => {
    if (DUEL_STATE.answered) return;
    DUEL_STATE.answered = true;
    clearInterval(DUEL_STATE.timer);

    const q = DUEL_STATE.question;
    const correct = idx === q.correctAnswer;
    const timeBonus = Math.ceil(DUEL_STATE.timeLeft * 0.5);

    // Visual feedback
    const codes = ['A', 'B', 'C', 'D'];
    codes.forEach((code) => {
        const btn = document.getElementById(`duel-opt-${code}`);
        if (!btn) return;
        btn.disabled = true;
        if (code === q.correctAnswer) {
            btn.style.background = 'rgba(16, 185, 129, 0.3)';
            btn.style.borderColor = '#10b981';
            btn.style.color = '#6ee7b7';
        } else if (code === idx && idx !== q.correctAnswer) {
            btn.style.background = 'rgba(239, 68, 68, 0.3)';
            btn.style.borderColor = '#ef4444';
            btn.style.color = '#fca5a5';
        }
    });

    if (correct) {
        const diffBonus = q.difficulty === 'hard' ? 15 : (q.difficulty === 'medium' ? 10 : 5);
        DUEL_STATE.playerScore += diffBonus + timeBonus;
        const pScore = document.getElementById('player-score-d');
        if (pScore) pScore.innerText = DUEL_STATE.playerScore;
    }

    setTimeout(duelNextRound, 1500);
};

function duelFinish() {
    const won = DUEL_STATE.playerScore > DUEL_STATE.opponentScore;
    const draw = DUEL_STATE.playerScore === DUEL_STATE.opponentScore;
    const gameEl = document.getElementById('duel-game-content');
    if (!gameEl) return;

    // Cooldown
    let db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    if (u) { u.lastDuelEnd = Date.now(); saveDB(db); }

    if (won) {
        addPoints(20, "Duel g'alabasi", "duels");
        let dbW = getDB();
        const uW = dbW.users.find(x => x.id === STATE.user.id);
        if (uW) {
            uW.duelWins = (uW.duelWins || 0) + 1;
            saveDB(dbW);
            STATE.user.duelWins = uW.duelWins;
            localStorage.setItem('lms_user', JSON.stringify(STATE.user));
        }
    }
    else if (!draw) addPoints(0, "Duel qatnashish", "duels");

    const emoji = won ? '🏆' : (draw ? '🤝' : '💀');
    const title = won ? "G'ALABA!" : (draw ? "DURRANG!" : "MAG'LUBIYAT!");
    const color = won ? 'text-yellow-400' : (draw ? 'text-blue-400' : 'text-red-400');
    const xp = won ? '+20 XP' : '+0 XP (Hard Mode)';

    gameEl.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[400px] p-10 text-center">
        <div class="text-8xl mb-6 animate-achievement-pop">${emoji}</div>
        <h2 class="text-5xl font-black ${color} mb-4">${title}</h2>
        <div class="flex gap-8 mb-8 text-center">
            <div>
                <p class="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Sening balling</p>
                <p class="text-4xl font-black text-indigo-400">${DUEL_STATE.playerScore}</p>
            </div>
            <div class="w-px bg-white/10"></div>
            <div>
                <p class="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Raqib balli</p>
                <p class="text-4xl font-black text-pink-400">${DUEL_STATE.opponentScore}</p>
            </div>
        </div>
        <p class="text-lg font-black ${color} mb-8">${xp} to'plandi!</p>
        <button onclick="renderView('duel')" class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-14 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
            Qaytish
        </button>
    </div>`;
    DUEL_STATE.active = false;
}

// ======================== MINI GAME SYSTEM ========================
// ======================== MINI GAME SYSTEM (UPGRADED: CODE BREAKER CHALLENGE) ========================
const v_game = () => {
    const db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    const today = new Date().toISOString().split('T')[0];
    const tries = u.lastGameDate === today ? (u.gameTries || 0) : 0;

    return `
    <div class="max-w-5xl mx-auto space-y-10 animate-fade pb-20">
        <header class="text-center bg-white p-12 rounded-[3.5rem] shadow-premium relative overflow-hidden group">
             <div class="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
             <div class="absolute -bottom-10 -right-10 w-60 h-60 bg-purple-50 rounded-full blur-3xl"></div>
             <div class="relative z-10 flex flex-col items-center">
                 <div class="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200 animate-bounce-subtle">
                     <i data-lucide="zap" class="w-12 h-12"></i>
                 </div>
                 <h1 class="text-5xl font-black text-slate-800 mb-3 tracking-tight">Code Breaker <span class="text-indigo-600">Challenge</span></h1>
                 <p class="text-slate-500 font-bold text-lg mb-8 max-w-xl">Mantiq va tezkorlik o'yini. Har kuni 3 ta imkoniyat! streak yig'ing va ko'proq XP oling.</p>
                 
                 <div class="flex gap-4 mb-2">
                    <div class="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                        <div class="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                        <span class="text-sm font-black text-slate-700" id="game-daily-tries">Imkoniyat: ${tries}/3</span>
                    </div>
                    <div class="px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                        <i data-lucide="flame" class="w-5 h-5 text-orange-500"></i>
                        <span class="text-sm font-black text-indigo-700" id="game-streak">Streak: ${CURRENT_STREAK}</span>
                    </div>
                 </div>
             </div>
        </header>
        
        <div id="game-arena" class="min-h-[550px] rounded-[4rem] relative flex flex-col items-center justify-center overflow-hidden shadow-2xl transition-all duration-500">
             <div class="absolute inset-0 bg-slate-900 overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div class="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div class="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div class="grid-overlay pointer-events-none"></div>
             </div>

             <div id="game-content" class="relative z-10 w-full flex flex-col items-center px-6 md:px-20 text-center">
                 <div class="animate-zoom flex flex-col items-center">
                    <div class="text-8xl mb-10 drop-shadow-[0_0_30px_rgba(79,70,229,0.5)]">🧩</div>
                    <h2 class="text-4xl font-black text-white mb-10 tracking-wide">Tayyormisiz?</h2>
                    <div class="flex flex-wrap justify-center gap-4">
                        <button onclick="startMiniGame('easy')" class="game-btn-neon easy btn-interactive px-8 py-4 rounded-3xl font-black text-base">Oson</button>
                        <button onclick="startMiniGame('medium')" class="game-btn-neon medium btn-interactive px-8 py-4 rounded-3xl font-black text-base">O'rta</button>
                        <button onclick="startMiniGame('hard')" class="game-btn-neon hard btn-interactive px-8 py-4 rounded-3xl font-black text-base">Qiyin</button>
                        <button onclick="startMiniGame('juda_qiyin')" class="game-btn-neon judaqiyin btn-interactive px-8 py-4 bg-red-600 shadow-red-500/50 rounded-3xl font-black text-base text-white">Juda Qiyin</button>
             </div>
        </div>
    </div>`;
};

let CURRENT_STREAK = 0;

window.startMiniGame = (diff) => {
    const db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    const today = new Date().toISOString().split('T')[0];
    const tries = u.lastGameDate === today ? (u.gameTries || 0) : 0;
    
    if (tries >= 3) {
        showToast("Bugungi limit tugadi! (3/3)", "error");
        return;
    }

    // Generate dynamic Math question based on diff
    let num1, num2, num3_val, correctAnswer, ops, op;
    if (diff === 'easy') {
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        ops = ['+', '-'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '-' && num1 < num2) { let temp=num1; num1=num2; num2=temp; }
        correctAnswer = op === '+' ? num1 + num2 : num1 - num2;
    } else if (diff === 'medium') {
        num1 = Math.floor(Math.random() * 50) + 10;
        num2 = Math.floor(Math.random() * 30) + 5;
        ops = ['+', '-', '*'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '-' && num1 < num2) { let temp=num1; num1=num2; num2=temp; }
        if (op === '*') { num1 = Math.floor(Math.random() * 12) + 2; num2 = Math.floor(Math.random() * 12) + 2; }
        correctAnswer = op === '+' ? num1 + num2 : (op === '-' ? num1 - num2 : num1 * num2);
    } else if (diff === 'hard') {
        num1 = Math.floor(Math.random() * 100) + 20;
        num2 = Math.floor(Math.random() * 50) + 10;
        ops = ['*', '/', '+', '-'];
        op = ops[Math.floor(Math.random() * ops.length)];
        if (op === '*') { num1 = Math.floor(Math.random() * 20) + 5; num2 = Math.floor(Math.random() * 20) + 5; }
        if (op === '/') { 
            num2 = Math.floor(Math.random() * 15) + 2; 
            correctAnswer = Math.floor(Math.random() * 20) + 2; 
            num1 = num2 * correctAnswer; 
        }
        correctAnswer = op === '+' ? num1 + num2 : (op === '*' ? num1 * num2 : (op === '/' ? num1 / num2 : num1 - num2));
    } else if (diff === 'juda_qiyin') {
        num1 = Math.floor(Math.random() * 200) + 50;
        num2 = Math.floor(Math.random() * 100) + 20;
        num3_val = Math.floor(Math.random() * 20) + 2;
        op = '*+';
        correctAnswer = num1 * num3_val + num2;
    }
    
    let questionText = op === '*+' ? `${num1} * ${num3_val} + ${num2} = ?` : `${num1} ${op} ${num2} = ?`;
    
    // Generate answers list
    let answers = [correctAnswer.toString()];
    while(answers.length < 4) {
        let fake = correctAnswer + (Math.floor(Math.random() * 20) - 10);
        if (fake !== correctAnswer && !answers.includes(fake.toString())) {
            answers.push(fake.toString());
        }
    }
    answers.sort(() => Math.random() - 0.5);
    let correctCode = ['A', 'B', 'C', 'D'][answers.indexOf(correctAnswer.toString())];
    
    const arena = document.getElementById('game-arena');
    const content = document.getElementById('game-content');
    
    content.innerHTML = `<div class="text-6xl font-black text-white animate-pulse">3...</div>`;
    
    setTimeout(() => {
        let timeLimit = diff === 'juda_qiyin' ? 10 : (diff === 'hard' ? 12 : (diff === 'medium' ? 15 : 20));
        let startTime = Date.now();
        
        content.innerHTML = `
            <div class="w-full max-w-2xl animate-zoom">
                <div class="flex justify-between items-center mb-10 w-full bg-slate-800/50 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-indigo-500/20">${diff[0].toUpperCase()}</div>
                        <div>
                            <p class="text-[10px] font-black uppercase text-indigo-400 tracking-[3px]">Difficulty</p>
                            <h4 class="text-white font-black uppercase">${diff.replace('_', ' ')}</h4>
                        </div>
                    </div>
                    <div class="flex flex-col items-end">
                        <p class="text-[10px] font-black uppercase text-pink-500 tracking-[3px] mb-1">Time Remaining</p>
                        <div id="game-timer" class="text-4xl font-black font-mono text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">${timeLimit}s</div>
                    </div>
                </div>

                <div class="bg-slate-800/80 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 border-t-white/10 mb-8 md:mb-10 shadow-2xl relative overflow-hidden group">
                    <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    <code class="text-3xl sm:text-4xl md:text-5xl font-black text-indigo-100 flex items-center justify-center gap-2 md:gap-4 py-3 md:py-4 tracking-tighter">
                        ${questionText}
                    </code>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                    ${['A','B','C','D'].map((code, i) => {
                        return `
                        <button onclick="checkGameAnswer('${code}', '${correctCode}', '${diff}', ${startTime}, ${timeLimit})" 
                            class="game-answer-btn p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-slate-800/40 border border-white/10 text-white font-black text-2xl md:text-3xl hover:bg-slate-700/60 hover:scale-[1.02] hover:border-indigo-500/50 transition-all shadow-xl backdrop-blur-md active:scale-95 group flex justify-between items-center">
                            <span>${answers[i]}</span>
                            <div class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-400 transition-all">
                                <i data-lucide="arrow-right" class="w-5 h-5 opacity-50 group-hover:opacity-100"></i>
                            </div>
                        </button>`;
                    }).join('')}
                </div>
            </div>
        `;
        safeLucide(content);

        let t = timeLimit;
        window.currentGameTimer = setInterval(() => {
            t--;
            const tel = document.getElementById('game-timer');
            if (tel) {
                tel.innerText = t + 's';
                if (t <= 5) tel.classList.add('animate-pulse');
            }
            if (t <= 0) {
                clearInterval(window.currentGameTimer);
                handleGameFail("Vaqt tugadi!", diff);
            }
        }, 1000);
    }, 1000);
};

window.checkGameAnswer = (ans, correct, diff, start, limit) => {
    clearInterval(window.currentGameTimer);
    const duration = (Date.now() - start) / 1000;
    const speedBonus = Math.max(0, Math.ceil((limit - duration) * 2));
    
    if (ans === correct) {
        handleGameWin(diff, speedBonus);
    } else {
        handleGameFail("Noto'g'ri javob!", diff);
    }
    
    let db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    const today = new Date().toISOString().split('T')[0];
    if (u.lastGameDate !== today) {
        u.lastGameDate = today;
        u.gameTries = 1;
    } else {
        u.gameTries = (u.gameTries || 0) + 1;
    }
    saveDB(db);
};

window.handleGameWin = (diff, bonus) => {
    CURRENT_STREAK++;
    const diffXP = diff === 'juda_qiyin' ? 30 : (diff === 'hard' ? 10 : (diff === 'medium' ? 5 : 2));
    const totalXP = diffXP + Math.min(bonus, 3) + (CURRENT_STREAK > 1 ? Math.min(CURRENT_STREAK, 2) : 0);
    addPoints(Math.round(totalXP), `Code Breaker streak: ${CURRENT_STREAK}`, "miniGame");
    const arena = document.getElementById('game-arena');
    arena.classList.add('win-glow');
    const content = document.getElementById('game-content');
    content.innerHTML = `
        <div class="text-center animate-achievement-pop">
            <div class="relative inline-block mb-10">
                <div class="absolute inset-0 bg-yellow-400 blur-3xl opacity-30 animate-pulse rounded-full"></div>
                <div class="text-9xl relative">🏆</div>
            </div>
            <h2 class="text-6xl font-black text-white mb-4 tracking-tighter">TO'G'RI!</h2>
            <div class="flex flex-col items-center gap-3 mb-10">
                <p class="text-indigo-400 font-black text-2xl">+${totalXP} XP To'plandi</p>
                <div class="flex gap-4">
                    ${bonus > 0 ? `<span class="px-4 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full text-xs font-black uppercase tracking-widest">+${bonus} Speed Bonus</span>` : ''}
                    ${CURRENT_STREAK > 1 ? `<span class="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-black uppercase tracking-widest">Streak x${CURRENT_STREAK}</span>` : ''}
                </div>
            </div>
            <button onclick="renderView('game')" class="bg-indigo-600 px-14 py-6 rounded-[2.5rem] font-black text-xl text-white shadow-2xl shadow-indigo-500/50 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all">Davom etish</button>
        </div>
    `;
    triggerConfetti();
};

window.handleGameFail = (reason, diff = 'medium') => {
    CURRENT_STREAK = 0;
    const penaltyXP = diff === 'juda_qiyin' ? 15 : (diff === 'hard' ? 5 : (diff === 'medium' ? 2 : 1));
    let db = getDB();
    const u = db.users.find(x => x.id === STATE.user.id);
    if(u) {
        u.points = Math.max(0, (u.points || 0) - penaltyXP);
        saveDB(db);
        STATE.user = u;
        localStorage.setItem('lms_user', JSON.stringify(u));
    }
    const arena = document.getElementById('game-arena');
    arena.classList.add('fail-shake');
    setTimeout(() => arena.classList.remove('fail-shake'), 500);
    const content = document.getElementById('game-content');
    content.innerHTML = `
        <div class="text-center animate-zoom">
            <div class="text-9xl mb-8 drop-shadow-2xl">💀</div>
            <h2 class="text-6xl font-black text-white mb-2 tracking-tighter">XATO!</h2>
            <p class="text-slate-400 font-black text-xl mb-10 uppercase tracking-[5px]">${reason}</p>
            <div class="flex gap-6">
                 <button onclick="renderView('game')" class="bg-slate-800 border border-white/10 px-10 py-5 rounded-[2rem] font-black text-white hover:bg-slate-700 transition-all">Qaytadan</button>
            </div>
        </div>
    `;
};

window.triggerConfetti = () => {
    const arena = document.getElementById('game-arena');
    for(let i=0; i<30; i++) {
        const p = document.createElement('div');
        p.className = 'absolute pointer-events-none';
        p.style.left = '50%'; p.style.top = '50%';
        const colors = ['#4f46e5', '#ec4899', '#fbbf24', '#10b981'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = Math.random() * 10 + 5 + 'px';
        p.style.height = p.style.width;
        p.style.borderRadius = '50%';
        arena.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 300 + 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        let startTime = Date.now();
        const anim = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > 1.5) { p.remove(); return; }
            p.style.transform = `translate(${vx * elapsed}px, ${vy * elapsed + (500 * elapsed * elapsed)}px)`;
            p.style.opacity = 1 - elapsed;
            requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    }
};

// Mobile Swipe Navigation
let touchstartX_nav = 0, touchendX_nav = 0;
document.addEventListener('touchstart', e => { touchstartX_nav = e.changedTouches[0].screenX; }, {passive: true});
document.addEventListener('touchend', e => { 
    touchendX_nav = e.changedTouches[0].screenX;
    if (window.innerWidth < 1024) {
        const s = document.getElementById('sidebar-container');
        if (touchendX_nav > touchstartX_nav + 80) s.classList.remove('-translate-x-full');
        else if (touchendX_nav < touchstartX_nav - 80) s.classList.add('-translate-x-full');
    }
}, {passive: true});

// ======================== SCHEDULE BUILDER (USTOZ) ========================
const v_schedule = () => {
    const db = getDB();
    const r = STATE.user.role;
    const myGroups = (db.groups||[]).filter(g => g.ustozId === STATE.user.id || r === 'admin' || (r === 'student' && g.studentIds && g.studentIds.includes(STATE.user.id)));
    const days = CURRENT_LANG==='ru'
        ? ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba']
        : ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];

    const activeGroupId = STATE._scheduleGroupId || (myGroups[0] && myGroups[0].id);
    const group = (db.groups||[]).find(g => g.id === activeGroupId);
    const schedule = group ? (group.schedule || []) : [];

    return `<div class="max-w-5xl mx-auto animate-fade space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 class="text-3xl font-black text-slate-800">${t('schedule')}</h1>
            <p class="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">${'Dars vaqtlarini boshqarish'}</p>
        </div>
        <select onchange="STATE._scheduleGroupId=parseInt(this.value); renderView('schedule')" 
            class="bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold outline-none shadow-sm">
            ${myGroups.map(g=>`<option value="${g.id}" ${g.id===activeGroupId?'selected':''}>${g.name}</option>`).join('')}
        </select>
    </div>

    ${!group ? `<div class="text-center py-20 glass-card rounded-[3rem]"><p class="text-slate-400 font-bold">${'Guruhlar topilmadi'}</p></div>` : `
    <div class="glass-card p-8 rounded-[2.5rem] bg-white shadow-premium">
        <h2 class="text-xl font-black mb-6 flex items-center gap-2"><i data-lucide="calendar" class="text-indigo-600 w-6 h-6"></i> ${group.name} — ${'Jadval'}</h2>
        <div class="space-y-4">
        ${days.map((day, di) => {
            const daySlots = schedule.filter(s => s.dayIndex === di);
            return `<div class="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
                <div class="flex items-center justify-between mb-3">
                    <span class="font-black text-slate-700">${day}</span>
                    ${r !== 'student' ? `<button onclick="addScheduleSlot(${activeGroupId}, ${di})" 
                        class="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-black text-xs px-3 py-1.5 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition">
                        <i data-lucide="plus" class="w-3 h-3"></i> ${"Qo'shish"}
                    </button>` : ''}
                </div>
                <div class="space-y-2">
                ${daySlots.length === 0 ? `<p class="text-slate-300 font-bold text-sm italic">${"Dars yo'q"}</p>` : 
                daySlots.map(sl => `
                    <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 group">
                        <div class="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span class="font-black text-indigo-700 text-sm">${sl.time}</span>
                        <span class="flex-1 font-bold text-slate-600 text-sm">${sl.subject||''}</span>
                        ${r !== 'student' ? `<button onclick="removeScheduleSlot(${activeGroupId}, '${sl.id}')" 
                            class="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-600 p-1">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>` : ''}
                    </div>`).join('')}
                </div>
            </div>`;
        }).join('')}
        </div>
    </div>`}
    </div>`;
};

window.addScheduleSlot = (groupId, dayIndex) => {
    const time = prompt("Vaqt (masalan: 09:00):");
    if (!time) return;
    const subject = prompt("Dars nomi:");
    if (!subject) return;
    let db = getDB();
    const group = db.groups.find(g => g.id === groupId);
    if (!group) return;
    group.schedule = group.schedule || [];
    group.schedule.push({ id: Date.now(), dayIndex, time, subject });
    saveDB(db);
    renderView('schedule');
    showToast('Qo\'shildi!');
};

window.removeScheduleSlot = (groupId, slotId) => {
    let db = getDB();
    const group = db.groups.find(g => g.id === groupId);
    if (!group) return;
    group.schedule = (group.schedule||[]).filter(s => String(s.id) !== String(slotId));
    saveDB(db);
    renderView('schedule');
};


// ======================== STAFF CHAT SYSTEM ========================
const v_staff_chat = () => {
    const db = getDB();
    const r = STATE.user.role;
    
    if (!['admin', 'tech_admin', 'director', 'ustoz'].includes(r)) {
        return `<div class="p-10 text-center"><i data-lucide="lock" class="w-16 h-16 text-red-200 mx-auto mb-4"></i><h2 class="text-2xl font-black">Ruxsat yo'q</h2></div>`;
    }

    const msgs = db.staffChatMessages || [];

    setTimeout(() => {
        const area = document.getElementById('staff-chat-messages-area');
        if (area) area.scrollTop = area.scrollHeight;
    }, 100);

    return `
    <div class="chat-container">
        <div class="p-6 border-b border-indigo-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white relative z-10">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
                    <i data-lucide="shield" class="w-6 h-6"></i>
                </div>
                <div>
                    <h2 class="text-xl font-black text-slate-800">Jamoa Chati</h2>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">USTOZLAR VA RAHBARIYAT UCHUN</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="chat-messages bg-slate-50/50" id="staff-chat-messages-area">
            ${msgs.map(m => {
                const isMe = m.userId === STATE.user.id;
                const rn = m.role === 'admin' ? 'Admin' : m.role === 'director' ? 'Direktor' : m.role === 'tech_admin' ? 'Tech Admin' : 'Ustoz';
                const rc = m.role === 'admin' ? 'bg-red-100 text-red-600' : m.role === 'director' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600';
                
                return `
                <div class="msg-wrapper ${isMe ? 'me' : 'other'} w-full" id="staff-msg-${m.id}">
                    <div class="flex items-center gap-2 mb-1 w-full ${isMe ? 'justify-end' : ''}">
                        <span class="msg-meta text-[10px] font-black uppercase text-slate-400">${isMe ? 'Siz' : m.userName}</span>
                        ${!isMe ? `<span class="text-[9px] font-black uppercase ${rc} px-1.5 py-0.5 rounded-md">${rn}</span>` : ''}
                    </div>
                    <div class="msg-bubble relative group/inner flex ${isMe ? 'justify-end' : 'justify-start'}">
                        ${(isMe || r === 'admin') ? `
                            <button onclick="deleteStaffChatMessage(${m.id})" class="absolute -top-3 ${isMe ? '-left-3' : '-right-3'} md:top-1/2 md:-translate-y-1/2 md:${isMe ? '-left-10' : '-right-10'} opacity-100 md:opacity-0 md:group-hover/inner:opacity-100 transition-opacity p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm active:scale-95 z-20">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                        <div class="${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-100'} p-4 rounded-2xl shadow-sm max-w-[85%] font-medium">
                            <p class="whitespace-pre-wrap">${m.text}</p>
                            <div class="text-[9px] font-bold mt-2 ${isMe ? 'text-indigo-200 text-right' : 'text-slate-400 text-left'}">${m.time}</div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
            ${msgs.length === 0 ? "<div class=\"text-center py-20 text-slate-400 font-bold\">Xabarlar yo'q. Jamoaga salom yo'llang!</div>" : ''}
        </div>

        <div class="p-4 border-t border-slate-100 relative bg-white">
            <form onsubmit="sendStaffChatMessage(event)" class="flex gap-3 items-center">
                <div class="flex-1 relative">
                    <input id="staff-chat-input" autocomplete="off" placeholder="Xabar yozing (Faqat raxbarlar va ustozlar ko'radi)..." class="w-full bg-slate-50 border-none px-6 py-4 rounded-2xl font-semibold outline-none focus:ring-2 ring-indigo-200 transition-all">
                </div>
                <button class="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all">
                    <i data-lucide="send" class="w-6 h-6"></i>
                </button>
            </form>
        </div>
    </div>`;
};

window.sendStaffChatMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('staff-chat-input');
    const text = input.value.trim();
    if (!text) return;

    let db = getDB();
    db.staffChatMessages = db.staffChatMessages || [];
    
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    db.staffChatMessages.push({
        id: Date.now(),
        userId: STATE.user.id,
        userName: STATE.user.ism,
        role: STATE.user.role,
        text: text,
        time: time
    });
    
    saveDB(db);
    input.value = '';
    renderView('staff-chat');
};

window.deleteStaffChatMessage = (id) => {
    if (!confirm("Haqiqatdan ham ushbu xabarni o'chirmoqchimisiz?")) return;
    let db = getDB();
    db.staffChatMessages = (db.staffChatMessages || []).filter(m => m.id !== id);
    saveDB(db);
    renderView('staff-chat');
};
