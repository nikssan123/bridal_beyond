import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchConversations,
  fetchConversation,
  addMessage,
} from '@/features/conversations/conversationsSlice';
import {
  connect,
  disconnect,
  joinConversation,
  leaveConversation,
  sendMessage as sendMessageSocket,
  onNewMessage,
} from '@/lib/socket';
import { useTranslation } from 'react-i18next';
import type { MessageDTO } from '@/features/conversations/conversationsTypes';

const Messages: React.FC = () => {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { list, current, status, fetchOneStatus } = useAppSelector((state) => state.conversations);
  const token = useAppSelector((state) => state.auth.token) || localStorage.getItem('token');
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    if (conversationId) {
      dispatch(fetchConversation(conversationId));
    }
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (!token) return;
    connect(token);
    return () => disconnect();
  }, [token]);

  useEffect(() => {
    const unsub = onNewMessage((payload) => {
      dispatch(addMessage({ conversationId: payload.conversationId, message: payload.message }));
    });
    return unsub;
  }, [dispatch]);

  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId, (err) => {
        if (err) console.warn('join_conversation', err);
      });
      return () => leaveConversation(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [current?.messages]);

  const handleSelectConversation = (id: string) => {
    navigate(`/messages/${id}`);
    if (isMobile) {
      // Could add a "back to list" state for mobile
    }
  };

  const handleSend = () => {
    const body = inputValue.trim();
    if (!body || !conversationId || !currentUserId) return;
    setSending(true);
    sendMessageSocket(conversationId, body, (err, message) => {
      setSending(false);
      if (err) return;
      setInputValue('');
      if (message) {
        dispatch(addMessage({ conversationId, message }));
      }
    });
  };

  const otherParticipant = current?.participants.find((p) => p.id !== currentUserId);

  if (status === 'loading' && list.length === 0) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, fontFamily: "'Playfair Display', serif" }}>
        {t('messages.title')}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : 'calc(100vh - 220px)',
          minHeight: 400,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            width: isMobile ? '100%' : 320,
            minWidth: isMobile ? undefined : 280,
            borderRight: isMobile ? 'none' : '1px solid',
            borderBottom: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          {list.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('messages.noConversations')}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {list.map((conv) => {
                const other = conv.participants.find((p) => p.id !== currentUserId);
                const isSelected = conv.id === conversationId;
                return (
                  <ListItemButton
                    key={conv.id}
                    selected={isSelected}
                    onClick={() => handleSelectConversation(conv.id)}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemText
                      primary={other?.name || t('messages.unknown')}
                      secondary={
                        conv.listingTitle
                          ? `${conv.listingTitle}${conv.lastMessage ? ' · ' + conv.lastMessage.body.slice(0, 30) + (conv.lastMessage.body.length > 30 ? '…' : '') : ''}`
                          : conv.lastMessage?.body?.slice(0, 50) + (conv.lastMessage && conv.lastMessage.body.length > 50 ? '…' : '') || ''
                      }
                      primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!conversationId ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {t('messages.selectConversation')}
              </Typography>
            </Box>
          ) : fetchOneStatus === 'loading' && !current ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress size={32} sx={{ color: 'primary.dark' }} />
            </Box>
          ) : current ? (
            <>
              <Box
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {otherParticipant?.name || t('messages.unknown')}
                  {current.listingTitle && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      · {current.listingTitle}
                    </Typography>
                  )}
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {current.messages.map((msg: MessageDTO) => (
                  <Paper
                    key={msg.id}
                    elevation={0}
                    sx={{
                      alignSelf: msg.senderId === currentUserId ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      px: 2,
                      py: 1.25,
                      bgcolor: msg.senderId === currentUserId ? 'primary.light' : 'background.default',
                      border: '1px solid',
                      borderColor: msg.senderId === currentUserId ? 'primary.main' : 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.body}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </Typography>
                  </Paper>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('messages.typeMessage')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={sending}
                />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  sx={{ minWidth: 48 }}
                  aria-label={t('messages.send')}
                >
                  <SendIcon />
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Typography color="text.secondary">{t('messages.conversationNotFound')}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Messages;
