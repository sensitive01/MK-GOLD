import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Container, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Backdrop, CircularProgress, TablePagination, Stack, Chip, Button
} from '@mui/material';
import moment from 'moment';
import { findMelting } from '../../apis/admin/melting';
import Scrollbar from '../../components/scrollbar';
import Iconify from '../../components/iconify';
import MeltingDetailDialog from '../../components/store/MeltingDetailDialog';
import DeliveryChallanDialog from '../../components/DeliveryChallanDialog';
import GoldSaleInvoiceDialog from '../../components/GoldSaleInvoiceDialog';

export default function SoldGoldRecords() {
  const [data, setData] = useState([]);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog States
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedMeltingForDetail, setSelectedMeltingForDetail] = useState(null);

  const [dcDialogOpen, setDcDialogOpen] = useState(false);
  const [selectedMeltingForDC, setSelectedMeltingForDC] = useState(null);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedMeltingForInvoice, setSelectedMeltingForInvoice] = useState(null);

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

  const handleOpenDetail = (row) => {
    setSelectedMeltingForDetail(row);
    setDetailDialogOpen(true);
  };

  const handleOpenDC = (row) => {
    setSelectedMeltingForDC(row);
    setDcDialogOpen(true);
  };

  const handleOpenInvoice = (row) => {
    setSelectedMeltingForInvoice(row);
    setInvoiceDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title> Gatty Sales | Finance </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Gatty Sales Details
        </Typography>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 1000 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Batch No</TableCell>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell align="center">Dispatched Bar Wt (g)</TableCell>
                    <TableCell align="center">Vendor Gatty Wt (g)</TableCell>
                    <TableCell align="center">Purity (%)</TableCell>
                    <TableCell align="center">Gold Rate</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Payment Mode</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{moment(row.updatedAt).format('DD MMM YYYY, HH:mm')}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {row.batchNumber || '-'}
                      </TableCell>
                      <TableCell>{row.vendor?.name || 'N/A'}</TableCell>
                      <TableCell align="center">{row.barWeight != null ? `${Number(row.barWeight).toFixed(3)}` : '-'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: '#1b5e20' }}>
                        {row.actualWeight != null ? `${Number(row.actualWeight).toFixed(3)}` : (row.barWeight != null ? `${Number(row.barWeight).toFixed(3)}` : '-')}
                      </TableCell>
                      <TableCell align="center">
                        {row.actualPurity != null ? `${Number(row.actualPurity).toFixed(2)}%` : (row.barPurity != null ? `${Number(row.barPurity).toFixed(2)}%` : '-')}
                      </TableCell>
                      <TableCell align="center">₹{row.goldRate ? Number(row.goldRate).toLocaleString('en-IN') : '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ₹{row.sellAmount ? Number(row.sellAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </TableCell>
                      <TableCell>{row.paymentMode || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip label={row.status.toUpperCase()} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            startIcon={<Iconify icon="eva:eye-fill" />}
                            onClick={() => handleOpenDetail(row)}
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'none' }}
                          >
                            Details
                          </Button>
                          <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            startIcon={<Iconify icon="eva:file-text-fill" />}
                            onClick={() => handleOpenDC(row)}
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'none' }}
                          >
                            DC
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<Iconify icon="eva:printer-fill" />}
                            onClick={() => handleOpenInvoice(row)}
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'none' }}
                          >
                            Invoice
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && !openBackdrop && (
                    <TableRow>
                      <TableCell align="center" colSpan={11} sx={{ py: 3 }}>
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
      
      {/* Full Details Dialog (Includes Stage 1, Stage 2, Vendor Assay, Purity Photo, Certificate, Ornaments) */}
      <MeltingDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        melting={selectedMeltingForDetail}
      />

      {/* Delivery Challan Print Dialog */}
      <DeliveryChallanDialog
        open={dcDialogOpen}
        onClose={() => setDcDialogOpen(false)}
        melting={selectedMeltingForDC}
        vendor={selectedMeltingForDC?.vendor}
      />

      {/* Tax Invoice Print Dialog */}
      <GoldSaleInvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        melting={selectedMeltingForInvoice}
        vendor={selectedMeltingForInvoice?.vendor}
      />

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
