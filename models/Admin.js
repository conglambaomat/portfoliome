// models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    }
}, { timestamps: true }); // timestamps: true sẽ tự động thêm createdAt và updatedAt

// Middleware: Hash password trước khi lưu
AdminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) { // Chỉ hash nếu password được thay đổi (hoặc mới)
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10); // Tạo salt
        this.password = await bcrypt.hash(this.password, salt); // Hash password
        next();
    } catch (error) {
        next(error);
    }
});

// Method: So sánh password đã nhập với password đã hash trong DB
AdminSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('Admin', AdminSchema);
