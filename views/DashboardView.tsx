import React, { useEffect, useState, useMemo } from 'react';
import { ObservationData } from '../types';
import { db } from '../utils/db';
import { exportToExcel } from '../utils/excel';
import { 
  Activity, RefreshCw, X, Maximize2, Minimize2,
  TrendingUp, TrendingDown, Calendar, Droplets,
  Table as TableIcon, Filter, Download, Check, ChevronDown, ChevronUp,
  Radio, BarChart3, AlertCircle, CloudRain, Clock, Zap, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line
} from 'recharts';
import { useUI } from '../components/GlobalUI';

// --- Types & Constants ---

type MetricType = 'waterLevel' | 'capacity' | 'inflow' | 'outflow' | 'rain_recent' | 'rain_forecast';

interface MetricDetail {
  id: MetricType;
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  subLabel?: string;
  chartType?: 'area' | 'bar_line'; // New property to distinguish chart types
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

// Generate Mock Rainfall Data (Hourly Bars + Accumulation)
const generateRainfallData = (isForecast: boolean) => {
  const data = [];
  let accum = 0;
  for (let i = 0; i < 24; i++) {
    // Random rain event pattern
    const rawRain = Math.random() > 0.6 ? Math.random() * 20 : 0; 
    const rain = parseFloat(rawRain.toFixed(1));
    accum += rain;
    const hourLabel = isForecast ? `+${i+1}h` : `${i}:00`;
    
    data.push({
      timeLabel: hourLabel,
      value: rain, // Hourly intensity (Bar)
      accumulated: parseFloat(accum.toFixed(1)) // Cumulative (Line)
    });
  }
  return data;
};

// Mock Data for New Widgets
const alertData = [
  { id: 1, time: '03/02/2026 09:30:02', sensor: 'Đo mực nước', type: 'Đo mực nước', station: 'Trạm đo mực nước', status: 'Mất kết nối' },
  { id: 2, time: '03/02/2026 09:30:02', sensor: 'P2-3', type: 'Đo mực nước', station: 'Trạm đo mực nước', status: 'Mất kết nối' },
  { id: 3, time: '03/02/2026 09:30:02', sensor: 'KN4', type: 'Đo mực nước', station: 'Trạm đo mực nước', status: 'Mất kết nối' },
  { id: 4, time: '03/02/2026 09:30:02', sensor: 'KN2', type: 'Đo mực nước', station: 'Trạm đo mực nước', status: 'Mất kết nối' },
  { id: 5, time: '03/02/2026 09:30:02', sensor: 'KN1', type: 'Đo mực nước', station: 'Trạm đo mực nước', status: 'Mất kết nối' },
  { id: 6, time: '03/02/2026 08:15:00', sensor: 'Cảm biến thấm T1', type: 'Áp lực thấm', station: 'Đập chính', status: 'Cảnh báo' },
  { id: 7, time: '03/02/2026 07:45:30', sensor: 'Trạm mưa Hương Sơn', type: 'Mưa lớn', station: 'Thượng lưu', status: 'Vượt ngưỡng' },
];

// Mock Data for Rainfall Widgets (Summary)
const recentRainData = [
  { name: '3 ngày trước', value: 120.5, fullMark: 150 },
  { name: '1 ngày trước', value: 45.2, fullMark: 150 },
  { name: 'Hiện tại', value: 12.5, fullMark: 150 },
];

const forecastRainData = [
  { name: 'Hiện tại', value: 12.5 },
  { name: '3h tới', value: 25.0 },
  { name: '24h tới', value: 65.0 },
  { name: '3 ngày tới', value: 110.0 },
];

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<ObservationData>(db.observation.get());
  const ui = useUI();
  
  // Modal State
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // State to toggle filter visibility
  
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

  // Force chart resize on modal open/tab change/filter toggle
  useEffect(() => {
    if (selectedMetric && modalTab === 'chart') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedMetric, modalTab, isFullscreen, showFilters]);

  // Constants
  const MAX_DAM_HEIGHT = 60;
  const NORMAL_LEVEL = 45;
  
  // Safe Access to Data
  const currentWaterLevel = data?.waterLevel ?? 0;
  const currentCapacity = data?.capacity ?? 0;
  const currentInflow = data?.inflow ?? 0;
  const currentOutflow = data?.outflow ?? 0;
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
      chartType: 'area',
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
      chartType: 'area',
      historyData: generateSparklineHistory(currentCapacity, 10)
    },
    inflow: {
      id: 'inflow',
      label: 'Lưu lượng đến',
      value: currentInflow,
      unit: 'm³/s',
      max: 1000, 
      color: '#10b981',
      subLabel: 'Trung bình 1h',
      chartType: 'area',
      historyData: generateSparklineHistory(currentInflow, 30)
    },
    outflow: {
      id: 'outflow',
      label: 'Tổng xả',
      value: currentOutflow,
      unit: 'm³/s',
      max: 1000,
      color: '#f59e0b',
      subLabel: 'Qua 2 tổ máy',
      chartType: 'area',
      historyData: generateSparklineHistory(currentOutflow, 25)
    },
    rain_recent: {
      id: 'rain_recent',
      label: 'Mưa thực đo',
      value: 12.5,
      unit: 'mm',
      max: 200,
      color: '#3b82f6',
      subLabel: 'Tổng 24h qua',
      chartType: 'bar_line',
      historyData: generateRainfallData(false)
    },
    rain_forecast: {
      id: 'rain_forecast',
      label: 'Dự báo mưa',
      value: 65.0,
      unit: 'mm',
      max: 200,
      color: '#8b5cf6',
      subLabel: 'Dự báo WRF',
      chartType: 'bar_line',
      historyData: generateRainfallData(true)
    }
  };

  const capacityChartData = [
    { name: 'Used', value: currentCapacity },
    { name: 'Empty', value: Math.max(0, 646 - currentCapacity) }
  ];

  // --- Modal Logic ---

  const generateComparisonData = (metric: MetricDetail, years: number[], startDateStr?: string, endDateStr?: string) => {
    const start = startDateStr ? new Date(startDateStr) : new Date(filterFrom);
    const end = endDateStr ? new Date(endDateStr) : new Date(filterTo);
    
    // Calculate total hours in the range to generate adequate mock data
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60)); 
    
    const newData = [];

    // --- Rainfall Logic (Bar + Line) ---
    if (metric.chartType === 'bar_line') {
       // Initialize accumulators for each year
       const accumulators: Record<number, number> = {};
       years.forEach(y => accumulators[y] = 0);

       for (let i = 0; i <= totalHours; i++) {
           const date = new Date(start.getTime() + i * 60 * 60 * 1000);
           const timeLabel = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
           const row: any = { timeLabel };

           years.forEach(year => {
               // Pseudo-random seed based on year and hour index to make it deterministic but look random
               const seed = (year % 100) * 1000 + i;
               // Sine wave based probability to create "storm clusters"
               const prob = Math.sin(i / 5 + year) * 0.5 + 0.5; // 0 to 1
               
               let rain = 0;
               // 30% chance of rain, higher probability during "peaks" of the sine wave
               if (prob > 0.7 || Math.random() > 0.8) {
                   // Random rain intensity: light (1-5mm) to heavy (20-50mm)
                   const intensity = Math.random();
                   rain = intensity > 0.9 ? 20 + Math.random() * 30 : 1 + Math.random() * 10;
                   rain = parseFloat(rain.toFixed(1));
               }
               
               // Accumulate
               accumulators[year] += rain;
               
               // Assign to row
               row[year] = rain; // Bar value
               row[`${year}_accum`] = parseFloat(accumulators[year].toFixed(1)); // Line value
           });
           newData.push(row);
       }
       setComparisonData(newData);
       return;
    }

    // --- Default Logic (Area Charts: Water Level, Flow, etc.) ---
    const baseVal = metric.value;
    for (let i = 0; i <= totalHours; i++) {
       const date = new Date(start.getTime() + i * 60 * 60 * 1000);
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
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 16);
    const now = new Date().toISOString().slice(0, 16);
    
    // Set state
    setSelectedMetric(metric);
    setModalTab('chart');
    setIsFullscreen(false);
    setShowFilters(true);
    setFilterFrom(yesterday);
    setFilterTo(now);
    setSelectedYears(initialYears);

    // Generate initial data with explicitly passed dates to avoid state race condition
    generateComparisonData(metric, initialYears, yesterday, now);
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

  const handleExportComparison = () => {
    // Dynamic headers based on selected years
    const headers = ['Thời gian', ...selectedYears.map(y => `Năm ${y}`)];
    if (selectedMetric?.chartType === 'bar_line') {
       // Add accumulated col for rain
       selectedYears.forEach(y => headers.push(`Lũy kế Năm ${y}`));
    }
    
    // Transform data to match headers
    const exportData = comparisonData.map(row => {
        const item: any = { 'Thời gian': row.timeLabel };
        selectedYears.forEach(y => {
            item[`Năm ${y}`] = row[y];
            if (selectedMetric?.chartType === 'bar_line') {
               item[`Lũy kế Năm ${y}`] = row[`${y}_accum`];
            }
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
    <>
      <div className="space-y-6 animate-fade-in relative pb-10">
        {/* Header - Redesigned for Mobile Responsiveness */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <style>{`
            @keyframes wave-animation {
              0% { transform: translateX(0) translateZ(0) scaleY(1); }
              50% { transform: translateX(-25%) translateZ(0) scaleY(0.8); }
              100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
            }
            @keyframes rise {
              0% { bottom: 0; transform: translateX(0); opacity: 0; }
              50% { opacity: 1; }
              100% { bottom: 100%; transform: translateX(-20px); opacity: 0; }
            }
            .wave-bg {
              background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 88.7'%3E%3Cpath d='M800 56.9c-155.5 0-204.9-50-405.5-49.9-200 0-250 49.9-394.5 49.9v31.8h800v-.2-31.6z' fill='%2322d3ee'/%3E%3C/svg%3E");
              background-position: 0 bottom;
              background-repeat: repeat-x;
              background-size: 50% 100%;
              width: 200%;
              height: 100%;
              animation: wave-animation 10s linear infinite;
              transform-origin: center bottom;
              opacity: 0.9;
            }
            .bubble {
              position: absolute;
              background: rgba(255, 255, 255, 0.4);
              border-radius: 50%;
              animation: rise 4s infinite ease-in;
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
              <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wide border border-yellow-200 dark:border-yellow-800 shadow-sm">
                  <Zap size={14} className="animate-pulse" />
                  <span className="whitespace-nowrap">Phát điện: 21 MW</span>
              </div>
              <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800 shadow-sm">
                  <ShieldCheck size={14} />
                  <span className="whitespace-nowrap">An toàn đập: Tốt</span>
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

                  {/* Water Tank Visualizer */}
                  <div className="relative h-full w-24 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shadow-inner flex-none ml-2">
                      <div className="absolute right-0 top-0 bottom-0 w-full z-20 pointer-events-none flex flex-col justify-between py-2 px-1">
                          {[...Array(6)].map((_, i) => (
                              <div key={i} className="flex items-center justify-end w-full gap-1 opacity-40">
                                  <span className="text-[8px] font-mono">{60 - i*10}</span>
                                  <div className="w-2 h-[1px] bg-slate-500"></div>
                              </div>
                          ))}
                      </div>
                      <div className="absolute top-[25%] left-0 w-full flex items-center z-30" title="MNDBT (45m)">
                          <div className="h-[1px] w-full bg-red-500 opacity-70"></div>
                      </div>
                      <div className="absolute bottom-[38%] left-0 w-full flex items-center z-30" title="MNC (23m)">
                          <div className="h-[1px] w-full bg-slate-500 dark:bg-slate-300 opacity-70"></div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out z-10 bg-gradient-to-t from-blue-600 to-cyan-400 opacity-90" style={{ height: `${waterPercent}%` }}>
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/50 z-20"></div>
                          <div className="absolute -top-3 left-0 w-full h-4"><div className="wave-bg"></div></div>
                          <div className="bubble w-1 h-1 left-1/3 bottom-2 delay-100"></div>
                          <div className="bubble w-1.5 h-1.5 left-2/3 bottom-5 delay-700"></div>
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

        {/* --- NEW SECTION: RAINFALL ANALYSIS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           
           {/* Recent Rainfall (Clickable) */}
           <div 
             onClick={() => handleOpenModal(metrics.rain_recent)}
             className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
           >
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <CloudRain className="text-blue-500" size={18} />
                   Lượng mưa 3 ngày gần nhất (mm)
                 </h3>
                 <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors"/>
              </div>
              <div className="flex-1 min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentRainData} margin={{top: 10, right: 30, left: 0, bottom: 0}} barSize={40}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                       <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                       <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                       <RechartsTooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)'}}
                       />
                       <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {recentRainData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 2 ? '#06b6d4' : '#94a3b8'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Rainfall Forecast (Clickable) */}
           <div 
             onClick={() => handleOpenModal(metrics.rain_forecast)}
             className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
           >
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Clock className="text-purple-500" size={18} />
                   Dự báo lượng mưa tích lũy (mm)
                 </h3>
                 <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-purple-500 transition-colors"/>
              </div>
              <div className="flex-1 min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastRainData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                       <defs>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                       <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                       <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                       <RechartsTooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)'}}
                       />
                       <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorForecast)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

        </div>

        {/* Secondary Data Sections (Replaced with Sensor Alerts and Stats) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Latest Sensor Alerts */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Radio className="text-indigo-600 dark:text-indigo-400" size={20} />
                 Danh sách cảnh báo mới nhất
               </h3>
               <div className="flex gap-2 items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 border dark:border-slate-600 rounded hidden sm:inline-block">Cập nhật 10p trước</span>
                  <button 
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                  >
                    <Download size={14}/> Xuất Excel
                  </button>
               </div>
            </div>
            <div className="overflow-x-auto p-2">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-center">STT</th>
                    <th className="px-4 py-3">THỜI GIAN</th>
                    <th className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">TÊN CẢM BIẾN</th>
                    <th className="px-4 py-3">LOẠI CẢNH BÁO</th>
                    <th className="px-4 py-3">TRẠM ĐO</th>
                    <th className="px-4 py-3 text-right">TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {alertData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{row.id}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.time}</td>
                      <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{row.sensor}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.type}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.station}</td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sensor Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-0 overflow-hidden flex flex-col">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="text-purple-600 dark:text-purple-400" size={20} />
                  Thống kê hiện trạng cảm biến
                </h3>
             </div>
             <div className="p-6 space-y-6 flex-1">
                
                {/* Block 1 */}
                <div>
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3">Số cảm biến đang hoạt động/Tổng</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                         <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hoạt động</div>
                         <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">10</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                         <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng số</div>
                         <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">12</div>
                      </div>
                   </div>
                </div>

                {/* Block 2 */}
                <div>
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3">Số cảm biến hỏng / mất kết nối</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                         <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hỏng</div>
                         <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">1</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                         <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Mất kết nối</div>
                         <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">1</div>
                      </div>
                   </div>
                </div>

                {/* Block 3 */}
                <div>
                   <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3">Số điểm có cảnh báo vượt ngưỡng</h4>
                   <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 w-full">
                         <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Vượt ngưỡng</div>
                         <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">1</div>
                   </div>
                </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- ADVANCED DETAIL MODAL (Moved outside main div to avoid transform conflicts) --- */}
      {selectedMetric && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-200"
          style={{ marginTop: 0 }}
        >
          <div className={`bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-screen h-screen' : 'w-[90vw] h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700'}`}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-none">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg text-white shadow-md" style={{ backgroundColor: selectedMetric.color }}>
                   {selectedMetric.chartType === 'bar_line' ? <CloudRain size={24}/> : <Activity size={24}/>}
                 </div>
                 
                 {/* Title Area with Hover Dropdown */}
                 <div className="relative group cursor-pointer">
                    <div className="flex items-center gap-2">
                       <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedMetric.label}</h3>
                       <ChevronDown size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform group-hover:rotate-180" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Giá trị hiện tại: {selectedMetric.value} {selectedMetric.unit}</span>
                    </div>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 transform origin-top-left">
                       <div className="p-2 space-y-1">
                          {Object.values(metrics).map((m) => (
                             <div 
                                key={m.id}
                                onClick={(e) => {
                                   e.stopPropagation(); // Prevent bubbling
                                   handleOpenModal(m); 
                                }}
                                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedMetric.id === m.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                             >
                                <div className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: m.color }}></div>
                                <div className="flex-1">
                                   <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{m.label}</p>
                                   <p className="text-xs text-slate-500">{m.value} {m.unit}</p>
                                </div>
                                {selectedMetric.id === m.id && <Check size={16} className="ml-auto text-blue-600 dark:text-blue-400"/>}
                             </div>
                          ))}
                       </div>
                    </div>
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
            {showFilters && (
              <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row gap-4 xl:items-end flex-none relative animate-in slide-in-from-top-2 duration-200">
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

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleViewData}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <Filter size={16}/> Xem dữ liệu
                    </button>
                    
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                      title="Thu gọn bộ lọc"
                    >
                      <ChevronUp size={18}/>
                    </button>
                  </div>
              </div>
            )}

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
                              {selectedMetric.chartType === 'bar_line' ? (
                                <ComposedChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                   <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                                   <XAxis dataKey="timeLabel" tick={{fontSize: 12, fill: '#64748b'}} interval={2} />
                                   <YAxis yAxisId="left" label={{ value: 'Vũ lượng (mm)', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{fontSize: 12, fill: '#64748b'}} />
                                   <YAxis yAxisId="right" orientation="right" label={{ value: 'Lũy kế (mm)', angle: 90, position: 'insideRight', fill: '#64748b' }} tick={{fontSize: 12, fill: '#64748b'}} />
                                   <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                   <Legend />
                                   {selectedYears.map((year, index) => {
                                      const color = getSeriesColor(index, selectedMetric.color);
                                      return (
                                        <React.Fragment key={year}>
                                          <Bar yAxisId="left" dataKey={year} fill={color} fillOpacity={0.6} name={`Mưa giờ (Năm ${year})`} radius={[4, 4, 0, 0]} barSize={20} />
                                          <Line yAxisId="right" type="monotone" dataKey={`${year}_accum`} stroke={color} strokeWidth={2} dot={false} name={`Lũy kế (Năm ${year})`} />
                                        </React.Fragment>
                                      );
                                   })}
                                </ComposedChart>
                              ) : (
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
                              )}
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
                                    {selectedYears.map(year => (
                                      <React.Fragment key={year}>
                                        <th className="px-6 py-3">Năm {year}</th>
                                        {selectedMetric.chartType === 'bar_line' && <th className="px-6 py-3 text-slate-500">Lũy kế {year}</th>}
                                      </React.Fragment>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                 {comparisonData.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                       <td className="px-6 py-2 font-medium text-slate-700 dark:text-slate-300">{row.timeLabel}</td>
                                       {selectedYears.map(year => (
                                          <React.Fragment key={year}>
                                            <td className="px-6 py-2 text-slate-600 dark:text-slate-400">{row[year]}</td>
                                            {selectedMetric.chartType === 'bar_line' && <td className="px-6 py-2 text-slate-500 dark:text-slate-500">{row[`${year}_accum`]}</td>}
                                          </React.Fragment>
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
    </>
  );
};