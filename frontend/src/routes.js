import { Navigate, useRoutes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import ErrorPageLayout from './layouts/error';
import LoginPage from './pages/LoginPage';
import Page404 from './pages/Page404';
import AdminDashboardLayout from './layouts/dashboard/admin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminGoldRate from './pages/admin/GoldRate';
import AdminBranch from './pages/admin/Branch';
import AdminUser from './pages/admin/User';
import AdminFund from './pages/admin/Fund';
import AdminExpense from './pages/admin/Expense';
import AdminSale from './pages/admin/Sale';
import AdminLeave from './pages/admin/Leave';
import AdminCustomer from './pages/admin/Customer';
import AdminRelease from './pages/admin/Release';
import AdminAttendance from './pages/admin/Attendance';
import AdminEmployee from './pages/admin/Employee';
import AdminReport from './pages/admin/Report';
import AdminSupport from './pages/admin/Support';
import AdminOTP from './pages/admin/OTP';
import AdminBalancesheet from './pages/admin/Balancesheet';
import AdminOrnament from './pages/admin/Ornament';
import AdminDesignation from './pages/admin/Designation';
import AdminAnnouncement from './pages/admin/Announcements';

// New Roles
import MasterDashboardLayout from './layouts/dashboard/master';
import MasterDashboard from './pages/master/Dashboard';
import OperationsDashboardLayout from './layouts/dashboard/operations';
import OperationsDashboard from './pages/operations/Dashboard';
import FinanceDashboardLayout from './layouts/dashboard/finance';
import FinanceDashboard from './pages/finance/Dashboard';
import TelecallingDashboardLayout from './layouts/dashboard/telecalling';
import TelecallingDashboard from './pages/telecalling/Dashboard';

import HrDashboardLayout from './layouts/dashboard/hr';
import HrDashboard from './pages/hr/Dashboard';
import HrBranch from './pages/hr/Branch';
import HrUser from './pages/hr/User';
import HrLeave from './pages/hr/Leave';
import HrAttendance from './pages/hr/Attendance';
import HrEmployee from './pages/hr/Employee';
import HrPayprocess from './pages/hr/Payprocess';
import AccountsDashboardLayout from './layouts/dashboard/accounts';
import AccountsDashboard from './pages/accounts/Dashboard';
import AccountsGoldRate from './pages/accounts/GoldRate';
import AccountsBranch from './pages/accounts/Branch';
import AccountsFund from './pages/accounts/Fund';
import AccountsExpense from './pages/accounts/Expense';
import AccountsSale from './pages/accounts/Sale';
import AccountsBalancesheet from './pages/accounts/Balancesheet';
import AccountsLeave from './pages/accounts/Leave';
import BranchDashboardLayout from './layouts/dashboard/branch';
import BranchDashboard from './pages/branch/Dashboard';
import BranchFund from './pages/branch/Fund';
import BranchExpense from './pages/branch/Expense';
import BranchLeave from './pages/branch/Leave';
import BranchAttendance from './pages/branch/Attendance';
import BranchLeads from './pages/branch/Leads';
import BranchSale from './pages/branch/Sale';
import BranchCustomer from './pages/branch/Customer';
import BranchRelease from './pages/branch/Release';
import BranchReport from './pages/branch/Report';
import BranchBalancesheet from './pages/branch/Balancesheet';
import BranchOrnament from './pages/branch/Ornament';
import BranchEmployee from './pages/branch/BranchEmployee';

// ----------------------------------------------------------------------

function Protected({ children }) {
  const auth = useSelector((state) => state.auth);
  if (auth.isAuthenticated !== true) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

Protected.propTypes = {
  children: PropTypes.any,
};

export default function Router() {
  const routes = useRoutes([
    {
      path: '/admin',
      element: (
        <Protected>
          <AdminDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/admin/dashboard" />, index: true },
        { path: 'dashboard', element: <AdminDashboard /> },
        { path: 'gold-rate', element: <AdminGoldRate /> },
        { path: 'branch', element: <AdminBranch /> },
        { path: 'user', element: <AdminUser /> },
        { path: 'fund', element: <AdminFund /> },
        { path: 'expense', element: <AdminExpense /> },
        { path: 'sale', element: <AdminSale /> },
        { path: 'leave', element: <AdminLeave /> },
        { path: 'attendance', element: <AdminAttendance /> },
        { path: 'customer', element: <AdminCustomer /> },
        { path: 'release', element: <AdminRelease /> },
        { path: 'employee', element: <AdminEmployee /> },
        { path: 'report', element: <AdminReport /> },
        { path: 'ornament', element: <AdminOrnament /> },
        { path: 'support', element: <AdminSupport /> },
        { path: 'otp', element: <AdminOTP /> },
        { path: 'balancesheet', element: <AdminBalancesheet /> },
        { path: 'designation', element: <AdminDesignation /> },
        { path: 'announcement', element: <AdminAnnouncement /> },
      ],
    },
    {
      path: '/hr',
      element: (
        <Protected>
          <HrDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/hr/dashboard" />, index: true },
        { path: 'dashboard', element: <HrDashboard /> },
        { path: 'branch', element: <HrBranch /> },
        { path: 'user', element: <HrUser /> },
        { path: 'leave', element: <HrLeave /> },
        { path: 'attendance', element: <HrAttendance /> },
        { path: 'employee', element: <HrEmployee /> },
        { path: 'payprocess', element: <HrPayprocess /> },
      ],
    },
    {
      path: '/accounts',
      element: (
        <Protected>
          <AccountsDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/accounts/dashboard" />, index: true },
        { path: 'dashboard', element: <AccountsDashboard /> },
        { path: 'gold-rate', element: <AccountsGoldRate /> },
        { path: 'branch', element: <AccountsBranch /> },
        { path: 'fund', element: <AccountsFund /> },
        { path: 'expense', element: <AccountsExpense /> },
        { path: 'sale', element: <AccountsSale /> },
        { path: 'balancesheet', element: <AccountsBalancesheet /> },
        { path: 'leave', element: <AccountsLeave /> },
      ],
    },
    {
      path: '/branch',
      element: (
        <Protected>
          <BranchDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/branch/dashboard" />, index: true },
        { path: 'dashboard', element: <BranchDashboard /> },
        { path: 'fund', element: <BranchFund /> },
        { path: 'expense', element: <BranchExpense /> },
        { path: 'leave', element: <BranchLeave /> },
        { path: 'attendance', element: <BranchAttendance /> },
        { path: 'leads', element: <BranchLeads /> },
        { path: 'customer', element: <BranchCustomer /> },
        { path: 'release', element: <BranchRelease /> },
        { path: 'sale', element: <BranchSale /> },
        { path: 'report', element: <BranchReport /> },
        { path: 'balancesheet', element: <BranchBalancesheet /> },
        { path: 'ornament', element: <BranchOrnament /> },
        { path: 'employee', element: <BranchEmployee /> },
      ],
    },
    {
      path: '/master',
      element: (
        <Protected>
          <MasterDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/master/dashboard" />, index: true },
        { path: 'dashboard', element: <MasterDashboard /> },
      ],
    },
    {
      path: '/operations',
      element: (
        <Protected>
          <OperationsDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/operations/dashboard" />, index: true },
        { path: 'dashboard', element: <OperationsDashboard /> },
      ],
    },
    {
      path: '/finance',
      element: (
        <Protected>
          <FinanceDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/finance/dashboard" />, index: true },
        { path: 'dashboard', element: <FinanceDashboard /> },
      ],
    },
    {
      path: '/telecalling',
      element: (
        <Protected>
          <TelecallingDashboardLayout />
        </Protected>
      ),
      children: [
        { element: <Navigate to="/telecalling/dashboard" />, index: true },
        { path: 'dashboard', element: <TelecallingDashboard /> },
      ],
    },
    {
      path: '/',
      element: <Navigate to="/login" replace />,
    },
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      element: <ErrorPageLayout />,
      children: [
        { path: '404', element: <Page404 /> },
        { path: '*', element: <Navigate to="/404" /> },
      ],
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
