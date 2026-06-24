import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SellIcon from '@mui/icons-material/Sell';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import QrCodeIcon from '@mui/icons-material/QrCode';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/bullion-desk/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Billing',
    path: '/bullion-desk/sale',
    icon: <SellIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leave',
    path: '/bullion-desk/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/bullion-desk/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
