import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  Grid,
  Tab,
  Tabs,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Chip,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Webcam from 'react-webcam';
import axios from 'axios';
import { pinToAddress } from 'india-pincode-finder';
import { Helmet } from 'react-helmet-async';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import Iconify from '../components/iconify';
import global from '../utils/global';
import useResponsive from '../hooks/useResponsive';
import { createCustomerKYC, createFileKYC, createAddressKYC, sendOtpKYC, verifyOtpKYC } from '../apis/public/kyc';

const StyledRoot = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'flex',
    minHeight: '100vh',
  },
  backgroundColor: '#f4f6f8',
}));

const StyledSection = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: 480,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: '#8A1B9F', 
  color: '#fff',
  padding: theme.spacing(0, 5),
  textAlign: 'center',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
  },
}));

const StyledContent = styled('div')(({ theme }) => ({
  width: '100%',
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

export default function PublicKYC() {
  const { branchId, id } = useParams();
  const [searchParams] = useSearchParams();
  const targetParam = id || branchId;
  const mdUp = useResponsive('up', 'md');
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [enquiryId, setEnquiryId] = useState('');
  const [fetchingEnquiry, setFetchingEnquiry] = useState(false);
  
  const [img, setImg] = useState(null);
  const webcamRef = useRef(null);
  const form = useRef();
  
  const [uploadIdPreview, setUploadIdPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImg(imageSrc);
  }, [webcamRef]);

  // Alternate WhatsApp OTP States
  const [altOtp, setAltOtp] = useState('');
  const [altToken, setAltToken] = useState(null);
  const [altSendingOtp, setAltSendingOtp] = useState(false);
  const [altVerifyingOtp, setAltVerifyingOtp] = useState(false);
  const [isAltOtpVerified, setIsAltOtpVerified] = useState(false);
  const [showAltOtpInput, setShowAltOtpInput] = useState(false);
  const [altOtpError, setAltOtpError] = useState('');
  const [altOtpSuccessMsg, setAltOtpSuccessMsg] = useState('');
  const [altCountdown, setAltCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (altCountdown > 0) {
      timer = setTimeout(() => setAltCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [altCountdown]);

  const handleSendAltOtp = async () => {
    if (!values.alternatePhoneNumber || values.alternatePhoneNumber.length !== 10) {
      setAltOtpError('Please enter a valid 10-digit alternate phone number first.');
      return;
    }
    setAltSendingOtp(true);
    setAltOtpError('');
    setAltOtpSuccessMsg('');
    try {
      const res = await sendOtpKYC({ phoneNumber: values.alternatePhoneNumber });
      if (res?.status) {
        setAltToken(res.data?.token);
        setShowAltOtpInput(true);
        setAltCountdown(30);
        setAltOtpSuccessMsg('WhatsApp OTP sent successfully!');
      } else {
        setAltOtpError(res?.message || 'Failed to send WhatsApp OTP');
      }
    } catch (err) {
      setAltOtpError(err?.message || 'Error sending WhatsApp OTP');
    } finally {
      setAltSendingOtp(false);
    }
  };

  const handleVerifyAltOtp = async () => {
    if (!altOtp || altOtp.length !== 6) {
      setAltOtpError('Please enter a 6-digit OTP');
      return;
    }
    setAltVerifyingOtp(true);
    setAltOtpError('');
    try {
      const res = await verifyOtpKYC({ token: altToken, otp: altOtp });
      if (res?.status) {
        setIsAltOtpVerified(true);
        setShowAltOtpInput(false);
        setAltOtpSuccessMsg('Alternate WhatsApp number verified successfully!');
      } else {
        setAltOtpError(res?.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      setAltOtpError(err?.message || 'Error verifying OTP');
    } finally {
      setAltVerifyingOtp(false);
    }
  };

  const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    phoneNumber: Yup.string()
      .required('Phone is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    alternatePhoneNumber: Yup.string()
      .matches(/^[0-9]{10}$/, { message: 'Alternate phone number must be exactly 10 digits', excludeEmptyString: true }),
    source: Yup.string().required('Source is required'),
    email: Yup.string().email('Enter a valid email'),
    dob: Yup.string().required('DOB is required'),
    gender: Yup.string().required('Gender is required'),
    maritalStatus: Yup.string().required('Marital Status is required'),
    line1: Yup.string().required('Address Line 1 is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string().required('Pincode is required'),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    setValues,
    setFieldValue,
    touched,
    errors,
  } = useFormik({
    initialValues: {
      name: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      email: '',
      dob: null,
      gender: '',
      maritalStatus: '',
      source: '',
      status: 'active',
      isWhatsapp: false,
      isAlternateWhatsapp: false,
      chooseId: '',
      idNo: '',
      uploadId: null,
      signature: null,
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
    },
    validationSchema: schema,
    onSubmit: async (formValues) => {
      if (formValues.isAlternateWhatsapp && formValues.alternatePhoneNumber?.length === 10 && !isAltOtpVerified) {
        setError('Please verify your alternate WhatsApp number with OTP before submitting.');
        setTabValue(0);
        return;
      }

      if (!img) {
        setError('Please capture your photo in the Photo Capture tab.');
        setTabValue(2);
        return;
      }
      
      setError('');
      setLoading(true);

      const customerPayload = {
        branch: branch?._id,
        name: formValues.name,
        phoneNumber: formValues.phoneNumber,
        whatsappNumber: formValues.isWhatsapp ? formValues.phoneNumber : '',
        alternatePhoneNumber: formValues.alternatePhoneNumber,
        alternateWhatsappNumber: formValues.isAlternateWhatsapp ? formValues.alternatePhoneNumber : '',
        email: formValues.email,
        dob: formValues.dob,
        gender: formValues.gender,
        maritalStatus: formValues.maritalStatus,
        source: formValues.source,
        status: formValues.status,
        enqID: enquiryId,
        chooseId: formValues.chooseId,
        idNo: formValues.idNo,
      };

      try {
        const customerRes = await createCustomerKYC(customerPayload);
        if (!customerRes.status) {
          setError(customerRes.message || 'Failed to create customer');
          setLoading(false);
          return;
        }

        const customerId = customerRes.data.data._id;
        const uploadId = customerRes.data.fileUpload.uploadId;
        const uploadName = customerRes.data.fileUpload.uploadName;

        // Upload Profile Photo
        if (img) {
          const res = await fetch(img);
          const blob = await res.blob();
          const file = new File([blob], `profile-${uploadId}.png`, { type: 'image/png' });
          const formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('uploadName', uploadName);
          formData.append('uploadType', 'profile_image');
          formData.append('uploadedFile', file);
          await createFileKYC(formData);
        }

        // Upload ID Document
        if (formValues.uploadId) {
          const formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('uploadName', uploadName);
          formData.append('uploadType', 'upload_id');
          formData.append('uploadedFile', formValues.uploadId);
          formData.append('documentType', formValues.chooseId);
          formData.append('documentNo', formValues.idNo);
          await createFileKYC(formData);
        }

        // Upload Signature
        if (formValues.signature) {
          const formData = new FormData();
          formData.append('uploadId', uploadId);
          formData.append('uploadName', uploadName);
          formData.append('uploadType', 'signature');
          formData.append('uploadedFile', formValues.signature);
          await createFileKYC(formData);
        }

        // Create Address
        const addressPayload = {
          customerId: customerId,
          address: [{
            address: formValues.line1,
            area: formValues.line2 || formValues.city,
            city: formValues.city,
            state: formValues.state,
            pincode: formValues.pincode,
            landmark: 'N/A',
            residential: 'Owned',
            label: 'Home',
          }]
        };
        await createAddressKYC(addressPayload);

        setSuccess(true);
      } catch (err) {
        setError('An error occurred during submission. Please try again.');
      }
      setLoading(false);
    },
  });

  useEffect(() => {
    if (values.pincode && values.pincode.toString().length === 6) {
      try {
        const address = pinToAddress(Number(values.pincode));
        if (address) {
          const divisionCity = address.divisionname ? address.divisionname.replace(/ Division/gi, '').replace(/ GPO/gi, '').trim() : '';
          setFieldValue('city', divisionCity || address.district || address.block || '');
          setFieldValue('state', address.state || '');
        }
      } catch (err) {
        console.error('Error fetching pincode:', err);
      }
    }
  }, [values.pincode, setFieldValue]);

  const handleFetchEnquiry = async (idOverride) => {
    const cleanOverride = typeof idOverride === 'string' ? idOverride : null;
    const idToFetch = cleanOverride || enquiryId;
    if (!idToFetch || typeof idToFetch !== 'string') return;
    setFetchingEnquiry(true);
    setError('');
    try {
      const apiBase = global.baseURL || 'http://localhost:4998';
      const res = await axios.get(`${apiBase}/api/v1.0/public/qr-enquiry/get-by-enqid/${encodeURIComponent(idToFetch.trim())}`);
      if (res.data.status && res.data.data) {
        const data = res.data.data;
        if (data.branch) {
          setBranch(data.branch);
        }
        if (data.enqID) setEnquiryId(data.enqID);
        if (data.name) setFieldValue('name', data.name);
        if (data.phoneNumber) setFieldValue('phoneNumber', data.phoneNumber);
        if (data.email) setFieldValue('email', data.email);
        if (data.pincode) setFieldValue('pincode', data.pincode);
      } else {
        setError(res.data.message || 'Enquiry details not found');
      }
    } catch (err) {
      console.error('Fetch enquiry error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch enquiry details');
    }
    setFetchingEnquiry(false);
  };

  useEffect(() => {
    if (!targetParam) {
      setLoading(false);
      return;
    }

    const apiBase = global.baseURL || 'http://localhost:4998';
    const isEnquiryId = Boolean(id) || targetParam.toUpperCase().startsWith('MKG') || targetParam.length !== 24;

    if (isEnquiryId) {
      setLoading(true);
      setError('');
      setEnquiryId(targetParam);
      axios.get(`${apiBase}/api/v1.0/public/qr-enquiry/get-by-enqid/${encodeURIComponent(targetParam.trim())}`)
        .then((res) => {
          if (res.data.status && res.data.data) {
            const data = res.data.data;
            if (data.branch) {
              setBranch(data.branch);
            }
            if (data.enqID) setEnquiryId(data.enqID);
            if (data.name) setFieldValue('name', data.name);
            if (data.phoneNumber) setFieldValue('phoneNumber', data.phoneNumber);
            if (data.email) setFieldValue('email', data.email);
            if (data.pincode) setFieldValue('pincode', data.pincode);
          } else {
            setError(res.data.message || 'Enquiry details not found');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load enquiry details');
          setLoading(false);
        });
    } else {
      // Normal branchId route (/kyc/69b39dd649121dda25fbf607)
      setLoading(true);
      axios.get(`${apiBase}/api/v1.0/public/branch/${targetParam}`)
        .then((res) => {
          if (res.data.status) setBranch(res.data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      let urlEnqId = null;
      for (const [key, value] of searchParams.entries()) {
        const lower = key.toLowerCase();
        if (lower === 'enqid' || lower === 'enqld' || lower === 'enq_id' || lower === 'customerid') {
          urlEnqId = value;
          break;
        }
      }
      if (urlEnqId) {
        const cleanId = urlEnqId.trim();
        setEnquiryId(cleanId);
        handleFetchEnquiry(cleanId);
      }
    }
  }, [targetParam, id, searchParams, setFieldValue]);

  const handleNext = () => {
    if (tabValue === 0 && values.isAlternateWhatsapp && values.alternatePhoneNumber?.length === 10 && !isAltOtpVerified) {
      setError('Please verify your alternate WhatsApp number with OTP before proceeding.');
      return;
    }
    setError('');
    setTabValue((prev) => prev + 1);
  };

  const handleBack = () => {
    setTabValue((prev) => prev - 1);
  };

  if (loading && !branch) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  if (!branch) return <Container sx={{ mt: 5 }}><Alert severity="error">Branch Information Not Found</Alert></Container>;

  return (
    <>
      <Helmet>
        <title> KYC | MK Gold World </title>
      </Helmet>

      <StyledRoot>
        {mdUp && (
          <StyledSection>
            <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 2, fontWeight: 'bold' }}>
              Welcome to MK Gold World
            </Typography>
            <Typography variant="body1" sx={{ px: 5, mb: 5, opacity: 0.8 }}>
              Complete your KYC to proceed
            </Typography>
            <Box
              component="img"
              src="/assets/icons/navbar/MK%20Gold%20Logo%20light.png"
              alt="Logo"
              sx={{
                width: 200,
                mx: 'auto',
                borderRadius: 2,
                boxShadow: (theme) => theme.customShadows.z24,
              }}
            />
          </StyledSection>
        )}

        <Container maxWidth="md">
          <StyledContent>
            <Box
              sx={{
                p: { xs: 3, md: 5 },
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: (theme) => theme.customShadows.z24,
              }}
            >
              {!mdUp && (
                  <Box
                    component="img"
                    src="/assets/icons/navbar/MK%20Gold%20Logo.png"
                    alt="Logo"
                    sx={{
                      width: 180,
                      mx: 'auto',
                      mb: 2,
                    }}
                  />
              )}
              
              <Typography variant="h4" gutterBottom sx={{ mb: 3, color: '#8A1B9F', fontWeight: 'bold', textAlign: 'center' }}>
                Customer KYC
              </Typography>

              {success ? (
                 <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Iconify icon="mdi:check-circle" sx={{ color: 'success.main', width: 80, height: 80, mb: 3 }} />
                    <Typography variant="h3" gutterBottom sx={{ color: 'success.darker', fontWeight: 'bold' }}>
                        KYC Submitted Successfully!
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                        Thank you for registering with MK Gold World. Our team will review your details.
                    </Typography>
                    <Button variant="contained" onClick={() => window.location.href = `/enquiry/${branch?._id || branchId}`}>
                        Return to Enquiry
                    </Button>
                </Box>
              ) : (
                <form
                  ref={form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  autoComplete="off"
                >
                  <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="1. Details" />
                    <Tab label="2. Documents" />
                    <Tab label="3. Photo Capture" />
                    <Tab label="4. Address" />
                  </Tabs>

                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
                                onClick={() => handleFetchEnquiry()}
                            >
                                Fetch Detail
                            </LoadingButton>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          name="name"
                          value={values.name}
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          label="Full Name"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="email"
                          value={values.email}
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          label="Email ID"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          name="phoneNumber"
                          value={values.phoneNumber}
                          error={touched.phoneNumber && Boolean(errors.phoneNumber)}
                          helperText={touched.phoneNumber && errors.phoneNumber}
                          label="Phone Number"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                          inputProps={{ maxLength: 10 }}
                        />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            <FormControlLabel
                              control={<Checkbox name="isWhatsapp" checked={values.isWhatsapp} onChange={handleChange} size="small" sx={{ color: '#25D366', '&.Mui-checked': { color: '#25D366' } }} />}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#25D366' }}>
                                  <Typography variant="body2" sx={{ mr: 0.5 }}>Mark as WhatsApp number</Typography>
                                  <Iconify icon="mdi:whatsapp" width={18} height={18} />
                                </Box>
                              }
                              sx={{ mt: 0.5, mr: 0, ml: 0 }}
                            />
                          </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="alternatePhoneNumber"
                          value={values.alternatePhoneNumber}
                          error={touched.alternatePhoneNumber && Boolean(errors.alternatePhoneNumber)}
                          helperText={touched.alternatePhoneNumber && errors.alternatePhoneNumber}
                          label="Alt Phone (Optional)"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.startsWith('0')) {
                              val = val.substring(1);
                            }
                            if (val.length > 0 && !/^[6-9]/.test(val)) {
                              val = '';
                            }
                            setFieldValue('alternatePhoneNumber', val.slice(0, 10));
                            if (isAltOtpVerified) {
                              setIsAltOtpVerified(false);
                              setAltToken(null);
                              setAltOtp('');
                              setAltOtpSuccessMsg('');
                              setShowAltOtpInput(false);
                            }
                          }}
                          inputProps={{ maxLength: 10 }}
                          InputProps={isAltOtpVerified ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#00a76f' }}>
                                  <Iconify icon="mdi:check-circle" sx={{ mr: 0.5 }} />
                                  <Typography variant="caption" fontWeight="bold">Verified</Typography>
                                </Box>
                              </InputAdornment>
                            ),
                          } : null}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isAltOtpVerified && (
                              <Chip
                                size="small"
                                icon={<Iconify icon="mdi:check-circle" />}
                                label="WhatsApp Verified"
                                color="success"
                                variant="outlined"
                                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
                              />
                            )}
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="isAlternateWhatsapp"
                                checked={values.isAlternateWhatsapp}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFieldValue('isAlternateWhatsapp', checked);
                                  if (!checked) {
                                    setIsAltOtpVerified(false);
                                    setShowAltOtpInput(false);
                                    setAltOtp('');
                                    setAltToken(null);
                                    setAltOtpError('');
                                    setAltOtpSuccessMsg('');
                                  }
                                }}
                                size="small"
                                sx={{ color: '#25D366', '&.Mui-checked': { color: '#25D366' } }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', color: '#25D366' }}>
                                <Typography variant="body2" sx={{ mr: 0.5 }}>Mark as WhatsApp number</Typography>
                                <Iconify icon="mdi:whatsapp" width={18} height={18} />
                              </Box>
                            }
                            sx={{ mr: 0, ml: 0 }}
                          />
                        </Box>

                        {/* WhatsApp OTP Verification Box for Alternate Number */}
                        {values.isAlternateWhatsapp && values.alternatePhoneNumber?.length === 10 && !isAltOtpVerified && (
                          <Box sx={{ mt: 1 }}>
                            {!showAltOtpInput ? (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={altSendingOtp}
                                  onClick={handleSendAltOtp}
                                  startIcon={altSendingOtp ? <CircularProgress size={16} color="inherit" /> : null}
                                  sx={{
                                    bgcolor: '#25D366',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#128C7E' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    boxShadow: 'none',
                                    whiteSpace: 'nowrap',
                                    px: 2.5,
                                    py: 0.8,
                                  }}
                                >
                                  {altSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                                </Button>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  mt: 1,
                                  p: 2,
                                  borderRadius: 1.5,
                                  bgcolor: 'rgba(37, 211, 102, 0.06)',
                                  border: '1px dashed #25D366',
                                }}
                              >
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                                  Enter the 6-digit OTP sent to WhatsApp number <strong>+91 {values.alternatePhoneNumber}</strong>
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                                  <TextField
                                    size="small"
                                    placeholder="6-digit OTP"
                                    value={altOtp}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                      setAltOtp(val);
                                      setAltOtpError('');
                                    }}
                                    error={Boolean(altOtpError)}
                                    inputProps={{ maxLength: 6, style: { letterSpacing: 4, fontWeight: 700, fontSize: '1rem', textAlign: 'center' } }}
                                    sx={{ width: { xs: '100%', sm: 160 }, bgcolor: 'background.paper' }}
                                  />
                                  <Button
                                    size="small"
                                    variant="contained"
                                    disabled={altOtp.length !== 6 || altVerifyingOtp}
                                    onClick={handleVerifyAltOtp}
                                    startIcon={altVerifyingOtp ? <CircularProgress size={16} color="inherit" /> : null}
                                    sx={{
                                      bgcolor: '#25D366',
                                      color: '#fff',
                                      '&:hover': { bgcolor: '#128C7E' },
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      boxShadow: 'none',
                                      whiteSpace: 'nowrap',
                                      height: 40,
                                      px: 2,
                                    }}
                                  >
                                    {altVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="text"
                                    disabled={altCountdown > 0 || altSendingOtp}
                                    onClick={handleSendAltOtp}
                                    sx={{ textTransform: 'none', fontSize: '0.8rem', color: '#128C7E', whiteSpace: 'nowrap' }}
                                  >
                                    {altCountdown > 0 ? `Resend in ${altCountdown}s` : 'Resend OTP'}
                                  </Button>
                                </Stack>
                              </Box>
                            )}

                            {altOtpError && (
                              <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5, fontWeight: 500 }}>
                                {altOtpError}
                              </Typography>
                            )}

                            {altOtpSuccessMsg && (
                              <Typography variant="caption" sx={{ color: '#00a76f', display: 'block', mt: 0.5, fontWeight: 500 }}>
                                {altOtpSuccessMsg}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                          <DesktopDatePicker
                            label="DOB"
                            inputFormat="MM/DD/YYYY"
                            value={values.dob}
                            onChange={(e) => setValues({ ...values, dob: e })}
                            renderInput={(params) => (
                                <TextField required {...params} fullWidth error={touched.dob && Boolean(errors.dob)} helperText={touched.dob && errors.dob} />
                            )}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl required fullWidth error={touched.gender && Boolean(errors.gender)}>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            label="Gender"
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
                      <Grid item xs={12} sm={6}>
                        <FormControl required fullWidth error={touched.maritalStatus && Boolean(errors.maritalStatus)}>
                          <InputLabel>Marital Status</InputLabel>
                          <Select
                            label="Marital Status"
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
                      <Grid item xs={12} sm={6}>
                        <FormControl required fullWidth error={touched.source && Boolean(errors.source)}>
                          <InputLabel>Source</InputLabel>
                          <Select
                            label="Source"
                            name="source"
                            value={values.source}
                            onBlur={handleBlur}
                            onChange={handleChange}
                          >
                            <MenuItem value="Online KYC">Online KYC</MenuItem>
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
                        <FormControl required fullWidth error={touched.chooseId && Boolean(errors.chooseId)}>
                          <InputLabel>ID Document Type</InputLabel>
                          <Select
                            label="ID Document Type"
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
                          required
                          name="idNo"
                          value={values.idNo}
                          error={touched.idNo && Boolean(errors.idNo)}
                          helperText={touched.idNo && errors.idNo}
                          label="ID Number"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                          Upload ID Document *
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <TextField
                            required
                            type="file"
                            name="uploadId"
                            id="uploadIdInput"
                            onBlur={handleBlur}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setValues({ ...values, uploadId: file });
                              if (file) setUploadIdPreview(URL.createObjectURL(file));
                            }}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                          {uploadIdPreview && (
                            <>
                              <IconButton component="a" href={uploadIdPreview} target="_blank" color="primary">
                                <Iconify icon="mdi:eye" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setValues({ ...values, uploadId: '' });
                                  setUploadIdPreview(null);
                                  const el = document.getElementById('uploadIdInput');
                                  if (el) el.value = '';
                                }}
                              >
                                <span style={{ fontSize: '18px', lineHeight: 1 }}>&times;</span>
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>Upload Signature</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <TextField
                            type="file"
                            name="signature"
                            id="signatureInput"
                            onBlur={handleBlur}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              setValues({ ...values, signature: file });
                              if (file) setSignaturePreview(URL.createObjectURL(file));
                            }}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                          {signaturePreview && (
                            <>
                              <IconButton component="a" href={signaturePreview} target="_blank" color="primary">
                                <Iconify icon="mdi:eye" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => {
                                  setValues({ ...values, signature: '' });
                                  setSignaturePreview(null);
                                  const el = document.getElementById('signatureInput');
                                  if (el) el.value = '';
                                }}
                              >
                                <span style={{ fontSize: '18px', lineHeight: 1 }}>&times;</span>
                              </IconButton>
                            </>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  )}

                  {tabValue === 2 && (
                    <Grid container spacing={3} justifyContent="center">
                      <Grid item xs={12} md={8}>
                        {img === null ? (
                          <Box sx={{ textAlign: 'center', p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                            <Webcam
                              mirrored
                              audio={false}
                              width="100%"
                              ref={webcamRef}
                              screenshotFormat="image/png"
                              videoConstraints={{ facingMode: 'user' }}
                              style={{ borderRadius: 8 }}
                            />
                            <Button variant="contained" onClick={capture} sx={{ mt: 2 }}>
                              Capture Photo
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                            <img src={img} alt="captured" style={{ width: '100%', borderRadius: 8 }} />
                            <Button variant="outlined" onClick={() => setImg(null)} sx={{ mt: 2 }}>
                              Retake Photo
                            </Button>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  )}

                  {tabValue === 3 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          required
                          name="line1"
                          value={values.line1}
                          error={touched.line1 && Boolean(errors.line1)}
                          helperText={touched.line1 && errors.line1}
                          label="Address Line 1"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="line2"
                          value={values.line2}
                          label="Address Line 2 (Optional)"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          required
                          name="city"
                          value={values.city}
                          error={touched.city && Boolean(errors.city)}
                          helperText={touched.city && errors.city}
                          label="City"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          required
                          name="state"
                          value={values.state}
                          error={touched.state && Boolean(errors.state)}
                          helperText={touched.state && errors.state}
                          label="State"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          required
                          name="pincode"
                          value={values.pincode}
                          error={touched.pincode && Boolean(errors.pincode)}
                          helperText={touched.pincode && errors.pincode}
                          label="Pincode"
                          fullWidth
                          onBlur={handleBlur}
                          onChange={handleChange}
                        />
                      </Grid>
                    </Grid>
                  )}

                  <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      type="button"
                      size="large"
                      variant="outlined"
                      onClick={handleBack}
                      disabled={tabValue === 0}
                    >
                      Back
                    </Button>
                    
                    {tabValue < 3 ? (
                      <Button
                        size="large"
                        variant="contained"
                        onClick={handleNext}
                        disabled={
                          (tabValue === 0 && (
                            !values.name || 
                            !values.phoneNumber || 
                            !values.dob || 
                            !values.gender || 
                            !values.maritalStatus || 
                            !values.source ||
                            (values.isAlternateWhatsapp && values.alternatePhoneNumber?.length === 10 && !isAltOtpVerified)
                          )) ||
                          (tabValue === 1 && (!values.chooseId || !values.idNo || !values.uploadId || !values.signature)) ||
                          (tabValue === 2 && !img)
                        }
                      >
                        Next
                      </Button>
                    ) : (
                      <LoadingButton 
                        size="large" 
                        type="submit" 
                        variant="contained" 
                        disabled={
                          loading || 
                          !values.name || !values.phoneNumber || !values.dob || !values.gender || !values.maritalStatus || !values.source ||
                          !values.chooseId || !values.idNo || !values.uploadId || !values.signature ||
                          !img ||
                          !values.line1 || !values.city || !values.state || !values.pincode
                        }
                        sx={{ bgcolor: '#8A1B9F', color: '#fff', '&:hover': { bgcolor: '#711683' } }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit KYC'}
                      </LoadingButton>
                    )}
                  </Stack>
                </form>
              )}
            </Box>
          </StyledContent>
        </Container>
      </StyledRoot>
    </>
  );
}
