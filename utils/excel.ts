import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, columnOrder?: string[]) => {
  // If columnOrder is provided, use it to order columns. 
  // This ensures columns appear exactly in the order specified, regardless of object key order.
  const options = columnOrder ? { header: columnOrder } : undefined;
  
  const worksheet = XLSX.utils.json_to_sheet(data, options);
  
  // Set simple column width (optional enhancement for readability)
  if (data.length > 0) {
     const wscols = Object.keys(data[0]).map(() => ({ wch: 20 }));
     worksheet['!cols'] = wscols;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  // Generate filename with timestamp
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  XLSX.writeFile(workbook, `${fileName}_${dateStr}.xlsx`);
};