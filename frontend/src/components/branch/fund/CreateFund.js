import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { createFund } from '../../../apis/branch/fund';
import { getBranch, getBranchByBranchId } from '../../../apis/branch/branch';

function CreateFund(props) {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [branches, setBranches] = useState([]);
  const [headOffice, setHeadOffice] = useState(null);
  const [isReadOnly, setReadOnly] = useState(false);
  const form = useRef();

  useEffect(() => {
    getBranch().then((data) => {
      setBranches(data.data);
      data.data.forEach((e) => {
        if (e.isHeadOffice === 'yes') {
          setHeadOffice(e);
        }
      });
    });
    setBranch(auth.user.branch);
  }, [auth]);

  // Form validation
  const schema = Yup.object({
    type: Yup.string().required('Type is required'),
    amount: Yup.string().required('Amount is required'),
    note: Yup.string().required('Note is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setFieldValue, resetForm } = useFormik({
    initialValues: {
      type: '',
      amount: '',
      from: '',
      to: '',
      note: '',
      status: 'pending',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      createFund(values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Fund not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          form.current.reset();
          resetForm();
          props.setNotify({
            open: true,
            message: 'Fund created',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    if (values.type === 'fund_request') {
      setReadOnly(true);
    } else {
      setReadOnly(false);
    }
  }, [values.type]);

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
                  if (e.target.value === 'fund_request') {
                    setFieldValue('from', headOffice?._id);
                    setFieldValue('to', branch?._id);
                  } else {
                    setFieldValue('from', branch?._id);
                    setFieldValue('to', '');
                  }
                  handleChange(e);
                }}
              >
                <MenuItem value="fund_request">Fund Request</MenuItem>
                <MenuItem value="fund_transfer">Fund Transfer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.from && errors.from && true}>
              <InputLabel id="select-label">Select from</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.from && errors.from ? errors.from : 'Select from'}
                name="from"
                value={values.from}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled
              >
                {branches.map((e) => (
                  <MenuItem value={e._id}>
                    {e.branchId} {e.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.to && errors.to && true}>
              <InputLabel id="select-label">Select to</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.to && errors.to ? errors.to : 'Select to'}
                name="to"
                value={values.to}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled={isReadOnly}
              >
                {branches.map((e) => (
                  <MenuItem value={e._id}>
                    {e.branchId} {e.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="amount"
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

export default CreateFund;
