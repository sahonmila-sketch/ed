import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the social grid with high-quality BRAND SVGs as requested (Like the professional Telegram look)
new_social_grid = """                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
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
                        </div>"""

# Robust replacement for the social section in v_home
content = re.sub(r'<div class="grid grid-cols-1 sm:grid-cols-2 gap-8">[\s\S]*?</div>\s*</div>', new_social_grid + '\n                    </div>', content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Social icons updated to high-quality BRAND LOGOTYPES. Cinematic look achieved.")
