// ============================================================
// app.js — O’quv.uz LMS front-end
// ============================================================
import { setAuth, getAuthUser, getAuthToken, api_get, api_post, api_patch, api_del } from './modules/api.js';
import {
    safeLucide, showToast, escapeHtml, cModal, openModal, modalShell,
    toggleSidebar, closeSidebar,
} from './modules/ui.js';
import { login, register, logout as authLogout, fetchMe } from './modules/auth.js';
import {
    renderLanding, syncLandingData, LANDING_DATA, INITIAL_LANDING,
    openLandingEditor, saveLandingSettings,
} from './modules/landing.js';

// ─── Globals for inline handlers ───────────────────────────────────────
window.safeLucide = safeLucide;
window.showToast = showToast;
window.cModal = cModal;
window.openModal = openModal;
window.escapeHtml = escapeHtml;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.logout = () => { authLogout(); window.removeUserSession(); };
window.openLandingEditor = openLandingEditor;
window.saveLandingSettings = saveLandingSettings;
window.go = (v) => { window.location.hash = v; };

let STATE = {
    user: null,
    view: 'login',
    activeTicketId: null,
    activeCourseId: null,
    activeGroupId: null,
    quiz: null,
    notifCount: 0,
    // Sozlamalar yuklanmaguncha `undefined` — "ochiq" deb hisoblanadi;
    // oxirgisi hech qachon backend 403'ini almashtirmaydi.
    allowRegistration: undefined,
};
window.STATE = STATE;

// Savol turlari: eski versiyalar 'miniGame' yozgan, backend hozir 'mini_game'.
// Bitta lug'at — qat'iymaslik shu yerda chiqadi.
// Eski "duel" turi olib tashlandi: uning savollari ham o'yin savollari hisoblanadi,
// aks holda o'yin savol bazasi bo'sh qolib ketardi.
const QUIZ_TYPE = (t) => (t === 'quiz' ? 'quiz' : 'mini_game');
const QUIZ_TYPE_LABEL = {
    mini_game: 'Mini o‘yin',
    miniGame: 'Mini o‘yin',
    quiz: 'Test',
};

window.removeUserSession = () => {
    STATE.user = null;
    localStorage.removeItem('lms_user');
    localStorage.removeItem('lms_token');
    document.getElementById('mobile-bottom-nav')?.classList.add('hidden');
    document.getElementById('mobile-header')?.classList.add('hidden');
};

// ══════════════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════════════
const esc = escapeHtml;
const num = (v) => Number(v) || 0;

const ROLE_LABELS = {
    student: 'Talaba',
    ustoz: "O’qituvchi",
    admin: 'Administrator',
    tech_admin: 'Tex administrator',
    director: 'Direktor',
    parent: 'Ota-ona',
};
const ROLE_BADGE = {
    student: 'badge-blue',
    ustoz: 'badge-green',
    admin: 'badge-orange',
    tech_admin: 'badge-violet',
    director: 'badge-amber',
    parent: 'badge',
};
const roleLabel = (r) => ROLE_LABELS[r] || r;
const isStaff = (u = STATE.user) => !!u && ['admin', 'tech_admin', 'director', 'ustoz'].includes(u.role);
const canManage = (u = STATE.user) => !!u && ['admin', 'tech_admin'].includes(u.role);

function initials(name = '') {
    return String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

function avatarHtml(user, cls = 'avatar-sm', extra = '') {
    const name = user?.ism || user?.user_name || user?.name || '?';
    if (user?.avatar) {
        return `<div class="avatar ${cls} ${extra}"><img src="${esc(user.avatar)}" alt="${esc(name)}" loading="lazy"></div>`;
    }
    return `<div class="avatar ${cls} ${extra}">${esc(initials(name))}</div>`;
}

function statTile({ label, value, icon, tone = '', foot = '', href = '', onclick = '' }) {
    const tag = href ? 'a' : 'div';
    return `
        <${tag} ${href ? `href="${href}"` : ''} ${onclick ? `onclick="${onclick}"` : ''}
            class="stat ${tag === 'a' ? 'card-hover' : ''}">
            <div class="stat-head">
                <div class="stat-icon ${tone}"><i data-lucide="${icon}"></i></div>
                <div class="stat-label">${esc(label)}</div>
            </div>
            <div class="stat-value">${value}</div>
            ${foot ? `<div class="stat-foot mt-1">${foot}</div>` : ''}
        </${tag}>`;
}

function emptyState(icon, title, sub = '', action = '') {
    return `
        <div class="empty">
            <div class="empty-icon"><i data-lucide="${icon}"></i></div>
            <div class="empty-title">${esc(title)}</div>
            ${sub ? `<div class="empty-sub">${esc(sub)}</div>` : ''}
            ${action}
        </div>`;
}

function pageHead(title, sub = '', actions = '') {
    return `
        <div class="page-head">
            <div style="min-width:0">
                <h1 class="page-title">${esc(title)}</h1>
                ${sub ? `<p class="page-sub">${esc(sub)}</p>` : ''}
            </div>
            ${actions ? `<div class="d-flex items-center gap-2 flex-wrap">${actions}</div>` : ''}
        </div>`;
}

function sectionCard(title, body, { icon = '', actions = '', pad = 'card-pad', sub = '' } = {}) {
    return `
        <section class="card ${pad}">
            ${title ? `
            <div class="card-head">
                <div class="d-flex items-center gap-3" style="min-width:0">
                    ${icon ? `<div class="card-icon">${icon}</div>` : ''}
                    <div style="min-width:0">
                        <div class="card-title">${esc(title)}</div>
                        ${sub ? `<div class="card-sub">${esc(sub)}</div>` : ''}
                    </div>
                </div>
                ${actions}
            </div>` : ''}
            ${body}
        </section>`;
}

function gradePill(v) {
    return `<span class="grade-pill g${v}">${v}</span>`;
}

function progressBar(pct, tone = '') {
    const p = Math.max(0, Math.min(100, num(pct)));
    return `<div class="progress"><div class="progress-bar ${tone}" style="width:${p}%"></div></div>`;
}

/**
 * Загружает данные и вставляет результат в контейнер.
 * fn должна вернуть HTML-строку (или массив строк).
 * Если пользователь успел уйти на другую страницу — ничего не вставляем.
 */
function mount(id, fn, onErrorTitle = 'Yuklab bo‘lmadi') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="loading-box"><span class="spinner"></span> Yuklanmoqda…</div>`;
    Promise.resolve()
        .then(fn)
        .then((html) => {
            const node = document.getElementById(id);
            if (!node) return;                     // страница сменилась
            node.innerHTML = Array.isArray(html) ? html.join('') : (html ?? '');
            safeLucide(node);
            animateIn(node);
        })
        .catch((e) => {
            const node = document.getElementById(id);
            if (!node) return;
            node.innerHTML = emptyState('triangle-alert', onErrorTitle, e?.message || '', `
                <button class="btn btn-outline btn-sm" onclick="location.reload()">
                    <i data-lucide="refresh-cw"></i> Qayta urinish
                </button>`);
            safeLucide(node);
            animateIn(node);
        });
}

// ── Animatsiyalar ───────────────────────────────────────────────────
// CSS'da `.fade-in` / `.slide-up` / `.stagger` sinflari bor edi, lekin
// hech kim ularni qo'ymagan edi — shuning uchun sayt statik ko'rinyotgan.
// Bu yerga ulab, har bir sahifa ochilishida kirish animatsiyasi va
// qatorlar uchun ketma-ket (stagger) ko'rsatilish qo'shildi.

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Sahifa kontentiga kirish animatsiyasi + bolalarni ketma-ket ko'rsatadi. */
function animateIn(root) {
    // Yashirin tabda CSS animatsiyalar boshlanmaydi, `opacity:0` da qolib
    // ketadi — shuning uchun ko'rinmaydigan holatda umuman qo'shmaymiz.
    if (!root || REDUCED_MOTION || document.hidden) return;
    root.classList.add('view-enter');
    // Blok darajasidagi birinchi bolalar ketma-ket paydo bo'ladi.
    Array.from(root.children).slice(0, 12).forEach((k, i) => {
        if (!(k instanceof HTMLElement)) return;
        k.classList.add('stagger');
        k.style.setProperty('--stagger-i', String(i));
    });
    // Ro'yxa qatorlari va statistika plitalari ham ketma-ket keladi.
    root.querySelectorAll('.list > .list-row, .grid > .stat').forEach((row, i) => {
        if (i > 11) return;
        row.classList.add('stagger');
        row.style.setProperty('--stagger-i', String(i));
    });
}

// ══════════════════════════════════════════════════════════════════════
//  Data layer
// ══════════════════════════════════════════════════════════════════════
const getPosts = () => api_get('/posts');
const getCourses = () => api_get('/courses');
const getTickets = () => api_get('/tickets');
const getGroups = () => api_get('/groups');
const getUsers = () => api_get('/users');
const getAttendance = () => api_get('/attendance');
const getLeaderboard = () => api_get('/users/leaderboard');
const getQuestions = () => api_get('/questions');
const getBooks = () => api_get('/books');
const getAchievements = () => api_get('/achievements');
const getNotifications = () => api_get('/notifications');
const getMyAttendance = () => api_get('/attendance/my');
const getGrades = () => api_get('/grades');
const getStudentGrades = (sid) => api_get(`/grades/student/${sid}`);
const getParentChild = () => api_get('/parent/child');
const getParentAtt = () => api_get('/parent/child/attendance');
const getParentReport = () => api_get('/parent/child/report');
const getSettingsAPI = () => api_get('/settings');
const getShop = () => api_get('/shop');
const getPendingUsers = () => api_get('/users/pending');
const getMyPurchases = () => api_get('/shop/purchases');
const setUserStatus = (id, status) => api_patch(`/users/${id}/status`, { status });
const buyItem = (id) => api_post(`/shop/${id}/buy`, {});

async function loadUserData() {
    if (!getAuthToken()) { STATE.user = null; return null; }
    try {
        const user = await fetchMe();
        if (!user) { window.removeUserSession(); return null; }
        STATE.user = user;
        localStorage.setItem('lms_user', JSON.stringify(user));
        loadLessonMinutes();
        return user;
    } catch {
        window.removeUserSession();
        return null;
    }
}

// Dars uzunligi sozlanadi (standart 20 daqiqa) — bir marta yuklab olamiz
let __lessonMinLoaded = false;
async function loadLessonMinutes() {
    if (__lessonMinLoaded) return;
    __lessonMinLoaded = true;
    try {
        const s = await api_get('/settings');
        if (s && Number(s.lessonMinutes) > 0) LESSON_NEEDED_SEC = Number(s.lessonMinutes) * 60;
    } catch { /* standart qiymat qoladi */ }
}
window.loadLessonMinutes = loadLessonMinutes;

async function getMyGroup() {
    const groups = await getGroups();
    if (!STATE.user) return null;
    if (STATE.user.groupId) return groups.find(g => g.id === STATE.user.groupId) || null;
    if (STATE.user.role === 'ustoz') return groups.find(g => g.ustozId === STATE.user.id) || null;
    if (isStaff()) return groups[0] || null;
    return null;
}

function courseProgress(course) {
    const p = STATE.user?.progress?.[String(course.id)];
    return p?.percent || 0;
}
function courseCompleted(course) {
    const p = STATE.user?.progress?.[String(course.id)];
    return p?.completed || [];
}

// ══════════════════════════════════════════════════════════════════════
//  XP / achievements
// ══════════════════════════════════════════════════════════════════════
let LAST_BONUS_TIME = Number(localStorage.getItem('lms_bonus_at') || 0);

function canClaimBonus() {
    return Date.now() - LAST_BONUS_TIME > 20 * 60 * 1000;
}

async function addPoints(pts, reason = '', category = 'other') {
    try {
        const res = await api_post('/xp/add', { amount: pts, category, reason });
        if (res.xpGained > 0) {
            showToast(`+${res.xpGained} XP — ${reason || 'Ball qo\'shildi'}`, 'success');
            await loadUserData();
            updateHeaderUser();
        } else if (res.message) {
            showToast(res.message, 'info');
        }
        (res.newAchievements || []).forEach(showAchievementUnlock);
        return res;
    } catch (e) {
        showToast(e.message, 'error');
        return null;
    }
}

async function claimDailyBonus(btn) {
    if (!canClaimBonus()) {
        showToast('Kunlik bonus endi tayyor emas', 'info');
        return;
    }
    btn.disabled = true;
    const res = await addPoints(20, 'Kunlik bonus', 'other');
    if (res?.xpGained > 0) {
        LAST_BONUS_TIME = Date.now();
        localStorage.setItem('lms_bonus_at', String(LAST_BONUS_TIME));
        if (btn) btn.closest('[data-bonus]')?.classList.add('hidden');
    } else if (btn) {
        btn.disabled = false;
    }
}
window.claimDailyBonus = claimDailyBonus;

const RARITY_META = {
    common: { label: 'Oddiy', cls: 'rarity-common' },
    rare: { label: 'Kamay', cls: 'rarity-rare' },
    epic: { label: 'Epik', cls: 'rarity-epic' },
    legendary: { label: 'Legendar', cls: 'rarity-legendary' },
};

function showAchievementUnlock(ach) {
    const root = document.createElement('div');
    root.className = 'unlock-root';
    const meta = RARITY_META[ach.rarity] || RARITY_META.common;
    root.innerHTML = `
        <div class="unlock-card ${meta.cls}">
            <div class="unlock-emoji">${esc(ach.icon || '🏆')}</div>
            <div class="t-xs fw-8 tracking-widest upper c-accent mt-2">Yutuq ochildi</div>
            <h3 class="mt-2" style="font-size:1.25rem">${esc(ach.title)}</h3>
            <p class="t-sm c-muted mt-2" style="line-height:1.5">${esc(ach.desc || '')}</p>
            <div class="badge ${ach.rarity === 'legendary' ? 'badge-orange' : 'badge-blue'} mt-4">${meta.label}</div>
        </div>`;
    root.addEventListener('click', () => root.remove());
    document.body.appendChild(root);
    safeLucide(root);
    setTimeout(() => root.remove(), 5000);
}

// ══════════════════════════════════════════════════════════════════════
//  Lesson timer
// ══════════════════════════════════════════════════════════════════════
const LESSON_REQUIRED_SEC = 20 * 60;
let LESSON_NEEDED_SEC = LESSON_REQUIRED_SEC;
let TIMER = { interval: null, sec: 0, active: false, lessonId: null, sessionId: null };

function stopLessonTimer() {
    clearInterval(TIMER.interval);
    TIMER = { interval: null, sec: 0, active: false, lessonId: null, sessionId: null };
}

async function startLessonTimer(lessonId) {
    stopLessonTimer();
    TIMER = { interval: null, sec: 0, active: true, lessonId };
    const res = await api_post(`/lessons/${lessonId}/start`);
    TIMER.sessionId = res.sessionId;
    if (res.requiredSeconds) LESSON_NEEDED_SEC = res.requiredSeconds;
    TIMER.sec = Math.min(res.alreadySec || 0, LESSON_NEEDED_SEC);
    TIMER.interval = setInterval(() => {
        if (updateLessonTimerUI()) return;     // true = vaqt tugadi
        TIMER.sec++;
        updateLessonTimerUI();
    }, 1000);
    updateLessonTimerUI();
}
window.startLessonTimer = startLessonTimer;

// true qaytaradi, agar timer endi tugagan bo'lsa (bir marta chaqiriladi)
function updateLessonTimerUI() {
    const box = document.getElementById('timer-box');
    if (!box) return false;
    const left = Math.max(0, LESSON_NEEDED_SEC - TIMER.sec);
    const done = left === 0;
    const wasDone = box.classList.contains('done');
    box.classList.toggle('done', done);

    const text = document.getElementById('timer-text');
    if (text) text.textContent = `${String(Math.floor(TIMER.sec / 60)).padStart(2, '0')}:${String(TIMER.sec % 60).padStart(2, '0')}`;

    const ring = document.getElementById('timer-ring');
    if (ring) {
        const c = 2 * Math.PI * 20;
        const pct = Math.min(1, TIMER.sec / LESSON_NEEDED_SEC);
        ring.style.strokeDasharray = `${c}`;
        ring.style.strokeDashoffset = `${c * (1 - pct)}`;
    }

    const msg = document.getElementById('timer-msg');
    const btn = document.getElementById('timer-btn');
    const lock = document.getElementById('video-lock');
    if (done) {
        if (msg) msg.innerHTML = '<b>Tayyor!</b> Video ochildi va ball qo‘shildi.';
        if (btn) btn.disabled = false;
        if (lock) lock.classList.add('open');
        if (!wasDone) window.__unlockLessonVideo();
    } else {
        if (msg) msg.innerHTML = `Video ochilishi uchun <b>${Math.ceil(left / 60)} daqiqa</b> qoldi.`;
        if (btn) btn.disabled = true;
        if (lock) {
            const lb = lock.querySelector('.video-lock-left');
            if (lb) lb.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
        }
    }
    return done && !wasDone;
}

// Timer tugadi: qufulni ochamiz, videoni ko'rsatamiz va ball qo'shamiz
window.__unlockLessonVideo = async () => {
    const lid = TIMER.lessonId;
    if (!lid || TIMER.unlockedFor === lid) return;
    TIMER.unlockedFor = lid;
    stopLessonTimer();
    try {
        const res = await completeLessonServer(lid);
        window.__swapToVideo(lid, res);
    } catch (e) {
        showToast(e.message || 'Darsni yakunlab bo‘lmadi', 'error');
    }
};

// Video konteynerini "qufuli" holatdan haqiqiy videoga almashtiramiz
window.__swapToVideo = (lessonId, res) => {
    const lock = document.getElementById('video-lock');
    const holder = document.getElementById('video-holder');
    const url = window.__videoUrls?.[lessonId];
    if (holder && url && !holder.dataset.ready) {
        holder.dataset.ready = '1';
        holder.innerHTML = `
            <iframe src="${esc(url)}" allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    title="Dars videosi"></iframe>`;
    }
    if (lock) lock.remove();
    const box = document.getElementById('timer-box');
    if (box) box.classList.add('unlocked');
    if (res && res.xpGained > 0) {
        const xb = document.getElementById('lesson-xp');
        if (xb) { xb.innerHTML = `<i data-lucide="zap"></i> +${res.xpGained} XP`; xb.classList.add('show'); safeLucide(xb); }
    }
    const btn = document.getElementById('timer-btn');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="check"></i> Darsni yakunlandi deb belgilash'; safeLucide(btn); }
};

async function completeLessonServer(lessonId) {
    const res = await api_post(`/lessons/${lessonId}/complete`);
    (res.newAchievements || []).forEach(showAchievementUnlock);
    if (res.xpGained > 0) showToast(`+${res.xpGained} XP — dars yakunlandi`, 'success');
    else showToast(res.message || 'Dars yakunlandi', 'info');
    await loadUserData();
    updateHeaderUser();
    if (STATE.view === 'course-detail') renderView(STATE.view);
    return res;
}

// ══════════════════════════════════════════════════════════════════════
//  Navigation
// ══════════════════════════════════════════════════════════════════════
const NAV = {
    student: [
        {
            group: 'O‘qish', items: [
                { view: 'student-dashboard', label: 'Boshqaruv paneli', icon: 'layout-dashboard' },
                { view: 'courses', label: 'Kurslar', icon: 'book-open' },
                { view: 'schedule', label: 'Dars jadvali', icon: 'calendar-days' },
                { view: 'grades', label: 'Baholarim', icon: 'graduation-cap' },
            ],
        },
        {
            group: 'Jamiyat', items: [
                { view: 'posts', label: 'Postlar', icon: 'newspaper' },
                { view: 'leaderboard', label: 'Reyting', icon: 'trophy' },
                { view: 'game', label: 'Mini o‘yin', icon: 'gamepad-2' },
                { view: 'shop', label: 'Do‘kon', icon: 'shopping-bag' },
                { view: 'chat', label: 'Guruh chat', icon: 'messages-square' },
                { view: 'library', label: 'Kutubxona', icon: 'library' },
            ],
        },
        {
            group: 'Shaxsiy', items: [
                { view: 'notifications', label: 'Bildirishnomalar', icon: 'bell', badge: true },
                { view: 'support', label: 'Yordam', icon: 'life-buoy' },
                { view: 'profile', label: 'Profil', icon: 'user' },
            ],
        },
    ],
    ustoz: [
        {
            group: 'Ta’lim', items: [
                { view: 'ustoz-dashboard', label: 'Boshqaruv paneli', icon: 'layout-dashboard' },
                { view: 'courses', label: 'Kurslarim', icon: 'book-open' },
                { view: 'groups', label: 'Guruhlarim', icon: 'users' },
                { view: 'attendance', label: 'Davomat', icon: 'user-check' },
                { view: 'grades', label: 'Baholar', icon: 'graduation-cap' },
                { view: 'questions', label: 'Savollar', icon: 'list-checks' },
            ],
        },
        {
            group: 'Kommunikatsiya', items: [
                { view: 'schedule', label: 'Jadval', icon: 'calendar-days' },
                { view: 'posts', label: 'Postlar', icon: 'newspaper' },
                { view: 'game', label: 'Mini o‘yin', icon: 'gamepad-2' },
                { view: 'staff-chat', label: 'Xodimlar chat', icon: 'messages-square' },
            ],
        },
        {
            group: 'Shaxsiy', items: [
                { view: 'notifications', label: 'Bildirishnomalar', icon: 'bell', badge: true },
                { view: 'support', label: 'Yordam', icon: 'life-buoy' },
                { view: 'profile', label: 'Profil', icon: 'user' },
            ],
        },
    ],
    admin: [
        {
            group: 'Boshqaruv', items: [
                { view: 'admin-dashboard', label: 'Panel', icon: 'layout-dashboard' },
                { view: 'users', label: 'Foydalanuvchilar', icon: 'users' },
                { view: 'pending', label: 'Tasdiqlash', icon: 'user-check' },
                { view: 'groups', label: 'Guruhlar', icon: 'users-round' },
                { view: 'courses', label: 'Kurslar', icon: 'book-open' },
                { view: 'attendance', label: 'Davomat', icon: 'calendar-check' },
            ],
        },
        {
            group: 'Monitoring', items: [
                { view: 'reports', label: 'Hisobotlar', icon: 'bar-chart-3' },
                { view: 'posts', label: 'Postlar', icon: 'newspaper' },
                { view: 'questions', label: 'Savollar', icon: 'list-checks' },
                { view: 'shop', label: 'Do‘kon', icon: 'shopping-bag' },
                { view: 'support', label: 'Ticketlar', icon: 'life-buoy' },
                { view: 'leaderboard', label: 'Reyting', icon: 'trophy' },
            ],
        },
        {
            group: 'Tizim', items: [
                { view: 'staff-chat', label: 'Xodimlar chat', icon: 'messages-square' },
                { view: 'notifications', label: 'Bildirishnomalar', icon: 'bell', badge: true },
                { view: 'settings', label: 'Sozlamalar', icon: 'settings' },
                { view: 'profile', label: 'Profil', icon: 'user' },
            ],
        },
    ],
    parent: [
        {
            group: 'Bolam', items: [
                { view: 'parent-dashboard', label: 'Boshqaruv paneli', icon: 'layout-dashboard' },
                { view: 'leaderboard', label: 'Reyting', icon: 'trophy' },
            ],
        },
        {
            group: 'Shaxsiy', items: [
                { view: 'notifications', label: 'Bildirishnomalar', icon: 'bell', badge: true },
                { view: 'support', label: 'Yordam', icon: 'life-buoy' },
                { view: 'profile', label: 'Profil', icon: 'user' },
            ],
        },
    ],
};
NAV.tech_admin = NAV.admin;
NAV.director = [
    {
        group: 'Rahbariyat', items: [
            { view: 'director-dashboard', label: 'Boshqaruv paneli', icon: 'layout-dashboard' },
            { view: 'reports', label: 'Hisobotlar', icon: 'bar-chart-3' },
            { view: 'analytics', label: 'Analitika', icon: 'trending-up' },
        ],
    },
    {
        group: 'Monitoring', items: [
            { view: 'users', label: 'Xodimlar va talabalar', icon: 'users' },
            { view: 'pending', label: 'Tasdiqlash', icon: 'user-check' },
            { view: 'groups', label: 'Guruhlar', icon: 'users-round' },
            { view: 'attendance', label: 'Davomat', icon: 'calendar-check' },
            { view: 'shop', label: 'Do‘kon', icon: 'shopping-bag' },
            { view: 'leaderboard', label: 'Reyting', icon: 'trophy' },
        ],
    },
    {
        group: 'Shaxsiy', items: [
        { view: 'notifications', label: 'Bildirishnomalar', icon: 'bell', badge: true },
        { view: 'support', label: 'Ticketlar', icon: 'life-buoy' },
        { view: 'profile', label: 'Profil', icon: 'user' },
    ],
    },
];

/** Разделы, доступные роли — для отладки и автотестов */
window.NAV = NAV;
window.viewsFor = (role) => (NAV[role] || []).flatMap((g) => g.items.map((i) => i.view));

const MOBILE_NAV = {
    student: ['student-dashboard', 'courses', 'grades', 'shop', 'profile'],
    ustoz: ['ustoz-dashboard', 'courses', 'attendance', 'staff-chat', 'profile'],
    admin: ['admin-dashboard', 'pending', 'users', 'courses', 'profile'],
    tech_admin: ['admin-dashboard', 'pending', 'users', 'courses', 'profile'],
    director: ['director-dashboard', 'reports', 'analytics', 'users', 'profile'],
    parent: ['parent-dashboard', 'leaderboard', 'notifications', 'support', 'profile'],
};

const DASHBOARD_VIEW = {
    student: 'student-dashboard',
    ustoz: 'ustoz-dashboard',
    admin: 'admin-dashboard',
    tech_admin: 'admin-dashboard',
    director: 'director-dashboard',
    parent: 'parent-dashboard',
};

const VIEW_TITLES = {
    home: "O’quv.uz", login: 'Kirish', register: 'Ro‘yxatdan o‘tish',
    'student-dashboard': 'Boshqaruv paneli', 'ustoz-dashboard': 'Boshqaruv paneli',
    'admin-dashboard': 'Boshqaruv paneli', 'director-dashboard': 'Boshqaruv paneli',
    'parent-dashboard': 'Boshqaruv paneli',
    courses: 'Kurslar', 'course-detail': 'Kurs', users: 'Foydalanuvchilar',
    groups: 'Guruhlar', attendance: 'Davomat', grades: 'Baholar',
    reports: 'Hisobotlar', analytics: 'Analitika', leaderboard: 'Reyting',
    support: 'Yordam', chat: 'Guruh chat', 'staff-chat': 'Xodimlar chat',
    library: 'Kutubxona', game: 'Mini o’yin', questions: 'Savollar',
    schedule: 'Jadval', posts: 'Postlar', profile: 'Profil',
    notifications: 'Bildirishnomalar', settings: 'Sozlamalar',
// Yangi bo'limlar VIEW_TITLES da bo'lmasa, renderView ularni topa olmaydi
// va har doim boshqaruv paneliga qaytadi (jimjin o'zgarish kuzatilmaydi).
shop: 'Do\\u2018kon', pending: 'Tasdiqlash', homework: 'Uy vazifalari',
};

const ALL_VIEWS = new Set(Object.keys(VIEW_TITLES));
const PUBLIC_VIEWS = new Set(['home', 'login', 'register']);

// ══════════════════════════════════════════════════════════════════════
//  Shell rendering
// ══════════════════════════════════════════════════════════════════════
function findNavItem(view) {
    const groups = NAV[STATE.user?.role] || [];
    for (const g of groups) {
        const found = g.items.find(i => i.view === view);
        if (found) return found;
    }
    return null;
}

function renderSidebar() {
    const menu = document.getElementById('nav-menu');
    if (!menu) return;
    const groups = NAV[STATE.user?.role] || [];
    const view = STATE.view;

    menu.innerHTML = groups.map(g => `
        <div class="sb-section">${esc(g.group)}</div>
        ${g.items.map(i => `
            <a class="nav-link ${view === i.view || (view === 'course-detail' && i.view === 'courses') ? 'active' : ''}"
               href="#${i.view}" data-nav="${i.view}">
                <i data-lucide="${i.icon}"></i>
                <span class="grow truncate">${esc(i.label)}</span>
                ${i.badge ? '<span class="notif-badge hidden" data-notif-badge>0</span>' : ''}
            </a>`).join('')}
    `).join('');

    updateHeaderUser();
    safeLucide(menu);
}

function renderMobileNav() {
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav || !STATE.user) return;

    const views = MOBILE_NAV[STATE.user.role] || [];
    const all = (NAV[STATE.user.role] || []).flatMap(g => g.items);
    const view = STATE.view;

    nav.innerHTML = views.map((v) => {
        const item = all.find(i => i.view === v) || { label: v, icon: 'circle' };
        const active = view === v || (view === 'course-detail' && v === 'courses');
        return `
            <a href="#${v}" class="${active ? 'active' : ''}">
                <i data-lucide="${item.icon}"></i>
                <span>${esc(item.label)}</span>
                ${item.badge ? '<span class="notif-badge hidden" data-notif-badge>0</span>' : ''}
            </a>`;
    }).join('');

    nav.classList.remove('hidden');
    safeLucide(nav);
}

function updateHeaderUser() {
    const u = STATE.user;
    if (!u) return;
    const av = document.getElementById('sidebar-avatar');
    const nm = document.getElementById('sidebar-name');
    const rl = document.getElementById('sidebar-role');
    if (av) av.outerHTML = avatarHtml(u, 'avatar-sm').replace('avatar avatar-sm', 'avatar avatar-sm')
        .replace(/^/, '').replace('class="avatar', `id="sidebar-avatar" class="avatar`);
    if (nm) nm.textContent = u.ism;
    if (rl) rl.textContent = roleLabel(u.role);
    // Tepa paneldagi chiplar ham xuddi shu ma'lumotni ko'rsatadi
    const tAv = document.getElementById('topbar-avatar');
    const tNm = document.getElementById('topbar-name');
    const tRl = document.getElementById('topbar-role');
    if (tAv) tAv.outerHTML = avatarHtml(u, 'avatar-sm')
        .replace('class="avatar', 'id="topbar-avatar" class="avatar');
    if (tNm) tNm.textContent = u.ism;
    if (tRl) tRl.textContent = roleLabel(u.role);
}

function setShellChrome(on) {
    const header = document.getElementById('mobile-header');
    const main = document.getElementById('main-content');
    const bottom = document.getElementById('mobile-bottom-nav');
    const sidebar = document.getElementById('sidebar-container');
    if (header) header.classList.toggle('hidden', !on);
    if (main) main.classList.toggle('has-sidebar', on);
    if (bottom) bottom.classList.toggle('hidden', !on);
    // Ish stolida yon panel doim ko'rinadi (`@media min-width:1024px`), lekin
    // faqat tizimga kiringandan keyin. Aks holda kirish/ro'yxatdan o'tish
    // sahifalarida ham yon panel paydo bo'lib qolardi.
    if (sidebar) sidebar.classList.toggle('is-live', on);
    if (on) closeSidebar(); else { sidebar?.classList.remove('is-open'); }
}

// ══════════════════════════════════════════════════════════════════════
//  Route handling
// ══════════════════════════════════════════════════════════════════════
function showSection(id) {
    ['view-home', 'view-login', 'view-register', 'dashboard-wrapper'].forEach(s => {
        document.getElementById(s)?.classList.add('hidden');
    });
    if (id) document.getElementById(id)?.classList.remove('hidden');
}

async function renderView(view) {
    if (!ALL_VIEWS.has(view)) view = STATE.user ? DASHBOARD_VIEW[STATE.user.role] : 'home';
    STATE.view = view;

    document.title = `${VIEW_TITLES[view] || "O’quv.uz"} — O’quv.uz`;
    closeSidebar();

    // Public pages
    if (PUBLIC_VIEWS.has(view)) {
        setShellChrome(false);
        renderSidebar();
        showSection(`view-${view}`);
        if (view === 'home') {
            const box = document.getElementById('landing-content');
            box.innerHTML = renderLanding();
            safeLucide(box);
        }
        // Ro'yxatdan o'tish yopiq bo'lsa, to'g'ridan-to'g'ri #register
        // orqali kirsangiz ham shaklni ko'rsatmaymiz.
        if (view === 'register') {
            if (STATE.allowRegistration === false) {
                showToast("Ro‘yxatdan o‘tish vaqtincha yopilgan", 'warn');
                window.location.hash = 'login';
                return;
            }
            renderRegisterGroups();
        }
        updateNotifBadges();
        return;
    }

    if (!STATE.user) { window.location.hash = 'login'; return; }

    setShellChrome(true);
    showSection('dashboard-wrapper');
    const area = document.getElementById('dynamic-view-area');
    area.innerHTML = `<div class="loading-box"><span class="spinner"></span> Yuklanmoqda…</div>`;

    renderSidebar();
    renderMobileNav();

    // Ro'yxatdan o'tgan, lekin admin tasdiqlagancha kirish mumkin emas
    if (isAwaitingApproval() && view !== 'pending') {
        area.innerHTML = pendingGate();
        safeLucide(area);
        animateIn(area);
        updateNotifBadges();
        return;
    }

    const renderer = VIEWS[view];
    if (!renderer) {
        area.innerHTML = emptyState('compass', 'Sahifa topilmadi');
        safeLucide(area);
        return;
    }

    try {
        const html = await renderer();
        area.innerHTML = html;
        safeLucide(area);
        animateIn(area);
        runAfterRender(view);
    } catch (e) {
        area.innerHTML = emptyState('triangle-alert', 'Xatolik yuz berdi', e?.message || '', `
            <button class="btn btn-outline btn-sm" onclick="go('${DASHBOARD_VIEW[STATE.user.role] || 'courses'}')">
                <i data-lucide="arrow-left"></i> Orqaga
            </button>`);
        safeLucide(area);
        animateIn(area);
    }
    updateNotifBadges();
}

// ─── "Kutilmoqda" eshigi: status pending/rejected ─────────────────────
function isAwaitingApproval() {
    const s = STATE.user?.status;
    return s === 'pending' || s === 'rejected';
}

function pendingGate() {
    const u = STATE.user || {};
    const rejected = u.status === 'rejected';
    return `
    <div class="gate">
        <div class="gate-card">
            <div class="gate-glow"></div>
            <div class="gate-icon">${rejected ? '🚫' : '⏳'}</div>
            <h1 class="t-2xl fw-9 mt-4">${rejected ? 'Ariza rad etildi' : 'Tasdiqlash kutilmoqda'}</h1>
            <p class="c-muted mt-3" style="max-width:32rem;margin-inline:auto">
                ${rejected
                    ? 'Afvuz, admingiz arizangizni rad etdi. Savollaringiz bo‘lsa, kollej administratoriga murojaat qiling.'
                    : 'Ro‘yxatdan o‘tdingiz! Administrator hisobingizni tasdiqlashini kutilmoqda. Tasdiqlangach barcha bo‘limlar ochiladi.'}
            </p>
            <div class="gate-info">
                <div><i data-lucide="user"></i><span>${esc(u.ism || '')}</span></div>
                <div><i data-lucide="mail"></i><span>${esc(u.email || '')}</span></div>
                <div><i data-lucide="shield-check"></i><span>${esc(roleLabel(u.role))}</span></div>
            </div>
            <div class="d-flex gap-2 justify-center mt-6 flex-wrap">
                <button class="btn btn-outline" onclick="window.__refreshStatus()">
                    <i data-lucide="refresh-cw"></i> Holatni tekshirish
                </button>
                <button class="btn btn-primary" onclick="window.logout()">
                    <i data-lucide="log-out"></i> Chiqish
                </button>
            </div>
            <div class="gate-note"><i data-lucide="clock"></i> Tasdiqlash odatda bir necha daqiqa ichida amalga oshadi</div>
        </div>
    </div>`;
}

window.__refreshStatus = async () => {
    const btn = document.querySelector('#dynamic-view-area .btn-outline');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:15px;height:15px"></span> Tekshirilmoqda…'; safeLucide(btn); }
    const u = await loadUserData();
    if (u && !isAwaitingApproval()) {
        showToast('Hisobingiz tasdiqlandi! Xush kelibsiz 🎉', 'success');
        window.location.hash = DASHBOARD_VIEW[u.role] || 'courses';
        renderView(DASHBOARD_VIEW[u.role] || 'courses');
    } else if (u?.status === 'rejected') {
        showToast('Ariza rad etildi', 'error');
        renderView(STATE.view || 'home');
    } else {
        showToast('Hali tasdiqlanmagan', 'info');
        renderView(STATE.view || 'home');
    }
};

/**
 * Некоторые разделы сначала рисуют «каркас», а данные подгружают отдельно —
 * иначе контейнер остаётся пустым. Здесь запускаем их после вставки HTML.
 */const AFTER_RENDER = {
    courses: () => loadCoursesGrid(),
    posts: () => loadPosts(),
    support: () => loadTickets(),
    chat: () => loadChat('group'),
    'staff-chat': () => loadChat('staff'),
    attendance: () => { if (isStaff()) window.__loadAttendance(); },
    grades: () => { if (['ustoz', 'admin', 'tech_admin'].includes(STATE.user?.role)) window.__loadGradePanel(); },
};

function runAfterRender(view) {
    const fn = AFTER_RENDER[view];
    if (fn) {
        try { fn(); }
        catch (e) { console.warn('[after-render]', view, e); }
    }
}

async function handleRoute() {
    const hash = (window.location.hash || '').replace('#', '') || (STATE.user ? DASHBOARD_VIEW[STATE.user.role] : 'home');
    await renderView(hash);
}

function updateNotifBadges() {
    document.querySelectorAll('[data-notif-badge]').forEach(b => {
        const n = STATE.notifCount || 0;
        b.classList.toggle('hidden', n === 0);
        b.textContent = n > 99 ? '99+' : String(n);
    });
}

async function refreshNotifications() {
    if (!STATE.user) return;
    try {
        const list = await getNotifications();
        STATE.notifCount = (list || []).filter(n => !n.seen).length;
        updateNotifBadges();
    } catch (e) { /* silent — badge is non-critical */ }
}
window.refreshNotifications = refreshNotifications;

// ══════════════════════════════════════════════════════════════════════
//  Modals
// ══════════════════════════════════════════════════════════════════════
async function openLessonModal(lessonId) {
    const courses = await getCourses();
    let lesson = null, course = null;
    for (const c of courses) {
        const l = (c.lessons || []).find(x => x.id === Number(lessonId));
        if (l) { lesson = l; course = c; break; }
    }
    if (!lesson) { showToast('Dars topilmadi', 'error'); return; }

    const done = courseCompleted(course).includes(lesson.id);
    const siblings = course.lessons || [];
    const hasVideo = !!lesson.videoUrl;
    const mins = LESSON_NEEDED_SEC / 60;
    TIMER.unlockedFor = done ? lesson.id : null;
    window.__videoUrls = window.__videoUrls || {};
    if (hasVideo) window.__videoUrls[lesson.id] = lesson.videoUrl;

    openModal(modalShell({
        icon: '<i data-lucide="play-circle"></i>',
        title: esc(lesson.title),
        sub: course.title,
        body: `
            <div class="stack">
                ${!done ? `
                <div class="callout blue">
                    <i data-lucide="info"></i>
                    <div>Video <b>${mins} daqiqa</b> davomida darsni ko‘rib turishdan keyin ochiladi.
                    Timer brauzerni yopsangiz ham to‘xtaydi — oynani yopmang.</div>
                </div>` : `
                <div class="callout green">
                    <i data-lucide="check-circle-2"></i>
                    <div>Bu dars siz tomonidan <b>yakunlangan</b>. Video ochiq, qayta ko‘rishingiz mumkin.</div>
                </div>`}

                ${!done ? `
                <div class="timer-box" id="timer-box">
                    <div class="timer-ring-wrap">
                        <svg class="timer-ring" viewBox="0 0 48 48">
                            <circle class="bg" cx="24" cy="24" r="20"></circle>
                            <circle class="fg" id="timer-ring" cx="24" cy="24" r="20"
                                    style="stroke:var(--primary)"></circle>
                        </svg>
                        <div class="timer-text" id="timer-text">00:00</div>
                    </div>
                    <div class="grow">
                        <div class="fw-8" style="font-size:.875rem">Darsni ko‘rish vaqti</div>
                        <div class="timer-msg" id="timer-msg">Video ochilishi uchun <b>${mins} daqiqa</b> qoldi.</div>
                        <div class="lesson-xp-chip" id="lesson-xp"><i data-lucide="zap"></i></div>
                    </div>
                </div>` : ''}

                ${hasVideo ? `
                <div class="video-holder" id="video-holder" ${done ? 'data-ready="1"' : ''}>
                    ${done ? `<iframe src="${esc(lesson.videoUrl)}" allowfullscreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                            title="${esc(lesson.title)}"></iframe>` : ''}
                </div>
                ${done ? '' : `
                <div class="video-lock" id="video-lock">
                    <div class="video-lock-blur"></div>
                    <div class="video-lock-body">
                        <div class="video-lock-icon"><i data-lucide="lock"></i></div>
                        <b>Video yopiq</b>
                        <span>Darsni <span class="video-lock-left">${String(mins).padStart(2, '0')}:00</span> davomida
                              ko‘rib turing — video avtomatik ochiladi</span>
                    </div>
                </div>`}`
                : lesson.content ? `<div class="callout amber"><i data-lucide="file-text"></i><div>Bu darsda video yo‘q, faqat o‘qish materiali bor.</div></div>` : ''}

                ${lesson.topic ? `<div class="badge badge-orange">${esc(lesson.topic)}</div>` : ''}
                ${lesson.content ? `<div class="prose">${esc(lesson.content)}</div>` : ''}

                ${siblings.length > 1 ? `
                <div>
                    <div class="fw-8 mb-2" style="font-size:.875rem">Kurs boshqa darslari</div>
                    <div class="list list-soft">
                        ${siblings.filter(l => l.id !== lesson.id).map(l => `
                            <button class="list-row click w-full text-left" onclick="cModal(); setTimeout(()=>window.__openLesson(${l.id}),80)">
                                <div class="card-icon navy sm" style="width:30px;height:30px"><i data-lucide="file-text"></i></div>
                                <div class="grow">
                                    <div class="list-title">${esc(l.title)}</div>
                                </div>
                                ${courseCompleted(course).includes(l.id) ? '<i data-lucide="check-circle-2" style="width:18px;height:18px;color:var(--green-600)"></i>' : ''}
                            </button>`).join('')}
                    </div>
                </div>` : ''}
            </div>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Yopish</button>
            <button class="btn btn-success" id="timer-btn" onclick="window.__completeLesson(${lesson.id})" ${done ? '' : 'disabled'}>
                <i data-lucide="check"></i> ${done ? 'Qayta ko‘rish' : 'Darsni yakunlash'}
            </button>`,
    }), 'lg');

    if (done) {
        const btn = document.getElementById('timer-btn');
        if (btn) btn.onclick = () => cModal();
    } else {
        try { await startLessonTimer(lesson.id); } catch (e) { showToast(e.message, 'error'); }
    }
}
window.openLessonModal = openLessonModal;
// ══════════════════════════════════════════════════════════════════════
//  Views: do'kon (ballar -> sovg'alar) va tasdiqlash
// ══════════════════════════════════════════════════════════════════════
const SHOP_TONES = ['blue', 'orange', 'violet', 'green', 'amber', 'pink'];

function shopHistoryCard(rows) {
    if (!rows || !rows.length) return '';
    return sectionCard('Xaridlarim', `
        <div class="table-wrap">
            <table class="table responsive">
                <thead><tr><th data-label="Sovga">Sovga</th><th data-label="Narxi">Narxi</th><th data-label="Sana">Sana</th></tr></thead>
                    <tbody>
                        ${rows.map(r => {
                            const d = r.createdAt ? new Date(r.createdAt) : null;
                            const when = (d && !isNaN(d))
                                ? d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: '2-digit' })
                                  + ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                                : '—';
                    return `<tr>
                        <td data-label="Sovga"><span class="cell-main">${esc(r.title || '—')}</span></td>
                        <td data-label="Narxi"><span class="shop-price"><i data-lucide="zap"></i> ${num(r.price)}</span></td>
                        <td data-label="Sana"><span class="cell-sub">${when}</span></td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`, { actions: `<span class="badge badge-blue">${rows.length} ta</span>` });
}

async function v_shop() {
    const items = await getShop();
    const my = num(STATE.user?.points);
    const canEdit = ['admin', 'tech_admin', 'director'].includes(STATE.user?.role);
    const isBuyer = !canEdit;

    // Tarix yuklanishi do‘kon ochilishini kechiktirmasligi kerak.
    let history = [];
    if (isBuyer) {
        try { history = (await getMyPurchases()) || []; }
        catch (e) { history = []; }
    }

    return `
        ${pageHead('Do‘kon', 'Ballarni sovg‘alarga almashtiring', `
            <div class="d-flex gap-2 flex-wrap">
                <span class="badge badge-orange"><i data-lucide="zap"></i> ${my} XP</span>
                ${canEdit ? `<button class="btn btn-primary" onclick="window.__openShopEditor()"><i data-lucide="plus"></i> Tovar qo‘shish</button>` : ''}
            </div>`)}

        ${items.length === 0 ? emptyState('shopping-bag', 'Do‘kon bo‘sh', 'Tovarlarni administrator qo‘shadi.')
            : `<div class="shop-grid">
                ${items.map((it, idx) => {
                    const tone = SHOP_TONES[idx % SHOP_TONES.length];
                    const out = it.stock === 0;
                    const afford = my >= it.price;
                    return `
                    <article class="shop-card tone-${tone}${it.active ? '' : ' off'}">
                        <div class="shop-media">
                            ${it.image
                                ? `<img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy">`
                                : `<span class="shop-emoji">${esc(it.emoji || '🎁')}</span>`}
                            ${out ? '<span class="shop-out">Tugagan</span>' : ''}
                            ${it.owned ? `<span class="shop-owned"><i data-lucide="check"></i> ${it.owned} dona</span>` : ''}
                        </div>
                        <div class="shop-body">
                            <h3 class="shop-title">${esc(it.title)}</h3>
                            <p class="shop-desc clamp-2">${esc(it.description || 'Tavsif kiritilmagan')}</p>
                            <div class="shop-foot">
                                <span class="shop-price"><i data-lucide="zap"></i> ${num(it.price)}</span>
                                ${it.stock ? `<span class="shop-stock">${it.stock} qoldi</span>` : '<span class="shop-stock">chekisiz</span>'}
                            </div>
                            ${isBuyer ? `
                            <button class="btn ${afford && !out ? 'btn-primary' : 'btn-soft'} w-full mt-3"
                                    ${out || !afford || !it.active ? 'disabled' : ''}
                                    onclick="window.__buyShop(${it.id},this)">
                                <i data-lucide="shopping-cart"></i>
                                ${out ? 'Tugagan' : afford ? 'Sotib olish' : `Yana ${num(it.price - my)} XP kerak`}
                            </button>`
                                : `<div class="d-flex gap-2 mt-3">
                                    <button class="btn btn-soft grow" onclick="window.__openShopEditor(${it.id})"><i data-lucide="pencil"></i></button>
                                    <button class="btn-icon sm" onclick="window.__delShop(${it.id})" aria-label="O‘chirish"><i data-lucide="trash-2"></i></button>
                                </div>`}
                        </div>
                    </article>`;
                }).join('')}
            </div>`}

        <div id="shop-history" class="mt-6">${shopHistoryCard(history)}</div>`;
}

window.__buyShop = async (id, btn) => {
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:15px;height:15px"></span> Olib kelinmoqda…'; }
    try {
        const res = await buyItem(id);
        STATE.user.points = res.points;
        localStorage.setItem('lms_user', JSON.stringify(STATE.user));
        updateHeaderUser();
        showToast(res.message, 'success');
        renderView('shop');
    } catch (e) {
        showToast(e.message, 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="shopping-cart"></i> Sotib olish'; }
    }
};

window.__delShop = async (id) => {
    if (!confirm('Tovarni o‘chirishni tasdiqlaysizmi?')) return;
    try { await api_del(`/shop/${id}`); showToast('Tovar o‘chirildi', 'success'); renderView('shop'); }
    catch (e) { showToast(e.message, 'error'); }
};

window.__openShopEditor = async (id) => {
    const items = id ? await getShop() : [];
    const it = items.find(x => x.id === id) || {};
    openModal(modalShell({
        icon: '<i data-lucide="shopping-bag"></i>',
        title: id ? 'Tovarni tahrirlash' : 'Yangi tovar',
        body: `
            <form id="form-shop" class="stack" data-id="${id || ''}" onsubmit="return window.__svShop(event)">
                <div class="field"><label class="label">Nomi</label>
                    <input class="input" name="title" required value="${esc(it.title || '')}" placeholder="O‘quv.uz futbolka"></div>
                <div class="field"><label class="label">Tavsif</label>
                    <textarea class="textarea" name="description" placeholder="Qisqacha izoh">${esc(it.description || '')}</textarea></div>
                <div class="grid grid-2 gap-3">
                    <div class="field"><label class="label">Narxi (XP)</label>
                        <input class="input" name="price" type="number" min="0" required value="${num(it.price ?? 500)}"></div>
                    <div class="field"><label class="label">Qoldi (0 = cheksiz)</label>
                        <input class="input" name="stock" type="number" min="0" value="${num(it.stock ?? 10)}"></div>
                </div>
                <div class="grid grid-2 gap-3">
                    <div class="field"><label class="label">Emoji (rasmsiz)</label>
                        <input class="input" name="emoji" maxlength="4" value="${esc(it.emoji || '')}" placeholder="👕"></div>
                    <div class="field"><label class="label">Rasm havolasi</label>
                        <input class="input" name="image" value="${esc(it.image || '')}" placeholder="https://…"></div>
                </div>
                <label class="check"><input type="checkbox" name="active" ${it.active === false ? '' : 'checked'}>
                    <span>Sotuvda (faqat shu holda ko‘rinadi)</span></label>
            </form>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-shop').requestSubmit()">
                <i data-lucide="save"></i> Saqlash</button>`,
    }));
};

window.__svShop = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
        title: fd.get('title'), description: fd.get('description'),
        price: Number(fd.get('price') || 0), stock: Number(fd.get('stock') || 0),
        emoji: (fd.get('emoji') || '').trim(), image: (fd.get('image') || '').trim(),
        active: fd.get('active') === 'on',
    };
    const id = e.target.dataset.id;
    try {
        if (id) await api_patch(`/shop/${id}`, payload); else await api_post('/shop', payload);
        showToast('Tovar saqlandi', 'success');
        cModal();
        renderView('shop');
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

// Yetkazib berilmagan hisoblar: "tasdiqlash" ekrani
async function v_pending() {
    const list = await getPendingUsers();
    return `
        ${pageHead('Tasdiqlash', `${list.length} ta foydalanuvchi kutilmoqda`, `
            <button class="btn btn-outline" onclick="renderView('pending')"><i data-lucide="refresh-cw"></i> Yangilash</button>`)}

        ${list.length === 0
            ? emptyState('user-check', 'Hammasi tasdiqlangan', 'Yangi ro‘yxatdan o‘tgan foydalanuvchilar shu yerda paydo bo‘ladi.')
            : `<div class="stack-sm">
                ${list.map(u => `
                <div class="card card-pad d-flex items-center gap-3" style="flex-wrap:wrap">
                    <div class="avatar" style="width:44px;height:44px;font-size:1.05rem">${esc((u.ism || '?').charAt(0))}</div>
                    <div class="grow" style="min-width:0">
                        <div class="fw-8">${esc(u.ism)}</div>
                        <div class="c-muted" style="font-size:.8125rem">${esc(u.email)} · ${esc(roleLabel(u.role))}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm" onclick="window.__setStatus(${u.id},'active')">
                            <i data-lucide="check"></i> Tasdiqlash</button>
                        <button class="btn btn-outline btn-sm" onclick="window.__setStatus(${u.id},'rejected')">
                            <i data-lucide="x"></i> Rad etish</button>
                    </div>
                </div>`).join('')}
            </div>`}`;
}

window.__setStatus = async (id, status) => {
    try {
        await setUserStatus(id, status);
        showToast(status === 'active' ? 'Foydalanuvchi tasdiqlandi' : 'Foydalanuvchi rad etildi', 'success');
        renderView('pending');
    } catch (e) { showToast(e.message, 'error'); }
};

window.__openLesson = (id) => { closeSidebar(); openLessonModal(id); };
window.__completeLesson = async (id) => {
    const btn = document.getElementById('timer-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Yuborilmoqda…'; }
    try { await completeLessonServer(id); cModal(); } catch (e) {
        showToast(e.message, 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="check"></i> Darsni yakunlash'; }
    }
};

async function openTicketModal(ticketId) {
    STATE.activeTicketId = ticketId;
    const tickets = await getTickets();
    const t = tickets.find(x => x.id === Number(ticketId));
    if (!t) { showToast('Ticket topilmadi', 'error'); return; }

    const canReply = t.user_id === STATE.user.id || canManage() || STATE.user.role === 'director';

    openModal(modalShell({
        icon: '<i data-lucide="life-buoy"></i>',
        title: `Ticket #${t.id}`,
        body: `
            <div class="stack">
                <div class="list-soft">
                    <div class="d-flex items-center justify-between gap-2 mb-2">
                        <span class="badge ${t.status === 'Yopilgan' ? 'badge-green' : 'badge-amber'}">${esc(t.status)}</span>
                        <span class="t-xs c-soft fw-6">${esc(t.user_name || '')}</span>
                    </div>
                    <div class="prose" style="font-size:.9375rem">${esc(t.message)}</div>
                </div>

                <div>
                    <div class="fw-8 mb-2" style="font-size:.875rem">Javoblar (${(t.replies || []).length})</div>
                    <div class="list" style="border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
                        ${(t.replies || []).length === 0
                            ? `<div class="list-row"><span class="c-soft t-sm">Hali javob yo‘q</span></div>`
                            : t.replies.map(r => `
                            <div class="list-row items-start">
                                ${avatarHtml({ ism: r.user_name }, 'avatar-xs')}
                                <div class="grow">
                                    <div class="d-flex items-center gap-2">
                                        <span class="list-title" style="font-size:.8125rem">${esc(r.user_name)}</span>
                                        ${r.user_id === STATE.user.id ? '<span class="badge badge-blue">siz</span>' : ''}
                                    </div>
                                    <div class="t-sm c-muted" style="white-space:pre-wrap">${esc(r.text)}</div>
                                </div>
                            </div>`).join('')}
                    </div>
                </div>

                ${canReply ? `
                <form class="stack-sm" onsubmit="return window.__svReply(event)">
                    <textarea class="textarea" id="ticket-reply" placeholder="Javobingizni yozing…" required></textarea>
                    <button class="btn btn-primary btn-block"><i data-lucide="send"></i> Javob yuborish</button>
                </form>` : ''}
            </div>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Yopish</button>
            ${canManage() || STATE.user.role === 'director'
                ? `<button class="btn ${t.status === 'Yopilgan' ? 'btn-outline' : 'btn-success'}" onclick="window.__setTicketStatus(${t.id},'${t.status === 'Yopilgan' ? 'Ochiq' : 'Yopilgan'}')">
                       <i data-lucide="${t.status === 'Yopilgan' ? 'rotate-ccw' : 'check-check'}"></i>
                       ${t.status === 'Yopilgan' ? 'Qayta ochish' : 'Yopish'}
                   </button>` : ''}`,
    }));
}
window.openTicketModal = openTicketModal;

window.__svReply = async (e) => {
    e.preventDefault();
    const text = document.getElementById('ticket-reply')?.value.trim();
    if (!text) return false;
    try {
        await api_post(`/tickets/${STATE.activeTicketId}/reply`, { text });
        showToast('Javob yuborildi', 'success');
        openTicketModal(STATE.activeTicketId);
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

window.__setTicketStatus = async (id, status) => {
    try {
        await api_patch(`/tickets/${id}/status`, { status });
        showToast('Ticket holati yangilandi', 'success');
        openTicketModal(id);
        if (STATE.view === 'support') renderView('support');
    } catch (e) { showToast(e.message, 'error'); }
};

function openCourseEditor(course = null) {
    const c = course || {};
    const lessons = c.lessons || [];
    openModal(modalShell({
        size: 'lg',
        icon: '<i data-lucide="book-open"></i>',
        title: course ? 'Kursni tahrirlash' : 'Yangi kurs',
        body: `
            <form id="form-course" class="stack" onsubmit="return window.__svCourse(event, ${course ? course.id : 'null'})">
                <div class="field">
                    <label class="label">Kurs nomi</label>
                    <input class="input" name="title" value="${esc(c.title || '')}" required placeholder="Python asoslari">
                </div>
                <div class="field">
                    <label class="label">Tavsif</label>
                    <textarea class="textarea" name="description" placeholder="Kurs haqida qisqacha…">${esc(c.description || '')}</textarea>
                </div>
                <div class="grid grid-2" style="gap:12px">
                    <div class="field">
                        <label class="label">Kategoriya</label>
                        <input class="input" name="category" value="${esc(c.category || 'Dasturlash')}">
                    </div>
                    <div class="field">
                        <label class="label">Holat</label>
                        <select class="select" name="status">
                            ${['Ochiq', 'Yopiq', 'Arxiv'].map(s =>
                                `<option ${(c.status || 'Ochiq') === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="divider"></div>
                <div class="d-flex items-center justify-between">
                    <div>
                        <div class="fw-8" style="font-size:.9375rem">Darslar</div>
                        <div class="t-xs c-muted">Har bir dars kamida 20 daqiqa</div>
                    </div>
                    <button type="button" class="btn btn-soft btn-sm" onclick="window.__addLessonRow()">
                        <i data-lucide="plus"></i> Dars qo‘shish
                    </button>
                </div>
                <div id="lesson-rows" class="stack-sm"></div>
            </form>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-course').requestSubmit()">
                <i data-lucide="save"></i> Saqlash
            </button>`,
    }), 'lg');

    const box = document.getElementById('lesson-rows');
    const draw = () => {
        box.innerHTML = lessons.length === 0
            ? `<div class="form-hint">Hali dars qo‘shilmagan</div>`
            : lessons.map((l, i) => lessonRowHtml(l, i)).join('');
    };
    window.__lessonDraft = lessons.map(l => ({ ...l }));
    window.__addLessonRow = (l = {}) => {
        window.__lessonDraft.push({
            title: l.title || '', topic: l.topic || '', content: l.content || '', videoUrl: l.videoUrl || '',
        });
        draw();
        safeLucide(box);
    };
    window.__rmLessonRow = (i) => { window.__lessonDraft.splice(i, 1); draw(); safeLucide(box); };
    draw();
    safeLucide(box);
}
window.openCourseEditor = openCourseEditor;

function lessonRowHtml(l, i) {
    return `
        <div class="card card-pad-sm" data-lrow="${i}" style="border-style:dashed">
            <div class="d-flex items-center justify-between mb-2">
                <span class="badge badge-blue">${i + 1}-dars</span>
                <button type="button" class="btn-icon sm" onclick="window.__rmLessonRow(${i})" aria-label="O’chirish">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            <div class="stack-sm">
                <input class="input" placeholder="Dars sarlavhasi" value="${esc(l.title || '')}"
                       oninput="window.__lessonDraft[${i}].title=this.value">
                <input class="input" placeholder="Mavzu (masalan: O‘zgaruvchilar)" value="${esc(l.topic || '')}"
                       oninput="window.__lessonDraft[${i}].topic=this.value">
                <input class="input" placeholder="Video havola (YouTube / Google Drive)" value="${esc(l.videoUrl || '')}"
                       oninput="window.__lessonDraft[${i}].videoUrl=this.value">
                <textarea class="textarea" placeholder="Dars matni…" style="min-height:70px"
                          oninput="window.__lessonDraft[${i}].content=this.value">${esc(l.content || '')}</textarea>
            </div>
        </div>`;
}

window.__svCourse = async (e, id) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
        title: f.get('title'),
        description: f.get('description'),
        category: f.get('category'),
        status: f.get('status'),
        lessons: (window.__lessonDraft || []).filter(l => (l.title || '').trim()),
    };
    try {
        if (id) await api_patch(`/courses/${id}`, payload);
        else await api_post('/courses', payload);
        showToast('Kurs saqlandi', 'success');
        cModal();
        if (STATE.view === 'course-detail' && STATE.activeCourseId === id) renderView('course-detail');
        else renderView('courses');
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

// ─── Question editor ───────────────────────────────────────────────────
function openQuestionEditor(q = null) {
    const opts = ['A', 'B', 'C', 'D'];
    openModal(modalShell({
        icon: '<i data-lucide="list-checks"></i>',
        title: q ? 'Savolni tahrirlash' : 'Yangi savol',
        body: `
            <form id="form-question" class="stack" onsubmit="return window.__svQuestion(event, ${q ? q.id : 'null'})">
                <div class="field">
                    <label class="label">Savol matni</label>
                    <textarea class="textarea" name="questionText" required placeholder="Savolni yozing…">${esc(q?.questionText || '')}</textarea>
                </div>
                ${['A', 'B', 'C', 'D'].map((L, i) => `
                    <div class="input-icon">
                        <i data-lucide="${L === q?.correctAnswer ? 'circle-check' : 'circle'}" style="color:${L === q?.correctAnswer ? 'var(--green-600)' : 'var(--gray-300)'}"></i>
                        <input class="input" name="option${L}" placeholder="${L}-variant" required
                               value="${esc(q?.[`option${L}`] || '')}">
                    </div>`).join('')}
                <div class="grid grid-2" style="gap:12px">
                    <div class="field">
                        <label class="label">To‘g‘ri javob</label>
                        <select class="select" name="correctAnswer">
                            ${opts.map(o => `<option ${(q?.correctAnswer || 'A') === o ? 'selected' : ''}>${o}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label class="label">Turi</label>
                        <select class="select" name="type">
                            <option value="mini_game" ${(q?.type === 'quiz') ? '' : 'selected'}>Mini o‘yin</option>
                            <option value="quiz" ${q?.type === 'quiz' ? 'selected' : ''}>Test</option>
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label class="label">Qiyinlik</label>
                    <select class="select" name="difficulty">
                        ${['easy', 'medium', 'hard'].map(d =>
                            `<option ${(q?.difficulty || 'medium') === d ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                </div>
            </form>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-question').requestSubmit()">
                <i data-lucide="save"></i> Saqlash
            </button>`,
    }));
}
window.openQuestionEditor = openQuestionEditor;

window.__svQuestion = async (e, id) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
        if (id) await api_patch(`/questions/${id}`, f);
        else await api_post('/questions', f);
        showToast('Savol saqlandi', 'success');
        cModal();
        renderView('questions');
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

window.__delQuestion = async (id) => {
    if (!confirm('Savolni o‘chirishni tasdiqlaysizmi?')) return;
    try { await api_del(`/questions/${id}`); showToast('Savol o‘chirildi', 'success'); renderView('questions'); }
    catch (e) { showToast(e.message, 'error'); }
};

// ─── Group editor ──────────────────────────────────────────────────────
window.openGroupEditor = async (group = null) => {
    const [users, courses] = await Promise.all([
        canManage() ? api_get('/users') : Promise.resolve([]),
        getCourses(),
    ]);
    const teachers = users.filter(u => u.role === 'ustoz');
    const students = users.filter(u => u.role === 'student');
    const g = group || {};

    openModal(modalShell({
        icon: '<i data-lucide="users-round"></i>',
        title: group ? 'Guruhni tahrirlash' : 'Yangi guruh',
        body: `
            <form id="form-group" class="stack" onsubmit="return window.__svGroup(event, ${group ? group.id : 'null'})">
                <div class="field">
                    <label class="label">Guruh nomi</label>
                    <input class="input" name="name" required value="${esc(g.name || '')}" placeholder="IT-201">
                </div>
                <div class="field">
                    <label class="label">O‘qituvchi</label>
                    <select class="select" name="ustozId">
                        <option value="">Tanlanmagan</option>
                        ${teachers.map(t => `<option value="${t.id}" ${g.ustozId === t.id ? 'selected' : ''}>${esc(t.ism)}</option>`).join('')}
                    </select>
                </div>
                <div class="field">
                    <label class="label">Talabalar (${(g.studentIds || []).length})</label>
                    <div class="list-soft" style="max-height:260px;overflow-y:auto">
                        ${students.length === 0
                            ? '<div class="form-hint">Talabalar yo‘q</div>'
                            : students.map(s => `
                            <label class="list-row click" style="padding:9px 6px">
                                ${avatarHtml(s, 'avatar-xs')}
                                <div class="grow">
                                    <div class="list-title" style="font-size:.8125rem">${esc(s.ism)}</div>
                                    <div class="list-sub">${esc(s.email)}</div>
                                </div>
                                <input type="checkbox" name="students" value="${s.id}"
                                       ${(g.studentIds || []).includes(s.id) ? 'checked' : ''}
                                       style="width:18px;height:18px;accent-color:var(--primary)">
                            </label>`).join('')}
                    </div>
                </div>
            </form>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-group').requestSubmit()">
                <i data-lucide="save"></i> Saqlash
            </button>`,
    }));
};

window.__svGroup = async (e, id) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
        name: f.get('name'),
        ustozId: f.get('ustozId') ? Number(f.get('ustozId')) : null,
        studentIds: f.getAll('students').map(Number),
    };
    try {
        if (id) await api_patch(`/groups/${id}`, payload);
        else await api_post('/groups', payload);
        showToast('Guruh saqlandi', 'success');
        cModal();
        renderView('groups');
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

window.__delGroup = async (id) => {
    if (!confirm('Guruhni o‘chirishni tasdiqlaysizmi? Talabalar guruhsiz qoladi.')) return;
    try { await api_del(`/groups/${id}`); showToast('Guruh o‘chirildi', 'success'); renderView('groups'); }
    catch (e) { showToast(e.message, 'error'); }
};

// ─── Schedule editor ───────────────────────────────────────────────────
const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const todayDayName = () => DAYS[(new Date().getDay() + 6) % 7] || DAYS[0];

window.openScheduleEditor = async (group) => {
    if (!group) { showToast('Guruhni avval tanlang', 'error'); return; }
    const draft = JSON.parse(JSON.stringify(group.schedule || []))
        .filter(s => s && (s.day || s.time || s.subject));

    const draw = () => {
        const box = document.getElementById('sched-rows');
        if (!box) return;
        box.innerHTML = draft.length === 0
            ? '<div class="sched-empty-box"><i data-lucide="calendar-plus"></i><b>Hafta jadvali bo‘sh</b><span>Pastdagi tugma bilan birinchi darsni qo‘shing</span></div>'
            : draft.map((s, i) => `
            <div class="sched-edit-row">
                <div class="sched-edit-grid">
                    <select class="input" onchange="window.__schedDraft[${i}].day=this.value">
                        <option value="">— kun —</option>
                        ${DAYS.map(d => `<option ${d === s.day ? 'selected' : ''}>${d}</option>`).join('')}
                    </select>
                    <input class="input" placeholder="09:00 — 10:30" value="${esc(s.time || '')}"
                           oninput="window.__schedDraft[${i}].time=this.value">
                </div>
                <input class="input mt-2" placeholder="Fan yoki mashg‘ulot nomi" value="${esc(s.subject || '')}"
                       oninput="window.__schedDraft[${i}].subject=this.value">
                <div class="sched-edit-grid mt-2">
                    <input class="input" placeholder="O‘qituvchi" value="${esc(s.teacher || '')}"
                           oninput="window.__schedDraft[${i}].teacher=this.value">
                    <input class="input" placeholder="Xona / auditoriya" value="${esc(s.room || '')}"
                           oninput="window.__schedDraft[${i}].room=this.value">
                </div>
                <button type="button" class="btn-icon sm sched-del" onclick="window.__rmSched(${i})" aria-label="O‘chirish">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>`).join('');
        safeLucide(box);
    };

    window.__schedDraft = draft;
    window.__rmSched = (i) => { draft.splice(i, 1); draw(); };
    window.__addSched = (day) => {
        draft.push({ day: day || todayDayName(), time: '', subject: '', teacher: '', room: '' });
        draw();
    };
    // Tayyor shablon — dushanba..juma, 4 darsdan
    window.__fillSched = () => {
        const plan = [['08:00 — 09:30', 'Matematika'], ['09:45 — 11:15', 'Informatika'],
                      ['12:30 — 14:00', 'O‘zbek tili'], ['14:15 — 15:45', 'Ingliz tili']];
        DAYS.slice(0, 5).forEach(day => plan.forEach(([time, subject]) =>
            draft.push({ day, time, subject, teacher: '', room: '' })));
        draw();
    };

    openModal(modalShell({
        icon: '<i data-lucide="calendar-days"></i>',
        title: `Jadval — ${esc(group.name)}`,
        size: 'lg',
        body: `
            <div class="stack">
                <div class="sched-edit-head">
                    <div>
                        <div class="fw-8">Haftalik mashg‘ulotlar</div>
                        <div class="form-hint">Kun, vaqt, fan, o‘qituvchi va xonani kiriting</div>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-soft btn-sm" onclick="window.__fillSched()">
                            <i data-lucide="wand-2"></i> Shablon</button>
                        <button class="btn btn-primary btn-sm" onclick="window.__addSched()">
                            <i data-lucide="plus"></i> Dars qo‘shish</button>
                    </div>
                </div>
                <div id="sched-rows" class="stack-sm"></div>
            </div>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="window.__svSchedule(${group.id})">
                <i data-lucide="save"></i> Jadvalni saqlash
            </button>`,
    }));

    draw();
};

window.__svSchedule = async (gid) => {
    try {
        const clean = (window.__schedDraft || [])
            .filter(s => (s.day || s.time || s.subject))
            .map(s => ({
                day: (s.day || '').trim(), time: (s.time || '').trim(),
                subject: (s.subject || '').trim(),
                teacher: (s.teacher || '').trim(), room: (s.room || '').trim(),
            }));
        await api_patch(`/groups/${gid}`, { schedule: clean });
        showToast('Jadval saqlandi', 'success');
        cModal();
        renderView('schedule');
    } catch (e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════════════
//  Dashboards
// ══════════════════════════════════════════════════════════════════════
function greeting() {
    const h = new Date().getHours();
    if (h < 6) return 'Xayrli tong';
    if (h < 12) return 'Xayrli tong';
    if (h < 18) return 'Xayrli kun';
    return 'Xayrli kech';
}

function heroPanel(user, subtitle, extra = '') {
    // `subtitle` — qator: matn yoki qismlar massivi (nuqta bilan ajratiladi).
    // Eski variantda butun qator bir xil oq rangda chiqardi va gradient ustida
    // yozuvdek yo'qotilardi — endi rol och-ko'k, XP esa sariq «chip» bilan ajraladi.
    const parts = (Array.isArray(subtitle) ? subtitle : [subtitle]).filter(Boolean).map(esc);
    const hasXp = user.points !== undefined && user.points !== null;
    const meta = [
        ...parts.map(p => `<span>${p}</span>`),
        hasXp ? `<span class="xp"><i data-lucide="zap"></i>${num(user.points)} XP</span>` : '',
    ].join('<span class="dot"></span>');
    return `
        <div class="hero-panel">
            <div class="hero-kicker"><i data-lucide="sparkles"></i> ${greeting()}</div>
            <h2 class="hero-title">${esc(user.ism)}</h2>
            ${meta ? `<div class="hero-text">${meta}</div>` : ''}
            ${extra}
        </div>`;
}

function userStats(u) {
    const progress = u.progress || {};
    const lessonsDone = Object.values(progress)
        .reduce((acc, c) => acc + ((c?.completed?.length) || 0), 0);
    const avgPercent = Object.values(progress).length
        ? Math.round(Object.values(progress).reduce((a, c) => a + num(c?.percent), 0) / Object.values(progress).length)
        : 0;
    return { lessonsDone, avgPercent, duelWins: num(u.duelWins), points: num(u.points) };
}

async function d_student() {
    const u = STATE.user;
    const [courses, notifs, achs, att] = await Promise.all([
        getCourses(), getNotifications(), getAchievements(), getMyAttendance().catch(() => []),
    ]);
    const s = userStats(u);
    const unlocked = u.achievements || [];
    const totalAch = achs.length;
    const present = (att || []).filter(a => a.status === 'present').length;
    const attTotal = (att || []).length;
    const attPct = attTotal ? Math.round((present / attTotal) * 100) : 0;

    return `
        ${heroPanel(u, [roleLabel(u.role), 'Bugungi kun'], `
            <div class="hero-badges">
                <span class="badge"><i data-lucide="trophy"></i> ${unlocked.length}/${totalAch} yutuq</span>
                <span class="badge hot"><i data-lucide="book-open-check"></i> ${s.lessonsDone} dars</span>
            </div>`)}

        <div class="grid grid-4 mt-6">
            ${statTile({ label: 'Ballarim', value: u.points, icon: 'zap', tone: 'accent', href: '#leaderboard' })}
            ${statTile({ label: 'Yakunlangan dars', value: s.lessonsDone, icon: 'book-open-check', href: '#courses' })}
            ${statTile({ label: 'O‘yin ballari', value: s.duelWins, icon: 'gamepad-2', tone: 'violet', href: '#game' })}
            ${statTile({ label: 'Davomat', value: `${attPct}%`, icon: 'user-check', tone: attPct >= 70 ? 'green' : 'amber', foot: `${present}/${attTotal} kun` })}
        </div>

        <div class="split split-2 mt-6">
            <div class="stack">
                ${sectionCard('Kurslarim', `
                    <div class="stack-sm">
                        ${courses.length === 0
                            ? emptyState('book-open', 'Kurslar yo‘q', 'Hozircha mavjud kurs kiritilmagan.')
                            : courses.slice(0, 5).map(c => {
                                const pct = courseProgress(c);
                                return `
                            <button class="card card-pad-sm card-hover" style="text-align:left;width:100%" onclick="window.__openCourse(${c.id})">
                                <div class="d-flex items-center gap-3 mb-3">
                                    <div class="card-icon">${pct >= 100 ? '<i data-lucide="badge-check"></i>' : '<i data-lucide="book-open"></i>'}</div>
                                    <div class="grow" style="min-width:0">
                                        <div class="list-title truncate">${esc(c.title)}</div>
                                        <div class="list-sub">${esc(c.category || '')} · ${(c.lessons || []).length} dars</div>
                                    </div>
                                    <span class="badge ${pct >= 100 ? 'badge-green' : 'badge-blue'}">${pct}%</span>
                                </div>
                                ${progressBar(pct, pct >= 100 ? 'green' : '')}
                            </button>`;
                            }).join('')}
                    </div>
                    ${courses.length > 5 ? `<button class="btn btn-soft btn-block mt-4" onclick="go('courses')">Barcha kurslar <i data-lucide="arrow-right"></i></button>` : ''}
                `, { icon: '<i data-lucide="library-big"></i>', sub: 'Davom etayotgan darslaringiz' })}

                ${sectionCard('Yutuqlarim', `
                    ${unlocked.length === 0
                        ? emptyState('lock', 'Hali yutuq yo‘q', 'Darslarni tugatib, ball to‘plab boring.')
                        : `<div class="grid grid-2" style="gap:12px">
                            ${unlocked.slice(0, 6).map(id => {
                                const a = achs.find(x => x.id === id);
                                if (!a) return '';
                                return `
                                <div class="card card-pad-sm rarity-${esc(a.rarity || 'common')}">
                                    <div class="d-flex items-center gap-3">
                                        <div style="font-size:1.75rem">${esc(a.icon || '🏆')}</div>
                                        <div style="min-width:0">
                                            <div class="list-title truncate">${esc(a.title)}</div>
                                            <div class="list-sub clamp-2">${esc(a.desc || '')}</div>
                                        </div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>`}
                `, { icon: '<i data-lucide="award"></i>', sub: `${unlocked.length} / ${totalAch} ochilgan` })}
            </div>

            <div class="stack">
                <div data-bonus>
                    ${sectionCard('Kunlik bonus', canClaimBonus()
                        ? `<div class="stack-sm">
                            <p class="t-sm c-muted">Har 20 daqiqada +20 XP oling. Bugungi bonusni olishingiz mumkin.</p>
                            <button class="btn btn-accent btn-block" onclick="claimDailyBonus(this)">
                                <i data-lucide="gift"></i> +20 XP olish
                            </button>
                        </div>`
                        : `<div class="d-flex items-center gap-3">
                            <div class="card-icon green"><i data-lucide="check"></i></div>
                            <div>
                                <div class="fw-8 t-base">Bugungi bonus olingan</div>
                                <div class="t-xs c-muted">Keyingi bonus birozdan keyin</div>
                            </div>
                        </div>`, { icon: '<i data-lucide="gift"></i>' })}
                </div>

                ${sectionCard('Tezkor o‘tish', `
                    <div class="stack-sm">
                        <button class="tile click" onclick="go('courses')" style="padding:14px">
                            <div class="d-flex items-center gap-3">
                                <div class="tile-icon"><i data-lucide="book-open"></i></div>
                                <div class="grow">
                                    <div class="tile-title">Darslarni davom ettirish</div>
                                    <div class="tile-sub">O‘zbek o‘laroq progressingiz ${s.avgPercent}%</div>
                                </div>
                            </div>
                        </button>
                        <button class="tile click" onclick="go('shop')" style="padding:14px">
                            <div class="d-flex items-center gap-3">
                                <div class="tile-icon accent"><i data-lucide="shopping-bag"></i></div>
                                <div class="grow">
                                    <div class="tile-title">Do‘kon</div>
                                    <div class="tile-sub">${num(u.points)} XP — sovg‘a olsh</div>
                                </div>
                            </div>
                        </button>
                        <button class="tile click" onclick="go('game')" style="padding:14px">
                            <div class="d-flex items-center gap-3">
                                <div class="tile-icon green"><i data-lucide="gamepad-2"></i></div>
                                <div class="grow">
                                    <div class="tile-title">Mini o‘yin</div>
                                    <div class="tile-sub">Tezkor savollar, +30 XP</div>
                                </div>
                            </div>
                        </button>
                    </div>`, { icon: '<i data-lucide="zap"></i>' })}

                ${sectionCard('So‘nggi bildirishnomalar', notifs.length === 0
                    ? emptyState('bell-off', 'Bildirishnoma yo‘q')
                    : `<div class="list list-flush">
                        ${notifs.slice(0, 5).map(n => `
                            <div class="list-row items-start">
                                <div class="card-icon ${n.type === 'warning' ? 'red' : n.type === 'success' ? 'green' : ''}" style="width:32px;height:32px">
                                    <i data-lucide="${n.type === 'warning' ? 'triangle-alert' : n.type === 'success' ? 'check' : 'info'}"></i>
                                </div>
                                <div class="grow">
                                    <div class="t-sm fw-6">${esc(n.msg)}</div>
                                    <div class="t-xs c-soft mt-1">${esc(n.date || '')}</div>
                                </div>
                                ${!n.seen ? '<span class="badge badge-blue">yangi</span>' : ''}
                            </div>`).join('')}
                    </div>`, { icon: '<i data-lucide="bell"></i>' })}
            </div>
        </div>`;
}

async function d_ustoz() {
    const u = STATE.user;
    const [groups, courses, att, grades] = await Promise.all([
        getGroups(), getCourses(), getAttendance().catch(() => []), getGrades(),
    ]);
    const myGroups = groups.filter(g => g.ustozId === u.id || u.role !== 'ustoz');
    const students = myGroups.flatMap(g => g.studentIds || []);
    const today = new Date().toISOString().slice(0, 10);
    const todayRec = att.find(r => r.date === today);
    const markedToday = todayRec ? Object.keys(todayRec.records || {}).length : 0;
    const myLessons = courses.reduce((a, c) => a + (c.lessons || []).length, 0);

    return `
        ${heroPanel(u, [roleLabel(u.role), `${myGroups.length} guruh`, `${students.length} talaba`], `
            <div class="d-flex gap-2 mt-5 flex-wrap">
                <button class="btn btn-white btn-sm" onclick="go('attendance')"><i data-lucide="user-check"></i> Davomat</button>
                <button class="btn btn-white btn-sm" onclick="go('grades')"><i data-lucide="graduation-cap"></i> Baho qo‘yish</button>
                <button class="btn btn-white btn-sm" onclick="openCourseEditor()"><i data-lucide="plus"></i> Yangi kurs</button>
            </div>`)}

        <div class="grid grid-4 mt-6">
            ${statTile({ label: 'Guruhlarim', value: myGroups.length, icon: 'users-round', href: '#groups' })}
            ${statTile({ label: 'Talabalar', value: students.length, icon: 'users', tone: 'accent', href: '#grades' })}
            ${statTile({ label: 'Kurslarim', value: courses.length, icon: 'book-open', sub: `${myLessons} dars`, href: '#courses' })}
            ${statTile({
                label: 'Bugungi davomat', value: `${markedToday}/${students.length}`, icon: 'user-check',
                tone: markedToday >= students.length && students.length ? 'green' : 'amber', href: '#attendance',
            })}
        </div>

        <div class="split split-2 mt-6">
            <div class="stack">
                ${sectionCard('Guruhlarim', myGroups.length === 0
                    ? emptyState('users-round', 'Guruh biriktirilmagan', 'Administrator sizga guruh biriktirishi kerak.')
                    : `<div class="stack-sm">
                        ${myGroups.map(g => `
                            <button class="card card-pad-sm card-hover" style="text-align:left;width:100%" onclick="go('groups')">
                                <div class="d-flex items-center gap-3">
                                    <div class="card-icon"><i data-lucide="users"></i></div>
                                    <div class="grow">
                                        <div class="list-title">${esc(g.name)}</div>
                                        <div class="list-sub">${(g.studentIds || []).length} talaba · ${(g.schedule || []).length} mashg‘ulot</div>
                                    </div>
                                    <i data-lucide="chevron-right" style="color:var(--gray-300)"></i>
                                </div>
                            </button>`).join('')}
                    </div>`, { icon: '<i data-lucide="users-round"></i>' })}

                ${sectionCard('Oxirgi baholar', grades.length === 0
                    ? emptyState('graduation-cap', 'Hali baho qo‘ymagan', 'Baho qo‘yish uchun “Baholar” bo‘limiga o‘ting.')
                    : `<div class="table-wrap"><table class="table responsive">
                        <thead><tr><th>Talaba</th><th data-label="Baho">Baho</th><th data-label="Sana">Sana</th></tr></thead>
                        <tbody>${grades.slice(0, 8).map(g => `
                            <tr>
                                <td data-label="Talaba"><span class="cell-main">Talaba #${g.studentId}</span></td>
                                <td data-label="Baho">${gradePill(g.value)}</td>
                                <td data-label="Sana"><span class="cell-sub">${esc(g.date || '')}</span></td>
                            </tr>`).join('')}</tbody>
                    </table></div>`, { icon: '<i data-lucide="graduation-cap"></i>' })}
            </div>

            <div class="stack">
                ${sectionCard('Kengaytmalar', `
                    <div class="stack-sm">
                        <button class="tile click" onclick="go('questions')" style="padding:14px">
                            <div class="d-flex items-center gap-3">
                                <div class="tile-icon violet"><i data-lucide="list-checks"></i></div>
                                <div class="grow"><div class="tile-title">Savol banki</div>
                                    <div class="tile-sub">O‘yin va test uchun savollar</div></div>
                            </div>
                        </button>
                        <button class="tile click" onclick="openScheduleEditor(window.__myGroup)" style="padding:14px">
                            <div class="d-flex items-center gap-3">
                                <div class="tile-icon green"><i data-lucide="calendar-days"></i></div>
                                <div class="grow"><div class="tile-title">Jadvalni tahrirlash</div>
                                    <div class="tile-sub">Haftalik mashg‘ulotlar</div></div>
                            </div>
                        </button>
                        <button class="tile click" onclick="go('staff-chat')" style="padding:14px">
                            <div class="d-flex items-center gap-3">
                                <div class="tile-icon accent"><i data-lucide="messages-square"></i></div>
                                <div class="grow"><div class="tile-title">Xodimlar chat</div>
                                    <div class="tile-sub">Jamoa bilan muhokama</div></div>
                            </div>
                        </button>
                    </div>`, { icon: '<i data-lucide="blocks"></i>' })}
            </div>
        </div>`;
}

async function d_admin() {
    const [users, groups, courses, posts, tickets] = await Promise.all([
        getUsers(), getGroups(), getCourses(), getPosts(), getTickets(),
    ]);
    const students = users.filter(u => u.role === 'student');
    const staff = users.filter(u => ['ustoz', 'admin', 'tech_admin', 'director'].includes(u.role));
    const pending = posts.filter(p => !p.approved);
    const openTickets = tickets.filter(t => t.status !== 'Yopilgan');

    return `
        ${heroPanel(STATE.user, [roleLabel(STATE.user.role), 'platforma boshqaruvi'], `
            <div class="d-flex gap-2 mt-5 flex-wrap">
                <button class="btn btn-white btn-sm" onclick="window.__openUserEditor()"><i data-lucide="user-plus"></i> Foydalanuvchi</button>
                <button class="btn btn-white btn-sm" onclick="openGroupEditor()"><i data-lucide="users-round"></i> Guruh</button>
                <button class="btn btn-white btn-sm" onclick="go('settings')"><i data-lucide="settings"></i> Sozlamalar</button>
            </div>`)}

        <div class="grid grid-4 mt-6">
            ${statTile({ label: 'Talabalar', value: students.length, icon: 'users', href: '#users' })}
            ${statTile({ label: 'Xodimlar', value: staff.length, icon: 'user-cog', tone: 'accent', href: '#users' })}
            ${statTile({ label: 'Guruhlar', value: groups.length, icon: 'users-round', tone: 'green', href: '#groups' })}
            ${statTile({ label: 'Kurslar', value: courses.length, icon: 'book-open', tone: 'violet', href: '#courses' })}
        </div>

        <div class="split split-2 mt-6">
            <div class="stack">
                ${pending.length > 0 ? sectionCard('Tasdiqlash kutilmoqda', `
                    <div class="stack-sm">
                        ${pending.slice(0, 5).map(p => `
                            <div class="card card-pad-sm">
                                <div class="d-flex items-start gap-3">
                                    ${avatarHtml({ ism: p.author }, 'avatar-sm')}
                                    <div class="grow" style="min-width:0">
                                        <div class="list-title">${esc(p.title || '(sarlavsiz)')}</div>
                                        <div class="list-sub clamp-2">${esc(p.content || '')}</div>
                                        <div class="t-xs c-soft mt-1">${esc(p.author || '')} · ${esc(p.date || '')}</div>
                                    </div>
                                </div>
                                <div class="d-flex gap-2 mt-3">
                                    <button class="btn btn-success btn-sm grow" onclick="window.__apprPost(${p.id},true)">
                                        <i data-lucide="check"></i> Tasdiqlash
                                    </button>
                                    <button class="btn btn-danger btn-sm grow" onclick="window.__apprPost(${p.id},false)">
                                        <i data-lucide="x"></i> Rad etish
                                    </button>
                                </div>
                            </div>`).join('')}
                    </div>`, { icon: '<i data-lucide="shield-check"></i>', sub: `${pending.length} post`, actions: '<button class="btn btn-ghost btn-sm" onclick="go(\'posts\')">Barchasi <i data-lucide="arrow-right"></i></button>' }) : ''}

                ${sectionCard('So‘nggi postlar', posts.length === 0
                    ? emptyState('newspaper', 'Postlar yo‘q')
                    : `<div class="list list-flush">
                        ${posts.slice(0, 6).map(p => `
                            <div class="list-row">
                                ${avatarHtml({ ism: p.author }, 'avatar-sm')}
                                <div class="grow" style="min-width:0">
                                    <div class="list-title truncate">${esc(p.title || '(sarlavsiz)')}</div>
                                    <div class="list-sub">${esc(p.author || '')} · ${esc(p.date || '')}</div>
                                </div>
                                <span class="badge ${p.approved ? 'badge-green' : 'badge-amber'}">${p.approved ? 'tasdiqlangan' : 'kutilmoqda'}</span>
                            </div>`).join('')}
                    </div>`, { icon: '<i data-lucide="newspaper"></i>' })}
            </div>

            <div class="stack">
                ${sectionCard('Tezkor ko‘rsatkichlar', `
                    <div class="stack-sm">
                        <button class="list-row click w-full text-left" onclick="go('users')">
                            <div class="card-icon navy" style="width:32px;height:32px"><i data-lucide="users"></i></div>
                            <div class="grow"><div class="list-title">Foydalanuvchilar</div></div>
                            <span class="badge">${users.length}</span>
                        </button>
                        <button class="list-row click w-full text-left" onclick="go('attendance')">
                            <div class="card-icon green" style="width:32px;height:32px"><i data-lucide="user-check"></i></div>
                            <div class="grow"><div class="list-title">Davomat</div></div>
                            <i data-lucide="chevron-right" style="color:var(--gray-300)"></i>
                        </button>
                        <button class="list-row click w-full text-left" onclick="go('reports')">
                            <div class="card-icon" style="width:32px;height:32px"><i data-lucide="bar-chart-3"></i></div>
                            <div class="grow"><div class="list-title">Hisobotlar</div></div>
                            <i data-lucide="chevron-right" style="color:var(--gray-300)"></i>
                        </button>
                        <button class="list-row click w-full text-left" onclick="go('support')">
                            <div class="card-icon ${openTickets.length ? 'red' : ''}" style="width:32px;height:32px"><i data-lucide="life-buoy"></i></div>
                            <div class="grow"><div class="list-title">Ochilgan ticketlar</div></div>
                            <span class="badge ${openTickets.length ? 'badge-red' : ''}">${openTickets.length}</span>
                        </button>
                    </div>`, { icon: '<i data-lucide="keyboard"></i>' })}
            </div>
        </div>`;
}

async function d_director() {
    const [users, groups, grades, att] = await Promise.all([
        getUsers(), getGroups(), getGrades(), getAttendance().catch(() => []),
    ]);
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'ustoz');
    const avgGrade = grades.length
        ? (grades.reduce((a, g) => a + num(g.value), 0) / grades.length).toFixed(2) : '—';
    const totalXp = students.reduce((a, u) => a + num(u.points), 0);

    return `
        ${heroPanel(STATE.user, ['Direktor paneli', `${groups.length} guruh`, `${students.length} talaba`], `
            <div class="d-flex gap-2 mt-5 flex-wrap">
                <button class="btn btn-white btn-sm" onclick="go('reports')"><i data-lucide="bar-chart-3"></i> Hisobotlar</button>
                <button class="btn btn-white btn-sm" onclick="go('analytics')"><i data-lucide="trending-up"></i> Analitika</button>
            </div>`)}

        <div class="grid grid-4 mt-6">
            ${statTile({ label: 'Talabalar', value: students.length, icon: 'users', href: '#users' })}
            ${statTile({ label: 'O‘qituvchilar', value: teachers.length, icon: 'user-cog', tone: 'accent', href: '#users' })}
            ${statTile({ label: 'O‘rtacha baho', value: avgGrade, icon: 'graduation-cap', tone: 'green' })}
            ${statTile({ label: 'Jami XP', value: totalXp, icon: 'zap', tone: 'amber' })}
        </div>

        <div class="split split-2 mt-6">
            ${sectionCard('Guruhlar kesimi', groups.length === 0
                ? emptyState('users-round', 'Guruhlar yo‘q')
                : `<div class="table-wrap"><table class="table responsive">
                    <thead><tr><th>Guruh</th><th data-label="Talaba">Talaba</th><th data-label="Mashg‘ulot">Mashg‘ulot</th></tr></thead>
                    <tbody>${groups.map(g => `
                        <tr>
                            <td data-label="Guruh"><span class="cell-main">${esc(g.name)}</span></td>
                            <td data-label="Talaba"><span class="badge badge-blue">${(g.studentIds || []).length}</span></td>
                            <td data-label="Mashg‘ulot"><span class="cell-sub">${(g.schedule || []).length} ta</span></td>
                        </tr>`).join('')}</tbody>
                </table></div>`, { icon: '<i data-lucide="users-round"></i>' })}

            ${sectionCard('Davomat statistikasi', att.length === 0
                ? emptyState('user-check', 'Davomat yozuvlari yo‘q')
                : (() => {
                    let p = 0, a = 0;
                    att.forEach(r => Object.values(r.records || {}).forEach(v => v === 'present' ? p++ : a++));
                    const total = p + a;
                    const pct = total ? Math.round((p / total) * 100) : 0;
                    return `
                    <div class="stack">
                        <div class="d-flex items-end justify-between">
                            <div>
                                <div class="stat-value c-green">${pct}%</div>
                                <div class="stat-label">Davomat darajasi</div>
                            </div>
                            <div class="text-right">
                                <div class="fw-8 t-lg c-green">${p}</div>
                                <div class="t-xs c-soft">kelgan</div>
                            </div>
                        </div>
                        ${progressBar(pct, pct >= 70 ? 'green' : 'red')}
                        <div class="d-flex items-center justify-between mt-2">
                            <span class="t-sm c-muted">Kelmagan</span>
                            <span class="fw-8 t-sm c-red">${a}</span>
                        </div>
                    </div>`;
                })(), { icon: '<i data-lucide="user-check"></i>' })}
        </div>`;
}

// ── Ota-ona uchun qulaylik: davomat holatlari va ularning belgilari ──
const ATT_STATUS = {
    present:            { label: 'Kelgan',      badge: 'badge-green' },
    late:               { label: 'Kechikdi',    badge: 'badge-amber' },
    absent:             { label: 'Kelmadi',     badge: 'badge-red' },
    absent_unexcused:   { label: 'Sababsiz',    badge: 'badge-red' },
    excused:            { label: 'Sababli',     badge: 'badge-blue' },
};
const attMeta = (st) => ATT_STATUS[st] || { label: st || '—', badge: '' };

/** Davomat oxirgi N kuni topadi — ota-ona uchun "bugungi holat". */
function attStreak(records) {
    let n = 0;
    for (const r of records) {                 // records — eng yangidan eskiya
        if (r.status === 'present' || r.status === 'late') n++;
        else break;
    }
    return n;
}

async function d_parent() {
    // Bitta so'rovda bolaning barcha natijalari — 3 ta alohida so'rov
    // o'rniga bittasi (tezroq, va kelganda yangi bo'limlar ham qo'shiladi).
    const rep = await getParentReport().catch((e) => {
        if (e?.status === 404) return null;
        throw e;
    });

    if (!rep) {
        return pageHead('Boshqaruv paneli', 'Bolangizga ulangan ma’lumot topilmadi')
            + emptyState('user-round-x', 'Bola bog‘lanmagan', 'Administrator bilan bog‘lanishni so‘rang.');
    }

    const child = await getParentChild().catch(() => null);
    const gs = rep.gradeStats || {};
    const att = rep.attendance || { records: [], byMonth: [] };
    const records = att.records || [];
    const attPct = att.percent || 0;
    const s = child ? userStats(child) : { lessonsDone: 0 };
    const streak = attStreak(records);
    const avg = gs.avg || 0;

    return `
        ${heroPanel(child || { ism: STATE.user.ism }, [child?.groupName || 'Guruh birilmagan', 'Bola paneli'], `
            <div class="hero-badges">
                <span class="badge hot"><i data-lucide="book-open-check"></i> ${s.lessonsDone} dars</span>
                ${avg ? `<span class="badge"><i data-lucide="graduation-cap"></i> o‘rtacha ${avg}</span>` : ''}
            </div>`)}

        <div class="grid grid-4 mt-6">
            ${statTile({ label: 'Ballar', value: child?.points || 0, icon: 'zap', tone: 'accent' })}
            ${statTile({ label: 'Darslar', value: s.lessonsDone, icon: 'book-open-check', foot: `${rep.courses.length} ta kurs` })}
            ${statTile({
                label: 'Davomat', value: `${attPct}%`, icon: 'user-check',
                tone: attPct >= 80 ? 'green' : attPct >= 60 ? 'amber' : 'red',
                foot: `${att.present}/${att.total} kun`,
            })}
            ${statTile({
                label: 'O‘rtacha baho', value: avg || '—', icon: 'graduation-cap',
                tone: avg >= 4.5 ? 'green' : avg >= 3.5 ? 'amber' : 'red',
                foot: `${gs.total || 0} ta baho`,
            })}
        </div>

        <div class="mt-6 stack">
            ${parentGradesCard(rep)}
            ${parentAttendanceCard(att, records)}
            ${parentCoursesCard(rep.courses || [])}
        </div>`;
}

/** Bolaning BARCHA baholari + taqsimoti. */
function parentGradesCard(rep) {
    const grades = rep.grades || [];
    const gs = rep.gradeStats || {};
    const dist = [
        { k: 5, n: gs.g5 || 0, c: 'badge-green' },
        { k: 4, n: gs.g4 || 0, c: 'badge-blue' },
        { k: 3, n: gs.g3 || 0, c: 'badge-amber' },
        { k: 2, n: gs.g2 || 0, c: 'badge-red' },
    ];

    const body = grades.length === 0
        ? emptyState('graduation-cap', 'Hali baho qo‘yilmagan', 'O‘qituvchi baho qo‘yganida shu yerda ko‘rinadi.')
        : `
        <div class="grid grid-4 mb-5">
            ${dist.map(d => `
                <div class="stat" style="text-align:center;padding:14px">
                    <div class="stat-value">${d.n}</div>
                    <div class="mt-2"><span class="badge ${d.c}">${d.k} baho</span></div>
                </div>`).join('')}
        </div>

        <div class="table-wrap">
            <table class="table responsive">
                <thead><tr>
                    <th data-label="Sana">Sana</th>
                    <th data-label="Kurs">Kurs</th>
                    <th data-label="O‘qituvchi">O‘qituvchi</th>
                    <th data-label="Baho" class="text-center">Baho</th>
                    <th data-label="Izoh">Izoh</th>
                </tr></thead>
                <tbody>
                    ${grades.map(g => `
                        <tr>
                            <td data-label="Sana"><span class="t-xs">${esc(g.date || '—')}</span></td>
                            <td data-label="Kurs"><span class="fw-7">${esc(g.courseTitle || '—')}</span></td>
                            <td data-label="O‘qituvchi"><span class="t-xs">${esc(g.teacher || '—')}</span></td>
                            <td data-label="Baho" class="text-center">${gradePill(g.value)}</td>
                            <td data-label="Izoh"><span class="t-xs">${esc(g.comment || '—')}</span></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;

    return sectionCard('Baholar', body, {
        icon: '<i data-lucide="graduation-cap"></i>',
        sub: gs.total ? `${gs.total} ta baho · o‘rtacha ${gs.avg} · eng yuqori ${gs.best}` : 'Hali baho yo‘q',
    });
}

/** To‘liq davomat: jamlama, oylar kesimi, saralangan tarix. */
function parentAttendanceCard(att, records) {
    const months = att.byMonth || [];
    const tone = att.percent >= 80 ? 'green' : att.percent >= 60 ? 'amber' : 'red';

    const summary = `
        <div class="grid grid-4 mb-5">
            ${[
                { label: 'Kelgan', n: att.present, i: 'user-check', c: 'green' },
                { label: 'Kechikdi', n: att.late || 0, i: 'clock', c: 'amber' },
                { label: 'Kelmadi', n: (att.absent || 0) + (att.excused || 0), i: 'user-x', c: 'red' },
                { label: 'Umumiy', n: att.total, i: 'calendar-days', c: '' },
            ].map(x => statTile({ label: x.label, value: x.n, icon: x.i, tone: x.c })).join('')}
        </div>`;

    const byMonth = months.length ? `
        <div class="card card-pad mb-5" style="box-shadow:none;background:var(--surface-2)">
            <div class="card-title mb-4"><i data-lucide="calendar-range"></i> Oylar bo‘yicha</div>
            <div class="stack-sm">
                ${months.map(m => `
                    <div>
                        <div class="d-flex items-center justify-between gap-3 mb-2">
                            <span class="t-xs fw-7">${esc(m.month)}</span>
                            <span class="t-xs">${m.present}/${m.total} kun · ${m.percent}%</span>
                        </div>
                        ${progressBar(m.percent, m.percent >= 80 ? 'green' : m.percent >= 60 ? 'amber' : 'red')}
                    </div>`).join('')}
            </div>
        </div>` : '';

    const history = records.length ? `
        <div class="d-flex items-center gap-2 flex-wrap mb-4" id="p-att-filters">
            ${[['all', 'Barchasi'], ['present', 'Kelgan'], ['late', 'Kechikdi'],
               ['absent', 'Kelmadi'], ['excused', 'Sababli']].map(([k, l], i) =>
                `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-outline'} btn-sm" data-st="${k}"
                         onclick="window.__parentAttFilter('${k}',this)">${l}</button>`).join('')}
        </div>
        <div class="list list-flush" id="p-att-list">
            ${records.map(r => {
                const m = attMeta(r.status);
                return `
                <div class="list-row" data-st="${esc(r.status || '')}">
                    <div style="min-width:0">
                        <div class="fw-7 t-sm">${esc(r.date || '—')}</div>
                    </div>
                    <span class="badge ${m.badge}">${m.label}</span>
                </div>`;
            }).join('')}
        </div>` : emptyState('calendar-x', 'Davomat yozuvlari yo‘q', 'Darslar boshlanganda yozuvlar shu yerda paydo bo‘ladi.');

    return sectionCard('Davomat', summary + byMonth + history, {
        icon: '<i data-lucide="calendar-check"></i>',
        sub: att.total ? `${att.percent}% · ${att.present}/${att.total} kun` : 'Hali yozuv yo‘q',
    });
}

/** Kurslar bo‘yicha natija. */
function parentCoursesCard(courses) {
    const body = courses.length === 0
        ? emptyState('book-open', 'Kurslar boshlanmagan', 'Bola kursga yozilgach natijalar shu yerda ko‘rinadi.')
        : `<div class="stack-sm">
            ${courses.map(c => `
                <div class="card card-pad" style="box-shadow:none;border:1px solid var(--border)">
                    <div class="d-flex items-center justify-between gap-3 mb-3">
                        <div class="fw-7 t-sm truncate" style="min-width:0">${esc(c.title)}</div>
                        <span class="badge ${c.percent >= 100 ? 'badge-green' : c.percent > 0 ? 'badge-blue' : ''}">${c.percent}%</span>
                    </div>
                    ${progressBar(c.percent, c.percent >= 80 ? 'green' : c.percent > 0 ? '' : 'amber')}
                    <div class="t-xs mt-2">${c.completed}/${c.totalLessons} dars yakunlangan</div>
                </div>`).join('')}
        </div>`;

    return sectionCard('Kurslar', body, {
        icon: '<i data-lucide="book-open"></i>',
        sub: `${courses.length} ta kurs`,
    });
}

window.__parentAttFilter = (st, btn) => {
    document.querySelectorAll('#p-att-filters .btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
    });
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-outline');
    document.querySelectorAll('#p-att-list > .list-row').forEach(row => {
        row.classList.toggle('hidden', !(st === 'all' || row.dataset.st === st));
    });
};

// ══════════════════════════════════════════════════════════════════════
//  Views: courses
// ══════════════════════════════════════════════════════════════════════
async function v_courses() {
    const courses = await getCourses();
    const canEdit = isStaff();
    const u = STATE.user;

    return `
        ${pageHead('Kurslar', `${courses.length} ta mavjud kurs`, canEdit
            ? `<button class="btn btn-primary" onclick="openCourseEditor()"><i data-lucide="plus"></i> Yangi kurs</button>`
            : '')}
        <div class="d-flex items-center gap-3 mb-5 flex-wrap">
            <div class="input-icon grow" style="max-width:340px">
                <i data-lucide="search"></i>
                <input class="input" id="course-search" placeholder="Kurs nomini qidirish…" oninput="window.__filterCourses()">
            </div>
            <div class="d-flex gap-2 flex-wrap" id="course-filters">
                ${['Barchasi', 'Ochiq', 'Yopiq'].map((f, i) =>
                    `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-outline'} btn-sm" data-filter="${f}" onclick="window.__setCourseFilter('${f}',this)">${f}</button>`).join('')}
            </div>
        </div>
        <div id="courses-grid" class="grid grid-auto"></div>`;
}

window.__filterCourses = () => {
    const q = (document.getElementById('course-search')?.value || '').toLowerCase();
    const active = document.querySelector('#course-filters .btn-primary')?.dataset.filter || 'Barchasi';
    document.querySelectorAll('#courses-grid > *').forEach(el => {
        const okQ = !q || (el.dataset.title || '').includes(q);
        const okF = active === 'Barchasi' || el.dataset.status === active;
        el.classList.toggle('hidden', !(okQ && okF));
    });
};

window.__setCourseFilter = (f, btn) => {
    document.querySelectorAll('#course-filters .btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
    });
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-outline');
    window.__filterCourses();
};

window.__openCourse = (id) => { STATE.activeCourseId = id; window.location.hash = 'course-detail'; };

window.__delCourse = async (id) => {
    if (!confirm('Kursni va barcha darslarini o‘chirishni tasdiqlaysizmi?')) return;
    try { await api_del(`/courses/${id}`); showToast('Kurs o‘chirildi', 'success'); STATE.activeCourseId = null; renderView('courses'); }
    catch (e) { showToast(e.message, 'error'); }
};

function loadCoursesGrid() {
    mount('courses-grid', async () => {
        const courses = await getCourses();
        if (courses.length === 0) {
            return emptyState('book-open', 'Kurslar yo‘q', isStaff()
                ? 'Birinchi kursni yaratish uchun yuqoridagi tugmani bosing.'
                : 'Hozircha mavjud kurs kiritilmagan.');
        }
        return courses.map(c => {
            const pct = courseProgress(c);
            const done = courseCompleted(c).length;
            const canEdit = isStaff();
            return `
            <article class="card card-pad card-hover" data-title="${esc(c.title.toLowerCase())}" data-status="${esc(c.status || '')}">
                <div class="d-flex items-start justify-between gap-3 mb-4">
                    <div class="card-icon ${pct >= 100 ? 'green' : ''}">
                        <i data-lucide="${pct >= 100 ? 'badge-check' : 'book-open'}"></i>
                    </div>
                    <div class="d-flex items-center gap-2">
                        <span class="badge ${c.status === 'Ochiq' ? 'badge-green' : c.status === 'Yopiq' ? 'badge-red' : ''}">${esc(c.status || 'Ochiq')}</span>
                        ${canEdit ? `
                        <button class="btn-icon sm" onclick="window.__openCourse(${c.id});setTimeout(()=>window.__editCourse(${c.id}),50)" aria-label="Tahrirlash">
                            <i data-lucide="pencil"></i>
                        </button>` : ''}
                    </div>
                </div>
                <h3 class="tile-title" style="font-size:1.0625rem">${esc(c.title)}</h3>
                <p class="tile-sub clamp-2 mt-2">${esc(c.description || 'Tavsif kiritilmagan')}</p>
                <div class="d-flex items-center gap-2 mt-3 flex-wrap">
                    <span class="badge badge-blue">${esc(c.category || '')}</span>
                    <span class="t-xs c-soft fw-6">${(c.lessons || []).length} dars</span>
                </div>
                <div class="mt-4">
                    <div class="d-flex items-center justify-between mb-2">
                        <span class="t-xs fw-8 c-soft upper tracking-wider">Progress</span>
                        <span class="t-xs fw-8 c-primary">${pct}%</span>
                    </div>
                    ${progressBar(pct, pct >= 100 ? 'green' : '')}
                    ${done > 0 ? `<div class="t-xs c-muted mt-2">${done} ta dars tugatilgan</div>` : ''}
                </div>
                <button class="btn ${pct > 0 && pct < 100 ? 'btn-primary' : 'btn-soft'} btn-block mt-4" onclick="window.__openCourse(${c.id})">
                    ${pct > 0 && pct < 100 ? 'Davom ettirish' : pct >= 100 ? 'Ko‘rish' : 'Boshlash'}
                    <i data-lucide="arrow-right"></i>
                </button>
            </article>`;
        }).join('');
    });
}

window.__editCourse = async (id) => {
    const courses = await getCourses();
    const c = courses.find(x => x.id === id);
    if (c) openCourseEditor(c);
    else showToast('Kurs topilmadi', 'error');
};

async function v_cdetail() {
    const courses = await getCourses();
    const c = courses.find(x => x.id === STATE.activeCourseId);
    if (!c) {
        return pageHead('Kurs', '')
            + emptyState('search-x', 'Kurs topilmadi', '', `<button class="btn btn-primary" onclick="go('courses')">Kurslarga qaytish</button>`);
    }

    const done = courseCompleted(c);
    const pct = courseProgress(c);
    const canEdit = isStaff();
    const u = STATE.user;
    const total = (c.lessons || []).length;

    return `
        <button class="btn btn-ghost btn-sm mb-4" onclick="go('courses')"><i data-lucide="arrow-left"></i> Kurslar</button>
        ${pageHead(c.title, c.description || '', `
            ${canEdit ? `
            <button class="btn btn-outline btn-sm" onclick="window.__editCourse(${c.id})"><i data-lucide="pencil"></i> Tahrirlash</button>
            <button class="btn btn-danger btn-sm" onclick="window.__delCourse(${c.id})"><i data-lucide="trash-2"></i> O‘chirish</button>` : ''}`)}

        <div class="grid grid-4 mb-6">
            ${statTile({ label: 'Darslar', value: total, icon: 'book-open' })}
            ${statTile({ label: 'Tugatilgan', value: done.length, icon: 'book-open-check', tone: 'green' })}
            ${statTile({ label: 'Progress', value: `${pct}%`, icon: 'trending-up', tone: 'accent' })}
            ${statTile({ label: 'Kategoriya', value: `<span class="t-lg">${esc(c.category || '—')}</span>`, icon: 'tag' })}
        </div>

        ${total === 0 ? emptyState('file-plus', 'Darslar qo‘shilmagan',
            canEdit ? 'Kursni tahrirlab dars qo‘shing.' : 'Bu kursga hali dars qo‘shilmagan.')
            : `<div class="stack-sm">
                ${c.lessons.map((l, i) => {
                    const isDone = done.includes(l.id);
                    return `
                    <button class="card card-pad-sm card-hover" style="text-align:left;width:100%;display:flex;align-items:center;gap:14px"
                            onclick="window.__openLesson(${l.id})">
                        <div class="rank-medal ${isDone ? 'gold' : ''}">${isDone
                            ? '<i data-lucide="check" style="width:16px;height:16px"></i>'
                            : i + 1}</div>
                        <div class="grow" style="min-width:0">
                            <div class="list-title truncate">${esc(l.title)}</div>
                            <div class="list-sub">${esc(l.topic || 'Mavzu ko‘rsatilmagan')}</div>
                        </div>
                        ${l.videoUrl ? '<i data-lucide="video" style="width:18px;height:18px;color:var(--gray-300)"></i>' : ''}
                        <i data-lucide="play-circle" style="width:20px;height:20px;color:var(--primary)"></i>
                    </button>`;
                }).join('')}
            </div>`}

        ${!u.progress || !Object.keys(u.progress).length ? `
        <div class="callout blue mt-6"><i data-lucide="info"></i>
            <div>Darsni oching va kamida <b>20 daqiqa</b> ishlab turing — shunda <b>+7 XP</b> olasiz va
            kunlik limitga qadar 50 XP yig‘ishingiz mumkin.</div>
        </div>` : ''}`;
}

// ══════════════════════════════════════════════════════════════════════
//  Views: users
// ══════════════════════════════════════════════════════════════════════
async function v_users() {
    const [users, groups] = await Promise.all([getUsers(), getGroups()]);
    const canDelete = STATE.user.role === 'admin';
    const canRoles = STATE.user.role === 'admin';

    window.__usersCache = users;
    window.__groupsCache = groups;

    return `
        ${pageHead('Foydalanuvchilar', `${users.length} ta ro‘yxatdan o‘tgan`, canDelete
            ? `<button class="btn btn-primary" onclick="window.__openUserEditor()"><i data-lucide="user-plus"></i> Qo‘shish</button>` : '')}

        <div class="d-flex items-center gap-3 mb-5 flex-wrap">
            <div class="input-icon grow" style="max-width:340px">
                <i data-lucide="search"></i>
                <input class="input" id="user-search" placeholder="Ism yoki email…" oninput="window.__filterUsers()">
            </div>
            <div class="d-flex gap-2 flex-wrap" id="user-filters">
                ${['Barchasi', 'Talaba', 'O‘qituvchi', 'Admin'].map((f, i) =>
                    `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-outline'} btn-sm" data-filter="${f}" onclick="window.__setUserFilter('${f}',this)">${f}</button>`).join('')}
            </div>
        </div>

        <section class="card">
            <div class="table-wrap">
                <table class="table responsive" id="users-table">
                    <thead>
                        <tr>
                            <th>Foydalanuvchi</th>
                            <th data-label="Rol">Rol</th>
                            <th data-label="Guruh">Guruh</th>
                            <th data-label="Ball">Ball</th>
                            <th class="cell-act"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => {
                            const g = groups.find(x => x.id === u.groupId);
                            return `
                            <tr data-role="${esc(u.role)}" data-name="${esc((u.ism + ' ' + u.email).toLowerCase())}">
                                <td data-label="Foydalanuvchi">
                                    <div class="d-flex items-center gap-3">
                                        ${avatarHtml(u, 'avatar-sm')}
                                        <div style="min-width:0">
                                            <div class="cell-main truncate">${esc(u.ism)}</div>
                                            <div class="cell-sub truncate">${esc(u.email)}</div>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Rol">
                                    ${canRoles ? `
                                    <select class="select" style="width:auto;padding:6px 30px 6px 10px;font-size:.75rem"
                                            onchange="window.__changeRole(${u.id},this.value)">
                                        ${Object.keys(ROLE_LABELS).map(r =>
                                            `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleLabel(r)}</option>`).join('')}
                                    </select>` : `<span class="badge ${ROLE_BADGE[u.role] || ''}">${roleLabel(u.role)}</span>`}
                                </td>
                                <td data-label="Guruh">
                                    <span class="cell-sub">${esc(g?.name || '—')}</span>
                                </td>
                                <td data-label="Ball"><span class="badge badge-orange">${num(u.points)} XP</span></td>
                                <td class="cell-act" data-label="">
                                    <div class="d-flex gap-1 justify-end">
                                        <button class="btn-icon sm" onclick="window.__openUserEditor(${u.id})" aria-label="Tahrirlash">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        ${canDelete && u.id !== STATE.user.id ? `
                                        <button class="btn-icon sm" onclick="window.__delUser(${u.id})" aria-label="O’chirish" style="color:var(--red-500)">
                                            <i data-lucide="trash-2"></i>
                                        </button>` : ''}
                                    </div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </section>`;
}

window.__filterUsers = () => {
    const q = (document.getElementById('user-search')?.value || '').toLowerCase();
    const active = document.querySelector('#user-filters .btn-primary')?.dataset.filter || 'Barchasi';
    const map = { Talaba: 'student', 'O‘qituvchi': 'ustoz', Admin: 'admin' };
    document.querySelectorAll('#users-table tbody tr').forEach(tr => {
        const okQ = !q || (tr.dataset.name || '').includes(q);
        const okF = active === 'Barchasi' || tr.dataset.role === map[active];
        tr.classList.toggle('hidden', !(okQ && okF));
    });
};

window.__setUserFilter = (f, btn) => {
    document.querySelectorAll('#user-filters .btn').forEach(b => {
        b.classList.remove('btn-primary'); b.classList.add('btn-outline');
    });
    btn.classList.add('btn-primary'); btn.classList.remove('btn-outline');
    window.__filterUsers();
};

window.__changeRole = async (uid, role) => {
    try { await api_patch(`/users/${uid}`, { role }); showToast('Rol yangilandi', 'success'); }
    catch (e) { showToast(e.message, 'error'); renderView('users'); }
};

window.__delUser = async (uid) => {
    const u = (window.__usersCache || []).find(x => x.id === uid);
    if (!confirm(`${u?.ism || 'Foydalanuvchi'} ni o‘chirishni tasdiqlaysizmi?`)) return;
    try { await api_del(`/users/${uid}`); showToast('Foydalanuvchi o‘chirildi', 'success'); renderView('users'); }
    catch (e) { showToast(e.message, 'error'); }
};

window.__openUserEditor = async (uid) => {
    const u = uid ? (window.__usersCache || []).find(x => x.id === uid) : null;
    if (uid && !u) { showToast('Foydalanuvchi topilmadi', 'error'); return; }
    const groups = window.__groupsCache || await getGroups();
    const isNew = !u;

    openModal(modalShell({
        icon: '<i data-lucide="user-cog"></i>',
        title: isNew ? 'Yangi foydalanuvchi' : esc(u.ism),
        body: `
            <form id="form-user" class="stack" onsubmit="return window.__svUser(event, ${isNew ? 'null' : uid})">
                <div class="field">
                    <label class="label">Ism va familiya</label>
                    <input class="input" name="full_name" required value="${esc(u?.ism || '')}">
                </div>
                <div class="field">
                    <label class="label">Email</label>
                    <input class="input" name="email" type="email" required value="${esc(u?.email || '')}" ${isNew ? '' : 'disabled'}>
                    ${isNew ? '' : '<div class="form-hint mt-1">Emailni o‘zgartirish uchun foydalanuvchini o‘chiring va yangidan yarating.</div>'}
                </div>
                <div class="field">
                    <label class="label">Yangi parol ${isNew ? '' : '(ixtiyoriy)'}</label>
                    <input class="input" name="password" type="text" placeholder="${isNew ? 'Kamida 6 belgi' : 'O‘zgartirmaslik uchun bo‘sh qoldiring'}">
                </div>
                <div class="grid grid-2" style="gap:12px">
                    <div class="field">
                        <label class="label">Rol</label>
                        <select class="select" name="role" ${STATE.user.role === 'admin' ? '' : 'disabled'}>
                            ${Object.keys(ROLE_LABELS).map(r =>
                                `<option value="${r}" ${(u?.role || 'student') === r ? 'selected' : ''}>${roleLabel(r)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label class="label">Guruh</label>
                        <select class="select" name="groupId">
                            <option value="">Guruhsiz</option>
                            ${groups.map(g => `<option value="${g.id}" ${u?.groupId === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </form>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-user').requestSubmit()">
                <i data-lucide="save"></i> Saqlash
            </button>`,
    }));
};

window.__svUser = async (e, id) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
        full_name: f.get('full_name'),
        groupId: f.get('groupId') ? Number(f.get('groupId')) : null,
    };
    if (f.get('password')) payload.password = f.get('password');
    if (STATE.user.role === 'admin') payload.role = f.get('role');

    try {
        if (id) {
            await api_patch(`/users/${id}`, payload);
        } else {
            payload.name = payload.full_name;
            payload.email = f.get('email');
            payload.password = f.get('password');
            await api_post('/users', payload);
        }
        showToast('Foydalanuvchi saqlandi', 'success');
        cModal();
        renderView('users');
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

// ══════════════════════════════════════════════════════════════════════
//  Views: groups
// ══════════════════════════════════════════════════════════════════════
async function v_groups() {
    const [groups, users] = await Promise.all([getGroups(), api_get('/users').catch(() => [])]);
    const canEdit = canManage() || STATE.user.role === 'ustoz';
    window.__myGroup = groups.find(g => g.ustozId === STATE.user.id) || groups[0] || null;

    return `
        ${pageHead('Guruhlar', `${groups.length} ta guruh`, canManage()
            ? `<button class="btn btn-primary" onclick="openGroupEditor()"><i data-lucide="plus"></i> Yangi guruh</button>` : '')}

        ${groups.length === 0
            ? emptyState('users-round', 'Guruhlar yo‘q', 'Administrator bilan bog‘laning.')
            : `<div class="grid grid-auto">
                ${groups.map(g => {
                    const teacher = users.find(u => u.id === g.ustozId);
                    return `
                    <article class="card card-pad card-hover">
                        <div class="d-flex items-start justify-between gap-3 mb-4">
                            <div class="card-icon"><i data-lucide="users-round"></i></div>
                            <div class="d-flex gap-1">
                                <button class="btn-icon sm" onclick="window.__openGroupEditorById(${g.id})" aria-label="Tahrirlash"><i data-lucide="pencil"></i></button>
                                ${canManage() ? `<button class="btn-icon sm" onclick="window.__delGroup(${g.id})" aria-label="O’chirish" style="color:var(--red-500)"><i data-lucide="trash-2"></i></button>` : ''}
                            </div>
                        </div>
                        <h3 class="tile-title" style="font-size:1.0625rem">${esc(g.name)}</h3>
                        <div class="stack-sm mt-3">
                            <div class="d-flex items-center gap-2 t-sm">
                                <i data-lucide="user-check" style="width:16px;height:16px;color:var(--gray-400)"></i>
                                <span class="c-muted">O‘qituvchi:</span>
                                <span class="fw-7">${esc(teacher?.ism || 'biriktirilmagan')}</span>
                            </div>
                            <div class="d-flex items-center gap-2 t-sm">
                                <i data-lucide="users" style="width:16px;height:16px;color:var(--gray-400)"></i>
                                <span class="c-muted">Talabalar:</span>
                                <span class="fw-7">${(g.studentIds || []).length}</span>
                            </div>
                            <div class="d-flex items-center gap-2 t-sm">
                                <i data-lucide="calendar-days" style="width:16px;height:16px;color:var(--gray-400)"></i>
                                <span class="c-muted">Mashg‘ulot:</span>
                                <span class="fw-7">${(g.schedule || []).length} ta</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mt-4">
                            <button class="btn btn-soft btn-sm grow" onclick="window.__openScheduleEditorById(${g.id})">
                                <i data-lucide="calendar-days"></i> Jadval
                            </button>
                            <button class="btn btn-soft btn-sm grow" onclick="go('attendance')">
                                <i data-lucide="user-check"></i> Davomat
                            </button>
                        </div>
                    </article>`;
                }).join('')}
            </div>`}`;
}

window.__openGroupEditorById = async (id) => {
    const groups = await getGroups();
    openGroupEditor(groups.find(g => g.id === id));
};
window.__openScheduleEditorById = async (id) => {
    const groups = await getGroups();
    openScheduleEditor(groups.find(g => g.id === id));
};

// ══════════════════════════════════════════════════════════════════════
//  Views: attendance
// ══════════════════════════════════════════════════════════════════════
async function v_attendance() {
    const groups = await getGroups();
    if (groups.length === 0) return pageHead('Davomat') + emptyState('users-round', 'Guruhlar yo‘q');

    const gid = STATE.activeGroupId || groups[0].id;
    STATE.activeGroupId = gid;
    const g = groups.find(x => x.id === gid);

    return `
        ${pageHead('Davomat', 'Har bir talaba uchun kelgan / kelmagan belgilang', `
            <input type="date" class="input" id="att-date" value="${new Date().toISOString().slice(0, 10)}"
                   style="width:auto" onchange="window.__loadAttendance()">`)}

        <div class="d-flex gap-2 mb-5 flex-wrap" id="att-groups">
            ${groups.map(x => `
                <button class="btn ${x.id === gid ? 'btn-primary' : 'btn-outline'} btn-sm"
                        onclick="STATE.activeGroupId=${x.id};renderView('attendance')">${esc(x.name)}</button>`).join('')}
        </div>

        <div id="att-stats" class="grid grid-4 mb-6"></div>
        <div id="att-list"></div>`;
}

window.__loadAttendance = async () => {
    const gid = STATE.activeGroupId;
    const date = document.getElementById('att-date')?.value || new Date().toISOString().slice(0, 10);
    mount('att-list', async () => {
        const [users, recs] = await Promise.all([api_get('/users'), getAttendance()]);
        const g = (await getGroups()).find(x => x.id === gid);
        const students = users.filter(u => u.role === 'student' && (g?.studentIds || []).includes(u.id));
        const rec = recs.find(r => r.groupId === gid && r.date === date);
        const records = rec?.records || {};

        const present = Object.values(records).filter(v => v === 'present').length;
        const absent = Object.values(records).filter(v => v === 'absent').length;

        const statsBox = document.getElementById('att-stats');
        if (statsBox) {
            statsBox.innerHTML = [
                statTile({ label: 'Jami', value: students.length, icon: 'users' }),
                statTile({ label: 'Kelgan', value: present, icon: 'user-check', tone: 'green' }),
                statTile({ label: 'Kelmagan', value: absent, icon: 'user-x', tone: 'red' }),
                statTile({ label: 'Belgilanmagan', value: students.length - present - absent, icon: 'circle-dashed', tone: 'amber' }),
            ].join('');
            safeLucide(statsBox);
        }

        if (students.length === 0) return emptyState('users', 'Guruhda talaba yo‘q');

        return `
            <section class="card">
                <div class="list list-flush">
                    ${students.map(s => {
                        const st = records[String(s.id)];
                        return `
                        <div class="list-row">
                            ${avatarHtml(s, 'avatar-sm')}
                            <div class="grow" style="min-width:0">
                                <div class="list-title truncate">${esc(s.ism)}</div>
                                <div class="list-sub truncate">${esc(s.email)}</div>
                            </div>
                            <div class="seg ${st === 'present' ? 'present' : st === 'absent' ? 'absent' : ''}"
                                 onclick="window.__markAtt(${gid},${s.id},this)">
                                <div class="thumb"></div>
                                <div class="lbl-yes">Keldi</div>
                                <div class="lbl-no">Yo‘q</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
                <div class="card-pad border-t">
                    <button class="btn btn-success btn-block" onclick="window.__markAllAtt(${gid})">
                        <i data-lucide="check-check"></i> Hammasini kelgan deb belgilash
                    </button>
                </div>
            </section>`;
    });
};

window.__markAtt = async (gid, sid, el) => {
    const date = document.getElementById('att-date')?.value || new Date().toISOString().slice(0, 10);
    const isPresent = el.classList.contains('present');
    const next = isPresent ? 'absent' : 'present';
    el.classList.remove('present', 'absent');
    if (next === 'present') el.classList.add('present');
    try {
        await api_post('/attendance', { groupId: gid, studentId: sid, status: next, date });
    } catch (e) {
        showToast(e.message, 'error');
        el.classList.remove('present', 'absent');
    }
};

window.__markAllAtt = async (gid) => {
    const date = document.getElementById('att-date')?.value || new Date().toISOString().slice(0, 10);
    const [users, g] = await Promise.all([api_get('/users'), getGroups()]);
    const students = users.filter(u => u.role === 'student' && (g.find(x => x.id === gid)?.studentIds || []).includes(u.id));
    try {
        await Promise.all(students.map(s => api_post('/attendance', { groupId: gid, studentId: s.id, status: 'present', date })));
        showToast(`${students.length} talaba belgilandi`, 'success');
        window.__loadAttendance();
    } catch (e) { showToast(e.message, 'error'); }
};

window.geoCheckin = async (btn) => {
    if (!navigator.geolocation) { showToast('Brauzeringiz geolokatsiyani qo‘llab-quvvatlamaydi', 'error'); return; }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Joylashuv...';
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await api_post('/attendance/checkin', { lat: pos.coords.latitude, lng: pos.coords.longitude });
            showToast(res.message, res.inside ? 'success' : 'error');
            renderView('attendance');
        } catch (e) { showToast(e.message, 'error'); btn.disabled = false; btn.innerHTML = '<i data-lucide="map-pin"></i> Lokatsiya orqali'; safeLucide(btn); }
    }, (err) => {
        showToast('Joylashuvni olishda xatolik: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="map-pin"></i> Lokatsiya orqali';
        safeLucide(btn);
    }, { enableHighAccuracy: true, timeout: 10000 });
};

async function v_student_attendance() {
    const att = await getMyAttendance().catch(() => []);
    const present = att.filter(a => a.status === 'present').length;
    const pct = att.length ? Math.round((present / att.length) * 100) : 0;

    return `
        ${pageHead('Mening davomatim', '', `<button class="btn btn-primary" onclick="geoCheckin(this)"><i data-lucide="map-pin"></i> Lokatsiya orqali`)}
        <div class="grid grid-3 mb-6">
            ${statTile({ label: 'Davomat', value: `${pct}%`, icon: 'user-check', tone: pct >= 70 ? 'green' : 'amber' })}
            ${statTile({ label: 'Kelgan kun', value: present, icon: 'calendar-check', tone: 'green' })}
            ${statTile({ label: 'Jami yozuv', value: att.length, icon: 'calendar-days' })}
        </div>
        ${sectionCard('Tarix', att.length === 0
            ? emptyState('calendar-x', 'Hozircha yozuv yo‘q', 'Darsga kelganingizda avtomatik qo‘shiladi.')
            : `<div class="grid grid-4">${[...att].reverse().map(a => `
                <div class="stat" style="text-align:center;padding:14px">
                    <div class="t-sm fw-8">${esc(a.date)}</div>
                    <div class="mt-2"><span class="badge ${a.status === 'present' ? 'badge-green' : 'badge-red'}">${a.status === 'present' ? 'Kelgan' : 'Kelmagan'}</span></div>
                </div>`).join('')}</div>`, { icon: '<i data-lucide="calendar-check"></i>' })}`;
}

// ══════════════════════════════════════════════════════════════════════
//  Views: grades
// ══════════════════════════════════════════════════════════════════════
async function v_grades() {
    const u = STATE.user;

    if (u.role === 'student' || u.role === 'parent') {
        const [grades, courses] = await Promise.all([getGrades(), getCourses()]);
        if (grades.length === 0) {
            return pageHead('Baholarim', '') + emptyState('graduation-cap', 'Hali baho yo‘q', 'O‘qituvchi baho qo‘yganida shu yerda ko‘rinadi.');
        }
        const avg = (grades.reduce((a, g) => a + num(g.value), 0) / grades.length).toFixed(2);
        const best = Math.max(...grades.map(g => num(g.value)));
        return `
            ${pageHead('Baholarim', `${grades.length} ta baho`)}
            <div class="grid grid-3 mb-6">
                ${statTile({ label: 'O‘rtacha baho', value: avg, icon: 'trending-up', tone: num(avg) >= 4 ? 'green' : 'amber' })}
                ${statTile({ label: 'Eng yuqori', value: best, icon: 'arrow-up', tone: 'green' })}
                ${statTile({ label: 'Jami baho', value: grades.length, icon: 'graduation-cap' })}
            </div>
            <div class="stack-sm">
                ${grades.map(g => {
                    const c = courses.find(x => x.id === g.courseId);
                    return `
                    <div class="card card-pad-sm">
                        <div class="d-flex items-center gap-3">
                            <div class="card-icon" style="width:40px;height:40px"><i data-lucide="book-open"></i></div>
                            <div class="grow" style="min-width:0">
                                <div class="list-title truncate">${esc(c?.title || `Kurs #${g.courseId}`)}</div>
                                <div class="list-sub">${esc(g.date || '')}${g.comment ? ` · ${esc(g.comment)}` : ''}</div>
                            </div>
                            ${gradePill(g.value)}
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
    }

    if (u.role === 'director') {
        const [grades, users, courses] = await Promise.all([getGrades(), getUsers(), getCourses()]);
        if (grades.length === 0) return pageHead('Baholar', '') + emptyState('graduation-cap', 'Hali baho yo‘q');
        return `
            ${pageHead('Barcha baholar', `${grades.length} ta baho`)}
            <section class="card"><div class="table-wrap"><table class="table responsive">
                <thead><tr><th>Talaba</th><th>Kurs</th><th data-label="Baho">Baho</th><th data-label="Sana">Sana</th></tr></thead>
                <tbody>${grades.map(g => `
                    <tr>
                        <td data-label="Talaba"><span class="cell-main">${esc(users.find(x => x.id === g.studentId)?.ism || `#${g.studentId}`)}</span></td>
                        <td data-label="Kurs"><span class="cell-sub">${esc(courses.find(x => x.id === g.courseId)?.title || `#${g.courseId}`)}</span></td>
                        <td data-label="Baho">${gradePill(g.value)}</td>
                        <td data-label="Sana"><span class="cell-sub">${esc(g.date || '')}</span></td>
                    </tr>`).join('')}</tbody>
            </table></div></section>`;
    }

    // ustoz / admin
    const [users, courses, myGrades] = await Promise.all([getUsers(), getCourses(), getGrades()]);
    const students = users.filter(x => x.role === 'student');
    const sid = STATE.activeGradeStudent || students[0]?.id;
    STATE.activeGradeStudent = sid;
    window.__gradeStudents = students;
    window.__gradeCourses = courses;

    return `
        ${pageHead('Baholar', 'Talabani tanlang va baho qo‘ying')}

        <div class="split split-side">
            <section class="card" style="max-height:70vh;overflow-y:auto">
                <div class="card-pad-sm" style="border-bottom:1px solid var(--border)">
                    <div class="input-icon">
                        <i data-lucide="search"></i>
                        <input class="input" id="grade-search" placeholder="Talaba…" oninput="window.__filterGradeStudents()">
                    </div>
                </div>
                <div class="list" id="grade-students">
                    ${students.length === 0 ? '<div class="card-pad"><div class="form-hint">Talaba yo‘q</div></div>' :
                        students.map(s => `
                        <button class="list-row click w-full text-left ${s.id === sid ? '' : ''}" data-name="${esc(s.ism.toLowerCase())}"
                                style="${s.id === sid ? 'background:var(--blue-50);border-left:3px solid var(--primary)' : ''}"
                                onclick="window.__pickGradeStudent(${s.id})">
                            ${avatarHtml(s, 'avatar-sm')}
                            <div class="grow" style="min-width:0">
                                <div class="list-title truncate">${esc(s.ism)}</div>
                                <div class="list-sub truncate">${esc(s.email)}</div>
                            </div>
                        </button>`).join('')}
                </div>
            </section>

            <div class="stack" id="grade-panel"></div>
        </div>`;
}

window.__filterGradeStudents = () => {
    const q = (document.getElementById('grade-search')?.value || '').toLowerCase();
    document.querySelectorAll('#grade-students .list-row').forEach(el => {
        el.classList.toggle('hidden', !el.dataset.name.includes(q));
    });
};

window.__pickGradeStudent = (sid) => { STATE.activeGradeStudent = sid; renderView('grades'); };

window.__loadGradePanel = async () => {
    const sid = STATE.activeGradeStudent;
    mount('grade-panel', async () => {
        if (!sid) return emptyState('users', 'Talaba tanlang');
        const [grades, courses] = await Promise.all([getStudentGrades(sid), getCourses()]);
        const avg = grades.length ? (grades.reduce((a, g) => a + num(g.value), 0) / grades.length).toFixed(2) : '—';

        return `
            ${sectionCard('Yangi baho', `
                <form id="form-grade" class="stack" onsubmit="return window.__svGrade(event, ${sid})">
                    <div class="field">
                        <label class="label">Kurs</label>
                        <select class="select" name="courseId" id="grade-course" required>
                            <option value="">Kursni tanlang</option>
                            ${courses.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label class="label">Baho</label>
                        <div class="d-flex gap-2 flex-wrap">
                            ${[5, 4, 3, 2, 1].map(v => `
                            <button type="button" class="grade-pick" data-v="${v}" onclick="window.__pickGrade(${v},this)">${v}</button>`).join('')}
                        </div>
                    </div>
                    <div class="field">
                        <label class="label">Izoh (ixtiyoriy)</label>
                        <input class="input" name="comment" placeholder="Masalan: Ajoyib ish!">
                    </div>
                    <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i> Baho qo‘yish</button>
                </form>`, { icon: '<i data-lucide="graduation-cap"></i>' })}

            ${sectionCard('Baho tarixi', grades.length === 0
                ? emptyState('graduation-cap', 'Bu talabada baho yo‘q')
                : `
                <div class="d-flex items-center justify-between mb-4">
                    <span class="t-sm c-muted">O‘rtacha baho</span>
                    <span class="t-xl fw-9">${avg}</span>
                </div>
                <div class="stack-sm">
                    ${grades.map(g => `
                        <div class="grade-row g${g.value}">
                            <div style="min-width:0">
                                <div class="fw-8 t-sm truncate">${esc(courses.find(c => c.id === g.courseId)?.title || `Kurs #${g.courseId}`)}</div>
                                <div class="t-xs c-muted">${esc(g.date || '')}${g.comment ? ` · ${esc(g.comment)}` : ''}</div>
                            </div>
                            <div class="d-flex items-center gap-2">
                                ${gradePill(g.value)}
                                <button class="btn-icon sm" onclick="window.__delGrade(${g.id})" aria-label="O’chirish"><i data-lucide="trash-2"></i></button>
                            </div>
                        </div>`).join('')}
                </div>`, { icon: '<i data-lucide="history"></i>' })}`;
    });
};

window.__pickGrade = (v, el) => {
    document.querySelectorAll('.grade-pick').forEach(b => b.classList.remove('picked'));
    el.classList.add('picked', `g${v}`);
    const input = document.getElementById('grade-value');
    if (input) input.value = v;
    STATE.pickedGrade = v;
};

window.__svGrade = async (e, sid) => {
    e.preventDefault();
    const courseId = document.getElementById('grade-course')?.value;
    const value = STATE.pickedGrade;
    if (!courseId) { showToast('Kursni tanlang', 'error'); return false; }
    if (!value) { showToast('Bahoni tanlang', 'error'); return false; }
    const comment = new FormData(e.target).get('comment');
    try {
        await api_post('/grades', { studentId: sid, courseId: Number(courseId), value, comment });
        showToast('Baho qo‘yildi', 'success');
        STATE.pickedGrade = null;
        window.__loadGradePanel();
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

window.__delGrade = async (id) => {
    if (!confirm('Bahoni o‘chirishni tasdiqlaysizmi?')) return;
    try { await api_del(`/grades/${id}`); showToast('Baho o‘chirildi', 'success'); window.__loadGradePanel(); }
    catch (e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════════════
//  Views: reports & analytics
// ══════════════════════════════════════════════════════════════════════
async function v_reports() {
    const [users, groups, courses, grades, att] = await Promise.all([
        getUsers(), getGroups(), getCourses(), getGrades(), getAttendance().catch(() => []),
    ]);
    const students = users.filter(u => u.role === 'student');

    const present = att.reduce((a, r) => a + Object.values(r.records || {}).filter(v => v === 'present').length, 0);
    const absent = att.reduce((a, r) => a + Object.values(r.records || {}).filter(v => v === 'absent').length, 0);
    const attPct = (present + absent) ? Math.round((present / (present + absent)) * 100) : 0;
    const avgGrade = grades.length ? (grades.reduce((a, g) => a + num(g.value), 0) / grades.length).toFixed(2) : '0';
    const totalXp = students.reduce((a, u) => a + num(u.points), 0);

    return `
        ${pageHead('Hisobotlar', 'Platforma bo‘yicha umumiy statistika', `
            <button class="btn btn-outline" onclick="window.__printReport()"><i data-lucide="printer"></i> Chop etish</button>`)}

        <div class="grid grid-4 mb-6">
            ${statTile({ label: 'Talabalar', value: students.length, icon: 'users' })}
            ${statTile({ label: 'O‘rtacha baho', value: avgGrade, icon: 'graduation-cap', tone: num(avgGrade) >= 4 ? 'green' : 'amber' })}
            ${statTile({ label: 'Davomat', value: `${attPct}%`, icon: 'user-check', tone: attPct >= 70 ? 'green' : 'red' })}
            ${statTile({ label: 'Jami XP', value: totalXp, icon: 'zap', tone: 'accent' })}
        </div>

        <div class="split split-half">
            ${sectionCard('Guruhlar reytingi', `
                <div class="stack-sm">
                    ${groups.map((g, i) => {
                        const xp = g.studentIds.reduce((a, id) => a + num(students.find(s => s.id === id)?.points), 0);
                        return `
                        <div class="d-flex items-center gap-3">
                            <div class="rank-medal ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</div>
                            <div class="grow" style="min-width:0">
                                <div class="list-title truncate">${esc(g.name)}</div>
                                <div class="list-sub">${(g.studentIds || []).length} talaba</div>
                            </div>
                            <span class="badge badge-orange">${xp} XP</span>
                        </div>`;
                    }).join('') || '<div class="form-hint">Guruhlar yo‘q</div>'}
                </div>`, { icon: '<i data-lucide="trophy"></i>' })}

            ${sectionCard('Kurslar bo‘yicha baholar', courses.length === 0
                ? emptyState('book-open', 'Kurslar yo‘q')
                : (() => {
                    const byCourse = {};
                    grades.forEach(g => { (byCourse[g.courseId] ||= []).push(num(g.value)); });
                    const rows = Object.entries(byCourse).map(([cid, vals]) => ({
                        course: courses.find(c => c.id === Number(cid)),
                        avg: vals.reduce((a, v) => a + v, 0) / vals.length,
                        count: vals.length,
                    })).sort((a, b) => b.avg - a.avg);

                    return `<div class="stack-sm">
                        ${rows.map(r => `
                        <div>
                            <div class="d-flex items-center justify-between mb-2">
                                <span class="t-sm fw-7 truncate">${esc(r.course?.title || 'Noma\'lum')}</span>
                                <span class="fw-8 t-sm c-primary">${r.avg.toFixed(2)}</span>
                            </div>
                            ${progressBar(Math.round((r.avg / 5) * 100), r.avg >= 4 ? 'green' : '')}
                            <div class="t-xs c-soft mt-1">${r.count} ta baho</div>
                        </div>`).join('')}
                    </div>`;
                })(), { icon: '<i data-lucide="bar-chart-3"></i>' })}
        </div>

        <div class="mt-6">
            ${sectionCard('Talabalar reytingi', `
                <div class="table-wrap"><table class="table responsive">
                    <thead><tr><th>#</th><th>Talaba</th><th data-label="Guruh">Guruh</th><th data-label="Ball">Ball</th><th data-label="O‘yin">O‘yin ballari</th></tr></thead>
                    <tbody>${[...students].sort((a, b) => num(b.points) - num(a.points)).slice(0, 25).map((s, i) => `
                        <tr>
                            <td data-label="#"><span class="rank-medal ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</span></td>
                            <td data-label="Talaba"><div class="d-flex items-center gap-2">${avatarHtml(s, 'avatar-xs')}<span class="cell-main">${esc(s.ism)}</span></div></td>
                            <td data-label="Guruh"><span class="cell-sub">${esc(groups.find(g => g.id === s.groupId)?.name || '—')}</span></td>
                            <td data-label="Ball"><span class="badge badge-orange">${num(s.points)}</span></td>
                            <td data-label="O‘yin"><span class="cell-sub">${num(s.duelWins)}</span></td>
                        </tr>`).join('')}</tbody>
                </table></div>`, { icon: '<i data-lucide="users"></i>' })}
        </div>`;
}
window.__printReport = () => window.print();

async function v_analytics() {
    const [users, groups, att, grades] = await Promise.all([
        getUsers(), getGroups(), getAttendance().catch(() => []), getGrades(),
    ]);
    const students = users.filter(u => u.role === 'student');

    // distribution by points buckets
    const buckets = [
        { label: '0–500', min: 0, max: 500 },
        { label: '500–2 000', min: 500, max: 2000 },
        { label: '2 000–5 000', min: 2000, max: 5000 },
        { label: '5 000+', min: 5000, max: Infinity },
    ].map(b => ({ ...b, count: students.filter(s => num(s.points) >= b.min && num(s.points) < b.max).length }));
    const maxCount = Math.max(1, ...buckets.map(b => b.count));

    const gradeDist = [5, 4, 3, 2, 1].map(v => ({ v, count: grades.filter(g => num(g.value) === v).length }));
    const maxGrade = Math.max(1, ...gradeDist.map(g => g.count));

    // attendance per group
    const perGroup = groups.map(g => {
        let p = 0, a = 0;
        att.filter(r => r.groupId === g.id).forEach(r => {
            Object.entries(r.records || {}).forEach(([sid, v]) => {
                if ((g.studentIds || []).includes(Number(sid))) v === 'present' ? p++ : a++;
            });
        });
        return { group: g, pct: (p + a) ? Math.round((p / (p + a)) * 100) : 0 };
    }).sort((x, y) => y.pct - x.pct);

    return `
        ${pageHead('Analitika', 'Ta’lim jarayoni tahlili')}

        <div class="split split-half mb-6">
            ${sectionCard('Balllar taqsimoti', `
                <div class="stack">
                    ${buckets.map(b => `
                    <div>
                        <div class="d-flex items-center justify-between mb-2">
                            <span class="t-sm fw-7">${b.label} XP</span>
                            <span class="fw-8 t-sm">${b.count}</span>
                        </div>
                        ${progressBar(Math.round((b.count / maxCount) * 100), b.label === '5 000+' ? 'accent' : '')}
                    </div>`).join('')}
                </div>`, { icon: '<i data-lucide="bar-chart-3"></i>' })}

            ${sectionCard('Baholar taqsimoti', `
                <div class="stack">
                    ${gradeDist.map(g => `
                    <div>
                        <div class="d-flex items-center justify-between mb-2">
                            <span class="d-flex items-center gap-2">${gradePill(g.v)}<span class="t-sm fw-7">baho ${g.v}</span></span>
                            <span class="fw-8 t-sm">${g.count}</span>
                        </div>
                        ${progressBar(Math.round((g.count / maxGrade) * 100), g.v >= 4 ? 'green' : g.v >= 3 ? '' : 'red')}
                    </div>`).join('')}
                </div>`, { icon: '<i data-lucide="graduation-cap"></i>' })}
        </div>

        <div class="mt-6">
            ${sectionCard('Guruhlar bo‘yicha davomat', perGroup.length === 0
                ? emptyState('users-round', 'Ma’lumot yo‘q')
                : `<div class="stack">
                    ${perGroup.map(g => `
                    <div>
                        <div class="d-flex items-center justify-between mb-2">
                            <span class="t-sm fw-7">${esc(g.group.name)}</span>
                            <span class="fw-8 t-sm ${g.pct >= 70 ? 'c-green' : 'c-red'}">${g.pct}%</span>
                        </div>
                        ${progressBar(g.pct, g.pct >= 70 ? 'green' : 'red')}
                    </div>`).join('')}
                </div>`, { icon: '<i data-lucide="user-check"></i>' })}
        </div>`;
}

// ══════════════════════════════════════════════════════════════════════
//  Views: leaderboard
// ══════════════════════════════════════════════════════════════════════
async function v_lead() {
    const lb = await getLeaderboard();
    const students = lb.students || [];
    const groups = lb.groups || [];
    const me = STATE.user;
    const myRank = [...students].sort((a, b) => num(b.points) - num(a.points)).findIndex(s => s.id === me?.id) + 1;

    return `
        ${pageHead('Reyting', 'Eng faol o‘quvchilar va guruhlar', `
            ${myRank > 0 ? `<span class="badge badge-orange t-sm"><i data-lucide="trophy"></i> Sizning o‘rningiz: ${myRank}-o‘rin</span>` : ''}
        `)}

        <div class="d-flex gap-2 mb-5">
            <button class="btn btn-primary btn-sm" data-ltab="students" onclick="window.__leadTab('students',this)">Talabalar</button>
            <button class="btn btn-outline btn-sm" data-ltab="groups" onclick="window.__leadTab('groups',this)">Guruhlar</button>
        </div>

        <div id="lead-students">
            ${students.length === 0 ? emptyState('trophy', 'Reyting bo‘sh') : `
            <div class="grid grid-3 mb-6">
                ${students.slice(0, 3).map((s, i) => `
                    <div class="card card-pad text-center ${i === 0 ? 'card-accent' : ''}" style="${i === 0 ? 'border-top:3px solid var(--accent)' : ''}">
                        <div class="rank-medal ${i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'} mx-auto mb-3" style="width:52px;height:52px;font-size:1.125rem">${i + 1}</div>
                        ${avatarHtml(s, 'avatar-lg mx-auto', i === 0 ? 'avatar-accent' : '')}
                        <div class="fw-8 mt-3 truncate">${esc(s.ism)}</div>
                        <div class="badge badge-orange mt-2">${num(s.points)} XP</div>
                    </div>`).join('')}
            </div>
            <section class="card"><div class="list list-flush">
                ${students.slice(3).map((s, i) => `
                    <div class="list-row">
                        <div class="rank-medal">${i + 4}</div>
                        ${avatarHtml(s, 'avatar-sm')}
                        <div class="grow" style="min-width:0">
                            <div class="list-title truncate">${esc(s.ism)}</div>
                            <div class="list-sub">${(s.achievements || []).length} yutuq · ${num(s.duelWins)} o‘yin balli</div>
                        </div>
                        <span class="badge badge-orange">${num(s.points)} XP</span>
                    </div>`).join('') || '<div class="list-row"><span class="c-soft t-sm">Ko‘proq o‘quvchilar yo‘q</span></div>'}
            </div></section>`}
        </div>

        <div id="lead-groups" class="hidden">
            ${groups.length === 0 ? emptyState('users-round', 'Guruhlar yo‘q') : `
            <div class="stack">
                ${groups.map((g, i) => `
                    <div class="card card-pad-sm">
                        <div class="d-flex items-center gap-3">
                            <div class="rank-medal ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</div>
                            <div class="grow" style="min-width:0">
                                <div class="list-title">${esc(g.name)}</div>
                                <div class="list-sub">${g.studentCount} talaba</div>
                            </div>
                            <span class="badge badge-orange">${num(g.totalXP)} XP</span>
                        </div>
                    </div>`).join('')}
            </div>`}
        </div>`;
}
window.__leadTab = (tab, btn) => {
    ['students', 'groups'].forEach(t => {
        const el = document.getElementById(`lead-${t}`);
        el?.classList.toggle('hidden', t !== tab);
    });
    document.querySelectorAll('[data-ltab]').forEach(b => {
        b.classList.toggle('btn-primary', b.dataset.ltab === tab);
        b.classList.toggle('btn-outline', b.dataset.ltab !== tab);
    });
};

// ══════════════════════════════════════════════════════════════════════
//  Views: support (tickets)
// ══════════════════════════════════════════════════════════════════════
async function v_support() {
    const isStaffSide = canManage() || STATE.user.role === 'director';
    return `
        ${pageHead(isStaffSide ? 'Ticketlar' : 'Yordam', isStaffSide ? 'Foydalanuvchilar murojaatlari' : 'Savolingizni yozing — biz tez orada javob beramiz')}

        ${sectionCard('Yangi murojaat', `
            <form class="stack" onsubmit="return window.__svTicket(event)">
                <textarea class="textarea" id="ticket-msg" required placeholder="Murojaatingizni yozing…"></textarea>
                <button class="btn btn-primary"><i data-lucide="send"></i> Yuborish</button>
            </form>`, { icon: '<i data-lucide="message-square-plus"></i>' })}

        <div class="mt-6" id="tickets-list"></div>`;
}

function loadTickets() {
    mount('tickets-list', async () => {
        const tickets = await getTickets();
        if (tickets.length === 0) return emptyState('inbox', 'Ticketlar yo‘q');
        return `<section class="card"><div class="list list-flush">
            ${tickets.map(t => `
                <button class="list-row click w-full text-left" onclick="openTicketModal(${t.id})">
                    <div class="card-icon ${t.status === 'Yopilgan' ? 'green' : 'amber'}" style="width:34px;height:34px">
                        <i data-lucide="life-buoy"></i>
                    </div>
                    <div class="grow" style="min-width:0">
                        <div class="list-title truncate">${esc(t.message)}</div>
                        <div class="list-sub">
                            #${t.id} · ${esc(t.user_name || '')} · ${(t.replies || []).length} javob
                        </div>
                    </div>
                    <span class="badge ${t.status === 'Yopilgan' ? 'badge-green' : 'badge-amber'}">${esc(t.status)}</span>
                    <i data-lucide="chevron-right" style="color:var(--gray-300)"></i>
                </button>`).join('')}
        </div></section>`;
    });
}

window.__svTicket = async (e) => {
    e.preventDefault();
    const el = document.getElementById('ticket-msg');
    const message = el?.value.trim();
    if (!message) return false;
    try {
        await api_post('/tickets', { message });
        showToast('Murojaat yuborildi', 'success');
        el.value = '';
        loadTickets();
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

// ══════════════════════════════════════════════════════════════════════
//  Views: chat
// ══════════════════════════════════════════════════════════════════════
function chatShell({ title, sub, gid, isStaff = false, id }) {
    return `
        <div class="chat" id="${id}-box">
            <div class="chat-head">
                <div class="card-icon" style="width:36px;height:36px"><i data-lucide="${isStaff ? 'shield' : 'users-round'}"></i></div>
                <div class="grow" style="min-width:0">
                    <div class="fw-8 truncate" style="font-size:.9375rem">${esc(title)}</div>
                    <div class="t-xs c-muted truncate">${esc(sub)}</div>
                </div>
            </div>
            <div class="chat-body" id="${id}-body">
                <div class="loading-box"><span class="spinner"></span></div>
            </div>
            <form class="chat-form" onsubmit="return window.__svChat(event, ${isStaff}, ${gid})">
                <textarea class="textarea" id="${id}-input" rows="1" placeholder="Xabar yozing…" style="min-height:46px;max-height:120px"></textarea>
                <button class="btn btn-primary" style="height:46px;width:46px;padding:0" aria-label="Yuborish">
                    <i data-lucide="send"></i>
                </button>
            </form>
        </div>`;
}

function renderMessages(container, msgs) {
    if (msgs.length === 0) {
        container.innerHTML = '<div class="chat-empty">Hali xabar yo‘q. Birinchi xabarni siz yozing!</div>';
        return;
    }
    container.innerHTML = msgs.map(m => {
        const mine = m.userId === STATE.user.id;
        return `
            <div class="msg ${mine ? 'me' : 'other'}">
                ${!mine ? `<div class="t-xs fw-7 c-muted mb-1" style="margin-left:4px">${esc(m.userName || '')}</div>` : ''}
                <div class="msg-bubble">${esc(m.text)}</div>
                <div class="msg-meta">${esc(m.time || '')}</div>
            </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

async function v_chat() {
    const g = await getMyGroup();
    if (!g) {
        return pageHead('Guruh chat', '')
            + emptyState('message-circle-off', 'Guruh biriktirilmagan', 'Chatga kirish uchun siz biror guruhga biriktirilishingiz kerak.');
    }
    window.__myGroup = g;
    return `
        ${pageHead('Guruh chat', g.name)}
        ${chatShell({ title: g.name, sub: `${(g.studentIds || []).length} ishtirokchi`, gid: g.id, id: 'gchat' })}`;
}

async function v_staff_chat() {
    return `
        ${pageHead('Xodimlar chat', 'Faqat xodimlar uchun')}
        ${chatShell({ title: 'Xodimlar', sub: 'Ichki muhokama', gid: 0, isStaff: true, id: 'schat' })}`;
}

async function loadChat(kind) {
    const isStaff = kind === 'staff';
    const bodyId = isStaff ? 'schat-body' : 'gchat-body';
    const gid = isStaff ? 0 : (window.__myGroup?.id ?? STATE.user.groupId);
    const box = document.getElementById(bodyId);
    if (!box) return;

    try {
        const msgs = isStaff ? await api_get('/staff-chat') : await api_get(`/chat/${gid}`);
        renderMessages(box, msgs || []);
    } catch (e) {
        box.innerHTML = `<div class="chat-empty">Xabarlarni yuklab bo‘lmadi: ${esc(e.message)}</div>`;
    }
}
window.__reloadChat = loadChat;

window.__svChat = async (e, isStaff, gid) => {
    e.preventDefault();
    const id = isStaff ? 'schat' : 'gchat';
    const el = document.getElementById(`${id}-input`);
    const text = el?.value.trim();
    if (!text) return false;
    el.value = '';
    try {
        if (isStaff) await api_post('/staff-chat', { text });
        else await api_post('/chat', { groupId: gid, text });
        loadChat(isStaff ? 'staff' : 'group');
    } catch (err) {
        showToast(err.message, 'error');
        el.value = text;
    }
    return false;
};

// ══════════════════════════════════════════════════════════════════════
//  Views: library
// ══════════════════════════════════════════════════════════════════════
async function v_library() {
    const books = await getBooks();
    const canEdit = canManage();
    return `
        ${pageHead('Kutubxona', `${books.length} ta kitob`, canEdit
            ? `<button class="btn btn-primary" onclick="window.__openBookEditor()"><i data-lucide="plus"></i> Kitob qo‘shish</button>` : '')}
        ${books.length === 0
            ? emptyState('library', 'Kutubxona bo‘sh', 'Kitoblar tez orada qo‘shiladi.')
            : `<div class="grid grid-auto">
                ${books.map(b => {
                    const hasLink = !!(b.link && b.link !== '#');
                    return `
                <article class="card card-pad card-hover d-flex flex-col gap-3">
                    <div class="book-cover">
                        ${b.image
                            ? `<img src="${esc(b.image)}" alt="${esc(b.title)}" loading="lazy">`
                            : `<span class="book-cover-emoji"><i data-lucide="book-open"></i></span>`}
                        <span class="book-cover-tag">PDF</span>
                    </div>
                    <div class="grow">
                        <h3 class="tile-title">${esc(b.title)}</h3>
                        <p class="tile-sub clamp-3 mt-2">${esc(b.description || '')}</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary btn-sm grow" onclick="window.__dlBook(${b.id},this)">
                            <i data-lucide="download"></i> PDF yuklab olish
                        </button>
                        ${hasLink ? `<a class="btn btn-soft btn-sm" href="${esc(b.link)}" target="_blank" rel="noopener" aria-label="Onlayn ochish">
                            <i data-lucide="external-link"></i></a>` : ''}
                        ${canEdit ? `
                        <button class="btn-icon sm" onclick="window.__delBook(${b.id})" aria-label="O’chirish"><i data-lucide="trash-2"></i></button>` : ''}
                    </div>
                </article>`;
                }).join('')}
            </div>`}`;
}

// PDF yuklab olish — token'ni query orqali ham yuboramiz, endpoint
// @jwt_required(optional=True) bo'lgani uchun ochiq ham ishlaydi.
window.__dlBook = (id, btn) => {
    const restore = () => {
        if (!btn) return;
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="download"></i> PDF yuklab olish';
        safeLucide(btn);
    };
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width:15px;height:15px"></span> Tayyorlanmoqda…';
    }
    const url = `/api/books/${id}/download`;
    const token = getAuthToken();
    fetch(token ? `${url}?token=${encodeURIComponent(token)}` : url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
        .then(r => {
            if (!r.ok) throw new Error('PDF tayyorlanmadi');
            const cd = r.headers.get('Content-Disposition') || '';
            const m = cd.match(/filename="?([^";]+)"?/);
            return r.blob().then(b => ({ blob: b, name: m ? m[1] : 'kitob.pdf' }));
        })
        .then(({ blob, name }) => {
            const href = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = href;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(href), 4000);
            showToast('PDF yuklab olindi', 'success');
            restore();
        })
        .catch(e => { showToast(e.message, 'error'); restore(); });
};

window.__openBookEditor = () => {
    openModal(modalShell({
        icon: '<i data-lucide="book-plus"></i>',
        title: 'Yangi kitob',
        body: `
            <form id="form-book" class="stack" onsubmit="return window.__svBook(event)">
                <div class="field"><label class="label">Nomi</label>
                    <input class="input" name="title" required placeholder="Python for Beginners"></div>
                <div class="field"><label class="label">Tavsif</label>
                    <textarea class="textarea" name="description"></textarea></div>
                <div class="field"><label class="label">Rasm havolasi</label>
                    <input class="input" name="image" placeholder="https://…"></div>
                <div class="field"><label class="label">Havola</label>
                    <input class="input" name="link" placeholder="https://…"></div>
            </form>`,
        footer: `
            <button class="btn btn-outline" onclick="cModal()">Bekor qilish</button>
            <button class="btn btn-primary" onclick="document.getElementById('form-book').requestSubmit()">
                <i data-lucide="save"></i> Saqlash</button>`,
    }));
};

window.__svBook = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try { await api_post('/books', f); showToast('Kitob qo‘shildi', 'success'); cModal(); renderView('library'); }
    catch (err) { showToast(err.message, 'error'); }
    return false;
};

window.__delBook = async (id) => {
    if (!confirm('Kitobni o‘chirishni tasdiqlaysizmi?')) return;
    try { await api_del(`/books/${id}`); showToast('Kitob o‘chirildi', 'success'); renderView('library'); }
    catch (e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════════════
//  Views: mini o'yin
// ══════════════════════════════════════════════════════════════════════
async function v_game() {
    const best = num(STATE.user?.duelWins);
    return `
        ${pageHead('Mini o‘yin', 'Tezkor test — har bir to‘g‘ri javob uchun ball', `
            <span class="badge badge-orange"><i data-lucide="zap"></i> +30 XP</span>`)}

        <div id="quiz-root">
            <div class="game-intro card card-pad-lg">
                <div class="game-intro-glow"></div>
                <div class="game-badge-big">🕹️</div>
                <h2 class="t-2xl fw-9 mt-4">Mini o‘yinga tayyor</h2>
                <p class="c-muted mt-2" style="max-width:34rem;margin-inline:auto">
                    10 ta savol beriladi. Har bir savol uchun 15 soniya bor —
                    vaqt tugasa javob noto‘g‘ri hisoblanadi. Natija foiz bo‘yicha:
                    <b>80%+</b> — 30 XP, <b>50%+</b> — 15 XP.
                </p>
                <div class="game-rules">
                    <div class="game-rule"><i data-lucide="timer"></i> 15 soniya / savol</div>
                    <div class="game-rule"><i data-lucide="trophy"></i> Rekor: ${best}</div>
                    <div class="game-rule"><i data-lucide="zap"></i> +30 XP</div>
                </div>
                <button class="btn btn-primary btn-lg mt-6" onclick="startGameQuiz('mini_game')">
                    <i data-lucide="play"></i> O‘yinni boshlash
                </button>
            </div>
        </div>`;
}

window.startGameQuiz = async (type) => {
    const root = document.getElementById('quiz-root');
    if (!root) return;
    root.innerHTML = '<div class="loading-box"><span class="spinner"></span> Savollar yuklanmoqda…</div>';

    try {
        const all = await getQuestions();
        // Eski ma'lumotlarda tur 'miniGame' deb yozilgan bo'lishi mumkin —
        // QUIZ_TYPE orqali bittaga keltiramiz, aks holda mini o'yin
        // o'z savollarini topa olmaydi.
        const want = QUIZ_TYPE(type);
        const pool = (all || []).filter(q => QUIZ_TYPE(q.type) === want);
        const list = (pool.length ? pool : all || []).slice(0, 10);
        if (list.length === 0) {
            root.innerHTML = emptyState('circle-help', 'Savollar yo‘q',
                'Bu turdagi savollar bazaga qo‘shilmagan.',
                isStaff() ? `<button class="btn btn-primary" onclick="go('questions')"><i data-lucide="plus"></i> Savol qo‘shish</button>` : '');
            safeLucide(root);
            return;
        }

        const state = { i: 0, score: 0, total: list.length, locked: false, list, timer: null, left: 15 };
        STATE.quiz = state;

        const clearTimer = () => { if (state.timer) { clearInterval(state.timer); state.timer = null; } };

        const draw = () => {
            if (state.i >= state.list.length) return drawResult();
            const q = state.list[state.i];
            const opts = ['A', 'B', 'C', 'D'].map(L => ({ L, text: q[`option${L}`] })).filter(o => o.text);
            state.left = 15;
            root.innerHTML = `
                <div class="game-stage card card-pad-lg">
                    <div class="game-top">
                        <span class="badge badge-blue"><i data-lucide="list-checks"></i> Savol ${state.i + 1}/${state.list.length}</span>
                        <span class="game-timer" id="game-timer"><i data-lucide="timer"></i> <b>15</b>s</span>
                        <span class="badge badge-green"><i data-lucide="zap"></i> ${state.score}</span>
                    </div>
                    ${progressBar(Math.round((state.i / state.list.length) * 100), 'accent')}

                    <h2 class="game-q mt-5">${esc(q.questionText)}</h2>

                    <div class="game-opts mt-5">
                        ${opts.map(o => `
                        <button class="game-opt" data-key="${o.L}" onclick="window.__answer('${o.L}',this)">
                            <span class="game-opt-key">${o.L}</span>
                            <span class="grow">${esc(o.text)}</span>
                            <i class="game-opt-mark" data-lucide="check"></i>
                        </button>`).join('')}
                    </div>
                </div>`;
            safeLucide(root);
            clearTimer();
            const el = document.getElementById('game-timer');
            state.timer = setInterval(() => {
                state.left -= 1;
                if (el) {
                    el.querySelector('b').textContent = Math.max(0, state.left);
                    el.classList.toggle('hot', state.left <= 5);
                }
                if (state.left <= 0) {
                    clearTimer();
                    const btns = root.querySelectorAll('.game-opt');
                    const right = root.querySelector(`.game-opt[data-key="${q.correctAnswer}"]`)
                        || [...btns].find(b => b.textContent.trim().startsWith(q.correctAnswer));
                    if (right) right.classList.add('right');
                    setTimeout(() => { state.i++; state.locked = false; draw(); }, 1100);
                }
            }, 1000);
        };

        const drawResult = () => {
            clearTimer();
            const pct = Math.round((state.score / state.total) * 100);
            const medal = pct >= 80 ? '🏆' : pct >= 50 ? '🥈' : '💪';
            const word = pct >= 80 ? 'Ajoyib natija!' : pct >= 50 ? 'Yaxshi, davom eting!' : 'Yana harakat qiling!';
            root.innerHTML = `
                <div class="game-over card card-pad-lg">
                    <div class="confetti" aria-hidden="true"></div>
                    <div class="game-medal">${medal}</div>
                    <h2 class="t-2xl fw-9 mt-3">${state.score} / ${state.total}</h2>
                    <div class="game-pct"><b>${pct}%</b> to‘g‘ri javob</div>
                    <p class="c-muted mt-2">${word}</p>
                    ${state.score > 0 ? `
                        <div class="game-xp"><i data-lucide="zap"></i> +${pct >= 80 ? 30 : 15} XP qo‘shilmoqda…</div>` : ''}
                    <div class="d-flex gap-2 justify-center mt-6 flex-wrap">
                        <button class="btn btn-primary" onclick="startGameQuiz('${type}')"><i data-lucide="rotate-cw"></i> Qayta o‘ynash</button>
                        <button class="btn btn-outline" onclick="go('shop')"><i data-lucide="shopping-bag"></i> Do‘kon</button>
                    </div>
                </div>`;
            safeLucide(root);
            if (state.score > 0) {
                addPoints(pct >= 80 ? 30 : 15, 'Mini o‘yin', 'mini_game');
            }
        };

        window.__answer = (letter, btn) => {
            if (state.locked) return;
            state.locked = true;
            clearTimer();
            const q = state.list[state.i];
            const correct = q.correctAnswer === letter;
            if (correct) state.score++;
            btn.classList.add(correct ? 'right' : 'wrong');
            if (!correct) {
                [...btn.parentElement.children].forEach(b => {
                    if (b.querySelector('.game-opt-key')?.textContent.trim() === q.correctAnswer) b.classList.add('right');
                });
            }
            setTimeout(() => {
                state.i++;
                state.locked = false;
                draw();
            }, 1100);
        };

        draw();
    } catch (e) {
        root.innerHTML = emptyState('triangle-alert', 'Savollar yuklanmadi', e.message);
        safeLucide(root);
    }
};

// ══════════════════════════════════════════════════════════════════════
//  Views: questions
// ══════════════════════════════════════════════════════════════════════
async function v_questions() {
    const questions = await getQuestions();
    const canEdit = ['ustoz', 'admin', 'tech_admin'].includes(STATE.user.role);

    return `
        ${pageHead('Savollar', `${questions.length} ta savol`, canEdit
            ? `<button class="btn btn-primary" onclick="openQuestionEditor()"><i data-lucide="plus"></i> Savol qo‘shish</button>` : '')}
        ${questions.length === 0
            ? emptyState('list-checks', 'Savol bazasi bo‘sh', 'O‘yin va test uchun savollar qo‘shing.')
            : `<div class="stack-sm">
                ${questions.map(q => `
                <div class="card card-pad-sm">
                    <div class="d-flex items-start gap-3">
                        <div class="grow" style="min-width:0">
                            <div class="fw-8" style="font-size:.9375rem">${esc(q.questionText)}</div>
                            <div class="d-flex gap-2 mt-3 flex-wrap">
                                ${['A', 'B', 'C', 'D'].map(L => `
                                <span class="badge ${q.correctAnswer === L ? 'badge-green' : ''}">
                                    ${L}: ${esc(q[`option${L}`] || '—')}
                                </span>`).join('')}
                            </div>
                            <div class="d-flex gap-2 mt-3">
                                <span class="badge ${q.type === 'quiz' ? 'badge-violet' : 'badge-blue'}">${esc(QUIZ_TYPE_LABEL[q.type] || 'Mini o‘yin')}</span>
                                <span class="badge">${esc(q.difficulty || 'medium')}</span>
                            </div>
                        </div>
                        ${canEdit ? `
                        <div class="d-flex gap-1">
                            <button class="btn-icon sm" onclick="window.__editQuestion(${q.id})" aria-label="Tahrirlash"><i data-lucide="pencil"></i></button>
                            <button class="btn-icon sm" onclick="window.__delQuestion(${q.id})" aria-label="O’chirish" style="color:var(--red-500)"><i data-lucide="trash-2"></i></button>
                        </div>` : ''}
                    </div>
                </div>`).join('')}
            </div>`}`;
}

window.__editQuestion = async (id) => {
    const qs = await getQuestions();
    openQuestionEditor(qs.find(q => q.id === id));
};

// ══════════════════════════════════════════════════════════════════════
//  Views: schedule
// ══════════════════════════════════════════════════════════════════════
async function v_schedule() {
    const g = await getMyGroup();
    if (!g) {
        return pageHead('Dars jadvali') +
            emptyState('calendar-x', 'Jadval mavjud emas', 'Siz biror guruhga biriktirilmagan.');
    }
    window.__myGroup = g;

    const items = (g.schedule || []).filter(s => s && (s.day || s.time || s.subject));
    const byDay = {};
    items.forEach(s => { (byDay[s.day] ||= []).push(s); });
    Object.values(byDay).forEach(list =>
        list.sort((a, b) => String(a.time || '').localeCompare(String(b.time || ''))));

    const canEdit = ['admin', 'tech_admin', 'director', 'ustoz'].includes(STATE.user.role);
    const todayName = todayDayName();
    const totalLessons = items.length;
    const week = items.reduce((a, s) => a + (+String(s.time || '').match(/\d+/)?.[0] || 0), 0);

    return `
        ${pageHead('Dars jadvali', `${esc(g.name)} — haftalik jadval`, canEdit
            ? `<button class="btn btn-primary" onclick="openScheduleEditor(window.__myGroup)">
                   <i data-lucide="pencil"></i> Jadvalni tahrirlash</button>` : '')}

        <div class="sched-stats">
            <div class="sched-stat"><i data-lucide="calendar-days"></i>
                <div><b>${totalLessons}</b><span>dars / hafta</span></div></div>
            <div class="sched-stat"><i data-lucide="clock"></i>
                <div><b>${week || totalLessons}</b><span>soat</span></div></div>
            <div class="sched-stat ${items.some(s => s.day === todayName) ? 'live' : ''}"><i data-lucide="sun"></i>
                <div><b>${esc(todayName)}</b><span>bugun</span></div></div>
        </div>

        <div class="sched-week">
            ${DAYS.map(d => {
                const list = byDay[d] || [];
                const isToday = d === todayName;
                const now = new Date();
                const nowMin = now.getHours() * 60 + now.getMinutes();
                return `
                <section class="sched-day${isToday ? ' today' : ''}${list.length ? '' : ' off'}">
                    <header class="sched-day-head">
                        <b>${esc(d)}</b>
                        <span>${list.length ? `${list.length} dars` : 'dam'}</span>
                    </header>
                    <div class="sched-day-body">
                        ${list.length === 0
                            ? '<div class="sched-empty">Mashg‘ulot yo‘q</div>'
                            : list.map(s => {
                                const hh = +String(s.time || '').match(/\d+/)?.[0];
                                const past = isToday && Number.isFinite(hh) && hh * 60 + 30 < nowMin;
                                return `
                                <div class="sched-item${past ? ' past' : ''}">
                                    <div class="sched-time"><i data-lucide="clock"></i>${esc(s.time || '—')}</div>
                                    <div class="sched-subject">${esc(s.subject || 'Mashg‘ulot')}</div>
                                    ${s.teacher ? `<div class="sched-teacher"><i data-lucide="user"></i>${esc(s.teacher)}</div>` : ''}
                                    ${s.room ? `<div class="sched-room"><i data-lucide="map-pin"></i>${esc(s.room)}</div>` : ''}
                                </div>`;
                            }).join('')}
                    </div>
                </section>`;
            }).join('')}
        </div>

        ${totalLessons === 0 ? `<div class="mt-6">${emptyState('calendar-plus', 'Haftalik jadval to‘ldirilmagan',
            canEdit ? 'Ustoz yoki administrator jadvalni tahrirlashi kerak.'
                    : 'Jadvalni ustiziz to‘ldiradi.')}</div>` : ''}`;
}

// ══════════════════════════════════════════════════════════════════════
//  Views: posts
// ══════════════════════════════════════════════════════════════════════
async function v_posts() {
    const canModerate = canManage();
    return `
        ${pageHead('Postlar', 'Platforma yangiliklari va muhokamasi')}

        ${sectionCard('Yangi post', `
            <form class="stack" onsubmit="return window.__svPost(event)">
                <input class="input" name="title" placeholder="Sarlavha" required>
                <textarea class="textarea" name="content" placeholder="Matn…" required></textarea>
                <button class="btn btn-primary"><i data-lucide="send"></i> Yaratish</button>
            </form>`, { icon: '<i data-lucide="pen-line"></i>', sub: canModerate ? 'Postlar darhol e’lon qilinadi' : 'Post tasdiqlanishdan keyin e’lon qilinadi' })}

        <div class="mt-6" id="posts-list"></div>`;
}

function loadPosts() {
    mount('posts-list', async () => {
        const posts = await getPosts();
        if (posts.length === 0) return emptyState('newspaper', 'Postlar yo‘q', 'Birinchi postni siz yozing!');
        const me = STATE.user;
        const canModerate = canManage();

        return posts.map(p => {
            const liked = (p.liked_users || []).includes(me?.id);
            const mine = p.authorId === me?.id;
            return `
            <article class="card card-pad mb-4">
                <div class="d-flex items-center gap-3 mb-4">
                    ${avatarHtml({ ism: p.author }, 'avatar-sm')}
                    <div class="grow" style="min-width:0">
                        <div class="fw-8 truncate">${esc(p.author || 'Noma’lum')}</div>
                        <div class="t-xs c-soft">${esc(p.date || '')}</div>
                    </div>
                    ${!p.approved ? '<span class="badge badge-amber">tasdiqlash kutilmoqda</span>' : ''}
                </div>
                ${p.title ? `<h3 class="mb-2" style="font-size:1.125rem">${esc(p.title)}</h3>` : ''}
                <p class="prose" style="font-size:.9375rem">${esc(p.content)}</p>
                ${p.image ? `<img src="${esc(p.image)}" alt="" class="rounded-lg mt-4" style="width:100%;max-height:320px;object-fit:cover" loading="lazy">` : ''}

                <div class="d-flex items-center gap-2 mt-5 flex-wrap">
                    <button class="btn ${liked ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="window.__toggleLike(${p.id},this)">
                        <i data-lucide="heart"${liked ? ' fill="currentColor"' : ''}></i> ${p.likes || 0}
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="window.__openComments(${p.id})">
                        <i data-lucide="message-square"></i> ${(p.comments || []).length}
                    </button>
                    <div class="grow"></div>
                    ${canModerate && !p.approved ? `
                    <button class="btn btn-success btn-sm" onclick="window.__apprPost(${p.id},true)"><i data-lucide="check"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="window.__apprPost(${p.id},false)"><i data-lucide="x"></i></button>` : ''}
                    ${(mine || STATE.user.role === 'admin') ? `
                    <button class="btn-icon sm" onclick="window.__delPost(${p.id})" aria-label="O’chirish" style="color:var(--red-500)">
                        <i data-lucide="trash-2"></i>
                    </button>` : ''}
                </div>
            </article>`;
        }).join('');
    });
}

window.__svPost = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
        await api_post('/posts', { title: f.get('title'), content: f.get('content') });
        showToast('Post yaratildi', 'success');
        e.target.reset();
        loadPosts();
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

window.__apprPost = async (id, ok) => {
    try { await api_patch(`/posts/${id}`, { approved: ok }); showToast(ok ? 'Post tasdiqlandi' : 'Post rad etildi', 'success'); loadPosts(); }
    catch (e) { showToast(e.message, 'error'); }
};

window.__delPost = async (id) => {
    if (!confirm('Postni o‘chirishni tasdiqlaysizmi?')) return;
    try { await api_del(`/posts/${id}`); showToast('Post o‘chirildi', 'success'); loadPosts(); }
    catch (e) { showToast(e.message, 'error'); }
};

window.__toggleLike = async (id, btn) => {
    try {
        const r = await api_post(`/posts/${id}/like`);
        btn.classList.toggle('btn-primary', r.liked);
        btn.classList.toggle('btn-outline', !r.liked);
        btn.innerHTML = `<i data-lucide="heart"${r.liked ? ' fill="currentColor"' : ''}></i> ${r.likes}`;
        safeLucide(btn);
    } catch (e) { showToast(e.message, 'error'); }
};

window.__openComments = async (id) => {
    const posts = await getPosts();
    const p = posts.find(x => x.id === id);
    if (!p) return;

    openModal(modalShell({
        icon: '<i data-lucide="message-square"></i>',
        title: esc(p.title || 'Izohlar'),
        body: `
            <div class="stack">
                <div class="stack" id="comment-list">
                    ${(p.comments || []).length === 0
                        ? '<div class="form-hint">Izohlar yo‘q</div>'
                        : p.comments.map(c => `
                        <div class="list-row items-start" style="padding:10px 0">
                            ${avatarHtml({ ism: c.user_name }, 'avatar-xs')}
                            <div class="grow">
                                <div class="t-xs fw-7">${esc(c.user_name || '')}</div>
                                <div class="t-sm" style="white-space:pre-wrap">${esc(c.text)}</div>
                            </div>
                        </div>`).join('')}
                </div>
                <form class="d-flex gap-2" onsubmit="return window.__svComment(event, ${id})">
                    <input class="input" id="comment-input" placeholder="Izoh yozing…" required>
                    <button class="btn btn-primary" style="flex:none"><i data-lucide="send"></i></button>
                </form>
            </div>`,
        footer: '<button class="btn btn-outline btn-block" onclick="cModal()">Yopish</button>',
    }));
};

window.__svComment = async (e, id) => {
    e.preventDefault();
    const el = document.getElementById('comment-input');
    const text = el?.value.trim();
    if (!text) return false;
    try {
        await api_post(`/posts/${id}/comments`, { text });
        el.value = '';
        window.__openComments(id);
        loadPosts();
    } catch (err) { showToast(err.message, 'error'); }
    return false;
};

// ══════════════════════════════════════════════════════════════════════
//  Views: profile
// ══════════════════════════════════════════════════════════════════════
// ─── Check-in kartasi (GPS orqali) ──────────────────────────────────
function checkinCard(done) {
    if (done) {
        return `
        <section class="checkin-card done">
            <div class="checkin-icon"><i data-lucide="check"></i></div>
            <div class="grow">
                <h3 class="t-lg fw-9">Bugun keldingiz! 🎉</h3>
                <p class="c-muted t-sm mt-1">Davomatingiz “Keldi” deb belgilandi. Bugungi kun uchun +10 XP.</p>
            </div>
            <span class="badge badge-green"><i data-lucide="user-check"></i> Keldi</span>
        </section>`;
    }
    return `
    <section class="checkin-card">
        <div class="checkin-icon"><i data-lucide="map-pin"></i></div>
        <div class="grow">
            <h3 class="t-lg fw-9">Bugun keldingizmi?</h3>
            <p class="c-muted t-sm mt-1">
                Telefonda <b>geolokatsiyani yoqing</b> va tugmani bosing — biz
                kolledj hududida ekaningizni tekshirib, davomatni o‘zimiz qo‘yamiz.
            </p>
            <div class="d-flex gap-2 mt-4 flex-wrap">
                <button class="btn btn-primary" id="checkin-btn" onclick="window.__checkIn(this)">
                    <i data-lucide="navigation"></i> Kelishimni belgilash
                </button>
                <span class="t-xs c-muted" id="checkin-hint" style="align-self:center"></span>
            </div>
        </div>
    </section>`;
}

window.__checkIn = async (btn) => {
    const hint = document.getElementById('checkin-hint');
    const say = (t) => { if (hint) hint.textContent = t; };

    if (!navigator.geolocation) {
        say('Bu brauzer geolokatsiyani qo‘llamaydi.');
        showToast('Geolokatsiya mavjud emas', 'error');
        return;
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:15px;height:15px"></span> Joylashuv aniqlanmoqda…';
    say('Ruxsat so‘ralmoqda…');

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await api_post('/attendance/checkin', {
                lat: pos.coords.latitude, lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            });
            if (res.checkedIn) {
                showToast(res.message || 'Keldingiz! Davomat qo‘shildi', 'success');
                if (res.points) { STATE.user.points = res.points; localStorage.setItem('lms_user', JSON.stringify(STATE.user)); updateHeaderUser(); }
                renderView('profile');
            } else {
                say(res.message || 'Kolledj hududida emasiniz');
                showToast(res.message || 'Kolledj hududida emasiniz', 'warn');
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="navigation"></i> Kelishimni belgilash';
                safeLucide(btn);
            }
        } catch (e) {
            say(e.message);
            showToast(e.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="navigation"></i> Kelishimni belgilash';
            safeLucide(btn);
        }
    }, (err) => {
        const msg = err.code === 1
            ? 'Ruxsat rad etildi. Brauzer sozlamasidan geolokatsiyani yoqing.'
            : 'Joylashuvni aniqlab bo‘lmadi. GPS yoqiqmi?';
        say(msg);
        showToast(msg, 'warn');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="navigation"></i> Kelishimni belgilash';
        safeLucide(btn);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
};

async function v_profile() {
    const u = STATE.user;
    const s = userStats(u);
    const [achs, courses, myAtt] = await Promise.all([
        getAchievements(), getCourses().catch(() => []), getMyAttendance().catch(() => []),
    ]);
    const unlocked = u.achievements || [];
    // Bugungi kunlik belgi: o'quvchi allaqachon kelganmi?
    const today = new Date().toISOString().slice(0, 10);
    const checkedIn = (myAtt || []).some(a => a.date === today || a.date?.startsWith(today));
    const isStudent = u.role === 'student';

    return `
        ${pageHead('Profil', 'Akkauntingizni boshqaring')}

        ${isStudent ? checkinCard(checkedIn) : ''}

        <div class="split split-2">
            <div class="stack">
                <section class="card card-pad-lg">
                    <div class="d-flex items-center gap-4 flex-wrap">
                        ${avatarHtml(u, 'avatar-xl')}
                        <div class="grow" style="min-width:0">
                            <h2 class="t-xl fw-9">${esc(u.ism)}</h2>
                            <div class="d-flex items-center gap-2 mt-2 flex-wrap">
                                <span class="badge ${ROLE_BADGE[u.role] || ''}">${roleLabel(u.role)}</span>
                                <span class="badge badge-orange"><i data-lucide="zap"></i> ${num(u.points)} XP</span>
                            </div>
                            <div class="t-sm c-muted mt-2">${esc(u.email)}</div>
                        </div>
                    </div>
                </section>

                ${sectionCard('Ma’lumotlarni tahrirlash', `
                    <form class="stack" onsubmit="return window.__svProfile(event)">
                        <div class="field">
                            <label class="label">Ism va familiya</label>
                            <input class="input" name="full_name" value="${esc(u.ism)}" required>
                        </div>
                        <div class="field">
                            <label class="label">Avatar</label>
                            <input type="file" accept="image/*" class="input" style="padding:8px"
                                   onchange="window.__uploadAvatar(this)">
                            <div class="form-hint mt-1">Rasm tanlang — serverga yuklanadi.</div>
                        </div>
                        <div class="field">
                            <label class="label">Yangi parol</label>
                            <input type="password" class="input" name="password" placeholder="O‘zgartirmaslik uchun bo‘sh qoldiring">
                        </div>
                        <button class="btn btn-primary"><i data-lucide="save"></i> Saqlash</button>
                    </form>`, { icon: '<i data-lucide="user-cog"></i>' })}

                ${sectionCard('Telegram', `
                    <div class="stack-sm">
                        <div class="d-flex items-center gap-3">
                            <div class="card-icon" style="background:#eaf4ff;color:#229ed9"><i data-lucide="send"></i></div>
                            <div class="grow">
                                <div class="fw-8 t-base">${u.telegramChatId ? 'Bog‘langan' : 'Bog‘lanmagan'}</div>
                                <div class="t-xs c-muted">${u.telegramChatId ? esc(u.telegramChatId) : 'Bildirishnomalar Telegram orqali olish uchun'}</div>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <input class="input grow" id="tg-chat" placeholder="Telegram chat ID">
                            <button class="btn btn-soft" onclick="window.__bindTelegram()"><i data-lucide="link"></i></button>
                        </div>
                    </div>`, { icon: '<i data-lucide="send"></i>' })}
            </div>

            <div class="stack">
                ${sectionCard('Statistika', `
                    <div class="stack-sm">
                        ${[
                            ['Ballar', num(u.points), 'zap'],
                            ['Yakunlangan dars', s.lessonsDone, 'book-open-check'],
                            ['O‘yin ballari', s.duelWins, 'gamepad-2'],
                            ['Yutuqlar', `${unlocked.length}/${achs.length}`, 'award'],
                        ].map(([l, v, ic]) => `
                        <div class="list-row" style="padding:10px 0">
                            <div class="card-icon" style="width:32px;height:32px"><i data-lucide="${ic}"></i></div>
                            <div class="grow"><div class="t-sm fw-7">${l}</div></div>
                            <span class="fw-9">${v}</span>
                        </div>`).join('')}
                    </div>`, { icon: '<i data-lucide="chart-no-axes-column"></i>' })}

                ${sectionCard('Yutuqlar', `
                    <div class="grid grid-2" style="gap:10px">
                        ${achs.map(a => {
                            const got = unlocked.includes(a.id);
                            return `
                            <div class="card card-pad-sm ${got ? RARITY_META[a.rarity]?.cls || '' : ''}" style="${got ? '' : 'opacity:.5;filter:grayscale(1)'}">
                                <div class="d-flex items-center gap-2">
                                    <div style="font-size:1.5rem">${esc(a.icon || '🏆')}</div>
                                    <div style="min-width:0">
                                        <div class="t-xs fw-8 truncate">${esc(a.title)}</div>
                                        <div class="t-xs c-soft">${got ? 'Ochilgan' : 'Yopiq'}</div>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>`, { icon: '<i data-lucide="award"></i>' })}

                <button class="btn btn-danger btn-block" onclick="if(confirm('Chiqishni tasdiqlaysizmi?'))logout()">
                    <i data-lucide="log-out"></i> Chiqish
                </button>
            </div>
        </div>`;
}

window.__svProfile = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = { full_name: f.get('full_name') };
    if (f.get('password')) payload.password = f.get('password');
    try {
        const updated = await api_patch(`/users/${STATE.user.id}`, payload);
        STATE.user = updated;
        localStorage.setItem('lms_user', JSON.stringify(updated));
        updateHeaderUser();
        showToast('Profil saqlandi', 'success');
        renderView('profile');
    } catch (e) { showToast(e.message, 'error'); }
    return false;
};

window.__uploadAvatar = async (input) => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Rasm 2 MB dan kichik bo‘lishi kerak', 'error'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const updated = await api_patch(`/users/${STATE.user.id}`, { avatar: reader.result });
            STATE.user = updated;
            localStorage.setItem('lms_user', JSON.stringify(updated));
            updateHeaderUser();
            showToast('Avatar yangilandi', 'success');
            renderView('profile');
        } catch (e) { showToast(e.message, 'error'); }
    };
    reader.readAsDataURL(file);
};

window.__bindTelegram = async () => {
    const val = document.getElementById('tg-chat')?.value.trim();
    if (!val) { showToast('Chat ID kiriting', 'error'); return; }
    try { await api_post('/telegram/bind', { chatId: val }); showToast('Telegram bog‘landi', 'success'); renderView('profile'); }
    catch (e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════════════
//  Views: notifications
// ══════════════════════════════════════════════════════════════════════
async function v_notifications() {
    const notifs = await getNotifications();
    return `
        ${pageHead('Bildirishnomalar', notifs.length === 0 ? 'Xabarlar yo‘q' : `${notifs.filter(n => !n.seen).length} ta yangi`, notifs.length
            ? `<button class="btn btn-outline" onclick="window.__markNotifsRead()"><i data-lucide="check-check"></i> O‘qilgan deb belgilash</button>` : '')}
        ${notifs.length === 0
            ? emptyState('bell-off', 'Hali bildirishnoma yo‘q', 'Baholar, davomat va xabarlar shu yerda ko‘rinadi.')
            : `<div class="stack-sm">
                ${notifs.map(n => `
                <div class="card card-pad-sm" style="${n.seen ? '' : 'border-color:var(--blue-200);background:var(--blue-50)'}">
                    <div class="d-flex items-start gap-3">
                        <div class="card-icon ${n.type === 'warning' ? 'red' : n.type === 'success' ? 'green' : ''}" style="width:36px;height:36px">
                            <i data-lucide="${n.type === 'warning' ? 'triangle-alert' : n.type === 'success' ? 'check' : 'info'}"></i>
                        </div>
                        <div class="grow">
                            <div class="t-sm fw-6" style="line-height:1.5">${esc(n.msg)}</div>
                            <div class="t-xs c-soft mt-1">${esc(n.date || '')}</div>
                        </div>
                        ${!n.seen ? '<span class="badge badge-blue">yangi</span>' : ''}
                    </div>
                </div>`).join('')}
            </div>`}`;
}

window.__markNotifsRead = async () => {
    try {
        await api_post('/notifications/read');
        STATE.notifCount = 0;
        updateNotifBadges();
        showToast('Barchasi o‘qilgan deb belgilandi', 'success');
        renderView('notifications');
    } catch (e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════════════
//  Views: settings
// ══════════════════════════════════════════════════════════════════════
async function v_settings() {
    const s = await getSettingsAPI();
    const canToken = ['admin', 'tech_admin'].includes(STATE.user.role);
    return `
        ${pageHead('Sozlamalar', 'Platforma sozlamalari')}

        <div class="split split-half">
            ${sectionCard('Umumiy', `
                <div class="stack">
                    <div class="field">
                        <label class="label">Platforma nomi</label>
                        <input class="input" id="set-name" value="${esc(s.platformName || "O’quv.uz")}">
                    </div>
                    <div class="d-flex items-center justify-between list-soft">
                        <div>
                            <div class="fw-8 t-base">Ro‘yxatdan o‘tish</div>
                            <div class="t-xs c-muted">Yangi foydalanuvchilar qo‘shilishi</div>
                        </div>
                        <button class="switch ${s.allowRegistration ? 'on' : ''}" id="set-reg"
                                onclick="this.classList.toggle('on')"></button>
                    </div>
                    <button class="btn btn-primary" onclick="window.__saveSettings()">
                        <i data-lucide="save"></i> Saqlash
                    </button>
                </div>`, { icon: '<i data-lucide="settings"></i>' })}

            ${sectionCard('Geolokatsiya', `
                <div class="stack">
                    <div class="field">
                        <label class="label">Kolledj kengligi (latitude)</label>
                        <input class="input" id="set-lat" value="${esc(s.collegeLat || '')}" placeholder="41.311081">
                    </div>
                    <div class="field">
                        <label class="label">Kolledj uzunligi (longitude)</label>
                        <input class="input" id="set-lng" value="${esc(s.collegeLng || '')}" placeholder="69.240562">
                    </div>
                    <div class="field">
                        <label class="label">Ruxsat etilgan radius (metr)</label>
                        <input class="input" id="set-radius" type="number" value="${num(s.attendanceRadius) || 200}">
                    </div>
                    <button class="btn btn-outline" onclick="window.__saveGeo()">
                        <i data-lucide="map-pin"></i> Geolokatsiyani saqlash
                    </button>
                </div>`, { icon: '<i data-lucide="map-pin"></i>' })}

            ${canToken ? sectionCard('Telegram bot', `
                <div class="stack">
                    <div class="field">
                        <label class="label">Bot token</label>
                        <input class="input" id="set-token" value="${esc(s.telegramBotToken || '')}" placeholder="123456:ABC-DEF…">
                        <div class="form-hint mt-1">Token faqat adminlar uchun ko‘rinadi.</div>
                    </div>
                </div>`, { icon: '<i data-lucide="send"></i>' }) : ''}
        </div>`;
}

window.__saveSettings = async () => {
    try {
        const saved = await api_patch('/settings', {
            platformName: document.getElementById('set-name').value,
            allowRegistration: document.getElementById('set-reg').classList.contains('on'),
        });
        // Server javobiga ishonamiz — bu holatda ro'yxat ekrani ham darhol
        // to'g'ri ishlaydi, qayta yuklashsiz.
        applyRegistrationGate(saved);
        syncLandingData().catch(() => {});
        showToast('Sozlamalar saqlandi', 'success');
    } catch (e) { showToast(e.message, 'error'); }
};

window.__saveGeo = async () => {
    try {
        await api_patch('/settings', {
            collegeLat: document.getElementById('set-lat').value,
            collegeLng: document.getElementById('set-lng').value,
            attendanceRadius: Number(document.getElementById('set-radius').value),
        });
        showToast('Geolokatsiya saqlandi', 'success');
    } catch (e) { showToast(e.message, 'error'); }
};

window.__saveToken = async () => {
    try {
        await api_patch('/settings', { telegramBotToken: document.getElementById('set-token').value });
        showToast('Token saqlandi', 'success');
    } catch (e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════════════
//  Route table
// ══════════════════════════════════════════════════════════════════════
const VIEWS = {
    'student-dashboard': d_student,
    'ustoz-dashboard': d_ustoz,
    'admin-dashboard': d_admin,
    'director-dashboard': d_director,
    'parent-dashboard': d_parent,
    courses: v_courses,
    'course-detail': v_cdetail,
    users: v_users,
    groups: v_groups,
    attendance: () => (isStaff() ? v_attendance() : v_student_attendance()),
    grades: v_grades,
    reports: v_reports,
    analytics: v_analytics,
    leaderboard: v_lead,
    support: v_support,
    chat: v_chat,
    'staff-chat': v_staff_chat,
    library: v_library,
    shop: v_shop,
    pending: v_pending,
    game: v_game,
    questions: v_questions,
    schedule: v_schedule,
    posts: v_posts,
    profile: v_profile,
    notifications: v_notifications,
    settings: v_settings,
};

// ══════════════════════════════════════════════════════════════════════
//  Onboarding
// ══════════════════════════════════════════════════════════════════════
let INTRO_SLIDE = 0;

function checkOnboarding() {
    if (localStorage.getItem('lms_intro_seen')) return;
    const el = document.getElementById('intro-modal');
    if (el) { el.classList.remove('hidden'); INTRO_SLIDE = 0; }
}

function closeIntro() {
    localStorage.setItem('lms_intro_seen', '1');
    document.getElementById('intro-modal')?.classList.add('hidden');
}

function introShow(n) {
    INTRO_SLIDE = n;
    document.querySelectorAll('#intro-modal .intro-slide').forEach((s, i) => s.classList.toggle('active', i === n));
    document.querySelectorAll('#intro-dots .slide-dot').forEach((d, i) => d.classList.toggle('active', i === n));
    const btn = document.getElementById('btn-next-intro');
    if (btn) btn.innerHTML = n >= 2 ? 'Boshlash <i data-lucide="rocket"></i>' : 'Keyingisi <i data-lucide="arrow-right"></i>';
    safeLucide(btn);
}

// ══════════════════════════════════════════════════════════════════════
//  Wiring
// ══════════════════════════════════════════════════════════════════════
function setupInteractions() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            window.location.hash = link.getAttribute('data-link');
        }
        if (e.target.closest('#sidebar-close')) toggleSidebar(false);
        if (e.target.closest('#mobile-menu-btn')) toggleSidebar();
        if (e.target.closest('#mobile-notif-btn')) window.location.hash = 'notifications';
    });

    window.addEventListener('hashchange', handleRoute);

    // Esc closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('modal-root')?.classList.contains('hidden')) cModal();
    });

    // ── Login form ──
    const logForm = document.getElementById('form-login');
    if (logForm) {
        logForm.onsubmit = async (e) => {
            e.preventDefault();
            const errBox = document.getElementById('login-error-card');
            const btn = logForm.querySelector('button[type="submit"]');
            const email = document.getElementById('log-email')?.value.trim();
            const pass = document.getElementById('log-pass')?.value || '';
            errBox?.classList.add('hidden');

            if (!email || !pass) {
                errBox?.classList.remove('hidden');
                return;
            }
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span> Kirilmoqda…';
            }
            try {
                const user = await login(email, pass);
                STATE.user = user;
                localStorage.setItem('lms_user', JSON.stringify(user));
                logForm.reset();
                window.location.hash = DASHBOARD_VIEW[user.role] || 'student-dashboard';
            } catch (err) {
                // pending / rejected hisoblar 403 qaytaradi — maxsus ko'rsatamiz
                if (err.status === 403) {
                    const box = document.getElementById('login-pending-card');
                    box?.classList.remove('hidden');
                    const txt = document.getElementById('login-pending-msg');
                    if (txt) txt.textContent = err.message || 'Hisobingiz hali tasdiqlanmagan.';
                } else {
                    errBox?.classList.remove('hidden');
                    const span = errBox?.querySelector('span');
                    if (span) span.textContent = err.message || 'Email yoki parol xato!';
                }
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Tizimga kirish';
                }
            }
        };
    }

    // Register form
    const regForm = document.getElementById('form-register');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const errBox = document.getElementById('reg-error-card');
            const errMsg = document.getElementById('reg-error-msg');
            try {
                const name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const pass = document.getElementById('reg-pass').value.trim();
                const groupId = document.getElementById('reg-group')?.value || null;

                if (!name || !email) throw new Error('Ism va email to‘ldirilishi shart');
                if (pass.length < 6) throw new Error('Parol kamida 6 belgi bo‘lishi kerak');

                const user = await register(name, email, pass, groupId);
                STATE.user = user;
                if (user?.status === 'pending' || user?.status === 'rejected') {
                    const box = document.getElementById('reg-pending-card');
                    box?.classList.remove('hidden');
                    regForm.reset();
                    window.setTimeout(() => { window.location.hash = 'login'; }, 2600);
                    return;
                }
                window.location.hash = DASHBOARD_VIEW[user.role] || 'student-dashboard';
                regForm.reset();
            } catch (err) {
                errBox?.classList.remove('hidden');
                if (errMsg) errMsg.textContent = err.message;
            }
        };
    }

    // Onboarding buttons
    document.getElementById('btn-next-intro')?.addEventListener('click', () => {
        if (INTRO_SLIDE >= 2) closeIntro();
        else introShow(INTRO_SLIDE + 1);
    });
    document.getElementById('btn-skip-intro')?.addEventListener('click', closeIntro);

    // Poll notifications
    setInterval(refreshNotifications, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshNotifications(); });

    // Pause lesson timer when the tab is hidden so students don’t lose time
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateLessonTimerUI();
    });
}

async function renderRegisterGroups() {
    const box = document.getElementById('reg-group-container');
    if (!box) return;
    try {
        // `/groups` autentifikatsiya talab qiladi, ro'yxatdan o'tayotgan
        // foydalanuvchi esa hali kirmagan — shuning uchun ochiq endpoint.
        const groups = await api_get('/public/groups');
        if (!groups.length) { box.innerHTML = ''; return; }
        box.innerHTML = `
            <label class="label" for="reg-group">Guruh</label>
            <div class="input-icon">
                <i data-lucide="users-round"></i>
                <select class="select" id="reg-group">
                    <option value="">Guruhsiz</option>
                    ${groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}
                </select>
            </div>
            <div class="form-hint mt-1">Noto‘g‘ri guruh tanlansa keyinchalik tuzatiladi.</div>`;
        safeLucide(box);
    } catch (e) { box.innerHTML = ''; }
}

/**
 * Admin ro'yxatdan o'tishni yopgan bo'lsa, "Yaratish" havolasi va
 * shakl ko'rsatilmaydi — aks holda foydalanuvchi 403 olib, nima
 * qilishini bilmay qolardi.
 */
function applyRegistrationGate(settings) {
    STATE.allowRegistration = !settings || settings.allowRegistration !== false;
    const open = STATE.allowRegistration;
    const link = document.getElementById('link-register');
    const note = document.getElementById('register-closed-note');
    if (link) {
        link.classList.toggle('hidden', !open);
        if (open) link.removeAttribute('aria-disabled');
        else link.setAttribute('aria-disabled', 'true');
    }
    note?.classList.toggle('hidden', open);
    const card = document.getElementById('reg-closed-card');
    if (card) card.classList.toggle('hidden', open);
    const submit = document.querySelector('#form-register button[type=submit]');
    if (submit) submit.disabled = !open;   // `.btn:disabled` allaqachon stil beradi
}

function hideSplash() {
    const s = document.getElementById('splash-screen');
    if (!s) return;
    s.classList.add('is-hidden');
    setTimeout(() => s.remove(), 600);
}

async function boot() {
    setupInteractions();
    safeLucide(document);

    await loadUserData();
    await Promise.all([
        syncLandingData().catch(() => {}),
        // Sozlamalar ochiq endpoint — token kirganda ham, kirmaganda ham
        // kerak (ro'yxatdan o'tish oynasi kirish huquqiga ega emas).
        api_get('/settings').then(applyRegistrationGate).catch(() => {}),
    ]);

    if (!window.location.hash) {
        window.location.hash = STATE.user ? DASHBOARD_VIEW[STATE.user.role] : 'home';
    }
    await handleRoute();

    if (STATE.user) {
        refreshNotifications();
        checkOnboarding();
    }
    hideSplash();
}

// Hide splash once lucide is ready (icons inside it)
document.addEventListener('DOMContentLoaded', () => {
    const iv = setInterval(() => { if (window.lucide) { clearInterval(iv); safeLucide(document); } }, 50);
    setTimeout(() => { clearInterval(iv); safeLucide(document); }, 1200);
});

boot();
