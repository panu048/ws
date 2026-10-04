const express = require('express');
const router = express.Router();
const Menus = require('../models/menu');

// ดึงรายการเมนู (ทั้งหมด หรือ ตามหมวดหมู่)
router.get('/:filter', async (req, res) => {
    try {
        const { filter } = req.params;
        let menuItems;
        if (filter === 'all') {
            menuItems = await Menus.find();
        } else {
            menuItems = await Menus.find({ cat: filter });
        }
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// เพิ่มเมนูใหม่
router.post('/', async (req, res) => {
    try {
        const newMenuItem = new Menus(req.body);
        await newMenuItem.save();
        res.status(201).json(newMenuItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;