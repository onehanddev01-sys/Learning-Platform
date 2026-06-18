/* =============================================================
   storage.js — เก็บความก้าวหน้าของผู้เรียนไว้ใน localStorage
   ไม่มี backend ไม่มีการติดตามตัวผู้ใช้ ข้อมูลอยู่ในเครื่องล้วน ๆ
   ============================================================= */
const KEY = BEDROCK_CONFIG.storage.key;

// อ่านความก้าวหน้า ถ้าไม่มีหรือพัง ให้คืนค่าเริ่มต้นแทนการ error
function getProgress(){
  try{
    const r = localStorage.getItem(KEY);
    const base = { completedMissions:[], completedProjects:[], currentMission:1, lastVisited:null };
    if(!r) return base;
    const p = JSON.parse(r);
    // เผื่อข้อมูลเก่าไม่มีฟิลด์ครบ เติมให้ครบกันพัง
    return Object.assign(base, p);
  }catch(e){
    // ข้อมูลเสีย -> รีเซ็ตเป็นค่าเริ่มต้น ดีกว่าปล่อยให้แอปพัง
    return { completedMissions:[], completedProjects:[], currentMission:1, lastVisited:null };
  }
}

// บันทึกความก้าวหน้า พร้อมประทับวันที่เข้าใช้ล่าสุด
function saveProgress(p){
  p.lastVisited = new Date().toISOString().slice(0,10);
  localStorage.setItem(KEY, JSON.stringify(p));
}

// ทำเครื่องหมายว่า "ผ่าน" ด่านนี้แล้ว และปลดล็อกด่านถัดไป
function markComplete(id){
  const p = getProgress();
  if(!p.completedMissions.includes(id)) p.completedMissions.push(id);
  p.currentMission = Math.max(p.currentMission, id + 1);
  saveProgress(p);
}

// ทำเครื่องหมายว่าทำมินิโปรเจกต์/แคปสโตนสำเร็จ
function markProjectComplete(pid){
  const p = getProgress();
  if(!p.completedProjects.includes(pid)) p.completedProjects.push(pid);
  saveProgress(p);
}

// ด่านนี้ปลดล็อกหรือยัง: ด่าน 1 เปิดเสมอ ด่านอื่นเปิดเมื่อด่านก่อนหน้าผ่านแล้ว
function isUnlocked(id){
  return id === 1 || getProgress().completedMissions.includes(id - 1);
}

// ด่านนี้ผ่านแล้วหรือยัง
function isCompleted(id){
  return getProgress().completedMissions.includes(id);
}

function isProjectCompleted(pid){
  return getProgress().completedProjects.includes(pid);
}

// ลบความก้าวหน้าทั้งหมด (เริ่มใหม่)
function resetProgress(){
  localStorage.removeItem(KEY);
}
