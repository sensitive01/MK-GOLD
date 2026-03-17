import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LoadingButton } from '@mui/lab';
import { useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { createEmployee, getNextEmployeeId } from '../../../apis/admin/employee';
import { useEffect } from 'react';

function CreateEmployee(props) {
  const form = useRef();

  useEffect(() => {
    getNextEmployeeId().then((data) => {
      if (data.status) {
        setFieldValue('employeeId', data.data);
      }
    });
  }, []);

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
      .length(10),
    alternatePhoneNumber: Yup.string()
      .matches(/^[0-9]+$/, 'Must be only digits')
      .length(10),
    dob: Yup.string().required('DOB is required'),
    shiftStartTime: Yup.string().required('Login Time is required'),
    shiftEndTime: Yup.string().required('Logout Time is required'),
    status: Yup.string().required('Status is required'),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      name: '',
      gender: '',
      email: '',
      designation: '',
      salary: '',
      employeeId: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      dob: moment()?.format("YYYY-MM-DD"),
      shiftStartTime: moment()?.format("YYYY-MM-DD"),
      shiftEndTime: moment()?.format("YYYY-MM-DD"),
      status: 'active',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      createEmployee(values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Employee not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          form.current.reset();
          resetForm();
          props.setNotify({
            open: true,
            message: 'Employee created',
            severity: 'success',
          });
        }
      });
    },
  });

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form
        ref={form}
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
              error={touched.employeeId && errors.employeeId && true}
              label={touched.employeeId && errors.employeeId ? errors.employeeId : 'Employee Id'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.employeeId}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="name"
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
              error={touched.email && errors.email && true}
              label={touched.email && errors.email ? errors.email : 'Email'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.gender && errors.gender && true}>
              <InputLabel id="select-label">Select gender</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.gender && errors.gender ? errors.gender : 'Select gender'}
                name="gender"
                value={values.gender}
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue('gender', e.target.value, true);
                }}
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
              number="number"
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
            <LocalizationProvider dateAdapter={AdapterMoment} error={touched.dob && errors.dob && true}>
              <DesktopDatePicker
                label={touched.dob && errors.dob ? errors.dob : 'Select DOB'}
                inputFormat="MM/DD/YYYY"
                name="dob"
                value={values.dob}
                onChange={(value) => {
                  setFieldValue('dob', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider
              dateAdapter={AdapterMoment}
              error={touched.shiftStartTime && errors.shiftStartTime && true}
            >
              <TimePicker
                label="Login Time"
                name="shiftStartTime"
                value={values.shiftStartTime}
                onChange={(value) => {
                  setFieldValue('shiftStartTime', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider
              dateAdapter={AdapterMoment}
              error={touched.shiftEndTime && errors.shiftEndTime && true}
            >
              <TimePicker
                label="Logout Time"
                name="shiftEndTime"
                value={values.shiftEndTime}
                onChange={(value) => {
                  setFieldValue('shiftEndTime', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.status && errors.status && true}>
              <InputLabel id="select-label">Select status</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.status && errors.status ? errors.status : 'Select status'}
                name="status"
                value={values.status}
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue('status', e.target.value, true);
                }}
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

export default CreateEmployee;
