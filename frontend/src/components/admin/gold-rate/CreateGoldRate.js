import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import moment from 'moment';
import { LoadingButton } from '@mui/lab';
import { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createGoldRate } from '../../../apis/admin/gold-rate';
import { getState } from '../../../apis/admin/branch';

function CreateGoldRate(props) {
  const [data, setData] = useState([]);
  const [type, setType] = useState('');
  const form = useRef();

  useEffect(() => {
    getState().then((data) => {
      setData(data.data);
    });
  }, []);

  // Form validation
  const schema = Yup.object({
    rate: Yup.string().required('Rate is required'),
    type: Yup.string().required('Type is required'),
    state: Yup.string().required('State is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, touched, errors, resetForm } = useFormik({
    initialValues: {
      rate: '',
      type: '',
      state: '',
      date: moment()?.format("YYYY-MM-DD"),
    },
    validationSchema: schema,
    onSubmit: (values) => {
      createGoldRate({ ...values, date: Date.now() }).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Gold rate not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          form.current.reset();
          setType('');
          resetForm();
          props.setNotify({
            open: true,
            message: 'Gold Rate Created Successfully!',
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
              name="rate"
              type="number"
              error={touched.rate && errors.rate && true}
              label={touched.rate && errors.rate ? errors.rate : 'Rate'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.type && errors.type && true}>
              <InputLabel id="select-label">Select type</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.type && errors.type ? errors.type : 'Select type'}
                name="type"
                value={type}
                onBlur={handleBlur}
                onChange={(e) => {
                  setType(e.target.value);
                  handleChange(e);
                }}
              >
                <MenuItem value="gold">Gold</MenuItem>
                <MenuItem value="silver">Silver</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.state && errors.state && true}>
              <InputLabel id="select-label">Select state</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                name="state"
                value={values.state}
                label={touched.state && errors.state ? errors.state : 'Select state'}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                {data?.map((e) => (
                  <MenuItem value={e}>{e}</MenuItem>
                ))}
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

export default CreateGoldRate;

