import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Typography, Card } from '@mui/material';

// Import the actual page components
import User from './User';
import OTP from './OTP';

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

export default function EmployeeUserTabs() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Users | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Users
        </Typography>

        <Card sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="user tabs">
              <Tab label="Users" {...a11yProps(0)} />
              <Tab label="Login OTP" {...a11yProps(1)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <User />
        </CustomTabPanel>
        
        <CustomTabPanel value={value} index={1}>
          <OTP />
        </CustomTabPanel>

      </Container>
    </>
  );
}
