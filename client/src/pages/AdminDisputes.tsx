import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDisputes, clearError } from '@/features/admin/disputesSlice';
import type { AdminDispute } from '@/features/admin/disputesSlice';

const AdminDisputes: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { list, listStatus, error } = useAppSelector((state) => state.adminDisputes);
  const [statusFilter, setStatusFilter] = React.useState<string>('open');

  useEffect(() => {
    dispatch(fetchDisputes(statusFilter === '' ? undefined : { status: statusFilter }));
  }, [dispatch, statusFilter]);

  return (
    <PageContainer maxWidth="lg">
      <SectionHeader
        title="Disputes"
        subtitle="Review and resolve buyer disputes."
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="resolved_buyer">Resolved (buyer)</MenuItem>
            <MenuItem value="resolved_seller">Resolved (seller)</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="">All</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {listStatus === 'loading' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {listStatus === 'succeeded' && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Listing</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No disputes found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((d: AdminDispute) => (
                  <TableRow
                    key={d.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/disputes/${d.id}`)}
                  >
                    <TableCell>{d.order?.id?.slice(0, 8) ?? d.order_id}</TableCell>
                    <TableCell>{d.order?.buyer?.name ?? d.buyer?.name ?? '-'}</TableCell>
                    <TableCell>{d.order?.seller?.name ?? '-'}</TableCell>
                    <TableCell>{d.order?.listing?.title ?? '-'}</TableCell>
                    <TableCell>{d.status}</TableCell>
                    <TableCell>{d.type ?? '-'}</TableCell>
                    <TableCell>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/disputes/${d.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </PageContainer>
  );
};

export default AdminDisputes;
