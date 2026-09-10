export const getTransitMeltingStatus = (row) => {
  if (!row) return 'unmelted';

  // Backend now stamps isMelted correctly (only true when melt batch is completed)
  if (row.isMelted) return 'melted';

  // meltRecord-based check for pages that include it (TransitOutwards)
  const meltRecord = row.meltRecord;
  const meltCompleted = meltRecord?.status === 'melt_updated' || meltRecord?.status === 'sold';
  if (meltCompleted) return 'melted';
  if (meltRecord && !meltCompleted) return 'partial';

  if (row.meltingStatus === 'melted') return 'melted';
  if (row.meltingStatus === 'partial') return 'partial';

  return 'unmelted';
};
