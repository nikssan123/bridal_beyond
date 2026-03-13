import type { Notification } from '@prisma/client';
import { prisma } from '../../prisma';

export type NotificationType = 'message' | 'order' | 'stripe' | 'info';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}

export async function listForUser(userId: string): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
}

export async function createForUser(input: CreateNotificationInput): Promise<Notification> {
  const { userId, type, title, body, href } = input;
  return prisma.notification.create({
    data: {
      user_id: userId,
      type,
      title,
      body,
      href,
    },
  });
}

export async function markAsRead(userId: string, id: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, user_id: userId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { user_id: userId, read: false },
    data: { read: true },
  });
}

