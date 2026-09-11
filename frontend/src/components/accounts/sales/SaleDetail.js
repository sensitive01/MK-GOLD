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
  TableFooter,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
import { getSalesById, updateSales, verifyFinancePayment } from '../../../apis/accounts/sales';
import { createFile } from '../../../apis/branch/fileupload';
import global from '../../../utils/global';
import TimelineView from '../../TimelineView';
import Scrollbar from '../../scrollbar';
import Iconify from '../../iconify';
import BankDetailCard from '../../BankDetailCard';
import VerifyBankPaymentModal from '../../VerifyBankPaymentModal';

export default function SaleDetail({ id, setNotify, onActionComplete }) {
  const auth = useSelector((state) => state.auth);
  const [data, setData] = useState({});
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openVerifyBankModal, setOpenVerifyBankModal] = useState(false);
  const [selectedVerifyTarget, setSelectedVerifyTarget] = useState(null);

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
                <TableCell align="left">Quantity</TableCell>
                <TableCell align="center">Photo</TableCell>
                <TableCell align="left">Gross Weight</TableCell>
                <TableCell align="left">Stone / Wastage</TableCell>
                <TableCell align="left">Net Weight</TableCell>
                <TableCell align="left">Purity</TableCell>
                <TableCell align="left">Net Amount</TableCell>
                <TableCell align="center">Bill</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.ornaments?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => (
                <TableRow hover key={index} tabIndex={-1}>
                  <TableCell align="left">{sentenceCase(e.ornamentType || '')}</TableCell>
                  <TableCell align="left">{e.quantity}</TableCell>
                  <TableCell align="center">
                    {e.ornamentPhoto ? (
                      <a
                        href={e.ornamentPhoto.startsWith('http') ? e.ornamentPhoto : `${global.baseURL}/${e.ornamentPhoto}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-block' }}
                      >
                        <Avatar
                          src={e.ornamentPhoto.startsWith('http') ? e.ornamentPhoto : `${global.baseURL}/${e.ornamentPhoto}`}
                          variant="rounded"
                          sx={{
                            width: 40,
                            height: 40,
                            border: '1px solid #e0e0e0',
                            mx: 'auto',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 },
                          }}
                        />
                      </a>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="left">{e.grossWeight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{e.stoneWeight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{e.netWeight?.toFixed(2)}</TableCell>
                  <TableCell align="left">{e.purity}</TableCell>
                  <TableCell align="left">{Math.round(e.netAmount)}</TableCell>
                  <TableCell align="center">
                    {e.hasBill ? (
                      e.billProof ? (
                        <a
                          href={e.billProof.startsWith('http') ? e.billProof : `${global.baseURL}/${e.billProof}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Chip
                            size="small"
                            color="primary"
                            label={`Bill: ${e.billDate || 'Yes'}`}
                            icon={<Iconify icon="eva:external-link-outline" />}
                            clickable
                            sx={{ fontWeight: 500 }}
                          />
                        </a>
                      ) : (
                        <Chip size="small" color="primary" label={`Bill: ${e.billDate || 'Yes'}`} sx={{ fontWeight: 500 }} />
                      )
                    ) : (
                      <Chip size="small" variant="outlined" label="No Bill" sx={{ color: 'text.secondary' }} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={9} />
                </TableRow>
              )}
              {data?.ornaments?.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={9} sx={{ py: 3 }}>
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
            {data?.ornaments?.length > 0 && (
              <TableFooter>
                <TableRow
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    '& .MuiTableCell-root': {
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'text.primary',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell align="left">
                    Total
                  </TableCell>
                  <TableCell align="left">
                    {data.ornaments.reduce((prev, cur) => prev + (+cur.quantity || 0), 0)}
                  </TableCell>
                  <TableCell align="center">-</TableCell>
                  <TableCell align="left">
                    {data.ornaments.reduce((prev, cur) => prev + (+cur.grossWeight || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="left">
                    {data.ornaments.reduce((prev, cur) => prev + (+cur.stoneWeight || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="left">
                    {data.ornaments.reduce((prev, cur) => prev + (+cur.netWeight || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="left">-</TableCell>
                  <TableCell align="left">
                    ₹{Math.round(data.ornaments.reduce((prev, cur) => prev + (+cur.netAmount || 0), 0)).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="center">-</TableCell>
                </TableRow>
              </TableFooter>
            )}
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
            {data?.release?.length > 0 && (
              <TableFooter>
                <TableRow
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    borderTop: '2px solid',
                    borderColor: 'divider',
                    '& .MuiTableCell-root': {
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'text.primary',
                      py: 1.5,
                    },
                  }}
                >
                  <TableCell colSpan={2} align="left">
                    Total
                  </TableCell>
                  <TableCell align="left">
                    {data.release.reduce((prev, cur) => prev + (+cur.weight || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="left">
                    ₹{Math.round(data.release.reduce((prev, cur) => prev + (+cur.pledgeAmount || 0), 0)).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="left">-</TableCell>
                  <TableCell align="left">
                    ₹{Math.round(data.release.reduce((prev, cur) => prev + (+cur.payableAmount || 0), 0)).toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell align="left">-</TableCell>
                </TableRow>
              </TableFooter>
            )}
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

  function FinancePayments() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const paymentsList = [];
    const seenProofs = new Set();

    // Pre-compute which bank accounts have at least one verified payment
    const verifiedBankMap = {};
    if (data?.financePayments) {
      data.financePayments.forEach((fp) => {
        if (fp.isVerified && fp.bank?.accountNo) {
          if (!verifiedBankMap[fp.bank.accountNo]) {
            verifiedBankMap[fp.bank.accountNo] = {
              verifiedAmount: fp.verifiedAmount,
              verifiedProof: fp.verifiedProof,
              verifiedAt: fp.verifiedAt,
            };
          }
        }
      });
    }

    // 1. From data.financePayments
    if (data?.financePayments && data.financePayments.length > 0) {
      data.financePayments.forEach((fp, idx) => {
        const matchedBank = (data?.customer?.bank || []).find(
          (b) =>
            (b._id && fp.bank?.bankId && String(b._id) === String(fp.bank.bankId)) ||
            (b.accountNo && fp.bank?.accountNo && String(b.accountNo) === String(fp.bank.accountNo))
        );
        const fullBank = matchedBank ? { ...matchedBank, ...fp.bank } : fp.bank;
        const isCashFp = fp.paymentType === 'cash' || (!fp.bank?.bankName && !fp.bank?.accountNo && (data?.paymentType === 'cash' || data?.paymentType === 'partial'));
        const hasBank = Boolean(!isCashFp && (fullBank?.bankName || fullBank?.accountNo || fp.bank));
        const bankDesc = isCashFp
          ? 'Cash'
          : (fullBank?.bankName && fullBank?.accountNo
              ? `${fullBank.bankName} - ${fullBank.accountNo}`
              : (fullBank?.bankName || (!hasBank && data?.paymentType === 'cash' ? 'Cash' : '-')));

        const isPledgedRelease = data?.saleType === 'pledged' && !data?.assigneeCompleted;
        const stageLabel = fp.stage ? (fp.stage === 'release' ? 'Release' : 'Sale') : (isPledgedRelease ? 'Release' : 'Sale');

        const relBankPayment = (data?.release || []).some((r) => r.paymentType === 'bank');
        const paymentMode = isCashFp
          ? 'Cash'
          : (hasBank
              ? 'Bank Transfer'
              : (stageLabel === 'Release'
                  ? (relBankPayment ? 'Bank Transfer' : 'Cash')
                  : (data?.paymentType && data?.paymentType !== 'partial' ? sentenceCase(data.paymentType) : 'Bank Transfer')));

        const bankVerifiedInfo = fp.bank?.accountNo ? verifiedBankMap[fp.bank.accountNo] : null;
        const effectiveIsVerified = fp.isVerified || Boolean(bankVerifiedInfo);
        const effectiveVerifiedAmount = fp.verifiedAmount ?? bankVerifiedInfo?.verifiedAmount;
        const effectiveVerifiedProof = fp.verifiedProof || bankVerifiedInfo?.verifiedProof;
        const effectiveVerifiedAt = fp.verifiedAt || bankVerifiedInfo?.verifiedAt;

        if (fp.proof) seenProofs.add(fp.proof);
        if (effectiveVerifiedProof) seenProofs.add(effectiveVerifiedProof);

        // 1. Payment row
        paymentsList.push({
          id: fp._id || `fin_pay_${idx}`,
          stage: stageLabel,
          stageKey: fp.stage || (isPledgedRelease ? 'release' : 'sale'),
          bankDetails: bankDesc,
          fullBank,
          paymentType: paymentMode,
          amount: fp.amount,
          comments: fp.comments || '-',
          proof: fp.proof,
          isVerified: effectiveIsVerified,
          verifiedAmount: effectiveVerifiedAmount,
          createdAt: fp.createdAt,
          raw: fp,
        });

        // 2. Individual Bank Verification row
        if (fp.isVerified && (effectiveVerifiedProof || effectiveVerifiedAmount !== undefined)) {
          paymentsList.push({
            id: `fin_pay_verify_${fp._id || idx}`,
            stage: 'Sale',
            stageKey: 'sale',
            bankDetails: bankDesc,
            fullBank,
            paymentType: 'Bank Verification',
            amount: effectiveVerifiedAmount !== undefined && effectiveVerifiedAmount !== null ? effectiveVerifiedAmount : fp.amount,
            comments: 'Verified Bank Payment Proof',
            proof: effectiveVerifiedProof,
            isVerified: true,
            createdAt: effectiveVerifiedAt || fp.createdAt,
            raw: fp,
            isVerificationRow: true,
          });
        }
      });
    }

    // 2. Fallback if no financePayments array but financeProof or financeAmount exists on data
    if (paymentsList.length === 0 && (data?.financeProof || data?.financeAmount || (data?.payableAmount && data?.paymentType && data?.paymentType !== 'cash'))) {
      const matchedBank = (data?.customer?.bank || []).find(
        (b) =>
          (b._id && data?.bank?._id && String(b._id) === String(data.bank._id)) ||
          (b._id && typeof data?.bank === 'string' && String(b._id) === String(data.bank)) ||
          (b.accountNo && data?.bank?.accountNo && String(b.accountNo) === String(data.bank.accountNo))
      );
      const fullBank = matchedBank ? { ...matchedBank, ...(typeof data.bank === 'object' ? data.bank : {}) } : data.bank;
      const bankDesc = fullBank?.bankName && fullBank?.accountNo
        ? `${fullBank.bankName} - ${fullBank.accountNo}`
        : (fullBank?.bankName || (data?.paymentType === 'cash' ? 'Cash' : '-'));

      if (data?.financeProof) seenProofs.add(data.financeProof);
      if (data?.verifiedFinanceProof) seenProofs.add(data.verifiedFinanceProof);

      paymentsList.push({
        id: 'legacy_finance_payment',
        stage: 'Sale',
        stageKey: 'sale',
        bankDetails: bankDesc,
        fullBank,
        paymentType: data?.paymentType ? sentenceCase(data.paymentType) : 'Bank Transfer',
        amount: data?.financeAmount || (data?.paymentType !== 'cash' ? data?.payableAmount : (data?.cashAmount || data?.payableAmount)),
        comments: data?.financeComments || data?.comments || '-',
        proof: data?.financeProof,
        isVerified: data?.isFinancePaymentVerified || false,
        verifiedAmount: data?.verifiedFinanceAmount,
        createdAt: data?.financeCompletedAt || data?.updatedAt || data?.createdAt,
        raw: null,
      });

      if (data?.isFinancePaymentVerified && (data?.verifiedFinanceProof || data?.verifiedFinanceAmount !== undefined)) {
        paymentsList.push({
          id: 'legacy_finance_payment_verify',
          stage: 'Sale',
          stageKey: 'sale',
          bankDetails: bankDesc,
          fullBank,
          paymentType: 'Bank Verification',
          amount: data?.verifiedFinanceAmount !== undefined ? data?.verifiedFinanceAmount : data?.financeAmount,
          comments: 'Verified Bank Payment Proof',
          proof: data?.verifiedFinanceProof,
          isVerified: true,
          createdAt: data?.financeVerifiedAt || data?.financeCompletedAt || data?.updatedAt,
          raw: null,
          isVerificationRow: true,
        });
      }
    }

    // 3. Fund transfer proof on data
    if (data?.fundTransferProof || data?.fundTransferAmount) {
      if (data?.fundTransferProof && !seenProofs.has(data.fundTransferProof)) {
        seenProofs.add(data.fundTransferProof);
        const bankDesc = data.bank?.bankName && data.bank?.accountNo
          ? `${data.bank.bankName} - ${data.bank.accountNo}`
          : (data.bank?.bankName || '-');
        paymentsList.push({
          id: 'fund_transfer_payment',
          stage: 'Fund Transfer',
          stageKey: 'fund_transfer',
          bankDetails: bankDesc,
          fullBank: data.bank,
          paymentType: 'Bank Transfer',
          amount: data.fundTransferAmount || data.payableAmount,
          comments: data.fundTransferComments || '-',
          proof: data.fundTransferProof,
          isVerified: false,
          createdAt: data.fundTransferCompletedAt || data.updatedAt,
          raw: null,
        });
      }
    }

    // 4. Release finance proofs from data.release
    data?.release?.forEach((r, rIdx) => {
      if (r.financeProof && !seenProofs.has(r.financeProof)) {
        seenProofs.add(r.financeProof);
        const bankDesc = r.bank?.bankName && r.bank?.accountNo
          ? `${r.bank.bankName} - ${r.bank.accountNo}`
          : (r.bank?.bankName || '-');
        paymentsList.push({
          id: `rel_finance_${r._id || rIdx}`,
          stage: 'Release',
          stageKey: 'release',
          bankDetails: bankDesc,
          fullBank: r.bank,
          paymentType: 'Pledged Release',
          amount: r.payableAmount,
          comments: r.comments || '-',
          proof: r.financeProof,
          isVerified: false,
          createdAt: r.createdAt,
          raw: null,
        });
      }
      if (r.fundTransferProof && !seenProofs.has(r.fundTransferProof)) {
        seenProofs.add(r.fundTransferProof);
        const bankDesc = r.bank?.bankName && r.bank?.accountNo
          ? `${r.bank.bankName} - ${r.bank.accountNo}`
          : (r.bank?.bankName || '-');
        paymentsList.push({
          id: `rel_ft_${r._id || rIdx}`,
          stage: 'Fund Transfer',
          stageKey: 'fund_transfer',
          bankDetails: bankDesc,
          fullBank: r.bank,
          paymentType: 'Pledged Release Fund Transfer',
          amount: r.payableAmount,
          comments: r.comments || '-',
          proof: r.fundTransferProof,
          isVerified: false,
          createdAt: r.createdAt,
          raw: null,
        });
      }
    });

    // 5. Any proof in data?.proof that is a finance proof
    (data?.proof || []).forEach((p, pIdx) => {
      const isFinProof =
        p.uploadName === 'finance_proof' ||
        p.uploadName === 'sale_finance_proof' ||
        p.uploadName === 'sale_proof' ||
        p.uploadName === 'verified_bank_proof' ||
        p.documentType === 'Finance Proof' ||
        p.documentType === 'Sale Finance Proof' ||
        p.documentType === 'Release Finance Proof' ||
        p.documentType === 'Verified Bank Payment Proof';

      if (isFinProof && p.uploadedFile && !seenProofs.has(p.uploadedFile)) {
        const isVerifiedDoc = p.uploadName === 'verified_bank_proof' || p.documentType === 'Verified Bank Payment Proof';

        const cashRowIndex = paymentsList.findIndex(pay => 
            (pay.paymentType?.toLowerCase().includes('cash') || pay.bankDetails?.toLowerCase() === 'cash') 
            && !pay.proof && !pay.isVerificationRow
        );

        if (cashRowIndex !== -1 && !isVerifiedDoc && p.uploadName !== 'transit_proof') {
           paymentsList[cashRowIndex].proof = p.uploadedFile;
           seenProofs.add(p.uploadedFile);
           return;
        }

        seenProofs.add(p.uploadedFile);
        let extractedBank = '-';
        let extractedAmount = '';
        if (p.documentNo && p.documentNo.includes(' | ')) {
          const parts = p.documentNo.split(' | ');
          extractedBank = parts[0];
          if (parts[1] && parts[1].startsWith('₹')) {
            extractedAmount = parts[1].replace('₹', '').replace(/,/g, '');
          }
        } else if (p.documentNo && p.documentNo.startsWith('₹')) {
          extractedAmount = p.documentNo.replace('₹', '').replace(/,/g, '');
        } else if (p.documentNo && p.documentNo !== 'N/A') {
          extractedBank = p.documentNo;
        }
        const isRel =
          (p.documentType || '').toLowerCase().includes('release') ||
          (p.uploadName || '').toLowerCase().includes('release') ||
          (data?.saleType === 'pledged' && !data?.assigneeCompleted);
        const hasExtractedBank = extractedBank && extractedBank !== '-';
        paymentsList.push({
          id: p._id || `extra_fin_proof_${pIdx}`,
          stage: isRel ? 'Release' : 'Sale',
          stageKey: isRel ? 'release' : 'sale',
          bankDetails: extractedBank,
          paymentType: isVerifiedDoc
            ? 'Bank Verification'
            : 'Finance Proof',
          amount: extractedAmount || data?.payableAmount || data?.netAmount,
          comments: isVerifiedDoc ? 'Verified Bank Payment Proof' : '-',
          proof: p.uploadedFile,
          isVerified: isVerifiedDoc,
          createdAt: p.createdAt,
          raw: null,
          isVerificationRow: isVerifiedDoc,
        });
      }
    });

    // Sort: Bank Verification rows always last
    const finalPaymentsList = [
      ...paymentsList.filter((p) => p.paymentType !== 'Bank Verification'),
      ...paymentsList.filter((p) => p.paymentType === 'Bank Verification'),
    ];

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - finalPaymentsList.length) : 0;
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
                <TableCell align="left">Stage</TableCell>
                <TableCell align="left">Payment Mode</TableCell>
                <TableCell align="left">Bank Details</TableCell>
                <TableCell align="left">Amount</TableCell>
                <TableCell align="left">Date</TableCell>
                <TableCell align="left">Proof</TableCell>
                <TableCell align="left">Verification Status</TableCell>
                <TableCell align="left">Comments</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {finalPaymentsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => {
                const proofUrl = e.proof ? (e.proof.startsWith('http') ? e.proof : `${global.baseURL}/${e.proof}`) : '';
                const isImg = Boolean(e.proof && e.proof.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i));
                const isCash =
                  (e.paymentType && e.paymentType.toLowerCase().includes('cash')) ||
                  (e.paymentType && e.paymentType.toLowerCase().includes('partial')) ||
                  (e.paymentType && e.paymentType.toLowerCase().includes('payment proof')) ||
                  (e.paymentType && e.paymentType.toLowerCase().includes('finance proof')) ||
                  (e.bankDetails && e.bankDetails.toLowerCase().includes('cash')) ||
                  (e.raw?.paymentMode && e.raw.paymentMode.toLowerCase().includes('cash')) ||
                  (e.raw?.paymentType && e.raw.paymentType.toLowerCase().includes('cash')) ||
                  (!e.fullBank?.accountNo && data?.paymentType?.toLowerCase() === 'cash');

                return (
                  <TableRow hover key={e.id || index} tabIndex={-1}>
                    <TableCell align="left">
                      <Chip
                        size="small"
                        label={e.stage}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          ...(e.stageKey === 'sale' && { bgcolor: '#e8f5e9', color: '#2e7d32' }),
                          ...(e.stageKey === 'release' && { bgcolor: '#e3f2fd', color: '#1565c0' }),
                          ...(e.stageKey === 'fund_transfer' && { bgcolor: '#fff8e1', color: '#f57f17' }),
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">
                      {e.isVerificationRow ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                          Bank Verification
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {e.paymentType}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {e.bankDetails && e.bankDetails !== '-' ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {e.bankDetails}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {e.amount !== undefined && e.amount !== null && e.amount !== '' ? (
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                          ₹{Number(e.amount).toLocaleString('en-IN')}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="left">
                      <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {e.createdAt ? moment(e.createdAt).format('YYYY-MM-DD HH:mm') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      {proofUrl ? (
                        isImg ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer', display: 'inline-block' }}
                          >
                            <img
                              src={proofUrl}
                              alt={e.isVerificationRow ? 'Verified Proof' : 'Payment Proof'}
                              style={{
                                width: '70px',
                                height: '50px',
                                objectFit: 'contain',
                                borderRadius: '4px',
                                border: e.isVerificationRow ? '1px solid #81c784' : '1px solid #e0e0e0',
                              }}
                            />
                          </a>
                        ) : (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                          >
                            <img src="/assets/doc.svg" alt="document" style={{ width: '45px', margin: '0 auto' }} />
                            <Typography variant="caption" display="block" sx={{ color: 'primary.main', fontWeight: 600 }}>
                              View Proof
                            </Typography>
                          </a>
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {isCash ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                      ) : e.isVerificationRow ? (
                        <Chip
                          size="small"
                          icon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: '#2e7d32 !important' }} />}
                          label="Verified"
                          sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      ) : e.isVerified ? (
                        <Chip
                          size="small"
                          icon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: '#2e7d32 !important' }} />}
                          label={e.verifiedAmount !== undefined && e.verifiedAmount !== null ? `Verified: ₹${Number(e.verifiedAmount).toLocaleString('en-IN')}` : 'Verified'}
                          sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            size="small"
                            label="Pending"
                            sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600, fontSize: '0.75rem' }}
                          />
                          {onActionComplete && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<Iconify icon="mdi:shield-check" width={14} />}
                              onClick={() => {
                                setSelectedVerifyTarget({
                                  payment: e.raw || e,
                                  bank: e.fullBank || e.bank,
                                });
                                setOpenVerifyBankModal(true);
                              }}
                              sx={{ fontSize: '0.72rem', py: 0.2, px: 0.8, textTransform: 'none', borderRadius: 1 }}
                            >
                              Verify
                            </Button>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="left">
                      <Typography variant="body2" sx={{ maxWidth: 200, wordBreak: 'break-word', color: 'text.secondary' }}>
                        {e.comments || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
              {paymentsList.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                    <Paper sx={{ textAlign: 'center' }}>
                      <Typography paragraph>No finance payments in table</Typography>
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
          count={paymentsList.length}
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
    if (data?.financePayments) {
      data.financePayments.forEach(fp => {
        if (fp.proof) manualProofUrls.push(fp.proof);
        if (fp.verifiedProof) manualProofUrls.push(fp.verifiedProof);
      });
    }
    if (data?.financeProof) manualProofUrls.push(data.financeProof);
    if (data?.verifiedFinanceProof) manualProofUrls.push(data.verifiedFinanceProof);
    if (data?.assigneeProof) manualProofUrls.push(data.assigneeProof);
    if (data?.fundTransferProof) manualProofUrls.push(data.fundTransferProof);

    data?.release?.forEach(r => {
      if (r.financeProof) manualProofUrls.push(r.financeProof);
      if (r.assigneeProof) manualProofUrls.push(r.assigneeProof);
      if (r.fundTransferProof) manualProofUrls.push(r.fundTransferProof);
    });

    const isFinanceDoc = (p) => {
      const uName = (p.uploadName || '').toLowerCase();
      const dType = (p.documentType || '').toLowerCase();
      return (
        ['finance_proof', 'sale_finance_proof', 'sale_proof', 'release_finance_proof', 'verified_bank_proof'].includes(uName) ||
        dType.includes('finance') ||
        dType.includes('verified bank payment')
      );
    };

    const ornamentFileUrls = new Set();
    (data?.ornaments || []).forEach(o => {
      if (o.ornamentPhoto) ornamentFileUrls.add(o.ornamentPhoto);
      if (o.billProof) ornamentFileUrls.add(o.billProof);
    });

    const isTransitDoc = (p) =>
      ['transit_proof', 'transit_received_proof', 'store_transit_received_proof', 'admin_transit_proof'].includes(p?.uploadName) ||
      (p?.documentType && p.documentType.toLowerCase().includes('transit')) ||
      (p?.uploadName && p.uploadName.toLowerCase().includes('transit'));

    const isMeltingDoc = (p) =>
      ['melt_proof', 'pre_melt_proof', 'after_melt_proof'].includes(p?.uploadName) ||
      (p?.documentType && p.documentType.toLowerCase().includes('melt')) ||
      (p?.uploadName && p.uploadName.toLowerCase().includes('melt'));

    const baseProofs = [...(data?.proof || [])]
      .filter(p => !ornamentFileUrls.has(p.uploadedFile) && !manualProofUrls.includes(p.uploadedFile) && !isTransitDoc(p) && !isMeltingDoc(p) && !isFinanceDoc(p))
      .map(p => ({ ...p }));

    const allProofs = [...baseProofs];

    const isPhysical = data?.saleType === 'physical';
    if (data?.assigneeProof) {
      allProofs.push({ uploadedFile: data.assigneeProof, documentType: isPhysical ? 'Assignee Proof' : 'Release Assignee Proof', documentNo: 'N/A', _id: 'sale_assignee' });
    }

    data?.release?.forEach(r => {
      if (r.assigneeProof) {
        allProofs.push({ uploadedFile: r.assigneeProof, documentType: 'Release Assignee Proof', documentNo: 'N/A', _id: `rel_assignee_${r._id}` });
      }
    });

    (data?.customer?.bank || []).forEach((b, idx) => {
      if (b.proof?.uploadedFile) {
        const bankDesc = b.bankName && b.accountNo ? `${b.bankName} - ${b.accountNo}` : (b.bankName || 'Bank Account');
        const docType = b.proof.documentType || 'Bank Proof';
        allProofs.push({
          uploadedFile: b.proof.uploadedFile,
          documentType: docType,
          displayType: docType,
          baseDisplayType: docType,
          bankDetails: bankDesc,
          documentNo: bankDesc,
          _id: `cust_bank_proof_${b._id || idx}`,
          createdAt: b.proof.createdAt || b.createdAt,
          categoryRank: 2,
          categoryLabel: 'Sale',
        });
      }
    });

    data?.ornaments?.forEach((orn, idx) => {
      const typeLabel = orn.ornamentType || `Ornament #${idx + 1}`;
      if (orn.ornamentPhoto) {
        allProofs.push({
          uploadedFile: orn.ornamentPhoto,
          documentType: `Ornament Photo (${typeLabel})`,
          displayType: `Ornament Photo (${typeLabel})`,
          documentNo: 'N/A',
          _id: `orn_photo_${idx}`,
        });
      }
      if (orn.billProof) {
        const formattedDate = orn.billDate ? (orn.billDate.split('T')[0] || orn.billDate) : 'N/A';
        allProofs.push({
          uploadedFile: orn.billProof,
          documentType: `Ornament Purchase Bill (${typeLabel})`,
          displayType: `Ornament Purchase Bill (${typeLabel})`,
          documentNo: formattedDate,
          _id: `orn_bill_${idx}`,
        });
      }
    });

    allProofs.forEach(e => {
       const releaseDoc = data?.release?.flatMap((r) => r.proofDocuments || [])?.find((doc) => doc.documentFile === e.uploadedFile);
       let docType = e.documentType || releaseDoc?.documentType;
       let displayType = docType ? sentenceCase(docType) : 'Release Document';
       
       if (!docType && e.uploadName && e.uploadName !== 'Release Document' && e.uploadName !== 'release') {
         if (e.uploadName === 'finance_proof') {
           displayType = isPhysical ? 'Finance Proof' : 'Sale Finance Proof';
         } else if (e.uploadName === 'sale_finance_proof' || e.uploadName === 'sale_proof') {
           displayType = 'Sale Finance Proof';
         } else if (e.uploadName === 'transit_proof') {
           displayType = 'Transit Dispatch Proof';
         } else if (e.uploadName === 'transit_received_proof') {
           displayType = 'Transit Received Proof';
         } else if (e.uploadName === 'melt_proof') {
           displayType = 'Initial Batch Proof (Before Melt)';
         } else if (e.uploadName === 'pre_melt_proof') {
           displayType = 'Pre-Melt Proof (Stage 1)';
         } else if (e.uploadName === 'after_melt_proof') {
           displayType = 'After Melt Proof';
         } else {
           displayType = e.uploadName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
         }
       } else if (docType === 'Release Finance Proof' || docType === 'Finance Proof') {
           displayType = isPhysical ? 'Finance Proof' : (docType === 'Release Finance Proof' ? 'Release Finance Proof' : 'Finance Proof');
       } else if (docType === 'Sale Finance Proof') {
           displayType = 'Sale Finance Proof';
       }

       if (displayType.toLowerCase() === 'sale finance proof') displayType = 'Sale Finance Proof';
       if (displayType.toLowerCase() === 'release finance proof' || displayType.toLowerCase() === 'release finance document') displayType = 'Release Finance Proof';
       
       e.baseDisplayType = displayType;
       e.documentNo = e.documentNo || releaseDoc?.documentNo || 'N/A';

       if (!e.bankDetails) {
         if (e.uploadName === 'finance_proof') {
           if (e.documentNo && e.documentNo.includes(' - ')) {
             const parts = e.documentNo.split(' | ');
             e.bankDetails = parts[0];
             if (parts[1] && parts[1].startsWith('₹')) {
               e.amount = parts[1].replace('₹', '').replace(/,/g, '');
             }
           } else {
             e.bankDetails = '-';
           }
         } else {
           e.bankDetails = '-';
         }
       }
    });

    const proofTypeTotals = {};
    allProofs.forEach(e => {
      const typeKey = e.baseDisplayType || 'Document';
      proofTypeTotals[typeKey] = (proofTypeTotals[typeKey] || 0) + 1;
    });

    const proofTypeCounters = {};
    allProofs.forEach(e => {
      const typeKey = e.baseDisplayType || 'Document';
      if (proofTypeTotals[typeKey] > 1 && typeKey.toLowerCase().includes('finance proof')) {
        proofTypeCounters[typeKey] = (proofTypeCounters[typeKey] || 0) + 1;
        e.displayType = `${typeKey} ${proofTypeCounters[typeKey]}`;
      } else {
        e.displayType = typeKey;
      }
    });

    const getCategoryInfo = (proof) => {
      const uploadName = proof.uploadName || '';
      const docType = (proof.documentType || proof.baseDisplayType || '').toLowerCase();
      const id = String(proof._id || '');

      if (
        id.startsWith('rel_') ||
        (docType.includes('release') && !docType.includes('sale finance')) ||
        uploadName === 'release' ||
        (!isPhysical && uploadName === 'finance_proof' && id.startsWith('rel_'))
      ) {
        return { rank: 1, label: 'Release' };
      }

      // 2. Sale
      return { rank: 2, label: 'Sale' };
    };

    allProofs.forEach(e => {
      const cat = getCategoryInfo(e);
      e.categoryRank = cat.rank;
      e.categoryLabel = cat.label;
    });

    // Arrange proofs strictly: Release (1) -> Sale (2)
    allProofs.sort((a, b) => {
      if (a.categoryRank !== b.categoryRank) {
        return a.categoryRank - b.categoryRank;
      }
      return 0;
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
                <TableCell align="left">Stage</TableCell>
                <TableCell align="left">Document Type</TableCell>
                <TableCell align="left">Bank Details</TableCell>
                <TableCell align="left">Amount / Ref No</TableCell>
                <TableCell align="left">File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allProofs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => {
                return (
                  <TableRow hover key={e._id || index} tabIndex={-1}>
                    <TableCell align="left">
                      <Chip
                        size="small"
                        label={e.categoryLabel}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          ...(e.categoryRank === 1 && { bgcolor: '#e3f2fd', color: '#1565c0' }),
                          ...(e.categoryRank === 2 && { bgcolor: '#e8f5e9', color: '#2e7d32' }),
                          ...(e.categoryRank === 3 && { bgcolor: '#fff8e1', color: '#f57f17' }),
                          ...(e.categoryRank === 4 && { bgcolor: '#f3e5f5', color: '#7b1fa2' }),
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">{e.displayType}</TableCell>
                    <TableCell align="left">
                      {e.bankDetails && e.bankDetails !== '-' ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {e.bankDetails}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {e.amount !== undefined && e.amount !== null && e.amount !== '' ? (
                        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                          ₹{Number(e.amount).toLocaleString('en-IN')}
                        </Typography>
                      ) : (
                        e.documentNo || '-'
                      )}
                    </TableCell>
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
                            style={{ width: '80px', borderRadius: '4px' }}
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
                  <TableCell colSpan={5} />
                </TableRow>
              )}
              {allProofs.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={5} sx={{ py: 3 }}>
                    <Paper
                      sx={{
                        textAlign: 'center',
                      }}
                    >
                      <Typography paragraph>No proof document in table</Typography>
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

  function TransitProof() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const isTransitDoc = (p) =>
      ['transit_proof', 'transit_received_proof', 'store_transit_received_proof', 'admin_transit_proof'].includes(p?.uploadName) ||
      (p?.documentType && p.documentType.toLowerCase().includes('transit')) ||
      (p?.uploadName && p.uploadName.toLowerCase().includes('transit'));

    const transitProofs = [...(data?.proof || [])]
      .filter(isTransitDoc)
      .map(p => {
        let displayType = p.documentType ? sentenceCase(p.documentType) : 'Transit Proof';
        if (p.uploadName === 'transit_proof') {
          displayType = 'Transit Dispatch Proof';
        } else if (p.uploadName === 'transit_received_proof') {
          displayType = 'Transit Received Proof';
        } else if (p.uploadName === 'store_transit_received_proof') {
          displayType = 'Store Transit Received Proof';
        } else if (p.uploadName === 'admin_transit_proof') {
          displayType = 'Admin Transit Review Proof';
        }

        const matchedTransit = (data?.transits || []).find(
          t =>
            (t.proof && String(t.proof) === String(p._id)) ||
            (t.receivedProof && String(t.receivedProof) === String(p._id)) ||
            (t.storeProof && String(t.storeProof) === String(p._id)) ||
            (t.adminProof && String(t.adminProof) === String(p._id))
        );

        const transitRef = matchedTransit?.transitId || p.documentNo || '-';

        return {
          ...p,
          displayType,
          transitRef,
          transitStatus: matchedTransit?.status ? sentenceCase(matchedTransit.status) : null,
        };
      });

    const transitOrder = {
      'transit_proof': 1,
      'transit_received_proof': 2,
      'store_transit_received_proof': 3,
      'admin_transit_proof': 4,
    };
    transitProofs.sort((a, b) => (transitOrder[a.uploadName] || 99) - (transitOrder[b.uploadName] || 99));

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - transitProofs.length) : 0;
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
                <TableCell align="left">S.No</TableCell>
                <TableCell align="left">Transit ID / Ref</TableCell>
                <TableCell align="left">Document Type</TableCell>
                <TableCell align="left">Upload Date</TableCell>
                <TableCell align="left">Status</TableCell>
                <TableCell align="left">File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transitProofs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => {
                const uploadDate = e.createdAt ? moment(e.createdAt).format('DD-MM-YYYY hh:mm A') : '-';
                return (
                  <TableRow hover key={e._id || index} tabIndex={-1}>
                    <TableCell align="left">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell align="left">
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {e.transitRef}
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Chip
                        size="small"
                        label={e.displayType}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: '#fff8e1',
                          color: '#f57f17',
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">{uploadDate}</TableCell>
                    <TableCell align="left">
                      {e.transitStatus ? (
                        <Chip
                          size="small"
                          label={e.transitStatus}
                          color={
                            (e.transitStatus.toLowerCase() === 'completed' && 'success') ||
                            (e.transitStatus.toLowerCase() === 'moved' && 'success') ||
                            'info'
                          }
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {e?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                        <a
                          href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                            alt="document"
                            style={{ width: '80px', borderRadius: '4px' }}
                          />
                        </a>
                      ) : (
                        <a
                          href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer' }}
                        >
                          <img src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
              {transitProofs.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                    <Paper sx={{ textAlign: 'center' }}>
                      <Typography paragraph>No transit proof document in table</Typography>
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
          count={transitProofs.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  function MeltingProof() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const isMeltingDoc = (p) =>
      ['melt_proof', 'pre_melt_proof', 'after_melt_proof'].includes(p?.uploadName) ||
      (p?.documentType && p.documentType.toLowerCase().includes('melt')) ||
      (p?.uploadName && p.uploadName.toLowerCase().includes('melt'));

    const meltingProofs = [...(data?.proof || [])]
      .filter(isMeltingDoc)
      .map(p => {
        let displayType = p.documentType ? sentenceCase(p.documentType) : 'Melting Proof';
        if (p.uploadName === 'melt_proof') {
          displayType = 'Initial Batch Proof (Before Melt)';
        } else if (p.uploadName === 'pre_melt_proof') {
          displayType = 'Pre-Melt Proof (Stage 1)';
        } else if (p.uploadName === 'after_melt_proof') {
          displayType = 'After Melt Proof';
        }

        const matchedMelting = (data?.meltings || []).find(
          m =>
            (m.meltProof && String(m.meltProof) === String(p._id)) ||
            (m.preMeltProof && String(m.preMeltProof) === String(p._id)) ||
            (m.afterMeltProof && String(m.afterMeltProof) === String(p._id))
        );

        const batchRef = matchedMelting?.batchId || p.documentNo || '-';

        return {
          ...p,
          displayType,
          batchRef,
          meltingStatus: matchedMelting?.status ? sentenceCase(matchedMelting.status) : null,
        };
      });

    const meltOrder = {
      'melt_proof': 1,
      'pre_melt_proof': 2,
      'after_melt_proof': 3,
    };
    meltingProofs.sort((a, b) => (meltOrder[a.uploadName] || 99) - (meltOrder[b.uploadName] || 99));

    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - meltingProofs.length) : 0;
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
                <TableCell align="left">S.No</TableCell>
                <TableCell align="left">Document Type</TableCell>
                <TableCell align="left">Upload Date</TableCell>
                <TableCell align="left">Status</TableCell>
                <TableCell align="left">File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meltingProofs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((e, index) => {
                const uploadDate = e.createdAt ? moment(e.createdAt).format('DD-MM-YYYY hh:mm A') : '-';
                return (
                  <TableRow hover key={e._id || index} tabIndex={-1}>
                    <TableCell align="left">{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell align="left">
                      <Chip
                        size="small"
                        label={e.displayType}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: '#f3e5f5',
                          color: '#7b1fa2',
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">{uploadDate}</TableCell>
                    <TableCell align="left">
                      {e.meltingStatus ? (
                        <Chip
                          size="small"
                          label={e.meltingStatus}
                          color={
                            (e.meltingStatus.toLowerCase() === 'completed' && 'success') ||
                            'info'
                          }
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="left">
                      {e?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i) ? (
                        <a
                          href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                            alt="document"
                            style={{ width: '80px', borderRadius: '4px' }}
                          />
                        </a>
                      ) : (
                        <a
                          href={e?.uploadedFile?.startsWith('http') ? e.uploadedFile : `${global.baseURL}/${e?.uploadedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ cursor: 'pointer' }}
                        >
                          <img src="/assets/doc.svg" alt="document" style={{ width: '80px' }} />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
              {meltingProofs.length === 0 && (
                <TableRow>
                  <TableCell align="center" colSpan={5} sx={{ py: 3 }}>
                    <Paper sx={{ textAlign: 'center' }}>
                      <Typography paragraph>No melting proof document in table</Typography>
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
          count={meltingProofs.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Scrollbar>
    );
  }

  function KycProof() {
    const kycProofs = (data?.customer?.kycProofs || []).filter(
      (p) => p.uploadType !== 'profile_image' && p.uploadName !== 'profile_image' && p.uploadType !== 'profileImage'
    );

    if (!kycProofs || kycProofs.length === 0) {
      return (
        <Paper sx={{ p: 2.5, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No KYC proofs uploaded
          </Typography>
        </Paper>
      );
    }

    return (
      <Grid container spacing={2}>
        {kycProofs.map((e, index) => {
          const isSignature =
            e?.uploadType?.toLowerCase() === 'signature' ||
            e?.uploadName?.toLowerCase() === 'signature' ||
            e?.documentType?.toLowerCase() === 'signature';

          const docName = isSignature
            ? 'Signature'
            : (e?.documentType
                ? sentenceCase(e.documentType)
                : data?.customer?.chooseId
                ? sentenceCase(data.customer.chooseId)
                : sentenceCase(e.uploadType || 'ID Proof'));

          const docNumber = !isSignature ? (e?.documentNo || data?.customer?.idNo || '') : '';
          const fileUrl = e?.uploadedFile?.startsWith('http')
            ? e.uploadedFile
            : `${global.baseURL}/${e?.uploadedFile}`;
          const isImage = Boolean(e?.uploadedFile?.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i));

          return (
            <Grid item xs={12} sm={6} md={4} key={e._id || index}>
              <Card
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify
                      icon={isSignature ? 'fluent:signature-24-filled' : 'mdi:card-account-details-outline'}
                      width={22}
                      sx={{ color: isSignature ? 'info.main' : 'primary.main' }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {docName}
                    </Typography>
                  </Stack>
                  {docNumber && (
                    <Chip
                      size="small"
                      label={docNumber}
                      variant="outlined"
                      color="primary"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  )}
                </Stack>

                <Box
                  sx={{
                    width: '100%',
                    height: 170,
                    borderRadius: 1.5,
                    bgcolor: isSignature ? '#ffffff' : 'background.neutral',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                  }}
                >
                  {isImage ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={fileUrl}
                        alt={docName}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          borderRadius: 4,
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                    >
                      <img src="/assets/doc.svg" alt="document" style={{ width: '60px', margin: '0 auto' }} />
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}>
                        View Document
                      </Typography>
                    </a>
                  )}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
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

  const isTransitDoc = (p) =>
    ['transit_proof', 'transit_received_proof', 'store_transit_received_proof', 'admin_transit_proof'].includes(p?.uploadName) ||
    (p?.documentType && p.documentType.toLowerCase().includes('transit')) ||
    (p?.uploadName && p.uploadName.toLowerCase().includes('transit'));

  const isMeltingDoc = (p) =>
    ['melt_proof', 'pre_melt_proof', 'after_melt_proof'].includes(p?.uploadName) ||
    (p?.documentType && p.documentType.toLowerCase().includes('melt')) ||
    (p?.uploadName && p.uploadName.toLowerCase().includes('melt'));

  const hasTransitProofs = (data?.proof || []).some(isTransitDoc);
  const isMovedToTransit = Boolean(
    hasTransitProofs ||
    (data?.transits && data.transits.length > 0) ||
    ['intransit', 'moved', 'melted'].includes(data?.status?.toLowerCase())
  );

  const hasMeltingProofs = (data?.proof || []).some(isMeltingDoc);
  const isMovedToMelting = Boolean(
    hasMeltingProofs ||
    (data?.meltings && data.meltings.length > 0) ||
    data?.isMelted ||
    data?.meltingStatus === 'melted' ||
    data?.meltingStatus === 'partial' ||
    data?.status?.toLowerCase() === 'melted' ||
    data?.ornaments?.some(o => o.status === 'melted')
  );

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
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ color: 'text.secondary', flexWrap: 'wrap', gap: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Iconify icon="eva:email-fill" width={20} />
                        <Typography variant="body2">{data?.customer?.email || 'N/A'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Iconify icon="eva:phone-fill" width={20} />
                        <Typography variant="body2">{global.maskPhoneNumber(data?.customer?.phoneNumber) || data?.customer?.phoneNumber || 'N/A'}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Iconify icon="eva:phone-outline" width={20} />
                        <Typography variant="body2">
                          Alt: {(data?.customer?.alternatePhoneNumber || data?.customer?.alternateNumber)
                            ? (global.maskPhoneNumber(data?.customer?.alternatePhoneNumber || data?.customer?.alternateNumber) || (data?.customer?.alternatePhoneNumber || data?.customer?.alternateNumber))
                            : 'N/A'}
                        </Typography>
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
            {(() => {
              const rawFinanceBanks = (data?.financePayments || [])
                .filter((fp) => fp.bank?.bankName || fp.bank?.accountNo);

              const bankMap = new Map();
              rawFinanceBanks.forEach((fp, idx) => {
                const key = fp.bank?.accountNo || fp.bank?.bankId || String(idx);
                const matchedBank = (data?.customer?.bank || []).find(
                  (b) =>
                    (b._id && fp.bank?.bankId && String(b._id) === String(fp.bank.bankId)) ||
                    (b.accountNo && fp.bank?.accountNo && String(b.accountNo) === String(fp.bank.accountNo))
                );
                const item = {
                  payment: fp,
                  paymentIndex: idx,
                  fullBank: matchedBank ? { ...matchedBank, ...fp.bank, proof: matchedBank.proof || fp.bank?.proof } : fp.bank,
                  amount: fp.amount,
                  isVerified: fp.isVerified || false,
                  verifiedAmount: fp.verifiedAmount,
                  verifiedProof: fp.verifiedProof,
                };
                if (!bankMap.has(key) || fp.isVerified) {
                  bankMap.set(key, item);
                }
              });
              const financeBanks = Array.from(bankMap.values());

              if (financeBanks.length > 0) {
                return (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1.5 }}>
                      Bank Details ({financeBanks.length} Disbursed Account{financeBanks.length > 1 ? 's' : ''}):
                    </Typography>
                    <Stack spacing={2}>
                      {financeBanks.map((fb, idx) => (
                        <BankDetailCard
                          key={fb.payment?._id || idx}
                          bank={fb.fullBank}
                          paymentType={data?.paymentType}
                          amount={fb.amount}
                          isVerified={fb.isVerified}
                          verifiedAmount={fb.verifiedAmount}
                          verifiedProof={fb.verifiedProof}
                          onVerifyClick={() => {
                            setSelectedVerifyTarget({
                              payment: fb.payment,
                              bank: fb.fullBank,
                            });
                            setOpenVerifyBankModal(true);
                          }}
                        />
                      ))}
                    </Stack>
                  </Grid>
                );
              }

              if (data?.paymentType === 'bank' || data?.bank?.accountNo || data?.bank) {
                const matchedBank = (data?.customer?.bank || []).find(
                  (b) =>
                    (b._id && data?.bank?._id && String(b._id) === String(data.bank._id)) ||
                    (b._id && typeof data?.bank === 'string' && String(b._id) === String(data.bank)) ||
                    (b.accountNo && data?.bank?.accountNo && String(b.accountNo) === String(data.bank.accountNo))
                );
                const fullBank = matchedBank ? { ...matchedBank, ...(typeof data.bank === 'object' ? data.bank : {}), proof: matchedBank.proof || data.bank?.proof } : data.bank;
                return (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                      Bank Detail:
                    </Typography>
                    <BankDetailCard bank={fullBank} paymentType={data?.paymentType} />
                  </Grid>
                );
              }

              return null;
            })()}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Finance Payments
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FinancePayments />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                Proof Documents
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Proof />
            </Grid>
            {isMovedToTransit && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                    Transit Proofs
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TransitProof />
                </Grid>
              </>
            )}
            {isMovedToMelting && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 1 }}>
                    Melting Proofs
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <MeltingProof />
                </Grid>
              </>
            )}
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
                      {data.paymentType === 'partial' && (
                        <>
                          <TableCell align="left">Cash Amount: ₹{Math.round(data.cashAmount || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell align="left">Bank Amount: ₹{Math.round(data.bankAmount || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell align="left">-</TableCell>
                        </>
                      )}
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

      <VerifyBankPaymentModal
        open={openVerifyBankModal}
        onClose={() => {
          setOpenVerifyBankModal(false);
          setSelectedVerifyTarget(null);
        }}
        saleId={id || data?._id || ''}
        payment={selectedVerifyTarget?.payment}
        bank={selectedVerifyTarget?.bank}
        verifyApi={verifyFinancePayment}
        setNotify={setNotify}
        onSuccess={() => {
          getSalesById(id || data?._id).then((res) => {
            if (res?.status && res?.data) {
              setData(res.data);
            }
          });
        }}
      />
    </>
  );
}
function VerificationModal({ open, id, type, handleClose, fetchData, saleType, assigneeCompleted }) {
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ornaments, setOrnaments] = useState([]);
  const [showOrnamentForm, setShowOrnamentForm] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

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
    amount: Yup.number().when([], {
      is: () => type !== 'finance' || saleDetails?.paymentType !== 'partial',
      then: (s) => s.required('Amount is required'),
      otherwise: (s) => s.nullable(),
    }),
    cashAmount: Yup.number().nullable(),
    bankAmount: Yup.number().nullable(),
    comments: Yup.string().required('Comments are required'),
    isCompleted: Yup.boolean(),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue, resetForm } = useFormik({
    initialValues: {
      amount: '',
      cashAmount: '',
      bankAmount: '',
      bankId: '',
      comments: '',
      proof: '',
      isCompleted: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      setLoading(true);

      const payload = {};
      if (type === 'finance') {
        const isPartial = saleDetails?.paymentType === 'partial';
        if (isPartial) {
          const cashNum = values.cashAmount !== '' ? Number(values.cashAmount) : 0;
          const bankNum = values.bankAmount !== '' ? Number(values.bankAmount) : 0;
          const newPayments = [];

          if (cashNum > 0) {
            newPayments.push({
              amount: cashNum,
              paymentType: 'cash',
              bank: null,
              proof: '',
              comments: values.comments,
              createdAt: new Date(),
            });
          }

          if (bankNum > 0) {
            newPayments.push({
              amount: bankNum,
              paymentType: 'bank',
              bank: selectedBank ? {
                bankId: selectedBank._id,
                bankName: selectedBank.bankName,
                accountNo: selectedBank.accountNo,
              } : (saleDetails?.bank ? {
                bankId: saleDetails.bank._id || saleDetails.bank,
                bankName: saleDetails.bank.bankName,
                accountNo: saleDetails.bank.accountNo,
              } : null),
              proof: values.proof,
              comments: values.comments,
              createdAt: new Date(),
            });
          }

          payload.newFinancePayments = newPayments;
          payload.financeAmount = (saleDetails?.financeAmount || 0) + cashNum + bankNum;
          payload.payableAmount = saleDetails?.payableAmount;
          payload.financeComments = values.comments;
          if (values.proof) payload.financeProof = values.proof;
        } else {
          payload.financeAmount = values.amount !== '' ? Number(values.amount) : undefined;
          payload.payableAmount = saleDetails?.payableAmount;
          payload.financeComments = values.comments;
          payload.financeProof = values.proof;
          payload.newFinancePayment = {
            amount: values.amount !== '' ? Number(values.amount) : 0,
            paymentType: saleDetails?.paymentType === 'cash' ? 'cash' : 'bank',
            bank: selectedBank ? {
              bankId: selectedBank._id,
              bankName: selectedBank.bankName,
              accountNo: selectedBank.accountNo,
            } : null,
            proof: values.proof,
            comments: values.comments,
            createdAt: new Date(),
          };
        }

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

  useEffect(() => {
    if (open && id) {
      getSalesById(id).then((res) => {
        if (res?.status && res?.data) {
          const sale = res.data;
          setSaleDetails(sale);
          if (type === 'finance') {
            const isPledgedStage = sale.saleType === 'pledged' && !sale.assigneeCompleted;
            if (isPledgedStage) {
              const bReleases = (sale.release || []).filter((r) => r.paymentType === 'bank');
              const totalReleaseBankAmt = bReleases.reduce((sum, r) => sum + (+r.payableAmount || 0), 0);
              const totalReleaseAmt = (sale.release || []).reduce((sum, r) => sum + (+r.payableAmount || 0), 0);
              const targetTotal = bReleases.length > 0 ? totalReleaseBankAmt : totalReleaseAmt;
              const existingReleasePayments = (sale.financePayments || []).filter((fp) => (fp.stage || 'release') === 'release');
              const alreadyPaidRelease = existingReleasePayments.reduce((sum, fp) => sum + (+fp.amount || 0), 0);
              const remRelease = Math.max(0, targetTotal - alreadyPaidRelease);

              setFieldValue('amount', Math.round(remRelease > 0 ? remRelease : targetTotal));

              if (bReleases.length > 0) {
                const targetBankId = bReleases[0]?.bank?._id || bReleases[0]?.bank;
                const foundBank = (sale.customer?.bank || []).find(
                  (b) => String(b._id) === String(targetBankId) || b.accountNo === bReleases[0]?.bank?.accountNo
                );
                if (foundBank) {
                  setSelectedBank(foundBank);
                  setFieldValue('bankId', foundBank._id?.toString() || foundBank.accountNo);
                }
              }
            } else if (sale.paymentType === 'partial') {
              const existingSalePayments = (sale.financePayments || []).filter((fp) => fp.stage === 'sale');
              const alreadyPaidCash = existingSalePayments
                .filter((fp) => fp.paymentType === 'cash' || (!fp.bank?.bankId && !fp.bank?.accountNo && !fp.bank?.bankName))
                .reduce((sum, fp) => sum + (+fp.amount || 0), 0);
              const alreadyPaidBank = existingSalePayments
                .filter((fp) => fp.paymentType === 'bank' || fp.bank?.accountNo || fp.bank?.bankName)
                .reduce((sum, fp) => sum + (+fp.amount || 0), 0);

              const expectedCash = sale.cashAmount || 0;
              const expectedBank = sale.bankAmount || 0;
              const remCash = Math.max(0, expectedCash - alreadyPaidCash);
              const remBank = Math.max(0, expectedBank - alreadyPaidBank);

              setFieldValue('cashAmount', remCash);
              setFieldValue('bankAmount', remBank);
              setFieldValue('amount', remCash + remBank);

              if (sale.bank) {
                const saleBankId = sale.bank._id || sale.bank;
                const found = (sale.customer?.bank || []).find(
                  (b) => String(b._id) === String(saleBankId) || b.accountNo === sale.bank?.accountNo
                );
                if (found) {
                  setSelectedBank(found);
                  setFieldValue('bankId', found._id?.toString() || found.accountNo);
                }
              }
            } else {
              const fullPayable = sale.payableAmount !== undefined && sale.payableAmount !== null ? sale.payableAmount : 0;
              const existingSalePayments = (sale.financePayments || []).filter((fp) => fp.stage === 'sale');
              const alreadyPaidSale = existingSalePayments.reduce((sum, fp) => sum + (+fp.amount || 0), 0);
              const remSale = Math.max(0, fullPayable - alreadyPaidSale);

              setFieldValue('amount', Math.round(remSale > 0 ? remSale : fullPayable));

              if (sale.bank) {
                const saleBankId = sale.bank._id || sale.bank;
                const found = (sale.customer?.bank || []).find((b) => String(b._id) === String(saleBankId));
                if (found) {
                  setSelectedBank(found);
                  setFieldValue('bankId', found._id?.toString() || found.accountNo);
                }
              }
            }
          }
        }
      });
    } else {
      setSaleDetails(null);
      setSelectedBank(null);
    }
  }, [open, id, type]);

  const handleModalClose = () => {
    setPreview(null);
    setFileType('');
    setPdfBlobUrl(null);
    setSelectedBank(null);
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
      setIsUploading(true);
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
      setIsUploading(false);
    }
  };

  const isPledgedReleaseStage = saleDetails?.saleType === 'pledged' && !saleDetails?.assigneeCompleted;
  const bankReleases = isPledgedReleaseStage
    ? (saleDetails?.release || []).filter((r) => r.paymentType === 'bank')
    : [];
  const hasBankRelease = bankReleases.length > 0;
  const showBankDropdown = type === 'finance' && (
    isPledgedReleaseStage ? hasBankRelease : saleDetails?.paymentType !== 'cash'
  );

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{sentenceCase(type || '')} Verification</DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 1 }}>
          <Grid container spacing={3}>
            {type === 'finance' && saleDetails?.paymentType === 'partial' ? (
              <>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#f4f6f8', borderRadius: 1.5, border: '1px dashed #cfd8dc' }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 700 }}>
                      Partial Payment Breakdown
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">Total Payable</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          ₹{Number(saleDetails?.payableAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">Expected Cash</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                          ₹{Number(saleDetails?.cashAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">Expected Bank</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.dark' }}>
                          ₹{Number(saleDetails?.bankAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="cashAmount"
                    label="Cash Amount"
                    type="number"
                    value={values.cashAmount}
                    error={touched.cashAmount && errors.cashAmount && true}
                    helperText={touched.cashAmount && errors.cashAmount ? errors.cashAmount : `Expected: ₹${Number(saleDetails?.cashAmount || 0).toLocaleString('en-IN')}`}
                    fullWidth
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="bankAmount"
                    label="Bank Amount"
                    type="number"
                    value={values.bankAmount}
                    error={touched.bankAmount && errors.bankAmount && true}
                    helperText={touched.bankAmount && errors.bankAmount ? errors.bankAmount : `Expected: ₹${Number(saleDetails?.bankAmount || 0).toLocaleString('en-IN')}`}
                    fullWidth
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="choose-bank-label">Choose Bank (for Bank portion)</InputLabel>
                    <Select
                      labelId="choose-bank-label"
                      id="choose-bank-select"
                      name="bankId"
                      value={values.bankId || ''}
                      label="Choose Bank (for Bank portion)"
                      onChange={(e) => {
                        handleChange(e);
                        const banks = saleDetails?.customer?.bank || [];
                        const found = banks.find((b) => (b._id?.toString() || b.accountNo) === e.target.value);
                        setSelectedBank(found || null);
                      }}
                    >
                      {(saleDetails?.customer?.bank || []).map((b) => (
                        <MenuItem key={b._id || b.accountNo} value={b._id?.toString() || b.accountNo}>
                          {b.bankName} - {b.accountNo}
                        </MenuItem>
                      ))}
                      {(!saleDetails?.customer?.bank || saleDetails?.customer?.bank.length === 0) && (
                        <MenuItem value="" disabled>
                          No bank added for this customer
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : (
              <>
                {showBankDropdown && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="choose-bank-label">
                        {isPledgedReleaseStage ? 'Choose Release Bank' : 'Choose Bank'}
                      </InputLabel>
                      <Select
                        labelId="choose-bank-label"
                        id="choose-bank-select"
                        name="bankId"
                        value={values.bankId || ''}
                        label={isPledgedReleaseStage ? 'Choose Release Bank' : 'Choose Bank'}
                        onChange={(e) => {
                          handleChange(e);
                          const banks = saleDetails?.customer?.bank || [];
                          const found = banks.find((b) => (b._id?.toString() || b.accountNo) === e.target.value);
                          setSelectedBank(found || null);
                        }}
                      >
                        {(saleDetails?.customer?.bank || []).map((b) => {
                          const isRelBank = (saleDetails?.release || []).some(
                            (r) => String(r.bank?._id || r.bank) === String(b._id) || r.bank?.accountNo === b.accountNo
                          );
                          return (
                            <MenuItem key={b._id || b.accountNo} value={b._id?.toString() || b.accountNo}>
                              {b.bankName} - {b.accountNo} {isRelBank ? '(Release Bank)' : ''}
                            </MenuItem>
                          );
                        })}
                        {(!saleDetails?.customer?.bank || saleDetails?.customer?.bank.length === 0) && (
                          <MenuItem value="" disabled>
                            No bank added for this customer
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
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
                    onFocus={(e) => e.target.select()}
                  />
                </Grid>
              </>
            )}
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
              <Typography variant="subtitle2" gutterBottom>
                Upload {type === 'finance' && saleDetails?.paymentType === 'partial' ? 'Bank Transfer Proof/Photo' : 'Proof/Photo'}
              </Typography>
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

