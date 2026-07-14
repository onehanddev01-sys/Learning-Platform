/*
 * progress.js — จัดการความก้าวหน้าของผู้เรียนผ่าน localStorage
 * เก็บ JSON เดียวใน key "pylearn_progress_v1"
 * ถ้า localStorage ใช้ไม่ได้ (โหมดส่วนตัว/พื้นที่เต็ม) จะเก็บในหน่วยความจำแทน
 * พร้อมแบนเนอร์เตือนสุภาพ — ระบบต้องไม่ crash
 */
(function (global) {
  'use strict';

  var KEY = 'pylearn_progress_v1';

  var storageOk = true;   // localStorage ใช้ได้ไหม
  var memoryState = null; // ที่เก็บสำรองในหน่วยความจำ

  // สถานะเริ่มต้นเมื่อเข้าเว็บครั้งแรก
  function defaultState() {
    return {
      version: 1,
      completed: [],          // id ด่านที่ผ่านแล้ว
      currentMissionId: 'm0', // ด่านล่าสุดที่เข้า (m0 = ด่านปฐมนิเทศ)
      capstoneDone: false,
      savedCode: {},          // โค้ดล่าสุดของแต่ละด่าน
      hintState: {},          // ระดับ Hint ที่เปิดแล้วของแต่ละด่าน (0-3)
      errorTracking: {},      // {missionId: {lastType, streak}} สำหรับ Hint อัตโนมัติ
      updatedAt: new Date().toISOString()
    };
  }

  // ทดสอบว่า localStorage เขียนได้จริงไหม
  function testStorage() {
    try {
      var k = '__pylearn_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }
  storageOk = testStorage();

  // โหลดสถานะ (จาก localStorage หรือหน่วยความจำ)
  function load() {
    if (!storageOk) {
      if (!memoryState) memoryState = defaultState();
      return memoryState;
    }
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      var state = JSON.parse(raw);
      // กันข้อมูลเสียรูป: ถ้าโครงสร้างหลักหาย ให้เริ่มใหม่
      if (!state || state.version !== 1 || !Array.isArray(state.completed)) {
        return defaultState();
      }
      if (!state.savedCode) state.savedCode = {};
      if (!state.hintState) state.hintState = {};
      if (!state.errorTracking) state.errorTracking = {};
      return state;
    } catch (e) {
      return defaultState();
    }
  }

  // รายชื่อ listener ที่รอฟังเมื่อสถานะเปลี่ยน (ใช้โดย sync.js เพื่อดันขึ้น cloud)
  var changeListeners = [];
  function notifyChange(state) {
    for (var i = 0; i < changeListeners.length; i++) {
      try { changeListeners[i](state); } catch (e) { /* listener พังต้องไม่ทำให้ระบบพัง */ }
    }
  }

  // บันทึกสถานะ (silent = true : ไม่แจ้ง listener — ใช้ตอน sync เขียนกลับ กันลูป)
  function save(state, silent) {
    state.updatedAt = new Date().toISOString();
    if (!storageOk) {
      memoryState = state;
    } else {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        // พื้นที่เต็มกลางทาง → สลับไปโหมดหน่วยความจำ ไม่ให้ crash
        storageOk = false;
        memoryState = state;
        showStorageBanner();
      }
    }
    if (!silent) notifyChange(state);
  }

  // ลงทะเบียนฟังการเปลี่ยนแปลงของสถานะ (sync.js ใช้ดันข้อมูลขึ้น cloud)
  function onChange(cb) { if (typeof cb === 'function') changeListeners.push(cb); }

  // เขียนสถานะที่ผสานจาก cloud กลับลง local (เขียนแบบ silent กันลูปการซิงก์)
  function importState(partial) {
    var s = load();
    if (partial && Array.isArray(partial.completed)) s.completed = partial.completed;
    if (partial && partial.currentMissionId) s.currentMissionId = partial.currentMissionId;
    if (partial && typeof partial.capstoneDone === 'boolean') s.capstoneDone = partial.capstoneDone;
    if (partial && partial.savedCode) s.savedCode = partial.savedCode;
    if (partial && partial.hintState) s.hintState = partial.hintState;
    save(s, true);
    return s;
  }

  // แก้ไขสถานะผ่านฟังก์ชัน แล้วบันทึกให้อัตโนมัติ
  function update(fn) {
    var state = load();
    fn(state);
    save(state);
    return state;
  }

  // ---------- API ที่หน้าอื่น ๆ ใช้ ----------

  function isCompleted(id) {
    return load().completed.indexOf(id) !== -1;
  }

  // บันทึกว่าผ่านด่านนี้แล้ว (ผ่านซ้ำจะไม่เพิ่มซ้ำ — ข้อมูลไม่เพี้ยน)
  function completeMission(id) {
    update(function (s) {
      if (s.completed.indexOf(id) === -1) s.completed.push(id);
      if (id === 'cap') s.capstoneDone = true;
      // ผ่านแล้วก็เคลียร์ตัวนับ Error ของด่านนั้น
      delete s.errorTracking[id];
    });
  }

  /*
   * กติกาปลดล็อก: ด่านเรียงเป็นเส้นตรงตามลำดับใน MISSIONS
   * ด่านแรกปลดเสมอ ด่านถัดไปปลดเมื่อด่านก่อนหน้าผ่านแล้ว
   * (ลำดับใน missions.js จัดให้ Mini Project อยู่ท้าย Module และ
   *  Capstone อยู่ท้ายสุด จึงเทียบเท่ากติกาในเอกสารโครงงานทุกข้อ)
   */
  function isUnlocked(id) {
    var missions = global.MISSIONS || [];
    var idx = -1;
    for (var i = 0; i < missions.length; i++) {
      if (missions[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return false;    // ไม่มีด่านนี้จริง
    if (idx === 0) return true;      // ด่านแรกปลดเสมอ
    return isCompleted(missions[idx - 1].id);
  }

  // ด่านที่ "ควรเรียนต่อ" = ด่านแรกในลำดับที่ยังไม่ผ่าน
  function nextMissionId() {
    var missions = global.MISSIONS || [];
    for (var i = 0; i < missions.length; i++) {
      if (!isCompleted(missions[i].id)) return missions[i].id;
    }
    return null; // ผ่านครบทุกด่านแล้ว
  }

  function setCurrentMission(id) {
    update(function (s) { s.currentMissionId = id; });
  }

  // ---------- โค้ดที่พิมพ์ค้างไว้ ----------

  function getSavedCode(id) {
    var s = load();
    return Object.prototype.hasOwnProperty.call(s.savedCode, id) ? s.savedCode[id] : null;
  }

  function setSavedCode(id, code) {
    update(function (s) { s.savedCode[id] = code; });
  }

  // ---------- สถานะ Hint และตัวนับ Error (ใช้โดย hints.js) ----------

  function getHintLevel(id) {
    return load().hintState[id] || 0;
  }

  function setHintLevel(id, level) {
    update(function (s) { s.hintState[id] = level; });
  }

  function getErrorTracking(id) {
    return load().errorTracking[id] || { lastType: null, streak: 0 };
  }

  function setErrorTracking(id, tracking) {
    update(function (s) { s.errorTracking[id] = tracking; });
  }

  function clearErrorTracking(id) {
    update(function (s) { delete s.errorTracking[id]; });
  }

  // ---------- เริ่มใหม่ทั้งหมด ----------

  function resetAll() {
    if (storageOk) {
      try { localStorage.removeItem(KEY); } catch (e) { /* ไม่เป็นไร */ }
    }
    memoryState = null;
  }

  // ---------- แบนเนอร์เตือนเมื่อ localStorage ใช้ไม่ได้ ----------

  function showStorageBanner() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('storage-banner')) return;
    var div = document.createElement('div');
    div.id = 'storage-banner';
    div.className = 'storage-banner';
    div.textContent = 'เบราว์เซอร์นี้บันทึกข้อมูลถาวรไม่ได้ (อาจเป็นโหมดส่วนตัว) ' +
      'ยังเรียนต่อได้ตามปกติ แต่ความก้าวหน้าจะหายไปเมื่อปิดแท็บนี้';
    document.body.insertBefore(div, document.body.firstChild);
  }

  // เรียกตอนหน้าโหลด: ถ้าใช้ localStorage ไม่ได้ให้ขึ้นแบนเนอร์เลย
  function initBanner() {
    if (!storageOk) showStorageBanner();
  }

  global.Progress = {
    load: load,
    update: update,
    isCompleted: isCompleted,
    completeMission: completeMission,
    isUnlocked: isUnlocked,
    nextMissionId: nextMissionId,
    setCurrentMission: setCurrentMission,
    getSavedCode: getSavedCode,
    setSavedCode: setSavedCode,
    getHintLevel: getHintLevel,
    setHintLevel: setHintLevel,
    getErrorTracking: getErrorTracking,
    setErrorTracking: setErrorTracking,
    clearErrorTracking: clearErrorTracking,
    onChange: onChange,
    importState: importState,
    resetAll: resetAll,
    initBanner: initBanner,
    storageAvailable: function () { return storageOk; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
