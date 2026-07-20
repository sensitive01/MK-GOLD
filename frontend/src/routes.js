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
import AdminLeadsTabs from './pages/admin/LeadsTabs';
import AdminExpense from './pages/admin/Expense';
import AdminSale from './pages/admin/Sale';
import AdminLeave from './pages/admin/Leave';
import AdminCustomer from './pages/admin/Customer';
import AdminRelease from './pages/admin/Release';
import AdminAttendance from './pages/admin/Attendance';
import AdminEmployee from './pages/admin/Employee';
import AdminPayprocess from './pages/admin/Payprocess';
import AdminReport from './pages/admin/Report';
import AdminSupport from './pages/admin/Support';
import AdminOTP from './pages/admin/OTP';
import AdminBalancesheet from './pages/admin/Balancesheet';
import AdminSettings from './pages/admin/Settings';
import AdminRegistrationOTP from './pages/admin/RegistrationOTP';
import AdminPurchaseTabs from './pages/admin/PurchaseTabs';
import AdminEmployeeUserTabs from './pages/admin/EmployeeUserTabs';
import AdminOrnament from './pages/admin/Ornament';
import AdminDesignation from './pages/admin/Designation';
import AdminAnnouncement from './pages/admin/Announcements';
import AdminQREnquiry from './pages/admin/QREnquiry';
import AdminTransit from './pages/admin/Transit';
import AdminMarketingTabs from './pages/admin/MarketingTabs';
import AdminMelting from './pages/admin/Melting';
import AdminVendor from './pages/admin/Vendor';
import AdminSellGold from './pages/admin/SellGold';
import PublicEnquiry from './pages/PublicEnquiry';
import PublicKYC from './pages/PublicKYC';

// New Roles
import MasterDashboardLayout from './layouts/dashboard/master';
import MasterDashboard from './pages/master/Dashboard';
import AuditorDashboardLayout from './layouts/dashboard/auditor';
import AuditorDashboard from './pages/auditor/Dashboard';
import AuditorGoldRate from './pages/auditor/GoldRate';
import AuditorExpense from './pages/auditor/Expense';
import AuditorFund from './pages/auditor/Fund';
import AuditorMelting from './pages/auditor/Melting';
import AuditorSellGold from './pages/auditor/SellGold';
import AuditorAttendance from './pages/auditor/Attendance';
import AuditorSale from './pages/auditor/Sale';
import OperationsDashboardLayout from './layouts/dashboard/operations';
import OperationsDashboard from './pages/operations/Dashboard';
import FinanceDashboardLayout from './layouts/dashboard/finance';
import FinanceDashboard from './pages/finance/Dashboard';
import TelecallingDashboardLayout from './layouts/dashboard/telecalling';
import TelecallingDashboard from './pages/telecalling/Dashboard';
import Profile from './pages/Profile';

import TransactionExecutiveDashboardLayout from './layouts/dashboard/transaction_executive';
import TransactionExecutiveDashboard from './pages/transaction_executive/Dashboard';

import HrDashboardLayout from './layouts/dashboard/hr';
import HrDashboard from './pages/hr/Dashboard';
import HrBranch from './pages/hr/Branch';
import HrUser from './pages/hr/User';
import HrLeave from './pages/hr/Leave';
import HrAttendance from './pages/hr/Attendance';
import HrEmployee from './pages/hr/Employee';
import HrPayprocess from './pages/hr/Payprocess';
import HrLeads from './pages/hr/Leads';
import HrExpense from './pages/hr/Expense';
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
import BullionDeskDashboardLayout from './layouts/dashboard/bullion_desk';
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
import BranchQREnquiry from './pages/branch/QREnquiry';
import BranchTransit from './pages/branch/Transit';

import MarketingDashboardLayout from './layouts/dashboard/marketing/MarketingDashboardLayout';
import MarketingDashboard from './pages/marketing/Dashboard';
import MarketingExpense from './pages/marketing/Expense';
import MarketingLeave from './pages/marketing/Leave';
import MarketingAttendance from './pages/marketing/Attendance';
import CampaignList from './pages/marketing/campaign/CampaignList';
import CampaignCreate from './pages/marketing/campaign/CampaignCreate';
import CampaignView from './pages/marketing/campaign/CampaignView';
import MarketingCalendar from './pages/marketing/Calendar.js';
import MarketingLeads from './pages/marketing/Leads';

import AdminDeskDashboardLayout from './layouts/dashboard/admin_desk/AdminDeskDashboardLayout';
import AdminDeskDashboard from './pages/admin_desk/Dashboard';
import AdminDeskExpense from './pages/admin_desk/Expense';
import AdminDeskLeave from './pages/admin_desk/Leave';
import AdminDeskAttendance from './pages/admin_desk/Attendance';

import MeltingDashboardLayout from './layouts/dashboard/melting';
import MeltingDashboard from './pages/melting/Dashboard';

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
        { path: 'profile', element: <Profile /> },
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
        { path: 'employee', element: <Navigate to="/admin/employee/details" replace /> },
        { path: 'employee/details', element: <AdminEmployee /> },
        { path: 'employee/user', element: <AdminEmployeeUserTabs /> },
        { path: 'employee/attendance', element: <AdminAttendance /> },
        { path: 'employee/leave', element: <AdminLeave /> },
        { path: 'report', element: <AdminReport /> },
        { path: 'ornament', element: <AdminOrnament /> },
        { path: 'support', element: <AdminSupport /> },
        { path: 'otp', element: <AdminOTP /> },
        { path: 'purchase', element: <AdminPurchaseTabs /> },
        { path: 'registration-otp', element: <AdminRegistrationOTP /> },
        { path: 'balancesheet', element: <AdminBalancesheet /> },
        { path: 'settings', element: <AdminSettings /> },
        { path: 'designation', element: <AdminDesignation /> },
        { path: 'announcement', element: <AdminAnnouncement /> },
        { path: 'qr-enquiry', element: <AdminQREnquiry /> },
        { path: 'transit', element: <AdminTransit /> },
        { path: 'melting', element: <AdminMelting /> },
        { path: 'vendor', element: <AdminVendor /> },
        { path: 'sell-gold', element: <AdminSellGold /> },
        { path: 'leads', element: <AdminLeadsTabs /> },
        { path: 'payprocess', element: <AdminPayprocess /> },
        { path: 'marketing', element: <AdminMarketingTabs /> },
        { path: 'marketing/campaigns/new', element: <CampaignCreate /> },
        { path: 'marketing/campaigns/edit/:id', element: <CampaignCreate /> },
        { path: 'marketing/campaigns/view/:id', element: <CampaignView /> },
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
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/hr/dashboard" />, index: true },
        { path: 'dashboard', element: <HrDashboard /> },
        { path: 'branch', element: <HrBranch /> },
        { path: 'user', element: <HrUser /> },
        { path: 'leave', element: <HrLeave /> },
        { path: 'attendance', element: <HrAttendance /> },
        { path: 'employee', element: <HrEmployee /> },
        { path: 'payprocess', element: <HrPayprocess /> },
        { path: 'leads', element: <HrLeads /> },
        { path: 'expense', element: <HrExpense /> },
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
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/accounts/dashboard" />, index: true },
        { path: 'dashboard', element: <AccountsDashboard /> },
        { path: 'gold-rate', element: <AccountsGoldRate /> },
        { path: 'branch', element: <AccountsBranch /> },
        { path: 'fund', element: <AccountsFund /> },
        { path: 'expense', element: <AccountsExpense /> },
        { path: 'sale', element: <AccountsSale /> },
        { path: 'balancesheet', element: <AccountsBalancesheet /> },
        { path: 'leave', element: <AccountsLeave /> },
        { path: 'attendance', element: <BranchAttendance /> },
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
        { path: 'profile', element: <Profile /> },
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
        { path: 'qr-enquiry', element: <BranchQREnquiry /> },
        { path: 'transit', element: <BranchTransit /> },
      ],
    },
    {
      path: '/bullion-desk',
      element: (
        <Protected>
          <BullionDeskDashboardLayout />
        </Protected>
      ),
      children: [
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/bullion-desk/dashboard" />, index: true },
        { path: 'dashboard', element: <BranchDashboard /> },
        { path: 'sale', element: <BranchSale /> },
        { path: 'leave', element: <BranchLeave /> },
        { path: 'attendance', element: <BranchAttendance /> },
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
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/master/dashboard" />, index: true },
        { path: 'dashboard', element: <MasterDashboard /> },
      ],
    },
    {
      path: '/auditor',
      element: (
        <Protected>
          <AuditorDashboardLayout />
        </Protected>
      ),
      children: [
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/auditor/dashboard" />, index: true },
        { path: 'dashboard', element: <AuditorDashboard /> },
        { path: 'gold-rate', element: <AuditorGoldRate /> },
        { path: 'expense', element: <AuditorExpense /> },
        { path: 'fund', element: <AuditorFund /> },
        { path: 'sale', element: <AuditorSale /> },
        { path: 'melting', element: <AuditorMelting /> },
        { path: 'sell-gold', element: <AuditorSellGold /> },
        { path: 'leave', element: <BranchLeave /> },
        { path: 'attendance', element: <AuditorAttendance /> },
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
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/operations/dashboard" />, index: true },
        { path: 'dashboard', element: <OperationsDashboard /> },
        { path: 'leave', element: <BranchLeave /> },
        { path: 'attendance', element: <BranchAttendance /> },
      ],
    },
    {
      path: '/melting',
      element: (
        <Protected>
          <MeltingDashboardLayout />
        </Protected>
      ),
      children: [
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/melting/dashboard" />, index: true },
        { path: 'dashboard', element: <MeltingDashboard /> },
        { path: 'transit', element: <AdminTransit /> },
        { path: 'melting', element: <AdminMelting /> },
        { path: 'sell-gold', element: <AdminSellGold /> },
        { path: 'vendor', element: <AdminVendor /> },
        { path: 'sale', element: <AdminSale /> },
        { path: 'employee', element: <AdminEmployee /> },
        { path: 'expense', element: <AdminExpense /> },
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
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/finance/dashboard" />, index: true },
        { path: 'dashboard', element: <FinanceDashboard /> },
        { path: 'gold-rate', element: <AccountsGoldRate /> },
        { path: 'branch', element: <AccountsBranch /> },
        { path: 'fund', element: <AccountsFund /> },
        { path: 'expense', element: <AccountsExpense /> },
        { path: 'sale', element: <AccountsSale /> },
        { path: 'balancesheet', element: <AccountsBalancesheet /> },
        { path: 'leave', element: <AccountsLeave /> },
        { path: 'attendance', element: <BranchAttendance /> },
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
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/telecalling/dashboard" />, index: true },
        { path: 'dashboard', element: <TelecallingDashboard /> },
        { path: 'leads', element: <BranchLeads /> },
        { path: 'attendance', element: <BranchAttendance /> },
        { path: 'leaves', element: <BranchLeave /> },
        
      ],
    },
    {
      path: '/transaction-executive',
      element: (
        <Protected>
          <TransactionExecutiveDashboardLayout />
        </Protected>
      ),
      children: [
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/transaction-executive/dashboard" />, index: true },
        { path: 'dashboard', element: <TransactionExecutiveDashboard /> },
        { path: 'fund', element: <BranchFund /> },
        { path: 'leave', element: <BranchLeave /> },
        { path: 'attendance', element: <BranchAttendance /> },
        { path: 'release', element: <BranchRelease /> },
        { path: 'sale', element: <BranchSale /> },
      ],
    },
    {
      path: '/marketing',
      element: (
        <Protected>
          <MarketingDashboardLayout />
        </Protected>
      ),
      children: [
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/marketing/dashboard" />, index: true },
        { path: 'dashboard', element: <MarketingDashboard /> },
        { path: 'attendance', element: <MarketingAttendance /> },
        { path: 'leave', element: <MarketingLeave /> },
        { path: 'expense', element: <MarketingExpense /> },
        { path: 'campaigns', element: <CampaignList /> },
        { path: 'campaigns/new', element: <CampaignCreate /> },
        { path: 'campaigns/edit/:id', element: <CampaignCreate /> },
        { path: 'campaigns/view/:id', element: <CampaignView /> },
        { path: 'calendar', element: <MarketingCalendar /> },
        { path: 'leads', element: <MarketingLeads /> },
      ],
    },
    {
      path: '/admin-desk',
      element: (
        <Protected>
          <AdminDeskDashboardLayout />
        </Protected>
      ),
      children: [
        { path: 'profile', element: <Profile /> },
        { element: <Navigate to="/admin-desk/dashboard" />, index: true },
        { path: 'dashboard', element: <AdminDeskDashboard /> },
        { path: 'attendance', element: <AdminDeskAttendance /> },
        { path: 'leave', element: <AdminDeskLeave /> },
        { path: 'expense', element: <AdminDeskExpense /> },
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
      path: '/enquiry/:branchId',
      element: <PublicEnquiry />,
    },
    {
      path: '/kyc/:branchId',
      element: <PublicKYC />,
    },
    {
      element: <ErrorPageLayout />,
      children: [
        { path: 'profile', element: <Profile /> },
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
