/*
 * sounds.js — เสียงประกอบสร้างสดด้วย Web Audio API ล้วน ๆ
 * ไม่มีไฟล์เสียงแม้แต่ไฟล์เดียว = ไม่มีเรื่องลิขสิทธิ์ และเว็บไม่หนักขึ้น
 *
 * ปรัชญา: เสียงคือ feedback สั้น ๆ เบา ๆ ตามหลัก Positive Reinforcement
 * ไม่ใช่ของตกแต่ง — ให้รางวัลกับ "ผลลัพธ์" (ผ่าน/ยังไม่ผ่าน/คำใบ้มาช่วย)
 * ไม่เล่นกับทุกการกดปุ่ม เพื่อไม่ให้กลายเป็นสิ่งรบกวนสมาธิ
 * และจงใจไม่มีเพลงพื้นหลัง (ขัดหลักหลีกเลี่ยง seductive details ของโครงงาน)
 */
(function (global) {
  'use strict';

  var MUTE_KEY = 'pylearn_sound_muted_v1';
  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* ไม่เป็นไร */ }

  // สร้าง AudioContext ครั้งแรกที่ต้องใช้ (ต้องเกิดหลังผู้ใช้โต้ตอบ ตามกติกาเบราว์เซอร์)
  function ensureCtx() {
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) { /* ไม่เป็นไร */ }
    }
    return ctx;
  }

  /*
   * อุ่นเครื่อง AudioContext ตั้งแต่การโต้ตอบแรกของผู้ใช้กับหน้าเว็บ (คลิก/แตะ/กดคีย์ใด ๆ)
   * แทนที่จะรอสร้างตอนเสียงจริงเล่นครั้งแรก — เพราะ resume() เป็น async และมีดีเลย์
   * ถ้ารอจนถึงจังหวะ "ผ่านด่าน" ค่อยสร้าง จะได้ยินเสียงช้ากว่าเหตุการณ์อย่างเห็นได้ชัด
   * พอมาถึงจังหวะจริง context จึงพร้อมเล่นทันทีไม่มีดีเลย์
   */
  function warmUp() {
    ensureCtx();
    document.removeEventListener('pointerdown', warmUp);
    document.removeEventListener('keydown', warmUp);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', warmUp, { once: true });
    document.addEventListener('keydown', warmUp, { once: true });
  }

  /*
   * เล่นโน้ตหนึ่งตัว
   * freq = ความถี่ (Hz), when = เริ่มหลังจากนี้กี่วินาที, dur = ความยาว,
   * vol = ความดัง (เบามาก 0.05-0.12), type = รูปคลื่น (sine นุ่มสุด)
   */
  function note(freq, when, dur, vol, type) {
    var c = ensureCtx();
    if (!c) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var t = c.currentTime + when;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // สูตรเสียงแต่ละแบบ — โน้ตล้วน ๆ ไม่กี่ตัว สั้นกว่าครึ่งวินาทีทั้งหมด
  var RECIPES = {
    // ผ่านด่านครั้งแรก: อาร์เพจโจไต่ขึ้น C-E-G-C สดใสแต่ไม่โฉ่งฉ่าง
    win: function () {
      note(523.25, 0.00, 0.30, 0.10);
      note(659.25, 0.09, 0.30, 0.10);
      note(783.99, 0.18, 0.40, 0.10);
      note(1046.50, 0.30, 0.50, 0.07);
    },
    // รันผ่านซ้ำตอนทบทวน: โน้ตเดียวเบา ๆ พอรู้ว่า "ยังเวิร์กอยู่"
    pass: function () {
      note(783.99, 0, 0.18, 0.06);
    },
    // ยังไม่ผ่าน: สองโน้ตต่ำนุ่ม ๆ โทน "อืม ยังไม่ใช่ ลองใหม่" — ห้ามน่ากลัวเด็ดขาด
    fail: function () {
      note(261.63, 0.00, 0.15, 0.06, 'triangle');
      note(196.00, 0.12, 0.22, 0.05, 'triangle');
    },
    // คำใบ้เปิดมาช่วยอัตโนมัติ: กระดิ่งสูงสั้น ๆ เรียกความสนใจแบบสุภาพ
    hint: function () {
      note(987.77, 0.00, 0.25, 0.07);
      note(1318.51, 0.10, 0.30, 0.05);
    }
  };

  // เล่นเสียงตามชื่อ — เสียงพังห้ามพาเว็บพัง จึงห่อ try ทั้งก้อน
  function play(name) {
    if (muted) return;
    try {
      if (RECIPES[name]) RECIPES[name]();
    } catch (e) { /* เงียบไว้ ระบบหลักต้องทำงานต่อได้เสมอ */ }
  }

  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) { /* ไม่เป็นไร */ }
  }

  global.Sounds = {
    play: play,
    isMuted: function () { return muted; },
    setMuted: setMuted
  };
})(typeof window !== 'undefined' ? window : globalThis);
