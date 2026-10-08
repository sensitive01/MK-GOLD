// ----------------------------------------------------------------------

export default function SnackbarTheme(theme) {
  return {
    MuiSnackbar: {
      styleOverrides: {
        root: {
          zIndex: 99999,
          '&.MuiSnackbar-anchorOriginTopRight': {
            top: '100px !important',
            [theme.breakpoints.down('sm')]: {
              top: '75px !important',
            },
          },
        },
      },
    },
  };
}
