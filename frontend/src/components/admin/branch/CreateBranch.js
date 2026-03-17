import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createBranch, getNextBranchId } from '../../../apis/admin/branch';
import { createFile } from '../../../apis/admin/fileupload';
import { useEffect } from 'react';
import global from '../../../utils/global';

function CreateBranch(props) {
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
    gstNumber: Yup.string().required('GST Number is required'),
    address: Yup.string().required('address is required'),
    area: Yup.string().required('Area is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]+$/, 'Must be only digits')
      .length(6),
    landmark: Yup.string().required('Landmark is required'),
    longitude: Yup.string().required('Longitude is required'),
    latitude: Yup.string().required('Latitude is required'),
    isHeadOffice: Yup.string().required('Is Head Office is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, setFieldValue, resetForm } =
    useFormik({
      initialValues: {
        branchId: '',
        branchName: '',
        gstNumber: '',
        address: '',
        area: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        longitude: '',
        latitude: '',
        isHeadOffice: '',
        image: {},
      },
      validationSchema: schema,
      onSubmit: (values) => {
        const payload = {
          branchId: values.branchId,
          branchName: values.branchName,
          gstNumber: values.gstNumber,
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
          isHeadOffice: values.isHeadOffice,
          status: 'active',
        };
        createBranch(payload).then((data) => {
          if (data.status === false) {
            props.setNotify({
              open: true,
              message: 'Branch not created',
              severity: 'error',
            });
          } else {
            if (values.image instanceof File) {
              const formData = new FormData();
              formData.append('uploadId', data.data.fileUpload.uploadId);
              formData.append('uploadName', data.data.fileUpload.uploadName);
              formData.append('uploadType', 'image');
              formData.append('uploadedFile', values.image);
              createFile(formData);
            }
            props.setToggleContainer(false);
            form.current.reset();
            resetForm();
            props.setNotify({
              open: true,
              message: 'Branch Created Successfully!',
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
              name="image"
              type={'file'}
              fullWidth
              onBlur={handleBlur}
              onChange={(e) => {
                setValues({ ...values, image: e.target.files[0] });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="gstNumber"
              error={touched.gstNumber && errors.gstNumber && true}
              label={touched.gstNumber && errors.gstNumber ? errors.gstNumber : 'GST Number'}
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
          <Grid item xs={12} md={4}>
            <FormControl fullWidth error={touched.state && errors.state && true}>
              <InputLabel id="select-label">Select state</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.state && errors.state ? errors.state : 'Select state'}
                name="state"
                value={values.state}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                {global.states.map((state) => (
                  <MenuItem value={state}>{state}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth error={touched.city && errors.city && true}>
              <InputLabel id="select-label">Select city</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.city && errors.city ? errors.city : 'Select city'}
                name="city"
                value={values.city}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                {global.cities[values.state]?.split('|')?.map((city) => (
                  <MenuItem value={city}>{city}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <FormControl fullWidth error={touched.isHeadOffice && errors.isHeadOffice && true}>
              <InputLabel id="select-label">Is Head Office</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.isHeadOffice && errors.isHeadOffice ? errors.isHeadOffice : 'Select Head Office'}
                name="isHeadOffice"
                value={values.isHeadOffice}
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue('isHeadOffice', e.target.value, true);
                }}
              >
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
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
