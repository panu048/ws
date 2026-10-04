const mongoose = require('mongoose');

// รองรับข้อมูลผู้ใช้ได้ทั้งรูปแบบใหม่จาก MongoDB
// username / password และรูปแบบเดิม name / pwd
const userSchema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    name: { type: String },
    pwd: { type: String },
    type: { type: String, default: 'user' }
}, {
    collection: 'users',
    strict: true
});

module.exports = mongoose.model('users', userSchema);