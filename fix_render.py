import os

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

bad_render_view = """function renderView(view) {
    if (view === 'home') { const lc = document.getElementById('landing-content'); if (lc) { lc.innerHTML = v_home(); safeLucide(lc); } return; }

    const a = document.getElementById('dynamic-view-area');
    if (view === 'home') { const lc = document.getElementById('landing-content'); if (lc) { lc.innerHTML = v_home(); safeLucide(lc); } return; } a.innerHTML = ''; """

good_render_view = """function renderView(view) {
    if (view === 'home') { 
        const lc = document.getElementById('landing-content'); 
        if (lc) { lc.innerHTML = v_home(); safeLucide(lc); } 
        return; 
    }
    const a = document.getElementById('dynamic-view-area');
    a.innerHTML = ''; """

if bad_render_view in content:
    content = content.replace(bad_render_view, good_render_view)
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("renderView corrected.")
else:
    print("Could not find exact text for renderView correction.")
