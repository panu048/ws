const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [
        {
            menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menus' },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            type: { type: String }
        }
    ],
    totalPrice: { type: Number, required: true },
    totalCount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('orders', orderSchema);