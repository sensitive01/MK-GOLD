/**
 * Helper to determine whether the "Print" / "Print Invoice" button
 * should be visible for a given sale according to business rules:
 *
 * 1. Physical Bill (saleType === 'physical'):
 *    - Bullion Desk & Finance logins: visible during 'bullion pending', 'finance pending', or 'completed'
 *    - Other logins: visible ONLY after 'completed'
 *
 * 2. Release / Pledged Bill (saleType !== 'physical'):
 *    - Before release is completed (assigneeCompleted !== true): HIDDEN for everyone
 *    - After release is completed (assigneeCompleted === true):
 *        - Bullion Desk & Finance logins: visible during 'bullion pending', 'finance pending', or 'completed'
 *        - Other logins: visible ONLY after 'completed'
 *
 * @param {Object} sale - Sale document
 * @param {string} userType - Current user's userType
 * @param {string} pathname - Current window.location.pathname
 * @returns {boolean}
 */
export const canPrintSaleInvoice = (sale, userType = '', pathname = '') => {
  if (!sale || typeof sale !== 'object' || Object.keys(sale).length === 0) return false;

  const rawStatus = String(sale.status || '').toLowerCase().replace(/_/g, ' ').trim();
  const rawSaleType = String(sale.saleType || '').toLowerCase().trim();
  const role = String(userType || '').toLowerCase().trim();
  const path = String(pathname || '').toLowerCase();

  const isBullionDesk = role === 'bullion_desk' || role.includes('bullion') || path.startsWith('/bullion-desk');
  const isFinance = role === 'finance' || path.startsWith('/finance');
  const isBullionOrFinance = isBullionDesk || isFinance;

  const isCompleted = ['completed', 'intransit', 'moved', 'moved_to_melting', 'melted', 'approved'].includes(rawStatus);
  const isPendingStage = ['bullion pending', 'finance pending'].includes(rawStatus);

  const isPhysical = rawSaleType === 'physical';

  if (isPhysical) {
    const canPrint = isBullionOrFinance ? (isPendingStage || isCompleted) : isCompleted;
    return canPrint;
  }

  // Release / Pledged bill: must be finished by release assignee
  const isReleaseDone = Boolean(
    sale.assigneeCompleted ||
    (Array.isArray(sale.release) && sale.release.length > 0 && sale.release.every((r) => Boolean(r.assigneeCompleted)))
  );

  if (!isReleaseDone) {
    return false;
  }

  const canPrint = isBullionOrFinance ? (isPendingStage || isCompleted) : isCompleted;
  return canPrint;
};
