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
import { login } from '../../../features/authSlice';
import { loginApi, getUserTypeApi, verifyLoginOtp } from '../../../apis/auth';

// ----------------------------------------------------------------------

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [userType, setUserType] = useState('');
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

  if (auth.isAuthenticated === true) {
    const userType = auth.user.userType?.toLowerCase();
    if (userType === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    }
    if (userType === 'hr') {
      return <Navigate to="/hr/dashboard" />;
    }
    if (userType === 'accounts') {
      return <Navigate to="/accounts/dashboard" />;
    }
    if (
      userType === 'branch' ||
      userType === 'assistant_branch_manager' ||
      userType === 'branch_executive' ||
      userType === 'telecalling'
    ) {
      return <Navigate to="/branch/dashboard" />;
    }
    return <Navigate to="/404" />;
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
        {step === 2 && !['branch', 'assistant_branch_manager', 'branch_executive', 'telecalling'].includes(userType) && (
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
        {step === 2 && ['branch', 'assistant_branch_manager', 'branch_executive', 'telecalling'].includes(userType) && (
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
                    setUserType(data.data.userType);
                    if (['branch', 'assistant_branch_manager', 'branch_executive'].includes(data.data.userType)) {
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
            if (['branch', 'assistant_branch_manager', 'branch_executive'].includes(userType)) {
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
