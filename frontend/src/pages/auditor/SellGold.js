import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Backdrop, CircularProgress, TablePagination, Stack, Chip
} from '@mui/material';
import moment from 'moment';
import { findMelting } from '../../apis/admin/melting';
import Scrollbar from '../../components/scrollbar';

export default function AuditorSellGold() {
  const [data, setData] = useState([]);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setOpenBackdrop(true);
    findMelting({ status: 'sold' }).then(res => {
      if(res?.status) {
        setData(res.data || []);
      }
      setOpenBackdrop(false);
    }).catch(() => setOpenBackdrop(false));
  };

  return (
    <>
      <Helmet>
        <title> Sold Gold Records | Admin </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Sold Gold Details
        </Typography>

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
      
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
