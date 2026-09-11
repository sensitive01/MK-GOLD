import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from './iconify';
import { createFile } from '../apis/branch/fileupload';
import global from '../utils/global';

export default function VerifyBankPaymentModal({
  open,
  onClose,
  saleId,
  payment,
  bank,
  onSuccess,
  setNotify,
  verifyApi,
}) {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);

  const bankName = bank?.bankName || payment?.bank?.bankName || 'Bank';
  const accountNo = bank?.accountNo || payment?.bank?.accountNo || 'N/A';
  const accountHolder = bank?.accountHolderName || 'N/A';
  const branch = bank?.branch || 'N/A';
  const ifscCode = bank?.ifscCode || 'N/A';

  const handleReset = () => {
    setAmount('');
    setAmountError('');
    setProofFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsPdf(false);
    setLoading(false);
  };

  const handleModalClose = () => {
    if (loading) return;
    handleReset();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      const isFilePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      setIsPdf(isFilePdf);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    setAmountError('');

    if (!proofFile) {
      setNotify?.({
        open: true,
        message: 'Please upload payment proof',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload proof file
      const bankLabel = bankName && accountNo && accountNo !== 'N/A'
        ? `${bankName} - ${accountNo}`
        : (bankName && bankName !== 'Bank' ? bankName : '');
      const docNo = bankLabel
        ? `${bankLabel} | ₹${Number(amount).toLocaleString('en-IN')}`
        : `₹${Number(amount).toLocaleString('en-IN')}`;

      const formData = new FormData();
      formData.append('uploadedFile', proofFile);
      formData.append('uploadId', saleId);
      formData.append('uploadName', 'verified_bank_proof');
      formData.append('documentType', 'Verified Bank Payment Proof');
      formData.append('documentNo', docNo);

      const uploadRes = await createFile(formData);
      if (!uploadRes || !uploadRes.status) {
        throw new Error(uploadRes?.message || 'File upload failed');
      }

      const uploadedProofPath = uploadRes.data?.uploadedFile;

      // 2. Call verification API
      const paymentIdentifier = payment?._id || payment?.paymentIndex || 0;
      const verifyFn = verifyApi;
      if (!verifyFn) {
        throw new Error('Verification API handler not provided');
      }

      const res = await verifyFn(saleId, paymentIdentifier, {
        amount: Number(amount),
        proof: uploadedProofPath,
      });

      if (res && res.status) {
        setNotify?.({
          open: true,
          message: 'Bank payment verified successfully',
          severity: 'success',
        });
        handleReset();
        onClose();
        onSuccess?.();
      } else {
        throw new Error(res?.message || 'Payment verification failed');
      }
    } catch (err) {
      setNotify?.({
        open: true,
        message: err.message || 'Verification failed. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <Iconify icon="mdi:bank-check" width={20} />
            </Box>
            <Typography variant="h6">Verify Bank Payment</Typography>
          </Stack>
          <IconButton onClick={handleModalClose} size="small" disabled={loading}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5, pb: 3 }}>
          <Stack spacing={2.5}>
            {/* Bank Summary Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Selected Bank Details
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                {bankName}
              </Typography>
              <Stack direction="row" spacing={3} sx={{ mt: 1 }} flexWrap="wrap">
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Account Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {accountNo}
                  </Typography>
                </Box>
                {accountHolder !== 'N/A' && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Holder Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {accountHolder}
                    </Typography>
                  </Box>
                )}
                {ifscCode !== 'N/A' && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      IFSC Code
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {ifscCode}
                    </Typography>
                  </Box>
                )}
                {branch !== 'N/A' && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      Branch
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {branch}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Amount Field (Starts Empty, No Autofill) */}
            <TextField
              name="amount"
              label="Payment Amount"
              placeholder="Enter transfer amount"
              type="number"
              fullWidth
              required
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (amountError) setAmountError('');
              }}
              onFocus={(e) => e.target.select()}
              error={Boolean(amountError)}
              helperText={amountError}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 600 }}>₹</Typography>,
              }}
            />

            {/* Upload Proof Field */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Upload Payment Proof <span style={{ color: 'red' }}>*</span>
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Iconify icon="eva:upload-fill" />}
                sx={{
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  width: '100%',
                  py: 1.75,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                {proofFile ? 'Change Proof File' : 'Select Payment Receipt / Screenshot'}
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </Button>

              {/* Preview */}
              {previewUrl && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden' }}>
                    {isPdf ? (
                      <img src="/assets/doc.svg" alt="pdf" style={{ width: 28, height: 28 }} />
                    ) : (
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="preview"
                        sx={{ width: 44, height: 44, borderRadius: 1, objectFit: 'cover' }}
                      />
                    )}
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: 280 }}>
                        {proofFile?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {(proofFile?.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setProofFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setIsPdf(false);
                    }}
                  >
                    <Iconify icon="eva:trash-2-outline" width={18} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleModalClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            startIcon={<Iconify icon="eva:checkmark-circle-fill" />}
            sx={{ px: 3 }}
          >
            Submit Verification
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

VerifyBankPaymentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  saleId: PropTypes.string,
  payment: PropTypes.object,
  bank: PropTypes.object,
  onSuccess: PropTypes.func,
  setNotify: PropTypes.func,
  verifyApi: PropTypes.func.isRequired,
};
