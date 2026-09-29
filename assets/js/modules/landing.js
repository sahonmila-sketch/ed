// ============================================================
// landing.js — Public landing page
// ============================================================
import { api_get, api_patch } from './api.js';
import { safeLucide, showToast, openModal, cModal, modalShell, escapeHtml } from './ui.js';

const esc = escapeHtml;

const INITIAL_LANDING = {
    director_name: 'Erko',
    director_photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80',
    director_title: 'Texnikum Rahbari',
    quote: 'Bizning maqsadimiz — Nukus yoshlarini jahon andozalari darajasidagi kadrlar qilib yetishtirishdir.',
    address: 'Nukus sh., E. Alako‘z ko‘chasi, 162',
    phone: '+998 61 222 33 44',
    telegram_link: 'https://t.me/your_telegram',
    instagram_link: 'https://instagram.com/',
    youtube_link: 'https://youtube.com/',
    indicators: [
        { id: 1, label: 'Professorlar', count: '25+', icon: 'award' },
        { id: 2, label: 'Talabalar', count: '1,200+', icon: 'users' },
        { id: 3, label: 'Muvaffaqiyatlar', count: '50+', icon: 'star' },
    ],
    best_teachers: [
        { id: 1, name: 'Samat Jienbaev', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Samat', title: 'Senior Mentor', date: '06.04.2026' },
        { id: 2, name: 'Gulnaz Turdimuratova', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gulnaz', title: 'Metodist', date: '05.04.2026' },
        { id: 3, name: 'Azamat Berdimuratov', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Azamat', title: 'IT Specialist', date: '06.04.2026' },
    ],
};

let LANDING_DATA = INITIAL_LANDING;

async function syncLandingData() {
    try {
        const data = await api_get('/landing');
        if (data && Object.keys(data).length) LANDING_DATA = { ...INITIAL_LANDING, ...data };
    } catch (e) { /* bo’sh bo’lsa standart ma’lumot qo’llaniladi */ }
    return LANDING_DATA;
}

const SOCIAL = [
    { key: 'telegram_link', label: 'Telegram', color: '#229ED9', path: 'M11.944 0C5.352 0 0 5.352 0 11.944c0 6.592 5.352 11.944 11.944 11.944 6.592 0 11.944-5.352 11.944-11.944C23.888 5.352 18.536 0 11.944 0zm5.836 8.358l-1.954 9.222c-.15.68-.553.847-1.123.527l-2.977-2.195-1.436 1.382c-.159.159-.292.292-.598.292l.213-3.023 5.5-4.966c.239-.213-.052-.331-.371-.119L8.341 14.1l-2.929-.916c-.637-.199-.649-.637.133-.943l11.455-4.417c.531-.194.996.124.81.94l-.034-.406z' },
    { key: 'instagram_link', label: 'Instagram', color: '#E4405F', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.267-.07-1.646-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259.014-3.667.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z' },
    { key: 'youtube_link', label: 'YouTube', color: '#FF0000', path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
];

const MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.802146430349!2d59.6053351!3d42.4533038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x41dd9a473e13d50f%3A0x633390c5211b4097!2sNukus%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1712415000000!5m2!1sen!2s';

function renderLanding() {
    const d = { ...INITIAL_LANDING, ...(LANDING_DATA || {}) };
    const teachers = d.best_teachers || [];
    const indicators = d.indicators || [];
    const canEdit = ['admin', 'tech_admin'].includes(window.STATE?.user?.role);

    return `
    <div class="lp" style="position:relative;overflow:hidden">
        <div class="lp-glow a"></div>
        <div class="lp-glow b"></div>

        <!-- Nav -->
        <header class="lp-wrap" style="position:sticky;top:0;z-index:30;padding-block:14px">
            <div class="d-flex items-center justify-between gap-3"
                 style="background:rgba(255,255,255,.85);backdrop-filter:blur(14px);border-radius:999px;padding:10px 12px 10px 18px;box-shadow:var(--sh-sm);border:1px solid var(--border)">
                <div class="brand">
                    <div class="brand-mark"><i data-lucide="graduation-cap"></i></div>
                    <div class="d-none d-sm-block">
                        <div class="brand-name" style="color:var(--gray-900);font-size:1rem">O’quv.uz</div>
                        <div class="brand-sub">LMS Platform</div>
                    </div>
                </div>
                <div class="d-flex items-center gap-2">
                    ${canEdit ? `<button class="btn btn-outline btn-sm" onclick="openLandingEditor()">
                        <i data-lucide="pencil"></i><span class="d-none d-sm-inline">Tahrirlash</span></button>` : ''}
                    <button class="btn btn-primary btn-sm" onclick="go('login')">
                        <i data-lucide="log-in"></i><span class="d-none d-sm-inline">Kirish</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Hero -->
        <section class="lp-wrap lp-section" style="padding-top:18px">
            <div class="lp-hero">
                <span class="lp-badge"><i data-lucide="landmark" style="width:14px;height:14px"></i> PROF TA’LIM TEXNIKUMI</span>
                <h1 class="lp-title">
                    Innovatsion <span class="hl">Kelajak</span><br>Maskani
                </h1>
                <p class="lp-text">
                    Nukus shahridagi zamonaviy ta’lim platformasi. Kurslar, darslar, baholar va
                    davomat — bitta joyda. Kelajagingizni bugun quring.
                </p>
                <div class="d-flex items-center justify-center gap-3 mt-6 flex-wrap">
                    <button class="btn btn-white btn-lg" onclick="go('login')">
                        Portalga kirish <i data-lucide="arrow-right"></i>
                    </button>
                    <button class="btn btn-lg" style="background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.25)"
                            onclick="go('register')">
                        Ro’yxatdan o’tish
                    </button>
                </div>
            </div>
        </section>

        <!-- Indicators -->
        <section class="lp-wrap lp-section" style="padding-block:8px">
            <div class="grid grid-3">
                ${indicators.map(ind => `
                    <div class="lp-stat">
                        <div class="lp-stat-icon"><i data-lucide="${esc(ind.icon || 'star')}"></i></div>
                        <div class="lp-stat-num">${esc(ind.count || '0')}</div>
                        <div class="lp-stat-label">${esc(ind.label || '')}</div>
                    </div>`).join('')}
            </div>
        </section>

        <!-- Features -->
        <section class="lp-wrap lp-section">
            <div class="text-center" style="max-width:640px;margin:0 auto 40px">
                <h2 class="lp-h2">Platformada nima <span class="hl">bor</span></h2>
                <p class="c-muted mt-3" style="line-height:1.6">
                    O’rganish, baholanish va kommunikatsiya uchun barcha vositalar bir joyda.
                </p>
            </div>
            <div class="grid grid-auto">
                ${[
                    ['book-open', 'Kurslar va darslar', 'Har bir darsda video, matn va amaliy topshiriqlar. Yakunlanganda XP yig‘ing.', ''],
                    ['user-check', 'Avtomatik davomat', 'Geolokatsiya orqali kolledjga kelganingiz tasdiqlanadi.', 'green'],
                    ['trophy', 'Reyting va yutuqlar', 'Talabalar reytingi, guruhlar reytingi va 50+ yutuq.', 'amber'],
                    ['messages-square', 'Guruh chat', 'O‘qituvchi bilan real vaqtda muloqot qiling.', 'violet'],
                    ['swords', 'Duel va o‘yinlar', 'Savollar asosidagi duel va mini o‘yinlar orqali bilimingizni tekshiring.', 'accent'],
                    ['bar-chart-3', 'Hisobotlar', 'Direktor va admin uchun to‘liq statistika va analitika.', 'red'],
                ].map(([icon, title, sub, tone]) => `
                    <div class="tile click" onclick="go('login')">
                        <div class="tile-icon ${tone}"><i data-lucide="${icon}"></i></div>
                        <div>
                            <div class="tile-title">${title}</div>
                            <div class="tile-sub mt-1">${sub}</div>
                        </div>
                    </div>`).join('')}
            </div>
        </section>

        <!-- Director -->
        <section class="lp-wrap lp-section">
            <div class="d-flex flex-col items-center gap-8" style="align-items:center">
                <div class="lp-person-photo" style="width:min(100%,420px)">
                    <img src="${esc(d.director_photo)}" alt="${esc(d.director_name)}" loading="lazy">
                </div>
                <div style="max-width:640px">
                    <span class="badge badge-orange">Platforma rahbari</span>
                    <h2 class="lp-h2 mt-3">${esc(d.director_name)}</h2>
                    <p class="fw-8 upper tracking-widest mt-2" style="color:var(--accent-dark);font-size:.875rem">${esc(d.director_title)}</p>
                    <p class="t-lg c-muted mt-5" style="line-height:1.7;border-left:4px solid var(--accent);padding-left:20px;font-style:italic">
                        ${esc(d.quote)}
                    </p>
                </div>
            </div>
        </section>

        <!-- Teachers -->
        <section style="background:var(--surface-2);padding-block:56px">
            <div class="lp-wrap">
                <h2 class="lp-h2" style="margin-bottom:32px">Eng yaxshi <span class="hl">ustozlar</span></h2>
                <div class="grid grid-3">
                    ${teachers.map(t => `
                        <article class="lp-teacher">
                            <div class="lp-teacher-img">
                                <img src="${esc(t.photo || '')}" alt="${esc(t.name)}" loading="lazy">
                            </div>
                            <div class="lp-teacher-cap">
                                <span class="lp-teacher-role">Mutaxassis mentor</span>
                                <h3 class="lp-teacher-name mt-1">${esc(t.name)}</h3>
                                <p class="t-sm" style="color:rgba(255,255,255,.72);margin-top:4px">${esc(t.title || '')}</p>
                            </div>
                        </article>`).join('')}
                </div>
            </div>
        </section>

        <!-- Contacts -->
        <section class="lp-wrap lp-section">
            <div class="split" style="gap:40px;align-items:center">
                <div>
                    <h2 class="lp-h2">Bizning <span class="hl">manzil</span></h2>
                    <p class="c-muted mt-3" style="line-height:1.6">Zamonaviy kampusimizda kutib qolamiz.</p>
                    <div class="stack mt-8">
                        <a class="lp-contact" href="https://maps.google.com/?q=Nukus" target="_blank" rel="noopener">
                            <div class="lp-contact-icon"><i data-lucide="map-pin"></i></div>
                            <div>
                                <div class="lp-contact-label">Joylashuv</div>
                                <div class="lp-contact-value">${esc(d.address)}</div>
                            </div>
                        </a>
                        <a class="lp-contact" href="tel:${esc((d.phone || '').replace(/\s/g, ''))}">
                            <div class="lp-contact-icon" style="background:var(--accent-soft);color:var(--accent-dark)"><i data-lucide="phone"></i></div>
                            <div>
                                <div class="lp-contact-label">Bog’lanish</div>
                                <div class="lp-contact-value">${esc(d.phone)}</div>
                            </div>
                        </a>
                    </div>
                </div>
                <div class="lp-map">
                    <iframe src="${MAP_SRC}" title="Xarita" loading="lazy" allowfullscreen
                            referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section class="lp-wrap" style="padding-bottom:56px">
            <div class="hero-panel text-center" style="padding:48px 24px">
                <h2 class="hero-title" style="font-size:2rem">Bugun boshlaymizmi?</h2>
                <p class="hero-text" style="max-width:520px;margin:12px auto 0">
                    Bir daqiqada ro’yxatdan o’ting va birinchi darsingizni oching.
                </p>
                <button class="btn btn-white btn-lg mt-6" onclick="go('register')">
                    Ro’yxatdan o’tish <i data-lucide="arrow-right"></i>
                </button>
            </div>
        </section>

        <!-- Footer -->
        <footer class="lp-foot">
            <div class="lp-wrap">
                <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
                    <div>
                        <div class="d-flex items-center gap-3">
                            <div class="brand-mark"><i data-lucide="graduation-cap"></i></div>
                            <span style="font-size:1.25rem;font-weight:900;color:#fff;font-style:italic">O’quv.uz</span>
                        </div>
                        <p class="t-sm mt-4" style="line-height:1.6;max-width:340px">
                            Nukus Professional ta’lim texnikumi — bilim va tajriba maskani.
                        </p>
                    </div>
                    <div>
                        <h4>Ijtimoiy tarmoqlar</h4>
                        <div class="stack-sm mt-4">
                            ${SOCIAL.map(s => `
                                <a class="lp-social" href="${esc(d[s.key] || '#')}" target="_blank" rel="noopener">
                                    <svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px;color:${s.color}">
                                        <path d="${s.path}"></path>
                                    </svg>
                                    ${s.label}
                                </a>`).join('')}
                        </div>
                    </div>
                    <div>
                        <h4>Xizmatlar</h4>
                        <div class="stack-sm mt-4">
                            <a class="lp-social" href="#login" onclick="go('login');return false"><i data-lucide="book-open"></i> Onlayn ta’lim</a>
                            <a class="lp-social" href="#login" onclick="go('login');return false"><i data-lucide="library"></i> Kutubxona</a>
                            <a class="lp-social" href="#login" onclick="go('login');return false"><i data-lucide="life-buoy"></i> Yordam markazi</a>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-8" style="border-top:1px solid rgba(255,255,255,.07);color:#475569;font-size:.625rem;font-weight:800;letter-spacing:.24em">
                    © 2026 NUKUS PROFESSIONAL TA’LIM TEXNIKUMI PORTALI
                </div>
            </div>
        </footer>
    </div>`;
}

// ─── Editor ────────────────────────────────────────────────────────────
function openLandingEditor() {
    const d = { ...INITIAL_LANDING, ...(LANDING_DATA || {}) };

    openModal(modalShell({
        size: 'lg',
        icon: '<i data-lucide="pencil-ruler"></i>',
        title: 'Landing sahifasi sozlamalari',
        body: `
            <div class="stack">
                <div>
                    <div class="fw-8 mb-3" style="font-size:.9375rem">Rahbar ma’lumotlari</div>
                    <div class="stack-sm">
                        <div class="field"><label class="label">Ism</label>
                            <input class="input" id="edit-d-name" value="${esc(d.director_name)}"></div>
                        <div class="field"><label class="label">Lavozimi</label>
                            <input class="input" id="edit-d-title" value="${esc(d.director_title)}"></div>
                        <div class="field"><label class="label">Rasm havolasi</label>
                            <input class="input" id="edit-d-photo" value="${esc(d.director_photo)}"></div>
                        <div class="field"><label class="label">Iqtibos</label>
                            <textarea class="textarea" id="edit-quote">${esc(d.quote)}</textarea></div>
                    </div>
                </div>

                <div>
                    <div class="fw-8 mb-3" style="font-size:.9375rem">Kontaktlar</div>
                    <div class="stack-sm">
                        <div class="field"><label class="label">Manzil</label>
                            <input class="input" id="edit-address" value="${esc(d.address)}"></div>
                        <div class="field"><label class="label">Telefon</label>
                            <input class="input" id="edit-phone" value="${esc(d.phone)}"></div>
                        <div class="grid grid-3" style="gap:10px">
                            <div class="field"><label class="label">Telegram</label>
                                <input class="input" id="edit-tg" value="${esc(d.telegram_link)}"></div>
                            <div class="field"><label class="label">Instagram</label>
                                <input class="input" id="edit-insta" value="${esc(d.instagram_link)}"></div>
                            <div class="field"><label class="label">YouTube</label>
                                <input class="input" id="edit-yt" value="${esc(d.youtube_link)}"></div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="d-flex items-center justify-between mb-3">
                        <div class="fw-8" style="font-size:.9375rem">Ko‘rsatkichlar</div>
                        <button type="button" class="btn btn-soft btn-sm" onclick="window.__addIndicator()">
                            <i data-lucide="plus"></i> Qo‘shish</button>
                    </div>
                    <div class="stack-sm" id="indicators-box"></div>
                </div>

                <div>
                    <div class="d-flex items-center justify-between mb-3">
                        <div class="fw-8" style="font-size:.9375rem">Ustozlar</div>
                        <button type="button" class="btn btn-soft btn-sm" onclick="window.__addTeacher()">
                            <i data-lucide="plus"></i> Qo‘shish</button>
                    </div>
                    <div class="stack-sm" id="teachers-box"></div>
                </div>
            </div>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="saveLandingSettings()">
                <i data-lucide="save"></i> Saqlash</button>`,
    }), 'lg');

    window.__lpIndicators = JSON.parse(JSON.stringify(d.indicators || []));
    window.__lpTeachers = JSON.parse(JSON.stringify(d.best_teachers || []));

    const drawInd = () => {
        const box = document.getElementById('indicators-box');
        box.innerHTML = window.__lpIndicators.length === 0
            ? '<div class="form-hint">Ko‘rsatkich qo‘shilmagan</div>'
            : window.__lpIndicators.map((x, i) => `
            <div class="card card-pad-sm" style="border-style:dashed">
                <div class="d-flex gap-2 items-center">
                    <input class="input" style="max-width:100px" placeholder="25+" value="${esc(x.count || '')}" oninput="window.__lpIndicators[${i}].count=this.value">
                    <input class="input" placeholder="Label" value="${esc(x.label || '')}" oninput="window.__lpIndicators[${i}].label=this.value">
                    <select class="select" style="max-width:150px" onchange="window.__lpIndicators[${i}].icon=this.value">
                        ${['award', 'users', 'star', 'graduation-cap', 'book-open', 'trophy', 'zap'].map(ic =>
                            `<option value="${ic}" ${x.icon === ic ? 'selected' : ''}>${ic}</option>`).join('')}
                    </select>
                    <button type="button" class="btn-icon sm" onclick="window.__rmIndicator(${i})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>`).join('');
        safeLucide(box);
    };
    const drawTeach = () => {
        const box = document.getElementById('teachers-box');
        box.innerHTML = window.__lpTeachers.length === 0
            ? '<div class="form-hint">Ustoz qo‘shilmagan</div>'
            : window.__lpTeachers.map((x, i) => `
            <div class="card card-pad-sm" style="border-style:dashed">
                <div class="d-flex gap-2 items-center">
                    <input class="input" placeholder="Ism" value="${esc(x.name || '')}" oninput="window.__lpTeachers[${i}].name=this.value">
                    <input class="input" placeholder="Lavozim" value="${esc(x.title || '')}" oninput="window.__lpTeachers[${i}].title=this.value">
                    <button type="button" class="btn-icon sm" onclick="window.__rmTeacher(${i})"><i data-lucide="trash-2"></i></button>
                </div>
                <input class="input mt-2" placeholder="Rasm havolasi" value="${esc(x.photo || '')}" oninput="window.__lpTeachers[${i}].photo=this.value">
            </div>`).join('');
        safeLucide(box);
    };

    window.__addIndicator = () => { window.__lpIndicators.push({ id: Date.now(), count: '', label: '', icon: 'star' }); drawInd(); };
    window.__rmIndicator = (i) => { window.__lpIndicators.splice(i, 1); drawInd(); };
    window.__addTeacher = () => { window.__lpTeachers.push({ id: Date.now(), name: '', title: '', photo: '' }); drawTeach(); };
    window.__rmTeacher = (i) => { window.__lpTeachers.splice(i, 1); drawTeach(); };

    drawInd();
    drawTeach();
}

async function saveLandingSettings() {
    try {
        const val = (id) => document.getElementById(id)?.value.trim() || '';
        const data = {
            director_name: val('edit-d-name'),
            director_title: val('edit-d-title'),
            director_photo: val('edit-d-photo'),
            quote: val('edit-quote'),
            address: val('edit-address'),
            phone: val('edit-phone'),
            telegram_link: val('edit-tg'),
            instagram_link: val('edit-insta'),
            youtube_link: val('edit-yt'),
            indicators: (window.__lpIndicators || []).filter(x => x.label),
            best_teachers: (window.__lpTeachers || []).filter(x => x.name),
        };
        const saved = await api_patch('/landing', data);
        LANDING_DATA = { ...data, ...(saved || {}) };
        showToast('Landing sahifasi yangilandi', 'success');
        cModal();
        // Eski kod shu yerda renderLanding() ni chaqirib, DOM’ni
        // o’zgartirmasdan tashlab qo’yardi — endi to’g’ri yangilanadi.
        if (window.STATE?.view === 'home') {
            const box = document.getElementById('landing-content');
            if (box) { box.innerHTML = renderLanding(); safeLucide(box); }
        }
    } catch (e) {
        showToast('Xatolik: ' + e.message, 'error');
    }
}

export {
    renderLanding, syncLandingData, LANDING_DATA, INITIAL_LANDING,
    openLandingEditor, saveLandingSettings,
};
