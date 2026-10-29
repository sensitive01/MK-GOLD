import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import moment from 'moment';
// @mui
import {
  Box,
  Card,
  Table,
  Stack,
  Avatar,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Tooltip,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import SearchIcon from '@mui/icons-material/Search';
import LaptopIcon from '@mui/icons-material/Laptop';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LoginIcon from '@mui/icons-material/Login';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockClockIcon from '@mui/icons-material/LockClock';

// components
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';

// API
import { getLoginLogs, getLoginLogStats } from '../../apis/admin/loginLog';

// ----------------------------------------------------------------------

const USER_ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'branch', label: 'Branch' },
  { value: 'branch-manager', label: 'Branch Manager' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'employee', label: 'Employee' },
  { value: 'bullion-desk', label: 'Bullion Desk' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'marketing-desk', label: 'Marketing Desk' },
  { value: 'telecaller', label: 'Telecaller' },
  { value: 'admin-desk', label: 'Admin Desk' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'melting', label: 'Melting' },
  { value: 'store', label: 'Store' },
];

function getDeviceIcon(deviceType) {
  const type = String(deviceType || '').toLowerCase();
  if (type === 'mobile') return <SmartphoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.8 }} />;
  if (type === 'tablet') return <TabletMacIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.8 }} />;
  if (type === 'desktop') return <LaptopIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.8 }} />;
  return <DevicesOtherIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.8 }} />;
}

export default function LoginLogs({ embedded = false }) {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [userType, setUserType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalToday: 0,
    successToday: 0,
    failedToday: 0,
    uniqueUsersToday: 0,
    allTimeCount: 0,
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await getLoginLogStats();
      if (res && res.status && res.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch login log stats:', e);
    }
  }, []);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        userType: userType !== 'all' ? userType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await getLoginLogs(query);
      if (res && res.status && res.data) {
        setLogs(res.data.logs || []);
        setTotalCount(res.data.totalCount || 0);
      } else {
        setLogs([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch login logs:', err);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, status, userType, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchStats();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('all');
    setUserType('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    search || status !== 'all' || userType !== 'all' || startDate || endDate
  );

  const content = (
    <>
      {/* 1. Summary Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              boxShadow: 2,
              borderRadius: 2,
              borderLeft: '5px solid #1976d2',
            }}
          >
            <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', width: 48, height: 48, mr: 2 }}>
              <LoginIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Logins Today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {stats.totalToday || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              boxShadow: 2,
              borderRadius: 2,
              borderLeft: '5px solid #2e7d32',
            }}
          >
            <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', width: 48, height: 48, mr: 2 }}>
              <CheckCircleIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Successful Today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                {stats.successToday || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              boxShadow: 2,
              borderRadius: 2,
              borderLeft: '5px solid #d32f2f',
            }}
          >
            <Avatar sx={{ bgcolor: '#ffebee', color: '#d32f2f', width: 48, height: 48, mr: 2 }}>
              <CancelIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Failed Attempts Today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                {stats.failedToday || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              boxShadow: 2,
              borderRadius: 2,
              borderLeft: '5px solid #7b1fa2',
            }}
          >
            <Avatar sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', width: 48, height: 48, mr: 2 }}>
              <PeopleAltIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Unique Users Today
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                {stats.uniqueUsersToday || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* 2. Filter Toolbar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search user, name, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Role"
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setPage(0);
              }}
            >
              {USER_ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              type="date"
              size="small"
              label="From Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              type="date"
              size="small"
              label="To Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh Logs">
              <IconButton color="primary" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {hasActiveFilters && (
              <Tooltip title="Reset Filters">
                <IconButton color="error" onClick={handleResetFilters}>
                  <FilterAltOffIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>
      </Card>

      {/* 3. Data Table */}
      <Card>
        <TableContainer sx={{ minWidth: 900, position: 'relative' }}>
          <Scrollbar>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.neutral' }}>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Device & Model</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Browser & OS</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Login Time</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={36} />
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Loading login records...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography variant="h6" color="text.secondary">
                        No login records found
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {hasActiveFilters ? 'Try adjusting your search filters' : 'Login attempts will appear here automatically'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((row) => {
                    const isSuccess = row.status === 'success';
                    return (
                      <TableRow key={row._id} hover>
                        {/* User & Employee */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: '0.9rem',
                                bgcolor: isSuccess ? 'primary.main' : 'error.main',
                              }}
                            >
                              {(row.username || 'U')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                                {row.username}
                              </Typography>
                              {row.name && row.name !== row.username && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {row.name}
                                </Typography>
                              )}
                              {row.branchName && (
                                <Typography variant="caption" display="block" color="text.disabled">
                                  {row.branchName}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.userType ? row.userType.toUpperCase() : 'UNKNOWN'}
                            variant="outlined"
                            sx={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {isSuccess ? (
                            <Label color="success" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                              SUCCESS
                            </Label>
                          ) : (
                            <Tooltip title={row.failureReason || 'Failed Login Attempt'} arrow>
                              <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
                                <Label color="error" sx={{ textTransform: 'uppercase', fontWeight: 700, cursor: 'help' }}>
                                  FAILED
                                </Label>
                                {row.failureReason && (
                                  <Typography
                                    variant="caption"
                                    color="error.main"
                                    sx={{
                                      mt: 0.5,
                                      maxWidth: 140,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {row.failureReason}
                                  </Typography>
                                )}
                              </Box>
                            </Tooltip>
                          )}
                        </TableCell>

                        {/* Device & Model */}
                        <TableCell>
                          <Stack direction="row" alignItems="center">
                            {getDeviceIcon(row.deviceType)}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {row.deviceModel || 'Unknown Device'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.deviceType || 'Desktop'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Browser & OS */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {row.browser || 'Unknown'} {row.browserVersion ? `v${row.browserVersion}` : ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.os || 'Unknown OS'}
                          </Typography>
                        </TableCell>

                        {/* IP Address */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {row.ipAddress || '-'}
                          </Typography>
                        </TableCell>

                        {/* Login Method */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {row.loginMethod === 'otp' ? (
                              <LockClockIcon fontSize="small" sx={{ color: 'warning.main' }} />
                            ) : (
                              <VpnKeyIcon fontSize="small" sx={{ color: 'info.main' }} />
                            )}
                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                              {row.loginMethod || 'Password'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Login Time */}
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {moment(row.createdAt).format('DD/MM/YYYY')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {moment(row.createdAt).format('hh:mm:ss A')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <Helmet>
        <title> Login Logs | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
            Login Logs
          </Typography>
        </Stack>

        {content}
      </Container>
    </>
  );
}

