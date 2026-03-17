// @mui
import PropTypes from 'prop-types';
import { alpha, styled } from '@mui/material/styles';
import { Box, Card, Typography } from '@mui/material';
// utils
import { fShortenNumber } from '../../../utils/formatNumber';
// components
import Iconify from '../../../components/iconify';

// ----------------------------------------------------------------------

const StyledIcon = styled('div')(({ theme }) => ({
  margin: 'auto',
  display: 'flex',
  borderRadius: '50%',
  alignItems: 'center',
  width: theme.spacing(8),
  height: theme.spacing(8),
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
}));

// ----------------------------------------------------------------------

AppWidgetSummary.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  total: PropTypes.any,
  sx: PropTypes.object,
  bgColor: PropTypes.string,
  iconColor: PropTypes.string,
  textColor: PropTypes.string,
};

export default function AppWidgetSummary({ 
  title, 
  total, 
  icon, 
  color = 'primary', 
  sx, 
  bgColor, 
  iconColor, 
  textColor,
  ...other 
}) {
  return (
    <Card
      sx={{
        py: 5,
        boxShadow: (theme) => theme.customShadows.z8,
        textAlign: 'center',
        color: textColor || ((theme) => theme.palette[color].darker),
        bgcolor: bgColor || ((theme) => theme.palette[color].lighter),
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 220,
        transition: (theme) => 
          theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: (theme) => theme.customShadows.z24,
          filter: 'brightness(1.1)',
          cursor: 'pointer',
        },
        ...sx,
      }}
      {...other}
    >
      <StyledIcon
        sx={{
          color: iconColor || ((theme) => theme.palette[color].dark),
          backgroundImage: (theme) =>
            `linear-gradient(135deg, ${alpha(iconColor || theme.palette[color].dark, 0)} 0%, ${alpha(
              iconColor || theme.palette[color].dark,
              0.24
            )} 100%)`,
        }}
      >
        <Iconify icon={icon} width={32} height={32} />
      </StyledIcon>

      {total !== false ? (
        <Typography variant="h3">
          {typeof total === 'number' ? fShortenNumber(total) : total || 0}
        </Typography>
      ) : (
        <Box sx={{ height: 48 }} /> // Placeholder to maintain equal height when total is hidden
      )}

      <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 'bold', textTransform: 'uppercase', mt: 1 }}>
        {title}
      </Typography>
    </Card>
  );
}
