import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SellIcon from '@mui/icons-material/Sell';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import TimeToLeaveIcon from '@mui/icons-material/TimeToLeave';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'dashboard',
    path: '/finance/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'gold-rate',
    path: '/finance/gold-rate',
    icon: <MonetizationOnIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'branch',
    path: '/finance/branch',
    icon: <HomeWorkIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'funds',
    path: '/finance/fund',
    icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'expenses',
    path: '/finance/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Sale',
    path: '/finance/sale',
    icon: <SellIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Balancesheet',
    path: '/finance/balancesheet',
    icon: <RequestPageIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'leaves',
    path: '/finance/leave',
    icon: <TimeToLeaveIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/finance/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
