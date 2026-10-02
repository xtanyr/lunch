export interface DisabledDateRange {
  startDate: string;
  endDate: string;
  message?: string;
}

export interface DateBlockInfo {
  blocked: boolean;
  message?: string;
}

export function getDisabledRanges(disabledDates: unknown): DisabledDateRange[] {
  if (Array.isArray(disabledDates)) return disabledDates.filter(isDisabledDateRange);
  return isDisabledDateRange(disabledDates) ? [disabledDates] : [];
}

function isDisabledDateRange(value: unknown): value is DisabledDateRange {
  if (!value || typeof value !== 'object') return false;
  const range = value as Partial<DisabledDateRange>;
  return typeof range.startDate === 'string' && range.startDate.length > 0 &&
    typeof range.endDate === 'string' && range.endDate.length > 0;
}

export function getOrderDateBlockInfo(orderDate: string, disabledDates: unknown): DateBlockInfo {
  if (!orderDate) return { blocked: false };
  const matchingRange = getDisabledRanges(disabledDates)
    .find(range => orderDate >= range.startDate && orderDate <= range.endDate);
  if (!matchingRange) return { blocked: false };
  return { blocked: true, message: matchingRange.message };
}

export function getSelectedDateBlockInfo(selectedDates: string[], disabledDates: unknown): DateBlockInfo {
  if (selectedDates.length === 0) return { blocked: false };
  const dateBlocks = selectedDates.map(date => getOrderDateBlockInfo(date, disabledDates));
  const firstBlockedDate = dateBlocks.find(info => info.blocked);
  return {
    blocked: dateBlocks.every(info => info.blocked),
    ...(firstBlockedDate ? { message: firstBlockedDate.message } : {}),
  };
}
