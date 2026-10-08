import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
  Backdrop,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Snackbar,
  Alert,
  Portal,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

// Components
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import { TransitListHead, TransitListToolbar } from '../../sections/@dashboard/transit';
import { findTransit, updateTransitStatus } from '../../apis/admin/transit';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'transitId', label: 'Transit ID', alignRight: false },
  { id: 'branch', label: 'Origin Branch', alignRight: false },
  { id: 'numberOfPackets', label: 'Packets', alignRight: false },
  { id: 'numberOfOrnaments', label: 'Ornaments', alignRight: false },
  { id: 'totalGrossWeight', label: 'Gross Wt (g)', alignRight: false },
  { id: 'totalNetWeight', label: 'Net Wt (g)', alignRight: false },
  { id: 'deliveryBy', label: 'Dispatched By', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'actions', label: 'Action', alignRight: true },
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
    filteredData = filter(
      filteredData,
      (row) =>
        row?.transitId?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        row?.branch?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        row?.deliveryBy?.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  if (filters) {
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter((row) => {
        const isMoved = row.isMovedToMelting || row.status === 'moved_to_melting';
        if (filters.status === 'moved_to_melting') return isMoved;
        if (filters.status === 'in_store') return !isMoved;
        return true;
      });
    }
    if (filters.branch && filters.branch !== 'all') {
      filteredData = filteredData.filter((row) => row.branch?.branchName === filters.branch);
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

export default function StoreTransitOutwards() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
    branch: 'all',
  });

  // Move to Melting confirmation modal state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [transitToMove, setTransitToMove] = useState(null);
  const [moveNotes, setMoveNotes] = useState('');
  const [movingLoading, setMovingLoading] = useState(false);

  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const transitRes = await findTransit({});
      const transits = transitRes?.data || [];

      // Transits that have arrived and were received in Store custody:
      const storeReceivedTransits = transits.filter((t) => {
        return (
          t.storeReceived === true ||
          t.status === 'moved' ||
          t.status === 'moved_to_melting' ||
          t.isMovedToMelting === true
        );
      });

      setData(storeReceivedTransits);
    } catch (err) {
      console.error('Error fetching store outwards transits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const isFilterApplied = !!(filters.fromDate || filters.toDate || filters.status !== 'all' || filters.branch !== 'all');

  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName, filters);
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const isNotFound = !filteredData?.length && !!filterName;

  // KPI calculations
  const totalReceivedCount = data.length;
  const inStoreCount = data.filter((t) => !t.isMovedToMelting && t.status !== 'moved_to_melting').length;
  const movedToMeltingCount = data.filter((t) => t.isMovedToMelting || t.status === 'moved_to_melting').length;
  const totalOrnamentsCount = data.reduce((acc, curr) => acc + (Number(curr.numberOfOrnaments) || 0), 0);
  const totalGrossWeight = data.reduce((acc, curr) => acc + (Number(curr.totalGrossWeight) || 0), 0).toFixed(2);
  const totalNetWeight = data.reduce((acc, curr) => acc + (Number(curr.totalNetWeight) || 0), 0).toFixed(2);

  // Handle open Move dialog
  const handleOpenMoveDialog = (transit) => {
    setTransitToMove(transit);
    setMoveNotes('');
    setMoveDialogOpen(true);
  };

  // Confirm Move to Melting
  const handleConfirmMoveToMelting = async () => {
    if (!transitToMove?._id) return;
    setMovingLoading(true);
    try {
      const res = await updateTransitStatus(transitToMove._id, {
        action: 'move_to_melting',
        notes: moveNotes,
      });

      if (res?.status) {
        setNotify({
          open: true,
          message: res.message || `Transit ${transitToMove.transitId} moved to Melting successfully!`,
          severity: 'success',
        });
        setMoveDialogOpen(false);
        setTransitToMove(null);
        setMoveNotes('');
        fetchData();
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to move transit to Melting',
          severity: 'error',
        });
      }
    } catch (err) {
      console.error('Error moving transit to melting:', err);
      setNotify({
        open: true,
        message: err.message || 'Error moving transit to melting',
        severity: 'error',
      });
    } finally {
      setMovingLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title> Transit Outwards | Store | MK Gold </title>
      </Helmet>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Container maxWidth="xl">
        {/* Header section */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          mb={4}
          spacing={2}
        >
          <div>
            <Typography variant="h4" sx={{ color: '#fff' }}>
              Transit Outwards
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
              Manage received transits and dispatch them to the Melting Department
            </Typography>
          </div>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
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

            {/* Top Move to Melting button commented out as requested; move action is on each row */}
            {/* 
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:layers-fill" />}
              onClick={() => setOpenBatchWizard(true)}
              sx={{
                bgcolor: '#fff',
                color: '#7b1fa2',
                fontWeight: 700,
                boxShadow: 2,
                '&:hover': { bgcolor: '#f3e5f5' },
              }}
            >
              Move to Melting
            </Button> 
            */}

            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:funnel-fill" />}
              onClick={() => setFilterOpen(true)}
              sx={{ bgcolor: '#FFD700', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#e6c200' } }}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        {/* KPI Cards Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#fff', boxShadow: 3 }}>
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
                <Iconify icon="carbon:delivery-parcel" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {inStoreCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  In Store (Ready for Melting)
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
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:fire" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {movedToMeltingCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)', fontWeight: 500 }}>
                  Moved to Melting
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:gold" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalNetWeight} g
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Net Gold (Gross: {totalGrossWeight}g)
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#fff3e0',
                  color: '#e65100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:ring" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalOrnamentsCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Ornaments
                </Typography>
              </div>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Info Banner */}
        {isFilterApplied && (
          <Typography variant="body2" sx={{ color: '#fff', mb: 2 }}>
            {[
              filters.fromDate ? `From Date: ${filters.fromDate}` : null,
              filters.toDate ? `To Date: ${filters.toDate}` : null,
              filters.status !== 'all' ? `Status: ${filters.status === 'moved_to_melting' ? 'Moved to Melting' : 'In Store'}` : null,
              filters.branch !== 'all' ? `Branch: ${filters.branch}` : null,
            ]
              .filter(Boolean)
              .join(' | ')}
          </Typography>
        )}

        {/* Main Card & Table */}
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <TransitListToolbar
            numSelected={0}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TransitListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data.length}
                  numSelected={0}
                  onRequestSort={handleRequestSort}
                  hideCheckbox={true}
                />
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                        _id,
                        branch,
                        transitId,
                        numberOfPackets,
                        numberOfOrnaments,
                        totalGrossWeight,
                        totalNetWeight,
                        deliveryBy,
                        createdAt,
                        status,
                        isMovedToMelting,
                      } = row;

                      const isAlreadyMoved = isMovedToMelting === true || status === 'moved_to_melting';

                      return (
                        <TableRow
                          hover
                          key={_id}
                          tabIndex={-1}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            navigate(`/store/transit-sales/${_id}`);
                          }}
                        >
                          <TableCell align="left">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e' }}>
                              {transitId}
                            </Typography>
                          </TableCell>

                          <TableCell align="left">
                            <Typography variant="body2">
                              {branch?.branchName || 'N/A'}
                            </Typography>
                            {branch?.branchId && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {branch.branchId}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="left">{numberOfPackets}</TableCell>
                          <TableCell align="left">{numberOfOrnaments}</TableCell>
                          <TableCell align="left">{totalGrossWeight} g</TableCell>
                          <TableCell align="left">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {totalNetWeight} g
                            </Typography>
                          </TableCell>

                          <TableCell align="left">{sentenceCase(deliveryBy || 'N/A')}</TableCell>

                          <TableCell align="left">
                            {isAlreadyMoved ? (
                              <Stack spacing={0.5} alignItems="flex-start">
                                <Label color="secondary" sx={{ fontWeight: 600 }}>
                                  Moved to Melting
                                </Label>
                                {row.meltingBatch?.batchNumber && (
                                  <Typography variant="caption" sx={{ color: '#7b1fa2', fontWeight: 700 }}>
                                    Batch: {row.meltingBatch.batchNumber}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Label color="success" sx={{ fontWeight: 600 }}>
                                In Store
                              </Label>
                            )}
                          </TableCell>

                          <TableCell align="left">
                            <Typography variant="body2">{moment(createdAt).format('YYYY-MM-DD')}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {moment(createdAt).format('hh:mm A')}
                            </Typography>
                          </TableCell>

                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                              {isAlreadyMoved ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="inherit"
                                  disabled
                                  startIcon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'secondary.main' }} />}
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    bgcolor: '#f5f5f5',
                                    color: '#616161 !important',
                                  }}
                                >
                                  Moved to Melting
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Iconify icon="mdi:fire" sx={{ color: '#ffffff !important' }} />}
                                  onClick={() => handleOpenMoveDialog(row)}
                                  sx={{
                                    bgcolor: '#7b1fa2',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    '&:hover': { bgcolor: '#6a1b9a' },
                                  }}
                                >
                                  Move to Melting
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={10} />
                    </TableRow>
                  )}

                  {filteredData?.length === 0 && !isNotFound && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 5 }}>
                        <Paper sx={{ textAlign: 'center', boxShadow: 'none' }}>
                          <Iconify icon="carbon:delivery-parcel" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            No received transits in store
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Transits received into store custody will appear here ready to be moved to melting.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}

                  {isNotFound && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 4 }}>
                        <Paper sx={{ textAlign: 'center', boxShadow: 'none' }}>
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No transits found matching &quot;{filterName}&quot;.
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
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Filter Outward Transits</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate || ''}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={filters.toDate || ''}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || 'all'}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All Transits</MenuItem>
                <MenuItem value="in_store">In Store (Not Moved)</MenuItem>
                <MenuItem value="moved_to_melting">Moved to Melting</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Branch</InputLabel>
              <Select
                value={filters.branch}
                label="Branch"
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {Array.from(new Set(data.map((item) => item.branch?.branchName))).filter(Boolean).map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClearFilters} color="inherit">Reset</Button>
          <Button onClick={() => setFilterOpen(false)} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Move to Melting Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={() => {
          if (!movingLoading) {
            setMoveDialogOpen(false);
            setTransitToMove(null);
            setMoveNotes('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="mdi:fire" width={28} sx={{ color: '#7b1fa2' }} />
          Move Transit to Melting
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {transitToMove && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Alert severity="info">
                Moving this transit will transfer custody from <strong>Store</strong> to the <strong>Melting Department</strong>. It will immediately show in the Melting login for melting batch processing.
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Transit ID
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e' }}>
                      {transitToMove.transitId}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Origin Branch
                    </Typography>
                    <Typography variant="subtitle2">
                      {transitToMove.branch?.branchName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Packets / Ornaments
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {transitToMove.numberOfPackets} pkts / {transitToMove.numberOfOrnaments} orns
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Gross / Net Weight
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#d84315' }}>
                      {transitToMove.totalGrossWeight}g Gross / {transitToMove.totalNetWeight}g Net
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Outward Notes / Dispatch Remarks (Optional)"
                placeholder="Enter any instructions or notes for the melting team..."
                value={moveNotes}
                onChange={(e) => setMoveNotes(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setMoveDialogOpen(false);
              setTransitToMove(null);
              setMoveNotes('');
            }}
            color="inherit"
            disabled={movingLoading}
          >
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            loading={movingLoading}
            onClick={handleConfirmMoveToMelting}
            startIcon={<Iconify icon="mdi:fire" />}
            sx={{
              bgcolor: '#7b1fa2',
              color: '#fff',
              fontWeight: 700,
              '&:hover': { bgcolor: '#6a1b9a' },
            }}
          >
            Confirm Move to Melting
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Portal>
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={notify.open}
          onClose={() => setNotify({ ...notify, open: false })}
          autoHideDuration={4000}
          sx={{
            zIndex: 99999,
            top: { xs: '75px !important', sm: '100px !important' },
          }}
        >
          <Alert
            onClose={() => setNotify({ ...notify, open: false })}
            severity={notify.severity}
            sx={{ width: '100%', color: '#fff', fontWeight: 600 }}
            variant="filled"
          >
            {notify.message}
          </Alert>
        </Snackbar>
      </Portal>
    </>
  );
}
