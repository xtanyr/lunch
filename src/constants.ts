import { Dish, SideDish, DishCategory } from './types';

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
  { id: 'spaghetti', name: 'Спагетти' },
  { id: 'ptitim', name: 'Паста пти-тим' },
  { id: 'poppy_seeds', name: 'Мак' },
  { id: 'apple', name: 'Яблоко' },
];

export const MENU_ITEMS: Dish[] = [
  // Салаты
  { id: 'salad_ham', name: 'Салат ветчинный', price: 150, category: DishCategory.SALAD, composition: 'ветчина, огурцы свежие, сыр, капуста, зелень, майонез', garnishGrams: 140, isActive: true },
  { id: 'salad_hunters', name: 'Салат Охотничий', price: 160, category: DishCategory.SALAD, composition: 'печень говяжья, морковь, лук репчатый, огурец консервированный, масло подсолнечное, соль, перец, майонез', garnishGrams: 130, isActive: true },
  { id: 'salad_olivier', name: 'Салат "Оливье"', price: 125, category: DishCategory.SALAD, isActive: true },
  { id: 'salad_beef_liver', name: 'Салат с говяжьей печенью', price: 175, category: DishCategory.SALAD, composition: 'печень говяжья отварная, соленый огурец, пассированные лук и морковь, майонез', isActive: true },
  { id: 'salad_mimosa', name: 'Салат "Мимоза"', price: 145, category: DishCategory.SALAD, composition: 'Сайра консервированная, картофель отварной, морковь отварная, яйца куринные, сыр, лук репчатый, майонез, огурец консервированный', garnishGrams: 150, isActive: true },
  { id: 'salad_greek', name: 'Салат "Греческий"', price: 160, category: DishCategory.SALAD, composition: 'помидор, огурец, перец болгарский, маслины, сыр фета, лук красный, оливковое масло', isActive: true },
  { id: 'salad_bulgur', name: 'Салат с булгуром', price: 150, category: DishCategory.SALAD, composition: 'булгур, свежие овощи, зелень, лимонный сок, оливковое масло', isActive: true },
  { id: 'salad_cabbage_apple', name: 'Салат с капустой и яблоком', price: 130, category: DishCategory.SALAD, composition: 'свежая капуста, яблоко, морковь, лимонный сок, масло растительное', isActive: true },
  { id: 'salad_sous_vide_breast_mash', name: 'Салат с грудкой Су-вид и машем', price: 225, category: DishCategory.HOT_DISH, composition: 'грудка Су-вид, маш, яйцо отварное, зелень, огурец свежий, заправка - масло оливковое, зелень, лимонный сок, соль', garnishGrams: 140, isActive: true },
  { id: 'salad_snack', name: 'Салат "Закусочный"', category: DishCategory.SALAD, composition: 'ветчина куриная, яйцо отв, пекинская капуста, сыр, кукуруза, майонез', isActive: true },
  { id: 'salad_vegetables_cheese', name: 'Салат овощи с сыром', category: DishCategory.SALAD, composition: 'свежий помидор, огурец, перец болгарский, сыр адыгейский жареный во фритюре в сухарях, соус бальзамический с оливковым маслом', isActive: true },
  { id: 'salad_shrimp_cucumber', name: 'Салат с креветками огурцом', category: DishCategory.SINGLE_DISH, composition: 'креветка, яйцо отварное, огурец свежий, зелень, соус песто', isActive: true },
  
  // Горячее и супы
  { 
    id: 'soup_solyanka_meat', 
    name: 'Солянка', 
    price: 250, 
    category: DishCategory.HOT_DISH,
    composition: 'мясо говядина, окорок варено-копченный, карбонат, сосиски, огурцы соленые, маслины, томатное пюре, масло подсолнечное, сметана, лимон свежий, морковь свежая, лук репчатый',
    garnishGrams: 250,
    isActive: true
  },
  { id: 'soup_mushroom_home', name: 'Суп грибной по домашнему', price: 225, category: DishCategory.HOT_DISH, composition: 'шампиньоны, картофель, морковь, лук, зелень, сливки', isActive: true },
  { id: 'hot_chicken_cutlet_garnish', name: 'Котлета куриная с гарниром', price: 225, category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'boiled_rice'], composition: 'котлета из куриного фарша', isActive: true },
  { id: 'hot_liver_stroganoff', name: 'Печень по-строгановски с гарниром', price: 250, category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'grechka'], isActive: true },
  { id: 'hot_manti_sauce', name: 'Манты с мясом', price: 185, category: DishCategory.HOT_DISH, composition: 'фарш - говядина, свинина, курица, мука пшеничная высш. сорт, лук репчатый, вода, соль, перец черный молотый', garnishGrams: 190, isActive: true },
  { id: 'hot_lasagna', name: 'Лазанья', price: 235, category: DishCategory.HOT_DISH, composition: 'томаты с пряными травами и фаршем, сыр, соус бешамель, тесто для лазаньи, фарш( курица, свинина, говядина)', isActive: true },
  { id: 'hot_sous_vide_breast', name: 'Грудка Су-вид', price: 235, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'dessert_apple_tart', name: 'Тарт яблочный', price: 190, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'soup_borscht_chicken', name: 'Борщ с курицей', price: 200, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'hot_lasagna_meat', name: 'Лазанья мясная', category: DishCategory.HOT_DISH, composition: 'томаты с пряными травами и фаршем, сыр, соус бешамель, тесто для лазаньи, фарш( курица, свинина, говядина)', isActive: true },
  { id: 'soup_pumpkin_puree', name: 'Суп пюре из тыквы', price: 210, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'hot_chicken_liver_fried', name: 'Печень куриная жареная', price: 240, category: DishCategory.HOT_DISH, availableSideIds: ['boiled_rice', 'mashed_potatoes'], composition: 'печень куриная, лук пассированный, соус терияки, кунжут', garnishGrams: 200, isActive: true },
  { id: 'dessert_honey_cake', name: 'Медовик', price: 210, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'dessert_earl_grey_chocolate', name: 'Эрл грей шоколадный', price: 250, category: DishCategory.SINGLE_DISH, isActive: true },
  { id: 'dessert_basket_sour_cream_berry', name: 'Корзинка сметанно-ягодная', price: 210, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'dessert_trifle_winter_cherry', name: 'Трайфл Зимняя вишня', category: DishCategory.HOT_DISH, isActive: true },
  
  // Одно блюдо
  { 
    id: 'single_salmon_roll', 
    name: 'Ролл с семгой', 
    price: 350, 
    category: DishCategory.SINGLE_DISH,
    protein: 15.8,
    carbs: 45.2,
    fats: 8.3,
    garnishGrams: 250,
    isActive: true
  },
  { id: 'hot_pasta_shrimp', name: 'Паста с креветкой', price: 320, category: DishCategory.SINGLE_DISH, isActive: true },
  { id: 'single_chicken_cutlets_steamed', name: 'Биточки куриные на пару', price: 285, category: DishCategory.SINGLE_DISH, availableSideIds: ['grechka', 'boiled_rice'], isActive: true },
  { id: 'single_salmon_sous_vide_vegetables', name: 'Семга су-вид с овощами', price: 400, category: DishCategory.SINGLE_DISH, composition: 'жюльен: кабачок, морковь, лимонный сок, прованские травы', isActive: true },
  { id: 'single_chicken_french_style', name: 'Курица по-французски', price: 260, category: DishCategory.SINGLE_DISH, composition: 'филе куриное, пассированный лук, картофель, сыр, майонез', isActive: true },
  { id: 'single_tongue_cream_spinach', name: 'Язык в сливочно-шпинатном соусе с пюре', category: DishCategory.SINGLE_DISH, composition: 'язык, сливки, шпинат', isActive: true },
  { id: 'single_pike_perch_onion_carrot', name: 'Судак припущенный с луком и морковью', category: DishCategory.SINGLE_DISH, composition: 'гарнир отварной картофель', isActive: true },
  
  // Добавляем еще несколько популярных блюд
  { id: 'salad_krab', name: 'Салат "Крабовый"', price: 150, category: DishCategory.SALAD, isActive: true },
  { id: 'salad_grouse_nest', name: 'Салат "Гнездо глухаря"', price: 160, category: DishCategory.SALAD, composition: 'курица, яйцо, пассированый лук, солёный огурец, картофель пай, майонез', isActive: true },
  { id: 'salad_health', name: 'Салат «Здоровье»', price: 160, category: DishCategory.SALAD, composition: 'перец болгарский, помидор, огурец свежий, зелень, кукуруза, соус на основе сыра', isActive: true },
  { id: 'soup_rassolnik_chicken', name: 'Рассольник с курицей', price: 220, category: DishCategory.HOT_DISH, isActive: true },
  { id: 'soup_broccoli_puree', name: 'Суп пюре брокколи', price: 220, category: DishCategory.HOT_DISH, composition: 'брокколи, картофель, овощной бульон, шпинат', isActive: true },
  { id: 'hot_soba_chicken', name: 'Соба с курицей', price: 235, category: DishCategory.HOT_DISH, composition: 'гречишная лапша, с курицей и овощами заправка на основе имбиря, соевого соуса и терияки', isActive: true },
  { id: 'hot_meatballs', name: 'Тефтели мясные', price: 225, category: DishCategory.HOT_DISH, availableSideIds: ['mashed_potatoes', 'grechka'], composition: 'фарш курица, свинина', isActive: true },
  { id: 'single_curd_pancakes', name: 'Сырники', price: 250, category: DishCategory.HOT_DISH, composition: 'творог 5%, мука пшеничная, сметана, сахар, яйца куринные, масло растительное', garnishGrams: 150, isActive: true },
  { id: 'single_pancakes_apple_cinnamon', name: 'Блинчики с яблоком и корицей', price: 230, category: DishCategory.HOT_DISH, isActive: true },
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

// Города
export const CITIES = [
  { id: 'omsk', label: 'Омск' },
  { id: 'spb', label: 'Санкт-Петербург' },
  { id: 'samara', label: 'Самара' },
  { id: 'moscow', label: 'Москва' },
  { id: 'kazan', label: 'Казань' },
];

// Адреса для заказов по городам
export const CITY_ADDRESSES: Record<string, { id: string; label: string }[]> = {
  omsk: [
    { id: 'office', label: 'Офис' },
    { id: 'kamergersky', label: 'Камергерский' },
    { id: 'gagarina', label: 'Гагарина' },
    { id: 'drujniy', label: 'Дружный' },
    { id: 'chv', label: 'ЧВ' },
    { id: 'festival', label: 'Фестиваль' },
    { id: 'atlantida', label: 'Атлантида' },
    { id: 'sfera', label: 'Сфера' },
    { id: 'inter', label: 'Интер' },
    { id: 'sibirskie_ogni', label: 'Сибирские Огни' },
    { id: 'mira', label: 'Мира' },
    { id: '22_aprelya', label: '22 апреля' },
    { id: 'tuhachevskogo', label: 'Тухачевского' },
  ],
  spb: [
    { id: 'kirova', label: 'Кирова' },
    { id: 'novaya_gollandia', label: 'Новая Голландия' },
    { id: 'vosstaniya', label: 'Восстания' },
    { id: 'posadskaya', label: 'Посадская' },
    { id: 'vokzal', label: 'Вокзал' },
  ],
  samara: [
    { id: 'krasnoarmeyskaya', label: 'Красноармейская' },
    { id: 'kuibysheva', label: 'Куйбышева' },
    { id: 'molodogvardeyskaya', label: 'Молодогвардейская' },
    { id: 'novo_sadovaya', label: 'Ново-Садовая' },
    { id: 'galaktionovskaya', label: 'Галактионовская' },
    { id: 'volna', label: 'Волна' },
  ],
  moscow: [
    { id: 'mos_center', label: 'Центр' },
  ],
  kazan: [
    { id: 'kaz_center', label: 'Центр' },
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
            price: dish.price,
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
