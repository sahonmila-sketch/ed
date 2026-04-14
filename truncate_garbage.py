import os

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line containing "window.deleteStaffChatMessage ="
target_line_idx = -1
for i, line in enumerate(lines):
    if "window.deleteStaffChatMessage =" in line:
        target_line_idx = i
        break

if target_line_idx == -1:
    print("Could not find deleteStaffChatMessage anchor.")
    exit()

# Find the closing brace "};" of this function
# It should be very soon after
closing_idx = -1
for i in range(target_line_idx, len(lines)):
    if "};" in lines[i]:
        closing_idx = i
        break

if closing_idx == -1:
    print("Could not find closing brace for anchor.")
    exit()

# Keep everything up to the closing brace (inclusive)
cleaned_lines = lines[:closing_idx + 1]

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.writelines(cleaned_lines)

print(f"App.js truncated at line {closing_idx + 1}. Garbage at the end removed.")
