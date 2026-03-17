import { FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Webcam from 'react-webcam';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createAttendance } from '../../../apis/branch/attendance';
import { getEmployee } from '../../../apis/branch/employee';
import { createFile } from '../../../apis/branch/fileupload';

function CreateAttendance(props) {
  const auth = useSelector((state) => state.auth);
  const [img, setImg] = useState(null);
  const webcamRef = useRef(null);
  const [employees, setEmloyees] = useState([]);

  useEffect(() => {
    getEmployee().then((data) => {
      setEmloyees(data.data);
    });
  }, []);

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
    employee: Yup.string().required('Employee is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: {
      employee: auth.user.employee._id,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (!img) {
        props.setNotify({
          open: true,
          message: 'Please capture photo',
          severity: 'info',
        });
        return;
      }
      createAttendance(values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Attendance not created',
            severity: 'error',
          });
        } else {
          fetch(img)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], `${data.data.fileUpload.uploadId}.png`, { type: 'image/png' });
              const formData = new FormData();
              formData.append('uploadId', data.data.fileUpload.uploadId);
              formData.append('uploadName', data.data.fileUpload.uploadName);
              formData.append('uploadType', 'attendance');
              formData.append('uploadedFile', file);
              createFile(formData);
            });
          props.setToggleContainer(false);
          resetForm();
          setImg(null);
          props.setNotify({
            open: true,
            message: 'Attendance created',
            severity: 'success',
          });
        }
      });
    },
  });

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
      >
        <Grid container spacing={3}>
          {/* <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.employee && errors.employee && true}>
              <InputLabel id="select-label">Select employee</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.employee && errors.employee ? errors.employee : 'Select employee'}
                name="employee"
                value={values.employee}
                onBlur={handleBlur}
                onChange={(e) => {
                  setValues({ ...values, employee: e.target.value });
                  handleChange(e);
                }}
              >
                {employees.map((e) => (
                  <MenuItem value={e._id}>{e.employeeId} {e.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid> */}
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

export default CreateAttendance;
