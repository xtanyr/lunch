import { Dish, SideDish, DishCategory } from './types';

// export const BUDGET_LIMIT = 400; // Removed: Prices and budget limits are no longer used

export const SIDE_DISHES: SideDish[] = [
  { id: 'no_garnish', name: 'Без гарнира' },
  { id: 'grilled_vegetables', name: 'Овощи гриль' },
  { id: 'rice_with_vegetables', name: 'Рис с овощами' },
  { id: 'boiled_rice', name: 'Рис отварной' },
  { id: 'mashed_potatoes', name: 'Картофельное пюре' },
  { id: 'baked_potatoes', name: 'Запеченный картофель' },
  { id: 'steamed_vegetables', name: 'Овощи на пару' },
  { id: 'bulgur', name: 'Булгур' },
  { id: 'grechka', name: 'Гречка'}
];

const ALL_SIDE_IDS = SIDE_DISHES.map(s => s.id);

export const MENU_ITEMS: Dish[] = [
  // Салаты
  { id: 'salad_olivier', name: 'Салат "Оливье"', category: DishCategory.SALAD },
  { id: 'salad_caesar_chicken', name: 'Салат "Цезарь с курицей"', category: DishCategory.SALAD },
  { id: 'salad_pineapple', name: 'Салат с ананасом', category: DishCategory.SALAD },
  { id: 'salad_fresh_cabbage', name: 'Салат со свежей капустой', category: DishCategory.SALAD },
  { id: 'salad_greek', name: 'Салат "Греческий"', category: DishCategory.SALAD },

  // Супы и горячие
  { id: 'soup_solyanka_meat', name: 'Солянка мясная', category: DishCategory.HOT_DISH },
  { id: 'soup_mushroom_puree', name: 'Суп пюре из грибов', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_appetizing', name: 'Курица аппетитная', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_goulash', name: 'Гуляш (поджарка)', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_chicken_breast_ginger', name: 'Грудка куриная в имбире', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_orzo_mushrooms', name: 'Паста орзо с грибами', category: DishCategory.HOT_DISH },
  { id: 'hot_homemade_cutlet', name: 'Котлета домашняя', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },

  // Одно блюдо
  { id: 'hot_pasta_shrimp', name: 'Паста с креветкой', category: DishCategory.SINGLE_DISH },
];

export const DEPARTMENTS: string[] = [
  'Финансовый отдел',
  'Развитие сети',
  'Снабжение',
  'Тренеры по кофе',
  'Маркетинг',
  'HR+Университет',
  'IT Отдел',
  'Отдел напитки',
];