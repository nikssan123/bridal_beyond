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
  IconButton,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/ImageOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PageContainer from '@/components/PageContainer';
import SafetyInfoCard from '@/components/SafetyInfoCard';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchConversations,
  fetchConversation,
  addMessage,
  uploadConversationImage,
} from '@/features/conversations/conversationsSlice';
import { pushNotification } from '@/features/notifications/notificationsSlice';
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      if (
        currentUserId &&
        payload.message.senderId !== currentUserId &&
        (!conversationId || conversationId !== payload.conversationId)
      ) {
        dispatch(
          pushNotification({
            id: `msg-${payload.message.id}`,
            type: 'message',
            title: t('nav.newMessageNotificationTitle', 'New message'),
            body: payload.message.body || undefined,
            href: `/messages/${payload.conversationId}`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        );
      }
    });
    return unsub;
  }, [dispatch, currentUserId, conversationId, t]);

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

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!conversationId || !currentUserId) return;
    if (!trimmed && !selectedImageFile) return;

    const send = (imageUrl?: string) => {
      setSending(true);
      sendMessageSocket(
        conversationId,
        { body: trimmed, imageUrl },
        (err, message) => {
          setSending(false);
          if (err) return;
          setInputValue('');
          setSelectedImageFile(null);
          setSelectedImagePreview(null);
          if (message) {
            dispatch(addMessage({ conversationId, message }));
          }
        }
      );
    };

    if (selectedImageFile) {
      try {
        setUploadingImage(true);
        setImageError(null);
        const url = await dispatch(
          uploadConversationImage({ file: selectedImageFile, conversationId })
        ).unwrap();
        setUploadingImage(false);
        send(url);
      } catch (e: any) {
        setUploadingImage(false);
        const msg =
          e && typeof e === 'string'
            ? e
            : t('messages.imageUploadFailed', 'Image upload failed. Please try again.');
        setImageError(msg);
      }
    } else {
      send();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const file = files[0];

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowed.includes(file.type)) {
      setImageError(
        t(
          'messages.imageInvalidType',
          'File must be an image (JPEG, PNG or WebP).'
        )
      );
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
      return;
    }

    if (file.size > maxSize) {
      setImageError(
        t(
          'messages.imageTooLarge',
          'File is too large. Maximum size is 10MB.'
        )
      );
      setSelectedImageFile(null);
      setSelectedImagePreview(null);
      return;
    }

    setImageError(null);
    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
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
        ? t('messages.suggestBuyerStillAvailableWithTitle', {
            defaultValue: 'Hi, is "{{title}}" still available?',
            title: current.listingTitle,
          })
        : t('messages.suggestBuyerStillAvailableGeneric', 'Hi, is this item still available?'),
      t(
        'messages.suggestBuyerMorePhotos',
        'Can you share a few more photos or details?'
      ),
      t('messages.suggestBuyerNegotiable', 'Is the price negotiable at all?'),
      t(
        'messages.suggestBuyerDeliveryOptions',
        'What are the pickup or delivery options?'
      ),
    ];

    const sellerSuggestions = [
      current?.listingTitle
        ? t('messages.suggestSellerThanksWithTitle', {
            defaultValue: 'Hi! Thanks for your interest in "{{title}}".',
            title: current.listingTitle,
          })
        : t(
            'messages.suggestSellerThanksGeneric',
            'Hi! Thanks for your interest in my listing.'
          ),
      t(
        'messages.suggestSellerAvailableTryOn',
        'Yes, it’s available. When would you like to try it on?'
      ),
      t(
        'messages.suggestSellerDiscount',
        'If you confirm soon, I can offer a small discount.'
      ),
      t(
        'messages.suggestSellerCourier',
        'Where are you based so I can suggest the best courier?'
      ),
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

      <SafetyInfoCard
        title={t('safety.keepCommunicationOnPlatformTitle')}
        body={t('safety.keepCommunicationOnPlatformBody')}
      />

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          height: isMobile ? 'auto' : 'calc(100vh - 210px)',
          minHeight: 360,
          borderRadius: 3,
          overflow: isMobile ? 'visible' : 'hidden',
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
                      px: 1.5,
                      py: 1,
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
                    {msg.imageUrl && (
                      <Box
                        sx={{
                          mb: msg.body ? 1 : 0.5,
                          borderRadius: 2,
                          overflow: 'hidden',
                          maxWidth: { xs: '80vw', sm: 360 },
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor:
                            msg.senderId === currentUserId ? 'primary.light' : 'divider',
                        }}
                        component="a"
                        href={msg.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={msg.imageUrl}
                          alt={t('messages.sharedPhotoAlt', 'Shared photo')}
                          style={{
                            display: 'block',
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    )}
                    {msg.body && (
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {msg.body}
                      </Typography>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedImagePreview && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 0.75,
                        maxWidth: 260,
                        bgcolor: 'background.default',
                      }}
                    >
                      <Box
                        component="img"
                        src={selectedImagePreview}
                        alt={t('messages.sharedPhotoAlt', 'Shared photo')}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ flex: 1, fontSize: 12 }}
                      >
                        {t('messages.imageSelected', 'Image attached')}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedImageFile(null);
                          setSelectedImagePreview(null);
                        }}
                        aria-label={t('messages.removeImage', 'Remove image')}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  {imageError && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mb: 0.5 }}
                    >
                      {imageError}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageSelect}
                    />
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || sending}
                      aria-label={t('messages.attachImage', 'Attach image')}
                      sx={{
                        color: 'primary.main',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'primary.main',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'light'
                            ? 'rgba(212, 169, 154, 0.08)'
                            : 'rgba(212, 169, 154, 0.18)',
                      }}
                    >
                      <ImageIcon
                        sx={{
                          fontSize: 22,
                        }}
                      />
                    </IconButton>
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
                    disabled={sending || uploadingImage}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && !selectedImageFile) || sending || uploadingImage}
                    sx={{
                      minWidth: isMobile ? 44 : 56,
                      borderRadius: 999,
                      boxShadow: theme.shadows[2],
                    }}
                    aria-label={t('messages.send')}
                  >
                    {sending || uploadingImage ? (
                      <CircularProgress
                        size={20}
                        sx={{ color: theme.palette.common.white }}
                      />
                    ) : (
                      <SendIcon />
                    )}
                  </Button>
                  </Box>
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
