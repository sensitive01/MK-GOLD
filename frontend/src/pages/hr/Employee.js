import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Typography, Card } from '@mui/material';

// Import the actual page components
import EmployeeDetails from './EmployeeDetails';
import Attendance from './Attendance';
import Leave from './Leave';
import Payprocess from './Payprocess';

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

export default function Employee() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <>
      <Helmet>
        <title> Employee | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Employee Management
        </Typography>

        <Card sx={{ p: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="employee management tabs">
              <Tab label="Employee Details" {...a11yProps(0)} />
              <Tab label="Attendance" {...a11yProps(1)} />
              <Tab label="Leaves" {...a11yProps(2)} />
              <Tab label="Payprocess" {...a11yProps(3)} />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <EmployeeDetails />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <Attendance />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <Leave />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
          <Payprocess />
        </CustomTabPanel>

      </Container>
    </>
  );
}
