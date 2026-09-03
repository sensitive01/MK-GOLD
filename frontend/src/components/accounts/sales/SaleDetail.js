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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Stack,
  Checkbox,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import { useEffect, useState } from 'react';
import { sentenceCase } from 'change-case';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { LoadingButton } from '@mui/lab';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Scrollbar from '../../scrollbar';
import { getSalesById, updateSales } from '../../../apis/accounts/sales';
import { createFile } from '../../../apis/branch/fileupload';
import global from '../../../utils/global';
import TimelineView from '../../TimelineView';
import Iconify from '../../iconify';

export default function SaleDetail({ id, setNotify, onActionComplete }) {
  const auth = useSelector((state) => state.auth);
  const [data, setData] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);

  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState('');

  const userType = auth.user?.userType?.toLowerCase();
  const employeeId = auth.user?.employee?._id || auth.user?.employee;

  const handleVerify = (type) => {
    setVerifyType(type);
    setOpenVerifyModal(true);
  };

  useEffect(() => {
    if (id) {
      getSalesById(id).then((data) => {
        if (data.status && data.data) {
          setData(data.data);
        }
        setOpenBackdrop(false);
      });
    }
  }, [id]);

  function Ornament() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.ornaments?.length) : 0;
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
                <TableCell align="left">Ornament Type</TableCell>
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
                  <TableCell align="left">{sentenceCase(e.ornamentType || '')}</TableCell>
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
                  <TableCell colSpan={7} />
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
          count={data?.ornaments?.length || 0}
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

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.release?.length) : 0;
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
                  <TableCell align="left">{sentenceCase(e.pledgedIn || '')}</TableCell>
                  <TableCell align="left">{e.weight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{Math.round(e.pledgeAmount)}</TableCell>
                  <TableCell align="left">{moment(e.pledgedDate).format('YYYY-MM-DD')}</TableCell>
                  <TableCell align="left">{Math.round(e.payableAmount)}</TableCell>
                  <TableCell align="left">{sentenceCase(e.paymentType || '')}</TableCell>
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
          count={data?.release?.length || 0}
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

    const manualProofUrls = [];
    if (data?.financeProof) manualProofUrls.push(data.financeProof);
    if (data?.assigneeProof) manualProofUrls.push(data.assigneeProof);
    if (data?.fundTransferProof) manualProofUrls.push(data.fundTransferProof);

    data?.release?.forEach(r => {
      if (r.financeProof) manualProofUrls.push(r.financeProof);
      if (r.assigneeProof) manualProofUrls.push(r.assigneeProof);
      if (r.fundTransferProof) manualProofUrls.push(r.fundTransferProof);
    });

    const baseProofs = [...(data?.proof || [])]
      .filter(p => !manualProofUrls.includes(p.uploadedFile) && !['transit_proof', 'transit_received_proof', 'melt_proof', 'after_melt_proof'].includes(p.uploadName))
      .map(p => ({ ...p }));
    const transitProofs = [...(data?.proof || [])]
      .filter(p => ['transit_proof', 'transit_received_proof'].includes(p.uploadName))
      .map(p => ({ ...p }));
    const meltingProofs = [...(data?.proof || [])]
      .filter(p => ['melt_proof', 'after_melt_proof'].includes(p.uploadName))
      .map(p => ({ ...p }));

    const allProofs = [...baseProofs];

    const isPhysical = data?.saleType === 'physical';
    if (data?.financeProof) {
      allProofs.push({ uploadedFile: data.financeProof, documentType: isPhysical ? 'Finance Proof' : 'Release Finance Proof', documentNo: 'N/A', _id: 'sale_finance' });
    }
    if (data?.assigneeProof) {
      allProofs.push({ uploadedFile: data.assigneeProof, documentType: isPhysical ? 'Assignee Proof' : 'Release Assignee Proof', documentNo: 'N/A', _id: 'sale_assignee' });
    }
    if (data?.fundTransferProof) {
      allProofs.push({ uploadedFile: data.fundTransferProof, documentType: isPhysical ? 'Fund Transfer Proof' : 'Sale Finance Proof', documentNo: 'N/A', _id: 'sale_fundTransfer' });
    }

    data?.release?.forEach(r => {
      if (r.financeProof) {
        allProofs.push({ uploadedFile: r.financeProof, documentType: 'Release Finance Proof', documentNo: 'N/A', _id: `rel_finance_${r._id}` });
      }
      if (r.assigneeProof) {
        allProofs.push({ uploadedFile: r.assigneeProof, documentType: 'Release Assignee Proof', documentNo: 'N/A', _id: `rel_assignee_${r._id}` });
      }
      if (r.fundTransferProof) {
        allProofs.push({ uploadedFile: r.fundTransferProof, documentType: 'Release Fund Transfer Proof', documentNo: 'N/A', _id: `rel_fundTransfer_${r._id}` });
      }
    });

    allProofs.push(...transitProofs);
    allProofs.push(...meltingProofs);

    let fpCount = 0;
    allProofs.forEach(e => {
       const releaseDoc = data?.release?.flatMap((r) => r.proofDocuments || [])?.find((doc) => doc.documentFile === e.uploadedFile);
       let docType = e.documentType || releaseDoc?.documentType;
       let displayType = docType ? sentenceCase(docType) : 'Release Document';
       
       if (!docType && e.uploadName && e.uploadName !== 'Release Document' && e.uploadName !== 'release') {
         if (e.uploadName === 'finance_proof') {
           fpCount++;
           displayType = isPhysical ? 'Finance Proof' : (fpCount > 1 ? 'Sale Finance Proof' : 'Release Finance Proof');
         } else if (e.uploadName === 'sale_finance_proof' || e.uploadName === 'sale_proof') {
           displayType = 'Sale Finance Proof';
         } else if (e.uploadName === 'transit_proof') {
           displayType = 'Transit Dispatch Proof';
         } else if (e.uploadName === 'transit_received_proof') {
           displayType = 'Transit Received Proof';
         } else if (e.uploadName === 'melt_proof') {
           displayType = 'Before Melt Proof';
         } else if (e.uploadName === 'after_melt_proof') {
           displayType = 'After Melt Proof';
         } else {
           displayType = e.uploadName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
         }
       } else if (docType === 'Release Finance Proof' || docType === 'Finance Proof') {
           fpCount++;
           if (fpCount > 1 && docType === 'Release Finance Proof') {
               displayType = 'Sale Finance Proof';
           } else {
               displayType = isPhysical ? 'Finance Proof' : 'Release Finance Proof';
           }
       }

       if (displayType.toLowerCase() === 'sale finance proof') displayType = 'Sale Finance Proof';
       if (displayType.toLowerCase() === 'release finance proof' || displayType.toLowerCase() === 'release finance document') displayType = 'Release Finance Proof';
       
       e.displayType = displayType;
       e.documentNo = e.documentNo || releaseDoc?.documentNo || 'N/A';
    });

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - allProofs.length) : 0;
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
              {allProofs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => {
                return (
                  <TableRow hover key={e._id || index} tabIndex={-1}>
                    <TableCell align="left">{e.displayType}</TableCell>
                    <TableCell align="left">{e.documentNo}</TableCell>
                    <TableCell align="left">
                      {e?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                        <a
                          href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            key={index}
                            src={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                            alt="document"
                            style={{ width: '80px' }}
                          />
                        </a>
                      ) : (
                        <a
                          href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer' }}
                        >
                          <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={3} />
                </TableRow>
              )}
              {allProofs.length === 0 && (
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
          count={allProofs.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  function KycProof() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.customer?.kycProofs?.length) : 0;
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
                <TableCell align="left">Upload Type</TableCell>
                <TableCell align="left">Document Type</TableCell>
                <TableCell align="left">Document No</TableCell>
                <TableCell align="left">File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.customer?.kycProofs?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={e._id} tabIndex={-1}>
                  <TableCell align="left">{sentenceCase(e.uploadType || '')}</TableCell>
                  <TableCell align="left">{sentenceCase(e.documentType || '')}</TableCell>
                  <TableCell align="left">{e.documentNo}</TableCell>
                  <TableCell align="left">
                    {e?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                      <a
                        href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          key={index}
                          src={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          alt="document"
                          style={{ width: '80px' }}
                        />
                      </a>
                    ) : (
                      <a
                        href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ cursor: 'pointer' }}
                      >
                        <img key={index} src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
              {data?.customer?.kycProofs?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={4} sx={{ py: 3 }}>
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
          count={data?.customer?.kycProofs?.length || 0}
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

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data?.address?.length) : 0;
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
                <TableCell align="left">Proof</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.customer?.address?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => {
                const proof = data?.customer?.addressProofs?.find(p => p.uploadId === e._id.toString());
                return (
                  <TableRow hover key={e._id} tabIndex={-1}>
                    <TableCell align="left">{sentenceCase(e.address || '')}</TableCell>
                    <TableCell align="left">{e.area}</TableCell>
                    <TableCell align="left">{e.city}</TableCell>
                    <TableCell align="left">{e.pincode}</TableCell>
                    <TableCell align="left">{e.landmark}</TableCell>
                    <TableCell align="left">{e.label}</TableCell>
                    <TableCell align="left">
                      {proof?.uploadedFile ? (
                        proof?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                          <a
                            href={proof.uploadedFile.startsWith('http') ? proof.uploadedFile : `${global.baseURL}/${proof.uploadedFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer' }}
                          >
                            <img
                              src={proof.uploadedFile.startsWith('http') ? proof.uploadedFile : `${global.baseURL}/${proof.uploadedFile}`}
                              alt="document"
                              style={{ width: '80px' }}
                            />
                          </a>
                        ) : (
                          <a
                            href={proof.uploadedFile.startsWith('http') ? proof.uploadedFile : `${global.baseURL}/${proof.uploadedFile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer' }}
                          >
                            <img src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                          </a>
                        )
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={7} />
                </TableRow>
              )}
              {data?.customer?.address?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
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
          count={data?.customer?.address?.length || 0}
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
        <Backdrop open={openBackdrop} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
              <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                  <Avatar
                    src={data?.customer?.profileImage?.uploadedFile ? (data.customer.profileImage.uploadedFile.startsWith('http')
                      ? data.customer.profileImage.uploadedFile
                      : `${global.baseURL}/${data.customer.profileImage.uploadedFile}`) : null}
                    alt={data?.customer?.name}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Stack spacing={1} flexGrow={1}>
                    <Typography variant="h5">{data?.customer?.name || 'N/A'}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ color: 'text.secondary' }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Iconify icon="eva:email-fill" width={20} />
                        <Typography variant="body2">{data?.customer?.email || 'N/A'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Iconify icon="eva:phone-fill" width={20} />
                        <Typography variant="body2">{global.maskPhoneNumber(data?.customer?.phoneNumber) || 'N/A'}</Typography>
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Chip size="small" label={`Gender: ${data?.customer?.gender || 'N/A'}`} />
                      <Chip size="small" label={`Marital Status: ${data?.customer?.maritalStatus || 'N/A'}`} />
                      <Chip size="small" label={`Source: ${data?.customer?.source || 'N/A'}`} />
                      <Chip size="small" label={`ChooseId: ${data?.customer?.chooseId || 'N/A'}`} />
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Customer KYC Proofs:
              </Typography>
              <KycProof />
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
            {data?.saleType !== 'physical' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                    Release Detail:
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Release />
                </Grid>
              </>
            )}
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
                          {data?.bank?.proof?.uploadedFile && (
                            <TableCell align="left">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Bank Proof:</Typography>
                                {data.bank.proof.uploadedFile.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                                  <a
                                    href={data.bank.proof.uploadedFile.startsWith('http') ? data.bank.proof.uploadedFile : `${global.baseURL}/${data.bank.proof.uploadedFile}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={data.bank.proof.uploadedFile.startsWith('http') ? data.bank.proof.uploadedFile : `${global.baseURL}/${data.bank.proof.uploadedFile}`}
                                      alt="bank proof"
                                      style={{ height: '30px', borderRadius: 4 }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={data.bank.proof.uploadedFile.startsWith('http') ? data.bank.proof.uploadedFile : `${global.baseURL}/${data.bank.proof.uploadedFile}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img src="/assets/doc.svg" alt="bank proof" style={{ height: '30px' }} />
                                  </a>
                                )}
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </>
            )}
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
                        Margin Amount: {Math.round((data.netAmount * data.margin) / 100)}
                      </TableCell>
                      <TableCell align="left">
                        Release Amount:{' '}
                        {Math.round(data.release?.reduce((prev, cur) => prev + +cur.payableAmount, 0)) ?? 0}
                      </TableCell>
                      <TableCell align="left">Payable Amount: {Math.abs(Math.round(data.payableAmount || 0))}</TableCell>
                    </TableRow>
                    <TableRow tabIndex={-1}>
                      <TableCell align="left">Status: {data.status}</TableCell>
                    </TableRow>
                    {data.comments && (
                      <TableRow tabIndex={-1}>
                        <TableCell align="left" colSpan={4}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'inline' }}>Comments: </Typography>
                          {data.comments}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <TimelineView timeline={data.timeline} />
            </Grid>

            {data.status === 'finance pending' && (userType === 'finance' || userType === 'accounts') && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button variant="contained" color="warning" onClick={() => handleVerify('finance')}>
                    Update Finance
                  </Button>
                </Stack>
              </Grid>
            )}

            {data.status === 'release pending' && employeeId === (data.assignee?._id || data.assignee) && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button variant="contained" color="warning" onClick={() => handleVerify('assignee')}>
                    Update Verification
                  </Button>
                </Stack>
              </Grid>
            )}


          </Grid>
        </Card>
      )}

      <VerificationModal
        open={openVerifyModal}
        id={id}
        type={verifyType}
        handleClose={() => setOpenVerifyModal(false)}
        fetchData={() => {
          setNotify?.({ open: true, message: 'Verification updated successfully', severity: 'success' });
          // Re-fetch this sale's data so financeProof / assigneeProof / etc. appear immediately
          getSalesById(id).then((res) => {
            if (res.status && res.data) {
              setData(res.data);
            }
          });
          onActionComplete?.();
        }}
        saleType={data.saleType}
        assigneeCompleted={data.assigneeCompleted}
      />
    </>
  );
}

function VerificationModal({ open, id, type, handleClose, fetchData, saleType, assigneeCompleted }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ornaments, setOrnaments] = useState([]);
  const [showOrnamentForm, setShowOrnamentForm] = useState(false);

  const [ornamentValues, setOrnamentValues] = useState({
    ornamentType: '',
    quantity: '',
    grossWeight: '',
    stoneWeight: '',
    netWeight: '',
    purity: '',
    netAmount: '',
  });

  const [fileType, setFileType] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const schema = Yup.object({
    amount: Yup.number().required('Amount is required'),
    comments: Yup.string().required('Comments are required'),
    isCompleted: Yup.boolean(),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue, resetForm } = useFormik({
    initialValues: {
      amount: '',
      comments: '',
      proof: '',
      isCompleted: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      setLoading(true);

      const payload = {};
      if (type === 'finance') {
        payload.financeAmount = values.amount;
        payload.financeComments = values.comments;
        payload.financeProof = values.proof;
        if (values.isCompleted) {
          payload.financeCompleted = true;
          payload.financeCompletedAt = new Date();
          const isPhys = saleType === 'physical';
          payload.status = (isPhys || assigneeCompleted) ? 'completed' : 'release pending';
        }
      } else if (type === 'fund transfer') {
        payload.fundTransferAmount = values.amount;
        payload.fundTransferComments = values.comments;
        payload.fundTransferProof = values.proof;
        if (values.isCompleted) {
          payload.fundTransferCompleted = true;
          payload.fundTransferCompletedAt = new Date();
          payload.status = 'completed';
        }
      } else {
        payload.assigneeAmount = values.amount;
        payload.assigneeComments = values.comments;
        payload.assigneeProof = values.proof;
        payload.ornaments = ornaments;
        if (values.isCompleted) {
          payload.assigneeCompleted = true;
          payload.assigneeCompletedAt = new Date();
          payload.status = 'bullion pending';
          payload.bullionCompleted = false;
          payload.financeCompleted = false;
        }
      }

      updateSales(id, payload).then((data) => {
        setLoading(false);
        if (data.status) {
          handleModalClose();
          fetchData();
        } else {
          alert(data.message || 'Verification failed. Please ensure prior stages are approved.');
        }
      });
    },
  });

  const handleModalClose = () => {
    setPreview(null);
    setFileType('');
    setPdfBlobUrl(null);
    resetForm();
    handleClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setFileType('pdf');
        setPreview(file.name);
        setPdfBlobUrl(URL.createObjectURL(file));
      } else {
        setFileType('image');
        setPreview(URL.createObjectURL(file));
        setPdfBlobUrl(null);
      }
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadId', id);

      let uploadName = 'proof';
      if (type === 'finance') uploadName = 'finance_proof';
      else if (type === 'fund transfer') uploadName = 'fundTransfer_proof';
      else uploadName = 'assignee_proof';

      formData.append('uploadName', uploadName);
      const res = await createFile(formData);
      if (res.status) {
        setFieldValue('proof', res.data.uploadedFile);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{sentenceCase(type || '')} Verification</DialogTitle>
        <DialogContent sx={{ mt: 1, pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                sx={{ mt: 1 }}
                name="amount"
                label="Payment Amount"
                type="number"
                value={values.amount}
                error={touched.amount && errors.amount && true}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments"
                multiline
                rows={3}
                value={values.comments}
                error={touched.comments && errors.comments && true}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Upload Proof/Photo</Typography>
              <input type="file" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
              {preview && (
                fileType === 'pdf' ? (
                  <a
                    href={values.proof ? (values.proof.startsWith('http') ? values.proof : `${global.baseURL}/${values.proof}`) : (pdfBlobUrl || '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 2, border: '1px dashed #ccc', borderRadius: 1, cursor: 'pointer' }}>
                      <img src="/assets/doc.svg" alt="pdf document" style={{ width: '24px' }} />
                      <Typography variant="body2">{preview}</Typography>
                    </Box>
                  </a>
                ) : (
                  <a
                    href={values.proof ? (values.proof.startsWith('http') ? values.proof : `${global.baseURL}/${values.proof}`) : preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                  </a>
                )
              )}
            </Grid>

            {type === 'assignee' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Ornaments</Typography>
                  <Button variant="outlined" size="small" onClick={() => setShowOrnamentForm(true)}>Add Ornament</Button>
                </Stack>

                {showOrnamentForm && (
                  <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Ornament Type"
                          size="small"
                          value={ornamentValues.ornamentType}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, ornamentType: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Quantity"
                          size="small"
                          type="number"
                          value={ornamentValues.quantity}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, quantity: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Net Weight"
                          size="small"
                          type="number"
                          value={ornamentValues.netWeight}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, netWeight: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => {
                            if (ornamentValues.ornamentType && ornamentValues.netWeight) {
                              setOrnaments([...ornaments, ornamentValues]);
                              setOrnamentValues({ ornamentType: '', quantity: '', grossWeight: '', stoneWeight: '', netWeight: '', purity: '', netAmount: '' });
                              setShowOrnamentForm(false);
                            }
                          }}
                        >
                          Add
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Net Wt</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ornaments.map((orn, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{orn.ornamentType}</TableCell>
                          <TableCell>{orn.quantity}</TableCell>
                          <TableCell>{orn.netWeight}</TableCell>
                          <TableCell>
                            <IconButton color="error" size="small" onClick={() => setOrnaments(ornaments.filter((_, i) => i !== idx))}>
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  name="isCompleted"
                  checked={values.isCompleted}
                  onChange={handleChange}
                />
                <Typography variant="body2">Mark as completed (Moves to next stage)</Typography>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading} sx={{ color: '#fff' }}>
            Save & Update Status
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

