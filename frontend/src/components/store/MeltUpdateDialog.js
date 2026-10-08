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
  Card,
  IconButton,
  Alert,
} from '@mui/material';
import Iconify from '../iconify';
import { updateMelting } from '../../apis/admin/melting';
import { createFile } from '../../apis/branch/fileupload';
import global from '../../utils/global';

MeltUpdateDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  selectedMelting: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default function MeltUpdateDialog({ open, onClose, selectedMelting, onSuccess }) {
  const [actualGrossWeight, setActualGrossWeight] = useState('');
  const [actualNetWeight, setActualNetWeight] = useState('');
  const [actualStoneWastage, setActualStoneWastage] = useState('');
  const [preMeltProof, setPreMeltProof] = useState(null);
  const [preMeltProofName, setPreMeltProofName] = useState('');
  const [preMeltNotes, setPreMeltNotes] = useState('');
  const [isPreMeltCompleted, setIsPreMeltCompleted] = useState(false);

  const [barWeight, setBarWeight] = useState('');
  const [barPurity, setBarPurity] = useState('');
  const [meltUpdateNotes, setMeltUpdateNotes] = useState('');
  const [afterMeltProof, setAfterMeltProof] = useState(null);
  const [afterMeltProofName, setAfterMeltProofName] = useState('');

  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedMelting && open) {
      const isCompleted = Boolean(selectedMelting.isPreMeltCompleted);
      setIsPreMeltCompleted(isCompleted);

      setActualGrossWeight(
        selectedMelting.actualGrossWeight !== undefined && selectedMelting.actualGrossWeight !== null
          ? selectedMelting.actualGrossWeight
          : ''
      );
      setActualNetWeight(
        selectedMelting.actualNetWeight !== undefined && selectedMelting.actualNetWeight !== null
          ? selectedMelting.actualNetWeight
          : ''
      );

      const stoneW =
        selectedMelting.actualGrossWeight !== undefined &&
        selectedMelting.actualGrossWeight !== null &&
        selectedMelting.actualNetWeight !== undefined &&
        selectedMelting.actualNetWeight !== null
          ? (Number(selectedMelting.actualGrossWeight) - Number(selectedMelting.actualNetWeight)).toFixed(2)
          : selectedMelting.actualStoneWastage !== undefined && selectedMelting.actualStoneWastage !== null
          ? selectedMelting.actualStoneWastage
          : '';
      setActualStoneWastage(stoneW);

      setPreMeltProof(selectedMelting.preMeltProof || null);
      setPreMeltProofName('');
      setPreMeltNotes(selectedMelting.preMeltNotes || selectedMelting.notes || '');

      setBarWeight(selectedMelting.barWeight || '');
      setBarPurity(selectedMelting.barPurity || '');
      setMeltUpdateNotes(selectedMelting.meltUpdateNotes || '');
      setAfterMeltProof(selectedMelting.afterMeltProof || null);
      setAfterMeltProofName('');
      setErrorMsg('');
    }
  }, [selectedMelting, open]);

  const onActualGrossChange = (val) => {
    setActualGrossWeight(val);
    if (val !== '' && actualNetWeight !== '') {
      setActualStoneWastage((Number(val) - Number(actualNetWeight)).toFixed(2));
    } else {
      setActualStoneWastage('');
    }
  };

  const onActualNetChange = (val) => {
    setActualNetWeight(val);
    if (actualGrossWeight !== '' && val !== '') {
      setActualStoneWastage((Number(actualGrossWeight) - Number(val)).toFixed(2));
    } else {
      setActualStoneWastage('');
    }
  };

  const handlePreFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      setErrorMsg('');
      try {
        const formData = new FormData();
        formData.append('uploadedFile', file);
        formData.append('uploadName', 'pre_melt_proof');
        formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
        const response = await createFile(formData);
        if (response?.status) {
          setPreMeltProof(response.data);
          setPreMeltProofName(file.name);
        } else {
          setErrorMsg('Pre-melt proof upload failed');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error uploading file');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleAfterFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      setErrorMsg('');
      try {
        const formData = new FormData();
        formData.append('uploadedFile', file);
        formData.append('uploadName', 'after_melt_proof');
        formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
        const response = await createFile(formData);
        if (response?.status) {
          setAfterMeltProof(response.data);
          setAfterMeltProofName(file.name);
        } else {
          setErrorMsg('After-melt proof upload failed');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error uploading file');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  // Calculations for Stage 2
  const baseNetWeight = selectedMelting ? Number(selectedMelting.totalNetWeight) || 0 : 0;
  const totalNetBefore = selectedMelting ? Number(selectedMelting.totalNetWeight) || 0 : 0;
  let totalFineBefore = 0;
  if (selectedMelting && selectedMelting.ornaments) {
    selectedMelting.ornaments.forEach((orn) => {
      totalFineBefore += (Number(orn.netWeight) * Number(orn.purity)) / 100;
    });
  }

  const currentBarWeight = Number(barWeight) || 0;
  const currentBarPurity = Number(barPurity) || 0;
  const weightDiff = currentBarWeight - baseNetWeight;
  const avgPurityBefore = totalNetBefore ? (totalFineBefore / totalNetBefore) * 100 : 0;
  const purityDiff = currentBarPurity - avgPurityBefore;
  const fineGoldBefore = baseNetWeight * (avgPurityBefore / 100);
  const currentFineAfter = currentBarWeight * (currentBarPurity / 100);
  const fineGoldDiff = currentFineAfter - fineGoldBefore;

  // Handler for Stage 1: Before Melting
  const handleProceedToMeltSubmit = async () => {
    if (!actualGrossWeight || !actualNetWeight) {
      setErrorMsg('Please enter Actual Gross Weight and Actual Net Weight');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const wastage = Number(actualGrossWeight) - Number(actualNetWeight);
      const payload = {
        actualGrossWeight: Number(actualGrossWeight),
        actualNetWeight: Number(actualNetWeight),
        actualStoneWastage: Number(wastage.toFixed(2)),
        isPreMeltCompleted: true,
        status: 'in_melt',
        preMeltNotes,
        notes: preMeltNotes || selectedMelting?.notes || '',
      };
      if (preMeltProof) {
        payload.preMeltProof = typeof preMeltProof === 'object' ? preMeltProof._id : preMeltProof;
      }
      const res = await updateMelting(selectedMelting._id, payload);
      if (res?.status) {
        if (onSuccess) onSuccess('Before melting details saved. Status updated to In Melting!');
        onClose();
      } else {
        setErrorMsg(res?.message || 'Error saving before melting details');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating melting');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for Stage 2: After Melting
  const handleUpdateMeltingSubmit = async () => {
    if (!barWeight || !barPurity) {
      setErrorMsg('Please enter Final Bar Weight and Bar Purity');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        barWeight: currentBarWeight,
        barPurity: currentBarPurity,
        weightDifference: weightDiff,
        purityDifference: purityDiff,
        fineGoldDifference: fineGoldDiff,
        meltUpdateNotes,
        meltUpdatedAt: new Date(),
        status: 'melt_updated',
      };
      if (afterMeltProof) {
        payload.afterMeltProof = typeof afterMeltProof === 'object' ? afterMeltProof._id : afterMeltProof;
      }
      const res = await updateMelting(selectedMelting._id, payload);
      if (res?.status) {
        if (onSuccess) onSuccess('After melting details saved. Melting process completed!');
        onClose();
      } else {
        setErrorMsg(res?.message || 'Error updating melting');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error updating melting');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1a237e', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {!isPreMeltCompleted ? 'Before Melting - Pre-Melt Details' : 'After Melting - Final Bar Details'}
        </span>
        {selectedMelting?.batchNumber && (
          <Typography variant="subtitle2" sx={{ bgcolor: '#ede7f6', color: '#7b1fa2', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 700 }}>
            Batch: {selectedMelting.batchNumber}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Box sx={{ mt: 1 }}>
          {/* Top Stats Row */}
          <Stack direction="row" spacing={3} sx={{ mb: 2.5, flexWrap: 'wrap', color: 'text.secondary', fontWeight: 500 }}>
            <Typography variant="body2">
              Total Gross Weight : <strong>{(Number(selectedMelting?.totalGrossWeight) || 0).toFixed(2)} g</strong>
            </Typography>
            <Typography variant="body2">
              Total Net Weight : <strong>{(Number(selectedMelting?.totalNetWeight) || 0).toFixed(2)} g</strong>
            </Typography>
            <Typography variant="body2">
              Expected Stone : <strong>{((Number(selectedMelting?.totalGrossWeight) || 0) - (Number(selectedMelting?.totalNetWeight) || 0)).toFixed(2)} g</strong>
            </Typography>
          </Stack>

          {/* Pre-Melt Section */}
          <Grid container spacing={2} alignItems="stretch">
            {/* Left Column: Actual Gross & Actual Net */}
            <Grid item xs={12} sm={4}>
              <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                <TextField
                  label="Actual Gross Weight (g)"
                  type="number"
                  value={actualGrossWeight}
                  onChange={(e) => onActualGrossChange(e.target.value)}
                  InputProps={{ readOnly: isPreMeltCompleted }}
                  fullWidth
                />
                <TextField
                  label="Actual Net Weight (g)"
                  type="number"
                  value={actualNetWeight}
                  onChange={(e) => onActualNetChange(e.target.value)}
                  InputProps={{ readOnly: isPreMeltCompleted }}
                  fullWidth
                />
              </Stack>
            </Grid>

            {/* Center Column: Upload Proof */}
            <Grid item xs={12} sm={4}>
              <Box
                component={isPreMeltCompleted ? 'div' : 'label'}
                sx={{
                  border: '1px dashed #c4c4c4',
                  borderRadius: 1,
                  height: '100%',
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isPreMeltCompleted ? 'default' : 'pointer',
                  p: 1.5,
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  '&:hover': { borderColor: isPreMeltCompleted ? '#c4c4c4' : 'primary.main' },
                }}
              >
                {!isPreMeltCompleted && (
                  <input type="file" hidden accept="image/*,.pdf" onChange={handlePreFileUpload} disabled={uploadLoading} />
                )}

                {preMeltProof && typeof preMeltProof === 'object' && preMeltProof.uploadedFile ? (
                  preMeltProof.uploadedFile.toLowerCase().endsWith('.pdf') ? (
                    <Stack alignItems="center" spacing={0.5}>
                      <Iconify icon="mdi:file-pdf-box" width={40} sx={{ color: 'error.main' }} />
                      <Typography variant="caption" noWrap sx={{ maxWidth: 160 }}>
                        {preMeltProofName || 'Proof PDF'}
                      </Typography>
                      {!isPreMeltCompleted && (
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Click to change</Typography>
                      )}
                    </Stack>
                  ) : (
                    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <Box
                        component="img"
                        src={preMeltProof.uploadedFile.startsWith('http') ? preMeltProof.uploadedFile : `${global.BASE_URL}/${preMeltProof.uploadedFile}`}
                        alt="Pre Melt Proof"
                        sx={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain', borderRadius: 0.5 }}
                      />
                      {!isPreMeltCompleted && (
                        <Typography variant="caption" sx={{ color: 'primary.main', mt: 0.5, fontWeight: 600 }}>Click to change</Typography>
                      )}
                    </Box>
                  )
                ) : preMeltProof ? (
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {preMeltProofName || '✓ Proof Uploaded'}
                  </Typography>
                ) : (
                  <Stack alignItems="center" spacing={0.5}>
                    <Iconify icon="eva:cloud-upload-outline" width={28} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {uploadLoading ? 'Uploading...' : 'Upload Pre-Melt Proof'}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Grid>

            {/* Right Column: Actual Stone & Action Button */}
            <Grid item xs={12} sm={4}>
              <Stack spacing={2} sx={{ height: '100%', justifyContent: 'space-between' }}>
                <TextField
                  label="Actual Stone (g)"
                  type="number"
                  value={actualStoneWastage}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                {!isPreMeltCompleted ? (
                  <Button
                    variant="contained"
                    onClick={handleProceedToMeltSubmit}
                    disabled={!actualGrossWeight || !actualNetWeight || uploadLoading || submitting}
                    sx={{
                      bgcolor: '#ed6c02',
                      color: '#fff',
                      fontWeight: 700,
                      height: 54,
                      '&:hover': { bgcolor: '#e65100' },
                    }}
                    fullWidth
                  >
                    {submitting ? 'Saving...' : 'Proceed to Melt'}
                  </Button>
                ) : (
                  <TextField
                    label="Avg Purity Before"
                    value={`${avgPurityBefore.toFixed(2)}%`}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                )}
              </Stack>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                label="Pre-Melting Notes"
                multiline
                rows={2}
                value={preMeltNotes}
                onChange={(e) => setPreMeltNotes(e.target.value)}
                placeholder="Enter any pre-melting remarks, custody instructions..."
                fullWidth
                InputProps={{ readOnly: isPreMeltCompleted }}
              />
            </Grid>
          </Grid>

          {/* Stage 2: Final Bar Details (Active when isPreMeltCompleted) */}
          {isPreMeltCompleted && (
            <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a237e', mb: 2 }}>
                After Melting - Bar Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Final Bar Weight (g) *"
                    type="number"
                    value={barWeight}
                    onChange={(e) => setBarWeight(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Final Bar Purity (%) *"
                    type="number"
                    value={barPurity}
                    onChange={(e) => setBarPurity(e.target.value)}
                    fullWidth
                  />
                </Grid>

                {barWeight !== '' && barPurity !== '' && (
                  <Grid item xs={12}>
                    <Card sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Stack direction="row" spacing={3} flexWrap="wrap">
                        <Typography variant="body2">
                          Weight Diff (vs Total Net Wt):{' '}
                          <strong style={{ color: weightDiff < 0 ? 'red' : 'green' }}>
                            {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(2)} g
                          </strong>
                        </Typography>
                        <Typography variant="body2">
                          Purity Diff:{' '}
                          <strong style={{ color: purityDiff < 0 ? 'red' : 'green' }}>
                            {purityDiff > 0 ? '+' : ''}{purityDiff.toFixed(2)}%
                          </strong>
                        </Typography>
                        <Typography variant="body2">
                          Fine Gold Diff:{' '}
                          <strong style={{ color: fineGoldDiff < 0 ? 'red' : 'green' }}>
                            {fineGoldDiff > 0 ? '+' : ''}{fineGoldDiff.toFixed(2)} g
                          </strong>
                        </Typography>
                      </Stack>
                    </Card>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="After Melt Update Notes"
                    value={meltUpdateNotes}
                    onChange={(e) => setMeltUpdateNotes(e.target.value)}
                  />
                </Grid>

                {/* Big Yellow Button: Upload After Melt Proof */}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    component="label"
                    disabled={uploadLoading}
                    sx={{
                      bgcolor: '#ffb300',
                      color: '#000',
                      fontWeight: 700,
                      height: 48,
                      '&:hover': { bgcolor: '#ffa000' },
                    }}
                    fullWidth
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload After Melt Proof'}
                    <input type="file" hidden accept="image/*,.pdf" onChange={handleAfterFileUpload} />
                  </Button>
                </Grid>

                {afterMeltProof && typeof afterMeltProof === 'object' && afterMeltProof.uploadedFile ? (
                  <Grid item xs={12}>
                    {afterMeltProof.uploadedFile.toLowerCase().endsWith('.pdf') ? (
                      <Box
                        component="iframe"
                        src={afterMeltProof.uploadedFile.startsWith('http') ? afterMeltProof.uploadedFile : `${global.BASE_URL}/${afterMeltProof.uploadedFile}`}
                        title="After Melt Proof"
                        sx={{ width: '100%', height: 180, border: 'none' }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={afterMeltProof.uploadedFile.startsWith('http') ? afterMeltProof.uploadedFile : `${global.BASE_URL}/${afterMeltProof.uploadedFile}`}
                        alt="After Melt Proof"
                        sx={{ width: '100%', maxHeight: 180, objectFit: 'contain' }}
                      />
                    )}
                  </Grid>
                ) : afterMeltProof ? (
                  <Grid item xs={12}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ color: 'success.main' }}>
                        {afterMeltProofName || '✓ After Melt Proof uploaded successfully!'}
                      </Typography>
                      <IconButton size="small" onClick={() => { setAfterMeltProof(null); setAfterMeltProofName(''); }} sx={{ color: 'error.main' }}>
                        <Iconify icon="eva:close-fill" />
                      </IconButton>
                    </Stack>
                  </Grid>
                ) : null}
              </Grid>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        {isPreMeltCompleted && (
          <Button
            variant="contained"
            onClick={handleUpdateMeltingSubmit}
            disabled={!barWeight || !barPurity || uploadLoading || submitting}
            sx={{ bgcolor: '#7b1fa2', color: '#fff', '&:hover': { bgcolor: '#6a1b9a' } }}
          >
            {submitting ? 'Saving...' : 'Save After Melting Details'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
