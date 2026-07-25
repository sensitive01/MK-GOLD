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
    path: '/branch/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Billing',
    icon: <SellIcon sx={{ width: 1, height: 1 }} />,
    children: [
      {
        title: 'Billing',
        path: '/branch/sale',
        icon: <SellIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Release',
        path: '/branch/release',
        icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Transit',
        path: '/branch/transit',
        icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Reports',
        path: '/branch/report',
        icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
      },
    ]
  },
  {
    title: 'Funds',
    icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
    children: [
      {
        title: 'Funds',
        path: '/branch/fund',
        icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Balance',
        path: '/branch/balancesheet',
        icon: <RequestPageIcon sx={{ width: 1, height: 1 }} />,
      }
    ]
  },
  {
    title: 'Expenses',
    path: '/branch/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/branch/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/branch/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'QR Enquires',
    path: '/branch/qr-enquiry',
    icon: <QrCodeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Employee',
    path: '/branch/employee',
    icon: icon('ic_user'),
  },
  {
    title: 'Leads',
    path: '/branch/leads',
    icon: icon('ic_user'),
  },
];

export default navConfig;
