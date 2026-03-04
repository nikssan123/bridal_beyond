import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
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
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const authToken = localStorage.getItem('token');
  const currentUserId = currentUser?.id;

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
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
    if (!authToken) return;
    connect(authToken);
    return () => disconnect();
  }, [authToken]);

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

  useEffect(() => {
    // On mobile: default to list when there is no active conversation
    if (!isMobile) {
      setShowListOnMobile(false);
      return;
    }
    if (!conversationId) {
      setShowListOnMobile(true);
    }
  }, [isMobile, conversationId]);

  const handleSelectConversation = (id: string) => {
    navigate(`/messages/${id}`);
    if (isMobile) {
      setShowListOnMobile(false);
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

  const isSellerView = useMemo(() => {
    if (current?.isListingSeller != null) return current.isListingSeller;
    if (!currentUser) return false;
    if (currentUser.role && currentUser.role.toLowerCase() === 'seller') return true;
    return false;
  }, [current, currentUser]);

  const messageSuggestions = useMemo(() => {
    const buyerSuggestions = [
      current?.listingTitle
        ? `Hi, is "${current.listingTitle}" still available?`
        : 'Hi, is this item still available?',
      'Can you share a few more photos or details?',
      'Is the price negotiable at all?',
      'What are the pickup or delivery options?',
    ];

    const sellerSuggestions = [
      current?.listingTitle
        ? `Hi! Thanks for your interest in "${current.listingTitle}".`
        : 'Hi! Thanks for your interest in my listing.',
      'Yes, it’s available. When would you like to try it on?',
      'If you confirm soon, I can offer a small discount.',
      'Where are you based so I can suggest the best courier?',
    ];

    return (isSellerView ? sellerSuggestions : buyerSuggestions).slice(0, 4);
  }, [current, isSellerView]);

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
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          mb: 2,
          fontFamily: "'Playfair Display', serif",
          letterSpacing: 0.2,
        }}
      >
        {t('messages.title')}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 210px)',
          minHeight: 360,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[3],
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
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
            ...(isMobile && !showListOnMobile
              ? { display: 'none' }
              : {}),
          }}
        >
          {isMobile && (
            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {t('messages.title')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('messages.selectConversation')}
              </Typography>
            </Box>
          )}
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
            <List
              disablePadding
              sx={{
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {list.map((conv) => {
                const other = conv.participants.find((p) => p.id !== currentUserId);
                const isSelected = conv.id === conversationId;
                const lastMessagePreview =
                  conv.listingTitle
                    ? `${conv.listingTitle}${
                        conv.lastMessage
                          ? ' · ' +
                            conv.lastMessage.body.slice(0, 40) +
                            (conv.lastMessage.body.length > 40 ? '…' : '')
                          : ''
                      }`
                    : (conv.lastMessage?.body?.slice(0, 60) || '') +
                      (conv.lastMessage && conv.lastMessage.body.length > 60 ? '…' : '');

                return (
                  <ListItemButton
                    key={conv.id}
                    selected={isSelected}
                    onClick={() => handleSelectConversation(conv.id)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      alignItems: 'flex-start',
                      '&.Mui-selected': {
                        bgcolor:
                          theme.palette.mode === 'light'
                            ? 'rgba(233, 222, 255, 0.8)'
                            : 'rgba(88, 28, 135, 0.35)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={other?.name || t('messages.unknown')}
                      secondary={lastMessagePreview}
                      primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500 }}
                      secondaryTypographyProps={{
                        variant: 'body2',
                        color: 'text.secondary',
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
            bgcolor: 'background.paper',
            ...(isMobile && showListOnMobile
              ? { display: 'none' }
              : {}),
          }}
        >
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
                  py: 1.25,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  {isMobile && (
                    <Button
                      onClick={() => {
                        setShowListOnMobile(true);
                        navigate('/messages');
                      }}
                      startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                      sx={{
                        mr: 0.5,
                        minWidth: 0,
                        px: 0.5,
                        textTransform: 'none',
                        fontSize: 13,
                      }}
                    >
                      {t('messages.title')}
                    </Button>
                  )}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {otherParticipant?.name || t('messages.unknown')}
                    </Typography>
                    {current.listingTitle && (
                      <Typography variant="body2" color="text.secondary">
                        {current.listingTitle}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  overflow: 'auto',
                  p: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                }}
              >
                {current.messages.map((msg: MessageDTO) => (
                  <Paper
                    key={msg.id}
                    elevation={0}
                    sx={{
                      alignSelf: msg.senderId === currentUserId ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      px: 1.75,
                      py: 1.1,
                      bgcolor:
                        msg.senderId === currentUserId
                          ? theme.palette.mode === 'light'
                            ? theme.palette.primary.main
                            : theme.palette.primary.dark
                          : theme.palette.mode === 'light'
                          ? theme.palette.grey[100]
                          : 'rgba(31, 41, 55, 0.95)',
                      borderRadius: 3,
                      borderTopRightRadius: msg.senderId === currentUserId ? 4 : 3,
                      borderTopLeftRadius: msg.senderId === currentUserId ? 3 : 4,
                      color: msg.senderId === currentUserId ? 'common.white' : 'text.primary',
                      boxShadow: theme.shadows[1],
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

              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                {messageSuggestions.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 1,
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      px: 0.5,
                      '&::-webkit-scrollbar': { display: 'none' },
                    }}
                  >
                    {messageSuggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outlined"
                        size="small"
                        onClick={() => setInputValue(suggestion)}
                        sx={{
                          borderRadius: 999,
                          textTransform: 'none',
                          whiteSpace: 'nowrap',
                          px: 1.5,
                          py: 0.5,
                          fontSize: 12,
                          flexShrink: 0,
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                    sx={{
                      minWidth: isMobile ? 44 : 56,
                      borderRadius: 999,
                      boxShadow: theme.shadows[2],
                    }}
                    aria-label={t('messages.send')}
                  >
                    <SendIcon />
                  </Button>
                </Box>
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
