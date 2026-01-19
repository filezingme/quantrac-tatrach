import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Save, Lock, Shield, CheckCircle, RefreshCw, Check } from 'lucide-react';
import { db } from '../utils/db';
import { UserProfile } from '../types';
import { useUI } from '../components/GlobalUI';

export const UserProfileView: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(db.user.get());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const ui = useUI();
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveInfo = () => {
    setSaveStatus('saving');
    setTimeout(() => {
        db.user.set(user);
        setSaveStatus('saved');
    }, 600);
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
        ui.showToast('warning', 'Vui lòng điền đầy đủ thông tin mật khẩu');
        return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
        ui.showToast('error', 'Mật khẩu xác nhận không khớp');
        return;
    }
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hồ sơ cá nhân</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Overview */}
        <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                    {user.avatar}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.role}</p>
                <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">Đang hoạt động</span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full">Admin</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase">Hoạt động gần đây</h4>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 text-sm">
                            <div className="mt-1 min-w-[6px] h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                            <div>
                                <p className="text-slate-700 dark:text-slate-300">Cập nhật số liệu quan trắc</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Hôm nay, 08:3{i}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="md:col-span-2 space-y-6">
            
            {/* General Info Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <User size={18} className="text-blue-600 dark:text-blue-400"/> Thông tin cơ bản
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Họ và tên" icon={<User size={16}/>} value={user.name} onChange={v => handleChange('name', v)} />
                        <InputGroup label="Email" icon={<Mail size={16}/>} value={user.email} onChange={v => handleChange('email', v)} type="email" />
                        <InputGroup label="Số điện thoại" icon={<Phone size={16}/>} value={user.phone || ''} onChange={v => handleChange('phone', v)} />
                        <InputGroup label="Chức vụ / Phòng ban" icon={<Briefcase size={16}/>} value={user.department || ''} onChange={v => handleChange('department', v)} />
                    </div>
                    <div className="pt-2">
                        <InputGroup label="Địa chỉ liên hệ" icon={<MapPin size={16}/>} value={user.address || ''} onChange={v => handleChange('address', v)} />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleSaveInfo} 
                            disabled={saveStatus !== 'idle'}
                            className={`px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-md transition-all ${
                                saveStatus === 'saved' 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : saveStatus === 'saving'
                                    ? 'bg-blue-400 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {saveStatus === 'saving' ? (
                                <><RefreshCw size={16} className="animate-spin" /> Đang lưu...</>
                            ) : saveStatus === 'saved' ? (
                                <><Check size={16} /> Đã lưu thông tin</>
                            ) : (
                                <><Save size={16}/> Lưu thông tin</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Security Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield size={18} className="text-red-500"/> Bảo mật & Mật khẩu
                    </h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Mật khẩu hiện tại</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={passwordForm.current}
                                    onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Mật khẩu mới</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Xác nhận mật khẩu mới</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={passwordForm.confirm}
                                    onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button onClick={handleChangePassword} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, icon, type = "text" }: { label: string, value: string, onChange: (v: string) => void, icon: React.ReactNode, type?: string }) => (
    <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white font-medium bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 transition-colors"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
                {icon}
            </div>
        </div>
    </div>
);