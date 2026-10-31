import { FormControl, InputLabel, Select, MenuItem, Card, Grid, Stack, Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Webcam from 'react-webcam';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Iconify from '../../iconify';
import { createAttendance as createBranchAttendance } from '../../../apis/branch/attendance';
import { getEmployee as getBranchEmployee } from '../../../apis/branch/employee';
import { createFile as createBranchFile } from '../../../apis/branch/fileupload';

import { createAttendance as createAccountsAttendance } from '../../../apis/accounts/attendance';
import { getEmployee as getAccountsEmployee } from '../../../apis/accounts/employee';
import { createFile as createAccountsFile } from '../../../apis/accounts/fileupload';
import { useAttendance } from '../../../context/AttendanceContext';

function CreateAttendance(props) {
  const auth = useSelector((state) => state.auth);
  const { refreshAttendance } = useAttendance();
  const [img, setImg] = useState(null);
  const webcamRef = useRef(null);
  const [employees, setEmloyees] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');

  const userType = auth?.user?.userType?.toLowerCase();
  
  const getEmployeeApi = (userType === 'finance' || userType === 'accounts' || userType === 'operations') ? getAccountsEmployee : getBranchEmployee;
  const createFileApi = (userType === 'finance' || userType === 'accounts' || userType === 'operations') ? createAccountsFile : createBranchFile;
  const createAttendanceApi = (userType === 'finance' || userType === 'accounts' || userType === 'operations') ? createAccountsAttendance : createBranchAttendance;

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }
    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let address = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const parts = [
              addr.suburb || addr.neighbourhood || addr.road || '',
              addr.city || addr.town || addr.village || addr.county || '',
              addr.state || '',
            ].filter(Boolean);
            address = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';
          }
        } catch (e) {
          console.error('Reverse geocode error:', e);
        }

        setLocation({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
        setLocationLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = 'Unable to retrieve location';
        if (err.code === 1) msg = 'Location access denied. Please allow location in your browser.';
        else if (err.code === 2) msg = 'Location unavailable';
        else if (err.code === 3) msg = 'Location request timed out';
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    getEmployeeApi().then((data) => {
      setEmloyees(data.data);
    });
  }, []);

  const videoConstraints = {
    width: 420,
    height: 420,
    facingMode: 'user',
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImg(imageSrc);
  }, [webcamRef]);

  // Form validation
  const schema = Yup.object({
    employee: Yup.string().required('Employee is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm, isSubmitting } = useFormik({
    initialValues: {
      employee: auth.user?.employee?._id || auth.user?.employee || localStorage.getItem('empId') || (auth.user?.userType !== 'admin' ? auth.user?._id : ''),
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!img) {
        props.setNotify({
          open: true,
          message: 'Please capture photo',
          severity: 'info',
        });
        setSubmitting(false);
        return;
      }
      if (locationLoading) {
        props.setNotify({
          open: true,
          message: 'Detecting your location, please wait...',
          severity: 'warning',
        });
        setSubmitting(false);
        return;
      }
      if (!location || !location.latitude || !location.longitude) {
        props.setNotify({
          open: true,
          message: locationError || 'Location is mandatory to mark attendance. Please enable location access in your browser or device settings.',
          severity: 'error',
        });
        setSubmitting(false);
        return;
      }
      try {
        const payload = {
          ...values,
          location,
        };
        const data = await createAttendanceApi(payload);
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: data.message || 'Attendance not created',
            severity: 'error',
          });
        } else {
          if (img) {
            try {
              const res = await fetch(img);
              const blob = await res.blob();
              const file = new File([blob], `${data.data.fileUpload.uploadId}.png`, { type: 'image/png' });
              const formData = new FormData();
              formData.append('uploadId', data.data.fileUpload.uploadId);
              formData.append('uploadName', data.data.fileUpload.uploadName);
              formData.append('uploadType', 'attendance');
              formData.append('uploadedFile', file);
              await createFileApi(formData);
            } catch (error) {
              console.error('File upload failed:', error);
            }
          }
          props.setToggleContainer(false);
          resetForm();
          setImg(null);
          if (refreshAttendance) refreshAttendance();
          if (props.fetchData) props.fetchData();
          props.setNotify({
            open: true,
            message: 'Attendance created',
            severity: 'success',
          });
        }
      } catch (error) {
        props.setNotify({
          open: true,
          message: 'Error creating attendance',
          severity: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
      >
        <Grid container spacing={3}>
          <Grid
            item
            xs={12}
            sm={12}
            sx={{
              display: ((!auth.user?.employee && !localStorage.getItem('empId')) && auth.user?.userType === 'admin') ? 'block' : 'none',
            }}
          >
            <FormControl fullWidth error={touched.employee && errors.employee && true}>
              <InputLabel id="select-label">Select employee</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.employee && errors.employee ? errors.employee : 'Select employee'}
                name="employee"
                value={values.employee}
                onBlur={handleBlur}
                onChange={(e) => {
                  setValues({ ...values, employee: e.target.value });
                }}
                disabled={Boolean(auth.user?.employee || localStorage.getItem('empId'))}
              >
                {values.employee && !employees?.some((e) => e._id === values.employee) && (
                  <MenuItem value={values.employee} sx={{ display: 'none' }}>
                    {values.employee}
                  </MenuItem>
                )}
                {employees?.map((e) => (
                  <MenuItem key={e._id} value={e._id}>{e.employeeId} {e.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {!values.employee && (
            <Grid item xs={12}>
              <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
                Please select an employee to mark attendance.
              </div>
            </Grid>
          )}

          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Live Location Status Indicator */}
            <Box
              sx={{
                mb: 2.5,
                p: 1.5,
                px: 2,
                borderRadius: 2,
                bgcolor: location ? 'rgba(46, 125, 50, 0.08)' : locationError ? 'rgba(211, 47, 47, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid',
                borderColor: location ? 'rgba(46, 125, 50, 0.28)' : locationError ? 'rgba(211, 47, 47, 0.28)' : 'rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                maxWidth: 420,
                width: '100%',
              }}
            >
              {locationLoading ? (
                <>
                  <CircularProgress size={18} color="inherit" />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Detecting your current location... (Mandatory)
                  </Typography>
                </>
              ) : location ? (
                <>
                  <Iconify icon="material-symbols:location-on" sx={{ color: 'success.main', width: 22, height: 22, flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Current Location (Mandatory)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap title={location.address}>
                      {location.address}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={fetchLocation} title="Refresh Location" sx={{ color: 'text.secondary' }}>
                    <Iconify icon="eva:refresh-fill" sx={{ width: 18, height: 18 }} />
                  </IconButton>
                </>
              ) : (
                <>
                  <Iconify icon="mdi:map-marker-off" sx={{ color: 'error.main', width: 22, height: 22, flexShrink: 0 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                      Location Required (Mandatory)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 500, display: 'block' }}>
                      {locationError || 'Location access is required to mark attendance.'}
                    </Typography>
                  </Box>
                  <Button size="small" variant="contained" color="error" onClick={fetchLocation} sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.3, px: 1, textTransform: 'none' }}>
                    Retry
                  </Button>
                </>
              )}
            </Box>

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
                  style={{ borderRadius: '10px', marginBottom: '20px', border: '2px solid #33c2ff' }}
                />
                <LoadingButton size="large" type="button" variant="contained" onClick={capture} sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC800' } }}>
                  Capture Photo
                </LoadingButton>
              </>
            ) : (
              <>
                <img src={img} alt="screenshot" style={{ borderRadius: '10px', marginBottom: '20px', width: '400px', height: '400px', border: '2px solid #33c2ff' }} />
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <LoadingButton size="large" type="button" variant="contained" onClick={() => setImg(null)} sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC800' } }}>
                    Retake Photo
                  </LoadingButton>
                  <LoadingButton
                    size="large"
                    type="submit"
                    variant="contained"
                    sx={{ px: 5 }}
                    disabled={!values.employee || locationLoading || !location || !location.latitude}
                    loading={isSubmitting}
                  >
                    Save Attendance
                  </LoadingButton>
                </Stack>
              </>
            )}
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default CreateAttendance;


