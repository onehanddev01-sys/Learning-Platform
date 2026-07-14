/*
 * auth.js — ปุ่มบัญชี/เข้าสู่ระบบบน topbar + ฟังสถานะ auth แล้วสั่งซิงก์
 *
 * เข้าสู่ระบบได้ 2 วิธี: บัญชี Google หรือ อีเมล/รหัสผ่าน (ไม่บังคับ)
 * ถ้า Firebase ไม่พร้อม (ออฟไลน์/โหลด SDK ไม่ได้) จะไม่แสดงปุ่มเลย และเว็บใช้งานได้ปกติ
 */
(function (global) {
  'use strict';

  var FB = global.FB || {};
  var slot = document.getElementById('account-slot');
  if (!slot || !FB.ready) return;

  // ไอคอนรูปคน (SVG) ประกอบปุ่มบัญชี — ไม่ใช้อีโมจิ
  var ICON_USER = '<svg class="account-ic" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  // แปลงรหัสข้อผิดพลาดของ Firebase เป็นข้อความภาษาไทยที่เป็นมิตร
  function thaiError(code) {
    var map = {
      'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'auth/user-not-found': 'ไม่พบบัญชีนี้ ลองสมัครสมาชิกก่อน',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน',
      'auth/weak-password': 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)',
      'auth/popup-closed-by-user': 'ปิดหน้าต่างเข้าสู่ระบบก่อนเสร็จ ลองใหม่ได้',
      'auth/popup-blocked': 'เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ ลองอนุญาต popup',
      'auth/network-request-failed': 'เชื่อมต่ออินเทอร์เน็ตไม่ได้',
      'auth/operation-not-allowed': 'ผู้ดูแลยังไม่ได้เปิดวิธีเข้าสู่ระบบนี้ใน Firebase'
    };
    return map[code] || ('เกิดข้อผิดพลาด (' + code + ')');
  }

  var overlay = null;
  function closeModal() { if (overlay) { overlay.remove(); overlay = null; } }

  function openModal() {
    var mode = 'signin'; // signin | signup
    overlay = el('<div class="win-overlay auth-overlay"></div>');
    overlay.innerHTML =
      '<div class="auth-card">' +
        '<button class="auth-x" type="button" aria-label="ปิด">&times;</button>' +
        '<h2 class="auth-title">เข้าสู่ระบบเพื่อบันทึกข้ามอุปกรณ์</h2>' +
        '<p class="auth-sub">ไม่บังคับ — เลือกได้ว่าจะเข้าสู่ระบบหรือไม่</p>' +
        '<div class="auth-modes">' +
          '<div class="auth-mode"><span class="auth-mode-tag auth-mode-in">เข้าสู่ระบบ</span> ความก้าวหน้าซิงก์ทุกเครื่อง เปลี่ยนไปใช้มือถือหรือคอมเครื่องอื่นก็เรียนต่อจากที่ค้างไว้ได้</div>' +
          '<div class="auth-mode"><span class="auth-mode-tag auth-mode-guest">ไม่เข้าสู่ระบบ</span> เรียนได้ครบทุกด่านเหมือนกัน แต่ความก้าวหน้าจะเก็บในเบราว์เซอร์นี้เครื่องเดียว (ปิดหน้าต่างนี้เพื่อเรียนต่อได้เลย)</div>' +
        '</div>' +
        '<button class="btn btn-ghost auth-google" type="button">เข้าสู่ระบบด้วยบัญชี Google</button>' +
        '<div class="auth-divider"><span>หรือใช้อีเมล</span></div>' +
        '<input class="auth-input auth-email" type="email" placeholder="อีเมล" autocomplete="email">' +
        '<input class="auth-input auth-pw" type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)" autocomplete="current-password">' +
        '<div class="auth-err"></div>' +
        '<button class="btn btn-primary auth-submit" type="button"></button>' +
        '<div class="auth-toggle"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var errEl = overlay.querySelector('.auth-err');
    var submit = overlay.querySelector('.auth-submit');
    var toggle = overlay.querySelector('.auth-toggle');

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector('.auth-x').addEventListener('click', closeModal);

    function renderMode() {
      submit.textContent = (mode === 'signin') ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
      toggle.innerHTML = (mode === 'signin')
        ? 'ยังไม่มีบัญชี? <button type="button" class="linklike">สมัครสมาชิก</button>'
        : 'มีบัญชีอยู่แล้ว? <button type="button" class="linklike">เข้าสู่ระบบ</button>';
      toggle.querySelector('button').addEventListener('click', function () {
        mode = (mode === 'signin') ? 'signup' : 'signin';
        errEl.textContent = '';
        renderMode();
      });
    }
    renderMode();

    overlay.querySelector('.auth-google').addEventListener('click', function () {
      errEl.textContent = '';
      var provider = new firebase.auth.GoogleAuthProvider();
      FB.auth.signInWithPopup(provider)
        .then(closeModal)
        .catch(function (e) { errEl.textContent = thaiError(e.code); });
    });

    submit.addEventListener('click', function () {
      errEl.textContent = '';
      var email = overlay.querySelector('.auth-email').value.trim();
      var pw = overlay.querySelector('.auth-pw').value;
      if (!email || !pw) { errEl.textContent = 'กรอกอีเมลและรหัสผ่านให้ครบ'; return; }
      submit.disabled = true;
      var action = (mode === 'signin')
        ? FB.auth.signInWithEmailAndPassword(email, pw)
        : FB.auth.createUserWithEmailAndPassword(email, pw);
      action.then(closeModal).catch(function (e) {
        errEl.textContent = thaiError(e.code);
        submit.disabled = false;
      });
    });
  }

  // ---------- เรนเดอร์ปุ่มบัญชีบน topbar ----------

  function renderAccount(user) {
    slot.innerHTML = '';
    var menu = null;

    if (user) {
      var name = user.displayName || (user.email ? user.email.split('@')[0] : 'บัญชีของฉัน');
      var btn = el('<button class="account-btn" type="button" title="บัญชีของคุณ">' + ICON_USER + '<span class="account-btn-label"></span></button>');
      btn.querySelector('.account-btn-label').textContent = name;
      btn.addEventListener('click', function () {
        if (menu) { menu.remove(); menu = null; return; }
        menu = el(
          '<div class="account-menu">' +
            '<div class="account-menu-info">ซิงก์ความก้าวหน้าแล้ว</div>' +
            '<button type="button" class="account-signout">ออกจากระบบ</button>' +
          '</div>');
        slot.appendChild(menu);
        menu.querySelector('.account-signout').addEventListener('click', function () {
          FB.auth.signOut();
          if (menu) { menu.remove(); menu = null; }
        });
      });
      document.addEventListener('click', function (e) {
        if (menu && !slot.contains(e.target)) { menu.remove(); menu = null; }
      });
      slot.appendChild(btn);
    } else {
      var login = el('<button class="account-btn account-btn-login" type="button">' + ICON_USER + '<span class="account-btn-label">เข้าสู่ระบบ</span></button>');
      login.addEventListener('click', openModal);
      slot.appendChild(login);
    }
  }

  // ฟังสถานะ auth: เข้าสู่ระบบครั้งแรก/กลับเข้ามาใหม่ -> ซิงก์ แล้ว reload ถ้าข้อมูลเปลี่ยน
  FB.auth.onAuthStateChanged(function (user) {
    renderAccount(user);
    if (user && global.Sync) {
      global.Sync.syncOnLogin(user, function (changed) {
        if (changed) location.reload();
      });
    }
  });
})(window);
