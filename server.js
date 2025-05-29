// server.js
require('dotenv').config(); // Load biến môi trường từ .env
const express = require('express');
const bodyParser = require('body-parser'); // Hoặc express.json() và express.urlencoded()
const session = require('express-session');
const mongoose = require('mongoose'); // Thêm Mongoose

// Import Models
const Admin = require('./models/Admin');
const ContactMessage = require('./models/ContactMessage');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Kết nối MongoDB ----
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connected Successfully!'))
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.log('Server will continue to run without database functionality.');

    // Tạo một mock database để server vẫn chạy được
    global.mockDB = {
        messages: [],
        users: [], // Mảng lưu trữ người dùng đăng ký mới
        admin: {
            username: 'admin@gmail.com',
            password: 'password123',
            comparePassword: async (candidatePassword) => {
                return candidatePassword === 'password123';
            }
        }
    };
});

// Middleware
app.use(bodyParser.json()); // Cho phép server đọc JSON từ request body
app.use(bodyParser.urlencoded({ extended: true })); // Cho phép server đọc data từ form (URL-encoded)

// Cấu hình session
app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecretkey', // Sử dụng secret từ .env
    resave: false,
    saveUninitialized: false, // Chỉ lưu session khi có dữ liệu
    cookie: {
        secure: false, // Đảm bảo luôn là false trên localhost (HTTP)
        httpOnly: true, // Ngăn JavaScript truy cập cookie
        maxAge: 24 * 60 * 60 * 1000 // Thời gian sống 24 giờ
    }
}));

// Serve các file tĩnh từ thư mục 'public'
app.use(express.static('public'));

// Không cần dữ liệu giả lập nữa vì đã sử dụng MongoDB

// Middleware kiểm tra đăng nhập cho các route admin
function requireLogin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        // Nếu chưa đăng nhập, có thể redirect về trang login hoặc trả lỗi
        // return res.redirect('/'); // Hoặc trang login riêng
        return res.status(401).json({ message: 'Unauthorized. Please login.' });
    }
}

// ---- API Endpoints ----

// API xử lý login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; // Giả sử form login gửi email/password

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    console.log('Login attempt:', { email, password: '***' });

    try {
        // Kiểm tra xem có đang sử dụng mock database không
        if (global.mockDB) {
            // Sử dụng mock database
            // Kiểm tra xem có phải admin không
            if (email === global.mockDB.admin.username) {
                const isMatch = await global.mockDB.admin.comparePassword(password);
                if (!isMatch) {
                    console.log('Login failed - password mismatch (mock) for admin:', email);
                    return res.status(401).json({ success: false, message: 'Invalid credentials' });
                }

                // Thiết lập session cho admin
                req.session.isAdmin = true;
                req.session.adminId = 'mock-admin-id';
                req.session.user = { email: email, role: 'admin' };

                console.log('Login successful (mock) for admin:', email);
                console.log('Session:', req.session);

                return res.json({ success: true, message: 'Login successful' });
            }

            // Kiểm tra trong danh sách người dùng đã đăng ký
            const user = global.mockDB.users.find(user => user.username === email);
            if (!user) {
                console.log('Login failed - user not found (mock):', email);
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                console.log('Login failed - password mismatch (mock) for user:', email);
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Thiết lập session cho người dùng thường
            req.session.isUser = true;
            req.session.userId = user._id;
            req.session.user = { email: email, name: user.name, role: 'user' };

            console.log('Login successful (mock) for user:', email);
            console.log('Session:', req.session);

            return res.json({ success: true, message: 'Login successful' });
        }

        // Sử dụng MongoDB
        const admin = await Admin.findOne({ username: email }); // Tìm admin bằng username
        if (!admin) {
            console.log('Login failed - user not found:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password); // So sánh password
        if (!isMatch) {
            console.log('Login failed - password mismatch for:', email);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Thiết lập session cho admin
        req.session.isAdmin = true;
        req.session.adminId = admin._id; // Lưu ID admin vào session
        req.session.user = { email: email, role: 'admin' };

        console.log('Login successful for:', email);
        console.log('Session:', req.session);

        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// API xử lý logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid'); // Tên cookie mặc định của express-session
        res.json({ success: true, message: 'Logout successful' });
    });
});

// API xử lý đăng ký
app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and password are required.'
        });
    }

    try {
        // Kiểm tra xem có đang sử dụng mock database không
        if (global.mockDB) {
            // Kiểm tra xem email đã tồn tại chưa
            if (email === global.mockDB.admin.username) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists. Please use a different email.'
                });
            }

            // Kiểm tra xem người dùng đã đăng ký trước đó chưa
            const existingUser = global.mockDB.users.find(user => user.username === email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists. Please use a different email.'
                });
            }

            // Tạo người dùng mới và lưu vào mockDB
            const newUser = {
                _id: Date.now().toString(),
                name,
                username: email,
                password: password,
                comparePassword: async (candidatePassword) => {
                    return candidatePassword === password;
                },
                createdAt: new Date().toISOString()
            };

            global.mockDB.users.push(newUser);
            console.log('New user registration (mock):', { name, email, password: '***' });

            return res.json({
                success: true,
                message: 'Registration successful! You can now login with your credentials.'
            });
        }

        // Sử dụng MongoDB
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await Admin.findOne({ username: email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists. Please use a different email.'
            });
        }

        // Tạo người dùng mới
        const newUser = new Admin({
            username: email,
            password: password // Password sẽ được hash tự động bởi middleware trong model
        });

        await newUser.save();
        console.log('New user registered:', { name, email, password: '***' });

        res.json({
            success: true,
            message: 'Registration successful! You can now login with your credentials.'
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (error.name === 'ValidationError') {
            // Xử lý lỗi validation từ Mongoose
            let errors = {};
            Object.keys(error.errors).forEach((key) => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});


// API nhận tin nhắn từ contact form
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    try {
        // Kiểm tra xem có đang sử dụng mock database không
        if (global.mockDB) {
            // Sử dụng mock database
            const newMessage = {
                _id: Date.now().toString(),
                name,
                email,
                subject,
                message,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            global.mockDB.messages.push(newMessage);
            console.log('New message saved to mock DB:', newMessage);
            return res.json({ success: true, message: 'Message received and saved successfully!' });
        }

        // Sử dụng MongoDB
        const newMessage = new ContactMessage({
            name,
            email,
            subject,
            message
        });

        await newMessage.save(); // Lưu vào MongoDB
        console.log('New message saved to DB:', newMessage);
        res.json({ success: true, message: 'Message received and saved successfully!' });
    } catch (error) {
        console.error('Error saving contact message:', error);

        if (error.name === 'ValidationError') {
            // Xử lý lỗi validation từ Mongoose
            let errors = {};
            Object.keys(error.errors).forEach((key) => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }

        res.status(500).json({ success: false, message: 'Server error while saving message' });
    }
});

// API lấy danh sách tin nhắn (chỉ cho admin)
app.get('/api/messages', requireLogin, async (_req, res) => {
    try {
        // Chỉ trả về dữ liệu gốc từ MongoDB, không xử lý gì thêm
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages from DB:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching messages' });
    }
});

// ---- Route cho trang Admin ----
// Serve trang admin.html (cần được bảo vệ)
app.get('/admin', requireLogin, (_req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});


// Middleware xử lý lỗi 404
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.url
    });
});

// Middleware xử lý lỗi chung
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
