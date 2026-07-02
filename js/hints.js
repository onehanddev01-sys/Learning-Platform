/*
 * hints.js — ระบบคำใบ้ 3 ระดับ
 *   ระดับ 1: กระตุ้นให้คิด / ชี้ว่าต้องดูตรงไหน
 *   ระดับ 2: ชี้จุดชัดขึ้น บอกเครื่องมือที่ต้องใช้
 *   ระดับ 3: ใกล้เคียงคำตอบที่สุด (แต่ไม่ใช่โค้ดเฉลยทั้งบรรทัด)
 * ผู้เรียนกดขอเองได้ตลอด ไม่มีการหักคะแนน ไม่มีการนับแต้ม
 * และระบบจะเปิดให้เองเมื่อเจอ Error "ชนิดเดิม" ซ้ำติดกันครบตามกำหนด
 */
(function (global) {
  'use strict';

  var MAX_LEVEL = 3;
  var DEFAULT_TRIGGER = 2; // Error เดิมซ้ำกี่ครั้งติดกันจึงเปิด Hint ให้อัตโนมัติ

  // ระดับคำใบ้ที่เปิดอยู่ของด่านนี้ (จำไว้ใน progress ข้ามการ refresh)
  function getLevel(missionId) {
    return global.Progress.getHintLevel(missionId);
  }

  /*
   * ผู้เรียนกดขอคำใบ้เอง → เปิดระดับถัดไป
   * คืนค่า {level, isMax, message}
   *   ถ้าเปิดครบ 3 ระดับแล้วกดอีก จะได้ isMax = true พร้อมข้อความให้กำลังใจ
   */
  function requestNext(missionId) {
    var level = getLevel(missionId);
    if (level >= MAX_LEVEL) {
      return { level: level, isMax: true, message: 'นี่คือคำใบ้สุดท้ายแล้ว สู้ ๆ ลองค่อย ๆ ไล่ทีละบรรทัดดูนะ' };
    }
    level += 1;
    global.Progress.setHintLevel(missionId, level);
    return { level: level, isMax: level >= MAX_LEVEL, message: null };
  }

  /*
   * บันทึกว่าเกิดความไม่ผ่าน 1 ครั้ง (Error หรือตรวจไม่ผ่าน)
   * ถ้าเป็นชนิดเดิมซ้ำติดกันครบ hintTriggerRepeats ของด่าน → เปิด Hint ระดับถัดไปให้เอง
   * errType: ชนิด Error เช่น 'NameError' (การตรวจไม่ผ่านใช้ 'CheckFail')
   * คืนค่า {autoRevealed, level}
   */
  function recordFailure(mission, errType) {
    var id = mission.id;
    var trigger = mission.hintTriggerRepeats || DEFAULT_TRIGGER;
    var tracking = global.Progress.getErrorTracking(id);

    if (tracking.lastType === errType) {
      tracking.streak += 1;
    } else {
      // Error คนละชนิด = เริ่มนับใหม่
      tracking.lastType = errType;
      tracking.streak = 1;
    }

    var autoRevealed = false;
    var level = getLevel(id);

    if (tracking.streak >= trigger && level < MAX_LEVEL) {
      level += 1;
      global.Progress.setHintLevel(id, level);
      tracking.streak = 0; // นับใหม่ จะได้ไม่เปิดรัว ๆ ทุกครั้งที่พลาด
      autoRevealed = true;
    }

    global.Progress.setErrorTracking(id, tracking);
    return { autoRevealed: autoRevealed, level: level };
  }

  // ผ่านด่านแล้ว → ล้างตัวนับ Error (progress.js จัดการใน completeMission แล้ว
  // แต่เผื่อเรียกแยกกรณีรันสำเร็จเฉย ๆ ก็ล้าง streak ได้)
  function resetStreak(missionId) {
    global.Progress.clearErrorTracking(missionId);
  }

  global.Hints = {
    MAX_LEVEL: MAX_LEVEL,
    getLevel: getLevel,
    requestNext: requestNext,
    recordFailure: recordFailure,
    resetStreak: resetStreak
  };
})(typeof window !== 'undefined' ? window : globalThis);
