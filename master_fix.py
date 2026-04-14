import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Extract ALL Landing Code from wherever it is
# We'll look for our markers
p1 = r"let LANDING_DATA = \{[\s\S]*?syncLandingData = async \(\) => \{[\s\S]*?\};"
p2 = r"window\.saveLandingData = async \(data\) => \{[\s\S]*?\};"
p3 = r"const v_home = \(\) => \{[\s\S]*?\};"
p4 = r"window\.oLandingEdit = \(\) => \{[\s\S]*?\};"
p5 = r"window\.saveLandingChanges = \(\) => \{[\s\S]*?\};"

def extract_and_remove(pattern, content):
    match = re.search(pattern, content)
    if match:
        code = match.group(0)
        content = content.replace(code, "")
        return code, content
    return "", content

code1, js = extract_and_remove(p1, js)
code2, js = extract_and_remove(p2, js)
code3, js = extract_and_remove(p3, js)
code4, js = extract_and_remove(p4, js)
code5, js = extract_and_remove(p5, js)

# Also remove the markers themselves if they are left behind
markers = [
    "// ======================== LANDING PAGE STATE & SYNC ========================",
    "// ======================== LANDING PAGE VIEWS ========================",
    "// ======================== PRE-LOGIN LANDING PAGE ========================"
]
for m in markers:
    js = js.replace(m, "")

# 2. Re-assemble the landing code into a single block
landing_block = f"\n\n// ============ START LANDING SYSTEM ============\n{code1}\n{code2}\n{code3}\n{code4}\n{code5}\n// ============ END LANDING SYSTEM ============\n\n"

# 3. Insert it at the TOP, right after GLOBAL variables but BEFORE any use
# Anchor: const API_BASE = '/api';
anchor = "const API_BASE = '/api';"
if anchor in js:
    js = js.replace(anchor, anchor + landing_block)
else:
    # Backup anchor
    js = landing_block + js

# 4. Final Cleanup of any stray duplicate sync calls or function names
# We'll do a simple replace for common mangling cases
js = js.replace("syncBackend(); syncLandingData(); syncLandingData();", "syncBackend(); syncLandingData();")
js = js.replace("syncBackend(); syncLandingData();\n    // Background Sync", "syncBackend(); syncLandingData();\n    setInterval(() => { syncBackend(); syncLandingData(); }, 30000);")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(js)

print("Master Fix: Landing code consolidated and moved to the top for zero-error hoisting.")
