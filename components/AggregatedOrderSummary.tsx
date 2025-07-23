import React from 'react';
import { AggregatedOrderItem, DishCategory } from '../types';
import Input from './ui/Input'; 
import Button from './ui/Button'; 

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

interface AggregatedOrderSummaryProps {
  aggregatedItems: AggregatedOrderItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  address?: string; // новый проп
}

const AggregatedOrderSummary: React.FC<AggregatedOrderSummaryProps> = ({ aggregatedItems, selectedDate, onDateChange, address }) => {
  const formattedSelectedDate = formatDateString(selectedDate);
  // const titleId = "aggregated-summary-title";

  const displayCategories = [DishCategory.SALAD, DishCategory.HOT_DISH, DishCategory.SINGLE_DISH]; // Added SINGLE_DISH

  const handleExportToExcel = () => {
    if (typeof XLSX === 'undefined') {
      console.error("XLSX library is not loaded.");
      alert("Ошибка: Библиотека для экспорта в Excel не загружена. Пожалуйста, проверьте ваше интернет-соединение или обратитесь к администратору.");
      return;
    }

    const excelData: (string | number)[][] = [];
    excelData.push(["Категория", "Блюдо", "Гарнир", "Кол-во"]);

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

    let addressLabel = '';
    if (address === 'office') addressLabel = 'Офис';
    else if (address === 'kamergersky') addressLabel = 'Камергерский';
    else if (address === 'gagarina') addressLabel = 'Гагарина';
    else if (address === 'drujniy') addressLabel = 'Дружный';
    const exportFileName = `Сводный_заказ${addressLabel ? '_' + addressLabel : ''}_${formattedSelectedDate.replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
  };

  return (
    <section className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-neutral-200">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-6 gap-4">
        <Button
          onClick={handleExportToExcel}
          variant="secondary"
          size="md"
          disabled={aggregatedItems.length === 0}
          aria-label="Экспортировать сводный заказ в Excel"
          className="mt-4 sm:mt-0 self-start sm:self-auto" 
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 hero-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Экспорт в Excel
        </Button>
      </div>
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