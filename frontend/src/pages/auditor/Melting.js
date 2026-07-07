import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Stepper, Step, StepLabel, Checkbox, TextField, Box, Snackbar, MenuItem, Select, FormControl, InputLabel,
  Stack, TablePagination, Grid, IconButton
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { findMelting, createMelting, updateMelting, deleteMelting } from '../../apis/admin/melting';
import { findTransit } from '../../apis/admin/transit';
import { findVendor } from '../../apis/admin/vendor';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import Label from '../../components/label';
import { SaleDetail } from '../../components/branch/sales';
import { createFile } from '../../apis/branch/fileupload';
import global from '../../utils/global';

const AlertComponent = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

export default function AuditorMelting() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });

  // Wizard state
  const [openWizard, setOpenWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [transits, setTransits] = useState([]);
  const [selectedTransits, setSelectedTransits] = useState([]);
  
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedOrnaments, setSelectedOrnaments] = useState([]);
  const [notes, setNotes] = useState('');
  const [saleIdToView, setSaleIdToView] = useState(null);

  // Melt Update state
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedMelting, setSelectedMelting] = useState(null);
  const [barWeight, setBarWeight] = useState('');
  const [barPurity, setBarPurity] = useState('');
  const [meltUpdateNotes, setMeltUpdateNotes] = useState('');
  const [meltProof, setMeltProof] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Sell Bar state
  const [openSellDialog, setOpenSellDialog] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [sellVendor, setSellVendor] = useState('');
  const [sellGoldRate, setSellGoldRate] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [sellPaymentMode, setSellPaymentMode] = useState('');

  const fetchMeltings = useCallback(async () => {
    const res = await findMelting({});
    if (res?.data) setData(res.data);
  }, []);

  const fetchTransits = useCallback(async () => {
    // only fetch 'received' transits
    const res = await findTransit({ status: 'moved' });
    if (res?.data) {
      const availableTransits = res.data.filter(transit => {
        return transit.saleIds && transit.saleIds.some(sale => {
          return sale.ornaments && sale.ornaments.some(orn => orn.status !== 'melted');
        });
      });
      setTransits(availableTransits);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    const res = await findVendor({});
    if (res?.data?.status) setVendors(res.data.data);
  }, []);

  useEffect(() => {
    fetchMeltings();
    fetchTransits();
    fetchVendors();
  }, [fetchMeltings, fetchTransits, fetchVendors]);

  const handleOpenWizard = () => {
    setActiveStep(0);
    setSelectedTransits([]);
    setSelectedSales([]);
    setSelectedOrnaments([]);
    setNotes('');
    setMeltProof(null);
    setOpenWizard(true);
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleToggleTransit = (transit) => {
    setSelectedTransits((prev) => {
      const exists = prev.find(t => t._id === transit._id);
      if (exists) {
        return prev.filter(t => t._id !== transit._id);
      } else {
        return [...prev, transit];
      }
    });
    // reset downstream selections
    setSelectedSales([]);
    setSelectedOrnaments([]);
  };

  const handleToggleSale = (saleId) => {
    setSelectedSales((prev) =>
      prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
    );
    // Remove ornaments of the unselected sale
    setSelectedOrnaments((prev) => prev.filter(orn => orn.saleId !== saleId));
  };

  const handleToggleOrnament = (ornObj) => {
    setSelectedOrnaments((prev) => {
      const exists = prev.find(o => o.ornamentId === ornObj.ornamentId);
      if (exists) {
        return prev.filter(o => o.ornamentId !== ornObj.ornamentId);
      } else {
        return [...prev, ornObj];
      }
    });
  };

  const getSalesForSelectedTransits = () => {
    let sales = [];
    selectedTransits.forEach(t => {
      if (t.saleIds) {
        t.saleIds.forEach(sale => {
          const hasUnmelted = sale.ornaments && sale.ornaments.some(orn => orn.status !== 'melted');
          if (hasUnmelted && !sales.find(s => s._id === sale._id)) {
            sales.push({ ...sale, transitId: t.transitId });
          }
        });
      }
    });
    return sales;
  };

  const getOrnamentsForSelectedSales = () => {
    const sales = getSalesForSelectedTransits();
    let orns = [];
    sales.forEach(sale => {
      if (selectedSales.includes(sale._id) && sale.ornaments) {
        sale.ornaments.forEach(orn => {
          if (orn.status !== 'melted') { // Don't show already melted ones
            orns.push({
              saleId: sale._id,
              ornamentId: orn._id,
              ornamentType: orn.ornamentType,
              grossWeight: orn.grossWeight,
              netWeight: orn.netWeight,
              purity: orn.purity,
              netAmount: orn.netAmount,
              quantity: orn.quantity || 1
            });
          }
        });
      }
    });
    return orns;
  };

  const summary = selectedOrnaments.reduce((acc, curr) => {
    const nw = Number(curr.netWeight || 0);
    const p = Number(curr.purity || 0);
    acc.grossWeight += Number(curr.grossWeight || 0);
    acc.netWeight += nw;
    acc.netAmount += Number(curr.netAmount || 0);
    acc.totalPureWeight += (nw * p) / 100;
    return acc;
  }, { grossWeight: 0, netWeight: 0, netAmount: 0, totalPureWeight: 0 });

  summary.avgPurity = summary.netWeight > 0 ? (summary.totalPureWeight / summary.netWeight) * 100 : 0;

  const handleProceedToMelt = async () => {
    let totalFineGoldBefore = 0;
    selectedOrnaments.forEach(orn => {
      totalFineGoldBefore += (Number(orn.netWeight) * Number(orn.purity)) / 100;
    });

    const activeTransitIds = selectedTransits
      .filter(t => t.saleIds && t.saleIds.some(sale => selectedSales.includes(sale._id)))
      .map(t => t._id);

    const payload = {
      transitIds: activeTransitIds,
      saleIds: selectedSales,
      ornaments: selectedOrnaments,
      totalOrnaments: selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0),
      totalGrossWeight: summary.grossWeight,
      totalNetWeight: summary.netWeight,
      totalNetAmount: summary.netAmount,
      notes,
      fineGoldDifference: 0
    };

    if (meltProof) {
      payload.meltProof = typeof meltProof === 'object' ? meltProof._id : meltProof;
    }

    const res = await createMelting(payload);
    if (res.status) {
      setNotify({ open: true, message: 'Melting recorded successfully!', severity: 'success' });
      setOpenWizard(false);
      fetchMeltings();
      fetchTransits();
    } else {
      setNotify({ open: true, message: res.message || 'Error creating melting', severity: 'error' });
    }
  };

  const handleOpenUpdateDialog = (row) => {
    setSelectedMelting(row);
    setBarWeight(row.barWeight || '');
    setBarPurity(row.barPurity || '');
    setMeltUpdateNotes(row.meltUpdateNotes || '');
    setMeltProof(row.meltProof || null);
    setOpenUpdateDialog(true);
  };

  const handleCloseUpdateDialog = () => {
    setOpenUpdateDialog(false);
    setSelectedMelting(null);
  };

  const handleOpenSellDialog = (row) => {
    setSelectedMelting(row);
    setSellVendor('');
    setSellGoldRate('');
    setSellAmount('');
    setSellPaymentMode('');
    setOpenSellDialog(true);
  };

  const handleCloseSellDialog = () => {
    setOpenSellDialog(false);
    setSelectedMelting(null);
  };

  useEffect(() => {
    if (selectedMelting && sellGoldRate) {
      const w = Number(selectedMelting.barWeight) || 0;
      const r = Number(sellGoldRate) || 0;
      if (w > 0 && r > 0) {
        setSellAmount((w * r).toFixed(2));
      } else {
        setSellAmount('');
      }
    } else if (!sellGoldRate) {
      setSellAmount('');
    }
  }, [sellGoldRate, selectedMelting]);

  const handleSellBarSubmit = async () => {
    const payload = {
      status: 'sold',
      vendor: sellVendor,
      goldRate: Number(sellGoldRate),
      sellAmount: Number(sellAmount),
      paymentMode: sellPaymentMode
    };
    const res = await updateMelting(selectedMelting._id, payload);
    if (res.status) {
      setNotify({ open: true, message: 'Bar sold successfully!', severity: 'success' });
      handleCloseSellDialog();
      fetchMeltings();
    } else {
      setNotify({ open: true, message: res.message || 'Error selling bar', severity: 'error' });
    }
  };

  // Calculations for display
  const totalNetBefore = selectedMelting ? selectedMelting.totalNetWeight : 0;
  let totalFineBefore = 0;
  if (selectedMelting && selectedMelting.ornaments) {
    selectedMelting.ornaments.forEach(orn => {
      totalFineBefore += (Number(orn.netWeight) * Number(orn.purity)) / 100;
    });
  }

  const currentBarWeight = Number(barWeight) || 0;
  const currentBarPurity = Number(barPurity) || 0;
  const weightDiff = currentBarWeight - totalNetBefore;
  
  const avgPurityBefore = totalNetBefore ? (totalFineBefore / totalNetBefore) * 100 : 0;
  const purityDiff = currentBarPurity - avgPurityBefore;

  const currentFineAfter = currentBarWeight * (currentBarPurity / 100);
  const fineGoldDiff = currentFineAfter - totalFineBefore;

  const handleUpdateMelting = async () => {
    const payload = {
      barWeight: currentBarWeight,
      barPurity: currentBarPurity,
      weightDifference: weightDiff,
      purityDifference: purityDiff,
      fineGoldDifference: fineGoldDiff,
      meltUpdateNotes,
      meltUpdatedAt: new Date(),
      status: 'melt_updated'
    };
    
    if (meltProof) {
      payload.meltProof = typeof meltProof === 'object' ? meltProof._id : meltProof;
    }
    
    const res = await updateMelting(selectedMelting._id, payload);
    if (res.status) {
      setNotify({ open: true, message: 'Melting updated successfully!', severity: 'success' });
      handleCloseUpdateDialog();
      fetchMeltings();
    } else {
      setNotify({ open: true, message: res.message || 'Error updating melting', severity: 'error' });
    }
  };

  const handleDeleteMelting = async (id) => {
    if (window.confirm("Are you sure you want to delete this melting record? This will revert the melted status of the ornaments.")) {
      const res = await deleteMelting(id);
      if (res.status) {
        setNotify({ open: true, message: 'Melting record deleted successfully', severity: 'success' });
        fetchMeltings();
        fetchTransits();
      } else {
        setNotify({ open: true, message: res.message || 'Error deleting melting', severity: 'error' });
      }
    }
  };

  const steps = ['Select Transit', 'Select Sales', 'Select Ornaments', 'Summary & Melt'];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'melt_proof');
      formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
      const response = await createFile(formData);
      setUploadLoading(false);
      if (response.status) {
        setMeltProof(response.data?._id);
        setNotify({ open: true, message: 'Proof uploaded successfully', severity: 'success' });
      } else {
        setNotify({ open: true, message: 'File upload failed', severity: 'error' });
      }
    }
  };

  return (
    <>
      <Helmet>
        <title> Melting | Admin </title>
      </Helmet>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={notify.open}
        onClose={() => setNotify({ ...notify, open: false })}
        autoHideDuration={3000}
      >
        <AlertComponent onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity} sx={{ width: '100%', color: 'white' }}>
          {notify.message}
        </AlertComponent>
      </Snackbar>

      <Container maxWidth="xl">
        {!openWizard ? (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
              <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
                Melting Management
              </Typography>
            </Stack>

            <Card>
              <Scrollbar>
                <TableContainer sx={{ minWidth: 800 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Transit IDs</TableCell>
                        <TableCell>Sales</TableCell>
                        <TableCell>Ornaments</TableCell>
                        <TableCell>Gross Wt.</TableCell>
                        <TableCell>Net Wt.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                        <TableRow hover key={row._id}>
                          <TableCell>{moment(row.createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                          <TableCell>{row.transitIds?.length ? row.transitIds.map(t => t.transitId).join(', ') : (row.transitId?.transitId || 'N/A')}</TableCell>
                          <TableCell>{row.saleIds?.length || 0}</TableCell>
                          <TableCell>{row.totalOrnaments}</TableCell>
                          <TableCell>{row.totalGrossWeight}</TableCell>
                          <TableCell>{row.totalNetWeight}</TableCell>
                        </TableRow>
                      ))}
                      {data.length === 0 && (
                        <TableRow>
                          <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                            <Typography variant="body1">No melting records found</Typography>
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
                count={data.length}
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
        ) : (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
              <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
                Process New Melting - {steps[activeStep]}
              </Typography>
              <Button variant="outlined" onClick={() => setOpenWizard(false)}>
                Cancel
              </Button>
            </Stack>

            <Card sx={{ p: 3, minHeight: 400 }}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
                {steps.map((label) => (
                  <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Select Received Transits</Typography>
                  <Scrollbar>
                    <TableContainer>
                      <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox"></TableCell>
                          <TableCell>Transit ID</TableCell>
                          <TableCell>Branch Name</TableCell>
                          <TableCell>Packets</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transits.map(t => (
                          <TableRow key={t._id}>
                            <TableCell padding="checkbox">
                              <Checkbox 
                                checked={selectedTransits.findIndex(x => x._id === t._id) !== -1} 
                                onChange={() => handleToggleTransit(t)} 
                              />
                            </TableCell>
                            <TableCell>{t.transitId}</TableCell>
                            <TableCell>{t.branch?.branchName || '-'}</TableCell>
                            <TableCell>{t.numberOfPackets}</TableCell>
                            <TableCell>{moment(t.createdAt).format('YYYY-MM-DD')}</TableCell>
                          </TableRow>
                        ))}
                        {transits.length === 0 && (
                          <TableRow><TableCell colSpan={5} align="center">No received transits found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  </Scrollbar>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Select Sales</Typography>
                  <Scrollbar>
                    <TableContainer sx={{ minWidth: 800 }}>
                      <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox"></TableCell>
                          <TableCell>Transit ID</TableCell>
                          <TableCell>Bill ID</TableCell>
                          <TableCell>Bill Date</TableCell>
                          <TableCell>Branch</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Ornaments</TableCell>
                          <TableCell>Sale Type</TableCell>
                          <TableCell>Net Weight</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {getSalesForSelectedTransits().map(sale => (
                          <TableRow key={sale._id}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={selectedSales.includes(sale._id)} onChange={() => handleToggleSale(sale._id)} />
                            </TableCell>
                            <TableCell>{sale.transitId || 'N/A'}</TableCell>
                            <TableCell>{sale.billId}</TableCell>
                            <TableCell>{moment(sale.createdAt).format('YYYY-MM-DD')}</TableCell>
                            <TableCell>{sale.branch?.branchName ? `${sale.branch.branchName} (${sale.branch.branchId})` : 'Unknown'}</TableCell>
                            <TableCell>{sale.customer?.name || 'Unknown'}</TableCell>
                            <TableCell>{sale.ornaments?.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0) || 0}</TableCell>
                            <TableCell>{sale.saleType}</TableCell>
                            <TableCell>{sale.netWeight}</TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined" onClick={() => setSaleIdToView(sale._id)}>View Summary</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {getSalesForSelectedTransits().length === 0 && (
                          <TableRow><TableCell colSpan={10} align="center">No sales in selected transits.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  </Scrollbar>
                </Box>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {activeStep > 0 && activeStep < 2 && <Button onClick={handleBack} variant="outlined">Back</Button>}
                {activeStep < 2 && (
                  <Button 
                    variant="contained" 
                    onClick={handleNext} 
                    disabled={
                      (activeStep === 0 && selectedTransits.length === 0) ||
                      (activeStep === 1 && selectedSales.length === 0)
                    }
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Card>
          </>
        )}
      </Container>

      {/* POPUP FOR STEPS 2 and 3 */}
      <Dialog open={openWizard && activeStep >= 2} onClose={() => {}} maxWidth="md" fullWidth disableEscapeKeyDown>
        <DialogTitle>Process New Melting - {steps[activeStep]}</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 3, pb: 5 }}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select Ornaments</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Gross Wt.</TableCell>
                      <TableCell>Net Wt.</TableCell>
                      <TableCell>Purity</TableCell>
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getOrnamentsForSelectedSales().map((orn, idx) => {
                      const isSelected = selectedOrnaments.findIndex(o => o.ornamentId === orn.ornamentId) !== -1;
                      return (
                        <TableRow key={idx}>
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} onChange={() => handleToggleOrnament(orn)} />
                          </TableCell>
                          <TableCell>{orn.ornamentType}</TableCell>
                          <TableCell>{orn.quantity}</TableCell>
                          <TableCell>{orn.grossWeight}</TableCell>
                          <TableCell>{orn.netWeight}</TableCell>
                          <TableCell>{orn.purity}</TableCell>
                          <TableCell>{orn.netAmount}</TableCell>
                        </TableRow>
                      );
                    })}
                    {getOrnamentsForSelectedSales().length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center">No available ornaments found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Summary</Typography>
              <Card sx={{ p: 3, mb: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="body1"><strong>Total Ornaments:</strong> {selectedOrnaments.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0)}</Typography>
                  <Typography variant="body1"><strong>Total Gross Weight:</strong> {summary.grossWeight.toFixed(2)}</Typography>
                  <Typography variant="body1"><strong>Total Net Weight:</strong> {summary.netWeight.toFixed(2)}</Typography>
                  <Typography variant="body1"><strong>Average Purity:</strong> {summary.avgPurity.toFixed(2)}%</Typography>
                  <Typography variant="body1"><strong>Total Net Amount:</strong> {summary.netAmount.toFixed(2)}</Typography>
                </Stack>
              </Card>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Melting Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                variant="contained"
                component="label"
                disabled={uploadLoading}
                sx={{ mt: 2 }}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Proof'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              {meltProof && typeof meltProof === 'object' && meltProof.uploadedFile ? (
                <Box component="img" src={meltProof.uploadedFile.startsWith('http') ? meltProof.uploadedFile : `${global.BASE_URL}/${meltProof.uploadedFile}`} alt="Proof" sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', mt: 2 }} />
              ) : meltProof ? (
                <Typography variant="body2" sx={{ color: 'success.main', mt: 1 }}>
                  Proof uploaded successfully!
                </Typography>
              ) : null}
            </Box>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWizard(false)} color="inherit">Cancel Wizard</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleBack}>Back</Button>
          {activeStep === 2 && (
             <Button variant="contained" onClick={handleNext} disabled={selectedOrnaments.length === 0}>
               Next
             </Button>
          )}
          {activeStep === 3 && (
             <Button variant="contained" color="primary" onClick={handleProceedToMelt} disabled={selectedOrnaments.length === 0}>
               Proceed to Melt
             </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Melt Update Dialog */}
      <Dialog open={openUpdateDialog} onClose={handleCloseUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update Melt Results</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Total Net Weight Before: <strong>{totalNetBefore.toFixed(2)} g</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Avg Purity Before: <strong>{avgPurityBefore.toFixed(2)}%</strong>
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="Final Bar Weight (g)"
                type="number"
                value={barWeight}
                onChange={(e) => setBarWeight(e.target.value)}
                fullWidth
              />
              <TextField
                label="Final Bar Purity (%)"
                type="number"
                value={barPurity}
                onChange={(e) => setBarPurity(e.target.value)}
                fullWidth
              />

              {(barWeight !== '' && barPurity !== '') && (
                <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body1">
                    Weight Diff: <strong style={{ color: weightDiff < 0 ? 'red' : 'green' }}>{weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(2)} g</strong>
                  </Typography>
                  <Typography variant="body1">
                    Purity Diff: <strong style={{ color: purityDiff < 0 ? 'red' : 'green' }}>{purityDiff > 0 ? '+' : ''}{purityDiff.toFixed(2)}%</strong>
                  </Typography>
                  <Typography variant="body1">
                    Fine Gold Profit/Loss: <strong style={{ color: fineGoldDiff < 0 ? 'red' : 'green' }}>{fineGoldDiff > 0 ? '+' : ''}{fineGoldDiff.toFixed(3)} g</strong>
                  </Typography>
                </Card>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Update Notes"
                value={meltUpdateNotes}
                onChange={(e) => setMeltUpdateNotes(e.target.value)}
              />

              <Button
                variant="contained"
                component="label"
                disabled={uploadLoading}
              >
                {uploadLoading ? 'Uploading...' : 'Upload Proof'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              {meltProof && typeof meltProof === 'object' && meltProof.uploadedFile ? (
                <Box component="img" src={meltProof.uploadedFile.startsWith('http') ? meltProof.uploadedFile : `${global.BASE_URL}/${meltProof.uploadedFile}`} alt="Proof" sx={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
              ) : meltProof ? (
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  Proof uploaded successfully!
                </Typography>
              ) : null}

            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleUpdateMelting} disabled={!barWeight || !barPurity}>
            Save Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sell Bar Dialog */}
      <Dialog open={openSellDialog} onClose={handleCloseSellDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Sell Bar</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Bar Weight: <strong>{selectedMelting?.barWeight} g</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Bar Purity: <strong>{selectedMelting?.barPurity}%</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Weight Difference: <strong>{selectedMelting?.weightDifference > 0 ? '+' : ''}{selectedMelting?.weightDifference?.toFixed(2)} g</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Purity Difference: <strong>{selectedMelting?.purityDifference > 0 ? '+' : ''}{selectedMelting?.purityDifference?.toFixed(2)}%</strong>
            </Typography>

            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Select Vendor</InputLabel>
                <Select
                  value={sellVendor}
                  label="Select Vendor"
                  onChange={(e) => setSellVendor(e.target.value)}
                >
                  {vendors.map((v) => (
                    <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Gold Rate"
                type="number"
                value={sellGoldRate}
                onChange={(e) => setSellGoldRate(e.target.value)}
                fullWidth
              />

              <TextField
                label="Total Amount"
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={sellPaymentMode}
                  label="Payment Mode"
                  onChange={(e) => setSellPaymentMode(e.target.value)}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSellDialog} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSellBarSubmit} disabled={!sellVendor || !sellGoldRate || !sellAmount || !sellPaymentMode}>
            Complete Sale
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sale Summary Dialog */}
      <Dialog open={Boolean(saleIdToView)} onClose={() => setSaleIdToView(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Sale Summary</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {saleIdToView && <SaleDetail id={saleIdToView} setNotify={setNotify} onActionComplete={() => setSaleIdToView(null)} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaleIdToView(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
