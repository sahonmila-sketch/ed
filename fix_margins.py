import os

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix handleRoute
old_handle = """    if (hash === 'login' || hash === 'register' || hash === 'home') {
        const v = document.getElementById(`view-${hash}`);
        v.style.display = hash === 'home' ? 'block' : 'flex'; v.classList.remove('hidden');
        v.style.opacity = '1';
        v.classList.add('animate-slide-up');
        wrapper.style.display = 'none';
        sidebar.classList.add('hidden');
        if (hash === 'register') renderRegisterGroups(); if (hash === 'home') renderView('home');
    } else {"""

new_handle = """    const main = document.getElementById('main-content');
    if (hash === 'login' || hash === 'register' || hash === 'home') {
        const v = document.getElementById(`view-${hash}`);
        v.style.display = hash === 'home' ? 'block' : 'flex'; v.classList.remove('hidden');
        v.style.opacity = '1';
        v.classList.add('animate-slide-up');
        wrapper.style.display = 'none';
        sidebar.classList.add('hidden');
        main.classList.remove('lg:ml-72');
        if (hash === 'register') renderRegisterGroups(); if (hash === 'home') renderView('home');
    } else {"""

if old_handle in content:
    content = content.replace(old_handle, new_handle)
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("handleRoute margins fixed.")
else:
    print("handleRoute anchor not found.")
