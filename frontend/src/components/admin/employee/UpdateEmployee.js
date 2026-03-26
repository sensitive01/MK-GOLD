import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid, Checkbox, ListItemText, Typography, Button, IconButton, Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { getEmployeeById, updateEmployee } from '../../../apis/admin/employee';
import { getDesignation } from '../../../apis/admin/designation';
import { createFile } from '../../../apis/admin/fileupload';
import global from '../../../utils/global';
import Iconify from '../../../components/iconify';

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
  doj: '',
  employmentType: '',
  languages: [],
  status: '',
};

function UpdateEmployee(props) {
  const [designations, setDesignations] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);
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
    doj: Yup.string().required('DOJ is required'),
    employmentType: Yup.string().required('Employment Type is required'),
    languages: Yup.array().min(1, 'Select at least one language'),
    status: Yup.string().required('Status is required'),
  });

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
            const uploadId = props.id;
            const uploadName = 'employee';

            // Upload Photo
            if (photo) {
              const photoData = new FormData();
              photoData.append('uploadId', uploadId);
              photoData.append('uploadName', uploadName);
              photoData.append('uploadType', 'photo');
              photoData.append('uploadedFile', photo);
              createFile(photoData);
            }

            // Upload Documents
            if (documents?.length > 0) {
              documents?.forEach((doc) => {
                const docData = new FormData();
                docData.append('uploadId', uploadId);
                docData.append('uploadName', uploadName);
                docData.append('uploadType', 'document');
                docData.append('uploadedFile', doc);
                createFile(docData);
              });
            }

            props.setToggleContainer(false);
            props.setNotify({
              open: true,
              message: 'Employee updated successfully!',
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
        const empData = data.data ?? {};
        setValues({
          ...initialValues,
          ...empData,
          languages: empData.languages ?? []
        });
      });
    }
    getDesignation({ status: 'active' }).then((data) => {
      if (data && data.status) {
        setDesignations(data.data || []);
      }
    });
  }, [props.id, initialValues, resetForm, setValues]);

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
              value={values.employeeId}
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
              value={values.name}
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
              value={values.email}
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
                onChange={handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.designation && errors.designation && true}>
              <InputLabel id="designation-label">Select Designation</InputLabel>
              <Select
                labelId="designation-label"
                id="designation-select"
                label={touched.designation && errors.designation ? errors.designation : 'Select Designation'}
                name="designation"
                value={values.designation}
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue('designation', e.target.value, true);
                }}
              >
                {designations && designations?.length > 0 && designations?.map((item) => (
                  <MenuItem key={item._id} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              value={values.phoneNumber}
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
              value={values.alternatePhoneNumber}
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
                onChange={handleChange}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="deactive">Deactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterMoment} error={touched.doj && errors.doj && true}>
              <DesktopDatePicker
                label={touched.doj && errors.doj ? errors.doj : 'Select DOJ'}
                inputFormat="MM/DD/YYYY"
                name="doj"
                value={values.doj}
                onChange={(value) => {
                  setFieldValue('doj', value, true);
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.employmentType && errors.employmentType && true}>
              <InputLabel id="employment-label">Employment Type</InputLabel>
              <Select
                labelId="employment-label"
                id="employment-select"
                label={touched.employmentType && errors.employmentType ? errors.employmentType : 'Employment Type'}
                name="employmentType"
                value={values.employmentType}
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue('employmentType', e.target.value, true);
                }}
              >
                {global.employmentTypes?.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.languages && errors.languages && true}>
              <InputLabel id="languages-label">Languages</InputLabel>
              <Select
                labelId="languages-label"
                id="languages-select"
                multiple
                value={values.languages}
                onChange={(e) => {
                  setFieldValue('languages', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value);
                }}
                renderValue={(selected) => (selected ? selected.join(', ') : '')}
                label="Languages"
              >
                {global.languages?.map((item) => (
                  <MenuItem key={item} value={item}>
                    <Checkbox checked={values.languages && values.languages.indexOf(item) > -1} />
                    <ListItemText primary={item} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Photo and Documents Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Uploads
            </Typography>
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Stack spacing={1}>
                <Typography variant="body2">Profile Photo</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="emp-photo-update"
                />
                <label htmlFor="emp-photo-update">
                  <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:camera" />}>
                    Upload Photo
                  </Button>
                </label>
                {photo && <Typography variant="caption">{photo.name}</Typography>}
              </Stack>

              <Stack spacing={1} sx={{ flexGrow: 1 }}>
                <Typography variant="body2">Documents (Aadhaar, PAN, etc.)</Typography>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setDocuments(Array.from(e.target.files))}
                  style={{ display: 'none' }}
                  id="emp-docs-update"
                />
                <label htmlFor="emp-docs-update">
                  <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:file-document" />}>
                    Upload Documents
                  </Button>
                </label>
                <Stack spacing={0.5}>
                  {documents?.map((doc, index) => (
                    <Typography key={index} variant="caption">
                      {doc.name}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            </Stack>
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

UpdateEmployee.propTypes = {
  id: PropTypes.string,
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default UpdateEmployee;


