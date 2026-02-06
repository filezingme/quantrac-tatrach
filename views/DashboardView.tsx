
import React, { useEffect, useState, useMemo } from 'react';
import { ObservationData, AlertLog } from '../types';
import { db } from '../utils/db';
import { exportToExcel } from '../utils/excel';
import { 
  Activity, RefreshCw, X, Maximize2, Minimize2,
  TrendingUp, TrendingDown, Calendar, Droplets,
  Table as TableIcon, Filter, Download, Check, ChevronDown, ChevronUp,
  Radio, BarChart3, AlertCircle, CloudRain, Clock, Zap, ShieldCheck,
  Wifi, WifiOff, AlertTriangle, ArrowRight, Settings, MapPin, Sliders,
  ExternalLink, Thermometer, Gauge // Added Thermometer, Gauge
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line, ReferenceLine // Added ReferenceLine
} from 'recharts';
import { useUI } from '../components/GlobalUI';
import { useNavigate } from 'react-router-dom';

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

// Helper function for strict date formatting
const formatDateTime = (dateInput: string | Date) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return ''; // Invalid date
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${d}/${m}/${y} ${h}:${min}:${s}`;
};

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

// --- Helper: Generate Mock History for Alert Popup (Consistent with AlertHistoryView) ---
const generateSensorHistoryForAlert = (sensorType: string, isAnomaly: boolean = false) => {
  const data = [];
  const now = new Date();
  
  // Determine base characteristics
  let baseValue = 0;
  let volatility = 5;
  
  if (sensorType.toLowerCase().includes('áp lực')) { baseValue = 1300; volatility = 20; }
  else if (sensorType.toLowerCase().includes('nhiệt độ')) { baseValue = 35; volatility = 2; }
  else if (sensorType.toLowerCase().includes('mưa')) { baseValue = 0; volatility = 0; }
  else { baseValue = 20; volatility = 5; }

  // Generate 24 hours of data
  for (let i = 24; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timeLabel = `${date.getHours()}:00`;
    
    let val = 0;
    // Make the value "spike" or change drastically if it's near "now" (index 0 or 1) to simulate the alert cause
    if (isAnomaly && i < 2) {
        val = baseValue + (volatility * 3); // Spike
    } else {
        const trend = Math.sin(i / 5) * volatility;
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

// Mock Data for Rainfall Widgets (Summary)
const recentRainData = [
  { name: '3 ngày trước', value: 120.5, fullMark: 150 },
  { name: '2 ngày trước', value: 82.0, fullMark: 150 },
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
  const [alertData, setAlertData] = useState<AlertLog[]>([]); // State for alerts
  const ui = useUI();
  const navigate = useNavigate();
  
  // Modal State (Metrics)
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);
  const [modalTab, setModalTab] = useState<'chart' | 'table'>('chart');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(true); // State to toggle filter visibility
  
  // Modal State (Alert Detail)
  const [selectedAlert, setSelectedAlert] = useState<AlertLog | null>(null);
  const [alertChartData, setAlertChartData] = useState<any[]>([]);
  const [isAlertFullScreen, setIsAlertFullScreen] = useState(false);

  // Health Settings State
  const [showHealthSettings, setShowHealthSettings] = useState(false);
  const [healthScore, setHealthScore] = useState(92);
  const [sensorCounts, setSensorCounts] = useState({ good: 10, warning: 1, critical: 1 });
  const [healthThresholds, setHealthThresholds] = useState({ warning: 80, critical: 60 });
  
  // Temp state for editing in modal
  const [tempThresholds, setTempThresholds] = useState({ warning: 80, critical: 60 });
  const [tempCounts, setTempCounts] = useState({ good: 10, warning: 1, critical: 1 });

  // Filter State
  const [filterFrom, setFilterFrom] = useState(new Date(new Date().setHours(0,0,0,0)).toISOString().slice(0, 16));
  const [filterTo, setFilterTo] = useState(new Date().toISOString().slice(0, 16));
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  
  // Alert Filter State
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning'>('all');

  // Comparison Data State
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  const refreshData = () => {
      setData(db.observation.get());
      setAlertData(db.alerts.get());
      // Small fluctuation for demo
      if (Math.random() > 0.7) {
          setSensorCounts(prev => ({
              ...prev,
              good: Math.max(0, prev.good + (Math.random() > 0.5 ? 1 : -1))
          }));
      }
  };

  useEffect(() => {
    setData(db.observation.get());
    setAlertData(db.alerts.get());

    const handleDbChange = () => {
        setData(db.observation.get());
        setAlertData(db.alerts.get());
    };
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Recalculate Health Score whenever counts change
  useEffect(() => {
      const total = sensorCounts.good + sensorCounts.warning + sensorCounts.critical;
      if (total === 0) {
          setHealthScore(0);
          return;
      }
      // Simple weighted formula: Good=100%, Warning=50%, Critical=0%
      const score = ((sensorCounts.good * 1 + sensorCounts.warning * 0.6 + sensorCounts.critical * 0) / total) * 100;
      setHealthScore(Math.round(score));
  }, [sensorCounts]);

  // Generate chart data for selected alert
  useEffect(() => {
    if (selectedAlert) {
        const isAnomaly = selectedAlert.severity !== 'info';
        const data = generateSensorHistoryForAlert(selectedAlert.sensor, isAnomaly);
        setAlertChartData(data);
    }
  }, [selectedAlert]);

  // Force chart resize on modal open/tab change/filter toggle
  useEffect(() => {
    if (selectedMetric && modalTab === 'chart') {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedMetric, modalTab, isFullscreen, showFilters]);

  // Determine Health Color based on dynamic thresholds
  const healthColor = healthScore >= healthThresholds.warning 
    ? '#22c55e' // Green
    : healthScore >= healthThresholds.critical 
      ? '#f59e0b' // Amber
      : '#ef4444'; // Red

  // NEW: Breakdown Chart Data
  const sensorHealthData = [
    { name: 'Hoạt động tốt', value: sensorCounts.good, color: '#22c55e' },
    { name: 'Cần kiểm tra', value: sensorCounts.warning, color: '#f59e0b' },
    { name: 'Mất tín hiệu', value: sensorCounts.critical, color: '#ef4444' }
  ].filter(item => item.value > 0); // Hide zero segments

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

  const handleSaveHealthSettings = () => {
      setHealthThresholds(tempThresholds);
      setSensorCounts(tempCounts); // Apply count changes
      setShowHealthSettings(false);
      ui.showToast('success', 'Đã cập nhật cấu hình đánh giá sức khỏe');
  };

  const handleRandomize = () => {
      // Randomize counts
      const total = 12;
      const critical = Math.floor(Math.random() * 3); // 0-2
      const warning = Math.floor(Math.random() * 4); // 0-3
      const good = total - critical - warning;
      
      setTempCounts({ good, warning, critical });
  };

  // Helper to determine chart color: Primary year gets metric color, others get contrast colors
  const getSeriesColor = (index: number, baseColor: string) => {
     if (index === 0) return baseColor;
     return COMPARE_COLORS[(index - 1) % COMPARE_COLORS.length];
  };

  // Alert Click Handler
  const handleAlertClick = (alert: AlertLog) => {
      setSelectedAlert(alert);
      setIsAlertFullScreen(false);
  };

  // Filter alerts based on active tab
  const filteredAlerts = alertData.filter(item => {
      if (alertFilter === 'all') return true;
      if (alertFilter === 'critical') return item.severity === 'critical';
      if (alertFilter === 'warning') return item.severity === 'warning';
      return true;
  });

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

        {/* ... (Metrics Cards) ... */}
        {/* Main Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* ... (Existing Metric Cards: WaterLevel, Capacity, Inflow, Outflow) ... */}
          {Object.values(metrics).slice(0, 4).map(metric => (
             <div 
                key={metric.id}
                onClick={() => handleOpenModal(metric)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden group h-56 flex flex-col p-5"
             >
                {/* Simplified re-render of cards for brevity, preserving logic */}
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${metric.id === 'waterLevel' ? 'bg-blue-100 text-blue-600' : metric.id === 'capacity' ? 'bg-cyan-100 text-cyan-600' : metric.id === 'inflow' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} dark:bg-opacity-20`}>
                            {metric.id === 'waterLevel' ? <Droplets size={18}/> : 
                             metric.id === 'capacity' ? <Activity size={18}/> : 
                             metric.id === 'inflow' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                        </div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm uppercase">{metric.label}</span>
                    </div>
                    <Maximize2 size={16} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors"/>
                </div>
                
                <div className="flex-1 flex flex-col relative z-10">
                    <div className="flex items-baseline gap-1 mt-auto">
                        <span className={`text-4xl font-bold tracking-tight ${metric.id === 'waterLevel' ? 'text-slate-800 dark:text-white' : metric.id === 'capacity' ? 'text-slate-800 dark:text-white' : metric.id === 'inflow' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {metric.value.toFixed(metric.id === 'capacity' ? 0 : 2)}
                        </span>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.unit}</span>
                    </div>
                    {/* Visualizer logic simplified for display */}
                    {metric.id === 'waterLevel' ? (
                       <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> 
                             <span>MNDBT: <b>{NORMAL_LEVEL}m</b></span>
                          </div>
                       </div>
                    ) : (
                       <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold w-fit mt-1">
                          {metric.subLabel}
                       </span>
                    )}
                </div>
                
                {metric.id === 'waterLevel' ? (
                    // Water Tank
                    <div className="absolute right-5 bottom-5 h-[calc(100%-3rem)] w-24 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden shadow-inner flex-none">
                        <div className="absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out z-10 bg-gradient-to-t from-blue-600 to-cyan-400 opacity-90" style={{ height: `${waterPercent}%` }}>
                            <div className="wave-bg absolute -top-3 left-0 w-full h-4"></div>
                        </div>
                    </div>
                ) : metric.id === 'capacity' ? (
                    // Pie
                    <div className="absolute right-5 bottom-5 w-28 h-28">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={capacityChartData} innerRadius={30} outerRadius={40} startAngle={90} endAngle={-270} dataKey="value" stroke="none" paddingAngle={2}>
                              <Cell fill="#06b6d4" />
                              <Cell fill="#e2e8f0" className="dark:fill-slate-700"/>
                            </Pie>
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-cyan-700 dark:text-cyan-400 font-bold text-sm">
                           {Math.round((metrics.capacity.value / 646) * 100)}%
                       </div>
                    </div>
                ) : (
                    // Area Chart
                    <div className="h-24 w-[calc(100%+2.5rem)] -ml-5 -mb-5 mt-auto absolute bottom-0 left-0">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metric.historyData}>
                              <defs>
                                  <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={metric.color} stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="value" stroke={metric.color} strokeWidth={2} fill={`url(#grad-${metric.id})`} isAnimationActive={false}/>
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                )}
             </div>
          ))}
        </div>

        {/* --- RAINFALL ANALYSIS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           {/* ... (Rainfall Charts) ... */}
           {/* Recent Rainfall */}
           <div onClick={() => handleOpenModal(metrics.rain_recent)} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:shadow-lg transition-all">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><CloudRain className="text-blue-500" size={18} /> Lượng mưa 3 ngày gần nhất (mm)</h3>
                 <Maximize2 size={16} className="text-slate-300"/>
              </div>
              <div className="flex-1 min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentRainData} barSize={40}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                       <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                       <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
           
           {/* Forecast Rainfall */}
           <div onClick={() => handleOpenModal(metrics.rain_forecast)} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:shadow-lg transition-all">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Clock className="text-purple-500" size={18} /> Dự báo lượng mưa tích lũy (mm)</h3>
                 <Maximize2 size={16} className="text-slate-300"/>
              </div>
              <div className="flex-1 min-h-[200px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastRainData}>
                       <defs>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                       <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                       <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorForecast)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Secondary Data Sections - REDESIGNED */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Latest Sensor Alerts -> REIMAGINED as Alert Center */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <Radio size={20} className="animate-pulse" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white leading-tight">Trung tâm Cảnh báo</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Cập nhật thời gian thực</p>
                 </div>
               </div>
               
               {/* Custom Tab Filter */}
               <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 text-xs font-bold w-full sm:w-auto">
                  <button 
                    onClick={() => setAlertFilter('all')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${alertFilter === 'all' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                  >
                    Tất cả
                  </button>
                  <button 
                    onClick={() => setAlertFilter('critical')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${alertFilter === 'critical' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-red-500'}`}
                  >
                    Nghiêm trọng
                  </button>
                  <button 
                    onClick={() => setAlertFilter('warning')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${alertFilter === 'warning' ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-amber-500'}`}
                  >
                    Cảnh báo
                  </button>
               </div>
            </div>
            
            {/* Scrollable List - INCREASED HEIGHT FOR MORE RECORDS */}
            <div className="flex-1 overflow-y-auto max-h-[400px] hover-scrollbar p-0">
               <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {filteredAlerts.slice(0, 8).map((row) => (
                    <div key={row.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group relative border-l-4 border-transparent hover:border-l-blue-500">
                       {/* Icon Column */}
                       <div className={`mt-1 shrink-0 p-2 rounded-full ${
                          row.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                          row.severity === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' :
                          'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                       }`}>
                          {row.severity === 'critical' ? <WifiOff size={18}/> : 
                           row.severity === 'warning' ? <AlertTriangle size={18}/> : 
                           <AlertCircle size={18}/>}
                       </div>

                       {/* Content Column */}
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <h4 
                                className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate pr-2"
                                onClick={() => setSelectedAlert(row)}
                             >
                                {row.sensor}
                             </h4>
                             {/* UPDATED: Format date using formatDateTime on timestamp if available, else rely on generated time */}
                             <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap font-mono">
                               {row.timestamp ? formatDateTime(row.timestamp) : row.time}
                             </span>
                          </div>
                          
                          {/* Main Message */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-1">{row.message}</p>

                          <div className="flex items-center gap-2 mt-2">
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                row.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                row.severity === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                             }`}>
                                {row.type}
                             </span>
                             <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <MapPin size={10} /> {row.station}
                             </span>
                          </div>
                       </div>

                       {/* Action */}
                       <button className="self-center p-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                          <ArrowRight size={18}/>
                       </button>
                    </div>
                  ))}
                  {filteredAlerts.length === 0 && (
                     <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <Check size={48} className="mb-2 opacity-20"/>
                        <p>Không có cảnh báo nào trong danh mục này</p>
                     </div>
                  )}
               </div>
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 text-center">
               <button 
                 onClick={() => navigate('/alerts')}
                 className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
               >
                 Xem lịch sử cảnh báo đầy đủ
               </button>
            </div>
          </div>

          {/* ... (Rest of dashboard remains same) ... */}
          {/* Sensor Stats -> REIMAGINED as Health Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col h-full relative">
             <div className="flex justify-between items-start mb-4">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="text-purple-600 dark:text-purple-400" size={20} />
                  Sức khỏe Hệ thống
                </h3>
                <button 
                  onClick={() => {
                      setTempThresholds(healthThresholds);
                      setTempCounts(sensorCounts);
                      setShowHealthSettings(true);
                  }}
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  title="Cấu hình"
                >
                   <Settings size={16}/>
                </button>
             </div>
             
             {/* Donut Chart Centerpiece */}
             <div className="flex-1 flex flex-col items-center justify-center relative min-h-[180px]">
                <ResponsiveContainer width="100%" height={180}>
                   <PieChart>
                      <Pie
                        data={sensorHealthData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {sensorHealthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-bold" style={{ color: healthColor }}>{healthScore}%</span>
                   <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Health Score</span>
                </div>
             </div>

             {/* Detailed Stats Legend */}
             <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Hoạt động tốt</span>
                   </div>
                   <span className="text-sm font-bold text-green-600 dark:text-green-400">{sensorCounts.good}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Cần kiểm tra</span>
                   </div>
                   <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{sensorCounts.warning}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Mất tín hiệu</span>
                   </div>
                   <span className="text-sm font-bold text-red-600 dark:text-red-400">{sensorCounts.critical}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- HEALTH SETTINGS MODAL --- */}
      {showHealthSettings && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
              {/* ... (Existing modal content) ... */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sliders size={18} className="text-blue-500"/> Cấu hình đánh giá
                 </h3>
                 <button onClick={() => setShowHealthSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X size={20}/>
                 </button>
              </div>
              
              <div className="p-5 space-y-6">
                 {/* Count Configuration */}
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3 border-b dark:border-slate-700 pb-1">Trạng thái thiết bị</p>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700 dark:text-green-400 font-medium">Hoạt động tốt</span>
                          <input type="number" min="0" className="w-16 border rounded text-center text-sm p-1 dark:bg-slate-700 dark:text-white" value={tempCounts.good} onChange={(e) => setTempCounts({...tempCounts, good: parseInt(e.target.value) || 0})}/>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Cần kiểm tra</span>
                          <input type="number" min="0" className="w-16 border rounded text-center text-sm p-1 dark:bg-slate-700 dark:text-white" value={tempCounts.warning} onChange={(e) => setTempCounts({...tempCounts, warning: parseInt(e.target.value) || 0})}/>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Mất tín hiệu</span>
                          <input type="number" min="0" className="w-16 border rounded text-center text-sm p-1 dark:bg-slate-700 dark:text-white" value={tempCounts.critical} onChange={(e) => setTempCounts({...tempCounts, critical: parseInt(e.target.value) || 0})}/>
                       </div>
                    </div>
                 </div>

                 {/* Threshold Configuration */}
                 <div>
                    <label className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                       <span>Ngưỡng cảnh báo (Warning)</span>
                       <span className="text-amber-600 dark:text-amber-400">{tempThresholds.warning}%</span>
                    </label>
                    <input 
                       type="range" 
                       min="0" max="100" 
                       value={tempThresholds.warning} 
                       onChange={(e) => setTempThresholds({...tempThresholds, warning: parseInt(e.target.value)})}
                       className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                 </div>

                 <div>
                    <label className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                       <span>Ngưỡng nguy hiểm (Critical)</span>
                       <span className="text-red-600 dark:text-red-400">{tempThresholds.critical}%</span>
                    </label>
                    <input 
                       type="range" 
                       min="0" max="100" 
                       value={tempThresholds.critical} 
                       onChange={(e) => setTempThresholds({...tempThresholds, critical: parseInt(e.target.value)})}
                       className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                 </div>

                 <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                    <Activity size={16} className="text-blue-600 mt-0.5 shrink-0"/>
                    <div>
                       <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Giả lập biến động</p>
                       <button 
                          onClick={handleRandomize}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                       >
                          Tạo ngẫu nhiên dữ liệu thiết bị
                       </button>
                    </div>
                 </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                 <button 
                    onClick={() => setShowHealthSettings(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                    onClick={handleSaveHealthSettings}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md"
                 >
                    Lưu cấu hình
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- DETAIL METRIC MODAL --- */}
      {selectedMetric && (
        <div 
          className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-200"
          style={{ marginTop: 0 }}
        >
          {/* ... (Existing Metric Modal) ... */}
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
                {/* NEW: Navigation Button for Water Level Deep Analysis */}
                {selectedMetric.id === 'waterLevel' && (
                   <button 
                     onClick={() => navigate('/water-level')}
                     className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors mr-2 border border-blue-200 dark:border-blue-800"
                     title="Đi tới trang Giám sát Mực nước chi tiết"
                   >
                     <ExternalLink size={14}/> Mở trang Giám sát chuyên sâu
                   </button>
                )}

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

      {/* --- ALERT DETAIL MODAL (NEW) --- */}
      {selectedAlert && (
            <div 
                className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-200"
                style={{ marginTop: 0 }}
            >
                <div className={`bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isAlertFullScreen ? 'w-screen h-screen' : 'w-[90vw] h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700'}`}>
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center flex-none">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg text-white shadow-md ${selectedAlert.severity === 'critical' ? 'bg-red-600' : selectedAlert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                {selectedAlert.sensor.toLowerCase().includes('mưa') ? <CloudRain size={24}/> : 
                                 selectedAlert.sensor.toLowerCase().includes('nhiệt') ? <Thermometer size={24}/> :
                                 <Gauge size={24}/>}
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {selectedAlert.sensor}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1"><MapPin size={12}/> {selectedAlert.station}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setIsAlertFullScreen(!isAlertFullScreen)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"
                            >
                                {isAlertFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </button>
                            <button 
                                onClick={() => setSelectedAlert(null)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Context Banner */}
                    <div className={`px-6 py-3 border-b flex items-start gap-3 ${selectedAlert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50'}`}>
                        <AlertCircle size={20} className={`shrink-0 mt-0.5 ${selectedAlert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
                        <div>
                            <p className={`text-sm font-bold ${selectedAlert.severity === 'critical' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                                {selectedAlert.type}: {selectedAlert.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock size={10}/> Thời điểm ghi nhận: {selectedAlert.timestamp ? formatDateTime(selectedAlert.timestamp) : selectedAlert.time}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-6 space-y-4">
                        <div className="h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="99%" height="100%">
                                    <AreaChart data={alertChartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                        <defs>
                                            <linearGradient id="colorValueAlert" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={selectedAlert.severity === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={selectedAlert.severity === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                                        <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} interval={4} />
                                        <YAxis label={{ value: 'Giá trị', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{fontSize: 12, fill: '#64748b'}} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        
                                        {/* Reference Line showing Alert Time (Simulated at recent points) */}
                                        <ReferenceLine x={alertChartData[alertChartData.length - 2]?.label} stroke="red" strokeDasharray="3 3" label={{ value: 'Thời điểm cảnh báo', position: 'insideTopLeft', fill: 'red', fontSize: 12 }} />
                                        
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke={selectedAlert.severity === 'critical' ? '#ef4444' : '#3b82f6'} 
                                            fill="url(#colorValueAlert)" 
                                            strokeWidth={3}
                                            name={selectedAlert.sensor}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
      )}
    </>
  );
};
