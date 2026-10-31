import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from '../../iconify';
import { createFile } from '../../../apis/branch/fileupload';
import { submitHouseVerification } from '../../../apis/branch/lead';
import global from '../../../utils/global';

export default function HouseVerificationModal({ open, onClose, lead, onSuccess, setNotify }) {
  const [verified, setVerified] = useState('yes');
  const [comments, setComments] = useState('');
  const [photos, setPhotos] = useState([]); // Array of existing or uploaded URL strings
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of File objects to upload
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (lead) {
      const hv = lead.houseVerification || {};
      setVerified(hv.status === 'rejected' ? 'no' : 'yes');
      setComments(hv.comments || '');
      setPhotos(Array.isArray(hv.photos) ? hv.photos : []);
      setSelectedFiles([]);
    }
  }, [lead, open]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveExistingPhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comments.trim()) {
      if (setNotify) {
        setNotify({ open: true, message: 'Please provide verification comments / observations.', severity: 'warning' });
      }
      return;
    }

    if (verified === 'yes' && photos.length === 0 && selectedFiles.length === 0) {
      if (setNotify) {
        setNotify({ open: true, message: 'Please upload at least one photo proof for house verification.', severity: 'warning' });
      }
      return;
    }

    try {
      setSubmitting(true);

      // Upload any newly selected files to Cloudinary
      let uploadedUrls = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('uploadedFile', file);
          const res = await createFile(formData);
          return res?.data?.uploadedFile || null;
        });
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.filter(Boolean);
      }

      const allPhotos = [...photos, ...uploadedUrls];

      const res = await submitHouseVerification(lead._id, {
        verified: verified === 'yes',
        comments: comments.trim(),
        photos: allPhotos,
      });

      setSubmitting(false);

      if (res?.status) {
        if (setNotify) {
          setNotify({
            open: true,
            message: `House verification ${verified === 'yes' ? 'completed successfully!' : 'marked as rejected.'}`,
            severity: verified === 'yes' ? 'success' : 'info',
          });
        }
        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } else {
        if (setNotify) {
          setNotify({ open: true, message: res?.message || 'Failed to submit house verification', severity: 'error' });
        }
      }
    } catch (err) {
      setSubmitting(false);
      if (setNotify) {
        setNotify({ open: true, message: err?.message || 'Error submitting verification', severity: 'error' });
      }
    }
  };

  const isAlreadyVerified = lead?.houseVerification?.status === 'verified';
  const isAlreadyRejected = lead?.houseVerification?.status === 'rejected';

  const formatPhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${global.baseURL}/${url}`;
  };

  return (
    <>
      <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #f0f0f0' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mdi:home-search" sx={{ width: 28, height: 28, color: '#8A1B9F' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8A1B9F' }}>
                House Verification
              </Typography>
            </Stack>
            {isAlreadyVerified && (
              <Chip
                label="Verified"
                color="success"
                size="small"
                icon={<Iconify icon="eva:checkmark-circle-2-fill" />}
              />
            )}
            {isAlreadyRejected && (
              <Chip
                label="Rejected"
                color="error"
                size="small"
                icon={<Iconify icon="eva:close-circle-fill" />}
              />
            )}
            {!isAlreadyVerified && !isAlreadyRejected && (
              <Chip
                label="Verification Required"
                color="warning"
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Lead & Customer Details Card */}
            <Box sx={{ p: 2, bgcolor: '#f9f6fa', borderRadius: 1.5, border: '1px solid #f0e6f5' }}>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Customer Name:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {lead?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Mobile Number:
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {lead?.mobile || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    Address:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {lead?.address || 'No address specified'}
                  </Typography>
                </Grid>
                {lead?.houseVerification?.verifiedByName && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Last Verified By:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {lead.houseVerification.verifiedByName}
                    </Typography>
                  </Grid>
                )}
                {lead?.houseVerification?.verifiedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Verified At:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(lead.houseVerification.verifiedAt).toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Verified Yes / No */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
                House Verified? *
              </FormLabel>
              <RadioGroup
                row
                value={verified}
                onChange={(e) => setVerified(e.target.value)}
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio sx={{ color: '#2e7d32', '&.Mui-checked': { color: '#2e7d32' } }} />}
                  label={<Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 600 }}>Yes (Verified)</Typography>}
                />
                <FormControlLabel
                  value="no"
                  control={<Radio sx={{ color: '#d32f2f', '&.Mui-checked': { color: '#d32f2f' } }} />}
                  label={<Typography variant="subtitle2" sx={{ color: '#d32f2f', fontWeight: 600 }}>No (Not Verified / Rejected)</Typography>}
                />
              </RadioGroup>
            </FormControl>

            {/* Comments */}
            <TextField
              label="Verification Comments / Observations *"
              multiline
              rows={3}
              fullWidth
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter remarks about house, door number, landmarks, person met, or reason if rejected..."
              helperText="Describe details observed during the physical house visit"
            />

            {/* Photo Proofs Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Multiple Photo Proofs {verified === 'yes' ? '*' : '(Optional)'}
              </Typography>

              {/* Upload Input */}
              <Button
                variant="outlined"
                component="label"
                startIcon={<Iconify icon="eva:camera-fill" />}
                sx={{
                  borderColor: '#8A1B9F',
                  color: '#8A1B9F',
                  '&:hover': { borderColor: '#731485', bgcolor: 'rgba(138, 27, 159, 0.04)' },
                  mb: 2,
                }}
              >
                Choose Photos (Multiple)
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </Button>

              {/* Photos Gallery */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {/* Existing Saved Photos */}
                {photos.map((url, idx) => (
                  <Box
                    key={`exist-${idx}`}
                    sx={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      bgcolor: '#000',
                    }}
                    onClick={() => setPreviewImage(formatPhotoUrl(url))}
                  >
                    <img
                      src={formatPhotoUrl(url)}
                      alt={`Proof ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveExistingPhoto(idx);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        p: 0.3,
                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.8)' },
                      }}
                    >
                      <Iconify icon="eva:close-fill" width={14} height={14} />
                    </IconButton>
                  </Box>
                ))}

                {/* Newly Selected Local Files */}
                {selectedFiles.map((file, idx) => (
                  <Box
                    key={`new-${idx}`}
                    sx={{
                      position: 'relative',
                      width: 90,
                      height: 90,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '2px dashed #8A1B9F',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New file ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveSelectedFile(idx)}
                      sx={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        p: 0.3,
                        '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.8)' },
                      }}
                    >
                      <Iconify icon="eva:close-fill" width={14} height={14} />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              {photos.length === 0 && selectedFiles.length === 0 && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                  No photos uploaded yet. Click above to attach house entrance, street, or verification photos.
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
          <Button variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSubmit}
            loading={submitting}
            sx={{
              bgcolor: '#8A1B9F',
              color: '#ffffff !important',
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: '#731485' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(138, 27, 159, 0.45)',
                color: 'rgba(255, 255, 255, 0.8) !important',
              },
            }}
          >
            Save Verification
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Full-size Image Preview Dialog */}
      <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="md">
        <DialogContent sx={{ p: 1, bgcolor: '#000', display: 'flex', justifyContent: 'center' }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Verification Proof Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#111', p: 1 }}>
          <Button onClick={() => setPreviewImage(null)} sx={{ color: '#fff' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

HouseVerificationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lead: PropTypes.object,
  onSuccess: PropTypes.func,
  setNotify: PropTypes.func,
};

