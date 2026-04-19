import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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
} from '@mui/material';
import moment from 'moment';
import Scrollbar from '../../components/scrollbar';
import global from '../../utils/global';
import { getQrEnquiries } from '../../apis/branch/qrEnquiry';
import { BranchListHead } from '../../sections/@dashboard/branch';

const TABLE_HEAD = [
  { id: 'mkgCustomerId', label: 'Customer ID', alignRight: false },
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'phoneNumber', label: 'Phone', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'grossWeight', label: 'Weight', alignRight: false },
  { id: 'pincode', label: 'Pincode', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
];

export default function QREnquiry() {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = () => {
    // Filter by user's branch ID
    getQrEnquiries({ branch: user?.branch }).then((res) => {
      if (res.status) {
        setData(res.data);
      }
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

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            QR Enquiries (Branch Leads)
          </Typography>
        </Stack>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <BranchListHead
                  headLabel={TABLE_HEAD}
                  rowCount={data.length}
                  onRequestSort={() => {}}
                  onSelectAllClick={() => {}}
                />
                <TableBody>
                  {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const { _id, mkgCustomerId, name, phoneNumber, email, type, grossWeight, pincode, createdAt } = row;

                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {mkgCustomerId}
                        </TableCell>
                        <TableCell align="left">{name}</TableCell>
                        <TableCell align="left">{global.maskPhoneNumber(phoneNumber)}</TableCell>
                        <TableCell align="left">{email}</TableCell>
                        <TableCell align="left" sx={{ textTransform: 'capitalize' }}>
                          {type}
                        </TableCell>
                        <TableCell align="left">{grossWeight}g</TableCell>
                        <TableCell align="left">{pincode}</TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                      </TableRow>
                    );
                  })}
                  {data.length === 0 && (
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
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </>
  );
}
