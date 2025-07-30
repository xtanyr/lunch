import React, { useState, useCallback } from 'react';
import { AggregatedOrderItem, DishCategory } from '../types';
import { MENU_ITEMS, SIDE_DISHES, aggregateOrdersByDate } from '../constants';
import { fetchOrdersForDateRange } from '../api';
import Button from './ui/Button';
import Input from './ui/Input';

declare var XLSX: any;

const formatDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}.${month}.${year}`;
    }
    return dateStr; 
  } catch (error) {
    return dateStr; 
  }
};

const formatDateForSheetName = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}.${month}`;
    }
    return dateStr; 
  } catch (error) {
    return dateStr; 
  }
};

const getAddressLabel = (address: string): string => {
  switch (address) {
    case 'office': return 'Офис';
    case 'kamergersky': return 'Камергерский';
    case 'gagarina': return 'Гагарина';
    case 'drujniy': return 'Дружный';
    default: return '';
  }
};

interface AggregatedOrderSummaryProps {
  aggregatedItems: AggregatedOrderItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  address?: string;
}

const AggregatedOrderSummary: React.FC<AggregatedOrderSummaryProps> = ({ 
  aggregatedItems, 
  selectedDate, 
  onDateChange, 
  address 
}) => {
  const [startDate, setStartDate] = useState<string>(selectedDate);
  const [endDate, setEndDate] = useState<string>(selectedDate);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const formattedSelectedDate = formatDateString(selectedDate);
  const displayCategories = [DishCategory.SALAD, DishCategory.HOT_DISH, DishCategory.SINGLE_DISH];

  const handleExportToExcel = useCallback(async () => {
    if (typeof XLSX === 'undefined') {
      console.error("XLSX library is not loaded.");
      alert("Ошибка: Библиотека для экспорта в Excel не загружена. Пожалуйста, проверьте ваше интернет-соединение или обратитесь к администратору.");
      return;
    }

    // Валидация дат
    if (!startDate || !endDate) {
      alert("Пожалуйста, выберите начальную и конечную даты.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert("Начальная дата не может быть позже конечной даты.");
      return;
    }

    // Ограничение на количество дней (например, максимум 31 день)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (daysDiff > 31) {
      alert("Максимальный диапазон дат - 31 день.");
      return;
    }

    setIsExporting(true);
    setExportProgress('Загружаем данные...');

    try {
      // Получаем данные за диапазон дат
      const ordersByDate = await fetchOrdersForDateRange(startDate, endDate, address);
      
      if (Object.keys(ordersByDate).length === 0) {
        alert("Нет данных для экспорта в выбранном диапазоне дат.");
        setIsExporting(false);
        return;
      }

      setExportProgress('Агрегируем данные...');
      
      // Агрегируем данные по датам
      const aggregatedByDate = aggregateOrdersByDate(ordersByDate, MENU_ITEMS, SIDE_DISHES);

      setExportProgress('Создаем Excel файл...');

      // Создаем рабочую книгу
      const workbook = XLSX.utils.book_new();
      const addressLabel = getAddressLabel(address || '');

      // Создаем лист для каждой даты
      Object.entries(aggregatedByDate).forEach(([date, items]) => {
        if (items.length === 0) return;

        const excelData: (string | number)[][] = [];
        excelData.push(["Категория", "Блюдо", "Гарнир", "Кол-во"]);

        displayCategories.forEach(category => {
          const itemsInCategory = items.filter((item: any) => item.category === category);
          if (itemsInCategory.length > 0) {
            itemsInCategory
              .sort((a: any, b: any) => a.dishName.localeCompare(b.dishName))
              .forEach((item: any) => {
                excelData.push([
                  item.category === DishCategory.HOT_DISH ? "Горячее и Супы" : item.category,
                  item.dishName,
                  item.selectedSideName || '---',
                  item.totalQuantity
                ]);
              });
          }
        });

        if (excelData.length > 1) {
          const worksheet = XLSX.utils.aoa_to_sheet(excelData);
          
          // Настраиваем ширину колонок
          const colWidths = [
            { wch: 25 }, 
            { wch: 45 }, 
            { wch: 30 }, 
            { wch: 10 }  
          ];
          worksheet["!cols"] = colWidths;

          // Создаем название листа в формате "Адрес ДД.ММ"
          const sheetDate = formatDateForSheetName(date);
          const sheetName = addressLabel ? `${addressLabel} ${sheetDate}` : sheetDate;
          
          // Ограничиваем длину названия листа (Excel ограничение - 31 символ)
          const truncatedSheetName = sheetName.length > 31 ? sheetName.substring(0, 31) : sheetName;
          
          XLSX.utils.book_append_sheet(workbook, worksheet, truncatedSheetName);
        }
      });

      setExportProgress('Сохраняем файл...');

      // Создаем имя файла
      const startDateFormatted = formatDateString(startDate).replace(/\./g, '-');
      const endDateFormatted = formatDateString(endDate).replace(/\./g, '-');
      const dateRange = startDate === endDate ? startDateFormatted : `${startDateFormatted}_${endDateFormatted}`;
      const exportFileName = `Сводный_заказ${addressLabel ? '_' + addressLabel : ''}_${dateRange}.xlsx`;
      
      XLSX.writeFile(workbook, exportFileName);
      
      setExportProgress('');
      alert(`Excel файл успешно создан! Файл содержит ${Object.keys(aggregatedByDate).length} листов.`);

    } catch (error) {
      console.error("Failed to export to Excel:", error);
      alert("Ошибка при создании Excel файла. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }, [startDate, endDate, address]);

  const handleSingleDateExport = () => {
    if (typeof XLSX === 'undefined') {
      console.error("XLSX library is not loaded.");
      alert("Ошибка: Библиотека для экспорта в Excel не загружена. Пожалуйста, проверьте ваше интернет-соединение или обратитесь к администратору.");
      return;
    }

    const excelData: (string | number)[][] = [];
    excelData.push(["Категория", "Блюдо", "Состав", "Гарнир", "Кол-во"]);

    displayCategories.forEach(category => {
      const itemsInCategory = aggregatedItems.filter(item => item.category === category);
      if (itemsInCategory.length > 0) {
        itemsInCategory
          .sort((a, b) => a.dishName.localeCompare(b.dishName))
          .forEach(item => {
            excelData.push([
              item.category === DishCategory.HOT_DISH ? "Горячее и Супы" : item.category,
              item.dishName,
              item.selectedSideName || '---',
              item.totalQuantity
            ]);
          });
      }
    });

    if (excelData.length <= 1) { 
        alert("Нет данных для экспорта на выбранную дату.");
        return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Сводный заказ");
 
    const colWidths = [
        { wch: 25 }, 
        { wch: 45 }, 
        { wch: 30 }, 
        { wch: 10 }  
    ];
    worksheet["!cols"] = colWidths;

    const addressLabel = getAddressLabel(address || '');
    const exportFileName = `Сводный_заказ${addressLabel ? '_' + addressLabel : ''}_${formattedSelectedDate.replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
  };

  return (
    <section className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-neutral-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-black mb-4">Экспорт в Excel</h3>
        
                 {/* Выбор диапазона дат */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
           <div>
             <Input
               id="start-date"
               type="date"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="w-full"
               label="Начальная дата"
             />
           </div>
           <div>
             <Input
               id="end-date"
               type="date"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="w-full"
               label="Конечная дата"
             />
           </div>
          <div className="flex items-end">
            <Button
              onClick={handleExportToExcel}
              variant="secondary"
              size="md"
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Экспорт...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Экспорт диапазона
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Прогресс экспорта */}
        {exportProgress && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">{exportProgress}</p>
          </div>
        )}

        {/* Экспорт текущей даты */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Экспорт для текущей даты ({formattedSelectedDate})
          </div>
                     <Button
             onClick={handleSingleDateExport}
             variant="ghost"
             size="sm"
             disabled={aggregatedItems.length === 0 || isExporting}
           >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Экспорт текущей даты
          </Button>
        </div>
      </div>

      {/* Таблица с данными */}
      {aggregatedItems.length === 0 ? (
        <p className="text-neutral-600">Нет данных для отображения сводного заказа на {formattedSelectedDate}.</p>
      ) : (
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto border border-neutral-200 rounded">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Блюдо</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Гарнир</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Категория</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">Кол-во</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {displayCategories.map(category => {
                  const itemsInCategory = aggregatedItems.filter(item => item.category === category);
                  if (itemsInCategory.length === 0) return null;

                  return (
                      <React.Fragment key={`category-group-${category}`}>
                          <tr>
                              <td colSpan={4} className="px-4 py-2.5 bg-neutral-100 text-black font-semibold text-sm border-b border-t border-neutral-300">
                                  {category === DishCategory.HOT_DISH ? "Горячее и Супы" : category}
                              </td>
                          </tr>
                          {itemsInCategory
                              .sort((a, b) => a.dishName.localeCompare(b.dishName)) 
                              .map(item => (
                              <tr key={`${item.dishId}-${item.selectedSideId || 'noside'}`} className="hover:bg-neutral-50 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-black">{item.dishName}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">{item.selectedSideName || '---'}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                                      {item.category === DishCategory.HOT_DISH ? "Горячее и Супы" : item.category}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700 text-right font-medium">{item.totalQuantity}</td>
                              </tr>
                          ))}
                      </React.Fragment>
                  );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AggregatedOrderSummary;