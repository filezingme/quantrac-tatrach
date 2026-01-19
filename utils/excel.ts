import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  if (!data || data.length === 0) {
    alert("Không có dữ liệu để xuất");
    return;
  }

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate file name with timestamp
  const date = new Date().toISOString().slice(0, 10);
  const fullFileName = `${fileName}_${date}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, fullFileName);
};