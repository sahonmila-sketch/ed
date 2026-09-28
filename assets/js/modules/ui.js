function safeLucide(root = document) {
    try { if (window.lucide) lucide.createIcons({ root }); } catch (e) {}
}

function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    const bg = type === 'error' ? 'bg-red-500' : 'bg-slate-900';
    t.className = `p-3 md:p-4 rounded-xl shadow-xl text-white font-bold text-xs md:text-sm ${bg} animate-slide-right flex gap-2 items-center`;
    t.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" class="w-4 h-4 shrink-0"></i><span>${msg}</span>`;
    c.appendChild(t); safeLucide(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

function cModal() {
    STATE.activeTicketId = null;
    document.getElementById('modal-root').classList.replace('flex', 'hidden');
    stopLessonTimer();
}

function openModal(html) {
    const bg = document.getElementById('modal-root'), a = document.getElementById('modal-content-area');
    bg.classList.remove('hidden'); bg.classList.add('flex');
    a.innerHTML = html;
    safeLucide(a);
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar-container');
    const ov = document.getElementById('sidebar-overlay');
    const isOpen = !sb.classList.contains('-translate-x-full');
    sb.classList.toggle('-translate-x-full', isOpen);
    sb.classList.toggle('translate-x-0', !isOpen);
    if (ov) ov.classList.toggle('hidden', isOpen);
}

export { safeLucide, showToast, cModal, openModal, toggleSidebar };
