import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { createExpense } from '../../../apis/accounts/expense';
import { getBranch } from '../../../apis/accounts/branch';

function CreateExpense(props) {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    getBranch().then((res) => {
      if (res?.data) {
        setBranches(res.data);
      }
    });
  }, []);

  // Form validation
  const schema = Yup.object({
    type: Yup.string().required('Type is required'),
    amount: Yup.number().typeError('Amount must be a number').required('Amount is required'),
    branchId: Yup.string().required('Branch id is required'),
    note: Yup.string().required('Note is required'),
    status: Yup.string().required('Status is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors } = useFormik({
    initialValues: {
      type: '',
      amount: '',
      from: '',
      branchId: '',
      note: '',
      status: '',
    },
    validationSchema: schema,
    onSubmit: (formValues) => {
      const payload = { ...formValues, branch: formValues.branchId };
      delete payload.branchId;
      createExpense(payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Expense not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: 'Expense created',
            severity: 'success',
          });
        }
      });
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
          <Grid item xs={12} sm={4}>
            <TextField
              name="type"
              value={values.type}
              error={touched.type && errors.type && true}
              label={touched.type && errors.type ? errors.type : 'Type'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="amount"
              type="number"
              value={values.amount}
              error={touched.amount && errors.amount && true}
              label={touched.amount && errors.amount ? errors.amount : 'Amount'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.branchId && errors.branchId && true}>
              <InputLabel id="branchId-label">{touched.branchId && errors.branchId ? errors.branchId : 'Choose branch'}</InputLabel>
              <Select
                labelId="branchId-label"
                id="branchId-select"
                label={touched.branchId && errors.branchId ? errors.branchId : 'Choose branch'}
                name="branchId"
                value={values.branchId}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch._id} value={branch._id}>
                    {branch.branchName} - {branch.branchId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="note"
              value={values.note}
              error={touched.note && errors.note && true}
              label={touched.note && errors.note ? errors.note : 'Note'}
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
                value={values.status}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
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

CreateExpense.propTypes = {
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default CreateExpense;
