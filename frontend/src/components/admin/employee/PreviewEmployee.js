import { useEffect, useState } from 'react';
import { Card, Grid, Typography, Stack, Divider, Box, Avatar, Chip, Button } from '@mui/material';
import { getEmployeeById } from '../../../apis/admin/employee';
import { findFile } from '../../../apis/admin/fileupload';
import global from '../../../utils/global';
import Iconify from '../../../components/iconify';
import moment from 'moment';

function PreviewEmployee({ id }) {
  const [employee, setEmployee] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (id) {
      getEmployeeById(id).then((data) => {
        if (data.status) {
          setEmployee(data.data);
          // Fetch files
          findFile({ uploadId: id, uploadName: 'employee' }).then((fileData) => {
            if (fileData.status) {
              const photoFile = fileData.data?.find((f) => f.uploadType === 'photo');
              const docFiles = fileData.data?.filter((f) => f.uploadType === 'document');
              setPhoto(photoFile);
              setDocuments(docFiles);
            }
          });
        }
      });
    }
  }, [id]);

  if (!employee) return <Typography>Loading...</Typography>;

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <Grid container spacing={4}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={photo ? (photo.uploadedFile.startsWith('http') ? photo.uploadedFile : `${global.baseURL}/uploads/${photo.uploadedFile}`) : ''}
              sx={{ width: 100, height: 100, border: '2px solid #fff', boxShadow: 2 }}
            >
              {employee.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4">{employee.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {employee.designation} • {employee.employeeId}
              </Typography>
              <Chip
                label={employee.status.toUpperCase()}
                color={employee.status === 'active' ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        {/* Personal Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Personal Details
          </Typography>
          <Stack spacing={2}>
            <DetailItem label="Gender" value={employee.gender} />
            <DetailItem label="Date of Birth" value={moment(employee.dob).format('MMMM DD, YYYY')} />
            <DetailItem label="Email" value={employee.email} />
            <DetailItem label="Phone Number" value={employee.phoneNumber} />
            <DetailItem label="Alternate Phone" value={employee.alternatePhoneNumber || 'N/A'} />
          </Stack>
        </Grid>

        {/* Employment details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Employment Details
          </Typography>
          <Stack spacing={2}>
            <DetailItem label="Date of Joining" value={moment(employee.doj).format('MMMM DD, YYYY')} />
            <DetailItem label="Employment Type" value={employee.employmentType} />
            <DetailItem label="Salary" value={`₹ ${employee.salary}`} />
            <DetailItem label="Login Time" value={moment(employee.shiftStartTime).format('hh:mm A')} />
            <DetailItem label="Logout Time" value={moment(employee.shiftEndTime).format('hh:mm A')} />
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <DetailItem
            label="Languages"
            value={
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                {employee.languages && employee.languages?.map((lang) => (
                  <Chip key={lang} label={lang} variant="outlined" size="small" />
                ))}
              </Stack>
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Documents */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Uploaded Documents
          </Typography>
          {documents?.length > 0 ? (
            <Grid container spacing={2}>
              {documents?.map((doc, index) => (
                <Grid item key={index} xs={12} sm={4}>
                  <Card variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify icon="mdi:file-document-outline" sx={{ width: 24, height: 24, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {doc.uploadedFile.split('-')?.slice(1).join('-')}
                      </Typography>
                    </Stack>
                    <Button
                      size="small"
                      href={doc.uploadedFile.startsWith('http') ? doc.uploadedFile : `${global.baseURL}/uploads/${doc.uploadedFile}`}
                      target="_blank"
                      startIcon={<Iconify icon="mdi:eye" />}
                    >
                      View
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary italic">
              No documents uploaded.
            </Typography>
          )}
        </Grid>
      </Grid>
    </Card>
  );
}

function DetailItem({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>{typeof value === 'string' ? <Typography variant="body1">{value}</Typography> : value}</Box>
    </Box>
  );
}

export default PreviewEmployee;


