import React, { useState } from 'react';
import { Dish, SideDish, DishCategory } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import ConfirmModal from './ui/ConfirmModal';

interface AdminMenuManagerProps {
  menuItems: Dish[];
  sideDishes: SideDish[];
  onMenuItemsUpdate: (items: Dish[]) => void;
}

const AdminMenuManager: React.FC<AdminMenuManagerProps> = ({
  menuItems,
  sideDishes,
  onMenuItemsUpdate
}) => {
  const [editingItem, setEditingItem] = useState<Dish | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ show: boolean; item: Dish | null }>({ show: false, item: null });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.composition?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEdit = (item: Dish) => {
    setEditingItem({ ...item });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    setEditingItem({
      id: '',
      name: '',
      category: DishCategory.SALAD,
      price: 0,
      isActive: true,
      composition: '',
      availableSideIds: [],
      protein: undefined,
      carbs: undefined,
      fats: undefined,
      garnishGrams: undefined,
      sideDishGrams: undefined
    });
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!editingItem) return;

    let updatedItems: Dish[];
    
    if (showAddForm) {
      // Add new item
      const newId = `dish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      updatedItems = [...menuItems, { ...editingItem, id: newId }];
    } else {
      // Update existing item
      updatedItems = menuItems.map(item => 
        item.id === editingItem.id ? editingItem : item
      );
    }

    onMenuItemsUpdate(updatedItems);
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleDelete = (item: Dish) => {
    setShowDeleteModal({ show: true, item });
  };

  const confirmDelete = () => {
    if (!showDeleteModal.item) return;

    const updatedItems = menuItems.filter(item => item.id !== showDeleteModal.item!.id);
    onMenuItemsUpdate(updatedItems);
    setShowDeleteModal({ show: false, item: null });
  };

  const handleInputChange = (field: keyof Dish, value: any) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [field]: value });
  };

  const handleSideDishToggle = (sideId: string) => {
    if (!editingItem) return;
    
    const currentSides = editingItem.availableSideIds || [];
    const newSides = currentSides.includes(sideId)
      ? currentSides.filter(id => id !== sideId)
      : [...currentSides, sideId];
    
    setEditingItem({ ...editingItem, availableSideIds: newSides });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Управление блюдами</h2>
        <Button onClick={handleAdd} variant="primary">
          Добавить блюдо
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            id="search"
            placeholder="Поиск по названию или составу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            id="category-filter"
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { id: 'all', label: 'Все категории' },
              { id: DishCategory.SALAD, label: 'Салаты' },
              { id: DishCategory.HOT_DISH, label: 'Горячее' },
              { id: DishCategory.SINGLE_DISH, label: 'Одно блюдо' }
            ]}
          />
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {showAddForm ? 'Добавить блюдо' : 'Редактировать блюдо'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="name"
              label="Название блюда"
              value={editingItem.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            
            <Select
              id="category"
              label="Категория"
              value={editingItem.category}
              onChange={(value) => handleInputChange('category', value as DishCategory)}
              options={[
                { id: DishCategory.SALAD, label: 'Салаты' },
                { id: DishCategory.HOT_DISH, label: 'Горячее' },
                { id: DishCategory.SINGLE_DISH, label: 'Одно блюдо' }
              ]}
            />
            
            <Input
              id="price"
              label="Цена (руб.)"
              type="number"
              value={editingItem.price || ''}
              onChange={(e) => handleInputChange('price', e.target.value ? Number(e.target.value) : undefined)}
            />
            
            <Input
              id="garnishGrams"
              label="Вес основного блюда (г)"
              type="number"
              value={editingItem.garnishGrams || ''}
              onChange={(e) => handleInputChange('garnishGrams', e.target.value ? Number(e.target.value) : undefined)}
            />

            <Input
              id="sideDishGrams"
              label="Вес гарнира (г)"
              type="number"
              value={editingItem.sideDishGrams || ''}
              onChange={(e) => handleInputChange('sideDishGrams', e.target.value ? Number(e.target.value) : undefined)}
            />

            <Input
              id="protein"
              label="Белки (г)"
              type="number"
              value={editingItem.protein ?? ''}
              onChange={(e) => handleInputChange('protein', e.target.value === '' ? undefined : Number(e.target.value))}
            />

            <Input
              id="carbs"
              label="Углеводы (г)"
              type="number"
              value={editingItem.carbs ?? ''}
              onChange={(e) => handleInputChange('carbs', e.target.value === '' ? undefined : Number(e.target.value))}
            />

            <Input
              id="fats"
              label="Жиры (г)"
              type="number"
              value={editingItem.fats ?? ''}
              onChange={(e) => handleInputChange('fats', e.target.value === '' ? undefined : Number(e.target.value))}
            />
            
            <div className="md:col-span-2">
              <Input
                id="composition"
                label="Состав"
                value={editingItem.composition || ''}
                onChange={(e) => handleInputChange('composition', e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Доступные гарниры
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sideDishes.map(side => (
                  <label key={side.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingItem.availableSideIds?.includes(side.id) || false}
                      onChange={() => handleSideDishToggle(side.id)}
                      className="rounded border-gray-300 text-[#ff4139] focus:ring-[#ff4139]"
                    />
                    <span className="ml-2 text-sm text-gray-700">{side.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingItem.isActive !== false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-[#ff4139] focus:ring-[#ff4139]"
                />
                <span className="ml-2 text-sm text-gray-700">Активно (доступно для заказа)</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} variant="primary">
              {showAddForm ? 'Добавить' : 'Сохранить'}
            </Button>
            <Button 
              onClick={() => {
                setEditingItem(null);
                setShowAddForm(false);
              }} 
              variant="secondary"
            >
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    {item.composition && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{item.composition}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.price ? `${item.price} ₽` : '—'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.isActive !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isActive !== false ? 'Активно' : 'Неактивно'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-[#ff4139] hover:text-[#e0352f]"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal.show}
        title="Подтвердите удаление"
        message={`Вы уверены, что хотите удалить блюдо "${showDeleteModal.item?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal({ show: false, item: null })}
        confirmText="Удалить"
        cancelText="Отмена"
      />
    </div>
  );
};

export default AdminMenuManager;
