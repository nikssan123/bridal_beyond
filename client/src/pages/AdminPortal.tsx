import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import api from '@/api/axios';

interface TableRowData {
  [key: string]: unknown;
}

interface AdminDisputeOrder {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price_cents: number;
  payment_intent_id: string;
  status: string;
  shipping_full_name: string;
  shipping_city: string;
  shipping_address_line: string;
  listing?: { id: string; title: string };
  buyer?: { name: string; email: string };
  seller?: { name: string; email: string };
}

interface AdminDispute {
  id: string;
  order_id: string;
  buyer_id: string;
  status: string;
  reason: string;
  description: string | null;
  type: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  order?: AdminDisputeOrder;
}

interface AdminListingImage {
  id: string;
  url: string;
  position: number;
}

interface AdminConversationParticipant {
  id: string;
  name: string;
  email: string;
}

interface AdminConversation {
  id: string;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
  participants: AdminConversationParticipant[];
  listing: { id: string; title: string } | null;
}

interface AdminMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  sender: { id: string; name: string; email: string };
}

const adminHeaders = (token: string) => ({ 'X-Admin-Token': token });

const AdminPortal: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<TableRowData[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [loadingTableCount, setLoadingTableCount] = useState(false);

  const [section, setSection] = useState<'tables' | 'disputes' | 'photos' | 'chat' | 'shops'>('tables');
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<string>('open');
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [disputesError, setDisputesError] = useState<string | null>(null);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [currentDispute, setCurrentDispute] = useState<AdminDispute | null>(null);
  const [currentDisputeLoading, setCurrentDisputeLoading] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<{ id: string; title?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [photoListingId, setPhotoListingId] = useState('');
  const [photoListingTitle, setPhotoListingTitle] = useState<string | null>(null);
  const [photoImages, setPhotoImages] = useState<AdminListingImage[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<{ id: string; title: string; description: string } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [captureOrderId, setCaptureOrderId] = useState('');
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);

  const [tableLimit, setTableLimit] = useState(50);
  const [chatConversations, setChatConversations] = useState<AdminConversation[]>([]);
  const [chatConversationsLoading, setChatConversationsLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<AdminMessage[]>([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);

  const [adminShops, setAdminShops] = useState<Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    ownerName: string;
    ownerEmail?: string;
    createdAt: string;
  }>>([]);
  const [adminShopsLoading, setAdminShopsLoading] = useState(false);
  const [adminShopsStatusFilter, setAdminShopsStatusFilter] = useState<string>('pending');
  const [shopActionId, setShopActionId] = useState<string | null>(null);

  const [discounts, setDiscounts] = useState<{
    limit: number;
    used: number;
    discountsLeft: number;
    totalOrders: number;
  } | null>(null);

  const isLoggedIn = !!token;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const loadTables = async (currentToken: string) => {
    setLoadingTables(true);
    setDataError(null);
    try {
      const { data } = await api.get<{ tables: string[] }>('/admin/tables', {
        headers: adminHeaders(currentToken),
      });
      setTables(data.tables);
      if (data.tables.length > 0) {
        setSelectedTable((prev) => prev ?? data.tables[0]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load tables';
      setDataError(msg);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadRows = async (table: string, currentToken: string, limit: number = tableLimit) => {
    setLoadingRows(true);
    setDataError(null);
    try {
      const { data } = await api.get<{ rows: TableRowData[] }>(`/admin/tables/${table}`, {
        headers: adminHeaders(currentToken),
        params: { limit },
      });
      setRows(data.rows);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load table data';
      setDataError(msg);
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  };

  const loadTableCount = async (table: string, currentToken: string) => {
    setLoadingTableCount(true);
    try {
      const { data } = await api.get<{ name: string; count: number }>(`/admin/tables/${table}/count`, {
        headers: adminHeaders(currentToken),
      });
      setTableCount(typeof data.count === 'number' ? data.count : null);
    } catch {
      setTableCount(null);
    } finally {
      setLoadingTableCount(false);
    }
  };

  const loadDisputes = async (currentToken: string) => {
    setDisputesLoading(true);
    setDisputesError(null);
    try {
      const url =
        disputeStatusFilter === ''
          ? '/admin/disputes'
          : `/admin/disputes?status=${encodeURIComponent(disputeStatusFilter)}`;
      const { data } = await api.get<AdminDispute[]>(url, {
        headers: adminHeaders(currentToken),
      });
      setDisputes(data);
    } catch (err: any) {
      setDisputesError(err?.response?.data?.message || err?.message || 'Failed to load disputes');
      setDisputes([]);
    } finally {
      setDisputesLoading(false);
    }
  };

  const loadDisputeById = async (id: string, currentToken: string) => {
    setCurrentDisputeLoading(true);
    setResolveError(null);
    try {
      const { data } = await api.get<AdminDispute>(`/admin/disputes/${id}`, {
        headers: adminHeaders(currentToken),
      });
      setCurrentDispute(data);
    } catch (err: any) {
      setResolveError(err?.response?.data?.message || err?.message || 'Failed to load dispute');
      setCurrentDispute(null);
    } finally {
      setCurrentDisputeLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTables(token);
    }
  }, [token]);

  const loadDiscounts = async (currentToken: string) => {
    try {
      const { data } = await api.get<{ limit: number; used: number; discountsLeft: number; totalOrders: number }>(
        '/admin/discounts',
        { headers: adminHeaders(currentToken) }
      );
      setDiscounts(data);
    } catch {
      setDiscounts(null);
    }
  };

  useEffect(() => {
    if (token) {
      loadDiscounts(token);
    } else {
      setDiscounts(null);
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedTable && section === 'tables') {
      loadRows(selectedTable, token, tableLimit);
      loadTableCount(selectedTable, token);
    } else {
      setTableCount(null);
    }
  }, [token, selectedTable, section, tableLimit]);

  useEffect(() => {
    if (token && section === 'disputes') {
      loadDisputes(token);
    }
  }, [token, section, disputeStatusFilter]);

  useEffect(() => {
    if (token && selectedDisputeId) {
      loadDisputeById(selectedDisputeId, token);
    } else {
      setCurrentDispute(null);
    }
  }, [token, selectedDisputeId]);

  const loadChatConversations = async (currentToken: string) => {
    setChatConversationsLoading(true);
    try {
      const { data } = await api.get<{ conversations: AdminConversation[] }>('/admin/conversations', {
        headers: adminHeaders(currentToken),
        params: { limit: 100 },
      });
      setChatConversations(data.conversations || []);
    } catch (err: any) {
      setDataError(err?.response?.data?.message || err?.message || 'Failed to load conversations');
      setChatConversations([]);
    } finally {
      setChatConversationsLoading(false);
    }
  };

  const loadChatMessages = async (conversationId: string, currentToken: string) => {
    setChatMessagesLoading(true);
    setChatMessages([]);
    try {
      const { data } = await api.get<{ messages: AdminMessage[] }>(
        `/admin/conversations/${conversationId}/messages`,
        { headers: adminHeaders(currentToken) }
      );
      setChatMessages(data.messages || []);
    } catch (err: any) {
      setDataError(err?.response?.data?.message || err?.message || 'Failed to load messages');
      setChatMessages([]);
    } finally {
      setChatMessagesLoading(false);
    }
  };

  const loadAdminShops = async (currentToken: string) => {
    setAdminShopsLoading(true);
    setDataError(null);
    try {
      const url = adminShopsStatusFilter
        ? `/admin/shops?status=${encodeURIComponent(adminShopsStatusFilter)}`
        : '/admin/shops';
      const { data } = await api.get<{ shops: Array<{
        id: string;
        name: string;
        slug: string;
        status: string;
        ownerName: string;
        ownerEmail?: string;
        createdAt: string;
      }> }>(url, { headers: adminHeaders(currentToken) });
      setAdminShops(data.shops || []);
    } catch (err: any) {
      setDataError(err?.response?.data?.message || err?.message || 'Failed to load shops');
      setAdminShops([]);
    } finally {
      setAdminShopsLoading(false);
    }
  };

  useEffect(() => {
    if (token && section === 'shops') {
      loadAdminShops(token);
    }
  }, [token, section, adminShopsStatusFilter]);

  useEffect(() => {
    if (token && section === 'chat') {
      loadChatConversations(token);
      setSelectedConversationId(null);
      setChatMessages([]);
    }
  }, [token, section]);

  useEffect(() => {
    if (token && selectedConversationId && section === 'chat') {
      loadChatMessages(selectedConversationId, token);
    } else {
      setChatMessages([]);
    }
  }, [token, selectedConversationId, section]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setDataError(null);
    try {
      const { data } = await api.post<{ token: string }>('/admin/login', {
        username,
        password,
      });
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setLoginError(msg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setTables([]);
    setRows([]);
    setSelectedTable(null);
    setSection('tables');
    setDisputes([]);
    setSelectedDisputeId(null);
    setCurrentDispute(null);
    setChatConversations([]);
    setSelectedConversationId(null);
    setChatMessages([]);
    setAdminShops([]);
  };

  const handleResolve = async (
    outcome: 'buyer_refund' | 'seller_payout' | 'no_refund' | 'partial_refund'
  ) => {
    if (!token || !selectedDisputeId) return;
    const refundAmountCents =
      outcome === 'partial_refund' && partialAmount.trim()
        ? Math.round(parseFloat(partialAmount) * 100)
        : undefined;
    if (outcome === 'partial_refund' && (!refundAmountCents || refundAmountCents <= 0)) return;
    setResolveLoading(true);
    setResolveError(null);
    try {
      const { data } = await api.post<AdminDispute>(
        `/admin/disputes/${selectedDisputeId}/resolve`,
        {
          outcome,
          refundAmountCents,
          notes: resolveNotes.trim() || undefined,
        },
        { headers: adminHeaders(token) }
      );
      setCurrentDispute(data);
      setResolveNotes('');
      setPartialAmount('');
      loadDisputes(token);
    } catch (err: any) {
      setResolveError(err?.response?.data?.message || err?.message || 'Failed to resolve');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleDeleteListingClick = (row: TableRowData) => {
    const id = row.id as string;
    const title = (row.title as string) || id.slice(0, 8);
    setListingToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteListingConfirm = async () => {
    if (!token || !listingToDelete) return;
    setDeletingId(listingToDelete.id);
    try {
      await api.delete(`/admin/listings/${listingToDelete.id}`, {
        headers: adminHeaders(token),
      });
      setDeleteDialogOpen(false);
      setListingToDelete(null);
      loadRows(selectedTable!, token);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to delete listing';
      setDataError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteDialogClose = () => {
    if (!deletingId) {
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    }
  };

  const loadListingPhotos = async () => {
    if (!token || !photoListingId.trim()) return;
    setPhotoLoading(true);
    setDataError(null);
    try {
      const { data } = await api.get<{ images: AdminListingImage[] }>(
        `/admin/listings/${photoListingId.trim()}/images/order`,
        { headers: adminHeaders(token) },
      );
      setPhotoImages(
        (data.images || []).slice().sort((a, b) => a.position - b.position),
      );
      setPhotoListingTitle(photoListingTitle ?? null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load listing photos';
      setDataError(msg);
      setPhotoImages([]);
      setPhotoListingTitle(null);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSetMainImage = (index: number) => {
    setPhotoImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      return [item, ...next];
    });
  };

  const movePhoto = (index: number, direction: 'left' | 'right') => {
    setPhotoImages((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleSavePhotoOrder = async () => {
    if (!token || !photoListingId.trim() || photoImages.length === 0) return;
    setPhotoSaving(true);
    setDataError(null);
    try {
      const { data } = await api.patch<{ images: AdminListingImage[] }>(
        `/admin/listings/${photoListingId.trim()}/images/order`,
        { imageIds: photoImages.map((img) => img.id) },
        { headers: adminHeaders(token) },
      );
      setPhotoImages(
        (data.images || []).slice().sort((a, b) => a.position - b.position),
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save image order';
      setDataError(msg);
    } finally {
      setPhotoSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <PageContainer maxWidth="sm">
        <SectionHeader
          title="Admin portal"
          subtitle="Sign in with admin credentials from the server configuration."
        />
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoginError(null)}>
              {loginError}
            </Alert>
          )}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
              Sign in
            </Button>
          </Box>
        </Paper>
      </PageContainer>
    );
  }

  const allColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const showDeleteColumn = selectedTable === 'listings' && rows.length > 0;
  const showFeaturedColumn = selectedTable === 'listings' && rows.length > 0;
  const showEditColumn = selectedTable === 'listings' && rows.length > 0;
  const isOpenDispute = currentDispute?.status === 'open';
  const isPreCapture = currentDispute?.order?.status === 'shipped';
  const order = currentDispute?.order;

  return (
    <PageContainer maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <SectionHeader
          title="Admin portal"
          subtitle={
            section === 'tables'
              ? 'Browse database tables. Listings can be deleted from here.'
              : section === 'disputes'
                ? 'Review and resolve buyer disputes.'
                : section === 'photos'
                  ? 'Inspect and reorder listing photos to choose the main image.'
                  : section === 'chat'
                    ? 'Inspect chat threads for moderation.'
                    : 'Approve or reject shop enlistment requests.'
          }
        />
        <Button variant="outlined" size="small" onClick={handleLogout}>
          Log out
        </Button>
      </Box>
      {(dataError || disputesError || resolveError) && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => {
            setDataError(null);
            setDisputesError(null);
            setResolveError(null);
          }}
        >
          {dataError || disputesError || resolveError}
        </Alert>
      )}
      {isLoggedIn && discounts !== null && discounts.limit > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Discounts left (free seller commission)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            First {discounts.limit} orders on the platform have no seller commission. {discounts.discountsLeft} left.
          </Typography>
          <LinearProgress
            variant="determinate"
            value={discounts.limit > 0 ? (discounts.used / discounts.limit) * 100 : 0}
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {discounts.used} of {discounts.limit} used ({discounts.totalOrders} total orders)
          </Typography>
        </Paper>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          minHeight: 0,
        }}
      >
        <Paper
          sx={{
            width: { xs: '100%', md: 260 },
            flexShrink: 0,
            borderRadius: 3,
            overflow: 'hidden',
          }}
          elevation={0}
          variant="outlined"
        >
          <List dense sx={{ py: 0 }}>
            <ListItemButton
              selected={section === 'tables'}
              onClick={() => setSection('tables')}
              sx={{ borderRadius: 0 }}
            >
              <TableChartOutlinedIcon sx={{ mr: 1.5, color: section === 'tables' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Data tables" secondary="Users, listings, orders…" />
            </ListItemButton>
            <ListItemButton
              selected={section === 'disputes'}
              onClick={() => setSection('disputes')}
              sx={{ borderRadius: 0 }}
            >
              <GavelOutlinedIcon sx={{ mr: 1.5, color: section === 'disputes' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Disputes" secondary="Resolve refunds" />
            </ListItemButton>
            <ListItemButton
              selected={section === 'photos'}
              onClick={() => setSection('photos')}
              sx={{ borderRadius: 0 }}
            >
              <PhotoLibraryOutlinedIcon sx={{ mr: 1.5, color: section === 'photos' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Listing photos" secondary="Choose main image" />
            </ListItemButton>
            <ListItemButton
              selected={section === 'chat'}
              onClick={() => setSection('chat')}
              sx={{ borderRadius: 0 }}
            >
              <ChatOutlinedIcon sx={{ mr: 1.5, color: section === 'chat' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Chat" secondary="Inspect messages" />
            </ListItemButton>
            <ListItemButton
              selected={section === 'shops'}
              onClick={() => setSection('shops')}
              sx={{ borderRadius: 0 }}
            >
              <StorefrontOutlinedIcon sx={{ mr: 1.5, color: section === 'shops' ? 'primary.main' : 'text.secondary' }} />
              <ListItemText primary="Shops" secondary="Approve shop requests" />
            </ListItemButton>
          </List>
          {section === 'tables' && (
            <>
              <Divider />
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Table
                </Typography>
              </Box>
              {loadingTables ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {tables.map((name) => (
                    <ListItemButton
                      key={name}
                      selected={name === selectedTable}
                      onClick={() => setSelectedTable(name)}
                      sx={{ py: 0.75 }}
                    >
                      <ListItemText primary={name} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItemButton>
                  ))}
                  {tables.length === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No tables available.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </>
          )}
          {section === 'chat' && (
            <>
              <Divider />
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Conversations
                </Typography>
              </Box>
              {chatConversationsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {chatConversations.map((c) => {
                    const names = c.participants.map((p) => p.name).join(', ');
                    const listingLabel = c.listing?.title ? ` – ${c.listing.title}` : '';
                    return (
                      <ListItemButton
                        key={c.id}
                        selected={c.id === selectedConversationId}
                        onClick={() => setSelectedConversationId(c.id)}
                        sx={{ py: 0.75 }}
                      >
                        <ListItemText
                          primary={names + listingLabel}
                          secondary={new Date(c.updated_at).toLocaleString()}
                          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    );
                  })}
                  {chatConversations.length === 0 && !chatConversationsLoading && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No conversations.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </>
          )}
          {section === 'shops' && (
            <>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={adminShopsStatusFilter}
                    label="Filter"
                    onChange={(e) => setAdminShopsStatusFilter(e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="">All</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {adminShopsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {adminShops.map((shop) => (
                    <ListItemButton
                      key={shop.id}
                      sx={{ py: 0.75 }}
                    >
                      <ListItemText
                        primary={shop.name}
                        secondary={shop.ownerEmail ?? shop.ownerName}
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  ))}
                  {adminShops.length === 0 && !adminShopsLoading && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No shops found.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </>
          )}

          {section === 'disputes' && (
            <>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Status
                </Typography>
                <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                  <InputLabel>Filter</InputLabel>
                  <Select
                    value={disputeStatusFilter}
                    label="Filter"
                    onChange={(e) => setDisputeStatusFilter(e.target.value)}
                  >
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="resolved_buyer">Resolved (buyer)</MenuItem>
                    <MenuItem value="resolved_seller">Resolved (seller)</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="">All</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {disputesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {disputes.map((d) => (
                    <ListItemButton
                      key={d.id}
                      selected={d.id === selectedDisputeId}
                      onClick={() => setSelectedDisputeId(d.id)}
                      sx={{ py: 0.75 }}
                    >
                      <ListItemText
                        primary={d.order?.listing?.title ?? `Order ${(d.order_id || d.order?.id || '').slice(0, 8)}`}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <Chip size="small" label={d.status} sx={{ height: 18, fontSize: '0.7rem' }} />
                          </Box>
                        }
                        primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                      />
                    </ListItemButton>
                  ))}
                  {disputes.length === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No disputes found.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}
            </>
          )}
        </Paper>

        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: isMobile ? 400 : 0,
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          elevation={0}
          variant="outlined"
        >
          {section === 'tables' && (
            <>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedTable || 'Select a table'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTable
                      ? [
                          tableCount != null
                            ? `Total: ${tableCount}${tableCount > tableLimit ? ` (showing ${rows.length})` : ''}`
                            : loadingTableCount
                              ? 'Total: …'
                              : undefined,
                          `Up to ${tableLimit} rows. Listings table supports delete.`,
                        ]
                          .filter(Boolean)
                          .join(' • ')
                      : 'Choose a table from the sidebar.'}
                  </Typography>
                </Box>
                {selectedTable && (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Rows</InputLabel>
                    <Select
                      value={String(tableLimit)}
                      label="Rows"
                      onChange={(e) => setTableLimit(Number(e.target.value))}
                    >
                      <MenuItem value="25">25</MenuItem>
                      <MenuItem value="50">50</MenuItem>
                      <MenuItem value="100">100</MenuItem>
                      <MenuItem value="200">200</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Manual capture (orders)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Enter an order ID to capture the buyer payment manually after shipment.
                </Typography>
                <Box
                  component="form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!token || !captureOrderId.trim()) return;
                    setCaptureLoading(true);
                    setCaptureMessage(null);
                    try {
                      const { data } = await api.post(
                        `/admin/orders/${encodeURIComponent(captureOrderId.trim())}/capture`,
                        {},
                        { headers: adminHeaders(token) },
                      );
                      setCaptureMessage(`Captured successfully. New status: ${data.status}`);
                    } catch (err: any) {
                      const msg =
                        err?.response?.data?.message || err?.message || 'Failed to capture payment';
                      setCaptureMessage(msg);
                    } finally {
                      setCaptureLoading(false);
                    }
                  }}
                >
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Order ID"
                        value={captureOrderId}
                        onChange={(e) => setCaptureOrderId(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="small"
                        disabled={captureLoading || !captureOrderId.trim()}
                      >
                        {captureLoading ? 'Capturing…' : 'Capture payment'}
                      </Button>
                    </Grid>
                  </Grid>
                  {captureMessage && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {captureMessage}
                    </Typography>
                  )}
                </Box>
              </Box>
              {loadingRows ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : rows.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No data for this table.
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    maxHeight: { xs: 'none', md: 'calc(100vh - 320px)' },
                    overflowX: 'auto',
                    overflowY: { md: 'auto' },
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 640 }}>
                    <TableHead>
                      <TableRow>
                        {allColumns.map((col) => (
                          <TableCell
                            key={col}
                            sx={{
                              fontWeight: 600,
                              bgcolor: 'background.default',
                              minWidth: col === 'id' ? 80 : col === 'email' ? 140 : 90,
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {col}
                          </TableCell>
                        ))}
                        {showFeaturedColumn && (
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', width: 100 }}>
                            Featured
                          </TableCell>
                        )}
                        {showEditColumn && (
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', width: 120 }}>
                            Edit text
                          </TableCell>
                        )}
                        {showDeleteColumn && (
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', width: 72 }}>
                            Actions
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, idx) => {
                        const id = row.id as string | undefined;
                        const isFeatured = Boolean((row as any).is_featured);
                        return (
                          <TableRow key={id || idx} hover>
                            {allColumns.map((col) => {
                              const val = row[col];
                              const isDate =
                                typeof val === 'string' &&
                                /^\d{4}-\d{2}-\d{2}/.test(val) &&
                                (col.includes('_at') || col.includes('_since') || col === 'created_at' || col === 'updated_at');
                              const display =
                                typeof val === 'object' && val !== null
                                  ? JSON.stringify(val).slice(0, 80) + (JSON.stringify(val).length > 80 ? '…' : '')
                                  : isDate
                                    ? new Date(val as string).toLocaleString()
                                    : String(val ?? '');
                              const fullText =
                                typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
                              return (
                                <TableCell
                                  key={col}
                                  sx={{
                                    maxWidth: 200,
                                    minWidth: col === 'id' ? 80 : col === 'email' ? 140 : 90,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={fullText}
                                >
                                  {display}
                                </TableCell>
                              );
                            })}
                            {showFeaturedColumn && (
                              <TableCell>
                                <Button
                                  size="small"
                                  variant={isFeatured ? 'contained' : 'outlined'}
                                  color={isFeatured ? 'secondary' : 'inherit'}
                                  disabled={!id}
                                  onClick={async () => {
                                    if (!token || !id) return;
                                    try {
                                      const { data } = await api.patch<{ id: string; isFeatured: boolean }>(
                                        `/admin/listings/${id}/featured`,
                                        { isFeatured: !isFeatured },
                                        { headers: adminHeaders(token) },
                                      );
                                      setRows((prev) =>
                                        prev.map((r) =>
                                          (r.id as string) === data.id ? { ...r, is_featured: data.isFeatured } : r,
                                        ),
                                      );
                                    } catch (err: any) {
                                      const msg =
                                        err?.response?.data?.message || err?.message || 'Failed to update featured flag';
                                      setDataError(msg);
                                    }
                                  }}
                                >
                                  {isFeatured ? 'Yes' : 'No'}
                                </Button>
                              </TableCell>
                            )}
                            {showEditColumn && (
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={!id}
                                  onClick={() => {
                                    if (!id) return;
                                    const currentTitle = String((row as any).title ?? '');
                                    const currentDescription = String((row as any).description ?? '');
                                    setEditingListing({ id, title: currentTitle, description: currentDescription });
                                    setEditTitle(currentTitle);
                                    setEditDescription(currentDescription);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            )}
                            {showDeleteColumn && (
                              <TableCell>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteListingClick(row)}
                                  title="Delete listing"
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {section === 'chat' && (
            <>
              {!selectedConversationId ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a conversation from the list to view the message thread.
                  </Typography>
                </Box>
              ) : chatMessagesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Message thread
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => setSelectedConversationId(null)}>
                      Back to list
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Conversation ID: {selectedConversationId}
                  </Typography>
                  {chatMessages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No messages in this conversation.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {chatMessages.map((msg) => (
                        <Paper
                          key={msg.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {msg.sender.name} ({msg.sender.email}) · {new Date(msg.created_at).toLocaleString()}
                          </Typography>
                          {msg.body && (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {msg.body}
                            </Typography>
                          )}
                          {msg.image_url && (
                            <Box
                              component="img"
                              src={msg.image_url}
                              alt=""
                              sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, mt: 1 }}
                            />
                          )}
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}

          {section === 'disputes' && (
            <>
              {!selectedDisputeId ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a dispute from the list to view details and resolve.
                  </Typography>
                </Box>
              ) : currentDisputeLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : currentDispute ? (
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Dispute details
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => setSelectedDisputeId(null)}>
                      Back to list
                    </Button>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                          Dispute
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                          <Chip size="small" label={currentDispute.status} color={currentDispute.status === 'open' ? 'warning' : 'default'} />
                          {currentDispute.type && <Chip size="small" label={currentDispute.type} variant="outlined" />}
                        </Box>
                        <Typography variant="body2">
                          <strong>Reason:</strong> {currentDispute.reason}
                        </Typography>
                        {currentDispute.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {currentDispute.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                          Created {new Date(currentDispute.created_at).toLocaleString()}
                        </Typography>
                        {currentDispute.resolution_notes && (
                          <Typography variant="body2" sx={{ mt: 1.5 }}>
                            <strong>Resolution notes:</strong> {currentDispute.resolution_notes}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                          Order
                        </Typography>
                        {order ? (
                          <>
                            <Typography variant="body2">
                              <strong>Order ID:</strong> {order.id}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Status:</strong> {order.status}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Amount:</strong> {(order.price_cents / 100).toFixed(2)} EUR
                            </Typography>
                            <Typography variant="body2">
                              <strong>Buyer:</strong> {order.buyer?.name} ({order.buyer?.email})
                            </Typography>
                            <Typography variant="body2">
                              <strong>Seller:</strong> {order.seller?.name} ({order.seller?.email})
                            </Typography>
                            <Typography variant="body2">
                              <strong>Shipping:</strong> {order.shipping_full_name}, {order.shipping_city},{' '}
                              {order.shipping_address_line}
                            </Typography>
                            {order.listing && (
                              <Typography variant="body2">
                                <strong>Listing:</strong> {order.listing.title}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No order data.
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    {isOpenDispute && (
                      <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            Resolve dispute
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Resolution notes (optional)"
                            value={resolveNotes}
                            onChange={(e) => setResolveNotes(e.target.value)}
                            sx={{ mb: 2 }}
                          />
                          {isPreCapture && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Pre-capture: payment not yet captured. You can release funds to seller or cancel (refund buyer).
                            </Typography>
                          )}
                          {!isPreCapture && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Post-capture: payment already captured. You can refund buyer (full or partial).
                            </Typography>
                          )}
                          {!isPreCapture && (
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TextField
                                size="small"
                                type="number"
                                label="Partial refund (EUR)"
                                value={partialAmount}
                                onChange={(e) => setPartialAmount(e.target.value)}
                                placeholder="e.g. 50"
                                sx={{ width: 160 }}
                              />
                              <Button
                                variant="outlined"
                                color="secondary"
                                disabled={resolveLoading}
                                onClick={() => handleResolve('partial_refund')}
                              >
                                Partial refund
                              </Button>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(isPreCapture ? ['seller_payout', 'buyer_refund'] : ['buyer_refund', 'no_refund']).map(
                              (outcome) => (
                                <Button
                                  key={outcome}
                                  variant="contained"
                                  disabled={resolveLoading}
                                  onClick={() =>
                                    handleResolve(
                                      outcome as 'buyer_refund' | 'seller_payout' | 'no_refund' | 'partial_refund'
                                    )
                                  }
                                >
                                  {resolveLoading ? (
                                    <CircularProgress size={20} color="inherit" />
                                  ) : outcome === 'seller_payout' ? (
                                    'Release funds to seller'
                                  ) : outcome === 'buyer_refund' ? (
                                    'Refund buyer'
                                  ) : outcome === 'no_refund' ? (
                                    'No refund (close dispute)'
                                  ) : (
                                    outcome
                                  )}
                                </Button>
                              )
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ p: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Dispute not found.
                  </Typography>
                </Box>
              )}
            </>
          )}

          {section === 'photos' && (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Listing photos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Enter a listing ID to load its photos, then choose which one should appear as the main image.
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                <TextField
                  label="Listing ID"
                  size="small"
                  value={photoListingId}
                  onChange={(e) => setPhotoListingId(e.target.value)}
                  sx={{ minWidth: 260 }}
                />
                <Button
                  variant="contained"
                  onClick={loadListingPhotos}
                  disabled={photoLoading || !photoListingId.trim()}
                >
                  {photoLoading ? <CircularProgress size={20} color="inherit" /> : 'Load photos'}
                </Button>
              </Box>
              {photoImages.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Photos for listing <strong>{photoListingId}</strong>
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 1,
                    }}
                  >
                    {photoImages.map((img, index) => (
                      <Box
                        key={img.id}
                        sx={{
                          width: 120,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: index === 0 ? 'primary.main' : 'divider',
                          overflow: 'hidden',
                          position: 'relative',
                          bgcolor: 'background.default',
                        }}
                      >
                        <Box
                          component="img"
                          src={img.url}
                          alt=""
                          sx={{
                            width: '100%',
                            height: 140,
                            objectFit: 'cover',
                          }}
                        />
                        {index === 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 999,
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                            }}
                          >
                            Main
                          </Box>
                        )}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 0.75,
                            py: 0.5,
                            gap: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            #{index + 1}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                            <IconButton
                              size="small"
                              onClick={() => movePhoto(index, 'left')}
                              disabled={index === 0}
                            >
                              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => movePhoto(index, 'right')}
                              disabled={index === photoImages.length - 1}
                            >
                              <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </Box>
                        <Button
                          onClick={() => handleSetMainImage(index)}
                          size="small"
                          fullWidth
                          variant={index === 0 ? 'outlined' : 'text'}
                          sx={{ borderTop: '1px solid', borderColor: 'divider', borderRadius: 0 }}
                        >
                          Set as main
                        </Button>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSavePhotoOrder}
                      disabled={photoSaving || photoImages.length === 0}
                    >
                      {photoSaving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Save image order'
                      )}
                    </Button>
                  </Box>
                </>
              )}
              {!photoLoading && photoImages.length === 0 && photoListingId.trim() && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No photos loaded for this listing yet. Check the ID and try again.
                </Typography>
              )}
            </Box>
          )}

          {section === 'shops' && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Shop requests
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Approve or reject shops that have applied to list on the platform. Only pending shops can be approved or rejected.
              </Typography>
              {adminShopsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : adminShops.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No shops found for the selected filter.
                </Typography>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 560 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default' }}>Slug</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default' }}>Owner</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default' }}>Created</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adminShops.map((shop) => (
                        <TableRow key={shop.id} hover>
                          <TableCell>{shop.name}</TableCell>
                          <TableCell>{shop.slug}</TableCell>
                          <TableCell>
                            {shop.ownerName}
                            {shop.ownerEmail && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {shop.ownerEmail}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={shop.status} color={shop.status === 'pending' ? 'warning' : shop.status === 'approved' ? 'success' : 'default'} />
                          </TableCell>
                          <TableCell>{new Date(shop.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {shop.status === 'pending' && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  disabled={shopActionId === shop.id}
                                  onClick={async () => {
                                    if (!token) return;
                                    setShopActionId(shop.id);
                                    try {
                                      await api.patch(
                                        `/admin/shops/${shop.id}/status`,
                                        { status: 'approved' },
                                        { headers: adminHeaders(token) }
                                      );
                                      loadAdminShops(token);
                                    } catch (err: any) {
                                      setDataError(err?.response?.data?.message || err?.message || 'Failed to approve');
                                    } finally {
                                      setShopActionId(null);
                                    }
                                  }}
                                >
                                  {shopActionId === shop.id ? <CircularProgress size={18} color="inherit" /> : 'Approve'}
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  disabled={shopActionId === shop.id}
                                  onClick={async () => {
                                    if (!token) return;
                                    setShopActionId(shop.id);
                                    try {
                                      await api.patch(
                                        `/admin/shops/${shop.id}/status`,
                                        { status: 'rejected' },
                                        { headers: adminHeaders(token) }
                                      );
                                      loadAdminShops(token);
                                    } catch (err: any) {
                                      setDataError(err?.response?.data?.message || err?.message || 'Failed to reject');
                                    } finally {
                                      setShopActionId(null);
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete listing?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {listingToDelete
              ? `This will permanently delete the listing "${listingToDelete.title}". This cannot be undone.`
              : 'Permanently delete this listing?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={!!deletingId}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteListingConfirm} disabled={!!deletingId}>
            {deletingId ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => {
          if (!editSaving) {
            setEditDialogOpen(false);
            setEditingListing(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit listing text</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the title and description to remove disruptive or vulgar language. Changes apply immediately.
          </DialogContentText>
          <TextField
            fullWidth
            margin="normal"
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            multiline
            minRows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (!editSaving) {
                setEditDialogOpen(false);
                setEditingListing(null);
              }
            }}
            disabled={editSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!token || !editingListing) return;
              const payload: { title?: string; description?: string } = {};
              if (editTitle.trim() !== editingListing.title) {
                payload.title = editTitle.trim();
              }
              if (editDescription.trim() !== editingListing.description) {
                payload.description = editDescription.trim();
              }
              if (!payload.title && !payload.description) {
                setEditDialogOpen(false);
                setEditingListing(null);
                return;
              }
              setEditSaving(true);
              setDataError(null);
              try {
                const { data } = await api.patch<{ id: string; title: string; description: string }>(
                  `/admin/listings/${editingListing.id}/text`,
                  payload,
                  { headers: adminHeaders(token) },
                );
                setRows((prev) =>
                  prev.map((r) =>
                    (r.id as string) === data.id ? { ...r, title: data.title, description: data.description } : r,
                  ),
                );
                setEditDialogOpen(false);
                setEditingListing(null);
              } catch (err: any) {
                const msg =
                  err?.response?.data?.message ||
                  err?.message ||
                  'Failed to update listing text';
                setDataError(msg);
              } finally {
                setEditSaving(false);
              }
            }}
            disabled={editSaving}
          >
            {editSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default AdminPortal;
