import {
  TextField,
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
import Link from '@mui/material/Link';
import { useEffect, useState } from 'react';
import { sentenceCase } from 'change-case';
import moment from 'moment';
import Scrollbar from '../../scrollbar';
import { getSalesById } from '../../../apis/branch/sales';
import global from '../../../utils/global';

export default function SaleDetail({ id }) {
  const [data, setData] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);

  useEffect(() => {
    getSalesById(id).then((data) => {
      setData(data.data);
      setOpenBackdrop(false);
    });
  }, [id]);

  function Ornament() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.ornaments.length) : 0;
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
                <TableCell align="left">Purity</TableCell>
                <TableCell align="left">Quantity</TableCell>
                <TableCell align="left">Stone weight (Grams)</TableCell>
                <TableCell align="left">Net weight (Grams)</TableCell>
                <TableCell align="left">Gross weight (Grams)</TableCell>
                <TableCell align="left">Net amount (INR)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.ornaments?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={index} tabIndex={-1}>
                  <TableCell align="left">{e.purity}</TableCell>
                  <TableCell align="left">{e.quantity}</TableCell>
                  <TableCell align="left">{e.stoneWeight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{e.netWeight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{e.grossWeight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{Math.round(e.netAmount)}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
              {data?.ornaments?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
                    <Paper
                      sx={{
                        textAlign: 'center',
                      }}
                    >
                      <Typography paragraph>No ornaments in table</Typography>
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
          count={data?.ornaments?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  function Release() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.release.length) : 0;
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
                <TableCell align="left">Pledge Id</TableCell>
                <TableCell align="left">Pledged In</TableCell>
                <TableCell align="left">Weight (Grams)</TableCell>
                <TableCell align="left">Pledge amount</TableCell>
                <TableCell align="left">Pledged date</TableCell>
                <TableCell align="left">Payable amount</TableCell>
                <TableCell align="left">Payment Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.release?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e) => (
                <TableRow hover key={e._id} tabIndex={-1}>
                  <TableCell align="left">{e.pledgeId}</TableCell>
                  <TableCell align="left">{sentenceCase(e.pledgedIn)}</TableCell>
                  <TableCell align="left">{e.weight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{Math.round(e.pledgeAmount)}</TableCell>
                  <TableCell align="left">{moment(e.pledgedDate).format('YYYY-MM-DD')}</TableCell>
                  <TableCell align="left">{Math.round(e.payableAmount)}</TableCell>
                  <TableCell align="left">{sentenceCase(e.paymentType)}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={9} />
                </TableRow>
              )}
              {data?.release?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={9} sx={{ py: 3 }}>
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
          count={data?.release?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  function Proof() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.proof.length) : 0;
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
                <TableCell align="left">Document Type</TableCell>
                <TableCell align="left">Document No</TableCell>
                <TableCell align="left">File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.proof?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={e._id} tabIndex={-1}>
                  <TableCell align="left">{sentenceCase(e.documentType)}</TableCell>
                  <TableCell align="left">{e.documentNo}</TableCell>
                  <TableCell align="left">
                    {e?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                      <img
                        key={index}
                        src={`${global.baseURL}/${e?.uploadedFile}`}
                        alt="document"
                        style={{ width: '80px' }}
                      />
                    ) : (
                      <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={3} />
                </TableRow>
              )}
              {data?.proof?.length === 0 && (
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
          count={data?.proof?.length}
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
              {data?.customer?.address?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
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
              {data?.customer?.address?.length === 0 && (
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
          count={data?.customer?.address?.length}
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
            Billing Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Customer Detail:
              </Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">
                        Photo:
                        <img
                          src={`${global.baseURL}/${data?.customer?.profileImage?.uploadedFile}`}
                          alt="document"
                          style={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="left">Customer Name: {data?.customer?.name}</TableCell>
                      <TableCell align="left">Customer Email: {data?.customer?.email}</TableCell>
                      <TableCell align="left">Customer Phone Number: {data?.customer?.phoneNumber}</TableCell>
                    </TableRow>
                  </TableBody>
                  <TableBody>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Gender: {data?.customer?.gender}</TableCell>
                      <TableCell align="left">Custcomer OTP: {data?.customer?.otp}</TableCell>
                      <TableCell align="left">Employment Type: {data?.customer?.employmentType}</TableCell>
                      <TableCell align="left">Organisation: {data?.customer?.organisation}</TableCell>
                    </TableRow>
                  </TableBody>
                  <TableBody>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Annual Income: {data?.customer?.annualIncome}</TableCell>
                      <TableCell align="left">Marital Status: {data?.customer?.maritalStatus}</TableCell>
                      <TableCell align="left">Source: {data?.customer?.source}</TableCell>
                      <TableCell align="left">ChooseId: {data?.customer?.chooseId}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Address Detail:
              </Typography>
              <Address />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Ornament Detail:
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Ornament />
            </Grid>
            {data?.paymentType === 'bank' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                    Bank Detail:
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableBody>
                        <TableRow tabIndex={-1}>
                          <TableCell align="left">
                            Account Holder Name: {sentenceCase(data?.bank?.accountHolderName ?? '')}
                          </TableCell>
                          <TableCell align="left">Account No: {data?.bank?.accountNo}</TableCell>
                          <TableCell align="left">Branch: {data?.bank?.branch}</TableCell>
                          <TableCell align="left">IFSC Code: {data?.bank?.ifscCode}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Release Detail:
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Release />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Proof Documents
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Proof />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Bill Detail:
              </Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Bill Id: {data?.billId}</TableCell>
                      <TableCell align="left">Branch: {sentenceCase(data.branch?.branchName ?? '')}</TableCell>
                      <TableCell align="left">Sale Type: {sentenceCase(data.saleType ?? '')}</TableCell>
                      <TableCell align="left">Ornament Type: {sentenceCase(data.purchaseType ?? '')}</TableCell>
                    </TableRow>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">DOP: {new Date(data.dop).toUTCString()}</TableCell>
                      <TableCell align="left">Net Weight: {data.netWeight?.toFixed(2)}</TableCell>
                      <TableCell align="left">Payment Type: {data.paymentType}</TableCell>
                      <TableCell align="left">Margin: {data.margin}%</TableCell>
                    </TableRow>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Net Amount: {Math.round(data.netAmount)}</TableCell>
                      <TableCell align="left">
                        Margin Amount:{' '}
                        {data.status === 'approved'
                          ? Math.round(
                              data.netAmount -
                                data.release?.reduce((prev, cur) => prev + +cur.payableAmount, 0) -
                                data.payableAmount
                            )
                          : Math.round((data.netAmount * data.margin) / 100)}
                      </TableCell>
                      <TableCell align="left">
                        Release Amount:{' '}
                        {Math.round(data.release?.reduce((prev, cur) => prev + +cur.payableAmount, 0)) ?? 0}
                      </TableCell>
                      <TableCell align="left">Payable Amount: {Math.round(data.payableAmount)}</TableCell>
                    </TableRow>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Status: {data.status}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Card>
      )}
    </>
  );
}
