import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExternalLink, Table } from 'lucide-react';

export const ChartsView: React.FC = () => {
  const data = [
    { level: 23, capacity: 50, area: 10 },
    { level: 30, capacity: 120, area: 15 },
    { level: 35, capacity: 200, area: 22 },
    { level: 40, capacity: 350, area: 30 },
    { level: 45, capacity: 646, area: 45 },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hồ sơ & Biểu đồ</h2>
        <a 
          href="https://hotatrach.vn/hosologin.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600 shadow-md"
        >
          <ExternalLink size={16} /> Truy cập Hệ thống Hồ sơ
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">QH Mực nước (Z) ~ Dung tích (W)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs><linearGradient id="colorCap" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="level" label={{ value: 'Z (m)', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} tick={{fill: '#64748b'}} />
                <YAxis tick={{fill: '#64748b'}} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={true} />
                <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Area type="monotone" dataKey="capacity" stroke="#3b82f6" fill="url(#colorCap)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">QH Mực nước (Z) ~ Diện tích (F)</h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs><linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey="level" label={{ value: 'Z (m)', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} tick={{fill: '#64748b'}} />
                <YAxis tick={{fill: '#64748b'}} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={true} />
                <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Area type="monotone" dataKey="area" stroke="#10b981" fill="url(#colorArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Table size={18} className="text-slate-500 dark:text-slate-400"/> Bảng Đường hạn chế cấp nước
          </h3>
        </div>
        <div className="p-6">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
               <tr>
                 <th className="px-4 py-2">Từ ngày</th>
                 <th className="px-4 py-2">Đến ngày</th>
                 <th className="px-4 py-2">Mực nước thấp nhất (m)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               <tr className="border-b dark:border-slate-700">
                 <td className="px-4 py-2"><input defaultValue="01/01" className="w-full bg-transparent text-slate-700 dark:text-slate-300 outline-none"/></td>
                 <td className="px-4 py-2"><input defaultValue="15/04" className="w-full bg-transparent text-slate-700 dark:text-slate-300 outline-none"/></td>
                 <td className="px-4 py-2"><input defaultValue="25.0" className="w-full bg-transparent font-medium text-slate-800 dark:text-white outline-none"/></td>
               </tr>
                <tr>
                 <td className="px-4 py-2"><input defaultValue="16/04" className="w-full bg-transparent text-slate-700 dark:text-slate-300 outline-none"/></td>
                 <td className="px-4 py-2"><input defaultValue="31/08" className="w-full bg-transparent text-slate-700 dark:text-slate-300 outline-none"/></td>
                 <td className="px-4 py-2"><input defaultValue="23.0" className="w-full bg-transparent font-medium text-slate-800 dark:text-white outline-none"/></td>
               </tr>
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};