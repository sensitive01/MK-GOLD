import { useState, forwardRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
// @mui
import {
  Stack,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';
// components
import Iconify from '../../../components/iconify';
import { login, logout } from '../../../features/authSlice';
import { isTokenExpired } from '../../../utils/token';
import { loginApi, getUserTypeApi, verifyLoginOtp } from '../../../apis/auth';

// ----------------------------------------------------------------------

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState('');
  const [loginMethod, setLoginMethod] = useState('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [error, setError] = useState(null);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const tokenValue = localStorage.getItem('token') || auth?.token;
  if (auth.isAuthenticated === true) {
    if (isTokenExpired(tokenValue)) {
      localStorage.removeItem('token');
      localStorage.removeItem('persist:root');
      dispatch(logout());
      return null;
    }
    if (!auth.user) {
      return null;
    }
    const rawType = auth.user.userType || auth.user.usertype || auth.user.role || '';
    const userType = String(rawType).trim().toLowerCase();

    if (userType === 'admin' || userType === 'subadmin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (userType === 'hr') {
      return <Navigate to="/hr/dashboard" replace />;
    }
    if (userType === 'accounts') {
      return <Navigate to="/accounts/dashboard" replace />;
    }
    if (userType === 'finance') {
      return <Navigate to="/finance/dashboard" replace />;
    }
    if (
      userType === 'branch' ||
      userType === 'assistant_branch_manager' ||
      userType === 'branch_executive'
    ) {
      return <Navigate to="/branch/dashboard" replace />;
    }
    if (userType === 'telecalling') {
      return <Navigate to="/telecalling/dashboard" replace />;
    }
    if (userType === 'transaction_executive') {
      return <Navigate to="/transaction-executive/dashboard" replace />;
    }
    if (userType === 'operations') {
      return <Navigate to="/operations/dashboard" replace />;
    }
    if (userType === 'bullion_desk') {
      return <Navigate to="/bullion-desk/dashboard" replace />;
    }
    if (userType === 'auditor') {
      return <Navigate to="/auditor/dashboard" replace />;
    }
    if (userType === 'marketing') {
      return <Navigate to="/marketing/dashboard" replace />;
    }
    if (userType === 'telecaller_tl' || userType === 'telecaller-tl') {
      return <Navigate to="/telecaller-tl/dashboard" replace />;
    }
    if (userType === 'admin_desk') {
      return <Navigate to="/admin-desk/dashboard" replace />;
    }
    if (userType === 'melting') {
      return <Navigate to="/melting/dashboard" replace />;
    }
    if (userType === 'store') {
      return <Navigate to="/store/dashboard" replace />;
    }
    if (userType === 'employee' || userType === 'general_employee' || userType.includes('employee')) {
      return <Navigate to="/employee/attendance" replace />;
    }
    return <Navigate to="/employee/attendance" replace />;
  }

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  return (
    <>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={notify.open}
        onClose={() => {
          setNotify({ ...notify, open: false });
        }}
        autoHideDuration={3000}
      >
        <Alert
          onClose={() => {
            setNotify({ ...notify, open: false });
          }}
          severity={notify.severity}
          sx={{ width: '100%', color: 'white' }}
        >
          {notify.message}
        </Alert>
      </Snackbar>
      <Stack spacing={3}>
        {error && (
          <Typography
            sx={{
              textAlign: 'center',
              color: 'error.main',
              bgcolor: 'error.lighter',
              p: 1,
              borderRadius: 1,
              fontSize: '0.875rem',
            }}
          >
            {error}
          </Typography>
        )}

        <TextField
          name="username"
          label={'Username'}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          sx={{
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused fieldset': {
                borderColor: '#8A1B9F',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#8A1B9F',
            },
          }}
        />
        {step === 2 && loginMethod === 'password' && (
          <TextField
            name="password"
            label={'Password'}
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#8A1B9F',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#8A1B9F',
              },
            }}
          />
        )}
        {step === 2 && loginMethod === 'otp' && (
          <TextField
            name="otp"
            label={'OTP'}
            type={'text'}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#8A1B9F',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#8A1B9F',
              },
            }}
          />
        )}
      </Stack>

      <LoadingButton
        fullWidth
        size="large"
        type="button"
        variant="contained"
        loading={isDisable}
        loadingIndicator={<CircularProgress color="inherit" size={16} />}
        sx={{ 
          my: 3, 
          py: 1.5,
          bgcolor: '#8A1B9F', 
          color: '#fff',
          '&:hover': { 
            bgcolor: '#6a1b9a',
            border: '1px solid #FFD700',
          },
          boxShadow: '0 8px 16px 0 rgba(138, 27, 159, 0.24)',
          fontWeight: 'bold',
          fontSize: '1rem',
          textTransform: 'none',
        }}
        onClick={() => {
          if (step === 1) {
            if (!username) {
              setNotify({
                open: true,
                message: 'Please enter username',
                severity: 'error',
              });
            } else {
              setIsDisable(true);
              setError('');
              getUserTypeApi({ username })
                .then((data) => {
                  if (data.status === true) {
                    const method = data.data.loginMethod || 'password';
                    setLoginMethod(method);
                    if (method === 'otp') {
                      loginApi({ username, password: 'no-password' })
                        .then((data) => {
                          if (data.status === true) {
                            setToken(data.data.token);
                            setStep(2);
                          } else {
                            setStep(1);
                            setError(data.message);
                          }
                          setIsDisable(false);
                        })
                        .catch((err) => {
                          setIsDisable(false);
                          setStep(1);
                          setError(err.message);
                        });
                    } else {
                      setIsDisable(false);
                      setStep(2);
                    }
                  } else {
                    setIsDisable(false);
                    setError(data.message);
                  }
                })
                .catch((err) => {
                  setIsDisable(false);
                  setError(err.message);
                });
            }
          } else {
            setIsDisable(true);
            setError(null);
            if (loginMethod === 'otp') {
              verifyLoginOtp({ token, otp })
                .then((data) => {
                  if (data.status === true) {
                    dispatch(login(data.data));
                  } else {
                    setError(data.message);
                  }
                  setIsDisable(false);
                })
                .catch((err) => {
                  setIsDisable(false);
                  setError(err.message);
                });
            } else {
              loginApi({ username, password })
                .then((data) => {
                  if (data.status === true) {
                    dispatch(login(data.data));
                  } else {
                    setError(data.message);
                  }
                  setIsDisable(false);
                })
                .catch((err) => {
                  setError(err.message);
                  setIsDisable(false);
                });
            }
          }
        }}
      >
        {step === 1 ? 'Next' : 'Login'}
      </LoadingButton>
    </>
  );
}
