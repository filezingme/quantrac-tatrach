import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { GeneralInfo } from '../types';
import { Save, MapPin, Building, Activity, CheckCircle } from 'lucide-react';

export const GeneralInfoView: React.FC = () => {
  const [info, setInfo] = useState<GeneralInfo>(db.generalInfo.get());
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  const handleChange = (field: keyof GeneralInfo, value: string) => {
    setInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    db.generalInfo.set(info);
    setIsSaved(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-fade-in">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thông tin chung công trình</h2>
         <button 
           onClick={handleSave} 
           className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-200 ${
             isSaved 
               ? 'bg-green-600 text-white shadow-green-200 dark:shadow-none scale-105' 
               : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
           }`}
         >
           {isSaved ? <><CheckCircle size={16} /> Đã lưu thông tin</> : <><Save size={16} /> Lưu thông tin</>}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Administrative */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <Building size={18} className="text-blue-500"/> Thông tin hành chính
            </h3>
            <div className="space-y-4">
               <Input label="Cấp công trình" val={info.projectLevel} onChange={v => handleChange('projectLevel', v)} />
               <Input label="Đơn vị quản lý" val={info.manager} onChange={v => handleChange('manager', v)} />
               <Input label="Thời gian xây dựng" val={info.constructionTime} onChange={v => handleChange('constructionTime', v)} />
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nhiệm vụ</label>
                  <textarea rows={3} value={info.mission} onChange={e => handleChange('mission', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
               </div>
            </div>
         </div>

         {/* Location */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
               <MapPin size={18} className="text-red-500"/> Địa điểm & Vị trí
            </h3>
             <div className="space-y-4">
               <Input label="Thuộc lưu vực" val={info.basin} onChange={v => handleChange('basin', v)} />
               <Input label="Địa điểm xây dựng" val={info.location} onChange={v => handleChange('location', v)} />
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Kinh độ" val={info.longitude} onChange={v => handleChange('longitude', v)} />
                  <Input label="Vĩ độ" val={info.latitude} onChange={v => handleChange('latitude', v)} />
               </div>
            </div>
         </div>

         {/* Technical Frequency */}
         <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
               <Activity size={18} className="text-green-500"/> Các chỉ tiêu thiết kế
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input label="Tần suất lũ thiết kế" val={info.floodFreqDesign} onChange={v => handleChange('floodFreqDesign', v)} />
                <Input label="Tần suất lũ kiểm tra" val={info.floodFreqCheck} onChange={v => handleChange('floodFreqCheck', v)} />
                <Input label="Tần suất cấp nước tưới" val={info.waterSupplyIrrigationFreq} onChange={v => handleChange('waterSupplyIrrigationFreq', v)} />
                <Input label="TS cấp nước sinh hoạt" val={info.waterSupplyDomesticFreq} onChange={v => handleChange('waterSupplyDomesticFreq', v)} />
                <Input label="TS cấp nước công nghiệp" val={info.waterSupplyIndustrialFreq} onChange={v => handleChange('waterSupplyIndustrialFreq', v)} />
                <Input label="TS cấp nước môi trường" val={info.waterSupplyEnvFreq} onChange={v => handleChange('waterSupplyEnvFreq', v)} />
             </div>
         </div>
      </div>
    </div>
  );
};

const Input = ({ label, val, onChange }: { label: string, val: string, onChange: (v: string) => void }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase">{label}</label>
    <input type="text" value={val} onChange={(e) => onChange(e.target.value)} className="w-full border-b border-slate-200 dark:border-slate-600 focus:border-blue-500 outline-none py-1 text-slate-800 dark:text-white font-medium transition-colors bg-transparent" />
  </div>
);