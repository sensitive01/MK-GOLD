import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createBranch, getNextBranchId } from '../../../apis/hr/branch';
import { useEffect } from 'react';

function CreateBranch(props) {
  const [status, setStatus] = useState('');
  const form = useRef();

  useEffect(() => {
    getNextBranchId().then((data) => {
      if (data.status) {
        setFieldValue('branchId', data.data);
      }
    });
  }, []);

  // Form validation
  const schema = Yup.object({
    branchId: Yup.string().required('Branch id is required'),
    branchName: Yup.string().required('Branch name is required'),
    address: Yup.string().required('address is required'),
    area: Yup.string().required('Area is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(6),
    landmark: Yup.string().required('Landmark is required'),
    longitude: Yup.string().required('Longitude is required'),
    latitude: Yup.string().required('Latitude is required'),
    status: Yup.string().required('Status is required'),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      branchId: '',
      branchName: '',
      address: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      longitude: '',
      latitude: '',
      status: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = {
        branchId: values.branchId,
        branchName: values.branchName,
        address: {
          address: values.address,
          area: values.area,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          landmark: values.landmark,
          longitude: values.longitude,
          latitude: values.latitude,
        },
        status: values.status,
      };
      createBranch(payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Branch not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          form.current.reset();
          setStatus('');
          resetForm();
          props.setNotify({
            open: true,
            message: 'Branch created',
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
              name="branchId"
              error={touched.branchId && errors.branchId && true}
              label={touched.branchId && errors.branchId ? errors.branchId : 'Branch Id'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.branchId}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="branchName"
              error={touched.branchName && errors.branchName && true}
              label={touched.branchName && errors.branchName ? errors.branchName : 'Branch Name'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="address"
              error={touched.address && errors.address && true}
              label={touched.address && errors.address ? errors.address : 'Address'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="area"
              error={touched.area && errors.area && true}
              label={touched.area && errors.area ? errors.area : 'Area'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="city"
              error={touched.city && errors.city && true}
              label={touched.city && errors.city ? errors.city : 'City'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="state"
              error={touched.state && errors.state && true}
              label={touched.state && errors.state ? errors.state : 'State'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="pincode"
              error={touched.pincode && errors.pincode && true}
              label={touched.pincode && errors.pincode ? errors.pincode : 'Pincode'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="landmark"
              error={touched.landmark && errors.landmark && true}
              label={touched.landmark && errors.landmark ? errors.landmark : 'Landmark'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="longitude"
              error={touched.longitude && errors.longitude && true}
              label={touched.longitude && errors.longitude ? errors.longitude : 'Longitude'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="latitude"
              error={touched.latitude && errors.latitude && true}
              label={touched.latitude && errors.latitude ? errors.latitude : 'Latitude'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.status && errors.status && true}>
              <InputLabel id="select-label">Select status</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.status && errors.status ? errors.status : 'Select status'}
                name="status"
                value={status}
                onBlur={handleBlur}
                onChange={(e) => {
                  setStatus(e.target.value);
                  handleChange(e);
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

export default CreateBranch;

