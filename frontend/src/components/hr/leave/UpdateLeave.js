import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { getLeaveById, updateLeave } from '../../../apis/hr/leave';
import { getEmployee } from '../../../apis/hr/employee';

function UpdateLeave(props) {
  const auth = useSelector((state) => state.auth);
  const [employees, setEmloyees] = useState([]);

  useEffect(() => {
    getEmployee().then((data) => {
      setEmloyees(data.data);
    });
  }, []);

  const userType = auth.user.userType?.toLowerCase();
  const isManagerOrAdmin = ['admin', 'branch', 'hr'].includes(userType);
  const empName = auth.user.employee?.name || auth.user.name || '';

  const validate = (values) => {
    const errors = {};
    if (!values.employee) errors.employee = 'Employee is required';
    if (!values.leaveType) errors.leaveType = 'Leave type is required';
    if (!values.note) errors.note = 'Note is required';
    
    if (values.leaveCategory === 'Leave') {
      if (!values.startDate) errors.startDate = 'Start date is required';
      if (!values.endDate) errors.endDate = 'End date is required';
      if (values.startDate && values.endDate && moment(values.startDate).isAfter(values.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
    } else {
      if (!values.permissionDate) errors.permissionDate = 'Permission date is required';
      if (!values.startTime) errors.startTime = 'Start time is required';
      if (!values.endTime) errors.endTime = 'End time is required';
    }
    
    if (values.leaveType === 'Others' && !values.otherLeaveType) {
      errors.otherLeaveType = 'Please specify';
    }
    
    return errors;
  };

  const initialValues = {
    employee: '',
    leaveCategory: 'Leave',
    leaveType: '',
    otherLeaveType: '',
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    permissionDate: moment().format('YYYY-MM-DD'),
    startTime: '',
    endTime: '',
    note: '',
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: { ...initialValues },
    enableReinitialize: true,
    validate,
    onSubmit: (values) => {
      let datesArray = [];
      if (values.leaveCategory === 'Leave') {
        let curr = moment(values.startDate);
        const end = moment(values.endDate);
        while (curr.isSameOrBefore(end, 'day')) {
          datesArray.push(curr.format('YYYY-MM-DD'));
          curr.add(1, 'days');
        }
      } else {
        datesArray = [moment(values.permissionDate).format('YYYY-MM-DD')];
      }

      const payload = {
        employee: values.employee,
        leaveCategory: values.leaveCategory,
        leaveType: values.leaveType === 'Others' ? values.otherLeaveType : values.leaveType,
        dates: datesArray,
        startTime: values.leaveCategory === 'Permission' ? values.startTime : undefined,
        endTime: values.leaveCategory === 'Permission' ? values.endTime : undefined,
        note: values.note,
      };

      updateLeave(props.id, payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: 'Leave not updated',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: 'Leave updated',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getLeaveById(props.id).then((data) => {
        const leaveData = data.data;
        const standardTypes = ['Casual Leave', 'Sick Leave', 'Emergency Leave', 'Casual Permission', 'Sick Permission', 'Emergency Permission'];
        const isOthers = !standardTypes.includes(leaveData.leaveType);
        
        const payload = {
          ...leaveData,
          employee: leaveData.employee?._id || leaveData.employee,
          leaveCategory: leaveData.leaveCategory || 'Leave',
          leaveType: isOthers ? 'Others' : leaveData.leaveType,
          otherLeaveType: isOthers ? leaveData.leaveType : '',
          startDate: leaveData.leaveCategory !== 'Permission' && leaveData.dates && leaveData.dates[0] 
            ? moment(leaveData.dates[0]).format('YYYY-MM-DD') 
            : moment().format('YYYY-MM-DD'),
          endDate: leaveData.leaveCategory !== 'Permission' && leaveData.dates && leaveData.dates.length > 0 
            ? moment(leaveData.dates[leaveData.dates.length - 1]).format('YYYY-MM-DD') 
            : moment().format('YYYY-MM-DD'),
          permissionDate: leaveData.leaveCategory === 'Permission' && leaveData.dates && leaveData.dates[0] 
            ? moment(leaveData.dates[0]).format('YYYY-MM-DD') 
            : moment().format('YYYY-MM-DD'),
          startTime: leaveData.startTime || '',
          endTime: leaveData.endTime || '',
          note: leaveData.note || '',
        };
        setValues(payload ?? {});
      });
    }
  }, [props.id]);

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
        encType="multipart/form-data"
      >
        <Grid container spacing={3}>
          {isManagerOrAdmin ? (
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
                    setValues({ ...values, employee: e.target.value });
                    handleChange(e);
                  }}
                >
                  {employees?.map((e) => (
                    <MenuItem key={e._id} value={e._id}>{e.employeeId} {e.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ) : (
            <Grid item xs={12} sm={4}>
              <TextField
                label="Employee Name"
                value={empName}
                fullWidth
                disabled
              />
            </Grid>
          )}

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                label="Category"
                name="leaveCategory"
                value={values.leaveCategory}
                onChange={(e) => {
                  setValues({
                    ...values,
                    leaveCategory: e.target.value,
                    leaveType: '',
                    otherLeaveType: '',
                  });
                }}
              >
                <MenuItem value="Leave">Leave</MenuItem>
                <MenuItem value="Permission">Permission</MenuItem>
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
                {values.leaveCategory === 'Leave' ? (
                  [
                    <MenuItem key="casual" value="Casual Leave">Casual Leave</MenuItem>,
                    <MenuItem key="sick" value="Sick Leave">Sick Leave</MenuItem>,
                    <MenuItem key="emergency" value="Emergency Leave">Emergency Leave</MenuItem>,
                    <MenuItem key="others" value="Others">Others</MenuItem>
                  ]
                ) : (
                  [
                    <MenuItem key="casual-p" value="Casual Permission">Casual Permission</MenuItem>,
                    <MenuItem key="sick-p" value="Sick Permission">Sick Permission</MenuItem>,
                    <MenuItem key="emergency-p" value="Emergency Permission">Emergency Permission</MenuItem>,
                    <MenuItem key="others-p" value="Others">Others</MenuItem>
                  ]
                )}
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
                    : 'Describe Type'
                }
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
                required
              />
            </Grid>
          )}

          {values.leaveCategory === 'Leave' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="startDate"
                  type="date"
                  label="Start Date"
                  value={values.startDate}
                  error={touched.startDate && errors.startDate && true}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="endDate"
                  type="date"
                  label="End Date"
                  value={values.endDate}
                  error={touched.endDate && errors.endDate && true}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
            </>
          )}

          {values.leaveCategory === 'Permission' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="permissionDate"
                  type="date"
                  label="Permission Date"
                  value={values.permissionDate}
                  error={touched.permissionDate && errors.permissionDate && true}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="startTime"
                  type="time"
                  label="Start Time"
                  value={values.startTime}
                  error={touched.startTime && errors.startTime && true}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="endTime"
                  type="time"
                  label="End Time"
                  value={values.endTime}
                  error={touched.endTime && errors.endTime && true}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
            </>
          )}

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

UpdateLeave.propTypes = {
  id: PropTypes.string,
  setNotify: PropTypes.func,
  setToggleContainer: PropTypes.func,
};

export default UpdateLeave;
