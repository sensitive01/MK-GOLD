  import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid, Tab, Tabs, Box, Button, Typography, IconButton, Chip, Divider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LoadingButton } from '@mui/lab';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Webcam from 'react-webcam';
import { useSelector } from 'react-redux';
import { createCustomer } from '../../../apis/branch/customer';
import { createFile } from '../../../apis/branch/fileupload';
import { getEnquiryByEnqId } from '../../../apis/branch/qrEnquiry';
import Stack from '@mui/material/Stack';
import global from '../../../utils/global';
import Iconify from '../../iconify';

function CreateCustomer({ setToggleContainer, setNotify }) {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [enquiryId, setEnquiryId] = useState('');
  const [fetchingEnquiry, setFetchingEnquiry] = useState(false);
  const [img, setImg] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const webcamRef = useRef(null);
  const form = useRef();
  const [tabValue, setTabValue] = useState(0);
  const [uploadIdPreview, setUploadIdPreview] = useState(null);
  const [uploadPanPreview, setUploadPanPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  // Multiple ID Proofs State
  const [idProofs, setIdProofs] = useState([
    { id: 1, chooseId: '', idNo: '', file: null, preview: null, isExisting: false },
  ]);

  const handleAddIdProof = () => {
    setIdProofs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), chooseId: '', idNo: '', file: null, preview: null, isExisting: false },
    ]);
  };

  const handleRemoveIdProof = (id) => {
    setIdProofs((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length > 0 && typeof setFieldValue === 'function') {
        setFieldValue('chooseId', next[0].chooseId);
        setFieldValue('idNo', next[0].idNo);
        setFieldValue('uploadId', next[0].file);
      }
      return next;
    });
  };

  const handleIdProofChange = (id, field, value) => {
    setIdProofs((prev) =>
      prev.map((item, index) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (index === 0 && typeof setFieldValue === 'function') {
            setFieldValue(field === 'chooseId' ? 'chooseId' : 'idNo', value);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleIdProofFileChange = (id, file) => {
    setIdProofs((prev) =>
      prev.map((item, index) => {
        if (item.id === id) {
          const preview = file ? URL.createObjectURL(file) : null;
          if (index === 0 && typeof setFieldValue === 'function') {
            setFieldValue('uploadId', file);
          }
          return { ...item, file, preview, isExisting: false };
        }
        return item;
      })
    );
  };

  useEffect(() => {
    setBranch(auth.user.branch);
  }, [auth]);

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: 'user',
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImg(imageSrc);
  }, [webcamRef]);

  // Form validation
  const schema = Yup.object({
    name: Yup.string().required('Name is required'),
    phoneNumber: Yup.string()
      .required('Phone is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
    alternatePhoneNumber: Yup.string()
      .matches(/^[0-9]{10}$/, {
        message: 'Alternate phone number must be exactly 10 digits',
        excludeEmptyString: true,
      }),
    email: Yup.string().email('Enter a valid email id'),
    dob: Yup.string().required('DOB is required'),
    gender: Yup.string().required('Gender is required'),
    maritalStatus: Yup.string().required('Marital is required'),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    setValues,
    setFieldValue,
    touched,
    errors,
    resetForm,
  } = useFormik({
    initialValues: {
      name: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      email: '',
      dob: null,
      gender: '',
      maritalStatus: '',
      source: '',
      signature: {},
      status: 'active',
      chooseId: '',
      idNo: '',
      uploadId: {},
      panCardNumber: '',
      uploadPan: {},
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      if (!img) {
        setNotify({
          open: true,
          message: 'Please capture photo',
          severity: 'error',
        });
        return;
      }
      const primaryChooseId = idProofs[0]?.chooseId || values.chooseId || '';
      const primaryIdNo = idProofs[0]?.idNo || values.idNo || '';
      const activeIdProofs = idProofs.filter((p) => p.chooseId || p.idNo).map((p) => ({ chooseId: p.chooseId, idNo: p.idNo }));

      const payload = {
        branch: branch?._id,
        name: values.name,
        phoneNumber: values.phoneNumber,
        alternatePhoneNumber: values.alternatePhoneNumber,
        email: values.email,
        dob: values.dob,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        source: values.source,
        status: values.status,
        enqID: enquiryId,
        chooseId: primaryChooseId,
        idNo: primaryIdNo,
        idProofs: activeIdProofs,
        panCardNumber: values.panCardNumber ? values.panCardNumber.trim().toUpperCase() : '',
      };
      createCustomer(payload).then((data) => {
        if (data.status === false) {
          setNotify({
            open: true,
            message: data.message ?? 'Customer not created',
            severity: 'error',
          });
        } else {
          const uploadId = data.data.fileUpload.uploadId;
          const uploadName = data.data.fileUpload.uploadName;

          if (img) {
            fetch(img)
              .then((res) => res.blob())
              .then((blob) => {
                const file = new File([blob], `profile-${uploadId}.png`, { type: 'image/png' });
                const formData = new FormData();
                formData.append('uploadId', uploadId);
                formData.append('uploadName', uploadName);
                formData.append('uploadType', 'profile_image');
                formData.append('uploadedFile', file);
                createFile(formData).then((res) => {
                  if (!res.status) console.error('Profile photo upload failed:', res.message);
                });
              });
          }

          for (let i = 0; i < idProofs.length; i++) {
            const proof = idProofs[i];
            if (proof.file && proof.file instanceof File) {
              const formData = new FormData();
              formData.append('uploadId', uploadId);
              formData.append('uploadName', uploadName);
              formData.append('uploadType', 'upload_id');
              formData.append('uploadedFile', proof.file);
              formData.append('documentType', proof.chooseId || 'ID Document');
              formData.append('documentNo', proof.idNo || '');
              createFile(formData).then((res) => {
                if (!res.status) console.error('ID document upload failed:', res.message);
              });
            }
          }

          if (values.uploadPan && values.uploadPan instanceof File) {
            const formDataPan = new FormData();
            formDataPan.append('uploadId', uploadId);
            formDataPan.append('uploadName', uploadName);
            formDataPan.append('uploadType', 'pan_card');
            formDataPan.append('uploadedFile', values.uploadPan);
            formDataPan.append('documentType', 'PAN Card');
            formDataPan.append('documentNo', values.panCardNumber ? values.panCardNumber.trim().toUpperCase() : '');
            createFile(formDataPan).then((res) => {
              if (!res.status) console.error('PAN Card upload failed:', res.message);
            });
          }

          if (values.signature && values.signature instanceof File) {
            const formData1 = new FormData();
            formData1.append('uploadId', uploadId);
            formData1.append('uploadName', uploadName);
            formData1.append('uploadType', 'signature');
            formData1.append('uploadedFile', values.signature);
            createFile(formData1).then((res) => {
              if (!res.status) console.error('Signature upload failed:', res.message);
            });
          }

          setToggleContainer(false);
          setImg(null);
          setTabValue(0);
          setUploadIdPreview(null);
          setUploadPanPreview(null);
          setSignaturePreview(null);
          setIdProofs([{ id: 1, chooseId: '', idNo: '', file: null, preview: null, isExisting: false }]);
          form.current.reset();
          resetForm();
          setNotify({
            open: true,
            message: 'Customer created successfully with documents',
            severity: 'success',
          });
        }
      });
    },
  });

  const handleFetchEnquiry = async () => {
    if (!enquiryId) return;
    setFetchingEnquiry(true);
    try {
      const res = await getEnquiryByEnqId(enquiryId);
      if (res.status) {
        setValues({
          ...values,
          name: res.data.name || values.name,
          phoneNumber: res.data.phoneNumber || values.phoneNumber,
          email: res.data.email || values.email,
          pincode: res.data.pincode || values.pincode,
        });
        setNotify({ open: true, message: 'Enquiry details fetched', severity: 'success' });
      } else {
        setNotify({ open: true, message: res.message, severity: 'error' });
      }
    } catch (error) {
        setNotify({ open: true, message: 'Fetch failed', severity: 'error' });
    }
    setFetchingEnquiry(false);
  };

  return (
    <Card sx={{ p: { xs: 2, sm: 3, md: 4 }, my: { xs: 2, sm: 3 } }}>
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 3,
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 1.5, sm: 2.5 },
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
            },
          }}
        >
          <Tab label="1. Details" />
          <Tab label="2. Documents" />
          <Tab label="3. Photo Capture" />
        </Tabs>

        {tabValue === 0 && (
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  label="Enquiry ID (e.g. MKG123A)"
                  placeholder="e.g. MKG123A"
                  value={enquiryId}
                  onChange={(e) => setEnquiryId(e.target.value)}
                  sx={{ flex: 1, maxWidth: { xs: '100%', sm: 320 } }}
                />
                <LoadingButton
                  loading={fetchingEnquiry}
                  variant="outlined"
                  onClick={handleFetchEnquiry}
                  sx={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}
                >
                  Fetch Detail
                </LoadingButton>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                name="name"
                value={values.name}
                error={touched.name && errors.name && true}
                label={touched.name && errors.name ? errors.name : 'Name'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                name="phoneNumber"
                value={focusedField === 'phoneNumber' ? values.phoneNumber : global.maskPhoneNumber(values.phoneNumber)}
                onFocus={() => setFocusedField('phoneNumber')}
                onBlur={(e) => {
                  handleBlur(e);
                  setFocusedField(null);
                }}
                error={touched.phoneNumber && errors.phoneNumber && true}
                label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone'}
                fullWidth
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                name="alternatePhoneNumber"
                value={focusedField === 'alternatePhoneNumber' ? values.alternatePhoneNumber : global.maskPhoneNumber(values.alternatePhoneNumber)}
                onFocus={() => setFocusedField('alternatePhoneNumber')}
                onBlur={(e) => {
                  handleBlur(e);
                  setFocusedField(null);
                }}
                error={touched.alternatePhoneNumber && errors.alternatePhoneNumber && true}
                label={
                  touched.alternatePhoneNumber && errors.alternatePhoneNumber ? errors.alternatePhoneNumber : 'Alt Phone'
                }
                fullWidth
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                name="email"
                value={values.email}
                error={touched.email && errors.email && true}
                label={touched.email && errors.email ? errors.email : 'Email id'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  name="dob"
                  value={values.dob}
                  error={touched.dob && errors.dob && true}
                  label={touched.dob && errors.dob ? errors.dob : 'DOB'}
                  inputFormat="MM/DD/YYYY"
                  onChange={(e) => {
                    setValues({ ...values, dob: e });
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth error={touched.gender && errors.gender && true}>
                <InputLabel id="select-label">Select gender</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.gender && errors.gender ? errors.gender : 'Select gender'}
                  name="gender"
                  value={values.gender}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth error={touched.maritalStatus && errors.maritalStatus && true}>
                <InputLabel id="select-label">Select marital status</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.maritalStatus && errors.maritalStatus ? errors.maritalStatus : 'Select maritalStatus'}
                  name="maritalStatus"
                  value={values.maritalStatus}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="married">Married</MenuItem>
                  <MenuItem value="unmarried">Unmarried</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth error={touched.source && errors.source && true}>
                <InputLabel id="select-label">Select source</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.source && errors.source ? errors.source : 'Select source'}
                  name="source"
                  value={values.source}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="TV Ad">TV Ad</MenuItem>
                  <MenuItem value="Newspaper Ad">Newspaper Ad</MenuItem>
                  <MenuItem value="Friend Reference">Friend Reference</MenuItem>
                  <MenuItem value="Hoardings">Hoardings</MenuItem>
                  <MenuItem value="Pamphlet Ad">Pamphlet Ad</MenuItem>
                  <MenuItem value="Poster Ad">Poster Ad</MenuItem>
                  <MenuItem value="Google Ad">Google Ad</MenuItem>
                  <MenuItem value="Others">Others</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
              Identity Proofs
            </Typography>

            {idProofs.map((proof, index) => (
              <Card
                key={proof.id}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1.5,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Chip
                    label={index === 0 ? 'Primary ID Proof' : `ID Proof #${index + 1}`}
                    color={index === 0 ? 'primary' : 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                  {index > 0 && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<Iconify icon="eva:trash-2-outline" />}
                      onClick={() => handleRemoveIdProof(proof.id)}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`id-type-${proof.id}`}>Select ID Document Type</InputLabel>
                      <Select
                        labelId={`id-type-${proof.id}`}
                        label="Select ID Document Type"
                        value={proof.chooseId}
                        onChange={(e) => handleIdProofChange(proof.id, 'chooseId', e.target.value)}
                      >
                        <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                        <MenuItem value="Driving License">Driving License</MenuItem>
                        <MenuItem value="Passport">Passport</MenuItem>
                        <MenuItem value="Ration Card">Ration Card</MenuItem>
                        <MenuItem value="Voter ID">Voter ID</MenuItem>
                        <MenuItem value="Others">Others</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      label="ID Number"
                      placeholder="e.g. 1234 5678 9012"
                      value={proof.idNo}
                      fullWidth
                      onChange={(e) => handleIdProofChange(proof.id, 'idNo', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 90 }}>
                        Upload ID:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                        <TextField
                          type="file"
                          id={`uploadIdInput-${proof.id}`}
                          size="small"
                          fullWidth
                          onChange={(e) => {
                            const file = e.target.files[0];
                            handleIdProofFileChange(proof.id, file);
                          }}
                        />
                        {proof.preview && (
                          <>
                            <IconButton
                              component="a"
                              href={proof.preview}
                              target="_blank"
                              rel="noreferrer"
                              color="secondary"
                              title="View ID Document"
                            >
                              <Iconify icon="mdi:eye" />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              title="Clear upload"
                              onClick={() => {
                                handleIdProofFileChange(proof.id, null);
                                const el = document.getElementById(`uploadIdInput-${proof.id}`);
                                if (el) el.value = '';
                              }}
                            >
                              <span style={{ fontSize: '18px', lineHeight: 1 }}>&times;</span>
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Card>
            ))}

            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleAddIdProof}
              sx={{ mb: 2.5 }}
            >
              Add Another ID Proof
            </Button>

            <Divider sx={{ my: 2.5 }} />

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
              PAN Card & Signature
            </Typography>

            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="panCardNumber"
                  value={values.panCardNumber}
                  error={touched.panCardNumber && errors.panCardNumber && true}
                  label={touched.panCardNumber && errors.panCardNumber ? errors.panCardNumber : 'PAN Card Number'}
                  placeholder="e.g. ABCDE1234F"
                  fullWidth
                  inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 10 }}
                  onBlur={handleBlur}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleChange(e);
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 90 }}>
                    Upload PAN:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                    <TextField
                      name="uploadPan"
                      type={'file'}
                      onBlur={handleBlur}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setValues({ ...values, uploadPan: file });
                        if (file) {
                          setUploadPanPreview(URL.createObjectURL(file));
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                    {uploadPanPreview && (
                      <IconButton
                        component="a"
                        href={uploadPanPreview}
                        target="_blank"
                        rel="noreferrer"
                        color="secondary"
                        title="View PAN Card"
                      >
                        <Iconify icon="mdi:eye" />
                      </IconButton>
                    )}
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 90 }}>
                    Signature:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
                    <TextField
                      name="signature"
                      type={'file'}
                      onBlur={handleBlur}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setValues({ ...values, signature: file });
                        if (file) {
                          setSignaturePreview(URL.createObjectURL(file));
                        }
                      }}
                      size="small"
                      fullWidth
                    />
                    {signaturePreview && (
                      <IconButton
                        component="a"
                        href={signaturePreview}
                        target="_blank"
                        rel="noreferrer"
                        color="secondary"
                        title="View Signature"
                      >
                        <Iconify icon="mdi:eye" />
                      </IconButton>
                    )}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {img === null ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      maxWidth: 320,
                      mx: 'auto',
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      '& video': { width: '100% !important', height: 'auto !important' },
                    }}
                  >
                    <Webcam
                      mirrored
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/png"
                      videoConstraints={videoConstraints}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Box>
                  <LoadingButton size="medium" type="button" variant="contained" onClick={capture} sx={{ mt: 2 }}>
                    Capture photo
                  </LoadingButton>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={img} 
                    alt="screenshot" 
                    style={{ 
                      width: '100%', 
                      maxWidth: '320px', 
                      height: 'auto', 
                      display: 'block', 
                      margin: '0 auto', 
                      borderRadius: '8px', 
                      border: '1px solid #ccc' 
                    }} 
                  />
                  <LoadingButton size="medium" type="button" variant="contained" color="warning" onClick={() => setImg(null)} sx={{ mt: 2 }}>
                    Retake
                  </LoadingButton>
                </Box>
              )}
            </Grid>
          </Grid>
        )}

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}
        >
          {tabValue > 0 && (
            <Button
              size="medium"
              variant="outlined"
              onClick={() => setTabValue((prev) => prev - 1)}
              sx={{ minWidth: { xs: 70, sm: 100 } }}
            >
              Back
            </Button>
          )}
          {tabValue < 2 ? (
            <Button
              size="medium"
              variant="contained"
              onClick={() => setTabValue((prev) => prev + 1)}
              sx={{ minWidth: { xs: 80, sm: 100 } }}
            >
              Next
            </Button>
          ) : (
            <LoadingButton size="medium" type="submit" variant="contained" sx={{ minWidth: { xs: 80, sm: 100 } }}>
              Save
            </LoadingButton>
          )}
        </Stack>
      </form>
    </Card>
  );
}

export default CreateCustomer;
