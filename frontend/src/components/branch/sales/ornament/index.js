import {
  TextField,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  Grid,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableFooter,
  Modal,
  Paper,
  Checkbox,
  FormControlLabel,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Iconify from '../../../iconify';
import Scrollbar from '../../../scrollbar';
import global from '../../../../utils/global';
import { createFile } from '../../../../apis/branch/fileupload';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '90%', md: 850 },
  maxWidth: 850,
  maxHeight: '94vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: 2.5,
  overflowY: 'auto',
  border: 'none',
};

const getFileUrl = (url) => {
  if (!url) return '';
  if (typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const base = (global.baseURL || '').replace(/\/+$/, '');
  const path = url.replace(/^\/+/, '');
  return `${base}/${path}`;
};

function Ornament({ setNotify, ornaments, setOrnaments, goldRate, silverRate, purchaseType }) {
  const [openId, setOpenId] = useState(null);
  const [ornamentModal, setOrnamentModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [billUploading, setBillUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (ornaments?.length || 0)) : 0;
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  // Form validation
  const schema = Yup.object({
    ornamentType: Yup.string().required('Ornament type is required'),
    quantity: Yup.string().required('Quantity is required'),
    grossWeight: Yup.string().required('Gross weight is required'),
    stoneWeight: Yup.string().required('Stone weight is required'),
    netWeight: Yup.string().required('Net weight is required'),
    purity: Yup.string().required('Purity is required'),
    netAmount: Yup.string().required('Net amount is required'),
    billDate: Yup.string().when('hasBill', {
      is: true,
      then: (schema) => schema.required('Bill date is required when bill is checked'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, setFieldValue, touched, errors, resetForm } = useFormik({
    initialValues: {
      ornamentType: '',
      quantity: '',
      grossWeight: '',
      stoneWeight: '',
      netWeight: '',
      purity: '',
      netAmount: '',
      ornamentPhoto: '',
      hasBill: false,
      billDate: '',
      billProof: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOrnaments([...(ornaments || []), values]);
      setOrnamentModal(false);
      resetForm();
      setNotify({
        open: true,
        message: 'Ornament created successfully',
        severity: 'success',
      });
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('uploadName', 'ornament_photo');
      formData.append('uploadType', 'ornament');
      formData.append('uploadedFile', file);
      const res = await createFile(formData);
      if (res?.status && res?.data?.uploadedFile) {
        setFieldValue('ornamentPhoto', res.data.uploadedFile);
        setNotify({
          open: true,
          message: 'Ornament photo uploaded successfully',
          severity: 'success',
        });
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to upload ornament photo',
          severity: 'error',
        });
      }
    } catch (err) {
      setNotify({
        open: true,
        message: err.message || 'Error uploading ornament photo',
        severity: 'error',
      });
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleBillUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBillUploading(true);
    try {
      const formData = new FormData();
      formData.append('uploadName', 'ornament_bill');
      formData.append('uploadType', 'ornament');
      formData.append('uploadedFile', file);
      const res = await createFile(formData);
      if (res?.status && res?.data?.uploadedFile) {
        setFieldValue('billProof', res.data.uploadedFile);
        setNotify({
          open: true,
          message: 'Bill document uploaded successfully',
          severity: 'success',
        });
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to upload bill document',
          severity: 'error',
        });
      }
    } catch (err) {
      setNotify({
        open: true,
        message: err.message || 'Error uploading bill document',
        severity: 'error',
      });
    } finally {
      setBillUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = () => {
    setOrnaments((ornaments || []).filter((e, index) => index !== openId));
    handleCloseDeleteModal();
  };

  const handleCloseModal = () => {
    setOrnamentModal(false);
    resetForm();
    setPhotoUploading(false);
    setBillUploading(false);
  };

  useEffect(() => {
    const rate = purchaseType === 'gold' ? goldRate : purchaseType === 'silver' ? silverRate : 0;
    const netWeight = values.netWeight || 0;
    const purity = values.purity || 0;
    const amount = Math.round(((netWeight * purity) / 100) * rate);
    
    if (amount !== values.netAmount) {
      setValues((prev) => ({
        ...prev,
        netAmount: amount,
      }));
    }
  }, [goldRate, silverRate, purchaseType, values.netWeight, values.purity, values.netAmount, setValues]);

  return (
    <>
      <Grid item xs={12}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Ornaments
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setOrnamentModal(true)}
          >
            New Ornament
          </Button>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography gutterBottom>
            <b>Gold Rate:</b> {goldRate} <b>Silver Rate:</b> {silverRate}
          </Typography>
        </Stack>
        <Scrollbar>
          <TableContainer>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="left">Ornament Type</TableCell>
                  <TableCell align="left">Quantity</TableCell>
                  <TableCell align="center">Photo</TableCell>
                  <TableCell align="left">Gross Weight</TableCell>
                  <TableCell align="left">Stone / Wastage</TableCell>
                  <TableCell align="left">Net Weight</TableCell>
                  <TableCell align="left">Purity</TableCell>
                  <TableCell align="left">Net Amount</TableCell>
                  <TableCell align="center">Bill</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ornaments?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                  <TableRow hover key={index} tabIndex={-1}>
                    <TableCell align="left">{e.ornamentType}</TableCell>
                    <TableCell align="left">{e.quantity}</TableCell>
                    <TableCell align="center">
                      {e.ornamentPhoto ? (
                        <Avatar
                          src={getFileUrl(e.ornamentPhoto)}
                          variant="rounded"
                          sx={{
                            width: 42,
                            height: 42,
                            cursor: 'pointer',
                            mx: 'auto',
                            border: '1px solid #e0e0e0',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.1)' },
                          }}
                          onClick={() =>
                            setPreviewMedia({
                              type: 'image',
                              url: e.ornamentPhoto,
                              title: `${e.ornamentType} Photo`,
                            })
                          }
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="left">{e.grossWeight}</TableCell>
                    <TableCell align="left">{e.stoneWeight}</TableCell>
                    <TableCell align="left">{e.netWeight}</TableCell>
                    <TableCell align="left">{e.purity}</TableCell>
                    <TableCell align="left">{e.netAmount}</TableCell>
                    <TableCell align="center">
                      {e.hasBill ? (
                        <Chip
                          size="small"
                          color="primary"
                          label={`Bill: ${e.billDate || 'Yes'}`}
                          icon={
                            e.billProof ? (
                              <Iconify icon="eva:external-link-outline" />
                            ) : (
                              <Iconify icon="eva:checkmark-circle-2-outline" />
                            )
                          }
                          onClick={() =>
                            e.billProof
                              ? setPreviewMedia({
                                  type: 'file',
                                  url: e.billProof,
                                  title: `${e.ornamentType} Purchase Bill`,
                                })
                              : null
                          }
                          sx={{
                            cursor: e.billProof ? 'pointer' : 'default',
                            fontWeight: 500,
                          }}
                        />
                      ) : (
                        <Chip size="small" variant="outlined" label="No Bill" sx={{ color: 'text.secondary' }} />
                      )}
                    </TableCell>
                    <TableCell align="left">
                      <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setOpenId(index);
                          handleOpenDeleteModal();
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={10} />
                  </TableRow>
                )}
                {(!ornaments || ornaments.length === 0) && (
                  <TableRow>
                    <TableCell align="center" colSpan={10} sx={{ py: 3 }}>
                      <Paper
                        sx={{
                          textAlign: 'center',
                        }}
                      >
                        <Typography paragraph>No ornaments in table</Typography>
                      </Paper>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {ornaments?.length > 0 && (
                <TableFooter>
                  <TableRow
                    sx={{
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      borderTop: '2px solid',
                      borderColor: 'divider',
                      '& .MuiTableCell-root': {
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'text.primary',
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell align="left">
                      Total
                    </TableCell>
                    <TableCell align="left">
                      {ornaments.reduce((prev, cur) => prev + (+cur.quantity || 0), 0)}
                    </TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="left">
                      {ornaments.reduce((prev, cur) => prev + (+cur.grossWeight || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="left">
                      {ornaments.reduce((prev, cur) => prev + (+cur.stoneWeight || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="left">
                      {ornaments.reduce((prev, cur) => prev + (+cur.netWeight || 0), 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="left">-</TableCell>
                    <TableCell align="left">
                      ₹{Math.round(ornaments.reduce((prev, cur) => prev + (+cur.netAmount || 0), 0)).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">-</TableCell>
                    <TableCell align="left">-</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={ornaments?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Scrollbar>
      </Grid>

      {/* Add Ornament Modal */}
      <Modal
        open={ornamentModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pb: 2, mb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Add Ornament
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter ornament specifications, weights, and verification documents
              </Typography>
            </Box>
            <IconButton onClick={handleCloseModal} size="small" sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            <Grid container spacing={2.5}>
              {/* Row 1: Ornament Specifications */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={touched.ornamentType && errors.ornamentType && true}>
                  <InputLabel id="select-label">Select Ornament Type</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.ornamentType && errors.ornamentType ? errors.ornamentType : 'Select Ornament Type'}
                    name="ornamentType"
                    value={values.ornamentType}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="22 Carat Bar (91.6)">22 Carat Bar (91.6)</MenuItem>
                    <MenuItem value="24 Carat Bar (99.9)">24 Carat Bar (99.9)</MenuItem>
                    <MenuItem value="22 Carat Coin (91.6)">22 Carat Coin (91.6)</MenuItem>
                    <MenuItem value="24 Carat Coin (99.9)">24 Carat Coin (99.9)</MenuItem>
                    <MenuItem value="Anklets">Anklets</MenuItem>
                    <MenuItem value="Baby Bangles">Baby Bangles</MenuItem>
                    <MenuItem value="Bangles">Bangles</MenuItem>
                    <MenuItem value="Bracelet">Bracelet</MenuItem>
                    <MenuItem value="Broad Bangles">Broad Bangles</MenuItem>
                    <MenuItem value="Chain">Chain</MenuItem>
                    <MenuItem value="Chain with Locket">Chain with Locket</MenuItem>
                    <MenuItem value="Drops">Drops</MenuItem>
                    <MenuItem value="Ear Rings">Ear Rings</MenuItem>
                    <MenuItem value="Melted Bar">Melted Bar</MenuItem>
                    <MenuItem value="Locket">Locket</MenuItem>
                    <MenuItem value="Matti">Matti</MenuItem>
                    <MenuItem value="Necklace">Necklace</MenuItem>
                    <MenuItem value="Ring">Ring</MenuItem>
                    <MenuItem value="Studs">Studs</MenuItem>
                    <MenuItem value="Studs with drops">Studs with drops</MenuItem>
                    <MenuItem value="Thali Chain">Thali Chain</MenuItem>
                    <MenuItem value="Toe Ring">Toe Ring</MenuItem>
                    <MenuItem value="Waist Belt/Chain">Waist Belt/Chain</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="quantity"
                  type="number"
                  value={values.quantity}
                  error={touched.quantity && errors.quantity && true}
                  label={touched.quantity && errors.quantity ? errors.quantity : 'Quantity'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="grossWeight"
                  type="number"
                  value={values.grossWeight}
                  error={touched.grossWeight && errors.grossWeight && true}
                  label={touched.grossWeight && errors.grossWeight ? errors.grossWeight : 'Gross Weight'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">g</InputAdornment>,
                  }}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={(e) => {
                    const gross = parseFloat(e.target.value) || 0;
                    const stone = parseFloat(values.stoneWeight) || 0;
                    setValues({
                      ...values,
                      grossWeight: e.target.value,
                      netWeight: (gross - stone).toFixed(2),
                    });
                  }}
                />
              </Grid>

              {/* Row 2: Stone / Wastage, Net Weight, Purity, Net Amount */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="stoneWeight"
                  type="number"
                  value={values.stoneWeight}
                  error={touched.stoneWeight && errors.stoneWeight && true}
                  label={touched.stoneWeight && errors.stoneWeight ? errors.stoneWeight : 'Stone / Wastage'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">g</InputAdornment>,
                  }}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={(e) => {
                    const stone = parseFloat(e.target.value) || 0;
                    const gross = parseFloat(values.grossWeight) || 0;
                    setValues({
                      ...values,
                      stoneWeight: e.target.value,
                      netWeight: (gross - stone).toFixed(2),
                    });
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="netWeight"
                  type="number"
                  value={values.netWeight}
                  error={touched.netWeight && errors.netWeight && true}
                  label={touched.netWeight && errors.netWeight ? errors.netWeight : 'Net Weight'}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">g</InputAdornment>,
                  }}
                  helperText="Auto (Gross - Stone)"
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="purity"
                  type="number"
                  value={values.purity}
                  error={touched.purity && errors.purity && true}
                  label={touched.purity && errors.purity ? errors.purity : 'Purity (%)'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  name="netAmount"
                  type="number"
                  value={values.netAmount}
                  error={touched.netAmount && errors.netAmount && true}
                  label={touched.netAmount && errors.netAmount ? errors.netAmount : 'Net Amount'}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  helperText={`Rate: ₹${purchaseType === 'gold' ? goldRate : silverRate}`}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              {/* Ornament Photo */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Ornament Photo
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={photoUploading ? <CircularProgress size={18} /> : <Iconify icon="eva:camera-outline" />}
                    disabled={photoUploading}
                  >
                    {photoUploading ? 'Uploading...' : values.ornamentPhoto ? 'Change Photo' : 'Upload Ornament Photo'}
                    <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                  </Button>
                  {values.ornamentPhoto && (
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        src={getFileUrl(values.ornamentPhoto)}
                        alt="Ornament"
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                        }}
                        onClick={() =>
                          setPreviewMedia({
                            type: 'image',
                            url: values.ornamentPhoto,
                            title: `${values.ornamentType || 'Ornament'} Photo Preview`,
                          })
                        }
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          bgcolor: 'error.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                          width: 18,
                          height: 18,
                        }}
                        onClick={() => setFieldValue('ornamentPhoto', '')}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Box>
                  )}
                </Stack>

                {/* Ornaments Bill Available checkbox placed directly under Upload Ornament Photo */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="hasBill"
                        checked={Boolean(values.hasBill)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFieldValue('hasBill', isChecked);
                          if (!isChecked) {
                            setFieldValue('billDate', '');
                            setFieldValue('billProof', '');
                          }
                        }}
                        size="small"
                        sx={{
                          color: '#00a76f',
                          '&.Mui-checked': { color: '#00a76f' },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', color: '#00a76f' }}>
                        <Typography variant="body2" sx={{ mr: 0.5, fontWeight: 500 }}>
                          Ornaments Bill Available
                        </Typography>
                        <Iconify icon="mdi:receipt-text-outline" width={18} height={18} />
                      </Box>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              </Grid>

              {/* Conditional: Bill Date & Bill Document Upload (when Ornaments Bill is checked) */}
              {values.hasBill && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="billDate"
                      type="date"
                      label="Bill Date"
                      InputLabelProps={{ shrink: true }}
                      value={values.billDate}
                      error={touched.billDate && Boolean(errors.billDate)}
                      helperText={touched.billDate && errors.billDate}
                      onBlur={handleBlur}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel shrink htmlFor="bill-upload-input">
                        Upload Purchase Bill
                      </InputLabel>
                      <OutlinedInput
                        id="bill-upload-input"
                        notched
                        label="Upload Purchase Bill"
                        readOnly
                        sx={{
                          cursor: 'pointer',
                          pr: 1,
                          '& .MuiOutlinedInput-input': {
                            cursor: 'pointer',
                            textOverflow: 'ellipsis',
                          },
                        }}
                        value={values.billProof ? (values.billProof.split('/').pop() || 'Bill Document Attached') : ''}
                        placeholder="Click to upload bill (PDF / Image)"
                        onClick={() => {
                          if (!values.billProof && !billUploading) {
                            document.getElementById('bill-file-input')?.click();
                          }
                        }}
                        startAdornment={
                          <InputAdornment position="start">
                            {billUploading ? (
                              <CircularProgress size={18} />
                            ) : (
                              <Iconify
                                icon={values.billProof ? 'eva:file-text-fill' : 'eva:cloud-upload-outline'}
                                sx={{ color: values.billProof ? 'success.main' : 'text.secondary' }}
                                width={20}
                                height={20}
                              />
                            )}
                          </InputAdornment>
                        }
                        endAdornment={
                          <InputAdornment position="end">
                            {values.billProof ? (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  title="Preview Bill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewMedia({
                                      type: 'file',
                                      url: values.billProof,
                                      title: `${values.ornamentType || 'Ornament'} Purchase Bill`,
                                    });
                                  }}
                                >
                                  <Iconify icon="eva:eye-outline" width={18} height={18} />
                                </IconButton>
                                <Button
                                  size="small"
                                  component="label"
                                  sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Change
                                  <input
                                    id="bill-file-input"
                                    type="file"
                                    hidden
                                    accept="image/*,application/pdf"
                                    onChange={handleBillUpload}
                                  />
                                </Button>
                                <IconButton
                                  size="small"
                                  color="error"
                                  title="Remove Bill"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFieldValue('billProof', '');
                                  }}
                                >
                                  <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Stack>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                component="label"
                                disabled={billUploading}
                                sx={{
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                  py: 0.6,
                                  px: 1.5,
                                  boxShadow: 'none',
                                }}
                              >
                                {billUploading ? 'Uploading...' : 'Browse'}
                                <input
                                  id="bill-file-input"
                                  type="file"
                                  hidden
                                  accept="image/*,application/pdf"
                                  onChange={handleBillUpload}
                                />
                              </Button>
                            )}
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                </>
              )}

              {/* Action Buttons */}
              <Grid item xs={12} sx={{ mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button
                    size="large"
                    variant="outlined"
                    color="inherit"
                    onClick={handleCloseModal}
                    sx={{ minWidth: 100 }}
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    size="large"
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{ minWidth: 140 }}
                  >
                    Save Ornament
                  </LoadingButton>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...style, width: { xs: '90%', sm: 400 }, maxWidth: 400 }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Delete
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 3 }}>
            Do you want to delete this ornament?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Media Preview Dialog */}
      <Dialog
        open={Boolean(previewMedia)}
        onClose={() => setPreviewMedia(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{previewMedia?.title || 'Preview'}</Typography>
          <IconButton onClick={() => setPreviewMedia(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', p: 2, minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewMedia && (
            previewMedia.url?.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={getFileUrl(previewMedia.url)}
                title="Document Preview"
                width="100%"
                height="500px"
                style={{ border: 'none' }}
              />
            ) : (
              <img
                src={getFileUrl(previewMedia.url)}
                alt={previewMedia.title || 'Preview'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 8,
                }}
              />
            )
          )}
        </DialogContent>
        <DialogActions>
          {previewMedia?.url && (
            <Button
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(getFileUrl(previewMedia.url), '_blank')}
            >
              Open Original
            </Button>
          )}
          <Button onClick={() => setPreviewMedia(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

Ornament.propTypes = {
  setNotify: PropTypes.func,
  ornaments: PropTypes.array,
  setOrnaments: PropTypes.func,
  goldRate: PropTypes.number,
  silverRate: PropTypes.number,
  purchaseType: PropTypes.string,
};

export default Ornament;
