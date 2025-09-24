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
    case 'chv': return 'ЧВ';
    case 'festival': return 'Фестиваль';
    case 'atlantida': return 'Атлантида';
    case 'sfera': return 'Сфера';
    case 'inter': return 'Интер';
    case 'sibirskie_ogni': return 'Сибирские Огни';
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
  selectedDate}) => {
  const [startDate, setStartDate] = useState<string>(selectedDate);
  const [endDate, setEndDate] = useState<string>(selectedDate);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const formattedSelectedDate = formatDateString(selectedDate);
  const displayCategories = [DishCategory.SALAD, DishCategory.HOT_DISH, DishCategory.SINGLE_DISH];

  const fetchAllLocationsData = async (date: string) => {
    const locations = ['office', 'kamergersky', 'gagarina', 'drujniy', 'chv', 'festival', 'atlantida', 'sfera', 'inter', 'sibirskie_ogni'];
    const allOrders: { [key: string]: any[] } = {};
    
    for (const loc of locations) {
      try {
        const response = await fetchOrdersForDateRange(date, date, loc);
        if (response[date] && response[date].length > 0) {
          allOrders[loc] = response[date];
        }
      } catch (error) {
        console.error(`Error fetching data for ${loc}:`, error);
      }
    }
    
    return allOrders;
  };

  const processSingleDateExport = async (date: string, workbook: any) => {
    const allLocationsData = await fetchAllLocationsData(date);
    const sheetName = formatDateForSheetName(date);
    const excelData: (string | number)[][] = [];
    
    // Add title with date
    excelData.push([`Сводный заказ за ${sheetName}`]);
    excelData.push([]); // Empty row
    
    let grandTotal = 0;
    
    // Process each location
    for (const [location, orders] of Object.entries(allLocationsData)) {
      const locationName = getAddressLabel(location);
      if (!locationName) continue;
      
      // Add location header
      excelData.push([locationName]);
      excelData.push(["Блюдо", "Гарнир", "Кол-во", "Цена", "Сумма"]);
      
      // Aggregate orders for this location
      const aggregatedItems = aggregateOrdersByDate(
        { [date]: orders },
        MENU_ITEMS,
        SIDE_DISHES
      )[date] || [];
      
      let locationTotal = 0;
      
      // Add items by category
      displayCategories.forEach(category => {
        const itemsInCategory = aggregatedItems.filter(item => item.category === category);
        if (itemsInCategory.length === 0) return;
        
        itemsInCategory
          .sort((a, b) => a.dishName.localeCompare(b.dishName))
          .forEach(item => {
            const price = item.price || 0;
            const totalPrice = price * item.totalQuantity;
            locationTotal += totalPrice;
            
            excelData.push([
              item.dishName,
              item.selectedSideName || '---',
              item.totalQuantity,
              price,
              totalPrice
            ]);
          });
      });
      
      // Add location total
      excelData.push(["", "", "", "Итого:", locationTotal]);
      excelData.push([]); // Empty row
      grandTotal += locationTotal;
    }
    
    // Add grand total
    excelData.push(["", "", "", "ОБЩАЯ СУММА:", grandTotal]);
    
    // Create worksheet
    if (excelData.length > 3) { // More than just the title and empty rows
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 45 }, // Dish
        { wch: 30 }, // Side dish
        { wch: 10 }, // Quantity
        { wch: 12 }, // Price
        { wch: 15 }  // Total
      ];
      worksheet["!cols"] = colWidths;
      
      // Add to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      return true;
    }
    
    return false;
  };

  const handleExportToExcel = useCallback(async () => {
    if (typeof XLSX === 'undefined') {
      console.error("XLSX library is not loaded.");
      alert("Ошибка: Библиотека для экспорта в Excel не загружена. Пожалуйста, проверьте ваше интернет-соединение или обратитесь к администратору.");
      return;
    }

    // Validate dates
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

    // Limit date range to 31 days
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (daysDiff > 31) {
      alert("Максимальный диапазон дат - 31 день.");
      return;
    }

    setIsExporting(true);
    setExportProgress('Подготовка к экспорту...');

    try {
      const workbook = XLSX.utils.book_new();
      let sheetsCreated = 0;
      
      // Generate array of dates in the range
      const dates: string[] = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        dates.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Process each date
      for (const date of dates) {
        setExportProgress(`Обработка данных за ${formatDateString(date)}...`);
        const success = await processSingleDateExport(date, workbook);
        if (success) sheetsCreated++;
      }
      
      if (sheetsCreated === 0) {
        throw new Error("Нет данных для экспорта в выбранном диапазоне дат.");
      }
      
      setExportProgress('Сохранение файла...');
      
      // Generate filename
      const startDateFormatted = formatDateString(startDate).replace(/\./g, '-');
      const endDateFormatted = formatDateString(endDate).replace(/\./g, '-');
      const dateRange = startDate === endDate 
        ? startDateFormatted 
        : `${startDateFormatted}_${endDateFormatted}`;
      
      const exportFileName = `Сводный_заказ_${dateRange}.xlsx`;
      
      // Save file
      XLSX.writeFile(workbook, exportFileName);
      
      alert(`Excel файл успешно создан! Файл содержит ${sheetsCreated} листов.`);
      
    } catch (error) {
      console.error("Failed to export to Excel:", error);
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      alert(`Ошибка при создании Excel файла: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }, [startDate, endDate]);

  const handleSingleDateExport = async () => {
    if (typeof XLSX === 'undefined') {
      console.error("XLSX library is not loaded.");
      alert("Ошибка: Библиотека для экспорта в Excel не загружена. Пожалуйста, проверьте ваше интернет-соединение или обратитесь к администратору.");
      return;
    }

    setIsExporting(true);
    setExportProgress('Подготовка данных для экспорта...');

    try {
      const workbook = XLSX.utils.book_new();
      
      // Process the selected date
      const success = await processSingleDateExport(selectedDate, workbook);
      
      if (!success) {
        throw new Error("Нет данных для экспорта на выбранную дату.");
      }
      
      setExportProgress('Сохранение файла...');
      
      // Generate filename
      const exportFileName = `Сводный_заказ_${formatDateString(selectedDate).replace(/\./g, '-')}.xlsx`;
      
      // Save file
      XLSX.writeFile(workbook, exportFileName);
      
      alert('Excel файл успешно создан!');
      
    } catch (error) {
      console.error("Failed to export to Excel:", error);
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      alert(`Ошибка при создании Excel файла: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
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