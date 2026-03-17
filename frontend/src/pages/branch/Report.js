import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
// @mui
import {
    Backdrop,
    Card,
    CircularProgress,
    Container,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import moment from 'moment';
import { useSelector } from 'react-redux';
// components
import Scrollbar from '../../components/scrollbar';
// sections
import { ListHead } from '../../sections/@dashboard/report';
// mock
import { consolidatedSaleReport } from '../../apis/branch/sales';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'date', label: 'Date', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'saleType', label: 'Sale Type', alignRight: false },
  { id: 'rate', label: 'Rate', alignRight: false },
  { id: 'bills', label: 'Bills', alignRight: false },
  { id: 'grossWeight', label: 'Gross Weight', alignRight: false },
  { id: 'netWeight', label: 'Net Weight', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'releaseAmount', label: 'Release Amount', alignRight: false },
  { id: 'ornaments', label: 'Ornaments', alignRight: false },
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
    return filter(array, (row) => row?.branch?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function Report() {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(null);
  const [filterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);

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
      consolidatedSaleReport(query).then((data) => {
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData.length && !!filterName;

  return (
    <>
      <Helmet>
        <title> Report | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Consolidated Sale Report
          </Typography>
        </Stack>

        <Card>
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
                  {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => {
                    const {
                      date,
                      type,
                      saleType,
                      rate,
                      bills,
                      grossWeight,
                      netWeight,
                      netAmount,
                      releaseAmount,
                      ornaments,
                    } = row;

                    return (
                      <TableRow hover key={index} tabIndex={-1}>
                        <TableCell align="left">{moment(date).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="left">{sentenceCase(type ?? '')}</TableCell>
                        <TableCell align="left">{sentenceCase(saleType ?? '')}</TableCell>
                        <TableCell align="left">{rate}</TableCell>
                        <TableCell align="left">{bills}</TableCell>
                        <TableCell align="left">{grossWeight}</TableCell>
                        <TableCell align="left">{netWeight}</TableCell>
                        <TableCell align="left">{netAmount}</TableCell>
                        <TableCell align="left">{releaseAmount}</TableCell>
                        <TableCell align="left">{ornaments}</TableCell>
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

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
