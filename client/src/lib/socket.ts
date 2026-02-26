/**
 * Socket.IO client for real-time chat. Connect with JWT; join/leave conversation rooms; send_message and listen for new_message.
 */

import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const WS_URL = API_BASE.replace(/\/api\/?$/, '') || 'http://localhost:4000';

let socket: Socket | null = null;

export interface NewMessagePayload {
  message: { id: string; conversationId: string; senderId: string; body: string; createdAt: string };
  conversationId: string;
}

export function getSocket(): Socket | null {
  return socket;
}

export function connect(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(WS_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinConversation(conversationId: string, cb?: (err?: string) => void): void {
  if (!socket) {
    cb?.('Not connected');
    return;
  }
  socket.emit('join_conversation', conversationId, cb);
}

export function leaveConversation(conversationId: string): void {
  if (socket) socket.emit('leave_conversation', conversationId);
}

export function sendMessage(
  conversationId: string,
  body: string,
  cb: (err: string | null, message?: NewMessagePayload['message']) => void
): void {
  if (!socket) {
    cb('Not connected');
    return;
  }
  socket.emit('send_message', { conversationId, body }, cb);
}

export function onNewMessage(callback: (payload: NewMessagePayload) => void): () => void {
  if (!socket) return () => {};
  socket.on('new_message', callback);
  return () => {
    socket?.off('new_message', callback);
  };
}

export function onConnect(callback: () => void): () => void {
  if (!socket) return () => {};
  socket.on('connect', callback);
  return () => socket?.off('connect', callback);
}

export function onDisconnect(callback: (reason: string) => void): () => void {
  if (!socket) return () => {};
  socket.on('disconnect', callback);
  return () => socket?.off('disconnect', callback);
}
