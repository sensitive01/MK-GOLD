import { TextField, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createDesignation } from '../../../apis/admin/designation';

function CreateDesignation(props) {
  const form = useRef();

  // Form validation
  const schema = Yup.object({
    name: Yup.string().required('Designation name is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, resetForm } =
    useFormik({
      initialValues: {
        name: '',
      },
      validationSchema: schema,
      onSubmit: (values) => {
        const payload = {
          name: values.name,
          status: 'active',
        };
        createDesignation(payload).then((data) => {
          if (data.status === false) {
            props.setNotify({
              open: true,
              message: data.message || 'Designation not created',
              severity: 'error',
            });
          } else {
            props.setToggleContainer(false);
            resetForm();
            props.setNotify({
              open: true,
              message: 'Designation Created Successfully!',
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

export default CreateDesignation;
