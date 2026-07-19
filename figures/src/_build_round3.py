# -*- coding: utf-8 -*-
# รอบ 3: สร้างภาพ/ตารางที่เอกสารฉบับจัดใหม่ต้องการ + ภาพโค้ดประกอบหัวข้อเทคโนโลยี
import os, shutil, html as H

HL = ('<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github.min.css">\n'
      '<script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js"></script>')
BASE = "*{box-sizing:border-box;}html,body{margin:0;background:#fff;}body{font-family:'Leelawadee UI','Tahoma',sans-serif;color:#1f2544;}#wrap{display:inline-block;padding:20px;}"
TBL = ("table{border-collapse:collapse;font-family:'Leelawadee UI','Tahoma',sans-serif;font-size:15px;color:#1f2544;max-width:1220px;}"
       "th,td{border:1px solid #cfd6ea;padding:9px 13px;text-align:left;vertical-align:top;line-height:1.55;}"
       "th{background:#e9edf7;font-weight:700;color:#20264a;}tr:nth-child(even) td{background:#fafbfe;}"
       "code{font-family:Consolas,monospace;background:#eef0f6;padding:1px 5px;border-radius:4px;font-size:13px;}")

def table_page(rows):
    body = ''
    for i, r in enumerate(rows):
        tag = 'th' if i == 0 else 'td'
        body += '<tr>' + ''.join(f'<{tag}>{c}</{tag}>' for c in r) + '</tr>\n'
    return f'<!doctype html><html lang="th"><head><meta charset="utf-8"><style>{BASE}{TBL}</style></head><body><div id="wrap"><table>{body}</table></div></body></html>'

def code_page(lang, code):
    esc = code.replace('&', '&amp;').replace('<', '&lt;')
    return (f'<!doctype html><html lang="th"><head><meta charset="utf-8">{HL}<style>{BASE}'
            "pre{margin:0;background:#f8f9fc;border:1.5px solid #d7dcec;border-radius:12px;padding:20px 26px;}"
            "code.hljs{background:transparent;padding:0;font-family:Consolas,'Courier New','Leelawadee UI',monospace;font-size:16px;line-height:1.7;}"
            f'</style></head><body><div id="wrap"><pre><code class="language-{lang}">{esc}</code></pre></div>'
            '<script>hljs.highlightAll();</script></body></html>')

P = {}

P['table-2-2'] = table_page([
    ['องค์ประกอบเกม', 'การตัดสินใจ', 'เหตุผลเชิงทฤษฎี'],
    ['แผนที่ภารกิจแบบล็อก/ปลดล็อก', 'เลือกใช้', 'สร้างเป้าหมายชัดเจนและแรงจูงใจไปต่อทีละด่าน เป็นตัวแทนภายนอกของความก้าวหน้า'],
    ['ข้อความแสดงความสำเร็จเมื่อผ่านด่าน', 'เลือกใช้', 'เสริมการรับรู้ความสามารถของตนเอง (Mastery Experience)'],
    ['ระบบคำใบ้แบบเป็นขั้น', 'เลือกใช้', 'ช่วยเหลือเมื่อติดขัดโดยไม่เฉลยตรง ๆ ตามหลักนั่งร้านการเรียนรู้'],
    ['การสะสมแต้ม', 'เลือกไม่ใช้', 'เสี่ยงเปลี่ยนโฟกัสจากความเข้าใจไปสู่การไล่เก็บคะแนน ขัดกับแรงจูงใจภายใน (Self-Determination)'],
    ['กระดานจัดอันดับ (Leaderboard)', 'เลือกไม่ใช้', 'การเปรียบเทียบอย่างเปิดเผยบั่นทอนการรับรู้ความสามารถของผู้เริ่มต้นที่ยังไม่มั่นใจ'],
    ['สถิติการเข้าเรียนต่อเนื่อง (Streak)', 'เลือกไม่ใช้', 'สร้างความรู้สึกผิดเมื่อขาดเรียน ขัดกับการเรียนตามจังหวะของตนเอง'],
])

P['table-2-6'] = table_page([
    ['เครื่องมือ/ซอฟต์แวร์', 'ประเภท', 'บทบาทในโครงงาน'],
    ['Visual Studio Code', 'โปรแกรมแก้ไขโค้ด', 'เขียนและแก้ไขโค้ด HTML, CSS และ JavaScript ทั้งหมดของระบบ'],
    ['Git และ GitHub', 'ควบคุมเวอร์ชัน', 'บันทึกประวัติการแก้ไขโค้ด ย้อนกลับเมื่อผิดพลาด และเป็นแหล่งเชื่อมต่อการเผยแพร่'],
    ['Vercel', 'แพลตฟอร์มเผยแพร่', 'เผยแพร่เว็บสู่อินเทอร์เน็ต อัปเดตอัตโนมัติเมื่อโค้ดบน GitHub เปลี่ยน'],
    ['Firebase (Auth + Firestore)', 'บริการเบื้องหลัง (BaaS)', 'ระบบบัญชีผู้ใช้แบบไม่บังคับ และฐานข้อมูลซิงก์ความก้าวหน้าข้ามอุปกรณ์'],
    ['Node.js', 'สภาพแวดล้อมรัน JavaScript', 'รันชุดทดสอบอัตโนมัติของทุกด่านและระบบแปล Error นอกเบราว์เซอร์'],
    ['Claude', 'ปัญญาประดิษฐ์ผู้ช่วยพัฒนา', 'ช่วยออกแบบ เขียนและตรวจสอบโค้ด ทดสอบระบบ และจัดทำเอกสาร'],
    ['Microsoft Word / Excel / PowerPoint', 'ชุดโปรแกรมสำนักงาน', 'จัดทำรูปเล่มรายงาน คำนวณสถิติแบบสอบถาม และสไลด์นำเสนอ'],
])

P['table-2-html'] = table_page([
    ['องค์ประกอบ', 'หน้าที่ตามมาตรฐาน HTML5', 'จุดที่ใช้ในโครงงาน'],
    ['<code>&lt;header&gt;</code>', 'ส่วนหัวของหน้า', 'แถบบน: ปุ่มกลับ ชื่อเว็บ ป้ายโมดูล ปุ่มบัญชี'],
    ['<code>&lt;main&gt;</code>', 'เนื้อหาหลักของหน้า', 'พื้นที่บทเรียนและพื้นที่เขียนโค้ดของหน้า mission'],
    ['<code>&lt;section&gt;</code>', 'แบ่งเนื้อหาเป็นส่วนตามความหมาย', 'คอลัมน์บทเรียน และคอลัมน์เขียนโค้ด/ผลลัพธ์'],
    ['<code>&lt;aside&gt;</code>', 'เนื้อหาเสริมที่แยกจากเนื้อหาหลัก', 'แผงคำใบ้ที่เลื่อนขึ้นเหนือแถบภารกิจ'],
    ['<code>&lt;footer&gt;</code>', 'ส่วนท้ายของหน้า', 'แถบภารกิจ (Task Bar) ที่ตรึงขอบล่างตลอดเวลา'],
    ['<code>&lt;textarea&gt;</code>', 'ช่องรับข้อความหลายบรรทัด', 'ช่องเขียนโค้ดตั้งต้นก่อนถูกยกระดับเป็น CodeMirror'],
    ['<code>&lt;button&gt;</code>', 'ปุ่มกดสั่งงาน', 'ปุ่มรันโค้ด ปุ่มขอคำใบ้ ปุ่มด่านถัดไป'],
    ['<code>&lt;script&gt;</code>', 'โหลดและรันโค้ด JavaScript', 'โหลดไลบรารีและโมดูลตรรกะทั้งหมดของระบบ'],
])

P['table-2-css'] = table_page([
    ['คุณสมบัติ CSS3', 'ความหมาย', 'จุดที่ใช้ในโครงงาน'],
    ['ตัวแปร CSS (Custom Properties)', 'ประกาศค่าใช้ซ้ำ เช่น สีประจำระบบ ไว้ที่เดียว', 'ชุดสีทั้งเว็บใน <code>:root</code> เช่น สีส้มของ Error'],
    ['Flexbox', 'จัดวางองค์ประกอบในแนวแถวหรือคอลัมน์แบบยืดหยุ่น', 'แถบบน แถบภารกิจ และแถวปุ่มต่าง ๆ'],
    ['Grid', 'จัดหน้าเป็นตารางสองมิติ', 'ผังสองคอลัมน์ของหน้าบทเรียน (บทเรียน / โค้ด+ผลลัพธ์)'],
    ['Media Query', 'เปลี่ยนการแสดงผลตามขนาดจอ', 'ยุบเป็นคอลัมน์เดียวเมื่อจอแคบกว่า 1020px'],
    ['Transition และ Animation', 'ภาพเคลื่อนไหวนุ่มนวล', 'หน้าต่างภารกิจสำเร็จเด้งเข้า (win-pop)'],
    ['Border-radius / Box-shadow', 'มุมโค้งและเงา', 'การ์ดบทเรียน ปุ่ม และหน้าต่างยืนยันทั้งระบบ'],
    ['Position fixed', 'ตรึงองค์ประกอบไว้กับหน้าจอ', 'แถบภารกิจติดขอบล่างตลอดเวลา'],
])

P['table-2-js'] = table_page([
    ['หมวดไวยากรณ์', 'รูปแบบที่ใช้', 'ตัวอย่างจริงจากโครงงาน'],
    ['การประกาศตัวแปร', '<code>var</code> (รองรับเบราว์เซอร์กว้าง)', "<code>var KEY = 'pylearn_progress_v1';</code>"],
    ['ชนิดข้อมูล', 'string, number, boolean, array, object', '<code>completed: []</code>, <code>capstoneDone: false</code>'],
    ['ตัวดำเนินการเปรียบเทียบ', '<code>===</code>, <code>!==</code>, <code>&gt;=</code>', '<code>if (s.completed.indexOf(id) === -1)</code>'],
    ['ตัวดำเนินการตรรกะ', '<code>&amp;&amp;</code>, <code>||</code>, <code>!</code>', '<code>if (!storageOk) { ... }</code>'],
    ['เงื่อนไข', '<code>if / else if / else</code>', 'การเลือกสถานะด่าน: ผ่านแล้ว / พร้อมเรียน / ล็อก'],
    ['การวนซ้ำ', '<code>for</code> และ <code>forEach</code>', 'วนสร้างจุดความก้าวหน้าครบทุกด่านบนแผนที่'],
    ['ฟังก์ชัน', 'ประกาศด้วย <code>function</code> และส่งเป็น callback', '<code>Progress.update(function (s) { ... })</code>'],
    ['เหตุการณ์ (Event)', '<code>addEventListener</code>', 'ปุ่มรันโค้ด คีย์ลัด Ctrl+Enter การสลับแท็บ'],
    ['การหน่วงเวลา / ไม่ประสานเวลา', '<code>setTimeout</code>, Promise (<code>.then/.catch</code>)', 'หน่วงการส่งข้อมูลขึ้น Firestore (debounce)'],
])

P['fig-2-3-self-efficacy-sources'] = ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + BASE + '''
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;width:1000px;}
 .card{border:1.5px solid #d7dcec;border-radius:13px;background:#fbfbfe;padding:15px 17px;}
 .card h3{font-size:16px;margin:0 0 2px;color:#20264a;} .card .en{font-size:12px;color:#8b93b0;font-weight:500;}
 .card p{font-size:13.5px;color:#3b4258;margin:7px 0 0;line-height:1.55;}
 .sys{margin-top:9px;border-top:1px dashed #c9cede;padding-top:7px;font-size:13px;color:#4338ca;line-height:1.5;}
 .sys b{color:#4338ca;}
 .head{width:1000px;text-align:center;margin-bottom:14px;}
 .pill{display:inline-block;background:#141b3d;color:#e8ecfb;font-size:16.5px;font-weight:700;padding:9px 26px;border-radius:999px;}
</style></head><body><div id="wrap">
<div class="head"><span class="pill">แหล่งทั้งสี่ของการรับรู้ความสามารถของตนเอง (Bandura)</span></div>
<div class="grid">
<div class="card"><h3>1. ประสบการณ์ความสำเร็จโดยตรง <span class="en">(Mastery Experience)</span></h3><p>การได้ทำสำเร็จด้วยมือตนเอง — หลักฐานที่หนักแน่นที่สุด</p><div class="sys"><b>การตอบสนองของระบบ:</b> สำเร็จตั้งแต่โค้ดบรรทัดแรกในไม่กี่นาที ทุกด่านจบด้วยความสำเร็จ และ Win Message ระบุพฤติกรรมที่เพิ่งทำได้</div></div>
<div class="card"><h3>2. ประสบการณ์แทน <span class="en">(Vicarious Experience)</span></h3><p>เห็นคนที่คล้ายตนทำสำเร็จ</p><div class="sys"><b>การตอบสนองของระบบ:</b> โค้ดตัวอย่างที่กด "ลองรันดู" ได้ก่อนเขียนเอง แสดงให้เห็นว่างานนี้ทำได้จริง</div></div>
<div class="card"><h3>3. การโน้มน้าวทางสังคม <span class="en">(Social Persuasion)</span></h3><p>คำชมและกำลังใจจากผู้อื่น</p><div class="sys"><b>การตอบสนองของระบบ:</b> น้ำเสียงเป็นมิตรให้กำลังใจทั้งคำอธิบาย คำใบ้ และข้อความ Error</div></div>
<div class="card"><h3>4. สภาวะทางกายและอารมณ์ <span class="en">(Physiological / Affective States)</span></h3><p>ความเครียดและความกลัวที่ลดลงทำให้ประเมินตนเป็นบวกขึ้น</p><div class="sys"><b>การตอบสนองของระบบ:</b> สีส้มแทนสีแดง ไม่นับครั้งที่ผิด ไม่มีคะแนน/จับเวลา ทดลองซ้ำได้ไม่จำกัด</div></div>
</div></div></body></html>''')

P['code-html-structure'] = code_page('html', '''<body class="mission-page">
  <header class="topbar"> ... ปุ่มกลับ / ชื่อเว็บ / ปุ่มบัญชี ... </header>
  <main class="mission-layout">
    <section id="lesson-col"> ... บทเรียน (Hook → Show → Explain → Task) ... </section>
    <section class="work-col">
      <textarea id="code-editor"></textarea>   <!-- ช่องเขียนโค้ด -->
      <div id="output-panel"></div>            <!-- หน้าต่างผลลัพธ์ -->
    </section>
  </main>
  <aside id="hint-panel"> ... แผงคำใบ้ 3 ระดับ ... </aside>
  <footer class="taskbar"> ... โจทย์ของด่าน + ปุ่มขอคำใบ้ ... </footer>
</body>''')

P['code-css-vars'] = code_page('css', ''':root {
  --primary: #4f46e5;      /* สีหลักของระบบ */
  --orange: #b45309;       /* สี Error โทนส้ม — จงใจไม่ใช้สีแดง */
  --console-bg: #10152e;   /* พื้นหลังหน้าต่างผลลัพธ์แบบคอนโซล */
  --font-ui: 'Sarabun', 'Leelawadee UI', Tahoma, sans-serif;
}

/* จอแคบกว่า 1020px: ยุบผังสองคอลัมน์เหลือคอลัมน์เดียว */
@media (max-width: 1020px) {
  .mission-layout { grid-template-columns: 1fr; }
}''')

P['code-js-vars'] = code_page('javascript', '''// ตัวแปรและชนิดข้อมูลใน progress.js — สถานะเริ่มต้นของผู้เรียน
var KEY = 'pylearn_progress_v1';          // string

function defaultState() {
  return {
    version: 1,                // number
    completed: [],             // array — รายการด่านที่ผ่านแล้ว
    currentMissionId: 'm0',    // string
    capstoneDone: false,       // boolean
    savedCode: {},             // object — โค้ดค้างของแต่ละด่าน
  };
}''')

P['code-js-condition'] = code_page('javascript', '''// เงื่อนไข if/else ใน progress.js — กติกาปลดล็อกด่านแบบเส้นตรง
function isUnlocked(id) {
  var idx = missionIndex(id);
  if (idx === -1) return false;   // ไม่มีด่านนี้จริง
  if (idx === 0) return true;     // ด่านแรกปลดเสมอ
  return isCompleted(missions[idx - 1].id);  // ปลดเมื่อด่านก่อนหน้าผ่าน
}''')

P['code-js-loop'] = code_page('javascript', '''// ลูป for ใน map.js — วนสร้างจุดความก้าวหน้าครบทุกด่าน
for (var d = 0; d < MISSIONS.length; d++) {
  var done = Progress.isCompleted(MISSIONS[d].id);
  dotsHtml += '<span class="dot' + (done ? ' dot-done' : '') + '"></span>';
}

// ลูป forEach ใน sync.js — รวมด่านที่ผ่านจากทั้งสองฝั่ง (Union)
(local.completed || []).forEach(function (x) { seen[x] = 1; });
(cloud.completed || []).forEach(function (x) { seen[x] = 1; });''')

P['code-js-function'] = code_page('javascript', '''// ฟังก์ชันและ callback ใน progress.js — แก้สถานะผ่านฟังก์ชันแล้วบันทึกอัตโนมัติ
function update(fn) {
  var state = load();
  fn(state);        // เรียก callback ที่ผู้ใช้ส่งเข้ามาแก้ไขสถานะ
  save(state);
  return state;
}

// การใช้งาน: ส่งฟังก์ชันเข้าไปเป็นพารามิเตอร์
Progress.update(function (s) {
  if (s.completed.indexOf(id) === -1) s.completed.push(id);
});''')

P['code-js-dom'] = code_page('javascript', '''// DOM และเหตุการณ์ใน app.js — ผูกปุ่มรันโค้ดกับฟังก์ชันประมวลผล
var runBtn = document.getElementById('run-btn');
runBtn.addEventListener('click', runUserCode);

// คีย์ลัด Ctrl+Enter สั่งรันได้โดยไม่ต้องละมือจากแป้นพิมพ์
document.getElementById('code-editor').addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runUserCode();
});''')

P['code-js-async'] = code_page('javascript', '''// การทำงานแบบไม่ประสานเวลาใน sync.js — หน่วงการเขียนขึ้นคลาวด์ (debounce)
function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(function () {
    var state = Progress.load();
    FB.db.collection('users').doc(user.uid)
      .set(toCloud(state, user), { merge: true })
      .catch(function () { /* เขียนไม่สำเร็จก็ไม่ทำให้เว็บพัง */ });
  }, 1500);   // รวบการเปลี่ยนแปลงถี่ ๆ ให้เขียนครั้งเดียว
}''')

P['code-skulpt-config'] = code_page('javascript', '''// runner.js — ตั้งค่า Skulpt ก่อนรันโค้ดของผู้เรียน
Sk.configure({
  output: function (text) { ... },   // สตรีมผลลัพธ์เข้าหน้าต่างผลลัพธ์
  inputfun: promptLearner,           // input() → ช่องกรอกใน Output Panel
  execLimit: 3000,                   // จำกัดเวลารัน 3 วินาที กันลูปไม่จบ
  python3: true
});
Sk.misceval.asyncToPromise(function () {
  return Sk.importMainWithBody('<stdin>', false, code, true);
});''')

P['code-codemirror-config'] = code_page('javascript', '''// app.js — ยกระดับ textarea เป็นตัวแก้ไขโค้ด CodeMirror
editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
  mode: 'python',            // เน้นสีไวยากรณ์ภาษา Python
  lineNumbers: true,         // แสดงหมายเลขบรรทัด
  indentUnit: 4,
  indentWithTabs: false,     // Tab = ช่องว่าง 4 ช่องเสมอ
  lineWrapping: true,
  autoCloseBrackets: true    // ปิดวงเล็บ/เครื่องหมายคำพูดให้อัตโนมัติ
});''')

os.makedirs('figures/src', exist_ok=True)
for name, page in P.items():
    open(f'figures/src/_{name}.html', 'w', encoding='utf-8').write(page)
print('wrote', len(P), 'html files')

# ---- re-map ตารางเดิมให้ตรงเลขใหม่ของเอกสาร (copy PNG ที่เรนเดอร์แล้ว) ----
m = [('table-extra-1.png', 'table-2-1.png'), ('table-2-7.png', '_tmp_new_2-3.png'),
     ('table-2-8.png', 'table-2-4.png'), ('table-2-9.png', 'table-2-5.png'),
     ('table-extra-2.png', 'table-2-7.png')]
for src, dst in m:
    shutil.copy('figures/' + src, 'figures/' + dst)
shutil.move('figures/_tmp_new_2-3.png', 'figures/table-2-3.png')
print('remapped table pngs')
