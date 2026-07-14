/*
 * firebase-config.js — ตั้งค่าและเริ่มต้น Firebase (compat build)
 *
 * หมายเหตุความปลอดภัย: ค่า config ของ Firebase Web (apiKey ฯลฯ) ไม่ใช่ความลับ
 * ออกแบบมาให้ฝังในฝั่งเบราว์เซอร์ได้ ความปลอดภัยจริงอยู่ที่ Firestore Security Rules
 *
 * ถ้าโหลด SDK ไม่สำเร็จ (เช่น เปิดออฟไลน์) จะไม่ทำให้เว็บพัง —
 * ระบบจะทำงานแบบ local-first ด้วย localStorage ต่อไปตามปกติ (ไม่มีปุ่มเข้าสู่ระบบ)
 */
(function (global) {
  'use strict';

  var config = {
    apiKey: "AIzaSyD6YmbExzbvsWwk3v_VhycpGDVEGqq5oQE",
    authDomain: "learning-platform-abc67.firebaseapp.com",
    projectId: "learning-platform-abc67",
    storageBucket: "learning-platform-abc67.firebasestorage.app",
    messagingSenderId: "526416533270",
    appId: "1:526416533270:web:496f43ba0175cdb9db6237"
  };

  // ตัวกลางที่ไฟล์อื่นใช้เช็คว่า Firebase พร้อมไหม
  global.FB = { ready: false, auth: null, db: null };

  if (typeof firebase === 'undefined' || !firebase.initializeApp) {
    return; // SDK โหลดไม่ได้ — โหมด local-first ทำงานต่อได้
  }

  try {
    firebase.initializeApp(config);
    global.FB.auth = firebase.auth();
    global.FB.db = firebase.firestore();
    // ไม่เปิด offline cache ของ Firestore เพราะระบบใช้ localStorage เป็นที่เก็บหลักอยู่แล้ว
    // (หลัก local-first) การซิงก์ cloud จึงทำเฉพาะตอนออนไลน์และเข้าสู่ระบบ
    global.FB.ready = true;
  } catch (e) {
    global.FB.ready = false;
  }
})(window);
