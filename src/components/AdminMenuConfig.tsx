import React, { useState } from 'react';
import { Dish, MenuConfig, DishCategory } from '../types';
import Button from './ui/Button';
import ConfirmModal from './ui/ConfirmModal';

interface AdminMenuConfigProps {
  menuConfig: MenuConfig;
  menuItems: Dish[];
  onMenuConfigUpdate: (config: MenuConfig) => void;
}

const AdminMenuConfig: React.FC<AdminMenuConfigProps> = ({
  menuConfig,
  menuItems,
  onMenuConfigUpdate
}) => {
  const [editingConfig, setEditingConfig] = useState<MenuConfig>({ ...menuConfig });
  const [showResetModal, setShowResetModal] = useState(false);

  const getActiveMenuItems = (category: DishCategory) => {
    return menuItems.filter(item => item.category === category && item.isActive !== false);
  };

  const handleCategoryUpdate = (categoryId: string, dishIds: string[]) => {
    const updatedCategories = editingConfig.categories.map(cat =>
      cat.id === categoryId ? { ...cat, dishIds } : cat
    );
    setEditingConfig({ ...editingConfig, categories: updatedCategories });
  };

  const handleSave = () => {
    const updatedConfig = {
      ...editingConfig,
      lastUpdated: new Date().toISOString()
    };
    onMenuConfigUpdate(updatedConfig);
  };

  const handleReset = () => {
    setEditingConfig({ ...menuConfig });
    setShowResetModal(false);
  };

  const toggleDishInCategory = (categoryId: string, dishId: string) => {
    const category = editingConfig.categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const isSelected = category.dishIds.includes(dishId);
    const newDishIds = isSelected
      ? category.dishIds.filter(id => id !== dishId)
      : [...category.dishIds, dishId];

    handleCategoryUpdate(categoryId, newDishIds);
  };

  const selectAllInCategory = (categoryId: string, dishIds: string[]) => {
    handleCategoryUpdate(categoryId, dishIds);
  };

  const clearCategory = (categoryId: string) => {
    handleCategoryUpdate(categoryId, []);
  };

  const getCategoryName = (categoryId: string) => {
    switch (categoryId) {
      case DishCategory.SALAD:
        return 'Салаты (Первое блюдо)';
      case DishCategory.HOT_DISH:
        return 'Горячее (Второе блюдо)';
      case DishCategory.SINGLE_DISH:
        return 'Одно блюдо';
      default:
        return categoryId;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Конфигурация меню</h2>
          <p className="text-sm text-gray-600 mt-1">
            Настройте, какие блюда будут доступны в каждой категории
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowResetModal(true)} variant="secondary">
            Сбросить
          </Button>
          <Button onClick={handleSave} variant="primary">
            Сохранить изменения
          </Button>
        </div>
      </div>

      {/* Configuration for each category */}
      {editingConfig.categories.map(category => {
        const availableItems = getActiveMenuItems(category.id as DishCategory);
        const selectedItems = availableItems.filter(item => 
          category.dishIds.includes(item.id)
        );

        return (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {getCategoryName(category.id)}
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => selectAllInCategory(category.id, availableItems.map(item => item.id))}
                  variant="ghost"
                  size="sm"
                  disabled={availableItems.length === 0}
                >
                  Выбрать все
                </Button>
                <Button
                  onClick={() => clearCategory(category.id)}
                  variant="ghost"
                  size="sm"
                >
                  Очистить
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600">
                Выбрано: {selectedItems.length} из {availableItems.length} доступных блюд
              </div>
            </div>

            {availableItems.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Нет активных блюд в этой категории
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableItems.map(item => {
                  const isSelected = category.dishIds.includes(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#ff4139] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleDishInCategory(category.id, item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleDishInCategory(category.id, item.id)}
                              className="rounded border-gray-300 text-[#ff4139] focus:ring-[#ff4139] mr-2"
                            />
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </div>
                          {item.composition && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.composition}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {item.price && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.price} ₽
                              </span>
                            )}
                            {item.garnishGrams && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.garnishGrams} г
                              </span>
                            )}
                            {item.sideDishGrams && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.sideDishGrams} г
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        open={showResetModal}
        title="Сбросить изменения"
        message="Вы уверены, что хотите сбросить все изменения? Все несохраненные изменения будут потеряны."
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
        confirmText="Сбросить"
        cancelText="Отмена"
      />
    </div>
  );
};

export default AdminMenuConfig;
