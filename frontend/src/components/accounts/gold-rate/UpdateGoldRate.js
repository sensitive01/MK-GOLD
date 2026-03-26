import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import confetti from 'canvas-confetti';
import { getGoldRateById, updateGoldRate } from '../../../apis/accounts/gold-rate';
import { getState } from '../../../apis/accounts/branch';

const initialValues = {
  rate: '',
  type: '',
  state: '',
};

function UpdateGoldRate(props) {
  const [data, setData] = useState([]);

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

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: { ...initialValues },
    validationSchema: schema,
    onSubmit: (values) => {
      updateGoldRate(props.id, values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Gold rate not updated',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: 'Gold rate updated',
            severity: 'success',
          });
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8A1B9F', '#FFD700', '#ffffff']
          });
        }
      });
    },
  });

  useEffect(() => {
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getGoldRateById(props.id).then((data) => {
        setValues(data.data);
      });
    }
  }, [props.id, resetForm, setValues]);

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
              name="rate"
              type="number"
              value={values.rate}
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
                name="type"
                value={values.type}
                label={touched.type && errors.type ? errors.type : 'Select type'}
                onBlur={handleBlur}
                onChange={handleChange}
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
                  <MenuItem key={e} value={e}>
                    {e}
                  </MenuItem>
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

UpdateGoldRate.propTypes = {
  id: PropTypes.string,
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default UpdateGoldRate;

