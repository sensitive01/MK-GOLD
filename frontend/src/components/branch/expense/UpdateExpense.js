import { TextField, Card, Grid, Typography, Button, Stack, IconButton } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getExpenseById, updateExpense } from '../../../apis/branch/expense';
import { createFile, deleteFileById } from '../../../apis/branch/fileupload';
import Iconify from '../../../components/iconify';

function UpdateExpense(props) {
  const form = useRef();
  const [attachments, setAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form validation
  const schema = Yup.object({
    type: Yup.string().required('Type is required'),
    amount: Yup.string().required('Amount is required'),
    note: Yup.string().required('Note is required'),
  });

  const initialValues = {
    type: '',
    amount: '',
    from: '',
    note: '',
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: { ...initialValues },
    validationSchema: schema,
    onSubmit: (values) => {
      setLoading(true);
      updateExpense(props.id, values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Expense not updated',
            severity: 'error',
          });
          setLoading(false);
        } else {
          // Upload New Attachments if any
          if (newAttachments && newAttachments.length > 0) {
            const uploadPromises = newAttachments.map((file) => {
              const formData = new FormData();
              formData.append('uploadId', props.id);
              formData.append('uploadName', 'expense');
              formData.append('uploadType', 'attachment');
              formData.append('uploadedFile', file);
              return createFile(formData);
            });

            Promise.all(uploadPromises).then(() => {
              finishSubmit();
            }).catch(() => {
              props.setNotify({
                open: true,
                message: 'Expense updated, but some new attachments failed to upload',
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
    setNewAttachments([]);
    props.setNotify({
      open: true,
      message: 'Expense updated',
      severity: 'success',
    });
  };

  useEffect(() => {
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getExpenseById(props.id).then((data) => {
        setValues(data.data ?? {});
        setAttachments(data.data?.attachments || []);
      });
    }
  }, [props.id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewAttachments((prev) => [...prev, ...files]);
  };

  const removeNewAttachment = (index) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteExistingAttachment = (id) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      deleteFileById(id).then(() => {
        setAttachments((prev) => prev.filter((item) => item._id !== id));
        props.setNotify({
          open: true,
          message: 'Attachment deleted',
          severity: 'success',
        });
      });
    }
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
              Existing Attachments
            </Typography>
            {attachments.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" spacing={1}>
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
                    <IconButton
                      size="small"
                      color="primary"
                      component="a"
                      href={file.uploadedFile}
                      target="_blank"
                      sx={{ mr: 1 }}
                    >
                      <Iconify icon="mdi:file-eye" />
                    </IconButton>
                    <Typography variant="caption" noWrap sx={{ maxWidth: 150, mr: 1 }}>
                      Attachment {index + 1}
                    </Typography>
                    <IconButton size="small" onClick={() => deleteExistingAttachment(file._id)} color="error">
                      <Iconify icon="mdi:trash-can" />
                    </IconButton>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No existing attachments
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Add New Attachments
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <input
                type="file"
                multiple
                id="expense-new-attachments"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <label htmlFor="expense-new-attachments">
                <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:paperclip" />}>
                  Choose Files
                </Button>
              </label>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {newAttachments.length} file(s) selected
              </Typography>
            </Stack>

            {newAttachments.length > 0 && (
              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 2 }}>
                {newAttachments.map((file, index) => (
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
                    <IconButton size="small" onClick={() => removeNewAttachment(index)} color="error">
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

export default UpdateExpense;
