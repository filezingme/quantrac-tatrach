
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../utils/db';
import { SensorItem } from '../types';
import { 
  Download, ChevronLeft, ChevronRight, Filter, Search, Activity, Wifi, 
  AlertTriangle, RefreshCw, BarChart2, Maximize2, Minimize2, X, 
  Calendar, Table as TableIcon, Check, ChevronDown, CloudRain, Thermometer, Gauge, MapPin, Plus, GitMerge
} from 'lucide-react';
import { useUI } from '../components/GlobalUI';
import { exportToExcel } from '../utils/excel';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';

// --- MOCK HISTORY GENERATOR ---
// Updated to accept a specific seed/offset for consistent random data when comparing
const generateSensorHistory = (sensor: SensorItem, days: number = 7, seedOffset: number = 0) => {
  const data = [];
  const now = new Date();
  
  // Determine base characteristics based on type
  let baseValue = sensor.lastValue || 0;
  let volatility = 0.5; // How much it changes
  let isRain = sensor.type.toLowerCase().includes('mưa');
  
  if (sensor.type.toLowerCase().includes('áp lực')) { baseValue = 1200; volatility = 20; }
  else if (sensor.type.toLowerCase().includes('nhiệt độ')) { baseValue = 28; volatility = 2; }
  else if (isRain) { baseValue = 0; volatility = 0; }

  // Adjust base slightly for comparison realism if it's a simulated peer
  baseValue += seedOffset * (volatility || 5);

  for (let i = days * 24; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timeLabel = `${date.getDate()}/${date.getMonth()+1} ${date.getHours()}:00`;
    
    let val = 0;
    if (isRain) {
       // Random rain events
       val = Math.random() > 0.8 ? Math.random() * 20 : 0;
    } else {
       // Smooth trend with noise
       const trend = Math.sin((i + seedOffset * 10) / 10) * volatility;
       const noise = (Math.random() - 0.5) * (volatility / 2);
       val = baseValue + trend + noise;
    }

    data.push({
      time: date.toISOString(),
      label: timeLabel,
      value: Math.max(0, parseFloat(val.toFixed(2)))
    });
  }
  return data;
};

// Colors for comparison lines
const COMPARE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export const SensorListView: React.FC = () => {
  const [sensors, setSensors] = useState<SensorItem[]>([]);
  const [stationFilter, setStationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal State
  const [selectedSensor, setSelectedSensor] = useState<SensorItem | null>(null);
  const [compareList, setCompareList] = useState<SensorItem[]>([]); // List of additional sensors to compare
  const [chartData, setChartData] = useState<any[]>([]); // Unified chart data
  
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      to: new Date().toISOString().slice(0, 16)
  });

  // Quick Switch / Add Compare Dropdown State
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);
  const [quickSwitchSearch, setQuickSwitchSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [typeFilters, setTypeFilters] = useState<{ id: string; label: string; checked: boolean }[]>([
    { id: 'tham', label: 'Đo áp lực thấm', checked: false },
    { id: 'kheho', label: 'Đo biến dạng khe hở', checked: false },
    { id: 'mua', label: 'Đo mưa', checked: false },
    { id: 'mucnuoc', label: 'Đo mực nước', checked: false },
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const ui = useUI();

  useEffect(() => {
    setSensors(db.sensors.get());
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsQuickSwitchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- CHART DATA MERGING LOGIC ---
  useEffect(() => {
    if (!selectedSensor) return;

    // 1. Generate data for main sensor
    const mainData = generateSensorHistory(selectedSensor);
    
    // 2. Generate data for compared sensors and merge
    // Structure: [{ label: '10:00', value_main: 10, value_compare1: 12, ... }]
    const mergedData = mainData.map((point, idx) => {
        const row: any = {
            time: point.time,
            label: point.label,
            [selectedSensor.id]: point.value // Dynamic key for main sensor
        };

        compareList.forEach((compSensor, cIdx) => {
            // Generate mock history with offset based on index to make them look distinct
            const compHist = generateSensorHistory(compSensor, 7, cIdx + 1); 
            // Safety check for index existence
            if (compHist[idx]) {
                row[compSensor.id] = compHist[idx].value;
            }
        });

        return row;
    });

    setChartData(mergedData);

  }, [selectedSensor, compareList]);


  const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => {
          setSensors(db.sensors.get());
          setIsRefreshing(false);
          ui.showToast('success', 'Đã cập nhật dữ liệu cảm biến mới nhất');
      }, 800);
  };

  const handleTypeCheck = (id: string) => {
    setTypeFilters(prev => prev.map(f => f.id === id ? { ...f, checked: !f.checked } : f));
    setCurrentPage(1);
  };

  // Filter Logic
  const filteredSensors = useMemo(() => {
    return sensors.filter(sensor => {
      if (searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          const matchesName = sensor.name.toLowerCase().includes(lowerSearch);
          const matchesCode = sensor.code.toLowerCase().includes(lowerSearch);
          if (!matchesName && !matchesCode) return false;
      }
      if (stationFilter !== 'all' && sensor.station !== stationFilter) return false;

      const activeTypeFilters = typeFilters.filter(f => f.checked);
      if (activeTypeFilters.length > 0) {
         const match = activeTypeFilters.some(f => sensor.type.toLowerCase().includes(f.label.toLowerCase()));
         if (!match) return false;
      }
      return true;
    });
  }, [sensors, searchTerm, stationFilter, typeFilters]);

  // Quick Switch / Comparison Filter Logic
  const comparisonCandidates = useMemo(() => {
      if (!selectedSensor) return [];
      
      // Only show sensors with SAME UNIT and NOT current selected
      let candidates = sensors.filter(s => s.unit === selectedSensor.unit && s.id !== selectedSensor.id);

      if (quickSwitchSearch.trim()) {
          const lower = quickSwitchSearch.toLowerCase();
          candidates = candidates.filter(s => 
              s.name.toLowerCase().includes(lower) || 
              s.code.toLowerCase().includes(lower)
          );
      }
      return candidates;
  }, [sensors, selectedSensor, quickSwitchSearch]);

  // --- MODAL HANDLERS ---

  const handleOpenHistory = (sensor: SensorItem) => {
      setSelectedSensor(sensor);
      setCompareList([]); // Reset comparison when opening new
      setModalTab('chart');
      setIsFullScreen(false);
      setShowFilters(false);
      setIsQuickSwitchOpen(false);
      setQuickSwitchSearch('');
  };

  const handleCloseModal = () => {
      setSelectedSensor(null);
      setCompareList([]);
  };

  // Switch the main view to another sensor
  const handleQuickSwitch = (sensor: SensorItem) => {
      setSelectedSensor(sensor);
      setCompareList([]); // Reset compare on switch
      setIsQuickSwitchOpen(false);
  };

  // Add a sensor to the comparison list
  const handleAddToCompare = (sensor: SensorItem, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent switching
      if (compareList.find(c => c.id === sensor.id)) return; // Already added
      if (compareList.length >= 4) {
          ui.showToast('warning', 'Chỉ có thể so sánh tối đa 5 cảm biến cùng lúc');
          return;
      }
      setCompareList(prev => [...prev, sensor]);
      // Optional: Don't close dropdown to allow adding more? 
      // Let's keep it open for UX convenience
  };

  const handleRemoveCompare = (sensorId: string) => {
      setCompareList(prev => prev.filter(c => c.id !== sensorId));
  };

  const handleExportHistory = () => {
      if (!selectedSensor) return;
      const exportData = chartData.map(d => {
          const row: any = { 'Thời gian': d.label };
          // Main sensor
          row[`${selectedSensor.name} (${selectedSensor.unit})`] = d[selectedSensor.id];
          // Compared sensors
          compareList.forEach(c => {
              row[`${c.name} (${c.unit})`] = d[c.id];
          });
          return row;
      });
      exportToExcel(exportData, `Du_lieu_so_sanh_${selectedSensor.code}`);
  };

  // --- RENDER HELPERS ---

  const totalPages = Math.ceil(filteredSensors.length / itemsPerPage);
  const paginatedSensors = filteredSensors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportList = () => {
    const data = filteredSensors.map((s, index) => ({
      'STT': index + 1,
      'Tên Cảm biến': s.name,
      'Loại': s.type,
      'Giá trị': s.lastValue || 0,
      'Đơn vị': s.unit,
      'Cập nhật': s.lastUpdated || '',
      'Trạng thái': s.status === 'online' ? 'Kết nối' : s.status === 'offline' ? 'Mất kết nối' : 'Cảnh báo'
    }));
    exportToExcel(data, 'Danh_sach_cam_bien');
    ui.showToast('success', 'Đã xuất file Excel thành công');
  };

  const totalSensors = sensors.length;
  const onlineSensors = sensors.filter(s => s.status === 'online').length;
  const warningSensors = sensors.filter(s => s.status === 'warning' || s.status === 'offline').length;

  const StatusBadge = ({ status }: { status: string }) => {
      if (status === 'online') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-900/30">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online
            </span>
          );
      }
      if (status === 'warning') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-100 dark:border-amber-900/30">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                Cảnh báo
            </span>
          );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-600">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            Offline
        </span>
      );
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Danh sách Cảm biến</h2>
               <p className="text-sm text-slate-500 dark:text-slate-400">Giám sát trạng thái và dữ liệu thời gian thực</p>
           </div>
           <div className="flex gap-2">
             <button 
                onClick={handleRefresh}
                className={`p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Làm mới dữ liệu"
             >
                <RefreshCw size={20}/>
             </button>
             <button 
                onClick={handleExportList}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
             >
                <Download size={18}/> Xuất danh sách
             </button>
           </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Activity size={24}/>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tổng thiết bị</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalSensors}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <Wifi size={24}/>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Hoạt động tốt</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{onlineSensors}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={24}/>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cần kiểm tra</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{warningSensors}</p>
                </div>
            </div>
        </div>

        {/* Main List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            
            {/* Header & Filters */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
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

                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
                            <Filter size={12}/> Loại:
                        </div>
                        {typeFilters.map(tf => (
                            <label key={tf.id} className={`flex items-center gap-1.5 cursor-pointer select-none px-3 py-1.5 rounded-lg border transition-colors ${tf.checked ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                            <input 
                                type="checkbox" 
                                checked={tf.checked} 
                                onChange={() => handleTypeCheck(tf.id)}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`text-xs font-medium ${tf.checked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>{tf.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- DESKTOP TABLE VIEW --- */}
            <div className="hidden md:block flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">STT</th>
                            <th className="px-6 py-4">Tên cảm biến</th>
                            <th className="px-6 py-4">Loại cảm biến</th>
                            <th className="px-6 py-4 text-right">Giá trị đo</th>
                            <th className="px-6 py-4 text-center">Trạng thái</th>
                            <th className="px-6 py-4">Cập nhật</th>
                            <th className="px-6 py-4 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {paginatedSensors.map((sensor, index) => (
                            <tr key={sensor.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </td>
                                <td className="px-6 py-4">
                                    <span 
                                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block"
                                        onClick={() => handleOpenHistory(sensor)}
                                    >
                                        {sensor.name}
                                    </span>
                                    <span className="text-xs text-slate-400">{sensor.station}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{sensor.type}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {sensor.status === 'offline' ? (
                                        <span className="text-slate-400 italic">--</span>
                                    ) : (
                                        <span className="font-mono font-bold text-slate-800 dark:text-white">
                                            {sensor.lastValue} <span className="text-xs font-normal text-slate-500 ml-1">{sensor.unit}</span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={sensor.status} />
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                                    {sensor.lastUpdated || '--:--'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                                        title="Xem lịch sử"
                                        onClick={() => handleOpenHistory(sensor)}
                                    >
                                        <BarChart2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MOBILE CARD VIEW --- */}
            <div className="md:hidden p-4 space-y-4 bg-slate-50 dark:bg-slate-900/30">
                {paginatedSensors.map((sensor) => (
                    <div key={sensor.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 
                                    className="text-base font-bold text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-2"
                                    onClick={() => handleOpenHistory(sensor)}
                                >
                                    {sensor.name} <ChevronRight size={14} className="text-slate-400"/>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                    <MapPin size={10}/> {sensor.station}
                                </p>
                            </div>
                            <StatusBadge status={sensor.status} />
                        </div>

                        <div className="flex items-center justify-between my-4 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Giá trị đo</p>
                                <div className="flex items-baseline gap-1">
                                    {sensor.status === 'offline' ? (
                                        <span className="text-lg font-bold text-slate-400 italic">--</span>
                                    ) : (
                                        <span className="text-xl font-bold text-slate-800 dark:text-white font-mono">{sensor.lastValue}</span>
                                    )}
                                    <span className="text-xs text-slate-500">{sensor.unit}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">Loại</p>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{sensor.type}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                <Activity size={10}/> {sensor.lastUpdated || '--:--'}
                            </span>
                            <button 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold active:scale-95 transition-transform"
                                onClick={() => handleOpenHistory(sensor)}
                            >
                                <BarChart2 size={14}/> Lịch sử
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {paginatedSensors.length === 0 && (
                <div className="py-16 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center">
                        <Search size={32} className="mb-2 opacity-20"/>
                        <p>Không tìm thấy cảm biến nào phù hợp với bộ lọc</p>
                    </div>
                </div>
            )}

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

        {/* --- SENSOR HISTORY MODAL --- */}
        {selectedSensor && (
            <div 
                className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-200"
                style={{ marginTop: 0 }}
            >
                <div className={`bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullScreen ? 'w-screen h-screen' : 'w-[90vw] h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700'}`}>
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-none">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg text-white shadow-md ${selectedSensor.status === 'online' ? 'bg-green-600' : selectedSensor.status === 'warning' ? 'bg-amber-500' : 'bg-slate-500'}`}>
                                {selectedSensor.type.includes('mưa') ? <CloudRain size={24}/> : 
                                 selectedSensor.type.includes('nhiệt') ? <Thermometer size={24}/> :
                                 <Gauge size={24}/>}
                            </div>
                            
                            {/* Title & Quick Switch / Comparison Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <div 
                                    className="cursor-pointer group"
                                    onClick={() => setIsQuickSwitchOpen(!isQuickSwitchOpen)}
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1">
                                            {selectedSensor.name} 
                                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${isQuickSwitchOpen ? 'rotate-180' : ''}`}/>
                                        </h3>
                                        {/* Comparison Indicators */}
                                        {compareList.length > 0 && (
                                            <div className="flex -space-x-2">
                                                {compareList.map((c, i) => (
                                                    <div key={c.id} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-white font-bold" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}>
                                                        {i+1}
                                                    </div>
                                                ))}
                                                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                                                    +{compareList.length}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{selectedSensor.type}</span>
                                        <span>•</span>
                                        <span>{selectedSensor.station}</span>
                                    </div>
                                </div>

                                {/* Comparison / Switch Dropdown */}
                                {isQuickSwitchOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 transform origin-top-left flex flex-col max-h-[400px]">
                                        
                                        {/* Header Hint */}
                                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-[10px] text-slate-500 uppercase font-bold tracking-wide rounded-t-xl">
                                            Thêm so sánh (Cùng loại: {selectedSensor.unit})
                                        </div>

                                        {/* Search Box */}
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    placeholder="Tìm cảm biến khác..." 
                                                    value={quickSwitchSearch}
                                                    onChange={(e) => setQuickSwitchSearch(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                                            {comparisonCandidates.map((s, idx) => {
                                                const isComparing = compareList.some(c => c.id === s.id);
                                                return (
                                                    <div 
                                                        key={s.id}
                                                        className={`flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group`}
                                                        onClick={() => handleQuickSwitch(s)}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-sm font-bold truncate ${isComparing ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{s.name}</p>
                                                            <p className="text-xs text-slate-500 truncate">{s.station}</p>
                                                        </div>
                                                        
                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={(e) => isComparing ? handleRemoveCompare(s.id) : handleAddToCompare(s, e)}
                                                                className={`p-1.5 rounded-full transition-colors ${isComparing ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'}`}
                                                                title={isComparing ? "Bỏ so sánh" : "Thêm vào so sánh"}
                                                            >
                                                                {isComparing ? <X size={14}/> : <Plus size={14}/>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {comparisonCandidates.length === 0 && (
                                                <div className="py-4 text-center text-xs text-slate-400">Không có cảm biến cùng loại</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-full transition-colors hidden md:block ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                title={showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                            >
                                <Filter size={20} />
                            </button>
                            <button 
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"
                            >
                                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </button>
                            <button 
                                onClick={handleCloseModal}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Active Filters / Compare Chips */}
                    {(compareList.length > 0 || showFilters) && (
                        <div className="px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                            {/* Compare Chips */}
                            {compareList.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase mr-1 flex items-center gap-1"><GitMerge size={12}/> Đang so sánh:</span>
                                    
                                    {/* Main Chip */}
                                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200">
                                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                        {selectedSensor.name}
                                    </div>

                                    {/* Compare Chips */}
                                    {compareList.map((c, i) => (
                                        <div key={c.id} className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-xs font-bold text-blue-700 dark:text-blue-300">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}></div>
                                            {c.name}
                                            <button onClick={() => handleRemoveCompare(c.id)} className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"><X size={10}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Date Filter */}
                            {showFilters && (
                                <div className="grid grid-cols-2 gap-4 w-full md:w-2/3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Từ ngày giờ</label>
                                        <input 
                                            type="datetime-local" 
                                            value={dateRange.from}
                                            onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Đến ngày giờ</label>
                                        <input 
                                            type="datetime-local" 
                                            value={dateRange.to}
                                            onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
                        {/* Tabs */}
                        <div className="px-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center flex-none">
                            <div className="flex gap-6">
                                <button 
                                    onClick={() => setModalTab('chart')}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${modalTab === 'chart' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <Activity size={18}/> Đồ thị biến động
                                </button>
                                <button 
                                    onClick={() => setModalTab('table')}
                                    className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${modalTab === 'table' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                >
                                    <TableIcon size={18}/> Bảng số liệu
                                </button>
                            </div>
                            {modalTab === 'table' && (
                                <button 
                                    onClick={handleExportHistory}
                                    className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Download size={16}/> Xuất Excel
                                </button>
                            )}
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                            {modalTab === 'chart' ? (
                                <div className="h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col relative group">
                                    <div className="flex-1 w-full min-h-[400px]" style={{ minHeight: '400px' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            {/* Logic: Switch to LineChart if comparing, else use Area/Bar based on type */}
                                            {compareList.length > 0 ? (
                                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                                                    <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} interval={Math.floor(chartData.length / 10)} />
                                                    <YAxis label={{ value: `Giá trị (${selectedSensor.unit})`, angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{fontSize: 12, fill: '#64748b'}} />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <Legend />
                                                    {/* Main Line */}
                                                    <Line type="monotone" dataKey={selectedSensor.id} stroke="#3b82f6" strokeWidth={3} dot={false} name={selectedSensor.name} />
                                                    {/* Comparison Lines */}
                                                    {compareList.map((c, i) => (
                                                        <Line key={c.id} type="monotone" dataKey={c.id} stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]} strokeWidth={2} dot={false} name={c.name} />
                                                    ))}
                                                </LineChart>
                                            ) : selectedSensor.type.toLowerCase().includes('mưa') ? (
                                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                                    <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} interval={Math.floor(chartData.length / 10)} />
                                                    <YAxis label={{ value: 'Lượng mưa (mm)', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{fontSize: 12, fill: '#64748b'}} />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <Bar dataKey={selectedSensor.id} fill="#3b82f6" name="Lượng mưa" radius={[4, 4, 0, 0]} barSize={20} />
                                                </BarChart>
                                            ) : (
                                                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                                    <defs>
                                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                                                    <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} interval={Math.floor(chartData.length / 10)} />
                                                    <YAxis 
                                                        domain={['auto', 'auto']} 
                                                        label={{ value: `${selectedSensor.type} (${selectedSensor.unit})`, angle: -90, position: 'insideLeft', fill: '#64748b' }} 
                                                        tick={{fontSize: 12, fill: '#64748b'}}
                                                    />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                    <Legend />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey={selectedSensor.id} 
                                                        stroke="#3b82f6" 
                                                        fill="url(#colorValue)" 
                                                        strokeWidth={3}
                                                        name={selectedSensor.name}
                                                    />
                                                </AreaChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3">Thời gian</th>
                                                    <th className="px-6 py-3">{selectedSensor.name} ({selectedSensor.unit})</th>
                                                    {compareList.map(c => (
                                                        <th key={c.id} className="px-6 py-3">{c.name} ({c.unit})</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {chartData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="px-6 py-2 font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">{row.time.replace('T', ' ').slice(0, 16)}</td>
                                                        <td className="px-6 py-2 font-bold text-blue-600 dark:text-blue-400">{row[selectedSensor.id]}</td>
                                                        {compareList.map(c => (
                                                            <td key={c.id} className="px-6 py-2 text-slate-600 dark:text-slate-400">{row[c.id]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
