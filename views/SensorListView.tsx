
import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { SensorItem } from '../types';
import { Download, ChevronLeft, ChevronRight, CheckCircle, WifiOff, AlertTriangle, Search, Filter } from 'lucide-react';
import { useUI } from '../components/GlobalUI';
import { exportToExcel } from '../utils/excel';

export const SensorListView: React.FC = () => {
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [stationFilter, setStationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
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
    // 1. Search Filter
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesName = sensor.name.toLowerCase().includes(lowerSearch);
        const matchesCode = sensor.code.toLowerCase().includes(lowerSearch);
        if (!matchesName && !matchesCode) return false;
    }

    // 2. Station Filter
    if (stationFilter !== 'all' && sensor.station !== stationFilter) return false;

    // 3. Type Filter (Checkbox logic: if any checked, allow matching types. If none checked, allow all)
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Danh sách Cảm biến</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý và giám sát trạng thái các điểm đo</p>
           </div>
           <button 
             onClick={handleExport}
             className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
           >
             <Download size={18}/> Xuất danh sách
           </button>
        </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Header & Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
           <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
              
              {/* Search & Station Dropdown */}
              <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                 <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên, mã..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                 </div>

                 <select 
                    value={stationFilter}
                    onChange={(e) => setStationFilter(e.target.value)}
                    className="px-3 py-2 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_10px_center] bg-no-repeat"
                 >
                    <option value="all">Tất cả trạm đo</option>
                    <option value="Trạm an toàn đập">Trạm an toàn đập</option>
                    <option value="Trạm thủy văn">Trạm thủy văn</option>
                    <option value="Đập tràn">Đập tràn</option>
                    <option value="Nhà máy thủy điện">Nhà máy thủy điện</option>
                 </select>
              </div>

              {/* Type Checkboxes */}
              <div className="flex flex-wrap gap-3 items-center">
                 <div className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
                    <Filter size={12}/> Loại:
                 </div>
                 {typeFilters.map(tf => (
                    <label key={tf.id} className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                       <input 
                         type="checkbox" 
                         checked={tf.checked} 
                         onChange={() => handleTypeCheck(tf.id)}
                         className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                       />
                       <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{tf.label}</span>
                    </label>
                 ))}
              </div>
           </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                 <tr>
                    <th className="px-6 py-4 w-16 text-center">STT</th>
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
                    <tr key={sensor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                       <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                       </td>
                       <td className="px-6 py-4">
                          <span className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{sensor.name}</span>
                       </td>
                       <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                          {sensor.type}
                       </td>
                       <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                          {sensor.station}
                       </td>
                       <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-mono">{sensor.unit}</span>
                       </td>
                       <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {sensor.limitInfo}
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${
                                sensor.status === 'online' ? 'bg-slate-400' : 
                                sensor.status === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                             }`}></div>
                             <span className={`text-xs font-bold whitespace-nowrap ${
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
                       <td colSpan={7} className="px-6 py-16 text-center text-slate-400 italic">
                          <div className="flex flex-col items-center justify-center">
                             <Search size={32} className="mb-2 opacity-20"/>
                             <p>Không tìm thấy cảm biến nào phù hợp với bộ lọc</p>
                          </div>
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
                 <>Hiển thị <b>{(currentPage - 1) * itemsPerPage + 1}</b> - <b>{Math.min(currentPage * itemsPerPage, filteredSensors.length)}</b> trong tổng số <b>{filteredSensors.length}</b></>
              ) : (
                 <>0 kết quả</>
              )}
           </div>
           
           <div className="flex gap-2 items-center">
              <button 
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 <ChevronLeft size={16}/>
              </button>
              <span className="text-xs font-medium px-2">Trang {currentPage}</span>
              <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages || totalPages === 0}
                 className="p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 <ChevronRight size={16}/>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
