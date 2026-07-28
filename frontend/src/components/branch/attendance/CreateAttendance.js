  import { FormControl, InputLabel, Select, MenuItem, Card, Grid, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Webcam from 'react-webcam';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createAttendance as createBranchAttendance } from '../../../apis/branch/attendance';
import { getEmployee as getBranchEmployee } from '../../../apis/branch/employee';
import { createFile as createBranchFile } from '../../../apis/branch/fileupload';

import { createAttendance as createAccountsAttendance } from '../../../apis/accounts/attendance';
import { getEmployee as getAccountsEmployee } from '../../../apis/accounts/employee';
import { createFile as createAccountsFile } from '../../../apis/accounts/fileupload';

function CreateAttendance(props) {
  const auth = useSelector((state) => state.auth);
  const [img, setImg] = useState(null);
  const webcamRef = useRef(null);
  const [employees, setEmloyees] = useState([]);

  const userType = auth?.user?.userType?.toLowerCase();
  
  const getEmployeeApi = (userType === 'finance' || userType === 'accounts' || userType === 'operations') ? getAccountsEmployee : getBranchEmployee;
  const createFileApi = (userType === 'finance' || userType === 'accounts' || userType === 'operations') ? createAccountsFile : createBranchFile;
  const createAttendanceApi = (userType === 'finance' || userType === 'accounts' || userType === 'operations') ? createAccountsAttendance : createBranchAttendance;

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
      try {
        const data = await createAttendanceApi(values);
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
                  <LoadingButton size="large" type="submit" variant="contained" sx={{ px: 5 }} disabled={!values.employee} loading={isSubmitting}>
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


