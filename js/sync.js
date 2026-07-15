/*
 * sync.js — ซิงก์ความก้าวหน้า localStorage <-> Cloud Firestore
 *
 * ยึดหลัก local-first: localStorage เป็นแหล่งข้อมูลหลัก
 * Cloud Firestore เป็นสำเนาที่ "ผสาน" (merge) ตอนเข้าสู่ระบบ แล้วซิงก์ตามเมื่อมีการเปลี่ยนแปลง
 * ถ้าไม่ได้เข้าสู่ระบบ ทุกอย่างทำงานเหมือนเดิมทุกประการ (ไม่มีการเรียก cloud)
 *
 * โครงเอกสาร cloud: users/{uid} = { email, displayName, ..., progress:{...}, savedCode:{...} }
 * ตรงกับพจนานุกรมข้อมูลในบทที่ 2 หัวข้อ 4.18
 */
(function (global) {
  'use strict';

  var FB = global.FB || {};
  var PUSH_DELAY = 1500; // หน่วงเวลาก่อนดันขึ้น cloud (debounce) กันเขียนถี่เกิน
  var pushTimer = null;

  function missionIndex(id) {
    var M = global.MISSIONS || [];
    for (var i = 0; i < M.length; i++) if (M[i].id === id) return i;
    return -1;
  }

  function deviceLabel() {
    var ua = navigator.userAgent || '';
    var os = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' :
             /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' :
             /Linux/.test(ua) ? 'Linux' : 'อุปกรณ์';
    var br = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' :
             /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'เบราว์เซอร์';
    return br + ' บน ' + os;
  }

  // แปลงสถานะฝั่ง local -> รูปเอกสารของ cloud
  function toCloud(state, user) {
    var prov = (user.providerData && user.providerData[0] && user.providerData[0].providerId) || null;
    return {
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      provider: prov,
      role: 'member',
      updatedAt: state.updatedAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastDeviceLabel: deviceLabel(),
      progress: {
        completed: state.completed || [],
        currentMissionId: state.currentMissionId || 'm0',
        capstoneDone: !!state.capstoneDone,
        hintState: state.hintState || {}
      },
      savedCode: state.savedCode || {}
    };
  }

  /*
   * ผสานข้อมูล local กับ cloud ตามกติกาในบทที่ 2 (ตารางที่ 2-11)
   * คืน object รูป local สำหรับส่งเข้า Progress.importState
   */
  function merge(local, cloud) {
    var cp = (cloud && cloud.progress) || {};

    // completed = ยูเนียน (รวมด่านที่ผ่านจากทั้งสองฝั่ง)
    var seen = {};
    (local.completed || []).forEach(function (x) { seen[x] = 1; });
    (cp.completed || []).forEach(function (x) { seen[x] = 1; });
    var completed = Object.keys(seen);

    // currentMissionId = ด่านที่ก้าวหน้ากว่า
    var lc = local.currentMissionId || 'm0';
    var cc = cp.currentMissionId || 'm0';
    var current = missionIndex(cc) > missionIndex(lc) ? cc : lc;

    // capstoneDone = OR
    var capstone = !!local.capstoneDone || !!cp.capstoneDone;

    // hintState = ค่ามากกว่าเป็นรายด่าน
    var hint = {};
    var hs1 = local.hintState || {}, hs2 = cp.hintState || {};
    Object.keys(hs1).forEach(function (k) { hint[k] = hs1[k]; });
    Object.keys(hs2).forEach(function (k) { hint[k] = Math.max(hint[k] || 0, hs2[k] || 0); });

    // savedCode = ฉบับจากฝั่งที่ updatedAt ใหม่กว่าเป็นคนชนะ (ทับรายด่าน)
    var cloudNewer = cloud && cloud.updatedAt && local.updatedAt &&
                     (new Date(cloud.updatedAt) > new Date(local.updatedAt));
    var older = cloudNewer ? (local.savedCode || {}) : ((cloud && cloud.savedCode) || {});
    var newer = cloudNewer ? ((cloud && cloud.savedCode) || {}) : (local.savedCode || {});
    var code = {};
    Object.keys(older).forEach(function (k) { code[k] = older[k]; });
    Object.keys(newer).forEach(function (k) { code[k] = newer[k]; });

    return {
      completed: completed,
      currentMissionId: current,
      capstoneDone: capstone,
      hintState: hint,
      savedCode: code
    };
  }

  // เรียง key ของ object ตามตัวอักษรก่อนแปลงเป็นข้อความ
  // (Firestore ไม่รับประกันลำดับฟิลด์ตอนอ่านกลับมา ต้องเรียงเองก่อนเทียบ
  // ไม่งั้นเนื้อหาเหมือนกันแต่ลำดับต่างกันจะถูกมองว่า "เปลี่ยน" แล้ว reload วนไม่จบ)
  function sortedKeys(o) {
    var out = {};
    Object.keys(o || {}).sort().forEach(function (k) { out[k] = o[k]; });
    return out;
  }

  /*
   * ลายเซ็นของสถานะไว้เทียบว่าเปลี่ยนไหม (จะได้รู้ว่าต้อง reload หน้าไหม)
   * จงใจไม่รวม currentMissionId: มันเป็นแค่ "ตำแหน่งจำไว้เรียนต่อ" ใช้ตอนกลับหน้าแรก/แผนที่
   * ไม่ได้กระทบเนื้อหาที่กำลังแสดงอยู่ในหน้าปัจจุบัน (หน้าปัจจุบันตัดสินจาก URL ไม่ใช่ฟิลด์นี้)
   * ถ้ารวมไว้ จะเกิดปัญหา: ผู้เรียนย้อนกลับไปทบทวนด่านเก่า -> local ตั้งเป็นด่านเก่า
   * แต่กติกาผสาน (merge) เลือก "ด่านที่ไกลที่สุด" เสมอ -> ค่าเด้งกลับเป็นด่านล่าสุดทันที
   * -> มองว่า "เปลี่ยน" ทั้งที่ผู้เรียนแค่กำลังทบทวน -> reload วนไม่จบทุกครั้งที่โหลดหน้าใหม่
   */
  function signature(s) {
    return JSON.stringify({
      c: (s.completed || []).slice().sort(),
      cap: !!s.capstoneDone,
      h: sortedKeys(s.hintState),
      s: sortedKeys(s.savedCode)
    });
  }

  /*
   * เรียกตอนเข้าสู่ระบบสำเร็จ: อ่าน cloud -> ผสาน -> เขียนกลับทั้ง local และ cloud
   * cb(changed) : changed = true ถ้าข้อมูล local เปลี่ยนไปจากการผสาน (ควร reload หน้า)
   */
  function syncOnLogin(user, cb) {
    if (!FB.ready || !FB.db) { if (cb) cb(false); return; }
    var ref = FB.db.collection('users').doc(user.uid);
    var local = global.Progress.load();
    ref.get().then(function (doc) {
      var cloud = doc.exists ? doc.data() : null;
      var merged = merge(local, cloud);
      var before = signature(local);

      global.Progress.importState(merged); // เขียนกลับ local (แบบ silent)

      var after = global.Progress.load();
      var payload = toCloud(after, user);
      if (cloud && cloud.createdAt) payload.createdAt = cloud.createdAt;
      else payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      ref.set(payload, { merge: true }).catch(function () { /* เขียน cloud ไม่ได้ก็ไม่พัง */ });

      if (cb) cb(before !== signature(after));
    }).catch(function () {
      if (cb) cb(false); // อ่าน cloud ไม่ได้ (เช่น ยังไม่ตั้ง Firestore/rules) — ใช้ local ต่อได้
    });
  }

  // ดันสถานะปัจจุบันขึ้น cloud แบบหน่วงเวลา (เรียกทุกครั้งที่ Progress เปลี่ยน)
  function schedulePush() {
    if (!FB.ready || !FB.auth || !FB.auth.currentUser) return; // ไม่ล็อกอิน = ไม่ทำอะไร
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      var user = FB.auth.currentUser;
      if (!user) return;
      var state = global.Progress.load();
      FB.db.collection('users').doc(user.uid)
        .set(toCloud(state, user), { merge: true })
        .catch(function () { /* ข้ามได้ */ });
    }, PUSH_DELAY);
  }

  global.Sync = {
    syncOnLogin: syncOnLogin,
    schedulePush: schedulePush
  };

  // สมัครรับการเปลี่ยนแปลงของ Progress -> ดันขึ้น cloud อัตโนมัติ
  if (global.Progress && global.Progress.onChange) {
    global.Progress.onChange(function () { schedulePush(); });
  }
})(window);
