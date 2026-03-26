import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback } from 'react';
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
    IconButton,
    MenuItem,
    Modal,
    Paper,
    Popover,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { useSelector } from 'react-redux';
// components
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
// sections
import { ReleaseListHead, ReleaseListToolbar } from '../../sections/@dashboard/release';
// mock
import { deleteReleaseById, findRelease, updateRelease, getReleaseById } from '../../apis/branch/release';
import global from '../../utils/global';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import PropTypes from 'prop-types';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'pledgeId', label: 'Pledge Id', alignRight: false },
  { id: 'pledgedIn', label: 'Pledged In', alignRight: false },
  { id: 'weight', label: 'Weight', alignRight: false },
  { id: 'pledgeAmount', label: 'Pledge Amount', alignRight: false },
  { id: 'pledgedDate', label: 'Pledged Date', alignRight: false },
  { id: 'payableAmount', label: 'Payable Amount', alignRight: false },
  { id: 'paymentType', label: 'Payment Type', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
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
    return filter(array, (row) => row?.branch?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Release() {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const handleOpenEditModal = () => setOpenEditModal(true);
  const handleCloseEditModal = () => setOpenEditModal(false);
  const [deleteType, setDeleteType] = useState('single');
  const userType = auth.user?.userType;
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    (
      query = {
        createdAt: {
          $gte: moment()?.format("YYYY-MM-DD"),
          $lte: moment()?.format("YYYY-MM-DD"),
        },
      }
    ) => {
      if (!query.branch) query.branch = branch._id;
      findRelease(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [branch._id]
  );

  useEffect(() => {
    setBranch(auth.user.branch);
    fetchData({
      createdAt: {
        $gte: moment()?.format("YYYY-MM-DD"),
        $lte: moment()?.format("YYYY-MM-DD"),
      },
      branch: auth.user.branch._id,
    });
  }, [auth.user.branch, fetchData]);

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = data?.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, _id) => {
    const selectedIndex = selected.indexOf(_id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, _id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected?.slice(1));
    } else if (selectedIndex === selected?.length - 1) {
      newSelected = newSelected.concat(selected?.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected?.slice(0, selectedIndex), selected?.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData?.length && !!filterName;

  const handleDelete = () => {
    deleteReleaseById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
    });
  };

  const handleDeleteSelected = () => {
    deleteReleaseById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Release deleted',
        severity: 'success',
      });
    });
  };

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

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  function Status(props) {
    const userType = useSelector((state) => state.auth.user?.userType?.toLowerCase());
    const isPrivileged = userType === 'admin' || userType === 'subadmin';

    if (props.status !== 'pending') {
      return (
        <Stack direction="column" spacing={0.5}>
          <Label
            color={(props.status === 'approved' && 'success') || (props.status === 'rejected' && 'error') || 'warning'}
          >
            {sentenceCase(props.status)}
          </Label>
          {props.actionBy && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', minWidth: 120 }}>
              By: {props.actionBy.name} ({props.actionBy.employeeId})<br />
              At: {moment(props.actionAt).format('YYYY-MM-DD HH:mm:ss')}
            </Typography>
          )}
          {isPrivileged && (
            <Button
              size="small"
              color="inherit"
              variant="outlined"
              sx={{ fontSize: '0.65rem', py: 0 }}
              onClick={() => {
                updateRelease(props._id, { status: 'pending' }).then(() => fetchData());
              }}
            >
              Revoke
            </Button>
          )}
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark',
            },
          }}
          onClick={() => {
            updateRelease(props._id, { status: 'approved' }).then(() => {
              fetchData();
            });
          }}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          size="small"
          color="error"
          startIcon={<Iconify icon="eva:close-circle-fill" />}
          onClick={() => {
            updateRelease(props._id, { status: 'rejected' }).then(() => {
              fetchData();
            });
          }}
        >
          Reject
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Helmet>
        <title> Release | MK Gold </title>
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
            Release
          </Typography>
        </Stack>

        <Card>
          <ReleaseListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ReleaseListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data?.length || 0}
                  numSelected={selected?.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => {
                    const {
                      _id,
                      pledgeId,
                      pledgedIn,
                      weight,
                      pledgeAmount,
                      pledgedDate,
                      payableAmount,
                      paymentType,
                      status,
                      createdAt,
                    } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                        </TableCell>
                        <TableCell align="left">{pledgeId}</TableCell>
                        <TableCell align="left">{sentenceCase(pledgedIn)}</TableCell>
                        <TableCell align="left">{weight}</TableCell>
                        <TableCell align="left">{pledgeAmount}</TableCell>
                        <TableCell align="left">{moment(pledgedDate).format('YYYY-MM-DD')}</TableCell>
                        <TableCell align="left">{payableAmount}</TableCell>
                        <TableCell align="left">{sentenceCase(paymentType)}</TableCell>
                        <TableCell align="left">
                          <Status status={status} _id={_id} actionBy={row.actionBy} actionAt={row.actionAt} />
                        </TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="large"
                            color="inherit"
                            onClick={(e) => {
                              setOpenId(_id);
                              handleOpenMenu(e);
                            }}
                          >
                            <Iconify icon={'eva:more-vertical-fill'} />
                          </IconButton>
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

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 1,
            width: 140,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setOpen(null);
            handleOpenEditModal();
          }}
        >
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
        </MenuItem>
        {global.canDelete(userType) && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              setOpen(null);
              setDeleteType('single');
              handleOpenDeleteModal();
            }}
          >
            <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        )}
      </Popover>

      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Delete
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 3 }}>
            Do you want to delete?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (deleteType === 'single') {
                  handleDelete();
                } else {
                  handleDeleteSelected();
                }
              }}
            >
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

      <EditReleaseModal open={openEditModal} id={openId} handleClose={handleCloseEditModal} fetchData={fetchData} />

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

function EditReleaseModal({ open, id, handleClose, fetchData }) {
  const [loading, setLoading] = useState(false);
  const schema = Yup.object({
    pledgeId: Yup.string().required('Pledge Id is required'),
    pledgeAmount: Yup.number().required('Pledge Amount is required'),
    payableAmount: Yup.number().required('Payable Amount is required'),
    pledgedDate: Yup.date().required('Pledged Date is required'),
    releaseDate: Yup.date().required('Release Date is required'),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue } = useFormik({
    initialValues: {
      pledgeId: '',
      pledgeAmount: '',
      payableAmount: '',
      pledgedDate: moment(),
      releaseDate: moment(),
      paymentType: '',
      pledgedIn: '',
      pledgedBranch: '',
      comments: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setLoading(true);
      updateRelease(id, values).then((data) => {
        setLoading(false);
        if (data.status) {
          handleClose();
          fetchData();
        }
      });
    },
  });

  useEffect(() => {
    if (id && open) {
      getReleaseById(id).then((data) => {
        if (data.status) {
          const release = data.data;
          setValues({
            pledgeId: release.pledgeId,
            pledgeAmount: release.pledgeAmount,
            payableAmount: release.payableAmount,
            pledgedDate: moment(release.pledgedDate),
            releaseDate: moment(release.releaseDate),
            paymentType: release.paymentType,
            pledgedIn: release.pledgedIn,
            pledgedBranch: release.pledgedBranch,
            comments: release.comments,
          });
        }
      });
    }
  }, [id, open, setValues]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Release</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgeId"
                label="Pledge Id"
                value={values.pledgeId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.pledgeId && !!errors.pledgeId}
                helperText={touched.pledgeId && errors.pledgeId}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgeAmount"
                label="Pledge Amount"
                type="number"
                value={values.pledgeAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.pledgeAmount && !!errors.pledgeAmount}
                helperText={touched.pledgeAmount && errors.pledgeAmount}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="payableAmount"
                label="Payable Amount"
                type="number"
                value={values.payableAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.payableAmount && !!errors.payableAmount}
                helperText={touched.payableAmount && errors.payableAmount}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Type</InputLabel>
                <Select name="paymentType" value={values.paymentType} onChange={handleChange} label="Payment Type">
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank">Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="Pledged Date"
                  inputFormat="MM/DD/YYYY"
                  value={values.pledgedDate}
                  onChange={(v) => setFieldValue('pledgedDate', v)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="Release Date"
                  inputFormat="MM/DD/YYYY"
                  value={values.releaseDate}
                  onChange={(v) => setFieldValue('releaseDate', v)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgedIn"
                label="Pledged In"
                value={values.pledgedIn}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgedBranch"
                label="Pledged Branch"
                value={values.pledgedBranch}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments"
                value={values.comments}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading} sx={{ color: '#fff' }}>
            Save Improvements
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditReleaseModal.propTypes = {
  open: PropTypes.bool,
  id: PropTypes.string,
  handleClose: PropTypes.func,
  fetchData: PropTypes.func,
};





