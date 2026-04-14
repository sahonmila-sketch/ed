const fs = require('fs');
let c = fs.readFileSync('assets/js/app.js', 'utf8');

// 1. Migration step
const migrationStr = `    if (!db.questions) { db.questions = DEFAULT_DB.questions; updated = true; }`;
c = c.replace(migrationStr, migrationStr + `\n    if (!db.staffChatMessages) { db.staffChatMessages = []; updated = true; }`);

// 2. Add route mapping in renderView
const mapStr = `'questions_mgmt': v_questions_mgmt,`;
c = c.replace(mapStr, mapStr + `\n        'staff-chat': v_staff_chat,`);

// 3. Add to sidebar
const sidebarStr = `    if (r === 'admin' || r === 'tech_admin') {`;
c = c.replace(sidebarStr, `    if (['admin', 'tech_admin', 'director', 'ustoz'].includes(r)) {
        links.push({ id: 'staff-chat', icon: 'message-circle', label: "Jamoa Chati" });
    }
    if (r === 'admin' || r === 'tech_admin') {`);

// 4. Add v_staff_chat and its functions
const vStaffChatCode = `
// ======================== STAFF CHAT SYSTEM ========================
const v_staff_chat = () => {
    const db = getDB();
    const r = STATE.user.role;
    
    if (!['admin', 'tech_admin', 'director', 'ustoz'].includes(r)) {
        return \`<div class="p-10 text-center"><i data-lucide="lock" class="w-16 h-16 text-red-200 mx-auto mb-4"></i><h2 class="text-2xl font-black">Ruxsat yo'q</h2></div>\`;
    }

    const msgs = db.staffChatMessages || [];

    setTimeout(() => {
        const area = document.getElementById('staff-chat-messages-area');
        if (area) area.scrollTop = area.scrollHeight;
    }, 100);

    return \`
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
            \${msgs.map(m => {
                const isMe = m.userId === STATE.user.id;
                const rn = m.role === 'admin' ? 'Admin' : m.role === 'director' ? 'Direktor' : m.role === 'tech_admin' ? 'Tech Admin' : 'Ustoz';
                const rc = m.role === 'admin' ? 'bg-red-100 text-red-600' : m.role === 'director' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600';
                
                return \`
                <div class="msg-wrapper \${isMe ? 'me' : 'other'} w-full" id="staff-msg-\${m.id}">
                    <div class="flex items-center gap-2 mb-1 w-full \${isMe ? 'justify-end' : ''}">
                        <span class="msg-meta text-[10px] font-black uppercase text-slate-400">\${isMe ? 'Siz' : m.userName}</span>
                        \${!isMe ? \`<span class="text-[9px] font-black uppercase \${rc} px-1.5 py-0.5 rounded-md">\${rn}</span>\` : ''}
                    </div>
                    <div class="msg-bubble relative group/inner flex \${isMe ? 'justify-end' : 'justify-start'}">
                        \${(isMe || r === 'admin') ? \`
                            <button onclick="deleteStaffChatMessage(\${m.id})" class="absolute -top-3 \${isMe ? '-left-3' : '-right-3'} md:top-1/2 md:-translate-y-1/2 md:\${isMe ? '-left-10' : '-right-10'} opacity-100 md:opacity-0 md:group-hover/inner:opacity-100 transition-opacity p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm active:scale-95 z-20">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        \` : ''}
                        <div class="\${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 border border-slate-100'} p-4 rounded-2xl shadow-sm max-w-[85%] font-medium">
                            <p class="whitespace-pre-wrap">\${m.text}</p>
                            <div class="text-[9px] font-bold mt-2 \${isMe ? 'text-indigo-200 text-right' : 'text-slate-400 text-left'}">\${m.time}</div>
                        </div>
                    </div>
                </div>\`;
            }).join('')}
            \${msgs.length === 0 ? '<div class="text-center py-20 text-slate-400 font-bold">Xabarlar yo\\'q. Jamoaga salom yo\'llang!</div>' : ''}
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
    </div>\`;
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
`;

c += vStaffChatCode;

fs.writeFileSync('assets/js/app.js', c);
console.log('Appended staff chat smoothly!');
