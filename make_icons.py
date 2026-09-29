"""
Генератор иконок O'quv.uz (PWA) — без внешних зависимостей.
Рисует скруглённый синий квадрат с белой шапкой выпускника и оранжевым шнурком,
сохраняя результат как PNG через zlib + struct.
"""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'img')
os.makedirs(OUT, exist_ok=True)

BLUE_HI = (59, 130, 246)     # #3b82f6
BLUE_LO = (23, 55, 138)      # #17378a
WHITE = (255, 255, 255)
WHITE_SOFT = (226, 232, 240)
ACCENT = (249, 115, 22)      # #f97316


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def render(size, ss=2):
    """Рендер с суперсэмплингом: возвращает байты RGBA."""
    n = size * ss
    px = bytearray(n * n * 4)

    radius = 0.225  # нормализованные единицы [0..1], как и остальная геометрия
    # геометрия в координатах [0..1]
    cap_cx, cap_cy = 0.5, 0.455
    cap_a, cap_b = 0.395, 0.185
    body_top, body_bot = 0.455, 0.615
    body_top_hw, body_bot_hw = 0.245, 0.175
    tassel_x = 0.5 + cap_a * 0.86
    tassel_w = 0.021
    tassel_top, tassel_bot = cap_cy - 0.02, cap_cy + 0.30
    knob_r = 0.030

    for py in range(n):
        fy = (py + 0.5) / n
        row = py * n * 4
        for pxi in range(n):
            fx = (pxi + 0.5) / n

            # --- скруглённый квадрат ( SDF ) ---
            hw = 0.5
            qx = abs(fx - 0.5) - (hw - radius)
            qy = abs(fy - 0.5) - (hw - radius)
            d = math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - radius
            if d > 0:
                continue

            # --- фон: диагональный градиент ---
            g = (fx * 0.45 + fy * 0.75)
            color = lerp(BLUE_HI, BLUE_LO, min(1.0, g))

            dx, dy = fx - cap_cx, fy - cap_cy

            # --- тулья (ромб) ---
            if abs(dx) / cap_a + abs(dy) / cap_b <= 1.0:
                color = WHITE
            # --- тело шапки (трапеция) ---
            elif body_top <= fy <= body_bot:
                t = (fy - body_top) / (body_bot - body_top)
                hw_local = body_top_hw + (body_bot_hw - body_top_hw) * t
                if abs(dx) <= hw_local:
                    color = WHITE_SOFT
            # --- шнурок ---
            elif (
                tassel_top <= fy <= tassel_bot
                and abs(fx - tassel_x) <= tassel_w
            ):
                color = ACCENT
            # --- колпачок шнурка ---
            elif math.hypot(fx - tassel_x, fy - tassel_bot) <= knob_r:
                color = ACCENT
            # --- кнопка поверх тульи ---
            elif math.hypot(dx, dy) <= 0.036:
                color = ACCENT

            o = row + pxi * 4
            px[o] = color[0]
            px[o + 1] = color[1]
            px[o + 2] = color[2]
            px[o + 3] = 255

    # --- даунсэмплинг ss x ss (с учётом альфы) ---
    out = bytearray(size * size * 4)
    area = ss * ss
    for y in range(size):
        for x in range(size):
            r = g = b = a = 0
            for dy in range(ss):
                base = ((y * ss + dy) * n + x * ss) * 4
                for dx in range(ss):
                    o = base + dx * 4
                    al = px[o + 3]
                    r += px[o] * al
                    g += px[o + 1] * al
                    b += px[o + 2] * al
                    a += al
            o = (y * size + x) * 4
            if a:
                out[o] = min(255, r // a)
                out[o + 1] = min(255, g // a)
                out[o + 2] = min(255, b // a)
            out[o + 3] = a // area
    return bytes(out)


def write_png(path, size, rgba, opaque=False):
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)  # filter: none
        line = bytearray(rgba[y * stride:(y + 1) * stride])
        if opaque:  # для maskable — сплошной фон без прозрачности
            for i in range(3, stride, 4):
                line[i] = 255
        raw += line

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print('  %-34s %6d bytes' % (os.path.basename(path), len(png)))


FAVICON_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#17378a"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>
  <path d="M32 15 L57 26.5 L32 38 L7 26.5 Z" fill="#fff"/>
  <path d="M15 31.5 L15 41 C15 41 21 45.5 32 45.5 C43 45.5 49 41 49 41 L49 31.5 L32 39.2 Z" fill="#e2e8f0"/>
  <circle cx="32" cy="26.4" r="2.4" fill="#f97316"/>
  <path d="M51.6 24.8 L51.6 45" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <circle cx="51.6" cy="47.2" r="3.1" fill="#f97316"/>
</svg>
'''

if __name__ == '__main__':
    print('Rendering icons...')
    for size, ss in ((192, 3), (512, 2)):
        write_png(os.path.join(OUT, 'icon-%dx%d.png' % (size, size)),
                  size, render(size, ss))
    # maskable: та же иконка, но со сплошным фоном (Android режет края)
    write_png(os.path.join(OUT, 'icon-maskable-512x512.png'),
              512, render(512, 2), opaque=True)
    with open(os.path.join(OUT, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(FAVICON_SVG)
    print('  favicon.svg')
    print('Done ->', OUT)
