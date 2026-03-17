import HomeWorkIcon from '@mui/icons-material/HomeWork';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'dashboard',
    path: '/hr/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'branch',
    path: '/hr/branch',
    icon: <HomeWorkIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'user',
    path: '/hr/user',
    icon: icon('ic_user'),
  },
  {
    title: 'Leave',
    path: '/hr/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/hr/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Employee',
    path: '/hr/employee',
    icon: icon('ic_user'),
  },
  {
    title: 'Payprocess',
    path: '/hr/payprocess',
    icon: <MonetizationOnIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
