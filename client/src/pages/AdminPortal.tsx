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
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
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

  const [section, setSection] = useState<'tables' | 'disputes'>('tables');
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

  const isLoggedIn = !!token;

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

  const loadRows = async (table: string, currentToken: string) => {
    setLoadingRows(true);
    setDataError(null);
    try {
      const { data } = await api.get<{ rows: TableRowData[] }>(`/admin/tables/${table}`, {
        headers: adminHeaders(currentToken),
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

  useEffect(() => {
    if (token && selectedTable && section === 'tables') {
      loadRows(selectedTable, token);
    }
  }, [token, selectedTable, section]);

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
              : 'Review and resolve buyer disputes.'
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
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Paper sx={{ width: 260, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }} elevation={0} variant="outlined">
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

        <Paper sx={{ flex: 1, minWidth: 0, borderRadius: 3, overflow: 'hidden' }} elevation={0} variant="outlined">
          {section === 'tables' && (
            <>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedTable || 'Select a table'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTable ? 'Up to 50 rows. Listings table supports delete.' : 'Choose a table from the sidebar.'}
                </Typography>
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
                <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {allColumns.map((col) => (
                          <TableCell key={col} sx={{ fontWeight: 600, bgcolor: 'background.default' }}>
                            {col}
                          </TableCell>
                        ))}
                        {showDeleteColumn && (
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', width: 72 }}>
                            Actions
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={(row.id as string) || idx} hover>
                          {allColumns.map((col) => {
                            const val = row[col];
                            const isDate =
                              typeof val === 'string' &&
                              /^\d{4}-\d{2}-\d{2}/.test(val) &&
                              (col.includes('_at') || col.includes('_since') || col === 'created_at' || col === 'updated_at');
                            return (
                              <TableCell key={col} sx={{ maxWidth: 200 }}>
                                {typeof val === 'object' && val !== null
                                  ? JSON.stringify(val).slice(0, 80) + (JSON.stringify(val).length > 80 ? '…' : '')
                                  : isDate
                                    ? new Date(val as string).toLocaleString()
                                    : String(val ?? '')}
                              </TableCell>
                            );
                          })}
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
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
    </PageContainer>
  );
};

export default AdminPortal;
