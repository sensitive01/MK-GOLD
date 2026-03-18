import { TextField, FormControl, InputLabel, Select, MenuItem, Card, Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getUserById, updateUser } from '../../../apis/hr/user';
import { getLoginNotCreatedEmployee } from '../../../apis/hr/employee';
import { getBranch } from '../../../apis/hr/branch';
import global from '../../../utils/global';

function UpdateUser(props) {
  const [employees, setEmloyees] = useState([]);
  const [branches, setBranches] = useState([]);

  // Form validation
  const schema = Yup.object({
    username: Yup.string().when('userType', {
      is: (v) => !['branch', 'assistant_branch_manager', 'branch_executive'].includes(v),
      then: Yup.string().required('Username is required'),
    }),
    branch: Yup.string().when('userType', {
      is: (v) => ['branch', 'assistant_branch_manager', 'branch_executive'].includes(v),
      then: Yup.string().required('Branch is required'),
    }),
    password: Yup.string().when('userType', {
      is: (v) => !['branch', 'assistant_branch_manager', 'branch_executive'].includes(v),
      then: Yup.string().required('Password is required'),
    }),
    userType: Yup.string().required('User type is required'),
    employee: Yup.string().required('Employee Id is required'),
  });

  const initialValues = {
    username: '',
    password: '',
    userType: '',
    employee: '',
    branch: '',
  };

  const { handleSubmit, handleChange, handleBlur, values, touched, errors, setValues, resetForm } = useFormik({
    initialValues: { ...initialValues },
    validationSchema: schema,
    onSubmit: (values) => {
      if (['branch', 'assistant_branch_manager', 'branch_executive'].includes(values.userType)) {
        values.username = employees.find((e) => e._id === values.employee)?.phoneNumber ?? null;
        values.password = 'no-password';
      }
      updateUser(props.id, values).then((data) => {
        if (data.status === false) {
          props.setNotify({
            open: true,
            message: data.message,
            severity: 'error',
          });
        } else {
          props.setToggleContainer(false);
          props.setNotify({
            open: true,
            message: 'User updated',
            severity: 'success',
          });
        }
      });
    },
  });

  useEffect(() => {
    getBranch().then((data) => {
      setBranches(data.data);
    });
    setValues(initialValues);
    resetForm();
    if (props.id) {
      getUserById(props.id).then((data) => {
        setValues({ ...data.data, employee: data.data?.employee?._id, branch: data.data?.branch?._id });
        getLoginNotCreatedEmployee().then((employee) => {
          const employees = [...employee.data];
          if (data.data.employee && !employees.find((e) => e._id === data.data.employee._id)) {
            employees.push(data.data.employee);
          }
          setEmloyees(employees.filter((e) => e?._id));
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
                onChange={handleChange}
              >
                {global.userTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
            </Select>
            </FormControl>
          </Grid>
          {['branch', 'assistant_branch_manager', 'branch_executive'].includes(values.userType) ? (
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={touched.branch && errors.branch && true}>
                <InputLabel id="select-label">Select branch</InputLabel>
                <Select
                  labelId="select-label"
                  id="select"
                  label={touched.branch && errors.branch ? errors.branch : 'Select branch'}
                  name="branch"
                  value={values.branch}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {branches.map((e) => (
                    <MenuItem value={e._id} key={e._id}>
                      {e.branchId} {e.branchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="username"
                  value={values.username}
                  error={touched.username && errors.username && true}
                  label={touched.username && errors.username ? errors.username : 'Username'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="password"
                  value={values.password}
                  error={touched.password && errors.password && true}
                  label={touched.password && errors.password ? errors.password : 'Password'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
            </>
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
                {employees.map((e) => (
                  <MenuItem value={e._id}>
                    {e.employeeId} {e.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

export default UpdateUser;
