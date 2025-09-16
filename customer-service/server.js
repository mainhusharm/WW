require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { listenForEmails } = require('./services/emailService');
const { configureWebRTC } = require('./services/webrtcService');

const PORT = process.env.CS_API_PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database Connection with better error handling
const connectDB = async () => {
    try {
        if (process.env.CS_DB_CONNECTION) {
            await mongoose.connect(process.env.CS_DB_CONNECTION, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            console.log('Customer service database connected');
        } else {
            console.warn('CS_DB_CONNECTION not set, running without database');
        }
    } catch (err) {
        console.error('Database connection error:', err);
        // Don't exit the process, allow server to run without DB
    }
};

connectDB();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/customers', require('./routes/customers'));

// Database Dashboard Route - Main entry point
app.get('/database', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Customer Service Route - Alternative entry point
app.get('/customer-service', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Root route redirects to database dashboard
app.get('/', (req, res) => {
    res.redirect('/database');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('A user connected to the customer service dashboard');

    // Agent status
    socket.on('agentStatus', (data) => {
        socket.broadcast.emit('agentStatus', data);
    });

    // New chat notification
    socket.on('newChat', (data) => {
        io.emit('newChat', data);
    });

    // Live message delivery
    socket.on('sendMessage', (message) => {
        io.to(message.conversation_id).emit('receiveMessage', message);
    });

    // Typing indicators
    socket.on('typing', (data) => {
        socket.broadcast.to(data.conversation_id).emit('typing', data);
    });

    // Join conversation room
    socket.on('joinConversation', (conversation_id) => {
        socket.join(conversation_id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Customer service server running on port ${PORT}`);
    console.log(`Database dashboard available at: http://localhost:${PORT}/database`);
    console.log(`Customer service available at: http://localhost:${PORT}/customer-service`);
    listenForEmails();
    configureWebRTC(io);
});

module.exports = { io };
