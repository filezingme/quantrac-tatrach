import React, { useState } from 'react';
import { db } from '../utils/db';
import { ForecastData } from '../types';
import { exportToExcel } from '../utils/excel';
import { CloudRain, TrendingUp, Calendar, AlertTriangle, Download } from 'lucide-react';

export const ForecastView: React.FC = () => {
  const [data] = useState<ForecastData>(db.forecast.get());

  const handleExportRainfallForecast = () => {
    const exportData = data.rainfall.map(r => ({
      'Trạm': r.name,
      'Hiện tại (mm)': r.data.current,
      '1 ngày (mm)': r.data.day1,
      '3 ngày (mm)': r.data.day3
    }));
    exportToExcel(exportData, 'Du_bao_mua');
  };

  const handleExportRegulationPlan = () => {
    const exportData = data.regulationPlan.map(item => ({
      'Thời gian': item.time,
      'Lưu lượng đến dự báo (m³/s)': item.flow
    }));
    exportToExcel(exportData, 'Ke_hoach_dieu_tiet');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thông tin dự báo</h2>
         <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
           Nguồn: Đài KTTV Tỉnh
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Rainfall Forecast */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <CloudRain className="text-blue-500" size={20} />
               Dự báo lượng mưa
             </h3>
             <button 
                onClick={handleExportRainfallForecast}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
             >
               <Download size={14}/> Xuất Excel
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3">Trạm</th>
                  <th className="px-4 py-3 text-center">Hiện tại</th>
                  <th className="px-4 py-3 text-center">1 ngày</th>
                  <th className="px-4 py-3 text-center">3 ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.rainfall.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{r.name}</td>
                    <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">{r.data.current}</td>
                    <td className="px-4 py-3 text-center dark:text-slate-300">{r.data.day1}</td>
                    <td className="px-4 py-3 text-center dark:text-slate-300">{r.data.day3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Forecast Results 72h & Downstream */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <TrendingUp className="text-red-500" size={20} />
               Kết quả dự báo (72h tới)
             </h3>
             <div className="grid grid-cols-3 gap-4 text-center">
               <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                 <div className="text-xs text-red-600 dark:text-red-400 uppercase font-semibold">Mực nước Max</div>
                 <div className="text-xl font-bold text-red-700 dark:text-red-400">{data.results72h.maxLevel} m</div>
               </div>
               <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                 <div className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">Dung tích Max</div>
                 <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{data.results72h.maxCapacity} tr.m³</div>
               </div>
               <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
                 <div className="text-xs text-amber-600 dark:text-amber-400 uppercase font-semibold">Q đến Max</div>
                 <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{data.results72h.maxInflow} m³/s</div>
               </div>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4">Dự báo mực nước hạ lưu (Max)</h3>
             <div className="space-y-3">
               <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                 <span className="text-slate-600 dark:text-slate-400">Trạm hạ lưu hồ Tả Trạch</span>
                 <span className="font-bold text-slate-800 dark:text-white">{data.downstreamMax.taTrach} m</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-slate-600 dark:text-slate-400">Trạm Kim Long</span>
                 <span className="font-bold text-slate-800 dark:text-white">{data.downstreamMax.kimLong} m</span>
               </div>
             </div>
           </div>
        </div>

        {/* 3. Regulation Plan */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
           <div className="flex justify-between items-start mb-4">
               <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                 Kế hoạch điều tiết (Q đến dự báo 3 ngày tới)
               </h3>
               <button 
                  onClick={handleExportRegulationPlan}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
               >
                 <Download size={14}/> Xuất Excel
               </button>
           </div>
           <div className="overflow-x-auto">
             <div className="flex gap-4 pb-2">
               {data.regulationPlan.map((item, idx) => (
                 <div key={idx} className="min-w-[120px] bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.time}</div>
                    <div className="font-bold text-slate-800 dark:text-white text-lg">{item.flow}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">m³/s</div>
                 </div>
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};