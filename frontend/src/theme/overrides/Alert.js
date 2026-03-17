// ----------------------------------------------------------------------

export default function AlertTheme(theme) {
  return {
    MuiAlert: {
      styleOverrides: {
        filledSuccess: {
          animation: 'credPulse 2s infinite',
          boxShadow: '0 0 20px rgba(84, 214, 44, 0.4)',
        },
        filledError: {
          boxShadow: '0 0 20px rgba(255, 72, 66, 0.4)',
        },
      },
    },
  };
}
