console.log("auth.js loaded");

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authButton = document.getElementById('auth-button');
const authTitle = document.getElementById('auth-title');
const authMessage = document.getElementById('auth-message');
const toggleAuthLink = document.getElementById('toggle-auth');

let isLoginMode = true; // State to track if we are in login or register mode

// Function to toggle between Login and Register views
toggleAuthLink.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'Login' : 'Register';
    authButton.textContent = isLoginMode ? 'Login' : 'Register';
    toggleAuthLink.textContent = isLoginMode ? 'Register' : 'Login';
    authMessage.textContent = ''; // Clear message on toggle
});

// Handle Login/Register button click
authButton.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        authMessage.textContent = 'Please enter both username and password.';
        return;
    }

    const endpoint = isLoginMode ? '/login' : '/register';
    const method = 'POST';

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            authMessage.style.color = 'green';
            authMessage.textContent = data.message;
            if (isLoginMode) {
                debugger;
                // Ensure these two lines are correct
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username); // <--- THIS LINE IS KEY
                window.location.href = '/chat'; // Redirect to chat page
                debugger;
            }
        } else {
            authMessage.style.color = 'red';
            authMessage.textContent = data.message || 'An error occurred.';
        }
    } catch (error) {
        console.error('Authentication error:', error);
        authMessage.style.color = 'red';
        authMessage.textContent = 'Network error. Please try again.';
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});