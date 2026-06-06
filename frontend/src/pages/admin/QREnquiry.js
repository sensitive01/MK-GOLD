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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Divider,
} from '@mui/material';
import moment from 'moment';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import global from '../../utils/global';
import { getQrEnquiries } from '../../apis/admin/qrEnquiry';
import { BranchListHead } from '../../sections/@dashboard/branch';

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

  const fetchData = () => {
    getQrEnquiries({}).then((res) => {
      if (res.status) {
        setData(res.data ?? []);
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
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <BranchListHead
                  headLabel={TABLE_HEAD}
                  rowCount={data?.length ?? 0}
                  onRequestSort={() => {}}
                  onSelectAllClick={() => {}}
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
                        <TableCell align="left">{global.maskPhoneNumber(phoneNumber)}</TableCell>
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
    </>
  );
}
