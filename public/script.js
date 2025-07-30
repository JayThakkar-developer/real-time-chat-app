// Check for token and username before attempting to connect
const token = localStorage.getItem('token');
const currentUsername = localStorage.getItem('username');

if (!token || !currentUsername || currentUsername === "null" || currentUsername === "") {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/';
}

// Initialize Socket.io connection with the token
// The token is sent in the 'auth' object during the handshake
const socket = io({
    auth: {
        token: token
    }
});

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');
const logoutButton = document.getElementById('logout-button'); // Get logout button

// Add username display at the top
const welcomeHeader = document.createElement('h2');
welcomeHeader.textContent = `Welcome, ${currentUsername}!`; // <--- THIS LINE USES THE RETRIEVED USERNAME
document.body.insertBefore(welcomeHeader, document.getElementById('messages'));

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

// Handle incoming chat messages
socket.on('chat message', (data) => {
    const item = document.createElement('li');
    // Display message with username
    item.textContent = `${data.user}: ${data.text}`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

// Handle connection errors (e.g., invalid token)
socket.on('connect_error', (err) => {
    console.error("Socket connection error:", err.message);
    if (err.message.includes('Authentication error')) {
        alert("Authentication failed. Please log in again.");
        localStorage.removeItem('token'); // Clear invalid token
        localStorage.removeItem('username');
        window.location.href = '/'; // Redirect to login
    }
});

// Add a logout button and functionality
if (!logoutButton) { // Prevent creating multiple buttons if script runs twice
    const newLogoutButton = document.createElement('button');
    newLogoutButton.id = 'logout-button';
    newLogoutButton.textContent = 'Logout';
    newLogoutButton.style.position = 'absolute';
    newLogoutButton.style.top = '10px';
    newLogoutButton.style.right = '10px';
    newLogoutButton.style.padding = '8px 15px';
    newLogoutButton.style.backgroundColor = '#dc3545';
    newLogoutButton.style.color = 'white';
    newLogoutButton.style.border = 'none';
    newLogoutButton.style.borderRadius = '5px';
    newLogoutButton.style.cursor = 'pointer';
    document.body.insertBefore(newLogoutButton, messages); // Or append to a specific div

    newLogoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        socket.disconnect(); // Disconnect socket
        window.location.href = '/'; // Redirect to login page
    });
}