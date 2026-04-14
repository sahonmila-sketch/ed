import os
import re

FILE_PATH = r"assets\js\app.js"

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Add target="_blank" to social links and replace v_home social section
content = content.replace('a href="${d.telegram_link || \'#\'}"', 'a href="${d.telegram_link || \'#\'}" target="_blank"')
content = content.replace('a href="${d.instagram_link || \'#\'}"', 'a href="${d.instagram_link || \'#\'}" target="_blank"')
content = content.replace('a href="${d.facebook_link || \'#\'}"', 'a href="${d.facebook_link || \'#\'}" target="_blank"')
content = content.replace('a href="${d.youtube_link || \'#\'}"', 'a href="${d.youtube_link || \'#\'}" target="_blank"')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Social links updated to open in new tab and synchronized with backend.")
