import React, { useState, useMemo } from 'react';
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
import { Save, Table as TableIcon, CheckCircle, TrendingUp, Filter, CalendarDays } from 'lucide-react';
import { db } from '../utils/db';
import { WaterLevelRecord } from '../types';

// Years for selection (including future years for simulation)
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022];
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea']; // Blue, Red, Green, Amber, Purple

export const WaterLevelView: React.FC = () => {
  const [dbData, setDbData] = useState<WaterLevelRecord[]>(db.waterLevels.get());
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  
  // Filter States
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  
  // Default range: From yesterday to today
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatForInput = (d: Date) => d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

  const [fromDate, setFromDate] = useState(formatForInput(yesterday));
  const [toDate, setToDate] = useState(formatForInput(now));
  
  const [notification, setNotification] = useState(false);

  // --- Logic to Generate/Filter Data ---
  
  const processedData = useMemo(() => {
    const resultRecords: (WaterLevelRecord & { year: number })[] = [];
    
    // Parse filter bounds (Day/Month/Hour/Minute only)
    const startObj = new Date(fromDate);
    const endObj = new Date(toDate);
    
    // Helper to get comparable value for "Day/Month Hour:Minute"
    // We set all dates to a leap year (e.g., 2024) to handle comparison correctly
    const getComparisonTime = (d: Date) => {
      const temp = new Date(2024, d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
      return temp.getTime();
    };

    const startTime = getComparisonTime(startObj);
    const endTime = getComparisonTime(endObj);

    // Loop through selected years
    selectedYears.forEach(year => {
      // 1. Get real data from DB for this year
      const yearRecords = dbData.filter(r => new Date(r.time).getFullYear() === year);
      
      // 2. If no data for this year, generate MOCK data for demo/simulation
      if (yearRecords.length === 0) {
         // Mock based on existing data pattern (or random if empty)
         const baseData = dbData.length > 0 ? dbData : Array.from({length: 24}).map((_, i) => ({
             id: `base-${i}`, 
             time: new Date(new Date().setHours(i, 0, 0, 0)).toISOString(), 
             level: 35
         }));

         baseData.forEach((r, idx) => {
           // Create a date object for the selected year but keeping the month/day/time of the base record
           // Note: This is a simplification. In a real app, we'd generate a full time series.
           // Here we just take the 'base' records and project them into the selected year.
           const origDate = new Date(r.time);
           const newDate = new Date(origDate);
           newDate.setFullYear(year);
           
           // Add some noise to make years look different
           // Use year as seed for consistent noise
           const noise = Math.sin(idx + year) * 2; 
           
           const mockRecord = {
             id: `mock-${year}-${idx}`, // ID indicates it's a mock
             time: newDate.toISOString(),
             level: parseFloat((r.level + noise).toFixed(2)),
             year: year
           };
           
           resultRecords.push(mockRecord);
         });
      } else {
        yearRecords.forEach(r => resultRecords.push({ ...r, year }));
      }
    });

    // 3. Filter by Time Range (Day/Month)
    return resultRecords.filter(item => {
      const itemTime = getComparisonTime(new Date(item.time));
      // Handle range crossing year boundary if needed (ignored for simplicity here)
      return itemTime >= startTime && itemTime <= endTime;
    }).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  }, [dbData, selectedYears, fromDate, toDate]);

  // --- Chart Data Transformation ---
  const chartData = useMemo(() => {
    const map = new Map<string, any>();

    processedData.forEach(record => {
      const d = new Date(record.time);
      const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      
      if (!map.has(label)) {
        map.set(label, { timeLabel: label });
      }
      const entry = map.get(label);
      entry[record.year] = record.level;
    });

    // Sort by time within year
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

    // 2. If modifying a MOCK record, we need to "materialize" all mock data for that year 
    // into real data so the user can save it.
    const targetRecord = processedData.find(r => r.id === id);
    if (!targetRecord) return;

    const yearToMaterialize = targetRecord.year;
    
    // Find all mocks for this year currently displayed
    const mocksToConvert = processedData.filter(r => r.year === yearToMaterialize && r.id.startsWith('mock-'));
    
    const newRealRecords = mocksToConvert.map(r => ({
      id: r.id.replace('mock-', 'sim-'), // Convert ID to simulated
      time: r.time,
      // Apply the update if this is the target record
      level: r.id === id && field === 'level' ? parseFloat(value) : r.level,
      // Handle time update if needed (though UI prevents mock time update usually, let's allow it)
      ...(r.id === id && field === 'time' ? { time: value } : {})
    }));

    // Save to DB state (merging with existing)
    setDbData(prev => [...prev, ...newRealRecords]);
  };

  const handleSave = () => {
    db.waterLevels.set(dbData);
    setNotification(true);
    setTimeout(() => setNotification(false), 3000);
  };

  return (
    <div className="space-y-4 pb-10 animate-fade-in h-full flex flex-col">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Giám sát Mực nước</h2>
        
        {notification && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium animate-bounce border border-green-200 dark:border-green-800">
            <CheckCircle size={16}/> Đã lưu dữ liệu thành công
          </div>
        )}
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
            </div>
            {chartData.length === 0 && (
              <div className="text-center text-slate-400 dark:text-slate-500 py-10">
                Không có dữ liệu hiển thị cho bộ lọc này
              </div>
            )}
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
               <button 
                onClick={handleSave}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-200 dark:shadow-blue-900/50 transition-all hover:scale-105 active:scale-95"
               >
                 <Save size={18}/> Lưu thay đổi
               </button>
            </div>
            
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 w-24 text-center">Năm</th>
                    <th className="px-6 py-4 w-1/3">Thời gian</th>
                    <th className="px-6 py-4">Mực nước hồ (m)</th>
                    <th className="px-6 py-4 text-right">Loại dữ liệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {processedData.map((row, index) => (
                    <tr key={`${row.id}-${index}`} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${row.year > new Date().getFullYear() ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                          {row.year}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                         <input 
                           type="datetime-local"
                           value={row.time.slice(0, 16)}
                           onChange={(e) => handleUpdateRecord(row.id, 'time', e.target.value)}
                           className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 rounded px-3 py-1.5 outline-none transition-all font-medium text-slate-700 dark:text-slate-300"
                         />
                      </td>
                      <td className="px-6 py-2">
                        <div className="relative">
                          <input 
                             type="number"
                             step="0.01"
                             value={row.level}
                             onChange={(e) => handleUpdateRecord(row.id, 'level', e.target.value)}
                             className="w-full font-bold text-blue-700 dark:text-blue-400 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 rounded px-3 py-1.5 outline-none transition-all pl-3"
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
                  ))}
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