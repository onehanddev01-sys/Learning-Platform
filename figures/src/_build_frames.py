# -*- coding: utf-8 -*-
# สร้าง HTML ของ "กรอบ" ที่เหลือทั้งหมดในบทที่ 2 (โค้ด/คำใบ้/ผังต้นไม้/wireframe)
# แล้วแทนที่บล็อกเดิมในไฟล์ .md ด้วยรูป PNG + ลบ tab ของรายการบทบาท (กันกรอบเกินตั้งใจ)
import re, os

HL = ('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github.min.css">\n'
      '<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js"></script>')

BASE_CSS = '''
  *{box-sizing:border-box;} html,body{margin:0;padding:0;background:#fff;}
  body{font-family:'Leelawadee UI','Tahoma',sans-serif;color:#1f2544;}
  #wrap{display:inline-block;padding:20px;}
'''

CODE_CSS = BASE_CSS + '''
  pre{margin:0;background:#f8f9fc;border:1.5px solid #d7dcec;border-radius:12px;padding:20px 26px;}
  code.hljs{background:transparent;padding:0;font-family:Consolas,'Courier New','Leelawadee UI',monospace;font-size:16px;line-height:1.7;}
'''

def code_page(lang, code):
    return ('<!doctype html><html lang="th"><head><meta charset="utf-8">' + HL +
            '<style>' + CODE_CSS + '</style></head><body><div id="wrap">'
            '<pre><code class="language-' + lang + '">' + code.replace('&', '&amp;').replace('<', '&lt;') +
            '</code></pre></div><script>hljs.highlightAll();</script></body></html>')

SHOWCODE = """text = '25'
number = int(text)
print(number + 5)"""

STARTER = """age = input('ปีนี้คุณอายุเท่าไร? ')
next_year = age + 1
print('ปีหน้าคุณจะอายุ ' + str(next_year) + ' ปี')"""

JSON_DOC = r'''{
  "email": "user1@example.com",
  "displayName": "ผู้เรียนหนึ่ง",
  "photoURL": "https://lh3.googleusercontent.com/a/...",
  "provider": "google.com",
  "role": "member",
  "createdAt": "2026-07-14T02:15:00.000Z",
  "updatedAt": "2026-07-14T08:40:12.000Z",
  "lastLoginAt": "2026-07-14T08:10:00.000Z",
  "lastDeviceLabel": "Chrome บน Windows",
  "progress": {
    "completed": ["m0", "m1", "m2", "m3", "mp1", "m4"],
    "currentMissionId": "m5",
    "capstoneDone": false,
    "hintState": { "m4": 2 }
  },
  "savedCode": {
    "m4": "age = int(input('อายุของคุณ: '))\nprint('ปีหน้าคุณจะอายุ', age + 1)"
  }
}'''

RULES = """rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // เอกสารของผู้ใช้: อ่านและเขียนได้เฉพาะเจ้าของเท่านั้น
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    // เส้นทางอื่นทั้งหมด: ปิดกั้นโดยปริยาย (ไม่มี allow = ไม่อนุญาต)
  }
}"""

TREE = """Cloud Firestore : learning-platform-abc67
│
└── users  (คอลเลกชัน)
    │
    ├── LxK9...uidA  (เอกสาร = ผู้เรียนคนที่ 1)
    │     ├── email            : "user1@example.com"
    │     ├── displayName      : "ผู้เรียนหนึ่ง"
    │     ├── photoURL         : "https://..."
    │     ├── provider         : "google.com"
    │     ├── role             : "member"
    │     ├── createdAt        : timestamp
    │     ├── updatedAt        : timestamp
    │     ├── lastLoginAt      : timestamp
    │     ├── lastDeviceLabel  : "Chrome บน Windows"
    │     ├── progress   (map) : { completed:[...], currentMissionId, capstoneDone, hintState:{...} }
    │     └── savedCode  (map) : { "m1":"...", "m3":"..." }
    │
    ├── Rt3P...uidB  (เอกสาร = ผู้เรียนคนที่ 2)
    │     └── ...
    │
    └── ...  (หนึ่งเอกสารต่อผู้เรียนหนึ่งคน)"""

HINTS_HTML = ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + BASE_CSS + '''
  .card{display:flex;gap:14px;align-items:flex-start;background:#fffbeb;border:1.5px solid #f5d78e;
        border-radius:12px;padding:14px 18px;margin-bottom:12px;width:860px;}
  .lv{flex:none;width:96px;font-weight:700;color:#b45309;font-size:14.5px;padding-top:2px;}
  .tx{font-size:15.5px;line-height:1.65;color:#3b3425;}
  code{font-family:Consolas,monospace;background:#f6edd8;padding:1px 6px;border-radius:4px;font-size:13.5px;}
</style></head><body><div id="wrap">
<div class="card"><div class="lv">ระดับ 1<br>กระตุ้นคิด</div><div class="tx">"อ่านข้อความ Error ดี ๆ มันบอกว่าข้อมูลสองชนิดบวกกันไม่ได้ — ตัวแปรไหนนะที่ยังเป็นข้อความอยู่?"</div></div>
<div class="card"><div class="lv">ระดับ 2<br>ชี้จุด</div><div class="tx">"ค่าที่ได้จากการถามผู้ใช้เป็นข้อความเสมอ ต้องแปลงเป็นตัวเลขก่อนเอาไปบวก — เครื่องมือแปลงอยู่ในตัวอย่างด้านซ้าย"</div></div>
<div class="card" style="margin-bottom:0"><div class="lv">ระดับ 3<br>เกือบเฉลย</div><div class="tx">"ครอบค่าที่รับมาด้วย <code>int()</code> เช่น แก้บรรทัดแรกให้แปลงคำตอบเป็นตัวเลขก่อนเก็บลงตัวแปร age"</div></div>
</div></body></html>''')

TREE_HTML = ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + BASE_CSS + '''
  pre{margin:0;background:#141b3d;color:#d7e0ff;border-radius:12px;padding:22px 28px;
      font-family:Consolas,'Courier New','Leelawadee UI',monospace;font-size:15px;line-height:1.75;}
</style></head><body><div id="wrap"><pre>''' + TREE + '</pre></div></body></html>')

# ---------- Wireframes (โครงหน้าจอแบบร่าง เทาอ่อน + หมายเลขกำกับ + คำอธิบายใต้ภาพ) ----------
WF_CSS = BASE_CSS + '''
  .screen{background:#fff;border:2px solid #8f97ab;border-radius:12px;overflow:hidden;position:relative;}
  .num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;
       background:#4b5364;color:#fff;font-size:12.5px;font-weight:700;flex:none;}
  .legend{margin-top:14px;font-size:13.5px;color:#4b5364;line-height:1.7;max-width:100%;}
  .legend .num{width:18px;height:18px;font-size:11px;margin-right:6px;vertical-align:-3px;}
  .topbar{background:#e8eaf0;border-bottom:1.5px solid #c9cede;display:flex;align-items:center;gap:12px;padding:10px 16px;font-size:13.5px;}
  .tag{background:#fff;border:1.5px solid #b6bcc9;border-radius:7px;padding:4px 12px;color:#4b5364;}
  .btn{border-radius:9px;padding:9px 22px;font-size:14.5px;display:inline-block;}
  .btn-solid{background:#5b6372;color:#fff;}
  .btn-line{background:#fff;border:1.5px solid #8f97ab;color:#4b5364;}
  .ph{border:1.5px dashed #b6bcc9;background:#f7f8fa;border-radius:9px;}
'''

WF_WELCOME = ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + WF_CSS + '''
  .hero{display:flex;flex-direction:column;align-items:center;gap:16px;padding:52px 40px 40px;}
  .t{font-size:26px;font-weight:700;color:#2b3245;} .s{font-size:14.5px;color:#6a7183;text-align:center;line-height:1.7;}
  .note{font-size:12.5px;color:#8a90a0;}
</style></head><body><div id="wrap">
<div class="screen" style="width:760px">
 <div class="hero">
  <div><span class="t">Python เริ่มจากศูนย์</span> <span class="num">1</span></div>
  <div class="s">ภารกิจฝึกเขียนโปรแกรมสำหรับคนที่ไม่เคยเขียนโค้ดมาก่อน<br>รันได้ทันทีในเบราว์เซอร์ ผิดได้ไม่มีหักคะแนน <span class="num">2</span></div>
  <div style="display:flex;gap:14px;align-items:center"><span class="btn btn-solid">เริ่มต้นเรียนรู้</span><span class="btn btn-line">ดูแผนที่บทเรียน</span> <span class="num">3</span></div>
  <div class="note">ไม่ต้องสมัครสมาชิก ไม่ต้องติดตั้งโปรแกรมใด ๆ <span class="num">4</span></div>
 </div>
</div>
<div class="legend" style="width:760px">
<span class="num">1</span> ชื่อเว็บ &nbsp; <span class="num">2</span> คำโปรยแนะนำกลุ่มเป้าหมาย &nbsp; <span class="num">3</span> ปุ่มหลัก (ข้อความเปลี่ยนตามความก้าวหน้า: เริ่มต้นเรียนรู้ / เรียนต่อจากที่ค้างไว้ / ทบทวนบทเรียน) และปุ่มรองไปหน้าแผนที่ &nbsp; <span class="num">4</span> หมายเหตุย้ำว่าไม่บังคับสมัครสมาชิก
</div></div></body></html>''')

WF_MAP = ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + WF_CSS + '''
  .body{padding:16px 18px 20px;display:flex;flex-direction:column;gap:14px;}
  .card{border:1.5px solid #c9cede;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;font-size:13.5px;color:#4b5364;}
  .dot{display:inline-block;width:11px;height:11px;border-radius:50%;border:1.5px solid #7d8598;margin-right:4px;}
  .dot.on{background:#5b6372;border-color:#5b6372;}
  .zone{font-size:13.5px;color:#2b3245;font-weight:700;margin-bottom:6px;}
  .row{display:flex;gap:10px;flex-wrap:wrap;}
  .node{border:1.5px solid #b6bcc9;border-radius:9px;padding:7px 13px;font-size:12.5px;color:#4b5364;background:#f7f8fa;}
  .node.done{background:#e8eaf0;border-style:solid;} .node.ready{border-color:#5b6372;border-width:2px;background:#fff;font-weight:700;}
  .node.lock{border-style:dashed;color:#9aa1b0;}
</style></head><body><div id="wrap">
<div class="screen" style="width:820px">
 <div class="topbar"><span class="tag">หน้าแรก</span><b style="margin:0 auto">แผนที่บทเรียน</b><span style="width:70px"></span> <span class="num">1</span></div>
 <div class="body">
  <div class="card">ความก้าวหน้าของคุณ&nbsp;
    <span><span class="dot on"></span><span class="dot on"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span> …</span>
    <span style="margin-left:auto" class="btn btn-line" >ลบความคืบหน้า</span> <span class="num">2</span></div>
  <div>
    <div class="zone">ปฐมนิเทศ — รู้จักสนามฝึก</div>
    <div class="row"><span class="node done">m0 · ผ่านแล้ว — ทบทวนได้</span> <span class="num">3</span></div>
  </div>
  <div>
    <div class="zone">Module 1: First Contact — พูดได้</div>
    <div class="row"><span class="node done">m1 · ผ่านแล้ว</span><span class="node done">m2 · ผ่านแล้ว</span><span class="node ready">m3 · พร้อมเรียน</span><span class="node lock">mp1 · ยังล็อกอยู่</span></div>
  </div>
  <div>
    <div class="zone">Module 2: ตัวเลขและการคำนวณ</div>
    <div class="row"><span class="node lock">m4 · ยังล็อกอยู่</span><span class="node lock">m5 · ยังล็อกอยู่</span><span class="node lock">m6 · ยังล็อกอยู่</span><span class="node lock">mp2 · ยังล็อกอยู่</span></div>
  </div>
  <div style="font-size:13px;color:#9aa1b0">⋮ &nbsp;(เรียงต่อเนื่องจนถึง Capstone)</div>
 </div>
</div>
<div class="legend" style="width:820px">
<span class="num">1</span> แถบบน (ปุ่มกลับหน้าแรก + ชื่อหน้า) &nbsp; <span class="num">2</span> การ์ดความก้าวหน้า — แสดงเป็นจุด (จุดทึบ = ผ่านแล้ว ไม่แสดงตัวเลขคะแนน) พร้อมปุ่มลบความคืบหน้าแบบยืนยัน 2 ชั้น &nbsp; <span class="num">3</span> แผนที่ภารกิจเรียงเป็นโซนตามหน่วยการเรียน แต่ละด่านมี 3 สถานะ: ผ่านแล้ว / พร้อมเรียน / ยังล็อกอยู่ (ปลดล็อกเมื่อผ่านด่านก่อนหน้า)
</div></div></body></html>''')

WF_MISSION = ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + WF_CSS + '''
  .grid{display:grid;grid-template-columns:300px 1fr;gap:12px;padding:14px;}
  .panel{border:1.5px solid #c9cede;border-radius:10px;background:#fff;}
  .p-h{background:#eef0f5;border-bottom:1.5px solid #c9cede;padding:8px 14px;font-size:13px;font-weight:700;color:#4b5364;
       display:flex;align-items:center;gap:10px;border-radius:9px 9px 0 0;}
  .lesson{padding:12px;display:flex;flex-direction:column;gap:8px;}
  .l-item{border:1.5px dashed #b6bcc9;border-radius:8px;padding:8px 12px;font-size:12.5px;color:#6a7183;background:#f7f8fa;}
  .code{font-family:Consolas,monospace;font-size:12.5px;color:#4b5364;padding:12px 14px;line-height:1.8;}
  .out{padding:12px 14px;font-size:12.5px;color:#6a7183;min-height:56px;}
  .taskbar{background:#e8eaf0;border-top:1.5px solid #c9cede;display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;color:#4b5364;}
</style></head><body><div id="wrap">
<div class="screen" style="width:960px">
 <div class="topbar"><span class="tag">แผนที่บทเรียน</span><b>Python เริ่มจากศูนย์</b><span style="margin-left:auto" class="tag">Module 2</span><span class="tag">บัญชี / เข้าสู่ระบบ</span> <span class="num">1</span></div>
 <div class="grid">
  <div class="panel">
   <div class="p-h">โซน 1: บทเรียน <span class="num">2</span></div>
   <div class="lesson">
    <div class="l-item">Hook — กระตุ้นความสนใจ</div>
    <div class="l-item">Show — โค้ดตัวอย่าง + ปุ่ม "ลองรันดู"</div>
    <div class="l-item">Explain — คำอธิบายภาษาคน</div>
    <div class="l-item">Task — โจทย์ของด่าน</div>
    <div class="l-item">คำศัพท์ประจำด่าน</div>
   </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">
   <div class="panel">
    <div class="p-h">โซน 2: เขียนโค้ด — "โค้ดของคุณ" <span style="margin-left:auto" class="btn btn-solid" >รันโค้ด</span> <span class="num">3</span></div>
    <div class="code">1&nbsp;&nbsp;age = input('...')<br>2&nbsp;&nbsp;...</div>
   </div>
   <div class="panel">
    <div class="p-h">โซน 3: ผลลัพธ์ <span class="num">4</span></div>
    <div class="out">(ผลการรันสด ช่องกรอก input หรือข้อความ Error ฉบับภาษาไทย)</div>
   </div>
  </div>
 </div>
 <div class="taskbar"><b>ภารกิจ:</b> &lt;โจทย์ของด่านนี้&gt;<span style="margin-left:auto" class="btn btn-line">ขอคำใบ้</span><span class="btn btn-solid">ด่านถัดไป</span> <span class="num">5</span></div>
</div>
<div class="legend" style="width:960px">
<span class="num">1</span> แถบบน: ปุ่มกลับแผนที่ ชื่อเว็บ ป้ายโมดูล และปุ่มบัญชี/เข้าสู่ระบบ &nbsp; <span class="num">2</span> โซนบทเรียนตามแม่แบบ 6 ส่วน &nbsp; <span class="num">3</span> ช่องเขียนโค้ด (CodeMirror) พร้อมปุ่มรันและคีย์ลัด Ctrl+Enter &nbsp; <span class="num">4</span> หน้าต่างผลลัพธ์ &nbsp; <span class="num">5</span> แถบภารกิจตรึงขอบล่างตลอดเวลา — แผงคำใบ้เลื่อนขึ้นเหนือแถบนี้เมื่อกดขอคำใบ้ และหน้าต่าง "ภารกิจสำเร็จ" เด้งกลางจอเฉพาะครั้งแรกที่ผ่านด่าน
</div></div></body></html>''')

PAGES = {
    '_code-m4-showcode.html': code_page('python', SHOWCODE),
    '_code-m4-starter.html':  code_page('python', STARTER),
    '_code-m4-hints.html':    HINTS_HTML,
    '_fig-2-4.html':          TREE_HTML,
    '_fig-2-5.html':          code_page('json', JSON_DOC),
    '_fig-2-7.html':          code_page('javascript', RULES),
    '_fig-2-10.html':         WF_WELCOME,
    '_fig-2-11.html':         WF_MAP,
    '_fig-2-12.html':         WF_MISSION,
}
os.makedirs('figures/src', exist_ok=True)
for name, htmlsrc in PAGES.items():
    open('figures/src/' + name, 'w', encoding='utf-8').write(htmlsrc)
print('wrote', len(PAGES), 'html files')

# ---------- แทนที่ในไฟล์ md ----------
md = [x for x in os.listdir('.') if x.endswith('.md') and x != 'IMPLEMENTATION_NOTES.md'][0]
lines = open(md, encoding='utf-8').read().split('\n')

SIGS = [
    ("text = '25'",                        '![โค้ดตัวอย่าง (showCode) ของด่าน m4](figures/code-m4-showcode.png)'),
    ("age = input('ปีนี้คุณอายุเท่าไร",      '![โค้ดตั้งต้น (starterCode) ของด่าน m4 ที่ฝังจุดบกพร่องไว้](figures/code-m4-starter.png)'),
    ('Cloud Firestore : learning-platform', '![ภาพที่ 2-4 โครงสร้างคอลเลกชันและเอกสารใน Cloud Firestore](figures/fig-2-4-collection-structure.png)'),
    ('"email": "user1@example.com"',        '![ภาพที่ 2-5 ตัวอย่างเอกสารข้อมูลผู้เรียนหนึ่งคนในรูปแบบ JSON](figures/fig-2-5-user-document-json.png)'),
    ("rules_version = '2'",                 '![ภาพที่ 2-7 กฎความปลอดภัยของ Cloud Firestore](figures/fig-2-7-security-rules.png)'),
    ('ไม่ต้องสมัครสมาชิก ไม่ต้องติดตั้ง',       '![ภาพที่ 2-10 โครงหน้าจอของหน้าต้อนรับ](figures/fig-2-10-wireframe-welcome.png)'),
    ('ความก้าวหน้าของคุณ',                   '![ภาพที่ 2-11 โครงหน้าจอของหน้าแผนที่ภารกิจ](figures/fig-2-11-wireframe-map.png)'),
    ('โซน 1: บทเรียน',                      '![ภาพที่ 2-12 โครงหน้าจอของหน้าบทเรียน](figures/fig-2-12-wireframe-mission.png)'),
]

out, i, replaced = [], 0, []
while i < len(lines):
    if lines[i].startswith('```'):
        j = i + 1
        while j < len(lines) and not lines[j].startswith('```'):
            j += 1
        block = '\n'.join(lines[i:j+1])
        img = next((img for sig, img in SIGS if sig in block), None)
        if img:
            out.append(img); replaced.append(img.split('(')[-1])
            i = j + 1; continue
    out.append(lines[i]); i += 1
lines = out

# คำใบ้ m4 (สามบรรทัดที่ขึ้นต้นด้วย tab + เลข) -> รูปเดียว
out, i, hint_done = [], 0, False
while i < len(lines):
    if not hint_done and re.match(r'^\t1\) ', lines[i]):
        j = i
        while j < len(lines) and (re.match(r'^\t\d\) ', lines[j]) or lines[j].strip() == ''):
            j += 1
        out.append('![คำใบ้ 3 ระดับของด่าน m4 ไล่จากกระตุ้นคิดไปเกือบเฉลย](figures/code-m4-hints.png)')
        out.append('')
        hint_done = True; i = j; continue
    out.append(lines[i]); i += 1
lines = out

# รายการบทบาทผู้ใช้ (หัวข้อ 4.14): ตัด tab นำหน้าออก ไม่ให้เรนเดอร์เป็นกรอบโดยไม่ตั้งใจ
lines = [re.sub(r'^\t(\d+\.\d+\))', r'\1', l) for l in lines]

open(md, 'w', encoding='utf-8').write('\n'.join(lines))
print('replaced blocks:', len(replaced))
for r in replaced: print(' ', r)
print('hints replaced:', hint_done)
