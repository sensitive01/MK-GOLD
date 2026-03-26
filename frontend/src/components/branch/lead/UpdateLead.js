import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Grid,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { getLeadById, updateLead } from '../../../apis/branch/lead';
import { createFile } from '../../../apis/branch/fileupload';
import global from '../../../utils/global';

function UpdateLead(props) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState('');

  const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    mobile: Yup.string().required('Mobile is required').matches(/^[0-9]{10}$/, 'Must be 10 digits'),
    category: Yup.string().required('Category is required'),
    weight: Yup.number().required('Weight is required').min(0),
    unit: Yup.string().required('Unit is required'),
    type: Yup.string().required('Type is required'),
  });

  const formik = useFormik({
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
      updateLead(props.id, values).then(async (data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: data.message || 'Lead not updated',
            severity: 'error',
          });
        } else {
          if (file) {
            try {
              const formData = new FormData();
              formData.append('uploadId', props.id);
              formData.append('uploadName', 'lead');
              formData.append('uploadType', 'lead');
              formData.append('uploadedFile', file);
              await createFile(formData);
            } catch (error) {
              console.error('File upload failed:', error);
            }
          }
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: 'Lead updated successfully!',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    if (props.id) {
      getLeadById(props.id).then((data) => {
        if (data.status) {
          formik.setValues({
            name: data.data.name || '',
            mobile: data.data.mobile || '',
            address: data.data.address || '',
            pincode: data.data.pincode || '',
            city: data.data.city || '',
            state: data.data.state || '',
            category: data.data.category || 'gold',
            weight: data.data.weight || '',
            unit: data.data.unit || 'gm',
            type: data.data.type || 'physical',
            releaseAmount: data.data.releaseAmount || 0,
            pledgedAmount: data.data.pledgedAmount || 0,
          });
          if (data.data.lead?.uploadedFile) {
            setCurrentImage(
              data.data.lead.uploadedFile.startsWith('http')
                ? data.data.lead.uploadedFile
                : `${global.baseURL}/${data.data.lead.uploadedFile}`
            );
          }
        }
        setLoading(false);
      });
    }
  }, [props.id]);

  if (loading) return <div>Loading...</div>;

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form onSubmit={formik.handleSubmit} autoComplete="off">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formik.values.name}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mobile"
              name="mobile"
              value={formik.values.mobile}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
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
              value={formik.values.address}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Pincode"
              name="pincode"
              value={formik.values.pincode}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                label="State"
                name="state"
                value={formik.values.state}
                onChange={(e) => {
                  formik.setValues({ ...formik.values, state: e.target.value, city: '' });
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
            <FormControl fullWidth disabled={!formik.values.state}>
              <InputLabel>City</InputLabel>
              <Select
                label="City"
                name="city"
                value={formik.values.city}
                onChange={formik.handleChange}
              >
                {formik.values.state &&
                  global.cities[formik.values.state]?.split('|')?.map((c) => (
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
              <Select label="Category" name="category" value={formik.values.category} onChange={formik.handleChange}>
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
              value={formik.values.weight}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              error={formik.touched.weight && Boolean(formik.errors.weight)}
              helperText={formik.touched.weight && formik.errors.weight}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select label="Unit" name="unit" value={formik.values.unit} onChange={formik.handleChange}>
                <MenuItem value="gm">gm</MenuItem>
                <MenuItem value="kg">kg</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" name="type" value={formik.values.type} onChange={formik.handleChange}>
                <MenuItem value="physical">Physical</MenuItem>
                <MenuItem value="pledged">Pledged</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formik.values.type === 'pledged' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Release Amount"
                  name="releaseAmount"
                  value={formik.values.releaseAmount}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Pledged Amount"
                  name="pledgedAmount"
                  value={formik.values.pledgedAmount}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                {currentImage && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Attachment
                    </Typography>
                    <img
                      src={currentImage}
                      alt="current attachment"
                      style={{ width: '200px', borderRadius: '8px', border: '1px solid #ccc' }}
                    />
                  </Box>
                )}
                <Typography variant="subtitle2" gutterBottom>
                  Updated Attachment (Leave blank to keep current)
                </Typography>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <LoadingButton size="large" type="submit" variant="contained" sx={{ px: 8 }}>
              Update Lead
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default UpdateLead;

