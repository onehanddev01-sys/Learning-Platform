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
  eye:   '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
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
      continueBtn.hidden = false;
      continueBtn.addEventListener("click", function(){
        // ไปด่านปัจจุบันที่ยังเรียนอยู่ (ถ้าเกิน 15 ให้กลับแผนที่)
        const id = Math.min(p.currentMission, BEDROCK_CONFIG.curriculum.missionsTotal);
        go("lesson.html?id=" + id);
      });
      const note = el("progress-note");
      if(note) note.textContent = "เรียนไปแล้ว " + p.completedMissions.length + " / " + BEDROCK_CONFIG.curriculum.missionsTotal + " ด่าน";
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

  // ปุ่มเริ่มใหม่ (ลบความก้าวหน้า)
  const resetBtn = el("reset-btn");
  if(resetBtn){
    resetBtn.addEventListener("click", function(){
      if(window.confirm("ต้องการเริ่มใหม่ทั้งหมดไหม? ความก้าวหน้าที่ผ่านมาจะถูกลบ")){
        resetProgress();
        go("map.html");
      }
    });
  }

  // เลื่อนหน้าไปยังด่านปัจจุบันให้อัตโนมัติ
  setTimeout(function(){
    const cur = wrap.querySelector(".node.unlocked:not(.completed)") || wrap.querySelector(".node.unlocked");
    if(cur) cur.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block:"center" });
  }, 120);

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

  // ----- วางหมุด (node) -----
  points.forEach(function(pt){
    const node = pt.node;
    const unlocked = nodeUnlocked(node);
    const completed = nodeCompleted(node);
    const isProject = node.kind === "project";
    const isCapstone = isProject && node.ref.capstone;

    const b = document.createElement("button");
    b.type = "button";
    b.className = "node" +
      (unlocked ? " unlocked" : " locked") +
      (completed ? " completed" : "") +
      (isProject ? " project" : "") +
      (isCapstone ? " capstone" : "");
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
  renderLesson();
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
  runPython(code, function(result){
    if(result.success && currentItem.check(result.output, code)){
      // ผ่าน! บันทึกความก้าวหน้า + ฉลอง
      if(currentKind === "project") markProjectComplete(currentItem.id);
      else markComplete(currentItem.id);
      showWinModal(currentItem.winMessage);
    } else if(!result.success){
      // มี error -> นับ error ซ้ำเพื่อเผยคำใบ้อัตโนมัติ
      attempts++;
      onErrorForHint((result.error || "").split(":")[0]);
      maybeEncourage();
    } else {
      // รันได้แต่ยังไม่ตรงโจทย์ -> สะกิดเบา ๆ (ไม่ใช่ error)
      attempts++;
      showNudge("ยังไม่ผ่าน แต่ใกล้แล้ว ลองอ่านโจทย์อีกครั้งแล้วปรับโค้ดดูนะ");
      maybeEncourage();
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

// ข้อความสะกิดเบา ๆ เมื่อรันได้แต่ยังไม่ผ่านโจทย์
function showNudge(msg){
  const box = el("output");
  const txt = el("output-text");
  if(box){ box.classList.remove("error"); box.classList.add("nudge"); }
  if(txt){ txt.textContent = msg; }
}

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

/* ---------- โมดอลชนะ + confetti ---------- */
function showWinModal(message){
  const modal = el("win-modal");
  if(!modal) return;
  el("win-message").textContent = message;

  // ปุ่มไปต่อ: ถ้ามีด่านถัดไปที่เป็นด่านปกติ ให้ไปด่านนั้น ไม่งั้นกลับแผนที่
  const nextBtn = el("win-next");
  let nextUrl = null;
  if(currentKind === "mission"){
    const nextId = currentItem.id + 1;
    if(MISSIONS.find(m => m.id === nextId)) nextUrl = "lesson.html?id=" + nextId;
  }
  if(nextUrl){
    nextBtn.hidden = false;
    nextBtn.onclick = function(){ go(nextUrl); };
  } else {
    nextBtn.hidden = true;
  }
  el("win-map").onclick = function(){ go("map.html"); };

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  fireConfetti();
  nextBtn.hidden ? el("win-map").focus() : nextBtn.focus();
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

/* =====================================================================
   ตัวเริ่มต้น: ดูว่าอยู่หน้าไหนแล้วเรียกฟังก์ชันที่ถูกต้อง
   ===================================================================== */
document.addEventListener("DOMContentLoaded", function(){
  const page = document.body.getAttribute("data-page");
  if(page === "home")   initHome();
  if(page === "map")    initMap();
  if(page === "lesson") initLesson();
});
