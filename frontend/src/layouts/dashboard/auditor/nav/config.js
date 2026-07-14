import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SellIcon from '@mui/icons-material/Sell';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'dashboard',
    path: '/auditor/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'gold-rate',
    path: '/auditor/gold-rate',
    icon: <MonetizationOnIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'expenses',
    path: '/auditor/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'funds',
    path: '/auditor/fund',
    icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Billing',
    path: '/auditor/sale',
    icon: <SellIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Melting',
    path: '/auditor/melting',
    icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Sell Gold',
    path: '/auditor/sell-gold',
    icon: <PointOfSaleIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/auditor/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/auditor/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
