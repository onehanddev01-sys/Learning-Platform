/*
 * map.js — เรนเดอร์แผนที่ภารกิจ (map.html)
 * แสดงเส้นทางเดินผ่านโซนของ 5 Module → Capstone ปลายทาง
 * แต่ละด่านมี 3 สถานะ: ล็อก / พร้อมเรียน (ด่านปัจจุบัน) / ผ่านแล้ว
 */
(function () {
  'use strict';

  var ICON_LOCK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_FLAG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>';
  var ICON_ROCKET = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2c3.5 2 5.5 5.5 5.5 9.5 0 1.5-.3 2.9-.8 4.2l2.3 2.8-1.4 1.4-2.6-2.1c-.9.9-1.9 1.6-3 2.2-1.1-.6-2.1-1.3-3-2.2l-2.6 2.1-1.4-1.4 2.3-2.8c-.5-1.3-.8-2.7-.8-4.2C6.5 7.5 8.5 4 12 2zm0 6.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  Progress.initBanner();

  // ---------- ป้ายแจ้งเตือน (เช่น โดน redirect มาจากด่านที่ล็อก) ----------

  var noticeMsg = null;
  try {
    noticeMsg = sessionStorage.getItem('pylearn_notice');
    if (noticeMsg) sessionStorage.removeItem('pylearn_notice');
  } catch (e) { /* ไม่เป็นไร */ }
  if (noticeMsg) {
    var notice = document.getElementById('map-notice');
    notice.textContent = noticeMsg;
    notice.classList.remove('hidden');
  }

  // ---------- จุดความก้าวหน้า (dot) — ไม่มีตัวเลข ----------

  var dotsWrap = document.getElementById('progress-dots');
  var dotsHtml = '';
  for (var d = 0; d < MISSIONS.length; d++) {
    var done = Progress.isCompleted(MISSIONS[d].id);
    dotsHtml += '<span class="dot' + (done ? ' dot-done' : '') + '"></span>';
  }
  dotsWrap.innerHTML = dotsHtml;

  // ---------- สถานะของด่าน ----------

  function nodeState(id) {
    if (Progress.isCompleted(id)) return 'done';
    if (Progress.isUnlocked(id)) return 'ready';
    return 'locked';
  }

  // ---------- เรนเดอร์โซนของแต่ละ Module ----------

  var root = document.getElementById('map-root');
  var html = '';

  for (var m = 0; m < MODULES.length; m++) {
    var mod = MODULES[m];
    var nodes = MISSIONS.filter(function (ms) { return ms.moduleId === mod.id; });
    if (nodes.length === 0) continue;

    var zoneClass = mod.id === 6 ? 'zone zone-capstone' : 'zone';
    html += '<section class="' + zoneClass + '">';
    html += '<div class="zone-head">' +
      '<h2>' + escapeHtml(mod.name) + '</h2>' +
      '<p>' + escapeHtml(mod.outcome) + '</p></div>';
    html += '<div class="zone-path">';

    for (var n = 0; n < nodes.length; n++) {
      var ms = nodes[n];
      var state = nodeState(ms.id);
      var typeClass = ms.type === 'mini' ? ' node-mini' : (ms.type === 'capstone' ? ' node-capstone' : '');
      var badge = ms.type === 'mini' ? '<span class="node-badge">MINI PROJECT</span>' :
                  (ms.type === 'capstone' ? '<span class="node-badge">CAPSTONE</span>' : '');

      var icon, stateClass, stateText;
      if (state === 'done') {
        icon = ICON_CHECK; stateClass = 'node-done'; stateText = 'ผ่านแล้ว — ทบทวนได้';
      } else if (state === 'ready') {
        icon = ms.type === 'capstone' ? ICON_ROCKET : ICON_PLAY;
        stateClass = 'node-ready'; stateText = 'พร้อมเรียน';
      } else {
        icon = ICON_LOCK; stateClass = 'node-locked'; stateText = 'ยังล็อกอยู่';
      }

      var inner = '<span class="node-icon">' + icon + '</span>' +
        '<span class="node-body">' + badge +
        '<span class="node-title">' + escapeHtml(ms.title) + '</span>' +
        '<span class="node-state">' + stateText + '</span></span>';

      if (state === 'locked') {
        html += '<div class="map-node ' + stateClass + typeClass + '" aria-disabled="true">' + inner + '</div>';
      } else {
        html += '<a class="map-node ' + stateClass + typeClass + '" href="mission.html?id=' + ms.id + '">' + inner + '</a>';
      }
    }

    html += '</div></section>';
  }

  root.innerHTML = html;

  // ถ้าจบหลักสูตรแล้ว แสดงป้ายยินดี
  if (Progress.isCompleted('cap')) {
    var congrats = document.createElement('div');
    congrats.className = 'course-complete';
    congrats.innerHTML = ICON_FLAG + ' คุณผ่านครบทุกภารกิจแล้ว จบหลักสูตรอย่างสมบูรณ์ — กลับมาทบทวนด่านไหนก็ได้ตามใจ';
    root.insertBefore(congrats, root.firstChild);
  }

  // ---------- ปุ่มลบความคืบหน้า (ยืนยัน 2 ชั้น) ----------
  // กันการกดยืนยันรัว ๆ โดยไม่อ่าน: ชั้นแรกปุ่มยืนยันอยู่ "ซ้าย"
  // ชั้นที่สองสลับไปอยู่ "ขวา" — ถ้ากดตำแหน่งเดิมซ้ำจะเจอปุ่มยกเลิกแทน

  var confirmOverlay = document.getElementById('confirm-overlay');
  var confirmTitle = document.getElementById('confirm-title');
  var confirmText = document.getElementById('confirm-text');
  var confirmActions = document.getElementById('confirm-actions');

  function makeBtn(label, className, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function closeConfirm() {
    confirmOverlay.classList.add('hidden');
  }

  function showConfirmStep(step) {
    confirmActions.innerHTML = '';
    if (step === 1) {
      confirmTitle.textContent = 'ลบความคืบหน้าทั้งหมด?';
      confirmText.textContent = 'ด่านที่ผ่านแล้ว โค้ดที่เขียนไว้ และคำใบ้ที่เปิดไว้ จะถูกลบทั้งหมด แล้วเริ่มเรียนใหม่ตั้งแต่ด่านแรก';
      // ชั้นแรก: ปุ่มยืนยันอยู่ซ้าย
      confirmActions.appendChild(makeBtn('ลบความคืบหน้า', 'btn btn-danger', function () { showConfirmStep(2); }));
      confirmActions.appendChild(makeBtn('ยกเลิก', 'btn btn-ghost', closeConfirm));
    } else {
      confirmTitle.textContent = 'ยืนยันอีกครั้ง';
      confirmText.textContent = 'แน่ใจจริง ๆ นะ? ลบแล้วย้อนกลับไม่ได้เลย';
      // ชั้นที่สอง: สลับข้าง ปุ่มยืนยันอยู่ขวา
      confirmActions.appendChild(makeBtn('ยกเลิก', 'btn btn-ghost', closeConfirm));
      confirmActions.appendChild(makeBtn('ลบทั้งหมดถาวร', 'btn btn-danger', function () {
        Progress.resetAll();
        window.location.reload();
      }));
    }
    confirmOverlay.classList.remove('hidden');
  }

  document.getElementById('reset-btn').addEventListener('click', function () {
    showConfirmStep(1);
  });
})();
