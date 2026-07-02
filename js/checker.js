/*
 * checker.js — Pass/Fail Engine หัวใจของระบบตรวจ
 * ตรวจ 2 ชั้น:
 *   ชั้น 1: ถ้ารันแล้วมี Error → ไม่ผ่าน (ให้ errors.js แปลข้อความ)
 *   ชั้น 2: รันสำเร็จ → ตรวจตามกติกา check.rules ของด่าน (ทุกข้อต้องผ่าน = AND)
 */
(function (global) {
  'use strict';

  // ปรับโค้ดให้เทียบกันได้ (ตัดช่องว่างหัวท้าย + ทำ line ending ให้เหมือนกัน)
  function normalize(code) {
    return String(code == null ? '' : code).replace(/\r\n/g, '\n').trim();
  }

  /*
   * ตัดคอมเมนต์ (#...) ออกจากโค้ด แต่ไม่ตัด # ที่อยู่ในข้อความ
   * ใช้ก่อนตรวจกติกาแบบ codeIncludes/codeMatches
   * เพื่อไม่ให้คำในคอมเมนต์ของ starterCode ทำให้ผ่านการตรวจแบบผิด ๆ
   */
  function stripComments(code) {
    var out = '';
    var inStr = null;
    var s = String(code == null ? '' : code);
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (inStr) {
        out += ch;
        if (ch === '\\') { out += s[i + 1] || ''; i++; continue; }
        if (ch === inStr) inStr = null;
      } else if (ch === '"' || ch === "'") {
        inStr = ch;
        out += ch;
      } else if (ch === '#') {
        while (i < s.length && s[i] !== '\n') i++;
        out += '\n'; // คงจำนวนบรรทัดเดิมไว้
        // ไม่ต้องขยับ i เพิ่ม เพราะ for จะ i++ ให้เอง (ตอนนี้ s[i] คือ \n อยู่แล้ว
        // แต่เราใส่ \n ไปแล้ว เลยต้องไม่ใส่ซ้ำ) — ข้ามการใส่ตัวอักษรนี้
      } else {
        out += ch;
      }
    }
    return out;
  }

  // นับบรรทัด output ที่มีเนื้อหาจริง (ไม่นับบรรทัดว่าง)
  function countLines(output) {
    return String(output == null ? '' : output)
      .split('\n')
      .filter(function (l) { return l.trim() !== ''; })
      .length;
  }

  /*
   * ตรวจกติกา 1 ข้อ
   * rule    : {type, value/pattern}
   * env     : {code, codeClean, output, starterCode}
   * คืนค่า true = ผ่านข้อนี้
   */
  function checkRule(rule, env) {
    switch (rule.type) {
      case 'codeChanged':
        // โค้ดต้องต่างจาก starterCode และไม่ว่างเปล่า — กัน "กด Run เฉย ๆ แล้วผ่าน"
        return normalize(env.code) !== '' &&
               normalize(env.code) !== normalize(env.starterCode);

      case 'outputContains':
        return env.output.indexOf(rule.value) !== -1;

      case 'outputEquals':
        return env.output.trim() === String(rule.value);

      case 'outputMatches':
        return new RegExp(rule.pattern, 'm').test(env.output);

      case 'outputLineCountAtLeast':
        return countLines(env.output) >= rule.value;

      case 'codeIncludes':
        return env.codeClean.indexOf(rule.value) !== -1;

      case 'codeNotIncludes':
        return env.codeClean.indexOf(rule.value) === -1;

      case 'codeMatches':
        return new RegExp(rule.pattern, 'm').test(env.codeClean);

      default:
        // กติกาที่ไม่รู้จัก ให้ถือว่าไม่ผ่าน จะได้เห็นตอนทดสอบ ไม่หลุดไปเงียบ ๆ
        return false;
    }
  }

  /*
   * ตรวจทั้งด่าน
   * mission   : ข้อมูลด่านจาก missions.js
   * code      : โค้ดของผู้เรียน
   * runResult : ผลจาก Runner.run — {output, error, timedOut, ...}
   * คืนค่า {passed, message, failedRule}
   *   passed=false + message = ข้อความ "ยังไม่ผ่าน" ภาษาไทยโทนส้ม
   */
  function check(mission, code, runResult) {
    // ชั้น 1: มี Error (รวม timeout) = ไม่ผ่านทันที — ฝั่ง UI จะแปล Error เอง
    if (runResult.error) {
      return { passed: false, message: null, failedRule: 'error' };
    }

    // ชั้น 2: ตรวจตามกติกาของด่าน
    var rules = (mission.check && mission.check.rules) || [];
    var env = {
      code: code,
      codeClean: stripComments(code),
      output: String(runResult.output == null ? '' : runResult.output),
      starterCode: (mission.task && mission.task.starterCode) || ''
    };

    for (var i = 0; i < rules.length; i++) {
      if (!checkRule(rules[i], env)) {
        var msg = mission.check.failMessage ||
          'โค้ดรันได้แล้ว แต่ผลลัพธ์ยังไม่ตรงกับภารกิจ ลองอ่านโจทย์ใน Task Bar ด้านล่างอีกครั้ง';
        // กรณีพิเศษ: ยังไม่ได้แก้โค้ดเลย ให้ข้อความชวนลงมือชัด ๆ
        if (rules[i].type === 'codeChanged') {
          msg = 'โค้ดยังเหมือนตอนเริ่มอยู่เลย ภารกิจนี้ต้องลงมือแก้หรือเพิ่มโค้ดเองก่อนนะ ลองดูโจทย์ใน Task Bar ด้านล่าง';
        }
        return { passed: false, message: msg, failedRule: rules[i].type };
      }
    }

    return { passed: true, message: mission.winMessage || 'ผ่านแล้ว!', failedRule: null };
  }

  global.Checker = {
    check: check,
    normalize: normalize,
    stripComments: stripComments,
    countLines: countLines
  };
})(typeof window !== 'undefined' ? window : globalThis);
