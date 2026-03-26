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
import Customer from './customer';
import Address from './address';
import Bank from './bank';
import Release from './release';
import Ornament from './ornament';
import ProofDocument from './proof';
import Scrollbar from '../../scrollbar';
import { createFile } from '../../../apis/branch/fileupload';


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
    status: 'pending',
  };
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
          setSelectedAddress(sale.customer?.address?.[0]);
          setOrnaments(sale.ornaments);
          setSelectedBank(sale.bank);
          setSelectedRelease(sale.release);
          // Set step to 3 to skip customer/address selection if already present
          setStep(3);
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
          setStep(1);
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: props.id ? 'Sale updated' : 'Sale created',
            severity: 'success',
          });
        }
      });
    },
  });

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

      <Address
        step={step}
        setStep={setStep}
        selectedUser={selectedUser}
        selectedAddress={selectedAddress}
        setSelectedAddress={setSelectedAddress}
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
        <Card sx={{ display: step === 3 ? 'block' : 'none', p: 4, my: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 1 }}>
            Billing Details {props.id ? `(Editing: ${props.id})` : ''}
          </Typography>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="subtitle1" color="primary">
              Selected Customer: <strong>{selectedUser?.name}</strong> ({selectedUser?.phoneNumber})
              <Button
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
            {selectedAddress && (
              <Typography variant="body2" color="text.secondary">
                Address: {selectedAddress?.houseNo || selectedAddress?.address}, {selectedAddress?.streetName || selectedAddress?.area}, {selectedAddress?.city}, {selectedAddress?.pincode}
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
            <Ornament
              ornaments={ornaments}
              setOrnaments={setOrnaments}
              silverRate={payload.silverRate}
              goldRate={payload.goldRate}
              purchaseType={payload.purchaseType}
              {...props}
            />
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
                Prev
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
                  } else if (ornaments?.length === 0) {
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
                    setStep(step + 1);
                  }
                }}
              >
                Next
              </LoadingButton>
            </Grid>
          </Grid>
        </Card>

        <ProofDocument
          step={step}
          setStep={setStep}
          proofDocument={proofDocument}
          setProofDocument={setProofDocument}
          {...props}
        />

        <Card sx={{ display: step === 5 ? 'block' : 'none', p: 4, my: 4 }}>
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
                value={selectedUser?.name}
                label={'Customer Name'}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="address"
                value={selectedUser?.address[0]?.address}
                label={'Customer Address'}
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
            {values.paymentType === 'bank' && (
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
    </>
  );
}

CreateSale.propTypes = {
  id: PropTypes.string,
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default CreateSale;


