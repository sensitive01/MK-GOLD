import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { sentenceCase } from 'change-case';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';
// import { getBranchByBranchId } from '../../../apis/branch/branch';
import { getGoldRateByState } from '../../../apis/branch/gold-rate';
import { createSales, getSalesById, updateSales } from '../../../apis/branch/sales';
import { createRelease } from '../../../apis/branch/release';
import { findCustomer } from '../../../apis/branch/customer';
import Customer from './customer';
import Bank from './bank';
import Release from './release';
import Ornament from './ornament';
import ProofDocument from './proof';
import Scrollbar from '../../scrollbar';
import { createFile } from '../../../apis/branch/fileupload';
import { getEmployee } from '../../../apis/branch/employee';
import global from '../../../utils/global';
import { getAddressById, createAddress } from '../../../apis/branch/customer-address';
import Iconify from '../../iconify';


function CreateSale(props) {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [goldRate, setGoldRate] = useState({});
  const [silverRate, setSilverRate] = useState({});
  const [ornaments, setOrnaments] = useState([]);
  const [proofDocument, setProofDocument] = useState([]);
  const [step, setStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedRelease, setSelectedRelease] = useState([]);
  const [statusLog, setStatusLog] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressProofPreview, setAddressProofPreview] = useState(null);
  // Inline release form state for saleType === 'release'
  const [releaseForm, setReleaseForm] = useState({
    weight: '',
    pledgeAmount: '',
    payableAmount: '',
    paymentType: '',
    pledgedDate: moment().format('YYYY-MM-DD'),
    pledgeId: '',
    pledgedIn: '',
    pledgedBranch: '',
    releaseDate: moment().format('YYYY-MM-DD'),
    comments: '',
    assignee: '',
  });

  const loadAddresses = () => {
    if (selectedUser) {
      getAddressById(selectedUser._id).then((res) => {
        setAddresses(res.data || []);
        if (res.data && res.data.length > 0) {
          // If no address is selected, auto-select the last added address
          setSelectedAddress(res.data[res.data.length - 1]);
        }
      });
    } else {
      setAddresses([]);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [selectedUser]);

  const addressSchema = Yup.object({
    address: Yup.string().required('Address is required'),
    area: Yup.string().required('Area is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(6),
    landmark: Yup.string().required('Landmark is required'),
    residential: Yup.string().required('Residential type is required'),
    label: Yup.string().required('Label is required'),
    documentType: Yup.string().required('Document type is required'),
    documentNo: Yup.string().required('Document no is required'),
  });

  const addressForm = useFormik({
    initialValues: {
      address: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      residential: '',
      label: '',
      documentType: '',
      documentNo: '',
      documentFile: {},
    },
    validationSchema: addressSchema,
    onSubmit: (values) => {
      createAddress({ customerId: selectedUser._id, ...values }).then((res) => {
        if (res.status === false) {
          props.setNotify({
            open: true,
            message: 'Address not created',
            severity: 'error',
          });
        } else {
          setAddressModalOpen(false);
          const formData = new FormData();
          formData.append('uploadId', res.data.fileUpload.uploadId);
          formData.append('uploadName', res.data.fileUpload.uploadName);
          formData.append('uploadType', 'proof');
          formData.append('uploadedFile', values.documentFile);
          formData.append('documentType', values.documentType);
          formData.append('documentNo', values.documentNo);
          createFile(formData);
          addressForm.resetForm();
          setAddressProofPreview(null);
          loadAddresses();
          props.setNotify({
            open: true,
            message: 'Address created',
            severity: 'success',
          });
        }
      });
    },
  });


  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - ornaments?.length) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const [autoOpenEdit, setAutoOpenEdit] = useState(false);


  useEffect(() => {
    if (props.id) {
      getSalesById(props.id).then((data) => {
        if (data.status) {
          const sale = data.data;
          setValues({
            purchaseType: sale.purchaseType,
            saleType: sale.saleType,
            dop: moment(sale.dop).format('YYYY-MM-DD'),
            paymentType: sale.paymentType,
            cashAmount: sale.cashAmount || '',
            bankAmount: sale.bankAmount || '',
            margin: sale.margin,
            status: sale.status,
          });
          setBranch(sale.branch);
          setSelectedUser(sale.customer);
          if (sale.customer?.phoneNumber) {
            findCustomer({ phoneNumber: sale.customer.phoneNumber, all: true }).then((res) => {
              if (res.data && res.data.length > 0) {
                setSelectedUser(res.data[0]);
              }
            });
          }
          setSelectedAddress(sale.customer?.address?.[0]);
          setOrnaments(sale.ornaments);
          setSelectedBank(sale.bank);
          setSelectedRelease(sale.release);
          if (sale.actionBy) {
            setStatusLog({
              by: sale.actionBy,
              at: sale.actionAt,
              status: sale.status,
            });
          }
          // Set step to 2 to skip customer selection if already present
          setStep(2);
        } else {
          setNotify({
              open: true,
              message: 'Failed to fetch sale data: ' + data.message,
              severity: 'error',
          });
        }
      });
    }
  }, [props.id]);

  useEffect(() => {
      setBranch(auth.user.branch);
      if (auth.user.branch) {
        getGoldRateByState({
          state: auth.user.branch.address.state,
          type: 'gold',
          date: moment().format('YYYY-MM-DD'),
        }).then((data) => {
          setGoldRate(data.data);
        });
        getGoldRateByState({
          state: auth.user.branch.address.state,
          type: 'silver',
          date: moment().format('YYYY-MM-D'),
        }).then((data) => {
          setSilverRate(data.data);
        });

        getEmployee().then((res) => {
          if (res?.data) {
            setAssignees(res.data);
          }
        });
      }
  }, [auth.user.branch, auth.user.branch?.address?.state]);

  // Form validation
  const schema = Yup.object({
    purchaseType: Yup.string().required('Purchase type is required'),
    saleType: Yup.string().required('Customer id is required'),
    dop: Yup.string().required('DOP is required'),
    paymentType: Yup.string().required('Payment type is required'),
    margin: Yup.string().required('Margin is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, resetForm, touched, errors } = useFormik({
    initialValues: {
      purchaseType: '',
      saleType: '',
      dop: moment()?.format("YYYY-MM-DD"),
      paymentType: '',
      cashAmount: '',
      bankAmount: '',
      margin: 3,
      status: 'pending',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (values.saleType === 'pledged') {
        setOpenConfirmModal(true);
      } else {
        submitSale();
      }
    },
  });

  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const payload = {
    employee: auth.user._id,
    customer: selectedUser?._id,
    branch: branch?._id,
    goldRate: goldRate?.rate ?? 0,
    release: selectedRelease?.map((e) => e._id),
    silverRate: silverRate?.rate ?? 0,
    netWeight: ornaments?.reduce((prev, cur) => prev + +cur.netWeight, 0) ?? 0,
    netAmount: Math.round(ornaments?.reduce((prev, cur) => prev + +cur.netAmount, 0) ?? 0),
    payableAmount: 0,
    bank: selectedBank?._id,
    status: 'bullion pending',
    assignee: selectedRelease?.[0]?.assignee || undefined, // Automatically take from the first selected release
  };
  const isReleaseCompleted = selectedRelease?.length > 0 && selectedRelease.every(r => r.status === 'completed');
  const showOrnaments = values.saleType === 'physical' || (values.saleType === 'pledged' && isReleaseCompleted);

  const submitSale = () => {
    const apiCall = props.id ? updateSales(props.id, payload) : createSales(payload);
    apiCall.then((data) => {
      if (data.status === false) {
        props.setNotify({
          open: true,
          message: props.id ? 'Sale not updated' : 'Sale not created',
          severity: 'error',
        });
      } else {
        proofDocument?.forEach((e) => {
          const formData = new FormData();
          formData.append('uploadId', data.data.fileUpload?.uploadId || data.data._id);
          formData.append('uploadName', data.data.fileUpload?.uploadName || data.data.billId);
          formData.append('uploadType', 'proof');
          formData.append('uploadedFile', e.documentFile);
          formData.append('documentType', e.documentType);
          formData.append('documentNo', e.documentNo);
          createFile(formData);
        });
        resetForm();
        setReleaseForm({
          weight: '', pledgeAmount: '', payableAmount: '', paymentType: '',
          pledgedDate: moment().format('YYYY-MM-DD'), pledgeId: '', pledgedIn: '',
          pledgedBranch: '', releaseDate: moment().format('YYYY-MM-DD'), comments: '', assignee: '',
        });
        setStep(1);
        props.setToggleContainer(false);
        props.setNotify({
          open: true,
          message: props.id ? 'Sale updated' : 'Sale created and sent for approval',
          severity: 'success',
        });
      }
    });
  };





  payload.saleType = values.saleType;
  payload.purchaseType = values.purchaseType;
  payload.dop = values.dop;
  payload.paymentType = values.paymentType;
  payload.netWeight = payload.netWeight?.toFixed(2);
  payload.margin = Math.round(values.margin);
  payload.ornaments = ornaments;
  payload.cashAmount = Math.round(values.cashAmount);
  payload.bankAmount = Math.round(values.bankAmount);
  payload.payableAmount =
    Math.round(payload.netAmount - (payload.netAmount * values.margin) / 100) -
    (Math.round(selectedRelease?.reduce((prev, cur) => prev + +cur.payableAmount, 0)) ?? 0);

  return (
    <>
      <Customer
        step={step}
        setStep={setStep}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        autoOpenEdit={autoOpenEdit}
        setAutoOpenEdit={setAutoOpenEdit}
        {...props}
      />



      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
        encType="multipart/form-data"
      >
        <Card sx={{ display: step === 2 ? 'block' : 'none', p: 4, my: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 1 }}>
            Billing Details {props.id ? `(Editing: ${props.id})` : ''}
          </Typography>
          {statusLog && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              Current Status: <strong>{sentenceCase(statusLog.status)}</strong> 
              {statusLog.by && ` by ${statusLog.by.name} (${statusLog.by.employeeId})`}
              {statusLog.at && ` at ${moment(statusLog.at).format('YYYY-MM-DD HH:mm:ss')}`}
            </Typography>
          )}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="subtitle1" color="primary" sx={{ mb: 2 }}>
              Selected Customer: <strong>{selectedUser?.name}</strong> ({global.maskPhoneNumber(selectedUser?.phoneNumber)})
              <Button
                type="button"
                size="small"
                variant="outlined"
                sx={{ ml: 2, height: 20, fontSize: '0.65rem' }}
                onClick={() => {
                  setAutoOpenEdit(true);
                  setStep(1);
                }}
              >
                Edit Profile
              </Button>
            </Typography>

            <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={12} sm={8}>
                <FormControl fullWidth size="small">
                  <InputLabel id="select-address-label">Billing Address</InputLabel>
                  <Select
                    labelId="select-address-label"
                    value={selectedAddress?._id || ''}
                    label="Billing Address"
                    onChange={(e) => {
                      const addr = addresses.find((a) => a._id === e.target.value);
                      setSelectedAddress(addr);
                    }}
                  >
                    {addresses.map((addr) => (
                      <MenuItem key={addr._id} value={addr._id}>
                        {`${addr.address}, ${addr.landmark}, ${addr.pincode} (${addr.label})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  type="button"
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  onClick={() => setAddressModalOpen(true)}
                  fullWidth
                  sx={{ height: 40 }}
                >
                  Add Address
                </Button>
              </Grid>
            </Grid>

            {selectedAddress && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                <strong>Selected Address:</strong> {selectedAddress?.address}, {selectedAddress?.area}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pincode} ({selectedAddress?.label})
              </Typography>
            )}
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={touched.purchaseType && errors.purchaseType && true}>
                <InputLabel id="select-purchaseType">Select purchase type</InputLabel>
                <Select
                  labelId="select-purchaseType"
                  id="select"
                  label={touched.purchaseType && errors.purchaseType ? errors.purchaseType : 'Select purchase type'}
                  name="purchaseType"
                  value={values.purchaseType}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="gold">Gold</MenuItem>
                  <MenuItem value="silver">Silver</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={touched.saleType && errors.saleType && true}>
                <InputLabel id="select-saleType">Select sale type</InputLabel>
                <Select
                  labelId="select-saleType"
                  id="select"
                  label={touched.saleType && errors.saleType ? errors.saleType : 'Select sale type'}
                  name="saleType"
                  value={values.saleType}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="physical">Physical</MenuItem>
                  <MenuItem value="pledged">Pledged</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  name="dop"
                  value={values.dop}
                  error={touched.dop && errors.dop && true}
                  label={touched.dop && errors.dop ? errors.dop : 'DOP'}
                  inputFormat="MM/DD/YYYY"
                  onChange={(e) => {
                    setValues({ ...values, dop: e });
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={touched.paymentType && errors.paymentType && true}>
                <InputLabel id="select-paymentType">Select payment type</InputLabel>
                <Select
                  labelId="select-paymentType"
                  id="select"
                  label={touched.paymentType && errors.paymentType ? errors.paymentType : 'Select payment type'}
                  name="paymentType"
                  value={values.paymentType}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="bank">Bank</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {values.paymentType === 'partial' && (
              <Grid item xs={12} sm={4}>
                <TextField
                  name="cashAmount"
                  type={'number'}
                  value={values.cashAmount}
                  error={touched.cashAmount && errors.cashAmount && true}
                  label={touched.cashAmount && errors.cashAmount ? errors.cashAmount : 'Cash Amount'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setValues({ ...values, bankAmount: payload.payableAmount - values.cashAmount });
                    handleChange(e);
                  }}
                />
              </Grid>
            )}
            {values.paymentType === 'partial' && (
              <Grid item xs={12} sm={4}>
                <TextField
                  name="bankAmount"
                  type={'number'}
                  value={values.bankAmount}
                  error={touched.bankAmount && errors.bankAmount && true}
                  label={touched.bankAmount && errors.bankAmount ? errors.bankAmount : 'Bank Amount'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                name="margin"
                type={'number'}
                value={values.margin}
                error={touched.margin && errors.margin && true}
                label={touched.margin && errors.margin ? errors.margin : 'Margin'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            {showOrnaments && (
              <Ornament
                ornaments={ornaments}
                setOrnaments={setOrnaments}
                silverRate={payload.silverRate}
                goldRate={payload.goldRate}
                purchaseType={payload.purchaseType}
                {...props}
              />
            )}
            {(values.paymentType === 'bank' || values.paymentType === 'partial') && (
              <Bank
                selectedUser={selectedUser}
                selectedBank={selectedBank}
                setSelectedBank={setSelectedBank}
                {...props}
              />
            )}
            {values.saleType === 'pledged' && (
              <Release
                selectedUser={selectedUser}
                selectedRelease={selectedRelease}
                setSelectedRelease={setSelectedRelease}
                {...props}
              />
            )}
            <Grid item xs={12}>
              <LoadingButton
                size="large"
                name="submit"
                type="button"
                variant="contained"
                onClick={() => setStep(step - 1)}
              >
                Back to customer selection
              </LoadingButton>
              <LoadingButton
                size="large"
                name="submit"
                type="button"
                variant="contained"
                sx={{ ml: 3 }}
                onClick={async () => {
                  if (values.paymentType === 'bank' && !selectedBank) {
                    props.setNotify({
                      open: true,
                      message: 'Please select bank',
                      severity: 'info',
                    });
                  } else if (values.paymentType === 'partial' && values.bankAmount === '') {
                    props.setNotify({
                      open: true,
                      message: 'Please enter bank amount',
                      severity: 'info',
                    });
                  } else if (values.paymentType === 'partial' && values.cashAmount === '') {
                    props.setNotify({
                      open: true,
                      message: 'Please enter cash amount',
                      severity: 'info',
                    });
                  } else if (values.saleType === 'pledged' && selectedRelease?.length === 0) {
                    props.setNotify({
                      open: true,
                      message: 'Please select release',
                      severity: 'info',
                    });
                  } else if (showOrnaments && ornaments?.length === 0) {
                    props.setNotify({
                      open: true,
                      message: 'Please add ornaments',
                      severity: 'info',
                    });
                  } else if (!values.purchaseType) {
                    props.setNotify({
                      open: true,
                      message: 'Please select ornament type',
                      severity: 'info',
                    });
                  } else if (!values.saleType) {
                    props.setNotify({
                      open: true,
                      message: 'Please select sale type',
                      severity: 'info',
                    });
                  } else if (!values.paymentType) {
                    props.setNotify({
                      open: true,
                      message: 'Please select payment type',
                      severity: 'info',
                    });
                  } else {
                    if (values.saleType === 'pledged' && !isReleaseCompleted) {
                      setOpenConfirmModal(true);
                    } else {
                      setStep(step + 1);
                    }
                  }
                }}
              >
                {values.saleType === 'pledged' && !isReleaseCompleted ? 'Submit' : 'Proceed to upload documents'}
              </LoadingButton>
            </Grid>
          </Grid>
        </Card>

        <ProofDocument
          step={step}
          setStep={setStep}
          proofDocument={proofDocument}
          setProofDocument={setProofDocument}
          saleType={values.saleType}
          {...props}
        />

        <Card sx={{ display: step === 4 ? 'block' : 'none', p: 4, my: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            Billing Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Customer Detail:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="name"
                value={selectedUser?.name || ''}
                label={'Customer Name'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="phoneNumber"
                value={selectedUser?.phoneNumber || ''}
                label={'Customer Phone'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="address"
                value={
                  selectedAddress
                    ? `${selectedAddress.address}, ${selectedAddress.area || ''}, ${selectedAddress.city || ''}, ${selectedAddress.state || ''} - ${selectedAddress.pincode || ''} (${selectedAddress.label || ''})`
                    : (selectedUser?.address?.[0]?.address || '')
                }
                label={'Billing Address'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Sale Details:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="purchaseType"
                value={sentenceCase(values.purchaseType ?? '')}
                label={'Purchase Type'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="saleType"
                value={sentenceCase(values.saleType ?? '')}
                label={'Billing Type'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="dop"
                value={values.dop ? (moment.isMoment(values.dop) ? values.dop.format('YYYY-MM-DD') : moment(values.dop).format('YYYY-MM-DD')) : ''}
                label={'Date of Purchase'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="marginPercent"
                value={`${values.margin || 0}%`}
                label={'Margin (%)'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Ornaments:
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Scrollbar>
                <TableContainer sx={{ minWidth: 800, mb: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="left">Purity</TableCell>
                        <TableCell align="left">Quantity</TableCell>
                        <TableCell align="left">Stone weight (Grams)</TableCell>
                        <TableCell align="left">Net weight (Grams)</TableCell>
                        <TableCell align="left">Gross weight (Grams)</TableCell>
                        <TableCell align="left">Net amount (INR)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ornaments?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                        <TableRow hover key={index} tabIndex={-1}>
                          <TableCell align="left">{e.purity}</TableCell>
                          <TableCell align="left">{e.quantity}</TableCell>
                          <TableCell align="left">{e.stoneWeight}</TableCell>
                          <TableCell align="left">{e.netWeight}</TableCell>
                          <TableCell align="left">{e.grossWeight}</TableCell>
                          <TableCell align="left">{e.netAmount}</TableCell>
                        </TableRow>
                      ))}
                      {emptyRows > 0 && (
                        <TableRow style={{ height: 53 * emptyRows }}>
                          <TableCell colSpan={6} />
                        </TableRow>
                      )}
                      {ornaments?.length === 0 && (
                        <TableRow>
                          <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
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
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={ornaments?.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Scrollbar>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="grossWeight"
                value={ornaments?.reduce((prev, cur) => prev + +cur.grossWeight, 0)?.toFixed(2) ?? 0}
                label={'Total Gross Weight'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="stoneWeight"
                value={ornaments?.reduce((prev, cur) => prev + +cur.stoneWeight, 0)?.toFixed(2) ?? 0}
                label={'Total Stone Weight'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="netWeight"
                value={payload.netWeight}
                label={'Total Net Weight'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            {values.purchaseType === 'gold' ? (
              <Grid item xs={12} sm={4}>
                <TextField
                  name="goldRate"
                  value={payload.goldRate}
                  label={'Gold Rate'}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            ) : (
              <Grid item xs={12} sm={4}>
                <TextField
                  name="silverRate"
                  value={payload.silverRate}
                  label={'Silver Rate'}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                name="margin"
                type={'number'}
                value={Math.round((payload.netAmount * payload.margin) / 100)}
                label={'Margin'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="netAmount"
                value={payload.netAmount}
                label={'Net Amount'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="releaseAmount"
                value={Math.round(selectedRelease?.reduce((prev, cur) => prev + +cur.payableAmount, 0)) ?? 0}
                label={'Release Amount'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="netPayable"
                value={
                  payload.netAmount -
                  (selectedRelease?.reduce((prev, cur) => prev + +cur.payableAmount, 0) ?? 0) -
                  Math.round((payload.netAmount * payload.margin) / 100)
                }
                label={'Net Payable'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="paymentType"
                value={sentenceCase(values.paymentType ?? '')}
                label={'Payment Type'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            {values.paymentType === 'partial' && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="cashAmount"
                    value={values.cashAmount}
                    label={'Cash Amount'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="bankAmount"
                    value={values.bankAmount}
                    label={'Bank Amount'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              </>
            )}
            {(values.paymentType === 'bank' || values.paymentType === 'partial') && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="accountHolderName"
                    value={sentenceCase(selectedBank?.accountHolderName ?? '')}
                    label={'Account Holder Name'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="accountNo"
                    value={selectedBank?.accountNo}
                    label={'Account No'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="bankName"
                    value={selectedBank?.bankName}
                    label={'Bank Name'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="branch"
                    value={selectedBank?.branch}
                    label={'Branch'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    name="ifscCode"
                    value={selectedBank?.ifscCode}
                    label={'IFSC Code'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <LoadingButton
                size="large"
                name="submit"
                type="button"
                variant="contained"
                onClick={() => setStep(step - 1)}
              >
                Prev
              </LoadingButton>
              <LoadingButton size="large" type="submit" variant="contained" sx={{ mx: 2 }}>
                Submit
              </LoadingButton>
            </Grid>
          </Grid>
        </Card>
      </form>
      <Dialog
        open={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false);
          addressForm.resetForm();
          setAddressProofPreview(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Customer Address</Typography>
          <IconButton
            aria-label="close"
            onClick={() => {
              setAddressModalOpen(false);
              addressForm.resetForm();
              setAddressProofPreview(null);
            }}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addressForm.handleSubmit(e);
            }}
            autoComplete="off"
          >
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  name="address"
                  value={addressForm.values.address}
                  error={addressForm.touched.address && addressForm.errors.address && true}
                  label={addressForm.touched.address && addressForm.errors.address ? addressForm.errors.address : 'Address'}
                  fullWidth
                  onBlur={addressForm.handleBlur}
                  onChange={addressForm.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="area"
                  value={addressForm.values.area}
                  error={addressForm.touched.area && addressForm.errors.area && true}
                  label={addressForm.touched.area && addressForm.errors.area ? addressForm.errors.area : 'Area'}
                  fullWidth
                  onBlur={addressForm.handleBlur}
                  onChange={addressForm.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={addressForm.touched.state && addressForm.errors.state && true}>
                  <InputLabel id="address-select-state-label">Select state</InputLabel>
                  <Select
                    labelId="address-select-state-label"
                    id="address-select-state"
                    label={addressForm.touched.state && addressForm.errors.state ? addressForm.errors.state : 'Select state'}
                    name="state"
                    value={addressForm.values.state}
                    onBlur={addressForm.handleBlur}
                    onChange={addressForm.handleChange}
                  >
                    {global.states?.map((state) => (
                      <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={addressForm.touched.city && addressForm.errors.city && true}>
                  <InputLabel id="address-select-city-label">Select city</InputLabel>
                  <Select
                    labelId="address-select-city-label"
                    id="address-select-city"
                    label={addressForm.touched.city && addressForm.errors.city ? addressForm.errors.city : 'Select city'}
                    name="city"
                    value={addressForm.values.city}
                    onBlur={addressForm.handleBlur}
                    onChange={addressForm.handleChange}
                  >
                    {global.cities[addressForm.values.state]?.split('|')?.map((city) => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="pincode"
                  value={addressForm.values.pincode}
                  error={addressForm.touched.pincode && addressForm.errors.pincode && true}
                  label={addressForm.touched.pincode && addressForm.errors.pincode ? addressForm.errors.pincode : 'Pincode'}
                  fullWidth
                  onBlur={addressForm.handleBlur}
                  onChange={addressForm.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="landmark"
                  value={addressForm.values.landmark}
                  error={addressForm.touched.landmark && addressForm.errors.landmark && true}
                  label={addressForm.touched.landmark && addressForm.errors.landmark ? addressForm.errors.landmark : 'Landmark'}
                  fullWidth
                  onBlur={addressForm.handleBlur}
                  onChange={addressForm.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={addressForm.touched.residential && addressForm.errors.residential && true}>
                  <InputLabel id="address-select-residential-label">Select residential</InputLabel>
                  <Select
                    labelId="address-select-residential-label"
                    id="address-select-residential"
                    label={addressForm.touched.residential && addressForm.errors.residential ? addressForm.errors.residential : 'Select residential'}
                    name="residential"
                    value={addressForm.values.residential}
                    onBlur={addressForm.handleBlur}
                    onChange={addressForm.handleChange}
                  >
                    <MenuItem value="Indian">Indian</MenuItem>
                    <MenuItem value="NRI">NRI</MenuItem>
                    <MenuItem value="Foreign Resident">Foreign Resident</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={addressForm.touched.label && addressForm.errors.label && true}>
                  <InputLabel id="address-select-label-label">Select label</InputLabel>
                  <Select
                    labelId="address-select-label-label"
                    id="address-select-label"
                    label={addressForm.touched.label && addressForm.errors.label ? addressForm.errors.label : 'Select label'}
                    name="label"
                    value={addressForm.values.label}
                    onBlur={addressForm.handleBlur}
                    onChange={addressForm.handleChange}
                  >
                    <MenuItem value="home">Home</MenuItem>
                    <MenuItem value="office">Office</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={addressForm.touched.documentType && addressForm.errors.documentType && true}>
                  <InputLabel id="address-select-documentType-label">Select address proof</InputLabel>
                  <Select
                    labelId="address-select-documentType-label"
                    id="address-select-documentType"
                    label={addressForm.touched.documentType && addressForm.errors.documentType ? addressForm.errors.documentType : 'Select address proof'}
                    name="documentType"
                    value={addressForm.values.documentType}
                    onBlur={addressForm.handleBlur}
                    onChange={addressForm.handleChange}
                  >
                    <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                    <MenuItem value="Driving License">Driving License</MenuItem>
                    <MenuItem value="Passport">Passport</MenuItem>
                    <MenuItem value="Ration Card">Ration Card</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="documentNo"
                  value={addressForm.values.documentNo}
                  error={addressForm.touched.documentNo && addressForm.errors.documentNo && true}
                  label={addressForm.touched.documentNo && addressForm.errors.documentNo ? addressForm.errors.documentNo : 'Address proof number'}
                  fullWidth
                  onBlur={addressForm.handleBlur}
                  onChange={addressForm.handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      Attach address proof:
                    </Typography>
                    <TextField
                      name="documentFile"
                      type="file"
                      error={addressForm.touched.documentFile && addressForm.errors.documentFile && true}
                      onBlur={addressForm.handleBlur}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          addressForm.setFieldValue('documentFile', file);
                          setAddressProofPreview(URL.createObjectURL(file));
                        }
                      }}
                      required
                      fullWidth
                      size="small"
                    />
                  </Box>
                  {addressProofPreview && (
                    <IconButton
                      component="a"
                      href={addressProofPreview}
                      target="_blank"
                      rel="noreferrer"
                      color="secondary"
                      title="View Address Document"
                      sx={{ mt: 3 }}
                    >
                      <Iconify icon="mdi:eye" />
                    </IconButton>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <LoadingButton
                  size="large"
                  type="submit"
                  variant="contained"
                  startIcon={<Iconify icon="eva:save-fill" />}
                >
                  Save
                </LoadingButton>
                <Button
                  size="large"
                  variant="contained"
                  color="error"
                  startIcon={<Iconify icon="eva:close-fill" />}
                  onClick={() => {
                    setAddressModalOpen(false);
                    addressForm.resetForm();
                    setAddressProofPreview(null);
                  }}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmModal 
        open={openConfirmModal} 
        handleClose={() => setOpenConfirmModal(false)} 
        handleConfirm={() => {
          setOpenConfirmModal(false);
          submitSale();
        }} 
      />
    </>
  );
}

function ConfirmModal({ open, handleClose, handleConfirm }) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Confirmation</DialogTitle>
      <DialogContent>
        <Typography>Do you want to send the details for bullion desk approval?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={handleConfirm} variant="contained" autoFocus>Yes</Button>
      </DialogActions>
    </Dialog>
  );
}

CreateSale.propTypes = {
  id: PropTypes.string,
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default CreateSale;


