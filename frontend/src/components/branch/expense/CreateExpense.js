import {
  TextField,
  Card,
  Grid,
  Typography,
  Button,
  Stack,
  IconButton,
  MenuItem,
  Box,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useEffect, useState, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { createExpense, getTodayBills } from '../../../apis/branch/expense';
import { getBranch } from '../../../apis/branch/branch';
import { getEmployee } from '../../../apis/branch/employee';
import { createFile } from '../../../apis/branch/fileupload';
import Iconify from '../../../components/iconify';

const EXPENSE_TYPES = [
  'Fuel',
  'Sales Incentive',
  'Purchases',
  'Service and Maintenance',
  'Others',
];

function CreateExpense(props) {
  const auth = useSelector((state) => state.auth);
  const form = useRef();
  const [branch, setBranch] = useState({});
  const [employees, setEmployees] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [loading, setLoading] = useState(false);

  // File states
  const [openingProofFile, setOpeningProofFile] = useState(null);
  const [closingProofFile, setClosingProofFile] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const userBranch = auth.user?.branch || {};
    setBranch(userBranch);

    const bId = userBranch?._id || userBranch;
    if (bId) {
      getEmployee({ branch: bId }).then((res) => {
        if (res?.status) setEmployees(res.data || []);
      });
    }
  }, [auth.user?.branch]);

  const fetchTodayBills = (branchId) => {
    const bId = branchId || branch?._id || branch;
    if (!bId) {
      setTodayBills([]);
      return;
    }
    setLoadingBills(true);
    getTodayBills(bId).then((res) => {
      setLoadingBills(false);
      if (res?.status) {
        setTodayBills(res.data || []);
      } else {
        setTodayBills([]);
      }
    }).catch(() => {
      setLoadingBills(false);
      setTodayBills([]);
    });
  };

  // Validation Schema dynamic per type
  const validationSchema = Yup.object().shape({
    type: Yup.string().required('Expense Type is required'),
    amount: Yup.number().typeError('Amount must be a number').positive('Amount must be positive').required('Amount is required'),
    note: Yup.string().required('Note is required'),
    otherTypeName: Yup.string().when('type', {
      is: 'Others',
      then: (schema) => schema.required('Please specify the expense type / name'),
      otherwise: (schema) => schema.notRequired(),
    }),
    openingRead: Yup.number().typeError('Must be a number').when('type', {
      is: 'Fuel',
      then: (schema) => schema.required('Opening reading is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    closingRead: Yup.number().typeError('Must be a number').when('type', {
      is: 'Fuel',
      then: (schema) =>
        schema
          .required('Closing reading is required')
          .test('is-greater', 'Closing reading must be >= opening reading', function (val) {
            const { openingRead } = this.parent;
            if (val != null && openingRead != null) {
              return Number(val) >= Number(openingRead);
            }
            return true;
          }),
      otherwise: (schema) => schema.notRequired(),
    }),
    bill: Yup.string().when('type', {
      is: 'Sales Incentive',
      then: (schema) => schema.required("Please select today's bill"),
      otherwise: (schema) => schema.notRequired(),
    }),
    employee: Yup.string().when('type', {
      is: 'Sales Incentive',
      then: (schema) => schema.required('Please select an employee'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const {
    handleSubmit,
    handleChange,
    handleBlur,
    values,
    touched,
    errors,
    setFieldValue,
    resetForm,
  } = useFormik({
    initialValues: {
      type: '',
      otherTypeName: '',
      amount: '',
      note: '',
      openingRead: '',
      closingRead: '',
      bill: '',
      employee: '',
    },
    validationSchema,
    onSubmit: async (formValues) => {
      setLoading(true);

      const bId = branch?._id || branch;
      const payload = {
        ...formValues,
        status: 'pending',
      };

      // Clean empty fields
      if (!payload.bill) delete payload.bill;
      if (!payload.employee) delete payload.employee;
      if (!payload.openingRead && payload.openingRead !== 0) delete payload.openingRead;
      if (!payload.closingRead && payload.closingRead !== 0) delete payload.closingRead;
      if (!payload.otherTypeName) delete payload.otherTypeName;
      if (!['Sales Incentive', 'Purchases', 'Service and Maintenance'].includes(payload.type)) {
        delete payload.branch;
      }

      try {
        const createRes = await createExpense(payload);
        if (!createRes?.status) {
          let errorMsg = 'Expense not created';
          if (typeof createRes?.message === 'string') {
            errorMsg = createRes.message;
          } else if (createRes?.message && typeof createRes.message === 'object') {
            errorMsg = Object.values(createRes.message).map(e => e?.message || String(e)).join(', ');
          }
          props.setNotify({
            open: true,
            message: errorMsg,
            severity: 'error',
          });
          setLoading(false);
          return;
        }

        const uploadId =
          createRes.data?.fileUpload?.uploadId ||
          createRes.data?.data?._id ||
          createRes.data?._id ||
          createRes._id;

        // Upload dedicated proof files and generic attachments
        const uploadQueue = [];

        if (openingProofFile) {
          const fd = new FormData();
          fd.append('uploadId', uploadId);
          fd.append('uploadName', 'expense');
          fd.append('uploadType', 'openingProof');
          fd.append('uploadedFile', openingProofFile);
          uploadQueue.push(createFile(fd));
        }

        if (closingProofFile) {
          const fd = new FormData();
          fd.append('uploadId', uploadId);
          fd.append('uploadName', 'expense');
          fd.append('uploadType', 'closingProof');
          fd.append('uploadedFile', closingProofFile);
          uploadQueue.push(createFile(fd));
        }

        if (proofFile) {
          const fd = new FormData();
          fd.append('uploadId', uploadId);
          fd.append('uploadName', 'expense');
          fd.append('uploadType', 'proof');
          fd.append('uploadedFile', proofFile);
          uploadQueue.push(createFile(fd));
        }

        if (attachments && attachments.length > 0) {
          attachments.forEach((file) => {
            const fd = new FormData();
            fd.append('uploadId', uploadId);
            fd.append('uploadName', 'expense');
            fd.append('uploadType', 'attachment');
            fd.append('uploadedFile', file);
            uploadQueue.push(createFile(fd));
          });
        }

        if (uploadQueue.length > 0) {
          await Promise.all(uploadQueue);
        }

        finishSubmit();
      } catch (err) {
        console.error('Error submitting expense:', err);
        props.setNotify({
          open: true,
          message: 'Expense submitted for Finance approval',
          severity: 'info',
        });
        finishSubmit();
      }
    },
  });

  const finishSubmit = () => {
    setLoading(false);
    props.setToggleContainer(false);
    resetForm();
    setOpeningProofFile(null);
    setClosingProofFile(null);
    setProofFile(null);
    setAttachments([]);
    props.setNotify({
      open: true,
      message: 'Expense submitted (Pending Finance Approval)',
      severity: 'success',
    });
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    handleChange(e);
    if (newType === 'Sales Incentive') {
      fetchTodayBills();
    }
  };

  const handleBillSelect = (e) => {
    const selectedBillId = e.target.value;
    setFieldValue('bill', selectedBillId);
    const billObj = todayBills.find((b) => b._id === selectedBillId);
    if (billObj?.employee?._id || billObj?.employee) {
      const empId = billObj.employee?._id || billObj.employee;
      setFieldValue('employee', String(empId));
    }
  };

  const showBranch = ['Sales Incentive', 'Purchases', 'Service and Maintenance'].includes(values.type);

  const calculatedOverallRead =
    values.type === 'Fuel' && values.closingRead !== '' && values.openingRead !== ''
      ? Math.max(0, Number(values.closingRead) - Number(values.openingRead))
      : 0;

  return (
    <Card sx={{ p: 4, my: 4, bgcolor: '#ffffff', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#333' }}>
        Create Expense
      </Typography>

      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        autoComplete="off"
      >
        <Grid container spacing={3}>
          {/* First: Expense Type Dropdown (Always shown) */}
          <Grid item xs={12} sm={showBranch ? 4 : values.type === 'Others' ? 4 : 6}>
            <TextField
              select
              name="type"
              value={values.type}
              error={Boolean(touched.type && errors.type)}
              helperText={touched.type && errors.type}
              label="Expense Type *"
              fullWidth
              onBlur={handleBlur}
              onChange={handleTypeChange}
            >
              {EXPENSE_TYPES.map((typeOption) => (
                <MenuItem key={typeOption} value={typeOption}>
                  {typeOption}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Branch Field: Shown ONLY according to type */}
          {showBranch && (
            <Grid item xs={12} sm={values.type === 'Sales Incentive' ? 4 : 8}>
              <TextField
                label="Branch"
                value={branch?.branchName || 'Current Branch'}
                disabled
                fullWidth
              />
            </Grid>
          )}

          {/* When Type === 'Others': Typing field */}
          {values.type === 'Others' && (
            <Grid item xs={12} sm={8}>
              <TextField
                name="otherTypeName"
                value={values.otherTypeName}
                error={Boolean(touched.otherTypeName && errors.otherTypeName)}
                helperText={touched.otherTypeName && errors.otherTypeName}
                label="Specify Expense Name / Type *"
                placeholder="e.g. Courier, Tea & Snacks, Printing"
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
          )}

          {/* When Type === 'Sales Incentive': Today's Bills and Employee Selection */}
          {values.type === 'Sales Incentive' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  name="bill"
                  value={values.bill}
                  error={Boolean(touched.bill && errors.bill)}
                  helperText={
                    (touched.bill && errors.bill) ||
                    (todayBills.length === 0
                      ? loadingBills
                        ? 'Loading today bills...'
                        : 'No bills found for today'
                      : '')
                  }
                  label="Choose Bill (Today's Bills Only) *"
                  fullWidth
                  disabled={loadingBills}
                  onBlur={handleBlur}
                  onChange={handleBillSelect}
                >
                  {todayBills?.map((bill) => (
                    <MenuItem key={bill._id} value={bill._id}>
                      {bill.billId} {bill.grossAmount ? `(₹${bill.grossAmount.toLocaleString()})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  name="employee"
                  value={values.employee}
                  error={Boolean(touched.employee && errors.employee)}
                  helperText={touched.employee && errors.employee}
                  label="Choose Employee *"
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  {employees?.map((emp) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId || 'N/A'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}

          {/* When Type === 'Fuel': Opening, Closing & Overall Reading */}
          {values.type === 'Fuel' && (
            <>
              <Grid item xs={12} sm={4}>
                <TextField
                  type="number"
                  name="openingRead"
                  value={values.openingRead}
                  error={Boolean(touched.openingRead && errors.openingRead)}
                  helperText={touched.openingRead && errors.openingRead}
                  label="Opening Read (Odometer) *"
                  placeholder="e.g. 15420"
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  type="number"
                  name="closingRead"
                  value={values.closingRead}
                  error={Boolean(touched.closingRead && errors.closingRead)}
                  helperText={touched.closingRead && errors.closingRead}
                  label="Closing Read (Odometer) *"
                  placeholder="e.g. 15550"
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.8,
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderColor: '#cbd5e1',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Overall Read (Auto-Calculated):
                  </Typography>
                  <Chip
                    label={`${calculatedOverallRead} km`}
                    color="primary"
                    sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}
                  />
                </Paper>
              </Grid>

              {/* Fuel Specific Proof Uploads */}
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Opening Odometer Proof (Photo)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="branch-fuel-opening-proof"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setOpeningProofFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="branch-fuel-opening-proof">
                      <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:camera" />}>
                        {openingProofFile ? 'Change Photo' : 'Upload Start Reading'}
                      </Button>
                    </label>
                    {openingProofFile && (
                      <Chip
                        label={openingProofFile.name}
                        onDelete={() => setOpeningProofFile(null)}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Closing Odometer Proof (Photo)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="branch-fuel-closing-proof"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setClosingProofFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="branch-fuel-closing-proof">
                      <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:camera" />}>
                        {closingProofFile ? 'Change Photo' : 'Upload End Reading'}
                      </Button>
                    </label>
                    {closingProofFile && (
                      <Chip
                        label={closingProofFile.name}
                        onDelete={() => setClosingProofFile(null)}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </>
          )}

          {/* Amount Field (shown once a type is selected, or if any type) */}
          {values.type && (
            <>
              <Grid item xs={12} sm={values.type === 'Sales Incentive' ? 6 : 4}>
                <TextField
                  type="number"
                  name="amount"
                  value={values.amount}
                  error={Boolean(touched.amount && errors.amount)}
                  helperText={touched.amount && errors.amount}
                  label="Amount (₹) *"
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              {/* Note Field */}
              <Grid item xs={12} sm={values.type === 'Sales Incentive' ? 12 : 8}>
                <TextField
                  name="note"
                  value={values.note}
                  error={Boolean(touched.note && errors.note)}
                  helperText={touched.note && errors.note}
                  label="Notes / Remarks *"
                  placeholder="Provide expense description or justification"
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>

              {/* Proof Upload (Main Bill / Receipt) */}
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    {values.type === 'Fuel'
                      ? 'Fuel Bill / Receipt Proof'
                      : values.type === 'Sales Incentive'
                      ? 'Incentive Proof / Voucher'
                      : 'Bill / Receipt / Proof'}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="branch-expense-main-proof"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProofFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="branch-expense-main-proof">
                      <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:file-document-outline" />}>
                        {proofFile ? 'Change File' : 'Upload Proof'}
                      </Button>
                    </label>
                    {proofFile && (
                      <Chip
                        label={proofFile.name}
                        onDelete={() => setProofFile(null)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>
                </Paper>
              </Grid>

              {/* Additional Attachments */}
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Additional Attachments (Optional)
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <input
                      type="file"
                      multiple
                      id="branch-expense-extra-attachments"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setAttachments((prev) => [...prev, ...files]);
                      }}
                    />
                    <label htmlFor="branch-expense-extra-attachments">
                      <Button variant="outlined" component="span" startIcon={<Iconify icon="mdi:paperclip" />}>
                        Choose Files
                      </Button>
                    </label>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {attachments.length} additional file(s)
                    </Typography>
                  </Stack>
                  {attachments.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mt: 1 }}>
                      {attachments.map((file, idx) => (
                        <Chip
                          key={idx}
                          label={file.name}
                          onDelete={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          size="small"
                        />
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              {/* Submit Actions */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ mt: 2 }}>
                  <LoadingButton
                    size="large"
                    type="submit"
                    variant="contained"
                    loading={loading}
                    sx={{
                      bgcolor: '#FFD700',
                      color: '#000',
                      fontWeight: 700,
                      '&:hover': { bgcolor: '#FFC700' },
                      px: 4,
                    }}
                  >
                    Submit Expense
                  </LoadingButton>
                  <Button
                    size="large"
                    variant="outlined"
                    onClick={() => {
                      props.setToggleContainer(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Grid>
            </>
          )}
        </Grid>
      </form>
    </Card>
  );
}

CreateExpense.propTypes = {
  setToggleContainer: PropTypes.func,
  setNotify: PropTypes.func,
  id: PropTypes.string,
};

export default CreateExpense;
