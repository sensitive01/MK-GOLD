import { Helmet } from 'react-helmet-async';
import { Card, Container, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title> Dashboard | Store | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
          Dashboard
        </Typography>

        <Card sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Store dashboard page.
          </Typography>
        </Card>
      </Container>
    </>
  );
}
