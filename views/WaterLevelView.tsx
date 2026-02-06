
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Save, Table as TableIcon, CheckCircle, TrendingUp, Filter, CalendarDays, RefreshCw, Check, Download } from 'lucide-react';
import { db } from '../utils/db';
import { WaterLevelRecord } from '../types';
import { exportToExcel } from '../utils/excel';

// Years for selection (including future years for simulation)
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022];
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea']; // Blue, Red, Green, Amber, Purple

export const WaterLevelView: React.FC = () => {
  const [dbData, setDbData] = useState<WaterLevelRecord[]>(db.waterLevels.get());
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  
  // Filter States
  const [selectedYears, setSelectedYears] = useState<number[]>([2026]);
  
  // Default range: Specific dates in 2026 as requested
  const [fromDate, setFromDate] = useState('2026-01-19T00:00');
  const [toDate, setToDate] = useState('2026-01-20T23:59');
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // --- Logic to Generate/Filter Data ---
  
  const processedData = useMemo(() => {
    const resultRecords: (WaterLevelRecord & { year: number })[] = [];
    
    // Parse filter bounds
    const startObj = new Date(fromDate);
    const endObj = new Date(toDate);
    
    // Calculate total hours in the range to generate adequate mock data
    const durationMs = endObj.getTime() - startObj.getTime();
    const totalHours = Math.max(24, Math.ceil(durationMs / (1000 * 60 * 60)));

    // Helper to get normalized comparison time (ignoring year)
    // We map everything to a leap year (2024) to handle day/month comparisons
    const getComparisonTime = (d: Date) => {
      const temp = new Date(2024, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
      return temp.getTime();
    };

    const rangeStartTime = getComparisonTime(startObj);
    const rangeEndTime = getComparisonTime(endObj);

    // If the range crosses year boundary (e.g. Dec to Jan), simple comparison fails.
    // For this demo, we assume ranges are within a calendar year or short duration.

    selectedYears.forEach(year => {
      // 1. Get real data from DB for this year
      const rawYearRecords = dbData.filter(r => new Date(r.time).getFullYear() === year);
      
      // Filter real data by the time range (ignoring year part of the record)
      const validRealRecords = rawYearRecords.filter(item => {
          const itemTime = getComparisonTime(new Date(item.time));
          // Simple inclusion check
          return itemTime >= rangeStartTime && itemTime <= rangeEndTime;
      });
      
      // 2. If we have substantial real data, use it. 
      // Otherwise, generate mock data for the WHOLE range to ensure chart looks "full".
      if (validRealRecords.length > 0) {
         validRealRecords.forEach(r => resultRecords.push({ ...r, year }));
      } else {
         // --- MOCK DATA GENERATION ---
         // Generate points for every hour in the range
         for (let i = 0; i <= totalHours; i++) {
             // Create date relative to startObj but set to target Year
             const t = new Date(startObj.getTime() + (i * 60 * 60 * 1000));
             t.setFullYear(year); 
             
             // Simulation Math
             const h = t.getHours();
             // Base level varies by year to separate lines visually (e.g. 2022->30, 2023->35)
             const yearBase = 30 + ((year % 5) * 5); 
             
             // Add daily tide/operation cycle (sin wave)
             const daily = Math.sin((h / 24) * Math.PI * 2) * 0.5;
             
             // Add a longer trend (flood/drain) over the period
             const trend = Math.cos((i / totalHours) * Math.PI) * 2;
             
             // Random noise for realism
             const noise = (Math.random() - 0.5) * 0.3;

             const level = parseFloat((yearBase + daily + trend + noise).toFixed(2));

             resultRecords.push({
                 id: `mock-${year}-${i}`, // Mark ID as mock
                 time: t.toISOString(),
                 level,
                 year
             });
         }
      }
    });

    return resultRecords.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  }, [dbData, selectedYears, fromDate, toDate]);

  // --- Chart Data Transformation ---
  const chartData = useMemo(() => {
    const map = new Map<string, any>();

    processedData.forEach(record => {
      const d = new Date(record.time);
      // Format: dd/mm HH:mm
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      
      if (!map.has(label)) {
        map.set(label, { timeLabel: label });
      }
      const entry = map.get(label);
      entry[record.year] = record.level;
    });

    // Sort by time within year (Month -> Day -> Time)
    return Array.from(map.values()).sort((a, b) => {
        const getTimeInYear = (lbl: string) => {
           const [datePart, timePart] = lbl.split(' ');
           const [day, month] = datePart.split('/');
           return parseInt(month) * 1000000 + parseInt(day) * 10000 + parseInt(timePart.replace(':', ''));
        };
        return getTimeInYear(a.timeLabel) - getTimeInYear(b.timeLabel);
    });
  }, [processedData]);


  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year) 
        : [...prev, year]
    );
  };

  const handleUpdateRecord = (id: string, field: 'time' | 'level', value: any) => {
    // 1. If modifying a real record, update it directly
    if (!id.startsWith('mock-')) {
       setDbData(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: field === 'level' ? parseFloat(value) : value };
        }
        return item;
       }));
       return;
    }

    // 2. If modifying a MOCK record, we need to "materialize" it into a real record
    const targetRecord = processedData.find(r => r.id === id);
    if (!targetRecord) return;

    // Convert only the edited record + maybe neighbors if we wanted to be fancy, but let's just do the target for now
    // Actually, to persist a "scenario", we probably want to save the whole mock series?
    // For simplicity, we just materialize the single edited point and let the rest stay mock.
    // BUT, if we save, we usually want to save what we see. 
    // Let's materialize the *entire* series for that year so the line doesn't break.
    const yearToMaterialize = targetRecord.year;
    const mocksToConvert = processedData.filter(r => r.year === yearToMaterialize && r.id.startsWith('mock-'));
    
    const newRealRecords = mocksToConvert.map(r => ({
      id: r.id.replace('mock-', 'sim-'), // Convert ID to simulated
      time: r.time,
      level: r.id === id && field === 'level' ? parseFloat(value) : r.level,
      ...(r.id === id && field === 'time' ? { time: value } : {})
    }));

    setDbData(prev => [...prev, ...newRealRecords]);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
        db.waterLevels.set(dbData);
        setSaveStatus('saved');
    }, 600);
  };

  const handleExport = () => {
    const headers = ['Năm', 'Thời gian', 'Mực nước (m)', 'Loại dữ liệu'];
    
    const exportData = processedData.map(row => {
      const d = new Date(row.time);
      const pad = (n: number) => n.toString().padStart(2, '0');
      // Format: dd/mm/yyyy hh:mm:ss
      const formattedTime = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      
      return {
        'Năm': row.year,
        'Thời gian': formattedTime,
        'Mực nước (m)': row.level,
        'Loại dữ liệu': row.id.startsWith('mock-') ? 'Mô phỏng' : 'Thực đo'
      };
    });
    exportToExcel(exportData, 'Giam_sat_muc_nuoc', headers);
  };

  // Helper for datetime-local input
  const formatForInput = (date: Date) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="space-y-4 pb-10 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Giám sát Mực nước</h2>
      </div>

      {/* FILTER SECTION - Compact Single Row Layout */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-3 items-end lg:items-center">
        
        {/* Date Inputs */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 lg:w-auto">
               <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Từ ngày giờ</label>
               <input 
                 type="datetime-local" 
                 value={fromDate}
                 onChange={(e) => setFromDate(e.target.value)}
                 className="w-full lg:w-40 h-9 border border-slate-300 dark:border-slate-600 rounded-lg px-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 dark:text-white dark:bg-slate-700"
               />
            </div>

            <div className="flex-1 lg:w-auto">
               <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Đến ngày giờ</label>
               <input 
                 type="datetime-local" 
                 value={toDate}
                 onChange={(e) => setToDate(e.target.value)}
                 className="w-full lg:w-40 h-9 border border-slate-300 dark:border-slate-600 rounded-lg px-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 dark:text-white dark:bg-slate-700"
               />
            </div>
        </div>

        {/* Year Selector */}
        <div className="flex-1 w-full lg:w-auto">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
             <CalendarDays size={10}/> Năm so sánh
          </label>
          <div className="flex flex-wrap gap-1">
            {AVAILABLE_YEARS.map((year, index) => {
              const isSelected = selectedYears.includes(year);
              const color = COLORS[index % COLORS.length];
              return (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5
                    ${isSelected 
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white border-slate-300 dark:border-slate-500 shadow-inner' 
                      : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'}
                  `}
                >
                  {year}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full ring-1 ring-white" style={{ backgroundColor: color }}></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Button */}
        <div className="w-full lg:w-auto">
           <button className="w-full lg:w-auto h-9 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/50 flex items-center justify-center gap-2 whitespace-nowrap mt-4 lg:mt-0">
             <Filter size={14}/> Lọc dữ liệu
           </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mt-2">
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'chart' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp size={18} /> Biểu đồ so sánh
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'table' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <TableIcon size={18} /> Bảng biểu chi tiết
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        {activeTab === 'chart' ? (
          <div className="p-6 h-full flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-center">Biểu đồ so sánh mực nước qua các năm</h3>
            <div className="flex-1 w-full min-h-[400px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis 
                      dataKey="timeLabel" 
                      tick={{fontSize: 12, fill: '#64748b'}}
                      minTickGap={30}
                      tickLine={false}
                      axisLine={{ stroke: '#475569', strokeOpacity: 0.3 }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      label={{ value: 'Mực nước (m)', angle: -90, position: 'insideLeft', fill: '#64748b' }} 
                      tick={{fontSize: 12, fill: '#64748b'}}
                      tickLine={false}
                      axisLine={{ stroke: '#475569', strokeOpacity: 0.3 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'var(--tooltip-bg, #fff)' }}
                      itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                      labelStyle={{ marginBottom: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    {selectedYears.map((year, index) => (
                      <Line 
                        key={year}
                        type="monotone" 
                        dataKey={year} 
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name={`Năm ${year}`}
                        connectNulls
                        animationDuration={1500}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-4">
                        <Filter className="text-slate-400 dark:text-slate-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa có dữ liệu hiển thị</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                        Vui lòng điều chỉnh bộ lọc <b>Thời gian</b> và chọn <b>Năm</b> phù hợp để xem dữ liệu so sánh.
                    </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <div className="flex items-center gap-3">
                 <h3 className="font-bold text-slate-800 dark:text-white">Dữ liệu chi tiết</h3>
                 <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded font-mono">
                   {processedData.length} RECORDS
                 </span>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all"
                 >
                   <Download size={18}/> Xuất Excel
                 </button>
                 <button 
                  onClick={handleSave}
                  disabled={saveStatus !== 'idle'}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold shadow-md transition-all ${
                      saveStatus === 'saved' 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : saveStatus === 'saving'
                          ? 'bg-blue-400 text-white cursor-wait'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                 >
                   {saveStatus === 'saving' ? (
                      <><RefreshCw size={18} className="animate-spin"/> Đang lưu...</>
                   ) : saveStatus === 'saved' ? (
                      <><Check size={18}/> Đã lưu</>
                   ) : (
                      <><Save size={18}/> Lưu thay đổi</>
                   )}
                 </button>
               </div>
            </div>
            
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 w-24 text-center">Năm</th>
                    <th className="px-6 py-4 w-1/3">Thời gian (dd/MM/yyyy HH:mm:ss)</th>
                    <th className="px-6 py-4">Mực nước hồ (m)</th>
                    <th className="px-6 py-4 text-right">Loại dữ liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {processedData.map((row, index) => {
                    const d = new Date(row.time);
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    const formattedDisplayTime = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    
                    return (
                    <tr key={`${row.id}-${index}`} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${row.year > new Date().getFullYear() ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                          {row.year}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                         <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-400 font-mono">{formattedDisplayTime}</span>
                            <input 
                              type="datetime-local"
                              value={formatForInput(d)}
                              onChange={(e) => handleUpdateRecord(row.id, 'time', e.target.value)}
                              className="w-8 opacity-0 focus:opacity-100 hover:opacity-100 cursor-pointer"
                              title="Chỉnh sửa thời gian"
                            />
                         </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="relative">
                          <input 
                             type="number"
                             step="0.01"
                             value={row.level}
                             onChange={(e) => handleUpdateRecord(row.id, 'level', e.target.value)}
                             className="w-full font-bold text-blue-600 dark:text-blue-400 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 rounded px-3 py-1.5 outline-none transition-all pl-3"
                           />
                           <span className="absolute right-8 top-1.5 text-xs text-slate-400 pointer-events-none group-hover:opacity-0">m</span>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-right">
                        {row.id.startsWith('mock-') ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-100 dark:border-amber-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Mô phỏng
                          </span>
                        ) : row.id.startsWith('sim-') ? (
                           <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-medium border border-purple-100 dark:border-purple-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Đã lưu (Sim)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-100 dark:border-green-900/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Thực đo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                  {processedData.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                         Không có dữ liệu trong khoảng thời gian này
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
