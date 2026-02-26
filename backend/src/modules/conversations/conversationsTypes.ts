export interface ParticipantSummary {
  id: string;
  name: string;
  avatar: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  listingId: string | null;
  listingTitle: string | null;
  participants: ParticipantSummary[];
  lastMessage: MessageDTO | null;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationWithMessagesDTO extends ConversationDTO {
  messages: MessageDTO[];
}
