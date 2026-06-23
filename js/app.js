/* =============================================================
   app.js — ตรรกะรวมและการนำทางของทุกหน้า
   ตรวจว่าอยู่หน้าไหนจาก body[data-page] แล้วเรียกตัวเริ่มของหน้านั้น
   (no framework, vanilla JS ล้วน อ่านง่าย แก้เองได้)
   ============================================================= */

/* ---------- ไอคอน SVG (ใช้แทน emoji ทั้งหมด สะอาดและไม่เพี้ยน) ---------- */
const ICON = {
  play:  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  lock:  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm3 8H9V7a3 3 0 0 1 6 0z" fill="currentColor"/></svg>',
  star:  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.8 5.9 20.3 7.2 13.6l-5-4.6 6.8-.8z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn:  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3l10 17H2L12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>',
  arrowR:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowL:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bulb:  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 21h6M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  eye:   '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- ตัวช่วยทั่วไป ---------- */
function el(id){ return document.getElementById(id); }
function go(url){ window.location.href = url; }

// แสดงข้อความแจ้งเตือนสั้น ๆ (toast) เช่นตอนกดด่านที่ล็อก
function toast(msg){
  let t = el("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.remove("show"), 2600);
}

/* ---------- สร้างลำดับ "หมุด" บนแผนที่ (ด่าน + มินิโปรเจกต์สลับ) ---------- */
function buildPathNodes(){
  const nodes = [];
  MISSIONS.forEach(function(m){
    nodes.push({ kind:"mission", ref:m, id:m.id, module:m.module, title:m.title });
    // ถ้ามีโปรเจกต์ต่อท้ายด่านนี้ ให้แทรกหลังด่าน
    PROJECTS.filter(p=>p.afterMission===m.id).forEach(function(p){
      nodes.push({ kind:"project", ref:p, id:p.id, module:m.module, title:p.title });
    });
  });
  return nodes;
}

function nodeUnlocked(node){
  if(node.kind==="mission") return isUnlocked(node.id) || isCompleted(node.id);
  return isCompleted(node.ref.afterMission); // โปรเจกต์เปิดเมื่อด่านก่อนหน้าผ่าน
}
function nodeCompleted(node){
  if(node.kind==="mission") return isCompleted(node.id);
  return isProjectCompleted(node.id);
}

/* =====================================================================
   หน้า HOME (index.html)
   ===================================================================== */
function initHome(){
  const p = getProgress();
  const hasProgress = p.completedMissions.length > 0;

  const startBtn = el("start-btn");
  if(startBtn){
    startBtn.addEventListener("click", function(){ go("map.html"); });
  }

  const continueBtn = el("continue-btn");
  if(continueBtn){
    if(hasProgress){
      // มีความก้าวหน้าแล้ว -> โชว์ปุ่ม แล้วพาไปด่านที่เรียนค้างอยู่
      continueBtn.hidden = false;
      continueBtn.addEventListener("click", function(){
        // ไปด่านปัจจุบันที่ยังเรียนอยู่ (ถ้าเกิน 15 ให้หยุดที่ด่านสุดท้าย)
        const id = Math.min(p.currentMission, BEDROCK_CONFIG.curriculum.missionsTotal);
        go("lesson.html?id=" + id);
      });
      const note = el("progress-note");
      if(note) note.textContent = "เรียนไปแล้ว " + p.completedMissions.length + " / " + BEDROCK_CONFIG.curriculum.missionsTotal + " ด่าน";
    } else {
      // ยังไม่เริ่มเรียน -> ซ่อนปุ่ม "เรียนต่อจากเดิม" ไปเลย
      continueBtn.hidden = true;
    }
  }
}

/* =====================================================================
   หน้า MAP (map.html) — เส้นทางหินคดเคี้ยว 3 สถานะ
   ===================================================================== */
function initMap(){
  const nodes = buildPathNodes();
  const wrap = el("map-path");
  if(!wrap) return;

  // อัปเดตตัวเลขความก้าวหน้าด้านบน
  const done = getProgress().completedMissions.length;
  const total = BEDROCK_CONFIG.curriculum.missionsTotal;
  const counter = el("map-progress");
  if(counter) counter.textContent = "ผ่านแล้ว " + done + " / " + total + " ด่าน";

  renderStonePath(nodes, wrap);

  // ปุ่มเริ่มใหม่ (ลบความก้าวหน้า) -> ใช้ modal ยืนยันสไตล์แอป แทน window.confirm
  const resetBtn = el("reset-btn");
  if(resetBtn){
    resetBtn.addEventListener("click", openResetConfirm);
    const confirmYes = el("confirm-reset");
    const confirmNo  = el("confirm-cancel");
    if(confirmYes) confirmYes.addEventListener("click", function(){ resetProgress(); go("map.html"); });
    if(confirmNo)  confirmNo.addEventListener("click", closeResetConfirm);
  }

  // เลื่อนหน้าไปหยุดที่ "ด่านปัจจุบัน" (ด่านที่เล่นได้) อย่างนุ่มนวล
  setTimeout(function(){
    const cur = wrap.querySelector(".node.current") || wrap.querySelector(".node.unlocked");
    if(cur) cur.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block:"center" });
  }, 150);

  // วาดเส้นทางใหม่เมื่อปรับขนาดจอ (เผื่อ amplitude เปลี่ยน)
  let rz;
  window.addEventListener("resize", function(){
    clearTimeout(rz);
    rz = setTimeout(function(){ renderStonePath(nodes, wrap); }, 200);
  });
}

function renderStonePath(nodes, wrap){
  wrap.innerHTML = "";
  const n = nodes.length;

  // ระยะแนวตั้งและช่องว่างบน-ล่าง (px)
  const vSpacing = 124, topPad = 90, botPad = 120;
  const totalH = topPad + botPad + (n - 1) * vSpacing;

  // x เป็นเปอร์เซ็นต์ (0-100), y เป็น px ; ด่านแรก (i=0) อยู่ล่างสุด -> ก่อจากฐานราก
  const amp = 24;        // ความกว้างการส่ายซ้าย-ขวา (%)
  const points = nodes.map(function(node, i){
    const y = totalH - botPad - i * vSpacing;
    const x = 50 + amp * Math.sin(i * 0.8);
    return { x:x, y:y, node:node, i:i };
  });

  wrap.style.height = totalH + "px";

  // ----- วาดเส้นทาง (SVG ด้านหลัง) -----
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "path-svg");
  svg.setAttribute("viewBox", "0 0 100 " + totalH);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", totalH + "");

  for(let i = 0; i < points.length - 1; i++){
    const a = points[i], b = points[i + 1];
    const h = vSpacing * 0.42;
    const d = "M " + a.x + " " + a.y +
              " C " + a.x + " " + (a.y - h) + " " + b.x + " " + (b.y + h) + " " + b.x + " " + b.y;
    const seg = document.createElementNS(svgNS, "path");
    seg.setAttribute("d", d);
    // ช่วงที่ "เดินผ่านมาแล้ว" (หมุดล่างผ่านแล้ว) เป็นเส้นทึบสี brand, ที่เหลือเป็นเส้นประจาง
    seg.setAttribute("class", nodeCompleted(a.node) ? "seg seg-done" : "seg seg-todo");
    svg.appendChild(seg);
  }
  wrap.appendChild(svg);

  // ----- วางป้ายชื่อ Module (ที่หมุดแรกของแต่ละ Module) -----
  let seenModule = {};
  points.forEach(function(pt){
    if(pt.node.kind === "mission" && !seenModule[pt.node.module]){
      seenModule[pt.node.module] = true;
      const lab = document.createElement("div");
      lab.className = "module-label";
      lab.style.top = pt.y + "px";
      lab.textContent = "Module " + pt.node.module;
      wrap.appendChild(lab);
    }
  });

  // หา "ด่านปัจจุบัน" = โหนดแรกที่เล่นได้แต่ยังไม่ผ่าน (ใช้ทำให้เด่น + เป็นจุดเลื่อนไปหยุด)
  let currentIdx = points.findIndex(function(pt){
    return nodeUnlocked(pt.node) && !nodeCompleted(pt.node);
  });

  // ----- วางหมุด (node) -----
  points.forEach(function(pt){
    const node = pt.node;
    const unlocked = nodeUnlocked(node);
    const completed = nodeCompleted(node);
    const isProject = node.kind === "project";
    const isCapstone = isProject && node.ref.capstone;
    const isCurrent = pt.i === currentIdx;   // ด่านที่ผู้ใช้ควรเริ่มเล่นตอนนี้

    const b = document.createElement("button");
    b.type = "button";
    b.className = "node" +
      (unlocked ? " unlocked" : " locked") +
      (completed ? " completed" : "") +
      (isProject ? " project" : "") +
      (isCapstone ? " capstone" : "") +
      (isCurrent ? " current" : "");
    b.style.left = pt.x + "%";
    b.style.top = pt.y + "px";

    // เนื้อในหมุด: สถานะ -> ไอคอนที่เหมาะสม
    let inner;
    if(!unlocked){
      inner = '<span class="node-icon">' + ICON.lock + '</span>';
    } else if(completed){
      inner = '<span class="node-icon">' + ICON.star + '</span>';
    } else if(isProject){
      inner = '<span class="node-num">' + (isCapstone ? "C" : "MP") + '</span>';
    } else {
      inner = '<span class="node-num">' + node.id + '</span>';
    }
    b.innerHTML = inner;

    // ป้ายชื่อด่านข้าง ๆ หมุด (อยู่ฝั่งตรงข้ามกับทิศที่หมุดส่ายไป)
    const labelSide = pt.x >= 50 ? "left" : "right";
    const cap = document.createElement("span");
    cap.className = "node-caption " + labelSide;
    cap.textContent = node.title;
    b.appendChild(cap);

    // ป้ายช่วยการเข้าถึง
    b.setAttribute("aria-label",
      node.title + (unlocked ? (completed ? " (ผ่านแล้ว)" : " (เปิดให้เรียน)") : " (ยังล็อกอยู่)"));

    b.addEventListener("click", function(){
      if(!unlocked){
        toast("ผ่านด่านก่อนหน้าก่อนนะ แล้วด่านนี้จะเปิดให้เอง");
        return;
      }
      if(isProject) go("lesson.html?project=" + node.id);
      else go("lesson.html?id=" + node.id);
    });

    wrap.appendChild(b);
  });
}

/* =====================================================================
   หน้า LESSON (lesson.html) — ลูปการเล่น 1 ด่าน
   ===================================================================== */
let currentItem = null;   // ด่านหรือโปรเจกต์ปัจจุบัน (hints.js ใช้ตัวนี้ด้วย)
let currentKind = "mission";
let editor = null;
let attempts = 0;         // จำนวนครั้งที่รันแล้วยังไม่ผ่าน
let hintsCollapsed = false; // ยุบคำใบ้เป็นแถบพับแล้วหรือยัง (หลังผ่านด่าน)

function getQuery(name){
  const m = new RegExp("[?&]" + name + "=([^&]+)").exec(window.location.search);
  return m ? decodeURIComponent(m[1]) : null;
}

function initLesson(){
  const projectId = getQuery("project");
  const missionId = getQuery("id");

  if(projectId){
    currentKind = "project";
    currentItem = PROJECTS.find(p => p.id === parseInt(projectId, 10));
  } else {
    currentKind = "mission";
    currentItem = MISSIONS.find(m => m.id === parseInt(missionId || "1", 10));
  }

  if(!currentItem){ go("map.html"); return; }

  // กันการเข้าด่านที่ยังล็อก
  if(currentKind === "mission" && !isUnlocked(currentItem.id) && !isCompleted(currentItem.id)){
    showLockedScreen();
    return;
  }
  if(currentKind === "project" && !isCompleted(currentItem.ref ? currentItem.ref.afterMission : currentItem.afterMission)){
    showLockedScreen();
    return;
  }

  resetHints();
  attempts = 0;
  hintsCollapsed = false;
  renderLesson();
  setupInputModal();   // ผูกปุ่มของกล่องกรอกข้อมูล input()
  setupWinModal();     // ผูกปุ่ม/คีย์ของกล่องชนะ (อยู่เล่นต่อ / กากบาท / Esc / คลิกพื้นหลัง)
  // ถ้าเป็นด่านที่เคยผ่านมาแล้ว -> โชว์แถบ "ผ่านแล้ว ไปต่อ" ค้างไว้ตั้งแต่เข้าหน้า
  if(isItemCompleted()) revealDoneBar();
}

function showLockedScreen(){
  const main = el("lesson-main");
  if(main){
    main.innerHTML =
      '<div class="locked-screen card">' +
      '<div class="locked-ic">' + ICON.lock + '</div>' +
      '<h2>ด่านนี้ยังไม่เปิด</h2>' +
      '<p>ผ่านด่านก่อนหน้าก่อนนะ แล้วด่านนี้จะเปิดให้เอง</p>' +
      '<a class="btn btn-primary" href="map.html">กลับไปที่แผนที่</a>' +
      '</div>';
  }
}

function renderLesson(){
  const item = currentItem;
  const isProject = currentKind === "project";

  // หัวเรื่อง
  el("lesson-title").textContent = item.title;
  const badge = el("lesson-badge");
  if(badge){
    badge.textContent = isProject ? (item.capstone ? "โปรเจกต์ใหญ่" : "มินิโปรเจกต์")
                                   : ("ด่านที่ " + item.id);
  }

  // ----- ส่วนเนื้อหา: เผยทีละขั้น (Hook -> Show -> Explain -> Task) -----
  const steps = el("lesson-steps");
  steps.innerHTML = "";

  if(isProject){
    // โปรเจกต์: มีแค่ brief + task (เปิดให้สร้างอิสระ)
    steps.appendChild(stepBlock("brief", "โจทย์", "<p>" + escapeHtml(item.brief) + "</p>"));
    steps.appendChild(stepBlock("task", "สิ่งที่ต้องทำ", "<p>" + escapeHtml(item.task) + "</p>"));
  } else {
    steps.appendChild(stepBlock("hook", "เกริ่นนำ", "<p>" + escapeHtml(item.hook) + "</p>"));
    steps.appendChild(stepBlock("show", "ดูตัวอย่าง",
      '<pre class="code-sample">' + escapeHtml(item.show) + '</pre>'));
    steps.appendChild(stepBlock("explain", "อธิบาย", "<p>" + escapeHtml(item.explain) + "</p>"));
    steps.appendChild(stepBlock("task", "ภารกิจของคุณ", "<p>" + escapeHtml(item.task) + "</p>"));
  }

  // อนิเมชันเผยทีละส่วน (เคารพ reduced-motion)
  const blocks = steps.querySelectorAll(".step");
  blocks.forEach(function(blk, i){
    if(reducedMotion){
      blk.classList.add("revealed");
    } else {
      setTimeout(function(){ blk.classList.add("revealed"); }, 120 + i * 180);
    }
  });

  // ----- ตัวแก้ไขโค้ด (CodeMirror) -----
  const ta = el("code-input");
  ta.value = item.starterCode || "";
  editor = CodeMirror.fromTextArea(ta, {
    mode: "python",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,   // ใช้ space กัน IndentationError/TabError
    lineWrapping: true
  });
  setTimeout(function(){ editor.refresh(); }, 50);

  // ----- ปุ่มและตัวควบคุม -----
  el("run-btn").addEventListener("click", handleRun);

  const hintBtn = el("hint-btn");
  if(hintBtn) hintBtn.addEventListener("click", revealHint);

  const exampleBtn = el("example-btn");
  if(exampleBtn){
    if(isProject){ exampleBtn.hidden = true; }   // โปรเจกต์ไม่มีตัวอย่างตายตัว
    else exampleBtn.addEventListener("click", showExampleAgain);
  }

  // ปุ่มลัด: Ctrl+Enter เพื่อรัน
  document.addEventListener("keydown", function(e){
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){ handleRun(); }
  });
}

// สร้างกล่องเนื้อหาหนึ่งขั้น
function stepBlock(kind, label, html){
  const div = document.createElement("div");
  div.className = "step step-" + kind;
  div.innerHTML = '<div class="step-label">' + label + '</div>' +
                  '<div class="step-body">' + html + '</div>';
  return div;
}

function escapeHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// กดรันโค้ด -> รัน -> ตรวจผล
function handleRun(){
  if(!editor) return;
  const code = editor.getValue();
  const already = isItemCompleted();   // เคยผ่านด่านนี้มาก่อนหรือยัง (เช็คก่อนรันรอบนี้)
  runPython(code, function(result){
    if(result.error === "__CANCEL__") return;   // ผู้ใช้ยกเลิกตอนกรอกข้อมูล -> ไม่นับอะไร
    if(result.success && currentItem.check(result.output, code)){
      // ผ่าน! บันทึกความก้าวหน้า
      if(currentKind === "project") markProjectComplete(currentItem.id);
      else markComplete(currentItem.id);
      if(already){
        // เคยผ่านแล้วและกำลังเล่นต่อ -> ไม่เด้งกล่องซ้ำ/ไม่มี confetti
        // แค่โชว์ผลลัพธ์ปกติ (runner เขียนให้แล้ว) + คงแถบ "ไปต่อ" ไว้
        revealDoneBar();
      } else {
        // ครั้งแรกที่ผ่าน -> ฉลอง + โชว์ผลลัพธ์ในกล่องชนะ
        showWinModal(currentItem.winMessage, result.output);
      }
    } else if(!result.success){
      // มี error
      if(!already){
        // ยังไม่ผ่าน -> พฤติกรรมเดิม: นับ error ซ้ำเพื่อเผยคำใบ้อัตโนมัติ + ให้กำลังใจ
        attempts++;
        onErrorForHint((result.error || "").split(":")[0]);
        maybeEncourage();
      }
      // ผ่านแล้วและกำลังเล่นต่อ -> โชว์ error แปลไทยเฉย ๆ (runner ทำให้แล้ว) ไม่ขอคำใบ้ใหม่
    } else {
      // รันได้แต่ยังไม่ตรงโจทย์
      if(!already){
        // ยังไม่ผ่าน -> สะกิดเบา ๆ ในแถบสถานะ (ช่องผลลัพธ์ยังโชว์ output จริงอยู่)
        attempts++;
        setRunNote("ยังไม่ผ่าน แต่ใกล้แล้ว ลองอ่านโจทย์อีกครั้งแล้วปรับโค้ดดูนะ", "nudge");
        maybeEncourage();
      }
      // ผ่านแล้ว -> โชว์ผลลัพธ์ปกติ (runner เขียนให้แล้ว) ไม่สะกิดว่า "ยังไม่ผ่าน"
    }
  });
}

// แสดงคำใบ้ในพื้นที่คำใบ้ (เรียกจาก hints.js)
function showHintText(text, levelNo, totalLevels){
  const box = el("hint-box");
  if(!box) return;
  box.hidden = false;
  const item = document.createElement("div");
  item.className = "hint-item";
  item.innerHTML = '<span class="hint-ic">' + ICON.bulb + '</span>' +
                   '<span><b>คำใบ้ ' + levelNo + '/' + totalLevels + ':</b> ' + escapeHtml(text) + '</span>';
  box.appendChild(item);
  if(!reducedMotion) item.style.animation = "fadeInUp .4s ease both";
}

// แถบบอกสถานะการรัน — แยกจากช่องผลลัพธ์ เพื่อไม่ทับ output จริงที่โค้ดพิมพ์ออกมา
// kind: "nudge" (ยังไม่ผ่าน) | "error" (ผิดพลาด) | "cancel" (ยกเลิก) | "" (ล้างทิ้ง)
function setRunNote(msg, kind){
  const note = el("run-note");
  if(!note) return;
  if(!msg){ note.hidden = true; note.textContent = ""; note.className = "run-note"; return; }
  note.className = "run-note " + (kind || "");
  note.innerHTML = (kind === "error" ? '<span class="run-note-ic">' + ICON.warn + '</span>' : '') +
                   '<span class="run-note-text"></span>';
  note.querySelector(".run-note-text").textContent = msg;
  note.hidden = false;
}
function clearRunNote(){ setRunNote("", ""); }

// ให้กำลังใจเบา ๆ เมื่อพยายามหลายครั้ง (ไม่ลงโทษ)
function maybeEncourage(){
  if(attempts === 3){
    toast("ไม่เป็นไรเลย การลองผิดคือการเรียนรู้ ลองกดดูคำใบ้สิ");
    const hintBtn = el("hint-btn");
    if(hintBtn && !reducedMotion) hintBtn.classList.add("pulse");
  }
}

// "ดูตัวอย่างอีกครั้ง" -> เลื่อนไปส่วนตัวอย่างแล้วเน้นชั่วครู่
function showExampleAgain(){
  const show = document.querySelector(".step-show");
  if(!show) return;
  show.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block:"center" });
  show.classList.remove("flash");
  void show.offsetWidth; // บังคับให้ browser รีเฟรชอนิเมชัน
  show.classList.add("flash");
}

/* ---------- โมดอลชนะ + แถบ "ผ่านแล้ว" + confetti ---------- */

// โหนดถัดไปตามลำดับจริงของแผนที่ (mission สลับ project ตาม afterMission) หรือ null ถ้าเป็นโหนดสุดท้าย
function getNextNode(){
  const seq = buildPathNodes();
  const idx = seq.findIndex(function(nd){ return nd.kind === currentKind && nd.id === currentItem.id; });
  return (idx >= 0 && idx < seq.length - 1) ? seq[idx + 1] : null;
}
function nodeUrl(node){
  return node.kind === "project" ? ("lesson.html?project=" + node.id) : ("lesson.html?id=" + node.id);
}

// ด่าน/โปรเจกต์ปัจจุบันผ่านมาแล้วหรือยัง
function isItemCompleted(){
  return currentKind === "project" ? isProjectCompleted(currentItem.id) : isCompleted(currentItem.id);
}

function showWinModal(message, output){
  const modal = el("win-modal");
  if(!modal) return;

  // แสดงผลลัพธ์ของผู้เรียนในกล่องชนะ เพื่อให้ได้เห็นผลที่โค้ดตัวเองทำก่อนไปต่อ
  const winOut = el("win-output");
  const winOutText = el("win-output-text");
  if(winOut && winOutText){
    const o = (output || "").replace(/\s+$/,"");
    if(o.length){ winOutText.textContent = o; winOut.hidden = false; }
    else { winOut.hidden = true; }
  }

  const next = getNextNode();
  const heading = el("win-heading");
  const nextBtn = el("win-next");

  if(next){
    // ยังมีด่านถัดไป (จะเป็น mission, มินิโปรเจกต์ หรือ Capstone ก็ได้)
    if(heading) heading.textContent = "ผ่านแล้ว!";
    el("win-message").textContent = message;
    nextBtn.hidden = false;
    nextBtn.onclick = function(){ go(nodeUrl(next)); };
  } else {
    // โหนดสุดท้าย (Capstone) -> จบหลักสูตร ไม่มีปุ่มไปต่อ
    if(heading) heading.textContent = "จบหลักสูตรแล้ว";
    el("win-message").textContent = message;
    nextBtn.hidden = true;
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  fireConfetti();
  (nextBtn.hidden ? el("win-stay") : nextBtn).focus();
}

// ปิดกล่องชนะ -> "อยู่เล่นต่อ" ในด่านเดิม + เผยแถบ "ผ่านแล้ว ไปต่อ" ค้างไว้
function closeWinModal(){
  const modal = el("win-modal");
  if(modal){ modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); }
  revealDoneBar();
  const runBtn = el("run-btn"); if(runBtn) runBtn.focus();
}

// เผยแถบ "ผ่านด่านนี้แล้ว — ไปด่านถัดไป" (หรือ "ผ่านครบทุกด่าน" ถ้าเป็นโหนดสุดท้าย)
function revealDoneBar(){
  const bar = el("done-bar");
  if(!bar) return;
  const next = getNextNode();
  const label = el("done-bar-label");
  const ic = el("done-bar-ic");
  const btn = el("done-next");
  if(ic) ic.innerHTML = ICON.check;
  if(next){
    if(label) label.textContent = "ผ่านด่านนี้แล้ว";
    if(btn){
      btn.innerHTML = "ไปด่านถัดไป " + ICON.arrowR;
      btn.onclick = function(){ go(nodeUrl(next)); };
    }
  } else {
    if(label) label.textContent = "ผ่านครบทุกด่านแล้ว";
    if(btn){
      btn.textContent = "กลับไปที่แผนที่";
      btn.onclick = function(){ go("map.html"); };
    }
  }
  bar.hidden = false;
  collapseHintsAfterWin();   // ผ่านแล้ว -> ปิดปุ่มขอคำใบ้ + ยุบคำใบ้เก่าเป็นแถบพับ
}

// เมื่อผ่านด่านแล้ว: ปิดทางขอคำใบ้ใหม่ และยุบคำใบ้ที่เคยดูเป็นแถบเล็ก ๆ พับไว้
function collapseHintsAfterWin(){
  // ปิดปุ่ม "ขอคำใบ้" (ผ่านแล้ว ไม่มีโจทย์ให้ใบ้อีก)
  const hintBtn = el("hint-btn");
  if(hintBtn){ hintBtn.hidden = true; hintBtn.classList.remove("pulse"); }

  if(hintsCollapsed) return;   // ยุบไปแล้ว ไม่ต้องทำซ้ำ
  hintsCollapsed = true;

  const box = el("hint-box");
  if(!box) return;
  const items = Array.prototype.slice.call(box.querySelectorAll(".hint-item"));
  if(items.length === 0){
    box.hidden = true;         // ไม่เคยกดดูคำใบ้ -> ไม่ต้องมีแถบ
    return;
  }

  // สร้างแถบหัว "คำใบ้ที่เคยดู (N)" + ตัวคำใบ้ที่ซ่อนไว้ (ค่าเริ่มต้น = พับ เพื่อให้จอโล่ง)
  box.innerHTML = "";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "hint-collapse-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = '<span>คำใบ้ที่เคยดู (' + items.length + ')</span>' +
                     '<span class="hint-caret">' + ICON.chevron + '</span>';

  const body = document.createElement("div");
  body.className = "hint-collapsed-body";
  body.hidden = true;
  items.forEach(function(it){ it.style.animation = ""; body.appendChild(it); });

  toggle.addEventListener("click", function(){
    const opening = body.hidden;          // ตอนนี้พับอยู่ -> กำลังจะกาง
    body.hidden = !opening;
    toggle.setAttribute("aria-expanded", opening ? "true" : "false");
    toggle.classList.toggle("open", opening);
  });

  box.appendChild(toggle);
  box.appendChild(body);
  box.hidden = false;
}

// ผูกปุ่ม/คีย์ของกล่องชนะ ครั้งเดียวตอนเข้าหน้า (กากบาท / อยู่เล่นต่อ / แผนที่ / Esc / คลิกพื้นหลัง)
function setupWinModal(){
  const modal = el("win-modal");
  const closeBtn = el("win-close");
  const stayBtn = el("win-stay");
  const mapBtn = el("win-map");
  if(closeBtn){ closeBtn.innerHTML = ICON.close; closeBtn.addEventListener("click", closeWinModal); }
  if(stayBtn) stayBtn.addEventListener("click", closeWinModal);   // "อยู่เล่นต่อ" = ปิดกล่อง
  if(mapBtn)  mapBtn.addEventListener("click", function(){ go("map.html"); });
  // คลิกพื้นหลังมืด ๆ นอกการ์ด = ปิด
  if(modal) modal.addEventListener("click", function(e){ if(e.target === modal) closeWinModal(); });
  // Esc = ปิด (เฉพาะตอนกล่องชนะเปิดอยู่)
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && modal && modal.classList.contains("open")) closeWinModal();
  });
}

// confetti เบา ๆ ด้วย canvas (รูปทรงล้วน ไม่มี emoji) แล้วหยุดตาม config
function fireConfetti(){
  if(!BEDROCK_CONFIG.gamification.confetti.enabled || reducedMotion) return;
  const canvas = el("confetti");
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const colors = ["#0E7C7B", "#2BA84A", "#F2B705", "#D7ECEB"];
  const pieces = [];
  for(let i = 0; i < 130; i++){
    pieces.push({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.4,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: colors[i % colors.length],
      vy: 2 + Math.random() * 3,
      vx: -1.5 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4
    });
  }
  const start = performance.now();
  const dur = BEDROCK_CONFIG.gamification.confetti.durationMs;

  function frame(now){
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    pieces.forEach(function(p){
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    if(t < dur){
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W, H); // หยุดและล้างทิ้ง
    }
  }
  requestAnimationFrame(frame);
}

/* ---------- กล่องกรอกข้อมูล input() (modal ในหน้าเว็บ แทน window.prompt) ---------- */
const BEDROCK_INPUT_CANCEL = "__BEDROCK_INPUT_CANCEL__";
let inputResolve = null, inputReject = null;
let inputWaitStart = 0;   // เวลาเริ่มรอผู้ใช้พิมพ์ (ใช้หักเวลาออกจาก execLimit)

// Skulpt เรียกตัวนี้เมื่อโค้ดสั่ง input() -> คืน Promise ที่ resolve เมื่อผู้ใช้กดส่ง
function askInput(promptText){
  return new Promise(function(resolve, reject){
    inputResolve = resolve; inputReject = reject;
    inputWaitStart = Date.now();
    const modal = el("input-modal");
    const q = el("input-question");
    const field = el("input-field");
    const warn = el("input-warn");
    if(q) q.textContent = (promptText && String(promptText).trim()) ? String(promptText) : "พิมพ์คำตอบของคุณ";
    if(warn) warn.hidden = true;
    if(field) field.value = "";
    if(modal){ modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); }
    if(field) setTimeout(function(){ field.focus(); }, 30);
  });
}

// กด "ส่งคำตอบ" -> ถ้าว่างให้เตือนเบา ๆ, ถ้ามีค่าให้ส่งกลับเข้าโปรแกรม
function submitInput(){
  const field = el("input-field");
  const val = field ? field.value : "";
  if(String(val).trim().length === 0){
    const warn = el("input-warn");
    if(warn) warn.hidden = false;     // เตือนให้พิมพ์ก่อน (ยังไม่ปิดกล่อง)
    if(field) field.focus();
    return;
  }
  // หักเวลาที่นั่งรอผู้ใช้พิมพ์ออกจากตัวจับเวลาของ Skulpt
  // (ไม่งั้นผู้ที่พิมพ์ช้าจะโดน TimeLimitError ทั้งที่โค้ดไม่ได้วนไม่จบ)
  if(typeof Sk !== "undefined" && Sk.execStart && inputWaitStart){
    Sk.execStart = new Date(Sk.execStart.valueOf() + (Date.now() - inputWaitStart));
  }
  closeInputModal();
  if(inputResolve){ const r = inputResolve; inputResolve = inputReject = null; r(val); }
}

// กด "ยกเลิก" / ปิดกล่อง -> ยกเลิกการรันทั้งหมด (ไม่ถือว่าผ่าน)
function cancelInput(){
  closeInputModal();
  if(inputReject){ const rj = inputReject; inputResolve = inputReject = null; rj(BEDROCK_INPUT_CANCEL); }
}

function closeInputModal(){
  const modal = el("input-modal");
  if(modal){ modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); }
}

// ผูกปุ่มของกล่อง input ครั้งเดียวตอนเข้าหน้า lesson
function setupInputModal(){
  const submit = el("input-submit");
  const cancel = el("input-cancel");
  const field = el("input-field");
  if(submit) submit.addEventListener("click", submitInput);
  if(cancel) cancel.addEventListener("click", cancelInput);
  if(field) field.addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); submitInput(); }
    if(e.key === "Escape"){ cancelInput(); }
  });
}

/* ---------- ไฮไลต์บรรทัดที่ผิดใน CodeMirror (เรียกจาก runner.js) ---------- */
let errorLineMark = null;

function clearErrorLines(){
  if(editor && errorLineMark !== null){
    editor.removeLineClass(errorLineMark, "background", "cm-error-line");
    errorLineMark = null;
  }
}

function markErrorLine(lineNo){
  if(!editor || !lineNo) return;
  const idx = lineNo - 1;                       // CodeMirror นับบรรทัดจาก 0
  if(idx < 0 || idx >= editor.lineCount()) return;
  editor.addLineClass(idx, "background", "cm-error-line");
  errorLineMark = idx;
}

/* ---------- กล่องยืนยัน "เริ่มใหม่" (แทน window.confirm) ---------- */
function openResetConfirm(){
  const m = el("confirm-modal");
  if(m){ m.classList.add("open"); m.setAttribute("aria-hidden","false"); }
}
function closeResetConfirm(){
  const m = el("confirm-modal");
  if(m){ m.classList.remove("open"); m.setAttribute("aria-hidden","true"); }
}

/* =====================================================================
   ตัวเริ่มต้น: ดูว่าอยู่หน้าไหนแล้วเรียกฟังก์ชันที่ถูกต้อง
   ===================================================================== */
document.addEventListener("DOMContentLoaded", function(){
  const page = document.body.getAttribute("data-page");
  if(page === "home")   initHome();
  if(page === "map")    initMap();
  if(page === "lesson") initLesson();
});
