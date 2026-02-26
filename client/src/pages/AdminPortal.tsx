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
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import api from '@/api/axios';

interface TableRowData {
  [key: string]: any;
}

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

  const isLoggedIn = !!token;

  const loadTables = async (currentToken: string) => {
    setLoadingTables(true);
    setDataError(null);
    try {
      const { data } = await api.get<{ tables: string[] }>('/admin/tables', {
        headers: { 'X-Admin-Token': currentToken },
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
        headers: { 'X-Admin-Token': currentToken },
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

  useEffect(() => {
    if (token) {
      loadTables(token);
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedTable) {
      loadRows(selectedTable, token);
    }
  }, [token, selectedTable]);

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
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Sign in
            </Button>
          </Box>
        </Paper>
      </PageContainer>
    );
  }

  const columns =
    rows.length > 0
      ? Object.keys(rows[0])
      : [];

  return (
    <PageContainer maxWidth="lg">
      <SectionHeader
        title="Admin portal"
        subtitle="Read-only view of core database tables."
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Environment-based admin access. Make sure ADMIN_USERNAME / ADMIN_PASSWORD are set on the backend.
        </Typography>
        <Button variant="outlined" size="small" onClick={handleLogout}>
          Log out
        </Button>
      </Box>
      {dataError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDataError(null)}>
          {dataError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ width: 220, flexShrink: 0, borderRadius: 3, overflow: 'hidden' }}>
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
        </Paper>

        <Paper sx={{ flex: 1, borderRadius: 3, p: 2 }}>
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
        </Paper>
      </Box>
    </PageContainer>
  );
};

export default AdminPortal;

