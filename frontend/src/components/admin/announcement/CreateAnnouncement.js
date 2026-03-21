import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  Grid,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { createAnnouncement } from '../../../apis/admin/announcement';
import { getUser } from '../../../apis/admin/user';

function CreateAnnouncement(props) {
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUser({ status: 'active' }).then((data) => {
      if (data.status) {
        setUsers(data.data.filter((u) => u.userType !== 'admin'));
      }
    });
  }, []);

  const schema = Yup.object({
    title: Yup.string().required('Title is required'),
    targetUserType: Yup.array().min(1, 'Target User Type is required'),
    notificationType: Yup.string().required('Notification Type is required'),
  });

  const formik = useFormik({
    initialValues: {
      targetUser: '',
      targetUserType: [],
      notificationType: 'scroll',
      title: '',
      description: '',
      expiryDate: '',
      isActive: true,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (Array.isArray(values[key])) {
          values[key].forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, values[key]);
        }
      });
      if (file) {
        formData.append('uploadedFile', file);
      }

      const res = await createAnnouncement(formData);
      if (res.status) {
        props.setNotify({
          open: true,
          message: 'Announcement Created Successfully!',
          type: 'success',
        });
        resetForm();
        setFile(null);
        props.setToggleContainer(false);
      } else {
        props.setNotify({
          open: true,
          message: res.message,
          type: 'error',
        });
      }
      setSubmitting(false);
    },
  });

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Title"
              {...formik.getFieldProps('title')}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Target User Type</InputLabel>
              <Select
                multiple
                label="Target User Type"
                value={formik.values.targetUserType}
                name="targetUserType"
                onChange={(e) => formik.setFieldValue('targetUserType', e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Branch', value: 'branch' },
                  { label: 'Tele-Calling', value: 'telecalling' },
                  { label: 'HR', value: 'hr' },
                  { label: 'Accounts', value: 'accounts' },
                  { label: 'Master', value: 'master' },
                  { label: 'Operations', value: 'operations' },
                  { label: 'Finance', value: 'finance' },
                  { label: 'Assistant Branch Manager', value: 'assistant_branch_manager' },
                  { label: 'Branch Executive', value: 'branch_executive' },
                ].map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Checkbox checked={formik.values.targetUserType.indexOf(role.value) > -1} />
                    <ListItemText primary={role.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Target User (Optional)</InputLabel>
              <Select label="Target User (Optional)" {...formik.getFieldProps('targetUser')}>
                <MenuItem value="">None</MenuItem>
                {users
                  .filter((u) => formik.values.targetUserType.includes('all') || formik.values.targetUserType.includes(u.userType))
                  .map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.username} ({u.userType})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Notification Type</InputLabel>
              <Select label="Notification Type" {...formik.getFieldProps('notificationType')}>
                <MenuItem value="pop">Pop-up</MenuItem>
                <MenuItem value="scroll">Scroll</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              {...formik.getFieldProps('description')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Expiry Date"
              InputLabelProps={{ shrink: true }}
              {...formik.getFieldProps('expiryDate')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Switch checked={formik.values.isActive} onChange={(e) => formik.setFieldValue('isActive', e.target.checked)} />}
              label="Active Status"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Image (Icon)
            </Typography>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
          </Grid>
          <Grid item xs={12}>
            <LoadingButton fullWidth size="large" type="submit" variant="contained" loading={formik.isSubmitting}>
              Create Announcement
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default CreateAnnouncement;
