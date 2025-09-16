// Add this to the top of your existing chat.js file

// Theme toggle functionality for chat page
document.addEventListener('DOMContentLoaded', function() {
    const chatThemeToggle = document.getElementById('chat-theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Get current theme from localStorage or system preference
    let currentTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply the theme
    function applyTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(theme + '-theme');
        localStorage.setItem('theme', theme);
        currentTheme = theme;
        
        // Update ARIA label for accessibility
        chatThemeToggle.setAttribute('aria-label', 
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    
    // Initialize theme
    applyTheme(currentTheme);
    
    // Toggle theme on button click
    chatThemeToggle.addEventListener('click', function() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
    
    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // Rest of your existing chat.js code follows here...
    // [The rest of your chat.js code remains unchanged]
});

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const voiceBtn = document.getElementById('voice-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const leaveRoomBtn = document.getElementById('leave-room');
    const currentRoomId = document.getElementById('current-room-id');
    const connectionStatus = document.getElementById('chat-connection-status');
    const typingIndicator = document.getElementById('typing-indicator');
    const previewContainer = document.getElementById('preview-container');
    const previewContent = document.querySelector('.preview-content');
    const cancelPreviewBtn = document.getElementById('cancel-preview');
    const sendPreviewBtn = document.getElementById('send-preview');
    const voiceRecorder = document.getElementById('voice-recorder');
    const cancelRecordingBtn = document.getElementById('cancel-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const recordingTimer = document.getElementById('recording-timer');
    
    // WebSocket and room variables
    let ws;
    let roomId;
    let currentUser;
    let mediaRecorder;
    let audioChunks = [];
    let recordingInterval;
    let recordingSeconds = 0;
    let typingTimer;
    
    // Initialize the chat
    function init() {
        // Get room ID and username from URL
        const urlParams = new URLSearchParams(window.location.search);
        roomId = urlParams.get('room');
        currentUser = decodeURIComponent(urlParams.get('user'));
        
        if (!roomId || !currentUser) {
            alert('Room ID and username are required');
            window.location.href = 'index.html';
            return;
        }
        
        currentRoomId.textContent = roomId;
        
        // Connect to WebSocket server
        connectWebSocket();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Connect to WebSocket server
    function connectWebSocket() {
        // In production, replace with your server URL
        ws = new WebSocket(`ws://localhost:3000?room=${roomId}&user=${encodeURIComponent(currentUser)}`);
        
        ws.onopen = function() {
            console.log('Connected to WebSocket server');
            connectionStatus.textContent = 'Connected';
            connectionStatus.classList.add('connected');
            connectionStatus.classList.remove('disconnected');
        };
        
        ws.onmessage = function(event) {
            const message = JSON.parse(event.data);
            handleMessage(message);
        };
        
        ws.onclose = function() {
            console.log('Disconnected from WebSocket server');
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.classList.remove('connected');
            connectionStatus.classList.add('disconnected');
            
            // Try to reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
            connectionStatus.textContent = 'Connection error';
            connectionStatus.classList.remove('connected');
            connectionStatus.classList.add('disconnected');
        };
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Send message on button click
        sendBtn.addEventListener('click', sendMessage);
        
        // Send message on Enter key
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Typing indicator
        messageInput.addEventListener('input', function() {
            // Send typing indicator
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'typing',
                    isTyping: true
                }));
                
                // Clear previous timer
                clearTimeout(typingTimer);
                
                // Set timer to stop typing indicator after 1 second
                typingTimer = setTimeout(function() {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'typing',
                            isTyping: false
                        }));
                    }
                }, 1000);
            }
        });
        
        // Attach file
        attachBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', handleFileSelect);
        
        // Voice recording
        voiceBtn.addEventListener('click', startRecording);
        cancelRecordingBtn.addEventListener('click', cancelRecording);
        stopRecordingBtn.addEventListener('click', stopRecording);
        
        // Emoji picker (simplified)
        emojiBtn.addEventListener('click', function() {
            // In a real implementation, this would show an emoji picker
            alert('Emoji picker would appear here');
        });
        
        // Preview controls
        cancelPreviewBtn.addEventListener('click', function() {
            previewContainer.classList.add('hidden');
            fileInput.value = '';
        });
        
        sendPreviewBtn.addEventListener('click', sendFileMessage);
        
        // Leave room with confirmation
        leaveRoomBtn.addEventListener('click', showLeaveConfirmation);
        
        // Allow closing with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                showLeaveConfirmation();
            }
        });
    }
    
    // Show leave confirmation dialog
    function showLeaveConfirmation() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="confirmation-dialog">
                <h3>Leave Room?</h3>
                <p>Are you sure you want to leave this chat room?</p>
                <div class="confirmation-buttons">
                    <button class="confirm-leave">Yes, Leave</button>
                    <button class="cancel-leave">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listeners to buttons
        overlay.querySelector('.confirm-leave').addEventListener('click', function() {
            if (ws) {
                ws.close();
            }
            window.location.href = 'index.html';
        });
        
        overlay.querySelector('.cancel-leave').addEventListener('click', function() {
            document.body.removeChild(overlay);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });
    }
    
    // Handle incoming WebSocket messages
    function handleMessage(message) {
        switch (message.type) {
            case 'message':
                addMessageToChat(message);
                break;
            case 'notification':
                addNotificationToChat(message);
                break;
            case 'typing':
                handleTypingIndicator(message);
                break;
            case 'participants':
                updateParticipantsList(message);
                break;
            case 'history':
                // Load message history
                message.messages.forEach(msg => {
                    if (msg.type === 'message') {
                        addMessageToChat(msg);
                    }
                });
                break;
        }
    }
    
    // Add message to chat UI
    function addMessageToChat(message) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message');
        messageEl.classList.add(message.sender === currentUser ? 'sent' : 'received');
        
        let contentHTML = '';
        
        if (message.contentType === 'text') {
            contentHTML = `<p>${escapeHtml(message.content)}</p>`;
        } else if (message.contentType === 'image') {
            contentHTML = `<img src="${message.content}" alt="Shared image" style="max-width: 100%; border-radius: 5px;">`;
        } else if (message.contentType === 'audio') {
            contentHTML = `
                <audio controls>
                    <source src="${message.content}" type="audio/webm">
                    Your browser does not support the audio element.
                </audio>
            `;
        } else if (message.contentType === 'file') {
            contentHTML = `
                <div class="file-message">
                    <div class="file-icon">📄</div>
                    <div class="file-info">
                        <div class="file-name">${escapeHtml(message.fileName)}</div>
                        <div class="file-size">${formatFileSize(message.fileSize)}</div>
                    </div>
                    <a href="${message.content}" download="${message.fileName}" class="download-btn">Download</a>
                </div>
            `;
        }
        
        // Add sender name if not current user
        const senderName = message.sender === currentUser ? 'You' : escapeHtml(message.sender);
        
        messageEl.innerHTML = `
            ${message.sender !== currentUser ? `<div class="message-sender">${senderName}</div>` : ''}
            <div class="message-content">
                ${contentHTML}
            </div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        scrollToBottom();
    }
    
    // Add notification to chat UI
    function addNotificationToChat(message) {
        const notificationEl = document.createElement('div');
        notificationEl.classList.add('notification');
        notificationEl.innerHTML = `<p>${escapeHtml(message.content)}</p>`;
        messagesContainer.appendChild(notificationEl);
        scrollToBottom();
    }
    
    // Handle typing indicator
    function handleTypingIndicator(message) {
        if (message.isTyping && message.user !== currentUser) {
            typingIndicator.textContent = `${message.user} is typing...`;
        } else {
            typingIndicator.textContent = '';
        }
    }
    
    // Update participants list
    function updateParticipantsList(message) {
        const participantsList = document.getElementById('participants');
        const participantCount = document.getElementById('participant-count');
        
        participantsList.innerHTML = '';
        participantCount.textContent = message.count;
        
        message.users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            participantsList.appendChild(li);
        });
    }
    
    // Send message
    function sendMessage() {
        const content = messageInput.value.trim();
        
        if (content && ws.readyState === WebSocket.OPEN) {
            const message = {
                type: 'message',
                sender: currentUser,
                content: content,
                contentType: 'text',
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(message));
            messageInput.value = '';
            
            // Clear typing indicator
            clearTimeout(typingTimer);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'typing',
                    isTyping: false
                }));
            }
        }
    }
    
    // Handle file selection
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }
        
        // Check file type
        const fileType = file.type.split('/')[0];
        
        if (fileType === 'image') {
            previewImage(file);
        } else if (fileType === 'audio') {
            // For audio files, we'll just send them directly
            sendFile(file);
        } else {
            // For other files, show a simple preview
            previewFile(file);
        }
    }
    
    // Preview image before sending
    function previewImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContent.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%;">`;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    // Preview file before sending
    function previewFile(file) {
        previewContent.innerHTML = `
            <div class="file-preview">
                <p>File: ${file.name}</p>
                <p>Type: ${file.type}</p>
                <p>Size: ${formatFileSize(file.size)}</p>
            </div>
        `;
        previewContainer.classList.remove('hidden');
    }
    
    // Send file message
    function sendFileMessage() {
        const file = fileInput.files[0];
        if (file) {
            sendFile(file);
            previewContainer.classList.add('hidden');
            fileInput.value = '';
        }
    }
    
    // Send file via WebSocket
    function sendFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'message',
                    sender: currentUser,
                    content: e.target.result,
                    contentType: file.type.split('/')[0] === 'image' ? 'image' : 'file',
                    fileName: file.name,
                    fileSize: file.size,
                    timestamp: new Date().toISOString()
                };
                
                ws.send(JSON.stringify(message));
            }
        };
        reader.readAsDataURL(file);
    }
    
    // Start voice recording
    function startRecording() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(stream) {
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    
                    mediaRecorder.ondataavailable = function(event) {
                        audioChunks.push(event.data);
                    };
                    
                    mediaRecorder.onstop = function() {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        sendAudioMessage(audioBlob);
                    };
                    
                    mediaRecorder.start();
                    voiceRecorder.classList.remove('hidden');
                    
                    // Start timer
                    recordingSeconds = 0;
                    updateRecordingTimer();
                    recordingInterval = setInterval(updateRecordingTimer, 1000);
                })
                .catch(function(error) {
                    console.error('Error accessing microphone:', error);
                    alert('Could not access your microphone. Please check permissions.');
                });
        } else {
            alert('Your browser does not support audio recording.');
        }
    }
    
    // Update recording timer
    function updateRecordingTimer() {
        recordingSeconds++;
        const minutes = Math.floor(recordingSeconds / 60);
        const seconds = recordingSeconds % 60;
        recordingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Stop recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(recordingInterval);
            voiceRecorder.classList.add('hidden');
        }
    }
    
    // Cancel recording
    function cancelRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            clearInterval(recordingInterval);
            voiceRecorder.classList.add('hidden');
        }
    }
    
    // Send audio message
    function sendAudioMessage(audioBlob) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (ws.readyState === WebSocket.OPEN) {
                const message = {
                    type: 'message',
                    sender: currentUser,
                    content: e.target.result,
                    contentType: 'audio',
                    timestamp: new Date().toISOString()
                };
                
                ws.send(JSON.stringify(message));
            }
        };
        reader.readAsDataURL(audioBlob);
    }
    
    // Scroll to bottom of chat
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Format time for display
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Initialize the chat
    init();
});