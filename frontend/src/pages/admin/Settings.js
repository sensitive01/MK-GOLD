import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Typography, Card } from '@mui/material';

// Import the actual page components
import Designation from './Designation';

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

export default function Settings() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Settings | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Settings
        </Typography>

        <Card sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="settings tabs" variant="scrollable" scrollButtons="auto">
              <Tab label="Designation" {...a11yProps(0)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <Designation />
        </CustomTabPanel>

      </Container>
    </>
  );
}
