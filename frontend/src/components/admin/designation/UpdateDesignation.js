import { TextField, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getDesignationById, updateDesignation } from '../../../apis/admin/designation';

function UpdateDesignation(props) {
  const form = useRef();

  useEffect(() => {
    getDesignationById(props.id).then((data) => {
      if (data && data.status && data.data) {
        setValues({
          name: data.data.name,
        });
      }
    });
  }, [props.id]);

  // Form validation
  const schema = Yup.object({
    name: Yup.string().required('Designation name is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } =
    useFormik({
      initialValues: {
        name: '',
      },
      validationSchema: schema,
      onSubmit: (values) => {
        const payload = {
          name: values.name,
        };
        updateDesignation(props.id, payload).then((data) => {
          if (data.status === false) {
            props.setNotify({
              open: true,
              message: data.message || 'Designation not updated',
              severity: 'error',
            });
          } else {
            props.setToggleContainer(false);
            resetForm();
            props.setNotify({
              open: true,
              message: 'Designation Updated Successfully!',
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
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              error={touched.name && errors.name && true}
              label={touched.name && errors.name ? errors.name : 'Designation Name'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.name}
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

export default UpdateDesignation;
