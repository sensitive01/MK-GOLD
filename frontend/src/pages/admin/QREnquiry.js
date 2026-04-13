import { useEffect, useState } from 'react';
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
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import { getQrEnquiries } from '../../apis/admin/qrEnquiry';
import { BranchListHead } from '../../sections/@dashboard/branch';

const TABLE_HEAD = [
  { id: 'mkgCustomerId', label: 'Customer ID', alignRight: false },
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'phoneNumber', label: 'Phone', alignRight: false },
  { id: 'branch', label: 'Branch', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'grossWeight', label: 'Weight', alignRight: false },
  { id: 'pincode', label: 'Pincode', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
];

export default function QREnquiry() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const maskPhoneNumber = (phone) => {
    if (!phone || phone.length < 4) return phone;
    const first2 = phone.substring(0, 2);
    const last2 = phone.substring(phone.length - 2);
    const masked = '*'.repeat(phone.length - 4);
    return `${first2}${masked}${last2}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    getQrEnquiries({}).then((res) => {
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
                    const { _id, mkgCustomerId, name, phoneNumber, branch, type, grossWeight, pincode, createdAt } = row;

                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {mkgCustomerId}
                        </TableCell>
                        <TableCell align="left">{name}</TableCell>
                        <TableCell align="left">{maskPhoneNumber(phoneNumber)}</TableCell>
                        <TableCell align="left">{branch?.branchName}</TableCell>
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
