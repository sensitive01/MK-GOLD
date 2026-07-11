import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Card, Stack, Button, Container, Typography, TextField, Grid, MenuItem, 
  Snackbar, Checkbox, ListItemText, Select, InputLabel, FormControl,
  Stepper, Step, StepLabel, Box, Autocomplete, Chip, Slider
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Iconify from '../../../components/iconify';
import { createCampaign } from '../../../apis/marketing/campaign';

const Alert = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

const steps = ['Basic Details', 'Accounts & Platform', 'Creative & Targeting'];

export default function CampaignCreate() {
  const navigate = useNavigate();
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    campaignName: '', campaignId: '', campaignType: '', campaignStatus: 'Active',
    objective: '', description: '', mailId: '', teamMembers: '',
    adPlatform: '', targetPlatform: [], accountNameUrl: '', landingPageUrl: '',
    adType: '', contentCalendar: '', ctaLink: '', targetAudienceDemography: '',
    targetAudienceLocation: [], targetAgeGroup: [18, 65], targetGender: '', bidStrategy: '',
    postHeadings: [], postDescriptions: []
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeStep !== steps.length - 1) {
       setActiveStep((prev) => prev + 1);
       return;
    }
    
    const payload = {
      ...formData,
      targetAgeGroup: Array.isArray(formData.targetAgeGroup) ? formData.targetAgeGroup.join('-') : formData.targetAgeGroup,
      targetAudienceLocation: Array.isArray(formData.targetAudienceLocation) ? formData.targetAudienceLocation.join(', ') : formData.targetAudienceLocation
    };
    
    const res = await createCampaign(payload);
    if (res?.status) {
      setNotify({ open: true, message: 'Campaign created successfully!', severity: 'success' });
      setTimeout(() => { navigate('/marketing/campaigns'); }, 1500);
    } else {
      setNotify({ open: true, message: res?.message || 'Error creating campaign', severity: 'error' });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const adPlatforms = ["Meta Ads", "LinkedIn Ads", "Google Ads"];
  const targetPlatforms = ["Facebook", "Instagram", "LinkedIn", "X", "WhatsApp", "YouTube"];

  return (
    <>
      <Helmet><title> New Campaign | MK Gold </title></Helmet>
      <Snackbar open={notify.open} autoHideDuration={3000} onClose={() => setNotify({ ...notify, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>Create Campaign</Typography>
          <Button variant="contained" startIcon={<Iconify icon="mdi:arrow-left" />} onClick={() => navigate('/marketing/campaigns')}>Back</Button>
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
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Campaign Name" name="campaignName" value={formData.campaignName} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Campaign ID" name="campaignId" value={formData.campaignId} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required select label="Campaign Type" name="campaignType" value={formData.campaignType} onChange={handleChange}>
                    {["Awareness", "Lead Generation", "Engagement", "Sales"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required select label="Campaign Status" name="campaignStatus" value={formData.campaignStatus} onChange={handleChange}>
                    {["Active", "Running", "Paused", "Inactive"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Objective" name="objective" value={formData.objective} onChange={handleChange} />
                </Grid>
                <Grid item xs={12}>
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
                    <InputLabel>Target Platform</InputLabel>
                    <Select multiple value={formData.targetPlatform} onChange={(e) => handleMultiSelectChange(e, 'targetPlatform')} renderValue={(selected) => selected.join(', ')}>
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
                  <TextField fullWidth select label="Ad Type" name="adType" value={formData.adType} onChange={handleChange}>
                    {["Image", "Video", "Carousel", "Reel", "Story", "Text"].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Content Calendar (Weekly schedule)" name="contentCalendar" placeholder="Weekly schedule" value={formData.contentCalendar} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="CTA (Call-to-action link)" name="ctaLink" value={formData.ctaLink} onChange={handleChange} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Target Audience (Gender & Age)" name="targetAudienceDemography" value={formData.targetAudienceDemography} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={formData.targetAudienceLocation}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, targetAudienceLocation: newValue }));
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return <Chip key={key} variant="outlined" label={option} {...tagProps} />;
                      })
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Audience Location (Radius or Pincodes)" placeholder="Add locations" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>Age Group</Typography>
                  <Slider
                    value={formData.targetAgeGroup}
                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, targetAgeGroup: newValue }))}
                    valueLabelDisplay="auto"
                    min={13}
                    max={65}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Target Gender" name="targetGender" value={formData.targetGender} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} md={4}>
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
                      <TextField {...params} label="Post Heading(s) (Press Enter to add)" placeholder="Add headings" />
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
                      <TextField {...params} label="Post Description(s) (Press Enter to add)" placeholder="Add descriptions" />
                    )}
                  />
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
                Back
              </Button>
              <Button type="submit" variant="contained">
                {activeStep === steps.length - 1 ? 'Submit Campaign' : 'Next'}
              </Button>
            </Box>
          </form>
        </Card>
      </Container>
    </>
  );
}
