const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// Create HTTP server
const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // If root path, serve index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Map file extensions to content types
    const extname = path.extname(pathname);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.ico':
            contentType = 'image/x-icon';
            break;
    }
    
    // Construct file path
    const filePath = path.join(__dirname, '../public', pathname);
    
    // Read and serve file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Page not found - serve index.html for SPA routing
                fs.readFile(path.join(__dirname, '../public/index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404);
                        res.end('File not found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf8');
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store rooms and their participants
const rooms = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const roomId = parameters.query.room;
    const userName = parameters.query.user || `User_${Math.random().toString(36).substring(2, 8)}`;
    
    if (!roomId) {
        ws.close(1008, 'Room ID required');
        return;
    }
    
    // Join room
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            participants: new Map(),
            messages: []
        });
    }
    
    const room = rooms.get(roomId);
    room.participants.set(ws, userName);
    
    // Send join notification
    broadcastToRoom(roomId, {
        type: 'notification',
        content: `${userName} joined the room`,
        timestamp: new Date().toISOString()
    }, ws);
    
    // Send current participants list
    updateParticipantsList(roomId);
    
    // Send message history
    ws.send(JSON.stringify({
        type: 'history',
        messages: room.messages.slice(-50) // Last 50 messages
    }));
    
    // Handle messages from client
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'message':
                    // Add sender name if not provided
                    if (!message.sender) {
                        message.sender = userName;
                    }
                    
                    // Add timestamp if not present
                    if (!message.timestamp) {
                        message.timestamp = new Date().toISOString();
                    }
                    
                    // Store message
                    room.messages.push(message);
                    
                    // Broadcast to all participants in the room
                    broadcastToRoom(roomId, message);
                    break;
                
                case 'typing':
                    // Broadcast typing indicator
                    broadcastToRoom(roomId, {
                        type: 'typing',
                        user: userName,
                        isTyping: message.isTyping
                    }, ws); // Don't send to self
                    break;
                
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    // Handle connection close
    ws.on('close', () => {
        if (room.participants.has(ws)) {
            const user = room.participants.get(ws);
            room.participants.delete(ws);
            
            // Send leave notification
            broadcastToRoom(roomId, {
                type: 'notification',
                content: `${user} left the room`,
                timestamp: new Date().toISOString()
            });
            
            // Update participants list
            updateParticipantsList(roomId);
            
            // If room is empty, delete it after a delay
            if (room.participants.size === 0) {
                setTimeout(() => {
                    if (rooms.has(roomId)) {
                        const checkRoom = rooms.get(roomId);
                        if (checkRoom.participants.size === 0) {
                            rooms.delete(roomId);
                            console.log(`Room ${roomId} deleted`);
                        }
                    }
                }, 300000); // 5 minutes
            }
        }
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast message to all participants in a room
function broadcastToRoom(roomId, message, excludeWs = null) {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.participants.forEach((user, ws) => {
            if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
}

// Update participants list for all clients in a room
function updateParticipantsList(roomId) {
    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const participants = Array.from(room.participants.values());
        
        broadcastToRoom(roomId, {
            type: 'participants',
            users: participants,
            count: participants.length
        });
    }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});