import { Helmet } from 'react-helmet-async';
import { Container, Typography } from '@mui/material';

export default function DashboardPage() {
  return (
    <>
      <Helmet>
        <title> TELECALLING Dashboard | MK Gold </title>
      </Helmet>
      <Container>
        <Typography variant="h4" sx={{ mb: 5 }}>
          TELECALLING Dashboard
        </Typography>
      </Container>
    </>
  );
}
