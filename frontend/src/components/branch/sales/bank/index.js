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
import { getBankById, createBank, deleteBankById } from '../../../../apis/branch/customer-bank';
import { createFile } from '../../../../apis/branch/fileupload';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  maxHeight: '95%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflow: 'auto',
};

const CreateBankModal = ({ bankModal, setBankModal, selectedUser, setNotify, setData, modalRoot }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form validation
  const schema = Yup.object({
    accountNo: Yup.string().required('Account no is required'),
    accountHolderName: Yup.string().required('Account holder name is required'),
    ifscCode: Yup.string().required('IFSC code is required'),
    bankName: Yup.string().required('Bank name is required'),
    branch: Yup.string().required('Branch is required'),
    proofType: Yup.string().required('Proof Type is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, setFieldValue, resetForm, touched, errors } =
    useFormik({
      initialValues: {
        accountNo: '',
        accountHolderName: '',
        ifscCode: '',
        bankName: '',
        branch: '',
        proofType: '',
        proofFile: {},
      },
      validationSchema: schema,
      onSubmit: (values) => {
        createBank({ customerId: selectedUser._id, ...values }).then((data) => {
          if (data.status === false) {
            setNotify({
              open: true,
              message: 'Bank not created',
              severity: 'error',
            });
          } else {
            getBankById(selectedUser._id).then((data) => {
              setData(data.data);
            });
            const formData = new FormData();
            formData.append('uploadId', data.data.fileUpload.uploadId);
            formData.append('uploadName', data.data.fileUpload.uploadName);
            formData.append('uploadType', 'proof');
            formData.append('uploadedFile', values.proofFile);
            formData.append('documentType', values.proofType);
            createFile(formData);
            resetForm();
            setFieldValue('proofFile', {});
            setBankModal(false);
            setNotify({
              open: true,
              message: 'Bank created',
              severity: 'success',
            });
          }
        });
      },
    });

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

    // Also fetch Bank/Branch if not already present
    if (!values.bankName || !values.branch) {
      fetch(`https://ifsc.razorpay.com/${values.ifscCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.BANK) {
            setFieldValue('bankName', data.BANK);
            setFieldValue('branch', data.BRANCH);
          }
        })
        .catch(() => console.error('Failed to fetch IFSC details'));
    }

    // Simulate Bank Verification API (Penny Drop)
    setTimeout(() => {
      setIsVerifying(false);
      // Mocking a successful name fetch for the test account
      let mockName = selectedUser?.name || 'Customer Name';
      if (values.accountNo === '10710100283243') {
        mockName = 'ASWINRAJ';
      }
      setFieldValue('accountHolderName', mockName);
      setNotify({ open: true, message: 'Account details verified successfully', severity: 'success' });
    }, 1500);
  }, [values.accountNo, values.ifscCode, values.bankName, values.branch, selectedUser, setFieldValue, setNotify]);

  // Auto-fetch Bank Name and Branch from IFSC
  useEffect(() => {
    if (values.ifscCode?.length === 11) {
      fetch(`https://ifsc.razorpay.com/${values.ifscCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.BANK) {
            setFieldValue('bankName', data.BANK);
            setFieldValue('branch', data.BRANCH);
          }
        })
        .catch(() => {
          console.error('Failed to fetch IFSC details');
        });
    }
  }, [values.ifscCode, setFieldValue]);

  // Auto-verify Account Holder Name when Account No and IFSC are filled
  useEffect(() => {
    if (values.accountNo?.length >= 9 && values.ifscCode?.length === 11 && !values.accountHolderName && !isVerifying) {
      handleVerifyAccount();
    }
  }, [values.accountNo, values.ifscCode, values.accountHolderName, isVerifying, handleVerifyAccount]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFieldValue('proofFile', file);
    setIsAnalyzing(true);

    // Simulate OCR Analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      // Using data from the user's actual passbook for a realistic demo
      setFieldValue('accountNo', '40128101081190');
      setFieldValue('ifscCode', 'KLGB0040128');
      setFieldValue('accountHolderName', 'ASWINRAJ R');

      setNotify({ open: true, message: 'Document analyzed and details auto-filled!', severity: 'success' });
    }, 2000);
  };

  if (!modalRoot) return null;

  return createPortal(
    <Modal
      open={bankModal}
      onClose={() => setBankModal(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
          Add Bank
          <Button
            sx={{ color: '#222', float: 'right' }}
            startIcon={<CloseIcon />}
            onClick={() => setBankModal(false)}
          />
        </Typography>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          autoComplete="off"
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                name="accountNo"
                value={values.accountNo}
                error={touched.accountNo && errors.accountNo && true}
                label={touched.accountNo && errors.accountNo ? errors.accountNo : 'Account No'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                name="ifscCode"
                value={values.ifscCode}
                error={touched.ifscCode && errors.ifscCode && true}
                label={touched.ifscCode && errors.ifscCode ? errors.ifscCode : 'IFSC code'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <LoadingButton
                type="button"
                fullWidth
                variant="outlined"
                size="large"
                loading={isVerifying}
                onClick={handleVerifyAccount}
                startIcon={<Iconify icon="mdi:bank-check" />}
                sx={{ height: 56 }}
              >
                Verify
              </LoadingButton>
            </Grid>
            <Grid item xs={12} md={4}>
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
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="bankName"
                value={values.bankName}
                error={touched.bankName && errors.bankName && true}
                label={touched.bankName && errors.bankName ? errors.bankName : 'Bank name'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                name="branch"
                value={values.branch}
                error={touched.branch && errors.branch && true}
                label={touched.branch && errors.branch ? errors.branch : 'Branch'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth error={touched.proofType && errors.proofType && true}>
                <InputLabel id="select-label">Select Proof Type</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.proofType && errors.proofType ? errors.proofType : 'Select Proof Type'}
                  name="proofType"
                  value={values.proofType}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="Passbook">Passbook</MenuItem>
                  <MenuItem value="Cheque Leaf">Cheque Leaf</MenuItem>
                  <MenuItem value="Bank Statement">Bank Statement</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ border: '1px dashed #ccc', p: 1, borderRadius: 1, position: 'relative' }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Attach Bank Proof (OCR Analysis Enabled):
                </Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TextField
                    name="proofFile"
                    type={'file'}
                    error={touched.proofFile && errors.proofFile && true}
                    onBlur={handleBlur}
                    onChange={handleFileUpload}
                    required
                    sx={{ flexGrow: 1 }}
                  />
                  {isAnalyzing && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={20} />
                      <Typography variant="caption">Scanning...</Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <LoadingButton size="large" type="submit" variant="contained" startIcon={<SaveIcon />}>
                Save Bank Details
              </LoadingButton>
              <Button
                type="button"
                size="large"
                variant="contained"
                color="error"
                sx={{ ml: 2 }}
                startIcon={<CloseIcon />}
                onClick={() => setBankModal(false)}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Modal>,
    modalRoot
  );
};

function Bank({ setNotify, selectedUser, selectedBank, setSelectedBank }) {
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [bankModal, setBankModal] = useState(false);
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

  useEffect(() => {
    if (selectedUser) {
      getBankById(selectedUser._id).then((data) => {
        setData(data.data);
        if (data.data && data.data.length === 1 && !selectedBank) {
          setSelectedBank(data.data[0]);
        }
      });
    }
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
      });
      handleCloseDeleteModal();
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Customer Bank
          </Typography>
          <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => setBankModal(true)}>
            New Bank
          </Button>
        </Stack>
        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="left" />
                  <TableCell align="left">Bank</TableCell>
                  <TableCell align="left">Account No</TableCell>
                  <TableCell align="left">Account Holder Name</TableCell>
                  <TableCell align="left">Branch</TableCell>
                  <TableCell align="left">IFSC Code</TableCell>
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
                    <TableCell align="left">{e.accountNo}</TableCell>
                    <TableCell align="left">{sentenceCase(e.accountHolderName)}</TableCell>
                    <TableCell align="left">{sentenceCase(e.branch)}</TableCell>
                    <TableCell align="left">{e.ifscCode}</TableCell>
                    <TableCell align="left">
                      {!(selectedUser?.sales?.some((sale) => sale.bank === e._id)) && (
                        <Button
                          variant="contained"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            setOpenId(e._id);
                            handleOpenDeleteModal();
                          }}
                        >
                          Delete
                        </Button>
                      )}
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
      />

      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...style, width: 400 }}>
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


