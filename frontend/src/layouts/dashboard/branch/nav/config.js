import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SellIcon from '@mui/icons-material/Sell';
import RequestPageIcon from '@mui/icons-material/RequestPage';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/branch/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Funds',
    path: '/branch/fund',
    icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Expenses',
    path: '/branch/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leave',
    path: '/branch/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/branch/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Walk-ins',
    path: '/branch/customer',
    icon: icon('ic_user'),
  },
  {
    title: 'Release',
    path: '/branch/release',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Sale',
    path: '/branch/sale',
    icon: <SellIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Report',
    path: '/branch/report',
    icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Balancesheet',
    path: '/branch/balancesheet',
    icon: <RequestPageIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Move Gold',
    path: '/branch/ornament',
    icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
