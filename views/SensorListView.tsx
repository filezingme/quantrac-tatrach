
import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { SensorItem } from '../types';
import { Download, ChevronLeft, ChevronRight, CheckCircle, WifiOff, AlertTriangle } from 'lucide-react';
import { useUI } from '../components/GlobalUI';
import { exportToExcel } from '../utils/excel';

export const SensorListView: React.FC = () => {
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [stationFilter, setStationFilter] = useState('all');
  
  // Type Filters (Checkbox logic)
  const [typeFilters, setTypeFilters] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: 'tham', label: 'Đo áp lực thấm', checked: false },
    { id: 'kheho', label: 'Đo biến dạng khe hở', checked: false },
    { id: 'mua', label: 'Đo mưa', checked: false },
    { id: 'mucnuoc', label: 'Đo mực nước', checked: false },
    { id: 'nhietdo', label: 'Đo nhiệt độ bê tông', checked: false },
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const ui = useUI();

  useEffect(() => {
    setSensors(db.sensors.get());
  }, []);

  // Handler for checkboxes
  const handleTypeCheck = (id: string) => {
    setTypeFilters(prev => prev.map(f => f.id === id ? { ...f, checked: !f.checked } : f));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  // Filter Logic
  const filteredSensors = sensors.filter(sensor => {
    // 1. Station Filter
    if (stationFilter !== 'all' && sensor.station !== stationFilter) return false;

    // 2. Type Filter (Checkbox logic: if any checked, allow matching types. If none checked, allow all)
    const activeTypeFilters = typeFilters.filter(f => f.checked);
    if (activeTypeFilters.length > 0) {
       const match = activeTypeFilters.some(f => sensor.type.toLowerCase().includes(f.label.toLowerCase()));
       if (!match) return false;
    }

    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredSensors.length / itemsPerPage);
  const paginatedSensors = filteredSensors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const data = filteredSensors.map((s, index) => ({
      'STT': index + 1,
      'Tên Cảm biến': s.name,
      'Loại': s.type,
      'Trạm đo': s.station,
      'Đơn vị': s.unit,
      'Giới hạn': s.limitInfo,
      'Trạng thái': s.status === 'online' ? 'Kết nối' : s.status === 'offline' ? 'Mất kết nối' : 'Cảnh báo'
    }));
    exportToExcel(data, 'Danh_sach_cam_bien');
    ui.showToast('success', 'Đã xuất file Excel thành công');
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Header & Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
           {/* Row 1: Filter Controls */}
           <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
                 
                 {/* Station Dropdown */}
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Trạm đo</span>
                    <select 
                      value={stationFilter}
                      onChange={(e) => setStationFilter(e.target.value)}
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    >
                       <option value="all">Tất cả</option>
                       <option value="Trạm an toàn đập">Trạm an toàn đập</option>
                       <option value="Trạm thủy văn">Trạm thủy văn</option>
                       <option value="Đập tràn">Đập tràn</option>
                       <option value="Nhà máy thủy điện">Nhà máy thủy điện</option>
                    </select>
                 </div>

                 {/* Type Checkboxes */}
                 <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap ml-0 md:ml-4">Loại cảm biến</span>
                    {typeFilters.map(tf => (
                       <label key={tf.id} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={tf.checked} 
                            onChange={() => handleTypeCheck(tf.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{tf.label}</span>
                       </label>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Title Row Inside Panel */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 dark:text-white text-lg">Danh sách cảm biến</h3>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                 <tr>
                    <th className="px-6 py-4 w-16">STT</th>
                    <th className="px-6 py-4">Tên cảm biến</th>
                    <th className="px-6 py-4">Loại cảm biến</th>
                    <th className="px-6 py-4">Trạm đo</th>
                    <th className="px-6 py-4">Đơn vị đo</th>
                    <th className="px-6 py-4">Giới hạn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                 {paginatedSensors.map((sensor, index) => (
                    <tr key={sensor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                       <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                       </td>
                       <td className="px-6 py-4">
                          <span className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{sensor.name}</span>
                       </td>
                       <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {sensor.type}
                       </td>
                       <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {sensor.station}
                       </td>
                       <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {sensor.unit}
                       </td>
                       <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {sensor.limitInfo}
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className={`w-2.5 h-2.5 rounded-full ${
                                sensor.status === 'online' ? 'bg-slate-400' : 
                                sensor.status === 'warning' ? 'bg-amber-500' : 'bg-slate-300'
                             }`}></div>
                             <span className={`text-xs font-medium ${
                                sensor.status === 'online' ? 'text-slate-500' : 
                                sensor.status === 'warning' ? 'text-amber-600' : 'text-slate-400'
                             }`}>
                                {sensor.status === 'online' ? 'Kết nối' : 
                                 sensor.status === 'warning' ? 'Cảnh báo' : 'Mất kết nối'}
                             </span>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {paginatedSensors.length === 0 && (
                    <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                          Không tìm thấy dữ liệu phù hợp
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
           <div className="text-xs text-slate-500 dark:text-slate-400">
              {filteredSensors.length > 0 ? (
                 <>1-{Math.min(itemsPerPage, filteredSensors.length)} of {filteredSensors.length}</>
              ) : (
                 <>0 of 0</>
              )}
           </div>
           
           <div className="flex gap-4 items-center">
              {/* Pagination Controls */}
              <div className="flex gap-1">
                 <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                    <ChevronLeft size={16}/>
                 </button>
                 <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                 >
                    <ChevronRight size={16}/>
                 </button>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
              
              <div className="text-xs text-slate-500 dark:text-slate-400">
                 Tổng: {filteredSensors.length}
              </div>

              {/* Export Button moved to bottom right as per typical table footer or kept top if preferred, but user screenshot implies simple footer. Added button here for utility */}
              <button 
                 onClick={handleExport}
                 className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 rounded text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm ml-2"
              >
                 <Download size={14}/> Xuất Excel
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
