import type { Request, Response } from 'express';
import * as notificationsRepo from './notificationsRepository';

export async function listMyNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const items = await notificationsRepo.listForUser(req.user.id);
  res.json(
    items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body ?? undefined,
      href: n.href ?? undefined,
      read: n.read,
      createdAt: n.created_at.toISOString(),
    }))
  );
}

export async function markNotificationRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: 'Notification id is required' });
    return;
  }
  await notificationsRepo.markAsRead(req.user.id, id);
  res.status(204).send();
}

export async function markAllNotificationsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  await notificationsRepo.markAllAsRead(req.user.id);
  res.status(204).send();
}

