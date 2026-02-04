
import React, { useState, useEffect } from 'react';
import { Settings, Bell, Database, Shield, Globe, Monitor, Save, RefreshCw, Check, Zap, Layout, AlertTriangle } from 'lucide-react';
import { useUI } from '../components/GlobalUI';
import { db } from '../utils/db';
import { SystemSettings } from '../types';

export const SystemSettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'notification' | 'data'>('general');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  // Load initial settings from DB
  const [settings, setSettings] = useState<SystemSettings>(db.settings.get());
  
  const ui = useUI();

  useEffect(() => {
    // Sync theme state with local storage on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && document.documentElement.classList.contains('dark'))) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
      setTheme(newTheme);
      if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  };

  const toggleFeature = (key: keyof SystemSettings['features']) => {
      setSettings(prev => ({
          ...prev,
          features: {
              ...prev.features,
              [key]: !prev.features[key]
          }
      }));
  };

  const toggleNotification = (key: keyof SystemSettings['notifications']) => {
      setSettings(prev => ({
          ...prev,
          notifications: {
              ...prev.notifications,
              [key]: !prev.notifications[key]
          }
      }));
  };

  const handleChange = (key: keyof SystemSettings, value: any) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
      setSaveStatus('saving');
      // Save to DB
      setTimeout(() => {
          db.settings.set(settings);
          setSaveStatus('saved');
          ui.showToast('success', 'Đã lưu cấu hình hệ thống');
      }, 600);
  };

  // Standard input style for settings - lighter and not bold
  const inputStyle = "w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 dark:text-slate-300 font-normal bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white transition-colors placeholder-slate-400";

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cài đặt hệ thống</h2>

        <div className="flex flex-col md:flex-row gap-6">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-none space-y-2">
                <NavButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Settings size={18}/>} label="Chung & Giao diện" />
                <NavButton active={activeTab === 'features'} onClick={() => setActiveTab('features')} icon={<Zap size={18}/>} label="Tính năng & Tiện ích" />
                <NavButton active={activeTab === 'notification'} onClick={() => setActiveTab('notification')} icon={<Bell size={18}/>} label="Thông báo & Cảnh báo" />
                <NavButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} icon={<Database size={18}/>} label="Dữ liệu & Sao lưu" />
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[500px] transition-colors duration-200">
                
                {/* General Settings */}
                {activeTab === 'general' && (
                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                <Globe size={20} className="text-blue-600 dark:text-blue-400"/> Cấu hình chung
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Thông tin cơ bản và trạng thái hệ thống.</p>
                            
                            <div className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên công trình (Sidebar & Login)</label>
                                    <input 
                                        type="text" 
                                        value={settings.appName}
                                        onChange={(e) => handleChange('appName', e.target.value)}
                                        className={inputStyle}
                                        placeholder="Ví dụ: TP Geo Monitoring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả công trình (Sub)</label>
                                    <input 
                                        type="text" 
                                        value={settings.appSubtitle}
                                        onChange={(e) => handleChange('appSubtitle', e.target.value)}
                                        className={inputStyle}
                                        placeholder="Ví dụ: Hệ thống quản lý"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tiêu đề công trình (Header & Browser Title)</label>
                                    <input 
                                        type="text" 
                                        value={settings.appTitle}
                                        onChange={(e) => handleChange('appTitle', e.target.value)}
                                        className={inputStyle}
                                        placeholder="Ví dụ: Hệ thống Quản lý TP Geo Monitoring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Thông tin bản quyền (Footer)</label>
                                    <input 
                                        type="text" 
                                        value={settings.appFooter}
                                        onChange={(e) => handleChange('appFooter', e.target.value)}
                                        className={inputStyle}
                                        placeholder="Ví dụ: Version 3.0.1 © 2026..."
                                    />
                                </div>
                                <div className="flex items-center justify-between py-2 mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Chế độ bảo trì</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Chặn truy cập đối với người dùng thông thường</p>
                                    </div>
                                    <Switch checked={settings.maintenanceMode} onChange={() => handleChange('maintenanceMode', !settings.maintenanceMode)} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                <Monitor size={20} className="text-purple-600 dark:text-purple-400"/> Giao diện
                            </h3>
                             <div className="mt-4 grid grid-cols-3 gap-4 max-w-md">
                                 <div 
                                    onClick={() => handleThemeChange('light')}
                                    className={`border-2 rounded-lg p-3 text-center cursor-pointer transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                 >
                                     <div className="h-10 bg-white rounded mb-2 border border-blue-200 dark:border-slate-500"></div>
                                     <span className={`text-xs font-bold ${theme === 'light' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>Sáng</span>
                                 </div>
                                 <div 
                                    onClick={() => handleThemeChange('dark')}
                                    className={`border-2 rounded-lg p-3 text-center cursor-pointer transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                 >
                                     <div className="h-10 bg-slate-800 rounded mb-2 border border-slate-600"></div>
                                     <span className={`text-xs font-bold ${theme === 'dark' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>Tối</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}

                {/* Features Settings */}
                {activeTab === 'features' && (
                     <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                <Zap size={20} className="text-amber-500"/> Tính năng & Tiện ích
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Bật/Tắt các module chức năng của hệ thống.</p>
                            
                            <div className="space-y-4 max-w-xl divide-y divide-slate-100 dark:divide-slate-700">
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Trợ lý ảo AI (Gemini)</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Hỗ trợ tra cứu nhanh và vẽ biểu đồ tự động.</p>
                                    </div>
                                    <Switch checked={settings.features.enableAIAssistant} onChange={() => toggleFeature('enableAIAssistant')} />
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Mô phỏng Lũ & Kịch bản</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Cho phép chạy các kịch bản dự báo lũ giả định.</p>
                                    </div>
                                    <Switch checked={settings.features.enableFloodSimulation} onChange={() => toggleFeature('enableFloodSimulation')} />
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Thư viện Biểu đồ Demo</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Hiển thị các loại biểu đồ nâng cao để tham khảo.</p>
                                    </div>
                                    <Switch checked={settings.features.enableDemoCharts} onChange={() => toggleFeature('enableDemoCharts')} />
                                </div>
                            </div>
                        </div>
                     </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notification' && (
                     <div className="p-6 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                <Bell size={20} className="text-blue-500"/> Kênh thông báo
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Quản lý cách hệ thống gửi cảnh báo.</p>
                            
                            <div className="space-y-4 max-w-lg divide-y divide-slate-100 dark:divide-slate-700">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Thông báo qua Email</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Gửi báo cáo và cảnh báo quan trọng</p>
                                    </div>
                                    <Switch checked={settings.notifications.emailAlerts} onChange={() => toggleNotification('emailAlerts')} />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Thông báo SMS</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Chỉ dành cho tình huống khẩn cấp</p>
                                    </div>
                                    <Switch checked={settings.notifications.smsAlerts} onChange={() => toggleNotification('smsAlerts')} />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Web Push Notification</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Thông báo trực tiếp trên trình duyệt</p>
                                    </div>
                                    <Switch checked={settings.notifications.pushNotif} onChange={() => toggleNotification('pushNotif')} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                <Shield size={20} className="text-red-500"/> Ngưỡng cảnh báo
                            </h3>
                            <div className="mt-4 max-w-xs">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mực nước cảnh báo (m)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={settings.notifications.alertThresholdLevel}
                                        onChange={(e) => setSettings(prev => ({...prev, notifications: {...prev.notifications, alertThresholdLevel: parseFloat(e.target.value)}}))}
                                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none font-medium text-red-600/80 bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:text-red-600 transition-colors"
                                    />
                                    <span className="flex items-center text-slate-500 dark:text-slate-400 text-sm">m</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Hệ thống sẽ gửi cảnh báo khi mực nước vượt quá giá trị này.</p>
                            </div>
                        </div>
                     </div>
                )}

                {/* Data Settings */}
                {activeTab === 'data' && (
                    <div className="p-6 space-y-8">
                        <div>
                             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                <Database size={20} className="text-green-600"/> Sao lưu dữ liệu
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Cấu hình sao lưu tự động và thủ công.</p>
                            
                            <div className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tần suất sao lưu tự động</label>
                                    <select 
                                        value={settings.backupFrequency}
                                        onChange={(e) => handleChange('backupFrequency', e.target.value)}
                                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 dark:text-slate-300 font-normal bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_10px_center] bg-no-repeat"
                                    >
                                        <option value="daily">Hàng ngày (00:00)</option>
                                        <option value="weekly">Hàng tuần (Chủ nhật)</option>
                                        <option value="monthly">Hàng tháng</option>
                                        <option value="manual">Chỉ thủ công</option>
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                                        <RefreshCw size={16}/> Sao lưu ngay lập tức
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                            <AlertTriangle size={20}/> Vùng nguy hiểm
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Các tác vụ này không thể hoàn tác.</p>
                            
                            <button 
                                onClick={() => {
                                    if(confirm('Bạn có chắc chắn muốn khôi phục dữ liệu gốc? Mọi thay đổi sẽ bị mất.')) {
                                        localStorage.clear();
                                        window.location.reload();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <RefreshCw size={16}/> Khôi phục cài đặt gốc (Reset Data)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Save Bar */}
        <div className="flex justify-end pt-4">
            <button 
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900 transition-all ${
                    saveStatus === 'saved' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : saveStatus === 'saving'
                        ? 'bg-blue-400 text-white cursor-wait'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
                {saveStatus === 'saving' ? (
                    <><RefreshCw size={18} className="animate-spin"/> Đang lưu...</>
                ) : saveStatus === 'saved' ? (
                    <><Check size={18}/> Đã lưu thay đổi</>
                ) : (
                    <><Save size={18}/> Lưu thay đổi</>
                )}
            </button>
        </div>
    </div>
  );
};

// --- Helper Components ---

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
    >
        {icon}
        {label}
    </button>
);

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                checked ? 'translate-x-5' : 'translate-x-0'
            }`}
        />
    </button>
);
