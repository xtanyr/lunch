export const OMSK_CATEGORY_PRICES: Record<string, number> = {
  soup: 250,
  broth: 200,
  hot: 250,
  salad: 200,
  vegan: 200,
  other: 200,
  pastry: 0,
  garnish: 0,
  sauce: 0,
};

export function computeCurrentItemPrice(item: any, priceMaps: { week: Record<string, number>; vegan: Record<string, number>; other: Record<string, number> }): number {
  const category = item.category;
  if (category === 'garnish' || category === 'sauce' || category === 'pastry') return 0;
  if (category === 'vegan') {
    const p = priceMaps.vegan[item.dishId];
    if (typeof p === 'number' && p > 0) return p;
    return typeof item.price === 'number' && item.price > 0 ? item.price : OMSK_CATEGORY_PRICES.vegan;
  }
  if (category === 'other') {
    const p = priceMaps.other[item.dishId];
    if (typeof p === 'number' && p > 0) return p;
    return typeof item.price === 'number' && item.price > 0 ? item.price : OMSK_CATEGORY_PRICES.other;
  }
  const p = priceMaps.week[item.dishId];
  if (typeof p === 'number' && p > 0) return p;
  return OMSK_CATEGORY_PRICES[category] || 0;
}

export function computeCurrentOrderTotal(order: any, priceMaps: { week: Record<string, number>; vegan: Record<string, number>; other: Record<string, number> }): number {
  if (!order.items || !Array.isArray(order.items)) return typeof order.totalPrice === 'number' ? order.totalPrice : 0;
  return order.items.reduce((sum: number, item: any) => sum + computeCurrentItemPrice(item, priceMaps), 0);
}
