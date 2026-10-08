import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Divider,
  Paper,
  Button,
  Stack,
  Chip,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import moment from 'moment';
import Iconify from '../../iconify';
import global from '../../../utils/global';

export default function CustomerDocumentsGallery({ data }) {
  const [previewMedia, setPreviewMedia] = useState({
    open: false,
    url: '',
    title: '',
    isImage: false,
  });

  if (!data) return null;

  // Aggregate all documents from lead.documents, lead.dispositions, and initial lead.attachment
  const allDocuments = [];

  // 1. Root level documents
  if (data?.documents && Array.isArray(data.documents)) {
    data.documents.forEach((doc) => {
      if (doc?.documentFile) {
        allDocuments.push({
          documentType: doc.documentType || 'Customer Document',
          documentFile: doc.documentFile,
          uploadedAt: doc.uploadedAt,
          uploadedBy: doc.uploadedBy?.employee?.name || doc.uploadedBy?.username || 'Telecaller',
        });
      }
    });
  }

  // 2. Dispositions / call logs
  if (data?.dispositions && Array.isArray(data.dispositions)) {
    data.dispositions.forEach((log) => {
      if (log.documents && Array.isArray(log.documents) && log.documents.length > 0) {
        log.documents.forEach((d) => {
          if (d?.documentFile && !allDocuments.some((x) => x.documentFile === d.documentFile)) {
            allDocuments.push({
              documentType: d.documentType || 'Customer Document',
              documentFile: d.documentFile,
              uploadedAt: log.createdAt,
              uploadedBy: log.createdBy?.employee?.name || log.createdBy?.username || 'Telecaller',
            });
          }
        });
      } else {
        const files = log.attachments?.length > 0 ? log.attachments : log.attachment ? [log.attachment] : [];
        files.forEach((f, idx) => {
          if (f && !allDocuments.some((x) => x.documentFile === f)) {
            allDocuments.push({
              documentType: log.status ? `${log.status} Document` : `Document #${idx + 1}`,
              documentFile: f,
              uploadedAt: log.createdAt,
              uploadedBy: log.createdBy?.employee?.name || log.createdBy?.username || 'Telecaller',
            });
          }
        });
      }
    });
  }

  // 3. Initial lead attachment
  if (data?.attachment && !allDocuments.some((x) => x.documentFile === data.attachment)) {
    allDocuments.push({
      documentType: 'Initial Lead Attachment',
      documentFile: data.attachment,
      uploadedAt: data.createdAt,
      uploadedBy: 'Lead Creation',
    });
  }

  return (
    <Grid item xs={12}>
      <Divider sx={{ my: 3 }} />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'text.primary',
            fontWeight: 700,
          }}
        >
          <Iconify icon="mdi:view-gallery-outline" sx={{ color: 'primary.main', width: 26, height: 26 }} />
          Customer Documents ({allDocuments.length})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Documents received by telecallers from customer
        </Typography>
      </Stack>

      {allDocuments.length > 0 ? (
        <Grid container spacing={2}>
          {allDocuments.map((doc, idx) => {
            const fileUrl = doc.documentFile?.startsWith('http')
              ? doc.documentFile
              : `${global.baseURL}/${doc.documentFile}`;
            const isImage = Boolean(doc.documentFile?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i));

            return (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': {
                      boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
                      borderColor: 'primary.main',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {/* Heading as Type */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.2,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: 'primary.dark',
                        fontSize: '0.85rem',
                      }}
                      noWrap
                    >
                      {doc.documentType || 'Document'}
                    </Typography>
                    <Chip
                      size="small"
                      label={isImage ? 'Photo' : 'Doc / PDF'}
                      color={isImage ? 'success' : 'info'}
                      variant="filled"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                    />
                  </Box>

                  {/* Thumbnail / Preview Card */}
                  <Box
                    sx={{
                      height: 160,
                      bgcolor: '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                    onClick={() =>
                      setPreviewMedia({
                        open: true,
                        url: fileUrl,
                        title: doc.documentType,
                        isImage,
                      })
                    }
                  >
                    {isImage ? (
                      <Box
                        component="img"
                        src={fileUrl}
                        alt={doc.documentType}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      />
                    ) : (
                      <Stack alignItems="center" spacing={1} sx={{ p: 2, textAlign: 'center' }}>
                        <Iconify
                          icon="mdi:file-pdf-box"
                          width={52}
                          height={52}
                          sx={{ color: 'error.main' }}
                        />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Click to Preview
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {/* Card Footer */}
                  <Box
                    sx={{
                      p: 1.5,
                      mt: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {doc.uploadedAt ? moment(doc.uploadedAt).format('DD MMM YYYY') : '-'}
                      </Typography>
                      {doc.uploadedBy && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.7rem' }}
                          noWrap
                          display="block"
                        >
                          By: {doc.uploadedBy}
                        </Typography>
                      )}
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      endIcon={<Iconify icon="eva:external-link-fill" width={14} height={14} />}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', py: 0.2 }}
                    >
                      Open
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'background.neutral',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Iconify
            icon="mdi:file-document-outline"
            width={40}
            height={40}
            sx={{ color: 'text.secondary', mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            No customer documents uploaded yet. Telecallers can add documents via "+ Add Call Log".
          </Typography>
        </Paper>
      )}

      {/* Lightbox / Preview Dialog */}
      <Dialog
        open={previewMedia.open}
        onClose={() => setPreviewMedia({ open: false, url: '', title: '', isImage: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {previewMedia.title || 'Document Preview'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setPreviewMedia({ open: false, url: '', title: '', isImage: false })}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 320,
            bgcolor: '#f4f6f8',
          }}
        >
          {previewMedia.isImage ? (
            <Box
              component="img"
              src={previewMedia.url}
              alt={previewMedia.title}
              sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 1 }}
            />
          ) : (
            <iframe
              src={previewMedia.url}
              title={previewMedia.title}
              width="100%"
              height="520px"
              style={{ border: 'none', borderRadius: 4 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="outlined"
            href={previewMedia.url}
            target="_blank"
            rel="noreferrer"
            endIcon={<Iconify icon="eva:external-link-fill" />}
          >
            Open in New Tab
          </Button>
          <Button
            variant="contained"
            onClick={() => setPreviewMedia({ open: false, url: '', title: '', isImage: false })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
