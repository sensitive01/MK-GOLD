import {
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
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
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Iconify from '../../../iconify';
import Scrollbar from '../../../scrollbar';
import { getAddressById, createAddress, deleteAddressById } from '../../../../apis/branch/customer-address';
import { createFile } from '../../../../apis/branch/fileupload';
import global from '../../../../utils/global';

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
  overflow: 'auto',
};

function Address(props) {
  const { step, setStep, setNotify, selectedUser } = props;
  const [data, setData] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [addressModal, setAddressModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [width, setWindowWidth] = useState(0);

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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  useEffect(() => {
    if (selectedUser) {
      getAddressById(selectedUser._id).then((data) => {
        setData(data.data);
      });
    }
  }, [selectedUser]);

  // Form validation
  const schema = Yup.object({
    address: Yup.string().required('Address is required'),
    area: Yup.string().required('Area is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string()
      .required('Pincode is required')
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(6),
    landmark: Yup.string().required('Landmark is required'),
    residential: Yup.string().required('Residential type is required'),
    label: Yup.string().required('Label is required'),
    documentType: Yup.string().required('Document type is required'),
    documentNo: Yup.string().required('Document no is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, setValues, errors, resetForm } = useFormik({
    initialValues: {
      address: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      residential: '',
      label: '',
      documentType: '',
      documentNo: '',
      documentFile: {},
    },
    validationSchema: schema,
    onSubmit: (values) => {
      createAddress({ customerId: selectedUser._id, ...values }).then((data) => {
        if (data.status === false) {
          setNotify({
            open: true,
            message: 'Address not created',
            severity: 'error',
          });
        } else {
          getAddressById(selectedUser._id).then((data) => {
            setData(data.data);
            selectedUser.address = data.data;
          });
          setAddressModal(false);
          const formData = new FormData();
          formData.append('uploadId', data.data.fileUpload.uploadId);
          formData.append('uploadName', data.data.fileUpload.uploadName);
          formData.append('uploadType', 'proof');
          formData.append('uploadedFile', values.documentFile);
          formData.append('documentType', values.documentType);
          formData.append('documentNo', values.documentNo);
          createFile(formData);
          resetForm();
          setNotify({
            open: true,
            message: 'Address created',
            severity: 'success',
          });
        }
      });
    },
  });

  const handleDelete = () => {
    deleteAddressById(selectedUser._id, openId).then(() => {
      getAddressById(selectedUser._id).then((data) => {
        setData(data.data);
      });
      handleCloseDeleteModal();
    });
  };

  return (
    <>
      <Card sx={{ display: step === 2 ? 'block' : 'none', p: 4, my: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Customer Address
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setAddressModal(true)}
          >
            New Address
          </Button>
        </Stack>
        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="left" />
                  <TableCell align="left">Address</TableCell>
                  <TableCell align="left">Landmark</TableCell>
                  <TableCell align="left">Pincode</TableCell>
                  <TableCell align="left">Label</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e) => (
                  <TableRow hover key={e._id} tabIndex={-1}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={props.selectedAddress?._id === e._id}
                        onChange={() => {
                          if (props.selectedAddress?._id === e._id) {
                            props.setSelectedAddress(null);
                          } else {
                            props.setSelectedAddress(e);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">{sentenceCase(e.address)}</TableCell>
                    <TableCell align="left">{sentenceCase(e.landmark)}</TableCell>
                    <TableCell align="left">{e.pincode}</TableCell>
                    <TableCell align="left">{sentenceCase(e.label)}</TableCell>
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
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
                {data?.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
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
            count={data?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Scrollbar>
        <LoadingButton size="large" name="submit" type="button" variant="contained" onClick={() => setStep(step - 1)}>
          Prev
        </LoadingButton>
        <LoadingButton
          size="large"
          name="submit"
          type="button"
          variant="contained"
          sx={{ ml: 2 }}
          onClick={() => {
            if (data?.length === 0) {
              setNotify({
                open: true,
                message: 'Please add address',
                severity: 'info',
              });
            } else if (!props.selectedAddress) {
              setNotify({
                open: true,
                message: 'Please select an address',
                severity: 'info',
              });
            } else {
              setStep(step + 1);
            }
          }}
        >
          Next
        </LoadingButton>
      </Card>

      <Modal
        open={addressModal}
        onClose={() => setAddressModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            Customer Address
            <Button
              sx={{ color: '#222', float: 'right' }}
              startIcon={<CloseIcon />}
              onClick={() => setAddressModal(false)}
            />
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            autoComplete="off"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  name="address"
                  value={values.address}
                  error={touched.address && errors.address && true}
                  label={touched.address && errors.address ? errors.address : 'Address'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="area"
                  value={values.area}
                  error={touched.area && errors.area && true}
                  label={touched.area && errors.area ? errors.area : 'Area'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.state && errors.state && true}>
                  <InputLabel id="select-label">Select state</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.state && errors.state ? errors.state : 'Select state'}
                    name="state"
                    value={values.state}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    {global.states?.map((state) => (
                      <MenuItem value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.city && errors.city && true}>
                  <InputLabel id="select-label">Select city</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.city && errors.city ? errors.city : 'Select city'}
                    name="city"
                    value={values.city}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    {global.cities[values.state]?.split('|')?.map((city) => (
                      <MenuItem value={city}>{city}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="pincode"
                  value={values.pincode}
                  error={touched.pincode && errors.pincode && true}
                  label={touched.pincode && errors.pincode ? errors.pincode : 'Pincode'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="landmark"
                  value={values.landmark}
                  error={touched.landmark && errors.landmark && true}
                  label={touched.landmark && errors.landmark ? errors.landmark : 'Landmark'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.residential && errors.residential && true}>
                  <InputLabel id="select-label">Select residential</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.residential && errors.residential ? errors.residential : 'Select residential'}
                    name="residential"
                    value={values.residential}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="Indian">Indian</MenuItem>
                    <MenuItem value="NRI">NRI</MenuItem>
                    <MenuItem value="Foreign Resident">Foreign Resident</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.label && errors.label && true}>
                  <InputLabel id="select-label">Select label</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.label && errors.label ? errors.label : 'Select label'}
                    name="label"
                    value={values.label}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="home">Home</MenuItem>
                    <MenuItem value="office">Office</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.documentType && errors.documentType && true}>
                  <InputLabel id="select-label">Select address proof</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.documentType && errors.documentType ? errors.documentType : 'Select address proof'}
                    name="documentType"
                    value={values.documentType}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                    <MenuItem value="Driving License">Driving License</MenuItem>
                    <MenuItem value="Passport">Passport</MenuItem>
                    <MenuItem value="Ration Card">Ration Card</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="documentNo"
                  value={values.documentNo}
                  error={touched.documentNo && errors.documentNo && true}
                  label={touched.documentNo && errors.documentNo ? errors.documentNo : 'Address proof number'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <span>Attach address proof: </span>
                <TextField
                  name="documentFile"
                  type={'file'}
                  error={touched.documentFile && errors.documentFile && true}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setValues({ ...values, documentFile: e.target.files[0] });
                  }}
                  required
                />
              </Grid>
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
                  onClick={() => setAddressModal(false)}
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

Address.propTypes = {
  step: PropTypes.number,
  setStep: PropTypes.func,
  setNotify: PropTypes.func,
  selectedUser: PropTypes.object,
  selectedAddress: PropTypes.object,
  setSelectedAddress: PropTypes.func,
};

export default Address;


