import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../prisma';
import * as conversationsRepo from '../modules/conversations/conversationsRepository';
import { sendNewMessageEmail } from '../services/mailService';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

const CONVERSATION_ROOM_PREFIX = 'conversation:';

export function attachSocketIO(httpServer: HttpServer): Server {
  /** Per conversation: userId -> count of sockets (multiple tabs/devices). */
  const participantsInRoom = new Map<string, Map<string, number>>();
  /** Per conversation: recipient userIds we have already emailed since they were last in the room. */
  const sentEmailForRecipient = new Map<string, Set<string>>();

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: env.corsOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string) || (socket.handshake.query?.token as string);
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
      (socket as unknown as { userId: string }).userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (sock) => {
    const socket = sock as Socket & { userId: string };
    socket.on('join_conversation', (conversationId: string, cb?: (err?: string) => void) => {
      if (!conversationId || typeof conversationId !== 'string') {
        cb?.('Invalid conversationId');
        return;
      }
      conversationsRepo.isParticipant(conversationId, socket.userId).then((ok) => {
        if (!ok) {
          cb?.('Not a participant');
          return;
        }
        const room = `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
        socket.join(room);
        let byUser = participantsInRoom.get(conversationId);
        if (!byUser) {
          byUser = new Map();
          participantsInRoom.set(conversationId, byUser);
        }
        byUser.set(socket.userId, (byUser.get(socket.userId) ?? 0) + 1);
        const sentSet = sentEmailForRecipient.get(conversationId);
        if (sentSet) {
          sentSet.delete(socket.userId);
          if (sentSet.size === 0) sentEmailForRecipient.delete(conversationId);
        }
        cb?.();
      });
    });

    socket.on('leave_conversation', (conversationId: string) => {
      if (conversationId && typeof conversationId === 'string') {
        socket.leave(`${CONVERSATION_ROOM_PREFIX}${conversationId}`);
        const byUser = participantsInRoom.get(conversationId);
        if (byUser) {
          const n = (byUser.get(socket.userId) ?? 0) - 1;
          if (n <= 0) byUser.delete(socket.userId);
          else byUser.set(socket.userId, n);
          if (byUser.size === 0) participantsInRoom.delete(conversationId);
        }
      }
    });

    socket.on('disconnecting', () => {
      const prefix = CONVERSATION_ROOM_PREFIX;
      for (const room of socket.rooms) {
        if (room.startsWith(prefix)) {
          const conversationId = room.slice(prefix.length);
          const byUser = participantsInRoom.get(conversationId);
          if (byUser) {
            const n = (byUser.get(socket.userId) ?? 0) - 1;
            if (n <= 0) byUser.delete(socket.userId);
            else byUser.set(socket.userId, n);
            if (byUser.size === 0) participantsInRoom.delete(conversationId);
          }
        }
      }
    });

    socket.on(
      'send_message',
      async (
        payload: { conversationId: string; body?: string; imageUrl?: string },
        cb?: (err: string | null, message?: unknown) => void
      ) => {
        const { conversationId, body = '', imageUrl } = payload || {};
        if (!conversationId || typeof conversationId !== 'string') {
          cb?.('Invalid payload');
          return;
        }
        if ((!body || !body.trim()) && !imageUrl) {
          cb?.('Message must contain text or an image');
          return;
        }
        try {
          const isPart = await conversationsRepo.isParticipant(conversationId, socket.userId);
          if (!isPart) {
            cb?.('Not a participant');
            return;
          }
          const message = await conversationsRepo.createMessage(
            conversationId,
            socket.userId,
            body,
            imageUrl
          );
          if (!message) {
            cb?.('Failed to create message');
            return;
          }

          const recipient = await conversationsRepo.getRecipientForNewMessage(
            conversationId,
            socket.userId
          );
          const listingTitle = await conversationsRepo.getConversationListingTitle(conversationId);
          const messagesUrl = `${env.corsOrigin.split(',')[0].trim()}/messages`;
          let senderName = 'Someone';
          try {
            const sender = await prisma.user.findUnique({
              where: { id: socket.userId },
              select: { name: true },
            });
            if (sender?.name) senderName = sender.name;
          } catch (_) {}
          if (recipient) {
            const recipientInRoom = (participantsInRoom.get(conversationId)?.get(recipient.id) ?? 0) > 0;
            const alreadySent = sentEmailForRecipient.get(conversationId)?.has(recipient.id) ?? false;
            if (!recipientInRoom && !alreadySent) {
              sendNewMessageEmail({
                to: recipient.email,
                recipientName: recipient.name,
                senderName,
                listingTitle: listingTitle ?? undefined,
                messagesUrl,
              }).catch((err) => console.error('[mail] sendNewMessageEmail failed', err));
              let sentSet = sentEmailForRecipient.get(conversationId);
              if (!sentSet) {
                sentSet = new Set();
                sentEmailForRecipient.set(conversationId, sentSet);
              }
              sentSet.add(recipient.id);
            }
          }

          const room = `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
          io.to(room).emit('new_message', { message, conversationId });
          cb?.(null, message);
        } catch (e) {
          console.error('[socket] send_message error', e);
          cb?.('Server error');
        }
      }
    );
  });

  return io;
}
