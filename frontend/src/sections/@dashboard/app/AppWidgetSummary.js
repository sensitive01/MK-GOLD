// @mui
import PropTypes from 'prop-types';
import { alpha, styled } from '@mui/material/styles';
import { Box, Card, Typography } from '@mui/material';
// utils
import { fShortenNumber, fNumber } from '../../../utils/formatNumber';
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
  [theme.breakpoints.down('sm')]: {
    width: theme.spacing(6),
    height: theme.spacing(6),
    marginBottom: theme.spacing(1.5),
  },
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
  disableShorten: PropTypes.bool,
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
  disableShorten = false,
  ...other 
}) {
  return (
    <Card
      sx={{
        py: { xs: 2.5, sm: 3.5, md: 5 },
        px: { xs: 1.5, sm: 2 },
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
        minHeight: { xs: 145, sm: 180, md: 220 },
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
        <Iconify icon={icon} sx={{ width: { xs: 24, sm: 28, md: 32 }, height: { xs: 24, sm: 28, md: 32 } }} />
      </StyledIcon>

      {total !== false ? (
        <Typography variant="h3" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }, fontWeight: 700, px: 1, wordBreak: 'break-word' }}>
          {typeof total === 'number' ? (disableShorten ? fNumber(total) : fShortenNumber(total)) : total || 0}
        </Typography>
      ) : (
        <Box sx={{ height: { xs: 24, sm: 36, md: 48 } }} /> // Placeholder to maintain equal height when total is hidden
      )}

      <Typography
        variant="subtitle2"
        sx={{
          opacity: 0.85,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          mt: 0.75,
          px: 0.5,
          fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
          letterSpacing: { xs: '0.01em', sm: '0.04em' },
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>
    </Card>
  );
}
