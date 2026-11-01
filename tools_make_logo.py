# -*- coding: utf-8 -*-
"""O'quv.uz logotipi generatori.

Statik rasm kutubxonasi yo'q (offline server), shuning uchun PNG qo'lda
yoziladi: 3x supersampling + own scanline/raster primitivlari + zlib.

Ishlatish:  python tools_make_logo.py
"""
import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img")

# ── palette ────────────────────────────────────────────────────────────
BLUE_DARK = (23, 52, 130)      # #173482
BLUE = (37, 99, 235)           # #2563eb
BLUE_LT = (96, 165, 250)       # #60a5fa
ORANGE = (249, 115, 22)        # #f97316
ORANGE_LT = (251, 146, 60)     # #fb923c
WHITE = (255, 255, 255)

SS = 3  # supersampling factor


class Canvas:
    def __init__(self, w, h):
        self.w = w * SS
        self.h = h * SS
        self.out_w = w
        self.out_h = h
        # float RGBA, premultiplied-ish straight alpha 0..1
        self.buf = [[0.0, 0.0, 0.0, 0.0] for _ in range(self.w * self.h)]

    # ── low level ──────────────────────────────────────────────────────
    def _blend(self, x, y, rgb, a):
        if x < 0 or y < 0 or x >= self.w or y >= self.h or a <= 0:
            return
        i = y * self.w + x
        dst = self.buf[i]
        da = dst[3]
        out_a = a + da * (1 - a)
        if out_a <= 0:
            dst[0] = dst[1] = dst[2] = dst[3] = 0.0
            return
        for c in range(3):
            src = rgb[c] / 255.0
            dst[c] = (src * a + dst[c] * da * (1 - a)) / out_a
        dst[3] = out_a

    def _shade(self, x, y, rgb_at):
        rgb, a = rgb_at(x, y)
        self._blend(x, y, rgb, a)

    # ── primitives ─────────────────────────────────────────────────────
    def fill(self, rgb, alpha=1.0):
        rgb_at = lambda x, y: (rgb, alpha)  # noqa: E731
        for y in range(self.h):
            for x in range(self.w):
                self._shade(x, y, rgb_at)

    def gradient(self, stops, angle_deg=135.0):
        """stops: [(pos 0..1, (r,g,b)), ...]"""
        rad = math.radians(angle_deg)
        dx, dy = math.cos(rad), math.sin(rad)
        # projection range of the canvas onto the gradient axis
        projs = [0 * dx + 0 * dy,
                 (self.w - 1) * dx + 0 * dy,
                 0 * dx + (self.h - 1) * dy,
                 (self.w - 1) * dx + (self.h - 1) * dy]
        p0, p1 = min(projs), max(projs)

        def color_at(p):
            for i in range(len(stops) - 1):
                t0, c0 = stops[i]
                t1, c1 = stops[i + 1]
                if t0 <= p <= t1:
                    f = (p - t0) / (t1 - t0) if t1 > t0 else 0.0
                    return tuple(c0[k] + (c1[k] - c0[k]) * f for k in range(3))
            return stops[-1][1] if p > 1 else stops[0][1]

        for y in range(self.h):
            for x in range(self.w):
                p = (x * dx + y * dy - p0) / (p1 - p0)
                self._blend(x, y, color_at(p), 1.0)

    def polygon(self, pts, rgb, alpha=1.0):
        """Even-odd scanline fill of a polygon given in canvas pixels."""
        S = SS
        pp = [(x * S, y * S) for x, y in pts]
        n = len(pp)
        ys = [p[1] for p in pp]
        y_start = max(0, int(math.floor(min(ys))))
        y_end = min(self.h - 1, int(math.ceil(max(ys))))
        for y in range(y_start, y_end + 1):
            yc = y + 0.5
            xs = []
            for i in range(n):
                x1, y1 = pp[i]
                x2, y2 = pp[(i + 1) % n]
                if (y1 <= yc < y2) or (y2 <= yc < y1):
                    xs.append(x1 + (yc - y1) * (x2 - x1) / (y2 - y1))
            xs.sort()
            for k in range(0, len(xs) - 1, 2):
                xa = int(math.ceil(xs[k] - 0.5))
                xb = int(math.floor(xs[k + 1] - 0.5))
                for x in range(max(0, xa), min(self.w - 1, xb) + 1):
                    self._blend(x, y, rgb, alpha)

    def circle(self, cx, cy, r, rgb, alpha=1.0):
        cx, cy, r = cx * SS, cy * SS, r * SS
        for y in range(max(0, int(cy - r) - 1), min(self.h, int(cy + r) + 2)):
            dy2 = (y + 0.5 - cy) ** 2
            if dy2 > r * r:
                continue
            half = math.sqrt(max(0.0, r * r - dy2))
            for x in range(max(0, int(cx - half) - 1), min(self.w, int(cx + half) + 2)):
                dx = x + 0.5 - cx
                if dx * dx + dy2 <= r * r:
                    self._blend(x, y, rgb, alpha)

    def round_rect(self, x, y, w, h, r, rgb, alpha=1.0):
        """Rounded rectangle. `rgb` may be an (r,g,b) tuple or a
        callable(t) -> (r,g,b) with t running top (0) to bottom (1)."""
        S = SS
        x, y, w, h, r = x * S, y * S, w * S, h * S, r * S
        callable_rgb = callable(rgb)
        for py in range(max(0, int(y)), min(self.h, int(y + h) + 1)):
            t = (py + 0.5 - y) / h if h else 0.0
            color = rgb(min(1.0, max(0.0, t))) if callable_rgb else rgb
            for px in range(max(0, int(x)), min(self.w, int(x + w) + 1)):
                lx, ly = px - x, py - y
                cx = min(max(lx, r), w - r)
                cy = min(max(ly, r), h - r)
                if (lx - cx) ** 2 + (ly - cy) ** 2 > r * r + 0.001:
                    continue
                self._blend(px, py, color, alpha)

    def capsule(self, x1, y1, x2, y2, r, rgb, alpha=1.0):
        """thick line segment with round caps"""
        S = SS
        x1, y1, x2, y2, r = x1 * S, y1 * S, x2 * S, y2 * S, r * S
        minx = int(min(x1, x2) - r - 1)
        maxx = int(max(x1, x2) + r + 2)
        miny = int(min(y1, y2) - r - 1)
        maxy = int(max(y1, y2) + r + 2)
        dx, dy = x2 - x1, y2 - y1
        ln2 = dx * dx + dy * dy
        for py in range(max(0, miny), min(self.h, maxy)):
            for px in range(max(0, minx), min(self.w, maxx)):
                fx, fy = px + 0.5 - x1, py + 0.5 - y1
                if ln2 <= 0:
                    t = 0.0
                else:
                    t = (fx * dx + fy * dy) / ln2
                    t = min(1.0, max(0.0, t))
                qx, qy = fx - t * dx, fy - t * dy
                if qx * qx + qy * qy <= r * r:
                    self._blend(px, py, rgb, alpha)

    def cut(self, x, y, w, h, r):
        """erase a rounded rectangle (alpha -> 0)"""
        S = SS
        x, y, w, h, r = x * S, y * S, w * S, h * S, r * S
        for py in range(max(0, int(y)), min(self.h, int(y + h) + 1)):
            for px in range(max(0, int(x)), min(self.w, int(x + w) + 1)):
                lx, ly = px - x, py - y
                cx = min(max(lx, r), w - r)
                cy = min(max(ly, r), h - r)
                if (lx - cx) ** 2 + (ly - cy) ** 2 <= r * r:
                    self.buf[py * self.w + px][3] = 0.0

    # ── export ─────────────────────────────────────────────────────────
    def save(self, path):
        ow, oh = self.out_w, self.out_h
        rows = []
        for y in range(oh):
            row = bytearray([0])
            for x in range(ow):
                acc = [0.0, 0.0, 0.0, 0.0]
                for sy in range(SS):
                    row_i = (y * SS + sy) * self.w
                    for sx in range(SS):
                        p = self.buf[row_i + x * SS + sx]
                        for c in range(4):
                            acc[c] += p[c]
                n = SS * SS
                a = acc[3] / n
                if a > 0.0001:
                    # буфер хранит цвет как straight alpha в диапазоне 0..1
                    r = acc[0] / n / a * 255.0
                    g = acc[1] / n / a * 255.0
                    b = acc[2] / n / a * 255.0
                else:
                    r = g = b = 0.0
                row += bytes((int(round(min(255.0, max(0.0, r)))),
                              int(round(min(255.0, max(0.0, g)))),
                              int(round(min(255.0, max(0.0, b)))),
                              int(round(min(255.0, max(0.0, a * 255.0))))))
            rows.append(bytes(row))
        raw = b"".join(rows)

        def chunk(typ, data):
            return (struct.pack(">I", len(data)) + typ + data
                    + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF))

        png = (b"\x89PNG\r\n\x1a\n"
               + chunk(b"IHDR", struct.pack(">IIBBBBB", ow, oh, 8, 6, 0, 0, 0))
               + chunk(b"IDAT", zlib.compress(raw, 9))
               + chunk(b"IEND", b""))
        with open(path, "wb") as f:
            f.write(png)
        return len(png)


def stops_color(stops, t):
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t0 <= t <= t1:
            f = (t - t0) / (t1 - t0) if t1 > t0 else 0.0
            return tuple(c0[k] + (c1[k] - c0[k]) * f for k in range(3))
    return stops[-1][1] if t > 1 else stops[0][1]


# ── the mark ───────────────────────────────────────────────────────────
def draw_mark(c, ox=0, oy=0, s=1.0, blue=BLUE, blue_dk=BLUE_DARK,
              blue_lt=BLUE_LT, orange=ORANGE, orange_lt=ORANGE_LT,
              white=WHITE):
    """Graduation cap: blue board + cup, orange tassel + sparkle.
    Coordinates live in a 512x512 design space, scaled by `s`."""
    def X(v):
        return ox + v * s

    def Y(v):
        return oy + v * s

    def R(v):
        return v * s

    # --- board (diamond), lower half slightly darker -> depth ---
    c.polygon([(X(p[0]), Y(p[1])) for p in
               [(256, 84), (476, 196), (256, 308), (36, 196)]], blue_lt)
    c.polygon([(X(p[0]), Y(p[1])) for p in
               [(256, 196), (476, 196), (256, 308), (36, 196)]], blue)
    # soft highlight on the upper-left facet
    c.polygon([(X(p[0]), Y(p[1])) for p in
               [(256, 96), (408, 178), (256, 260), (104, 178)]],
              (min(255, blue_lt[0] + 10), min(255, blue_lt[1] + 14),
               min(255, blue_lt[2] + 14)), 0.5)

    # --- cap body (cup) ---
    c.polygon([(X(p[0]), Y(p[1])) for p in
               [(170, 266), (342, 266), (324, 408), (188, 408)]], blue_dk)
    c.round_rect(X(192), Y(288), R(128), R(102), R(28), blue)
    # orange band along the bottom of the cup -> brand accent
    c.round_rect(X(200), Y(392), R(112), R(24), R(12), orange)

    # --- tassel: cord from the board's right tip down to a knot ---
    c.capsule(X(446), Y(208), X(474), Y(322), R(11), blue_dk)
    c.circle(X(476), Y(352), R(40), orange)
    c.circle(X(464), Y(340), R(17), orange_lt, 0.9)

    # --- sparkle, upper-left: "o'rganish" ---
    star = [(116, 58), (128, 100), (170, 112), (128, 124),
            (116, 166), (104, 124), (62, 112), (104, 100)]
    c.polygon([(X(p[0]), Y(p[1])) for p in star], white, 0.95)


def alpha_bbox(c, thresh=0.28):
    minx, miny, maxx, maxy = c.w, c.h, -1, -1
    for y in range(c.h):
        row = y * c.w
        for x in range(c.w):
            if c.buf[row + x][3] > thresh:
                if x < minx:
                    minx = x
                if x > maxx:
                    maxx = x
                if y < miny:
                    miny = y
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return None
    return minx, miny, maxx, maxy


def fit_transform(c, out_size, draw_fn, fill=0.94):
    """Render once to measure, then re-render scaled so the art fills
    `fill` of the canvas (centred).

    Everything below is in OUTPUT pixels: probe renders at scale s0, the
    measured bbox lets us solve for the scale/offset that centres the art
    at the requested coverage.
    """
    s0 = out_size / 512.0
    probe = Canvas(out_size, out_size)
    draw_fn(probe, 0.0, 0.0, s0)
    bb = alpha_bbox(probe)
    if not bb:
        return 0.0, 0.0, s0
    # probe pixels -> output pixels
    x0, y0 = bb[0] / SS, bb[1] / SS
    w_out = (bb[2] - bb[0] + 1) / SS
    h_out = (bb[3] - bb[1] + 1) / SS
    target = out_size * fill
    k = min(target / w_out, target / h_out)      # scale factor vs. probe
    s1 = s0 * k
    ox = (out_size - w_out * k) / 2.0 - x0
    oy = (out_size - h_out * k) / 2.0 - y0
    return ox, oy, s1


def badge_background(c, size, r, radius_frac=0.22, for_maskable=False):
    """Clean blue plate. Orange lives only in the mark — a translucent
    orange wash over the blue turned the plate muddy."""
    if for_maskable:
        c.fill(BLUE_DARK)
        c.round_rect(0, 0, size * 0.80, size * 0.80, size * 0.16, BLUE)
        return
    plate = [(0.0, (52, 120, 245)), (0.55, BLUE), (1.0, BLUE_DARK)]
    c.round_rect(0, 0, size, size, size * radius_frac,
                 lambda t: stops_color(plate, t))
    # diagonal gloss, top-left corner only
    c.polygon([(0, 0), (size * 0.62, 0), (0, size * 0.62)], WHITE, 0.10)


def build_logo(path, size=512):
    """Glyph only, transparent background (sits on the white tile)."""
    fill = 0.96
    ox, oy, s = fit_transform(size, size, draw_mark, fill)
    c = Canvas(size, size)
    draw_mark(c, ox, oy, s)
    return c.save(path)


def build_icon(path, size, maskable=False):
    c = Canvas(size, size)
    badge_background(c, size, size, for_maskable=maskable)
    # maskable needs a safe zone (the OS may crop up to 20%)
    fill = 0.56 if maskable else 0.76

    def white_mark(t, ox, oy, sc):
        draw_mark(t, ox, oy, sc,
                  blue=(255, 255, 255), blue_dk=(219, 238, 255),
                  blue_lt=(255, 255, 255), orange=ORANGE_LT,
                  orange_lt=(255, 216, 174), white=WHITE)

    ox, oy, s = fit_transform(size, size, white_mark, fill)
    white_mark(c, ox, oy, s)
    return c.save(path)


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    made = [
        (os.path.join(OUT_DIR, "logo.png"), build_logo(os.path.join(OUT_DIR, "logo.png"))),
    ]
    for size, name in ((180, "icon-180.png"), (192, "icon-192.png"),
                       (512, "icon-512.png")):
        build_icon(os.path.join(OUT_DIR, name), size)
    build_icon(os.path.join(OUT_DIR, "icon-maskable-512.png"), 512, maskable=True)
    print("logo.png rebuilt, icons regenerated")
