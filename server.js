const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // CHANGE THIS TO A STRONG, RANDOM KEY IN PRODUCTION!

// In-memory user store (REPLACE WITH A DATABASE IN A REAL APPLICATION)
const users = [];

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Authentication Routes ---

// User Registration Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (users.find(u => u.username === username)) {
        return res.status(409).json({ message: 'Username already taken.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: users.length + 1, username, password: hashedPassword };
        users.push(newUser);
        console.log('New user registered:', username);
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// User Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // User authenticated, create a JWT
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Server sending login response: { token: "...", username:', user.username, '}');
        res.status(200).json({ message: 'Logged in successfully!', token, username: user.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Serve login.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve chat page at /chat
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Socket.io Authentication Middleware ---
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Authentication error: Invalid token.'));
        }
        socket.user = decoded;
        next();
    });
});

// --- Socket.io Connection (only for authenticated users) ---
io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected [ID: ${socket.id}]`);

    socket.emit('chat message', { user: 'Admin', text: `Welcome, ${socket.user.username}! You are now connected.` });
    socket.broadcast.emit('chat message', { user: 'Admin', text: `${socket.user.username} has joined the chat.` });

    socket.on('disconnect', () => {
        if (socket.user) {
            console.log(`User ${socket.user.username} disconnected [ID: ${socket.id}]`);
            io.emit('chat message', { user: 'Admin', text: `${socket.user.username} has left the chat.` });
        } else {
            console.log('A non-authenticated user disconnected.');
        }
    });

    socket.on('chat message', (msg) => {
        if (socket.user) {
            console.log(`${socket.user.username}: ${msg}`);
            io.emit('chat message', { user: socket.user.username, text: msg });
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});