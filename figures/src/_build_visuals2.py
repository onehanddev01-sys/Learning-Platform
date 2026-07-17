# -*- coding: utf-8 -*-
# สร้าง HTML ของภาพ/ตารางชุดใหม่สำหรับหัวข้อ 2, 3, 5, 7 ของบทที่ 2
import os

BASE_CSS = '''
  *{box-sizing:border-box;} html,body{margin:0;padding:0;background:#fff;}
  body{font-family:'Leelawadee UI','Tahoma',sans-serif;color:#1f2544;}
  #wrap{display:inline-block;padding:20px;}
'''

TABLE_CSS = BASE_CSS + '''
  table{border-collapse:collapse;font-size:15px;max-width:1220px;}
  th,td{border:1px solid #cfd6ea;padding:9px 13px;text-align:left;vertical-align:top;line-height:1.55;}
  th{background:#e9edf7;font-weight:700;color:#20264a;}
  tr:nth-child(even) td{background:#fafbfe;}
  .use{color:#1e8e3e;font-weight:700;} .nouse{color:#b45309;font-weight:700;}
'''

def page(css, body):
    return ('<!doctype html><html lang="th"><head><meta charset="utf-8"><style>' + css +
            '</style></head><body><div id="wrap">' + body + '</div></body></html>')

# ---------- ภาพที่ 2-3: สี่แหล่งของ Self-Efficacy ----------
SE_CSS = BASE_CSS + '''
  .canvas{width:1000px;padding:8px 4px;}
  .title{font-size:23px;font-weight:700;text-align:center;}
  .subtitle{font-size:14px;text-align:center;color:#6b7280;margin:8px 0 16px;}
  .center-wrap{text-align:center;margin-bottom:18px;}
  .center-pill{display:inline-block;background:#141b3d;color:#e8ecfb;font-size:17px;font-weight:700;padding:10px 28px;border-radius:999px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .card{border:1.5px solid #d7dcec;border-radius:14px;padding:15px 17px;background:#fbfbfe;}
  .head{display:flex;gap:12px;align-items:center;margin-bottom:6px;}
  .num{flex:none;width:34px;height:34px;border-radius:50%;background:#4f46e5;color:#fff;font-weight:700;font-size:17px;display:flex;align-items:center;justify-content:center;}
  h3{font-size:15.5px;margin:0;} .en{font-size:12px;color:#8b93b0;font-weight:500;}
  p{font-size:13px;color:#3b4258;margin:4px 0 8px;line-height:1.55;}
  .sys{font-size:12.5px;color:#4338ca;background:#eef0ff;border-radius:8px;padding:7px 10px;line-height:1.55;}
  .sys b{color:#312e81;}
'''
SE_BODY = '''<div class="canvas">
<div class="title">แหล่งทั้งสี่ของการรับรู้ความสามารถของตนเอง (Sources of Self-Efficacy)</div>
<div class="subtitle">ตามทฤษฎีของ Bandura และการตอบสนองของระบบต่อแต่ละแหล่ง</div>
<div class="center-wrap"><span class="center-pill">การรับรู้ความสามารถของตนเอง (Self-Efficacy)</span></div>
<div class="grid">
<div class="card"><div class="head"><div class="num">1</div><h3>ประสบการณ์ความสำเร็จโดยตรง <span class="en">(Mastery Experience)</span></h3></div>
<p>แหล่งที่ทรงพลังที่สุด — การได้ทำสำเร็จด้วยมือตนเองเป็นหลักฐานที่หนักแน่นกว่าคำพูดใด ๆ</p>
<div class="sys"><b>ในระบบ:</b> บทเรียนแรกสำเร็จภายในไม่กี่นาที ทุกด่านจบด้วยความสำเร็จที่จับต้องได้ และ Win Message ระบุพฤติกรรมที่เพิ่งทำได้จริง</div></div>
<div class="card"><div class="head"><div class="num">2</div><h3>ประสบการณ์แทน <span class="en">(Vicarious Experience)</span></h3></div>
<p>การเห็นคนที่คล้ายตนทำสำเร็จ ทำให้เชื่อว่าตนก็ทำได้เช่นกัน</p>
<div class="sys"><b>ในระบบ:</b> โค้ดตัวอย่าง (Show) ที่กดรันดูผลได้จริงก่อนต้องเขียนเอง — เห็นว่าโค้ดแบบนี้ทำงานได้จริงก่อนลงมือ</div></div>
<div class="card"><div class="head"><div class="num">3</div><h3>การโน้มน้าวทางสังคม <span class="en">(Social Persuasion)</span></h3></div>
<p>คำชมและกำลังใจจากผู้อื่นช่วยเสริมความเชื่อมั่น</p>
<div class="sys"><b>ในระบบ:</b> น้ำเสียงเป็นมิตรและให้กำลังใจตลอดทั้งระบบ ตั้งแต่คำอธิบาย คำใบ้ ไปจนถึงข้อความแสดงข้อผิดพลาด</div></div>
<div class="card"><div class="head"><div class="num">4</div><h3>สภาวะทางกายและอารมณ์ <span class="en">(Physiological and Affective States)</span></h3></div>
<p>ความเครียดหรือความกลัวที่ลดลง ทำให้การประเมินความสามารถของตนเป็นบวกขึ้น</p>
<div class="sys"><b>ในระบบ:</b> สีส้มแทนสีแดง ไม่จับเวลา ไม่นับจำนวนครั้งที่ผิด และทดลองซ้ำได้ไม่จำกัด</div></div>
</div></div>'''

# ---------- ตารางที่ 2-8: เกมมิฟิเคชันใช้/ไม่ใช้ ----------
GAMI_BODY = '''<table>
<tr><th>องค์ประกอบเกมมิฟิเคชัน</th><th>สถานะ</th><th>เหตุผลเชิงทฤษฎี</th></tr>
<tr><td>แผนที่ภารกิจแบบล็อกและปลดล็อก</td><td class="use">เลือกใช้</td><td>สร้างเป้าหมายชัดเจนและแรงจูงใจให้ไปต่อทีละด่าน พร้อมเป็นตัวแทนภายนอกของความก้าวหน้าที่ลดภาระความจำใช้งาน</td></tr>
<tr><td>ข้อความแสดงความสำเร็จเมื่อผ่านด่าน</td><td class="use">เลือกใช้</td><td>เสริมการรับรู้ความสามารถของตนเอง (Self-Efficacy) ด้วยการระบุพฤติกรรมที่ผู้เรียนเพิ่งทำได้</td></tr>
<tr><td>ระบบคำใบ้แบบเป็นขั้น</td><td class="use">เลือกใช้</td><td>ช่วยเหลือเมื่อติดขัดโดยไม่เฉลยตรง ๆ ตามหลักนั่งร้านการเรียนรู้ (Scaffolding)</td></tr>
<tr><td>การสะสมแต้ม/คะแนน</td><td class="nouse">เลือกไม่ใช้</td><td>เสี่ยงเปลี่ยนโฟกัสจากการเข้าใจเนื้อหาไปสู่การไล่เก็บคะแนน ขัดกับการสร้างแรงจูงใจภายในตามทฤษฎีการกำหนดตนเอง</td></tr>
<tr><td>กระดานจัดอันดับ (Leaderboard)</td><td class="nouse">เลือกไม่ใช้</td><td>การเปรียบเทียบกับผู้อื่นอย่างเปิดเผยอาจบั่นทอนการรับรู้ความสามารถของผู้เริ่มต้นที่ยังไม่มั่นใจ โดยเฉพาะผู้ที่อยู่อันดับท้าย</td></tr>
<tr><td>สถิติการเข้าเรียนต่อเนื่อง (Streak)</td><td class="nouse">เลือกไม่ใช้</td><td>สร้างความรู้สึกผิดเมื่อผู้เรียนขาดเรียนแม้เพียงวันเดียว ขัดกับการให้ผู้เรียนเรียนตามจังหวะของตนเอง</td></tr>
</table>'''

# ---------- ตารางที่ 2-22: สรุปเครื่องมือ ----------
TOOLS_BODY = '''<table>
<tr><th>เครื่องมือ</th><th>ประเภท</th><th>บทบาทในโครงงาน</th></tr>
<tr><td>Visual Studio Code</td><td>โปรแกรมแก้ไขโค้ด</td><td>เครื่องมือหลักในการเขียนและแก้ไขโค้ด HTML, CSS และ JavaScript ของระบบทั้งหมด</td></tr>
<tr><td>Git และ GitHub</td><td>ระบบควบคุมเวอร์ชัน</td><td>จัดเก็บโค้ดและบันทึกประวัติการแก้ไข ย้อนกลับเมื่อผิดพลาด และเชื่อมต่อกับบริการเผยแพร่อัตโนมัติ</td></tr>
<tr><td>Vercel</td><td>แพลตฟอร์มเผยแพร่เว็บ</td><td>เผยแพร่ระบบบนอินเทอร์เน็ต อัปเดตอัตโนมัติทุกครั้งที่โค้ดบน GitHub เปลี่ยน</td></tr>
<tr><td>Firebase</td><td>บริการเบื้องหลังสำเร็จรูป (BaaS)</td><td>ระบบยืนยันตัวตน (Authentication) และฐานข้อมูลคลาวด์ (Cloud Firestore) สำหรับการซิงก์ความก้าวหน้าข้ามอุปกรณ์</td></tr>
<tr><td>Node.js</td><td>สภาพแวดล้อมรัน JavaScript</td><td>รันชุดทดสอบอัตโนมัติของโมดูลตรรกะนอกเบราว์เซอร์ (ทดสอบทุกด่าน + ทดสอบเชิงปรปักษ์ 44 กรณี)</td></tr>
<tr><td>Claude</td><td>ปัญญาประดิษฐ์ผู้ช่วยพัฒนา</td><td>ช่วยออกแบบระบบ เขียนและตรวจสอบโค้ด ทดสอบอัตโนมัติ และจัดทำเอกสาร ภายใต้การตัดสินใจของคณะผู้จัดทำ</td></tr>
<tr><td>Microsoft Word / Excel / PowerPoint</td><td>ชุดโปรแกรมสำนักงาน</td><td>จัดทำรายงานรูปเล่ม คำนวณสถิติจากแบบสอบถาม และสไลด์นำเสนอโครงงาน</td></tr>
</table>'''

# ---------- ภาพที่ 2-14: กรอบแนวคิดในการวิจัย ----------
FW_CSS = BASE_CSS + '''
  .canvas{display:flex;align-items:stretch;gap:0;}
  .box{width:430px;border:2px solid #4b5364;border-radius:14px;overflow:hidden;background:#fff;}
  .box-h{background:#141b3d;color:#e8ecfb;font-size:16.5px;font-weight:700;text-align:center;padding:11px 14px;}
  .box-sub{font-size:13.5px;font-weight:700;color:#2b3245;text-align:center;padding:12px 16px 4px;line-height:1.5;}
  .items{padding:10px 16px 16px;display:flex;flex-direction:column;gap:9px;}
  .item{border:1.5px solid #d7dcec;background:#f8f9fc;border-radius:9px;padding:9px 12px;font-size:13px;line-height:1.55;color:#3b4258;}
  .item b{color:#20264a;}
  .arrow{display:flex;align-items:center;padding:0 18px;font-size:40px;color:#4b5364;}
'''
FW_BODY = '''<div class="canvas">
<div class="box">
 <div class="box-h">ตัวแปรอิสระ (Independent Variable)</div>
 <div class="box-sub">เว็บแอปพลิเคชันสื่อการเรียนรู้การเขียนโปรแกรม Python สำหรับผู้เริ่มต้น</div>
 <div class="items">
  <div class="item"><b>1. ระบบบทเรียนแบบภารกิจ (Mission System)</b> — 21 ด่าน จัดลำดับจากง่ายไปยาก สร้างความสำเร็จต่อเนื่องตามหลัก Self-Efficacy</div>
  <div class="item"><b>2. ระบบเขียนและรันโค้ดบนเบราว์เซอร์</b> — Online Code Editor ด้วย Skulpt และ CodeMirror เห็นผลทันทีไม่ต้องติดตั้งโปรแกรม</div>
  <div class="item"><b>3. ระบบ Error Message และ Hint อัตโนมัติ</b> — แปล Error เป็นภาษาไทยที่เข้าใจง่าย พร้อมคำใบ้เป็นขั้นโดยไม่เฉลยตรง ๆ</div>
  <div class="item"><b>4. ระบบบัญชีผู้ใช้และการซิงก์ข้ามอุปกรณ์ (ไม่บังคับ)</b> — Firebase Authentication + Cloud Firestore แบบ Local-first</div>
 </div>
</div>
<div class="arrow">&#10132;</div>
<div class="box">
 <div class="box-h">ตัวแปรตาม (Dependent Variable)</div>
 <div class="box-sub">ผลลัพธ์ที่เกิดจากการนำตัวแปรอิสระไปใช้จริง</div>
 <div class="items">
  <div class="item"><b>1. ผลลัพธ์ของระบบ</b> — เว็บแอปพลิเคชันทำงานได้ครบถ้วนตามฟังก์ชันที่ออกแบบไว้</div>
  <div class="item"><b>2. ประสิทธิภาพของระบบ</b> — ผลการทดสอบความถูกต้องและความเสถียรด้วยวิธี Black-box Testing</div>
  <div class="item"><b>3. ระดับความพึงพอใจของผู้ใช้</b> — ประเมินด้วยแบบสอบถามมาตราส่วนประมาณค่า (Likert Scale) 5 ระดับ จากกลุ่มเป้าหมายผู้ไม่เคยเขียนโปรแกรม</div>
 </div>
</div>
</div>'''

PAGES = {
    '_fig-2-3-self-efficacy.html': page(SE_CSS, SE_BODY),
    '_table-2-8-gamification.html': page(TABLE_CSS, GAMI_BODY),
    '_table-2-22-tools.html': page(TABLE_CSS, TOOLS_BODY),
    '_fig-2-14-framework.html': page(FW_CSS, FW_BODY),
}
here = os.path.dirname(os.path.abspath(__file__))
for name, html in PAGES.items():
    open(os.path.join(here, name), 'w', encoding='utf-8').write(html)
print('wrote', len(PAGES), 'html files')
