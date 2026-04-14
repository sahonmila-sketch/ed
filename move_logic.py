import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Extract the landing logic block from the end
marker = "// ======================== LANDING PAGE STATE & SYNC ========================"
if marker in js:
    idx = js.find(marker)
    landing_logic = js[idx:]
    js = js[:idx]
else:
    print("Marker not found, nothing to move.")
    exit()

# 1.1 Remove landing page views/functions that might be in the logic if they should stay at the end
# Actually, it's better to keep the sync logic at the top and views at the end.
sync_logic_anchor = "// ======================== LANDING PAGE VIEWS ========================"
if sync_logic_anchor in landing_logic:
    sync_split = landing_logic.find(sync_logic_anchor)
    sync_part = landing_logic[:sync_split]
    view_part = landing_logic[sync_split:]
else:
    sync_part = landing_logic
    view_part = ""

# 2. Insert sync_part before DOMContentLoaded (usually around line 240)
anchor = "document.addEventListener('DOMContentLoaded', () => {"
if anchor in js:
    js = js.replace(anchor, sync_part.strip() + "\n\n" + anchor)

# 3. Put view_part back at the end
js = js.strip() + "\n\n" + view_part.strip()

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print("Logic moved to the top for proper hoisting/initialization.")
