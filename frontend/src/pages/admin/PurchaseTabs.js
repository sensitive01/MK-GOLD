import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Typography, Card } from '@mui/material';

import Sale from './Sale';
import Release from './Release';
import Customer from './Customer';
import RegistrationOTP from './RegistrationOTP';

// ----------------------------------------------------------------------

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ paddingTop: '24px' }}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function PurchaseTabs({ isNested = false }) {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ? parseInt(searchParams.get('tab'), 10) : 0;
  const [value, setValue] = useState(initialTab);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setValue(parseInt(searchParams.get('tab'), 10));
    }
  }, [searchParams]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      {!isNested && (
        <Helmet>
          <title> Purchase | MK Gold </title>
        </Helmet>
      )}

      <Container maxWidth={isNested ? false : "xl"} disableGutters={isNested}>
        {!isNested && (
          <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
            Purchase
          </Typography>
        )}

        <Card sx={{ p: isNested ? 0 : 2, boxShadow: isNested ? 'none' : undefined, background: isNested ? 'transparent' : undefined }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="purchase tabs" variant="scrollable" scrollButtons="auto">
              <Tab label="Purchases" {...a11yProps(0)} />
              <Tab label="Release" {...a11yProps(1)} />
              <Tab label="Customer" {...a11yProps(2)} />
              <Tab label="Registration OTP" {...a11yProps(3)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <Sale />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={1}>
          <Release />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={2}>
          <Customer />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={3}>
          <RegistrationOTP />
        </CustomTabPanel>

      </Container>
    </>
  );
}
