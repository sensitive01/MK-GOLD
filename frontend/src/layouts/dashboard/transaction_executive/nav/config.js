import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Menu',
    path: '/transaction-executive/menu',
    icon: icon('ic_menu'),
  },
  {
    title: 'Dashboard',
    path: '/transaction-executive/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Funds',
    path: '/transaction-executive/fund',
    icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leave',
    path: '/transaction-executive/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/transaction-executive/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Release',
    path: '/transaction-executive/release',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
