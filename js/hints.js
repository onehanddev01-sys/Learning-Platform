/* =============================================================
   hints.js — ระบบคำใบ้แบบเป็นขั้น (จางไปหาชัด)
   - ผู้เรียนกดขอเองได้ (ปุ่ม "ขอคำใบ้")
   - ถ้าเจอ error เดิมซ้ำตามจำนวนใน config จะเผยคำใบ้ให้อัตโนมัติ
   ตัวแปร currentItem (ด่าน/โปรเจกต์ปัจจุบัน) และ showHintText() ถูกเซ็ตจาก app.js
   ============================================================= */
let hintLevel = 0;       // ตอนนี้เผยคำใบ้ไปแล้วกี่ระดับ
let lastError = null;    // ชนิด error ล่าสุดที่เจอ
let sameErrorCount = 0;  // เจอ error เดิมซ้ำกี่ครั้งติด

// รีเซ็ตสถานะคำใบ้ (เรียกทุกครั้งที่โหลดด่านใหม่)
function resetHints(){
  hintLevel = 0;
  lastError = null;
  sameErrorCount = 0;
}

// เผยคำใบ้ระดับถัดไป (ถ้ายังมีเหลือ)
function revealHint(){
  const list = (typeof currentItem !== "undefined" && currentItem) ? currentItem.hints : null;
  if(!list) return;
  if(hintLevel < list.length){
    showHintText(list[hintLevel], hintLevel + 1, list.length);
    hintLevel++;
  }
}

// เรียกเมื่อรันแล้ว error -> นับ error ซ้ำ แล้วเผยคำใบ้อัตโนมัติเมื่อถึงเกณฑ์
function onErrorForHint(errType){
  if(errType === lastError){
    sameErrorCount++;
    if(sameErrorCount >= BEDROCK_CONFIG.hints.autoRevealAfterSameErrorCount){
      revealHint();
      sameErrorCount = 0;
    }
  } else {
    lastError = errType;
    sameErrorCount = 1;
  }
}
