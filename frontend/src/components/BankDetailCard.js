import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  Grid,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import { sentenceCase } from 'change-case';
import Iconify from './iconify';
import global from '../utils/global';

export default function BankDetailCard({ bank, paymentType }) {
  const theme = useTheme();
  const [copiedField, setCopiedField] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);

  if (!bank && (!paymentType || paymentType !== 'bank')) {
    return null;
  }

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const rawProofUrl = bank?.proof?.uploadedFile || '';
  const isHttpUrl = rawProofUrl.startsWith('http');
  const proofUrl = rawProofUrl ? (isHttpUrl ? rawProofUrl : `${global.baseURL}/${rawProofUrl}`) : '';
  const isImageProof = Boolean(rawProofUrl && rawProofUrl.match(/.*(\.jpg|\.jpeg|\.png|\.webp|\.avif)$/i));

  const items = [
    {
      id: 'holder',
      label: 'Account Holder Name',
      value: bank?.accountHolderName ? sentenceCase(bank.accountHolderName) : 'N/A',
      icon: 'eva:person-fill',
      copyValue: bank?.accountHolderName,
      accentColor: theme.palette.primary.main,
    },
    {
      id: 'accNo',
      label: 'Account Number',
      value: bank?.accountNo || 'N/A',
      icon: 'eva:credit-card-fill',
      copyValue: bank?.accountNo,
      accentColor: theme.palette.info.main,
      isMono: true,
    },
    {
      id: 'ifsc',
      label: 'IFSC Code',
      value: bank?.ifscCode || 'N/A',
      icon: 'eva:hash-fill',
      copyValue: bank?.ifscCode,
      accentColor: theme.palette.warning.dark,
      isMono: true,
    },
    {
      id: 'branch',
      label: 'Branch',
      value: bank?.branch || 'N/A',
      icon: 'eva:pin-fill',
      copyValue: bank?.branch,
      accentColor: theme.palette.success.main,
    },
  ];

  return (
    <>
      <Card
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          boxShadow: `0 8px 24px 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          overflow: 'hidden',
          background:
            theme.palette.mode === 'dark'
              ? theme.palette.background.paper
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.lighter || '#f3e5f5', 0.25)} 0%, #FFFFFF 60%)`,
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Grid container spacing={2.5} alignItems="stretch">
            {/* LEFT SIDE: Bank Details */}
            <Grid item xs={12} md={rawProofUrl ? 6.5 : 12}>
              <Stack spacing={1.5}>
                {/* Bank Header Box */}
                <Box
                  sx={{
                    p: 1.75,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        boxShadow: `0 2px 8px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon="mdi:bank" width={24} height={24} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {bank?.bankName || 'Bank Account Details'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {bank?.branch ? `Branch: ${bank.branch}` : 'Payment Disbursement Details'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    icon={<Iconify icon="eva:checkmark-circle-2-fill" width={16} />}
                    label="Bank Transfer"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      bgcolor: alpha(theme.palette.success.main, 0.12),
                      color: 'success.dark',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.24)}`,
                    }}
                  />
                </Box>

                {/* 2x2 Details Grid */}
                <Grid container spacing={1.5}>
                  {items.map((item) => (
                    <Grid item xs={12} sm={6} key={item.id}>
                      <Box
                        sx={{
                          p: 1.5,
                          height: '100%',
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.grey[500], 0.04),
                          border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            borderColor: alpha(theme.palette.primary.main, 0.24),
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 12px 0 ${alpha(theme.palette.grey[500], 0.1)}`,
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(item.accentColor, 0.12),
                                color: item.accentColor,
                              }}
                            >
                              <Iconify icon={item.icon} width={13} height={13} />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                color: 'text.secondary',
                                fontSize: '0.68rem',
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Stack>

                          {item.copyValue && (
                            <Tooltip title={copiedField === item.id ? 'Copied!' : 'Copy'} arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(item.copyValue, item.id)}
                                sx={{
                                  p: 0.5,
                                  color: copiedField === item.id ? 'success.main' : 'text.disabled',
                                  '&:hover': { color: 'primary.main' },
                                }}
                              >
                                <Iconify
                                  icon={copiedField === item.id ? 'eva:checkmark-fill' : 'eva:copy-outline'}
                                  width={15}
                                  height={15}
                                />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            wordBreak: 'break-word',
                            fontFamily: item.isMono ? 'monospace' : 'inherit',
                            fontSize: item.isMono ? '0.92rem' : '0.88rem',
                            letterSpacing: item.isMono ? '0.5px' : 'normal',
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>

            {/* RIGHT SIDE: Large Bank Proof Preview */}
            {rawProofUrl && (
              <Grid item xs={12} md={5.5}>
                <Box
                  sx={{
                    height: '100%',
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Proof Top Bar */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.25 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify icon="mdi:file-document-check-outline" width={20} height={20} sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        Bank Proof
                      </Typography>
                      <Chip
                        size="small"
                        label="Passbook / Cheque"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      {isImageProof && (
                        <Tooltip title="Enlarge View" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setOpenPreview(true)}
                            sx={{ color: 'primary.main' }}
                          >
                            <Iconify icon="eva:maximize-2-outline" width={18} height={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Open Full Document" arrow>
                        <IconButton
                          size="small"
                          component="a"
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                        >
                          <Iconify icon="eva:external-link-outline" width={18} height={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {/* Large Image Box */}
                  <Box
                    onClick={() => isImageProof && setOpenPreview(true)}
                    sx={{
                      position: 'relative',
                      flexGrow: 1,
                      minHeight: 180,
                      maxHeight: 230,
                      width: '100%',
                      borderRadius: 1.25,
                      overflow: 'hidden',
                      bgcolor: '#fff',
                      border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                      boxShadow: `0 2px 8px 0 ${alpha(theme.palette.grey[500], 0.12)}`,
                      cursor: isImageProof ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover .zoom-overlay': { opacity: 1 },
                    }}
                  >
                    {isImageProof ? (
                      <>
                        <Box
                          component="img"
                          src={proofUrl}
                          alt="Bank Proof"
                          sx={{
                            width: '100%',
                            height: '100%',
                            maxHeight: 230,
                            objectFit: 'contain',
                            p: 0.5,
                            transition: 'transform 0.25s ease-in-out',
                            '&:hover': { transform: 'scale(1.02)' },
                          }}
                        />
                        <Box
                          className="zoom-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s ease-in-out',
                            color: '#fff',
                            gap: 0.75,
                          }}
                        >
                          <Iconify icon="eva:eye-fill" width={22} height={22} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                            Click to Enlarge
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Stack alignItems="center" spacing={1} sx={{ p: 2 }}>
                        <Iconify icon="mdi:file-document-outline" width={48} height={48} sx={{ color: 'info.main' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Document Attached (PDF / Non-Image)
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<Iconify icon="eva:external-link-outline" />}
                        >
                          View Document
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  {/* Bottom Action Footer */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 1, pt: 0.5 }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                      Click image to zoom full view
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      color="primary"
                      component="a"
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      endIcon={<Iconify icon="eva:external-link-fill" width={14} height={14} />}
                      sx={{ fontSize: '0.75rem', fontWeight: 700, p: 0.5 }}
                    >
                      Open Full Document
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Card>

      {/* Lightbox / Preview Dialog */}
      {isImageProof && (
        <Dialog
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, overflow: 'hidden' },
          }}
        >
          <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mdi:file-image-outline" width={22} height={22} sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Bank Proof Preview
              </Typography>
            </Stack>
            <IconButton onClick={() => setOpenPreview(false)} size="small">
              <Iconify icon="eva:close-fill" width={20} height={20} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, bgcolor: alpha(theme.palette.grey[500], 0.04), textAlign: 'center' }}>
            <Box
              component="img"
              src={proofUrl}
              alt="Bank Proof Preview"
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: 1,
                boxShadow: 3,
                objectFit: 'contain',
                margin: '0 auto',
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Account: {bank?.accountNo || 'N/A'} • Holder: {bank?.accountHolderName || 'N/A'}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                component="a"
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="eva:external-link-fill" />}
              >
                Open in New Tab
              </Button>
              <Button onClick={() => setOpenPreview(false)} variant="contained" size="small">
                Close
              </Button>
            </Stack>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

BankDetailCard.propTypes = {
  bank: PropTypes.object,
  paymentType: PropTypes.string,
};
