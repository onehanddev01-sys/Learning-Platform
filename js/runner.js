/*
 * runner.js — ตัวห่อ Skulpt สำหรับรันโค้ด Python ในเบราว์เซอร์
 * หน้าที่: รับโค้ด → รัน → คืนผลลัพธ์ {output, error, timedOut, truncated, interrupted}
 * ทุกไฟล์ในระบบเรียกใช้การรันโค้ดผ่านไฟล์นี้ที่เดียว
 */
(function (global) {
  'use strict';

  // เพดานจำนวนบรรทัด output กันเบราว์เซอร์ค้างเมื่อ loop พิมพ์เยอะมาก
  var OUTPUT_MAX_LINES = 2000;
  // เวลารันสูงสุด (มิลลิวินาที) กัน while วนไม่จบ
  var EXEC_LIMIT_MS = 3000;

  // ใช้บอกว่าผู้เรียนกดยกเลิกการรันเอง (ตอนโปรแกรมรอ input)
  var INTERRUPT_FLAG = '__PYLEARN_INTERRUPT__';

  // ให้ Skulpt อ่านไฟล์ stdlib ได้ (จำเป็นเวลา import โมดูลมาตรฐาน)
  function builtinRead(file) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles['files'][file] === undefined) {
      throw "File not found: '" + file + "'";
    }
    return Sk.builtinFiles['files'][file];
  }

  /*
   * รันโค้ด Python หนึ่งครั้ง
   * code           : โค้ดที่จะรัน (string)
   * opts.onOutput  : ฟังก์ชันรับข้อความ output สด ๆ ทีละส่วน (ไม่บังคับ)
   * opts.inputProvider : ฟังก์ชัน async รับ prompt แล้วคืนค่าที่ผู้ใช้พิมพ์ (ไม่บังคับ)
   * คืนค่า Promise ของ {output, error, timedOut, truncated, interrupted}
   */
  function run(code, opts) {
    opts = opts || {};
    var output = '';
    var lineCount = 0;
    var truncated = false;

    Sk.configure({
      output: function (text) {
        if (truncated) return; // เกินเพดานแล้ว ไม่เก็บเพิ่ม
        lineCount += (String(text).match(/\n/g) || []).length;
        output += text;
        if (opts.onOutput) opts.onOutput(text);
        if (lineCount > OUTPUT_MAX_LINES) {
          truncated = true;
          // โยนสัญญาณพิเศษเพื่อหยุดการรัน (ไม่ถือว่าเป็น Error ของผู้เรียน)
          throw new Error('__PYLEARN_OUTPUT_LIMIT__');
        }
      },
      read: builtinRead,
      __future__: Sk.python3, // โหมด Python 3
      inputfun: function (promptText) {
        var asked = promptText == null ? '' : String(promptText);
        var p = opts.inputProvider
          ? opts.inputProvider(asked)
          : Promise.resolve('');
        return Promise.resolve(p).then(function (value) {
          // รีเซ็ตนาฬิกาจับเวลา ไม่ให้เวลาที่ผู้เรียนใช้พิมพ์ถูกนับเป็นเวลารัน
          Sk.execStart = new Date();
          return value == null ? '' : String(value);
        });
      },
      inputfunTakesPrompt: true,
      execLimit: EXEC_LIMIT_MS,
      killableWhile: true,
      killableFor: true
    });

    return Sk.misceval
      .asyncToPromise(function () {
        return Sk.importMainWithBody('<stdin>', false, code, true);
      })
      .then(function () {
        return {
          output: output,
          error: null,
          timedOut: false,
          truncated: truncated,
          interrupted: false
        };
      })
      .catch(function (e) {
        // กรณีตัด output เพราะยาวเกินเพดาน — ไม่ใช่ความผิดของโค้ดผู้เรียน
        if (e && String(e.message || e).indexOf('__PYLEARN_OUTPUT_LIMIT__') !== -1) {
          return {
            output: output,
            error: null,
            timedOut: false,
            truncated: true,
            interrupted: false
          };
        }
        // กรณีผู้เรียนกดยกเลิกการรันเอง
        if (e && String(e.message || e).indexOf(INTERRUPT_FLAG) !== -1) {
          return {
            output: output,
            error: null,
            timedOut: false,
            truncated: truncated,
            interrupted: true
          };
        }
        // กรณีรันนานเกินกำหนด (มักเป็น while วนไม่จบ)
        var typeName = e && e.tp$name ? e.tp$name : '';
        if (typeName === 'TimeLimitError') {
          return {
            output: output,
            error: e,
            timedOut: true,
            truncated: truncated,
            interrupted: false
          };
        }
        // Error ปกติจาก Python (SyntaxError, NameError, TypeError ฯลฯ)
        return {
          output: output,
          error: e,
          timedOut: false,
          truncated: truncated,
          interrupted: false
        };
      });
  }

  /*
   * รันแบบป้อน input อัตโนมัติจากรายการที่เตรียมไว้ (ใช้ในหน้า test.html)
   * ถ้าโค้ดขอ input มากกว่าที่เตรียม จะได้ค่าว่างแทน (เหมือนกด Enter เปล่า)
   */
  function runForTest(code, inputs) {
    var queue = (inputs || []).slice();
    return run(code, {
      inputProvider: function () {
        return Promise.resolve(queue.length > 0 ? queue.shift() : '');
      }
    });
  }

  global.Runner = {
    run: run,
    runForTest: runForTest,
    OUTPUT_MAX_LINES: OUTPUT_MAX_LINES,
    EXEC_LIMIT_MS: EXEC_LIMIT_MS,
    INTERRUPT_FLAG: INTERRUPT_FLAG
  };
})(typeof window !== 'undefined' ? window : globalThis);
