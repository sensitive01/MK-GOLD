import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaymentsIcon from '@mui/icons-material/Payments';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'dashboard',
    path: '/melting/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Transit',
    path: '/melting/transit',
    icon: <LocalShippingIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Melting',
    path: '/melting/melting',
    icon: <AccountBalanceWalletIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Sell Gold',
    path: '/melting/sell-gold',
    icon: <LocalOfferIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Vendor',
    path: '/melting/vendor',
    icon: icon('ic_user'),
  },
  {
    title: 'Billing',
    path: '/melting/sale',
    icon: <PointOfSaleIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Expenses',
    path: '/melting/expense',
    icon: <PaymentsIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Gold Rate',
    path: '/melting/gold-rate',
    icon: <MonetizationOnIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Releases',
    path: '/melting/release',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/melting/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/melting/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
