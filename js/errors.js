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

  /*
   * เช็คว่ามีตัวอักษรไทยอยู่ "นอกเครื่องหมายคำพูด" หรือไม่
   * เกิดจาก 2 สาเหตุที่พบบ่อยในผู้เรียนที่เพิ่งใช้คอมพิวเตอร์:
   *   1. เผลอพิมพ์คำสั่งตอนแป้นพิมพ์ยังเป็นภาษาไทยอยู่
   *   2. อยากแสดงข้อความไทยแต่ลืมครอบด้วยเครื่องหมายคำพูด
   */
  function thaiOutsideStrings(code) {
    var s = String(code || '');
    var out = '';
    var inStr = null;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === inStr) inStr = null;
      } else if (ch === '"' || ch === "'") {
        inStr = ch;
      } else if (ch === '#') {
        while (i < s.length && s[i] !== '\n') i++;
      } else {
        out += ch;
      }
    }
    return /[฀-๿]/.test(out);
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

  // ---------- ตัวช่วยเดาคำที่ผู้เรียนตั้งใจจะพิมพ์ (สำหรับคำสะกดผิด) ----------

  /*
   * ระยะการสะกด — ใช้แบบรองรับการสลับตัวอักษรติดกัน (Damerau/OSA)
   * เพราะการพิมพ์ผิดยอดฮิตของมือใหม่คือสลับตัวติดกัน: pritn, esle, whlie, fro
   * ซึ่งควรนับเป็นระยะ 1 (Levenshtein ธรรมดาจะนับเป็น 2 แล้วเดาไม่เจอ)
   */
  function editDistance(a, b) {
    var m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    var d = [];
    for (var i = 0; i <= m; i++) { d[i] = [i]; }
    for (var j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        // ตัวอักษรติดกันสลับตำแหน่ง = ระยะ 1
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[m][n];
  }

  // คำสั่งพื้นฐานที่หลักสูตรใช้ + คีย์เวิร์ดหัวบล็อก
  var KNOWN_BUILTINS = ['print', 'input', 'int', 'float', 'str', 'len', 'range', 'list'];
  var KEYWORDS = ['if', 'elif', 'else', 'for', 'while', 'def', 'return'];

  // method ที่แต่ละชนิดข้อมูลมีจริง — ใช้เดาว่าผู้เรียนสะกดผิดหรือใช้ผิดชนิด
  var TYPE_METHODS = {
    list: ['append', 'insert', 'remove', 'pop', 'sort', 'reverse', 'count', 'index', 'clear', 'extend'],
    str: ['upper', 'lower', 'strip', 'split', 'replace', 'find', 'format', 'count', 'startswith', 'endswith', 'join'],
    dict: ['get', 'keys', 'values', 'items', 'pop'],
    random: ['randint', 'choice', 'random', 'shuffle', 'uniform'],
    math: ['sqrt', 'floor', 'ceil', 'pow', 'fabs', 'pi']
  };

  /*
   * เดาว่าชื่อที่ไม่รู้จักนี้ ผู้เรียนตั้งใจพิมพ์คำไหน
   * เทียบกับ: คำสั่งพื้นฐาน + ตัวแปร/ฟังก์ชันที่ผู้เรียนสร้างไว้เองในโค้ด
   * เกณฑ์: ตัวพิมพ์ใหญ่-เล็กต่างกันเฉย ๆ = เดาได้เสมอ / สะกดเพี้ยน 1 ตัว (คำยาว 3+)
   * หรือเพี้ยน 2 ตัว (คำยาว 5+) — คำสั้นมากไม่เดา กันเดามั่ว
   */
  function suggestWord(name, code) {
    var candidates = KNOWN_BUILTINS.slice();
    var re = /^\s*([A-Za-z_]\w*)\s*=/gm;
    var m;
    while ((m = re.exec(code || '')) !== null) candidates.push(m[1]);
    re = /def\s+([A-Za-z_]\w*)/g;
    while ((m = re.exec(code || '')) !== null) candidates.push(m[1]);

    var best = null;
    var bestScore = 99;
    for (var i = 0; i < candidates.length; i++) {
      var cand = candidates[i];
      if (cand === name) continue;
      var score;
      if (cand.toLowerCase() === name.toLowerCase()) {
        score = 0; // ต่างแค่ตัวพิมพ์ใหญ่-เล็ก
      } else {
        var d = editDistance(name.toLowerCase(), cand.toLowerCase());
        var minLen = Math.min(name.length, cand.length);
        if (d === 1 && minLen >= 3) score = 1;
        else if (d === 2 && minLen >= 5) score = 2;
        else continue;
      }
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    return best;
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
      // 1.5) กรณีที่ Skulpt บอกสาเหตุมาตรง ๆ ในข้อความดิบ
      if (/'return' outside function/i.test(raw)) {
        return {
          what: 'มี return อยู่นอกฟังก์ชัน — return คือการส่งค่ากลับ "ออกจากฟังก์ชัน" เลยต้องอยู่ข้างในฟังก์ชันเท่านั้น',
          how: 'เช็คว่าบรรทัด return ย่อหน้าอยู่ใต้ def แล้วหรือยัง ถ้าแค่อยากแสดงผลเฉย ๆ ใช้ print() แทน'
        };
      }
      if (/'break' outside loop/i.test(raw)) {
        return {
          what: 'มี break อยู่นอกลูป — break คือคำสั่ง "หยุดลูปทันที" เลยใช้ได้เฉพาะข้างใน for หรือ while',
          how: 'เช็คว่าบรรทัด break ย่อหน้าอยู่ในลูปแล้วหรือยัง'
        };
      }
      if (/f-string/i.test(raw)) {
        return {
          what: 'วงเล็บปีกกา { } ใน f-string ยังเปิด-ปิดไม่ครบคู่',
          how: "เช็คว่าชื่อตัวแปรทุกตัวใน f-string ถูกครอบด้วยปีกกาครบทั้งเปิดและปิด เช่น f'สวัสดี {name}'"
        };
      }
      // 2) มีตัวอักษรไทยหลุดอยู่นอกเครื่องหมายคำพูด
      //    (เผลอพิมพ์คำสั่งตอนแป้นยังเป็นไทย หรือลืมครอบข้อความด้วยเครื่องหมายคำพูด)
      if (thaiOutsideStrings(code)) {
        return {
          what: 'มีตัวอักษรภาษาไทยอยู่นอกเครื่องหมายคำพูด ซึ่ง Python จะอ่านไม่เข้าใจ',
          how: "ถ้าตั้งใจให้เป็นข้อความ ให้ครอบด้วยเครื่องหมายคำพูด เช่น print('สวัสดี') " +
               'แต่ถ้าเผลอพิมพ์ตอนแป้นพิมพ์ยังเป็นภาษาไทย ให้สลับแป้นเป็นภาษาอังกฤษก่อน ' +
               '(กดปุ่ม ~ หรือ Alt+Shift) แล้วพิมพ์คำสั่งนั้นใหม่'
        };
      }
      // 2.5) เขียน print แบบ Python 2 (ไม่มีวงเล็บ) — มักติดมาจากติวเตอร์/หนังสือรุ่นเก่า
      if (/^print\b\s*[^(\s=]/.test(line.trim())) {
        return {
          what: 'print แบบไม่มีวงเล็บเป็นวิธีเขียนของ Python รุ่นเก่า (Python 2) ซึ่งใช้ที่นี่ไม่ได้',
          how: "Python 3 ต้องมีวงเล็บครอบเสมอ: print('ข้อความ') — ถ้าดูตามคลิปหรือหนังสือ เช็คว่าเป็นเนื้อหา Python 3 นะ"
        };
      }
      // 2.7) def ไม่มีวงเล็บหลังชื่อฟังก์ชัน
      if (/^def\s+[A-Za-z_]\w*\s*:/.test(line.trim())) {
        return {
          what: 'บรรทัด def ขาดวงเล็บหลังชื่อฟังก์ชัน — Python ต้องมีวงเล็บเสมอแม้ไม่มีช่องรับค่า',
          how: 'เติมวงเล็บก่อนเครื่องหมาย : เช่น def greet(): หรือถ้ามีช่องรับค่า def greet(name):'
        };
      }
      // 2.8) เอาคำสั่งของ Python มาตั้งเป็นชื่อตัวแปร เช่น for = 5
      var kwAssign = /^(if|elif|else|for|while|def|return)\s*=[^=]/.exec(line.trim());
      if (kwAssign) {
        return {
          what: "คำว่า '" + kwAssign[1] + "' เป็นคำสั่งของ Python เอามาตั้งเป็นชื่อตัวแปรไม่ได้",
          how: 'เปลี่ยนไปใช้ชื่ออื่นที่สื่อความหมาย เช่น count, total, score'
        };
      }
      // 3) เขียนเงื่อนไขตามหลัง else (else ไม่รับเงื่อนไข — พลาดบ่อยตอนเรียน if/else ใหม่ ๆ)
      if (/^else\s+\S/.test(line.trim())) {
        return {
          what: 'else ไม่ต้องมีเงื่อนไขตามหลัง เพราะมันแปลว่า "กรณีที่เหลือทั้งหมด" อยู่แล้ว',
          how: 'เขียนแค่ else: เฉย ๆ แล้วขึ้นบรรทัดใหม่ย่อหน้า — แต่ถ้าอยากใส่เงื่อนไขเพิ่ม ให้ใช้ elif เงื่อนไข: แทน'
        };
      }
      // 3.3) วาง elif ไว้หลัง else (else ต้องเป็นทางเลือกสุดท้ายเสมอ)
      //      สแกนขึ้นไปหา else: ด้านบน — ถ้าเจอ if ก่อนแปลว่าลำดับปกติ หยุดหา
      if (/^elif\b/.test(line.trim()) && lineNo) {
        var above = String(code || '').split('\n').slice(0, lineNo - 1);
        for (var ai = above.length - 1; ai >= 0; ai--) {
          if (/^\s*else\s*:/.test(above[ai])) {
            return {
              what: 'มี elif มาอยู่หลัง else — Python เช็คเงื่อนไขจากบนลงล่าง ดังนั้น else ต้องเป็นทางเลือก "สุดท้าย" เสมอ',
              how: 'ย้ายบล็อก elif ขึ้นไปไว้ก่อน else ให้เรียงเป็น if → elif → else'
            };
          }
          if (/^\s*if\b/.test(above[ai])) break;
        }
      }
      // 3.5) คำสั่งหัวบรรทัดสะกดผิด เช่น esle, whlie, fro
      var firstWord = (line.trim().match(/^([A-Za-z_]+)/) || [])[1];
      if (firstWord && KEYWORDS.indexOf(firstWord) === -1 && KNOWN_BUILTINS.indexOf(firstWord) === -1) {
        for (var kw = 0; kw < KEYWORDS.length; kw++) {
          if (firstWord.length >= 3 && editDistance(firstWord.toLowerCase(), KEYWORDS[kw]) === 1) {
            return {
              what: "Python อ่านคำว่า '" + firstWord + "' ไม่ออก — สะกดใกล้เคียงกับคำสั่ง '" + KEYWORDS[kw] + "' มากเลย",
              how: "ลองแก้เป็น " + KEYWORDS[kw] + " ดู (คำสั่งของ Python ต้องสะกดเป๊ะทุกตัวอักษร)"
            };
          }
        }
      }
      // 4) ใช้ = ตัวเดียวในเงื่อนไข (ตั้งใจจะเปรียบเทียบแต่กลายเป็นเก็บค่า)
      if (assignmentInCondition(line)) {
        return {
          what: 'ในบรรทัดเงื่อนไขมีเครื่องหมาย = ตัวเดียว ซึ่งแปลว่า "เก็บค่า" — แต่การเปรียบเทียบว่าเท่ากันไหมต้องใช้ == (สองตัวติดกัน)',
          how: 'เปลี่ยน = ในเงื่อนไขให้เป็น == เช่น if x == 5: (ส่วน = ตัวเดียวเอาไว้ใช้ตอนสร้างตัวแปร)'
        };
      }
      // 4) ลืมใส่ : ท้ายบรรทัดหัวบล็อก
      if (missingColon(line)) {
        return {
          what: 'บรรทัดนี้ขึ้นต้นด้วยคำสั่งอย่าง if / for / while / def ซึ่ง Python ต้องการเครื่องหมายพิเศษปิดท้าย',
          how: 'ลองดูท้ายบรรทัดว่าลืมเครื่องหมาย : (โคลอน) หรือเปล่า'
        };
      }
      // 5) บรรทัดก่อนหน้าเปิดบล็อกด้วย : แล้ว แต่บรรทัดนี้ไม่ได้ย่อหน้า
      if (missingIndentAfterColon(code, lineNo)) {
        return {
          what: 'บรรทัดก่อนหน้าจบด้วยเครื่องหมาย : แปลว่าบรรทัดถัดมาต้องย่อหน้าเข้าไปเป็นลูกของมัน',
          how: 'เพิ่มการย่อหน้า 4 ช่องว่างหน้าบรรทัดที่อยู่ใน if / for / while / def นั้น'
        };
      }
      // 6) วงเล็บเหลี่ยมของลิสต์ไม่ครบคู่
      if (unbalancedBrackets(code)) {
        return {
          what: 'วงเล็บเหลี่ยม [ กับ ] ในโค้ดมีจำนวนไม่เท่ากัน (มักเกิดตอนสร้างหรือเรียกใช้ลิสต์)',
          how: 'ไล่ดูบรรทัดที่มีลิสต์ว่าเปิด [ แล้วปิด ] ครบทุกอันไหม'
        };
      }
      // 7) วงเล็บเปิด-ปิดไม่ครบคู่ (Skulpt มักรายงานว่า EOF in multi-line statement)
      if (unbalancedParens(code) || /EOF in multi-line/i.test(raw)) {
        return {
          what: 'วงเล็บเปิดกับวงเล็บปิดในโค้ดมีจำนวนไม่เท่ากัน',
          how: 'ไล่ดูทีละบรรทัดว่าวงเล็บ ( กับ ) จับคู่กันครบทุกอันไหม โดยเฉพาะท้ายคำสั่ง print(...)'
        };
      }
      // 8) ลิสต์ที่ลืมจุลภาคคั่นตัวเลข เช่น [1 2 3] (เช็คท้าย ๆ เพราะรูปแบบกำกวมกว่าแบบอื่น)
      if (/\[[^\]]*\d\s+['"\d]/.test(line)) {
        return {
          what: 'สมาชิกในลิสต์ยังไม่ได้คั่นด้วยจุลภาค — Python เลยอ่านไม่ออกว่ามีกี่ชิ้น',
          how: 'ใส่เครื่องหมาย , คั่นระหว่างสมาชิกทุกตัว เช่น [1, 2, 3]'
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

    NameError: function (raw, lineNo, code) {
      var name = extractName(raw);
      if (name) {
        // ลองเดาว่าตั้งใจพิมพ์คำไหน (เช่น pritn → print, PRINT → print)
        var guess = suggestWord(name, code);
        return {
          what: "Python ไม่รู้จักชื่อ '" + name + "' — อาจยังไม่ได้สร้างตัวแปรนี้ หรือสะกดไม่ตรงกับตอนที่สร้างไว้",
          how: guess
            ? "สะกดใกล้เคียงกับ '" + guess + "' มากเลย — ตั้งใจพิมพ์คำนั้นหรือเปล่า? (ตัวพิมพ์เล็ก-ใหญ่ก็มีผลนะ)"
            : 'เช็คว่าสร้างตัวแปรชื่อนี้ก่อนใช้งานแล้วหรือยัง และตัวสะกดตรงกันทุกตัวอักษรไหม (ตัวพิมพ์เล็ก-ใหญ่มีผลนะ)'
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
      // for วนกับตัวเลขเดี่ยว ๆ เช่น for i in 5:
      var mIter = /'(int|float)' object is not iterable/.exec(raw);
      if (mIter) {
        return {
          what: 'for วนกับตัวเลขเดี่ยว ๆ ไม่ได้ — มันต้องการ "ชุดของ" ที่หยิบได้ทีละตัว',
          how: 'ถ้าอยากวนตามจำนวนครั้ง ใช้ range() ครอบ เช่น for i in range(5): หรือจะวนกับลิสต์ก็ได้'
        };
      }
      // len() กับของที่นับไม่ได้ เช่น len(5)
      if (/has no len\(\)/.test(raw)) {
        return {
          what: 'len() ใช้นับจำนวนของที่เป็น "ชุด" เช่น ลิสต์หรือข้อความ — ตัวเลขเดี่ยว ๆ ไม่มีอะไรให้นับ',
          how: 'เช็คว่าสิ่งที่ใส่ใน len() เป็นลิสต์หรือข้อความจริงไหม เช่น len(scores) หรือ len(name)'
        };
      }
      // เรียกตำแหน่งของข้อความด้วยสิ่งที่ไม่ใช่ตัวเลข เช่น s['a']
      if (/string indices must be integers/i.test(raw)) {
        return {
          what: 'ตำแหน่งของตัวอักษรในข้อความต้องเป็น "ตัวเลข" ไม่ใช่ข้อความ',
          how: 'ใช้เลขตำแหน่งในวงเล็บเหลี่ยม เช่น name[0] คือตัวอักษรแรก (เริ่มนับจาก 0)'
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
      // ลบของที่ไม่มีอยู่ในลิสต์
      if (/list\.remove/i.test(raw) || /not in list/i.test(raw)) {
        return {
          what: 'พยายามลบ (remove) ของที่ไม่มีอยู่ในลิสต์ — Python หาไม่เจอเลยหยุดทำงาน',
          how: 'เช็คว่าค่าที่จะลบสะกดตรงกับที่อยู่ในลิสต์เป๊ะ ๆ ไหม หรือเช็คก่อนด้วย if ค่า in ลิสต์:'
        };
      }
      // ค่านอกขอบเขตของฟังก์ชันคณิตศาสตร์ เช่น sqrt ของเลขติดลบ
      if (/math domain/i.test(raw)) {
        return {
          what: 'ค่าที่ส่งให้ฟังก์ชันคณิตศาสตร์อยู่นอกขอบเขตที่มันรับได้ เช่น หารากที่สองของเลขติดลบ',
          how: 'เช็คว่าค่าที่ส่งเข้าไปเป็นบวกหรืออยู่ในช่วงที่ฟังก์ชันนั้นรองรับ'
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

    AttributeError: function (raw) {
      // ดึงชนิดข้อมูล (หรือชื่อโมดูล) กับชื่อ method ที่เรียกไม่เจอ
      var m = /'(\w+)' object has no attribute '(\w+)'/.exec(raw) ||
              /module '(\w+)' has no attribute '(\w+)'/.exec(raw);
      if (m) {
        var typ = m[1];
        var attr = m[2];
        var isModule = raw.indexOf('module') !== -1;
        var typLabel = isModule ? 'โมดูล ' + typ : 'ข้อมูลชนิด ' + typ;

        // 1) method นี้มีจริงแต่เป็นของชนิดอื่น (ใช้ข้ามชนิด) เช่น เรียก .append กับข้อความ
        for (var owner in TYPE_METHODS) {
          if (owner !== typ && TYPE_METHODS[owner].indexOf(attr) !== -1) {
            if (typ === 'str' && owner === 'list') {
              return {
                what: 'ข้อความ (str) ไม่มีคำสั่ง .' + attr + ' — คำสั่งนี้เป็นของลิสต์',
                how: 'ถ้าอยากต่อข้อความ ใช้เครื่องหมาย + หรือ f-string แทน แต่ถ้าตั้งใจจะใช้ลิสต์ ต้องสร้างด้วยวงเล็บเหลี่ยม [ ] ก่อน'
              };
            }
            return {
              what: typLabel + ' ไม่มีคำสั่ง .' + attr + ' — คำสั่งนี้เป็นของ ' + owner,
              how: 'เช็คว่าตัวแปรที่เรียกใช้เก็บข้อมูลชนิดที่ตั้งใจไว้จริงหรือเปล่า'
            };
          }
        }

        // 2) น่าจะสะกด method ผิด — เดาจากรายการคำสั่งของชนิดตัวเอง
        var pool = TYPE_METHODS[typ] || [];
        for (var i = 0; i < pool.length; i++) {
          var d = editDistance(attr.toLowerCase(), pool[i].toLowerCase());
          var minLen = Math.min(attr.length, pool[i].length);
          if ((d === 1 && minLen >= 3) || (d === 2 && minLen >= 5)) {
            return {
              what: typLabel + ' ไม่มีคำสั่งชื่อ .' + attr,
              how: 'สะกดใกล้เคียงกับ .' + pool[i] + ' มากเลย — ตั้งใจพิมพ์คำนั้นหรือเปล่า?'
            };
          }
        }

        return {
          what: typLabel + ' ไม่มีคำสั่งชื่อ .' + attr,
          how: 'เช็คตัวสะกดของคำสั่งหลังจุด และดูว่าตัวแปรเก็บข้อมูลชนิดที่คิดไว้จริงไหม'
        };
      }
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
