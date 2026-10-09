import {
  TextField,
  Typography,
  FormControl,
  InputLabel,
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
  Modal,
  Checkbox,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  InputAdornment,
} from '@mui/material';
import { sentenceCase } from 'change-case';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Iconify from '../../../iconify';
import Scrollbar from '../../../scrollbar';
import { getBankById, createBank, updateBank, deleteBankById } from '../../../../apis/branch/customer-bank';
import { createFile } from '../../../../apis/branch/fileupload';
import { extractBankDetailsFromImage } from '../../../../utils/bankOcr';
import global from '../../../../utils/global';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: '90%', md: 840 },
  maxWidth: 840,
  maxHeight: '92vh',
  bgcolor: 'background.paper',
  boxShadow: '0 20px 48px rgba(0, 0, 0, 0.18)',
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: 2,
  overflow: 'auto',
};

const CreateBankModal = ({
  bankModal,
  setBankModal,
  selectedUser,
  setNotify,
  setData,
  modalRoot,
  bankToEdit,
  setBankToEdit,
  selectedBank,
  setSelectedBank,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [bankProofPreview, setBankProofPreview] = useState(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  // Form validation
  const schema = Yup.object({
    accountType: Yup.string().required('Account Type is required'),
    accountNo: Yup.string().required('Account no is required'),
    accountHolderName: Yup.string().required('Account holder name is required'),
    ifscCode: Yup.string().required('IFSC code is required'),
    bankName: Yup.string().required('Bank name is required'),
    branch: Yup.string().required('Branch is required'),
    proofType: Yup.string().when('accountType', {
      is: (val) => val === 'virtual',
      then: (s) => s.nullable().notRequired(),
      otherwise: (s) => s.required('Proof Type is required'),
    }),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    setValues,
    setFieldValue,
    resetForm,
    touched,
    errors,
    isSubmitting,
  } = useFormik({
    initialValues: {
      accountType: 'savings',
      accountNo: '',
      accountHolderName: '',
      ifscCode: '',
      bankName: '',
      branch: '',
      proofType: '',
      proofFile: {},
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const isVirtual = values.accountType === 'virtual';
        const finalValues = {
          ...values,
          proofType: values.proofType || (isVirtual ? 'Virtual Account' : ''),
          isVerified: isVirtual ? true : false,
        };

        if (bankToEdit) {
          const res = await updateBank(selectedUser._id, bankToEdit._id, finalValues);
          if (res.status === false) {
            setNotify({
              open: true,
              message: res.message || 'Bank not updated',
              severity: 'error',
            });
          } else {
            if (values.proofFile && values.proofFile instanceof File) {
              const formData = new FormData();
              formData.append('uploadId', bankToEdit._id);
              formData.append('uploadName', 'customer_bank');
              formData.append('uploadType', 'proof');
              formData.append('uploadedFile', values.proofFile);
              formData.append('documentType', finalValues.proofType || 'Virtual Account');
              await createFile(formData);
            }

            const bankData = await getBankById(selectedUser._id);
            setData(bankData.data);
            window.dispatchEvent(new CustomEvent('bankUpdated'));

            if (selectedBank && String(selectedBank._id) === String(bankToEdit._id)) {
              const updatedSelected = (bankData.data || []).find((b) => String(b._id) === String(bankToEdit._id));
              if (updatedSelected && setSelectedBank) {
                setSelectedBank(updatedSelected);
              }
            }

            resetForm();
            setFieldValue('proofFile', {});
            setBankProofPreview(null);
            setBankModal(false);
            if (setBankToEdit) setBankToEdit(null);
            setNotify({
              open: true,
              message: 'Bank details updated successfully',
              severity: 'success',
            });
          }
        } else {
          const data = await createBank({ customerId: selectedUser._id, ...finalValues });
          if (data.status === false) {
            setNotify({
              open: true,
              message: data.message || 'Bank not created',
              severity: 'error',
            });
          } else {
            if (values.proofFile && values.proofFile instanceof File) {
              const formData = new FormData();
              formData.append('uploadId', data.data.fileUpload.uploadId);
              formData.append('uploadName', data.data.fileUpload.uploadName);
              formData.append('uploadType', 'proof');
              formData.append('uploadedFile', values.proofFile);
              formData.append('documentType', finalValues.proofType || 'Virtual Account');

              await createFile(formData);
            }
            const bankData = await getBankById(selectedUser._id);
            setData(bankData.data);
            window.dispatchEvent(new CustomEvent('bankUpdated'));

            resetForm();
            setFieldValue('proofFile', {});
            setBankProofPreview(null);
            setBankModal(false);
            setNotify({
              open: true,
              message: isVirtual ? 'Virtual Bank created and auto-verified' : 'Bank created successfully',
              severity: 'success',
            });
          }
        }
      } catch (error) {
        console.error('Error saving bank:', error);
        setNotify({ open: true, message: error.message || 'An error occurred', severity: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (bankModal) {
      if (bankToEdit) {
        setValues({
          accountType: bankToEdit.accountType || 'savings',
          accountNo: bankToEdit.accountNo || '',
          accountHolderName: bankToEdit.accountHolderName || '',
          ifscCode: bankToEdit.ifscCode || '',
          bankName: bankToEdit.bankName || '',
          branch: bankToEdit.branch || '',
          proofType: bankToEdit.proof?.documentType || (bankToEdit.accountType === 'virtual' ? 'Virtual Account' : 'Passbook'),
          proofFile: {},
        });
        if (bankToEdit.proof?.uploadedFile) {
          const proofUrl = bankToEdit.proof.uploadedFile.startsWith('http')
            ? bankToEdit.proof.uploadedFile
            : `${global.baseURL}/${bankToEdit.proof.uploadedFile}`;
          setBankProofPreview(proofUrl);
        } else {
          setBankProofPreview(null);
        }
      } else {
        resetForm();
        setBankProofPreview(null);
      }
    }
  }, [bankModal, bankToEdit, resetForm, setValues]);

  const handleVerifyAccount = useCallback(() => {
    if (!values.ifscCode || values.ifscCode.length !== 11) {
      setNotify({ open: true, message: 'Please enter a valid 11-digit IFSC code', severity: 'warning' });
      return;
    }
    if (!values.accountNo) {
      setNotify({ open: true, message: 'Please enter an Account Number', severity: 'warning' });
      return;
    }

    setIsVerifying(true);

    fetch(`https://ifsc.razorpay.com/${values.ifscCode}`)
      .then((res) => {
        if (!res.ok) throw new Error('Incorrect IFSC code');
        return res.json();
      })
      .then((data) => {
        if (data && data.BANK) {
          setFieldValue('bankName', data.BANK);
          setFieldValue('branch', data.BRANCH);
        }
        setIsVerifying(false);
        setNotify({ open: true, message: 'Bank details verified successfully', severity: 'success' });
      })
      .catch(() => {
        setIsVerifying(false);
        setNotify({ open: true, message: 'Incorrect IFSC code', severity: 'error' });
      });
  }, [values.accountNo, values.ifscCode, setFieldValue, setNotify]);

  // Auto-fetch Bank Name and Branch from IFSC
  useEffect(() => {
    if (values.ifscCode?.length === 11) {
      fetch(`https://ifsc.razorpay.com/${values.ifscCode}`)
        .then((res) => {
          if (!res.ok) throw new Error('Incorrect IFSC code');
          return res.json();
        })
        .then((data) => {
          if (data && data.BANK) {
            setFieldValue('bankName', data.BANK);
            setFieldValue('branch', data.BRANCH);
          }
        })
        .catch(() => {
          if (!values.accountNo || values.accountNo.length < 9) {
            setNotify({ open: true, message: 'Incorrect IFSC code', severity: 'error' });
          }
          setFieldValue('bankName', '');
          setFieldValue('branch', '');
        });
    }
  }, [values.ifscCode, values.accountNo, setFieldValue, setNotify]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFieldValue('proofFile', file);
    setBankProofPreview(URL.createObjectURL(file));

    // If the file is an image, perform OCR autofill
    if (file.type && file.type.startsWith('image/')) {
      setIsScanningOcr(true);
      setOcrProgress(0);
      try {
        const extracted = await extractBankDetailsFromImage(file, (p) => setOcrProgress(p));
        let filledCount = 0;

        if (extracted.ifscCode) {
          setFieldValue('ifscCode', extracted.ifscCode);
          filledCount += 1;
        }
        if (extracted.accountNo) {
          setFieldValue('accountNo', extracted.accountNo);
          filledCount += 1;
        }
        if (extracted.bankName) {
          setFieldValue('bankName', extracted.bankName);
          filledCount += 1;
        }
        if (extracted.branch) {
          setFieldValue('branch', extracted.branch);
          filledCount += 1;
        }
        if (extracted.accountHolderName && (!values.accountHolderName || values.accountHolderName === '')) {
          setFieldValue('accountHolderName', extracted.accountHolderName);
          filledCount += 1;
        }
        if (extracted.detectedProofType && (!values.proofType || values.proofType === '')) {
          setFieldValue('proofType', extracted.detectedProofType);
          filledCount += 1;
        }

        if (filledCount > 0) {
          setNotify({
            open: true,
            message: `Scanned & autofilled ${filledCount} detail${filledCount > 1 ? 's' : ''} from proof!`,
            severity: 'success',
          });
        }
      } catch (err) {
        console.warn('OCR extraction skipped:', err);
      } finally {
        setIsScanningOcr(false);
      }
    }
  };

  if (!modalRoot) return null;

  return createPortal(
    <Modal
      open={bankModal}
      onClose={() => {
        setBankModal(false);
        setBankProofPreview(null);
        setIsScanningOcr(false);
        if (setBankToEdit) setBankToEdit(null);
      }}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {bankToEdit ? 'Edit Bank Details' : 'Add Bank'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setBankModal(false);
              setBankProofPreview(null);
              setIsScanningOcr(false);
              if (setBankToEdit) setBankToEdit(null);
            }}
            sx={{
              color: 'text.secondary',
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected', color: 'text.primary' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          autoComplete="off"
        >
          <Grid container spacing={2.5}>
            {/* Row 1: Account Type, Account No, IFSC Code (+ Verify) */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="account-type-label">Account Type</InputLabel>
                <Select
                  labelId="account-type-label"
                  id="accountType"
                  label="Account Type"
                  name="accountType"
                  value={values.accountType || 'savings'}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value === 'virtual' && !values.proofType) {
                      setFieldValue('proofType', 'Virtual Account');
                    }
                  }}
                >
                  <MenuItem value="savings">Savings account</MenuItem>
                  <MenuItem value="current">Current account</MenuItem>
                  <MenuItem value="virtual">Virtual account</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="accountNo"
                value={values.accountNo}
                error={touched.accountNo && errors.accountNo && true}
                label={touched.accountNo && errors.accountNo ? errors.accountNo : 'Account No'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="ifscCode"
                value={values.ifscCode}
                error={touched.ifscCode && errors.ifscCode && true}
                label={touched.ifscCode && errors.ifscCode ? errors.ifscCode : 'IFSC code'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                inputProps={{ style: { textTransform: 'uppercase' }, autoComplete: 'new-password' }}
                InputProps={{
                  endAdornment: values.accountType !== 'virtual' ? (
                    <InputAdornment position="end">
                      <LoadingButton
                        type="button"
                        variant="contained"
                        size="small"
                        loading={isVerifying}
                        disabled={isVerifying}
                        onClick={handleVerifyAccount}
                        startIcon={<Iconify icon="mdi:bank-check" width={16} />}
                        sx={{
                          py: 0.6,
                          px: 1.2,
                          minWidth: 'auto',
                          fontSize: '0.75rem',
                          textTransform: 'none',
                          boxShadow: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Verify
                      </LoadingButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>

            {/* Row 2: Account Holder Name, Bank Name, Branch */}
            <Grid item xs={12} sm={4}>
              <TextField
                name="accountHolderName"
                value={values.accountHolderName}
                error={touched.accountHolderName && errors.accountHolderName && true}
                label={
                  touched.accountHolderName && errors.accountHolderName
                    ? errors.accountHolderName
                    : 'Account holder name'
                }
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="bankName"
                value={values.bankName}
                error={touched.bankName && errors.bankName && true}
                label={touched.bankName && errors.bankName ? errors.bankName : 'Bank name'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="branch"
                value={values.branch}
                error={touched.branch && errors.branch && true}
                label={touched.branch && errors.branch ? errors.branch : 'Branch'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Grid>

            {/* Row 3: Select Proof Type, Attach Bank Proof */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={touched.proofType && errors.proofType && true}>
                <InputLabel id="select-label">Select Proof Type</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.proofType && errors.proofType ? errors.proofType : 'Select Proof Type'}
                  name="proofType"
                  value={values.proofType || (values.accountType === 'virtual' ? 'Virtual Account' : '')}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {values.accountType === 'virtual' && (
                    <MenuItem value="Virtual Account">Virtual Account</MenuItem>
                  )}
                  <MenuItem value="Passbook">Passbook</MenuItem>
                  <MenuItem value="Cheque Leaf">Cheque Leaf</MenuItem>
                  <MenuItem value="Bank Statement">Bank Statement</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  height: 56,
                  border: '1px solid',
                  borderColor: touched.proofFile && errors.proofFile ? 'error.main' : 'rgba(0, 0, 0, 0.23)',
                  borderRadius: 1,
                  px: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: 'text.primary',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    size="small"
                    startIcon={<Iconify icon="eva:cloud-upload-fill" width={18} />}
                    sx={{
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      py: 0.6,
                      px: 1.5,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Attach Proof
                    <input
                      type="file"
                      hidden
                      name="proofFile"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      color: values.proofFile?.name ? 'text.primary' : 'text.disabled',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {values.proofFile?.name ||
                      (bankProofPreview
                        ? 'Existing proof attached'
                        : values.accountType === 'virtual'
                        ? 'Optional (Virtual Account)'
                        : 'No file chosen')}
                  </Typography>
                </Stack>
                {bankProofPreview && (
                  <Tooltip title="View Bank Proof">
                    <IconButton
                      component="a"
                      href={bankProofPreview}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      color="primary"
                      sx={{ ml: 1, flexShrink: 0 }}
                    >
                      <Iconify icon="mdi:eye" width={20} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {isScanningOcr && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, px: 0.5 }}>
                  <CircularProgress size={14} color="primary" />
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    Scanning proof for details ({ocrProgress}%)...
                  </Typography>
                </Stack>
              )}
              {touched.proofFile && errors.proofFile && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: 'block' }}>
                  {errors.proofFile}
                </Typography>
              )}
            </Grid>

            {/* Actions */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <LoadingButton
                  size="large"
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                  disabled={Boolean(isSubmitting || isScanningOcr)}
                  startIcon={<SaveIcon />}
                  sx={{
                    px: 3.5,
                    py: 1.2,
                    fontWeight: 700,
                  }}
                >
                  {bankToEdit ? 'Update Bank Details' : 'Save Bank Details'}
                </LoadingButton>
                <Button
                  type="button"
                  size="large"
                  variant="contained"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setBankModal(false);
                    setBankProofPreview(null);
                    if (setBankToEdit) setBankToEdit(null);
                  }}
                  sx={{
                    px: 3.5,
                    py: 1.2,
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>,
    modalRoot
  );
};

function Bank({ setNotify, selectedUser, selectedBank, setSelectedBank, paymentType, bankAmount }) {
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [bankModal, setBankModal] = useState(false);
  const [bankToEdit, setBankToEdit] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [width, setWindowWidth] = useState(0);
  const modalRoot = document.getElementById('root-modal');

  const updateDimensions = () => {
    const width = window.innerWidth;
    setWindowWidth(width);
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const fetchBank = () => {
    if (selectedUser) {
      getBankById(selectedUser._id).then((data) => {
        setData(data.data);
        if (data.data && data.data.length === 1 && !selectedBank) {
          setSelectedBank(data.data[0]);
        }
      });
    }
  };

  useEffect(() => {
    fetchBank();
    window.addEventListener('bankUpdated', fetchBank);
    return () => window.removeEventListener('bankUpdated', fetchBank);
  }, [selectedUser]);

  const handleSelect = (bank) => {
    if (selectedBank && selectedBank._id === bank._id) {
      setSelectedBank(null);
    } else {
      setSelectedBank(bank);
    }
  };

  const handleDelete = () => {
    deleteBankById(selectedUser._id, openId).then(() => {
      getBankById(selectedUser._id).then((data) => {
        setData(data.data);
        window.dispatchEvent(new CustomEvent('bankUpdated'));
      });
      handleCloseDeleteModal();
    });
  };

  const isBankRequired = paymentType === 'bank' || (paymentType === 'partial' && Number(bankAmount) > 0);

  return (
    <>
      <Grid item xs={12}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Customer Bank {isBankRequired ? '*' : ''}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => {
              setBankToEdit(null);
              setBankModal(true);
            }}
          >
            New Bank
          </Button>
        </Stack>

        {isBankRequired && !selectedBank && (
          <Box
            sx={{
              p: 1.5,
              mb: 2,
              border: '1px dashed #d32f2f',
              borderRadius: 1,
              bgcolor: '#fff5f5',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
              {(!data || data.length === 0)
                ? '* Customer bank is mandatory for bank payment. Please click "New Bank" to add and select bank details.'
                : '* Please mark a bank account below by checking the checkbox to proceed with the sale.'}
            </Typography>
          </Box>
        )}
        <Scrollbar>
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="left" />
                  <TableCell align="left">Bank</TableCell>
                  <TableCell align="left">Type</TableCell>
                  <TableCell align="left">Account No</TableCell>
                  <TableCell align="left">Account Holder Name</TableCell>
                  <TableCell align="left">Branch</TableCell>
                  <TableCell align="left">IFSC Code</TableCell>
                  <TableCell align="left">Proof</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e) => (
                  <TableRow hover key={e._id} tabIndex={-1}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedBank?._id === e._id} onChange={() => handleSelect(e)} />
                    </TableCell>
                    <TableCell align="left">{sentenceCase(e.bankName)}</TableCell>
                    <TableCell align="left">
                      {e.accountType?.toLowerCase() === 'virtual' ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip label="Virtual" size="small" sx={{ bgcolor: '#ede7f6', color: '#7b1fa2', fontWeight: 700 }} />
                          <Chip label="Verified" size="small" color="success" sx={{ fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
                        </Stack>
                      ) : e.accountType?.toLowerCase() === 'current' ? (
                        <Chip label="Current" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="Savings" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell align="left">{e.accountNo}</TableCell>
                    <TableCell align="left">{sentenceCase(e.accountHolderName)}</TableCell>
                    <TableCell align="left">{sentenceCase(e.branch)}</TableCell>
                    <TableCell align="left">{e.ifscCode}</TableCell>
                    <TableCell align="left">
                      {e.proof?.uploadedFile ? (
                        e.proof?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                          <a
                            href={e.proof.uploadedFile.startsWith('http') ? e.proof.uploadedFile : `${global.baseURL}/${e.proof.uploadedFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer' }}
                          >
                            <img
                              src={e.proof.uploadedFile.startsWith('http') ? e.proof.uploadedFile : `${global.baseURL}/${e.proof.uploadedFile}`}
                              alt="document"
                              style={{ width: '80px' }}
                            />
                          </a>
                        ) : (
                          <a
                            href={e.proof.uploadedFile.startsWith('http') ? e.proof.uploadedFile : `${global.baseURL}/${e.proof.uploadedFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer' }}
                          >
                            <img src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                          </a>
                        )
                      ) : e.accountType?.toLowerCase() === 'virtual' ? (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          Not required (Virtual)
                        </Typography>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell align="left">
                      {(() => {
                        const isFinanceApproved = selectedUser?.sales?.some((sale) => {
                          const saleBankId = sale.bank?._id || sale.bank;
                          const isMatch = String(saleBankId) === String(e._id);
                          const isCompleted = sale.financeCompleted === true || sale.status === 'completed';
                          return isMatch && isCompleted;
                        });

                        const isLinkedToSale = selectedUser?.sales?.some((sale) => {
                          const saleBankId = sale.bank?._id || sale.bank;
                          return String(saleBankId) === String(e._id);
                        });

                        return (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip
                              title={
                                isFinanceApproved
                                  ? 'Bank details cannot be edited after final finance approval'
                                  : 'Edit bank details'
                              }
                            >
                              <span>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  disabled={Boolean(isFinanceApproved)}
                                  startIcon={<Iconify icon="eva:edit-fill" />}
                                  onClick={() => {
                                    setBankToEdit(e);
                                    setBankModal(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              </span>
                            </Tooltip>

                            {!isLinkedToSale && (
                              <Button
                                variant="contained"
                                color="warning"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => {
                                  setOpenId(e._id);
                                  handleOpenDeleteModal();
                                }}
                              >
                                Delete
                              </Button>
                            )}
                          </Stack>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                      <Paper
                        sx={{
                          textAlign: 'center',
                        }}
                      >
                        <Typography paragraph>No data in table</Typography>
                      </Paper>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Scrollbar>
      </Grid>

      <CreateBankModal
        bankModal={bankModal}
        setBankModal={setBankModal}
        selectedUser={selectedUser}
        setNotify={setNotify}
        setData={setData}
        modalRoot={modalRoot}
        bankToEdit={bankToEdit}
        setBankToEdit={setBankToEdit}
        selectedBank={selectedBank}
        setSelectedBank={setSelectedBank}
      />


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
            Do you want to delete?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={() => handleDelete()}>
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}

Bank.propTypes = {
  setNotify: PropTypes.func,
  selectedUser: PropTypes.shape({
    _id: PropTypes.string,
  }),
  selectedBank: PropTypes.shape({
    _id: PropTypes.string,
    accountNo: PropTypes.string,
    bankName: PropTypes.string,
    accountHolderName: PropTypes.string,
    branch: PropTypes.string,
    ifscCode: PropTypes.string,
  }),
  setSelectedBank: PropTypes.func,
};

export default Bank;


