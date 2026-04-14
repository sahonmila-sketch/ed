import os

FILE_PATH = r"assets\css\styles.css"
EXTRAS = """
/* EXTRA PREMIUM PORTAL STYLES */
.hero-glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 40px 100px -20px rgba(99, 102, 241, 0.1);
}

.floating-blob {
    position: absolute;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(80px);
    z-index: -1;
    animation: floating-blob 20s infinite alternate ease-in-out;
}

@keyframes floating-blob {
    0% { transform: translate(-10%, -10%) rotate(0deg); }
    100% { transform: translate(20%, 20%) rotate(30deg); }
}

.text-gradient {
    background: linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.portal-blue-bg {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%) !important;
    color: white !important;
}

.portal-card {
    background: white;
    border-radius: 40px;
    border: 1px solid rgba(241, 245, 249, 0.5);
    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.portal-card:hover {
    transform: translateY(-15px);
    box-shadow: 0 50px 100px -20px rgba(99, 102, 241, 0.15);
}

.stat-glow {
    position: relative;
    overflow: hidden;
}
"""

with open(FILE_PATH, 'a', encoding='utf-8') as f:
    f.write(EXTRAS)

print("CSS updated with extra premium styles.")
