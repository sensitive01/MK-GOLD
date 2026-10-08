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
import { getBranch } from '../../../apis/branch/branch';
import { createFile } from '../../../apis/branch/fileupload';
import global from '../../../utils/global';
import moment from 'moment';
import CustomerDocumentsInput from './CustomerDocumentsInput';

function UpdateLead(props) {
  const [docEntries, setDocEntries] = useState([
    { id: 1, type: 'Aadhar card', file: null, preview: '' },
  ]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState('');
  const [branches, setBranches] = useState([]);

  const handleRemoveExistingDoc = (idx) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const schema = Yup.object({
    name: Yup.string(),
    mobile: Yup.string()
      .required('Mobile is required')
      .matches(/^[0-9+ -]{10,15}$/, 'Invalid mobile number'),
    date: Yup.date().nullable(),
    source: Yup.string().nullable(),
    city: Yup.string().max(255),
    state: Yup.string().max(255),
    category: Yup.string().max(255).required('Category is required'),
    weight: Yup.number()
      .nullable()
      .transform((val, orig) => (orig === '' || orig === null || orig === undefined ? null : val))
      .min(0, 'Weight must be greater than or equal to 0'),
    unit: Yup.string().required('Unit is required'),
    type: Yup.string().required('Type is required'),
    status: Yup.string().max(255).required('Status is required'),
    branch: Yup.string().nullable(),
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
      status: 'pending',
      date: '',
      place: '',
      remarks: '',
      source: '',
      leadSource: 'admin',
      branch: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = { ...values };
      if (!payload.branch || payload.branch === '') {
        delete payload.branch;
      }
      if (payload.weight === '' || payload.weight === null || isNaN(Number(payload.weight))) {
        delete payload.weight;
      } else {
        payload.weight = Number(payload.weight);
      }
      if (payload.releaseAmount === '' || payload.releaseAmount === null || isNaN(Number(payload.releaseAmount))) {
        payload.releaseAmount = 0;
      } else {
        payload.releaseAmount = Number(payload.releaseAmount);
      }
      if (payload.pledgedAmount === '' || payload.pledgedAmount === null || isNaN(Number(payload.pledgedAmount))) {
        payload.pledgedAmount = 0;
      } else {
        payload.pledgedAmount = Number(payload.pledgedAmount);
      }
      if (!payload.date || payload.date === '') {
        delete payload.date;
      }

      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
          formData.append(key, payload[key]);
        }
      });

      formData.append('existingDocuments', JSON.stringify(existingDocuments));

      docEntries.forEach((entry) => {
        if (entry.file) {
          formData.append('uploadedFiles', entry.file);
          formData.append('documentTypes', entry.type || 'Document');
        }
      });

      updateLead(props.id, formData)
        .then(async (data) => {
          if (!data || data.status === false) {
            props.setNotify({
              open: true,
              message: data?.message || 'Lead not updated',
              severity: 'error',
            });
          } else {
            if (props.setToggleContainer) {
              props.setToggleContainer(false);
            }
            if (props.setToggleContainerType) {
              props.setToggleContainerType('');
            }
            if (props.fetchData) {
              props.fetchData();
            }
            props.setNotify({
              open: true,
              message: 'Lead updated successfully!',
              severity: 'success',
            });
          }
        })
        .catch((err) => {
          props.setNotify({
            open: true,
            message: err?.response?.data?.message || err?.message || 'Error updating lead',
            severity: 'error',
          });
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
            status: data.data.status || 'pending',
            date: data.data.date ? moment(data.data.date).format('YYYY-MM-DD') : '',
            place: data.data.place || '',
            remarks: data.data.remarks || '',
            source: data.data.source || '',
            preferredLanguage: data.data.preferredLanguage || '',
            leadSource: data.data.leadSource || 'admin',
            branch: data.data.branch?._id || data.data.branch || '',
          });
          if (data.data.documents && Array.isArray(data.data.documents)) {
            setExistingDocuments(data.data.documents);
          }
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
    getBranch().then((res) => {
      if (res?.status) {
        setBranches(res.data || []);
      }
    });
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
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              name="date"
              value={formik.values.date}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              error={formik.touched.date && Boolean(formik.errors.date)}
              helperText={formik.touched.date && formik.errors.date}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Source"
              name="source"
              value={formik.values.source}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              error={formik.touched.source && Boolean(formik.errors.source)}
              helperText={formik.touched.source && formik.errors.source}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" name="status" value={formik.values.status} onChange={formik.handleChange} sx={{ textTransform: 'capitalize' }}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="converted">Converted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {formik.values.status === 'converted' && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={formik.touched.branch && Boolean(formik.errors.branch)}>
                <InputLabel>Branch</InputLabel>
                <Select label="Branch" name="branch" value={formik.values.branch} onChange={formik.handleChange}>
                  {branches.map((b) => (
                    <MenuItem key={b._id} value={b._id}>{b.branchName}</MenuItem>
                  ))}
                </Select>
                {formik.touched.branch && formik.errors.branch && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>{formik.errors.branch}</Typography>
                )}
              </FormControl>
            </Grid>
          )}
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
            <FormControl fullWidth>
              <InputLabel>Preferred Language</InputLabel>
              <Select
                label="Preferred Language"
                name="preferredLanguage"
                value={formik.values.preferredLanguage}
                onChange={formik.handleChange}
              >
                {global.languages?.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              label="Landmark"
              name="place"
              value={formik.values.place}
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
            </>
          )}

          <CustomerDocumentsInput
            docEntries={docEntries}
            setDocEntries={setDocEntries}
            existingDocuments={existingDocuments}
            onRemoveExistingDoc={handleRemoveExistingDoc}
          />

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Remarks"
              name="remarks"
              multiline
              rows={2}
              value={formik.values.remarks}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <LoadingButton
              size="large"
              type="submit"
              variant="contained"
              sx={{ px: 8 }}
              loading={formik.isSubmitting}
              onClick={() => {
                if (formik.errors && Object.keys(formik.errors).length > 0) {
                  const firstErrorKey = Object.keys(formik.errors)[0];
                  props.setNotify({
                    open: true,
                    message: formik.errors[firstErrorKey],
                    severity: 'warning',
                  });
                }
              }}
            >
              Update Lead
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default UpdateLead;

