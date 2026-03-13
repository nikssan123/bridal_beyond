import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';
import type {
  ConversationDTO,
  ConversationWithMessagesDTO,
  MessageDTO,
} from './conversationsTypes';

interface ConversationsState {
  list: ConversationDTO[];
  current: ConversationWithMessagesDTO | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  fetchOneStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ConversationsState = {
  list: [],
  current: null,
  status: 'idle',
  fetchOneStatus: 'idle',
  error: null,
};

export const uploadConversationImage = createAsyncThunk(
  'conversations/uploadImage',
  async (
    payload: { file: File; conversationId: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('image', payload.file);
      formData.append('conversationId', payload.conversationId);
      const { data } = await api.post<{ url: string }>('/messages/upload-image', formData, {
        timeout: 120000,
      });
      return data.url;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const message =
        err?.response?.data?.message || err?.message || 'Failed to upload image';
      return rejectWithValue(message);
    }
  }
);

export const createOrGetConversation = createAsyncThunk(
  'conversations/createOrGet',
  async (
    payload: { otherUserId: string; listingId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<ConversationDTO>('/conversations', {
        otherUserId: payload.otherUserId,
        listingId: payload.listingId,
      });
      return data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const message =
        err?.response?.data?.message || err?.message || 'Failed to create conversation';
      return rejectWithValue(message);
    }
  }
);

export const fetchConversations = createAsyncThunk(
  'conversations/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ConversationDTO[]>('/conversations');
      return data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || 'Failed to load conversations';
      return rejectWithValue(message);
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'conversations/fetchOne',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ConversationWithMessagesDTO>(`/conversations/${conversationId}`);
      return data;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || 'Failed to load conversation';
      return rejectWithValue(message);
    }
  }
);

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: { payload: ConversationWithMessagesDTO | null }) => {
      state.current = action.payload;
    },
    addMessage: (state, action: { payload: { conversationId: string; message: MessageDTO } }) => {
      const { conversationId, message } = action.payload;
      if (state.current?.id === conversationId) {
        if (!state.current.messages.some((m) => m.id === message.id)) {
          state.current.messages.push(message);
        }
      }
      const conv = state.list.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = message;
        conv.updatedAt = message.createdAt;
        state.list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrGetConversation.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createOrGetConversation.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const c = action.payload;
        const existing = state.list.find((x) => x.id === c.id);
        if (!existing) state.list.unshift(c);
        state.error = null;
      })
      .addCase(createOrGetConversation.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || null;
      })
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || null;
      })
      .addCase(fetchConversation.pending, (state) => {
        state.fetchOneStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.fetchOneStatus = 'succeeded';
        state.current = action.payload;
        const c = action.payload;
        const inList = state.list.find((x) => x.id === c.id);
        if (!inList) state.list.unshift(c);
        else {
          inList.lastMessage = c.lastMessage;
          inList.updatedAt = c.updatedAt;
        }
        state.error = null;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.fetchOneStatus = 'failed';
        state.error = (action.payload as string) || action.error.message || null;
      });
  },
});

export const { setCurrentConversation, addMessage, clearError } = conversationsSlice.actions;
export default conversationsSlice.reducer;
