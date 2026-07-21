import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Typography, Card } from '@mui/material';

// Import the actual page components
import Melting from './Melting';
import Vendor from './Vendor';
import SoldGoldRecords from './SoldGoldRecords';

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

export default function SellGold() {
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
      <Helmet>
        <title> Sell Gold | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Sell Gold
        </Typography>

        <Card sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="sell gold tabs" variant="scrollable" scrollButtons="auto">
              <Tab label="Melting" {...a11yProps(0)} />
              <Tab label="Vendors" {...a11yProps(1)} />
              <Tab label="Gatty Sales" {...a11yProps(2)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <Melting />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={1}>
          <Vendor />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={2}>
          <SoldGoldRecords />
        </CustomTabPanel>

      </Container>
    </>
  );
}
