export const getTransitMeltingStatus = (row) => {
  if (!row) return 'unmelted';
  if (row.isMelted || row.meltingStatus === 'melted' || row.status?.toLowerCase() === 'melted') {
    return 'melted';
  }
  if (row.meltingStatus === 'partial') {
    return 'partial';
  }
  if (!row.saleIds || !Array.isArray(row.saleIds) || row.saleIds.length === 0) {
    return 'unmelted';
  }
  let totalOrns = 0;
  let meltedOrns = 0;
  row.saleIds.forEach((sale) => {
    if (sale && sale.ornaments && Array.isArray(sale.ornaments)) {
      totalOrns += sale.ornaments.length;
      meltedOrns += sale.ornaments.filter((o) => o?.status === 'melted').length;
    }
  });
  if (totalOrns > 0 && meltedOrns === totalOrns) return 'melted';
  if (meltedOrns > 0) return 'partial';
  return 'unmelted';
};
