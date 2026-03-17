import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getFundById, updateFund } from '../../../apis/admin/fund';
import { getBranch } from '../../../apis/admin/branch';

function UpdateFund(props) {
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
  }, []);

  // Form validation
  const schema = Yup.object({
    type: Yup.string().required('Type is required'),
    amount: Yup.string().required('Amount is required'),
    note: Yup.string().required('Note is required'),
    status: Yup.string().required('Status is required'),
  });

  const initialValues = {
    type: '',
    amount: '',
    from: '',
    to: '',
    note: '',
    status: 'pending'
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setFieldValue, setValues, resetForm } =
    useFormik({
      initialValues: { ...initialValues },
      validationSchema: schema,
      onSubmit: (values) => {
        updateFund(props.id, values).then((data) => {
          if (data.status === false) {
            props.setNotify({
              open: true,
              message: 'Fund not updated',
              severity: 'error',
            });
          } else {
            props.setToggleContainer(false);
            form.current.reset();
            resetForm();
            props.setNotify({
              open: true,
              message: 'Fund updated',
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
      getFundById(props.id).then((data) => {
        const payload = {
          ...data.data,
          from: data.data.from?._id,
          to: data.data.to?._id,
        };
        setValues(payload ?? {});
      });
    }
  }, [props.id]);

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
                    setFieldValue('from', headOffice._id);
                  } else {
                    setFieldValue('from', '');
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

export default UpdateFund;
