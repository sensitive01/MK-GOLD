import {
  TextField,
  Typography,
  Card,
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

function ProofDocument({ step, setStep, setNotify, proofDocument, setProofDocument }) {
  const [openId, setOpenId] = useState(null);
  const [ornamentModal, setProofDocumentModal] = useState(false);
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - proofDocument.length) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  // Form validation
  const schema = Yup.object({
    documentType: Yup.string().required('Document type is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, touched, errors, resetForm } = useFormik({
    initialValues: {
      documentType: '',
      documentNo: '',
      documentFile: {},
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setProofDocument([...proofDocument, values]);
      setProofDocumentModal(false);
      resetForm();
      setNotify({
        open: true,
        message: 'Proof document uploaded',
        severity: 'success',
      });
    },
  });

  const handleDelete = () => {
    setProofDocument(proofDocument.filter((e, index) => index !== openId));
    handleCloseDeleteModal();
  };

  return (
    <>
      <Card sx={{ display: step === 4 ? 'block' : 'none', p: 4, my: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={3}>
          <Typography variant="h4" gutterBottom>
            Proof Documents
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setProofDocumentModal(true)}
          >
            Upload document
          </Button>
        </Stack>
        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="left">Document Type</TableCell>
                  <TableCell align="left">Document No</TableCell>
                  <TableCell align="left">Document File</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proofDocument?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                  <TableRow hover key={index} tabIndex={-1}>
                    <TableCell align="left">{sentenceCase(e.documentType)}</TableCell>
                    <TableCell align="left">{e.documentNo}</TableCell>
                    <TableCell align="left">
                      {e?.documentFile?.type.match(/image\/.*/) ? (
                        <img key={index} src={URL.createObjectURL(e.documentFile)} alt="document" style={{ width: '80px' }} />
                      ) : (
                        <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                      )}
                    </TableCell>
                    <TableCell align="left">
                      <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setOpenId(index);
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
                {proofDocument.length === 0 && (
                  <TableRow>
                    <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
                      <Paper
                        sx={{
                          textAlign: 'center',
                        }}
                      >
                        <Typography paragraph>No proof document in table</Typography>
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
            count={proofDocument.length}
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
            if (proofDocument.length === 0) {
              setNotify({
                open: true,
                message: 'Please upload proof document',
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
        open={ornamentModal}
        onClose={() => setProofDocumentModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            Proof Document
            <Button
              sx={{ color: '#222', float: 'right' }}
              startIcon={<CloseIcon />}
              onClick={() => setProofDocumentModal(false)}
            />
          </Typography>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            encType="multipart/form-data"
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={touched.documentType && errors.documentType && true}>
                  <InputLabel id="select-documentType">Select document type</InputLabel>
                  <Select
                    labelId="select-documentType"
                    id="select"
                    label={touched.documentType && errors.documentType ? errors.documentType : 'Select document type'}
                    name="documentType"
                    value={values.documentType}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    <MenuItem value="ornaments photo">Ornaments Photo</MenuItem>
                    <MenuItem value="purchase bill">Purchase bill</MenuItem>
                    <MenuItem value="pledge receipt">Pledge Receipt</MenuItem>
                    <MenuItem value="interest slip">Interest slip</MenuItem>
                    <MenuItem value="release copy">Release Copy</MenuItem>
                    <MenuItem value="others">others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="documentNo"
                  value={values.documentNo}
                  error={touched.documentNo && errors.documentNo && true}
                  label={touched.documentNo && errors.documentNo ? errors.documentNo : 'Document No'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="documentFile"
                  type={'file'}
                  fullWidth
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
                  onClick={() => setProofDocumentModal(false)}
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

ProofDocument.propTypes = {
  step: PropTypes.number,
  setStep: PropTypes.func,
  setNotify: PropTypes.func,
  proofDocument: PropTypes.array,
  setProofDocument: PropTypes.func,
};

export default ProofDocument;
