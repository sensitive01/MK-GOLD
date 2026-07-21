import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Card,
  Table,
  Stack,
  Paper,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Divider,
  Grid,
  FormControl,
  TextField,
  IconButton,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import global from '../../utils/global';
import { getQrEnquiries } from '../../apis/branch/qrEnquiry';
import { ListHead } from '../../sections/@dashboard/report';

const TABLE_HEAD = [
  { id: 'enqID', label: 'Enquiry ID', alignRight: false },
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'phoneNumber', label: 'Phone', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'branch', label: 'Branch', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'grossWeight', label: 'Weight', alignRight: false },
  { id: 'pincode', label: 'Pincode', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'action', label: 'Action', alignRight: true },
];

export default function QREnquiry() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visiblePhoneId, setVisiblePhoneId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const form = useRef();

  // Form validation
  const schema = Yup.object({
    fromDate: Yup.string().required('From date is required'),
    toDate: Yup.string().required('To date is required'),
  });

  const { handleSubmit, handleBlur, handleChange, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
      phoneNumber: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const query = {
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD"),
        }
      };
      if (values.phoneNumber) {
        query.phoneNumber = values.phoneNumber;
      }
      fetchData(query);
      setFilterOpen(false);
    },
  });

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const handleOpenLogModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setOpenLogModal(true);
  };

  const handleCloseLogModal = () => {
    setOpenLogModal(false);
    setSelectedEnquiry(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = (query = {}) => {
    setIsLoading(true);
    getQrEnquiries(query).then((res) => {
      if (res.status) {
        setData(res.data ?? []);
      }
      setIsLoading(false);
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  return (
    <>
      <Helmet>
        <title> QR Enquiries | MK Gold </title>
      </Helmet>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            QR Enquiries (Branch Leads)
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
            onClick={handleFilterOpen}
          >
            Filter
          </Button>
        </Stack>

        {(values.fromDate || values.toDate) && (
          <p style={{ color: '#fff', marginBottom: '20px' }}>
            From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date:{' '}
            {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}
          </p>
        )}

        <Card>
          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <ListHead
                  headLabel={TABLE_HEAD}
                  rowCount={data?.length ?? 0}
                  onRequestSort={() => {}}
                />
                <TableBody>
                  {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const { _id, enqID, name, phoneNumber, email, branch, type, grossWeight, pincode, createdAt } = row;

                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {enqID}
                        </TableCell>
                        <TableCell align="left">{name}</TableCell>
                        <TableCell align="left">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {visiblePhoneId === _id ? phoneNumber : global.maskPhoneNumber(phoneNumber)}
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              setVisiblePhoneId(visiblePhoneId === _id ? null : _id);
                            }} sx={{ ml: 1 }}>
                              <Iconify icon={visiblePhoneId === _id ? 'eva:eye-off-fill' : 'eva:eye-fill'} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="left">{email}</TableCell>
                        <TableCell align="left">{branch?.branchName}</TableCell>
                        <TableCell align="left" sx={{ textTransform: 'capitalize' }}>
                          {type}
                        </TableCell>
                        <TableCell align="left">{grossWeight}g</TableCell>
                        <TableCell align="left">{pincode}</TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenLogModal(row)}
                            startIcon={<Iconify icon="material-symbols:history" />}
                          >
                            Logs
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(data?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No enquiries found</Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data?.length ?? 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      <Dialog open={openLogModal} onClose={handleCloseLogModal} maxWidth="lg" fullWidth>
        <DialogTitle>Enquiry Process Log</DialogTitle>
        <DialogContent dividers>
          {selectedEnquiry && (
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Enquiry ID: <span style={{ color: '#2065D1' }}>{selectedEnquiry.enqID}</span>
              </Typography>
              <Divider sx={{ my: 2 }} />
              {selectedEnquiry.actionLog && selectedEnquiry.actionLog.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {selectedEnquiry.actionLog.map((log, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{log.action}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {moment(log.performedAt).format('YYYY-MM-DD HH:mm:ss')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {log.comments || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', p: 2 }}>
                  No logs available for this enquiry.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogModal}>Close</Button>
        </DialogActions>
      </Dialog>

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
                <TextField
                  name="phoneNumber"
                  type="number"
                  value={values.phoneNumber}
                  error={touched.phoneNumber && errors.phoneNumber && true}
                  label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone Number'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
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
                fetchData({});
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
    </>
  );
}
