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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tab,
  Tabs,
  IconButton,
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
import { findCustomer, createCustomer, deleteCustomerById, updateCustomer, sendOtp, verifyOtp } from '../../../../apis/branch/customer';
import { createFile } from '../../../../apis/branch/fileupload';
import global from '../../../../utils/global';
// import { getBranchByBranchId } from '../../../../apis/branch/branch';
import Scrollbar from '../../../scrollbar';
import { getEnquiryByEnqId } from '../../../../apis/branch/qrEnquiry';

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
  const [otpStatus, setOtpStatus] = useState(null);
  const [altOtpStatus, setAltOtpStatus] = useState(null);
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [selectedEnquiryForLog, setSelectedEnquiryForLog] = useState(null);
  const [fetchingLog, setFetchingLog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleOpenLogModal = async (customer) => {
    const enqId = customer.enqID || customer.customerId;
    if (!enqId) {
      setNotify({ open: true, message: 'No Enquiry ID linked to this customer', severity: 'warning' });
      return;
    }
    setFetchingLog(true);
    try {
      const res = await getEnquiryByEnqId(enqId);
      if (res.status) {
        setSelectedEnquiryForLog(res.data);
        setOpenLogModal(true);
      } else {
        setNotify({ open: true, message: 'Could not fetch enquiry logs', severity: 'error' });
      }
    } catch (e) {
      setNotify({ open: true, message: 'Error fetching logs', severity: 'error' });
    }
    setFetchingLog(false);
  };

  const handleCloseLogModal = () => {
    setOpenLogModal(false);
    setSelectedEnquiryForLog(null);
  };
  const [width, setWindowWidth] = useState(0);
  const [img, setImg] = useState(null);
  const [enquiryId, setEnquiryId] = useState('');
  const [fetchingEnquiry, setFetchingEnquiry] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [uploadIdPreview, setUploadIdPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (auth.user?.branch) {
      setBranch(auth.user.branch);
    }
  }, [auth.user?.branch]);

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: 'user',
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setImg(imageSrc);
    } else {
      alert('Failed to capture photo. Please check your camera connection.');
    }
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

  const displayData = (() => {
    const list = data || [];
    if (!selectedUser) return list;
    const isSelectedInData = list.some((e) => e._id === selectedUser._id);
    if (!isSelectedInData) {
      return [selectedUser, ...list];
    }
    return list;
  })();

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (displayData?.length || 0)) : 0;
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
        all: true,
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
      const res = await getEnquiryByEnqId(enquiryId);
      if (res.status) {
        setValues({
          ...values,
          name: res.data.name || values.name,
          phoneNumber: res.data.phoneNumber || values.phoneNumber,
          email: res.data.email || values.email,
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
      .test('is-phone', 'Phone number must be exactly 10 digits', (val) => /^[0-9]{10}$/.test(val) || (val && val.includes('*'))),
    alternatePhoneNumber: Yup.string()
      .test('is-alt-phone', 'Alternate phone number must be exactly 10 digits', (val) => !val || /^[0-9]{10}$/.test(val) || val.includes('*')),
    email: Yup.string().required('Email id is required').email(),
    dob: Yup.string().required('DOB is required'),
    gender: Yup.string().required('Gender is required'),
    otp: Yup.string()?.length(6),
    altOtp: Yup.string()?.length(6),
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
        maritalStatus: values.maritalStatus,
        source: values.source,
        status: values.status,
        chooseId: values.chooseId,
        idNo: values.idNo,
        enqID: enquiryId,
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
            // Upload images if they were changed
            if (img && img.startsWith('data:')) {
                fetch(img).then(res => res.blob()).then(blob => {
                    const file = new File([blob], `profile-${openId}.png`, { type: 'image/png' });
                    const formData = new FormData();
                    formData.append('uploadId', openId);
                    formData.append('uploadName', 'customer');
                    formData.append('uploadType', 'profile_image');
                    formData.append('uploadedFile', file);
                    createFile(formData);
                });
            }
            if (values.uploadId instanceof File) {
                const formData = new FormData();
                formData.append('uploadId', openId);
                formData.append('uploadName', 'customer');
                formData.append('uploadType', 'upload_id');
                formData.append('uploadedFile', values.uploadId);
                formData.append('documentType', values.chooseId);
                formData.append('documentNo', values.idNo);
                createFile(formData);
            }
            if (values.signature instanceof File) {
                const formData = new FormData();
                formData.append('uploadId', openId);
                formData.append('uploadName', 'customer');
                formData.append('uploadType', 'signature');
                formData.append('uploadedFile', values.signature);
                createFile(formData);
            }

            fetchCustomer();
            setCustomerModal(false);
            setOpenId(null);
            resetForm();
            findCustomer({ phoneNumber: data.data.phoneNumber, all: true }).then((res) => {
              if (res.data && res.data.length > 0) {
                props.setSelectedUser(res.data[0]);
              } else {
                props.setSelectedUser(data.data);
              }
            });
            setNotify({
              open: true,
              message: 'Customer updated & selected',
              severity: 'success',
            });
            props.setStep(2);
          }
        });
        return;
      }

      if (!openId) {
        const existingRes = await findCustomer({ phoneNumber: values.phoneNumber, all: true });
        if (existingRes?.data && existingRes.data.length > 0) {
          const existingUser = existingRes.data[0];
          setOpenId(existingUser._id);
          setValues({
            ...values,
            name: existingUser.name || '',
            alternatePhoneNumber: existingUser.alternatePhoneNumber || '',
            email: existingUser.email || '',
            dob: existingUser.dob || null,
            gender: existingUser.gender || '',
            maritalStatus: existingUser.maritalStatus || '',
            source: existingUser.source || '',
            status: existingUser.status || 'active',
            chooseId: existingUser.chooseId || '',
            idNo: existingUser.idNo || '',
          });
          const profileImg = existingUser.profileImage?.file;
          if (profileImg) {
            setImg(`${global.baseURL}/${profileImg}`);
          }
          setEnquiryId(existingUser.enqID || '');
          setOtpStatus('success');
          setAltOtpStatus('success');
          setNotify({
            open: true,
            message: 'Customer already exists! Details fetched. Click Save again to update.',
            severity: 'info',
          });
          return;
        }
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
          const userObj = data.data.data || data.data;
          findCustomer({ phoneNumber: userObj.phoneNumber, all: true }).then((res) => {
            if (res.data && res.data.length > 0) {
              props.setSelectedUser(res.data[0]);
            } else {
              props.setSelectedUser(userObj);
            }
          });
          setNotify({
            open: true,
            message: 'Customer created & selected',
            severity: 'success',
          });
          props.setStep(2);
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
        maritalStatus: e.maritalStatus || '',
        source: e.source || '',
        status: e.status || 'active',
        chooseId: e.chooseId || '',
        idNo: e.idNo || '',
        enqID: e.enqID || '',
      });
      setEnquiryId(e.enqID || '');
      // Fetch profile image if exists
      const profileImg = e.profileImage?.uploadedFile;
      if (profileImg) {
        setImg(profileImg.startsWith('http') ? profileImg : `${global.baseURL}/${profileImg}`);
      } else {
        setImg(null);
      }

      // Fetch ID Proof and Signature
      if (e.idProof?.uploadedFile) {
        const idImg = e.idProof.uploadedFile;
        setUploadIdPreview(idImg.startsWith('http') ? idImg : `${global.baseURL}/${idImg}`);
      } else {
        setUploadIdPreview(null);
      }

      if (e.signatureImage?.uploadedFile) {
        const sigImg = e.signatureImage.uploadedFile;
        setSignaturePreview(sigImg.startsWith('http') ? sigImg : `${global.baseURL}/${sigImg}`);
      } else {
        setSignaturePreview(null);
      }

      setOtpStatus('success');
      setAltOtpStatus('success');
      setEnquiryId(e.enqID || '');
      setTabValue(0);
      setCustomerModal(true);
      props.setAutoOpenEdit(false);
    }
  }, [props.autoOpenEdit, props.selectedUser, props.setAutoOpenEdit, setValues, setImg, setUploadIdPreview, setSignaturePreview]);

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
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Search by Phone..."
              onChange={(e) => {
                const val = e.target.value;
                if (val.length >= 3) {
                  fetchCustomer({ phoneNumber: val, all: true });
                } else if (val.length === 0) {
                  fetchCustomer({ all: true });
                }
              }}
              InputProps={{
                startAdornment: (
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20, mr: 1 }} />
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setOpenId(null);
              resetForm();
              setImg(null);
              setUploadIdPreview(null);
              setSignaturePreview(null);
              setOtpStatus(null);
              setAltOtpStatus(null);
              setTabValue(0);
              setCustomerModal(true);
              }}
            >
              New Customer
            </Button>
          </Stack>
        </Stack>
        <Scrollbar>
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
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
                {displayData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e) => (
                  <TableRow hover key={e._id} tabIndex={-1}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectedUser?._id === e._id} onChange={() => handleSelect(e)} />
                    </TableCell>
                    <TableCell align="left">{sentenceCase(e.name ?? '')}</TableCell>
                    <TableCell align="left">{e.email}</TableCell>
                    <TableCell align="left">{global.maskPhoneNumber(e.phoneNumber)}</TableCell>
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
                            maritalStatus: e.maritalStatus || '',
                            source: e.source || '',
                            status: e.status || 'active',
                            chooseId: e.chooseId || '',
                            idNo: e.idNo || '',
                            enqID: e.enqID || '',
                          });
                          setEnquiryId(e.enqID || '');
                          // Fetch profile image if exists
                          const profileImg = e.profileImage?.uploadedFile;
                          if (profileImg) {
                            setImg(profileImg.startsWith('http') ? profileImg : `${global.baseURL}/${profileImg}`);
                          } else {
                            setImg(null);
                          }

                          // Fetch ID Proof and Signature
                          if (e.idProof?.uploadedFile) {
                            const idImg = e.idProof.uploadedFile;
                            setUploadIdPreview(idImg.startsWith('http') ? idImg : `${global.baseURL}/${idImg}`);
                          } else {
                            setUploadIdPreview(null);
                          }

                          if (e.signatureImage?.uploadedFile) {
                            const sigImg = e.signatureImage.uploadedFile;
                            setSignaturePreview(sigImg.startsWith('http') ? sigImg : `${global.baseURL}/${sigImg}`);
                          } else {
                            setSignaturePreview(null);
                          }

                          setOtpStatus('success');
                          setAltOtpStatus('success');
                          setEnquiryId(e.enqID || '');
                          setTabValue(0);
                          setCustomerModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      {!(e.sales?.length > 0) && (
                        <Button
                          variant="contained"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          sx={{ mr: 1 }}
                          onClick={() => {
                            setOpenId(e._id);
                            handleOpenDeleteModal();
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        size="small"
                        color="secondary"
                        startIcon={<Iconify icon="material-symbols:history" />}
                        onClick={() => handleOpenLogModal(e)}
                        disabled={fetchingLog}
                      >
                        Logs
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
                {displayData?.length === 0 && (
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
            count={displayData?.length || 0}
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
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              variant="fullWidth"
            >
              <Tab label="1. Details" />
              <Tab label="2. Documents" />
              <Tab label="3. Photo Capture" />
            </Tabs>

            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                          size="small"
                          label="Enquiry ID (e.g. ENQ123A)"
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
                    value={focusedField === 'phoneNumber' ? values.phoneNumber : global.maskPhoneNumber(values.phoneNumber)}
                    onFocus={() => setFocusedField('phoneNumber')}
                    onBlur={(e) => {
                      handleBlur(e);
                      setFocusedField(null);
                      if (values.phoneNumber && values.phoneNumber.length === 10) {
                        findCustomer({ phoneNumber: values.phoneNumber, all: true }).then((res) => {
                          if (res?.data && res.data.length > 0) {
                            const existingUser = res.data[0];
                            if (existingUser._id !== openId) {
                              setOpenId(existingUser._id);
                              setValues({
                                ...values,
                                name: existingUser.name || '',
                                alternatePhoneNumber: existingUser.alternatePhoneNumber || '',
                                email: existingUser.email || '',
                                dob: existingUser.dob || null,
                                gender: existingUser.gender || '',
                                maritalStatus: existingUser.maritalStatus || '',
                                source: existingUser.source || '',
                                status: existingUser.status || 'active',
                                chooseId: existingUser.chooseId || '',
                                idNo: existingUser.idNo || '',
                              });
                              const profileImg = existingUser.profileImage?.uploadedFile;
                              if (profileImg) {
                                setImg(profileImg.startsWith('http') ? profileImg : `${global.baseURL}/${profileImg}`);
                              }
                              setEnquiryId(existingUser.enqID || '');
                              setOtpStatus('success');
                              setAltOtpStatus('success');
                              setNotify({
                                open: true,
                                message: 'Existing customer found. Details loaded.',
                                severity: 'info',
                              });
                            }
                          }
                        });
                      }
                    }}
                    error={touched.phoneNumber && errors.phoneNumber && true}
                    label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone'}
                    fullWidth
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('0')) {
                        val = val.substring(1);
                      }
                      if (val.length > 0 && !/^[6-9]/.test(val)) {
                        val = '';
                      }
                      setValues({ ...values, phoneNumber: val.slice(0, 10) });
                    }}
                    inputProps={{ maxLength: 10 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    name="alternatePhoneNumber"
                    value={focusedField === 'alternatePhoneNumber' ? values.alternatePhoneNumber : global.maskPhoneNumber(values.alternatePhoneNumber)}
                    onFocus={() => setFocusedField('alternatePhoneNumber')}
                    onBlur={(e) => {
                      handleBlur(e);
                      setFocusedField(null);
                      if (values.alternatePhoneNumber && values.alternatePhoneNumber.length === 10 && altOtpStatus !== 'success') {
                        sendOtp({ phoneNumber: values.alternatePhoneNumber }).then((res) => {
                          if (res.status) {
                            setAltToken(res.data.token);
                            setNotify({ open: true, message: 'OTP sent to Alt Phone', severity: 'success' });
                          }
                        });
                      }
                    }}
                    error={touched.alternatePhoneNumber && errors.alternatePhoneNumber && true}
                    label={
                      touched.alternatePhoneNumber && errors.alternatePhoneNumber
                        ? errors.alternatePhoneNumber
                        : 'Alt phone'
                    }
                    fullWidth
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('0')) {
                        val = val.substring(1);
                      }
                      if (val.length > 0 && !/^[6-9]/.test(val)) {
                        val = '';
                      }
                      setValues({ ...values, alternatePhoneNumber: val.slice(0, 10) });
                    }}
                    inputProps={{ maxLength: 10 }}
                    InputProps={altOtpStatus === 'success' ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                            <Iconify icon="mdi:check-circle" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" fontWeight="bold">Verified</Typography>
                          </Box>
                        </InputAdornment>
                      )
                    } : null}
                  />
                </Grid>
                {values.alternatePhoneNumber?.length === 10 && altOtpStatus !== 'success' && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      name="altOtp"
                      value={values.altOtp}
                      error={touched.altOtp && errors.altOtp && true}
                      label={touched.altOtp && errors.altOtp ? errors.altOtp : 'Alt Phone Number OTP'}
                      fullWidth
                      onBlur={handleBlur}
                      onChange={(e) => {
                        handleChange(e);
                        const val = e.target.value;
                        if (val.length === 6) {
                          verifyOtp({ otp: val, token: altToken }).then((res) => {
                            if (res.status) {
                              setAltOtpStatus('success');
                            } else {
                              setAltOtpStatus('error');
                            }
                          });
                        } else {
                          setAltOtpStatus(null);
                        }
                      }}
                      inputProps={{ maxLength: 6 }}
                    />
                    {altOtpStatus === 'success' && <Typography variant="caption" color="success.main">OTP verified successfully</Typography>}
                    {altOtpStatus === 'error' && <Typography variant="caption" color="error.main">Invalid OTP</Typography>}
                  </Grid>
                )}
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
              </Grid>
            )}

            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                      Upload ID:
                    </Typography>
                    <TextField
                      name="uploadId"
                      type={'file'}
                      onBlur={handleBlur}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setValues({ ...values, uploadId: file });
                        if (file) {
                          setUploadIdPreview(URL.createObjectURL(file));
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                    {uploadIdPreview && (
                      <IconButton
                        component="a"
                        href={uploadIdPreview}
                        target="_blank"
                        rel="noreferrer"
                        color="secondary"
                        title="View ID Document"
                      >
                        <Iconify icon="mdi:eye" />
                      </IconButton>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                      Signature:
                    </Typography>
                    <TextField
                      name="signature"
                      type={'file'}
                      onBlur={handleBlur}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setValues({ ...values, signature: file });
                        if (file) {
                          setSignaturePreview(URL.createObjectURL(file));
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                    {signaturePreview && (
                      <IconButton
                        component="a"
                        href={signaturePreview}
                        target="_blank"
                        rel="noreferrer"
                        color="secondary"
                        title="View Signature"
                      >
                        <Iconify icon="mdi:eye" />
                      </IconButton>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            )}

            {tabValue === 2 && (
              <Grid container spacing={3}>
                {customerModal && (
                  <Grid item xs={12}>
                    {img === null ? (
                      <div style={{ textAlign: 'center' }}>
                        <Webcam
                          mirrored
                          audio={false}
                          height={240}
                          width={320}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          videoConstraints={videoConstraints}
                        />
                        <br />
                        <Button size="small" variant="contained" onClick={capture} sx={{ mt: 1 }}>
                          Capture photo
                        </Button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <img 
                          src={img} 
                          alt="Captured" 
                          style={{ 
                            width: '100%', 
                            maxWidth: '320px', 
                            height: 'auto', 
                            display: 'block', 
                            margin: '0 auto', 
                            borderRadius: '8px', 
                            border: '1px solid #ccc' 
                          }} 
                        />
                        <Button size="small" variant="contained" color="warning" onClick={() => setImg(null)} sx={{ mt: 1 }}>
                          Retake
                        </Button>
                      </div>
                    )}
                  </Grid>
                )}
              </Grid>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
              {tabValue > 0 && (
                <Button
                  size="large"
                  variant="outlined"
                  onClick={() => setTabValue((prev) => prev - 1)}
                >
                  Back
                </Button>
              )}
              {tabValue < 2 ? (
                <Button
                  size="large"
                  variant="contained"
                  onClick={() => setTabValue((prev) => prev + 1)}
                >
                  Next
                </Button>
              ) : (
                <LoadingButton
                  size="large"
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                >
                  Save
                </LoadingButton>
              )}
              <Button
                size="large"
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={() => setCustomerModal(false)}
              >
                Close
              </Button>
            </Stack>
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

      <Dialog open={openLogModal} onClose={handleCloseLogModal} maxWidth="lg" fullWidth>
        <DialogTitle>Customer Enquiry History</DialogTitle>
        <DialogContent dividers>
          {selectedEnquiryForLog && (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Enquiry ID: <span style={{ color: '#2065D1' }}>{selectedEnquiryForLog.enqID}</span>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Customer: <strong>{selectedEnquiryForLog.name}</strong>
              </Typography>
              <Divider sx={{ my: 2 }} />
              {(() => {
                // Ensure there's always at least the 'Enquiry Raised' entry using the createdAt timestamp
                const logs = [...(selectedEnquiryForLog.actionLog || [])];
                if (logs.length === 0 || !logs.some(l => l.action.toLowerCase().includes('enquiry raised'))) {
                  logs.unshift({
                    action: 'Enquiry Raised',
                    performedAt: selectedEnquiryForLog.createdAt,
                    performerName: null, // Indicates Customer (Online)
                    comments: 'Initial enquiry registered via QR code'
                  });
                }
                
                return (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'background.neutral' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Performed By</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Comments</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {logs.map((log, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {log.action}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {log.performerName?.name || 'Customer (Online)'}
                              {log.performerName?.employeeId && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  ID: {log.performerName.employeeId}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {moment(log.performedAt).format('YYYY-MM-DD')}
                              <Typography variant="caption" display="block" color="text.secondary">
                                {moment(log.performedAt).format('HH:mm:ss')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {log.comments || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogModal}>Close</Button>
        </DialogActions>
      </Dialog>
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


