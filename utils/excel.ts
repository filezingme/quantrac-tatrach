import * as XLSX from 'xlsx';

/**
 * Exports an array of objects to an Excel file.
 * @param data Array of data objects
 * @param fileName Desired filename (without extension)
 * @param sheetName Desired sheet name
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
  if (!data || data.length === 0) {
    alert("Không có dữ liệu để xuất");
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert json to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Write file
  XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};