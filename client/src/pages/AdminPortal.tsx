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
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import api from '@/api/axios';

interface TableRowData {
  [key: string]: any;
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

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const isOpenDispute = currentDispute?.status === 'open';
  const isPreCapture = currentDispute?.order?.status === 'shipped';
  const order = currentDispute?.order;

  return (
    <PageContainer maxWidth="lg">
      <SectionHeader
        title="Admin portal"
        subtitle={section === 'tables' ? 'Read-only view of core database tables.' : 'Review and resolve buyer disputes.'}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Environment-based admin access. Make sure ADMIN_USERNAME / ADMIN_PASSWORD are set on the backend.
        </Typography>
        <Button variant="outlined" size="small" onClick={handleLogout}>
          Log out
        </Button>
      </Box>
      {(dataError || disputesError || resolveError) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            setDataError(null);
            setDisputesError(null);
            setResolveError(null);
          }}
        >
          {dataError || disputesError || resolveError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ width: 220, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}>
          <List dense>
            <ListItemButton selected={section === 'tables'} onClick={() => setSection('tables')}>
              <ListItemText primary="Tables" />
            </ListItemButton>
            <ListItemButton selected={section === 'disputes'} onClick={() => setSection('disputes')}>
              <ListItemText primary="Disputes" />
            </ListItemButton>
          </List>
          {section === 'tables' && (
            <>
              <Divider />
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Tables
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
                    >
                      <ListItemText primary={name} />
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
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Disputes
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={disputeStatusFilter}
                    label="Status"
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
                    >
                      <ListItemText
                        primary={`${d.order?.id?.slice(0, 8) ?? d.order_id}…`}
                        secondary={d.status}
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

        <Paper sx={{ flex: 1, borderRadius: 3, p: 2 }}>
          {section === 'tables' && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedTable || 'Select a table'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Showing up to 50 rows (read-only)
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {loadingRows ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No data found for this table.
                </Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {columns.map((col) => (
                          <TableCell key={col}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={idx}>
                          {columns.map((col) => (
                            <TableCell key={col}>
                              {typeof row[col] === 'object' && row[col] !== null
                                ? JSON.stringify(row[col])
                                : String(row[col] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </>
          )}

          {section === 'disputes' && (
            <>
              {!selectedDisputeId ? (
                <Typography variant="body2" color="text.secondary">
                  Select a dispute from the list to view details and resolve.
                </Typography>
              ) : currentDisputeLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : currentDispute ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Dispute {currentDispute.id.slice(0, 8)}…
                    </Typography>
                    <Button size="small" onClick={() => setSelectedDisputeId(null)}>
                      Back to list
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Dispute
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong> {currentDispute.status}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Type:</strong> {currentDispute.type ?? '–'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Reason:</strong> {currentDispute.reason}
                        </Typography>
                        {currentDispute.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {currentDispute.description}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Created: {new Date(currentDispute.created_at).toLocaleString()}
                        </Typography>
                        {currentDispute.resolution_notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Resolution notes:</strong> {currentDispute.resolution_notes}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
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
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
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
                <Typography variant="body2" color="text.secondary">
                  Dispute not found.
                </Typography>
              )}
            </>
          )}
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default AdminPortal;
