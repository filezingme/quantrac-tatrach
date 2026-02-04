
import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Save, CheckCircle, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { db } from '../utils/db';
import { ObservationData } from '../types';
import { useUI } from '../components/GlobalUI';

export const ManualEntryView: React.FC = () => {
  const [formData, setFormData] = useState<ObservationData>(db.observation.get());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const ui = useUI();

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleChange = (field: keyof ObservationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDownstreamChange = (value: number) => {
    // Update the first downstream station as the primary one for this view
    setFormData(prev => ({
      ...prev,
      downstream: prev.downstream.map((item, index) => 
        index === 0 ? { ...item, level: value } : item
      )
    }));
  };

  const handleRainfallChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      rainfall: prev.rainfall.map(r => r.id === id ? { 
        ...r, 
        data: { ...r.data, current: numValue } 
      } : r)
    }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
        try {
            const updatedData = {
              ...formData,
              lastUpdated: new Date().toISOString()
            };
            db.observation.set(updatedData);
            setSaveStatus('saved');
          } catch (error) {
            setSaveStatus('idle');
            ui.showToast('error', 'Có lỗi xảy ra khi lưu dữ liệu.');
          }
    }, 600);
  };

  // Standard input class for data entry
  const inputClass = "w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:text-blue-700 dark:focus:text-blue-400 transition-colors";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nhập liệu thủ công</h2>
      </div>
      
      {/* File Upload Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FileSpreadsheet className="text-green-600" size={20} />
          Nhập từ Excel
        </h3>
        <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/30 text-center hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer group">
          <div className="bg-white dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
             <Upload className="text-slate-400 dark:text-slate-300 group-hover:text-blue-500" size={28} />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-medium text-lg">Kéo thả file Excel vào đây hoặc click để chọn</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Hỗ trợ định dạng .xlsx, .xls (Max 5MB)</p>
        </div>
        <div className="mt-4 flex justify-between items-center px-2">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline">
            Tải file mẫu nhập liệu (.xlsx)
          </button>
          <button className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600 shadow-lg shadow-slate-200 dark:shadow-none transition-all">
            Tải lên và Xử lý
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-semibold text-slate-800 dark:text-white">Nhập số liệu thủy văn</h3>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Main Indicators */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-blue-500 pl-2">Thông số hồ chứa</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Mực nước hồ (m)</label>
                <input 
                  type="number" 
                  value={formData.waterLevel}
                  onChange={(e) => handleChange('waterLevel', parseFloat(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Dung tích (triệu m³)</label>
                <input 
                  type="number" 
                   value={formData.capacity}
                  onChange={(e) => handleChange('capacity', parseFloat(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Mực nước hạ lưu (m)</label>
                <input 
                  type="number" 
                   value={formData.downstream[0]?.level || 0}
                  onChange={(e) => handleDownstreamChange(parseFloat(e.target.value))}
                  className={inputClass}
                />
                {formData.downstream[0] && <p className="text-xs text-slate-400 mt-1">{formData.downstream[0].name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Lưu lượng đến (m³/s)</label>
                <input 
                  type="number" 
                   value={formData.inflow}
                  onChange={(e) => handleChange('inflow', parseFloat(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tổng xả (m³/s)</label>
                 <input 
                  type="number" 
                   value={formData.outflow}
                  onChange={(e) => handleChange('outflow', parseFloat(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Rainfall */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-blue-500 pl-2">Số liệu mưa (mm)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {formData.rainfall.map((station) => (
                <div key={station.id}>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 truncate" title={station.name}>{station.name}</label>
                  <input 
                    type="number" 
                    value={station.data.current}
                    onChange={(e) => handleRainfallChange(station.id, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/50 ${
                saveStatus === 'saved'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : saveStatus === 'saving'
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saveStatus === 'saving' ? (
                 <><RefreshCw size={18} className="animate-spin" /> Đang xử lý...</>
              ) : saveStatus === 'saved' ? (
                 <><Check size={18} /> Đã cập nhật</>
              ) : (
                 <><Save size={18} /> Lưu cập nhật</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
