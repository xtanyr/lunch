
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

  return (
    <div className={`${cardBaseClasses} ${selectedCardClasses}`}>
      <div>
        <h4 className="text-lg font-semibold text-black mb-2">{dish.name}</h4>
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