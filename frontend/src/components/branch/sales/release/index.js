import {
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  Modal,
  Checkbox,
  Paper,
} from '@mui/material';
import { sentenceCase } from 'change-case';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import moment from 'moment';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import Iconify from '../../../iconify';
import { getReleaseByCustomerId, createRelease, deleteReleaseById } from '../../../../apis/branch/release';
import Scrollbar from '../../../scrollbar';
import Bank from '../bank';
import { createFile } from '../../../../apis/branch/fileupload';
// import { getBranchByBranchId } from '../../../../apis/branch/branch';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  maxHeight: '95%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: 'auto',
  border: 'none',
};

function Release({ setNotify, selectedUser, selectedRelease, setSelectedRelease }) {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [releaseModal, setReleaseModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [width, setWindowWidth] = useState(0);
  const modalRoot = document.getElementById('root-modal');
  // Form validation
  const schema = Yup.object({
    weight: Yup.string().required('Weight is required'),
    pledgeAmount: Yup.string().required('Pledge amount is required'),
    payableAmount: Yup.string().required('Payable amount is required'),
    paymentType: Yup.string().required('Payment type is required'),
    pledgedDate: Yup.string().required('Pledged date is required'),
    pledgeId: Yup.string().required('Pledge id is required'),
    pledgedIn: Yup.string().required('Pledged in is required'),
    pledgedBranch: Yup.string().required('Pledged branch is required'),
    releaseDate: Yup.string().required('Release date is required'),
    comments: Yup.string().required('comments is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, touched, errors } = useFormik({
    initialValues: {
      customer: selectedUser?._id,
      weight: '',
      pledgeAmount: '',
      payableAmount: '',
      paymentType: '',
      bank: selectedBank?._id,
      pledgedDate: moment()?.format("YYYY-MM-DD"),
      pledgeId: '',
      pledgedIn: '',
      pledgedBranch: '',
      releaseDate: moment()?.format("YYYY-MM-DD"),
      comments: '',
      releaseDocument: {},
      status: 'active',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (values.paymentType === 'bank' && !selectedBank) {
        setNotify({
          open: true,
          message: 'Please select bank',
          severity: 'info',
        });
        // alert('Please select bank');
        return;
      }
      const payload = {
        customer: values.customer,
        branch: branch?._id,
        weight: values.weight,
        pledgeAmount: values.pledgeAmount,
        payableAmount: values.payableAmount,
        paymentType: values.paymentType,
        bank: values.bank,
        pledgedDate: values.pledgedDate,
        pledgeId: values.pledgeId,
        pledgedIn: values.pledgedIn,
        pledgedBranch: values.pledgedBranch,
        releaseDate: values.releaseDate,
        comments: values.comments,
        status: values.status,
      };
      createRelease(payload).then((data) => {
        if (data.status === false) {
          setNotify({
            open: true,
            message: 'Release not created',
            severity: 'error',
          });
        } else {
          getReleaseByCustomerId(selectedUser._id).then((data) => {
            setData(data.data);
          });
          const formData = new FormData();
          formData.append('uploadId', data.data.fileUpload.uploadId);
          formData.append('uploadName', data.data.fileUpload.uploadName);
          formData.append('uploadType', 'proof');
          formData.append('uploadedFile', values.releaseDocument);
          createFile(formData);
          setReleaseModal(false);
          setNotify({
            open: true,
            message: 'Release created',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    setBranch(auth.user.branch);
  }, [auth]);

  const updateDimensions = () => {
    const width = window.innerWidth;
    setWindowWidth(width);
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (width < 899) {
    style.width = '80%';
  } else {
    style.width = 800;
  }

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  useEffect(() => {
    if (selectedUser) {
      getReleaseByCustomerId(selectedUser._id).then((data) => {
        setData(data.data);
      });
    }
  }, [selectedUser]);

  const handleSelect = (release) => {
    if (selectedRelease && selectedRelease.find((e) => e._id === release._id)) {
      setSelectedRelease(selectedRelease.filter((e) => e._id !== release._id));
    } else {
      setSelectedRelease([...selectedRelease, release]);
    }
  };

  const handleDelete = () => {
    deleteReleaseById(openId).then(() => {
      getReleaseByCustomerId(selectedUser._id).then((data) => {
        setData(data.data);
      });
      handleCloseDeleteModal();
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Customer Release
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setReleaseModal(true)}
          >
            New Release
          </Button>
        </Stack>
        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="left" />
                  <TableCell align="left">Pledge Id</TableCell>
                  <TableCell align="left">Pledged In</TableCell>
                  <TableCell align="left">Weight (Grams)</TableCell>
                  <TableCell align="left">Pledge amount</TableCell>
                  <TableCell align="left">Pledged date</TableCell>
                  <TableCell align="left">Payable amount</TableCell>
                  <TableCell align="left">Payment Type</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e) => (
                  <TableRow hover key={e._id} tabIndex={-1}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRelease.find((v) => v._id === e._id)}
                        onChange={() => handleSelect(e)}
                      />
                    </TableCell>
                    <TableCell align="left">{e.pledgeId}</TableCell>
                    <TableCell align="left">{sentenceCase(e.pledgedIn)}</TableCell>
                    <TableCell align="left">{e.weight}</TableCell>
                    <TableCell align="left">{e.pledgeAmount}</TableCell>
                    <TableCell align="left">{moment(e.pledgedDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell align="left">{e.payableAmount}</TableCell>
                    <TableCell align="left">{sentenceCase(e.paymentType)}</TableCell>
                    <TableCell align="left">
                      <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setOpenId(e._id);
                          handleOpenDeleteModal();
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={9} />
                  </TableRow>
                )}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={9} sx={{ py: 3 }}>
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
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Scrollbar>
      </Grid>

      <Modal
        open={releaseModal}
        onClose={() => setReleaseModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            Add Release
            <Button
              sx={{ color: '#222', float: 'right' }}
              startIcon={<CloseIcon />}
              onClick={() => setReleaseModal(false)}
            />
          </Typography>
          <form onSubmit={handleSubmit} autoComplete="off">
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  name="weight"
                  type={'number'}
                  value={values.weight}
                  error={touched.weight && errors.weight && true}
                  label={touched.weight && errors.weight ? errors.weight : 'Weight (Grams)'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="pledgeAmount"
                  type={'number'}
                  value={values.pledgeAmount}
                  error={touched.pledgeAmount && errors.pledgeAmount && true}
                  label={touched.pledgeAmount && errors.pledgeAmount ? errors.pledgeAmount : 'Pledge amount'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="payableAmount"
                  type={'number'}
                  value={values.payableAmount}
                  error={touched.payableAmount && errors.payableAmount && true}
                  label={touched.payableAmount && errors.payableAmount ? errors.payableAmount : 'Payable amount'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.paymentType && errors.paymentType && true}>
                  <InputLabel id="select-paymentType">Select payment type</InputLabel>
                  <Select
                    labelId="select-paymentType"
                    id="select"
                    label={touched.paymentType && errors.paymentType ? errors.paymentType : 'Select payment type'}
                    name="paymentType"
                    value={values.paymentType}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="bank">Bank</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DesktopDatePicker
                    name="pledgedDate"
                    value={values.pledgedDate}
                    error={touched.pledgedDate && errors.pledgedDate && true}
                    label={touched.pledgedDate && errors.pledgedDate ? errors.pledgedDate : 'Pledged date'}
                    inputFormat="MM/DD/YYYY"
                    onChange={(e) => {
                      setValues({ ...values, pledgedDate: e });
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="pledgeId"
                  value={values.pledgeId}
                  error={touched.pledgeId && errors.pledgeId && true}
                  label={touched.pledgeId && errors.pledgeId ? errors.pledgeId : 'Pledge id'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="pledgedIn"
                  value={values.pledgedIn}
                  error={touched.pledgedIn && errors.pledgedIn && true}
                  label={touched.pledgedIn && errors.pledgedIn ? errors.pledgedIn : 'Pledged in'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="pledgedBranch"
                  value={values.pledgedBranch}
                  error={touched.pledgedBranch && errors.pledgedBranch && true}
                  label={touched.pledgedBranch && errors.pledgedBranch ? errors.pledgedBranch : 'Pledged branch'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <span>Release document: </span>
                <TextField
                  name="releaseDocument"
                  type={'file'}
                  error={touched.releaseDocument && errors.releaseDocument && true}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setValues({ ...values, releaseDocument: e.target.files[0] });
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DesktopDatePicker
                    name="releaseDate"
                    value={values.releaseDate}
                    error={touched.releaseDate && errors.releaseDate && true}
                    label={touched.releaseDate && errors.releaseDate ? errors.releaseDate : 'Release date'}
                    inputFormat="MM/DD/YYYY"
                    onChange={(e) => {
                      setValues({ ...values, releaseDate: e });
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="comments"
                  value={values.comments}
                  error={touched.comments && errors.comments && true}
                  label={touched.comments && errors.comments ? errors.comments : 'Comments'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              {values.paymentType === 'bank' && (
                <Bank
                  selectedUser={selectedUser}
                  selectedBank={selectedBank}
                  setSelectedBank={setSelectedBank}
                  setNotify={setNotify}
                />
              )}
              <Grid item xs={12}>
                <LoadingButton size="large" type="submit" variant="contained" startIcon={<SaveIcon />}>
                  Save
                </LoadingButton>
                <Button
                  size="large"
                  variant="contained"
                  color="error"
                  sx={{ ml: 2 }}
                  startIcon={<CloseIcon />}
                  onClick={() => setReleaseModal(false)}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>

      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...style, width: 400 }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Delete
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 3 }}>
            Do you want to delete?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={() => handleDelete()}>
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}

Release.propTypes = {
  setNotify: PropTypes.func,
  selectedUser: PropTypes.object,
  selectedRelease: PropTypes.array,
  setSelectedRelease: PropTypes.func,
};

export default Release;
