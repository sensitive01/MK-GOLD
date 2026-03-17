import {
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  Paper,
  TextField,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState, useRef } from 'react';
import { sentenceCase } from 'change-case';
import moment from 'moment';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Scrollbar from '../../scrollbar';
import { getSupportById } from '../../../apis/admin/support';
import { getSupportReplyBySupportId, createSupportReply } from '../../../apis/admin/support-reply';
import { createFile } from '../../../apis/admin/fileupload';
import global from '../../../utils/global';

export default function SupportReply({ id, setNotify }) {
  const form = useRef();
  const [data, setData] = useState([]);
  const [support, setSupport] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);

  // Form validation
  const schema = Yup.object({
    description: Yup.string(),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, touched, errors, resetForm } = useFormik({
    initialValues: {
      from: 'admin',
      description: '',
      attachment: {},
    },
    validationSchema: schema,
    onSubmit: (values) => {
      values.support = support._id;
      createSupportReply(values).then((data) => {
        if (data.status === false) {
          setNotify({
            open: true,
            message: 'Reply not sent',
            severity: 'error',
          });
        } else {
          setNotify({
            open: true,
            message: 'Reply sent successfully',
            severity: 'success',
          });
          if (values.attachment) {
            const formData = new FormData();
            formData.append('uploadId', data.data.fileUpload.uploadId);
            formData.append('uploadName', data.data.fileUpload.uploadName);
            formData.append('uploadType', 'attachment');
            formData.append('uploadedFile', values.attachment);
            createFile(formData);
          }
          getSupportReplyBySupportId(id).then((data) => {
            setData(data.data);
          });
          resetForm();
          form.current.reset();
        }
        setOpenBackdrop(false);
      });
    },
  });

  useEffect(() => {
    getSupportById(id).then((data) => {
      setSupport(data.data);
      setOpenBackdrop(false);
    });
    getSupportReplyBySupportId(id).then((data) => {
      setData(data.data);
    });
  }, [id]);

  function Reply() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.length) : 0;
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setPage(0);
      setRowsPerPage(parseInt(event.target.value, 10));
    };

    return (
      <Scrollbar>
        <TableContainer sx={{ minWidth: 800, mb: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">From</TableCell>
                <TableCell align="left">Description</TableCell>
                <TableCell align="left">Attachment</TableCell>
                <TableCell align="left">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={e._id} tabIndex={-1}>
                  <TableCell align="left">{sentenceCase(e.from ?? '')}</TableCell>
                  <TableCell align="left">{sentenceCase(e.description ?? '')}</TableCell>
                  <TableCell align="left">
                    {e?.attachments[0]?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                      <img
                        key={index}
                        src={`${global.baseURL}/${e?.attachments[0]?.uploadedFile}`}
                        alt="document"
                        style={{ width: '80px' }}
                      />
                    ) : (
                      e?.attachments[0]?.uploadedFile && (
                        <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                      )
                    )}
                  </TableCell>
                  <TableCell align="left">{moment(e.createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={3} />
                </TableRow>
              )}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={3} sx={{ py: 3 }}>
                    <Paper
                      sx={{
                        textAlign: 'center',
                      }}
                    >
                      <Typography paragraph>No data in table</Typography>
                    </Paper>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  return (
    <>
      <Card sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
          Support
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
              Support:
            </Typography>
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow tabIndex={-1}>
                    <TableCell align="left">Customer Name: {sentenceCase(support?.customer?.name ?? '')}</TableCell>
                    <TableCell align="left">Issue: {support?.issue}</TableCell>
                    <TableCell align="left">Description: {support?.description}</TableCell>
                    <TableCell align="left">Status: {support?.status}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
              Support Reply:
            </Typography>
            <Reply />
          </Grid>
        </Grid>

        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          autoComplete="off"
        >
          <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 2 }}>
            Reply:
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                name="description"
                value={values.description}
                error={touched.description && errors.description && true}
                label={touched.description && errors.description ? errors.description : 'Description'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <span>Attachment: </span>
              <TextField
                name="attachment"
                type={'file'}
                onBlur={handleBlur}
                onChange={(e) => {
                  setValues({ ...values, attachment: e.target.files[0] });
                }}
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <LoadingButton size="large" type="submit" variant="contained">
                Reply
              </LoadingButton>
            </Grid>
          </Grid>
        </form>
      </Card>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
