/* =============================================================
   runner.js — รันโค้ด Python ด้วย Skulpt แล้วจับผลลัพธ์ / error
   - กันลูปไม่สิ้นสุดด้วย execLimit จาก config
   - error ดิบของ Skulpt จะถูกแปลเป็นไทยด้วย translateError() เสมอ
     (ไม่เคยแสดง error ดิบให้ผู้เรียนเห็น)
   ============================================================= */

// องค์ประกอบที่ใช้แสดงผล (เซ็ตจาก app.js ตอนโหลดหน้า lesson)
function outputTextEl(){ return document.getElementById("output-text"); }
function outputBoxEl(){ return document.getElementById("output"); }

// Skulpt เรียกฟังก์ชันนี้ทุกครั้งที่โค้ดสั่ง print -> ต่อข้อความเข้ากล่องผลลัพธ์
function skOut(text){
  const el = outputTextEl();
  if(el) el.textContent += text;
}

// Skulpt ใช้อ่านไฟล์ของไลบรารีมาตรฐาน (จำเป็นต้องมี)
function builtinRead(file){
  if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][file] === undefined)
    throw "File not found: '" + file + "'";
  return Sk.builtinFiles["files"][file];
}

// รันโค้ดหนึ่งชุด แล้วเรียก onDone พร้อมผลลัพธ์
// onDone({ success, output, error })
function runPython(code, onDone){
  const box = outputBoxEl();
  const txt = outputTextEl();

  // เคลียร์ผลลัพธ์เก่าก่อนรันใหม่ (ตาม config.clearOutputBeforeRun)
  if (BEDROCK_CONFIG.runtime.clearOutputBeforeRun && txt) txt.textContent = "";
  if (box){ box.classList.remove("error"); box.classList.remove("empty"); }

  // จำกัดเวลาทำงาน กันลูป while ที่ไม่มีวันหยุดทำเบราว์เซอร์ค้าง
  Sk.execLimit = BEDROCK_CONFIG.runtime.execLimitMs;

  Sk.configure({
    output: skOut,
    read: builtinRead,
    __future__: Sk.python3,
    inputfun: function(p){ return window.prompt(p || ""); }, // input() -> กล่องเด้งให้พิมพ์
    inputfunTakesPrompt: true
  });

  Sk.misceval.asyncToPromise(function(){
    return Sk.importMainWithBody("<stdin>", false, code, true);
  }).then(
    function(){
      const out = txt ? txt.textContent : "";
      if (box && out.trim().length === 0) box.classList.add("empty");
      onDone({ success:true, output:out, error:null });
    },
    function(err){
      const raw = err.toString();
      if (txt) txt.textContent = translateError(raw); // แปลไทยก่อนแสดงเสมอ
      if (box) box.classList.add("error");
      onDone({ success:false, output:(txt ? txt.textContent : ""), error:raw });
    }
  );
}
