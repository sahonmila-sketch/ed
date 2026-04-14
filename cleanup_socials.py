import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update INITIAL_LANDING: Remove facebook_link
content = content.replace('facebook_link: "https://facebook.com/",', '')

# 2. Update v_home: Remove Facebook section from footer
old_social_grid = """                        <div class="grid grid-cols-2 gap-6">
                             <a href="${d.telegram_link || '#'}" target="_blank" class="flex items-center gap-4 text-slate-400 hover:text-indigo-400 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <i data-lucide="send" class="w-6 h-6"></i>
                                </div>
                                Telegram
                             </a>
                             <a href="${d.instagram_link || '#'}" target="_blank" class="flex items-center gap-4 text-slate-400 hover:text-pink-400 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all">
                                    <i data-lucide="instagram" class="w-6 h-6"></i>
                                </div>
                                Instagram
                             </a>
                             <a href="${d.facebook_link || '#'}" target="_blank" class="flex items-center gap-4 text-slate-400 hover:text-blue-500 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <i data-lucide="facebook" class="w-6 h-6"></i>
                                </div>
                                Facebook
                             </a>
                             <a href="${d.youtube_link || '#'}" target="_blank" class="flex items-center gap-4 text-slate-400 hover:text-red-500 font-bold transition-all group">
                                <div class="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all">
                                    <i data-lucide="youtube" class="w-6 h-6"></i>
                                </div>
                                YouTube
                             </a>
                        </div>"""

new_social_grid = """                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <a href="${d.telegram_link || '#'}" target="_blank" class="flex items-center gap-5 text-slate-400 hover:text-indigo-400 font-black tracking-wider transition-all group">
                                <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                                    <i data-lucide="send" class="w-7 h-7"></i>
                                </div>
                                TELEGRAM
                             </a>
                             <a href="${d.instagram_link || '#'}" target="_blank" class="flex items-center gap-5 text-slate-400 hover:text-pink-400 font-black tracking-wider transition-all group">
                                <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-all shadow-xl">
                                    <i data-lucide="instagram" class="w-7 h-7"></i>
                                </div>
                                INSTAGRAM
                             </a>
                             <a href="${d.youtube_link || '#'}" target="_blank" class="flex items-center gap-5 text-slate-400 hover:text-red-500 font-black tracking-wider transition-all group">
                                <div class="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-xl">
                                    <i data-lucide="youtube" class="w-7 h-7"></i>
                                </div>
                                YOUTUBE
                             </a>
                        </div>"""

content = content.replace(old_social_grid, new_social_grid)

# 3. Update Admin Modal for Social Links: Remove Facebook input
old_modal_socials = """                <input type="text" id="edit-tg" value="${d.telegram_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Telegram Link">
                <input type="text" id="edit-insta" value="${d.instagram_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Instagram Link">
                <input type="text" id="edit-fb" value="${d.facebook_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Facebook Link">
                <input type="text" id="edit-yt" value="${d.youtube_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="YouTube Link">"""

new_modal_socials = """                <input type="text" id="edit-tg" value="${d.telegram_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Telegram Link">
                <input type="text" id="edit-insta" value="${d.instagram_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Instagram Link">
                <input type="text" id="edit-yt" value="${d.youtube_link || ''}" class="w-full bg-slate-50 p-5 rounded-2xl border-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="YouTube Link (Facebook olib tashlandi)">"""

content = content.replace(old_modal_socials, new_modal_socials)

# 4. Update saveLandingChanges: Remove Facebook from the saved object
old_save_data = """            facebook_link: document.getElementById('edit-fb').value,
            youtube_link: document.getElementById('edit-yt').value,"""

new_save_data = """            youtube_link: document.getElementById('edit-yt').value,"""

content = content.replace(old_save_data, new_save_data)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Facebook removed. Telegram, Instagram, and YouTube preserved with enhanced icons.")
