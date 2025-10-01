
import React from 'react';
import { Dish, SideDish } from '../types';
import Button from './ui/Button';
import Select from './ui/Select';

interface MenuItemCardProps {
  dish: Dish;
  sideDishes: SideDish[];
  isSelected: boolean; 
  selectedSideId?: string; 
  onSelectDish: (dishId: string) => void; 
  onSideDishChange: (dishId: string, sideDishId: string) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  dish,
  sideDishes,
  isSelected,
  selectedSideId,
  onSelectDish,
  onSideDishChange,
}) => {
  const handleSelectClick = () => {
    onSelectDish(dish.id);
  };

  const handleSideChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSideDishChange(dish.id, e.target.value);
  };

  const cardBaseClasses = "bg-white p-5 rounded shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between border border-neutral-200";
  const selectedCardClasses = isSelected ? "ring-2 ring-[#ff4139] shadow-xl" : "border-transparent";
  // Debug log to check the dish props
  console.log('Dish:', dish.id, {
    protein: dish.protein,
    carbs: dish.carbs,
    fats: dish.fats,
    weight: dish.weight
  });

  return (
    <div className={`${cardBaseClasses} ${selectedCardClasses}`}>
      <div>
        <h4 className="text-lg font-semibold text-black mb-2">{dish.name}</h4>
        {dish.composition && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            <span className="font-medium text-gray-700">Состав:</span> {dish.composition}
          </p>
        )}
        
        {(dish.protein !== undefined || dish.carbs !== undefined || dish.fats !== undefined || dish.weight !== undefined) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Пищевая ценность на порцию:</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {dish.protein !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Белки:</span>
                  <span className="font-medium">{dish.protein} г</span>
                </div>
              )}
              {dish.carbs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Углеводы:</span>
                  <span className="font-medium">{dish.carbs} г</span>
                </div>
              )}
              {dish.fats !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Жиры:</span>
                  <span className="font-medium">{dish.fats} г</span>
                </div>
              )}
              {dish.weight !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Вес:</span>
                  <span className="font-medium">{dish.weight} г</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isSelected && dish.availableSideIds && dish.availableSideIds.length > 0 && (
        <Select
          id={`side-${dish.id}`}
          value={selectedSideId || ""}
          onChange={handleSideChange}
          className="my-3"
          aria-label={`Выберите гарнир для ${dish.name}`}
        >
          <option value="" disabled>Выберите гарнир...</option>
          {dish.availableSideIds.map(sideId => {
            const side = sideDishes.find(s => s.id === sideId);
            return side ? <option key={side.id} value={side.id}>{side.name}</option> : null;
          })}
        </Select>
      )}

      <div className="mt-auto pt-4">
        <Button 
          onClick={handleSelectClick} 
          size="md" 
          variant={isSelected ? "secondary" : "primary"}
          className="w-full"
          aria-label={isSelected ? `Отменить выбор ${dish.name}` : `Выбрать ${dish.name}`}
        >
          {isSelected ? 'Отменить выбор' : 'Выбрать'}
        </Button>
      </div>
    </div>
  );
};

export default MenuItemCard;