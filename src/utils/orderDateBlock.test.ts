import { describe, expect, it } from 'vitest';
import { getSelectedDateBlockInfo } from './orderDateBlock';

describe('getSelectedDateBlockInfo', () => {
  it('returns the blocking message for selected dates when every selected date is blocked', () => {
    const selectedDates = ['2026-10-05', '2026-10-06'];
    const disabledDates = [
      { startDate: '2026-10-05', endDate: '2026-10-05', message: 'Первый день закрыт' },
      { startDate: '2026-10-06', endDate: '2026-10-06', message: 'Второй день закрыт' },
    ];

    expect(getSelectedDateBlockInfo(selectedDates, disabledDates)).toEqual({
      blocked: true,
      message: 'Первый день закрыт',
    });
  });

  it('does not block an empty selection or a selection with an available date', () => {
    const disabledDates = { startDate: '2026-10-05', endDate: '2026-10-05', message: 'Закрыто' };
    expect(getSelectedDateBlockInfo([], disabledDates)).toEqual({ blocked: false });
    expect(getSelectedDateBlockInfo(['2026-10-05', '2026-10-06'], disabledDates)).toEqual({ blocked: false, message: 'Закрыто' });
  });
});
