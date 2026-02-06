
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, Filter, Search, Download, CheckCircle, WifiOff, AlertCircle, 
  MapPin, Clock, ArrowRight, Activity, BellRing, Eye, RotateCcw, MoreHorizontal, ChevronDown,
  X, Maximize2, Minimize2, CloudRain, Thermometer, Gauge, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { db } from '../utils/db';
import { AlertLog, SensorItem } from '../types';
import { exportToExcel } from '../utils/excel';
import { useUI } from '../components/GlobalUI';

// Helper for strict date formatting
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

// --- Helper: Generate Mock History for Chart (Local version) ---
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

export const AlertHistoryView: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  
  // Modal State
  const [selectedAlert, setSelectedAlert] = useState<AlertLog | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const ui = useUI();

  useEffect(() => {
    // Load from DB
    setAlerts(db.alerts.get());
    
    const handleDbChange = () => setAlerts(db.alerts.get());
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Prepare chart data when an alert is selected
  useEffect(() => {
      if (selectedAlert) {
          const isAnomaly = selectedAlert.severity !== 'info';
          const data = generateSensorHistoryForAlert(selectedAlert.sensor, isAnomaly);
          setChartData(data);
      }
  }, [selectedAlert]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [filterSeverity, filterStatus, searchTerm]);

  // Filter Logic
  const filteredAlerts = alerts.filter(alert => {
    // Exclude 'info' severity completely
    if (alert.severity === 'info') return false;

    const matchSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchSearch = alert.sensor.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        alert.station.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSeverity && matchStatus && matchSearch;
  });

  const displayedAlerts = filteredAlerts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const handleExport = () => {
    const exportData = filteredAlerts.map(a => ({
      'Thời gian': a.timestamp ? formatDateTime(a.timestamp) : a.time,
      'Cảm biến': a.sensor,
      'Loại cảnh báo': a.type,
      'Mức độ': a.severity === 'critical' ? 'Nghiêm trọng' : a.severity === 'warning' ? 'Cảnh báo' : 'Thông tin',
      'Vị trí': a.station,
      'Nội dung': a.message,
      'Trạng thái': a.status === 'new' ? 'Mới' : a.status === 'acknowledged' ? 'Đã tiếp nhận' : 'Đã xử lý'
    }));
    exportToExcel(exportData, 'Lich_su_canh_bao');
  };

  const handleStatusChange = (id: string, newStatus: 'new' | 'acknowledged' | 'resolved') => {
    const updated = alerts.map(a => a.id === id ? { ...a, status: newStatus } : a);
    db.alerts.set(updated); // This triggers the listener which updates local state
    
    // Optional: Show toast for feedback
    if (newStatus === 'acknowledged') ui.showToast('success', 'Đã tiếp nhận cảnh báo');
    if (newStatus === 'resolved') ui.showToast('success', 'Đã xử lý cảnh báo');
    if (newStatus === 'new') ui.showToast('info', 'Đã hoàn tác về trạng thái Mới');
  };

  const handleSensorClick = (alert: AlertLog) => {
      setSelectedAlert(alert);
      setIsFullScreen(false);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 whitespace-nowrap">Nghiêm trọng</span>;
      case 'warning': return <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 whitespace-nowrap">Cảnh báo</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 whitespace-nowrap">Thông tin</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Mới</span>;
      case 'acknowledged': return <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap"><Eye size={12}/> Đã xem</span>;
      case 'resolved': return <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 whitespace-nowrap"><CheckCircle size={12}/> Đã xử lý</span>;
      default: return null;
    }
  };

  const ActionButtons = ({ alert, isMobile = false }: { alert: AlertLog, isMobile?: boolean }) => (
    <div className={`flex items-center gap-2 ${isMobile ? 'justify-end w-full' : 'justify-center'}`}>
        {alert.status === 'new' && (
            <button 
                onClick={() => handleStatusChange(alert.id, 'acknowledged')}
                className={`p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors ${isMobile ? 'flex-1 bg-blue-50 dark:bg-blue-900/10 justify-center' : ''}`}
                title="Tiếp nhận"
            >
                {isMobile ? <span className="flex items-center gap-2 text-sm font-bold"><Eye size={16}/> Tiếp nhận</span> : <Eye size={18}/>}
            </button>
        )}
        {alert.status === 'acknowledged' && (
            <>
                <button 
                onClick={() => handleStatusChange(alert.id, 'new')}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Hoàn tác (Về Mới)"
                >
                <RotateCcw size={18}/>
                </button>
                <button 
                onClick={() => handleStatusChange(alert.id, 'resolved')}
                className={`p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors ${isMobile ? 'flex-1 bg-green-50 dark:bg-green-900/10 justify-center' : ''}`}
                title="Đánh dấu đã xử lý"
                >
                {isMobile ? <span className="flex items-center gap-2 text-sm font-bold"><CheckCircle size={16}/> Xử lý xong</span> : <CheckCircle size={18}/>}
                </button>
            </>
        )}
        {alert.status === 'resolved' && (
            <button 
                onClick={() => handleStatusChange(alert.id, 'acknowledged')}
                className={`p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${isMobile ? 'flex-1 bg-slate-100 dark:bg-slate-700/50 justify-center' : ''}`}
                title="Hoàn tác (Về Đã tiếp nhận)"
            >
                {isMobile ? <span className="flex items-center gap-2 text-sm font-bold"><RotateCcw size={16}/> Hoàn tác</span> : <RotateCcw size={18}/>}
            </button>
        )}
    </div>
  );

  return (
    <>
        <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={28} />
                Lịch sử Cảnh báo & Sự kiện
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Toàn bộ nhật ký cảnh báo từ cảm biến và hệ thống SCADA</p>
            </div>
            <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all"
            >
            <Download size={16}/> Xuất dữ liệu
            </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
            {/* Filters Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col xl:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-64">
                    <input 
                    type="text" 
                    placeholder="Tìm kiếm thiết bị, nội dung..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                </div>

                {/* Severity Filter */}
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1 overflow-x-auto no-scrollbar max-w-full">
                    {['all', 'critical', 'warning'].map((sev) => (
                        <button
                        key={sev}
                        onClick={() => setFilterSeverity(sev as any)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize whitespace-nowrap ${filterSeverity === sev ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                        >
                        {sev === 'all' ? 'Tất cả' : sev === 'critical' ? 'Nghiêm trọng' : sev === 'warning' ? 'Cảnh báo' : 'Thông tin'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 pr-8 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_10px_center] bg-no-repeat w-full xl:w-auto"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="new">Mới</option>
                    <option value="acknowledged">Đã tiếp nhận</option>
                    <option value="resolved">Đã xử lý</option>
                </select>
            </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-900/20">
                {filteredAlerts.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                            <BellRing size={48} className="mb-3 opacity-20"/>
                            <p>Không tìm thấy bản ghi nào phù hợp</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* DESKTOP TABLE VIEW (MD+) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4 w-40">Thời gian</th>
                                        <th className="px-6 py-4 w-32">Mức độ</th>
                                        <th className="px-6 py-4 w-48">Thiết bị / Cảm biến</th>
                                        <th className="px-6 py-4">Nội dung chi tiết</th>
                                        <th className="px-6 py-4 w-32">Trạng thái</th>
                                        <th className="px-6 py-4 w-24 text-center">Tác vụ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                    {displayedAlerts.map(alert => (
                                        <tr key={alert.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${alert.status === 'new' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono text-xs">
                                                    <Clock size={14} className="text-slate-400"/>
                                                    {/* UPDATED: Format date using timestamp if available */}
                                                    {alert.timestamp ? formatDateTime(alert.timestamp) : alert.time}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getSeverityBadge(alert.severity)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div 
                                                    className="font-bold text-blue-600 dark:text-blue-400 mb-0.5 cursor-pointer hover:underline"
                                                    onClick={() => handleSensorClick(alert)}
                                                    title="Xem chi tiết thiết bị"
                                                >
                                                    {alert.sensor}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <MapPin size={10}/> {alert.station}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2">
                                                    <div className={`mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {alert.severity === 'critical' ? <WifiOff size={16}/> : <Activity size={16}/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1 uppercase tracking-wide">{alert.type}</p>
                                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{alert.message}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(alert.status)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <ActionButtons alert={alert} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARD VIEW (< MD) */}
                        <div className="md:hidden p-4 space-y-4">
                            {displayedAlerts.map(alert => (
                                <div key={alert.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            {getSeverityBadge(alert.severity)}
                                            {getStatusBadge(alert.status)}
                                        </div>
                                        {/* UPDATED: Format date using timestamp if available */}
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {alert.timestamp ? formatDateTime(alert.timestamp) : alert.time}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h4 
                                            className="font-bold text-blue-600 dark:text-blue-400 text-base cursor-pointer hover:underline"
                                            onClick={() => handleSensorClick(alert)}
                                        >
                                            {alert.sensor}
                                        </h4>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <MapPin size={12}/> {alert.station}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                                            {alert.severity === 'critical' ? <WifiOff size={14} className="text-red-500"/> : <Activity size={14} className="text-blue-500"/>}
                                            {alert.type}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{alert.message}</p>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <ActionButtons alert={alert} isMobile={true} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            
            {/* Load More Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Hiển thị {displayedAlerts.length} / {filteredAlerts.length} bản ghi
            </div>
            {filteredAlerts.length > displayedAlerts.length && (
                <button 
                    onClick={handleLoadMore}
                    className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2"
                >
                    <ChevronDown size={14}/> Tải thêm dữ liệu cũ hơn
                </button>
            )}
            </div>
        </div>
        </div>

        {/* --- DETAIL MODAL WITH CONTEXT --- */}
        {selectedAlert && (
            <div 
                className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-200"
                style={{ marginTop: 0 }}
            >
                <div className={`bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullScreen ? 'w-screen h-screen' : 'w-[90vw] h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-700'}`}>
                    
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
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full transition-colors hidden md:block"
                            >
                                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
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
                                {/* UPDATED: Format date */}
                                <Clock size={10}/> Thời điểm ghi nhận: {selectedAlert.timestamp ? formatDateTime(selectedAlert.timestamp) : selectedAlert.time}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900 p-6 space-y-4">
                        <div className="h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex flex-col">
                            <div className="flex-1 w-full min-h-[300px]">
                                <ResponsiveContainer width="99%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={selectedAlert.severity === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={selectedAlert.severity === 'critical' ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5} />
                                        <XAxis dataKey="label" tick={{fontSize: 12, fill: '#64748b'}} interval={4} />
                                        <YAxis label={{ value: 'Giá trị', angle: -90, position: 'insideLeft', fill: '#64748b' }} tick={{fontSize: 12, fill: '#64748b'}} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        
                                        {/* Reference Line showing Alert Time (Simulated at recent points) */}
                                        <ReferenceLine x={chartData[chartData.length - 2]?.label} stroke="red" strokeDasharray="3 3" label={{ value: 'Thời điểm cảnh báo', position: 'insideTopLeft', fill: 'red', fontSize: 12 }} />
                                        
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke={selectedAlert.severity === 'critical' ? '#ef4444' : '#3b82f6'} 
                                            fill="url(#colorValue)" 
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
