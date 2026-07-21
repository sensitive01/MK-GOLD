import { Helmet } from 'react-helmet-async';
import { Container, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

// Import the actual page components
import EmployeeDetails from './EmployeeDetails';

// ----------------------------------------------------------------------

export default function Employee() {
  const auth = useSelector((state) => state.auth);
  const userType = auth?.user?.userType?.toLowerCase();
  
  // Allow all users who have access to this route to see the employee details
  const showEmployeeDetails = true;
  //const showEmployeeDetails = userType !== 'melting';
  return (
    <>
      <Helmet>
        <title> Employee Details | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Employee Details
        </Typography>

        {showEmployeeDetails ? (
          <EmployeeDetails />
        ) : (
          <Typography variant="body1" sx={{ color: '#fff' }}>You do not have permission to view employee details.</Typography>
        )}

      </Container>
    </>
  );
}
