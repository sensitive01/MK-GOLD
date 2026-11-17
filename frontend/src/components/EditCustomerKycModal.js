import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Webcam from 'react-webcam';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  Box,
  IconButton,
  Divider,
  Card,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from './iconify';
import global from '../utils/global';
import { updateCustomer } from '../apis/branch/customer';
import { createFile, updateFile, deleteFileById } from '../apis/branch/fileupload';

const ID_TYPES = [
  'Aadhar Card',
  'Voter ID',
  'Driving License',
  'Passport',
  'PAN Card',
  'Ration Card',
  'Other',
];

export default function EditCustomerKycModal({
  open,
  onClose,
  customer,
  onSuccess,
  setNotify,
}) {
  const [loading, setLoading] = useState(false);

  // ID Proofs list state
  const [idProofs, setIdProofs] = useState([]);

  // Customer Name / PAN state
  const [customerName, setCustomerName] = useState('');
  const [panCardNumber, setPanCardNumber] = useState('');
  const [panFile, setPanFile] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [existingPanProof, setExistingPanProof] = useState(null);

  // Photo & Signature
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);

  // Photo Choice Menu & Live Camera States
  const [photoMenuAnchor, setPhotoMenuAnchor] = useState(null);
  const [openCameraModal, setOpenCameraModal] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const dataURLtoFile = (dataurl, filename) => {
    try {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      console.error('Failed to convert dataURL to File:', e);
      return null;
    }
  };

  const [sigFile, setSigFile] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [existingSig, setExistingSig] = useState(null);

  useEffect(() => {
    if (customer && open) {
      setCustomerName(customer.name || '');
      setPanCardNumber(customer.panCardNumber || '');

      // Existing Photo
      setExistingPhoto(customer.profileImage || null);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoMenuAnchor(null);
      setOpenCameraModal(false);
      setCapturedImg(null);

      // Existing Signature
      setExistingSig(customer.signatureImage || null);
      setSigFile(null);
      setSigPreview(null);

      // Existing PAN
      const panProof = customer.panCardProof || (customer.kycProofs || []).find(
        (u) => u.uploadType === 'pan_card' || u.documentType === 'PAN Card'
      );
      setExistingPanProof(panProof || null);
      setPanFile(null);
      setPanPreview(null);

      // Populate ID Proofs
      const proofs = [];
      const nonPanKycProofs = (customer.kycProofs || []).filter(
        (u) =>
          u.uploadType !== 'profile_image' &&
          u.uploadType !== 'signature' &&
          u.uploadType !== 'pan_card' &&
          u.documentType !== 'PAN Card'
      );

      if (Array.isArray(customer.idProofs) && customer.idProofs.length > 0) {
        customer.idProofs.forEach((p, idx) => {
          const matched = nonPanKycProofs.find(
            (u) => (u.documentNo && u.documentNo === p.idNo) || (u.documentType && u.documentType === p.chooseId)
          ) || nonPanKycProofs[idx] || (idx === 0 ? customer.idProof : null);

          proofs.push({
            id: Date.now() + idx,
            chooseId: p.chooseId || customer.chooseId || 'Aadhar Card',
            idNo: p.idNo || (idx === 0 ? customer.idNo || '' : ''),
            existingFileId: matched?._id || null,
            existingFileUrl: matched?.uploadedFile || null,
            file: null,
            preview: null,
          });
        });
      } else if (nonPanKycProofs.length > 0) {
        nonPanKycProofs.forEach((u, idx) => {
          proofs.push({
            id: Date.now() + idx,
            chooseId: u.documentType || customer.chooseId || 'Aadhar Card',
            idNo: u.documentNo || customer.idNo || '',
            existingFileId: u._id,
            existingFileUrl: u.uploadedFile,
            file: null,
            preview: null,
          });
        });
      } else {
        proofs.push({
          id: Date.now(),
          chooseId: customer.chooseId || 'Aadhar Card',
          idNo: customer.idNo || '',
          existingFileId: customer.idProof?._id || null,
          existingFileUrl: customer.idProof?.uploadedFile || null,
          file: null,
          preview: null,
        });
      }

      setIdProofs(proofs);
    }
  }, [customer, open]);

  const handleIdProofChange = (id, field, value) => {
    setIdProofs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleIdProofFileChange = (id, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofs((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, file, preview: URL.createObjectURL(file) }
            : item
        )
      );
    }
  };

  const handleAddIdProof = () => {
    setIdProofs((prev) => [
      ...prev,
      {
        id: Date.now(),
        chooseId: 'Voter ID',
        idNo: '',
        existingFileId: null,
        existingFileUrl: null,
        file: null,
        preview: null,
      },
    ]);
  };

  const handleRemoveIdProof = (id) => {
    if (idProofs.length <= 1) {
      setNotify?.({ open: true, message: 'At least one ID proof is required', severity: 'warning' });
      return;
    }
    setIdProofs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customer?._id) return;

    const primaryProof = idProofs[0];
    if (!primaryProof?.idNo?.trim()) {
      setNotify?.({ open: true, message: 'Primary ID Proof Number is required', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // 1. Update customer document fields
      const formattedIdProofs = idProofs
        .filter((p) => p.chooseId || p.idNo)
        .map((p) => ({
          chooseId: p.chooseId,
          idNo: p.idNo ? p.idNo.trim() : '',
        }));

      const customerPayload = {
        name: customerName.trim(),
        chooseId: primaryProof.chooseId,
        idNo: primaryProof.idNo.trim(),
        idProofs: formattedIdProofs,
        panCardNumber: panCardNumber ? panCardNumber.trim().toUpperCase() : '',
      };

      const res = await updateCustomer(customer._id, customerPayload);
      if (res && res.status === false) {
        setNotify?.({
          open: true,
          message: res.message || 'Failed to update customer KYC',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      // 2. Upload / Update ID Proof files
      for (const proof of idProofs) {
        if (proof.file instanceof File) {
          const fd = new FormData();
          fd.append('uploadId', customer._id);
          fd.append('uploadName', 'customer');
          fd.append('uploadType', 'upload_id');
          fd.append('documentType', proof.chooseId || 'ID Document');
          fd.append('documentNo', proof.idNo || '');
          fd.append('uploadedFile', proof.file);

          if (proof.existingFileId) {
            await updateFile(proof.existingFileId, fd);
          } else {
            await createFile(fd);
          }
        } else if (proof.existingFileId && (proof.idNo || proof.chooseId)) {
          // Update metadata on existing upload record
          const fd = new FormData();
          fd.append('documentType', proof.chooseId || 'ID Document');
          fd.append('documentNo', proof.idNo || '');
          await updateFile(proof.existingFileId, fd);
        }
      }

      // 3. Customer Photo (Profile Image)
      if (photoFile instanceof File) {
        const fd = new FormData();
        fd.append('uploadId', customer._id);
        fd.append('uploadName', 'customer');
        fd.append('uploadType', 'profile_image');
        fd.append('uploadedFile', photoFile);

        if (existingPhoto?._id) {
          await updateFile(existingPhoto._id, fd);
        } else {
          await createFile(fd);
        }
      }

      // 4. Customer Signature
      if (sigFile instanceof File) {
        const fd = new FormData();
        fd.append('uploadId', customer._id);
        fd.append('uploadName', 'customer');
        fd.append('uploadType', 'signature');
        fd.append('uploadedFile', sigFile);

        if (existingSig?._id) {
          await updateFile(existingSig._id, fd);
        } else {
          await createFile(fd);
        }
      }

      // 5. PAN Card file
      if (panFile instanceof File) {
        const fd = new FormData();
        fd.append('uploadId', customer._id);
        fd.append('uploadName', 'customer');
        fd.append('uploadType', 'pan_card');
        fd.append('documentType', 'PAN Card');
        fd.append('documentNo', panCardNumber ? panCardNumber.trim().toUpperCase() : '');
        fd.append('uploadedFile', panFile);

        if (existingPanProof?._id) {
          await updateFile(existingPanProof._id, fd);
        } else {
          await createFile(fd);
        }
      } else if (existingPanProof?._id && panCardNumber) {
        const fd = new FormData();
        fd.append('documentNo', panCardNumber.trim().toUpperCase());
        await updateFile(existingPanProof._id, fd);
      }

      setNotify?.({
        open: true,
        message: 'Customer KYC proofs updated successfully',
        severity: 'success',
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setNotify?.({
        open: true,
        message: err.message || 'Error updating KYC proofs',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:account-badge-outline" width={24} sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Edit Customer KYC Proofs & Details</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3, maxHeight: '75vh', overflowY: 'auto' }}>
          <Grid container spacing={2.5}>
            {/* Customer Basic Info */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PAN Card Number"
                value={panCardNumber}
                onChange={(e) => setPanCardNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
              />
            </Grid>

            {/* ID Proofs Section */}
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ID Proof Documents
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:plus" />}
                  onClick={handleAddIdProof}
                >
                  Add Another ID Proof
                </Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />

              {idProofs.map((proof, index) => (
                <Card
                  key={proof.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2, bgcolor: index === 0 ? 'action.hover' : 'background.paper' }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Document Type *</InputLabel>
                        <Select
                          value={proof.chooseId}
                          label="Document Type *"
                          onChange={(e) => handleIdProofChange(proof.id, 'chooseId', e.target.value)}
                        >
                          {ID_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        required={index === 0}
                        label="Document Number *"
                        value={proof.idNo}
                        onChange={(e) => handleIdProofChange(proof.id, 'idNo', e.target.value)}
                        placeholder="e.g. 1234 5678 9012"
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Button
                        variant="outlined"
                        size="small"
                        component="label"
                        startIcon={<Iconify icon="mdi:upload" />}
                        fullWidth
                      >
                        {proof.file ? 'Change File' : proof.existingFileUrl ? 'Replace File' : 'Upload File'}
                        <input
                          type="file"
                          hidden
                          accept="image/*,application/pdf"
                          onChange={(e) => handleIdProofFileChange(proof.id, e)}
                        />
                      </Button>
                    </Grid>

                    <Grid item xs={12} sm={1} textAlign="center">
                      {idProofs.length > 1 && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveIdProof(proof.id)}
                          title="Remove this proof"
                        >
                          <Iconify icon="mdi:trash-can-outline" />
                        </IconButton>
                      )}
                    </Grid>

                    {/* Preview / Current File info */}
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {proof.file && (
                          <Typography variant="caption" color="primary">
                            Selected file: {proof.file.name}
                          </Typography>
                        )}
                        {!proof.file && proof.existingFileUrl && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              Current Uploaded File:
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              target="_blank"
                              href={
                                proof.existingFileUrl.startsWith('http')
                                  ? proof.existingFileUrl
                                  : `${global.baseURL}/${proof.existingFileUrl}`
                              }
                            >
                              View Current File
                            </Button>
                          </Stack>
                        )}
                        {proof.preview && (
                          <Box sx={{ mt: 1, maxHeight: 80, overflow: 'hidden', borderRadius: 1 }}>
                            <img src={proof.preview} alt="Proof Preview" style={{ maxHeight: 80 }} />
                          </Box>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Grid>

            {/* Photo, Signature & PAN Card Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Additional Proofs (Photo, Signature & PAN)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {/* Customer Photo */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Customer Photo
                    </Typography>
                    <Box sx={{ my: 1, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', borderRadius: 1 }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="New Photo" style={{ maxHeight: 90, objectFit: 'contain' }} />
                      ) : existingPhoto?.uploadedFile ? (
                        <img
                          src={existingPhoto.uploadedFile.startsWith('http') ? existingPhoto.uploadedFile : `${global.baseURL}/${existingPhoto.uploadedFile}`}
                          alt="Photo"
                          style={{ maxHeight: 90, objectFit: 'contain' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">No photo</Typography>
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<Iconify icon="mdi:camera" />}
                      onClick={(e) => setPhotoMenuAnchor(e.currentTarget)}
                    >
                      {photoFile ? 'Change Photo' : 'Upload New Photo'}
                    </Button>

                    {/* Hidden file input for Upload Photo option */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                        e.target.value = '';
                      }}
                    />

                    {/* Choice Menu: Take Photo vs Upload Photo */}
                    <Menu
                      anchorEl={photoMenuAnchor}
                      open={Boolean(photoMenuAnchor)}
                      onClose={() => setPhotoMenuAnchor(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                      <MenuItem
                        onClick={() => {
                          setPhotoMenuAnchor(null);
                          setCapturedImg(null);
                          setOpenCameraModal(true);
                        }}
                      >
                        <ListItemIcon>
                          <Iconify icon="mdi:camera" sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Take Photo (Camera)" />
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setPhotoMenuAnchor(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Iconify icon="mdi:upload" sx={{ color: 'info.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Upload Photo (Browse)" />
                      </MenuItem>
                    </Menu>
                  </Card>
                </Grid>

                {/* Customer Signature */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Customer Signature
                    </Typography>
                    <Box sx={{ my: 1, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', borderRadius: 1 }}>
                      {sigPreview ? (
                        <img src={sigPreview} alt="New Signature" style={{ maxHeight: 90, objectFit: 'contain' }} />
                      ) : existingSig?.uploadedFile ? (
                        <img
                          src={existingSig.uploadedFile.startsWith('http') ? existingSig.uploadedFile : `${global.baseURL}/${existingSig.uploadedFile}`}
                          alt="Signature"
                          style={{ maxHeight: 90, objectFit: 'contain' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">No signature</Typography>
                      )}
                    </Box>
                    <Button variant="outlined" size="small" component="label" fullWidth startIcon={<Iconify icon="mdi:draw" />}>
                      {sigFile ? 'Change Signature' : 'Upload New Signature'}
                      <input type="file" hidden accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSigFile(file);
                          setSigPreview(URL.createObjectURL(file));
                        }
                      }} />
                    </Button>
                  </Card>
                </Grid>

                {/* PAN Card Proof */}
                <Grid item xs={12} md={4}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      PAN Card Document
                    </Typography>
                    <Box sx={{ my: 1, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', borderRadius: 1 }}>
                      {panPreview ? (
                        <img src={panPreview} alt="New PAN" style={{ maxHeight: 90, objectFit: 'contain' }} />
                      ) : existingPanProof?.uploadedFile ? (
                        <img
                          src={existingPanProof.uploadedFile.startsWith('http') ? existingPanProof.uploadedFile : `${global.baseURL}/${existingPanProof.uploadedFile}`}
                          alt="PAN Document"
                          style={{ maxHeight: 90, objectFit: 'contain' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">No PAN proof</Typography>
                      )}
                    </Box>
                    <Button variant="outlined" size="small" component="label" fullWidth startIcon={<Iconify icon="mdi:file-document-edit" />}>
                      {panFile ? 'Change PAN Doc' : 'Upload / Replace PAN'}
                      <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPanFile(file);
                          setPanPreview(URL.createObjectURL(file));
                        }
                      }} />
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={loading}>
            Save Changes
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>

    {/* Live Webcam Capture Dialog */}
    <Dialog
      open={openCameraModal}
      onClose={() => {
        setOpenCameraModal(false);
        setCapturedImg(null);
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">Take Customer Photo</Typography>
        <IconButton
          size="small"
          onClick={() => {
            setOpenCameraModal(false);
            setCapturedImg(null);
          }}
        >
          <Iconify icon="mdi:close" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
        {!capturedImg ? (
          <Box sx={{ border: '1px dashed #ccc', borderRadius: 2, p: 1, bgcolor: '#000', overflow: 'hidden' }}>
            <Webcam
              mirrored
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={{ facingMode: 'user' }}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
            />
          </Box>
        ) : (
          <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 1, bgcolor: '#f8f9fa' }}>
            <img
              src={capturedImg}
              alt="Captured Customer"
              style={{ width: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 8 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={() => {
            setOpenCameraModal(false);
            setCapturedImg(null);
          }}
          color="inherit"
        >
          Cancel
        </Button>

        {!capturedImg ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="mdi:camera" />}
            onClick={() => {
              if (webcamRef.current) {
                const screenshot = webcamRef.current.getScreenshot();
                if (screenshot) {
                  setCapturedImg(screenshot);
                }
              }
            }}
          >
            Capture Photo
          </Button>
        ) : (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="mdi:camera-retake" />}
              onClick={() => setCapturedImg(null)}
            >
              Retake
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="mdi:check-bold" />}
              onClick={() => {
                if (capturedImg) {
                  const file = dataURLtoFile(capturedImg, `customer-photo-${Date.now()}.png`);
                  if (file) {
                    setPhotoFile(file);
                    setPhotoPreview(capturedImg);
                  }
                  setOpenCameraModal(false);
                  setCapturedImg(null);
                }
              }}
            >
              Use This Photo
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  </>
  );
}

EditCustomerKycModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.object,
  onSuccess: PropTypes.func,
  setNotify: PropTypes.func,
};
