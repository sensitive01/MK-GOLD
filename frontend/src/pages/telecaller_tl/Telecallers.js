import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import moment from 'moment';
import { sentenceCase } from 'change-case';
// @mui
import {
  Container,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Box,
  TextField,
  InputAdornment,
  TablePagination,
  Grid,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  Switch,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
// components
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import Label from '../../components/label';
// apis
import { getUser, updateUser } from '../../apis/branch/user';

// ----------------------------------------------------------------------

export default function Telecallers({ role = 'Telecaller-TL' }) {
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  const [confirmModal, setConfirmModal] = useState({ open: false, telecaller: null });

  const fetchTelecallers = async () => {
    setLoading(true);
    try {
      // Fetch users with userType telecalling
      const res = await getUser({ userType: 'telecalling' });
      if (res?.status && Array.isArray(res.data)) {
        setTelecallers(res.data);
      } else if (Array.isArray(res)) {
        setTelecallers(res);
      } else {
        setTelecallers([]);
      }
    } catch (err) {
      console.error('Error fetching telecallers:', err);
      setTelecallers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelecallers();
  }, []);

  // Update Telecaller Status (Active / Inactive)
  const performStatusUpdate = async (id, newStatus, telecallerName) => {
    setUpdatingId(id);
    try {
      const res = await updateUser(id, { status: newStatus });
      if (res && res.status !== false) {
        setTelecallers((prev) =>
          prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t))
        );

        if (newStatus === 'active') {
          setNotify({
            open: true,
            message: `${telecallerName} is now ACTIVE. Login enabled & leads will be assigned.`,
            severity: 'success',
          });
        } else {
          setNotify({
            open: true,
            message: `${telecallerName} is now INACTIVE. Logged out & leads will NOT be assigned.`,
            severity: 'warning',
          });
        }
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to update telecaller status.',
          severity: 'error',
        });
      }
    } catch (err) {
      console.error('Error updating telecaller status:', err);
      setNotify({
        open: true,
        message: 'Network error while updating telecaller status.',
        severity: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleClick = (row, currentStatus) => {
    const empName = row?.employee?.name || row?.username || 'Telecaller';
    if (currentStatus === 'active') {
      // Opening confirmation when deactivating to prevent accidental logout
      setConfirmModal({ open: true, telecaller: row });
    } else {
      // Directly activate when toggled on
      performStatusUpdate(row._id, 'active', empName);
    }
  };

  // Filter and search
  const filteredTelecallers = useMemo(() => {
    return telecallers.filter((row) => {
      const name = (row?.employee?.name || '').toLowerCase();
      const empId = (row?.employee?.employeeId || '').toLowerCase();
      const phone = (row?.employee?.phoneNumber || row?.username || '').toLowerCase();
      const username = (row?.username || '').toLowerCase();
      const branchName = (row?.branch?.branchName || '').toLowerCase();
      const query = filterName.toLowerCase().trim();

      const matchesQuery =
        !query ||
        name.includes(query) ||
        empId.includes(query) ||
        phone.includes(query) ||
        username.includes(query) ||
        branchName.includes(query);

      const status = (row?.status || 'active').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && status === 'active') ||
        (statusFilter === 'inactive' && status !== 'active');

      return matchesQuery && matchesStatus;
    });
  }, [telecallers, filterName, statusFilter]);

  // Counts
  const totalCount = telecallers.length;
  const activeCount = telecallers.filter((t) => (t?.status || 'active').toLowerCase() === 'active').length;
  const inactiveCount = totalCount - activeCount;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const isNotFound = !filteredTelecallers.length && !!filterName;

  return (
    <>
      <Helmet>
        <title> Telecallers | {role} | MK Gold </title>
      </Helmet>

      {/* Snackbar feedback */}
      <Snackbar
        open={notify.open}
        autoHideDuration={5000}
        onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotify({ ...notify, open: false })}
          severity={notify.severity}
          sx={{ width: '100%', boxShadow: 4, fontWeight: 600 }}
        >
          {notify.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl">
        {/* Header Section */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          mb={4}
          spacing={2}
        >
          <div>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
              Telecallers Team
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
              Manage telecaller status, active logins, and lead assignment permissions
            </Typography>
          </div>

          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:refresh-fill" />}
            onClick={fetchTelecallers}
            sx={{
              bgcolor: '#fff',
              color: '#7b1fa2',
              fontWeight: 700,
              boxShadow: 2,
              '&:hover': { bgcolor: '#f3e5f5' },
            }}
          >
            Refresh
          </Button>
        </Stack>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#ede7f6',
                  color: '#7b1fa2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="eva:people-fill" width={26} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Telecallers
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#e8f5e9',
                  color: '#2e7d32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="eva:checkmark-circle-2-fill" width={26} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                  {activeCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Active Telecallers
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#ffebee',
                  color: '#d32f2f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="eva:close-circle-fill" width={26} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                  {inactiveCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Inactive Telecallers
                </Typography>
              </div>
            </Card>
          </Grid>
        </Grid>

        {/* Main Table Card */}
        <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
          {/* Toolbar: Filters & Search */}
          <Box sx={{ p: 2.5, borderBottom: '1px solid #f0f0f0' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              {/* Status Filter Buttons */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                  color={statusFilter === 'all' ? 'primary' : 'inherit'}
                  onClick={() => { setStatusFilter('all'); setPage(0); }}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  All ({totalCount})
                </Button>
                <Button
                  size="small"
                  variant={statusFilter === 'active' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => { setStatusFilter('active'); setPage(0); }}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  Active ({activeCount})
                </Button>
                <Button
                  size="small"
                  variant={statusFilter === 'inactive' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => { setStatusFilter('inactive'); setPage(0); }}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  Inactive ({inactiveCount})
                </Button>
              </Stack>

              {/* Search Field */}
              <TextField
                size="small"
                value={filterName}
                onChange={(e) => { setFilterName(e.target.value); setPage(0); }}
                placeholder="Search telecaller name, phone, emp ID..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 320 } }}
              />
            </Stack>
          </Box>

          {/* Table */}
          <Scrollbar>
            <TableContainer sx={{ minWidth: 900 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#faf5ff' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Telecaller</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Joined Date</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={36} sx={{ color: '#7b1fa2' }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                          Loading telecallers...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filteredTelecallers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => {
                        const empName = row?.employee?.name || row?.username || 'N/A';
                        const empId = row?.employee?.employeeId || '-';
                        const phone = row?.employee?.phoneNumber || row?.username || '-';
                        const username = row?.username || '-';
                        const branchName = row?.branch?.branchName || 'Head Office';
                        const status = row?.status || 'active';
                        const joinedDate = row?.createdAt ? moment(row.createdAt).format('YYYY-MM-DD') : '-';
                        const isUpdating = updatingId === row._id;

                        return (
                          <TableRow hover key={row._id}>
                            <TableCell sx={{ color: 'text.secondary' }}>
                              {page * rowsPerPage + index + 1}
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar
                                  sx={{
                                    bgcolor: status === 'active' ? '#7b1fa2' : '#9e9e9e',
                                    color: '#fff',
                                    width: 36,
                                    height: 36,
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {empName.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {empName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {row?.employee?.designation || 'Telecaller'}
                                  </Typography>
                                </div>
                              </Stack>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={empId}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  bgcolor: '#f3e8ff',
                                  color: '#7b1fa2',
                                  borderRadius: 1,
                                }}
                              />
                            </TableCell>

                            <TableCell sx={{ fontWeight: 600 }}>
                              {phone}
                            </TableCell>

                            <TableCell sx={{ color: 'text.secondary' }}>
                              {username}
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {branchName}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Tooltip
                                  title={
                                    status === 'active'
                                      ? 'ON: Can login & receive leads. Click to turn OFF (logs out & pauses leads).'
                                      : 'OFF: Logged out & no leads assigned. Click to turn ON.'
                                  }
                                  arrow
                                >
                                  <span>
                                    <Switch
                                      checked={status === 'active'}
                                      onChange={() => handleToggleClick(row, status)}
                                      disabled={isUpdating}
                                      color="success"
                                      sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': {
                                          color: '#2e7d32',
                                        },
                                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                          backgroundColor: '#2e7d32',
                                        },
                                      }}
                                    />
                                  </span>
                                </Tooltip>

                                {isUpdating ? (
                                  <CircularProgress size={16} sx={{ color: '#7b1fa2' }} />
                                ) : (
                                  <Label
                                    color={status === 'active' ? 'success' : 'error'}
                                    sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                                  >
                                    {sentenceCase(status)}
                                  </Label>
                                )}
                              </Stack>
                            </TableCell>

                            <TableCell sx={{ color: 'text.secondary' }}>
                              {joinedDate}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                  {!loading && filteredTelecallers.length === 0 && !isNotFound && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 6 }}>
                        <Paper sx={{ textAlign: 'center', boxShadow: 'none' }}>
                          <Iconify icon="eva:people-outline" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            No telecallers found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            No telecalling representatives are currently registered in the system.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && isNotFound && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 6 }}>
                        <Paper sx={{ textAlign: 'center', boxShadow: 'none' }}>
                          <Iconify icon="eva:search-outline" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No telecallers found matching &quot;{filterName}&quot;.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTelecallers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {/* Confirmation Dialog for Deactivation */}
      <Dialog
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, telecaller: null })}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>
          Deactivate Telecaller?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.primary', mb: 2 }}>
            Are you sure you want to turn OFF{' '}
            <strong>
              {confirmModal.telecaller?.employee?.name || confirmModal.telecaller?.username}
            </strong>
            ?
          </DialogContentText>
          <Box sx={{ p: 2, bgcolor: '#fff4e5', borderRadius: 1.5, border: '1px solid #ffe2b3' }}>
            <Typography variant="subtitle2" sx={{ color: '#b76e00', fontWeight: 700, mb: 0.5 }}>
              What happens when turned OFF:
            </Typography>
            <Typography variant="body2" sx={{ color: '#663c00', lineHeight: 1.6 }}>
              • If they are currently logged in, they will be <strong>automatically logged out</strong>.<br />
              • They <strong>will not be able to log in</strong> again until toggled ON.<br />
              • New leads <strong>will NOT be assigned</strong> to them.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setConfirmModal({ open: false, telecaller: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              const row = confirmModal.telecaller;
              const empName = row?.employee?.name || row?.username || 'Telecaller';
              setConfirmModal({ open: false, telecaller: null });
              if (row?._id) {
                performStatusUpdate(row._id, 'inactive', empName);
              }
            }}
          >
            Turn OFF & Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
