import { Helmet } from 'react-helmet-async';
import { Card, Container, Typography } from '@mui/material';

export default function TransitOutwards() {
  return (
    <>
      <Helmet>
        <title> Transit Outwards | Store | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
          Transit Outwards
        </Typography>

        <Card sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Transit Outwards
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Store transit outwards page.
          </Typography>
        </Card>
      </Container>
    </>
  );
}
