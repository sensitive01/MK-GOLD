import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Container,
  Typography,
  Card,
  Grid,
  TextField,
  Stack,
  Snackbar,
  Alert,
  Divider,
  Chip,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { getProfileApi, updateProfileApi } from '../../apis/auth';

export default function Profile() {
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  const [currentTab, setCurrentTab] = useState('personal');

  const formik = useFormik({
    initialValues: {
      userId: '',
      employeeDocId: '',
      username: '',
      password: '',
      employeeName: '',
      employeeId: '',
      designation: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      email: '',
      gender: '',
      dob: '',
      doj: '',
      employmentType: '',
      shiftStartTime: '',
      shiftEndTime: '',
      languages: [],
      city: '',
      state: '',
      loginMethod: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required'),
      email: Yup.string().email('Invalid email'),
      phoneNumber: Yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
      password: Yup.string().when('loginMethod', {
        is: 'password',
        then: Yup.string().min(6, 'Password must be at least 6 characters'),
      }),
    }),
    onSubmit: async (values) => {
      const response = await updateProfileApi({
        userId: values.userId,
        employeeId: values.employeeDocId,
        username: values.username,
        password: values.password || undefined,
        email: values.email,
        phoneNumber: values.phoneNumber,
        alternatePhoneNumber: values.alternatePhoneNumber,
      });
      if (response.status) {
        setNotify({ open: true, message: 'Profile updated successfully', severity: 'success' });
      } else {
        setNotify({ open: true, message: response.message || 'Update failed', severity: 'error' });
      }
    },
  });

  useEffect(() => {
    getProfileApi().then((data) => {
      if (data.status) {
        const emp = data.data.employee || {};
        const addr = emp.address?.[0] || {};
        formik.setValues({
          userId: data.data._id || '',
          employeeDocId: emp._id || '',
          username: data.data.username || '',
          password: '',
          employeeName: emp.name || '',
          employeeId: emp.employeeId || '',
          designation: emp.designation || '',
          phoneNumber: emp.phoneNumber || '',
          alternatePhoneNumber: emp.alternatePhoneNumber || '',
          email: emp.email || '',
          gender: emp.gender || '',
          dob: emp.dob ? moment(emp.dob).format('DD-MM-YYYY') : '',
          doj: emp.doj ? moment(emp.doj).format('DD-MM-YYYY') : '',
          employmentType: emp.employmentType || '',
          shiftStartTime: emp.shiftStartTime || '',
          shiftEndTime: emp.shiftEndTime || '',
          languages: emp.languages || [],
          city: addr.city || '',
          state: addr.state || '',
          loginMethod: data.data.loginMethod || 'password',
        });
      }
    });
  }, []);

  return (
    <>
      <Helmet>
        <title> Profile | MK Gold </title>
      </Helmet>

      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          My Profile
        </Typography>

        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            sx={{
              px: 3,
              '& .MuiTab-root': { py: 2 },
            }}
          >
            <Tab value="personal" label="Personal Information" />
            <Tab value="account" label="Account Security" />
          </Tabs>
        </Card>

        <form onSubmit={formik.handleSubmit}>
          {currentTab === 'personal' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <Card sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h5" color="primary" gutterBottom>
                      {formik.values.employeeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {formik.values.designation}
                    </Typography>
                    <Chip label={`ID: ${formik.values.employeeId}`} color="primary" variant="soft" sx={{ mb: 1 }} />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Joined on: {formik.values.doj}
                    </Typography>
                  </Card>

                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Languages</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formik.values.languages.length > 0 ? (
                        formik.values.languages.map((lang) => (
                          <Chip key={lang} label={lang} size="small" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">None specified</Typography>
                      )}
                    </Box>
                  </Card>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card sx={{ p: 3 }}>
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Editable Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField 
                            fullWidth 
                            name="email"
                            label="Email Address" 
                            value={formik.values.email} 
                            onChange={formik.handleChange}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField 
                            fullWidth 
                            name="phoneNumber"
                            label="Phone Number" 
                            value={formik.values.phoneNumber} 
                            onChange={formik.handleChange}
                            error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                            helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField 
                            fullWidth 
                            name="alternatePhoneNumber"
                            label="Alternate Phone" 
                            value={formik.values.alternatePhoneNumber} 
                            onChange={formik.handleChange}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider />

                    <Box>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="text.secondary">
                        View-only Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Full Name" value={formik.values.employeeName} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Gender" value={formik.values.gender} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Date of Birth" value={formik.values.dob} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="Employment Type" value={formik.values.employmentType} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="City" value={formik.values.city} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label="State" value={formik.values.state} disabled />
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      size="large"
                      loading={formik.isSubmitting}
                      sx={{ alignSelf: 'flex-start', px: 5 }}
                    >
                      Save All Changes
                    </LoadingButton>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          )}

          {currentTab === 'account' && (
            <Card sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
              <Stack spacing={3}>
                <Typography variant="h6" color="primary">Account Credentials</Typography>
                
                <TextField
                  fullWidth
                  name="username"
                  label="Username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  error={formik.touched.username && Boolean(formik.errors.username)}
                  helperText={formik.touched.username && formik.errors.username}
                />

                {formik.values.loginMethod === 'password' ? (
                  <TextField
                    fullWidth
                    name="password"
                    label="New Password"
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                  />
                ) : (
                  <Alert severity="info" variant="outlined">
                    Your account uses <b>OTP login</b>. Password changes are managed by the Administrator.
                  </Alert>
                )}

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={formik.isSubmitting}
                  sx={{ mt: 2 }}
                >
                  Update Account
                </LoadingButton>
              </Stack>
            </Card>
          )}
        </form>

        <Snackbar
          open={notify.open}
          autoHideDuration={6000}
          onClose={() => setNotify({ ...notify, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity} sx={{ width: '100%', color: '#000' }}>
            {notify.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
}
