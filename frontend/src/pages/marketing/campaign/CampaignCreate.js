import { useState, useEffect, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  Card, Stack, Button, Container, Typography, TextField, Grid, MenuItem, 
  Snackbar, Checkbox, ListItemText, Select, InputLabel, FormControl,
  Stepper, Step, StepLabel, Box, Autocomplete, Chip, Slider, Switch, FormControlLabel, IconButton
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Iconify from '../../../components/iconify';
import { createCampaign, getCampaignById, updateCampaign } from '../../../apis/marketing/campaign';
import apiClient from '../../../apis/http';
import AudienceLocationPicker from './AudienceLocationPicker';

const Alert = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

const steps = ['Basic Details', 'Accounts & Platform', 'Creative & Targeting'];

export default function CampaignCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const userType = auth?.user?.userType || 'marketing';
  const basePath = userType === 'admin' ? '/admin/marketing' : '/marketing/campaigns';
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    campaignName: '', campaignId: '', campaignType: '',
    objective: '', description: '', mailId: '', teamMembers: '',
    adPlatform: '', targetPlatform: [], accountNameUrl: '', landingPageUrl: '',
    adFormat: '', adType: '', adFiles: [], contentCalendar: [{ days: 'Mondays - Fridays', startTime: '09:00', endTime: '19:00' }], ctaLink: '', 
    targetAudienceDemography: [{ gender: 'Male', fromAge: '18', toAge: '65' }],
    targetAudienceLocation: [], bidStrategy: '',
    postHeadings: [], postDescriptions: []
  });

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    const res = await getCampaignById(id);
    if (res?.status) {
      const camp = res.data;
      setFormData({
        campaignName: camp.campaignName || '',
        campaignId: camp.campaignId || '',
        campaignType: camp.campaignType || '',
        objective: camp.objective || '',
        description: camp.description || '',
        mailId: camp.mailId || '',
        teamMembers: camp.teamMembers || '',
        adPlatform: camp.adPlatform || '',
        targetPlatform: camp.targetPlatform || [],
        accountNameUrl: camp.accountNameUrl || '',
        landingPageUrl: camp.landingPageUrl || '',
        adFormat: camp.adFormat || '',
        adType: camp.adType || '',
        adFiles: camp.adFiles || [],
        contentCalendar: camp.contentCalendar ? JSON.parse(camp.contentCalendar) : [{ days: 'Mondays - Fridays', startTime: '09:00', endTime: '19:00' }],
        ctaLink: camp.ctaLink || '',
        targetAudienceDemography: camp.targetAudienceDemography ? JSON.parse(camp.targetAudienceDemography) : [{ gender: 'Male', fromAge: '18', toAge: '65' }],
        targetAudienceLocation: camp.targetAudienceLocation ? JSON.parse(camp.targetAudienceLocation) : [],
        bidStrategy: camp.bidStrategy || '',
        postHeadings: camp.postHeadings || [],
        postDescriptions: camp.postDescriptions || []
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (event, name) => {
    const { target: { value } } = event;
    setFormData(prev => ({
      ...prev,
      [name]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, adFiles: Array.from(e.target.files) }));
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...formData.contentCalendar];
    newSchedules[index][field] = value;
    setFormData(prev => ({ ...prev, contentCalendar: newSchedules }));
  };

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      contentCalendar: [...prev.contentCalendar, { days: 'All days', startTime: '09:00', endTime: '19:00' }]
    }));
  };

  const removeSchedule = (index) => {
    setFormData(prev => ({
      ...prev,
      contentCalendar: prev.contentCalendar.filter((_, i) => i !== index)
    }));
  };

  const handleAudienceChange = (index, field, value) => {
    const newAudience = [...formData.targetAudienceDemography];
    newAudience[index][field] = value;
    setFormData(prev => ({ ...prev, targetAudienceDemography: newAudience }));
  };

  const addAudience = () => {
    setFormData(prev => ({
      ...prev,
      targetAudienceDemography: [...prev.targetAudienceDemography, { gender: 'Male', fromAge: '18', toAge: '65' }]
    }));
  };

  const removeAudience = (index) => {
    setFormData(prev => ({
      ...prev,
      targetAudienceDemography: prev.targetAudienceDemography.filter((_, i) => i !== index)
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeStep !== steps.length - 1) {
       setActiveStep((prev) => prev + 1);
       return;
    }
    
    setIsSubmitting(true);
    let uploadedUrls = [];
    if (formData.adFiles && formData.adFiles.length > 0) {
      for (const file of formData.adFiles) {
        const filePayload = new FormData();
        filePayload.append('uploadedFile', file);
        try {
          const uploadRes = await apiClient().post('/api/v1.0/public/kyc/file-upload', filePayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.status && uploadRes.data?.data) {
            uploadedUrls.push(uploadRes.data.data.uploadedFile.path);
          }
        } catch (err) {
          console.error('File upload failed', err);
        }
      }
    }
    
    const payload = {
      ...formData,
      adFiles: uploadedUrls,
      contentCalendar: JSON.stringify(formData.contentCalendar),
      targetAudienceDemography: JSON.stringify(formData.targetAudienceDemography),
      targetAudienceLocation: JSON.stringify(formData.targetAudienceLocation)
    };
    
    let res;
    if (id) {
      // For edit, we might want to keep existing adFiles if no new ones are uploaded
      // formData.adFiles might contain strings (existing URLs) or File objects (newly uploaded)
      // We already uploaded the File objects and appended their URLs.
      // Let's filter out File objects and keep only strings (URLs) from formData.adFiles
      const existingUrls = formData.adFiles ? formData.adFiles.filter(f => typeof f === 'string') : [];
      payload.adFiles = [...existingUrls, ...uploadedUrls];
      res = await updateCampaign(id, payload);
    } else {
      payload.adFiles = uploadedUrls;
      res = await createCampaign(payload);
    }

    if (res?.status) {
      setNotify({ open: true, message: `Campaign ${id ? 'updated' : 'created'} successfully!`, severity: 'success' });
      setTimeout(() => { navigate(basePath); }, 1500);
    } else {
      setNotify({ open: true, message: res?.message || `Error ${id ? 'updating' : 'creating'} campaign`, severity: 'error' });
    }
    setIsSubmitting(false);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const adPlatforms = ["Meta Ads", "LinkedIn Ads", "Google Ads"];
  const targetPlatforms = ["Facebook", "Instagram", "LinkedIn", "X", "WhatsApp", "YouTube"];
  const scheduleDays = ["All days", "Mondays - Fridays", "Saturdays - Sundays", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <>
      <Helmet><title> {id ? 'Edit' : 'New'} Campaign | MK Gold </title></Helmet>
      <Snackbar open={notify.open} autoHideDuration={3000} onClose={() => setNotify({ ...notify, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>{id ? 'Edit' : 'Create'} Campaign</Typography>
          <Button variant="contained" startIcon={<Iconify icon="mdi:arrow-left" />} onClick={() => navigate(basePath)}>Back</Button>
        </Stack>

        <Card sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth required label="Campaign Name" name="campaignName" value={formData.campaignName} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth required label="Campaign ID" name="campaignId" value={formData.campaignId} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth required select label="Campaign Type" name="campaignType" value={formData.campaignType} onChange={handleChange}>
                    {["Awareness", "Lead Generation", "Engagement", "Sales"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth multiline rows={2} label="Objective" name="objective" value={formData.objective} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth multiline rows={2} label="Description" name="description" value={formData.description} onChange={handleChange} />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Account Mail id" name="mailId" value={formData.mailId} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Team Members" name="teamMembers" placeholder="Comma separated" value={formData.teamMembers} onChange={handleChange} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth required select label="Ad Platform" name="adPlatform" value={formData.adPlatform} onChange={handleChange}>
                    {adPlatforms.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="target-platform-label">Target Platform</InputLabel>
                    <Select labelId="target-platform-label" label="Target Platform" multiple value={formData.targetPlatform} onChange={(e) => handleMultiSelectChange(e, 'targetPlatform')} renderValue={(selected) => selected.join(', ')}>
                      {targetPlatforms.map((name) => (
                        <MenuItem key={name} value={name}>
                          <Checkbox checked={formData.targetPlatform.indexOf(name) > -1} />
                          <ListItemText primary={name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Account Name / URL" name="accountNameUrl" value={formData.accountNameUrl} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Landing Page URL" name="landingPageUrl" value={formData.landingPageUrl} onChange={handleChange} />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth select label="Ad Format" name="adFormat" value={formData.adFormat} onChange={handleChange}>
                    {["Call Ad", "Search Ad", "Discovery Ad", "YouTube Video Ad", "Others"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth select label="Ad Type" name="adType" value={formData.adType} onChange={handleChange}>
                    {["Text", "Image", "Video"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                {(formData.adType === 'Image' || formData.adType === 'Video') && (
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth type="file" inputProps={{ multiple: true }} InputLabelProps={{ shrink: true }} label="Upload Media (Multiple)" onChange={handleFileChange} />
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="CTA (Call-to-action link)" name="ctaLink" value={formData.ctaLink} onChange={handleChange} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>Content Calendar (Ad schedule)</Typography>
                  <Stack spacing={2}>
                    {formData.contentCalendar.map((schedule, index) => (
                      <Stack key={index} direction="row" spacing={2} alignItems="center">
                        <TextField 
                          select 
                          size="small" 
                          sx={{ width: 200 }} 
                          value={schedule.days} 
                          onChange={(e) => handleScheduleChange(index, 'days', e.target.value)}
                        >
                          {scheduleDays.map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
                        </TextField>
                        <TextField 
                          type="time" 
                          size="small"
                          value={schedule.startTime}
                          onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                        <Typography variant="body2" sx={{ mx: 1 }}>to</Typography>
                        <TextField 
                          type="time" 
                          size="small"
                          value={schedule.endTime}
                          onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                        />
                        {formData.contentCalendar.length > 1 && (
                          <IconButton onClick={() => removeSchedule(index)} color="error" size="small">
                            <Iconify icon="mdi:close" />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                    <Button variant="text" size="small" sx={{ alignSelf: 'flex-start' }} onClick={addSchedule}>
                      + Add
                    </Button>
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>Target Audience (Gender & Age)</Typography>
                  <Stack spacing={2}>
                    {formData.targetAudienceDemography.map((audience, index) => (
                      <Stack key={index} direction="row" spacing={2} alignItems="center">
                        <TextField 
                          select 
                          size="small" 
                          sx={{ width: 150 }} 
                          value={audience.gender} 
                          onChange={(e) => handleAudienceChange(index, 'gender', e.target.value)}
                        >
                          {["Male", "Female", "Other", "All"].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </TextField>
                        <TextField 
                          type="number" 
                          size="small"
                          label="From Age"
                          sx={{ width: 100 }}
                          value={audience.fromAge}
                          onChange={(e) => handleAudienceChange(index, 'fromAge', e.target.value)}
                        />
                        <Typography variant="body2" sx={{ mx: 1 }}>to</Typography>
                        <TextField 
                          type="number" 
                          size="small"
                          label="To Age"
                          sx={{ width: 100 }}
                          value={audience.toAge}
                          onChange={(e) => handleAudienceChange(index, 'toAge', e.target.value)}
                        />
                        {formData.targetAudienceDemography.length > 1 && (
                          <IconButton onClick={() => removeAudience(index)} color="error" size="small">
                            <Iconify icon="mdi:close" />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                    <Button variant="text" size="small" sx={{ alignSelf: 'flex-start' }} onClick={addAudience}>
                      + Add
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <AudienceLocationPicker 
                    locations={formData.targetAudienceLocation}
                    onChange={(newLocations) => setFormData(prev => ({ ...prev, targetAudienceLocation: newLocations }))}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField fullWidth select label="Bid Strategy" name="bidStrategy" value={formData.bidStrategy} onChange={handleChange}>
                    {["CPC", "CPM", "CPA"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={formData.postHeadings}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, postHeadings: newValue }));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                      })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Post Headings (Press Enter to add)" placeholder="Add headings" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={formData.postDescriptions}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, postDescriptions: newValue }));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                      })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Post Descriptions (Press Enter to add)" placeholder="Add descriptions" />
                    )}
                  />
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
                Back
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {activeStep === steps.length - 1 ? (isSubmitting ? 'Submitting...' : (id ? 'Update Campaign' : 'Submit Campaign')) : 'Next'}
              </Button>
            </Box>
          </form>
        </Card>
      </Container>
    </>
  );
}
