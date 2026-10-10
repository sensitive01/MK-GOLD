import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Stack,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import moment from 'moment';
import Iconify from './iconify';
import { updateMelting } from '../apis/admin/melting';
import { createFile } from '../apis/branch/fileupload';

const steps = ['Vendor Assay & Weight', 'Gold Rate & Invoicing'];

export default function VendorSettlementModal({ open, onClose, selectedMelting, vendor, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);

  // Step 1 fields
  const [actualWeight, setActualWeight] = useState('');
  const [actualPurity, setActualPurity] = useState('');
  const [purityPhoto, setPurityPhoto] = useState(null);
  const [purityPhotoName, setPurityPhotoName] = useState('');
  const [purityCertificate, setPurityCertificate] = useState(null);
  const [purityCertificateName, setPurityCertificateName] = useState('');

  // Step 2 fields
  const [goldRate, setGoldRate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedMelting && open) {
      setActiveStep(0);
      setActualWeight(selectedMelting.actualWeight || selectedMelting.barWeight || '');
      setActualPurity(selectedMelting.actualPurity || selectedMelting.barPurity || '');
      setPurityPhoto(selectedMelting.purityPhoto || null);
      setPurityPhotoName(selectedMelting.purityPhoto?.fileName || '');
      setPurityCertificate(selectedMelting.purityCertificate || null);
      setPurityCertificateName(selectedMelting.purityCertificate?.fileName || '');

      setGoldRate(selectedMelting.goldRate || '');
      setTotalAmount(selectedMelting.sellAmount || '');
      setPaymentMode(selectedMelting.paymentMode || 'Bank Transfer');
      setIsAmountManuallyEdited(Boolean(selectedMelting.sellAmount));
      setErrorMsg('');
    }
  }, [selectedMelting, open]);

  // Calculations for Step 1 & 2
  const barWeight = Number(actualWeight) || 0;
  const barPurity = Number(actualPurity) || 0;
  const fineGoldGrams = (barWeight * barPurity) / 100;
  const dispatchedBarWeight = Number(selectedMelting?.barWeight) || 0;
  const dispatchedBarPurity = Number(selectedMelting?.barPurity) || 0;
  const weightVariance = barWeight - dispatchedBarWeight;
  const purityVariance = barPurity - dispatchedBarPurity;

  // Auto-calculate Total Amount when gold rate changes unless manually edited
  useEffect(() => {
    if (goldRate && fineGoldGrams > 0 && !isAmountManuallyEdited) {
      const calculated = fineGoldGrams * Number(goldRate);
      setTotalAmount(calculated ? calculated.toFixed(2) : '');
    }
  }, [goldRate, fineGoldGrams, isAmountManuallyEdited]);

  const handlePurityPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      setErrorMsg('');
      try {
        const formData = new FormData();
        formData.append('uploadedFile', file);
        formData.append('uploadName', 'purity_photo');
        formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
        const response = await createFile(formData);
        if (response?.status) {
          setPurityPhoto(response.data);
          setPurityPhotoName(file.name);
        } else {
          setErrorMsg('Photo upload failed');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error uploading file');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handlePurityCertUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      setErrorMsg('');
      try {
        const formData = new FormData();
        formData.append('uploadedFile', file);
        formData.append('uploadName', 'purity_certificate');
        formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
        const response = await createFile(formData);
        if (response?.status) {
          setPurityCertificate(response.data);
          setPurityCertificateName(file.name);
        } else {
          setErrorMsg('Certificate upload failed');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error uploading certificate');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleNext = () => {
    if (!actualWeight || Number(actualWeight) <= 0) {
      setErrorMsg('Please enter valid Gatty Weight');
      return;
    }
    if (!actualPurity || Number(actualPurity) <= 0 || Number(actualPurity) > 100) {
      setErrorMsg('Please enter valid Purity Percentage (0 - 100%)');
      return;
    }
    if (!purityPhoto) {
      setErrorMsg('Purity Photo (Bar / Scale Picture) proof is mandatory');
      return;
    }
    if (!purityCertificate) {
      setErrorMsg('Purity Certificate / Assay Slip proof is mandatory');
      return;
    }
    setErrorMsg('');
    setActiveStep(1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setActiveStep(0);
  };

  const handleSubmit = async () => {
    if (!goldRate || Number(goldRate) <= 0) {
      setErrorMsg('Please enter a valid Gold Rate');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      setErrorMsg('Please enter or verify Total Amount');
      return;
    }
    if (!paymentMode) {
      setErrorMsg('Please select Payment Mode');
      return;
    }
    if (!purityPhoto) {
      setErrorMsg('Purity Photo (Bar / Scale Picture) proof is mandatory');
      return;
    }
    if (!purityCertificate) {
      setErrorMsg('Purity Certificate / Assay Slip proof is mandatory');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const invoiceNumber = `INV-${selectedMelting?.batchNumber || moment().format('YYMMDD-001')}`;
      const payload = {
        status: 'sold',
        actualWeight: Number(actualWeight),
        actualPurity: Number(actualPurity),
        purityPhoto: purityPhoto?._id || purityPhoto,
        purityCertificate: purityCertificate?._id || purityCertificate,
        goldRate: Number(goldRate),
        sellAmount: Number(totalAmount),
        paymentMode,
        invoiceNumber,
        invoiceDate: new Date(),
        vendor: vendor?._id || selectedMelting?.vendor?._id || selectedMelting?.vendor,
      };

      const res = await updateMelting(selectedMelting._id, payload);
      if (res.status) {
        onSuccess({ ...selectedMelting, ...payload, vendor: vendor || selectedMelting?.vendor });
      } else {
        setErrorMsg(res.message || 'Error completing sale and generating invoice');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const currentVendor = vendor || selectedMelting?.vendor;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Vendor Settlement & Invoice Generation</Typography>
          <Chip label={`Batch: ${selectedMelting?.batchNumber || '-'}`} color="primary" variant="outlined" size="small" />
        </Stack>
      </DialogTitle>

      <Box sx={{ width: '100%', px: 3, pt: 1, pb: 2 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        {/* STEP 1: Vendor Assay & Weight */}
        {activeStep === 0 && (
          <Stack spacing={3}>
            {/* Reference Dispatch Stats */}
            <Card sx={{ p: 2, bgcolor: '#f5f7fa', border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Dispatched Bar Reference (MK Gold Initial Melting)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Dispatched Weight</Typography>
                  <Typography variant="body1" fontWeight="bold">{dispatchedBarWeight.toFixed(3)} g</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Dispatched Purity</Typography>
                  <Typography variant="body1" fontWeight="bold">{dispatchedBarPurity.toFixed(2)}%</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Assigned Vendor</Typography>
                  <Typography variant="body1" fontWeight="bold">{currentVendor?.name || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Gatty Weight / Actual Weight (g)"
                  type="number"
                  fullWidth
                  required
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  helperText={
                    weightVariance !== 0
                      ? `Variance: ${weightVariance > 0 ? '+' : ''}${weightVariance.toFixed(3)} g`
                      : 'Weight as measured by vendor'
                  }
                  FormHelperTextProps={{
                    sx: { color: weightVariance < 0 ? 'error.main' : 'text.secondary' }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Purity Percentage / Actual Purity (%)"
                  type="number"
                  fullWidth
                  required
                  value={actualPurity}
                  onChange={(e) => setActualPurity(e.target.value)}
                  helperText={
                    purityVariance !== 0
                      ? `Variance: ${purityVariance > 0 ? '+' : ''}${purityVariance.toFixed(2)}%`
                      : 'Tested/Assayed purity percentage'
                  }
                  FormHelperTextProps={{
                    sx: { color: purityVariance < 0 ? 'error.main' : 'text.secondary' }
                  }}
                />
              </Grid>
            </Grid>

            {/* Calculated Fine Gold */}
            <Card sx={{ p: 2, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="success.dark">Calculated Fine Gold (Pure 24K equivalent)</Typography>
                  <Typography variant="h5" color="success.dark" fontWeight="bold">
                    {fineGoldGrams.toFixed(3)} g
                  </Typography>
                </Box>
                <Chip label="Formula: (Weight × Purity) / 100" size="small" color="success" variant="outlined" />
              </Stack>
            </Card>

            {/* File Uploads */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Purity Photo (Bar / Scale Picture) <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<Iconify icon={purityPhoto ? 'eva:checkmark-circle-2-fill' : 'eva:camera-fill'} />}
                  color={purityPhoto ? 'success' : 'primary'}
                  disabled={uploadLoading}
                  sx={{
                    borderStyle: purityPhoto ? 'solid' : 'dashed',
                    borderWidth: 1.5,
                  }}
                >
                  {purityPhotoName ? 'Change Purity Photo' : 'Upload Purity Photo *'}
                  <input type="file" hidden accept="image/*" onChange={handlePurityPhotoUpload} />
                </Button>
                {purityPhotoName ? (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                    ✓ Uploaded: {purityPhotoName}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                    * Purity Photo proof is mandatory
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Purity Certificate / Assay Slip <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<Iconify icon={purityCertificate ? 'eva:checkmark-circle-2-fill' : 'eva:file-text-fill'} />}
                  color={purityCertificate ? 'success' : 'primary'}
                  disabled={uploadLoading}
                  sx={{
                    borderStyle: purityCertificate ? 'solid' : 'dashed',
                    borderWidth: 1.5,
                  }}
                >
                  {purityCertificateName ? 'Change Certificate' : 'Upload Purity Certificate *'}
                  <input type="file" hidden accept="image/*,application/pdf" onChange={handlePurityCertUpload} />
                </Button>
                {purityCertificateName ? (
                  <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                    ✓ Uploaded: {purityCertificateName}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                    * Purity Certificate proof is mandatory
                  </Typography>
                )}
              </Grid>
            </Grid>

            {uploadLoading && (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Uploading attachment...</Typography>
              </Stack>
            )}
          </Stack>
        )}

        {/* STEP 2: Commercials & Settlement */}
        {activeStep === 1 && (
          <Stack spacing={3}>
            {/* Summary Banner */}
            <Card sx={{ p: 2, bgcolor: '#f5f7fa', border: '1px solid #e0e0e0' }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Vendor</Typography>
                  <Typography variant="body2" fontWeight="bold">{currentVendor?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Gatty Weight</Typography>
                  <Typography variant="body2" fontWeight="bold">{barWeight.toFixed(3)} g</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Purity</Typography>
                  <Typography variant="body2" fontWeight="bold">{barPurity.toFixed(2)}%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Fine Gold</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.dark">
                    {fineGoldGrams.toFixed(3)} g
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Gold Rate (₹ per gram)"
                  type="number"
                  fullWidth
                  required
                  value={goldRate}
                  onChange={(e) => {
                    setGoldRate(e.target.value);
                    setIsAmountManuallyEdited(false);
                  }}
                  helperText="Rate per gram of fine gold"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    value={paymentMode}
                    label="Payment Mode"
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <MenuItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Total Amount (₹)"
                  type="number"
                  fullWidth
                  required
                  value={totalAmount}
                  onChange={(e) => {
                    setTotalAmount(e.target.value);
                    setIsAmountManuallyEdited(true);
                  }}
                  helperText={
                    isAmountManuallyEdited
                      ? 'Manually edited amount'
                      : `Auto-calculated: ${fineGoldGrams.toFixed(3)}g × ₹${goldRate || 0} (Editable)`
                  }
                  FormHelperTextProps={{
                    sx: { color: isAmountManuallyEdited ? 'warning.main' : 'text.secondary' }
                  }}
                />
              </Grid>
            </Grid>

            {totalAmount && (
              <Card sx={{ p: 2, bgcolor: '#e8f5e9', border: '1px solid #81c784' }}>
                <Typography variant="caption" color="success.dark">Total Settlement Invoice Amount</Typography>
                <Typography variant="h4" color="success.dark" fontWeight="bold">
                  ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Card>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {activeStep === 0 ? (
          <>
            <Button onClick={onClose} color="inherit">Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleNext} disabled={uploadLoading}>
              Next: Rate & Invoicing
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBack} color="inherit" disabled={submitting}>Back</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmit}
              disabled={submitting || !goldRate || !totalAmount}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Iconify icon="eva:file-text-fill" />}
            >
              {submitting ? 'Generating Invoice...' : 'Generate Invoice'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

VendorSettlementModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  selectedMelting: PropTypes.object,
  vendor: PropTypes.object,
  onSuccess: PropTypes.func,
};
