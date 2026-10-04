require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// =========================
// Middleware
// =========================
app.use(cookieParser());

// ถ้า Frontend รันคนละ port กับ Server ให้ส่ง cookie ข้าม origin ได้
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// =========================
// Session แบบ Server-side
// =========================
// session จะถูกเก็บไว้ใน RAM ของ Server
// Cookie ที่ส่งให้ Browser จะเก็บแค่ session ID
const sessions = new Map();

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
const SESSION_COOKIE = 'sid';

app.use((req, res, next) => {
    const sid = req.cookies[SESSION_COOKIE];

    req.sessionID = sid || null;
    req.session = sid ? sessions.get(sid) || null : null;

    next();
});

// ลบ session ที่หมดอายุเป็นระยะ
setInterval(() => {
    const now = Date.now();

    for (const [sid, session] of sessions.entries()) {
        if (session.expiresAt <= now) {
            sessions.delete(sid);
        }
    }
}, 60 * 60 * 1000);

// ทำให้ routes สามารถสร้าง session ได้
app.locals.sessions = sessions;
app.locals.sessionMaxAge = SESSION_MAX_AGE;
app.locals.sessionCookieName = SESSION_COOKIE;

// =========================
// Static files
// =========================
app.use(express.static(path.join(__dirname, '../public')));

// =========================
// Database Connection
// =========================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// =========================
// Route หน้าแรก
// =========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

// =========================
// API Routes
// =========================
app.use('/api/menu', menuRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
