import React from 'react';
import { Dish, SideDish, CurrentOrderItem, DishCategory } from '../types';
import Button from './ui/Button';
import Select from './ui/Select';
import { MENU_ITEMS } from '../constants'; // To find dish details

interface CategoryAsListProps {
  category: DishCategory;
  title: string;
  menuItems: Dish[]; // All menu items to be filtered
  sideDishes: SideDish[];
  currentOrderItems: CurrentOrderItem[];
  onSelectDish: (dishId: string) => void;
  onSideDishChange: (dishId: string, sideDishId: string) => void;
}

const CategoryAsList: React.FC<CategoryAsListProps> = ({
  category,
  title,
  menuItems,
  sideDishes,
  currentOrderItems,
  onSelectDish,
  onSideDishChange,
}) => {
  const itemsInCategory = menuItems.filter(dish => dish.category === category);

  if (itemsInCategory.length === 0) {
    return null;
  }

  const getSelectedItemInThisCategory = (): CurrentOrderItem | undefined => {
    return currentOrderItems.find(item => {
      const dishDetails = MENU_ITEMS.find(d => d.id === item.dishId);
      return dishDetails?.category === category;
    });
  };

  return (
    <section aria-labelledby={`category-title-${category.replace(/\s+/g, '-').toLowerCase()}`}>
      <h3 
        id={`category-title-${category.replace(/\s+/g, '-').toLowerCase()}`} 
        className="text-2xl font-semibold text-black mb-6 border-b-2 border-[#ff4139] pb-3"
      >
        {title}
      </h3>
      <div className="space-y-3">
        {itemsInCategory.map(dish => {
          const selectedItemDetails = getSelectedItemInThisCategory();
          const isSelected = selectedItemDetails?.dishId === dish.id;
          
          return (
            <div key={dish.id}> {/* Outer container for each item, block for vertical stacking */}
              <div 
                className={`
                  inline-block border rounded-md transition-all duration-150 ease-in-out
                  ${isSelected ? 'border-[#ff4139] bg-red-50' : 'border-neutral-300 bg-white'}
                `}
              >
                <div className="w-full">
                  <Button
                    variant={isSelected ? 'primary' : 'ghost'}
                    onClick={() => onSelectDish(dish.id)}
                    className={`text-left justify-start w-full`}
                    aria-pressed={isSelected}
                    aria-label={isSelected ? `Отменить выбор ${dish.name}` : `Выбрать ${dish.name}`}
                  >
                    {dish.name}
                  </Button>
                  {dish.composition && (
                    <div className="mt-1 ml-2 text-xs text-gray-600 leading-relaxed">
                      <span className="font-medium text-gray-700">Состав:</span> {dish.composition}
                    </div>
                  )}
                </div>
              </div>
              {isSelected && dish.availableSideIds && dish.availableSideIds.length > 0 && (
                <div className="mt-2"> {/* Side dish selector appears below the button */}
                  <Select
                    id={`side-list-${dish.id}`}
                    value={selectedItemDetails?.selectedSideId || ""}
                    onChange={(e) => onSideDishChange(dish.id, e.target.value)}
                    className="w-full max-w-xs"
                    aria-label={`Выберите гарнир для ${dish.name}`}
                  >
                    <option value="" disabled>Выберите гарнир...</option>
                    {dish.availableSideIds.map(sideId => {
                      const side = sideDishes.find(s => s.id === sideId);
                      return side ? <option key={side.id} value={side.id}>{side.name}</option> : null;
                    })}
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryAsList;