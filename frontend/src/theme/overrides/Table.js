// ----------------------------------------------------------------------

export default function Table(theme) {
  return {
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#fff',
          backgroundColor: '#8A1B9F',
          '& .MuiTableSortLabel-root': {
            color: '#fff',
            '&:hover': {
              color: '#fff',
            },
            '&.Mui-active': {
              color: '#fff',
              '& .MuiTableSortLabel-icon': {
                color: '#fff !important',
              },
            },
          },
          '& .MuiCheckbox-root': {
            color: '#fff',
            '&.Mui-checked': {
              color: '#fff',
            },
            '&.MuiCheckbox-indeterminate': {
              color: '#fff',
            },
          },
        },
      },
    },
  };
}
