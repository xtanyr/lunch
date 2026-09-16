/** Pick a random dish from the list, preferring dishes not in avoidIds (for day-to-day variety). */
export function pickRandomDish(dishes: any[], avoidIds: string[] = []): any | null {
  if (!dishes || dishes.length === 0) return null;
  const filtered = avoidIds.length > 0 ? dishes.filter((d) => !avoidIds.includes(d.id)) : [];
  const pool = filtered.length > 0 ? filtered : dishes;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildRandomOrderItems(menuData: {
  weekMenu: any[];
  veganItems: any[];
  otherItems: any[];
  garnishes: any[];
  sauces: any[];
  pastries: any[];
}, avoidDishIds: string[] = [], avoidCategories: string[] = []): any[] | null {
  const { weekMenu, veganItems, otherItems, garnishes, sauces, pastries } = menuData;

  const soups = weekMenu.filter((d) => d.category === 'soup');
  const broths = weekMenu.filter((d) => d.category === 'broth');
  const hotDishes = weekMenu.filter((d) => d.category === 'hot');
  const saladDishes = weekMenu.filter((d) => d.category === 'salad');

  const available = {
    soup: soups.length > 0,
    broth: broths.length > 0,
    hot: hotDishes.length > 0,
    salad: saladDishes.length > 0,
    vegan: veganItems.length > 0,
    other: otherItems.length > 0,
    garnish: garnishes.length > 0,
    sauce: sauces.length > 0,
    pastry: pastries.length > 0,
  };

  type Combo = { items: string[]; price: number };
  let allCombos: Combo[] = [];

  if (available.soup && available.salad) allCombos.push({ items: ['soup', 'salad'], price: 450 });
  if (available.hot && available.salad) allCombos.push({ items: ['hot', 'salad'], price: 450 });
  if (available.broth && available.hot) allCombos.push({ items: ['broth', 'hot'], price: 450 });
  if (available.hot && available.vegan) allCombos.push({ items: ['hot', 'vegan'], price: 400 });
  if (available.hot && available.other) allCombos.push({ items: ['hot', 'other'], price: 450 });
  if (available.broth && available.salad) allCombos.push({ items: ['broth', 'salad'], price: 400 });
  if (available.soup) allCombos.push({ items: ['soup'], price: 250 });
  if (available.hot) allCombos.push({ items: ['hot'], price: 250 });
  if (available.salad) allCombos.push({ items: ['salad'], price: 200 });
  if (available.broth) allCombos.push({ items: ['broth'], price: 200 });

  if (avoidCategories.length > 0) {
    const filteredCombos = allCombos.filter((combo) => !combo.items.some((i) => avoidCategories.includes(i)));
    if (filteredCombos.length > 0) allCombos = filteredCombos;
  }

  if (allCombos.length === 0) return null;

  allCombos.sort((a, b) => b.price - a.price);
  const selectedCombo = allCombos[0];

  const items: any[] = [];

  for (const itemType of selectedCombo.items) {
    switch (itemType) {
      case 'soup': {
        const dish = pickRandomDish(soups, avoidDishIds);
        items.push({
          dishId: dish.id,
          dishName: dish.name,
          category: dish.category,
          price: 250,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          grams: dish.grams,
          calories: dish.calories,
          isVegan: dish.isVegan,
          isVegetarian: dish.isVegetarian,
        });
        break;
      }
      case 'broth': {
        const dish = pickRandomDish(broths, avoidDishIds);
        items.push({
          dishId: dish.id,
          dishName: dish.name,
          category: dish.category,
          price: 200,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          grams: dish.grams,
          calories: dish.calories,
          isVegan: dish.isVegan,
          isVegetarian: dish.isVegetarian,
        });
        break;
      }
      case 'hot': {
        const dish = pickRandomDish(hotDishes, avoidDishIds);
        const hasGarnishOption = !dish.noGarnish && garnishes.length > 0;
        const selectedGarnish = hasGarnishOption ? garnishes[Math.floor(Math.random() * garnishes.length)] : null;
        const selectedSauce = sauces.length > 0 ? sauces[Math.floor(Math.random() * sauces.length)] : null;

        const item: any = {
          dishId: dish.id,
          dishName: dish.name,
          category: 'hot',
          price: 250,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          grams: dish.grams,
          calories: dish.calories,
          garnishInSameBox: true,
        };

        if (selectedGarnish) {
          item.garnish = selectedGarnish.id;
          item.garnishName = selectedGarnish.name;
          item.garnishComposition = selectedGarnish.composition;
          item.garnishGrams = selectedGarnish.grams;
          item.garnishCalories = selectedGarnish.calories;
        }

        if (selectedSauce) {
          item.sauce = selectedSauce.id;
          item.sauceName = selectedSauce.name;
          item.sauceComposition = selectedSauce.composition;
          item.sauceGrams = selectedSauce.grams;
          item.sauceCalories = selectedSauce.calories;
        }

        items.push(item);
        break;
      }
      case 'salad': {
        const dish = pickRandomDish(saladDishes, avoidDishIds);
        items.push({
          dishId: dish.id,
          dishName: dish.name,
          category: 'salad',
          price: 200,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          grams: dish.grams,
          calories: dish.calories,
          isVegan: dish.isVegan,
          isVegetarian: dish.isVegetarian,
        });
        break;
      }
      case 'vegan': {
        const dish = pickRandomDish(veganItems, avoidDishIds);
        items.push({
          dishId: dish.id,
          dishName: dish.name,
          category: 'vegan',
          price: dish.price || 200,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          grams: dish.grams,
          calories: dish.calories,
          isVegan: dish.isVegan,
          isVegetarian: dish.isVegetarian,
        });
        break;
      }
      case 'other': {
        const dish = pickRandomDish(otherItems, avoidDishIds);
        items.push({
          dishId: dish.id,
          dishName: dish.name,
          category: 'other',
          price: dish.price || 200,
          protein: dish.protein,
          carbs: dish.carbs,
          fats: dish.fats,
          grams: dish.grams,
          calories: dish.calories,
          isVegan: dish.isVegan,
          isVegetarian: dish.isVegetarian,
        });
        break;
      }
    }
  }

  const hasSoupOrBroth = items.some((i) => i.category === 'soup' || i.category === 'broth');
  if (hasSoupOrBroth && pastries.length > 0) {
    const pastry = pastries[Math.floor(Math.random() * pastries.length)];
    items.push({ dishId: pastry.id, dishName: pastry.name, category: 'pastry', price: 0 });
  }

  return items;
}

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
