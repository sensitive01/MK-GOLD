import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import Iconify from '../components/iconify';
import global from '../utils/global';
import useResponsive from '../hooks/useResponsive';

// ----------------------------------------------------------------------

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
  backgroundColor: '#8A1B9F', // Brand Purple
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
  maxWidth: 480,
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

// ----------------------------------------------------------------------

const translations = {
  en: {
    welcome: 'Welcome to MK Gold World',
    subtitle: 'The Most Trusted Gold Buyers',
    title: 'Customer Enquiry Form',
    formSubtitle: 'Please enter your details below',
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email ID',
    submit: 'Submit Enquiry',
    type: 'Gold Type',
    physical: 'Physical Gold',
    pledged: 'Pledged Gold',
    weight: 'Total Gross Weight (gms)',
    pincode: 'Pincode',
    success: 'Thank you! Submission successful.',
    alreadyExists: 'You are already registered!',
    contactBranch: 'Please contact the branch for further processing.',
    customerId: 'Your Customer ID',
    autoClose: 'Redirecting in {sec} seconds...',
    branchNotFound: 'Branch Information Not Found',
    sendOtp: 'Send OTP',
    enterOtp: 'Enter OTP',
    sent: 'Sent',
    otpRequired: 'Please enter the OTP',
    invalidPhone: 'Please enter a valid phone number',
    resendOtp: 'Resend OTP',
    resendOtpIn: 'Resend in {sec}s',
    verifyOtp: 'Verify',
    verified: 'Verified',
    invalidOtp: 'Invalid OTP',
  },
  kn: {
    welcome: 'MK ಗೋಲ್ಡ್ ವರ್ಲ್ಡ್‌ಗೆ ಸುಸ್ವಾಗತ',
    subtitle: 'ಅತ್ಯಂತ ವಿಶ್ವಾಸಾರ್ಹ ಚಿನ್ನದ ಖರೀದಿದಾರರು',
    title: 'ಗ್ರಾಹಕರ ವಿಚಾರಣೆ ಫಾರ್ಮ್',
    formSubtitle: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕೆಳಗೆ ನಮೂದಿಸಿ',
    name: 'ಪೂರ್ಣ ಹೆಸರು',
    phone: 'ಫೋನ್ ಸಂಖ್ಯೆ',
    email: 'ಇಮೇಲ್ ಐಡಿ',
    submit: 'ವಿಚಾರಣೆ ಸಲ್ಲಿಸಿ',
    type: 'ಚಿನ್ನದ ವಿಧ',
    physical: 'ಭೌತಿಕ ಚಿನ್ನ',
    pledged: 'ಅಡಮಾನವಿಟ್ಟ ಚಿನ್ನ',
    weight: 'ಒಟ್ಟು ತೂಕ (ಗ್ರಾಂ)',
    pincode: 'ಪಿನ್ ಕೋಡ್',
    success: 'ಧನ್ಯವಾದಗಳು! ಸಲ್ಲಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ.',
    alreadyExists: 'ನೀವು ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿಕೊಂಡಿದ್ದೀರಿ!',
    contactBranch: 'ಹೆಚ್ಚಿನ ಪ್ರಕ್ರಿಯೆಗಾಗಿ ದಯವಿಟ್ಟು ಶಾಖೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    customerId: 'ನಿಮ್ಮ ಗ್ರಾಹಕರ ಐಡಿ',
    autoClose: '{sec} ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...',
    branchNotFound: 'ಶಾಖೆಯ ಮಾಹಿತಿ ಕಂಡುಬಂದಿಲ್ಲ',
    sendOtp: 'OTP ಕಳುಹಿಸಿ',
    enterOtp: 'OTP ನಮೂದಿಸಿ',
    sent: 'ಕಳುಹಿಸಲಾಗಿದೆ',
    otpRequired: 'ದಯವಿಟ್ಟು OTP ಅನ್ನು ನಮೂದಿಸಿ',
    invalidPhone: 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ',
    resendOtp: 'OTP ಮತ್ತೆ ಕಳುಹಿಸಿ',
    resendOtpIn: '{sec}s ನಲ್ಲಿ ಮತ್ತೆ ಕಳುಹಿಸಿ',
    verifyOtp: 'ಪರಿಶೀಲಿಸಿ',
    verified: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    invalidOtp: 'ಅಸಿಂಧು OTP',
  },
};

export default function PublicEnquiry() {
  const { branchId } = useParams();
  const mdUp = useResponsive('up', 'md');
  const [lang, setLang] = useState('en');
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    type: 'physical',
    grossWeight: '',
    pincode: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    axios.get(`${global.baseURL}/api/v1.0/public/branch/${branchId}`)
      .then((res) => {
        if (res.data.status) setBranch(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branchId]);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
        window.location.reload();
    }
  }, [success, countdown]);

  const handleSendOtp = async () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      setError(t.invalidPhone);
      return;
    }
    setSendingOtp(true);
    setError('');
    try {
      const res = await axios.post(`${global.baseURL}/api/v1.0/public/qr-enquiry/send-otp`, {
        phoneNumber: formData.phoneNumber
      });
      if (res.data.status) {
        setOtpSent(true);
        setResendTimer(60);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Failed to send OTP');
    }
    setSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError(t.otpRequired);
      return;
    }
    setVerifyingOtp(true);
    setError('');
    try {
      const res = await axios.post(`${global.baseURL}/api/v1.0/public/qr-enquiry/verify-otp`, {
        phoneNumber: formData.phoneNumber,
        otp
      });
      if (res.data.status) {
        setOtpVerified(true);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(t.invalidOtp);
    }
    setVerifyingOtp(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phoneNumber || !formData.grossWeight || !formData.email) {
        setError(lang === 'en' ? 'Please fill all required fields' : 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯವಿರುವ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ');
        return;
    }
    if (!otp || !otpVerified) {
        setError(lang === 'en' ? 'Please verify your OTP first' : 'ಮೊದಲು ನಿಮ್ಮ OTP ಅನ್ನು ಪರಿಶೀಲಿಸಿ');
        return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(`${global.baseURL}/api/v1.0/public/qr-enquiry/submit`, {
        ...formData,
        otp,
        branch: branch._id,
        skipOtp: false, 
      });
      if (res.data.status) {
        setGeneratedId(res.data.data.mkgCustomerId);
        if (res.data.alreadyExists) {
            setAlreadyRegistered(true);
        }
        setSuccess(true);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError('Submission Failed');
    }
    setSubmitting(false);
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
  if (!branch) return <Container sx={{ mt: 5 }}><Alert severity="error">{t.branchNotFound}</Alert></Container>;

  return (
    <>
      <Helmet>
        <title> Customer Enquiry | MK Gold World </title>
      </Helmet>

      <StyledRoot>
        {mdUp && (
          <StyledSection>
            <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 2, fontWeight: 'bold' }}>
              {t.welcome}
            </Typography>
            <Typography variant="body1" sx={{ px: 5, mb: 5, opacity: 0.8 }}>
              {t.subtitle}
            </Typography>
            <Box
              component="img"
              src="/newLogo.jpeg"
              alt="Logo"
              sx={{
                width: 200,
                mx: 'auto',
                borderRadius: 2,
                boxShadow: (theme) => theme.customShadows.z24,
                border: '4px solid #FFD700',
              }}
            />
            <Typography variant="h6" sx={{ mt: 5, color: '#FFD700', fontWeight: 'bold' }}>
               TRUE • TRUSTED • TRANSPARENT
            </Typography>
          </StyledSection>
        )}

        <Container maxWidth="sm">
          <StyledContent>
            <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
                <ToggleButtonGroup
                    value={lang}
                    exclusive
                    onChange={(e, newLang) => newLang && setLang(newLang)}
                    size="small"
                    color="primary"
                    sx={{ bgcolor: 'white' }}
                >
                    <ToggleButton value="en">English</ToggleButton>
                    <ToggleButton value="kn">ಕನ್ನಡ</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box
              sx={{
                p: { xs: 3, md: 5 },
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: (theme) => theme.customShadows.z24,
                textAlign: 'center',
              }}
            >
               {success ? (
                 <Box sx={{ py: 3 }}>
                    <Iconify 
                        icon={alreadyRegistered ? "mdi:alert-circle" : "mdi:check-circle"} 
                        sx={{ color: alreadyRegistered ? 'warning.main' : 'success.main', width: 80, height: 80, mb: 3 }} 
                    />
                    <Typography variant="h3" gutterBottom sx={{ color: alreadyRegistered ? 'warning.dark' : 'success.darker', fontWeight: 'bold' }}>
                        {alreadyRegistered ? t.alreadyExists : t.success}
                    </Typography>
                    
                    {alreadyRegistered && (
                        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                            {t.contactBranch}
                        </Typography>
                    )}

                    <Box sx={{ bgcolor: 'primary.lighter', p: 3, borderRadius: 2, mb: 4, border: '1px dashed #8A1B9F' }}>
                        <Typography variant="subtitle2" color="primary.darker" sx={{ mb: 1 }}>
                            {t.customerId}
                        </Typography>
                        <Typography variant="h2" color="primary.darker" sx={{ letterSpacing: 3, fontWeight: 'bold' }}>
                            {generatedId}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {t.autoClose.replace('{sec}', countdown)}
                    </Typography>
                </Box>
              ) : (
                <>
                  <Box
                    component="div"
                    sx={{
                    width: 80,
                    height: 80,
                    display: 'inline-flex',
                    mx: 'auto',
                    mb: 2,
                    }}
                   >
                    <img alt="Logo" src="/newLogo.jpeg" style={{ borderRadius: '8px' }} />
                  </Box>

                  <Typography variant="h4" gutterBottom sx={{ mb: 1, color: '#8A1B9F', fontWeight: 'bold' }}>
                    {branch.branchName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    {otpSent ? (
                      <>
                        {t.enterOtpSentTo} <strong>{global.maskPhoneNumber(formData.phoneNumber)}</strong>
                      </>
                    ) : (
                      t.formSubtitle
                    )}
                  </Typography>

                  <Stack spacing={3}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        fullWidth
                        label={t.name}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <TextField
                        fullWidth
                        label={t.phone}
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        type="tel"
                        disabled={otpSent}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Iconify icon="mdi:phone" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button 
                                        variant="contained"
                                        size="small" 
                                        onClick={handleSendOtp} 
                                        disabled={sendingOtp || otpSent || !formData.phoneNumber}
                                        sx={{ 
                                            minWidth: 'auto',
                                            whiteSpace: 'nowrap',
                                            bgcolor: !otpSent ? '#8A1B9F' : 'success.main',
                                            color: '#fff',
                                            '&:hover': { bgcolor: !otpSent ? '#711683' : 'success.dark' },
                                            px: 2,
                                            mr: -0.5
                                        }}
                                    >
                                        {sendingOtp ? <CircularProgress size={20} color="inherit" /> : (otpSent ? t.sent : t.sendOtp)}
                                    </Button>
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        fullWidth
                        label={t.email}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        type="email"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Iconify icon="mdi:email" sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {otpSent && (
                        <TextField
                            fullWidth
                            label={t.enterOtp}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            type="number"
                            disabled={otpVerified}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {otpVerified ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', mr: 1 }}>
                                                <Iconify icon="mdi:check-circle" sx={{ mr: 0.5 }} />
                                                <Typography variant="body2" fontWeight="bold">{t.verified}</Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={handleVerifyOtp}
                                                    disabled={verifyingOtp || !otp}
                                                    sx={{ textTransform: 'none', mr: 1, minWidth: 'auto', px: 1.5, boxShadow: 'none' }}
                                                >
                                                    {verifyingOtp ? <CircularProgress size={16} color="inherit" /> : t.verifyOtp}
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={handleSendOtp}
                                                    disabled={resendTimer > 0 || sendingOtp}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    {resendTimer > 0 ? t.resendOtpIn.replace('{sec}', resendTimer) : t.resendOtp}
                                                </Button>
                                            </>
                                        )}
                                    </InputAdornment>
                                )
                            }}
                        />
                    )}

                    <TextField
                        fullWidth
                        select
                        label={t.type}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                        <MenuItem value="physical">{t.physical}</MenuItem>
                        <MenuItem value="pledged">{t.pledged}</MenuItem>
                    </TextField>

                    <TextField
                        fullWidth
                        label={t.weight}
                        type="number"
                        value={formData.grossWeight}
                        onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                        InputProps={{
                            endAdornment: <Typography variant="body2" color="text.secondary">Gms</Typography>,
                        }}
                    />

                    <TextField
                        fullWidth
                        label={t.pincode}
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />

                    <LoadingButton
                        fullWidth
                        size="large"
                        variant="contained"
                        loading={submitting}
                        onClick={handleSubmit}
                        sx={{
                            bgcolor: '#8A1B9F',
                            '&:hover': { bgcolor: '#711683' },
                            py: 1.5,
                            fontSize: '1.1rem',
                            color: '#fff',
                        }}
                    >
                        {t.submit}
                    </LoadingButton>
                  </Stack>
                </>
              )}
            </Box>
          </StyledContent>
        </Container>
      </StyledRoot>
    </>
  );
}
