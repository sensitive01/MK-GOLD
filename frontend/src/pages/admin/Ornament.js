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
    FormControl,
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
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import moment from 'moment';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
// components
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { ListHead } from '../../sections/@dashboard/ornament';
// mock
import { getBranch } from '../../apis/admin/branch';
import { getOrnament, groupByBranchAndMovedAt, updateOrnament } from '../../apis/admin/ornament';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: '', label: '#', alignRight: false },
  { id: 'branchName', label: 'Branch Name', alignRight: false },
  { id: 'quantity', label: 'Quantity', alignRight: false },
  { id: 'grossWeight', label: 'Gross Weight', alignRight: false },
  { id: 'stoneWeight', label: 'Stone Weight', alignRight: false },
  { id: 'netWeight', label: 'Net Weight', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'movedAt', label: 'MovedAt', alignRight: false },
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
    return filter(array, (row) => row?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Ornament() {
  const [branches, setBranches] = useState([]);
  const [openData, setOpenData] = useState({});
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [toggleContainer, setToggleContainer] = useState(false);
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

  const { handleBlur, handleChange, handleSubmit, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
      branch: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      groupByBranchAndMovedAt({
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD"),
        },
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
        createdAt: {
          $gte: values.fromDate ?? moment()?.format("YYYY-MM-DD"),
          $lte: values.toDate ?? moment()?.format("YYYY-MM-DD"),
        },
      }
    ) => {
      groupByBranchAndMovedAt(query).then((data) => {
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

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData?.length && !!filterName;

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  function Status({ id, st }) {
    const [status, setStatus] = useState(st);
    return status === 'received' ? (
      <span>{sentenceCase(status)}</span>
    ) : (
      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <Select
          value={status}
          onChange={(e) => {
            if (window.confirm('Do you want to change the status?')) {
              setStatus(e.target.value);
              updateOrnament({
                id,
                status: e.target.value,
              }).then(() => {
                setNotify({
                  open: true,
                  message: 'Status Updated Successfully!',
                  severity: 'success',
                });
              });
            }
          }}
        >
          <MenuItem value="hold" selected={status === 'hold'}>
            Hold
          </MenuItem>
          <MenuItem value="moved" selected={status === 'moved'}>
            Moved
          </MenuItem>
          <MenuItem value="received" selected={status === 'received'}>
            Received
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  Status.propTypes = {
    id: PropTypes.array,
    st: PropTypes.string,
  };

  return (
    <>
      <Helmet>
        <title> Move Gold | MK Gold </title>
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

      <Container maxWidth="xl" sx={{ display: toggleContainer === true ? 'none' : 'block' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Move Gold
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
            onClick={handleFilterOpen}
          >
            Filter
          </Button>
        </Stack>

        <p style={{ color: '#fff' }}>
          From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date:{' '}
          {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}, Branch:{' '}
          {branches?.find((e) => e._id === values.branch)?.branchName}
        </p>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data?.length || 0}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row, index) => {
                    const {
                      ids,
                      branch,
                      branchName,
                      quantity,
                      grossWeight,
                      stoneWeight,
                      netWeight,
                      netAmount,
                      status,
                      movedAt,
                    } = row;

                    return (
                      <TableRow hover key={index} tabIndex={-1}>
                        <TableCell align="left">{index + 1 + page * rowsPerPage}</TableCell>
                        <TableCell align="left">{branchName}</TableCell>
                        <TableCell align="left">{quantity}</TableCell>
                        <TableCell align="left">{grossWeight}</TableCell>
                        <TableCell align="left">{stoneWeight}</TableCell>
                        <TableCell align="left">{netWeight}</TableCell>
                        <TableCell align="left">{netAmount}</TableCell>
                        <TableCell align="left">
                          <Status id={ids} st={status} />
                        </TableCell>
                        <TableCell align="left">
                          {movedAt ? moment(movedAt).format('YYYY-MM-DD HH:mm:ss') : ''}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            startIcon={<Iconify icon={'material-symbols:print'} />}
                            onClick={() => {
                              setOpenData({ movedAt, status, branch });
                              setToggleContainer(!toggleContainer);
                            }}
                          >
                            Print
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={11} />
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

      <Container maxWidth="xl" sx={{ display: toggleContainer === true ? 'block' : 'none' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Print Report
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:arrow-left" />}
            onClick={() => {
              setToggleContainer(!toggleContainer);
            }}
          >
            Back
          </Button>
        </Stack>

        <Print data={openData} />
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
                  createdAt: {
                    $gte: moment()?.format("YYYY-MM-DD"),
                    $lte: moment()?.format("YYYY-MM-DD"),
                  },
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

function Print({ data }) {
  const [ornament, setOrnament] = useState([]);

  useEffect(() => {
    getOrnament(data).then((res) => {
      setOrnament(res.data);
    });
  }, [data]);

  Print.propTypes = {
    data: PropTypes.object,
  };

  return (
    <>
      <iframe id="iframe" style={{ display: 'none', height: '0px', width: '0px', position: 'absolute' }} title="pdf" />
      <div id="pdf" style={{ color: 'white' }}>
        <img
          alt="Logo"
          src="/newLogo.jpeg"
          style={{ width: '100px', display: 'block', margin: '20px auto', borderRadius: '50%' }}
        />
        <div style={{ display: 'block', textAlign: 'center', margin: '10px auto' }}>
          <span>
            MK Gold Company, {ornament[0]?.branch?.branchName ?? ''}
            <br /> {ornament[0]?.branch?.address?.city ?? ''}, {ornament[0]?.branch?.address?.state ?? ''} -{' '}
            {ornament[0]?.branch?.address?.pincode ?? ''}, {ornament[0]?.branch?.address?.landmark ?? ''}
          </span>
          <br />
          <br />
          <div style={{ display: 'block', margin: '20px 0' }}>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>
                    <b>GST:</b> {ornament[0]?.branch?.gstNumber ?? ''}
                  </td>
                  <td style={{ width: '50%', textAlign: 'right' }}>
                    <b>Date:</b> {ornament[0]?.movedAt ? moment(ornament[0]?.movedAt).format('DD MMM, YYYY') : ''}
                    <br />
                    <b>Call:</b> 1234567890
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ margin: '30px 0' }}>
          <center style={{ margin: '40px auto' }}>
            <h3>GOLD MOVEMENT DETAILS</h3>
          </center>
          <table
            style={{
              width: '100%',
              textAlign: 'center',
              border: '1px solid white',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  SNo
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Ornament Type
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  GrossWeight
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Stone
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Netweight
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  BillDate
                </th>
                <th
                  style={{
                    border: '1px solid white',
                    padding: '5px',
                  }}
                >
                  MoveDate
                </th>
              </tr>
            </thead>
            <tbody>
              {ornament?.map((e, index) => (
                <tr key={e._id}>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {index}
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.ornamentType}
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.quantity}
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.grossWeight?.toFixed(2)} Gram
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.stoneWeight?.toFixed(2)} Gram
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.netWeight?.toFixed(2)} Gram
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.status}
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.billDate ? moment(e.billDate).format('YYYY-MM-DD') : ''}
                  </td>
                  <td
                    style={{
                      border: '1px solid white',
                      padding: '5px',
                    }}
                  >
                    {e.movedAt ? moment(e.movedAt).format('YYYY-MM-DD') : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <hr style={{ border: '0', borderBottom: '1px solid white' }} />
        <div style={{ display: 'block', margin: '30px 0' }}>
          <table style={{ width: '100%', textAlign: 'left' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <b>Carried By:</b>
                </td>
                <td style={{ width: '50%' }}>
                  <b>Expected Delivery:</b>
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>
                  <b>Designation:</b>
                </td>
                <td style={{ width: '50%' }}>
                  <b>Signature:</b>
                </td>
              </tr>
              <tr>
                <td style={{ width: '50%' }}>
                  <b>Contact:</b>
                </td>
                <td style={{ width: '50%' }} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Button
        variant="contained"
        startIcon={<Iconify icon={'material-symbols:print'} sx={{ mr: 2 }} />}
        onClick={() => {
          const content = document.getElementById('pdf');
          const pri = document.getElementById('iframe').contentWindow;
          pri.document.open();
          pri.document.write(content.innerHTML);
          pri.document.close();
          pri.onload = function onload() {
            pri.focus();
            pri.print();
          };
        }}
      >
        Print
      </Button>
    </>
  );
}





