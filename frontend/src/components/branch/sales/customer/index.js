import {
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
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
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { sentenceCase } from 'change-case';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
import Webcam from 'react-webcam';
import PropTypes from 'prop-types';
import Iconify from '../../../iconify';
import Label from '../../../label';
import { findCustomer, createCustomer, deleteCustomerById } from '../../../../apis/branch/customer';
import { createFile } from '../../../../apis/branch/fileupload';
// import { getBranchByBranchId } from '../../../../apis/branch/branch';
import Scrollbar from '../../../scrollbar';
import { getEnquiryByMkgId } from '../../../../apis/branch/qrEnquiry';

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

function Customer(props) {
  const { step, setStep, setNotify, selectedUser, setSelectedUser } = props;
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [token, setToken] = useState(null);
  const [altToken, setAltToken] = useState(null);
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [width, setWindowWidth] = useState(0);
  const [img, setImg] = useState(null);
  const [enquiryId, setEnquiryId] = useState('');
  const [fetchingEnquiry, setFetchingEnquiry] = useState(false);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (auth.user?.branch) {
      setBranch(auth.user.branch);
    }
  }, [auth.user?.branch]);

  const videoConstraints = {
    width: 420,
    height: 420,
    facingMode: 'user',
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImg(imageSrc);
  }, [webcamRef]);

  const updateDimensions = () => {
    const width = window.innerWidth;
    setWindowWidth(width);
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (width < 899) {
    style.width = '80%';
  } else {
    style.width = 800;
  }

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const fetchCustomer = useCallback(
    (
      query = {
        createdAt: {
          $gte: moment()?.format('YYYY-MM-DD'),
          $lte: moment()?.format('YYYY-MM-DD'),
        },
      }
    ) => {
      findCustomer(query).then((data) => {
        setData(data.data);
      });
    },
    []
  );

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleFetchEnquiry = async () => {
    if (!enquiryId) return;
    setFetchingEnquiry(true);
    try {
      const res = await getEnquiryByMkgId(enquiryId);
      if (res.status) {
        setValues({
          ...values,
          name: res.data.name || values.name,
          phoneNumber: res.data.phoneNumber || values.phoneNumber,
        });
        setNotify({ open: true, message: 'Enquiry details fetched', severity: 'success' });
      } else {
        setNotify({ open: true, message: res.message, severity: 'error' });
      }
    } catch (error) {
        setNotify({ open: true, message: 'Fetch failed', severity: 'error' });
    }
    setFetchingEnquiry(false);
  };



  // Form validation
  const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    phoneNumber: Yup.string()
      .required('Phone is required')
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(10),
    alternatePhoneNumber: Yup.string()
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(10),
    email: Yup.string().required('Email id is required').email(),
    dob: Yup.string().required('DOB is required'),
    gender: Yup.string().required('Gender is required'),
    otp: Yup.string()?.length(6),
    altOtp: Yup.string()?.length(6),
    employmentType: Yup.string().required('Employment type is required'),
    organisation: Yup.string().required('Organisation is required'),
    annualIncome: Yup.string().required('Annual income is required'),
    maritalStatus: Yup.string().required('Marital is required'),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    setValues,
    touched,
    errors,
    setFieldError,
    setFieldTouched,
    resetForm,
  } = useFormik({
    initialValues: {
      name: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      email: '',
      dob: null,
      gender: '',
      otp: '',
      altOtp: '',
      employmentType: '',
      organisation: '',
      annualIncome: '',
      maritalStatus: '',
      source: '',
      signature: {},
      status: 'active',
      chooseId: '',
      idNo: '',
      uploadId: {},
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: async (values) => {
      /*
      setFieldTouched('otp', true);
      const res = await verifyOtp({ otp: values.otp, token });
      if (res.status === true || res.status === false) { // Simple bypass for now as per "hide functionality"
        // ... handled below
        }
      */
      if (!img) {
        setNotify({
          open: true,
          message: 'Please capture photo',
          severity: 'error',
        });
        return;
      }
      const payload = {
        branch: branch?._id,
        name: values.name,
        phoneNumber: values.phoneNumber,
        alternatePhoneNumber: values.alternatePhoneNumber,
        email: values.email,
        dob: values.dob,
        gender: values.gender,
        otp: values.otp,
        altOtp: values.altOtp,
        employmentType: values.employmentType,
        organisation: values.organisation,
        annualIncome: values.annualIncome,
        maritalStatus: values.maritalStatus,
        source: values.source,
        status: values.status,
      };

      if (openId) {
        updateCustomer(openId, payload).then((data) => {
          if (data.status === false) {
            setNotify({
              open: true,
              message: data.message ?? 'Customer not updated',
              severity: 'error',
            });
          } else {
            fetchCustomer();
            setCustomerModal(false);
            setOpenId(null);
            resetForm();
            setNotify({
              open: true,
              message: 'Customer updated',
              severity: 'success',
            });
          }
        });
        return;
      }

      createCustomer(payload).then((data) => {
        if (data.status === false) {
          setNotify({
            open: true,
            message: data.message ?? 'Customer not created',
            severity: 'error',
          });
        } else {
          fetch(img)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], `profile-${data.data.fileUpload.uploadId}.png`, { type: 'image/png' });
              const formData = new FormData();
              formData.append('uploadId', data.data.fileUpload.uploadId);
              formData.append('uploadName', data.data.fileUpload.uploadName);
              formData.append('uploadType', 'profile_image');
              formData.append('uploadedFile', file);
              createFile(formData);
            });
          const formData = new FormData();
          formData.append('uploadId', data.data.fileUpload.uploadId);
          formData.append('uploadName', data.data.fileUpload.uploadName);
          formData.append('uploadType', 'upload_id');
          formData.append('uploadedFile', values.uploadId);
          formData.append('documentType', values.chooseId);
          formData.append('documentNo', values.idNo);
          createFile(formData);
          const formData1 = new FormData();
          formData1.append('uploadId', data.data.fileUpload.uploadId);
          formData1.append('uploadName', data.data.fileUpload.uploadName);
          formData1.append('uploadType', 'signature');
          formData1.append('uploadedFile', values.signature);
          createFile(formData1);
          fetchCustomer();
          setCustomerModal(false);
          setImg(null);
          resetForm();
          setNotify({
            open: true,
            message: 'Customer created',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    if (props.autoOpenEdit && props.selectedUser) {
      const e = props.selectedUser;
      setOpenId(e._id);
      setValues({
        name: e.name || '',
        phoneNumber: e.phoneNumber || '',
        alternatePhoneNumber: e.alternatePhoneNumber || '',
        email: e.email || '',
        dob: e.dob || null,
        gender: e.gender || '',
        employmentType: e.employmentType || '',
        organisation: e.organisation || '',
        annualIncome: e.annualIncome || '',
        maritalStatus: e.maritalStatus || '',
        source: e.source || '',
        status: e.status || 'active',
        chooseId: e.chooseId || '',
        idNo: e.idNo || '',
      });
      // Fetch profile image if exists
      const profileImg = e.profileImage?.file;
      if (profileImg) {
        setImg(`${global.baseURL}/${profileImg}`);
      } else {
        setImg(null);
      }
      setCustomerModal(true);
      props.setAutoOpenEdit(false);
    }
  }, [props.autoOpenEdit, props.selectedUser, props.setAutoOpenEdit, setValues, setImg]);

  const handleSelect = (user) => {
    if (selectedUser && selectedUser._id === user._id) {
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
    }
  };

  const handleDelete = () => {
    deleteCustomerById(openId).then(() => {
      fetchCustomer();
      handleCloseDeleteModal();
    });
  };

  return (
    <>
      <Card sx={{ display: step === 1 ? 'block' : 'none', p: 4, my: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => {
              setOpenId(null);
              resetForm();
              setImg(null);
              setCustomerModal(true);
            }}
          >
            New Customer
          </Button>
        </Stack>
        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="left" />
                  <TableCell align="left">Name</TableCell>
                  <TableCell align="left">Email</TableCell>
                  <TableCell align="left">Phone</TableCell>
                  <TableCell align="left">Gender</TableCell>
                  <TableCell align="left">Status</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e) => (
                  <TableRow hover key={e._id} tabIndex={-1}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedUser?._id === e._id} onChange={() => handleSelect(e)} />
                    </TableCell>
                    <TableCell align="left">{sentenceCase(e.name ?? '')}</TableCell>
                    <TableCell align="left">{e.email}</TableCell>
                    <TableCell align="left">{e.phoneNumber}</TableCell>
                    <TableCell align="left">{sentenceCase(e.gender ?? '')}</TableCell>
                    <TableCell align="left">
                      <Label
                        color={
                          (e.status === 'active' && 'success') || (e.status === 'deactive' && 'error') || 'warning'
                        }
                      >
                        {sentenceCase(e.status ?? '')}
                      </Label>
                    </TableCell>
                    <TableCell align="left">
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                        startIcon={<Iconify icon="eva:edit-fill" />}
                        onClick={() => {
                          setOpenId(e._id);
                          setValues({
                            name: e.name || '',
                            phoneNumber: e.phoneNumber || '',
                            alternatePhoneNumber: e.alternatePhoneNumber || '',
                            email: e.email || '',
                            dob: e.dob || null,
                            gender: e.gender || '',
                            employmentType: e.employmentType || '',
                            organisation: e.organisation || '',
                            annualIncome: e.annualIncome || '',
                            maritalStatus: e.maritalStatus || '',
                            source: e.source || '',
                            status: e.status || 'active',
                            chooseId: e.chooseId || '',
                            idNo: e.idNo || '',
                          });
                          // Fetch profile image if exists
                          const profileImg = e.profileImage?.file;
                          if (profileImg) {
                            setImg(`${global.baseURL}/${profileImg}`);
                          } else {
                            setImg(null);
                          }
                          setCustomerModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setOpenId(e._id);
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
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
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
        <LoadingButton
          size="large"
          name="submit"
          type="button"
          variant="contained"
          sx={{ ml: 2 }}
          onClick={() => {
            if (!selectedUser) {
              setNotify({
                open: true,
                message: 'Please select customer',
                severity: 'info',
              });
            } else {
              setStep(step + 1);
            }
          }}
        >
          Next
        </LoadingButton>
      </Card>

      <Modal
        open={customerModal}
        onClose={() => setCustomerModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            {openId ? 'Edit Customer' : 'Add Customer'}
            <Button
              sx={{ color: '#222', float: 'right' }}
              startIcon={<CloseIcon />}
              onClick={() => setCustomerModal(false)}
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
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        label="Customer ID (e.g. MK123A)"
                        value={enquiryId}
                        onChange={(e) => setEnquiryId(e.target.value)}
                        sx={{ maxWidth: 300 }}
                    />
                    <LoadingButton
                        loading={fetchingEnquiry}
                        variant="outlined"
                        onClick={handleFetchEnquiry}
                    >
                        Fetch Detail
                    </LoadingButton>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="name"
                  value={values.name}
                  error={touched.name && errors.name && true}
                  label={touched.name && errors.name ? errors.name : 'Name'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="phoneNumber"
                  value={values.phoneNumber}
                  error={touched.phoneNumber && errors.phoneNumber && true}
                  label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={(e) => {
                    handleChange(e);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="alternatePhoneNumber"
                  value={values.alternatePhoneNumber}
                  error={touched.alternatePhoneNumber && errors.alternatePhoneNumber && true}
                  label={
                    touched.alternatePhoneNumber && errors.alternatePhoneNumber
                      ? errors.alternatePhoneNumber
                      : 'Alt phone'
                  }
                  fullWidth
                  onBlur={handleBlur}
                  onChange={(e) => {
                    handleChange(e);
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="email"
                  value={values.email}
                  error={touched.email && errors.email && true}
                  label={touched.email && errors.email ? errors.email : 'Email id'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DesktopDatePicker
                    name="dob"
                    value={values.dob}
                    error={touched.dob && errors.dob && true}
                    label={touched.dob && errors.dob ? errors.dob : 'DOB'}
                    inputFormat="MM/DD/YYYY"
                    onChange={(e) => {
                      setValues({ ...values, dob: e });
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.gender && errors.gender && true}>
                  <InputLabel id="select-label">Select gender</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.gender && errors.gender ? errors.gender : 'Select gender'}
                    name="gender"
                    value={values.gender}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* 
              <Grid item xs={12} md={4}>
                <TextField
                  name="otp"
                  value={values.otp}
                  // error={touched.otp && errors.otp && true}
                  label={touched.otp && errors.otp ? errors.otp : 'Phone Number OTP'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="altOtp"
                  value={values.altOtp}
                  // error={touched.altOtp && errors.altOtp && true}
                  label={touched.altOtp && errors.altOtp ? errors.altOtp : 'Alt Phone Number OTP'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.employmentType && errors.employmentType && true}>
                  <InputLabel id="select-label">Select employment type</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={
                      touched.employmentType && errors.employmentType ? errors.employmentType : 'Select employment type'
                    }
                    name="employmentType"
                    value={values.employmentType}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="Business Owner">Business Owner</MenuItem>
                    <MenuItem value="Central Govt Employee">Central Govt Employee</MenuItem>
                    <MenuItem value="Contract Employee">Contract Employee</MenuItem>
                    <MenuItem value="Military">Military</MenuItem>
                    <MenuItem value="Police">Police</MenuItem>
                    <MenuItem value="Self Employed">Self Employed</MenuItem>
                    <MenuItem value="State Govt Employee">State Govt Employee</MenuItem>
                    <MenuItem value="Working Professional">Working Professional</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="organisation"
                  value={values.organisation}
                  error={touched.organisation && errors.organisation && true}
                  label={touched.organisation && errors.organisation ? errors.organisation : 'Organisation'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="annualIncome"
                  value={values.annualIncome}
                  error={touched.annualIncome && errors.annualIncome && true}
                  label={touched.annualIncome && errors.annualIncome ? errors.annualIncome : 'Annual income'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.maritalStatus && errors.maritalStatus && true}>
                  <InputLabel id="select-label">Select marital status</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={
                      touched.maritalStatus && errors.maritalStatus ? errors.maritalStatus : 'Select marital status'
                    }
                    name="maritalStatus"
                    value={values.maritalStatus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="married">Married</MenuItem>
                    <MenuItem value="unmarried">Unmarried</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.source && errors.source && true}>
                  <InputLabel id="select-label">Select source</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.source && errors.source ? errors.source : 'Select source'}
                    name="source"
                    value={values.source}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="TV Ad">TV Ad</MenuItem>
                    <MenuItem value="Newspaper Ad">Newspaper Ad</MenuItem>
                    <MenuItem value="Friend Reference">Friend Reference</MenuItem>
                    <MenuItem value="Hoardings">Hoardings</MenuItem>
                    <MenuItem value="Pamphlet Ad">Pamphlet Ad</MenuItem>
                    <MenuItem value="Poster Ad">Poster Ad</MenuItem>
                    <MenuItem value="Google Ad">Google Ad</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.chooseId && errors.chooseId && true}>
                  <InputLabel id="select-label">Select choose id</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.chooseId && errors.chooseId ? errors.chooseId : 'Select choose id'}
                    name="chooseId"
                    value={values.chooseId}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                    <MenuItem value="Driving License">Driving License</MenuItem>
                    <MenuItem value="PAN Card">PAN Card</MenuItem>
                    <MenuItem value="Passport">Passport</MenuItem>
                    <MenuItem value="Ration Card">Ration Card</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="idNo"
                  value={values.idNo}
                  error={touched.idNo && errors.idNo && true}
                  label={touched.idNo && errors.idNo ? errors.idNo : 'Id No'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <span>UploadId: </span>
                <TextField
                  name="uploadId"
                  type={'file'}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setValues({ ...values, uploadId: e.target.files[0] });
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <span>Signature: </span>
                <TextField
                  name="signature"
                  type={'file'}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setValues({ ...values, signature: e.target.files[0] });
                  }}
                />
              </Grid>
              {customerModal && (
                <Grid item xs={12}>
                  {img === null ? (
                    <>
                      <Webcam
                        mirrored
                        audio={false}
                        height={400}
                        width={400}
                        ref={webcamRef}
                        screenshotFormat="image/png"
                        videoConstraints={videoConstraints}
                      />
                      <br />
                      <LoadingButton size="small" type="button" variant="contained" onClick={capture}>
                        Capture photo
                      </LoadingButton>
                    </>
                  ) : (
                    <>
                      <img src={img} alt="screenshot" />
                      <br />
                      <LoadingButton size="small" type="button" variant="contained" onClick={() => setImg(null)}>
                        Retake
                      </LoadingButton>
                    </>
                  )}
                </Grid>
              )}
              <Grid item xs={12}>
                <LoadingButton size="large" type="submit" variant="contained" startIcon={<SaveIcon />}>
                  Save
                </LoadingButton>
                <Button
                  size="large"
                  variant="contained"
                  color="error"
                  sx={{ ml: 2 }}
                  startIcon={<CloseIcon />}
                  onClick={() => setCustomerModal(false)}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>

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

Customer.propTypes = {
  step: PropTypes.number,
  setStep: PropTypes.func,
  setNotify: PropTypes.func,
  selectedUser: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    phoneNumber: PropTypes.string,
    address: PropTypes.array,
  }),
  setSelectedUser: PropTypes.func,
};

export default Customer;


