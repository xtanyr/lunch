import { describe, it, expect } from 'vitest';
import { computeCurrentItemPrice, computeCurrentOrderTotal, OMSK_CATEGORY_PRICES } from '../server/omskExport';

describe('computeCurrentItemPrice', () => {
  const basePriceMaps = {
    week: { soup1: 260, hot1: 270, salad1: 210, broth1: 210 },
    vegan: { vegan1: 230 },
    other: { other1: 220 },
  };

  it('returns 0 for free categories', () => {
    expect(computeCurrentItemPrice({ category: 'garnish', dishId: 'x' }, basePriceMaps)).toBe(0);
    expect(computeCurrentItemPrice({ category: 'sauce', dishId: 'x' }, basePriceMaps)).toBe(0);
    expect(computeCurrentItemPrice({ category: 'pastry', dishId: 'x' }, basePriceMaps)).toBe(0);
  });

  it('prefers current week-menu price for soup/broth/hot/salad', () => {
    expect(computeCurrentItemPrice({ category: 'soup', dishId: 'soup1' }, basePriceMaps)).toBe(260);
    expect(computeCurrentItemPrice({ category: 'hot', dishId: 'hot1' }, basePriceMaps)).toBe(270);
  });

  it('falls back to category base price when week price is missing or zero', () => {
    expect(computeCurrentItemPrice({ category: 'soup', dishId: 'missing' }, basePriceMaps)).toBe(OMSK_CATEGORY_PRICES.soup);
    expect(computeCurrentItemPrice({ category: 'soup', dishId: 'zero' }, { ...basePriceMaps, week: { ...basePriceMaps.week, zero: 0 } })).toBe(OMSK_CATEGORY_PRICES.soup);
  });

  it('falls back to stored item price for vegan/other when price map missing', () => {
    const item = { category: 'vegan', dishId: 'missing', price: 300 };
    expect(computeCurrentItemPrice(item, basePriceMaps)).toBe(300);
    const otherItem = { category: 'other', dishId: 'missing', price: 310 };
    expect(computeCurrentItemPrice(otherItem, basePriceMaps)).toBe(310);
  });

  it('uses vegan/other price maps', () => {
    expect(computeCurrentItemPrice({ category: 'vegan', dishId: 'vegan1' }, basePriceMaps)).toBe(230);
    expect(computeCurrentItemPrice({ category: 'other', dishId: 'other1' }, basePriceMaps)).toBe(220);
  });
});

describe('computeCurrentOrderTotal', () => {
  const priceMaps = {
    week: { soup1: 260, hot1: 270, salad1: 210 },
    vegan: {} as Record<string, number>,
    other: {} as Record<string, number>,
  };

  it('sums recomputed item prices', () => {
    const order = {
      items: [
        { category: 'soup', dishId: 'soup1', price: 250 },
        { category: 'hot', dishId: 'hot1', price: 250 },
        { category: 'salad', dishId: 'salad1', price: 200 },
      ],
    };
    expect(computeCurrentOrderTotal(order, priceMaps)).toBe(260 + 270 + 210);
  });

  it('ignores free categories', () => {
    const order = {
      items: [
        { category: 'soup', dishId: 'soup1', price: 250 },
        { category: 'garnish', dishId: 'g1', price: 0 },
        { category: 'sauce', dishId: 's1', price: 0 },
      ],
    };
    expect(computeCurrentOrderTotal(order, priceMaps)).toBe(260);
  });

  it('falls back to stored totalPrice when items missing/invalid', () => {
    expect(computeCurrentOrderTotal({ totalPrice: 1000 } as any, priceMaps)).toBe(1000);
    expect(computeCurrentOrderTotal({ items: 'bad' } as any, priceMaps)).toBe(0);
  });
});
