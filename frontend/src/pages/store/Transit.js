import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Backdrop,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
  InputAdornment,
  Tooltip,
  FormHelperText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  Grid,
  TextField,
  Alert,
  Chip,
  Checkbox,
  TableHead,
  Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Components
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import { TransitListHead, TransitListToolbar } from '../../sections/@dashboard/transit';
import TransitPrint from '../../components/branch/transit/TransitPrint';

// APIs & Utilities
import {
  deleteTransitById,
  findTransit,
  createTransit,
  batchCreateTransit,
  updateTransit,
  generateTransitId,
} from '../../apis/branch/transit';
import { getBranch } from '../../apis/admin/branch';
import { findSales } from '../../apis/admin/sales';
import { createFile } from '../../apis/branch/fileupload';
import { getTransitMeltingStatus } from '../../utils/transit';
import global from '../../utils/global';

// Autogenerate unique transit ID helper
export const generateRandomTransitId = (existingIds = []) => {
  const existingSet = new Set((existingIds || []).map((id) => String(id).trim().toUpperCase()));
  for (let digits = 4; digits <= 10; digits++) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    for (let attempt = 0; attempt < 50; attempt++) {
      const rand = Math.floor(min + Math.random() * (max - min + 1));
      const candidate = `TR${rand}`;
      if (!existingSet.has(candidate.toUpperCase())) {
        return candidate;
      }
    }
  }
  return `TR${Math.floor(1000 + Math.random() * 9000)}`;
};

// Calculate inclusive number of days from fromDate to toDate
export const calculateTransitDays = (from, to) => {
  if (!from || !to) return '';
  const start = moment(from).startOf('day');
  const end = moment(to).startOf('day');
  if (!start.isValid() || !end.isValid()) return '';
  const diff = end.diff(start, 'days');
  if (diff < 0) return 0;
  return diff + 1;
};

const TABLE_HEAD = [
  { id: 'branch', label: 'Branch', alignRight: false },
  { id: 'transitId', label: 'Transit ID', alignRight: false },
  { id: 'numberOfPackets', label: 'Packets', alignRight: false },
  { id: 'physical', label: 'Physical', alignRight: false },
  { id: 'released', label: 'Released', alignRight: false },
  { id: 'totalNetWeight', label: 'Net Weight (g)', alignRight: false },
  { id: 'deliveryBy', label: 'Delivery By', alignRight: false },
  { id: 'transitMovedThrough', label: 'Mode', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'actions', label: 'Actions', alignRight: true },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query, filters) {
  const stabilizedThis = array?.map((el, index) => [el, index]) || [];
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData = stabilizedThis?.map((el) => el[0]);

  if (query) {
    const qLower = query.toLowerCase();
    filteredData = filter(
      filteredData,
      (row) =>
        row?.transitId?.toLowerCase().indexOf(qLower) !== -1 ||
        row?.deliveryBy?.toLowerCase().indexOf(qLower) !== -1 ||
        row?.branch?.branchName?.toLowerCase().indexOf(qLower) !== -1 ||
        row?.branch?.branchId?.toLowerCase().indexOf(qLower) !== -1 ||
        row?.notes?.toLowerCase().indexOf(qLower) !== -1
    );
  }

  if (filters) {
    if (filters.status && filters.status !== 'all') {
      const sLower = filters.status.toLowerCase();
      if (sLower === 'melted') {
        filteredData = filteredData.filter((row) => getTransitMeltingStatus(row) === 'melted');
      } else if (sLower === 'moved') {
        filteredData = filteredData.filter(
          (row) => row.status?.toLowerCase() === 'moved' && getTransitMeltingStatus(row) !== 'melted'
        );
      } else {
        filteredData = filteredData.filter((row) => row.status?.toLowerCase() === sLower);
      }
    }
    if (filters.branch && filters.branch !== 'all') {
      filteredData = filteredData.filter(
        (row) =>
          row?.branch?._id === filters.branch ||
          row?.branch === filters.branch ||
          String(row?.branch?.branchId || '') === String(filters.branch)
      );
    }
    if (filters.fromDate) {
      filteredData = filteredData.filter((row) =>
        moment(row.createdAt).isSameOrAfter(moment(filters.fromDate), 'day')
      );
    }
    if (filters.toDate) {
      filteredData = filteredData.filter((row) =>
        moment(row.createdAt).isSameOrBefore(moment(filters.toDate), 'day')
      );
    }
  }

  return filteredData;
}

export default function StoreTransit() {
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [verifyTransitId, setVerifyTransitId] = useState(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
    branch: 'all',
  });

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(async () => {
    setOpenBackdrop(true);
    try {
      const res = await findTransit({});
      setData(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching transits:', err);
    } finally {
      setOpenBackdrop(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    getBranch()
      .then((res) => {
        if (Array.isArray(res?.data)) {
          setBranches(res.data);
        }
      })
      .catch((err) => console.error('Error fetching branches:', err));
  }, [fetchData]);

  const handleOpenMenu = (event, id) => {
    setOpenId(id);
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleClearFilters = () => {
    setFilters({ fromDate: '', toDate: '', status: 'all', branch: 'all' });
  };

  const isFilterApplied = Boolean(
    filters.fromDate || filters.toDate || filters.status !== 'all' || filters.branch !== 'all'
  );

  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName, filters);
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const isNotFound = !filteredData?.length && Boolean(filterName);

  // KPI Calculations
  const totalCount = data.length;
  const inTransitCount = data.filter((row) => row.status === 'intransit').length;
  const movedCount = data.filter((row) => row.status === 'moved').length;
  const meltedCount = data.filter(
    (row) => row.status === 'melted' || getTransitMeltingStatus(row) === 'melted'
  ).length;
  const totalNetWeight = data
    .reduce((acc, curr) => acc + (Number(curr.totalNetWeight) || 0), 0)
    .toFixed(3);

  const handleDeleteTransit = async () => {
    if (!openId) return;
    try {
      const res = await deleteTransitById(openId);
      if (res?.status) {
        setNotify({ open: true, message: 'Transit deleted successfully', severity: 'success' });
        fetchData();
        setOpenDeleteModal(false);
        handleCloseMenu();
      } else {
        setNotify({ open: true, message: res?.message || 'Error deleting transit', severity: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message || 'Error deleting transit', severity: 'error' });
    }
  };

  return (
    <>
      <Helmet>
        <title> Transit | Store | MK Gold </title>
      </Helmet>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={notify.open}
        onClose={() => setNotify({ ...notify, open: false })}
        autoHideDuration={3500}
      >
        <Alert
          onClose={() => setNotify({ ...notify, open: false })}
          severity={notify.severity}
          sx={{ width: '100%', color: 'white' }}
        >
          {notify.message}
        </Alert>
      </Snackbar>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header section */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          mb={{ xs: 2.5, sm: 4 }}
          spacing={2}
        >
          <div>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
              Transit
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              Create, dispatch, print, and track gold transit packets across branches
            </Typography>
          </div>

          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
            {isFilterApplied && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
                onClick={handleClearFilters}
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt" />}
              onClick={() => setFilterOpen(true)}
              sx={{ bgcolor: '#fff', color: '#8A1B9F', fontWeight: 600, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenCreateModal(true)}
              sx={{
                bgcolor: '#FFD700',
                color: '#000',
                fontWeight: 700,
                boxShadow: 3,
                '&:hover': { bgcolor: '#e6c200' },
              }}
            >
              New Transit
            </Button>
          </Stack>
        </Stack>

        {/* KPI Metrics Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }} alignItems="stretch">
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'info.lighter',
                  color: 'info.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="carbon:delivery-parcel" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Transits
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'warning.lighter',
                  color: 'warning.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:truck-fast" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {inTransitCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  In Transit
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'success.lighter',
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="eva:checkmark-circle-2-fill" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {movedCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Moved into Store
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#FFD700', color: '#000', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="fluent:gold-24-filled" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalNetWeight} g
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Net Gold Weight
                </Typography>
              </div>
            </Card>
          </Grid>
        </Grid>

        {isFilterApplied && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
              Active Filters:
            </Typography>
            {filters.branch !== 'all' && (
              <Chip
                size="small"
                label={`Branch: ${branches.find((b) => b._id === filters.branch || b.branchId === filters.branch)?.branchName || filters.branch}`}
                onDelete={() => setFilters({ ...filters, branch: 'all' })}
                sx={{ bgcolor: '#fff', color: '#000' }}
              />
            )}
            {filters.status !== 'all' && (
              <Chip
                size="small"
                label={`Status: ${sentenceCase(filters.status)}`}
                onDelete={() => setFilters({ ...filters, status: 'all' })}
                sx={{ bgcolor: '#fff', color: '#000' }}
              />
            )}
            {filters.fromDate && (
              <Chip
                size="small"
                label={`From: ${filters.fromDate}`}
                onDelete={() => setFilters({ ...filters, fromDate: '' })}
                sx={{ bgcolor: '#fff', color: '#000' }}
              />
            )}
            {filters.toDate && (
              <Chip
                size="small"
                label={`To: ${filters.toDate}`}
                onDelete={() => setFilters({ ...filters, toDate: '' })}
                sx={{ bgcolor: '#fff', color: '#000' }}
              />
            )}
          </Box>
        )}

        {/* Main Transits Table Card */}
        <Card sx={{ boxShadow: 3 }}>
          <TransitListToolbar
            numSelected={0}
            filterName={filterName}
            onFilterName={handleFilterByName}
            placeholder="Search transit by ID, branch, or delivery person..."
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 950 }}>
              <Table>
                <TransitListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={filteredData?.length || 0}
                  numSelected={0}
                  onRequestSort={handleRequestSort}
                  hideCheckbox={true}
                />
                <TableBody>
                  {filteredData
                    ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    ?.map((row) => {
                      const {
                        _id,
                        transitId,
                        numberOfPackets,
                        physical,
                        released,
                        totalNetWeight: rowNetWeight,
                        deliveryBy,
                        transitMovedThrough,
                        status,
                        createdAt,
                        branch: rowBranch,
                      } = row;

                      const branchName = rowBranch?.branchName || 'N/A';
                      const branchCode = rowBranch?.branchId || '';

                      return (
                        <TableRow
                          hover
                          key={_id}
                          tabIndex={-1}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/store/transit-sales/${_id}`)}
                        >
                          <TableCell align="left">
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {branchName}
                            </Typography>
                            {branchCode && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {branchCode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#8A1B9F' }}>
                              {transitId}
                            </Typography>
                          </TableCell>
                          <TableCell align="left">{numberOfPackets}</TableCell>
                          <TableCell align="left">{physical}</TableCell>
                          <TableCell align="left">{released}</TableCell>
                          <TableCell align="left">{rowNetWeight ? `${Number(rowNetWeight).toFixed(3)}g` : '-'}</TableCell>
                          <TableCell align="left">{deliveryBy ? sentenceCase(deliveryBy) : '-'}</TableCell>
                          <TableCell align="left">{transitMovedThrough || 'Hand Delivery'}</TableCell>
                          <TableCell align="left">
                            {getTransitMeltingStatus(row) === 'melted' ? (
                              <Label sx={{ bgcolor: '#7b1fa2', color: '#fff', fontWeight: 600 }}>Melted</Label>
                            ) : getTransitMeltingStatus(row) === 'partial' ? (
                              <Label color="info">Partially Melted</Label>
                            ) : status === 'moved' ? (
                              <Label color="success">Moved to Store</Label>
                            ) : status === 'submitted' ? (
                              <Label color="error">Deviation Flagged</Label>
                            ) : (
                              <Label color="warning">{sentenceCase(status || 'intransit')}</Label>
                            )}
                          </TableCell>
                          <TableCell align="left">
                            {moment(createdAt).format('YYYY-MM-DD')}
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="large"
                              color="inherit"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMenu(e, _id);
                              }}
                            >
                              <Iconify icon="eva:more-vertical-fill" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={11} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={11} sx={{ py: 4 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" paragraph>
                            {isNotFound ? 'No matching transits found' : 'No transits available'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {isNotFound
                              ? `No results found for "${filterName}". Check filters or spelling.`
                              : 'Click "New Transit" above to create and record a new gold shipment.'}
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
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {/* Row Actions Menu */}
      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { p: 1, width: 190, '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 } },
        }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            navigate(`/store/transit-sales/${openId}`);
          }}
        >
          <Iconify icon="carbon:view-filled" sx={{ mr: 2 }} />
          View Sales
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setVerifyTransitId(openId);
          }}
        >
          <Iconify icon="material-symbols:print" sx={{ mr: 2 }} />
          Print Transit
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setOpenEditModal(true);
          }}
        >
          <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
          Edit Transit
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setOpenDeleteModal(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
          Delete Transit
        </MenuItem>
      </Popover>

      {/* Create Transit Modal */}
      <CreateTransitModal
        open={openCreateModal}
        handleClose={() => setOpenCreateModal(false)}
        fetchData={fetchData}
        auth={auth}
        branches={branches}
        setNotify={setNotify}
        onSuccessPrint={(id) => setVerifyTransitId(id)}
      />

      {/* Edit Transit Modal */}
      {openEditModal && (
        <EditTransitModal
          open={openEditModal}
          id={openId}
          handleClose={() => setOpenEditModal(false)}
          fetchData={fetchData}
          branches={branches}
          setNotify={setNotify}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Transit</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Are you sure you want to delete this transit record? Any associated sales will revert to pending status.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteModal(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteTransit} color="error" variant="contained">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Modal */}
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Filter Transits</DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={filters.branch}
                  label="Branch"
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                >
                  <MenuItem value="all">All Branches</MenuItem>
                  {branches.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.branchName} ({b.branchId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="intransit">In Transit</MenuItem>
                  <MenuItem value="moved">Moved to Store</MenuItem>
                  <MenuItem value="submitted">Deviation Flagged</MenuItem>
                  <MenuItem value="melted">Melted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="From Date"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="To Date"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClearFilters} color="inherit">
            Reset
          </Button>
          <Button
            onClick={() => setFilterOpen(false)}
            variant="contained"
            sx={{ bgcolor: '#8A1B9F', color: '#fff', '&:hover': { bgcolor: '#731386' } }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transit Print Voucher */}
      {verifyTransitId && (
        <TransitPrint
          id={verifyTransitId}
          open={Boolean(verifyTransitId)}
          onClose={() => setVerifyTransitId(null)}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// Create Transit Modal
// ----------------------------------------------------------------------
export function CreateTransitModal({ open, handleClose, fetchData, auth, branches = [], setNotify, onSuccessPrint }) {
  // ----------------------------------------------------------------------
  // MULTI-BRANCH BATCH SELECTION STATE
  // ----------------------------------------------------------------------
  const [multiSales, setMultiSales] = useState([]);
  const [multiLoading, setMultiLoading] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterSaleType, setFilterSaleType] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Logistics for Batch
  const [batchTransitId, setBatchTransitId] = useState('');
  const [batchDeliveryBy, setBatchDeliveryBy] = useState('');
  const [batchTransitMovedThrough, setBatchTransitMovedThrough] = useState('Hand Delivery');
  const [batchNotes, setBatchNotes] = useState('');
  const [batchProofs, setBatchProofs] = useState([]);
  const [batchProof, setBatchProof] = useState('');
  const [batchProofName, setBatchProofName] = useState('');
  const [batchProofLoading, setBatchProofLoading] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const multiFileInputRef = useRef();

  // Helper to regenerate unique transit ID for batch
  const handleRegenerateTransitId = () => {
    generateTransitId()
      .then((res) => {
        if (res?.status && res?.transitId) {
          setBatchTransitId(res.transitId);
        } else {
          setBatchTransitId(generateRandomTransitId());
        }
      })
      .catch(() => setBatchTransitId(generateRandomTransitId()));
  };

  // Load all untransited completed sales across all branches
  const fetchUntransitedSales = useCallback(() => {
    setMultiLoading(true);
    findSales({ status: { $in: ['completed', 'bullion pending'] } })
      .then((res) => {
        if (Array.isArray(res?.data)) {
          const available = res.data.filter(
            (s) => s.status !== 'intransit' && s.status !== 'moved' && s.status !== 'melted'
          );
          setMultiSales(available);
        } else {
          setMultiSales([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching untransited sales:', err);
        setMultiSales([]);
      })
      .finally(() => setMultiLoading(false));
  }, []);

  useEffect(() => {
    if (open) {
      fetchUntransitedSales();
      setSelectedSaleIds([]);
      setBatchProofs([]);
      setBatchProof('');
      setBatchProofName('');
      setBatchDeliveryBy('');
      setBatchNotes('');
      setSearchQuery('');
      setFilterBranch('all');
      setFilterSaleType('all');
      setPage(0);
      handleRegenerateTransitId();
    }
  }, [open, fetchUntransitedSales]);

  // Unique count of branches present in the untransited sales
  const uniqueBranchCount = useMemo(() => {
    return new Set(
      multiSales.map((s) => String(s.branch?._id || s.branch || '')).filter(Boolean)
    ).size;
  }, [multiSales]);

  // Filtered sales in the multi-branch table
  const filteredMultiSales = useMemo(() => {
    return multiSales.filter((sale) => {
      // Branch filter
      if (filterBranch !== 'all') {
        const bId = String(sale.branch?._id || sale.branch || '');
        if (bId !== String(filterBranch)) return false;
      }
      // Sale Type filter
      if (filterSaleType !== 'all') {
        if (sale.saleType?.toLowerCase() !== filterSaleType.toLowerCase()) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const bill = (sale.billId || '').toLowerCase();
        const art = (sale.articleNumber || '').toLowerCase();
        const bName = (sale.branch?.branchName || '').toLowerCase();
        const bCode = (sale.branch?.branchId || '').toLowerCase();
        const custName = (sale.customer?.name || '').toLowerCase();
        const custPhone = (sale.customer?.phoneNumber || '').toLowerCase();
        if (
          !bill.includes(q) &&
          !art.includes(q) &&
          !bName.includes(q) &&
          !bCode.includes(q) &&
          !custName.includes(q) &&
          !custPhone.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [multiSales, filterBranch, filterSaleType, searchQuery]);

  // Toggle single sale selection
  const handleToggleSale = (id) => {
    setSelectedSaleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible filtered sales
  const isAllFilteredSelected =
    filteredMultiSales.length > 0 &&
    filteredMultiSales.every((s) => selectedSaleIds.includes(s._id));

  const isSomeFilteredSelected =
    filteredMultiSales.some((s) => selectedSaleIds.includes(s._id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredMultiSales.map((s) => s._id));
      setSelectedSaleIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const newSelected = new Set(selectedSaleIds);
      filteredMultiSales.forEach((s) => newSelected.add(s._id));
      setSelectedSaleIds(Array.from(newSelected));
    }
  };

  // Selected Sales Calculation & Grouping
  const selectedSalesList = useMemo(() => {
    return multiSales.filter((s) => selectedSaleIds.includes(s._id));
  }, [multiSales, selectedSaleIds]);

  const selectedStats = useMemo(() => {
    let totalNetWeight = 0;
    let totalGrossWeight = 0;
    let totalOrnaments = 0;
    let totalAmount = 0;
    const branchBreakdown = {};

    selectedSalesList.forEach((s) => {
      const net = Number(s.netWeight || 0);
      const gross =
        s.ornaments?.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0) ||
        Number(s.netWeight || 0);
      const orns =
        s.ornaments?.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0) || 1;
      const amt = Number(s.payableAmount || s.netAmount || 0);

      totalNetWeight += net;
      totalGrossWeight += gross;
      totalOrnaments += orns;
      totalAmount += amt;

      const bName = s.branch?.branchName || 'Unknown Branch';
      if (!branchBreakdown[bName]) {
        branchBreakdown[bName] = { count: 0, netWeight: 0, branchCode: s.branch?.branchId || '' };
      }
      branchBreakdown[bName].count += 1;
      branchBreakdown[bName].netWeight += net;
    });

    return {
      totalSales: selectedSalesList.length,
      totalNetWeight: totalNetWeight.toFixed(3),
      totalGrossWeight: totalGrossWeight.toFixed(3),
      totalOrnaments,
      totalAmount,
      branchCount: Object.keys(branchBreakdown).length,
      branchBreakdown,
    };
  }, [selectedSalesList]);

  // Upload proof for batch (multiple files support)
  const handleBatchProofUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setBatchProofLoading(true);
      const newUploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('uploadedFile', file);
        formData.append('uploadName', 'transit_proof');
        formData.append(
          'uploadId',
          [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
        );
        try {
          const response = await createFile(formData);
          if (response && response.status && response.data) {
            newUploaded.push({
              _id: response.data._id,
              name: file.name,
              url: response.data.uploadedFile,
            });
          }
        } catch (err) {
          console.error('Error uploading file:', file.name, err);
        }
      }
      setBatchProofLoading(false);
      if (newUploaded.length > 0) {
        setBatchProofs((prev) => {
          const updated = [...prev, ...newUploaded];
          setBatchProof(updated[0]?._id || '');
          setBatchProofName(updated[0]?.name || '');
          return updated;
        });
        setNotify({
          open: true,
          message: `${newUploaded.length} proof file(s) uploaded successfully!`,
          severity: 'success',
        });
      } else {
        setNotify({ open: true, message: 'Proof upload failed', severity: 'error' });
      }
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
  };

  const handleRemoveBatchProof = (idx) => {
    setBatchProofs((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      setBatchProof(updated[0]?._id || '');
      setBatchProofName(updated[0]?.name || '');
      return updated;
    });
  };

  // Submit batch multi-branch creation
  const handleBatchSubmit = async () => {
    if (selectedSaleIds.length === 0) {
      setNotify({ open: true, message: 'Please select at least one sale from the table', severity: 'warning' });
      return;
    }
    if (!batchTransitId.trim()) {
      setNotify({ open: true, message: 'Transit ID is required', severity: 'warning' });
      return;
    }
    if (!batchDeliveryBy.trim()) {
      setNotify({ open: true, message: 'Delivery Person / Staff name is required', severity: 'warning' });
      return;
    }
    if (batchProofs.length === 0 && !batchProof) {
      setNotify({ open: true, message: 'Proof document is mandatory', severity: 'warning' });
      return;
    }

    setBatchSubmitting(true);
    try {
      const payload = {
        saleIds: selectedSaleIds,
        transitId: batchTransitId.trim(),
        deliveryBy: batchDeliveryBy.trim(),
        transitMovedThrough: batchTransitMovedThrough,
        notes: batchNotes.trim(),
        proof: batchProofs[0]?._id || batchProof,
        proofs: batchProofs.map((p) => p._id),
        createdBy: auth.user?._id || 'store',
        creatorType: 'store',
        status: 'moved',
      };

      const res = await batchCreateTransit(payload);
      setBatchSubmitting(false);
      if (res && res.status) {
        setNotify({
          open: true,
          message: res.message || 'Transits created successfully!',
          severity: 'success',
        });
        handleClose();
        fetchData();
        if (onSuccessPrint && Array.isArray(res.data) && res.data.length > 0) {
          onSuccessPrint(res.data[0]._id);
        }
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Error creating transits',
          severity: 'error',
        });
      }
    } catch (err) {
      setBatchSubmitting(false);
      setNotify({ open: true, message: err.message || 'Batch creation failed', severity: 'error' });
    }
  };

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '94vh',
          borderRadius: 2.5,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          bgcolor: '#8A1B9F',
          color: '#fff',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
              Create New Transit
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Select completed customer sales by branch to create transit dispatches ({multiSales.length} sales available)
            </Typography>
          </div>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#fff' }}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Filter and Search Bar */}
          <Card variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by Bill ID, Customer, Branch..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <Iconify icon="eva:close-fill" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter Branch</InputLabel>
                  <Select
                    value={filterBranch}
                    label="Filter Branch"
                    onChange={(e) => {
                      setFilterBranch(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="all">
                      All Branches ({uniqueBranchCount} {uniqueBranchCount === 1 ? 'Branch' : 'Branches'} • {multiSales.length} {multiSales.length === 1 ? 'Sale' : 'Sales'})
                    </MenuItem>
                    {branches.map((b) => {
                      const count = multiSales.filter(
                        (s) => String(s.branch?._id || s.branch) === String(b._id)
                      ).length;
                      return (
                        <MenuItem key={b._id} value={b._id}>
                          {b.branchName} ({count} {count === 1 ? 'Sale' : 'Sales'})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sale Type</InputLabel>
                  <Select
                    value={filterSaleType}
                    label="Sale Type"
                    onChange={(e) => {
                      setFilterSaleType(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="all">All Sale Types</MenuItem>
                    <MenuItem value="physical">Physical Gold</MenuItem>
                    <MenuItem value="released">Released Gold</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterBranch('all');
                    setFilterSaleType('all');
                    setPage(0);
                  }}
                  sx={{ height: 40 }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Card>

          {/* Sales Table with Checkboxes */}
          <Card variant="outlined" sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 320 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: '#1E293B',
                      '& th': {
                        bgcolor: '#1E293B !important',
                        color: '#FFFFFF !important',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        borderBottom: '2px solid rgba(255,255,255,0.1)',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={isSomeFilteredSelected}
                        checked={isAllFilteredSelected}
                        onChange={handleToggleSelectAll}
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          '&.Mui-checked': { color: '#FFD700' },
                          '&.MuiCheckbox-indeterminate': { color: '#FFD700' },
                        }}
                      />
                    </TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Bill ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="center">Ornaments</TableCell>
                    <TableCell align="right">Net Wt (g)</TableCell>
                    <TableCell align="right">Gross Wt (g)</TableCell>
                    <TableCell align="right">Amount (₹)</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {multiLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                          Loading untransited completed sales across all branches...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : filteredMultiSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                          No untransited sales found matching the criteria.
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          All completed branch sales are either already in transit or moved to store.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMultiSales
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((sale) => {
                        const isSelected = selectedSaleIds.includes(sale._id);
                        const branchName = sale.branch?.branchName || 'N/A';
                        const branchCode = sale.branch?.branchId || '';
                        const grossWeight =
                          sale.ornaments?.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0) ||
                          Number(sale.netWeight || 0);
                        const ornamentsCount =
                          sale.ornaments?.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0) || 1;
                        const amount = Number(sale.payableAmount || sale.netAmount || 0);

                        return (
                          <TableRow
                            hover
                            key={sale._id}
                            selected={isSelected}
                            onClick={() => handleToggleSale(sale._id)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isSelected ? 'rgba(138, 27, 159, 0.05)' : 'inherit',
                            }}
                          >
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleSale(sale._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={branchName}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  bgcolor: 'rgba(138, 27, 159, 0.1)',
                                  color: '#8A1B9F',
                                }}
                              />
                              {branchCode && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {branchCode}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {sale.billId || '-'}
                              </Typography>
                              {sale.articleNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  Art: {sale.articleNumber}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Label
                                color={sale.saleType === 'physical' ? 'info' : 'warning'}
                                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                              >
                                {sale.saleType || 'physical'}
                              </Label>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {sale.customer?.name || 'Customer'}
                              </Typography>
                              {sale.customer?.phoneNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  {sale.customer.phoneNumber}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{ornamentsCount}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {Number(sale.netWeight || 0).toFixed(3)}g
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{Number(grossWeight).toFixed(3)}g</TableCell>
                            <TableCell align="right">₹{Math.round(amount).toLocaleString('en-IN')}</TableCell>
                            <TableCell>{moment(sale.createdAt).format('YYYY-MM-DD')}</TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredMultiSales.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Card>

          {/* Live Aggregate Summary Box */}
          <Card
            sx={{
              p: 2,
              bgcolor: selectedStats.totalSales > 0 ? 'rgba(138, 27, 159, 0.05)' : '#f8fafc',
              borderColor: selectedStats.totalSales > 0 ? '#8A1B9F' : '#e2e8f0',
              borderWidth: 1.5,
              borderStyle: 'solid',
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6} sm={2.5}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  Selected Sales / Packets
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#8A1B9F' }}>
                  {selectedStats.totalSales}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  Origin Branches
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {selectedStats.branchCount}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2.5}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  Total Net Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#8A1B9F' }}>
                  {selectedStats.totalNetWeight} g
                </Typography>
              </Grid>

              <Grid item xs={6} sm={2.5}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  Total Gross Weight
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  {selectedStats.totalGrossWeight} g
                </Typography>
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  Total Value
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  ₹{Math.round(selectedStats.totalAmount).toLocaleString('en-IN')}
                </Typography>
              </Grid>

              {/* Branch Breakdown Chips */}
              {selectedStats.branchCount > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B', textTransform: 'uppercase' }}>
                      Branch Breakdown (Creates {selectedStats.branchCount} Transit{selectedStats.branchCount > 1 ? 's' : ''}):
                    </Typography>
                    {Object.entries(selectedStats.branchBreakdown).map(([bName, bData], idx) => (
                      <Chip
                        key={bName}
                        size="small"
                        label={`${bName}: ${idx === 0 ? batchTransitId : 'Auto ID'} • ${bData.count} packet${bData.count > 1 ? 's' : ''} (${bData.netWeight.toFixed(3)}g)`}
                        sx={{
                          fontWeight: 700,
                          bgcolor: '#fff',
                          border: '1.5px solid #8A1B9F',
                          color: '#8A1B9F',
                        }}
                      />
                    ))}
                  </Stack>
                </Grid>
              )}
            </Grid>
          </Card>

          {/* Logistics & Dispatch Card */}
          <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
              Transit Dispatch Logistics
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Transit ID *"
                  value={batchTransitId}
                  onChange={(e) => setBatchTransitId(e.target.value)}
                  required
                  helperText={
                    selectedStats.branchCount > 1
                      ? 'Base ID for 1st branch'
                      : 'Unique ID for this transit'
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Regenerate unique Transit ID">
                          <IconButton size="small" onClick={handleRegenerateTransitId}>
                            <Iconify icon="eva:refresh-fill" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Delivery Person / Staff *"
                  placeholder="e.g. Raj"
                  value={batchDeliveryBy}
                  onChange={(e) => setBatchDeliveryBy(e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mode of Transport *</InputLabel>
                  <Select
                    value={batchTransitMovedThrough}
                    label="Mode of Transport *"
                    onChange={(e) => setBatchTransitMovedThrough(e.target.value)}
                  >
                    <MenuItem value="Hand Delivery">Hand Delivery</MenuItem>
                    <MenuItem value="Car">Car</MenuItem>
                    <MenuItem value="Bike">Bike</MenuItem>
                    <MenuItem value="Courier">Courier</MenuItem>
                    <MenuItem value="Flight">Flight</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  ref={multiFileInputRef}
                  accept="image/*,application/pdf"
                  onChange={handleBatchProofUpload}
                />
                <LoadingButton
                  fullWidth
                  variant={batchProofs.length > 0 ? 'contained' : 'outlined'}
                  color={batchProofs.length > 0 ? 'success' : 'primary'}
                  loading={batchProofLoading}
                  onClick={() => multiFileInputRef.current?.click()}
                  startIcon={<Iconify icon={batchProofs.length > 0 ? 'eva:checkmark-circle-2-fill' : 'eva:cloud-upload-fill'} />}
                  sx={{
                    height: 40,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  {batchProofs.length > 0
                    ? `✓ ${batchProofs.length} Proof(s) (Add More)`
                    : 'Upload Dispatch Proofs *'}
                </LoadingButton>
              </Grid>

              {batchProofs.length > 0 && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      p: 1.5,
                      bgcolor: '#f8fafc',
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {batchProofs.map((item, idx) => {
                      const fileUrl = item.url || '';
                      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${global.BASE_URL}/${fileUrl}`;
                      const isPdf =
                        fileUrl.toLowerCase().endsWith('.pdf') ||
                        (item.name && item.name.toLowerCase().endsWith('.pdf'));
                      return (
                        <Card
                          key={item._id || idx}
                          variant="outlined"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 0.75,
                            pl: 1,
                            pr: 0.5,
                            gap: 1,
                            bgcolor: '#fff',
                            borderColor: '#cbd5e1',
                            borderRadius: 1,
                            maxWidth: 240,
                          }}
                        >
                          {isPdf ? (
                            <Iconify icon="mdi:file-pdf-box" width={28} sx={{ color: 'error.main', flexShrink: 0 }} />
                          ) : (
                            <Box
                              component="img"
                              src={fullUrl}
                              alt={item.name}
                              sx={{
                                width: 32,
                                height: 32,
                                objectFit: 'cover',
                                borderRadius: 0.5,
                                border: '1px solid #e2e8f0',
                                flexShrink: 0,
                                cursor: 'pointer',
                              }}
                              onClick={() => window.open(fullUrl, '_blank')}
                            />
                          )}
                          <Typography
                            variant="caption"
                            noWrap
                            sx={{
                              flexGrow: 1,
                              maxWidth: 120,
                              fontWeight: 600,
                              color: 'text.primary',
                              cursor: 'pointer',
                            }}
                            title={item.name}
                            onClick={() => window.open(fullUrl, '_blank')}
                          >
                            {item.name || `Proof ${idx + 1}`}
                          </Typography>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => window.open(fullUrl, '_blank')}
                            title="View proof"
                            sx={{ p: 0.5 }}
                          >
                            <Iconify icon="eva:external-link-outline" width={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveBatchProof(idx)}
                            title="Remove file"
                            sx={{ p: 0.5 }}
                          >
                            <Iconify icon="eva:trash-2-outline" width={16} />
                          </IconButton>
                        </Card>
                      );
                    })}
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes / Instructions (Optional)"
                  placeholder="Add any instructions or remarks for the receiving store/vault team"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, px: 3, justifyContent: 'space-between' }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>

        <LoadingButton
          variant="contained"
          loading={batchSubmitting}
          onClick={handleBatchSubmit}
          disabled={selectedSaleIds.length === 0 || !batchDeliveryBy.trim() || (batchProofs.length === 0 && !batchProof)}
          sx={{
            bgcolor: '#8A1B9F',
            color: '#fff',
            px: 3,
            fontWeight: 700,
            '&:hover': { bgcolor: '#731386' },
          }}
        >
          {selectedStats.branchCount > 1
            ? `Create ${selectedStats.branchCount} Transits (${selectedStats.totalSales} Packets)`
            : selectedStats.branchCount === 1
              ? `Create Transit (${selectedStats.totalSales} Packets)`
              : 'Select Sales to Create Transits'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

CreateTransitModal.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  fetchData: PropTypes.func,
  auth: PropTypes.object,
  branches: PropTypes.array,
  setNotify: PropTypes.func,
  onSuccessPrint: PropTypes.func,
};

// ----------------------------------------------------------------------
// Edit Transit Modal
// ----------------------------------------------------------------------
function EditTransitModal({ open, id, handleClose, fetchData, branches = [], setNotify }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const schema = Yup.object({
    transitId: Yup.string().required('Transit ID is required'),
    numberOfPackets: Yup.number().required('Number of packets is required'),
    physical: Yup.number().required('Physical packets count is required'),
    released: Yup.number().required('Released packets count is required'),
    numberOfOrnaments: Yup.number().required('Number of ornaments is required'),
    totalGrossWeight: Yup.number().required('Total gross weight is required'),
    totalNetWeight: Yup.number().required('Total net weight is required'),
    fromDate: Yup.mixed().nullable(),
    toDate: Yup.mixed().nullable(),
    numberOfDays: Yup.number().required('Number of days is required'),
    packetWeight: Yup.number().required('Packet weight is required'),
    deliveryBy: Yup.string().required('Delivery person is required'),
    transitMovedThrough: Yup.string().required('Transit move method is required'),
    notes: Yup.string(),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    touched,
    errors,
    values,
    setValues,
    setFieldValue,
  } = useFormik({
    initialValues: {
      transitId: '',
      numberOfPackets: '',
      physical: '',
      released: '',
      numberOfOrnaments: '',
      totalGrossWeight: '',
      totalNetWeight: '',
      fromDate: moment(),
      toDate: moment(),
      numberOfDays: '',
      packetWeight: '',
      deliveryBy: '',
      transitMovedThrough: '',
      notes: '',
      proof: '',
    },
    validationSchema: schema,
    onSubmit: (formValues) => {
      setLoading(true);
      updateTransit(id, formValues).then((res) => {
        setLoading(false);
        if (res.status) {
          handleClose();
          fetchData();
          setNotify({ open: true, message: 'Transit updated successfully', severity: 'success' });
        } else {
          setNotify({ open: true, message: res.message || 'Error updating transit', severity: 'error' });
        }
      });
    },
  });

  useEffect(() => {
    if (id && open) {
      findTransit({ _id: id }).then((res) => {
        if (res.status && res.data?.length > 0) {
          const transit = res.data[0];
          setValues({
            transitId: transit.transitId || '',
            numberOfPackets: transit.numberOfPackets ?? '',
            physical: transit.physical ?? '',
            released: transit.released ?? '',
            numberOfOrnaments: transit.numberOfOrnaments ?? '',
            totalGrossWeight: transit.totalGrossWeight ?? '',
            totalNetWeight: transit.totalNetWeight ?? '',
            fromDate: moment(transit.fromDate),
            toDate: moment(transit.toDate),
            numberOfDays: transit.numberOfDays ?? '',
            packetWeight: Array.isArray(transit.packetWeight)
              ? transit.packetWeight[0] ?? ''
              : transit.packetWeight ?? '',
            deliveryBy: transit.deliveryBy || '',
            transitMovedThrough: transit.transitMovedThrough || '',
            notes: transit.notes || '',
            proof: typeof transit.proof === 'object' ? transit.proof?._id : transit.proof || '',
          });
        }
      });
    }
  }, [id, open, setValues]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'transit_proof');
      formData.append(
        'uploadId',
        [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      );
      try {
        const response = await createFile(formData);
        setLoading(false);
        if (response.status) {
          setFieldValue('proof', response.data?._id);
        } else {
          alert('File upload failed');
        }
      } catch (err) {
        setLoading(false);
        alert('File upload failed');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '92vh',
          borderRadius: 2.5,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <DialogTitle
          sx={{
            p: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#8A1B9F',
            color: '#fff',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Edit Transit
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#fff' }}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="transitId"
                label="Transit ID"
                value={values.transitId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.transitId && Boolean(errors.transitId)}
                helperText={touched.transitId && errors.transitId}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numberOfPackets"
                type="number"
                label="Number of Packets"
                value={values.numberOfPackets}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.numberOfPackets && Boolean(errors.numberOfPackets)}
                helperText={touched.numberOfPackets && errors.numberOfPackets}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="physical"
                type="number"
                label="Physical Packets"
                value={values.physical}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.physical && Boolean(errors.physical)}
                helperText={touched.physical && errors.physical}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="released"
                type="number"
                label="Released Packets"
                value={values.released}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.released && Boolean(errors.released)}
                helperText={touched.released && errors.released}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numberOfOrnaments"
                type="number"
                label="Number of Ornaments"
                value={values.numberOfOrnaments}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.numberOfOrnaments && Boolean(errors.numberOfOrnaments)}
                helperText={touched.numberOfOrnaments && errors.numberOfOrnaments}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="totalGrossWeight"
                type="number"
                label="Total Gross Weight (g)"
                value={values.totalGrossWeight}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.totalGrossWeight && Boolean(errors.totalGrossWeight)}
                helperText={touched.totalGrossWeight && errors.totalGrossWeight}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="totalNetWeight"
                type="number"
                label="Total Net Weight (g)"
                value={values.totalNetWeight}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.totalNetWeight && Boolean(errors.totalNetWeight)}
                helperText={touched.totalNetWeight && errors.totalNetWeight}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="From Date"
                  inputFormat="MM/DD/YYYY"
                  value={values.fromDate}
                  onChange={(v) => {
                    setFieldValue('fromDate', v);
                    setFieldValue('numberOfDays', calculateTransitDays(v, values.toDate));
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="To Date"
                  inputFormat="MM/DD/YYYY"
                  value={values.toDate}
                  onChange={(v) => {
                    setFieldValue('toDate', v);
                    setFieldValue('numberOfDays', calculateTransitDays(values.fromDate, v));
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numberOfDays"
                type="number"
                label="Number of Days"
                value={values.numberOfDays}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="packetWeight"
                type="number"
                label="Packet Weight (g)"
                value={values.packetWeight}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="deliveryBy"
                label="Delivery By"
                value={values.deliveryBy}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="transitMovedThrough"
                label="Transit Moved Through"
                value={values.transitMovedThrough}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <input
                type="file"
                style={{ display: 'none' }}
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />
              <LoadingButton
                loading={loading}
                variant={values.proof ? 'contained' : 'outlined'}
                color={values.proof ? 'success' : 'primary'}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ height: 56, textTransform: 'none' }}
              >
                {values.proof ? '✓ Proof Uploaded (Click to Change)' : 'Upload New Proof'}
              </LoadingButton>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={values.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, px: 3 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            sx={{ bgcolor: '#8A1B9F', color: '#fff', px: 3, '&:hover': { bgcolor: '#731386' } }}
          >
            Update Transit
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditTransitModal.propTypes = {
  open: PropTypes.bool,
  id: PropTypes.string,
  handleClose: PropTypes.func,
  fetchData: PropTypes.func,
  branches: PropTypes.array,
  setNotify: PropTypes.func,
};
