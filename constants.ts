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
  { id: 'salad_beef_liver', name: 'Салат с говяжьей печенью', category: DishCategory.SALAD },
  { id: 'salad_pineapple', name: 'Салат с ананасом', category: DishCategory.SALAD },
  { id: 'salad_caesar_chicken', name: 'Салат "Цезарь с курицей"', category: DishCategory.SALAD },
  { id: 'salad_eggplant_cheese', name: 'Салат с баклажанами и творожным сыром', category: DishCategory.SALAD },
  { id: 'salad_grouse_nest', name: 'Салат "Гнездо глухаря"', category: DishCategory.SALAD },
  { id: 'salad_greek', name: 'Салат "Греческий"', category: DishCategory.SALAD },
  { id: 'salad_beans', name: 'Салат с фасолью', category: DishCategory.SALAD },
  { id: 'salad_bulgur', name: 'Салат с булгуром', category: DishCategory.SALAD },
  { id: 'salad_pancake', name: 'Салат блинный', category: DishCategory.SALAD },
  { id: 'salad_herring_fur_coat', name: 'Салат "Сельдь под шубой"', category: DishCategory.SALAD },
  { id: 'salad_mimosa', name: 'Салат "Мимоза"', category: DishCategory.SALAD },
  { id: 'salad_baked_vegetables', name: 'Салат из овощей печеных', category: DishCategory.SALAD },
  { id: 'salad_olivier', name: 'Салат "Оливье"', category: DishCategory.SALAD },
  { id: 'salad_vinaigrette', name: 'Салат "Винегрет"', category: DishCategory.SALAD },
  { id: 'salad_beet_cheese', name: 'Салат свекла с сыром', category: DishCategory.SALAD },
  { id: 'salad_fresh_cabbage', name: 'Салат со свежей капустой', category: DishCategory.SALAD },

  // Горячее (включая бывшие супы)
  { id: 'hot_meat_french_style', name: 'Мясо по-французски', category: DishCategory.HOT_DISH },
  { id: 'hot_schnitzel_chicken', name: 'Шницель куриный', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_chicken_appetizing', name: 'Курица аппетитная', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_liver_stroganoff', name: 'Печень по-строгановски', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_orzo_mushrooms', name: 'Паста орзо с грибами', category: DishCategory.HOT_DISH },
  { id: 'hot_pasta_bolognese', name: 'Паста болоньезе', category: DishCategory.HOT_DISH },
  { id: 'hot_soba_chicken', name: 'Соба с курицей', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_breast_sauce', name: 'Грудка куриная в соусе', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_fish_cutlet', name: 'Котлета рыбная', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_potato_asian_chicken', name: 'Картофель по азиатски с курицей', category: DishCategory.HOT_DISH },
  { id: 'hot_plov_meat', name: 'Плов с мясом', category: DishCategory.HOT_DISH },
  { id: 'hot_goulash', name: 'Гуляш (поджарка)', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_strips', name: 'Стрипсы', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_lasagna', name: 'Лазанья', category: DishCategory.HOT_DISH },
  { id: 'hot_sous_vide_breast', name: 'Грудка Су-вид', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_chicken_breast_ginger', name: 'Грудка куриная в имбире', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_wings', name: 'Крылья', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_liver_patties', name: 'Оладьи из печени', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_chicken_meatballs_garnish', name: 'Тефтели куриные с гарниром', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_chicken_cutlet_garnish', name: 'Котлета куриная с гарниром', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_lyulya_kebab', name: 'Люля-кебаб', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_stuffed_pepper_meat', name: 'Перец фаршированный с мясом', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_cabbage_roll_meat_garnish', name: 'Голубец с мясом с гарниром', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_homemade_cutlet', name: 'Котлета домашняя', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_fried_chicken_liver', name: 'Печень куриная жареная', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_fish_meatball', name: 'Тефтелька рыбная', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_sausages', name: 'Колбаски', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_manti_sauce', name: 'Манты с соусом', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_zucchini', name: 'Кабачок', category: DishCategory.HOT_DISH, availableSideIds: ALL_SIDE_IDS },

  // Супы (теперь Горячее)
  { id: 'soup_solyanka_meat', name: 'Солянка мясная', category: DishCategory.HOT_DISH },
  { id: 'soup_mushroom_puree', name: 'Суп пюре из грибов', category: DishCategory.HOT_DISH },
  { id: 'soup_borscht_chicken', name: 'Борщ с курицей', category: DishCategory.HOT_DISH },
  { id: 'soup_pea', name: 'Суп гороховый', category: DishCategory.HOT_DISH },

  // Одно блюдо
  { id: 'hot_fish_baked_vegetables', name: 'Рыба с овощами', category: DishCategory.SINGLE_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_kiev_cutlet', name: 'Котлета по киевски', category: DishCategory.SINGLE_DISH, availableSideIds: ALL_SIDE_IDS },
  { id: 'hot_pasta_carbonara', name: 'Паста карбонара', category: DishCategory.SINGLE_DISH },
  { id: 'hot_pasta_shrimp', name: 'Паста с креветкой', category: DishCategory.SINGLE_DISH },

  // Десерты - Removed
  // { id: 'dessert_cheesecake', name: 'Чизкейк', category: DishCategory.DESSERT },
  // { id: 'dessert_brownie', name: 'Брауни', category: DishCategory.DESSERT },
  // { id: 'dessert_apple_pie', name: 'Яблочный пирог', category: DishCategory.DESSERT },
  // { id: 'dessert_fruit_salad', name: 'Фруктовый салат', category: DishCategory.DESSERT },
  // { id: 'dessert_panna_cotta', name: 'Панна-котта', category: DishCategory.DESSERT },
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

// Новый актуальный список для заказов (currentMenu)
export const currentMenu = {
  "Салаты": [
    { id: 'salad_olivier', name: 'Салат "Оливье"' },
    { id: 'salad_caesar_chicken', name: 'Салат "Цезарь с курицей"' },
    { id: 'salad_pineapple', name: 'Салат с ананасом' },
    { id: 'salad_fresh_cabbage', name: 'Салат со свежей капустой' },
    { id: 'salad_greek', name: 'Салат "Греческий"' }
  ],
  "Супы и горячие": [
    { id: 'soup_solyanka_meat', name: 'Солянка мясная' },
    { id: 'soup_mushroom_puree', name: 'Суп пюре из грибов' },
    { id: 'hot_chicken_appetizing', name: 'Курица аппетитная' },
    { id: 'hot_goulash', name: 'Гуляш (поджарка)' },
    { id: 'hot_chicken_breast_ginger', name: 'Грудка куриная в имбире' },
    { id: 'hot_orzo_mushrooms', name: 'Паста орзо с грибами' },
    { id: 'hot_homemade_cutlet', name: 'Котлета домашняя' }
  ],
  "Одно блюдо": [
    { id: 'hot_pasta_shrimp', name: 'Паста с креветкой' }
  ]
};