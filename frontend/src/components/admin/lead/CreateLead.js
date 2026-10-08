import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { createLead } from '../../../apis/admin/lead';
import { createFile } from '../../../apis/admin/fileupload';
import global from '../../../utils/global';
import CustomerDocumentsInput from '../../branch/lead/CustomerDocumentsInput';

function CreateLead(props) {
  const [docEntries, setDocEntries] = useState([
    { id: 1, type: 'Aadhar card', file: null, preview: '' },
  ]);
  const [focusedField, setFocusedField] = useState(null);

  const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    mobile: Yup.string().required('Mobile is required').matches(/^[6-9][0-9]{9}$/, 'Invalid Indian mobile number'),
    address: Yup.string(),
    pincode: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    category: Yup.string().required('Category is required'),
    weight: Yup.number().required('Weight is required').min(0, 'Weight must be positive'),
    unit: Yup.string().required('Unit is required'),
    type: Yup.string().required('Type is required'),
    releaseAmount: Yup.number().min(0),
    pledgedAmount: Yup.number().min(0),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: {
      name: '',
      mobile: '',
      address: '',
      pincode: '',
      city: '',
      state: '',
      category: 'gold',
      weight: '',
      unit: 'gm',
      type: 'physical',
      releaseAmount: 0,
      pledgedAmount: 0,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
          formData.append(key, values[key]);
        }
      });

      docEntries.forEach((entry) => {
        if (entry.file) {
          formData.append('uploadedFiles', entry.file);
          formData.append('documentTypes', entry.type || 'Document');
        }
      });

      createLead(formData).then(async (data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: data.message || 'Lead not created',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          resetForm();
          setDocEntries([{ id: Date.now(), type: 'Aadhar card', file: null, preview: '' }]);
          props.setNotify({
            open: true,
            message: 'Lead created successfully!',
            severity: 'success',
          });
        }
      });
    },
  });

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={values.name}
              onBlur={handleBlur}
              onChange={handleChange}
              error={touched.name && Boolean(errors.name)}
              helperText={touched.name && errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mobile"
              name="mobile"
              value={focusedField === 'mobile' ? values.mobile : global.maskPhoneNumber(values.mobile)}
              onFocus={() => setFocusedField('mobile')}
              onBlur={(e) => {
                handleBlur(e);
                setFocusedField(null);
              }}
              onChange={handleChange}
              error={touched.mobile && Boolean(errors.mobile)}
              helperText={touched.mobile && errors.mobile}
              required
            />
          </Grid>
          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={2}
              value={values.address}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Pincode"
              name="pincode"
              value={values.pincode}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                label="State"
                name="state"
                value={values.state}
                onChange={(e) => {
                  setValues({ ...values, state: e.target.value, city: '' });
                }}
              >
                {global.states?.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth disabled={!values.state}>
              <InputLabel>City</InputLabel>
              <Select
                label="City"
                name="city"
                value={values.city}
                onChange={handleChange}
              >
                {values.state &&
                  global.cities[values.state]?.split('|')?.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select label="Category" name="category" value={values.category} onChange={handleChange}>
                <MenuItem value="gold">Gold</MenuItem>
                <MenuItem value="silver">Silver</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Weight"
              name="weight"
              value={values.weight}
              onBlur={handleBlur}
              onChange={handleChange}
              error={touched.weight && Boolean(errors.weight)}
              helperText={touched.weight && errors.weight}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select label="Unit" name="unit" value={values.unit} onChange={handleChange}>
                <MenuItem value="gm">gm</MenuItem>
                <MenuItem value="kg">kg</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" name="type" value={values.type} onChange={handleChange}>
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="pledged">Pledged</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {values.type === 'pledged' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Release Amount"
                  name="releaseAmount"
                  value={values.releaseAmount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Pledged Amount"
                  name="pledgedAmount"
                  value={values.pledgedAmount}
                  onChange={handleChange}
                />
              </Grid>
              </>
            )}

            <CustomerDocumentsInput
              docEntries={docEntries}
              setDocEntries={setDocEntries}
            />

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <LoadingButton size="large" type="submit" variant="contained" sx={{ px: 8 }}>
              Save Lead
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default CreateLead;

