

const steps = document.querySelectorAll('.step');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        steps.forEach(step => {
            observer.observe(step);
        });

const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        
        // Check for saved theme preference or respect OS preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            body.classList.add(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-theme');
        }
        
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark-theme' : '');
        });
        
        // Header scroll effect
        const header = document.querySelector('.header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.98)';
            });
            
            button.addEventListener('mouseup', () => {
                button.style.transform = '';
            });
        });

document.addEventListener('DOMContentLoaded', function() {
            const chatDemo = document.querySelector('.chat-demo');
            
            // Parallax effect on mouse move
            document.addEventListener('mousemove', function(e) {
                const moveX = (e.clientX - window.innerWidth / 2) / 25;
                const moveY = (e.clientY - window.innerHeight / 2) / 25;
                
                chatDemo.style.transform = `rotate3d(0.2, 1, 0, 15deg) translateY(${moveY}px) translateX(${moveX}px)`;
            });
            
            // Animate stats counting
            const statValues = document.querySelectorAll('.stat-content h3');
            const duration = 2000;
            const interval = 20;
            
            statValues.forEach(stat => {
                const target = parseInt(stat.textContent);
                let current = 0;
                const increment = Math.ceil(target / (duration / interval));
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = target + '+';
                        clearInterval(timer);
                    } else {
                        stat.textContent = current + '+';
                    }
                }, interval);
            });
        });

document.addEventListener('DOMContentLoaded', function() {
    const createRoomBtn = document.getElementById('create-room');
    const joinRoomBtn = document.getElementById('join-room');
    const roomIdInput = document.getElementById('room-id');
    const usernameInput = document.getElementById('username');
    const connectionStatus = document.getElementById('connection-status');
    
    // Generate a random room ID
    function generateRoomId() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    
    // Validate username
    function validateUsername() {
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter your name');
            return false;
        }
        if (username.length < 2) {
            alert('Name should be at least 2 characters long');
            return false;
        }
        return true;
    }
    
    // Create a new room
    createRoomBtn.addEventListener('click', function() {
        if (!validateUsername()) return;
        
        const roomId = generateRoomId();
        const username = usernameInput.value.trim();
        window.location.href = `chat.html?room=${roomId}&user=${encodeURIComponent(username)}`;
    });
    
    // Join an existing room
    joinRoomBtn.addEventListener('click', function() {
        if (!validateUsername()) return;
        
        const roomId = roomIdInput.value.trim();
        const username = usernameInput.value.trim();
        if (roomId) {
            window.location.href = `chat.html?room=${roomId}&user=${encodeURIComponent(username)}`;
        } else {
            alert('Please enter a room ID');
        }
    });
    
    // Allow pressing Enter to join room
    roomIdInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            joinRoomBtn.click();
        }
    });
    
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (roomIdInput.value.trim()) {
                joinRoomBtn.click();
            } else {
                createRoomBtn.click();
            }
        }
    });
    
    // Check WebSocket connection status
    function updateConnectionStatus() {
        // Create a test WebSocket connection
        const testWs = new WebSocket('ws://https://chatapp-backend-zt0o.onrender.com');
        
        testWs.onopen = function() {
            connectionStatus.textContent = 'Connected to server';
            connectionStatus.classList.add('connected');
            connectionStatus.classList.remove('disconnected');
            testWs.close();
        };
        
        testWs.onerror = function() {
            connectionStatus.textContent = 'Disconnected from server';
            connectionStatus.classList.add('disconnected');
            connectionStatus.classList.remove('connected');
        };
    }
    
    updateConnectionStatus();
    // Check connection status every 5 seconds
    setInterval(updateConnectionStatus, 5000);
});