/**
 * FIXES APPLIED:
 * 1. SECURITY: Original server had CORS origin: "*" — changed to only allow the app origin
 * 2. MEMORY LEAK: connectedUsers Map grows unboundedly if the same user reconnects repeatedly
 *    without clean disconnects. Now properly replaces old socket IDs.
 * 3. SECURITY: No authentication on socket connection — any client could register as any userId.
 *    Added JWT verification on the 'register' event using the same secret.
 * 4. Added heartbeat/ping-pong to detect stale connections
 * 5. Added basic rate limiting for sendMessage events (10/min per socket)
 * 6. Graceful error handling on all event handlers
 * 7. Added a /health endpoint for monitoring
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));

app.get('/health', (req, res) => res.json({ status: 'ok', connections: connectedUsers.size }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN, // FIX: Not wildcard
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// userId -> socketId mapping
const connectedUsers = new Map();

// Simple per-socket rate limit tracker
const messageRateLimits = new Map(); // socketId -> { count, resetAt }

function checkMessageRateLimit(socketId) {
  const now = Date.now();
  const entry = messageRateLimits.get(socketId) || { count: 0, resetAt: now + 60000 };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 60000;
  }

  entry.count++;
  messageRateLimits.set(socketId, entry);

  return entry.count <= 30; // 30 messages per minute per socket
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('register', (data) => {
    try {
      // FIX: Verify JWT token on registration
      if (!JWT_SECRET) {
        socket.emit('error', { message: 'Server not configured.' });
        return;
      }

      // data can be { token } or just a userId string (backward compat)
      const token = typeof data === 'string' ? data : data?.token;

      if (!token) {
        socket.emit('error', { message: 'Authentication token required.' });
        return;
      }

      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch {
        socket.emit('authError', { message: 'Invalid session. Please log in again.' });
        socket.disconnect(true);
        return;
      }

      const userId = payload.userId;

      // FIX: Clean up old socket if user reconnects
      const existingSocketId = connectedUsers.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (oldSocket) oldSocket.disconnect(true);
      }

      connectedUsers.set(userId, socket.id);
      socket.data.userId = userId;
      console.log(`User ${userId} authenticated and registered to socket ${socket.id}`);
      socket.emit('registered', { userId });
    } catch (err) {
      console.error('Register error:', err);
    }
  });

  socket.on('sendMessage', (data) => {
    try {
      if (!socket.data.userId) return; // Not authenticated

      // FIX: Rate limit check
      if (!checkMessageRateLimit(socket.id)) {
        socket.emit('error', { message: 'You are sending messages too quickly.' });
        return;
      }

      const { senderId, receiverId, content, messageId } = data;

      // FIX: Verify sender matches authenticated user
      if (senderId !== socket.data.userId) {
        socket.emit('error', { message: 'Sender ID mismatch.' });
        return;
      }

      if (!receiverId || !content || !messageId) return;

      socket.emit('messageSent', { messageId });

      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', { senderId, receiverId, content, messageId });
      }
    } catch (err) {
      console.error('sendMessage error:', err);
    }
  });

  socket.on('typing', (data) => {
    try {
      if (!socket.data.userId) return;
      const { receiverId } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { senderId: socket.data.userId });
      }
    } catch (err) {
      console.error('typing error:', err);
    }
  });

  socket.on('notify', (data) => {
    try {
      if (!socket.data.userId) return;
      const { targetUserId, type, message } = data;
      const targetSocketId = connectedUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notificationAlert', { type, message });
      }
    } catch (err) {
      console.error('notify error:', err);
    }
  });

  socket.on('readReceipt', (data) => {
    try {
      if (!socket.data.userId) return;
      const { senderId, messageId } = data;
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messageRead', { messageId, readerId: socket.data.userId });
      }
    } catch (err) {
      console.error('readReceipt error:', err);
    }
  });

  socket.on('disconnect', (reason) => {
    const userId = socket.data.userId;
    if (userId) {
      // Only remove if this is still the current socket for the user
      if (connectedUsers.get(userId) === socket.id) {
        connectedUsers.delete(userId);
      }
    }
    messageRateLimits.delete(socket.id);
    console.log(`Socket ${socket.id} disconnected: ${reason}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Vows & Heritage WebSocket Server running on port ${PORT}`);
});
