/*
 * app.js — ตัวควบคุมหน้าบทเรียน (mission.html)
 * หน้าที่: โหลดด่านจาก ?id=, เรนเดอร์เนื้อหา 6 ส่วน, ผูกปุ่ม Run/Hint,
 * คุมวงจร รัน → ตรวจ → ผ่าน/ไม่ผ่าน → บันทึกความก้าวหน้า
 */
(function () {
  'use strict';

  // ---------- ไอคอน SVG (ไม่ใช้อีโมจิ) ----------
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_BULB = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  var ICON_MAP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>';
  var ICON_STAR = '<svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';

  // ---------- ตัวช่วยทั่วไป ----------

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /*
   * แปลงข้อความ explain เป็น HTML แบบเบา ๆ
   * รองรับ: ย่อหน้า (บรรทัดว่างคั่น), **ตัวหนา**, `โค้ด`, ลิสต์ที่ขึ้นต้นด้วย "- "
   */
  function renderRich(text) {
    var blocks = String(text == null ? '' : text).split(/\n\s*\n/);
    var html = '';
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i].trim();
      if (block === '') continue;
      var lines = block.split('\n');
      var isList = lines.every(function (l) { return l.trim().indexOf('- ') === 0; });
      if (isList) {
        html += '<ul>';
        for (var j = 0; j < lines.length; j++) {
          html += '<li>' + inline(lines[j].trim().substring(2)) + '</li>';
        }
        html += '</ul>';
      } else {
        html += '<p>' + inline(block) + '</p>';
      }
    }
    return html;

    function inline(s) {
      var esc = escapeHtml(s);
      esc = esc.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      esc = esc.replace(/`([^`]+)`/g, '<code>$1</code>');
      return esc;
    }
  }

  // ส่งผู้เรียนกลับแผนที่พร้อมข้อความแจ้ง (ใช้ตอนด่านล็อกหรือ id ไม่มีจริง)
  function backToMap(message) {
    try { sessionStorage.setItem('pylearn_notice', message); } catch (e) { /* ไม่เป็นไร */ }
    window.location.replace('map.html');
  }

  // ---------- โหลดด่านและกันกรณี URL แปลก ๆ ----------

  var params = new URLSearchParams(window.location.search);
  var missionId = params.get('id') || 'm0';
  var mission = findMission(missionId);

  if (!mission) {
    backToMap('ไม่พบบทเรียนที่เรียกหา เลยพากลับมาที่แผนที่แทน');
    return;
  }
  if (!Progress.isUnlocked(missionId)) {
    backToMap('ด่านนั้นยังล็อกอยู่ ต้องผ่านด่านก่อนหน้าก่อนนะ');
    return;
  }

  Progress.initBanner();
  Progress.setCurrentMission(missionId);

  var moduleInfo = null;
  for (var mi = 0; mi < MODULES.length; mi++) {
    if (MODULES[mi].id === mission.moduleId) moduleInfo = MODULES[mi];
  }

  // ---------- เรนเดอร์เนื้อหาฝั่งซ้าย (Hook → Show → Explain → Task) ----------

  document.title = mission.title + ' — Python เริ่มจากศูนย์';
  $('module-chip').textContent = moduleInfo ? moduleInfo.name : '';

  var lesson = $('lesson-col');
  var html = '';

  if (Progress.isCompleted(missionId)) {
    html += '<div class="done-banner">' + ICON_CHECK +
      '<span>ด่านนี้ผ่านแล้ว เข้ามาทบทวนหรือลองรันใหม่ได้เสมอ</span></div>';
  }

  html += '<h1 class="mission-title">' + escapeHtml(mission.title) + '</h1>';
  html += '<div class="concept-chip">แนวคิดใหม่: ' + escapeHtml(mission.concept) + '</div>';

  // คำศัพท์ภาษาอังกฤษที่เจอในด่านนี้ พร้อมคำแปล — สำหรับผู้เรียนที่ยังไม่คุ้นภาษาอังกฤษ
  if (mission.vocab && mission.vocab.length > 0) {
    html += '<div class="vocab-row"><span class="vocab-label">คำศัพท์ในด่านนี้</span>';
    for (var vi = 0; vi < mission.vocab.length; vi++) {
      html += '<span class="vocab-chip"><code>' + escapeHtml(mission.vocab[vi].word) +
        '</code> = ' + escapeHtml(mission.vocab[vi].meaning) + '</span>';
    }
    html += '</div>';
  }

  html += '<div class="hook-box">' + escapeHtml(mission.hook) + '</div>';

  if (mission.showCode) {
    html += '<section class="show-section">' +
      '<div class="section-label">ดูตัวอย่างก่อน</div>' +
      '<pre class="show-code"><code>' + escapeHtml(mission.showCode) + '</code></pre>' +
      '<button id="show-run-btn" class="btn btn-secondary">' + ICON_PLAY + ' ลองรันดู</button>' +
      '</section>';
  }

  html += '<section class="explain-section">' +
    '<div class="section-label">เข้าใจการทำงาน</div>' +
    renderRich(mission.explain) +
    '</section>';

  if (mission.ideas && mission.ideas.length > 0) {
    html += '<section class="ideas-section">' +
      '<div class="section-label">หัวข้อตัวอย่างจุดประกายไอเดีย</div><ul class="ideas-list">';
    for (var ii = 0; ii < mission.ideas.length; ii++) {
      html += '<li>' + escapeHtml(mission.ideas[ii]) + '</li>';
    }
    html += '</ul></section>';
  }

  html += '<section class="task-section">' +
    '<div class="section-label task-label">ภารกิจของคุณ</div>' +
    '<p>' + escapeHtml(mission.task.instruction) + '</p>' +
    '</section>';

  lesson.innerHTML = html;

  // Task Bar ติดขอบล่าง แสดงโจทย์ตลอดเวลา
  $('taskbar-text').textContent = mission.task.instruction;

  // ---------- ตั้งค่า Code Editor (CodeMirror) ----------

  var editorReady = typeof CodeMirror !== 'undefined';
  var editor = null;

  var savedCode = Progress.getSavedCode(missionId);
  var initialCode = savedCode !== null ? savedCode : mission.task.starterCode;

  if (editorReady) {
    editor = CodeMirror.fromTextArea($('code-editor'), {
      mode: 'python',
      lineNumbers: true,
      indentUnit: 4,
      indentWithTabs: false,
      lineWrapping: true,
      // ช่วยปิดวงเล็บ/เครื่องหมายคำพูดให้อัตโนมัติ — ลดภาระผู้เรียนที่ยังพิมพ์สัญลักษณ์ไม่คล่อง
      autoCloseBrackets: true,
      extraKeys: {
        Tab: function (cm) {
          // Tab = ย่อหน้า 4 ช่องว่างเสมอ (มือใหม่ไม่ต้องเจอตัวอักษรแท็บ)
          if (cm.somethingSelected()) cm.indentSelection('add');
          else cm.replaceSelection('    ', 'end');
        },
        'Ctrl-Enter': function () { runUserCode(); },
        'Cmd-Enter': function () { runUserCode(); }
      }
    });
    editor.setValue(initialCode);
    editor.on('change', function () { clearErrorLine(); });
  } else {
    // CodeMirror โหลดไม่ขึ้น (ออฟไลน์และไม่มี vendor) → ใช้ textarea ธรรมดาแทน ไม่ให้เว็บพัง
    $('code-editor').value = initialCode;
    $('code-editor').classList.add('plain-editor');
  }

  function getCode() {
    return editorReady ? editor.getValue() : $('code-editor').value;
  }

  // ---------- บันทึกอัตโนมัติ (ไม่มีปุ่มบันทึก) ----------

  function saveCode() {
    Progress.setSavedCode(missionId, getCode());
  }
  window.addEventListener('beforeunload', saveCode);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveCode();
  });

  // ---------- ไฮไลต์บรรทัดที่ error ใน editor (พื้นแดงอ่อน) ----------

  var errorLine = null;
  function markErrorLine(lineNo) {
    clearErrorLine();
    if (editorReady && lineNo && lineNo >= 1 && lineNo <= editor.lineCount()) {
      editor.addLineClass(lineNo - 1, 'background', 'line-error');
      errorLine = lineNo - 1;
    }
  }
  function clearErrorLine() {
    if (editorReady && errorLine !== null) {
      editor.removeLineClass(errorLine, 'background', 'line-error');
      errorLine = null;
    }
  }

  // ---------- Output Panel ----------

  var outputPanel = $('output-panel');

  function clearOutput() {
    outBuffer = '';
    outputPanel.innerHTML = '';
  }

  /*
   * เขียนข้อความ stdout ต่อท้ายแบบ buffer:
   * สะสมข้อความไว้ก่อนแล้วค่อยลง DOM เป็นชุดผ่าน requestAnimationFrame
   * ทำให้ loop ที่ print หลายพันบรรทัดไม่ทำเบราว์เซอร์อืด
   */
  var outBuffer = '';
  var flushScheduled = false;

  function appendOutput(text) {
    outBuffer += text;
    if (!flushScheduled) {
      flushScheduled = true;
      requestAnimationFrame(flushOutput);
    }
  }

  function flushOutput() {
    flushScheduled = false;
    if (outBuffer === '') return;
    var last = outputPanel.lastChild;
    if (!last || !last.classList || !last.classList.contains('out-text')) {
      last = document.createElement('pre');
      last.className = 'out-text';
      outputPanel.appendChild(last);
    }
    last.textContent += outBuffer;
    outBuffer = '';
    outputPanel.scrollTop = outputPanel.scrollHeight;
  }

  function appendBox(className, innerHtml) {
    flushOutput(); // ให้ข้อความที่ค้างใน buffer ลงจอก่อน กล่องจะได้อยู่ท้ายสุดเสมอ
    var div = document.createElement('div');
    div.className = className;
    div.innerHTML = innerHtml;
    outputPanel.appendChild(div);
    outputPanel.scrollTop = outputPanel.scrollHeight;
    return div;
  }

  // กล่อง Error / ยังไม่ผ่าน (โทนส้ม ห้ามแดง) — แสดงในตำแหน่งเดียวกับผลรันปกติ
  function showErrorBox(tr) {
    var inner = '<div class="fail-title">ยังไม่ผ่าน แต่ใกล้แล้ว</div>' +
      '<div class="fail-what">' + escapeHtml(tr.what) + '</div>';
    if (tr.where) inner += '<div class="fail-where">' + escapeHtml(tr.where) + '</div>';
    if (tr.how) inner += '<div class="fail-how">แนวทาง: ' + escapeHtml(tr.how) + '</div>';
    // Error ดิบพับเก็บได้ ไม่แสดงเป็นค่าเริ่มต้น
    inner += '<details class="raw-error"><summary>ดูข้อความต้นฉบับ (ภาษาอังกฤษ)</summary><pre>' +
      escapeHtml(tr.raw) + '</pre></details>';
    appendBox('fail-box', inner);
  }

  function showCheckFailBox(message) {
    appendBox('fail-box', '<div class="fail-title">ยังไม่ผ่าน แต่ใกล้แล้ว</div>' +
      '<div class="fail-what">' + escapeHtml(message) + '</div>');
  }

  function showInfoBox(message) {
    appendBox('info-box', escapeHtml(message));
  }

  /*
   * ช่องกรอกของ input() — โผล่ในตัว Output Panel พร้อม prompt
   * คืน Promise ที่ resolve เมื่อผู้เรียนกด Enter/ปุ่มส่ง
   * มีลิงก์ "หยุดการทำงาน" เผื่ออยากยกเลิกการรันกลางคัน
   */
  function askInput(promptText) {
    flushOutput(); // ข้อความก่อนหน้าต้องขึ้นจอครบก่อนช่องกรอกจะโผล่
    return new Promise(function (resolve, reject) {
      var row = document.createElement('div');
      row.className = 'input-row';
      var label = document.createElement('span');
      label.className = 'input-prompt';
      label.textContent = promptText || 'พิมพ์ข้อความแล้วกด Enter:';
      var field = document.createElement('input');
      field.type = 'text';
      field.className = 'input-field';
      var send = document.createElement('button');
      send.className = 'btn btn-small';
      send.textContent = 'ส่ง';
      var stop = document.createElement('button');
      stop.className = 'link-stop';
      stop.textContent = 'หยุดการทำงาน';

      function finish() {
        var value = field.value;
        // สะท้อนสิ่งที่กรอกลงใน output เหมือน console จริง
        row.remove();
        appendOutput((promptText || '') + value + '\n');
        resolve(value);
      }
      field.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') finish();
      });
      send.addEventListener('click', finish);
      stop.addEventListener('click', function () {
        row.remove();
        reject(new Error(Runner.INTERRUPT_FLAG));
      });

      row.appendChild(label);
      row.appendChild(field);
      row.appendChild(send);
      row.appendChild(stop);
      outputPanel.appendChild(row);
      outputPanel.scrollTop = outputPanel.scrollHeight;
      field.focus();
    });
  }

  // ---------- ระบบ Hint ----------

  var hintPanel = $('hint-panel');
  var hintList = $('hint-list');
  var hintNote = $('hint-note');

  function renderHints(noteText) {
    var level = Hints.getLevel(missionId);
    hintNote.textContent = noteText || '';
    hintNote.style.display = noteText ? 'block' : 'none';
    var inner = '';
    for (var i = 0; i < level && i < mission.hints.length; i++) {
      inner += '<div class="hint-item"><span class="hint-level">คำใบ้ระดับ ' + (i + 1) +
        '</span><p>' + escapeHtml(mission.hints[i]) + '</p></div>';
    }
    if (inner === '') inner = '<p class="hint-empty">ยังไม่ได้เปิดคำใบ้ — ลองคิดเองก่อนก็เก่งแล้ว แต่ถ้าติดจริง ๆ กดปุ่มด้านล่างได้เลย ไม่มีการหักคะแนนใด ๆ</p>';
    hintList.innerHTML = inner;
  }

  function openHintPanel(noteText) {
    renderHints(noteText);
    hintPanel.classList.remove('hidden');
    updateHintBtnLabel(); // ครอบคลุมกรณีระบบเปิดคำใบ้ให้อัตโนมัติด้วย
  }

  // ปรับป้ายปุ่มหลัก: ถ้ามีคำใบ้เปิดอยู่แล้ว ปุ่มนี้ทำหน้าที่แค่ "เปิดดู" ไม่ขอเพิ่ม
  function updateHintBtnLabel() {
    var label = Hints.getLevel(missionId) > 0 ? 'ดูคำใบ้' : 'ขอคำใบ้';
    $('hint-btn').innerHTML = ICON_BULB + ' ' + label;
  }

  /*
   * ปุ่มคำใบ้ที่ Task Bar:
   * - ยังไม่เคยมีคำใบ้ → กดครั้งแรกคือขอคำใบ้ระดับ 1 ตามปกติ
   * - มีคำใบ้เปิดไว้แล้ว (ขอเองหรือระบบเปิดให้) → แค่เปิดแผงดูของเดิม ไม่เพิ่มระดับ
   *   อยากได้ระดับถัดไปให้กด "ขอคำใบ้เพิ่ม" ในแผงเท่านั้น
   */
  $('hint-btn').addEventListener('click', function () {
    if (Hints.getLevel(missionId) > 0) {
      openHintPanel(null);
    } else {
      var res = Hints.requestNext(missionId);
      openHintPanel(res.isMax && res.message ? res.message : null);
    }
    updateHintBtnLabel();
  });
  $('hint-more-btn').addEventListener('click', function () {
    var res = Hints.requestNext(missionId);
    renderHints(res.isMax && res.message ? res.message : null);
    updateHintBtnLabel();
  });
  $('hint-close-btn').addEventListener('click', function () {
    hintPanel.classList.add('hidden');
  });

  // ถ้าเคยเปิด Hint ค้างไว้ (refresh กลางด่าน) ให้ยังเปิดอยู่
  if (Hints.getLevel(missionId) > 0) {
    renderHints(null);
    hintPanel.classList.remove('hidden');
  }

  // ---------- Win overlay ----------

  function nextMissionOf(id) {
    for (var i = 0; i < MISSIONS.length; i++) {
      if (MISSIONS[i].id === id) {
        return (i + 1 < MISSIONS.length) ? MISSIONS[i + 1] : null;
      }
    }
    return null;
  }

  function showWin() {
    var overlay = $('win-overlay');
    $('win-message').textContent = mission.winMessage;
    var next = nextMissionOf(missionId);
    var nextBtn = $('win-next-btn');
    if (next) {
      nextBtn.style.display = '';
      nextBtn.textContent = next.type === 'capstone' ? 'ไปที่ Capstone' : 'ด่านถัดไป';
      nextBtn.onclick = function () {
        saveCode();
        window.location.href = 'mission.html?id=' + next.id;
      };
    } else {
      nextBtn.style.display = 'none';
      $('win-title').textContent = 'จบหลักสูตรแล้ว!';
    }
    overlay.classList.remove('hidden');
  }

  $('win-map-btn').addEventListener('click', function () {
    saveCode();
    window.location.href = 'map.html';
  });
  $('win-close-btn').addEventListener('click', function () {
    $('win-overlay').classList.add('hidden');
  });
  $('win-star').innerHTML = ICON_STAR;

  /*
   * ปุ่ม "ด่านถัดไป" ใน Task Bar — โผล่ค้างไว้เมื่อด่านนี้ผ่านแล้ว
   * (ทั้งตอนกด "อยู่ทบทวนต่อ" และตอนกลับเข้ามาเล่นด่านที่ผ่านแล้ว)
   * ผู้เรียนจะได้เล่นต่อได้เรื่อย ๆ แล้วค่อยไปต่อเมื่อพร้อม
   */
  function updateTaskbarNext() {
    var btn = $('taskbar-next-btn');
    if (!Progress.isCompleted(missionId)) return;
    var next = nextMissionOf(missionId);
    if (!next) return; // จบ Capstone แล้ว ไม่มีด่านถัดไป
    btn.textContent = next.type === 'capstone' ? 'ไปที่ Capstone' : 'ด่านถัดไป';
    btn.classList.remove('hidden');
    btn.onclick = function () {
      saveCode();
      window.location.href = 'mission.html?id=' + next.id;
    };
  }
  updateTaskbarNext();

  // ---------- วงจรการรัน ----------

  var isRunning = false;
  var runBtn = $('run-btn');
  runBtn.innerHTML = ICON_PLAY + ' รันโค้ด';
  updateHintBtnLabel();
  var backLink = document.querySelector('.topbar-back');
  if (backLink) backLink.innerHTML = ICON_MAP + ' แผนที่บทเรียน';

  function setRunning(state) {
    isRunning = state;
    runBtn.disabled = state;
    runBtn.innerHTML = state ? 'กำลังรัน…' : ICON_PLAY + ' รันโค้ด';
    var showBtn = $('show-run-btn');
    if (showBtn) showBtn.disabled = state;
  }

  // เช็คว่า Skulpt โหลดสำเร็จไหม (กันกรณีออฟไลน์สุด ๆ)
  function engineOk() {
    if (typeof Sk === 'undefined') {
      clearOutput();
      showInfoBox('ตัวรันโค้ดยังโหลดไม่สำเร็จ ลองเชื่อมต่ออินเทอร์เน็ตแล้วรีเฟรชหน้านี้อีกครั้ง');
      return false;
    }
    return true;
  }

  // รันโค้ดตัวอย่างในส่วน Show (ไม่ตรวจ ไม่นับ Error)
  function runShowCode() {
    if (isRunning || !engineOk()) return;
    setRunning(true);
    clearOutput();
    showInfoBox('ผลลัพธ์จากโค้ดตัวอย่าง');
    Runner.run(mission.showCode, {
      onOutput: appendOutput,
      inputProvider: askInput
    }).then(function (result) {
      if (result.error) {
        showErrorBox(ErrorTranslator.translate(result.error, mission.showCode, null));
      }
      setRunning(false);
    });
  }
  var showRunBtn = $('show-run-btn');
  if (showRunBtn) showRunBtn.addEventListener('click', runShowCode);

  // รันโค้ดของผู้เรียน + ตรวจผ่าน/ไม่ผ่าน
  function runUserCode() {
    if (isRunning || !engineOk()) return;

    // ทำความสะอาดโค้ดก่อน (เครื่องหมายคำพูดโค้งจากแป้นไทย/การคัดลอก ฯลฯ)
    // แล้วเขียนกลับลง editor เพื่อให้เลขบรรทัดใน Error ตรงกับที่ผู้เรียนเห็น
    var code = Runner.sanitize(getCode());
    if (code !== getCode()) {
      if (editorReady) editor.setValue(code);
      else $('code-editor').value = code;
    }
    saveCode(); // บันทึกทุกครั้งที่กด Run

    // โค้ดว่างเปล่า → ข้อความเป็นมิตร ไม่ต้องรัน
    if (code.trim() === '') {
      clearOutput();
      showInfoBox('ยังไม่มีโค้ดในช่องเลย ลองพิมพ์โค้ดตามภารกิจใน Task Bar ด้านล่างก่อน แล้วค่อยกดรันนะ');
      return;
    }

    /*
     * กับดักมือใหม่ที่พบบ่อย: พิมพ์โค้ด "ต่อท้ายบรรทัดที่ขึ้นต้นด้วย #"
     * ทำให้โค้ดทั้งหมดกลายเป็นคอมเมนต์ Python เลยไม่ทำอะไรเลยและเงียบสนิท
     * ดักไว้ก่อนรัน พร้อมนับเป็นความไม่ผ่านหนึ่งครั้ง (เพื่อให้คำใบ้อัตโนมัติทำงานได้)
     */
    if (Checker.stripComments(code).trim() === '') {
      clearOutput();
      showCheckFailBox('โค้ดทั้งหมดตอนนี้อยู่หลังเครื่องหมาย # ซึ่งแปลว่า "หมายเหตุ" — Python จะมองข้ามทั้งบรรทัดเลย ลองกด Enter ขึ้นบรรทัดใหม่ แล้วพิมพ์โค้ดในบรรทัดที่ไม่มี # นำหน้านะ');
      var hcomment = Hints.recordFailure(mission, 'CommentOnly');
      if (hcomment.autoRevealed) {
        openHintPanel('ดูเหมือนจะติดตรงนี้อยู่ นี่คือคำใบ้เพิ่มเติมที่อาจช่วยได้');
      }
      return;
    }

    setRunning(true);
    clearOutput();
    clearErrorLine();

    Runner.run(code, {
      onOutput: appendOutput,
      inputProvider: askInput
    }).then(function (result) {
      setRunning(false);

      if (result.truncated) {
        showInfoBox('ผลลัพธ์ยาวเกิน ' + Runner.OUTPUT_MAX_LINES +
          ' บรรทัด ระบบเลยหยุดแสดงไว้เท่านี้ ลองลดจำนวนรอบดูนะ');
      }
      if (result.interrupted) {
        showInfoBox('หยุดการทำงานแล้ว กดรันใหม่ได้เสมอ');
        return;
      }

      // ชั้นที่ 1: มี Error → แปลเป็นภาษาไทย + ไฮไลต์บรรทัด + นับ Error ซ้ำ
      if (result.error) {
        var tr = ErrorTranslator.translate(result.error, code, mission);
        showErrorBox(tr);
        markErrorLine(tr.line);
        var hres = Hints.recordFailure(mission, tr.type);
        if (hres.autoRevealed) {
          openHintPanel('ดูเหมือนจะติดตรงนี้อยู่ นี่คือคำใบ้เพิ่มเติมที่อาจช่วยได้');
        }
        return;
      }

      // ชั้นที่ 2: รันผ่าน → ตรวจตามกติกาของด่าน
      var verdict = Checker.check(mission, code, result);
      if (verdict.passed) {
        // Win overlay เด้งเฉพาะ "ครั้งแรก" ที่ผ่านด่านนี้ — ผ่านซ้ำตอนทบทวน
        // แค่แจ้งเบา ๆ ใน Output จะได้ทดลองแก้โค้ดเล่นต่อได้ไม่โดนกวน
        var firstTime = !Progress.isCompleted(missionId);
        Progress.completeMission(missionId);
        Hints.resetStreak(missionId);
        updateTaskbarNext();
        if (firstTime) {
          showWin();
        } else {
          appendBox('pass-box', 'ยังผ่านภารกิจอยู่ เยี่ยม! ทดลองแก้โค้ดเล่นต่อได้เต็มที่ พร้อมเมื่อไหร่ค่อยกดด่านถัดไปด้านล่าง');
        }
      } else {
        showCheckFailBox(verdict.message);
        var hres2 = Hints.recordFailure(mission, 'CheckFail');
        if (hres2.autoRevealed) {
          openHintPanel('ดูเหมือนจะติดตรงนี้อยู่ นี่คือคำใบ้เพิ่มเติมที่อาจช่วยได้');
        }
      }
    });
  }

  runBtn.addEventListener('click', runUserCode);

  // คีย์ลัด Ctrl+Enter สำหรับกรณี textarea ธรรมดา (CodeMirror ผูกไว้ใน extraKeys แล้ว)
  if (!editorReady) {
    $('code-editor').addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') runUserCode();
    });
  }
})();
