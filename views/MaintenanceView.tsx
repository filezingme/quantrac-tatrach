
import React from 'react';
import { Hammer, ArrowRight } from 'lucide-react';
import { db } from '../utils/db';

export const MaintenanceView: React.FC = () => {
  const settings = db.settings.get();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 text-center font-sans relative overflow-hidden">
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600/5 -skew-y-3 origin-top-left z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-blue-600/5 skew-y-3 origin-bottom-right z-0 pointer-events-none"></div>

      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-lg w-full relative z-10 animate-fade-in">
        
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
           <Hammer size={40} className="text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Hệ thống đang bảo trì</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          {settings.appName} đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại sau.
        </p>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-100 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 mb-6">
           <p><strong>Thời gian dự kiến hoàn thành:</strong></p>
           <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">Vui lòng liên hệ quản trị viên</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/20"
        >
          Tải lại trang <ArrowRight size={18}/>
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
           <p className="text-xs text-slate-400 dark:text-slate-500">
             {settings.appFooter}
           </p>
        </div>
      </div>
    </div>
  );
};
