// ----------------------------------------------------------------------

export default function Switch(theme) {
  return {
    MuiSwitch: {
      styleOverrides: {
        thumb: {
          boxShadow: theme.customShadows.z1,
        },
        track: {
          opacity: 1,
          backgroundColor: theme.palette.grey[500],
        },
        switchBase: {
          '&.Mui-checked': {
            color: '#FFD700', // Yellow thumb
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: '#8A1B9F', // Purple track
            },
          },
          '&.Mui-disabled': {
            color: theme.palette.grey[400],
            '& + .MuiSwitch-track': {
              backgroundColor: theme.palette.action.disabledBackground,
            },
          },
        },
      },
    },
  };
}
