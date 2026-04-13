import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
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
import { getBranchByBranchId } from '../../../apis/branch/branch';
import { createFile } from '../../../apis/branch/fileupload';
import { getEnquiryByMkgId } from '../../../apis/branch/qrEnquiry';
import Stack from '@mui/material/Stack';

function CreateCustomer({ setToggleContainer, setNotify }) {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [token, setToken] = useState(null);
  const [altToken, setAltToken] = useState(null);
  const [enquiryId, setEnquiryId] = useState('');
  const [fetchingEnquiry, setFetchingEnquiry] = useState(false);
  const [img, setImg] = useState(null);
  const webcamRef = useRef(null);
  const form = useRef();

  useEffect(() => {
    setBranch(auth.user.branch);
  }, [auth]);

  const videoConstraints = {
    width: 420,
    height: 420,
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
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(10),
    alternatePhoneNumber: Yup.string()
      .matches(/^[0-9]+$/, 'Must be only digits')
      ?.length(10),
    email: Yup.string().required('Email id is required'),
    dob: Yup.string().required('DOB is required'),
    gender: Yup.string().required('Gender is required'),
    otp: Yup.string()?.length(6),
    altOtp: Yup.string()?.length(6),
    employmentType: Yup.string().required('Employment type is required'),
    organisation: Yup.string().required('Organisation is required'),
    annualIncome: Yup.string().required('Annual income is required'),
    maritalStatus: Yup.string().required('Marital is required'),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    setValues,
    touched,
    errors,
    setFieldError,
    setFieldTouched,
    resetForm,
  } = useFormik({
    initialValues: {
      name: '',
      phoneNumber: '',
      alternatePhoneNumber: '',
      email: '',
      dob: null,
      gender: '',
      otp: '',
      altOtp: '',
      employmentType: '',
      organisation: '',
      annualIncome: '',
      maritalStatus: '',
      source: '',
      signature: {},
      status: 'active',
      chooseId: '',
      idNo: '',
      uploadId: {},
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      /*
      setFieldTouched('otp', false);
      const res = await verifyOtp({ otp: values.otp, token });
      if (res.status === true || res.status === false) { // Simple bypass for now as per "hide functionality"
        // ... handled below
      }
      */
      if (!img) {
        setNotify({
          open: true,
          message: 'Please capture photo',
          severity: 'error',
        });
        return;
      }
      const payload = {
        branch: branch?._id,
        name: values.name,
        phoneNumber: values.phoneNumber,
        alternatePhoneNumber: values.alternatePhoneNumber,
        email: values.email,
        dob: values.dob,
        gender: values.gender,
        otp: values.otp,
        altOtp: values.altOtp,
        employmentType: values.employmentType,
        organisation: values.organisation,
        annualIncome: values.annualIncome,
        maritalStatus: values.maritalStatus,
        source: values.source,
        status: values.status,
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

          // 1. Upload Profile Photo (Captured from Webcam)
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

          // 2. Upload ID Document
          if (values.uploadId && values.uploadId instanceof File) {
            const formData = new FormData();
            formData.append('uploadId', uploadId);
            formData.append('uploadName', uploadName);
            formData.append('uploadType', 'upload_id');
            formData.append('uploadedFile', values.uploadId);
            formData.append('documentType', values.chooseId);
            formData.append('documentNo', values.idNo);
            createFile(formData).then((res) => {
              if (!res.status) console.error('ID document upload failed:', res.message);
            });
          }

          // 3. Upload Signature
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
      const res = await getEnquiryByMkgId(enquiryId);
      if (res.status) {
        setValues({
          ...values,
          name: res.data.name || values.name,
          phoneNumber: res.data.phoneNumber || values.phoneNumber,
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
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                    size="small"
                    label="Customer ID (e.g. MK123A)"
                    value={enquiryId}
                    onChange={(e) => setEnquiryId(e.target.value)}
                    sx={{ maxWidth: 300 }}
                />
                <LoadingButton
                    loading={fetchingEnquiry}
                    variant="outlined"
                    onClick={handleFetchEnquiry}
                >
                    Fetch Detail
                </LoadingButton>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <TextField
              name="phoneNumber"
              value={values.phoneNumber}
              error={touched.phoneNumber && errors.phoneNumber && true}
              label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="alternatePhoneNumber"
              value={values.alternatePhoneNumber}
              error={touched.alternatePhoneNumber && errors.alternatePhoneNumber && true}
              label={
                touched.alternatePhoneNumber && errors.alternatePhoneNumber ? errors.alternatePhoneNumber : 'Alt Phone'
              }
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
            {/* 
            <Button
              size="small"
              variant="outlined"
              sx={{
                color: '#8A1B9F',
                borderColor: '#8A1B9F',
                '&:hover': {
                  borderColor: '#FFD700',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                },
              }}
              onClick={() => {
                sendOtp({ phoneNumber: values.alternatePhoneNumber }).then((data) => {
                  if (data.status === true) {
                    setAltToken(data.data.token);
                    setNotify({ open: true, message: 'OTP Sent', severity: 'success' });
                  } else {
                    setNotify({ open: true, message: data.message, severity: 'error' });
                  }
                });
              }}
              disabled={values.alternatePhoneNumber?.length !== 10}
            >
              Send OTP
            </Button>
            */}
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          {/* 
          <Grid item xs={12} sm={4}>
            <TextField
              name="otp"
              value={values.otp}
              error={touched.otp && errors.otp && true}
              label={touched.otp && errors.otp ? errors.otp : 'Phone Number OTP'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="altOtp"
              value={values.altOtp}
              error={touched.altOtp && errors.altOtp && true}
              label={touched.altOtp && errors.altOtp ? errors.altOtp : 'Alt Phone Number OTP'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.employmentType && errors.employmentType && true}>
              <InputLabel id="select-label">Select Employment Type</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={
                  touched.employmentType && errors.employmentType ? errors.employmentType : 'Select Employment Type'
                }
                name="employmentType"
                value={values.employmentType}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="Business Owner">Business Owner</MenuItem>
                <MenuItem value="Central Govt Employee">Central Govt Employee</MenuItem>
                <MenuItem value="Contract Employee">Contract Employee</MenuItem>
                <MenuItem value="Military">Military</MenuItem>
                <MenuItem value="Police">Police</MenuItem>
                <MenuItem value="Self Employed">Self Employed</MenuItem>
                <MenuItem value="State Govt Employee">State Govt Employee</MenuItem>
                <MenuItem value="Working Professional">Working Professional</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="organisation"
              value={values.organisation}
              error={touched.organisation && errors.organisation && true}
              label={touched.organisation && errors.organisation ? errors.organisation : 'Organisation'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="annualIncome"
              value={values.annualIncome}
              error={touched.annualIncome && errors.annualIncome && true}
              label={touched.annualIncome && errors.annualIncome ? errors.annualIncome : 'Annualincome'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.chooseId && errors.chooseId && true}>
              <InputLabel id="select-label">Select chooseId</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.chooseId && errors.chooseId ? errors.chooseId : 'Select chooseId'}
                name="chooseId"
                value={values.chooseId}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="Aadhar Card">Aadhar Card</MenuItem>
                <MenuItem value="Driving License">Driving License</MenuItem>
                <MenuItem value="PAN Card">PAN Card</MenuItem>
                <MenuItem value="Passport">Passport</MenuItem>
                <MenuItem value="Ration Card">Ration Card</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="idNo"
              value={values.idNo}
              error={touched.idNo && errors.idNo && true}
              label={touched.idNo && errors.idNo ? errors.idNo : 'Id No'}
              fullWidth
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <span>UploadId: </span>
            <TextField
              name="uploadId"
              type={'file'}
              onBlur={handleBlur}
              onChange={(e) => {
                setValues({ ...values, uploadId: e.target.files[0] });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <span>Signature: </span>
            <TextField
              name="signature"
              type={'file'}
              onBlur={handleBlur}
              onChange={(e) => {
                setValues({ ...values, signature: e.target.files[0] });
              }}
            />
          </Grid>
          <Grid item xs={12}>
            {img === null ? (
              <>
                <Webcam
                  mirrored
                  audio={false}
                  height={400}
                  width={400}
                  ref={webcamRef}
                  screenshotFormat="image/png"
                  videoConstraints={videoConstraints}
                />
                <br />
                <LoadingButton size="small" type="button" variant="contained" onClick={capture}>
                  Capture photo
                </LoadingButton>
              </>
            ) : (
              <>
                <img src={img} alt="screenshot" />
                <br />
                <LoadingButton size="small" type="button" variant="contained" onClick={() => setImg(null)}>
                  Retake
                </LoadingButton>
              </>
            )}
          </Grid>
          <Grid item xs={12}>
            <LoadingButton size="large" type="submit" variant="contained">
              Save
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default CreateCustomer;

