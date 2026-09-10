import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Backdrop,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert as MuiAlertBox,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import { getTransitMeltingStatus } from '../../utils/transit';
import { TransitListHead, TransitListToolbar } from '../../sections/@dashboard/transit';
import { findTransit, updateTransitStatus } from '../../apis/admin/transit';
import { createFile } from '../../apis/admin/fileupload';
import TransitPrint from '../../components/branch/transit/TransitPrint';
import global from '../../utils/global';

const TABLE_HEAD = [
  { id: 'branch', label: 'Branch', alignRight: false },
  { id: 'transitId', label: 'Transit ID', alignRight: false },
  { id: 'numberOfPackets', label: 'Packets', alignRight: false },
  { id: 'physical', label: 'Physical', alignRight: false },
  { id: 'released', label: 'Released', alignRight: false },
  { id: 'totalGrossWeight', label: 'Gross Wt (g)', alignRight: false },
  { id: 'totalNetWeight', label: 'Net Wt (g)', alignRight: false },
  { id: 'deliveryBy', label: 'Delivery By', alignRight: false },
  { id: 'transitMovedThrough', label: 'Mode', alignRight: false },
  { id: 'status', label: 'Store Status', alignRight: false },
  { id: 'createdAt', label: 'Dispatched Date', alignRight: false },
  { id: '' },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function getMeltingStageInfo(row) {
  const melt = row?.meltRecord;
  if (!melt) {
    if (getTransitMeltingStatus(row) === 'melted') {
      return { stage: 'completed', label: 'Melt Completed', color: '#7b1fa2' };
    }
    return null;
  }
  if (melt.status === 'sold') {
    return { stage: 'sold', label: 'Bar Sold', color: 'success' };
  }
  if (melt.status === 'melt_updated') {
    return { stage: 'completed', label: 'Melt Completed', color: '#7b1fa2' };
  }
  if (melt.status === 'in_melt' || melt.isPreMeltCompleted) {
    return { stage: 'in_melt', label: 'In Melting', color: '#ed6c02' };
  }
  return { stage: 'added', label: 'Added to Melt', color: 'info' };
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
      if (filters.status === 'intransit') {
        filteredData = filteredData.filter((row) => !row.storeReceived && row.status === 'intransit');
      } else if (filters.status === 'moved') {
        filteredData = filteredData.filter((row) => row.status === 'moved' && getTransitMeltingStatus(row) !== 'melted');
      } else if (filters.status === 'melted') {
        filteredData = filteredData.filter((row) => getTransitMeltingStatus(row) === 'melted');
      } else if (filters.status === 'deviation') {
        filteredData = filteredData.filter((row) => row.deviations === 'yes' || row.status === 'submitted');
      }
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

function AlertComponent(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
}
const Alert = forwardRef(AlertComponent);

export default function StoreGoldTransit() {
  const auth = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter dialog state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
  });

  // Receive modal state
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [storeNotes, setStoreNotes] = useState('');
  const [storeDeviation, setStoreDeviation] = useState('no');
  const [storeProof, setStoreProof] = useState(null);
  const [storeProofName, setStoreProofName] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Print voucher state
  const [verifyTransitId, setVerifyTransitId] = useState(null);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    (query = {}) => {
      setOpenBackdrop(true);
      findTransit(query)
        .then((res) => {
          setData(Array.isArray(res?.data) ? res.data : []);
          setOpenBackdrop(false);
        })
        .catch(() => {
          setOpenBackdrop(false);
        });
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenMenu = (event) => {
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

  const handleFilterOpen = () => setFilterOpen(true);
  const handleFilterClose = () => setFilterOpen(false);
  const handleClearFilters = () => setFilters({ fromDate: '', toDate: '', status: 'all' });
  const isFilterApplied = filters.fromDate || filters.toDate || filters.status !== 'all';

  const selectedTransitObj = data?.find((item) => item._id === openId);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'store_transit_received_proof');
      formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
      const response = await createFile(formData);
      setUploadLoading(false);
      if (response.status) {
        setStoreProof(response.data?._id);
        setStoreProofName(file.name);
        setNotify({ open: true, message: 'Store receipt proof uploaded successfully', severity: 'success' });
      } else {
        setNotify({ open: true, message: 'File upload failed', severity: 'error' });
      }
    }
  };

  const handleStoreReceiveSubmit = async () => {
    if (!storeProof) {
      setNotify({ open: true, message: 'Proof upload is required to receive transit into store', severity: 'warning' });
      return;
    }

    setSubmitLoading(true);
    const payload = {
      action: 'store_receive',
      deviations: storeDeviation,
      storeProof: typeof storeProof === 'object' ? storeProof._id : storeProof,
      storeNotes,
    };

    try {
      const res = await updateTransitStatus(openId, payload);
      setSubmitLoading(false);
      if (res?.status) {
        setReceiveModalOpen(false);
        handleCloseMenu();
        fetchData();
        setNotify({
          open: true,
          message:
            storeDeviation === 'yes'
              ? 'Transit moved into store with deviation flagged (Pending Admin verification)'
              : 'Transit received and moved into store successfully!',
          severity: storeDeviation === 'yes' ? 'warning' : 'success',
        });
      } else {
        setNotify({ open: true, message: res?.message || 'Error receiving transit', severity: 'error' });
      }
    } catch (err) {
      setSubmitLoading(false);
      setNotify({ open: true, message: err.message || 'An error occurred', severity: 'error' });
    }
  };

  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName, filters);
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const isNotFound = !filteredData?.length && !!filterName;

  // KPI Metrics calculation
  const totalCount = data.length;
  const pendingCount = data.filter((row) => !row.storeReceived && row.status === 'intransit').length;
  const movedCount = data.filter((row) => row.status === 'moved').length;
  const deviationCount = data.filter((row) => row.deviations === 'yes' || row.status === 'submitted').length;
  const totalNetWeight = data
    .filter((row) => row.status === 'moved')
    .reduce((acc, curr) => acc + (Number(curr.totalNetWeight) || 0), 0)
    .toFixed(3);

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
              Transit
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              Receive and manage incoming gold transits from branches into store custody
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
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }} alignItems="stretch">
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
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
                <Typography variant="h5">{totalCount}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Transits
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
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
                <Iconify icon="eva:clock-outline" width={28} />
              </Box>
              <div>
                <Typography variant="h5">{pendingCount}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Pending Store Receipt
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
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
                <Typography variant="h5">
                  {movedCount}
                  {totalNetWeight && Number(totalNetWeight) > 0 && (
                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, ml: 0.75 }}>
                      ({totalNetWeight}g)
                    </Typography>
                  )}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Moved in Store
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'error.lighter',
                  color: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="eva:alert-triangle-fill" width={28} />
              </Box>
              <div>
                <Typography variant="h5">{deviationCount}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Deviations Flagged
                </Typography>
              </div>
            </Card>
          </Grid>
        </Grid>

        {isFilterApplied && (
          <Typography variant="body2" sx={{ color: '#fff', mb: 2 }}>
            {[
              filters.fromDate ? `From Date: ${filters.fromDate}` : null,
              filters.toDate ? `To Date: ${filters.toDate}` : null,
              filters.status !== 'all' ? `Filter Status: ${sentenceCase(filters.status)}` : null,
            ]
              .filter(Boolean)
              .join(' | ')}
          </Typography>
        )}

        {/* Table Container */}
        <Card>
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
                        physical,
                        released,
                        totalGrossWeight,
                        totalNetWeight,
                        deliveryBy,
                        transitMovedThrough,
                        status,
                        deviations,
                        storeReceived,
                        createdAt,
                      } = row;

                      // Determine store status badge
                      let statusBadge = null;
                      const meltStageInfo = getMeltingStageInfo(row);
                      if (meltStageInfo) {
                        statusBadge = typeof meltStageInfo.color === 'string' && meltStageInfo.color.startsWith('#')
                          ? <Label sx={{ bgcolor: meltStageInfo.color, color: '#fff', fontWeight: 600 }}>{meltStageInfo.label}</Label>
                          : <Label color={meltStageInfo.color}>{meltStageInfo.label}</Label>;
                      } else if (!storeReceived && status === 'intransit') {
                        statusBadge = <Label color="warning">Pending Receipt</Label>;
                      } else if (deviations === 'yes' || status === 'submitted') {
                        statusBadge = <Label color="error">Moved (Deviation Flagged)</Label>;
                      } else if (status === 'moved') {
                        statusBadge = <Label color="success">Moved in Store</Label>;
                      } else {
                        statusBadge = <Label color="info">{sentenceCase(status || '')}</Label>;
                      }

                      return (
                        <TableRow
                          hover
                          key={_id}
                          tabIndex={-1}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/store/transit-sales/${_id}`)}
                        >
                          <TableCell align="left">
                            <Typography variant="subtitle2" noWrap>
                              {branch?.branchName || 'N/A'}
                            </Typography>
                            {branch?.branchId && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {branch.branchId}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {transitId}
                            </Typography>
                          </TableCell>
                          <TableCell align="left">{numberOfPackets}</TableCell>
                          <TableCell align="left">
                            <Label color="info">{physical}</Label>
                          </TableCell>
                          <TableCell align="left">
                            <Label color="secondary">{released}</Label>
                          </TableCell>
                          <TableCell align="left">{totalGrossWeight}</TableCell>
                          <TableCell align="left">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {totalNetWeight}g
                            </Typography>
                          </TableCell>
                          <TableCell align="left">{sentenceCase(deliveryBy || 'N/A')}</TableCell>
                          <TableCell align="left">{sentenceCase(transitMovedThrough || 'N/A')}</TableCell>
                          <TableCell align="left">{statusBadge}</TableCell>
                          <TableCell align="left">
                            <Typography variant="body2">{moment(createdAt).format('YYYY-MM-DD')}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {moment(createdAt).format('hh:mm A')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="large"
                              color="inherit"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenId(_id);
                                handleOpenMenu(e);
                              }}
                            >
                              <Iconify icon={'eva:more-vertical-fill'} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={12} />
                    </TableRow>
                  )}
                </TableBody>

                {isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={12} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>
                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>&quot;{filterName}&quot;</strong>.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
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

      {/* Action Popover */}
      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { p: 1, width: 200, '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 } },
        }}
      >
        {!selectedTransitObj?.storeReceived && selectedTransitObj?.status === 'intransit' && (
          <MenuItem
            onClick={() => {
              handleCloseMenu();
              setStoreNotes('');
              setStoreDeviation('no');
              setStoreProof(null);
              setStoreProofName('');
              setReceiveModalOpen(true);
            }}
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            <Iconify icon={'eva:checkmark-circle-2-fill'} sx={{ mr: 2 }} />
            Receive Transit
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            navigate(`/store/transit-sales/${openId}`);
          }}
        >
          <Iconify icon={'carbon:view-filled'} sx={{ mr: 2 }} />
          View Sales
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setVerifyTransitId(openId);
          }}
        >
          <Iconify icon={'material-symbols:print'} sx={{ mr: 2 }} />
          Print Transit
        </MenuItem>
      </Popover>

      {/* Store Receive Modal */}
      <Dialog
        open={receiveModalOpen}
        onClose={() => !submitLoading && setReceiveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Receive Transit into Store</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            {/* Transit summary preview */}
            <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.neutral' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Transit ID
                  </Typography>
                  <Typography variant="subtitle2">{selectedTransitObj?.transitId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Origin Branch
                  </Typography>
                  <Typography variant="subtitle2">{selectedTransitObj?.branch?.branchName || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Packets
                  </Typography>
                  <Typography variant="subtitle2">
                    {selectedTransitObj?.numberOfPackets} (Physical: {selectedTransitObj?.physical}, Released:{' '}
                    {selectedTransitObj?.released})
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Net Weight
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {selectedTransitObj?.totalNetWeight} g
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Branch Dispatch Proof
                  </Typography>
                  <div>
                    {selectedTransitObj?.proof?.uploadedFile ? (
                      <Button
                        size="small"
                        startIcon={<Iconify icon="eva:external-link-fill" />}
                        onClick={() =>
                          window.open(
                            selectedTransitObj.proof.uploadedFile.startsWith('http')
                              ? selectedTransitObj.proof.uploadedFile
                              : `${global.BASE_URL}/${selectedTransitObj.proof.uploadedFile}`,
                            '_blank'
                          )
                        }
                      >
                        View Branch Proof
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No branch proof attached.
                      </Typography>
                    )}
                  </div>
                </Grid>
              </Grid>
            </Card>

            {/* Store proof upload */}
            <Typography variant="subtitle2" gutterBottom>
              Store Receipt Proof *
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Upload photo of received parcel, intact seal, or calibration scale reading.
            </Typography>
            <Button
              variant="outlined"
              component="label"
              disabled={uploadLoading}
              startIcon={<Iconify icon="eva:upload-fill" />}
            >
              {uploadLoading ? 'Uploading...' : storeProofName ? 'Change Proof Photo' : 'Upload Store Proof Photo'}
              <input type="file" hidden accept="image/*,.pdf" onChange={handleFileUpload} />
            </Button>
            {storeProofName && (
              <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>
                Uploaded: {storeProofName}
              </Typography>
            )}

            {/* Deviations radio */}
            <FormControl component="fieldset" sx={{ mt: 3, display: 'block' }}>
              <FormLabel component="legend" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                Are there any Deviations / Discrepancies? *
              </FormLabel>
              <RadioGroup
                row
                value={storeDeviation}
                onChange={(e) => setStoreDeviation(e.target.value)}
              >
                <FormControlLabel value="no" control={<Radio />} label="No (All packets & weights intact)" />
                <FormControlLabel value="yes" control={<Radio color="error" />} label="Yes (Deviation Detected)" />
              </RadioGroup>
            </FormControl>

            {storeDeviation === 'yes' && (
              <MuiAlertBox severity="warning" sx={{ mt: 1.5, mb: 1 }}>
                Transit will be received and moved into store custody, but flagged with deviation. It will remain
                pending until Admin reviews and resolves the deviation.
              </MuiAlertBox>
            )}

            {/* Store Notes */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label={storeDeviation === 'yes' ? 'Deviation Details / Store Remarks *' : 'Store Remarks (Optional)'}
              value={storeNotes}
              onChange={(e) => setStoreNotes(e.target.value)}
              placeholder={
                storeDeviation === 'yes'
                  ? 'Please detail the discrepancy (e.g. weight difference, damaged packet, ornament count mismatch)...'
                  : 'Enter any store remarks...'
              }
              sx={{ mt: 2.5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReceiveModalOpen(false)} color="inherit" disabled={submitLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleStoreReceiveSubmit}
            variant="contained"
            color={storeDeviation === 'yes' ? 'warning' : 'primary'}
            disabled={submitLoading || uploadLoading}
            startIcon={submitLoading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitLoading
              ? 'Processing...'
              : storeDeviation === 'yes'
              ? 'Move into Store (Flag Deviation)'
              : 'Receive & Move into Store'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={handleFilterClose} fullWidth maxWidth="xs">
        <DialogTitle>Filter Transits</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Transits</MenuItem>
                  <MenuItem value="intransit">Pending Store Receipt</MenuItem>
                  <MenuItem value="moved">Moved in Store</MenuItem>
                  <MenuItem value="deviation">Deviations Flagged</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleFilterClose} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Printable Transit Voucher */}
      {verifyTransitId && (
        <TransitPrint
          id={verifyTransitId}
          open={Boolean(verifyTransitId)}
          onClose={() => setVerifyTransitId(null)}
        />
      )}

      {/* Backdrop loading */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
