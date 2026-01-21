import React, { useState, useEffect } from 'react';
import { OperationTable } from '../types';
import { db } from '../utils/db';
import { exportToExcel } from '../utils/excel';
import { Save, Calendar, Search, RefreshCw, Check, Download } from 'lucide-react';

export const OperationView: React.FC = () => {
  const [tables, setTables] = useState<OperationTable[]>(db.operationTables.get());
  const [activeTabId, setActiveTabId] = useState<string>('supply_limit');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const activeTable = tables.find(t => t.id === activeTabId);

  const handleUpdateCell = (tableId: string, rowId: string, col: 'col1' | 'col2' | 'col3', val: string) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        data: t.data.map(r => r.id === rowId ? { ...r, [col]: val } : r)
      };
    }));
  };

  const saveAll = () => {
    setSaveStatus('saving');
    setTimeout(() => {
        db.operationTables.set(tables);
        setSaveStatus('saved');
    }, 600);
  };

  const handleExport = () => {
    if(!activeTable) return;
    const exportData = activeTable.data.map(row => {
        const obj: any = {};
        activeTable.headers.forEach((h, i) => {
            const key = `col${i+1}` as keyof typeof row;
            obj[h] = row[key];
        });
        return obj;
    });
    exportToExcel(exportData, `Quy_trinh_${activeTable.id}`);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quy trình vận hành</h2>
        <button 
            onClick={saveAll} 
            disabled={saveStatus !== 'idle'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-300 ${
                saveStatus === 'saved' 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : saveStatus === 'saving'
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
            {saveStatus === 'saving' ? (
             <><RefreshCw size={16} className="animate-spin" /> Đang lưu...</>
           ) : saveStatus === 'saved' ? (
             <><Check size={16} /> Đã lưu thành công</>
           ) : (
             <><Save size={16} /> Lưu thay đổi</>
           )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {tables.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTabId(t.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTabId === t.id 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.name}
            </button>
          ))}
          <hr className="my-2 border-slate-200 dark:border-slate-700"/>
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">Bộ lọc mùa</div>
          <div className="flex flex-col gap-2 px-2">
            <button className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-left">Mùa Lũ</button>
            <button className="px-3 py-2 text-sm bg-amber-50 dark:bg-amber-900/20 rounded text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-left">Mùa Kiệt</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTable && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 dark:text-white">{activeTable.name}</h3>
                 <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline-block">Dữ liệu có thể chỉnh sửa</span>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1.5 rounded transition-colors"
                    >
                        <Download size={14}/> Xuất Excel
                    </button>
                 </div>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                     <tr>
                       {activeTable.headers.map((h, i) => <th key={i} className="px-6 py-3 font-medium">{h}</th>)}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                     {activeTable.data.map(row => (
                       <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group">
                         <td className="px-6 py-2">
                           <input 
                             value={row.col1} 
                             onChange={e => handleUpdateCell(activeTable.id, row.id, 'col1', e.target.value)} 
                             className="w-full bg-transparent outline-none focus:border-blue-500 border-b border-transparent transition-colors text-slate-600 dark:text-slate-400 focus:text-slate-800 dark:focus:text-slate-200"
                           />
                         </td>
                         <td className="px-6 py-2">
                           <input 
                             value={row.col2} 
                             onChange={e => handleUpdateCell(activeTable.id, row.id, 'col2', e.target.value)} 
                             className="w-full bg-transparent outline-none focus:border-blue-500 border-b border-transparent transition-colors text-slate-600 dark:text-slate-400 focus:text-slate-800 dark:focus:text-slate-200"
                           />
                         </td>
                         {row.col3 !== undefined && (
                           <td className="px-6 py-2">
                              <input 
                                value={row.col3} 
                                onChange={e => handleUpdateCell(activeTable.id, row.id, 'col3', e.target.value)} 
                                className="w-full bg-transparent outline-none focus:border-blue-500 border-b border-transparent transition-colors font-medium text-slate-600 dark:text-slate-300 focus:text-slate-800 dark:focus:text-slate-100"
                              />
                           </td>
                         )}
                       </tr>
                     ))}
                     {activeTable.data.length === 0 && (
                       <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">Chưa có dữ liệu</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};