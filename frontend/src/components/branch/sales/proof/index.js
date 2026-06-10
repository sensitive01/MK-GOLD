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
  IconButton,
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
  overflowY: 'auto',
  border: 'none',
};

function ProofDocument({ step, setStep, setNotify, proofDocument, setProofDocument, saleType }) {
  const [openId, setOpenId] = useState(null);
  const [ornamentModal, setProofDocumentModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  
  // Custom states for multiple file uploads
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

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

  // Cleanup blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach((p) => {
        if (p.url && p.url.startsWith('blob:')) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previewUrls]);

  if (width < 899) {
    style.width = '80%';
  } else {
    style.width = 800;
  }

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - proofDocument?.length) : 0;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleCloseModal = () => {
    setProofDocumentModal(false);
    setSelectedFiles([]);
    setPreviewUrls([]);
    resetForm();
  };

  // Form validation
  const schema = Yup.object({
    documentType: Yup.string().required('Document type is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, setValues, touched, errors, resetForm, setFieldValue } = useFormik({
    initialValues: {
      documentType: '',
      documentNo: '',
      documentFile: {},
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (selectedFiles.length === 0) {
        setNotify({
          open: true,
          message: 'Please choose at least one file',
          severity: 'error',
        });
        return;
      }

      const newDocs = selectedFiles.map((file) => ({
        documentType: values.documentType,
        documentNo: values.documentNo,
        documentFile: file,
      }));

      setProofDocument([...proofDocument, ...newDocs]);
      handleCloseModal();
      setNotify({
        open: true,
        message: `${newDocs.length} proof document(s) uploaded`,
        severity: 'success',
      });
    },
  });

  const handleDelete = () => {
    setProofDocument(proofDocument?.filter((e, index) => index !== openId));
    handleCloseDeleteModal();
  };

  return (
    <>
      <Card sx={{ display: step === 3 ? 'block' : 'none', p: 4, my: 4 }}>
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
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
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
                      {(() => {
                        const file = e?.documentFile;
                        if (!file) return 'No File';
                        if (file instanceof File || file instanceof Blob) {
                          if (file.type && file.type.match(/image\/.*/)) {
                            return <img key={index} src={URL.createObjectURL(file)} alt="document" style={{ width: '80px', maxHeight: '80px', objectFit: 'contain' }} />;
                          }
                          return <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />;
                        }
                        if (typeof file === 'string') {
                          const isImage = file.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
                          const src = file.startsWith('http') ? file : `${global.baseURL}/${file}`;
                          if (isImage) {
                            return <img key={index} src={src} alt="document" style={{ width: '80px', maxHeight: '80px', objectFit: 'contain' }} />;
                          }
                        }
                        return <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />;
                      })()}
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
                {proofDocument?.length === 0 && (
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
            count={proofDocument?.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Scrollbar>
        <LoadingButton size="large" name="submit" type="button" variant="contained" onClick={() => setStep(step - 1)}>
          Back to billing details
        </LoadingButton>
        <LoadingButton
          size="large"
          name="submit"
          type="button"
          variant="contained"
          sx={{ ml: 2 }}
          onClick={() => {
            if (saleType === 'physical') {
              const hasOrnamentPhoto = proofDocument.some(
                (doc) => doc.documentType?.toLowerCase() === 'ornaments photo'
              );
              if (!hasOrnamentPhoto) {
                setNotify({
                  open: true,
                  message: 'Ornaments Photo is mandatory for physical sales.',
                  severity: 'error',
                });
                return;
              }
            }
            setStep(step + 1);
          }}
        >
          View summary
        </LoadingButton>
      </Card>

      <Modal
        open={ornamentModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            Proof Document
            <Button
              sx={{ color: '#222', float: 'right' }}
              startIcon={<CloseIcon />}
              onClick={handleCloseModal}
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
                  inputProps={{ multiple: true }}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      // Filter out duplicates by name and size to support appending
                      const newFiles = files.filter(
                        (file) => !selectedFiles.some((prevFile) => prevFile.name === file.name && prevFile.size === file.size)
                      );

                      if (newFiles.length > 0) {
                        setSelectedFiles((prev) => [...prev, ...newFiles]);

                        const newPreviews = newFiles.map((file) => {
                          let url = '/assets/doc.svg';
                          let type = 'other';
                          if (file.type && file.type.match(/image\/.*/)) {
                            url = URL.createObjectURL(file);
                            type = 'image';
                          }
                          return { url, name: file.name, type };
                        });
                        setPreviewUrls((prev) => [...prev, ...newPreviews]);
                      }
                    }
                    // Reset input value so selecting the same files again triggers onChange
                    e.target.value = '';
                  }}
                />
              </Grid>

              {/* Multiple Previews / File List section with eye and delete button */}
              {selectedFiles.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selected Files ({selectedFiles.length}):
                  </Typography>
                  <Stack spacing={1}>
                    {selectedFiles.map((file, idx) => {
                      const p = previewUrls[idx];
                      return (
                        <Stack
                          key={idx}
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          sx={{
                            p: 1,
                            px: 2,
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            bgcolor: '#f8fafc',
                          }}
                        >
                          {/* File Icon or Tiny Preview Thumbnail */}
                          {p?.type === 'image' ? (
                            <img
                              src={p.url}
                              alt={file.name}
                              style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          ) : (
                            <img src="/assets/doc.svg" alt="doc" style={{ width: '28px', height: '28px' }} />
                          )}

                          {/* File Name */}
                          <Typography variant="body2" sx={{ flexGrow: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500, color: '#334155' }}>
                            {file.name}
                          </Typography>

                          {/* Action Buttons: Eye and Delete */}
                          {p?.url && (
                            <IconButton
                              component="a"
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              color="primary"
                              size="small"
                              title="Preview File"
                              sx={{ bgcolor: '#fff', border: '1px solid #cbd5e1' }}
                            >
                              <Iconify icon="mdi:eye" width={16} height={16} />
                            </IconButton>
                          )}

                          <IconButton
                            color="error"
                            size="small"
                            title="Remove File"
                            sx={{ bgcolor: '#fff', border: '1px solid #fecaca' }}
                            onClick={() => {
                              setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                              setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <Iconify icon="mdi:delete" width={16} height={16} />
                          </IconButton>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Grid>
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
                  onClick={handleCloseModal}
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
  saleType: PropTypes.string,
};

export default ProofDocument;
