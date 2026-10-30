import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { Box, Card, Container, Tab, Tabs, Typography } from '@mui/material';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

// Inward and Outward Transit Views
import StoreGoldTransit from '../store/GoldTransit';
import StoreTransitOutwards from '../store/TransitOutwards';

// ----------------------------------------------------------------------

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transit-tabpanel-${index}`}
      aria-labelledby={`transit-tab-${index}`}
      {...other}
      style={{ paddingTop: '20px' }}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `transit-tab-${index}`,
    'aria-controls': `transit-tabpanel-${index}`,
  };
}

export default function MeltingTransit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ? parseInt(searchParams.get('tab'), 10) : 0;
  const [value, setValue] = useState(initialTab >= 0 && initialTab <= 1 ? initialTab : 0);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const parsed = parseInt(tabParam, 10);
      if (!isNaN(parsed) && (parsed === 0 || parsed === 1)) {
        setValue(parsed);
      }
    }
  }, [searchParams]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setSearchParams({ tab: newValue });
  };

  return (
    <>
      <Helmet>
        <title> Transit Management | Melting | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
          Transit Management
        </Typography>

        <Card sx={{ p: 1.5, mb: 1, bgcolor: '#ffffff', borderRadius: 2, boxShadow: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="melting transit tabs"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  minHeight: 48,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: '#8A1B9F',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#8A1B9F',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab
                icon={<MoveToInboxIcon sx={{ mr: 1, fontSize: 22 }} />}
                iconPosition="start"
                label="Inward Transit"
                {...a11yProps(0)}
              />
              <Tab
                icon={<FlightTakeoffIcon sx={{ mr: 1, fontSize: 22 }} />}
                iconPosition="start"
                label="Transit Outwards"
                {...a11yProps(1)}
              />
            </Tabs>
          </Box>
        </Card>

        <CustomTabPanel value={value} index={0}>
          <StoreGoldTransit isNested />
        </CustomTabPanel>

        <CustomTabPanel value={value} index={1}>
          <StoreTransitOutwards isNested />
        </CustomTabPanel>
      </Container>
    </>
  );
}
