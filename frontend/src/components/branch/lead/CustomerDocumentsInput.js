import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  Grid,
  Stack,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import Iconify from '../../iconify';
import global from '../../../utils/global';

export const LEAD_DOCUMENT_TYPES = [
  'Aadhar card',
  'PAN Card',
  'Voter id',
  'Driving license',
  'Passport',
  'Pledge slip',
  'Interest slip',
  'Bank passbook',
  'Cheque leaf',
  'Ornaments photo',
];

export default function CustomerDocumentsInput({
  docEntries,
  setDocEntries,
  existingDocuments = [],
  onRemoveExistingDoc = null,
}) {
  const handleAddDocEntry = () => {
    const usedTypes = docEntries.map((d) => d.type);
    const nextType = LEAD_DOCUMENT_TYPES.find((t) => !usedTypes.includes(t)) || 'Pledge slip';
    setDocEntries((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type: nextType, file: null, preview: '' },
    ]);
  };

  const handleDocTypeChange = (id, newType) => {
    setDocEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, type: newType } : item))
    );
  };

  const handleDocFileChange = (id, file) => {
    if (!file) return;
    const isImg = file.type && file.type.startsWith('image/');
    const preview = isImg ? URL.createObjectURL(file) : '';
    setDocEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, file, preview } : item))
    );
  };

  const handleRemoveDocEntry = (id) => {
    setDocEntries((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.preview && item.preview.startsWith('blob:')) {
        URL.revokeObjectURL(item.preview);
      }
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.length > 0
        ? filtered
        : [{ id: Date.now(), type: 'Aadhar card', file: null, preview: '' }];
    });
  };

  return (
    <Grid item xs={12}>
      <Divider sx={{ my: 1.5 }} />

      {/* Header with Title and [+ Add More] */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5, mt: 0.5 }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#7B1FA2',
          }}
        >
          <Iconify icon="mdi:file-document-multiple-outline" width={22} height={22} />
          Customer Documents (Type & Upload)
        </Typography>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={handleAddDocEntry}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#7B1FA2',
            borderColor: '#BA68C8',
            '&:hover': {
              borderColor: '#7B1FA2',
              bgcolor: (theme) => alpha('#7B1FA2', 0.05),
            },
          }}
        >
          + Add More
        </Button>
      </Stack>

      {/* Existing Documents (If editing lead) */}
      {existingDocuments && existingDocuments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: 'block' }}>
            Current Uploaded Documents:
          </Typography>
          <Grid container spacing={1.5}>
            {existingDocuments.map((doc, idx) => {
              const fileUrl = doc.documentFile?.startsWith('http')
                ? doc.documentFile
                : `${global.baseURL}/${doc.documentFile}`;
              const isImage = Boolean(doc.documentFile?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i));

              return (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Box
                    sx={{
                      p: 1.2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      bgcolor: '#fafafa',
                    }}
                  >
                    {isImage ? (
                      <Box
                        component="img"
                        src={fileUrl}
                        alt={doc.documentType}
                        sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1, border: '1px solid #e0e0e0' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 1,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        }}
                      >
                        <Iconify icon="mdi:file-pdf-box" width={26} height={26} sx={{ color: 'error.main' }} />
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }} noWrap>
                        {doc.documentType || 'Document'}
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ fontSize: '0.7rem', p: 0, minWidth: 'auto', textTransform: 'none' }}
                      >
                        View Document
                      </Button>
                    </Box>
                    {onRemoveExistingDoc && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveExistingDoc(idx)}
                        title="Delete document"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
        </Box>
      )}

      {/* Dynamic Document Rows */}
      <Stack spacing={1.5}>
        {docEntries.map((entry) => (
          <Box
            key={entry.id}
            sx={{
              p: 1.5,
              border: '1px solid',
              borderColor: entry.file ? '#BA68C8' : '#e0e0e0',
              borderRadius: 1.5,
              bgcolor: entry.file ? alpha('#7B1FA2', 0.02) : '#fbfbfb',
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    label="Type"
                    value={entry.type}
                    onChange={(e) => handleDocTypeChange(entry.id, e.target.value)}
                  >
                    {LEAD_DOCUMENT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={9} sm={6}>
                <Button
                  component="label"
                  variant={entry.file ? 'contained' : 'outlined'}
                  size="small"
                  fullWidth
                  startIcon={
                    <Iconify
                      icon={entry.file ? 'eva:checkmark-circle-2-fill' : 'eva:upload-fill'}
                      sx={{ color: entry.file ? '#ffffff !important' : 'primary.main', flexShrink: 0 }}
                    />
                  }
                  sx={{
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    overflow: 'hidden',
                    borderColor: '#ccc',
                    bgcolor: entry.file ? '#7B1FA2' : '#fff',
                    color: entry.file ? '#ffffff !important' : 'text.primary',
                    '&:hover': {
                      bgcolor: entry.file ? '#6A1B9A' : '#f5f5f5',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      maxWidth: '90%',
                      color: entry.file ? '#ffffff !important' : 'text.primary',
                      fontWeight: 600,
                    }}
                  >
                    {entry.file ? entry.file.name : 'Upload Document / Photo'}
                  </Typography>
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleDocFileChange(entry.id, e.target.files?.[0])}
                  />
                </Button>
              </Grid>

              <Grid item xs={3} sm={1} sx={{ textAlign: 'right' }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveDocEntry(entry.id)}
                  disabled={docEntries.length === 1 && !entry.file && (!existingDocuments || existingDocuments.length === 0)}
                  title="Remove document"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Grid>
            </Grid>

            {/* Selected File Details */}
            {entry.file && (
              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  pt: 0.8,
                  borderTop: '1px dashed',
                  borderColor: 'divider',
                }}
              >
                {entry.preview ? (
                  <Box
                    component="img"
                    src={entry.preview}
                    alt={entry.type}
                    sx={{
                      width: 44,
                      height: 44,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: '1px solid #ccc',
                      bgcolor: '#fff',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      bgcolor: alpha('#7B1FA2', 0.08),
                    }}
                  >
                    <Iconify
                      icon="mdi:file-document-outline"
                      width={24}
                      height={24}
                      sx={{ color: '#7B1FA2' }}
                    />
                  </Box>
                )}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                      size="small"
                      label={entry.type}
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: '#7B1FA2',
                        color: '#fff',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {(entry.file.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.primary"
                    noWrap
                    display="block"
                    sx={{ mt: 0.2 }}
                  >
                    {entry.file.name}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Grid>
  );
}
