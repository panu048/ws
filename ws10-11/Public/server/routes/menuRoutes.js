const express = require('express');
const router = express.Router();
const Menus = require('../models/menu');
const { requireSession, requireAdmin } = require('../middleware/auth');

// ดึงรายการเมนู: ผู้ใช้ที่ Login แล้วดูได้
router.get('/:filter', requireSession, async (req, res) => {
    try {
        const { filter } = req.params;
        const menuItems = filter === 'all'
            ? await Menus.find()
            : await Menus.find({ cat: filter });
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// เพิ่มเมนู: Admin เท่านั้น
router.post('/', requireSession, requireAdmin, async (req, res) => {
    try {
        const newMenuItem = new Menus(req.body);
        await newMenuItem.save();
        res.status(201).json(newMenuItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ลบเมนู: Admin เท่านั้น
router.delete('/:id', requireSession, requireAdmin, async (req, res) => {
    try {
        const deletedMenuItem = await Menus.findByIdAndDelete(req.params.id);
        if (!deletedMenuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted', deletedMenuItem });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// แก้ไขเมนู: Admin เท่านั้น
router.patch('/:id', requireSession, requireAdmin, async (req, res) => {
    try {
        const updatedMenuItem = await Menus.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedMenuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(updatedMenuItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;