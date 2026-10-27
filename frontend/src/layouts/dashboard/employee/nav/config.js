import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';

// ----------------------------------------------------------------------

const navConfig = [
  {
    title: 'Attendance',
    path: '/employee/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/employee/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
