import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
// @mui
import {
  Backdrop,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  Modal,
  Paper,
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
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
// components
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { ListHead, ListToolbar } from '../../sections/@dashboard/ornament';
// mock
import { getLatestPrint, getOrnament, updateOrnament } from '../../apis/branch/ornament';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: '', label: '#', alignRight: false },
  { id: 'branchName', label: 'Branch Name', alignRight: false },
  { id: 'ornamentType', label: 'Ornament Type', alignRight: false },
  { id: 'quantity', label: 'Quantity', alignRight: false },
  { id: 'grossWeight', label: 'Gross Weight', alignRight: false },
  { id: 'stoneWeight', label: 'Stone Weight', alignRight: false },
  { id: 'netWeight', label: 'Net Weight', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
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
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (row) => row?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function Ornament() {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [filterOpen, setFilterOpen] = useState(null);
  const [selected, setSelected] = useState([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseMoveModal = () => setOpenDeleteModal(false);
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

  const { handleSubmit, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      getOrnament({
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD"),
        },
        branch: branch._id,
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
      if (!query.branch) query.branch = branch._id;
      getOrnament(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [branch._id, values.fromDate, values.toDate]
  );

  useEffect(() => {
    setBranch(auth.user?.branch || {});
    fetchData({
      createdAt: {
        $gte: values.fromDate ?? moment()?.format("YYYY-MM-DD"),
        $lte: values.toDate ?? moment()?.format("YYYY-MM-DD"),
      },
      branch: auth.user.branch._id,
    });
  }, [auth.user.branch, values.fromDate, values.toDate, fetchData]);

  const handleMoveSelected = () => {
    updateOrnament({ id: selected, status: 'moved' }).then(() => {
      fetchData();
      handleCloseMoveModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Ornament moved',
        severity: 'success',
      });
    });
  };

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

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleClick = (event, _id) => {
    const selectedIndex = selected.indexOf(_id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, _id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData.length && !!filterName;

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon={'material-symbols:print'} />}
              onClick={() => {
                setToggleContainer(!toggleContainer);
              }}
            >
              Print Latest Report
            </Button>
          </Stack>
        </Stack>

        <p style={{ color: '#fff' }}>
          From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date:{' '}
          {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}
        </p>

        <Card>
          <ListToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              handleOpenDeleteModal();
            }}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data.length}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const {
                      _id,
                      branchName,
                      ornamentType,
                      quantity,
                      grossWeight,
                      stoneWeight,
                      netWeight,
                      netAmount,
                      status,
                    } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedData}
                            onChange={(event) => handleClick(event, _id)}
                            disabled={status?.toLowerCase() === 'moved'}
                          />
                        </TableCell>
                        <TableCell align="left">{branchName}</TableCell>
                        <TableCell align="left">{ornamentType}</TableCell>
                        <TableCell align="left">{quantity}</TableCell>
                        <TableCell align="left">{grossWeight}</TableCell>
                        <TableCell align="left">{stoneWeight}</TableCell>
                        <TableCell align="left">{netWeight}</TableCell>
                        <TableCell align="left">{netAmount}</TableCell>
                        <TableCell align="left">{sentenceCase(status ?? '')}</TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={11} />
                    </TableRow>
                  )}
                  {filteredData.length === 0 && (
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

                {filteredData.length > 0 && isNotFound && (
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
            count={data.length}
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

        <Print data={{ branch: branch._id }} />
      </Container>

      <Modal
        open={openDeleteModal}
        onClose={handleCloseMoveModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Move
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 3 }}>
            Do you want to Move?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button
              variant="contained"
              onClick={() => {
                handleMoveSelected();
              }}
            >
              Move
            </Button>
            <Button variant="contained" onClick={handleCloseMoveModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

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
    getLatestPrint(data).then((res) => {
      if (res && res.status) {
        setOrnament(res.data || []);
      }
    });
  }, [data]);

  Print.propTypes = {
    data: PropTypes.object,
  };

  const firstEntry = ornament?.[0];

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
            MK Gold Company, {firstEntry?.branch?.branchName ?? ''}
            <br /> {firstEntry?.branch?.address?.city ?? ''}, {firstEntry?.branch?.address?.state ?? ''} -{' '}
            {firstEntry?.branch?.address?.pincode ?? ''}, {firstEntry?.branch?.address?.landmark ?? ''}
          </span>
          <br />
          <br />
          <div style={{ display: 'block', margin: '20px 0' }}>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>
                    <b>GST:</b> {firstEntry?.branch?.gstNumber ?? ''}
                  </td>
                  <td style={{ width: '50%', textAlign: 'right' }}>
                    <b>Date:</b> {firstEntry?.movedAt ? moment(firstEntry?.movedAt).format('DD MMM, YYYY') : ''}
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
