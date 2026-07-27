import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Container, Tab, Tabs, Typography, Card } from '@mui/material';

// Import the actual page components
import EmployeeDetails from './EmployeeDetails';
// ----------------------------------------------------------------------

export default function Employee() {

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
          <EmployeeDetails />
        </Card>
      </Container>
    </>
  );
}
