# -*- coding: utf-8 -*-
"""End-to-end smoke test: ro'yxatdan o'tish -> tasdiqlash -> kirish.

Ishlatish:  .\\venv\\Scripts\\python.exe tools_e2e_pending.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("LMS_BASE", "http://127.0.0.1:5000")
EMAIL = "e2e_test%s@lms.uz" % int(time.time() % 1000000)
PASSWORD = "123456"
FULL_NAME = "E2E Test User"

fails = []


def call(method, path, body=None, token=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read().decode("utf-8", "replace")
            try:
                return r.status, json.loads(raw)
            except ValueError:
                return r.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, raw


def check(label, cond, extra=""):
    print(("  OK   " if cond else "  FAIL ") + label + ("  -> " + str(extra) if extra != "" else ""))
    if not cond:
        fails.append(label)


print("== 1. ro'yxatdan o'tish (pending) ==")
st, reg = call("POST", "/api/auth/register",
               {"name": FULL_NAME, "email": EMAIL, "password": PASSWORD})
check("202 qaytaradi", st == 202, st)
check("status = pending", reg.get("status") == "pending", reg.get("status"))
check("token berilmaydi", not reg.get("token"))

print("== 2. pending holatda kirish bloklanadi ==")
st, lg = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
check("403 qaytaradi", st == 403, st)
check("xabar to'g'ri", "tasdiqlash" in str(lg.get("error", "")), lg.get("error"))

print("== 3. admin pending ro'yxatini ko'radi ==")
st, adm = call("POST", "/api/auth/login", {"email": "admin@lms.uz", "password": "123456"})
check("admin kirish 200", st == 200 and adm.get("token"), st)
atok = adm.get("token")
st, pend = call("GET", "/api/users/pending", token=atok)
check("pending ro'yxat 200", st == 200, st)
found = [u for u in (pend if isinstance(pend, list) else []) if u.get("email") == EMAIL]
check("yangi foydalanuvchi ro'yxatda", bool(found),
      [u.get("id") for u in (pend if isinstance(pend, list) else [])])
uid = found[0]["id"] if found else None

print("== 4. tasdiqlash (active) ==")
st, upd = call("PATCH", "/api/users/%s/status" % uid, {"status": "active"}, token=atok)
check("PATCH 200", st == 200, st)
check("status = active", upd.get("status") == "active", upd.get("status"))

print("== 5. endi kirish mumkin ==")
st, lg2 = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
check("200 qaytaradi", st == 200, st)
check("token beriladi", bool(lg2.get("token")))
stok = lg2.get("token")
check("kirgandan keyin status active", (lg2.get("user") or {}).get("status") == "active",
      (lg2.get("user") or {}).get("status"))

print("== 6. rad etish -> kirish yana bloklanadi ==")
st, upd2 = call("PATCH", "/api/users/%s/status" % uid, {"status": "rejected"}, token=atok)
check("PATCH 200", st == 200, st)
st, lg3 = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})
check("rad etilgan kirish 403", st == 403, st)

print("== 7. rol cheklovlari ==")
st, _ = call("GET", "/api/users/pending", token=atok)
check("admin /users/pending 200", st == 200, st)
st, _ = call("PATCH", "/api/users/%s/status" % uid, {"status": "active"})
check("token'siz PATCH 401", st == 401, st)

print("== 8. noto'g'ri holat qiymati ==")
st, r = call("PATCH", "/api/users/%s/status" % uid, {"status": "hacker"}, token=atok)
check("400 qaytaradi", st == 400, st)

print("== 9. sozlama ==")
st, sett = call("GET", "/api/settings")
check("settings 200", st == 200, st)
if st == 200:
    check("lessonMinutes raqam", isinstance(sett.get("lessonMinutes"), int), sett.get("lessonMinutes"))
    check("attendanceRadius > 0", (sett.get("attendanceRadius") or 0) > 0,
          sett.get("attendanceRadius"))
    check("telegramToken yashirilgan", "telegramBotToken" not in sett, list(sett.keys()))
st, sett2 = call("GET", "/api/settings", token=atok)
check("adminga token ko'rinadi", "telegramBotToken" in sett2, list(sett2.keys()) if st == 200 else st)

print()
if fails:
    print("XATO: %d ta test muvaffaqiyatsiz -> %s" % (len(fails), fails))
    sys.exit(1)
print("BARCHA TESTLAR O'TDI")