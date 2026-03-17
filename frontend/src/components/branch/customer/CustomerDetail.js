import {
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  Paper,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect, useState } from 'react';
import { sentenceCase } from 'change-case';
import Scrollbar from '../../scrollbar';
import { getCustomerById } from '../../../apis/branch/customer';

export default function CustomerDetail({ id }) {
  const [data, setData] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);

  useEffect(() => {
    getCustomerById(id).then((data) => {
      setData(data.data);
      setOpenBackdrop(false);
    });
  }, [id]);

  function Bank() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.bank.length) : 0;
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setPage(0);
      setRowsPerPage(parseInt(event.target.value, 10));
    };

    return (
      <Scrollbar>
        <TableContainer sx={{ minWidth: 800, mb: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">Account Holder Name</TableCell>
                <TableCell align="left">Account No</TableCell>
                <TableCell align="left">Branch</TableCell>
                <TableCell align="left">IFSC Code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.bank?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={e._id} tabIndex={-1}>
                  <TableCell align="left">{sentenceCase(e.accountHolderName)}</TableCell>
                  <TableCell align="left">{e.accountNo}</TableCell>
                  <TableCell align="left">{e.branch}</TableCell>
                  <TableCell align="left">{e.ifscCode}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={3} />
                </TableRow>
              )}
              {data?.bank?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={3} sx={{ py: 3 }}>
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
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.bank?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  function Address() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.address.length) : 0;
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setPage(0);
      setRowsPerPage(parseInt(event.target.value, 10));
    };

    return (
      <Scrollbar>
        <TableContainer sx={{ minWidth: 800, mb: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">Address</TableCell>
                <TableCell align="left">Area</TableCell>
                <TableCell align="left">City</TableCell>
                <TableCell align="left">Pincode</TableCell>
                <TableCell align="left">Landmark</TableCell>
                <TableCell align="left">Label</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.address?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={e._id} tabIndex={-1}>
                  <TableCell align="left">{sentenceCase(e.address)}</TableCell>
                  <TableCell align="left">{e.area}</TableCell>
                  <TableCell align="left">{e.city}</TableCell>
                  <TableCell align="left">{e.pincode}</TableCell>
                  <TableCell align="left">{e.landmark}</TableCell>
                  <TableCell align="left">{e.label}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={3} />
                </TableRow>
              )}
              {data?.address?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={3} sx={{ py: 3 }}>
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
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.address?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  return (
    <>
      {openBackdrop ? (
        <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
      ) : (
        <Card sx={{ p: 4, my: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ mt: 1, mb: 3 }}>
            Customer Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Personal Detail:
              </Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Name: {sentenceCase(data?.name)}</TableCell>
                      <TableCell align="left">Email: {data?.email}</TableCell>
                      <TableCell align="left">Gender: {sentenceCase(data?.gender)}</TableCell>
                      <TableCell align="left">Phone Number: {data?.phoneNumber}</TableCell>
                    </TableRow>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">DOB: {data?.dob}</TableCell>
                      <TableCell align="left">Marital Status: {sentenceCase(data?.maritalStatus)}</TableCell>
                      <TableCell align="left">Status: {sentenceCase(data?.status)}</TableCell>
                      <TableCell align="left">Alternate Phone Number: {data?.alternatePhoneNumber}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Bank Detail:
              </Typography>
              <Bank />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Address Detail:
              </Typography>
              <Address />
            </Grid>
          </Grid>
        </Card>
      )}
    </>
  );
}
