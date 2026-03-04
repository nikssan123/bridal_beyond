import { prisma } from '../../prisma';
import type {
  ConversationDTO,
  ConversationWithMessagesDTO,
  MessageDTO,
  ParticipantSummary,
} from './conversationsTypes';

function toParticipantSummary(u: { id: string; name: string; avatar_url: string | null }): ParticipantSummary {
  return { id: u.id, name: u.name, avatar: u.avatar_url ?? '' };
}

function toMessageDTO(m: {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: Date;
}): MessageDTO {
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    body: m.body,
    createdAt: m.created_at.toISOString(),
  };
}

export async function findOrCreate(
  currentUserId: string,
  otherUserId: string,
  listingId?: string | null
): Promise<ConversationDTO | null> {
  if (currentUserId === otherUserId) return null;

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { user_id: currentUserId } } },
        { participants: { some: { user_id: otherUserId } } },
      ],
    },
    include: {
      participants: { include: { user: true } },
      listing: true,
      messages: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  });

  if (existing) {
    const participants = existing.participants.map((p) => toParticipantSummary(p.user));
    const lastMsg = existing.messages[0];
    return {
      id: existing.id,
      listingId: existing.listing_id,
      listingTitle: existing.listing?.title ?? null,
      isListingSeller: existing.listing ? existing.listing.seller_id === currentUserId : undefined,
      participants,
      lastMessage: lastMsg ? toMessageDTO(lastMsg) : null,
      updatedAt: existing.updated_at.toISOString(),
      createdAt: existing.created_at.toISOString(),
    };
  }

  const created = await prisma.conversation.create({
    data: {
      listing_id: listingId ?? undefined,
      participants: {
        create: [
          { user_id: currentUserId },
          { user_id: otherUserId },
        ],
      },
    },
    include: {
      participants: { include: { user: true } },
      listing: true,
    },
  });

  return {
    id: created.id,
    listingId: created.listing_id,
    listingTitle: created.listing?.title ?? null,
    isListingSeller: created.listing ? created.listing.seller_id === currentUserId : undefined,
    participants: created.participants.map((p) => toParticipantSummary(p.user)),
    lastMessage: null,
    updatedAt: created.updated_at.toISOString(),
    createdAt: created.created_at.toISOString(),
  };
}

export async function listForUser(userId: string): Promise<ConversationDTO[]> {
  const convos = await prisma.conversation.findMany({
    where: {
      participants: { some: { user_id: userId } },
    },
    orderBy: { updated_at: 'desc' },
    include: {
      participants: { include: { user: true } },
      listing: true,
      messages: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  });

  return convos.map((c) => {
    const lastMsg = c.messages[0];
    return {
      id: c.id,
      listingId: c.listing_id,
      listingTitle: c.listing?.title ?? null,
      isListingSeller: c.listing ? c.listing.seller_id === userId : undefined,
      participants: c.participants.map((p) => toParticipantSummary(p.user)),
      lastMessage: lastMsg ? toMessageDTO(lastMsg) : null,
      updatedAt: c.updated_at.toISOString(),
      createdAt: c.created_at.toISOString(),
    };
  });
}

export async function getById(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessagesDTO | null> {
  const c = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { user_id: userId } },
    },
    include: {
      participants: { include: { user: true } },
      listing: true,
      messages: { orderBy: { created_at: 'asc' }, take: 50 },
    },
  });
  if (!c) return null;

  return {
    id: c.id,
    listingId: c.listing_id,
    listingTitle: c.listing?.title ?? null,
    isListingSeller: c.listing ? c.listing.seller_id === userId : undefined,
    participants: c.participants.map((p) => toParticipantSummary(p.user)),
    lastMessage: c.messages.length > 0 ? toMessageDTO(c.messages[c.messages.length - 1]) : null,
    updatedAt: c.updated_at.toISOString(),
    createdAt: c.created_at.toISOString(),
    messages: c.messages.map(toMessageDTO),
  };
}

export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const count = await prisma.conversationParticipant.count({
    where: { conversation_id: conversationId, user_id: userId },
  });
  return count > 0;
}

export async function createMessage(
  conversationId: string,
  senderId: string,
  body: string
): Promise<MessageDTO | null> {
  const isPart = await isParticipant(conversationId, senderId);
  if (!isPart) return null;

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversation_id: conversationId, sender_id: senderId, body },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    }),
  ]);

  return toMessageDTO(message);
}

export async function getRecipientForNewMessage(
  conversationId: string,
  senderId: string
): Promise<{ id: string; email: string; name: string } | null> {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: conversationId, user_id: { not: senderId } },
    include: { user: true },
  });
  if (!participant?.user) return null;
  return {
    id: participant.user.id,
    email: participant.user.email,
    name: participant.user.name,
  };
}

export async function getConversationListingTitle(conversationId: string): Promise<string | null> {
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { listing: { select: { title: true } } },
  });
  return c?.listing?.title ?? null;
}
