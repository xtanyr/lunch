
import React from 'react';
import { Dish, SideDish, CurrentOrderItem, DishCategory } from '../types';
import MenuItemCard from './MenuItemCard';

interface MenuDisplayProps {
  menuItems: Dish[];
  sideDishes: SideDish[];
  currentOrderItems: CurrentOrderItem[];
  onSelectDish: (dishId: string) => void; 
  onSideDishChange: (dishId: string, sideDishId: string) => void;
}

const MenuDisplay: React.FC<MenuDisplayProps> = ({
  menuItems,
  sideDishes,
  currentOrderItems,
  onSelectDish,
  onSideDishChange,
}) => {
  const getOrderItemForCategory = (category: DishCategory): CurrentOrderItem | undefined => {
    return currentOrderItems.find(item => {
      const dish = menuItems.find(d => d.id === item.dishId);
      return dish?.category === category;
    });
  };
  
  const displayCategories = [DishCategory.SALAD, DishCategory.HOT_DISH]; // Removed DishCategory.DESSERT


  return (
    <div className="space-y-10">
      {displayCategories.map(category => {
        const itemsInCategory = menuItems.filter(dish => dish.category === category);
        if (itemsInCategory.length === 0) return null; 

        const selectedItemInThisCategory = getOrderItemForCategory(category);

        return (
          <section key={category} aria-labelledby={`category-title-${category}`}>
            <h3 id={`category-title-${category}`} className="text-2xl font-semibold text-black mb-6 border-b-2 border-[#ff4139] pb-3">
              {category === DishCategory.HOT_DISH ? "Горячее и Супы" : category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {itemsInCategory.map(dish => (
                <MenuItemCard
                  key={dish.id}
                  dish={dish}
                  sideDishes={sideDishes}
                  isSelected={selectedItemInThisCategory?.dishId === dish.id}
                  selectedSideId={selectedItemInThisCategory?.dishId === dish.id ? selectedItemInThisCategory?.selectedSideId : undefined}
                  onSelectDish={onSelectDish}
                  onSideDishChange={onSideDishChange}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default MenuDisplay;