import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Backdrop, CircularProgress, TablePagination, Stack, Chip, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, TextField
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { findMelting } from '../../apis/admin/melting';
import Scrollbar from '../../components/scrollbar';
import Iconify from '../../components/iconify';

export default function AuditorSellGold() {
  const [data, setData] = useState([]);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const form = useRef();

  const schema = Yup.object({
    fromDate: Yup.mixed().nullable(),
    toDate: Yup.mixed().nullable(),
  });

  const { handleSubmit, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      const query = { status: 'sold' };
      if (values.fromDate || values.toDate) {
        query.updatedAt = {};
        if (values.fromDate) query.updatedAt.$gte = values.fromDate.format("YYYY-MM-DD");
        if (values.toDate) query.updatedAt.$lte = values.toDate.format("YYYY-MM-DD");
      }
      findMelting(query).then((res) => {
        if(res?.status) {
          setData(res.data || []);
        } else {
          setData(res.data || []);
        }
        setOpenBackdrop(false);
      }).catch(() => setOpenBackdrop(false));
      setFilterOpen(false);
    },
  });

  const fetchData = useCallback(
    (
      query = {
        status: 'sold',
        updatedAt: {
          $gte: values.fromDate ?? moment()?.format("YYYY-MM-DD"),
          $lte: values.toDate ?? moment()?.format("YYYY-MM-DD"),
        },
      }
    ) => {
      setOpenBackdrop(true);
      findMelting(query).then(res => {
        if(res?.status) {
          setData(res.data || []);
        } else {
          setData(res.data || []);
        }
        setOpenBackdrop(false);
      }).catch(() => setOpenBackdrop(false));
    },
    [values.fromDate, values.toDate]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterOpen = () => setFilterOpen(true);
  const handleFilterClose = () => setFilterOpen(false);

  return (
    <>
      <Helmet>
        <title> Sold Gold Records | Admin </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" sx={{ color: '#fff' }}>
            Sold Gold Details
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            {(values.fromDate || values.toDate) && (
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  resetForm();
                  fetchData({
                    status: 'sold',
                    updatedAt: {
                      $gte: moment()?.format("YYYY-MM-DD"),
                      $lte: moment()?.format("YYYY-MM-DD"),
                    },
                  });
                }}
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        <p style={{ color: '#fff', marginTop: -20, marginBottom: 20 }}>
          From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date:{' '}
          {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}
        </p>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell>Bar Weight (g)</TableCell>
                    <TableCell>Bar Purity (%)</TableCell>
                    <TableCell>Gold Rate</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Payment Mode</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{moment(row.updatedAt).format('DD MMM YYYY, HH:mm')}</TableCell>
                      <TableCell>{row.vendor?.name || 'N/A'}</TableCell>
                      <TableCell>{row.barWeight || '-'}</TableCell>
                      <TableCell>{row.barPurity || '-'}</TableCell>
                      <TableCell>₹{row.goldRate || '-'}</TableCell>
                      <TableCell>₹{row.sellAmount || '-'}</TableCell>
                      <TableCell>{row.paymentMode || '-'}</TableCell>
                      <TableCell>
                        <Chip label={row.status.toUpperCase()} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && !openBackdrop && (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                        <Typography variant="body1">No sold records found</Typography>
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
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
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
                  status: 'sold',
                  updatedAt: {
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
