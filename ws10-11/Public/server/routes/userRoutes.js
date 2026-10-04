const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const Users = require('../models/user');
const { requireSession, SESSION_COOKIE } = require('../middleware/auth');


function createSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// API: เข้าสู่ระบบ
router.post('/login', async (req, res) => {
  try {
    const { username, password, theme } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
      });
    }

    // รองรับข้อมูลใน MongoDB ทั้งแบบ
    // username/password และ name/pwd
    // trim เฉพาะ username เพื่อป้องกันช่องว่างติดมาจากช่อง Login
    const loginUsername = String(username).trim();

    let user = await Users.findOne({ username: loginUsername });

    // รองรับข้อมูลเก่าที่ใช้ name/pwd
    if (!user) {
      user = await Users.findOne({ name: loginUsername });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    const savedPassword = user.password ?? user.pwd;

    // ตรวจ Password ที่ Server เท่านั้น
    // ไม่ trim password เพราะช่องว่างอาจเป็นส่วนหนึ่งของรหัสผ่าน
    if (savedPassword === undefined || savedPassword === null || String(savedPassword) !== String(password)) {
      return res.status(401).json({
        success: false,
        message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // ถ้ามี session เก่า ให้ลบทิ้งก่อน
    const oldSessionId = req.cookies[SESSION_COOKIE];

    if (oldSessionId) {
      req.app.locals.sessions.delete(oldSessionId);
    }

    // สร้าง Session ใหม่
    const sessionId = createSessionId();

    const session = {
      userId: user._id.toString(),
      username: user.username || user.name,
      type: user.type || 'user',
      theme: theme || 'light',
      createdAt: Date.now(),
      expiresAt: Date.now() + req.app.locals.sessionMaxAge
    };

    req.app.locals.sessions.set(sessionId, session);

    // Cookie เก็บเฉพาะ Session ID
    // ข้อมูลผู้ใช้จริงเก็บอยู่ฝั่ง Server
    res.cookie(SESSION_COOKIE, sessionId, {
      maxAge: req.app.locals.sessionMaxAge,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    // Theme ไม่ใช่ข้อมูลลับ จึงเก็บแยกเป็น cookie ได้
    res.cookie('theme', theme || 'light', {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        username: session.username,
        type: session.type
      }
    });

  } catch (error) {
    console.error('Login Error:', error);

    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
  }
});

// API: ตรวจสอบ Session ปัจจุบัน
router.get('/info', (req, res) => {
  const sessionId = req.cookies[SESSION_COOKIE];

  if (!sessionId) {
    return res.json({
      isLoggedIn: false,
      username: null,
      theme: req.cookies.theme || 'light'
    });
  }

  const session = req.app.locals.sessions.get(sessionId);

  if (!session) {
    res.clearCookie(SESSION_COOKIE, { path: '/' });

    return res.json({
      isLoggedIn: false,
      username: null,
      theme: req.cookies.theme || 'light'
    });
  }

  // ต่ออายุ Session เมื่อมีการใช้งาน
  session.expiresAt = Date.now() + req.app.locals.sessionMaxAge;

  return res.json({
    isLoggedIn: true,
    username: session.username,
    type: session.type,
    theme: session.theme || req.cookies.theme || 'light'
  });
});

// API: เปลี่ยน Theme ของ Session ปัจจุบัน
router.patch('/theme', requireSession, (req, res) => {
  const { theme } = req.body || {};
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';

  req.session.theme = selectedTheme;
  res.cookie('theme', selectedTheme, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  return res.json({ success: true, theme: selectedTheme });
});

// API: ตัวอย่างตรวจสอบว่า Session ใช้งานได้หรือไม่
router.get('/check', requireSession, (req, res) => {
  res.json({
    success: true,
    loggedIn: true,
    user: {
      username: req.session.username,
      type: req.session.type
    }
  });
});

// API: ออกจากระบบ
router.post('/logout', (req, res) => {
  const sessionId = req.cookies[SESSION_COOKIE];

  if (sessionId) {
    req.app.locals.sessions.delete(sessionId);
  }

  // ลบ Session Cookie
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  // ลบ Theme Cookie
  res.clearCookie('theme', {
    path: '/'
  });

  return res.json({
    success: true,
    message: 'ออกจากระบบแล้ว'
  });
});

module.exports = router;