import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
// @mui
import {
    Backdrop,
    Button,
    Card,
    CircularProgress,
    Container,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    Typography
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { useSelector } from 'react-redux';
// components
import Scrollbar from '../../components/scrollbar';
// sections
import { ListHead, ListToolbar } from '../../sections/@dashboard/balancesheet';
// mock
import { calculateClosingBalance, getBalancesheet } from '../../apis/branch/balancesheet';

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
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (row) => row.branchName.indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function Balancesheet() {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    (
      query = {
        fromDate: moment()?.format("YYYY-MM-DD"),
        toDate: moment()?.format("YYYY-MM-DD"),
      }
    ) => {
      if (!query.branch) query.branch = branch._id;
      getBalancesheet(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [branch._id]
  );

  useEffect(() => {
    setBranch(auth.user.branch);
    fetchData({
      branch: auth.user.branch._id,
      fromDate: moment()?.format("YYYY-MM-DD"),
      toDate: moment()?.format("YYYY-MM-DD"),
    });
  }, [auth.user.branch, fetchData]);

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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData.length && !!filterName;

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
          <Button
            variant="contained"
            onClick={() => {
              if (window.confirm('Do you want to settle branch?')) {
                calculateClosingBalance({ branch: branch?._id }).then((e) => {
                  if (e.status === true) {
                    setNotify({
                      open: true,
                      message: 'Branch Settled',
                      severity: 'success',
                    });
                  }
                });
              }
            }}
          >
            Settle Branch
          </Button>
        </Stack>

        <Card>
          <ListToolbar filterName={filterName} onFilterName={handleFilterByName} />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ListHead order={order} orderBy={orderBy} headLabel={TABLE_HEAD} onRequestSort={handleRequestSort} />
                <TableBody>
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
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

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
