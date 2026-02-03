
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Filter, Search, Download, CheckCircle, WifiOff, AlertCircle, 
  MapPin, Clock, ArrowRight, Activity, BellRing, Eye
} from 'lucide-react';
import { db } from '../utils/db';
import { AlertLog } from '../types';
import { exportToExcel } from '../utils/excel';
import { useUI } from '../components/GlobalUI';

export const AlertHistoryView: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const ui = useUI();

  useEffect(() => {
    // Load from DB
    setAlerts(db.alerts.get());
    
    const handleDbChange = () => setAlerts(db.alerts.get());
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Filter Logic
  const filteredAlerts = alerts.filter(alert => {
    const matchSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchSearch = alert.sensor.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        alert.station.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSeverity && matchStatus && matchSearch;
  });

  const handleExport = () => {
    const exportData = filteredAlerts.map(a => ({
      'Thời gian': a.time,
      'Cảm biến': a.sensor,
      'Loại cảnh báo': a.type,
      'Mức độ': a.severity === 'critical' ? 'Nghiêm trọng' : a.severity === 'warning' ? 'Cảnh báo' : 'Thông tin',
      'Vị trí': a.station,
      'Nội dung': a.message,
      'Trạng thái': a.status === 'new' ? 'Mới' : a.status === 'acknowledged' ? 'Đã tiếp nhận' : 'Đã xử lý'
    }));
    exportToExcel(exportData, 'Lich_su_canh_bao');
  };

  const handleAction = (id: string, action: 'acknowledge' | 'resolve') => {
    if (action === 'acknowledge') {
      db.alerts.acknowledge(id);
      ui.showToast('success', 'Đã tiếp nhận cảnh báo');
    } else {
      db.alerts.resolve(id);
      ui.showToast('success', 'Đã xử lý cảnh báo');
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">Nghiêm trọng</span>;
      case 'warning': return <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Cảnh báo</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Thông tin</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="flex items-center gap-1 text-xs font-bold text-red-600"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Mới</span>;
      case 'acknowledged': return <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Eye size={12}/> Đã xem</span>;
      case 'resolved': return <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle size={12}/> Đã xử lý</span>;
      default: return null;
    }
  };

  return (
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
              <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                 {['all', 'critical', 'warning', 'info'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev as any)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${filterSeverity === sev ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
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
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
              >
                 <option value="all">Tất cả trạng thái</option>
                 <option value="new">Mới</option>
                 <option value="acknowledged">Đã tiếp nhận</option>
                 <option value="resolved">Đã xử lý</option>
              </select>
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {filteredAlerts.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center">
                             <BellRing size={48} className="mb-3 opacity-20"/>
                             <p>Không tìm thấy bản ghi nào phù hợp</p>
                          </div>
                       </td>
                    </tr>
                 ) : (
                    filteredAlerts.map(alert => (
                       <tr key={alert.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${alert.status === 'new' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono text-xs">
                                <Clock size={14} className="text-slate-400"/>
                                {alert.time}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             {getSeverityBadge(alert.severity)}
                          </td>
                          <td className="px-6 py-4">
                             <div className="font-bold text-slate-800 dark:text-white mb-0.5">{alert.sensor}</div>
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
                             {alert.status === 'new' && (
                                <button 
                                  onClick={() => handleAction(alert.id, 'acknowledge')}
                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Tiếp nhận"
                                >
                                   <Eye size={18}/>
                                </button>
                             )}
                             {alert.status === 'acknowledged' && (
                                <button 
                                  onClick={() => handleAction(alert.id, 'resolve')}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                  title="Đánh dấu đã xử lý"
                                >
                                   <CheckCircle size={18}/>
                                </button>
                             )}
                          </td>
                       </tr>
                    ))
                 )}
              </tbody>
           </table>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-xs text-center text-slate-500">
           Hiển thị {filteredAlerts.length} bản ghi
        </div>
      </div>
    </div>
  );
};
