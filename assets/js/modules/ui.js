// ============================================================
// ui.js — UI primitives (icons, toasts, modals, sidebar)
// ============================================================

let FIELD_ID = 0;

/**
 * Barcha `.field` bloklaridagi label'ni uning maydoniga bog'laydi (`for`/`id`).
 * Aks holda label bosilganda fokus o'chmaydi va ekran o'quvchilarda
 * maydon nomi o'qilmaydi. `safeLucide` ichidan chaqiriladi, ya'ni
 * har bir HTML qo'yilgandan keyin avtomatik ishlaydi.
 */
function autoLabels(root = document) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.field').forEach((field) => {
        const label = field.querySelector('label');
        if (!label) return;
        const control = field.querySelector('input:not([type=hidden]), select, textarea');
        if (!control) return;
        if (!control.id) control.id = `fld-${++FIELD_ID}`;
        if (!label.htmlFor) label.htmlFor = control.id;
    });
}

function safeLucide(root = document) {
    try { autoLabels(root); } catch (e) { /* never break rendering for a11y sugar */ }
    try {
        if (window.lucide) lucide.createIcons({ root });
    } catch (e) { /* icons are decorative — never break the app for them */ }
}

const ICON = {
    success: 'check-circle-2',
    error: 'alert-circle',
    info: 'info',
    warn: 'triangle-alert',
};

function showToast(msg, type = 'success') {
    const stack = document.getElementById('toast-container');
    if (!stack) return;

    const kind = ['success', 'error', 'info', 'warn'].includes(type) ? type : 'info';
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    t.innerHTML = `<i data-lucide="${ICON[kind]}"></i><span>${escapeHtml(String(msg))}</span>`;
    stack.appendChild(t);
    safeLucide(t);

    const kill = () => {
        t.classList.add('out');
        setTimeout(() => t.remove(), 260);
    };
    const timer = setTimeout(kill, kind === 'error' ? 5000 : 3200);
    t.addEventListener('click', () => { clearTimeout(timer); kill(); });
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

/**
 * Modal — `html` is the inner markup of .modal-card.
 * Keeps body scroll locked while open and restores focus on close.
 */
let MODAL_LAST_FOCUS = null;

function openModal(html, size = '') {
    const root = document.getElementById('modal-root');
    const area = document.getElementById('modal-content-area');
    if (!root || !area) return;

    MODAL_LAST_FOCUS = document.activeElement;
    area.innerHTML = `<div class="modal-card ${size}">${html}</div>`;
    root.classList.remove('hidden');
    document.body.classList.add('modal-open');
    safeLucide(area);

    const card = area.querySelector('.modal-card');
    if (card) card.addEventListener('click', (e) => e.stopPropagation());
}

function cModal() {
    const root = document.getElementById('modal-root');
    if (root) {
        root.classList.add('hidden');
        const area = document.getElementById('modal-content-area');
        if (area) area.innerHTML = '';
    }
    document.body.classList.remove('modal-open');
    if (typeof stopLessonTimer === 'function') stopLessonTimer();
    if (MODAL_LAST_FOCUS && MODAL_LAST_FOCUS.focus) {
        try { MODAL_LAST_FOCUS.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
    MODAL_LAST_FOCUS = null;
}

/** Convenience: standard modal chrome with header + body + optional footer. */
function modalShell({ title, icon, body, footer = '', size = '' }) {
    return `
        <div class="modal-head">
            <div class="d-flex items-center gap-3" style="min-width:0">
                ${icon ? `<div class="card-icon">${icon}</div>` : ''}
                <div style="min-width:0">
                    <div class="modal-title truncate">${title}</div>
                </div>
            </div>
            <button class="btn-icon sm" onclick="cModal()" aria-label="Yopish">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
    `;
}

function toggleSidebar(force) {
    const sb = document.getElementById('sidebar-container');
    const ov = document.getElementById('sidebar-overlay');
    if (!sb) return;

    const isOpen = typeof force === 'boolean' ? force : !sb.classList.contains('is-open');
    sb.classList.toggle('is-open', isOpen);
    ov?.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen && window.innerWidth < 1024 ? 'hidden' : '';
}

function closeSidebar() {
    if (window.innerWidth >= 1024) return;
    toggleSidebar(false);
}

export {
    safeLucide, showToast, escapeHtml, cModal, openModal, modalShell,
    toggleSidebar, closeSidebar, autoLabels,
};
