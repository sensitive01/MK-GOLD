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
  TableHead,
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
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  Chip,
  FormHelperText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

// Components
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import { TransitListHead, TransitListToolbar } from '../../sections/@dashboard/transit';
import { findTransit, updateTransitStatus } from '../../apis/admin/transit';
import { createMelting, getNextBatchNumber } from '../../apis/admin/melting';
import { createFile } from '../../apis/branch/fileupload';
import global from '../../utils/global';

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

const WIZARD_STEPS = ['Select Transits', 'Select Sales & Articles', 'Select Ornaments', 'Batch Summary'];

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
        row?.branch?.branchName?.toLowerCase().indexOf(qLower) !== -1 ||
        row?.deliveryBy?.toLowerCase().indexOf(qLower) !== -1 ||
        (row?.saleIds && row.saleIds.some((s) => String(s?.articleNumber || '').toLowerCase().indexOf(qLower) !== -1))
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

  // Melting Wizard state
  const [openWizard, setOpenWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTransits, setSelectedTransits] = useState([]);
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedOrnaments, setSelectedOrnaments] = useState([]);
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [batchProof, setBatchProof] = useState(null);
  const [batchProofLoading, setBatchProofLoading] = useState(false);
  const [batchProofError, setBatchProofError] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);

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

  // Available in-store transits (not yet moved to melting)
  const availableTransits = data.filter((t) => !t.isMovedToMelting && t.status !== 'moved_to_melting');

  const formatArticleNumber = (art) => {
    if (!art) return '-';
    const str = String(art).trim();
    const lastPart = str.includes('-') ? str.split('-').pop() : str;
    const match = lastPart.match(/\d{3,}/) || str.match(/\d{3,}/) || str.match(/\d+/);
    return match ? match[0] : (lastPart || str);
  };

  const getTransitArticleNumbers = (transit) => {
    if (!transit) return [];
    const sales = Array.isArray(transit.saleIds)
      ? transit.saleIds
      : Array.isArray(transit.sales)
      ? transit.sales
      : [];
    const articles = [];
    sales.forEach((sale) => {
      const rawArt =
        sale?.articleNumber ||
        (sale?.ornaments && sale.ornaments.find((o) => o?.articleNumber)?.articleNumber);
      if (rawArt) {
        const formatted = formatArticleNumber(rawArt);
        if (formatted && formatted !== '-') {
          articles.push(formatted);
        } else {
          articles.push(String(rawArt).trim());
        }
      }
    });
    return articles;
  };

  // Open Move to Melting Wizard
  const handleOpenMoveWizard = async (preselectedTransit = null) => {
    setActiveStep(0);
    setNotes('');
    setBatchProof(null);
    setBatchProofError(false);

    try {
      const res = await getNextBatchNumber();
      if (res?.data?.batchNumber) {
        setBatchNumber(res.data.batchNumber);
      } else {
        setBatchNumber(`MB-${moment().format('YYMMDD')}-001`);
      }
    } catch (e) {
      setBatchNumber(`MB-${moment().format('YYMMDD')}-001`);
    }

    if (preselectedTransit && !preselectedTransit.isMovedToMelting && preselectedTransit.status !== 'moved_to_melting') {
      setSelectedTransits([preselectedTransit]);
      const initialSales = [];
      (preselectedTransit.saleIds || []).forEach((s) => {
        if (s.ornaments && s.ornaments.some((o) => o.status !== 'melted')) {
          initialSales.push(s._id);
        }
      });
      setSelectedSales(initialSales);
    } else {
      setSelectedTransits([]);
      setSelectedSales([]);
    }
    setSelectedOrnaments([]);
    setOpenWizard(true);
  };

  const handleToggleTransit = (transit) => {
    const exists = selectedTransits.find((t) => t._id === transit._id);
    let updated;
    if (exists) {
      updated = selectedTransits.filter((t) => t._id !== transit._id);
    } else {
      updated = [...selectedTransits, transit];
    }
    setSelectedTransits(updated);

    // Auto-sync sales
    let newSales = [];
    updated.forEach((t) => {
      if (t.saleIds) {
        t.saleIds.forEach((s) => {
          if (s.ornaments && s.ornaments.some((o) => o.status !== 'melted')) {
            newSales.push(s._id);
          }
        });
      }
    });
    setSelectedSales(newSales);
  };

  const handleSelectAllTransits = () => {
    if (selectedTransits.length === availableTransits.length) {
      setSelectedTransits([]);
      setSelectedSales([]);
    } else {
      setSelectedTransits([...availableTransits]);
      let newSales = [];
      availableTransits.forEach((t) => {
        if (t.saleIds) {
          t.saleIds.forEach((s) => {
            if (s.ornaments && s.ornaments.some((o) => o.status !== 'melted')) {
              newSales.push(s._id);
            }
          });
        }
      });
      setSelectedSales(newSales);
    }
  };

  const getSalesForSelectedTransits = () => {
    let sales = [];
    selectedTransits.forEach((t) => {
      if (t.saleIds) {
        t.saleIds.forEach((sale) => {
          const hasUnmelted = sale.ornaments && sale.ornaments.some((orn) => orn.status !== 'melted');
          if (hasUnmelted && !sales.find((s) => s._id === sale._id)) {
            sales.push({ ...sale, transitId: t.transitId });
          }
        });
      }
    });
    return sales;
  };

  const handleToggleSale = (saleId) => {
    if (selectedSales.includes(saleId)) {
      setSelectedSales(selectedSales.filter((id) => id !== saleId));
    } else {
      setSelectedSales([...selectedSales, saleId]);
    }
  };

  const handleSelectAllSales = () => {
    const sales = getSalesForSelectedTransits();
    if (selectedSales.length === sales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(sales.map((s) => s._id));
    }
  };

  const getOrnamentsForSelectedSales = () => {
    const sales = getSalesForSelectedTransits();
    let orns = [];
    sales.forEach((sale) => {
      if (selectedSales.includes(sale._id) && sale.ornaments) {
        sale.ornaments.forEach((orn) => {
          if (orn.status !== 'melted') {
            orns.push({
              saleId: sale._id,
              billId: sale.billId,
              articleNumber: sale.articleNumber,
              ornamentId: orn._id,
              ornamentType: orn.ornamentType,
              grossWeight: orn.grossWeight,
              netWeight: orn.netWeight,
              purity: orn.purity,
              netAmount: orn.netAmount,
              quantity: orn.quantity || 1,
              goldRate: sale.purchaseType?.toLowerCase() === 'silver' ? (sale.silverRate || 0) : (sale.goldRate || 0),
              date: sale.createdAt,
            });
          }
        });
      }
    });
    return orns;
  };

  const handleToggleOrnament = (orn) => {
    const exists = selectedOrnaments.findIndex((o) => o.ornamentId === orn.ornamentId) !== -1;
    if (exists) {
      setSelectedOrnaments(selectedOrnaments.filter((o) => o.ornamentId !== orn.ornamentId));
    } else {
      setSelectedOrnaments([...selectedOrnaments, orn]);
    }
  };

  const handleSelectAllOrnaments = () => {
    const orns = getOrnamentsForSelectedSales();
    if (selectedOrnaments.length === orns.length) {
      setSelectedOrnaments([]);
    } else {
      setSelectedOrnaments([...orns]);
    }
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      // Auto-populate sales if not set
      const sales = getSalesForSelectedTransits();
      if (selectedSales.length === 0) {
        setSelectedSales(sales.map((s) => s._id));
      }
    } else if (activeStep === 1) {
      // Auto-populate ornaments if not set
      const orns = getOrnamentsForSelectedSales();
      if (selectedOrnaments.length === 0) {
        setSelectedOrnaments([...orns]);
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleBatchProofUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setBatchProofLoading(true);
      setBatchProofError(false);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'store_melting_batch_proof');
      formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
      const response = await createFile(formData);
      setBatchProofLoading(false);
      if (response?.status) {
        setBatchProof(response.data);
        setBatchProofError(false);
        setNotify({ open: true, message: 'Batch dispatch proof uploaded successfully', severity: 'success' });
      } else {
        setNotify({ open: true, message: 'File upload failed', severity: 'error' });
      }
    }
  };

  // Submit and create melting batch
  const handleProceedToMelt = async () => {
    if (selectedOrnaments.length === 0) {
      setNotify({ open: true, message: 'Please select at least one ornament for melting', severity: 'warning' });
      return;
    }
    if (!batchProof || !(batchProof._id || batchProof.uploadedFile)) {
      setBatchProofError(true);
      setNotify({ open: true, message: 'Batch proof photo is mandatory to move to melting', severity: 'error' });
      return;
    }
    setSubmittingBatch(true);
    try {
      const activeTransitIds = selectedTransits.map((t) => t._id);
      const totalAmount = selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.netAmount) || 0), 0);
      const totalGross = selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);
      const totalNet = selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);

      const payload = {
        batchNumber,
        transitIds: activeTransitIds,
        transitId: activeTransitIds[0] || null,
        saleIds: selectedSales,
        ornaments: selectedOrnaments.map((o) => ({
          saleId: o.saleId,
          ornamentId: o.ornamentId,
          articleNumber: o.articleNumber,
          ornamentType: o.ornamentType,
          grossWeight: Number(o.grossWeight) || 0,
          netWeight: Number(o.netWeight) || 0,
          purity: Number(o.purity) || 0,
          netAmount: Number(o.netAmount) || 0,
        })),
        totalOrnaments: selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0),
        totalGrossWeight: Number(totalGross.toFixed(2)),
        totalNetWeight: Number(totalNet.toFixed(2)),
        totalNetAmount: Number(totalAmount.toFixed(2)),
        notes,
        meltProof: batchProof?._id || null,
        status: 'created',
        isPreMeltCompleted: false,
      };

      const res = await createMelting(payload);
      if (res && res.status === true) {
        setNotify({
          open: true,
          message: `Melting Batch ${batchNumber} created! ${selectedTransits.length} transit(s) moved to Melting successfully!`,
          severity: 'success',
        });
        setOpenWizard(false);
        fetchData();
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to create melting batch',
          severity: 'error',
        });
      }
    } catch (err) {
      console.error('Error creating melting batch:', err);
      setNotify({
        open: true,
        message: err?.response?.data?.message || err?.message || 'Something went wrong while creating melting batch',
        severity: 'error',
      });
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Summary statistics for Step 3
  const summaryGrossWeight = selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0);
  const summaryNetWeight = selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.netWeight) || 0), 0);
  const summaryAvgPurity = summaryNetWeight > 0
    ? (selectedOrnaments.reduce((sum, o) => sum + (Number(o.purity) || 0) * (Number(o.netWeight) || 0), 0) / summaryNetWeight).toFixed(2)
    : '0.00';

  return (
    <>
      <Helmet>
        <title> Transit Outwards | Store | MK Gold </title>
      </Helmet>

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
              Manage received transits and dispatch batches to the Melting Department
            </Typography>
          </div>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
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

            {/* Top Common Button: Move to Melting */}
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:fire" width={22} />}
              onClick={() => handleOpenMoveWizard()}
              sx={{
                bgcolor: '#FFD700',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: 3,
                px: 2.5,
                py: 1,
                '&:hover': { bgcolor: '#e6c200' },
              }}
            >
              Move to Melting
            </Button>

            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:funnel-fill" />}
              onClick={() => setFilterOpen(true)}
              sx={{ bgcolor: '#fff', color: '#7b1fa2', fontWeight: 700, '&:hover': { bgcolor: '#f3e5f5' } }}
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
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                  bgcolor: '#e0f2fe',
                  color: '#0284c7',
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
                  bgcolor: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="icon-park-outline:diamond-ring" width={28} />
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

        {/* Transits Table Card */}
        <Card sx={{ boxShadow: 3 }}>
          <TransitListToolbar
            numSelected={0}
            filterName={filterName}
            onFilterName={handleFilterByName}
            placeholder="Search transit by ID, branch, or delivery person..."
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 900 }}>
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
                  {loading && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 6 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                          Loading store transits...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                      const {
                        _id,
                        transitId,
                        branch,
                        numberOfPackets,
                        numberOfOrnaments,
                        totalGrossWeight,
                        totalNetWeight,
                        deliveryBy,
                        status,
                        isMovedToMelting,
                        createdAt,
                      } = row;

                      const isAlreadyMoved = isMovedToMelting || status === 'moved_to_melting';

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
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e' }}>
                                {transitId}
                              </Typography>
                              {(() => {
                                const arts = getTransitArticleNumbers(row);
                                return arts.length > 0 ? (
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 600,
                                      color: '#7b1fa2',
                                      fontSize: '0.8125rem',
                                    }}
                                  >
                                    ({arts.join(', ')})
                                  </Typography>
                                ) : null;
                              })()}
                            </Stack>
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
                                {row.meltRecord?.batchNumber && (
                                  <Typography variant="caption" sx={{ color: '#7b1fa2', fontWeight: 700 }}>
                                    Batch: {row.meltRecord.batchNumber}
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
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<Iconify icon="eva:eye-fill" />}
                              onClick={() => navigate(`/store/transit-sales/${_id}`)}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                textTransform: 'none',
                              }}
                            >
                              View
                            </Button>
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

      {/* Move to Melting Multi-Step Wizard Dialog */}
      <Dialog
        open={openWizard}
        onClose={() => {
          if (!submittingBatch) {
            setOpenWizard(false);
          }
        }}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={submittingBatch}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#1a237e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Move to Melting - {WIZARD_STEPS[activeStep]}</span>
          <Chip
            label={batchNumber || 'Generating...'}
            color="primary"
            sx={{ fontWeight: 700, fontSize: '0.875rem' }}
          />
        </DialogTitle>

        <DialogContent sx={{ minHeight: 420 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 2, pb: 4 }}>
            {WIZARD_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Select In-Store Transits */}
          {activeStep === 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Select Transits Available in Store ({selectedTransits.length}/{availableTransits.length} selected)
                </Typography>
                {availableTransits.length > 0 && (
                  <Button size="small" onClick={handleSelectAllTransits}>
                    {selectedTransits.length === availableTransits.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedTransits.length > 0 && selectedTransits.length < availableTransits.length}
                          checked={availableTransits.length > 0 && selectedTransits.length === availableTransits.length}
                          onChange={handleSelectAllTransits}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Transit ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Packets</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Ornaments</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Gross Wt (g)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Net Wt (g)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableTransits.map((t) => {
                      const isSelected = selectedTransits.findIndex((x) => x._id === t._id) !== -1;
                      return (
                        <TableRow
                          hover
                          key={t._id}
                          selected={isSelected}
                          onClick={() => handleToggleTransit(t)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                              <span>{t.transitId}</span>
                              {(() => {
                                const arts = getTransitArticleNumbers(t);
                                return arts.length > 0 ? (
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontWeight: 600,
                                      color: '#7b1fa2',
                                      fontSize: '0.8125rem',
                                    }}
                                  >
                                    ({arts.join(', ')})
                                  </Typography>
                                ) : null;
                              })()}
                            </Stack>
                          </TableCell>
                          <TableCell>{t.branch?.branchName || 'N/A'}</TableCell>
                          <TableCell align="center">{t.numberOfPackets}</TableCell>
                          <TableCell align="center">{t.numberOfOrnaments}</TableCell>
                          <TableCell align="right">{t.totalGrossWeight} g</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{t.totalNetWeight} g</TableCell>
                          <TableCell>{moment(t.createdAt).format('YYYY-MM-DD')}</TableCell>
                        </TableRow>
                      );
                    })}
                    {availableTransits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No in-store transits ready for melting.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Step 1: Select Sales & Articles */}
          {activeStep === 1 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Select Sales & Verify Article Numbers ({selectedSales.length}/{getSalesForSelectedTransits().length} selected)
                </Typography>
                {getSalesForSelectedTransits().length > 0 && (
                  <Button size="small" onClick={handleSelectAllSales}>
                    {selectedSales.length === getSalesForSelectedTransits().length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedSales.length > 0 && selectedSales.length < getSalesForSelectedTransits().length}
                          checked={getSalesForSelectedTransits().length > 0 && selectedSales.length === getSalesForSelectedTransits().length}
                          onChange={handleSelectAllSales}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Transit ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bill ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Article No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Ornaments</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Net Wt (g)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSalesForSelectedTransits().map((sale) => {
                      const isSelected = selectedSales.includes(sale._id);
                      return (
                        <TableRow
                          hover
                          key={sale._id}
                          selected={isSelected}
                          onClick={() => handleToggleSale(sale._id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{sale.transitId}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{sale.billId}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                            {formatArticleNumber(sale.articleNumber)}
                          </TableCell>
                          <TableCell>{sale.branch?.branchName || 'N/A'}</TableCell>
                          <TableCell>{sale.customer?.name || 'N/A'}</TableCell>
                          <TableCell align="center">{sale.ornaments?.length || 0}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{sale.netWeight} g</TableCell>
                        </TableRow>
                      );
                    })}
                    {getSalesForSelectedTransits().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No sales available in selected transits.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Step 2: Select Ornaments */}
          {activeStep === 2 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Select Ornaments for Smelting ({selectedOrnaments.length}/{getOrnamentsForSelectedSales().length} selected)
                </Typography>
                {getOrnamentsForSelectedSales().length > 0 && (
                  <Button size="small" onClick={handleSelectAllOrnaments}>
                    {selectedOrnaments.length === getOrnamentsForSelectedSales().length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </Stack>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedOrnaments.length > 0 && selectedOrnaments.length < getOrnamentsForSelectedSales().length}
                          checked={getOrnamentsForSelectedSales().length > 0 && selectedOrnaments.length === getOrnamentsForSelectedSales().length}
                          onChange={handleSelectAllOrnaments}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Article No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ornament Type</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Gross Wt (g)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Net Wt (g)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Purity (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getOrnamentsForSelectedSales().map((orn, idx) => {
                      const isSelected = selectedOrnaments.findIndex((o) => o.ornamentId === orn.ornamentId) !== -1;
                      return (
                        <TableRow
                          hover
                          key={idx}
                          selected={isSelected}
                          onClick={() => handleToggleOrnament(orn)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                            {formatArticleNumber(orn.articleNumber)}
                          </TableCell>
                          <TableCell>{orn.ornamentType}</TableCell>
                          <TableCell align="center">{orn.quantity}</TableCell>
                          <TableCell align="right">{orn.grossWeight} g</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{orn.netWeight} g</TableCell>
                          <TableCell align="center">{orn.purity}%</TableCell>
                        </TableRow>
                      );
                    })}
                    {getOrnamentsForSelectedSales().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No ornaments found for selected sales.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Step 3: Batch Summary & Confirmation */}
          {activeStep === 3 && (
            <Box>
              <Card sx={{ p: 2.5, mb: 3, bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Melting Batch No</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                      {batchNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Selected Transits</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {selectedTransits.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Total Ornaments</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Total Gross Weight</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#d84315' }}>
                      {summaryGrossWeight.toFixed(2)} g
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Total Net Weight</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                      {summaryNetWeight.toFixed(2)} g
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Average Purity</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0284c7' }}>
                      {summaryAvgPurity}%
                    </Typography>
                  </Grid>
                </Grid>
              </Card>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  multiline
                  rows={2.5}
                  label="Dispatch / Outward Remarks (Optional)"
                  placeholder="Add any instructions or notes for the melting team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <Box sx={{ width: '100%' }}>
                  <Button
                    variant={batchProof?.uploadedFile ? 'contained' : 'outlined'}
                    component="label"
                    color={batchProofError ? 'error' : (batchProof?.uploadedFile ? 'success' : 'primary')}
                    disabled={batchProofLoading}
                    startIcon={
                      batchProofLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <Iconify icon={batchProof?.uploadedFile ? 'eva:checkmark-circle-2-fill' : 'eva:cloud-upload-fill'} />
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.25,
                      px: 2.5,
                      ...(batchProofError && {
                        borderColor: 'error.main',
                        borderWidth: 2,
                        color: 'error.main',
                        bgcolor: 'rgba(255, 72, 66, 0.04)',
                        '&:hover': { borderWidth: 2, borderColor: 'error.dark' },
                      }),
                      ...(batchProof?.uploadedFile && {
                        bgcolor: 'success.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'success.dark' },
                      }),
                    }}
                  >
                    {batchProofLoading
                      ? 'Uploading Proof...'
                      : batchProof?.uploadedFile
                      ? '✓ Batch Proof Uploaded (Click to Change)'
                      : 'Attach Batch Proof Photo *'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        setBatchProofError(false);
                        handleBatchProofUpload(e);
                      }}
                    />
                  </Button>
                  <FormHelperText
                    error={batchProofError}
                    sx={{
                      mt: 0.75,
                      fontWeight: batchProofError ? 600 : 500,
                      color: batchProofError
                        ? 'error.main'
                        : (batchProof?.uploadedFile ? 'success.main' : 'error.main'),
                    }}
                  >
                    {batchProofError
                      ? '* Batch proof photo/document is mandatory to move to melting.'
                      : (batchProof?.uploadedFile ? '✓ Proof attached successfully' : '* Batch proof is mandatory')}
                  </FormHelperText>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setOpenWizard(false)}
            color="inherit"
            disabled={submittingBatch}
          >
            Cancel
          </Button>

          <Stack direction="row" spacing={1.5}>
            {activeStep > 0 && (
              <Button
                variant="outlined"
                onClick={handleBackStep}
                disabled={submittingBatch}
                startIcon={<Iconify icon="mdi:arrow-left" />}
              >
                Back
              </Button>
            )}

            {activeStep < 3 && (
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={
                  (activeStep === 0 && selectedTransits.length === 0) ||
                  (activeStep === 1 && selectedSales.length === 0) ||
                  (activeStep === 2 && selectedOrnaments.length === 0)
                }
              >
                Next
              </Button>
            )}

            {activeStep === 3 && (
              <LoadingButton
                variant="contained"
                loading={submittingBatch}
                disabled={submittingBatch || selectedOrnaments.length === 0}
                onClick={handleProceedToMelt}
                startIcon={
                  <Iconify
                    icon="mdi:fire"
                    width={22}
                    sx={{ color: '#FFD700 !important' }}
                  />
                }
                sx={{
                  bgcolor: '#7b1fa2',
                  color: '#ffffff !important',
                  fontWeight: 700,
                  '& .MuiButton-startIcon': {
                    color: '#FFD700 !important',
                    display: 'inline-flex',
                    alignItems: 'center',
                  },
                  '& .MuiButton-startIcon > *:first-of-type': {
                    color: '#FFD700 !important',
                  },
                  '&:hover': { bgcolor: '#6a1b9a' },
                }}
              >
                Confirm & Move to Melting
              </LoadingButton>
            )}
          </Stack>
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
