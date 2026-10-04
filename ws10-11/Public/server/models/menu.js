const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: String,
    cat: { type: String, required: true }
});

module.exports = mongoose.model('menus', menuSchema);