import { Helmet } from 'react-helmet-async';
import { Card, Container, Typography } from '@mui/material';

export default function GoldTransit() {
  return (
    <>
      <Helmet>
        <title> Gold Transit | Store | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
          Gold Transit
        </Typography>

        <Card sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Gold Transit
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Store gold transit page.
          </Typography>
        </Card>
      </Container>
    </>
  );
}
