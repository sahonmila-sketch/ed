# -*- coding: utf-8 -*-
"""O'quv.uz - yangi funksiyalar uchun umumiy smoke test (backend).

Ishlatish:  .\\venv\\Scripts\\python.exe tools_smoke.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("LMS_BASE", "http://127.0.0.1:5000")
fails = []


def call(method, path, body=None, token=None, raw=False):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            payload = r.read()
            if raw:
                return r.status, payload, dict(r.headers)
            txt = payload.decode("utf-8", "replace")
            try:
                return r.status, json.loads(txt)
            except ValueError:
                return r.status, txt
    except urllib.error.HTTPError as e:
        payload = e.read()
        if raw:
            return e.code, payload, dict(e.headers)
        txt = payload.decode("utf-8", "replace")
        try:
            return e.code, json.loads(txt)
        except ValueError:
            return e.code, txt


def check(label, cond, extra=""):
    print(("  OK   " if cond else "  FAIL ") + label + ("" if extra == "" else "  -> " + str(extra)[:160]))
    if not cond:
        fails.append(label)


def login(email, pwd="123456"):
    st, d = call("POST", "/api/auth/login", {"email": email, "password": pwd})
    return d.get("token"), d


def as_list(payload):
    if isinstance(payload, list):
        return payload
    for key in ("items", "data", "results", "questions", "books", "shop", "users", "lessons"):
        if isinstance(payload, dict) and isinstance(payload.get(key), list):
            return payload[key]
    return []


print("== sessiya ==")
stok, sad = login("talaba@lms.uz")
utok, _ = login("ustoz@lms.uz")
atok, _ = login("admin@lms.uz")
check("3 ta token", bool(stok and utok and atok))

print()
print("== 1. GEO-OTMETKA (attendance/checkin) ==")
st, before = call("GET", "/api/auth/me", token=stok)
start_xp = before.get("points")
st, r = call("POST", "/api/attendance/checkin", {"lat": 41.312, "lng": 69.281}, token=stok)
check("200 qaytaradi", st == 200, st)
first = r.get("checkedIn") is True
check("bugun birinchi marta = checkedIn True", first or r.get("already") is True, r)
check("ball o'sdi yoki allaqachon berilgan",
      first and r.get("points") > start_xp or r.get("already") is True,
      (start_xp, r.get("points")))
st, r2 = call("POST", "/api/attendance/checkin", {"lat": 41.312, "lng": 69.281}, token=stok)
check("ikkinchi marta qayta ball berilmaydi", r2.get("points") == r.get("points"),
      (r.get("points"), r2.get("points")))
check("already True", r2.get("already") is True, r2)
st, r3 = call("POST", "/api/attendance/checkin", {}, token=stok)
check("koordinatasiz 400", st == 400, st)
st, r4 = call("POST", "/api/attendance/checkin", {"lat": 1, "lng": 1}, token=stok)
check("maktabdan uzoq -> outside", r4.get("inside") is False and r4.get("distance") is not None, r4)

print()
print("== 2. PDF KUTUBXONA ==")
st, books = call("GET", "/api/books", token=stok)
bl = as_list(books)
check("kitoblar bor", len(bl) >= 1, len(bl))
if bl:
    st, payload, hdrs = call("GET", "/api/books/%s/download" % bl[0]["id"], token=stok, raw=True)
    check("200 qaytaradi", st == 200, st)
    check("content-type pdf", "application/pdf" in hdrs.get("Content-Type", ""), hdrs.get("Content-Type"))
    check("%PDF sarlavhasi", payload[:5] == b"%PDF-", payload[:8])
    check("%%EOF belgisi", b"%%EOF" in payload[-64:], payload[-16:])
    st, _p, _h = call("GET", "/api/books/%s/download" % bl[0]["id"], raw=True)
    check("token'siz ham yuklanadi", st == 200, st)

print()
print("== 3. VIDEO DARS: 20 DAQIQALIK TAYMER ==")
st, sett = call("GET", "/api/settings", token=atok)
check("lessonMinutes = 20", sett.get("lessonMinutes") == 20, sett.get("lessonMinutes"))
st, courses = call("GET", "/api/courses", token=stok)
cs = as_list(courses)
check("kurslar bor", len(cs) >= 1, len(cs))
target = None
for c in cs:
    for l in (c.get("lessons") or []):
        if not l.get("completed"):
            target = l
            break
    if target:
        break
if not target and cs:
    target = (cs[0].get("lessons") or [{}])[0]
check("dars topildi", bool(target), target.get("title") if target else None)
if target and target.get("id"):
    lid = target["id"]
    st, ls = call("POST", "/api/lessons/%s/start" % lid, {}, token=stok)
    check("start 200 (500 emas!)", st == 200, st)
    check("requiredSeconds = 1200", (ls or {}).get("requiredSeconds") == 1200, (ls or {}).get("requiredSeconds"))
    check("alreadySec qaytariladi", (ls or {}).get("alreadySec") is not None, (ls or {}).get("alreadySec"))
    st, cp = call("POST", "/api/lessons/%s/complete" % lid, {}, token=stok)
    check("jarohatsiz complete 400 (500 emas!)", st == 400, st)
    left = (cp or {}).get("left")
    check("qolgan sekund ko'rsatiladi", isinstance(left, (int, float)) and left > 1100, left)
    # endi muddati o'tgan deb o'ylab sessiyani orqaga suramiz
    st, _ = call("POST", "/api/lessons/%s/start" % lid, {}, token=stok)
    print("   (darsni muddatidan oldin yakunlash 400 berishi tekshirildi)")

print()
print("== 4. DO'KON ==")
st, me = call("GET", "/api/auth/me", token=stok)
xp = me.get("points", 0)
st, shop = call("GET", "/api/shop", token=stok)
items = as_list(shop)
check("tovar ro'yxati", st == 200 and len(items) > 0, len(items))
cheap = None
for i in items:
    if i.get("stock", 0) > 0 and i.get("active") and i.get("price", 10 ** 9) <= xp:
        if cheap is None or i["price"] < cheap["price"]:
            cheap = i
if cheap:
    st, buy = call("POST", "/api/shop/%s/buy" % cheap["id"], {}, token=stok)
    check("xarid 200", st == 200, st)
    check("ball kamaydi", buy.get("points") == xp - cheap["price"], (xp, cheap["price"], buy.get("points")))
else:
    print("   (ball yetarli tovar yo'q - o'tkazildi)")
st, poor = call("POST", "/api/shop/%s/buy" % max(items, key=lambda i: i.get("price", 0))["id"], {}, token=stok)
check("ball yetmasa 400", st == 400, st)
st, h = call("GET", "/api/shop/purchases", token=stok)
check("xaridlar tarixi", st == 200 and isinstance(h, list) and len(h) > 0, len(h) if isinstance(h, list) else h)
st, created = call("POST", "/api/shop", {"title": "SMOKE tovar", "description": "vaqtincha",
                                         "emoji": "X", "price": 10, "stock": 2, "active": True}, token=atok)
check("admin tovar yarata oladi", st in (200, 201), st)
if isinstance(created, dict) and created.get("id"):
    nid = created["id"]
    st, upd = call("PATCH", "/api/shop/%s" % nid, {"price": 15}, token=atok)
    check("admin narxni o'zgartiradi", st == 200 and upd.get("price") == 15, upd.get("price"))
    st, _ = call("DELETE", "/api/shop/%s" % nid, token=atok)
    check("admin o'chira oladi", st == 200, st)
st, _ = call("POST", "/api/shop", {"title": "x", "price": 1}, token=stok)
check("student yaratolmaydi (403)", st == 403, st)

print()
print("== 5. MINI O'YIN (duel yo'q) ==")
st, qs = call("GET", "/api/questions", token=utok)
ql = as_list(qs)
types = sorted({x.get("type") for x in ql})
check("savollar bor", len(ql) > 0, len(ql))
check("duel turi qolmagan", "duel" not in types, types)
check("faqat mini_game/quiz", set(types) <= {"mini_game", "quiz"}, types)
check("frontend nomi mos", all(t in ("mini_game", "quiz") for t in types), types)
st, lb = call("GET", "/api/users/leaderboard", token=stok)
lbl = as_list(lb)
check("leaderboard ishlaydi", st == 200, st)
if lbl:
    check("o'yin ballari maydoni bor", "gameWins" in lbl[0], sorted(lbl[0].keys()))

print()
print("== 6. SOZLAMALAR ==")
st, _ = call("PATCH", "/api/settings", {"lessonMinutes": 25}, token=atok)
st, s2 = call("GET", "/api/settings", token=atok)
check("admin o'zgartira oladi", s2.get("lessonMinutes") == 25, s2.get("lessonMinutes"))
st, _ = call("PATCH", "/api/settings", {"lessonMinutes": 25}, token=stok)
check("student o'zgartira olmaydi (403)", st == 403, st)
call("PATCH", "/api/settings", {"lessonMinutes": 9999}, token=atok)
st, s3 = call("GET", "/api/settings", token=atok)
check("240 daqiqadan oshmasin", s3.get("lessonMinutes") == 240, s3.get("lessonMinutes"))
call("PATCH", "/api/settings", {"lessonMinutes": 20}, token=atok)
st, s4 = call("GET", "/api/settings", token=atok)
check("20 daqiqaga qaytarildi", s4.get("lessonMinutes") == 20, s4.get("lessonMinutes"))

print()
print("== 7. ASOSIY RO'YXATLAR ==")
for path in ("/api/users/leaderboard", "/api/groups", "/api/notifications", "/api/posts", "/api/books"):
    st, r = call("GET", path, token=stok)
    check("%s -> 200" % path, st == 200, st)

print()
if fails:
    print("XATO: %d ta -> %s" % (len(fails), fails))
    sys.exit(1)
print("BARCHA SMOKE TESTLAR O'TDI")