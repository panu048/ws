const express = require('express');
const router = express.Router();
const Order = require('../models/order');

const SESSION_COOKIE = 'sid';

function requireLogin(req, res, next) {
    const sid = req.cookies[SESSION_COOKIE];
    const session = sid ? req.app.locals.sessions.get(sid) : null;

    if (!session) {
        return res.status(401).json({
            success: false,
            message: 'กรุณาเข้าสู่ระบบก่อน'
        });
    }

    if (session.expiresAt <= Date.now()) {
        req.app.locals.sessions.delete(sid);
        res.clearCookie(SESSION_COOKIE, { path: '/' });
        return res.status(401).json({
            success: false,
            message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่'
        });
    }

    session.expiresAt = Date.now() + req.app.locals.sessionMaxAge;
    req.session = session;
    next();
}

// บันทึกคำสั่งซื้อใหม่
router.post('/', requireLogin, async (req, res) => {
    try {
        const { items, totalPrice, totalCount } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'ไม่มีรายการสินค้าในตะกร้า' });
        }

        const newOrder = new Order({
            items,
            totalPrice,
            totalCount,
            username: req.session.username
        });

        await newOrder.save();
        res.status(201).json({ message: 'สั่งซื้อสำเร็จ', order: newOrder });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ดึงรายการสั่งซื้อทั้งหมด (สำหรับหน้า Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;