import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid, styled } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { PickersDay, StaticDatePicker } from '@mui/x-date-pickers';
import moment from 'moment';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { createLeave } from '../../../apis/accounts/leave';
import { createFile } from '../../../apis/accounts/fileupload';
import { getEmployee } from '../../../apis/accounts/employee';

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'selected',
})(({ theme, selected }) => ({
  ...(selected && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
}));

function CreateLeave(props) {
  const auth = useSelector((state) => state.auth);
  const [employees, setEmloyees] = useState([]);
  const form = useRef();
  const [branch, setBranch] = useState({});

  useEffect(() => {
    setBranch(auth.user.branch);
    getEmployee().then((data) => {
      setEmloyees(data.data);
    });
  }, [auth.user.branch]);

  // Form validation
  const schema = Yup.object({
    employee: Yup.string().required('Employee is required'),
    leaveType: Yup.string().required('Leave type is required'),
    dates: Yup.array().required('Dates is required'),
    note: Yup.string().required('Note is required'),
  });

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: {
      branch: auth.user.branch?._id || auth.user.branch || '',
      employee: auth.user.employee?._id || auth.user.employee || '',
      leaveType: '',
      otherLeaveType: '',
      proof: {},
      dates: [moment(moment().format('YYYY-MM-DD'))],
      note: '',
      status: 'pending',
    },
    enableReinitialize: true,
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = {
        branch: values.branch,
        employee: values.employee,
        leaveType: values.leaveType === 'Others' ? values.otherLeaveType : values.leaveType,
        dates: values.dates.map((date) => date.format('YYYY-MM-DD')),
        note: values.note,
        status: values.status,
      };
      createLeave(payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: data.message || 'Leave not created',
            severity: 'error',
          });
        } else {
          if (values.proof instanceof File) {
            const formData = new FormData();
            formData.append('uploadId', data.data.fileUpload.uploadId);
            formData.append('uploadName', data.data.fileUpload.uploadName);
            formData.append('uploadType', 'proof');
            formData.append('uploadedFile', values.proof);
            createFile(formData);
          }
          props.setToggleContainer(false);
          form.current.reset();
          resetForm();
          props.setNotify({
            open: true,
            message: 'Leave Applied Successfully!',
            severity: 'success',
          });
        }
      });
    },
  });

  const renderPickerDay = (date, selectedDates, pickersDayProps) => {
    if (!values.dates) {
      return <PickersDay {...pickersDayProps} />;
    }
    const selected = values.dates.find((item) => item?.isSame(moment(date)));
    return <CustomPickersDay {...pickersDayProps} disableMargin selected={selected} />;
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
        encType="multipart/form-data"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
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
                  const empId = e.target.value;
                  const emp = employees.find((item) => item._id === empId);
                  setValues({
                    ...values,
                    employee: empId,
                    branch: emp?.branch?._id || emp?.branch || values.branch,
                  });
                }}
              >
                {employees.map((e) => (
                  <MenuItem key={e._id} value={e._id}>
                    {e.employeeId} {e.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.leaveType && errors.leaveType && true}>
              <InputLabel id="leave-type-label">Leave Type</InputLabel>
              <Select
                labelId="leave-type-label"
                id="leave-type"
                label={touched.leaveType && errors.leaveType ? errors.leaveType : 'Leave Type'}
                name="leaveType"
                value={values.leaveType}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="Casual Leave">Casual Leave</MenuItem>
                <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {values.leaveType === 'Others' && (
            <Grid item xs={12} sm={4}>
              <TextField
                name="otherLeaveType"
                value={values.otherLeaveType}
                error={touched.otherLeaveType && errors.otherLeaveType && true}
                label={
                  touched.otherLeaveType && errors.otherLeaveType
                    ? errors.otherLeaveType
                    : 'Describe Leave Type'
                }
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                required
              />
            </Grid>
          )}
          <Grid item xs={12} sm={4}>
            <TextField
              name="proof"
              type={'file'}
              fullWidth
              onBlur={handleBlur}
              onChange={(e) => {
                setValues({ ...values, proof: e.target.files[0] });
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LocalizationProvider dateAdapter={AdapterMoment} fullWidth>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                name="dates"
                error={touched.dates && errors.dates && true}
                label={touched.dates && errors.dates ? errors.dates : 'Dates'}
                value={values.dates}
                onChange={(newValue) => {
                  const array = [...values.dates];
                  const date = newValue;
                  const index = array.findIndex((item) => item?.isSame(moment(date)));
                  if (index >= 0) {
                    array.splice(index, 1);
                  } else {
                    array.push(date);
                  }
                  setValues({ ...values, dates: array });
                }}
                renderDay={renderPickerDay}
                renderInput={(params) => <TextField {...params} />}
                minDate={moment().startOf('month')}
                maxDate={moment().add(1, 'months').endOf('month')}
              />
            </LocalizationProvider>
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
            <LoadingButton size="large" type="submit" variant="contained">
              Save
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

CreateLeave.propTypes = {
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default CreateLeave;
