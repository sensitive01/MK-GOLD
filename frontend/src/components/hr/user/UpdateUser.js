import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getUserById, updateUser } from '../../../apis/hr/user';
import { getLoginNotCreatedEmployee } from '../../../apis/hr/employee';
import { getBranch } from '../../../apis/hr/branch';
import global from '../../../utils/global';

const branchRoles = ['branch', 'assistant_branch_manager', 'branch_executive', 'transaction_executive'];

function UpdateUser(props) {
  const [employees, setEmloyees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [lastEditedBy, setLastEditedBy] = useState(null);

  // Form validation
  const schema = Yup.object({
    branch: Yup.string().when('userType', {
      is: (v) => branchRoles.includes(v),
      then: Yup.string().required('Branch is required'),
    }),
    userType: Yup.string().required('User type is required'),
    employee: Yup.string().required('Employee is required'),
    loginMethod: Yup.string().required('Login method is required'),
  });

  const initialValues = {
    username: '',
    password: '',
    userType: '',
    employee: '',
    branch: '',
    loginMethod: 'password',
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm, setFieldValue } = useFormik({
    initialValues: { ...initialValues },
    validationSchema: schema,
    onSubmit: (values) => {
      const payload = { ...values };
      const selectedEmp = employees?.find((e) => e._id === payload.employee);

      // Default username to employee's phone number or existing username
      payload.username = payload.username || selectedEmp?.phoneNumber || null;

      if (!branchRoles.includes(payload.userType)) {
        if (!payload.branch) {
          delete payload.branch;
        }
      }

      if (payload.loginMethod === 'otp') {
        payload.password = 'no-password';
      } else if (!payload.password) {
        delete payload.password;
      }

      updateUser(props.id, payload).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: data.message || 'User not updated',
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: data.message || 'User updated successfully',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    getBranch().then((data) => {
      setBranches(data.data || []);
    });
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getUserById(props.id).then((data) => {
        setValues({
          ...data.data,
          employee: data.data?.employee?._id,
          branch: data.data?.branch?._id || '',
          loginMethod: data.data?.loginMethod || (branchRoles.includes(data.data?.userType) ? 'otp' : 'password'),
          password: '',
        });
        const editor = data.data.lastEditedBy;
        setLastEditedBy(editor ? `${editor.username} (${editor.userType})` : null);
        getLoginNotCreatedEmployee().then((employee) => {
          const employees = [...(employee.data || [])];
          if (data.data.employee && !employees?.find((e) => e._id === data.data.employee._id)) {
            employees.push(data.data.employee);
          }
          setEmloyees(employees?.filter((e) => e?._id));
        });
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
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.userType && errors.userType && true}>
              <InputLabel id="select-label">Select user type</InputLabel>
              <Select
                labelId="select-label"
                id="select"
                label={touched.userType && errors.userType ? errors.userType : 'Select user type'}
                name="userType"
                value={values.userType}
                onBlur={handleBlur}
                onChange={(e) => {
                  handleChange(e);
                  if (branchRoles.includes(e.target.value)) {
                    setFieldValue('loginMethod', 'otp');
                  } else {
                    setFieldValue('loginMethod', 'password');
                  }
                }}
              >
                {global.userTypes?.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {branchRoles.includes(values.userType) && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={touched.branch && errors.branch && true}>
                <InputLabel id="select-label">Select branch</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.branch && errors.branch ? errors.branch : 'Select branch'}
                  name="branch"
                  value={values.branch || ''}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {branches?.map((e) => (
                    <MenuItem value={e._id} key={e._id}>
                      {e.branchId} {e.branchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

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
                onChange={handleChange}
              >
                {employees?.map((e) => (
                  <MenuItem value={e._id} key={e._id}>
                    {e.employeeId} {e.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth error={touched.loginMethod && errors.loginMethod && true}>
              <InputLabel id="login-method-label">Login Method</InputLabel>
              <Select
                labelId="login-method-label"
                id="loginMethod"
                label={touched.loginMethod && errors.loginMethod ? errors.loginMethod : 'Login Method'}
                name="loginMethod"
                value={values.loginMethod}
                onBlur={handleBlur}
                onChange={handleChange}
              >
                <MenuItem value="password">Password</MenuItem>
                <MenuItem value="otp">OTP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {values.loginMethod === 'password' && (
            <Grid item xs={12} sm={4}>
              <TextField
                name="password"
                type="password"
                value={values.password}
                placeholder="Leave blank to keep current password"
                error={touched.password && errors.password && true}
                label={touched.password && errors.password ? errors.password : 'Password'}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
          )}

          {!branchRoles.includes(values.userType) && (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={touched.branch && errors.branch && true}>
                <InputLabel id="select-branch-optional-label">Select branch (Optional)</InputLabel>
                <Select
                  labelId="select-branch-optional-label"
                  id="select-branch-optional"
                  label={touched.branch && errors.branch ? errors.branch : 'Select branch (Optional)'}
                  name="branch"
                  value={values.branch || ''}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <MenuItem value="">None</MenuItem>
                  {branches?.map((e) => (
                    <MenuItem value={e._id} key={e._id}>
                      {e.branchId} {e.branchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            {lastEditedBy && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                Last Edited By: {lastEditedBy}
              </Typography>
            )}
            <LoadingButton size="large" type="submit" variant="contained">
              Save
            </LoadingButton>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
}

export default UpdateUser;


