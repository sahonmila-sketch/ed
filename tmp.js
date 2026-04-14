const fs = require('fs');

try {
    let c = fs.readFileSync('assets/js/app.js', 'utf8');

    // Replace CURRENT_LANG checks
    // Pattern matches: CURRENT_LANG==='ru'?'ruText':'uzText'
    const re = /CURRENT_LANG\s*===\s*'ru'\s*\?\s*(['"`])(.*?)\1\s*:\s*(['"`])(.*?)\3/g;
    c = c.replace(re, (match, q1, ruText, q2, uzText) => {
        return q2 + uzText + q2;
    });

    // Replace the language toggle HTML
    const toggleRe = /const langToggleHTML = `[\s\S]*?<\/div>`;/;
    c = c.replace(toggleRe, "const langToggleHTML = ``;\n    CURRENT_LANG = 'uz';");

    fs.writeFileSync('assets/js/app.js', c);
    console.log('Replaced successfully!');
} catch (e) {
    console.error(e);
}
