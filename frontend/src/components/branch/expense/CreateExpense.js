import { TextField, Card, Grid, Typography, Button, Stack, IconButton } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';
import { createExpense } from '../../../apis/branch/expense';
import { getBranchByBranchId } from '../../../apis/branch/branch';
import { createFile } from '../../../apis/branch/fileupload';
import Iconify from '../../../components/iconify';

function CreateExpense(props) {
  const auth = useSelector((state) => state.auth);
  const form = useRef();
  const [branch, setBranch] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBranch(auth.user.branch);
  }, []);

  // Form validation
  const schema = Yup.object({
    type: Yup.string().required('Type is required'),
    amount: Yup.string().required('Amount is required'),
    note: Yup.string().required('Note is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: {
      type: '',
      amount: '',
      branch: '',
      note: '',
      status: 'pending',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setLoading(true);
      values.branch = branch?._id;
      createExpense(values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Expense not created',
            severity: 'error',
          });
          setLoading(false);
        } else {
          // Upload Attachments if any
          if (attachments && attachments.length > 0) {
            const uploadId = data.data?.fileUpload?.uploadId || data.data?.data?._id || data.data?._id || data._id;
            const uploadPromises = attachments.map((file) => {
              const formData = new FormData();
              formData.append('uploadId', uploadId);
              formData.append('uploadName', 'expense');
              formData.append('uploadType', 'attachment');
              formData.append('uploadedFile', file);
              return createFile(formData).then(res => {
                if (!res.status) {
                  console.error(`Upload failed for ${file.name}:`, res.message);
                  throw new Error(res.message);
                }
                return res;
              });
            });

            Promise.all(uploadPromises).then(() => {
              finishSubmit();
            }).catch(() => {
              props.setNotify({
                open: true,
                message: 'Expense created, but some attachments failed to upload',
                severity: 'warning',
              });
              finishSubmit();
            });
          } else {
            finishSubmit();
          }
        }
      });
    },
  });

  const finishSubmit = () => {
    setLoading(false);
    props.setToggleContainer(false);
    form.current.reset();
    resetForm();
    setAttachments([]);
    props.setNotify({
      open: true,
      message: 'Expense created',
      severity: 'success',
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Attachments
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <input
                type="file"
                multiple
                id="expense-attachments"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <label htmlFor="expense-attachments">
                <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:paperclip" />}>
                  Choose Files
                </Button>
              </label>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {attachments.length} file(s) selected
              </Typography>
            </Stack>

            {attachments.length > 0 && (
              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
                {attachments.map((file, index) => (
                  <Card
                    key={index}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: 'background.neutral',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="caption" noWrap sx={{ maxWidth: 150, mr: 1 }}>
                      {file.name}
                    </Typography>
                    <IconButton size="small" onClick={() => removeAttachment(index)} color="error">
                      <Iconify icon="mdi:close-circle" />
                    </IconButton>
                  </Card>
                ))}
              </Stack>
            )}
          </Grid>

          <Grid item xs={12}>
            <LoadingButton size="large" type="submit" variant="contained" loading={loading}>
              Save
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default CreateExpense;
