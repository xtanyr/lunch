import { describe, it, expect, vi } from 'vitest';
import { pickRandomDish, buildRandomOrderItems } from '../utils/omskRandomOrder';

function makeDish(id: string, category: string, overrides: any = {}): any {
  return {
    id,
    name: id,
    category,
    price: overrides.price ?? 0,
    composition: overrides.composition ?? '',
    protein: overrides.protein ?? 1,
    carbs: overrides.carbs ?? 1,
    fats: overrides.fats ?? 1,
    grams: overrides.grams ?? 100,
    calories: overrides.calories ?? 100,
    isVegan: overrides.isVegan ?? false,
    isVegetarian: overrides.isVegetarian ?? false,
    noGarnish: overrides.noGarnish ?? false,
    ...overrides,
  };
}

describe('pickRandomDish', () => {
  it('returns null for empty array', () => {
    expect(pickRandomDish([])).toBeNull();
    expect(pickRandomDish(null as any)).toBeNull();
  });

  it('returns a dish from the list', () => {
    const dishes = [makeDish('a', 'hot'), makeDish('b', 'hot')];
    const picked = pickRandomDish(dishes);
    expect(dishes).toContainEqual(picked);
  });

  it('avoids specified dish ids when possible', () => {
    const dishes = [makeDish('a', 'hot'), makeDish('b', 'hot')];
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const picked = pickRandomDish(dishes, ['a']);
    expect(picked.id).toBe('b');
  });

  it('falls back to full array when all dishes are avoided', () => {
    const dishes = [makeDish('a', 'hot')];
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const picked = pickRandomDish(dishes, ['a']);
    expect(picked.id).toBe('a');
  });
});

describe('buildRandomOrderItems', () => {
  const fullMenu = {
    weekMenu: [makeDish('hot1', 'hot'), makeDish('hot2', 'hot'), makeDish('salad1', 'salad'), makeDish('broth1', 'broth')],
    veganItems: [makeDish('vegan1', 'vegan', { price: 220 })],
    otherItems: [makeDish('other1', 'other', { price: 210 })],
    garnishes: [makeDish('garnish1', 'garnish')],
    sauces: [makeDish('sauce1', 'sauce')],
    pastries: [makeDish('pastry1', 'pastry')],
  };

  const soupMenu = {
    weekMenu: [makeDish('soup1', 'soup'), makeDish('salad1', 'salad')],
    veganItems: [],
    otherItems: [],
    garnishes: [],
    sauces: [],
    pastries: [makeDish('pastry1', 'pastry')],
  };

  it('returns null when no combos are available', () => {
    const menu = {
      weekMenu: [],
      veganItems: [],
      otherItems: [],
      garnishes: [],
      sauces: [],
      pastries: [],
    };
    expect(buildRandomOrderItems(menu)).toBeNull();
  });

  it('prefers highest-price combo', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = buildRandomOrderItems(fullMenu)!;
    const categories = items.map((i: any) => i.category).filter((c: string) => !['garnish', 'sauce', 'pastry'].includes(c));
    expect(categories).toEqual(['hot', 'salad']);
  });

  it('avoids specified dish ids across categories', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = buildRandomOrderItems(fullMenu, ['hot1'])!;
    const hot = items.find((i: any) => i.category === 'hot');
    expect(hot.dishId).not.toBe('hot1');
  });

  it('avoids entire categories on consecutive days', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = buildRandomOrderItems(fullMenu, [], ['soup', 'broth'])!;
    const categories = items.map((i: any) => i.category).filter((c: string) => !['garnish', 'sauce', 'pastry'].includes(c));
    expect(categories).not.toContain('soup');
    expect(categories).not.toContain('broth');
  });

  it('adds pastry when soup or broth is present', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = buildRandomOrderItems(soupMenu)!;
    expect(items.some((i: any) => i.category === 'pastry')).toBe(true);
  });

  it('attaches garnish and sauce for hot dish', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = buildRandomOrderItems(fullMenu)!;
    const hot = items.find((i: any) => i.category === 'hot');
    expect(hot.garnish).toBe('garnish1');
    expect(hot.sauce).toBe('sauce1');
  });

  it('uses vegan/other dish price when present', () => {
    const menu = {
      weekMenu: [makeDish('hot1', 'hot')],
      veganItems: [makeDish('vegan1', 'vegan', { price: 220 })],
      otherItems: [makeDish('other1', 'other', { price: 210 })],
      garnishes: [],
      sauces: [],
      pastries: [],
    };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const items = buildRandomOrderItems(menu)!;
    const other = items.find((i: any) => i.category === 'other');
    expect(other.price).toBe(210);
  });
});
