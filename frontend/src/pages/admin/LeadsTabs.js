import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Card } from '@mui/material';

import QREnquiry from './QREnquiry';
import MarketingLeads from '../marketing/Leads';
import BranchLeads from '../branch/Leads';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leads-tabpanel-${index}`}
      aria-labelledby={`leads-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `leads-tab-${index}`,
    'aria-controls': `leads-tabpanel-${index}`,
  };
}

export default function LeadsTabs() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Leads | Admin </title>
      </Helmet>

      <Container maxWidth="xl">
        <Card sx={{ p: 2, mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="leads tabs">
              <Tab label="QR Enquiries" {...a11yProps(0)} />
              <Tab label="Marketing Leads" {...a11yProps(1)} />
              <Tab label="TeleCalling Leads" {...a11yProps(2)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <QREnquiry />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={1}>
          <MarketingLeads title="Marketing Leads Management" />
        </CustomTabPanel>

        <CustomTabPanel value={value} index={2}>
          <BranchLeads title="TeleCalling Leads Management" />
        </CustomTabPanel>

      </Container>
    </>
  );
}
