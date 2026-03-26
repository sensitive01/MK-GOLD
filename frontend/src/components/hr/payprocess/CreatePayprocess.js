import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createPayprocess } from '../../../apis/hr/payprocess';
import { getEmployee } from '../../../apis/hr/employee';

function CreatePayprocess(props) {
  const auth = useSelector((state) => state.auth);
  const [employees, setEmloyees] = useState([]);
  const form = useRef();

  useEffect(() => {
    getEmployee().then((data) => {
      if (data?.data) {
        setEmloyees(data.data);
      }
    });
  }, []);

  // Form validation
  const schema = Yup.object({
    employee: Yup.string().required('Employee is required'),
    type: Yup.string().required('Type is required'),
    amount: Yup.string().required('Amount is required'),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue, resetForm } = useFormik({
    initialValues: {
      employee: '',
      type: '',
      amount: '',
      note: '',
      loggedUsername: auth?.user?.employee?.name || auth?.user?.name || auth?.user?.username || '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = {
        ...values,
        loggedUsername: values.loggedUsername || auth?.user?.employee?.name || auth?.user?.name || auth?.user?.username || '',
      };
      createPayprocess(payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Payprocess not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          form.current.reset();
          resetForm();
          props.setNotify({
            open: true,
            message: 'Payprocess created',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    if (!values.loggedUsername) {
      const name = auth?.user?.employee?.name || auth?.user?.name || auth?.user?.username;
      if (name) {
        setFieldValue('loggedUsername', name);
      }
    }
  }, [auth, setFieldValue, values.loggedUsername]);

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
                  setFieldValue('employee', e.target.value);
                }}
              >
                {employees?.map((e) => (
                  <MenuItem value={e._id} key={e._id}>
                    {e.employeeId} {e.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.type && errors.type && true}>
              <InputLabel id="select-label">Select type</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.type && errors.type ? errors.type : 'Select type'}
                name="type"
                value={values.type}
                onBlur={handleBlur}
                onChange={(e) => {
                  setFieldValue('type', e.target.value);
                }}
              >
                <MenuItem value="allowances">Allowances</MenuItem>
                <MenuItem value="deductions">Deductions</MenuItem>
                <MenuItem value="advance">Advance</MenuItem>
              </Select>
            </FormControl>
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

export default CreatePayprocess;

