/* =============================================================
   config.js — ศูนย์รวมค่าพฤติกรรมทั้งหมดของแอป (BEDROCK_CONFIG)
   ทุกไฟล์อ่านค่าจากที่นี่ ห้าม hardcode กระจายตามไฟล์อื่น
   แก้พฤติกรรมแอป ให้มาแก้ที่ไฟล์นี้ที่เดียว
   ============================================================= */
const BEDROCK_CONFIG = {
  // กลุ่ม: ความเชื่อว่า "ฉันทำได้" (Self-Efficacy)
  selfEfficacy: {
    firstSuccessTargetSeconds: 120,   // ตั้งใจให้รันสำเร็จครั้งแรกภายใน 2 นาที
    showJargonBeforeFirstWin: false,  // ยังไม่ยัดศัพท์เทคนิคก่อนสำเร็จครั้งแรก
    everyMissionMustEndInWin: true    // ทุกด่านต้องจบด้วยชัยชนะ
  },

  // กลุ่ม: คุมภาระทางสมอง (Cognitive Load)
  cognitiveLoad: {
    maxNewConceptsPerMission: 1,      // แต่ละด่านสอนแนวคิดใหม่แค่ 1 เรื่อง
    revealLessonStepByStep: true,     // เผยเนื้อหา Hook -> Show -> Explain -> Task ทีละส่วน
    maxLinesInShowExample: 4          // ตัวอย่างโค้ดต้องสั้น ไม่เกิน 4 บรรทัด
  },

  // กลุ่ม: ให้ผู้เรียนรู้สึกเป็นเจ้าของการเรียน (Self-Determination)
  selfDetermination: {
    selfPaced: true,                  // ไม่มีจับเวลา/เดดไลน์
    allowSkipExplanation: true,       // ข้ามคำอธิบายได้
    capstoneLearnerChoosesTopic: true,// ปลายทางให้ผู้เรียนเลือกหัวข้อเอง
    noLeaderboard: true               // ไม่มีกระดานแข่งขัน ลดการเปรียบเทียบ
  },

  // กลุ่ม: ความยากที่พอดี (Desirable Difficulties)
  difficulty: {
    easyOnrampMissions: 4,            // 4 ด่านแรกง่ายเป็นพิเศษ (ช่วง 30 นาทีแรก)
    rampStartsAtMission: 5,           // เริ่มเพิ่มความยากจากด่าน 5
    fadeHintsOverTime: true,          // ค่อย ๆ ถอดตัวช่วยเมื่อเก่งขึ้น
    starterCodeByPhase: { easy:"almost-complete", mid:"skeleton", hard:"blank-with-comment" }
  },

  // กลุ่ม: ข้อความ error เป็นมิตร (Error readability)
  errors: {
    language:"th",            // แปล error เป็นภาษาไทยเสมอ
    color:"#E67E22",          // สีส้ม (อ่านจาก token --caution)
    forbiddenColor:"#FF0000", // ห้ามใช้สีแดงกับ error
    tone:"friendly-nudge",    // โทนสะกิดเบา ๆ ไม่ลงโทษ
    revealFix:false,          // ไม่บอกคำตอบตรง ๆ ใน error
    patternsCount:18,         // แปล error 18 รูปแบบ
    iconPrefix:""             // ไม่ใช้ emoji นำหน้า (ใช้ไอคอน SVG แทนใน UI)
  },

  // กลุ่ม: คำใบ้ (Hints)
  hints: {
    levels:3,                         // คำใบ้มี 3 ระดับ จางไปหาชัด
    autoRevealAfterSameErrorCount:2,  // error เดิมซ้ำ 2 ครั้ง เผยคำใบ้ให้อัตโนมัติ
    manualButton:true                 // มีปุ่มขอคำใบ้เอง
  },

  // กลุ่ม: เกมิฟิเคชันแบบเบา (Gamification - lite)
  gamification: {
    level:"lite", missionMap:true, lockUnlock:true,
    completionCheckmark:true, winMessage:true,
    confetti:{enabled:true, durationMs:1500}, // ฉลองสั้น 1.5 วิ แล้วหยุด
    points:false, badges:false, streaks:false // ปิดของที่กดดัน/โฟกัสผิด
  },

  // กลุ่ม: เครื่องรันโค้ด (Runtime)
  runtime: {
    engine:"skulpt", pythonVersion:3,
    execLimitMs:8000,          // จำกัดเวลารัน กันลูปไม่สิ้นสุดทำเบราว์เซอร์ค้าง
    clearOutputBeforeRun:true,
    supportsInput:true
  },

  // กลุ่ม: โครงหลักสูตร (Curriculum)
  curriculum: {
    modules:5, missionsTotal:15, miniProjects:5, capstone:1,
    unlockMode:"sequential"
  },

  // กลุ่ม: การเก็บความก้าวหน้า (Storage)
  storage: {
    type:"localStorage", key:"bedrock_progress_v1",
    noBackend:true, noTracking:true, allowReset:true
  },

  // กลุ่ม: การเข้าถึงง่าย (Accessibility)
  accessibility: {
    fontFamilyThai:"'Sarabun', sans-serif",
    minBodyFontPx:18, charset:"UTF-8", minTapTargetPx:44
  },

  // กลุ่ม: โทนเสียงของถ้อยคำ (Voice)
  voice: {
    encouraging:true, secondPersonFriendly:true,
    noBlameLanguage:true, celebrateSmallWins:true
  }
};
