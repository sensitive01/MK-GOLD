import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  Stack,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from './iconify';
import global from '../utils/global';
import { updateAddress } from '../apis/branch/customer-address';
import { createFile, updateFile } from '../apis/branch/fileupload';

export default function EditCustomerAddressModal({
  open,
  onClose,
  customer,
  address,
  onSuccess,
  setNotify,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    residential: 'Owned',
    label: 'Home',
  });
  const [addressProofFile, setAddressProofFile] = useState(null);
  const [addressProofPreview, setAddressProofPreview] = useState(null);
  const [existingProof, setExistingProof] = useState(null);

  useEffect(() => {
    if (address) {
      setFormData({
        address: address.address || '',
        area: address.area || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || '',
        residential: address.residential || 'Owned',
        label: address.label || 'Home',
      });

      // Find existing proof for this address if available
      const proof = customer?.addressProofs?.find(
        (p) => String(p.uploadId) === String(address._id)
      );
      setExistingProof(proof || null);
      setAddressProofFile(null);
      setAddressProofPreview(null);
    }
  }, [address, customer, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAddressProofFile(file);
      setAddressProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customer?._id || !address?._id) return;

    if (!formData.address.trim()) {
      setNotify?.({ open: true, message: 'Address field is required', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await updateAddress(customer._id, {
        addressId: address._id,
        ...formData,
      });

      if (res && res.status === false) {
        setNotify?.({
          open: true,
          message: res.message || 'Failed to update address',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      // If a new address proof file was selected, upload/update it
      if (addressProofFile instanceof File) {
        const fileData = new FormData();
        fileData.append('uploadId', address._id);
        fileData.append('uploadName', 'customer_address');
        fileData.append('uploadType', 'address_proof');
        fileData.append('documentType', 'Address Proof');
        fileData.append('documentNo', formData.pincode || '');
        fileData.append('uploadedFile', addressProofFile);

        if (existingProof?._id) {
          await updateFile(existingProof._id, fileData);
        } else {
          await createFile(fileData);
        }
      }

      setNotify?.({
        open: true,
        message: 'Customer address updated successfully',
        severity: 'success',
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setNotify?.({
        open: true,
        message: err.message || 'Error updating address',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:map-marker-edit" width={24} sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Edit Customer Address</Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mdi:close" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                name="address"
                label="Street / Door / Flat Address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="area"
                label="Area"
                value={formData.area}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="city"
                label="City"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="state"
                label="State"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="pincode"
                label="Pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="landmark"
                label="Landmark"
                value={formData.landmark}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="res-type-label">Residential Type</InputLabel>
                <Select
                  labelId="res-type-label"
                  name="residential"
                  value={formData.residential}
                  label="Residential Type"
                  onChange={handleChange}
                >
                  <MenuItem value="Owned">Owned</MenuItem>
                  <MenuItem value="Rented">Rented</MenuItem>
                  <MenuItem value="Parental">Parental</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id="label-type-label">Label</InputLabel>
                <Select
                  labelId="label-type-label"
                  name="label"
                  value={formData.label}
                  label="Label"
                  onChange={handleChange}
                >
                  <MenuItem value="Home">Home</MenuItem>
                  <MenuItem value="Office">Office</MenuItem>
                  <MenuItem value="Work">Work</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Address Proof Document (Optional)
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <Button variant="outlined" component="label" startIcon={<Iconify icon="mdi:upload" />}>
                  {addressProofFile ? 'Change File' : 'Upload / Replace Proof'}
                  <input type="file" hidden accept="image/*,application/pdf" onChange={handleFileChange} />
                </Button>

                {addressProofFile && (
                  <Typography variant="body2" color="primary" noWrap sx={{ maxWidth: 300 }}>
                    New: {addressProofFile.name}
                  </Typography>
                )}

                {!addressProofFile && existingProof?.uploadedFile && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="text.secondary">Current:</Typography>
                    <Button
                      size="small"
                      target="_blank"
                      href={existingProof.uploadedFile.startsWith('http') ? existingProof.uploadedFile : `${global.baseURL}/${existingProof.uploadedFile}`}
                    >
                      View Current Proof
                    </Button>
                  </Stack>
                )}
              </Stack>

              {addressProofPreview && (
                <Box sx={{ mt: 1.5, maxHeight: 150, overflow: 'hidden', borderRadius: 1, border: '1px solid #ddd' }}>
                  <img
                    src={addressProofPreview}
                    alt="Preview"
                    style={{ maxHeight: 150, objectFit: 'contain' }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={loading}>
            Update Address
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditCustomerAddressModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customer: PropTypes.object,
  address: PropTypes.object,
  onSuccess: PropTypes.func,
  setNotify: PropTypes.func,
};
