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
  const [preMeltProofs, setPreMeltProofs] = useState([]);
  const [activePreProofIdx, setActivePreProofIdx] = useState(0);
  const [preMeltNotes, setPreMeltNotes] = useState('');
  const [isPreMeltCompleted, setIsPreMeltCompleted] = useState(false);

  const [barWeight, setBarWeight] = useState('');
  const [barPurity, setBarPurity] = useState('');
  const [meltUpdateNotes, setMeltUpdateNotes] = useState('');
  const [afterMeltProof, setAfterMeltProof] = useState(null);
  const [afterMeltProofName, setAfterMeltProofName] = useState('');
  const [afterMeltProofs, setAfterMeltProofs] = useState([]);

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

      const preList = (selectedMelting.preMeltProofs && selectedMelting.preMeltProofs.length > 0)
        ? selectedMelting.preMeltProofs
        : (selectedMelting.preMeltProof ? [selectedMelting.preMeltProof] : []);
      setPreMeltProofs(preList);
      setPreMeltProof(preList[0] || null);
      setPreMeltProofName('');
      setActivePreProofIdx(0);
      setPreMeltNotes(selectedMelting.preMeltNotes || selectedMelting.notes || '');

      setBarWeight(selectedMelting.barWeight || '');
      setBarPurity(selectedMelting.barPurity || '');
      setMeltUpdateNotes(selectedMelting.meltUpdateNotes || '');

      const afterList = (selectedMelting.afterMeltProofs && selectedMelting.afterMeltProofs.length > 0)
        ? selectedMelting.afterMeltProofs
        : (selectedMelting.afterMeltProof ? [selectedMelting.afterMeltProof] : []);
      setAfterMeltProofs(afterList);
      setAfterMeltProof(afterList[0] || null);
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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadLoading(true);
      setErrorMsg('');
      const newProofs = [];
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('uploadedFile', file);
          formData.append('uploadName', 'pre_melt_proof');
          formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
          const response = await createFile(formData);
          if (response?.status && response?.data) {
            newProofs.push({ ...response.data, fileName: file.name });
          }
        } catch (err) {
          console.error('Error uploading pre-melt file:', err);
        }
      }
      setUploadLoading(false);
      if (newProofs.length > 0) {
        setPreMeltProofs((prev) => {
          const updated = [...prev, ...newProofs];
          setPreMeltProof(updated[0] || null);
          return updated;
        });
      } else {
        setErrorMsg('Pre-melt proof upload failed');
      }
      e.target.value = '';
    }
  };

  const handleRemovePreProof = (indexToRemove) => {
    setPreMeltProofs((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      setPreMeltProof(updated[0] || null);
      if (activePreProofIdx >= updated.length) {
        setActivePreProofIdx(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleAfterFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadLoading(true);
      setErrorMsg('');
      const newProofs = [];
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append('uploadedFile', file);
          formData.append('uploadName', 'after_melt_proof');
          formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
          const response = await createFile(formData);
          if (response?.status && response?.data) {
            newProofs.push({ ...response.data, fileName: file.name });
          }
        } catch (err) {
          console.error('Error uploading after-melt file:', err);
        }
      }
      setUploadLoading(false);
      if (newProofs.length > 0) {
        setAfterMeltProofs((prev) => {
          const updated = [...prev, ...newProofs];
          setAfterMeltProof(updated[0] || null);
          return updated;
        });
      } else {
        setErrorMsg('After-melt proof upload failed');
      }
      e.target.value = '';
    }
  };

  const handleRemoveAfterProof = (indexToRemove) => {
    setAfterMeltProofs((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      setAfterMeltProof(updated[0] || null);
      return updated;
    });
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
      if (preMeltProofs && preMeltProofs.length > 0) {
        payload.preMeltProofs = preMeltProofs.map(p => (typeof p === 'object' ? p._id : p));
        payload.preMeltProof = typeof preMeltProofs[0] === 'object' ? preMeltProofs[0]._id : preMeltProofs[0];
      } else if (preMeltProof) {
        payload.preMeltProof = typeof preMeltProof === 'object' ? preMeltProof._id : preMeltProof;
        payload.preMeltProofs = [payload.preMeltProof];
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
      if (afterMeltProofs && afterMeltProofs.length > 0) {
        payload.afterMeltProofs = afterMeltProofs.map(p => (typeof p === 'object' ? p._id : p));
        payload.afterMeltProof = typeof afterMeltProofs[0] === 'object' ? afterMeltProofs[0]._id : afterMeltProofs[0];
      } else if (afterMeltProof) {
        payload.afterMeltProof = typeof afterMeltProof === 'object' ? afterMeltProof._id : afterMeltProof;
        payload.afterMeltProofs = [payload.afterMeltProof];
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
                  <input type="file" multiple hidden accept="image/*,.pdf" onChange={handlePreFileUpload} disabled={uploadLoading} />
                )}

                {(() => {
                  const activeProof = preMeltProofs[activePreProofIdx] || preMeltProofs[0] || preMeltProof;
                  if (activeProof && typeof activeProof === 'object' && activeProof.uploadedFile) {
                    const fileUrl = activeProof.uploadedFile;
                    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${global.BASE_URL}/${fileUrl}`;
                    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                    return (
                      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}>
                        {isPdf ? (
                          <Stack alignItems="center" spacing={0.5} onClick={() => window.open(fullUrl, '_blank')} sx={{ cursor: 'pointer' }}>
                            <Iconify icon="mdi:file-pdf-box" width={38} sx={{ color: 'error.main' }} />
                            <Typography variant="caption" noWrap sx={{ maxWidth: 140, fontWeight: 600 }}>
                              {activeProof.fileName || 'Proof PDF'}
                            </Typography>
                          </Stack>
                        ) : (
                          <Box
                            component="img"
                            src={fullUrl}
                            alt="Pre Melt Proof"
                            title="Click to view full image"
                            onClick={(e) => { e.stopPropagation(); window.open(fullUrl, '_blank'); }}
                            sx={{ maxHeight: preMeltProofs.length > 1 ? 75 : 90, maxWidth: '100%', objectFit: 'contain', borderRadius: 0.5, cursor: 'pointer' }}
                          />
                        )}

                        {preMeltProofs.length > 1 && (
                          <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, maxWidth: '100%', overflowX: 'auto', py: 0.25 }}>
                            {preMeltProofs.map((p, idx) => {
                              const pUrl = p?.uploadedFile || '';
                              const pFull = pUrl.startsWith('http') ? pUrl : `${global.BASE_URL}/${pUrl}`;
                              const isCurrent = activePreProofIdx === idx;
                              return (
                                <Box
                                  key={p._id || idx}
                                  onClick={(e) => { e.stopPropagation(); setActivePreProofIdx(idx); }}
                                  title={`View photo ${idx + 1}`}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.5,
                                    border: isCurrent ? '2px solid #7b1fa2' : '1px solid #ccc',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    opacity: isCurrent ? 1 : 0.6,
                                    '&:hover': { opacity: 1 },
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={pFull}
                                    alt={`thumb-${idx}`}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </Box>
                              );
                            })}
                          </Stack>
                        )}

                        {!isPreMeltCompleted && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                              + Add More ({preMeltProofs.length})
                            </Typography>
                            {preMeltProofs.length > 0 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePreProof(activePreProofIdx);
                                }}
                                title="Remove current photo"
                                sx={{ p: 0.25 }}
                              >
                                <Iconify icon="eva:trash-2-outline" width={16} />
                              </IconButton>
                            )}
                          </Stack>
                        )}
                      </Box>
                    );
                  }
                  if (preMeltProof) {
                    return (
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                        {preMeltProofName || '✓ Proof Uploaded'}
                      </Typography>
                    );
                  }
                  return (
                    <Stack alignItems="center" spacing={0.5}>
                      <Iconify icon="eva:cloud-upload-outline" width={28} sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {uploadLoading ? 'Uploading...' : 'Upload Pre-Melt Proofs'}
                      </Typography>
                    </Stack>
                  );
                })()}
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
                    startIcon={<Iconify icon={afterMeltProofs.length > 0 ? "eva:checkmark-circle-2-fill" : "eva:cloud-upload-fill"} />}
                    sx={{
                      bgcolor: '#ffb300',
                      color: '#000',
                      fontWeight: 700,
                      height: 48,
                      '&:hover': { bgcolor: '#ffa000' },
                    }}
                    fullWidth
                  >
                    {uploadLoading
                      ? 'Uploading Proofs...'
                      : afterMeltProofs.length > 0
                      ? `Upload More After Melt Proofs (${afterMeltProofs.length} uploaded)`
                      : 'Upload After Melt Proof(s)'}
                    <input type="file" multiple hidden accept="image/*,.pdf" onChange={handleAfterFileUpload} />
                  </Button>
                </Grid>

                {afterMeltProofs.length > 0 && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: '#faf5ff',
                        borderRadius: 1,
                        border: '1px solid #e9d5ff',
                      }}
                    >
                      {afterMeltProofs.map((item, idx) => {
                        const fileUrl = item?.uploadedFile || '';
                        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${global.BASE_URL}/${fileUrl}`;
                        const isPdf =
                          fileUrl.toLowerCase().endsWith('.pdf') ||
                          (item.fileName && item.fileName.toLowerCase().endsWith('.pdf'));
                        return (
                          <Card
                            key={item._id || idx}
                            variant="outlined"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              gap: 1.5,
                              bgcolor: '#fff',
                              borderColor: '#d8b4fe',
                              borderRadius: 1,
                              maxWidth: 280,
                              flexGrow: 1,
                            }}
                          >
                            {isPdf ? (
                              <Iconify icon="mdi:file-pdf-box" width={36} sx={{ color: 'error.main', flexShrink: 0 }} />
                            ) : (
                              <Box
                                component="img"
                                src={fullUrl}
                                alt="After Melt Proof"
                                sx={{
                                  width: 48,
                                  height: 48,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  border: '1px solid #e2e8f0',
                                  flexShrink: 0,
                                  cursor: 'pointer',
                                }}
                                onClick={() => window.open(fullUrl, '_blank')}
                              />
                            )}
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="caption" noWrap sx={{ display: 'block', fontWeight: 600, color: 'text.primary' }}>
                                {item.fileName || item.uploadName || `Photo ${idx + 1}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
                                onClick={() => window.open(fullUrl, '_blank')}
                              >
                                View full size
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveAfterProof(idx)}
                              title="Remove photo"
                            >
                              <Iconify icon="eva:trash-2-outline" width={18} />
                            </IconButton>
                          </Card>
                        );
                      })}
                    </Box>
                  </Grid>
                )}
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
