# -*- coding: utf-8 -*-
"""Geolokatsiya va Telegram uchun alohida test (2-iteratsiyada ishlatiladi).

Ishga tushirish:
    python tools_geo_tg_test.py
Test o'z navbatida o'quvchining bugungi davomatini tozalaydi va XP ni
oldingi qiymatiga qaytaradi.
"""
import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:5000'
OK = FAIL = 0


def req(path, method='GET', token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer %s' % token if token else ''})
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            raw = resp.read()
            try:
                return resp.status, json.loads(raw)
            except ValueError:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, raw


def check(label, cond, extra=''):
    global OK, FAIL
    if cond:
        OK += 1
        print('  OK   %s  -> %s' % (label, extra))
    else:
        FAIL += 1
        print('  FAIL %s  -> %s' % (label, extra))


def main():
    # ── sessiya ───────────────────────────────────────────────────
    def login(email):
        return req('/api/auth/login', 'POST',
                   body={'email': email, 'password': '123456'})[1].get('token')

    st = login('talaba@lms.uz')
    ad = login('admin@lms.uz')
    check('student token', bool(st))
    check('admin token', bool(ad))

    start_xp, uid, gid = _who()
    START_XP[0] = start_xp
    check('xp o\u2018qildi', start_xp is not None, start_xp)

    print('\n== 1. GEO-INFO ==')
    code, gi = req('/api/attendance/geo-info')
    check('geo-info 200', code == 200, code)
    check('radius 5000', gi.get('radius') == 5000, gi.get('radius'))
    check('koordinata bor', bool(gi.get('lat')), gi.get('lat'))

    print('\n== 2. NOTO\u2018G\u2018RI KOORDINATA ==')
    code, r = req('/api/attendance/checkin', 'POST', st, {})
    check('400 beradi', code == 400, code)
    check('nogeo holati', r.get('status') == 'nogeo', r.get('status'))

    code, r = req('/api/attendance/checkin', 'POST', st, {'lat': 'abc', 'lng': 1})
    check('noto\u2018g\u2018ri lat 400', code == 400, code)

    print('\n== 3. ANIQLIK (accuracy) ==')
    subprocess_clear(st)
    # 1 km g\u2018arb, kolledjdan 8 km
    far = {'lat': 41.3111 + 0.072, 'lng': 69.2797, 'accuracy': 30}
    code, r = req('/api/attendance/checkin', 'POST', st, far)
    check('uzak = outside', r.get('status') == 'outside', r.get('distance'))
    check('distance qaytariladi', isinstance(r.get('distance'), int), r.get('distance'))
    check('radius qaytariladi', r.get('radius') == 5000, r.get('radius'))
    check('accuracy qaytariladi', r.get('accuracy') == 30, r.get('accuracy'))
    check('lowAccuracy False', r.get('lowAccuracy') is False, r.get('lowAccuracy'))
    check('geoChecked True', r.get('geoChecked') is True, r.get('geoChecked'))

    # Xuddi shu nuqtada, lekin GPS yomon: 8000 m xato
    noise = {'lat': 41.3111 + 0.072, 'lng': 69.2797, 'accuracy': 8000}
    code, r2 = req('/api/attendance/checkin', 'POST', st, noise)
    check('past aniqlik \u2014 lowAccuracy True', r2.get('lowAccuracy') is True,
          r2.get('accuracy'))
    check('past aniqlik \u2014 unreliable', r2.get('unreliable') is True, r2.get('status'))
    check('past aniqlik bilan avtomatik \u00abKeldi\u00bb qo\u2018yilmaydi',
          r2.get('checkedIn') is False, r2.get('checkedIn'))
    check('qo\u2018lda taklif qilinadi', 'Qo' in str(r2.get('message', '')),
          r2.get('message'))
    subprocess_clear(st)

    # Kolledjda, lekin GPS yaxshi emas (radius ichida) -> belgilanadi
    mid = {'lat': 41.3111 + 0.001, 'lng': 69.2797, 'accuracy': 900}
    code, r3 = req('/api/attendance/checkin', 'POST', st, mid)
    check('radius ichida + past aniqlik = present', r3.get('status') == 'present',
          '%s / d=%s a=%s' % (r3.get('status'), r3.get('distance'), r3.get('accuracy')))
    check('past aniqlik sababga yozildi', True, r3.get('message'))

    print('\n== 4. QO\u2018LDA BELGILASH ==')
    code, r = req('/api/attendance/checkin', 'POST', st, {'manual': True})
    check('sabasiz 400', code == 400, code)
    check('noreason holati', r.get('status') == 'noreason', r.get('status'))

    code, r = req('/api/attendance/checkin', 'POST', st, {'manual': True, 'reason': 'ab'})
    check('qisqa sabab 400', code == 400, code)

    # Bugungi davomatni tozalab, haqiqiy manual \u00abkelish\u00bb ni sinab ko\u2018ramiz
    subprocess_clear(st)

    code, r = req('/api/attendance/checkin', 'POST', st,
                  {'manual': True, 'reason': 'Wi-Fi yo\u2018q, GPS signal yo\u2018q'})
    check('manual 200', code == 200, code)
    check('manual status', r.get('status') == 'manual', r.get('status'))
    check('manual flag', r.get('manual') is True, r.get('manual'))
    check('manual +10 XP', r.get('bonus') == 10, r.get('bonus'))
    check('XP oshdi', r.get('points') == start_xp + 10,
          '%s -> %s' % (start_xp, r.get('points')))

    code, r = req('/api/attendance/checkin', 'POST', st,
                  {'manual': True, 'reason': 'yana urinish'})
    check('ikkinchi manual = already', r.get('already') is True, r.get('already'))
    check('qayta XP berilmaydi', r.get('points') == start_xp + 10, r.get('points'))

    _, att = req('/api/attendance/my', token=st)
    today = att[0]['date'] if att else ''
    check('davomatda saqlandi', any(a['status'] == 'manual' for a in att),
          [a['status'] for a in att])

    print('\n== 5. TELEGRAM ==')
    code, li = req('/api/telegram/link-info', token=st)
    check('link-info 200', code == 200, code)
    check('code beriladi', str(li.get('code', '')).startswith('oq'), li.get('code'))
    check('chatId bo\u2018sh (bog\u2018lanmagan)', not li.get('linked'), li.get('chatId'))

    code, r = req('/api/telegram/bind', 'POST', st, {'chatId': 'abc'})
    check('noto\u2018g\u2018ri chatId 400', code == 400, code)
    check('xato matni bor', 'Chat ID' in str(r.get('error', '')), r.get('error'))

    code, r = req('/api/telegram/bind', 'POST', st, {'chatId': '123456789'})
    check('raqamli chatId 200', code == 200, code)
    check('chatId saqlandi', r.get('chatId') == '123456789', r.get('chatId'))

    code, li = req('/api/telegram/link-info', token=st)
    check('end linked=True', li.get('linked') is True, li.get('linked'))

    code, r = req('/api/telegram/unbind', 'POST', st, {})
    check('unbind 200', code == 200, code)
    code, li = req('/api/telegram/link-info', token=st)
    check('end linked=False', li.get('linked') is False, li.get('linked'))

    print('\n== 6. TELEGRAM SOZLAMALAR (admin) ==')
    code, s1 = req('/api/settings', token=ad)
    check('admin username\u2018ni ko\u2018radi', 'telegramBotUsername' in s1,
          s1.get('telegramBotUsername'))
    check('token ko\u2018rinadi', 'telegramBotToken' in s1)

    code, s2 = req('/api/settings', token=st)
    check('student token ko\u2018rmaydi', 'telegramBotToken' not in s2)
    check('telegramBotEnabled ochiq', 'telegramBotEnabled' in s2, s2.get('telegramBotEnabled'))

    code, r = req('/api/settings', 'PATCH', ad,
                  {'telegramBotUsername': '@Test_Oquv_Bot'})
    check('username saqlandi', r.get('telegramBotUsername') == 'Test_Oquv_Bot',
          r.get('telegramBotUsername'))

    code, li = req('/api/telegram/link-info', token=st)
    check('deep-link yasaldi', 't.me/Test_Oquv_Bot?start=oq' in (li.get('botLink') or ''),
          li.get('botLink'))

    # Token yo'q bo'lsa "Tekshirish" aniq xato berishi kerak
    req('/api/settings', 'PATCH', ad, {'telegramBotToken': ''})
    code, r = req('/api/telegram/test', 'POST', ad, {})
    check('token yo\u2018q = 400', code == 400, code)
    check('aniq xabar', 'token' in str(r.get('message', '')).lower(), r.get('message'))

    req('/api/settings', 'PATCH', ad,
        {'telegramBotToken': '123456:AAFakeTokenForTest', 'telegramBotUsername': 'Test_Oquv_Bot'})
    code, r = req('/api/telegram/test', 'POST', ad, {})
    check('noto\u2018g\u2018ri token = 400', code == 400, code)
    check('Telegram xatosi ko\u2018rinadi', 'Telegram' in str(r.get('message', '')),
          r.get('message'))

    print('\n== 7. WEBHOOK HIMOYASI ==')
    code, _ = req('/api/telegram/webhook/wrong-token', 'POST', None, {'update_id': 1})
    check('noto\u2018g\u2018ri token 403', code == 403, code)

    # ══ TOZALASH ══════════════════════════════════════════════════
    cleanup(start_xp)

    print('\n' + '=' * 52)
    if FAIL:
        print('%d ta test YIQILDI (%d / %d)' % (FAIL, OK, FAIL))
    else:
        print('BARCHA TESTLAR O\u2018TDI (%d)' % OK)


def _clear_today(group_id, date):
    import sqlite3
    con = sqlite3.connect('lms.db')
    cur = con.cursor()
    cur.execute('SELECT records FROM attendance WHERE group_id=? AND date=?',
                (group_id, date))
    row = cur.fetchone()
    if row:
        rec = json.loads(row[0] or '{}')
        changed = False
        for key in list(rec):
            if rec[key] in ('present', 'manual'):
                rec[key] = 'absent'
                changed = True
        if changed:
            cur.execute('UPDATE attendance SET records=? WHERE group_id=? AND date=?',
                        (json.dumps(rec), group_id, date))
    con.commit()
    con.close()


def _clear_bonus(user_id, date):
    import sqlite3
    con = sqlite3.connect('lms.db')
    cur = con.cursor()
    cur.execute('SELECT daily_category_points FROM users WHERE id=?', (user_id,))
    row = cur.fetchone()
    if row:
        try:
            cat = json.loads(row[0] or '{}')
        except ValueError:
            cat = {}
        if 'checkin' in cat or 'other' in cat:
            cat.pop('checkin', None)
            cat.pop('other', None)
            cur.execute('UPDATE users SET daily_category_points=? WHERE id=?',
                        (json.dumps(cat), user_id))
    con.commit()
    con.close()


def _who():
    import sqlite3
    con = sqlite3.connect('lms.db')
    cur = con.cursor()
    cur.execute("SELECT xp, id, group_id FROM users WHERE email='talaba@lms.uz'")
    row = cur.fetchone()
    con.close()
    return row if row else (None, None, None)


START_XP = [0]


def subprocess_clear(st):
    import datetime
    import sqlite3
    _, uid, gid = _who()
    today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    _clear_today(gid, today)
    _clear_bonus(uid, today)
    if uid:
        con = sqlite3.connect('lms.db')
        con.execute('UPDATE users SET xp=? WHERE id=?', (START_XP[0], uid))
        con.commit()
        con.close()


def cleanup(start_xp):
    import sqlite3
    import datetime
    today = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    con = sqlite3.connect('lms.db')
    cur = con.cursor()
    _, uid, gid = _who()
    _clear_today(gid, today)
    _clear_bonus(uid, today)
    cur.execute('UPDATE users SET xp=? WHERE id=?', (start_xp, uid))
    con.commit()
    con.close()
    now_xp, _, _ = _who()
    print('  tozalandi: xp=%s (kerak edi %s)' % (now_xp, start_xp))


if __name__ == '__main__':
    main()
