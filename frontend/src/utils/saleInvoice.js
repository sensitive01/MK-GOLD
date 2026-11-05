/**
 * Comprehensive list of completed and post-completion statuses in MK-Gold.
 * Stages like transit, moved to melting, melting, melted, and sold occur after
 * the bill is completed and payments are finalized.
 */
const POST_COMPLETED_STATUSES = [
  'completed',
  'approved',
  'intransit',
  'in transit',
  'transit',
  'moved_to_melting',
  'moved to melting',
  'moved',
  'melting',
  'melted',
  'sold',
];

/**
 * Helper to determine whether the "Print" / "Print Invoice" button
 * should be visible for a given sale according to business rules:
 *
 * 1. Physical Bill (saleType === 'physical'):
 *    - Bullion Desk & Finance logins: visible during 'bullion pending', 'finance pending',
 *      or completed and any post-completed status (transit, melting, etc.)
 *    - Other logins: visible ONLY after 'completed' and any post-completed status
 *
 * 2. Release / Pledged Bill (saleType !== 'physical'):
 *    - Before release is completed (assigneeCompleted !== true): HIDDEN for everyone
 *    - After release is completed (assigneeCompleted === true):
 *        - Bullion Desk & Finance logins: visible during 'bullion pending', 'finance pending',
 *          or completed and any post-completed status
 *        - Other logins: visible ONLY after 'completed' and any post-completed status
 *
 * @param {Object} sale - Sale document
 * @param {string} userType - Current user's userType
 * @param {string} pathname - Current window.location.pathname
 * @returns {boolean}
 */
export const canPrintSaleInvoice = (sale, userType = '', pathname = '') => {
  if (!sale || typeof sale !== 'object' || Object.keys(sale).length === 0) return false;

  const rawStatus = String(sale.status || '').toLowerCase().trim();
  const spaceStatus = rawStatus.replace(/_/g, ' ');
  const rawSaleType = String(sale.saleType || '').toLowerCase().trim();
  const role = String(userType || '').toLowerCase().trim();
  const path = String(pathname || '').toLowerCase();

  const isBullionDesk = role === 'bullion_desk' || role.includes('bullion') || path.startsWith('/bullion-desk');
  const isFinance = role === 'finance' || path.startsWith('/finance');
  const isBullionOrFinance = isBullionDesk || isFinance;

  // Completed or post-completion stages (transit, moved to melting, melting, melted, sold)
  const isCompletedOrPostCompleted =
    POST_COMPLETED_STATUSES.includes(rawStatus) ||
    POST_COMPLETED_STATUSES.includes(spaceStatus) ||
    rawStatus.includes('transit') ||
    rawStatus.includes('melt') ||
    Boolean(sale.isMelted) ||
    Boolean(sale.meltRecord);

  const isPendingStage = ['bullion pending', 'finance pending'].includes(spaceStatus);

  const isPhysical = rawSaleType === 'physical';

  if (isPhysical) {
    const canPrint = isBullionOrFinance
      ? (isPendingStage || isCompletedOrPostCompleted)
      : isCompletedOrPostCompleted;
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

  const canPrint = isBullionOrFinance
    ? (isPendingStage || isCompletedOrPostCompleted)
    : isCompletedOrPostCompleted;
  return canPrint;
};
