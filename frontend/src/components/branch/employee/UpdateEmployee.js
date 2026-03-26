import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LoadingButton } from '@mui/lab';
import { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getEmployeeById, updateEmployee } from '../../../apis/branch/employee';

function UpdateEmployee(props) {
  // Form validation
  const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    gender: Yup.string().required('Gender is required'),
    email: Yup.string().email('Invalid email'),
    designation: Yup.string().required('Designation is required'),
    salary: Yup.string().required('Salary is required'),
    employeeId: Yup.string().required('Employee Id is required'),
    phoneNumber: Yup.string()
      .required('Phone is required')
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(10),
    alternatePhoneNumber: Yup.string()
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(10),
    dob: Yup.string().required('DOB is required'),
    shiftStartTime: Yup.string().required('Login Time is required'),
    shiftEndTime: Yup.string().required('Logout Time is required'),
    status: Yup.string().required('Status is required'),
  });

  const initialValues = {
    name: '',
    gender: '',
    email: '',
    designation: '',
    salary: '',
    employeeId: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    dob: '',
    shiftStartTime: '',
    shiftEndTime: '',
    status: '',
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, setFieldValue, resetForm } =
    useFormik({
      initialValues: { ...initialValues },
      validationSchema: schema,
      onSubmit: (values) => {
        updateEmployee(props.id, values).then((data) => {
          if (data.status === false) {
            props.setNotify({
              open: true,
              message: 'Employee not updated',
              severity: 'error',
            });
          } else {
            props.setToggleContainer(false);
            props.setNotify({
              open: true,
              message: 'Employee updated',
              severity: 'success',
            });
          }
        });
      },
    });

  useEffect(() => {
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getEmployeeById(props.id).then((data) => {
        setValues(data.data ?? {});
      });
    }
  }, [props.id]);

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
          <Grid item xs={12} sm={4}>
            <TextField
              name="employeeId"
              value={values.employeeId || ''}
              error={touched.employeeId && errors.employeeId && true}
              label={touched.employeeId && errors.employeeId ? errors.employeeId : 'Employee Id'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="name"
              value={values.name || ''}
              error={touched.name && errors.name && true}
              label={touched.name && errors.name ? errors.name : 'Name'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="email"
              value={values.email || ''}
              error={touched.email && errors.email && true}
              label={touched.email && errors.email ? errors.email : 'Email'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.gender && errors.gender && true}>
              <InputLabel id="select-label-gender-update">Select gender</InputLabel>
              <Select
                labelId="select-label-gender-update"
                id="select-gender-update"
                label={touched.gender && errors.gender ? errors.gender : 'Select gender'}
                name="gender"
                value={values.gender || ''}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="designation"
              value={values.designation || ''}
              error={touched.designation && errors.designation && true}
              label={touched.designation && errors.designation ? errors.designation : 'Designation'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="salary"
              type="number"
              value={values.salary || ''}
              error={touched.salary && errors.salary && true}
              label={touched.salary && errors.salary ? errors.salary : 'Salary'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="phoneNumber"
              value={values.phoneNumber || ''}
              error={touched.phoneNumber && errors.phoneNumber && true}
              label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone number'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="alternatePhoneNumber"
              value={values.alternatePhoneNumber || ''}
              error={touched.alternatePhoneNumber && errors.alternatePhoneNumber && true}
              label={
                touched.alternatePhoneNumber && errors.alternatePhoneNumber
                  ? errors.alternatePhoneNumber
                  : 'Alternate phone number'
              }
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DesktopDatePicker
                label="Select DOB"
                inputFormat="MM/DD/YYYY"
                name="dob"
                value={values.dob || null}
                onChange={(value) => {
                  setFieldValue('dob', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth error={touched.dob && errors.dob && true} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <TimePicker
                label="Login Time"
                name="shiftStartTime"
                value={values.shiftStartTime || null}
                onChange={(value) => {
                  setFieldValue('shiftStartTime', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth error={touched.shiftStartTime && errors.shiftStartTime && true} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <TimePicker
                label="Logout Time"
                name="shiftEndTime"
                value={values.shiftEndTime || null}
                onChange={(value) => {
                  setFieldValue('shiftEndTime', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth error={touched.shiftEndTime && errors.shiftEndTime && true} />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.status && errors.status && true}>
              <InputLabel id="select-label-status-update">Select status</InputLabel>
              <Select
                labelId="select-label-status-update"
                id="select-status-update"
                label={touched.status && errors.status ? errors.status : 'Select status'}
                name="status"
                value={values.status || ''}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="deactive">Deactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <LoadingButton size="large" type="submit" variant="contained">
              Save
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default UpdateEmployee;

