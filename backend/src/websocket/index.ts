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
        socket.join(`${CONVERSATION_ROOM_PREFIX}${conversationId}`);
        cb?.();
      });
    });

    socket.on('leave_conversation', (conversationId: string) => {
      if (conversationId && typeof conversationId === 'string') {
        socket.leave(`${CONVERSATION_ROOM_PREFIX}${conversationId}`);
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
            sendNewMessageEmail({
              to: recipient.email,
              recipientName: recipient.name,
              senderName,
              listingTitle: listingTitle ?? undefined,
              messagesUrl,
            }).catch((err) => console.error('[mail] sendNewMessageEmail failed', err));
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
