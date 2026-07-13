import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Card } from '@mui/material';

import CampaignList from '../marketing/campaign/CampaignList';
import MarketingCalendar from '../marketing/Calendar';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`marketing-tabpanel-${index}`}
      aria-labelledby={`marketing-tab-${index}`}
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
    id: `marketing-tab-${index}`,
    'aria-controls': `marketing-tabpanel-${index}`,
  };
}

export default function MarketingTabs() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Marketing | Admin </title>
      </Helmet>

      <Container maxWidth="xl">
        <Card sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="marketing tabs">
              <Tab label="Campaign" {...a11yProps(0)} />
              <Tab label="Calendar" {...a11yProps(1)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <CampaignList />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={1}>
          <MarketingCalendar />
        </CustomTabPanel>

      </Container>
    </>
  );
}
