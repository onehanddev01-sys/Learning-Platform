/*
 * errors.js — ระบบแปล Error ของ Python เป็นภาษาไทยที่เป็นมิตร
 * รูปแบบข้อความ 3 ส่วน: เกิดอะไรขึ้น → อยู่ตรงไหน → แนวทางแก้ (ชี้ทาง ไม่เฉลย)
 * ลำดับการหาข้อความ: errorOverrides ของด่าน → catalog กลาง → fallback ทั่วไป
 */
(function (global) {
  'use strict';

  // ---------- ตัวช่วยวิเคราะห์โค้ด ประกอบการชี้แนะ ----------

  // ดึงบรรทัดที่ x จากโค้ด (เริ่มนับที่ 1)
  function getLine(code, lineNo) {
    if (!code || !lineNo) return '';
    var lines = String(code).split('\n');
    return lines[lineNo - 1] || '';
  }

  // เช็คว่าบรรทัดนี้เป็นหัวบล็อก (if/for/while/def ฯลฯ) ที่ลืมใส่ : หรือไม่
  function missingColon(line) {
    var t = line.trim();
    if (t === '') return false;
    var isBlockHead = /^(if|elif|else|for|while|def)\b/.test(t);
    return isBlockHead && !/:\s*(#.*)?$/.test(t);
  }

  /*
   * หาบรรทัดแรกที่เปิดเครื่องหมายคำพูดแล้วไม่ได้ปิด
   * (string ปกติของ Python จบในบรรทัดเดียว ถ้าจบบรรทัดทั้งที่ยังอยู่ใน string = ลืมปิด)
   * คืนเลขบรรทัด (เริ่มนับ 1) หรือ null ถ้าไม่พบ
   */
  function unclosedQuoteLine(code) {
    var lines = String(code || '').split('\n');
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var inStr = null;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (inStr) {
          if (ch === '\\') { i++; continue; }
          if (ch === inStr) inStr = null;
        } else if (ch === '"' || ch === "'") {
          inStr = ch;
        } else if (ch === '#') {
          break; // ที่เหลือเป็นคอมเมนต์
        }
      }
      if (inStr) return li + 1;
    }
    return null;
  }

  // เช็คว่าบรรทัดก่อนหน้าจบด้วย : แต่บรรทัดนี้ไม่ได้ย่อหน้าลึกกว่า (ลืมย่อหน้า)
  function missingIndentAfterColon(code, lineNo) {
    if (!lineNo || lineNo < 2) return false;
    var lines = String(code || '').split('\n');
    var prev = null;
    for (var i = lineNo - 2; i >= 0; i--) {
      if (lines[i].trim() !== '') { prev = lines[i]; break; }
    }
    var cur = lines[lineNo - 1] || '';
    if (!prev || cur.trim() === '') return false;
    var prevEndsColon = /:\s*(#.*)?$/.test(prev.trim());
    var prevIndent = (prev.match(/^\s*/) || [''])[0].length;
    var curIndent = (cur.match(/^\s*/) || [''])[0].length;
    return prevEndsColon && curIndent <= prevIndent;
  }

  // เช็คสมดุลของวงเล็บชนิดหนึ่ง (ข้าม string และคอมเมนต์) — 0 = ครบคู่
  function pairBalance(code, openCh, closeCh) {
    var open = 0;
    var inStr = null;
    var s = String(code || '');
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === inStr) inStr = null;
      } else if (ch === '"' || ch === "'") {
        inStr = ch;
      } else if (ch === '#') {
        while (i < s.length && s[i] !== '\n') i++;
      } else if (ch === openCh) {
        open++;
      } else if (ch === closeCh) {
        open--;
      }
    }
    return open;
  }

  function unbalancedParens(code) { return pairBalance(code, '(', ')') !== 0; }
  function unbalancedBrackets(code) { return pairBalance(code, '[', ']') !== 0; }

  // เช็คว่าบรรทัดเงื่อนไข (if/elif/while) เผลอใช้ = ตัวเดียวแทน == หรือไม่
  function assignmentInCondition(line) {
    var t = String(line || '').trim();
    if (!/^(if|elif|while)\b/.test(t)) return false;
    // ตัด string, ==, !=, <=, >= ออกก่อน แล้วดูว่ายังเหลือ = เดี่ยว ๆ ไหม
    var stripped = t
      .replace(/(['"]).*?\1/g, '')
      .replace(/[=!<>]=/g, '');
    return stripped.indexOf('=') !== -1;
  }

  // ดึงชื่อตัวแปรจากข้อความ NameError เช่น name 'xyz' is not defined
  function extractName(raw) {
    var m = /name '([^']+)'/.exec(raw);
    return m ? m[1] : null;
  }

  // ---------- catalog กลาง: ข้อความแปลตามชนิด Error ----------
  // แต่ละตัวเป็นฟังก์ชัน รับ (raw, line, code) คืน {what, how}

  var CATALOG = {
    SyntaxError: function (raw, lineNo, code) {
      var line = getLine(code, lineNo);
      // 1) ลืมปิดเครื่องหมายคำพูด — ตรวจจากโค้ดจริง แม่นกว่าข้อความ error ของ Skulpt
      var quoteLine = unclosedQuoteLine(code);
      if (quoteLine !== null || /unterminated string|EOL while scanning/i.test(raw)) {
        return {
          what: 'ดูเหมือนมีข้อความ (string) ที่เปิดเครื่องหมายคำพูดไว้ แต่ยังไม่ได้ปิด' +
            (quoteLine !== null ? ' (น่าจะอยู่บรรทัดที่ ' + quoteLine + ')' : ''),
          how: "ตรวจดูว่าเครื่องหมายคำพูดเปิดกับปิดครบคู่กันไหม เช่น 'สวัสดี' ต้องมีทั้งตัวหน้าและตัวหลัง"
        };
      }
      // 2) ใช้ = ตัวเดียวในเงื่อนไข (ตั้งใจจะเปรียบเทียบแต่กลายเป็นเก็บค่า)
      if (assignmentInCondition(line)) {
        return {
          what: 'ในบรรทัดเงื่อนไขมีเครื่องหมาย = ตัวเดียว ซึ่งแปลว่า "เก็บค่า" — แต่การเปรียบเทียบว่าเท่ากันไหมต้องใช้ == (สองตัวติดกัน)',
          how: 'เปลี่ยน = ในเงื่อนไขให้เป็น == เช่น if x == 5: (ส่วน = ตัวเดียวเอาไว้ใช้ตอนสร้างตัวแปร)'
        };
      }
      // 3) ลืมใส่ : ท้ายบรรทัดหัวบล็อก
      if (missingColon(line)) {
        return {
          what: 'บรรทัดนี้ขึ้นต้นด้วยคำสั่งอย่าง if / for / while / def ซึ่ง Python ต้องการเครื่องหมายพิเศษปิดท้าย',
          how: 'ลองดูท้ายบรรทัดว่าลืมเครื่องหมาย : (โคลอน) หรือเปล่า'
        };
      }
      // 4) บรรทัดก่อนหน้าเปิดบล็อกด้วย : แล้ว แต่บรรทัดนี้ไม่ได้ย่อหน้า
      if (missingIndentAfterColon(code, lineNo)) {
        return {
          what: 'บรรทัดก่อนหน้าจบด้วยเครื่องหมาย : แปลว่าบรรทัดถัดมาต้องย่อหน้าเข้าไปเป็นลูกของมัน',
          how: 'เพิ่มการย่อหน้า 4 ช่องว่างหน้าบรรทัดที่อยู่ใน if / for / while / def นั้น'
        };
      }
      // 5) วงเล็บเหลี่ยมของลิสต์ไม่ครบคู่
      if (unbalancedBrackets(code)) {
        return {
          what: 'วงเล็บเหลี่ยม [ กับ ] ในโค้ดมีจำนวนไม่เท่ากัน (มักเกิดตอนสร้างหรือเรียกใช้ลิสต์)',
          how: 'ไล่ดูบรรทัดที่มีลิสต์ว่าเปิด [ แล้วปิด ] ครบทุกอันไหม'
        };
      }
      // 6) วงเล็บเปิด-ปิดไม่ครบคู่ (Skulpt มักรายงานว่า EOF in multi-line statement)
      if (unbalancedParens(code) || /EOF in multi-line/i.test(raw)) {
        return {
          what: 'วงเล็บเปิดกับวงเล็บปิดในโค้ดมีจำนวนไม่เท่ากัน',
          how: 'ไล่ดูทีละบรรทัดว่าวงเล็บ ( กับ ) จับคู่กันครบทุกอันไหม โดยเฉพาะท้ายคำสั่ง print(...)'
        };
      }
      return {
        what: 'มีบางจุดที่ Python อ่านแล้วไม่เข้าใจ (เขียนผิดรูปแบบ)',
        how: 'ลองอ่านบรรทัดนั้นช้า ๆ อีกครั้ง เทียบกับโค้ดตัวอย่างในบทเรียนว่าต่างกันตรงไหน'
      };
    },

    IndentationError: function () {
      return {
        what: 'การย่อหน้า (เว้นวรรคหน้าบรรทัด) ยังไม่ถูกต้อง — Python ใช้ย่อหน้าบอกว่าบรรทัดไหนอยู่ในกลุ่มไหน',
        how: 'บรรทัดที่อยู่ใต้ if / for / while / def ต้องย่อหน้าเข้าไป 4 ช่องว่างเท่ากันทุกบรรทัด ลองจัดใหม่ดู'
      };
    },

    NameError: function (raw) {
      var name = extractName(raw);
      if (name) {
        return {
          what: "Python ไม่รู้จักชื่อ '" + name + "' — อาจยังไม่ได้สร้างตัวแปรนี้ หรือสะกดไม่ตรงกับตอนที่สร้างไว้",
          how: 'เช็คว่าสร้างตัวแปรชื่อนี้ก่อนใช้งานแล้วหรือยัง และตัวสะกดตรงกันทุกตัวอักษรไหม (ตัวพิมพ์เล็ก-ใหญ่มีผลนะ)'
        };
      }
      return {
        what: 'Python เจอชื่อที่ยังไม่รู้จัก',
        how: 'เช็คว่าตัวแปรทุกตัวถูกสร้าง (มีเครื่องหมาย =) ก่อนถูกเรียกใช้ และสะกดตรงกัน'
      };
    },

    TypeError: function (raw) {
      // ใส่วงเล็บ ( ) ตามหลังสิ่งที่ไม่ใช่ฟังก์ชัน เช่น mylist(0)
      var mCall = /'(\w+)' object is not callable/.exec(raw);
      if (mCall) {
        var kind = mCall[1];
        return {
          what: 'มีการใส่วงเล็บ ( ) ตามหลังสิ่งที่ไม่ใช่ฟังก์ชัน (ตัวนั้นเป็นข้อมูลชนิด ' + kind + ')',
          how: kind === 'list'
            ? 'ถ้าตั้งใจจะหยิบของจากลิสต์ ต้องใช้วงเล็บเหลี่ยม เช่น mylist[0] ไม่ใช่ mylist(0)'
            : 'วงเล็บ ( ) เอาไว้เรียกฟังก์ชันเท่านั้น เช็คว่าเผลอตั้งชื่อตัวแปรทับชื่อฟังก์ชัน หรือใส่วงเล็บผิดที่หรือเปล่า'
        };
      }
      // เรียกฟังก์ชันด้วยจำนวนค่าไม่ตรงกับที่นิยามไว้
      var mArgs = /(\w+)\(\) (missing \d+ required|takes)/.exec(raw);
      if (mArgs) {
        return {
          what: 'ฟังก์ชัน ' + mArgs[1] + '() ถูกเรียกด้วยจำนวนค่าที่ไม่ตรงกับช่องรับที่นิยามไว้',
          how: 'นับดูว่าตอนนิยาม def ' + mArgs[1] + '(...) มีช่องรับกี่ตัว แล้วตอนเรียกใช้ก็ใส่ค่าให้ครบเท่ากันทุกช่อง'
        };
      }
      // เอาข้อความ (str) ไปบวกกับตัวเลขตรง ๆ
      if (/(concatenate|unsupported operand|can only concat|str.*int|int.*str)/i.test(raw)) {
        return {
          what: 'มีการนำข้อมูลคนละชนิดมาคำนวณรวมกัน เช่น เอาข้อความ (str) ไปบวกกับตัวเลข (int) ตรง ๆ ซึ่ง Python ทำให้ไม่ได้',
          how: 'ถ้าอยากคำนวณ ให้แปลงข้อความเป็นตัวเลขก่อนด้วย int() หรือ float() แต่ถ้าอยากต่อข้อความ ให้แปลงตัวเลขเป็นข้อความด้วย str()'
        };
      }
      return {
        what: 'มีการใช้ข้อมูลผิดชนิด เช่น ใช้ข้อความในที่ที่ต้องเป็นตัวเลข',
        how: 'เช็คว่าตัวแปรแต่ละตัวเก็บข้อมูลชนิดไหน แล้วแปลงชนิดให้ตรงก่อนใช้งานด้วย int() float() หรือ str()'
      };
    },

    ValueError: function (raw) {
      if (/invalid literal|could not convert/i.test(raw)) {
        return {
          what: 'มีการพยายามแปลงข้อความที่ไม่ใช่ตัวเลขให้เป็นตัวเลข เช่น int(\'สวัสดี\') ซึ่งแปลงไม่ได้',
          how: 'เช็คว่าค่าที่ส่งเข้า int() หรือ float() เป็นตัวเลขจริง ๆ ถ้ารับจาก input() ลองกรอกเป็นตัวเลขดู'
        };
      }
      return {
        what: 'ค่าที่ส่งให้คำสั่งนี้ยังไม่ใช่ค่าที่มันรับได้',
        how: 'ลองดูว่าค่าที่ใส่เข้าไปในฟังก์ชันเป็นแบบที่มันต้องการไหม'
      };
    },

    ZeroDivisionError: function () {
      return {
        what: 'มีการหารด้วยศูนย์ ซึ่งทางคณิตศาสตร์ทำไม่ได้ Python เลยหยุดทำงาน',
        how: 'เช็คว่าตัวหารมีโอกาสเป็น 0 ไหม ถ้ารับค่าจากผู้ใช้ อาจต้องกันกรณีที่กรอก 0 เข้ามา'
      };
    },

    IndexError: function () {
      return {
        what: 'มีการเรียกสมาชิกในลิสต์ด้วยตำแหน่งที่เกินขนาดของลิสต์',
        how: 'อย่าลืมว่าตำแหน่งในลิสต์เริ่มนับจาก 0 ดังนั้นลิสต์ที่มี 3 ช่อง จะมีตำแหน่ง 0, 1, 2 เท่านั้น'
      };
    },

    TimeLimitError: function () {
      return {
        what: 'โค้ดอาจกำลังวนซ้ำไม่รู้จบ ระบบเลยหยุดให้ก่อน (ไม่มีอะไรเสียหาย)',
        how: 'ลองตรวจดูว่าเงื่อนไขของ while มีทางเป็นเท็จไหม — ในลูปต้องมีบรรทัดที่ทำให้ค่าเปลี่ยนจนหลุดเงื่อนไขได้'
      };
    },

    RecursionError: function () {
      return {
        what: 'ฟังก์ชันเรียกตัวเองซ้ำลึกเกินไปจนระบบต้องหยุด',
        how: 'เช็คว่าฟังก์ชันมีจุดหยุด (เงื่อนไขที่ไม่เรียกตัวเองต่อ) แล้วหรือยัง'
      };
    },

    ImportError: function (raw) {
      var m = /No module named ([\w.]+)/.exec(raw);
      var name = m ? m[1] : null;
      return {
        what: name
          ? "Python หาโมดูล '" + name + "' ไม่เจอ — อาจสะกดชื่อผิด หรือโมดูลนี้ใช้ในสนามฝึกบนเว็บนี้ไม่ได้"
          : 'Python หาโมดูลที่สั่ง import ไม่เจอ',
        how: 'ทุกภารกิจในหลักสูตรนี้ทำได้โดยไม่ต้อง import อะไรเลย แต่ถ้าอยากทดลอง โมดูลที่ใช้ได้ เช่น math, random, time — เช็คตัวสะกดให้ตรงด้วยนะ'
      };
    },

    UnboundLocalError: function (raw) {
      var m = /local variable '([^']+)'/.exec(raw);
      var name = m ? "'" + m[1] + "'" : 'ตัวนั้น';
      return {
        what: 'ในฟังก์ชันมีการเรียกใช้ตัวแปร ' + name + ' ก่อนบรรทัดที่กำหนดค่าให้มัน',
        how: 'ย้ายบรรทัดที่กำหนดค่า (เช่น x = ...) ขึ้นไปให้อยู่ก่อนบรรทัดที่เรียกใช้ ภายในฟังก์ชันเดียวกัน'
      };
    },

    KeyError: function (raw) {
      var m = /KeyError:\s*(.+?)(\son line.*)?$/.exec(raw);
      var key = m ? m[1].trim() : null;
      return {
        what: key
          ? "มีการหยิบข้อมูลด้วยคีย์ '" + key + "' แต่ใน dictionary ไม่มีคีย์นี้อยู่"
          : 'มีการหยิบข้อมูลจาก dictionary ด้วยคีย์ที่ไม่มีอยู่ข้างใน',
        how: 'เช็คตัวสะกดของคีย์ให้ตรงกับตอนที่ใส่ข้อมูลไว้ (ตัวพิมพ์เล็ก-ใหญ่และวรรคก็มีผล)'
      };
    },

    AttributeError: function () {
      return {
        what: 'มีการเรียกใช้ความสามารถที่ข้อมูลชนิดนั้นไม่มี เช่น เรียก .append กับสิ่งที่ไม่ใช่ลิสต์',
        how: 'เช็คว่าตัวแปรตัวนั้นเก็บข้อมูลชนิดอะไรอยู่ แล้วสะกดชื่อคำสั่งถูกไหม'
      };
    }
  };

  // ข้อความ fallback เมื่อไม่รู้จักชนิด Error
  function fallbackMessage(lineNo) {
    return {
      what: 'โค้ดมีจุดที่ Python ยังไม่เข้าใจ',
      how: lineNo
        ? 'ลองอ่านบรรทัดที่ ' + lineNo + ' อีกครั้ง เทียบกับตัวอย่างในบทเรียนว่าต่างกันตรงไหน'
        : 'ลองไล่อ่านโค้ดทีละบรรทัด เทียบกับตัวอย่างในบทเรียนว่าต่างกันตรงไหน'
    };
  }

  // ---------- ฟังก์ชันหลัก ----------

  /*
   * แปล Error จาก Skulpt เป็นข้อความภาษาไทย
   * e       : error object จาก Skulpt
   * code    : โค้ดของผู้เรียน (ใช้วิเคราะห์เพิ่มเติม)
   * mission : ข้อมูลด่านปัจจุบัน (ใช้หา errorOverrides) — ไม่บังคับ
   * คืนค่า {type, line, what, where, how, raw}
   */
  function translate(e, code, mission) {
    var type = e && e.tp$name ? e.tp$name : 'Error';
    var raw = '';
    try { raw = String(e); } catch (ex) { raw = type; }

    // หาเลขบรรทัดจาก traceback ของ Skulpt
    var lineNo = null;
    if (e && e.traceback && e.traceback.length > 0 && e.traceback[0].lineno) {
      lineNo = e.traceback[0].lineno;
    }

    var what, how;

    // 1) ข้อความเฉพาะด่าน (errorOverrides) มาก่อนเสมอ
    if (mission && mission.errorOverrides && mission.errorOverrides[type]) {
      what = mission.errorOverrides[type];
      var base = CATALOG[type] ? CATALOG[type](raw, lineNo, code) : fallbackMessage(lineNo);
      how = base.how;
    } else if (CATALOG[type]) {
      // 2) catalog กลาง
      var msg = CATALOG[type](raw, lineNo, code);
      what = msg.what;
      how = msg.how;
    } else {
      // 3) fallback ทั่วไป
      var fb = fallbackMessage(lineNo);
      what = fb.what;
      how = fb.how;
    }

    return {
      type: type,
      line: lineNo,
      what: what,
      where: lineNo ? 'จุดที่ต้องดู: บรรทัดที่ ' + lineNo : null,
      how: how,
      raw: raw
    };
  }

  // ModuleNotFoundError คือชื่อใหม่ของ ImportError ใน Python 3 — ใช้ข้อความเดียวกัน
  CATALOG.ModuleNotFoundError = CATALOG.ImportError;

  global.ErrorTranslator = {
    translate: translate,
    // ส่งออกไว้ให้หน้า test/notes ใช้ตรวจว่ารองรับชนิดไหนบ้าง
    catalogTypes: Object.keys(CATALOG)
  };
})(typeof window !== 'undefined' ? window : globalThis);
