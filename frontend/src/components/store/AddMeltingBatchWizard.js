import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Card,
  Grid,
  Stack,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import moment from 'moment';
import Iconify from '../iconify';
import Scrollbar from '../scrollbar';
import { findTransit } from '../../apis/admin/transit';
import { createMelting, getNextBatchNumber } from '../../apis/admin/melting';
import { createFile } from '../../apis/branch/fileupload';
import { SaleDetail } from '../branch/sales';
import global from '../../utils/global';

const steps = ['Select Transits', 'Select Sales', 'Select Ornaments', 'Summary & Create'];

const formatArticleNumber = (art) => {
  if (!art) return '-';
  const str = String(art).trim();
  const lastPart = str.includes('-') ? str.split('-').pop() : str;
  const match = lastPart.match(/\d{3,}/) || str.match(/\d{3,}/) || str.match(/\d+/);
  return match ? match[0] : (lastPart || str);
};

export default function AddMeltingBatchWizard({ open, onClose, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 0: Transits
  const [transits, setTransits] = useState([]);
  const [selectedTransits, setSelectedTransits] = useState([]);

  // Step 1: Sales
  const [selectedSales, setSelectedSales] = useState([]);
  const [saleIdToView, setSaleIdToView] = useState(null);

  // Step 2: Ornaments
  const [selectedOrnaments, setSelectedOrnaments] = useState([]);

  // Step 3: Summary & Notes
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [meltProof, setMeltProof] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch available transits when modal opens
  const fetchAvailableTransits = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch moved/received transits that contain unmelted ornaments
      const res = await findTransit({});
      if (res?.data && Array.isArray(res.data)) {
        const available = res.data.filter((transit) => {
          return (
            transit.saleIds &&
            transit.saleIds.some((sale) => {
              return (
                sale.ornaments &&
                sale.ornaments.some((orn) => orn.status !== 'melted')
              );
            })
          );
        });
        setTransits(available);
      } else {
        setTransits([]);
      }
    } catch (err) {
      console.error('Error fetching transits for melting batch:', err);
      setErrorMsg('Failed to fetch available transits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedTransits([]);
      setSelectedSales([]);
      setSelectedOrnaments([]);
      setNotes('');
      setBatchNumber('');
      getNextBatchNumber().then((res) => {
        if (res?.data?.batchNumber) {
          setBatchNumber(res.data.batchNumber);
        } else {
          setBatchNumber(`MB-${moment().format('YYMMDD')}-${Math.floor(100 + Math.random() * 900)}`);
        }
      }).catch(() => {
        setBatchNumber(`MB-${moment().format('YYMMDD')}-${Math.floor(100 + Math.random() * 900)}`);
      });
      setMeltProof(null);
      setErrorMsg('');
      fetchAvailableTransits();
    }
  }, [open, fetchAvailableTransits]);

  // Handle Step 0: Transit Selection
  const handleToggleTransit = (transit) => {
    setSelectedTransits((prev) => {
      const exists = prev.find((t) => t._id === transit._id);
      if (exists) {
        return prev.filter((t) => t._id !== transit._id);
      }
      return [...prev, transit];
    });
    // Reset downstream selections when transits change
    setSelectedSales([]);
    setSelectedOrnaments([]);
  };

  const handleSelectAllTransits = () => {
    if (selectedTransits.length === transits.length) {
      setSelectedTransits([]);
      setSelectedSales([]);
      setSelectedOrnaments([]);
    } else {
      setSelectedTransits([...transits]);
      setSelectedSales([]);
      setSelectedOrnaments([]);
    }
  };

  // Helper: Get all sales for currently selected transits with unmelted ornaments
  const getSalesForSelectedTransits = useCallback(() => {
    const sales = [];
    selectedTransits.forEach((t) => {
      if (t.saleIds && Array.isArray(t.saleIds)) {
        t.saleIds.forEach((sale) => {
          const hasUnmelted =
            sale.ornaments &&
            sale.ornaments.some((orn) => orn.status !== 'melted');
          if (hasUnmelted && !sales.find((s) => s._id === sale._id)) {
            sales.push({ ...sale, transitId: t.transitId });
          }
        });
      }
    });
    return sales;
  }, [selectedTransits]);

  // Handle Step 1: Sale Selection
  const handleToggleSale = (saleId) => {
    setSelectedSales((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
    // Remove ornaments of the unselected sale
    setSelectedOrnaments((prev) => prev.filter((orn) => orn.saleId !== saleId));
  };

  const handleSelectAllSales = () => {
    const currentSales = getSalesForSelectedTransits();
    if (selectedSales.length === currentSales.length) {
      setSelectedSales([]);
      setSelectedOrnaments([]);
    } else {
      setSelectedSales(currentSales.map((s) => s._id));
      setSelectedOrnaments([]);
    }
  };

  // Helper: Get all ornaments for selected sales that are not melted
  const getOrnamentsForSelectedSales = useCallback(() => {
    const sales = getSalesForSelectedTransits();
    const orns = [];
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
  }, [getSalesForSelectedTransits, selectedSales]);

  // Handle Step 2: Ornament Selection
  const handleToggleOrnament = (ornObj) => {
    setSelectedOrnaments((prev) => {
      const exists = prev.find((o) => o.ornamentId === ornObj.ornamentId);
      if (exists) {
        return prev.filter((o) => o.ornamentId !== ornObj.ornamentId);
      }
      return [...prev, ornObj];
    });
  };

  const handleSelectAllOrnaments = () => {
    const currentOrns = getOrnamentsForSelectedSales();
    if (selectedOrnaments.length === currentOrns.length) {
      setSelectedOrnaments([]);
    } else {
      setSelectedOrnaments([...currentOrns]);
    }
  };

  // Step 3: Calculation of summaries
  const summary = selectedOrnaments.reduce(
    (acc, curr) => {
      const nw = Number(curr.netWeight || 0);
      const p = Number(curr.purity || 0);
      acc.grossWeight += Number(curr.grossWeight || 0);
      acc.netWeight += nw;
      acc.netAmount += Number(curr.netAmount || 0);
      acc.totalPureWeight += (nw * p) / 100;
      return acc;
    },
    { grossWeight: 0, netWeight: 0, netAmount: 0, totalPureWeight: 0 }
  );

  summary.avgPurity =
    summary.netWeight > 0 ? (summary.totalPureWeight / summary.netWeight) * 100 : 0;

  // Proof Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'melt_proof');
      formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
      const res = await createFile(formData);
      if (res?.data) {
        setMeltProof(res.data);
      }
    } catch (err) {
      console.error('Error uploading proof:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (activeStep === 0 && selectedSales.length === 0) {
      // Auto-select all sales in chosen transits for user convenience
      const availableSales = getSalesForSelectedTransits();
      setSelectedSales(availableSales.map((s) => s._id));
    }
    if (activeStep === 1 && selectedOrnaments.length === 0) {
      // Auto-select all ornaments in chosen sales for user convenience
      const availableOrns = getOrnamentsForSelectedSales();
      setSelectedOrnaments([...availableOrns]);
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Submit Batch Creation
  const handleProceedToMelt = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const activeTransitIds = selectedTransits
        .filter((t) => t.saleIds && t.saleIds.some((sale) => selectedSales.includes(sale._id)))
        .map((t) => t._id);

      const payload = {
        batchNumber: batchNumber?.trim(),
        transitIds: activeTransitIds,
        saleIds: selectedSales,
        ornaments: selectedOrnaments,
        totalOrnaments: selectedOrnaments.reduce(
          (acc, curr) => acc + (Number(curr.quantity) || 1),
          0
        ),
        totalGrossWeight: Number(summary.grossWeight.toFixed(2)),
        totalNetWeight: Number(summary.netWeight.toFixed(2)),
        totalNetAmount: Number(summary.netAmount.toFixed(2)),
        notes,
        fineGoldDifference: 0,
      };

      if (meltProof) {
        payload.meltProof = typeof meltProof === 'object' ? meltProof._id : meltProof;
      }

      const res = await createMelting(payload);
      if (res?.status) {
        if (onSuccess) {
          onSuccess(res.message || 'Melting batch created successfully!');
        }
        onClose();
      } else {
        setErrorMsg(res?.message || 'Error creating melting batch');
      }
    } catch (err) {
      console.error('Error creating melting batch:', err);
      setErrorMsg(err?.message || 'Error creating melting batch');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSales = getSalesForSelectedTransits();
  const availableOrnaments = getOrnamentsForSelectedSales();

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: 620,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#8A1B9F',
            color: '#fff',
            py: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify icon="eva:layers-fill" width={26} height={26} />
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
              Move to Melting — {steps[activeStep]}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
          {/* Stepper Header */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 2, pb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ flex: 1 }}>
              {/* STEP 0: SELECT RECEIVED TRANSITS */}
              {activeStep === 0 && (
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Select Transits for Melting
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Choose the transits whose ornaments should be combined into this batch
                      </Typography>
                    </div>
                    {transits.length > 0 && (
                      <Chip
                        label={`${selectedTransits.length} of ${transits.length} selected`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Stack>

                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
                    <Scrollbar>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={
                                  selectedTransits.length > 0 &&
                                  selectedTransits.length < transits.length
                                }
                                checked={
                                  transits.length > 0 &&
                                  selectedTransits.length === transits.length
                                }
                                onChange={handleSelectAllTransits}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Transit ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Branch Name</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Packets
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Ornaments
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Gross Wt (g)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Net Wt (g)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {transits.map((t) => {
                            const isSelected =
                              selectedTransits.findIndex((x) => x._id === t._id) !== -1;
                            return (
                              <TableRow
                                key={t._id}
                                hover
                                selected={isSelected}
                                onClick={() => handleToggleTransit(t)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={isSelected} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {t.transitId}
                                </TableCell>
                                <TableCell>{t.branch?.branchName || '-'}</TableCell>
                                <TableCell align="center">{t.numberOfPackets}</TableCell>
                                <TableCell align="center">{t.numberOfOrnaments}</TableCell>
                                <TableCell align="right">{t.totalGrossWeight}</TableCell>
                                <TableCell align="right">{t.totalNetWeight || '-'}</TableCell>
                                <TableCell>
                                  {moment(t.createdAt).format('YYYY-MM-DD HH:mm')}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {transits.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                  No available transits with unmelted ornaments found.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                  </TableContainer>
                </Box>
              )}

              {/* STEP 1: SELECT SALES */}
              {activeStep === 1 && (
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Select Sales to Melt
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Showing sales from the {selectedTransits.length} selected transit(s)
                      </Typography>
                    </div>
                    {availableSales.length > 0 && (
                      <Chip
                        label={`${selectedSales.length} of ${availableSales.length} selected`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Stack>

                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
                    <Scrollbar>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={
                                  selectedSales.length > 0 &&
                                  selectedSales.length < availableSales.length
                                }
                                checked={
                                  availableSales.length > 0 &&
                                  selectedSales.length === availableSales.length
                                }
                                onChange={handleSelectAllSales}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Transit ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Bill ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Article No</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Bill Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Branch</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Ornaments
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Sale Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Net Wt (g)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {availableSales.map((sale) => {
                            const isSelected = selectedSales.includes(sale._id);
                            return (
                              <TableRow
                                key={sale._id}
                                hover
                                selected={isSelected}
                                onClick={() => handleToggleSale(sale._id)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={isSelected} />
                                </TableCell>
                                <TableCell>{sale.transitId || 'N/A'}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{sale.billId}</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {formatArticleNumber(sale.articleNumber)}
                                </TableCell>
                                <TableCell>
                                  {moment(sale.createdAt).format('YYYY-MM-DD')}
                                </TableCell>
                                <TableCell>
                                  {sale.branch?.branchName
                                    ? `${sale.branch.branchName}`
                                    : 'Unknown'}
                                </TableCell>
                                <TableCell>{sale.customer?.name || 'Unknown'}</TableCell>
                                <TableCell align="center">
                                  {sale.ornaments?.reduce(
                                    (acc, curr) => acc + (Number(curr.quantity) || 1),
                                    0
                                  ) || 0}
                                </TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>
                                  {sale.saleType}
                                </TableCell>
                                <TableCell align="right">{sale.netWeight}</TableCell>
                                <TableCell
                                  align="center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setSaleIdToView(sale._id)}
                                    sx={{ textTransform: 'none', py: 0.2 }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {availableSales.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                  No unmelted sales found for the selected transits.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                  </TableContainer>
                </Box>
              )}

              {/* STEP 2: SELECT ORNAMENTS */}
              {activeStep === 2 && (
                <Box>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Select Ornaments to Melt
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Pick individual ornaments or select all from chosen sales
                      </Typography>
                    </div>
                    {availableOrnaments.length > 0 && (
                      <Chip
                        label={`${selectedOrnaments.length} of ${availableOrnaments.length} selected`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Stack>

                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380 }}>
                    <Scrollbar>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={
                                  selectedOrnaments.length > 0 &&
                                  selectedOrnaments.length < availableOrnaments.length
                                }
                                checked={
                                  availableOrnaments.length > 0 &&
                                  selectedOrnaments.length === availableOrnaments.length
                                }
                                onChange={handleSelectAllOrnaments}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Article No</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Gold Rate (₹/g)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Quantity
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Gross Wt. (g)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Net Wt. (g)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="center">
                              Purity (%)
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }} align="right">
                              Amount (₹)
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {availableOrnaments.map((orn, idx) => {
                            const isSelected =
                              selectedOrnaments.findIndex(
                                (o) => o.ornamentId === orn.ornamentId
                              ) !== -1;
                            return (
                              <TableRow
                                key={`${orn.ornamentId}-${idx}`}
                                hover
                                selected={isSelected}
                                onClick={() => handleToggleOrnament(orn)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={isSelected} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {formatArticleNumber(orn.articleNumber)}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                  {orn.ornamentType}
                                </TableCell>
                                <TableCell>
                                  {orn.date ? moment(orn.date).format('YYYY-MM-DD') : '-'}
                                </TableCell>
                                <TableCell align="right">
                                  {orn.goldRate ? `₹${Number(orn.goldRate).toLocaleString('en-IN')}` : '-'}
                                </TableCell>
                                <TableCell align="center">{orn.quantity}</TableCell>
                                <TableCell align="right">{orn.grossWeight}</TableCell>
                                <TableCell align="right">{orn.netWeight}</TableCell>
                                <TableCell align="center">{orn.purity}%</TableCell>
                                <TableCell align="right">
                                  {Number(orn.netAmount || 0).toLocaleString('en-IN')}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {availableOrnaments.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                  No available ornaments found for the selected sales.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Scrollbar>
                  </TableContainer>
                </Box>
              )}

              {/* STEP 3: SUMMARY & CONFIRMATION */}
              {activeStep === 3 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Batch Summary & Review
                  </Typography>

                  <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ p: 2, bgcolor: '#f4f6f8', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Total Ornaments
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                          {selectedOrnaments.reduce(
                            (acc, curr) => acc + (Number(curr.quantity) || 1),
                            0
                          )}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ p: 2, bgcolor: '#f4f6f8', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Gross Weight
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                          {summary.grossWeight.toFixed(2)} g
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ p: 2, bgcolor: '#fff8e1', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Net Weight
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mt: 0.5, color: '#f57f17' }}
                        >
                          {summary.netWeight.toFixed(2)} g
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ p: 2, bgcolor: '#ede7f6', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg Purity
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mt: 0.5, color: '#7b1fa2' }}
                        >
                          {summary.avgPurity.toFixed(2)}%
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Net Amount
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 700, mt: 0.5, color: '#2e7d32' }}
                        >
                          ₹{Math.round(summary.netAmount).toLocaleString('en-IN')}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Batch Number *"
                        placeholder="e.g. MB-261008-101"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        helperText="Physical batch identifier or melting tag number"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card
                        sx={{
                          p: 1.5,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: '1px dashed',
                          borderColor: 'divider',
                        }}
                      >
                        <Button
                          variant="outlined"
                          component="label"
                          disabled={uploadLoading}
                          startIcon={
                            uploadLoading ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Iconify icon="eva:upload-fill" />
                            )
                          }
                          sx={{ textTransform: 'none' }}
                        >
                          {uploadLoading ? 'Uploading...' : 'Upload Batch Proof / Photo'}
                          <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                        </Button>
                        {meltProof && (
                          <Typography
                            variant="caption"
                            sx={{ color: 'success.main', mt: 1, fontWeight: 600 }}
                          >
                            ✓ Batch proof uploaded successfully
                          </Typography>
                        )}
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Melting Batch Notes (Optional)"
                        placeholder="Add any instructions, custody details, or notes about this batch..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              startIcon={<Iconify icon="mdi:arrow-left" />}
              variant="outlined"
            >
              Back
            </Button>
          )}
          {activeStep < 3 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && selectedTransits.length === 0) ||
                (activeStep === 1 && selectedSales.length === 0) ||
                (activeStep === 2 && selectedOrnaments.length === 0)
              }
              sx={{ bgcolor: '#8A1B9F', color: '#fff', '&:hover': { bgcolor: '#731485' } }}
            >
              Next
            </Button>
          )}
          {activeStep === 3 && (
            <LoadingButton
              variant="contained"
              onClick={handleProceedToMelt}
              loading={submitting}
              disabled={selectedOrnaments.length === 0}
              sx={{ bgcolor: '#2e7d32', color: '#fff', '&:hover': { bgcolor: '#1b5e20' } }}
            >
              Create Melting Batch
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Sale Detail modal popup */}
      {saleIdToView && (
        <Dialog
          open={Boolean(saleIdToView)}
          onClose={() => setSaleIdToView(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Sale Summary</span>
            <IconButton onClick={() => setSaleIdToView(null)} size="small">
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <SaleDetail id={saleIdToView} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaleIdToView(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
