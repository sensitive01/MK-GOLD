import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
// @mui
import {
    Backdrop,
    Button,
    Card,
    CircularProgress,
    Container,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import moment from 'moment';
import * as Yup from 'yup';
// components
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { ListHead, ListToolbar } from '../../sections/@dashboard/balancesheet';
// mock
import { getBalancesheet } from '../../apis/admin/balancesheet';
import { getBranch } from '../../apis/admin/branch';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'branchName', label: 'Branch Name', alignRight: false },
  { id: 'date', label: 'Date', alignRight: false },
  { id: 'openingBalance', label: 'Opening Balance', alignRight: false },
  { id: 'fundRequested', label: 'Funds requested', alignRight: false },
  { id: 'fundTransferred', label: 'Funds transferred', alignRight: false },
  { id: 'fundReceived', label: 'Fund Received', alignRight: false },
  { id: 'totalExpense', label: 'Expenses', alignRight: false },
  { id: 'totalSale', label: 'Sales', alignRight: false },
  { id: 'closingBalance', label: 'Closing cash', alignRight: false },
  { id: '' },
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array?.map((el, index) => [el, index]) || [];
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (row) => row.branchName?.toLowerCase()?.indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Balancesheet() {
  const [branches, setBranches] = useState([]);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [filterOpen, setFilterOpen] = useState(null);
  const form = useRef();

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form validation
  const schema = Yup.object({
    fromDate: Yup.string().required('From date is required'),
    toDate: Yup.string().required('To date is required'),
  });

  const { handleSubmit, handleBlur, handleChange, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
      branch: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      getBalancesheet({
        fromDate: values.fromDate?.format("YYYY-MM-DD"),
        toDate: values.toDate?.format("YYYY-MM-DD"),
        branch: values.branch,
      }).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
      setFilterOpen(false);
    },
  });

  const fetchData = useCallback(
    (
      query = {
        fromDate: values.fromDate ?? moment()?.format("YYYY-MM-DD"),
        toDate: values.toDate ?? moment()?.format("YYYY-MM-DD"),
      }
    ) => {
      getBalancesheet(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [values.fromDate, values.toDate]
  );

  useEffect(() => {
    getBranch().then((data) => {
      setBranches(data.data);
    });
    fetchData();
  }, [fetchData]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData?.length && !!filterName;

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  return (
    <>
      <Helmet>
        <title> Balancesheet | MK Gold </title>
      </Helmet>

      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={notify.open}
        onClose={() => {
          setNotify({ ...notify, open: false });
        }}
        autoHideDuration={3000}
      >
        <Alert
          onClose={() => {
            setNotify({ ...notify, open: false });
          }}
          severity={notify.severity}
          sx={{ width: '100%', color: 'white' }}
        >
          {notify.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Balancesheet
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        <p style={{ color: '#fff' }}>
          From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date:{' '}
          {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}, Branch:{' '}
          {branches?.find((e) => e._id === values.branch)?.branchName}
        </p>

        <Card>
          <ListToolbar filterName={filterName} onFilterName={handleFilterByName} />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ListHead order={order} orderBy={orderBy} headLabel={TABLE_HEAD} onRequestSort={handleRequestSort} />
                <TableBody>
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => {
                    const {
                      _id,
                      branchName,
                      date,
                      openingBalance,
                      fundRequested,
                      fundTransferred,
                      fundReceived,
                      totalExpense,
                      totalSale,
                      closingBalance,
                    } = row;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox">
                        <TableCell align="left">{sentenceCase(branchName ?? '')}</TableCell>
                        <TableCell align="left">{moment(date).format('YYYY-MM-DD')}</TableCell>
                        <TableCell align="left">{openingBalance}</TableCell>
                        <TableCell align="left">{fundRequested}</TableCell>
                        <TableCell align="left">{fundTransferred}</TableCell>
                        <TableCell align="left">{fundReceived}</TableCell>
                        <TableCell align="left">{totalExpense}</TableCell>
                        <TableCell align="left">{totalSale}</TableCell>
                        <TableCell align="left">{closingBalance}</TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={11} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography paragraph>No data in table</Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>

                {filteredData?.length > 0 && isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={11} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>

                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>&quot;{filterName}&quot;</strong>.
                            <br /> Try checking for typos or using complete words.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      <Dialog open={filterOpen} onClose={handleFilterClose}>
        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          autoComplete="off"
        >
          <DialogTitle>Filter</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ p: 1 }}>
              <Grid item xs={12} sm={6}>
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
                    {branches?.map((e) => (
                      <MenuItem key={e._id} value={e._id}>
                        {e.branchId} {e.branchName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl sx={{ minWidth: 120 }}>
                  <LocalizationProvider dateAdapter={AdapterMoment} error={touched.fromDate && errors.fromDate && true}>
                    <DesktopDatePicker
                      label={touched.fromDate && errors.fromDate ? errors.fromDate : 'From Date'}
                      inputFormat="MM/DD/YYYY"
                      name="fromDate"
                      value={values.fromDate}
                      onChange={(value) => {
                        setFieldValue('fromDate', value, true);
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl sx={{ minWidth: 120 }}>
                  <LocalizationProvider dateAdapter={AdapterMoment} error={touched.toDate && errors.toDate && true}>
                    <DesktopDatePicker
                      label={touched.toDate && errors.toDate ? errors.toDate : 'To Date'}
                      inputFormat="MM/DD/YYYY"
                      name="toDate"
                      value={values.toDate}
                      onChange={(value) => {
                        setFieldValue('toDate', value, true);
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setFilterOpen(false);
                resetForm();
                fetchData({
                  fromDate: moment()?.format("YYYY-MM-DD"),
                  toDate: moment()?.format("YYYY-MM-DD"),
                });
              }}
            >
              Clear
            </Button>
            <Button variant="contained" onClick={handleFilterClose}>
              Close
            </Button>
            <Button variant="contained" type="submit">
              Filter
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}




