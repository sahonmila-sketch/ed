// ============================================================
// app.js — Main entry point (ES Module)
// ============================================================
import { setAuth, getAuthUser, getAuthToken, api_get, api_post, api_patch, api_del } from './modules/api.js';
import { safeLucide, showToast, cModal, openModal, toggleSidebar } from './modules/ui.js';
import { login, register, logout as authLogout, fetchMe } from './modules/auth.js';
import { renderLanding, syncLandingData, LANDING_DATA, INITIAL_LANDING, openLandingEditor, saveLandingSettings } from './modules/landing.js';

// Export functions to global scope for inline onclick handlers
window.safeLucide = safeLucide;
window.showToast = showToast;
window.cModal = cModal;
window.openModal = openModal;
window.toggleSidebar = toggleSidebar;
window.logout = () => { authLogout(); window.removeUserSession(); };
window.openLandingEditor = openLandingEditor;
window.saveLandingSettings = saveLandingSettings;

// ─── Global STATE ──────────────────────────────────────────
let STATE = { user: null, view: 'login', activeTicketId: null, activeCourseId: null };
window.STATE = STATE;

// ─── Compatibility: old API_BASE / syncBackend ─────────────
const API_BASE = '/api';

// ─── Helper: get user data from server ─────────────────────
window.removeUserSession = () => {
    STATE.user = null;
    localStorage.removeItem('lms_user');
    document.getElementById('mobile-bottom-nav')?.classList.add('hidden');
    document.getElementById('mobile-header')?.classList.add('hidden');
};

async function loadUserData() {
    const token = getAuthToken();
    if (!token) { STATE.user = null; return; }
    try {
        const user = await fetchMe();
        STATE.user = user;
        localStorage.setItem('lms_user', JSON.stringify(user));
    } catch {
        STATE.user = null;
        setAuth(null, null);
    }
}

// ─── TRANSLATIONS ──────────────────────────────────────────
const TRANSLATIONS = {
    uz: {
        dashboard: "Boshqaruv", courses: "Kurslar", posts: "Postlar", support: "Yordam",
        profile: "Profil", chat: "Guruh Chat", leaderboard: "Reyting", library: "Kutubxona",
        duel: "Duel 1vs1", game: "Mini O'yin", attendance: "Davomat", users: "Foydalanuvchilar",
        groups: "Guruhlar", questions: "Savollar", analytics: "Analitika", notifications: "Bildirishnomalar",
        grades: "Baho va o'zlashtirish", parent: "Ota-ona", settings: "Sozlamalar",
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
        grades: "Оценки и успеваемость", parent: "Родитель", settings: "Настройки",
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

// ─── 20-MIN LESSON TIMER ───────────────────────────────────
let LESSON_TIMER_INTERVAL = null;
let LESSON_TIMER_SEC = 0;
let LESSON_TIMER_ACTIVE = false;
let LESSON_TIMER_LESSON_ID = null;
let LESSON_SESSION_ID = null;

function startLessonTimer(lessonId) {
    if (LESSON_TIMER_INTERVAL) clearInterval(LESSON_TIMER_INTERVAL);
    LESSON_TIMER_SEC = 0;
    LESSON_TIMER_ACTIVE = true;
    LESSON_TIMER_LESSON_ID = lessonId;
    updateLessonTimerUI();

    // Start server-side timer
    api_post(`/lessons/${lessonId}/start`).then(data => {
        LESSON_SESSION_ID = data.sessionId;
    }).catch(() => {});

    LESSON_TIMER_INTERVAL = setInterval(() => {
        if (!LESSON_TIMER_ACTIVE) return;
        LESSON_TIMER_SEC++;
        updateLessonTimerUI();
        if (LESSON_TIMER_SEC >= 1200) {
            clearInterval(LESSON_TIMER_INTERVAL);
            LESSON_TIMER_ACTIVE = false;
            completeLessonServer(lessonId, LESSON_SESSION_ID);
        }
    }, 1000);
}

async function completeLessonServer(lessonId, sessionId) {
    try {
        const data = await api_post(`/lessons/${lessonId}/complete`, { sessionId });
        if (data.xpGained > 0) {
            const u = STATE.user;
            if (u) u.points = (u.points || 0) + data.xpGained;
            showToast(`+${data.xpGained} XP: Dars yakunlandi!`);
        }
        const timerEl = document.getElementById('lesson-timer-box');
        if (timerEl) {
            timerEl.className = 'lesson-timer-box done';
            timerEl.innerHTML = `<span class="timer-icon">✅</span><span>${t('timerDone')}</span>`;
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function stopLessonTimer() {
    LESSON_TIMER_ACTIVE = false;
    if (LESSON_TIMER_INTERVAL) clearInterval(LESSON_TIMER_INTERVAL);
    LESSON_TIMER_SEC = 0;
    LESSON_TIMER_LESSON_ID = null;
    LESSON_SESSION_ID = null;
}

function pauseLessonTimer() {
    if (!LESSON_TIMER_ACTIVE) return;
    LESSON_TIMER_ACTIVE = false;
    LESSON_TIMER_SEC = 0;
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

document.addEventListener('visibilitychange', () => {
    if (document.hidden && LESSON_TIMER_ACTIVE) pauseLessonTimer();
});
window.addEventListener('blur', () => {
    if (LESSON_TIMER_ACTIVE) pauseLessonTimer();
});

// ─── Helper: fetch all app data ────────────────────────────
async function getPosts() { return api_get('/posts'); }
async function getCourses() { return api_get('/courses'); }
async function getTickets() { return api_get('/tickets'); }
async function getGroups() { return api_get('/groups'); }
async function getAttendance() { return api_get('/attendance'); }
async function getLeaderboard() { return api_get('/users/leaderboard'); }
async function getQuestions() { return api_get('/questions'); }
async function getBooks() { return api_get('/books'); }
async function getAchievements() { return api_get('/achievements'); }
async function getNotifications() { return api_get('/notifications'); }
async function getSettingsAPI() { return api_get('/settings'); }
async function getMyAttendance() { return api_get('/attendance/my'); }
async function getGrades() { return api_get('/grades'); }
async function getStudentGrades(sid) { return api_get(`/grades/student/${sid}`); }
async function getParentChild() { return api_get('/parent/child'); }
async function getParentAtt() { return api_get('/parent/child/attendance'); }

// ─── POINTS & ACHIEVEMENTS ────────────────────────────────
let LAST_POINT_TIME = 0;

async function addPoints(pts, reason = "", category = "other") {
    const nowTime = Date.now();
    if (nowTime - LAST_POINT_TIME < 2000) return;
    LAST_POINT_TIME = nowTime;

    try {
        const data = await api_post('/xp/add', { amount: pts, category, reason });
        if (data.xpGained > 0) {
            STATE.user = { ...STATE.user, points: data.totalXp, achievements: data.newAchievements || STATE.user.achievements };
            localStorage.setItem('lms_user', JSON.stringify(STATE.user));
            showToast(`+${data.xpGained} XP: ${reason}`, 'success');
        }
        if (data.newAchievements?.length > 0) {
            data.newAchievements.forEach(id => {
                getAchievements().then(achs => {
                    const a = achs.find(x => x.id === id);
                    if (a) showAchievementUnlock(a);
                });
            });
        }
    } catch (e) { showToast(e.message, 'error'); }
}

const getUserStats = (u) => {
    const completedLessons = Object.keys(u.progress || {}).length;
    const postsCount = 0;
    const presentCount = 0;
    const attendancePercent = 100;
    let level = 1;
    let totalXP = u.points || 0;
    while (totalXP >= 100 * (Math.pow(2, level) - 1)) level++;
    const currentLevelThreshold = 100 * (Math.pow(2, level - 1) - 1);
    const nextLevelThreshold = 100 * (Math.pow(2, level) - 1);
    const progressXP = totalXP - currentLevelThreshold;
    const levelRange = nextLevelThreshold - currentLevelThreshold;
    const levelPercent = Math.min(100, Math.round((progressXP / levelRange) * 100));
    return {
        points: u.points || 0, completedLessons,
        duelWins: u.duelWins || 0, attendance: attendancePercent,
        posts: postsCount, level, levelPercent
    };
};

const showAchievementUnlock = (ach) => {
    const div = document.createElement('div');
    div.className = 'fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none';
    div.innerHTML = `
        <div class="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-indigo-50 text-center animate-achievement-pop pointer-events-auto relative mx-4">
            <div class="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] md:rounded-[4.5rem] blur-xl animate-pulse"></div>
            <div class="relative">
                <div class="text-5xl md:text-7xl mb-4 md:mb-6">${ach.icon}</div>
                <p class="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">Yangi Yutuq!</p>
                <h2 class="text-2xl md:text-4xl font-black text-slate-800 mb-2 md:mb-4">${ach.title}</h2>
                <p class="text-slate-500 font-bold text-sm md:text-base mb-6 md:mb-8">${ach.desc}</p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-slate-900 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black text-sm">Ajoyib!</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);
};

// ─── RENDER VIEWS ──────────────────────────────────────────
// All view functions are the same as before but use async API calls
// For brevity, key views are kept here

const VIEW_TITLES = {
    'courses': { uz: 'Kurslarim', ru: 'Мои курсы' },
    'posts': { uz: 'Postlar', ru: 'Посты' },
    'profile': { uz: 'Profilim', ru: 'Мой профиль' },
    'leaderboard': { uz: 'Reyting', ru: 'Рейтинг' },
    'support': { uz: "Yordam Markazi", ru: 'Центр поддержки' },
    'users': { uz: 'Foydalanuvchilar', ru: 'Пользователи' },
    'groups': { uz: 'Guruhlar', ru: 'Группы' },
    'attendance': { uz: 'Davomat', ru: 'Посещаемость' },
    'reports': { uz: 'Hisobotlar', ru: 'Отчёты' },
    'grades': { uz: 'Baholar', ru: 'Оценки' },
    'chat': { uz: 'Chat', ru: 'Чат' },
    'notifications': { uz: 'Bildirishnomalar', ru: 'Уведомления' },
    'library': { uz: 'Kutubxona', ru: 'Библиотека' },
    'duel': { uz: 'Duel', ru: 'Дуэль' },
    'game': { uz: 'O\'yin', ru: 'Игра' },
    'analytics': { uz: 'Tahlil', ru: 'Аналитика' },
    'questions_mgmt': { uz: 'Savollar', ru: 'Вопросы' },
    'staff-chat': { uz: 'Jamoa Chati', ru: 'Командный чат' },
    'schedule': { uz: 'Jadval', ru: 'Расписание' },
    'settings': { uz: 'Sozlamalar', ru: 'Настройки' },
    'student-dashboard': { uz: 'Dashboard', ru: 'Панель' },
    'ustoz-dashboard': { uz: 'Dashboard', ru: 'Панель' },
    'admin-dashboard': { uz: 'Dashboard', ru: 'Панель' },
    'tech_admin-dashboard': { uz: 'Dashboard', ru: 'Панель' },
    'director-dashboard': { uz: 'Dashboard', ru: 'Панель' },
    'parent-dashboard': { uz: 'Dashboard', ru: 'Панель' },
    'course-detail': { uz: 'Kurs Tafsilotlari', ru: 'Детали курса' }
};

function renderView(view) {
    if (view === 'home') {
        const lc = document.getElementById('landing-content');
        if (lc) { lc.innerHTML = renderLanding(); safeLucide(lc); }
        return;
    }
    const a = document.getElementById('dynamic-view-area');
    a.innerHTML = '';
    a.className = window.innerWidth < 1024 ? 'view-slide-in' : 'animate-fade';
    if (view !== 'course-detail') stopLessonTimer();

    const m = {
        'student-dashboard': d_student,
        'ustoz-dashboard': d_ustoz,
        'admin-dashboard': d_admin,
        'tech_admin-dashboard': d_tech_admin,
        'director-dashboard': d_director,
        'parent-dashboard': d_parent,
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
        'grades': v_grades,
        'chat': v_chat,
        'notifications': v_notifications,
        'library': v_library,
        'duel': v_duel,
        'game': v_game,
        'analytics': d_director,
        'questions_mgmt': v_questions_mgmt,
        'staff-chat': v_staff_chat,
        'schedule': v_schedule,
        'settings': v_settings
    };

    if (m[view]) {
        const result = m[view]();
        const titleKey = VIEW_TITLES[view];
        const title = titleKey ? (localStorage.getItem('lms_lang') === 'ru' ? titleKey.ru : titleKey.uz) : '';
        const headerHTML = title ? `
            <div class="dashboard-view rounded-2xl p-4 md:p-6 mb-6 lg:mb-8 flex items-center justify-between">
                <div>
                    <h1 class="page-title">${escapeHtml(title)}</h1>
                    <p class="page-title-hint mt-0.5">${STATE.user?.ism || ''}</p>
                </div>
                <div class="chip-stats">${escapeHtml((STATE.user?.role || '').replace('_', ' '))}</div>
            </div>` : '';
        if (result instanceof Promise) {
            a.innerHTML = headerHTML + '<div class="flex items-center justify-center py-20"><div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>';
            result.then(html => { a.innerHTML = headerHTML + html; safeLucide(a); });
        } else {
            a.innerHTML = headerHTML + result;
            safeLucide(a);
        }
    } else {
        a.innerHTML = `<div class="text-center py-20"><i data-lucide="search-x" class="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-4"></i><h2 class="text-xl md:text-2xl font-black text-slate-800">Sahifa topilmadi</h2></div>`;
        safeLucide(a);
    }
}

// ─── MOBILE NAV ────────────────────────────────────────────
function renderMobileNav() {
    if (!STATE.user) { document.getElementById('mobile-bottom-nav')?.classList.add('hidden'); return; }
    document.getElementById('mobile-bottom-nav')?.classList.remove('hidden');
    const nav = document.getElementById('mobile-bottom-nav');
    if (!nav) return;
    const r = STATE.user.role;
    const canChat = STATE.user.groupId && ['student', 'ustoz'].includes(r);
    const items = [
        { id: `${r}-dashboard`, icon: 'layout-dashboard', label: t('dashboard') },
        { id: 'courses', icon: 'book', label: t('courses') },
        { id: 'grades', icon: 'graduation-cap', label: t('grades') },
        ...(canChat ? [{ id: 'chat', icon: 'messages-square', label: t('chat') }] : []),
        { id: 'notifications', icon: 'bell', label: t('notifications'), anchor: true },
        { id: 'profile', icon: 'user', label: t('profile') }
    ].slice(0, 5);
    const activeId = STATE.view || `${r}-dashboard`;
    nav.innerHTML = items.map(item => `
        <a href="#${item.id}" class="${activeId === item.id ? 'active' : ''}"${item.anchor ? ' data-notif-anchor' : ''}>
            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            <span>${item.label}</span>
        </a>
    `).join('');
    safeLucide(nav);
}

// ─── SIDEBAR ───────────────────────────────────────────────
const SECTION_LABELS = {
    main: { uz: "Bosh menyu", ru: "Главное" },
    study: { uz: "O'qish", ru: "Учёба" },
    community: { uz: "Aloqa", ru: "Общение" },
    admin: { uz: "Boshqaruv", ru: "Управление" },
    account: { uz: "Hisob", ru: "Аккаунт" }
};
const L = () => localStorage.getItem('lms_lang') === 'ru';
const SEC = (k) => SECTION_LABELS[k][L() ? 'ru' : 'uz'];

function renderSidebar() {
    if (!STATE.user) return;
    document.getElementById('sidebar-name').innerText = STATE.user.ism;
    const r = STATE.user.role;
    const roleLabel = t(r) || r.replace('_', ' ').toUpperCase();
    document.getElementById('sidebar-role').innerText = roleLabel.toUpperCase();
    const avatarTxt = STATE.user.avatar
        ? `<img src="${STATE.user.avatar}" class="w-full h-full object-cover rounded-[14px]">`
        : STATE.user.ism[0].toUpperCase();
    document.getElementById('sidebar-avatar').innerHTML = avatarTxt;

    const sections = [];

    const mainLinks = [{ id: `${r}-dashboard`, icon: 'layout-dashboard', label: t('dashboard') }];
    mainLinks.push({ id: 'notifications', icon: 'bell', label: t('notifications'), anchor: true });
    sections.push({ label: SEC('main'), links: mainLinks });

    const studyLinks = [];
    studyLinks.push({ id: 'courses', icon: 'book', label: t('courses') });
    if (r === 'student') {
        studyLinks.push({ id: 'attendance', icon: 'calendar-check', label: t('attendance') });
        if (STATE.user.groupId) studyLinks.push({ id: 'chat', icon: 'messages-square', label: t('chat') });
    }
    if (['student', 'parent', 'ustoz', 'admin', 'tech_admin', 'director'].includes(r)) {
        studyLinks.push({ id: 'grades', icon: 'graduation-cap', label: t('grades') });
    }
    if (r === 'ustoz') {
        studyLinks.push({ id: 'schedule', icon: 'calendar', label: t('schedule') });
        if (STATE.user.groupId) studyLinks.push({ id: 'chat', icon: 'messages-square', label: t('chat') });
    }
    if (r === 'student') {
        studyLinks.push({ id: 'leaderboard', icon: 'trophy', label: t('leaderboard') });
        studyLinks.push({ id: 'library', icon: 'library', label: t('library') });
        studyLinks.push({ id: 'duel', icon: 'zap', label: t('duel') });
        studyLinks.push({ id: 'game', icon: 'gamepad-2', label: t('game') });
    }
    if (r === 'ustoz') studyLinks.push({ id: 'library', icon: 'library', label: t('library') });
    if (studyLinks.length > 1) sections.push({ label: SEC('study'), links: studyLinks });

    const commLinks = [{ id: 'posts', icon: 'message-square', label: t('posts') }];
    if (STATE.user.groupId && !['student', 'ustoz'].includes(r)) commLinks.push({ id: 'chat', icon: 'messages-square', label: t('chat') });
    if (['admin', 'tech_admin', 'director', 'ustoz'].includes(r)) commLinks.push({ id: 'staff-chat', icon: 'message-circle', label: "Jamoa Chati" });
    sections.push({ label: SEC('community'), links: commLinks });

    if (r === 'admin' || r === 'tech_admin') {
        sections.push({ label: SEC('admin'), links: [
            { id: 'users', icon: 'users', label: t('users') },
            { id: 'groups', icon: 'database', label: t('groups') },
            { id: 'questions_mgmt', icon: 'list-checks', label: t('questions') },
            { id: 'reports', icon: 'clipboard-list', label: t('reports') },
            { id: 'analytics', icon: 'bar-chart-3', label: t('analytics') },
            { id: 'settings', icon: 'settings', label: t('settings') }
        ]});
    } else if (r === 'director') {
        sections.push({ label: SEC('admin'), links: [
            { id: 'reports', icon: 'clipboard-list', label: t('reports') },
            { id: 'analytics', icon: 'bar-chart-3', label: t('analytics') }
        ]});
    } else if (r === 'ustoz') {
        sections.push({ label: SEC('admin'), links: [
            { id: 'groups', icon: 'users', label: t('groups') },
            { id: 'reports', icon: 'clipboard-list', label: t('reports') },
            { id: 'analytics', icon: 'bar-chart-3', label: t('analytics') }
        ]});
    }

    sections.push({ label: SEC('account'), links: [
        { id: 'profile', icon: 'user', label: t('profile') },
        { id: 'support', icon: 'help-circle', label: t('support') }
    ]});

    const renderSection = (sec) => `
        <div class="px-3 mb-1">
            <p class="sidebar-section-label">${escapeHtml(sec.label)}</p>
        </div>
        ${sec.links.map(l => {
            const active = STATE.view === l.id;
            return `<a href="#${l.id}" class="nav-link ${active ? 'active' : ''} relative"${l.anchor ? ' data-notif-anchor' : ''}>
                <i data-lucide="${l.icon}" class="w-5 mr-3"></i>
                <span class="flex-1 truncate">${l.label}</span>
                ${l.badge ? `<span class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-md border border-white">${l.badge}</span>` : ''}
            </a>`;
        }).join('')}`;

    document.getElementById('nav-menu').innerHTML =
        sections.map(renderSection).join('<div class="my-2"></div>') +
        `<div class="mt-6 pt-4 border-t border-slate-100"><a href="#" onclick="window.logout()" class="nav-link text-red-500 hover:text-red-600"><i data-lucide="log-out" class="w-5 mr-3"></i>${t('logout')}</a></div>`;

    safeLucide(document.getElementById('sidebar-container'));
}

// ─── HANDLE ROUTE ──────────────────────────────────────────
function handleRoute() {
    let hash = window.location.hash.replace('#', '') || 'home';
    if (!STATE.user && !['register', 'login', 'home'].includes(hash)) hash = 'home';
    if (STATE.user && (hash === 'login' || hash === 'register' || hash === 'home')) {
        hash = `${STATE.user.role}-dashboard`;
    }
    STATE.view = hash;

    const wrapper = document.getElementById('dashboard-wrapper');
    const sidebar = document.getElementById('sidebar-container');
    const header = document.getElementById('mobile-header');
    const bottomNav = document.getElementById('mobile-bottom-nav');
    const mainEl = document.getElementById('main-content');

    ['login', 'register', 'home'].forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) { el.style.display = 'none'; el.style.opacity = '0'; }
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
        if (mainEl) mainEl.classList.add('auth-view');
        if (sidebar) {
            sidebar.classList.add('sidebar-hidden', '-translate-x-full');
            sidebar.classList.remove('translate-x-0', 'flex');
        }
        const ov = document.getElementById('sidebar-overlay');
        if (ov) ov.classList.add('hidden');
        if (header) header.classList.add('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');
        if (hash === 'register') renderRegisterGroups();
        if (hash === 'home') renderView('home');
    } else {
        wrapper.style.display = 'block';
        if (mainEl) mainEl.classList.remove('auth-view');
        if (sidebar) {
            sidebar.classList.remove('sidebar-hidden', '-translate-x-full', 'hidden');
            sidebar.classList.add('flex');
            sidebar.classList.add('translate-x-0');
        }
        if (header) header.classList.remove('hidden');
        renderSidebar();
        renderView(hash);
        renderMobileNav();
    }
    safeLucide();
}

// ─── REGISTER GROUPS ───────────────────────────────────────
async function renderRegisterGroups() {
    try {
        const container = document.getElementById('reg-group-container');
        if (!container) return;
        const groups = await getGroups();
        if (groups.length === 0) {
            container.innerHTML = '<p class="text-[10px] text-red-500 font-bold p-1">Hozircha guruhlar mavjud emas</p>';
            return;
        }
        container.innerHTML = `
            <div class="relative">
                <i data-lucide="users"
                    class="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 transition-colors pointer-events-none"></i>
                <select id="reg-group" class="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl pl-9 md:pl-12 pr-4 py-3 text-sm md:text-base text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all font-semibold appearance-none">
                    <option value="">Guruhsiz davom etish</option>
                    ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
            </div>
        `;
    } catch (e) {}
}

// ─── SETUP INTERACTIONS ────────────────────────────────────
function setupInteractions() {
    document.addEventListener('click', e => {
        const link = e.target.closest('[data-link]');
        if (link) { e.preventDefault(); window.location.hash = link.getAttribute('data-link'); }
    });

    const loginForm = document.getElementById('form-login');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const user = await login(
                    document.getElementById('log-email').value,
                    document.getElementById('log-pass').value
                );
                STATE.user = user;
                localStorage.setItem('lms_user', JSON.stringify(user));
                window.location.hash = `${user.role}-dashboard`;
                loginForm.reset();
            } catch (err) {
                document.getElementById('login-error-card')?.classList.remove('hidden');
            }
        };
    }

    const regForm = document.getElementById('form-register');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('reg-name').value.trim();
                const email = document.getElementById('reg-email').value.trim();
                const pass = document.getElementById('reg-pass').value.trim();
                const groupId = document.getElementById('reg-group')?.value || null;

                if (!name || !email || pass.length < 6) {
                    document.getElementById('reg-error-msg').innerText = "Barcha maydonlarni to'g'ri to'ldiring";
                    document.getElementById('reg-error-card')?.classList.remove('hidden');
                    return;
                }

                const user = await register(name, email, pass, groupId);
                STATE.user = user;
                localStorage.setItem('lms_user', JSON.stringify(user));
                showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
                window.location.hash = 'student-dashboard';
                regForm.reset();
            } catch (err) {
                document.getElementById('reg-error-msg').innerText = err.message;
                document.getElementById('reg-error-card')?.classList.remove('hidden');
            }
        };
    }

    // Sidebar overlay
    document.getElementById('sidebar-overlay')?.addEventListener('click', toggleSidebar);
    document.getElementById('mobile-menu-btn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    document.getElementById('sidebar-close')?.addEventListener('click', toggleSidebar);

    document.getElementById('nav-menu')?.addEventListener('click', e => {
        if (e.target.closest('a') && window.innerWidth < 1024) {
            document.getElementById('sidebar-container')?.classList.add('-translate-x-full');
            document.getElementById('sidebar-container')?.classList.remove('translate-x-0');
            document.getElementById('sidebar-overlay')?.classList.add('hidden');
        }
    });

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
}

// ─── ONBOARDING ────────────────────────────────────────────
function checkOnboarding() {
    if (!localStorage.getItem('intro_seen')) {
        const mdl = document.getElementById('intro-modal');
        mdl.classList.remove('hidden');
        let slide = 1;
        const fn = () => {
            document.querySelector('.intro-slide.active')?.classList.remove('active');
            document.querySelectorAll('.slide-dot').forEach(d => d.classList.remove('active'));
            const nxt = document.querySelector(`.intro-slide[data-slide="${slide}"]`);
            if (nxt) {
                nxt.classList.add('active');
                document.querySelectorAll('.slide-dot')[slide - 1]?.classList.add('active');
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

// ─── MODALS ────────────────────────────────────────────────
window.oModal = (type, lId) => {
    const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
    bg.classList.remove('hidden'); bg.classList.add('flex');
    let m = '';
    if (type === 'add-course') {
        m = `<div class="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] animate-zoom w-full max-w-lg shadow-2xl">
            <h2 class="text-2xl md:text-3xl font-black mb-6 text-slate-800">Kurs Yaratish</h2>
            <form onsubmit="window.svCourse(event)">
                <div class="space-y-4">
                    <input id="mc-t" required placeholder="Kurs nomi" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white text-sm">
                    <textarea id="mc-d" required placeholder="Kurs tavsifi..." class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white text-sm" rows="4"></textarea>
                    <button class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Kursni Saqlash</button>
                </div>
            </form>
        </div>`;
    }
    if (type === 'add-lesson') {
        m = `<div class="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] animate-zoom w-full max-w-xl shadow-2xl">
            <h2 class="text-2xl md:text-3xl font-black mb-6 text-slate-800">Yangi Dars</h2>
            <form onsubmit="window.svLesson(event)">
                <div class="space-y-4">
                    <input id="ml-top" required placeholder="Mavzu nomi" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white text-sm">
                    <input id="ml-t" required placeholder="Dars sarlavhasi" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white text-sm">
                    <input id="ml-vid" placeholder="YouTube URL" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white text-sm">
                    <textarea id="ml-c" required placeholder="Dars matni" class="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl font-bold focus:bg-white text-sm" rows="6"></textarea>
                    <button class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">Darsni Kiritish</button>
                </div>
            </form>
        </div>`;
    }
    if (type === 'read-lesson') {
        m = `<div class="p-10 text-center"><p class="text-slate-500">Yuklanmoqda...</p></div>`;
        openLessonModal(lId);
        return;
    }
    if (type === 'add-post') {
        m = `<div class="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] w-full max-w-xl animate-zoom">
            <h2 class="text-2xl md:text-3xl font-black mb-6 flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><i data-lucide="edit-3" class="w-5 h-5 md:w-6 md:h-6"></i></div>
                Yangi Post
            </h2>
            <form onsubmit="window.svPost(event)" class="space-y-4">
                <input id="p-title" required placeholder="Sarlavha" class="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl font-bold focus:ring-4 ring-indigo-50 outline-none transition-all text-sm">
                <textarea id="p-content" required placeholder="Mazmuni..." rows="5" class="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl font-semibold focus:ring-4 ring-indigo-50 outline-none transition-all resize-none text-sm"></textarea>
                <div class="flex gap-3">
                    <button type="button" onclick="window.cModal()" class="flex-1 bg-slate-100 text-slate-500 font-black py-3 rounded-2xl text-sm">Bekor qilish</button>
                    <button class="flex-[2] bg-indigo-600 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-indigo-200 text-sm">Nashr etish</button>
                </div>
            </form>
        </div>`;
    }
    if (type === 'add-tkt') {
        m = `<div class="bg-white p-6 md:p-8 rounded-[2rem] animate-zoom w-full max-w-lg">
            <h2 class="text-xl md:text-2xl font-black mb-4">Texnik Yordam</h2>
            <form onsubmit="window.svTkt(event)">
                <textarea id="m-desc" required placeholder="Nima qiyinchilik tug'ildi?" class="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mb-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-semibold text-sm" rows="4"></textarea>
                <button class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all">Yuborish</button>
            </form>
        </div>`;
    }
    if (type === 'view-tkt') {
        renderTicketModal(lId);
        return;
    }
    if (type === 'view-group-attendance') {
        renderAttendanceModal(lId);
        return;
    }
    a.innerHTML = m; safeLucide(a);
};

async function openLessonModal(lId) {
    try {
        const courses = await getCourses();
        let l = null;
        for (const c of courses) {
            const found = (c.lessons || []).find(x => x.id === lId);
            if (found) { l = { ...found, courseId: c.id }; break; }
        }
        if (!l) { openModal('<div class="p-10 text-center"><p class="text-red-500 font-black">Dars topilmadi!</p></div>'); return; }
        let ytEmbed = '';
        if (l.videoUrl) {
            let vid = l.videoUrl.split('v=')[1] || l.videoUrl.split('/').pop();
            if (vid) {
                const ap = vid.indexOf('&');
                if (ap !== -1) vid = vid.substring(0, ap);
                ytEmbed = `<div class="video-container mb-6 md:mb-8"><iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
            }
        }
        const html = `
        <div class="bg-white p-0 rounded-[2rem] md:rounded-[3rem] max-h-[90vh] md:max-h-[92vh] overflow-y-auto w-full max-w-4xl animate-slide-up shadow-2xl border border-white relative">
            <div class="sticky top-0 bg-white/80 backdrop-blur-md p-4 md:p-6 border-b border-slate-100 flex justify-between items-center z-20">
                <div>
                    <p class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">${l.topic || 'Mavzu: Kirish'}</p>
                    <h2 class="text-xl md:text-3xl font-black text-slate-800">Dars: ${l.title}</h2>
                </div>
                <button onclick="window.cModal()" class="bg-slate-100 p-2 md:p-3 rounded-xl md:rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"><i data-lucide="x" class="w-5 h-5 md:w-6 md:h-6"></i></button>
            </div>
            <div class="p-6 md:p-10">
                <div class="max-w-3xl mx-auto">
                    ${STATE.user?.role === 'student' ? `
                    <div id="lesson-timer-box" class="lesson-timer-box mb-6 md:mb-10">
                        <div class="timer-ring-wrap">
                            <svg viewBox="0 0 44 44" class="timer-ring">
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#e0e7ff" stroke-width="4"/>
                                <circle cx="22" cy="22" r="18" fill="none" stroke="#4f46e5" stroke-width="4" stroke-dasharray="113" stroke-dashoffset="113" stroke-linecap="round" style="transition:stroke-dashoffset 1s linear;transform:rotate(-90deg);transform-origin:center"/>
                            </svg>
                            <span class="timer-text">0:00</span>
                        </div>
                        <div class="timer-msg">${t('timerMsg')} <b>0%</b></div>
                    </div>` : ''}
                    <div class="mb-4 md:mb-6 p-3 md:p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-2xl">
                        <p class="text-indigo-600 font-bold text-sm md:text-base">Mavzu tavsifi: <span class="text-slate-700">${l.topic || ''}</span></p>
                    </div>
                    <div class="prose max-w-none text-slate-700 leading-relaxed font-medium text-sm md:text-lg whitespace-pre-wrap mb-6 md:mb-10">${l.content}</div>
                    ${ytEmbed ? `<div class="mb-8 md:mb-12"><h3 class="text-xl md:text-2xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2"><i data-lucide="play-circle" class="text-indigo-600 w-6 h-6 md:w-8 md:h-8"></i> Video Darslik</h3>${ytEmbed}</div>` : ''}
                    <div class="mt-10 md:mt-16 pt-6 md:pt-10 border-t border-slate-100">
                        <button onclick="window.completeLesson(${l.id}, ${l.courseId})" class="w-full bg-emerald-500 text-white font-black py-4 md:py-6 rounded-[2rem] md:rounded-[2.5rem] hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
                            <i data-lucide="check-circle" class="w-6 h-6 md:w-8 md:h-8"></i> Darsni yakunlash va Ball olish
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        openModal(html);
        if (STATE.user?.role === 'student') setTimeout(() => startLessonTimer(lId), 200);
    } catch (e) { showToast(e.message, 'error'); }
}

async function renderTicketModal(ticketId) {
    try {
        const tickets = await getTickets();
        const t = tickets.find(x => x.id === ticketId);
        if (!t) { openModal('<div class="p-10"><p class="text-red-500">Ticket topilmadi</p></div>'); return; }
        STATE.activeTicketId = ticketId;
        const html = `
        <div class="bg-slate-50 p-0 rounded-[2rem] max-h-[85vh] flex flex-col w-full max-w-2xl animate-zoom overflow-hidden border border-slate-200 shadow-2xl">
            <div class="glass p-4 md:p-5 border-b border-slate-200 flex justify-between items-center z-10">
                <div>
                    <h3 class="font-black text-slate-800 text-base md:text-lg">Ticket #${t.id}</h3>
                    <p class="text-xs md:text-sm text-slate-500 font-medium">${t.user_name}</p>
                </div>
                <div class="flex items-center gap-2 md:gap-3">
                    <span class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold shadow-sm">${t.status}</span>
                    <button onclick="window.cModal()" class="w-7 h-7 md:w-8 md:h-8 flex justify-center items-center bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full transition-colors"><i data-lucide="x" class="w-3.5 h-3.5 md:w-4 md:h-4"></i></button>
                </div>
            </div>
            <div class="p-4 md:p-6 overflow-y-auto flex-1 bg-white space-y-3 md:space-y-4">
                <div class="flex flex-col items-start gap-1"><div class="bg-slate-100 text-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl rounded-tl-sm max-w-[85%] font-medium text-sm">${t.message}</div></div>
                ${(t.replies || []).map(r => `<div class="flex flex-col ${r.user_id === STATE.user?.id ? 'items-end' : 'items-start'} gap-1 mb-2 animate-slide-up"><span class="text-[9px] md:text-[10px] font-bold text-slate-400 px-1">${r.user_name}</span><div class="p-3 md:p-4 rounded-xl md:rounded-2xl ${r.user_id === STATE.user?.id ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-800 rounded-tl-sm'} max-w-[85%] font-medium text-sm whitespace-pre-wrap">${r.text}</div></div>`).join('')}
            </div>
            <form onsubmit="window.svReply(event)" class="p-3 md:p-4 bg-white border-t border-slate-200 flex gap-2 items-end">
                <textarea id="reply-text" required placeholder="Javob yozish..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none focus:border-indigo-400 transition-colors resize-none text-sm" rows="1"></textarea>
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 md:p-3 rounded-xl transition-all shadow-md"><i data-lucide="send" class="w-4 h-4 md:w-5 md:h-5"></i></button>
            </form>
        </div>`;
        openModal(html);
    } catch (e) { showToast(e.message, 'error'); }
}

async function renderAttendanceModal(groupId) {
    try {
        const dbGroups = await getGroups();
        const group = dbGroups.find(g => g.id === groupId);
        if (!group) return;
        const today = new Date().toISOString().split('T')[0];
        const att = await api_get(`/attendance/date/${today}`);
        const record = att.find(a => a.groupId === groupId);
        const users = await api_get('/users');
        const html = `
        <div class="bg-white p-4 md:p-10 rounded-[2rem] md:rounded-[4rem] max-h-[95vh] overflow-y-auto w-full max-w-4xl shadow-2xl animate-slide-up border border-white">
            <div class="flex justify-between items-center mb-6 md:mb-8">
                <div>
                    <p class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Guruh Boshqaruvi</p>
                    <h2 class="text-2xl md:text-4xl font-black text-slate-800">${group.name}</h2>
                </div>
                <button onclick="window.cModal()" class="bg-slate-100 p-2 md:p-4 rounded-2xl md:rounded-3xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><i data-lucide="x" class="w-5 h-5 md:w-6 md:h-6"></i></button>
            </div>
            <div class="space-y-4">
                ${(group.studentIds || []).map((sid, idx) => {
                    const st = users.find(u => u.id === sid);
                    if (!st) return '';
                    const status = record?.records?.[sid] || null;
                    return `
                    <div class="premium-card p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] flex flex-col gap-4 bg-white border-slate-100 shadow-premium group">
                        <div class="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                            <div class="flex items-center gap-4 flex-1">
                                <div class="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center font-black text-indigo-600 border border-slate-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all text-base md:text-xl">${st.ism[0]}</div>
                                <div>
                                    <h4 class="font-black text-slate-800 text-base md:text-xl mb-1">${st.ism}</h4>
                                    <p class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #${st.id}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="attendance-switch-premium ${status === 'present' ? 'present' : (status === 'absent' ? 'absent' : '')}" onclick="window.markAttendance(${groupId}, ${sid}, this)">
                                    <div class="bg-present">Keldi</div>
                                    <div class="bg-absent">Kelmadi</div>
                                    <div class="toggle-indicator"></div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
        openModal(html);
    } catch (e) { showToast(e.message, 'error'); }
}

// ─── FORM HANDLERS ─────────────────────────────────────────
window.svCourse = async (e) => {
    e.preventDefault();
    try {
        await api_post('/courses', {
            title: document.getElementById('mc-t').value,
            description: document.getElementById('mc-d').value
        });
        cModal(); renderView(STATE.view); showToast('Kurs yaratildi');
    } catch (e) { showToast(e.message, 'error'); }
};

window.svLesson = async (e) => {
    e.preventDefault();
    try {
        const courses = await getCourses();
        const course = courses.find(c => c.id === STATE.activeCourseId);
        if (!course) return;
        course.lessons = course.lessons || [];
        const newLesson = {
            id: Date.now(),
            topic: document.getElementById('ml-top').value,
            title: document.getElementById('ml-t').value,
            videoUrl: document.getElementById('ml-vid').value,
            content: document.getElementById('ml-c').value
        };
        course.lessons.push(newLesson);
        await api_patch(`/courses/${STATE.activeCourseId}`, { lessons: course.lessons });
        cModal(); renderView(STATE.view); showToast('Dars qoshildi');
    } catch (e) { showToast(e.message, 'error'); }
};

window.completeLesson = (lId, cId) => {
    if (LESSON_TIMER_ACTIVE) {
        showToast("20 daqiqa to'liq kuting...", "info");
        return;
    }
    // Server-side completion is handled by the timer
    // Fallback: trigger server lesson complete
    api_post(`/lessons/${lId}/complete`, {}).then(data => {
        if (data.xpGained > 0) {
            showToast(`+${data.xpGained} XP: ${data.message}`);
            cModal();
            renderView('course-detail');
        } else {
            showToast(data.message || "Dars yakunlandi", "info");
        }
    }).catch(e => showToast(e.message, 'error'));
};

window.svPost = async (e) => {
    e.preventDefault();
    try {
        await api_post('/posts', {
            title: document.getElementById('p-title').value.trim(),
            content: document.getElementById('p-content').value.trim()
        });
        cModal(); renderView(STATE.view); showToast('Post yuborildi');
    } catch (e) { showToast(e.message, 'error'); }
};

window.svTkt = async (e) => {
    e.preventDefault();
    try {
        await api_post('/tickets', { message: document.getElementById('m-desc').value });
        cModal(); renderView('support'); showToast('So\'rov tushdi');
    } catch (e) { showToast(e.message, 'error'); }
};

window.svReply = async (e) => {
    e.preventDefault();
    try {
        const text = document.getElementById('reply-text').value;
        await api_post(`/tickets/${STATE.activeTicketId}/reply`, { text });
        renderTicketModal(STATE.activeTicketId);
    } catch (e) { showToast(e.message, 'error'); }
};

window.markAttendance = async (groupId, studentId, el) => {
    const today = new Date().toISOString().split('T')[0];
    const wasPresent = el.classList.contains('present');
    const wasAbsent = el.classList.contains('absent');
    let newStatus = 'present';
    if (wasPresent) newStatus = 'absent';
    else if (wasAbsent) newStatus = 'present';
    else newStatus = 'present';

    el.classList.remove('present', 'absent');
    if (newStatus === 'present') el.classList.add('present');
    else el.classList.add('absent');

    try {
        await api_post('/attendance', { groupId, date: today, studentId, status: newStatus });
    } catch (e) { showToast(e.message, 'error'); }
};

window.apprPost = async (id, approve) => {
    try {
        if (approve) {
            await api_patch(`/posts/${id}`, { approved: true });
        } else {
            await api_del(`/posts/${id}`);
        }
        showToast('Natija saqlandi');
        renderView(STATE.view);
    } catch (e) { showToast(e.message, 'error'); }
};

window.toggleLike = async (id, btn) => {
    try {
        const data = await api_post(`/posts/${id}/like`);
        const countSpan = btn.querySelector('.like-counter');
        const icon = btn.querySelector('svg');
        countSpan.innerText = data.likes;
        if (data.liked) {
            btn.classList.add('!text-pink-500');
            icon?.classList.add('fill-current');
        } else {
            btn.classList.remove('!text-pink-500');
            icon?.classList.remove('fill-current');
        }
    } catch (e) {}
};

window.dlPost = async (id) => {
    try {
        await api_del(`/posts/${id}`);
        renderView('posts');
        showToast("O'chirildi", 'error');
    } catch (e) { showToast(e.message, 'error'); }
};

window.opCourse = (id) => { STATE.activeCourseId = id; window.location.hash = 'course-detail'; };

window.changeRole = async (uid, role) => {
    try { await api_patch(`/users/${uid}`, { role }); showToast('Rol ozgartirildi'); } catch (e) {}
};

window.updateStudentPhone = async (uid, phone) => {
    try { await api_patch(`/users/${uid}`, { phone }); } catch (e) {}
};

window.uploadAvatar = (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) { showToast('Rasm hajmi juda katta (max 2MB)', 'error'); return; }
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                await api_patch(`/users/${STATE.user.id}`, { avatar: e.target.result });
                STATE.user.avatar = e.target.result;
                localStorage.setItem('lms_user', JSON.stringify(STATE.user));
                renderSidebar();
                renderView('profile');
                showToast('Rasm saqlandi!');
            } catch (err) { showToast(err.message, 'error'); }
        };
        reader.readAsDataURL(file);
    }
};

window.editName = () => {
    const newName = prompt("Ismingizni tahrirlang:", STATE.user.ism);
    if (newName && newName.trim()) {
        api_patch(`/users/${STATE.user.id}`, { full_name: newName.trim() }).then(() => {
            STATE.user.ism = newName.trim();
            localStorage.setItem('lms_user', JSON.stringify(STATE.user));
            renderSidebar();
            renderView('profile');
            showToast('Ism yangilandi');
        }).catch(e => showToast(e.message, 'error'));
    }
};

// ─── VIEW FUNCTIONS (HTML rendering) ───────────────────────

// These are simplified versions that fetch from server API
// For production, all views should be refactored to async

function d_student() {
    const u = STATE.user;
    const stats = getUserStats(u);
    return `
    <div class="space-y-6 md:space-y-10 animate-fade">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] shadow-premium relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
            <div class="relative z-10">
                <h1 class="text-2xl md:text-4xl font-black text-slate-800 mb-2">Salom, ${u.ism}! 👋</h1>
                <div class="flex items-center gap-3 md:gap-4">
                    <span class="px-3 md:px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">LEVEL ${stats.level}</span>
                    <div class="flex-1 w-32 md:w-48 h-2 md:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-600 rounded-full transition-all duration-1000" style="width: ${stats.levelPercent}%"></div>
                    </div>
                    <span class="text-[10px] md:text-xs font-bold text-slate-400">${u.points} XP</span>
                </div>
            </div>
        </header>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div class="lg:col-span-2 space-y-6 md:space-y-8">
                <section>
                    <div class="flex justify-between items-center mb-4 md:mb-6">
                        <h2 class="text-xl md:text-2xl font-black text-slate-800">Mening Kurslarim</h2>
                        <a href="#courses" class="text-indigo-600 font-black text-[10px] md:text-sm hover:underline">Hammasi</a>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div class="glass-card p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] cursor-pointer" onclick="window.location.hash='courses'">
                            <div class="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3 md:mb-4"><i data-lucide="book" class="w-5 h-5 md:w-6 md:h-6"></i></div>
                            <h3 class="font-black text-slate-800 text-base md:text-lg">Kurslarni ko'rish</h3>
                            <p class="text-xs md:text-sm text-slate-500 mt-1 md:mt-2">Barcha mavjud kurslarni kashf eting</p>
                        </div>
                    </div>
                </section>
            </div>
            <div class="space-y-6">
                <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
                    <h3 class="font-black text-slate-800 text-lg md:text-xl mb-4 md:mb-8">Statistika</h3>
                    <div class="space-y-4 md:space-y-6">
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400 font-bold text-xs md:text-sm">Ballar</span>
                            <span class="text-indigo-600 font-black text-lg md:text-xl">${u.points} XP</span>
                        </div>
                        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-600 rounded-full" style="width: ${Math.min(u.points/10, 100)}%"></div>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-slate-400 font-bold text-xs md:text-sm">Level</span>
                            <span class="text-slate-800 font-black text-lg md:text-xl">${stats.level}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function d_ustoz() {
    return `
    <div class="space-y-6 md:space-y-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <div>
                <h1 class="text-2xl md:text-3xl font-black text-slate-800">${t('dashboard')}</h1>
                <p class="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">${new Date().toLocaleDateString('uz-UZ',{weekday:'long',day:'numeric',month:'long'})}</p>
            </div>
            <button onclick="window.oModal('add-course')" class="bg-indigo-600 text-white px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold shadow-lg shadow-indigo-600/30 btn-interactive flex items-center gap-2 text-xs md:text-sm"><i data-lucide="plus" class="w-3.5 h-3.5 md:w-4 md:h-4"></i> Yangi Kurs</button>
        </div>
        <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
            <h2 class="text-lg md:text-xl font-black mb-4 flex items-center gap-2"><i data-lucide="layers" class="text-indigo-600"></i> Kurslarim</h2>
            <p class="text-slate-400 font-bold text-sm">Kurslaringizni boshqaring va yangi darslar qo'shing.</p>
        </div>
    </div>`;
}

function d_admin() {
    return `
    <div class="space-y-6 md:space-y-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
            <h1 class="text-2xl md:text-3xl font-black text-slate-800">Admin Boshqaruvi</h1>
            <button onclick="window.openLandingEditor()" class="bg-indigo-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black shadow-lg shadow-indigo-600/20 btn-interactive flex items-center gap-2 text-xs md:text-sm"><i data-lucide="layout" class="w-3.5 h-3.5 md:w-5 md:h-5"></i> Landingni Tahrirlash</button>
        </div>
        <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
            <h2 class="font-black text-lg md:text-xl mb-4 text-amber-600 flex items-center gap-2"><i data-lucide="clock"></i> Postlar boshqaruvi</h2>
            <p class="text-slate-500 font-medium">Postlarni tasdiqlash va boshqarish</p>
        </div>
    </div>`;
}

function d_tech_admin() {
    return `
    <div class="space-y-6 md:space-y-8">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800">Texnik Admin</h1>
        <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
            <h2 class="text-lg md:text-xl font-black mb-4">Tizim Sozlamalari</h2>
            <p class="text-slate-500">Sozlamalar boshqaruvi</p>
        </div>
    </div>`;
}

// ─── SETTINGS (admin / tech_admin) ─────────────────────────
async function v_settings() {
    try {
        const s = await getSettingsAPI();
        const lang = localStorage.getItem('lms_lang') === 'ru';
        return `
        <div class="space-y-6 md:space-y-8">
            <div>
                <h1 class="text-2xl md:text-4xl font-black text-slate-800 mb-2">${lang ? 'Настройки системы' : 'Tizim sozlamalari'}</h1>
                <p class="text-slate-500">${lang ? 'Координаты колледжа, гео-отметка и Telegram' : 'Kollej koord\'inatlari, geografik belgi va Telegram'}</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="glass-card p-6 md:p-8 rounded-[2rem] space-y-5">
                    <h2 class="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-5 h-5 text-indigo-600"></i>
                        ${lang ? 'Расположение колледжа' : 'Kollej joylashuvi'}
                    </h2>
                    <p class="text-sm text-slate-500">${lang
                        ? 'Студент отмечается «Пришёл» только если он находится в радиусе колледжа.'
                        : 'Talaba kollej radiusida bo\'lsagina «Keldim» deb belgilay oladi.'}</p>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" for="set-lat">${lang ? 'Широта (Latitude)' : 'Kenglik (Latitude)'}</label>
                        <input id="set-lat" type="number" step="any" value="${s.collegeLat ?? ''}" placeholder="41.3111"
                            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" for="set-lng">${lang ? 'Долгота (Longitude)' : 'Uzunlik (Longitude)'}</label>
                        <input id="set-lng" type="number" step="any" value="${s.collegeLng ?? ''}" placeholder="69.2797"
                            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" for="set-radius">${lang ? 'Радиус (метров)' : 'Radius (metr)'}</label>
                        <input id="set-radius" type="number" min="50" step="10" value="${s.attendanceRadius}"
                            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <button onclick="window.findMyLocation()" class="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors">
                        <i data-lucide="locate-fixed" class="w-4 h-4"></i> ${lang ? 'Определить моё местоположение' : 'Mening joylashuvimni aniqlash'}
                    </button>
                </div>

                <div class="glass-card p-6 md:p-8 rounded-[2rem] space-y-5">
                    <h2 class="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                        <i data-lucide="send" class="w-5 h-5 text-sky-600"></i>
                        ${lang ? 'Telegram-бот' : 'Telegram-bot'}
                    </h2>
                    <p class="text-sm text-slate-500">${lang
                        ? 'Токен нужен для отправки уведомлений об отметке «не пришёл» ученикам в Telegram.'
                        : 'Token «kelmadi» belgisi haqidagi xabarlarni Telegram orqali yuborish uchun kerak.'}</p>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" for="set-bot">${lang ? 'Токен бота' : 'Bot tokeni'}</label>
                        <input id="set-bot" type="text" value="${s.telegramBotToken ?? ''}" placeholder="123456789:AAF..."
                            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <p class="text-xs text-slate-400">
                        ${lang ? 'Инструкция: создайте бота у @BotFather, получите токен. Ученик привязывает свой chat_id, нажимая «Привязать Telegram».' : 'Yo\'riqnoma: @BotFather orqali bot yarating va tokenni oling. Talaba Telegram chatini bog\'lash uchun «Telegramni bog\'lash» tugmasini bosadi.'}
                    </p>
                </div>
            </div>

            <div class="flex justify-end">
                <button onclick="window.saveSettings()" class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/30 btn-interactive flex items-center gap-2 text-sm">
                    <i data-lucide="save" class="w-4 h-4"></i> ${lang ? 'Сохранить' : 'Saqlash'}
                </button>
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.findMyLocation = () => {
    if (!navigator.geolocation) {
        showToast(localStorage.getItem('lms_lang') === 'ru' ? 'Геолокация не поддерживается' : 'Geolokatsiya qo\'llab-quvvatlanmaydi', 'error');
        return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('set-lat').value = pos.coords.latitude.toFixed(6);
        document.getElementById('set-lng').value = pos.coords.longitude.toFixed(6);
        showToast(localStorage.getItem('lms_lang') === 'ru' ? 'Координаты получены' : 'Koordinatalar aniqlandi');
    }, () => showToast(localStorage.getItem('lms_lang') === 'ru' ? 'Не удалось получить координаты' : 'Koordinatalarni olish imkonsiz', 'error'), { enableHighAccuracy: true });
};

window.saveSettings = async () => {
    try {
        await api_patch('/settings', {
            collegeLat: document.getElementById('set-lat').value,
            collegeLng: document.getElementById('set-lng').value,
            attendanceRadius: Number(document.getElementById('set-radius').value) || 200,
            telegramBotToken: document.getElementById('set-bot').value
        });
        showToast(localStorage.getItem('lms_lang') === 'ru' ? 'Настройки сохранены' : 'Sozlamalar saqlandi');
    } catch (e) {
        showToast(e.message, 'error');
    }
};

function d_director() {
    return `
    <div class="space-y-6 md:space-y-8 animate-fade">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800">${t('analytics')}</h1>
        <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
            <h2 class="text-lg md:text-xl font-black mb-4">Platforma statistikasi</h2>
            <p class="text-slate-500">Analitika va hisobotlar</p>
        </div>
    </div>`;
}

// ─── PARENT DASHBOARD ─────────────────────────────────────
async function d_parent() {
    try {
        const child = await getParentChild();
        const attList = await getParentAtt();
        const grades = await getStudentGrades(child.id);
        const present = attList.filter(a => a.status === 'present').length || 0;
        const attPercent = attList.length ? Math.round((present / attList.length) * 100) : 100;
        const avg = grades.length ? (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(1) : '—';

        return `
        <div class="space-y-6 md:space-y-10 animate-fade">
            <header class="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] shadow-premium relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
                <div class="relative z-10">
                    <p class="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Родитель · ${localStorage.getItem('lms_lang') === 'ru' ? 'Ребёнок' : child.ism}</p>
                    <h1 class="text-2xl md:text-4xl font-black text-slate-800 mb-2">${child.ism}</h1>
                    <div class="flex flex-wrap items-center gap-3 mt-2">
                        <span class="px-3 md:px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-100">${child.groupName || 'Guruhsiz'}</span>
                        <span class="px-3 md:px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-100">${localStorage.getItem('lms_lang') === 'ru' ? 'Посещаемость' : 'Davomat'}: ${attPercent}%</span>
                        <span class="px-3 md:px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-amber-100">${localStorage.getItem('lms_lang') === 'ru' ? 'Средний балл' : "O'rtacha baho"}: ${avg}</span>
                    </div>
                </div>
            </header>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
                    <h3 class="font-black text-slate-800 text-lg md:text-xl mb-4 flex items-center gap-2"><i data-lucide="calendar-check" class="w-5 h-5 text-indigo-600"></i> ${localStorage.getItem('lms_lang') === 'ru' ? 'Посещаемость' : 'Davomat'}</h3>
                    ${attList.length === 0 ? `<p class="text-slate-400 font-bold text-sm">${localStorage.getItem('lms_lang') === 'ru' ? 'Записей пока нет' : 'Hozircha yozuvlar yo\'q'}</p>` : `
                    <div class="space-y-2 md:space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        ${attList.slice(0, 25).map(a => `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                            <span class="font-bold text-sm text-slate-600">${a.date}</span>
                            ${a.status === 'present'
                                ? '<span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">ПРИШЁЛ</span>'
                                : '<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black">НЕ ПРИШЁЛ</span>'}
                        </div>`).join('')}
                    </div>`}
                </div>
                <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
                    <h3 class="font-black text-slate-800 text-lg md:text-xl mb-4 flex items-center gap-2"><i data-lucide="graduation-cap" class="w-5 h-5 text-indigo-600"></i> ${localStorage.getItem('lms_lang') === 'ru' ? 'Оценки' : 'Baho'}</h3>
                    ${grades.length === 0 ? `<p class="text-slate-400 font-bold text-sm">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценок пока нет' : 'Hozircha baho yo\'q'}</p>` : `
                    <div class="space-y-2 md:space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        ${grades.map(g => `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                            <div>
                                <span class="font-bold text-sm text-slate-700">${g.value}</span>
                                <span class="text-xs text-slate-400 ml-2">${g.comment || ''}</span>
                            </div>
                            <span class="text-[10px] font-bold text-slate-400">${g.date}</span>
                        </div>`).join('')}
                    </div>`}
                </div>
            </div>
        </div>`;
    } catch (e) {
        return `<div class="p-10 text-center"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── COURSES ───────────────────────────────────────────────
async function v_courses() {
    try {
        const courses = await getCourses();
        return `
        <div class="space-y-6 md:space-y-8">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('courses')}</h1>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">${courses.length} ta kurs</p>
                </div>
                ${['admin', 'ustoz'].includes(STATE.user?.role) ? `
                <button onclick="window.oModal('add-course')" class="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/30 btn-interactive flex items-center gap-2 text-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i> ${t('courses')}
                </button>` : ''}
            </div>
            ${courses.length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p class="text-slate-400 font-black text-lg">${localStorage.getItem('lms_lang') === 'ru' ? 'Курсов пока нет' : 'Hozircha kurslar yo\'q'}</p>
            </div>` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                ${courses.map(c => `
                <div onclick="window.opCourse(${c.id})" class="glass-card p-6 md:p-8 rounded-[2rem] cursor-pointer group relative overflow-hidden">
                    <div class="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <div class="relative">
                        <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <i data-lucide="book" class="w-6 h-6"></i>
                        </div>
                        <h3 class="font-black text-slate-800 text-lg mb-1">${c.title}</h3>
                        <p class="text-xs text-slate-400 font-bold mb-3">${c.category} · ${(c.lessons || []).length} ta dars</p>
                        <p class="text-sm text-slate-500 font-medium line-clamp-2">${c.description || ''}</p>
                    </div>
                </div>`).join('')}
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

async function v_cdetail() {
    try {
        const courses = await getCourses();
        const course = courses.find(c => c.id === STATE.activeCourseId);
        if (!course) return `<div class="text-center py-20"><p class="text-slate-400 font-black">Kurs topilmadi</p></div>`;
        const lessons = course.lessons || [];
        const me = STATE.user;
        const completed = (me.progress?.[course.id]?.completed) || [];
        return `
        <div class="space-y-6 md:space-y-8">
            <button onclick="window.location.hash='courses'" class="text-slate-500 hover:text-slate-800 mb-2 font-bold flex items-center transition-colors text-sm">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-1"></i> ${localStorage.getItem('lms_lang') === 'ru' ? 'Назад' : 'Orqaga'}
            </button>
            <header class="p-6 md:p-10 bg-white rounded-[2rem] md:rounded-[3rem] shadow-premium relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
                <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">${course.category}</span>
                <h1 class="text-2xl md:text-4xl font-black text-slate-800 mt-3">${course.title}</h1>
                <p class="text-slate-500 font-medium mt-2 max-w-xl">${course.description || ''}</p>
            </header>
            <div class="space-y-3">
                <h2 class="text-xl md:text-2xl font-black text-slate-800">Дарслар</h2>
                ${lessons.length === 0 ? `
                <div class="text-center py-10 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Уроков нет' : 'Darslar yo\'q'}</p>
                </div>` : lessons.map((l, i) => {
                    const done = completed.includes(l.id);
                    return `
                    <div onclick="window.oModal('read-lesson', ${l.id})" class="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] cursor-pointer flex items-center gap-4">
                        <div class="${done ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black shrink-0">
                            ${done ? '<i data-lucide="check" class="w-5 h-5"></i>' : i + 1}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-black text-slate-800 text-sm md:text-base truncate">${l.title}</h3>
                            <p class="text-[10px] md:text-xs text-slate-400 font-bold">${l.topic || 'Mavzu'}</p>
                        </div>
                        <i data-lucide="play-circle" class="w-6 h-6 text-slate-300 shrink-0"></i>
                    </div>`;
                }).join('')}
            </div>
            ${['admin', 'ustoz'].includes(me?.role) ? `
            <button onclick="window.oModal('add-lesson')" class="w-full bg-indigo-600 text-white font-black py-4 rounded-[1.5rem] hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all">
                + Dars qo'shish
            </button>` : ''}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── USERS (admin) ─────────────────────────────────────────
async function v_users() {
    try {
        const users = await api_get('/users');
        const groups = await getGroups();
        const roleNames = { student: 'Talaba', ustoz: 'Ustoz', admin: 'Admin', tech_admin: 'Tex Admin', director: 'Direktor', parent: 'Ota-ona' };
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('users')}</h1>
            <div class="bg-white rounded-[2rem] p-4 md:p-8 shadow-premium overflow-x-auto">
                <table class="w-full table-mobile-card text-left">
                    <thead>
                        <tr class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th class="pb-3">Ism</th><th class="pb-3">Email</th><th class="pb-3">Rol</th><th class="pb-3">Guruh</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${users.map(u => `
                        <tr class="border-t border-slate-50">
                            <td data-label="Ism" class="py-3 font-bold text-sm text-slate-700">${u.ism}</td>
                            <td data-label="Email" class="py-3 text-sm text-slate-400">${u.email}</td>
                            <td data-label="Rol" class="py-3 text-sm">
                                <select onchange="window.changeRole(${u.id}, this.value)" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold">
                                    ${Object.entries(roleNames).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}
                                </select>
                            </td>
                            <td data-label="Guruh" class="py-3 text-sm text-slate-400">${u.groupId ? (groups.find(g => g.id === u.groupId)?.name || '—') : '—'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── GROUPS ────────────────────────────────────────────────
async function v_groups() {
    try {
        const groups = await getGroups();
        const users = await api_get('/users');
        const me = STATE.user;
        const visible = me.role === 'admin' || me.role === 'tech_admin' || me.role === 'director'
            ? groups
            : groups.filter(g => g.ustozId === me.id || (g.studentIds || []).includes(me.id));
        return `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('groups')}</h1>
                ${me.role === 'ustoz' || me.role === 'admin' ? `
                <div class="flex gap-2">
                    <button onclick="window.oModal('view-group-attendance', ${visible[0]?.id})" ${visible.length ? '' : 'disabled'} class="bg-indigo-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                        <i data-lucide="check-check" class="w-4 h-4"></i> Davomat belgilash
                    </button>
                </div>` : ''}
            </div>
            ${visible.length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Групп нет' : 'Guruhlar yo\'q'}</p>
            </div>` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                ${visible.map(g => {
                    const students = (g.studentIds || []).map(id => users.find(u => u.id === id)).filter(Boolean);
                    return `
                    <div class="glass-card p-6 rounded-[1.5rem] md:rounded-[2rem]">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-black text-slate-800 text-lg">${g.name}</h3>
                            <span class="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">${students.length}</span>
                        </div>
                        ${students.length === 0 ? `<p class="text-slate-400 text-xs font-bold">${localStorage.getItem('lms_lang') === 'ru' ? 'Нет студентов' : 'Talabalar yo\'q'}</p>` : `
                        <div class="space-y-2">
                            ${students.map(s => `
                            <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
                                <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">${s.ism[0]}</div>
                                <span class="text-sm font-bold text-slate-600 flex-1 truncate">${s.ism}</span>
                            </div>`).join('')}
                        </div>`}
                        ${me.role === 'ustoz' || me.role === 'admin' ? `
                        <button onclick="window.oModal('view-group-attendance', ${g.id})" class="mt-4 w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all">
                            ${localStorage.getItem('lms_lang') === 'ru' ? 'Отметить посещаемость' : 'Davomatni belgilash'}
                        </button>` : ''}
                    </div>`;
                }).join('')}
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── STUDENT ATTENDANCE (geolocation) ─────────────────────
async function v_attendance() {
    try {
        const attList = await getMyAttendance();
        const settings = await getSettingsAPI();
        const me = STATE.user;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRec = attList.find(a => a.date === todayStr) || null;
        const presentCount = attList.filter(a => a.status === 'present').length;
        const attPercent = attList.length ? Math.round((presentCount / attList.length) * 100) : 100;
        const collegeConfigured = settings.collegeLat && settings.collegeLng;

        return `
        <div class="space-y-6 md:space-y-10 animate-fade">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div class="lg:col-span-2">
                    <div class="p-6 md:p-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] md:rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
                        <div class="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div class="relative z-10">
                            <div class="flex items-center gap-2 text-white/80 font-black uppercase tracking-widest text-[10px] md:text-xs mb-2">
                                <i data-lucide="map-pin" class="w-4 h-4"></i> ${localStorage.getItem('lms_lang') === 'ru' ? 'Геолокация колледжа' : 'Kolledj geolokatsiyasi'}
                            </div>
                            <h1 class="text-2xl md:text-4xl font-black mb-3">${localStorage.getItem('lms_lang') === 'ru' ? 'Я пришёл на учёбу' : 'Men o\'qishga keldim'}</h1>
                            <p class="text-white/80 font-medium text-sm md:text-base mb-6 max-w-md">
                                ${localStorage.getItem('lms_lang') === 'ru'
                                    ? 'Нажмите кнопку — система проверит по GPS, находитесь ли вы на территории колледжа, и автоматически отметит присутствие.'
                                    : 'Tugmani bosing — tizim GPS orqali kolledj hududida ekanligingizni tekshiradi va davomatni avtomatik belgilaydi.'}
                            </p>

                            ${!collegeConfigured ? `
                            <div class="bg-amber-400/20 border border-amber-300/40 rounded-2xl p-4 mb-6">
                                <p class="text-amber-200 font-black text-sm">⚠️ ${localStorage.getItem('lms_lang') === 'ru' ? 'Координаты колледжа не настроены. Сообщите администратору.' : "Kolledj koordinatalari sozlanmagan. Administratorga xabar bering."}</p>
                            </div>` : ''}

                            <button onclick="window.geoCheckin(this)" ${collegeConfigured ? '' : 'disabled'}
                                class="disabled:opacity-40 w-full sm:w-auto bg-white text-indigo-700 px-8 md:px-14 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-base md:text-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                <i data-lucide="map-pin" class="w-6 h-6 md:w-8 md:h-8"></i>
                                <span id="checkin-label">${localStorage.getItem('lms_lang') === 'ru' ? 'Подтвердить прибытие' : 'Kelganimni tasdiqlash'}</span>
                            </button>

                            <div id="checkin-result" class="mt-5">
                                ${todayRec ? `
                                <div class="${todayRec.status === 'present' ? 'bg-white/15' : 'bg-red-500/20'} rounded-2xl p-4 flex items-center gap-3 border border-white/20">
                                    <i data-lucide="${todayRec.status === 'present' ? 'check-circle' : 'x-circle'}" class="w-8 h-8 shrink-0"></i>
                                    <div>
                                        <p class="font-black text-sm md:text-base">${todayRec.status === 'present'
                                            ? (localStorage.getItem('lms_lang') === 'ru' ? 'Вы отметились сегодня!' : 'Bugun belgilandingiz!')
                                            : (localStorage.getItem('lms_lang') === 'ru' ? 'Сегодня отмечено отсутствие' : 'Bugun kelmadi deb belgilangan')}</p>
                                        <p class="text-white/70 text-xs font-bold uppercase tracking-widest">${todayStr}</p>
                                    </div>
                                </div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
                        <h3 class="font-black text-slate-800 text-lg md:text-xl mb-5">${localStorage.getItem('lms_lang') === 'ru' ? 'Статистика' : 'Statistika'}</h3>
                        <div class="space-y-5">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-400 font-bold text-xs md:text-sm">${localStorage.getItem('lms_lang') === 'ru' ? 'Посещаемость' : 'Davomat'}</span>
                                <span class="text-emerald-600 font-black text-lg">${attPercent}%</span>
                            </div>
                            <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" style="width: ${attPercent}%"></div>
                            </div>
                            <div class="grid grid-cols-2 gap-3 pt-2">
                                <div class="bg-emerald-50 p-4 rounded-2xl text-center">
                                    <p class="text-2xl font-black text-emerald-600">${presentCount}</p>
                                    <p class="text-[9px] font-black uppercase tracking-widest text-emerald-500 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Пришёл' : 'Keldi'}</p>
                                </div>
                                <div class="bg-red-50 p-4 rounded-2xl text-center">
                                    <p class="text-2xl font-black text-red-500">${attList.length - presentCount}</p>
                                    <p class="text-[9px] font-black uppercase tracking-widest text-red-400 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Пропуск' : "O'tkazib"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]">
                <h3 class="font-black text-slate-800 text-lg md:text-xl mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'История посещаемости' : 'Davomat tarixi'}</h3>
                ${attList.length === 0 ? `
                <p class="text-slate-400 font-bold text-sm">${localStorage.getItem('lms_lang') === 'ru' ? 'История пока пуста' : "Hozircha tarix bo'sh"}</p>` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${attList.slice().reverse().map(a => `
                    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <span class="font-bold text-xs md:text-sm text-slate-600">${a.date}</span>
                        ${a.status === 'present'
                            ? '<span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black">ПРИШЁЛ</span>'
                            : '<span class="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black">НЕ ПРИШЁЛ</span>'}
                    </div>`).join('')}
                </div>`}
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.geoCheckin = (btn) => {
    if (!navigator.geolocation) {
        showToast('GPS не поддерживается браузером', 'error');
        return;
    }
    const label = document.getElementById('checkin-label');
    const result = document.getElementById('checkin-result');
    if (label) label.innerHTML = `${localStorage.getItem('lms_lang') === 'ru' ? 'Определение местоположения...' : 'Joylashuv aniqlanmoqda...'}`;
    if (btn) { btn.disabled = true; btn.classList.add('opacity-60'); }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            try {
                const data = await api_post('/attendance/checkin', {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                if (result) {
                    result.innerHTML = `
                    <div class="${data.inside ? 'bg-white/15' : 'bg-red-500/25'} rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 border border-white/25">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 ${data.inside ? 'bg-emerald-400' : 'bg-red-500'} rounded-2xl flex items-center justify-center shrink-0">
                                <i data-lucide="${data.inside ? 'check' : 'x'}" class="w-6 h-6 text-white"></i>
                            </div>
                            <div>
                                <p class="font-black text-sm md:text-base">${data.inside
                                    ? (localStorage.getItem('lms_lang') === 'ru' ? 'Вы на территории колледжа!' : 'Siz kolledj hududidasiz!')
                                    : (localStorage.getItem('lms_lang') === 'ru' ? 'Вы вне территории колледжа' : 'Siz kolledjdan tashqaridasiz')}</p>
                                <p class="text-white/70 text-xs font-bold">${localStorage.getItem('lms_lang') === 'ru' ? 'Расстояние' : 'Masofa'}: ${data.distance} м · ${localStorage.getItem('lms_lang') === 'ru' ? 'Радиус' : 'Radius'}: ${data.radius} м</p>
                            </div>
                        </div>
                    </div>`;
                }
                showToast(data.message, data.inside ? 'success' : 'error');
                setTimeout(() => renderView('attendance'), localStorage.getItem('lms_lang') === 'ru' ? 1600 : 1600);
            } catch (e) {
                if (result) result.innerHTML = `<div class="bg-red-500/25 rounded-2xl p-4"><p class="font-black text-sm">${e.message}</p></div>`;
                showToast(e.message, 'error');
            }
            if (label) label.innerHTML = `${localStorage.getItem('lms_lang') === 'ru' ? 'Подтвердить прибытие' : 'Kelganimni tasdiqlash'}`;
            if (btn) { btn.disabled = false; btn.classList.remove('opacity-60'); }
        },
        (err) => {
            if (label) label.innerHTML = `${localStorage.getItem('lms_lang') === 'ru' ? 'Подтвердить прибытие' : 'Kelganimni tasdiqlash'}`;
            if (btn) { btn.disabled = false; btn.classList.remove('opacity-60'); }
            showToast('Не удалось получить координаты (разрешите доступ к GPS)', 'error');
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
};

// ─── NOTIFICATIONS ─────────────────────────────────────────
async function v_notifications() {
    try {
        const notifs = await getNotifications();
        const iconFor = (type) => type === 'warning'
            ? '<i data-lucide="alert-triangle" class="text-red-500"></i>'
            : type === 'info'
                ? '<i data-lucide="info" class="text-indigo-500"></i>'
                : '<i data-lucide="bell" class="text-slate-400"></i>';
        return `
        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('notifications')}</h1>
                ${notifs.some(n => !n.seen) ? `
                <button onclick="window.markNotifsRead()" class="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-xl transition-all">
                    ${localStorage.getItem('lms_lang') === 'ru' ? 'Прочитано' : "O'qildi"}
                </button>` : ''}
            </div>
            ${notifs.length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <i data-lucide="bell-off" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Уведомлений нет' : 'Bildirishnomalar yo\'q'}</p>
            </div>` : `
            <div class="space-y-3">
                ${notifs.map(n => `
                <div class="${n.seen ? 'bg-white opacity-70' : 'glass-card'} p-4 md:p-5 rounded-[1.5rem] flex items-start gap-4">
                    <div class="w-10 h-10 md:w-12 md:h-12 ${n.seen ? 'bg-slate-100' : 'bg-indigo-50'} rounded-2xl flex items-center justify-center shrink-0">
                        <span class="w-5 h-5 md:w-6 md:h-6">${iconFor(n.type)}</span>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-sm md:text-base text-slate-700">${n.msg}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">${n.date}</p>
                    </div>
                    ${!n.seen ? '<span class="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shrink-0 mt-2"></span>' : ''}
                </div>`).join('')}
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.markNotifsRead = async () => {
    try {
        await api_post('/notifications/read');
        renderView('notifications');
        updateNotificationBadge();
    } catch (e) {}
};

async function updateNotificationBadge() {
    try {
        const notifs = await getNotifications();
        const unread = notifs.filter(n => !n.seen).length;
        const bell = document.querySelector('#mobile-notif-btn i, .notif-badge-label');
        const existing = document.querySelectorAll('.notif-badge-label');
        existing.forEach(el => el.remove());
        if (unread > 0) {
            document.querySelectorAll('[data-notif-anchor]').forEach(el => {
                el.innerHTML += `<span class="notif-badge-label absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white">${unread > 9 ? '9+' : unread}</span>`;
            });
        }
    } catch (e) {}
}

// ─── GRADES / ACADEMIC PERFORMANCE ─────────────────────────
async function v_grades() {
    try {
        const me = STATE.user;
        const grades = await getGrades();
        const courses = await getCourses();
        window.COURSES_CACHE = courses;
        if (me.role === 'ustoz' || me.role === 'admin' || me.role === 'tech_admin') {
            const groups = await getGroups();
            const users = await api_get('/users');
            const myIds = me.role === 'ustoz'
                ? groups.filter(g => g.ustozId === me.id).flatMap(g => g.studentIds || [])
                : users.filter(u => u.role === 'student').map(u => u.id);
            const students = users.filter(u => myIds.includes(u.id));
            return `
            <div class="space-y-6">
                <h1 class="text-2xl md:text-4xl font-black text-slate-800">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценки и успеваемость' : 'Baho va o\'zlashtirish'}</h1>
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div class="lg:col-span-1 space-y-4">
                        <div class="glass-card p-5 rounded-[1.5rem]">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">${localStorage.getItem('lms_lang') === 'ru' ? 'Выберите студента' : 'Talabani tanlang'}</p>
                            <div class="space-y-2">
                                ${students.map(s => `
                                <div onclick="window.selectGradeStudent(${s.id})" data-gs="${s.id}" class="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 cursor-pointer font-bold text-sm transition-all">
                                    ${s.ism}
                                </div>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="lg:col-span-3" id="grade-student-panel">
                        <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <i data-lucide="mouse-pointer-click" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                            <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Выберите студента слева' : "Chapdan talabani tanlang"}</p>
                        </div>
                    </div>
                </div>
            </div>`;
        }
        if (me.role === 'parent' && me.parentId) {
            const childGrades = grades;
            const attList = await getParentAtt();
            const present = attList.filter(a => a.status === 'present').length;
            const attPct = attList.length ? Math.round((present / attList.length) * 100) : 100;
            const avg = childGrades.length ? (childGrades.reduce((s, g) => s + g.value, 0) / childGrades.length).toFixed(1) : '—';
            return `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl md:text-4xl font-black text-slate-800">${localStorage.getItem('lms_lang') === 'ru' ? 'Успеваемость ребёнка' : 'Bola o\'zlashtirishi'}</h1>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div class="glass-card p-6 rounded-[1.5rem] text-center">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Средний балл' : "O'rtacha baho"}</p>
                        <p class="text-4xl font-black text-indigo-600 mt-2">${avg}</p>
                    </div>
                    <div class="glass-card p-6 rounded-[1.5rem] text-center">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Посещаемость' : 'Davomat'}</p>
                        <p class="text-4xl font-black text-emerald-600 mt-2">${attPct}%</p>
                    </div>
                    <div class="glass-card p-6 rounded-[1.5rem] text-center">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценок' : 'Baho'}</p>
                        <p class="text-4xl font-black text-slate-800 mt-2">${childGrades.length}</p>
                    </div>
                </div>
                <div class="glass-card p-6 rounded-[2rem] overflow-x-auto">
                    <h3 class="font-black text-lg mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'Все оценки' : 'Barcha baholar'}</h3>
                    ${childGrades.length === 0 ? `<p class="text-slate-400 font-bold">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценок пока нет' : 'Hozircha baho yo\'q'}</p>` : `
                    <div class="space-y-3">
                        ${childGrades.map(g => {
                            const c = courses.find(x => x.id === g.courseId);
                            return `
                            <div class="flex items-center justify-between p-4 rounded-2xl ${g.value >= 4 ? 'bg-emerald-50 border border-emerald-100' : g.value === 3 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}">
                                <div>
                                    <p class="font-black text-sm text-slate-700">${c?.title || 'Kurs'}</p>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${g.comment || ''} · ${g.date}</p>
                                </div>
                                <span class="text-3xl font-black ${g.value >= 4 ? 'text-emerald-600' : g.value === 3 ? 'text-amber-600' : 'text-red-500'}">${g.value}</span>
                            </div>`;
                        }).join('')}
                    </div>`}
                </div>
            </div>`;
        }
        const attList = await getMyAttendance();
        const present = attList.filter(a => a.status === 'present').length;
        const attPct = attList.length ? Math.round((present / attList.length) * 100) : 100;
        const avg = grades.length ? (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(1) : '—';
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${localStorage.getItem('lms_lang') === 'ru' ? 'Моя успеваемость' : 'Mening o\'zlashtirishim'}</h1>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div class="glass-card p-6 rounded-[1.5rem] text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Средний балл' : "O'rtacha baho"}</p>
                    <p class="text-4xl font-black text-indigo-600 mt-2">${avg}</p>
                </div>
                <div class="glass-card p-6 rounded-[1.5rem] text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Посещаемость' : 'Davomat'}</p>
                    <p class="text-4xl font-black text-emerald-600 mt-2">${attPct}%</p>
                </div>
                <div class="glass-card p-6 rounded-[1.5rem] text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Баллы XP' : 'XP ball'}</p>
                    <p class="text-4xl font-black text-slate-800 mt-2">${me.points || 0}</p>
                </div>
            </div>
            <div class="glass-card p-6 rounded-[2rem]">
                <h3 class="font-black text-lg mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценки' : 'Baho'}</h3>
                ${grades.length === 0 ? `<p class="text-slate-400 font-bold">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценок пока нет' : 'Hozircha baho yo\'q'}</p>` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${grades.map(g => {
                        const c = courses.find(x => x.id === g.courseId);
                        return `
                        <div class="p-4 rounded-2xl ${g.value >= 4 ? 'bg-emerald-50 border border-emerald-100' : g.value === 3 ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}">
                            <div class="flex justify-between items-center">
                                <span class="text-3xl font-black ${g.value >= 4 ? 'text-emerald-600' : g.value === 3 ? 'text-amber-600' : 'text-red-500'}">${g.value}</span>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${g.date}</span>
                            </div>
                            <p class="font-black text-sm text-slate-700 mt-2">${c?.title || 'Kurs'}</p>
                            <p class="text-[10px] font-bold text-slate-400">${g.comment || ''}</p>
                        </div>`;
                    }).join('')}
                </div>`}
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.selectGradeStudent = async (sid) => {
    try {
        const grades = await getStudentGrades(sid);
        const courses = await getCourses();
        window.COURSES_CACHE = courses;
        const panel = document.getElementById('grade-student-panel');
        document.querySelectorAll('[data-gs]').forEach(el => {
            el.classList.toggle('bg-indigo-50', Number(el.dataset.gs) === sid);
            el.classList.toggle('bg-slate-50', Number(el.dataset.gs) !== sid);
        });
        const avg = grades.length ? (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(1) : '—';
        panel.innerHTML = `
        <div class="space-y-5">
            <div class="glass-card p-5 rounded-[1.5rem] flex items-center justify-between">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">${localStorage.getItem('lms_lang') === 'ru' ? 'Средний балл' : "O'rtacha baho"}</p>
                    <p class="text-3xl font-black text-indigo-600">${avg}</p>
                </div>
                <button onclick="window.addGrade(${sid})" class="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i> ${localStorage.getItem('lms_lang') === 'ru' ? 'Оценка' : 'Baho'}
                </button>
            </div>
            ${grades.length === 0 ? `
            <div class="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Оценок нет' : 'Baho yo\'q'}</p>
            </div>` : `
            <div class="space-y-3">
                ${grades.map(g => {
                    const c = courses.find(x => x.id === g.courseId);
                    return `
                    <div class="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                        <div>
                            <p class="font-black text-sm">${c?.title || 'Kurs'} · <span class="text-indigo-600">${g.value}</span></p>
                            <p class="text-[10px] font-bold text-slate-400">${g.comment || ''} · ${g.date}</p>
                        </div>
                        <button onclick="window.delGrade(${g.id})" class="text-slate-300 hover:text-red-500 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>`;
                }).join('')}
            </div>`}
        </div>`;
        safeLucide(panel);
    } catch (e) { showToast(e.message, 'error'); }
};

window.addGrade = (sid) => {
    const html = `
    <div class="bg-white p-6 md:p-8 rounded-[2rem] w-full max-w-md animate-zoom">
        <h2 class="text-2xl font-black text-slate-800 mb-5">${localStorage.getItem('lms_lang') === 'ru' ? 'Новая оценка' : 'Yangi baho'}</h2>
        <div class="flex gap-3 mb-4">
            ${[5, 4, 3, 2].map(v => `
            <div onclick="window.pickGrade(${v}, this)" data-grade="${v}" class="grade-pick w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xl cursor-pointer transition-all">${v}</div>
            `).join('')}
        </div>
        <select id="g-course" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold mb-3">
            ${window.COURSES_CACHE?.map(c => `<option value="${c.id}">${c.title}</option>`).join('') || ''}
        </select>
        <input id="g-comment" placeholder="${localStorage.getItem('lms_lang') === 'ru' ? 'Комментарий' : 'Izoh'}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold mb-4">
        <button onclick="window.svGrade(${sid})" class="w-full bg-indigo-600 text-white font-black py-3 rounded-2xl hover:bg-indigo-700 transition-all">Saqlash</button>
    </div>`;
    openModal(html);
};

window.pickGrade = (v, el) => {
    document.querySelectorAll('.grade-pick').forEach(x => {
        x.className = 'grade-pick w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xl cursor-pointer transition-all';
    });
    el.className = `grade-pick w-14 h-14 rounded-2xl ${v >= 4 ? 'bg-emerald-500' : v === 3 ? 'bg-amber-500' : 'bg-red-500'} text-white flex items-center justify-center font-black text-xl cursor-pointer transition-all shadow-lg`;
};

window.svGrade = async (sid) => {
    try {
        const picked = document.querySelector('.grade-pick.bg-emerald-500, .grade-pick.bg-amber-500, .grade-pick.bg-red-500');
        if (!picked) { showToast('Выберите оценку', 'error'); return; }
        await api_post('/grades', {
            studentId: sid,
            courseId: parseInt(document.getElementById('g-course').value),
            value: parseInt(picked.dataset.grade),
            comment: document.getElementById('g-comment').value.trim()
        });
        cModal();
        selectGradeStudent(sid);
        showToast(localStorage.getItem('lms_lang') === 'ru' ? 'Оценка сохранена' : 'Baho saqlandi');
    } catch (e) { showToast(e.message, 'error'); }
};

window.delGrade = async (id) => {
    try {
        await api_del(`/grades/${id}`);
        const sid = document.querySelector('[data-gs].bg-indigo-50')?.dataset.gs;
        selectGradeStudent(Number(sid));
    } catch (e) { showToast(e.message, 'error'); }
};

// ─── REPORTS (director / teacher analytics) ───────────────
async function v_reports() {
    try {
        const [users, groups, attendance] = await Promise.all([
            api_get('/users'), getGroups(), api_get('/attendance')
        ]);
        const students = users.filter(u => u.role === 'student');
        const teachers = users.filter(u => u.role === 'ustoz');
        const totalStudents = students.length;
        const totalTeachers = teachers.length;
        const totalGroups = groups.length;

        const today = new Date().toISOString().slice(0, 10);
        const todayRec = attendance.find(a => a.date === today);
        let presentToday = 0, absentToday = 0;
        if (todayRec) {
            Object.values(todayRec.records).forEach(s => {
                if (s === 'present') presentToday++;
                else if (s === 'absent') absentToday++;
            });
        }
        const attendanceRate = (presentToday + absentToday) > 0
            ? Math.round((presentToday / (presentToday + absentToday)) * 100) : 0;

        const avgXp = totalStudents > 0
            ? Math.round(students.reduce((a, s) => a + (s.points || 0), 0) / totalStudents) : 0;

        const allGrades = await api_get('/grades').catch(() => []);
        const avgGrade = allGrades.length > 0
            ? (allGrades.reduce((a, g) => a + g.value, 0) / allGrades.length).toFixed(1) : '—';

        const groupStats = groups.map(g => {
            const gStudents = students.filter(s => g.studentIds?.includes(s.id));
            const gAttend = todayRec
                ? gStudents.filter(s => todayRec.records[s.id] === 'present').length : 0;
            return {
                name: g.name,
                count: gStudents.length,
                present: gAttend,
                rate: gStudents.length > 0 ? Math.round((gAttend / gStudents.length) * 100) : 0
            };
        }).sort((a, b) => b.count - a.count);

        const topStudents = [...students]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .slice(0, 5);

        return `
        <div class="mb-8">
            <h1 class="text-2xl md:text-3xl font-black text-slate-800 mb-2">${t('reports')}</h1>
            <p class="text-slate-500">${localStorage.getItem('lms_lang') === 'ru' ? 'Аналитика и статистика системы' : 'Tizim tahlili va statistikasi'}</p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-indigo-600">${totalStudents}</div>
                <div class="text-sm text-slate-500 mt-1">${t('students')}</div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-emerald-600">${totalTeachers}</div>
                <div class="text-sm text-slate-500 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Учителей' : "O'qituvchilar"}</div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-amber-600">${totalGroups}</div>
                <div class="text-sm text-slate-500 mt-1">${t('groups')}</div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-sky-600">${avgXp}</div>
                <div class="text-sm text-slate-500 mt-1">XP ${localStorage.getItem('lms_lang') === 'ru' ? '(среднее)' : "(o'rtacha)"}</div>
            </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 50 ? 'text-amber-600' : 'text-red-600'}">${attendanceRate}%</div>
                <div class="text-sm text-slate-500 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Посещаемость сегодня' : 'Bugungi davomat'}</div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-emerald-600">${presentToday}</div>
                <div class="text-sm text-slate-500 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Присутствуют' : 'Mavjud'}</div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-red-500">${absentToday}</div>
                <div class="text-sm text-slate-500 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Отсутствуют' : "Yo'q"}</div>
            </div>
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div class="text-3xl font-black text-violet-600">${avgGrade}</div>
                <div class="text-sm text-slate-500 mt-1">${localStorage.getItem('lms_lang') === 'ru' ? 'Средний балл' : "O'rtacha baho"}</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 class="text-lg font-black text-slate-800 mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'Группы' : 'Guruhlar'}</h2>
                <div class="space-y-3">
                    ${groupStats.length > 0 ? groupStats.map(g => `
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div>
                                <div class="font-bold text-slate-800">${escapeHtml(g.name)}</div>
                                <div class="text-xs text-slate-500">${g.count} ${localStorage.getItem('lms_lang') === 'ru' ? 'учеников' : 'talaba'}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-bold ${g.rate >= 80 ? 'text-emerald-600' : g.rate >= 50 ? 'text-amber-600' : 'text-red-500'}">${g.rate}%</div>
                                <div class="text-xs text-slate-400">${g.present}/${g.count}</div>
                            </div>
                        </div>
                    `).join('') : `<p class="text-slate-400 text-sm">${localStorage.getItem('lms_lang') === 'ru' ? 'Нет данных' : "Ma'lumot yo'q"}</p>`}
                </div>
            </div>

            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 class="text-lg font-black text-slate-800 mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'Топ учеников' : 'Top talabalar'}</h2>
                <div class="space-y-3">
                    ${topStudents.length > 0 ? topStudents.map((s, i) => `
                        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-slate-300'}">${i + 1}</div>
                            <div class="flex-1">
                                <div class="font-bold text-slate-800">${escapeHtml(s.ism || s.name || s.email)}</div>
                            </div>
                            <div class="text-sm font-bold text-indigo-600">${s.points || 0} XP</div>
                        </div>
                    `).join('') : `<p class="text-slate-400 text-sm">${localStorage.getItem('lms_lang') === 'ru' ? 'Нет данных' : "Ma'lumot yo'q"}</p>`}
                </div>
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── LEADERBOARD ───────────────────────────────────────────
async function v_lead() {
    try {
        const data = await getLeaderboard();
        const top = data.students.slice(0, 10);
        const me = STATE.user;
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('leaderboard')}</h1>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                ${(data.groups || []).map((g, i) => `
                <div class="glass-card p-6 rounded-[1.5rem] text-center ${i === 0 ? 'border-indigo-200' : ''}">
                    <p class="text-2xl mb-1">${i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}</p>
                    <p class="font-black text-lg text-slate-800">${g.name}</p>
                    <p class="text-indigo-600 font-black mt-1">${g.totalXP} XP</p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${g.studentCount} talaba</p>
                </div>`).join('')}
            </div>
            <div class="bg-white rounded-[2rem] shadow-premium overflow-hidden">
                <div class="p-5 md:p-8">
                    ${top.map((u, i) => `
                    <div class="flex items-center gap-4 p-3 rounded-2xl ${me.id === u.id ? 'bg-indigo-50' : i % 2 ? 'bg-slate-50/60' : ''}">
                        <span class="w-8 h-8 ${i < 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'} rounded-xl flex items-center justify-center font-black text-xs shrink-0">${i + 1}</span>
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black">${u.ism[0]}</div>
                        <div class="flex-1 min-w-0">
                            <p class="font-black text-sm text-slate-700 truncate">${u.ism} ${me.id === u.id ? '(siz)' : ''}</p>
                        </div>
                        <span class="font-black text-indigo-600">${u.points} XP</span>
                    </div>`).join('')}
                </div>
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── SUPPORT / TICKETS ─────────────────────────────────────
async function v_sup() {
    try {
        const tickets = await getTickets();
        return `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('support')}</h1>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">${tickets.length} ta murojaat</p>
                </div>
                <button onclick="window.oModal('add-tkt')" class="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm hover:bg-indigo-700">
                    <i data-lucide="plus" class="w-4 h-4"></i> ${localStorage.getItem('lms_lang') === 'ru' ? 'Новый запрос' : 'Yangi so\'rov'}
                </button>
            </div>
            ${tickets.length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <i data-lucide="life-buoy" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Запросов нет' : 'Murojaatlar yo\'q'}</p>
            </div>` : `
            <div class="space-y-3">
                ${tickets.map(th => `
                <div onclick="window.oModal('view-tkt', ${th.id})" class="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] cursor-pointer">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-black text-sm text-slate-700">Ticket #${th.id} · ${th.user_name}</span>
                        <span class="px-2.5 py-1 ${th.status === 'Ochiq' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} rounded-lg text-[9px] font-black uppercase tracking-widest">${th.status}</span>
                    </div>
                    <p class="text-sm text-slate-500 font-medium">${th.message}</p>
                </div>`).join('')}
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── CHAT ──────────────────────────────────────────────────
async function v_chat() {
    try {
        const groups = await getGroups();
        const myGroup = STATE.user.groupId ? groups.find(g => g.id === STATE.user.groupId) : null;
        if (!myGroup) return `<div class="p-10 text-center"><p class="text-slate-400 font-black">Guruhga ulanmagansiz</p></div>`;
        const msgs = await api_get(`/chat/${myGroup.id}`);
        STATE.activeGroupId = myGroup.id;
        return `
        <div class="chat-container">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><i data-lucide="messages-square" class="w-5 h-5"></i></div>
                    <div>
                        <p class="font-black text-sm text-slate-800">${myGroup.name}</p>
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">Guruh Chati</p>
                    </div>
                </div>
            </div>
            <div class="chat-messages" id="chat-msgs">
                ${msgs.map(m => `
                <div class="msg-wrapper ${m.userId === STATE.user.id ? 'me' : 'other'}">
                    <div class="msg-bubble">${m.text}</div>
                    <span class="text-[9px] font-bold text-slate-400 px-1 mt-1">${m.userName} · ${m.time}</span>
                </div>`).join('')}
            </div>
            <form onsubmit="window.svChat(event)" class="p-3 md:p-4 bg-white border-t border-slate-100 flex gap-2 items-end">
                <input id="chat-input" required placeholder="Xabar yozish..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 transition-colors resize-none text-sm font-semibold">
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-md"><i data-lucide="send" class="w-5 h-5"></i></button>
            </form>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.svChat = async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    try {
        await api_post('/chat', { groupId: STATE.activeGroupId, text, type: 'text' });
        input.value = '';
        const box = document.getElementById('chat-msgs');
        const msg = document.createElement('div');
        msg.className = 'msg-wrapper me';
        msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="text-[9px] font-bold text-slate-400 px-1 mt-1">Siz</span>`;
        box.appendChild(msg);
        safeLucide(msg);
    } catch (e) { showToast(e.message, 'error'); }
};

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── LIBRARY ───────────────────────────────────────────────
async function v_library() {
    try {
        const books = await getBooks();
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('library')}</h1>
            ${books.length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Книг нет' : 'Kitoblar yo\'q'}</p>
            </div>` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                ${books.map(b => `
                <div class="glass-card p-5 rounded-[1.5rem] book-card">
                    <div class="book-img-container w-full h-48 rounded-2xl bg-slate-100 mb-4 overflow-hidden">
                        ${b.image.includes('http') ? `<img src="${b.image}" class="w-full h-full object-cover">` : '<div class="w-full h-full flex items-center justify-center"><i data-lucide="book" class="w-12 h-12 text-slate-300"></i></div>'}
                    </div>
                    <h3 class="font-black text-slate-800 text-base mb-1">${b.title}</h3>
                    <p class="text-xs text-slate-400 font-medium line-clamp-2">${b.description || ''}</p>
                    ${b.link && b.link !== '#' ? `<a href="${b.link}" target="_blank" class="mt-3 inline-block bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-indigo-600 transition-all">Kitobni ochish</a>` : ''}
                </div>`).join('')}
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

// ─── DUEL / GAME (simple) ──────────────────────────────────
async function v_duel() {
    try {
        const questions = await getQuestions();
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('duel')}</h1>
            ${questions.filter(q => q.type === 'duel').length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200"><p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Вопросов нет' : "Savollar yo'q"}</p></div>` : `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <i data-lucide="zap" class="w-12 h-12 text-amber-400 mx-auto mb-4"></i>
                <p class="text-slate-400 font-black mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'Сыграть в дуэль' : "Duel o'ynash"}</p>
                <button onclick="window.startDuelQuiz()" class="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30">${localStorage.getItem('lms_lang') === 'ru' ? 'Начать' : 'Boshlash'}</button>
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

async function v_game() {
    try {
        const questions = await getQuestions();
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('game')}</h1>
            ${questions.filter(q => q.type === 'mini_game').length === 0 ? `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200"><p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Вопросов нет' : "Savollar yo'q"}</p></div>` : `
            <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <i data-lucide="gamepad-2" class="w-12 h-12 text-purple-400 mx-auto mb-4"></i>
                <p class="text-slate-400 font-black mb-4">${localStorage.getItem('lms_lang') === 'ru' ? 'Мини-игра на баллы' : "Ballar uchun mini o'yin"}</p>
                <button onclick="window.startDuelQuiz()" class="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/30">${localStorage.getItem('lms_lang') === 'ru' ? 'Начать' : 'Boshlash'}</button>
            </div>`}
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.startDuelQuiz = async () => {
    try {
        const questions = await getQuestions();
        const qs = questions.filter(q => q.type === 'duel').slice(0, 5);
        if (qs.length === 0) { showToast(localStorage.getItem('lms_lang') === 'ru' ? 'Вопросов нет' : "Savollar yo'q", 'error'); return; }
        let idx = 0, score = 0;
        const showQ = () => {
            const q = qs[idx];
            const options = [
                { key: 'A', val: q.optionA }, { key: 'B', val: q.optionB },
                { key: 'C', val: q.optionC }, { key: 'D', val: q.optionD }
            ].filter(o => o.val);
            openModal(`
            <div class="bg-white p-6 md:p-10 rounded-[2rem] w-full max-w-lg animate-zoom">
                <div class="flex justify-between items-center mb-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-indigo-500">${localStorage.getItem('lms_lang') === 'ru' ? 'Вопрос' : 'Savol'} ${idx + 1}/${qs.length} · ${score} XP</p>
                    <button onclick="window.cModal()" class="text-slate-400 hover:text-red-500"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <h3 class="text-xl md:text-2xl font-black text-slate-800 mb-6">${q.questionText}</h3>
                <div class="space-y-3">
                    ${options.map((o, i) => `
                    <button onclick="window.quizAnswer(${i}, '${o.key}')" data-o="${i}" class="w-full text-left bg-slate-50 hover:bg-indigo-600 hover:text-white p-4 rounded-2xl font-bold text-sm md:text-base transition-all">${o.key}. ${o.val}</button>
                    `).join('')}
                </div>
            </div>`);
        };
        window.quizAnswer = async (i, key) => {
            const q = qs[idx];
            const abs = ['A', 'B', 'C', 'D'].indexOf(key) === ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer);
            const correct = abs;
            const btns = document.querySelectorAll('[data-o]');
            if (correct) {
                btns[i].className = 'w-full text-left bg-emerald-500 text-white p-4 rounded-2xl font-bold text-sm transition-all';
                score += 5;
            } else {
                btns[i].className = 'w-full text-left bg-red-500 text-white p-4 rounded-2xl font-bold text-sm transition-all';
            }
            await addPoints(correct ? 5 : 0, correct ? 'Duel' : 'Duel', 'duels');
            setTimeout(() => {
                idx++;
                if (idx < qs.length) showQ(); else {
                    cModal();
                    showToast(`${localStorage.getItem('lms_lang') === 'ru' ? 'Игра окончена' : "O'yin tugadi"} · ${score} XP`, 'success');
                    renderView(STATE.view);
                }
            }, 800);
        };
        showQ();
    } catch (e) { showToast(e.message, 'error'); }
};

// ─── QUESTIONS MGMT (admin) ────────────────────────────────
async function v_questions_mgmt() {
    try {
        const questions = await getQuestions();
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('questions')}</h1>
            <div class="bg-white rounded-[2rem] shadow-premium overflow-x-auto">
                <table class="w-full table-mobile-card text-left">
                    <thead>
                        <tr class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <th class="p-4">Savol</th><th class="p-4">Turi</th><th class="p-4">Javob</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${questions.map(q => `
                        <tr class="border-t border-slate-50">
                            <td data-label="Savol" class="p-4 text-sm font-bold text-slate-700">${q.questionText}</td>
                            <td data-label="Turi" class="p-4 text-sm">${q.type}</td>
                            <td data-label="Javob" class="p-4 text-sm text-indigo-600 font-black">${q.correctAnswer}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

async function v_staff_chat() {
    try {
        const msgs = await api_get('/staff-chat');
        STATE.activeGroupId = 0;
        return `
        <div class="chat-container">
            <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <h1 class="font-black text-sm text-slate-800">Jamoa Chati</h1>
            </div>
            <div class="chat-messages" id="chat-msgs">
                ${msgs.map(m => `
                <div class="msg-wrapper ${m.userId === STATE.user.id ? 'me' : 'other'}">
                    <div class="msg-bubble">${m.text}</div>
                    <span class="text-[9px] font-bold text-slate-400 px-1 mt-1">${m.userName} · ${m.time}</span>
                </div>`).join('')}
            </div>
            <form onsubmit="window.svStaffChat(event)" class="p-3 md:p-4 bg-white border-t border-slate-100 flex gap-2 items-end">
                <input id="chat-input" required placeholder="Xabar yozish..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 transition-colors resize-none text-sm font-semibold">
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-md"><i data-lucide="send" class="w-5 h-5"></i></button>
            </form>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

window.svStaffChat = async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    try {
        await api_post('/staff-chat', { text, type: 'text' });
        input.value = '';
        const box = document.getElementById('chat-msgs');
        const msg = document.createElement('div');
        msg.className = 'msg-wrapper me';
        msg.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div><span class="text-[9px] font-bold text-slate-400 px-1 mt-1">Siz</span>`;
        box.appendChild(msg);
    } catch (e) { showToast(e.message, 'error'); }
};

// ─── SCHEDULE ──────────────────────────────────────────────
async function v_schedule() {
    try {
        const groups = await getGroups();
        const myGroup = STATE.user.groupId
            ? groups.find(g => g.id === STATE.user.groupId)
            : STATE.user.role === 'ustoz'
                ? groups.find(g => g.ustozId === STATE.user.id)
                : null;
        if (!myGroup) return `<div class="p-10 text-center"><p class="text-slate-400 font-black">Jadval mavjud emas</p></div>`;
        const schedule = myGroup.schedule || [];
        if (schedule.length === 0) {
            return `
            <div class="space-y-6">
                <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('schedule')} — ${myGroup.name}</h1>
                <div class="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <i data-lucide="calendar" class="w-12 h-12 text-slate-300 mx-auto mb-4"></i>
                    <p class="text-slate-400 font-black">${localStorage.getItem('lms_lang') === 'ru' ? 'Расписание пустое' : "Jadval bo'sh"}</p>
                </div>
            </div>`;
        }
        return `
        <div class="space-y-6">
            <h1 class="text-2xl md:text-4xl font-black text-slate-800">${t('schedule')} — ${myGroup.name}</h1>
            <div class="space-y-3">
                ${schedule.map(s => `
                <div class="glass-card p-4 md:p-6 rounded-[1.5rem] flex items-center gap-4">
                    <div class="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex flex-col items-center justify-center shrink-0">
                        <span class="font-black text-lg leading-none">${s.day || ''}</span>
                    </div>
                    <div class="flex-1">
                        <p class="font-black text-sm md:text-base text-slate-700">${s.subject || s.title || ''}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${s.time || ''} · ${s.room || ''}</p>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    } catch (e) {
        return `<div class="text-center py-20"><p class="text-red-500 font-black">${e.message}</p></div>`;
    }
}

function v_posts() {
    return `<div class="max-w-4xl mx-auto space-y-6 animate-fade pb-20">
        <div class="flex justify-between items-center bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-premium">
            <div>
                <h2 class="text-2xl md:text-4xl font-black text-slate-800 mb-1">Yangiliklar</h2>
                <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">Platforma hayoti va yangiliklari</p>
            </div>
            ${['admin', 'ustoz'].includes(STATE.user?.role) ? `
            <button onclick="window.oModal('add-post')" class="bg-indigo-600 text-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                <i data-lucide="plus" class="w-5 h-5 md:w-6 md:h-6"></i>
            </button>` : ''}
        </div>
        <div id="posts-list" class="space-y-6">
            <div class="text-center py-10 md:py-20 bg-white rounded-[2rem] md:rounded-[3rem] border border-dashed border-slate-200">
                <p class="text-slate-400 font-black text-base md:text-xl">Postlar yuklanmoqda...</p>
            </div>
        </div>
    </div>`;
}

function v_profile() {
    const u = STATE.user;
    const stats = getUserStats(u);
    return `
    <div class="max-w-6xl mx-auto mt-4 md:mt-10">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            <div class="lg:col-span-1">
                <div class="premium-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-center bg-white border-slate-100 shadow-premium">
                    <div class="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6 group">
                        <div class="w-full h-full rounded-[2rem] bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl md:text-4xl font-black shadow-2xl overflow-hidden">
                            ${u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover">` : (u.ism?.[0] || 'U').toUpperCase()}
                        </div>
                    </div>
                    <h1 class="text-lg md:text-xl font-black text-slate-800 mb-1">${u.ism}</h1>
                    <span class="inline-block px-3 md:px-4 py-1 bg-slate-50 text-indigo-500 text-[8px] md:text-[9px] font-black uppercase rounded-full tracking-widest border border-slate-100">${u.role?.replace('_', ' ')}</span>
                    <div class="space-y-3 pt-4 md:pt-6 border-t border-slate-50 mt-4 md:mt-6">
                        <button onclick="window.logout()" class="w-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors bg-red-50 py-2.5 md:py-3 rounded-xl border border-red-100 flex items-center justify-center gap-2"><i data-lucide="log-out" class="w-3 h-3"></i> Chiqish</button>
                    </div>
                </div>
            </div>
            <div class="lg:col-span-3">
                <h2 class="text-xl md:text-3xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2 md:gap-3"><i data-lucide="bar-chart-2" class="text-indigo-600 w-6 h-6 md:w-8 md:h-8"></i> Shaxsiy Analitika</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div class="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white">
                        <i data-lucide="zap" class="text-amber-500 w-5 h-5 md:w-6 md:h-6 mb-2 md:mb-3"></i>
                        <p class="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Ballar</p>
                        <h3 class="text-xl md:text-2xl font-black text-slate-800">${stats.points}</h3>
                    </div>
                    <div class="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-white">
                        <i data-lucide="trending-up" class="text-purple-600 w-5 h-5 md:w-6 md:h-6 mb-2 md:mb-3"></i>
                        <p class="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">Level</p>
                        <h3 class="text-xl md:text-2xl font-black text-slate-800">${stats.level}</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}



// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    setupInteractions();
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    checkOnboarding();
    syncLandingData();
    hideSplash();
});

// Hide splash screen (also on full window load as fallback)
function hideSplash() {
    setTimeout(() => {
        document.getElementById('splash-screen')?.classList.add('hide-splash');
    }, 1600);
}
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('splash-screen')?.classList.add('hide-splash');
    }, 1200);
});

// Keyboard shortcut
document.addEventListener('keydown', e => { if (e.key === 'Escape') cModal(); });
document.getElementById('modal-root')?.addEventListener('click', e => { if (e.target.id === 'modal-root') cModal(); });
