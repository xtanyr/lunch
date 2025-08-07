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
  { id: 'grechka', name: 'Гречка'},
  { id: 'spaghetti', name: 'Спагетти' }, // добавлен новый гарнир
  { id: 'ptitim', name: 'Паста пти-тим' }, // добавлен новый гарнир
];

const ALL_SIDE_IDS = SIDE_DISHES.map(s => s.id);

export const MENU_ITEMS: Dish[] = [
  // Салаты
  { id: 'salad_beef_liver', name: 'Салат с говяжьей печенью', category: DishCategory.SALAD, composition: 'печень говяжья отварная, соленный огурец, пассированные лук и морковь, майонез' },
  { id: 'salad_mimosa', name: 'Салат "Мимоза"', category: DishCategory.SALAD },
  { id: 'salad_krab', name: 'Салат "Крабовый"', category: DishCategory.SALAD },
  { id: 'salad_grouse_nest', name: 'Салат "Гнездо глухаря"', category: DishCategory.SALAD, composition: 'курица, яйцо, пассированый лук, солёный огурец, картофель пай, майонез' },
  { id: 'salad_health', name: 'Салат «Здоровье»', category: DishCategory.SALAD },
  { id: 'salad_spring', name: 'Салат весенний', category: DishCategory.SALAD },
  { id: 'salad_pineapple', name: 'Салат с ананасом', category: DishCategory.SALAD },
  { id: 'salad_caesar_chicken', name: 'Салат "Цезарь с курицей"', category: DishCategory.SALAD },
  { id: 'salad_eggplant_cheese', name: 'Салат с баклажанами и творожным сыром', category: DishCategory.SALAD, composition: 'с помидором, зеленью, творожным сыром и кисло-сладким соусом' },
  { id: 'salad_greek', name: 'Салат "Греческий"', category: DishCategory.SALAD, composition: 'помидор, огурец, болгарский перец свежие, маслины, творожный сыр, заправка масло+соевый соус' },
  { id: 'salad_beans', name: 'Салат с фасолью', category: DishCategory.SALAD },
  { id: 'salad_bulgur', name: 'Салат с булгуром', category: DishCategory.SALAD, composition: 'булгур, морковь, перец болгарский, св. огурец, пекинская капуста, масло растит+лим.сок' },
  { id: 'salad_pancake', name: 'Салат блинный', category: DishCategory.SALAD, composition: 'блинчики, ветчина куриная, помидор, болгарский перец, майонез' },
  { id: 'salad_herring_fur_coat', name: 'Салат "Сельдь под шубой"', category: DishCategory.SALAD, composition: 'сельдь соленая, картофель, свекла, морковь отварная, майонез' },
  { id: 'salad_baked_vegetables', name: 'Салат из овощей печеных', category: DishCategory.SALAD },
  { id: 'salad_olivier', name: 'Салат "Оливье"', category: DishCategory.SALAD },
  { id: 'salad_vinaigrette', name: 'Салат "Винегрет"', category: DishCategory.SALAD, composition: 'отварные овощи картофель, свекла, морковь, кв.капуста, соленый огурец, зел. горошек, масло растительное' },
  { id: 'salad_beet_cheese', name: 'Салат свекла с сыром', category: DishCategory.SALAD },
  { id: 'salad_fresh_cabbage', name: 'Салат со свежей капустой', category: DishCategory.SALAD },
  { id: 'salad_egg_chicken_sous_vide', name: 'Салат с яйцом, Грудкой Су-вид', category: DishCategory.SALAD },
  { id: 'salad_layered_chicken_liver', name: 'Салат слоеный с куриной печенью', category: DishCategory.SALAD },
  { id: 'salad_krab', name: 'Салат Крабовый', category: DishCategory.SALAD },
  { id: 'salad_baked_vegetables', name: 'Салат из овощей печеных', category: DishCategory.SALAD },
  { id: 'salad_pineapple_chicken', name: 'Салат с ананасом и курицей', category: DishCategory.SALAD },
  { id: 'salad_caesar_chicken', name: 'Салат Цезарь с курицей', category: DishCategory.SALAD },
  { id: 'salad_vegetables', name: 'Салат овощной', category: DishCategory.SALAD },
  { id: 'salad_snack', name: 'Салат Закусочный', category: DishCategory.SALAD },
  // Горячее и супы
  { id: 'soup_borscht_chicken', name: 'Борщ с курицей', category: DishCategory.HOT_DISH },
  { id: 'soup_broccoli_puree', name: 'Суп пюре брокколи', category: DishCategory.HOT_DISH, composition: 'броколли, картофель, овощной бульон, шпинат' },
  { id: 'soup_noodle_chicken', name: 'Суп лапша домашняя с курицей', category: DishCategory.HOT_DISH, composition: 'суп лапша домашняя с курицей' },
  { id: 'soup_solyanka_meat', name: 'Солянка мясная', category: DishCategory.HOT_DISH },
  { id: 'soup_mushroom_puree', name: 'Суп пюре из грибов', category: DishCategory.HOT_DISH },
  { id: 'hot_sous_vide_breast_grilled_veg', name: 'Грудка Су-вид с овощами гриль', category: DishCategory.HOT_DISH },
  { id: 'soup_pea', name: 'Суп гороховый', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_meatballs_garnish', name: 'Тефтели куриные с пюре', category: DishCategory.HOT_DISH, composition: 'фарш-свинина, курица, маринад- лук, морковь, томат, гвоздика, перец' },
  { id: 'hot_schnitzel_chicken', name: 'Шницель куриный', category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'steamed_vegetables'] },
  { id: 'hot_soba_chicken', name: 'Соба с курицей', category: DishCategory.HOT_DISH },
  { id: 'hot_liver_stroganoff_garnish', name: 'Печень по-строгановски', category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'grechka'], composition: 'печень говяжья, лук, соус на основе сливок, масла сливочного: пюре, гречка' },
  { id: 'hot_plov_pork', name: 'Плов со свининой', category: DishCategory.HOT_DISH },
  { id: 'hot_manti_sauce', name: 'Манты с соусом', category: DishCategory.HOT_DISH },
  { id: 'hot_meat_french_style', name: 'Мясо по-французски', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_appetizing', name: 'Курица аппетитная', category: DishCategory.HOT_DISH, composition: 'грудка куриная, помидор, сыр, майонез запекается' },
  { id: 'hot_liver_stroganoff', name: 'Печень по-строгановски', category: DishCategory.HOT_DISH },
  { id: 'hot_orzo_mushrooms', name: 'Паста орзо с грибами', category: DishCategory.HOT_DISH },
  { id: 'hot_pasta_bolognese', name: 'Паста болоньезе', category: DishCategory.HOT_DISH, composition: 'фарш: курица, свинина, говядина' },
  { id: 'hot_chicken_breast_sauce', name: 'Грудка куриная в соусе', category: DishCategory.HOT_DISH },
  { id: 'hot_fish_cutlet', name: 'Котлета рыбная', category: DishCategory.HOT_DISH },
  { id: 'hot_potato_asian_chicken', name: 'Картофель по азиатски с курицей', category: DishCategory.HOT_DISH, composition: '(острое блюдо) картофель, морковь, лук, фасоль стручковая, перец болгарский, курица, кисло-сладкий соус, террияки' },
  { id: 'hot_plov_meat', name: 'Плов с мясом', category: DishCategory.HOT_DISH },
  { id: 'hot_strips', name: 'Стрипсы', category: DishCategory.HOT_DISH },
  { id: 'hot_lasagna', name: 'Лазанья', category: DishCategory.HOT_DISH },
  { id: 'hot_sous_vide_breast', name: 'Грудка Су-вид', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_breast_ginger', name: 'Грудка куриная в имбире', category: DishCategory.HOT_DISH },
  { id: 'hot_wings', name: 'Крылья', category: DishCategory.HOT_DISH },
  { id: 'hot_liver_patties', name: 'Оладьи из печени', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_cutlet_garnish', name: 'Котлета куриная с гарниром', category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'ptitim', 'grechka'] },
  { id: 'hot_lyulya_kebab', name: 'Люля-кебаб', category: DishCategory.HOT_DISH },
  { id: 'hot_stuffed_pepper_meat', name: 'Перец фаршированный с мясом', category: DishCategory.HOT_DISH },
  { id: 'hot_cabbage_roll_meat_garnish', name: 'Голубец с мясом с гарниром', category: DishCategory.HOT_DISH },
  { id: 'hot_homemade_cutlet', name: 'Котлета домашняя', category: DishCategory.HOT_DISH },
  { id: 'hot_fried_chicken_liver', name: 'Печень куриная жареная', category: DishCategory.HOT_DISH },
  { id: 'hot_fish_meatball', name: 'Тефтелька рыбная', category: DishCategory.HOT_DISH },
  { id: 'hot_sausages', name: 'Колбаски', category: DishCategory.HOT_DISH },
  { id: 'hot_zucchini', name: 'Кабачок', category: DishCategory.HOT_DISH },
  { id: 'dessert_trifle_snickers', name: 'Трайфл сникерс (тирамису)', category: DishCategory.HOT_DISH },
  { id: 'dessert_trifle_cherry', name: 'Трайфл вишня (тирамису)', category: DishCategory.HOT_DISH },
  { id: 'soup_mushroom_home', name: 'Суп грибной по домашнему', category: DishCategory.HOT_DISH },
  { id: 'soup_cabbage_fresh', name: 'Суп щи со свежей капустой', category: DishCategory.HOT_DISH },
  { id: 'hot_plov_meat', name: 'Плов с мясом', category: DishCategory.HOT_DISH },
  { id: 'hot_chicken_meatballs_garnish', name: 'Тефтели куриные', category: DishCategory.HOT_DISH, availableSideIds: ['spaghetti', 'grechka'] },
  { id: 'hot_schnitzel_chicken', name: 'Шницель куриный', category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'steamed_vegetables'] },
  { id: 'hot_soba_chicken', name: 'Соба с курицей ', category: DishCategory.HOT_DISH },
  { id: 'hot_goulash', name: 'Гуляш  из курицы', category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'] },
  { id: 'hot_medovik', name: 'Медовик', category: DishCategory.HOT_DISH },
  { id: 'hot_panna_cotta_strawberry', name: 'Десерт панна-котта с малиной', category: DishCategory.HOT_DISH },

  // Одно блюдо
  { id: 'single_risotto_shrimp', name: 'Ризотто с креветкой', category: DishCategory.SINGLE_DISH },
  { id: 'single_meat_french_chicken', name: 'Мясо по-французски (курица)', category: DishCategory.SINGLE_DISH },
  { id: 'single_twister_chicken', name: 'Твистер с курицей и овощами в сырной лепешке', category: DishCategory.SINGLE_DISH },
  { id: 'hot_fish_baked_vegetables', name: 'Рыба с овощами', category: DishCategory.SINGLE_DISH },
  { id: 'hot_kiev_cutlet', name: 'Котлета по киевски', category: DishCategory.SINGLE_DISH },
  { id: 'hot_pasta_carbonara', name: 'Паста карбонара', category: DishCategory.SINGLE_DISH },
  { id: 'hot_pasta_shrimp', name: 'Паста с креветкой', category: DishCategory.SINGLE_DISH },
  { id: 'single_fish_batter_garnish', name: 'Рыба в кляре', category: DishCategory.SINGLE_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'] },
  { id: 'single_pasta_carbonara', name: 'Паста карбонара', category: DishCategory.SINGLE_DISH },
  { id: 'single_pavlova', name: 'Десерт Павловой', category: DishCategory.SINGLE_DISH },
  
  // Новые блюда для актуального меню
  { id: 'salad_chicken_pepper', name: 'Салат с курицей и болгарским перцем', category: DishCategory.SALAD, composition: 'грудка Су-вид, перец свежий, огурец консервированный, морковь отварная, имбирно-чесночная заправка' },
  { id: 'soup_rassolnik_chicken', name: 'Рассольник с курицей', category: DishCategory.HOT_DISH, composition: 'рассольник с курицей' },
  { id: 'hot_lyulya_kebab_vegetables', name: 'Люля-кебаб, овощи гриль с картофельными дольками', category: DishCategory.HOT_DISH, composition: 'фарш курица, свинина, перец болгарский, зелень, сыр: овощи гриль с картофельными дольками' },
  { id: 'hot_flounder_onion', name: 'Камбала жаренная с луком пассированным', category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'], composition: 'камбала жаренная с луком пассированным' },
  { id: 'hot_salmon_sous_vide', name: 'Семга Су-вид на жюльене из печенных овощей', category: DishCategory.HOT_DISH, composition: 'жульен: кабачок, морковь, лимонный сок, прованские травы' },
  { id: 'single_flounder_onion', name: 'Камбала жаренная с луком пассированным', category: DishCategory.SINGLE_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'], composition: 'камбала жаренная с луком пассированным' },
  
  // Новые блюда для актуального меню
  { id: 'dessert_chocolate_pancakes', name: 'Блины шоколадные с вишней и творогом (2шт)', category: DishCategory.HOT_DISH, composition: 'блины шоколадные с вишней и творогом' },
  { id: 'single_chicken_patties_steam', name: 'Биточки куриные на пару', category: DishCategory.SINGLE_DISH, availableSideIds: ['steamed_vegetables', 'baked_potatoes', 'grilled_vegetables'], composition: 'биточки куриные на пару' },
  { id: 'single_pollock_cream_sauce', name: 'Минтай в сливочном соусе с овощами', category: DishCategory.SINGLE_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'], composition: 'филе минтая, картофель, морковь, лук, помидор, сливочный соус, брокколи' },
  { id: 'dessert_caramel', name: 'Карамелька', category: DishCategory.SINGLE_DISH, composition: 'бисквит выпекается с уваренным сгущенным молоком, крем заварной и сырно-карамельный' },
  { id: 'single_pike_patties', name: 'Биточек из щуки', category: DishCategory.SINGLE_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'], composition: 'щука, молоко, пассированный лук, морковь, хлеб' },
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
  [DishCategory.SALAD]: [
    { id: 'salad_vinaigrette' }, // Салат "Винегрет" (отварные овощи картофель, свекла, морковь, кв.капуста, соленый огурец, зел. горошек, масло растительное)
    { id: 'salad_olivier' }, // Салат "Оливье"
    { id: 'salad_krab' }, // Салат "Крабовый"
    { id: 'salad_grouse_nest' }, // Салат "Гнездо глухаря" (курица, яйцо, пассированый лук, солёный огурец, картофель пай, майонез)
    { id: 'salad_mimosa' }, // Салат "Мимоза"
    { id: 'salad_bulgur' }, // Салат с булгуром (булгур, морковь,перец болгарский, св. огурец,пекинская капуста, масло растит+лим.сок)
  ],
  [DishCategory.HOT_DISH]: [
    { id: 'soup_solyanka_meat' }, // Солянка мясная
    { id: 'soup_broccoli_puree' }, // Суп пюре брокколи (броколли, картофель, овощной бульон, шпинат)
    { id: 'hot_plov_pork' }, // Плов с мясом (свинина)
    { id: 'hot_chicken_appetizing' }, // Курица аппетитная (грудка куриная, помидор, сыр , майонез запекается)
    { id: 'dessert_chocolate_pancakes' }, // Блины шоколадные с вишней и творогом (2шт)
    { id: 'hot_chicken_meatballs_garnish' }, // Тефтели куриные с гарниром (фарш-свинина, курица)( маринад- лук, морковь, томат, гвоздика, перец)
  ],
  [DishCategory.SINGLE_DISH]: [
    { id: 'single_chicken_patties_steam' }, // Биточки куриные на пару
    { id: 'single_pollock_cream_sauce' }, // Минтай в сливочном соусе с овощами (пюре или рис) (филе минтая, картофель, морковь, лук, помидор, сливочный соус, брокколи)
    { id: 'dessert_caramel' }, // Карамелька (бисквит выпекается с уваренным сгущенным молоком, крем заварной и сырно-карамельный)
    { id: 'single_pike_patties' }, // Биточек из щуки (рис с овощами или пюре) ( щука, молоко, пассированный лук, морковь, хлеб)
  ],
};

// Функция для агрегации заказов по дате
export const aggregateOrdersByDate = (ordersByDate: { [date: string]: any[] }, menuItems: any[], sideDishes: any[]) => {
  const result: { [date: string]: any[] } = {};
  
  Object.entries(ordersByDate).forEach(([date, orders]) => {
    const summary: { [key: string]: any } = {};
    
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const dish = menuItems.find(d => d.id === item.dishId);
        if (!dish) return;

        const side = item.selectedSideId ? sideDishes.find(s => s.id === item.selectedSideId) : undefined;
        
        const key = `${dish.id}${item.selectedSideId ? `_${item.selectedSideId}` : ''}`;

        if (summary[key]) {
          summary[key].totalQuantity += 1;
        } else {
          summary[key] = {
            dishId: dish.id,
            dishName: dish.name,
            category: dish.category,
            selectedSideId: item.selectedSideId,
            selectedSideName: side?.name,
            composition: dish.composition,
            totalQuantity: 1,
          };
        }
      });
    });
    
    result[date] = Object.values(summary).sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.dishName.localeCompare(b.dishName);
    });
  });
  
  return result;
};