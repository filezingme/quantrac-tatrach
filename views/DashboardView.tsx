import React, { useEffect, useState, useMemo } from 'react';
import { ObservationData } from '../types';
import { db } from '../utils/db';
import { exportToExcel } from '../utils/excel';
import { 
  CloudRain, Activity, RefreshCw, X, Maximize2, Minimize2,
  TrendingUp, TrendingDown, Calendar, Droplets, Waves, Info,
  Table as TableIcon, Filter, Download, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { useUI } from '../components/GlobalUI';

// --- Types & Constants ---

type MetricType = 'waterLevel' | 'capacity' | 'inflow' | 'outflow';

interface MetricDetail {
  id: MetricType;
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  subLabel?: string;
  historyData?: any[]; 
}

// Years available for comparison
const AVAILABLE_YEARS = [2024, 2023, 2022, 2021];
// Colors for secondary comparison lines (when multiple years are selected)
const COMPARE_COLORS = ['#94a3b8', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899']; // Slate, Red, Purple, Amber, Pink

// Generate smoother mock history data
const generateSparklineHistory = (baseValue: number, variance: number) => {
  const now = new Date();
  const safeBase = baseValue || 0; // Prevent NaN
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const noise = Math.sin(i / 3) * variance + Math.cos(i / 5) * (variance / 2);
    return {
      time: `${t.getHours()}:00`,
      value: Math.max(0, parseFloat((safeBase + noise).toFixed(2)))
    };
  });
};

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<ObservationData>(db.observation.get());
  const ui = useUI();
  
  // Modal State
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Filter State
  const [filterFrom, setFilterFrom] = useState(new Date(new Date().setHours(0,0,0,0)).toISOString().slice(0, 16));
  const [filterTo, setFilterTo] = useState(new Date().toISOString().slice(0, 16));
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  
  // Comparison Data State
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const refreshData = () => {
      setData(db.observation.get());
  };

  useEffect(() => {
    const handleDbChange = () => setData(db.observation.get());
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Force chart resize on modal open/tab change
  useEffect(() => {
    if (selectedMetric && modalTab === 'chart') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedMetric, modalTab, isFullscreen]);

  // Constants
  const MAX_DAM_HEIGHT = 60;
  const DEAD_LEVEL = 23;
  const NORMAL_LEVEL = 45;
  
  // Safe Access to Data
  const currentWaterLevel = data?.waterLevel ?? 0;
  const currentCapacity = data?.capacity ?? 0;
  const currentInflow = data?.inflow ?? 0;
  const currentOutflow = data?.outflow ?? 0;
  const rainfallData = data?.rainfall ?? [];
  const downstreamData = data?.downstream ?? [];
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString('vi-VN') : 'N/A';

  const waterPercent = Math.min(100, Math.max(0, (currentWaterLevel / MAX_DAM_HEIGHT) * 100));

  const metrics: Record<MetricType, MetricDetail> = {
    waterLevel: {
      id: 'waterLevel',
      label: 'Mực nước hồ',
      value: currentWaterLevel,
      unit: 'm',
      max: MAX_DAM_HEIGHT, 
      color: '#3b82f6',
      subLabel: 'MNDBT: 45m',
      historyData: generateSparklineHistory(currentWaterLevel, 0.8)
    },
    capacity: {
      id: 'capacity',
      label: 'Dung tích',
      value: currentCapacity,
      unit: 'triệu m³',
      max: 646, 
      color: '#06b6d4',
      subLabel: `${((currentCapacity / 646) * 100).toFixed(1)}% dung tích`,
      historyData: generateSparklineHistory(currentCapacity, 10)
    },
    inflow: {
      id: 'inflow',
      label: 'Lưu lượng đến',
      value: currentInflow,
      unit: 'm³/s',
      max: 1000, 
      color: '#10b981',
      historyData: generateSparklineHistory(currentInflow, 30)
    },
    outflow: {
      id: 'outflow',
      label: 'Tổng xả',
      value: currentOutflow,
      unit: 'm³/s',
      max: 1000,
      color: '#f59e0b',
      historyData: generateSparklineHistory(currentOutflow, 25)
    }
  };

  const capacityChartData = [
    { name: 'Used', value: currentCapacity },
    { name: 'Empty', value: Math.max(0, 646 - currentCapacity) }
  ];

  // --- Modal Logic ---

  const generateComparisonData = (metric: MetricDetail, years: number[]) => {
    const points = 24; 
    const baseVal = metric.value;
    const newData = [];
    const start = new Date(filterFrom);
    
    for (let i = 0; i <= points; i++) {
       const date = new Date(start);
       date.setHours(date.getHours() + i);
       const timeLabel = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
       const row: any = { timeLabel };

       years.forEach(year => {
          const seed = year % 100;
          const variance = metric.id === 'waterLevel' ? 0.5 : metric.id === 'capacity' ? 5 : 50;
          const noise = Math.sin((i + seed) / 3) * variance;
          let val = baseVal + noise;
          if (val < 0) val = 0;
          row[year] = parseFloat(val.toFixed(2));
       });
       newData.push(row);
    }
    setComparisonData(newData);
  };

  const handleOpenModal = (metric: MetricDetail) => {
    const initialYears = [new Date().getFullYear()];
    generateComparisonData(metric, initialYears);
    setSelectedMetric(metric);
    setModalTab('chart');
    setIsFullscreen(false);
    // Reset filters
    setFilterFrom(new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 16));
    setFilterTo(new Date().toISOString().slice(0, 16));
    setSelectedYears(initialYears);
  };

  const handleCloseModal = () => setSelectedMetric(null);

  const toggleYear = (year: number) => {
    const newYears = selectedYears.includes(year) 
      ? selectedYears.filter(y => y !== year) 
      : [...selectedYears, year];
    setSelectedYears(newYears);
    if (selectedMetric) generateComparisonData(selectedMetric, newYears);
  };

  const handleViewData = () => {
    if (selectedMetric) {
        generateComparisonData(selectedMetric, selectedYears);
    }
  };

  const handleExportRainfall = () => {
    // Define exact headers and their order
    const headers = ['Trạm đo', 'Hiện tại (mm)', '1 giờ (mm)', '24 giờ (mm)', '3 ngày (mm)'];
    
    const exportData = rainfallData.map(r => ({
      'Trạm đo': r.name,
      'Hiện tại (mm)': r.data.current,
      '1 giờ (mm)': '-',
      '24 giờ (mm)': r.data.day1,
      '3 ngày (mm)': r.data.day3
    }));
    
    exportToExcel(exportData, 'So_lieu_mua', headers);
  };

  const handleExportComparison = () => {
    // Dynamic headers based on selected years
    const headers = ['Thời gian', ...selectedYears.map(y => `Năm ${y}`)];
    
    // Transform data to match headers
    const exportData = comparisonData.map(row => {
        const item: any = { 'Thời gian': row.timeLabel };
        selectedYears.forEach(y => {
            item[`Năm ${y}`] = row[y];
        });
        return item;
    });

    exportToExcel(exportData, `Du_lieu_${selectedMetric?.id}`, headers);
  };

  // Helper to determine chart color: Primary year gets metric color, others get contrast colors
  const getSeriesColor = (index: number, baseColor: string) => {
     if (index === 0) return baseColor;
     return COMPARE_COLORS[(index - 1) % COMPARE_COLORS.length];
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      {/* Header - Redesigned for Mobile Responsiveness */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <style>{`
          @keyframes wave-animation {
            0% { transform: translateX(0) translateZ(0) scaleY(1); }
            50% { transform: translateX(-25%) translateZ(0) scaleY(0.8); }
            100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
          }
          .wave-bg {
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%233b82f6'/%3E%3C/svg%3E");
            background-position: 0 bottom;
            background-repeat: repeat-x;
            background-size: 50% 100%;
            width: 200%;
            height: 100%;
            animation: wave-animation 10s linear infinite;
            transform-origin: center bottom;
            opacity: 0.8;
          }
        `}</style>
        <div>
           <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Dữ liệu quan trắc</h2>
           <div className="flex items-center gap-3 mt-2">
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                <Calendar size={12} className="text-slate-400"/>
                <span>{lastUpdated}</span>
             </div>
             <button 
               onClick={refreshData} 
               className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors active:scale-95"
               title="Cập nhật dữ liệu"
             >
               <RefreshCw size={16}/>
             </button>
           </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800 shadow-sm">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <span className="whitespace-nowrap">Máy chủ: Online</span>
            </div>
            <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="whitespace-nowrap">Sensor: Tốt</span>
            </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* 1. Water Level */}
        <div 
          onClick={() => handleOpenModal(metrics.waterLevel)}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group h-56 flex flex-col p-5"
        >
             <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Droplets size={18} />
                    </div>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase">Mực nước</span>
                </div>
                <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors"/>
             </div>

             <div className="flex-1 flex gap-4 items-end">
                <div className="flex-1 flex flex-col justify-end pb-2">
                    <div className="flex items-baseline gap-1">
                         <span className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">{metrics.waterLevel.value.toFixed(2)}</span>
                         <span className="text-sm font-medium text-slate-500 dark:text-slate-400">m</span>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> 
                           <span>MNDBT: <b>{NORMAL_LEVEL}m</b></span>
                        </div>
                    </div>
                </div>

                <div className="relative h-full w-24 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
                    <div className="absolute inset-0 z-20 flex flex-col justify-between py-2 px-1 pointer-events-none opacity-30">
                         {[60, 50, 40, 30, 20].map((h) => (
                             <div key={h} className="border-t border-slate-800 dark:border-slate-200 w-full flex items-center gap-1">
                                 <span className="text-[8px] ml-auto text-slate-800 dark:text-slate-400">{h}</span>
                             </div>
                         ))}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-1000 ease-in-out z-10" style={{ height: `${waterPercent}%` }}>
                        <div className="absolute -top-3 left-0 w-full h-4"><div className="wave-bg"></div></div>
                    </div>
                </div>
             </div>
        </div>

        {/* 2. Capacity */}
        <div 
          onClick={() => handleOpenModal(metrics.capacity)}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group h-56 flex flex-col p-5"
        >
             <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 rounded-lg">
                        <Activity size={18} />
                    </div>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase">Dung tích</span>
                </div>
                <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors"/>
             </div>

             <div className="flex-1 flex items-center justify-between gap-2">
                 <div className="flex flex-col justify-center">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-800 dark:text-white">{metrics.capacity.value.toFixed(0)}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">triệu m³</span>
                    <div className="mt-4 text-xs space-y-1">
                        <div className="text-slate-400 dark:text-slate-500">Còn trống</div>
                        <div className="font-bold text-cyan-600 dark:text-cyan-400 text-lg">{(646 - metrics.capacity.value).toFixed(0)}</div>
                    </div>
                 </div>
                 <div className="w-32 h-32 relative flex-none">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={capacityChartData}
                            cx="50%" cy="50%"
                            innerRadius={35} outerRadius={45}
                            startAngle={90} endAngle={-270}
                            dataKey="value"
                            stroke="none"
                            paddingAngle={2}
                          >
                            <Cell fill="#06b6d4" />
                            <Cell fill="#e2e8f0" className="dark:fill-slate-700"/>
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-lg font-bold text-cyan-700 dark:text-cyan-400">
                             {Math.round((metrics.capacity.value / 646) * 100)}%
                         </span>
                     </div>
                 </div>
             </div>
        </div>

        {/* 3. Inflow */}
        <div 
          onClick={() => handleOpenModal(metrics.inflow)}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group h-56 flex flex-col p-5"
        >
             <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <TrendingUp size={18} />
                    </div>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase">Lưu lượng đến</span>
                </div>
                <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors"/>
             </div>
             
             <div className="flex-1 flex flex-col relative z-10">
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{metrics.inflow.value}</span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">m³/s</span>
                </div>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold w-fit mt-1">Trung bình 1h</span>
             </div>

             <div className="h-24 w-[calc(100%+2.5rem)] -ml-5 -mb-5 mt-auto">
                <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={metrics.inflow.historyData}>
                        <defs>
                            <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#colorInflow)" isAnimationActive={true}/>
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>

        {/* 4. Outflow */}
        <div 
          onClick={() => handleOpenModal(metrics.outflow)}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group h-56 flex flex-col p-5"
        >
             <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                        <TrendingDown size={18} />
                    </div>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase">Tổng xả</span>
                </div>
                <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors"/>
             </div>
             
             <div className="flex-1 flex flex-col relative z-10">
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-bold text-amber-700 dark:text-amber-400">{metrics.outflow.value}</span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">m³/s</span>
                </div>
                <span className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold w-fit mt-1">Qua 2 tổ máy</span>
             </div>

             <div className="h-24 w-[calc(100%+2.5rem)] -ml-5 -mb-5 mt-auto">
                <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={metrics.outflow.historyData}>
                        <defs>
                            <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#colorOutflow)" isAnimationActive={true}/>
                    </AreaChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>

      {/* Secondary Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rainfall Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <CloudRain className="text-indigo-600 dark:text-indigo-400" size={20} />
               Số liệu mưa tại các trạm (mm)
             </h3>
             <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 border dark:border-slate-600 rounded hidden sm:inline-block">Cập nhật 10p trước</span>
                <button 
                  onClick={handleExportRainfall}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                >
                  <Download size={14}/> Xuất Excel
                </button>
             </div>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Trạm đo</th>
                  <th className="px-4 py-3 text-center">Hiện tại</th>
                  <th className="px-4 py-3 text-center">1 giờ</th>
                  <th className="px-4 py-3 text-center">24 giờ</th>
                  <th className="px-4 py-3 text-center rounded-r-lg">3 ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {rainfallData.length > 0 ? rainfallData.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{r.name}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/20 rounded">{r.data.current}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">-</td>
                    <td className="px-4 py-3 text-center font-medium dark:text-slate-300">{r.data.day1}</td>
                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{r.data.day3}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-400">Chưa có dữ liệu mưa</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Downstream Stations */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-0 overflow-hidden flex flex-col">
           <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Waves className="text-purple-600 dark:text-purple-400" size={20} />
                Mực nước hạ lưu
              </h3>
           </div>
           <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {downstreamData.map(d => (
              <div key={d.id} className="relative group">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 group-hover:bg-purple-300 dark:group-hover:bg-purple-500 transition-colors"></div>
                  <div className="pl-8 py-1">
                      <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{d.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">H1</span>
                      </div>
                      <div className="flex gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800 flex-1">
                             <span className="text-xs text-slate-500 dark:text-slate-400 block">Mực nước</span>
                             <span className="font-bold text-blue-700 dark:text-blue-400">{d.level} m</span>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg border border-purple-100 dark:border-purple-800 flex-1">
                             <span className="text-xs text-slate-500 dark:text-slate-400 block">Lưu lượng</span>
                             <span className="font-bold text-purple-700 dark:text-purple-400">{d.flow} m³/s</span>
                        </div>
                      </div>
                      <div className="absolute left-[13px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800 group-hover:bg-purple-500 transition-colors"></div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ADVANCED DETAIL MODAL --- */}
      {selectedMetric && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-200"
          style={{ marginTop: 0 }}
        >
          <div className={`bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-screen h-screen' : 'w-[90vw] h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700'}`}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-none">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg text-white shadow-md" style={{ backgroundColor: selectedMetric.color }}>
                   <Activity size={24}/>
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedMetric.label}</h3>
                   <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Giá trị hiện tại: {selectedMetric.value} {selectedMetric.unit}</span>
                   </div>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row gap-4 xl:items-end flex-none">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Từ ngày giờ</label>
                       <input 
                         type="datetime-local" 
                         value={filterFrom}
                         onChange={(e) => setFilterFrom(e.target.value)}
                         className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Đến ngày giờ</label>
                       <input 
                         type="datetime-local" 
                         value={filterTo}
                         onChange={(e) => setFilterTo(e.target.value)}
                         className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                       />
                    </div>
                </div>

                <div className="flex-[1.5]">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">So sánh các năm</label>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_YEARS.map((year) => {
                           const selectionIndex = selectedYears.indexOf(year);
                           const isSelected = selectionIndex !== -1;
                           const color = isSelected ? getSeriesColor(selectionIndex, selectedMetric.color) : undefined;
                           
                           return (
                             <button
                               key={year}
                               onClick={() => toggleYear(year)}
                               className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${
                                 isSelected 
                                   ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600' 
                                   : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                               }`}
                             >
                               <span className={`w-2 h-2 rounded-full ${isSelected ? '' : 'bg-slate-300 dark:bg-slate-600'}`} style={{ backgroundColor: color }}></span>
                               {year}
                             </button>
                           );
                        })}
                    </div>
                </div>

                <div>
                   <button 
                     onClick={handleViewData}
                     className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                   >
                     <Filter size={16}/> Xem dữ liệu
                   </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
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
                        onClick={handleExportComparison}
                        className="flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"
                     >
                        <Download size={16}/> Xuất Excel
                     </button>
                  )}
               </div>

               <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  {modalTab === 'chart' && (
                    <div className="h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col relative group">
                        <div className="flex-1 w-full min-h-[400px]" style={{ minHeight: '400px' }}>
                           <ResponsiveContainer width="99%" height="100%">
                              <AreaChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                 <defs>
                                   {selectedYears.map((year, index) => {
                                     const color = getSeriesColor(index, selectedMetric.color);
                                     return (
                                       <linearGradient key={year} id={`color${year}`} x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                         <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                       </linearGradient>
                                     );
                                   })}
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                                 <XAxis 
                                    dataKey="timeLabel" 
                                    tick={{fontSize: 12, fill: '#64748b'}}
                                    interval={2}
                                 />
                                 <YAxis 
                                    domain={['auto', 'auto']} 
                                    label={{ 
                                      value: `${selectedMetric.label} (${selectedMetric.unit})`, 
                                      angle: -90, 
                                      position: 'insideLeft', 
                                      fill: '#64748b',
                                      style: { textAnchor: 'middle' }
                                    }}
                                    tick={{fontSize: 12, fill: '#64748b'}}
                                 />
                                 <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                 />
                                 <Legend />
                                 {selectedYears.map((year, index) => {
                                    const color = getSeriesColor(index, selectedMetric.color);
                                    return (
                                      <Area 
                                        key={year}
                                        type="monotone" 
                                        dataKey={year} 
                                        stroke={color} 
                                        fill={`url(#color${year})`}
                                        fillOpacity={1}
                                        strokeWidth={3}
                                        dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        name={`Năm ${year}`}
                                      />
                                    );
                                 })}
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                    </div>
                  )}
                  {modalTab === 'table' && (
                     <div className="h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                           <table className="w-full text-sm text-left">
                              <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                                 <tr>
                                    <th className="px-6 py-3">Thời gian</th>
                                    {selectedYears.map(year => <th key={year} className="px-6 py-3">Năm {year}</th>)}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                 {comparisonData.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                       <td className="px-6 py-2 font-medium text-slate-700 dark:text-slate-300">{row.timeLabel}</td>
                                       {selectedYears.map(year => (
                                          <td key={year} className="px-6 py-2 text-slate-600 dark:text-slate-400">{row[year]}</td>
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