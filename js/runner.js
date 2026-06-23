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
  if (box){ box.classList.remove("error"); box.classList.remove("empty"); box.classList.remove("nudge"); }
  if (typeof clearErrorLines === "function") clearErrorLines(); // ล้างไฮไลต์บรรทัดผิดของรอบก่อน
  if (typeof clearRunNote === "function") clearRunNote();        // ล้างแถบสถานะของรอบก่อน

  // จำกัดเวลาทำงาน กันลูป while ที่ไม่มีวันหยุดทำเบราว์เซอร์ค้าง
  Sk.execLimit = BEDROCK_CONFIG.runtime.execLimitMs;

  Sk.configure({
    output: skOut,
    read: builtinRead,
    __future__: Sk.python3,
    // input() -> เปิด modal ในหน้าเว็บ (สไตล์ไทย) แทนกล่อง prompt ของเบราว์เซอร์
    // askInput() คืนค่าเป็น Promise -> Skulpt รอจนผู้ใช้กด "ส่งคำตอบ" ได้
    inputfun: function(p){ return askInput(p); },
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
      // ผลลัพธ์ที่โค้ดพิมพ์ออกมาก่อนจะสะดุด (ถ้ามี) -> เก็บไว้โชว์ในช่องผลลัพธ์เสมอ
      // (ไม่ใส่ placeholder "กดปุ่มรันโค้ด" ตอน error เพราะชวนงง ปล่อยช่องว่างแล้วให้แถบสถานะอธิบายแทน)
      const out = txt ? txt.textContent : "";

      // กรณีผู้ใช้กด "ยกเลิก" ในกล่องกรอกข้อมูล -> ไม่ใช่ error และไม่ใช่ผ่าน
      if (raw.indexOf("__BEDROCK_INPUT_CANCEL__") !== -1){
        if (typeof setRunNote === "function") setRunNote("ยกเลิกการรันแล้ว กดรันใหม่เมื่อพร้อมได้เลย", "cancel");
        onDone({ success:false, output:out, error:"__CANCEL__" });
        return;
      }

      // หาเลขบรรทัดที่ผิด (จาก traceback ของ Skulpt ก่อน ไม่งั้นแกะจากข้อความ)
      const lineNo = errorLineNumber(err, raw);
      // ดึงข้อความของบรรทัดนั้นมาช่วยแปลให้แม่นขึ้น (เช่น ลืม : ท้ายบรรทัด)
      const codeLine = lineNo ? (code.split("\n")[lineNo - 1] || "") : "";

      let msg = translateError(raw, codeLine);          // แปลไทยก่อนแสดงเสมอ
      if (lineNo) msg = "ที่บรรทัด " + lineNo + ": " + msg;   // บอกตำแหน่งให้หาง่าย
      // แสดง error ใน "แถบสถานะ" แยกต่างหาก -> ช่องผลลัพธ์ยังโชว์ output จริงไว้
      if (typeof setRunNote === "function") setRunNote(msg, "error");
      if (lineNo && typeof markErrorLine === "function") markErrorLine(lineNo); // ไฮไลต์ใน CodeMirror

      onDone({ success:false, output:out, error:raw });
    }
  );
}

// ดึงเลขบรรทัดที่ผิดจาก error ของ Skulpt (traceback ก่อน แล้วค่อยแกะจากข้อความ)
function errorLineNumber(err, raw){
  try{
    if (err && err.traceback && err.traceback.length && err.traceback[0].lineno)
      return err.traceback[0].lineno;
  }catch(e){ /* เผื่อ error บางชนิดไม่มี traceback */ }
  const m = /on line (\d+)/i.exec(raw || "");
  return m ? parseInt(m[1], 10) : null;
}
