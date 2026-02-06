
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Save, Lock, Shield, CheckCircle, RefreshCw, Check, AlertCircle, Camera, X, Maximize2, Trash2, Settings } from 'lucide-react';
import { db } from '../utils/db';
import { UserProfile } from '../types';
import { useUI } from '../components/GlobalUI';
import { useNavigate } from 'react-router-dom';

export const UserProfileView: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(db.user.get());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isZoomOpen, setIsZoomOpen] = useState(false); // State for Lightbox
  const ui = useUI();
  const navigate = useNavigate();
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string>('');

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
        // Update Session User
        db.user.set(user);
        // Update Master User List (For Admin View)
        db.users.update(user);
        setSaveStatus('saved');
    }, 600);
  };

  const handleChangePassword = () => {
    // Reset previous error
    setPasswordError('');

    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
        setPasswordError('Vui lòng điền đầy đủ thông tin mật khẩu');
        return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
        setPasswordError('Mật khẩu xác nhận không khớp');
        return;
    }
    
    // Simulate API call success
    ui.showToast('success', 'Đổi mật khẩu thành công');
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordError('');
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening zoom
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type/size if needed
      if (file.size > 5 * 1024 * 1024) {
        ui.showToast('error', 'Kích thước ảnh quá lớn (Max 5MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Update local state
        const updatedUser = { ...user, avatar: base64String };
        setUser(updatedUser);
        
        // Save immediately to DB (Session & Master List)
        db.user.set(updatedUser);
        db.users.update(updatedUser);
        
        ui.showToast('success', 'Đã cập nhật ảnh đại diện');
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    ui.confirm({
        title: 'Xóa ảnh đại diện',
        message: 'Bạn có chắc chắn muốn xóa ảnh hiện tại và quay về mặc định?',
        type: 'danger',
        onConfirm: () => {
            // Generate initials from name
            const nameParts = user.name.trim().split(' ');
            const initials = nameParts.length > 1 
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : user.name.substring(0, 2).toUpperCase();

            const updatedUser = { ...user, avatar: initials };
            setUser(updatedUser);
            
            // Sync to DB (Session & Master List)
            db.user.set(updatedUser);
            db.users.update(updatedUser);
            
            ui.showToast('info', 'Đã xóa ảnh đại diện');
        }
    });
  };

  // Helper to determine if avatar is an image (Base64/URL) or Initials
  const isImageAvatar = user.avatar.length > 4;

  return (
    <>
      <div className="max-w-5xl mx-auto pb-10 space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hồ sơ cá nhân</h2>
          
          {/* Quick Switcher (Only for Admins) */}
          {user.role === 'admin' && (
             <div className="flex bg-slate-200 dark:bg-slate-700/50 p-1 rounded-xl">
                <button 
                   className="px-4 py-2 rounded-lg text-sm font-bold bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm transition-all flex items-center gap-2"
                   disabled
                >
                   <User size={16}/> Hồ sơ
                </button>
                <button 
                   onClick={() => navigate('/settings')}
                   className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center gap-2"
                >
                   <Settings size={16}/> Cài đặt hệ thống
                </button>
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Avatar & Overview */}
          <div className="md:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center text-center">
                  
                  {/* Avatar Circle Container */}
                  <div className="relative mb-4 group">
                      {/* Main Avatar - Click to Zoom */}
                      <div 
                          className={`w-40 h-40 rounded-full overflow-hidden flex items-center justify-center text-5xl font-bold text-white shadow-lg border-4 border-white dark:border-slate-700 ${!isImageAvatar ? 'bg-gradient-to-tr from-blue-500 to-indigo-600' : 'bg-slate-100'} ${isImageAvatar ? 'cursor-zoom-in' : ''}`}
                          onClick={() => isImageAvatar && setIsZoomOpen(true)}
                      >
                          {isImageAvatar ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              user.avatar
                          )}
                          
                          {/* Zoom Hint Overlay (Only if image) - Also hidden by default */}
                          {isImageAvatar && (
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                                <Maximize2 size={32} className="text-white drop-shadow-md" />
                            </div>
                          )}
                      </div>
                      
                      {/* Edit Button - Floating Bottom Right - Hidden by default, show on hover */}
                      <button
                          onClick={handleUploadClick}
                          className="absolute bottom-1 right-1 p-2.5 bg-slate-800 text-white rounded-full hover:bg-blue-600 transition-all duration-300 shadow-md border-2 border-white dark:border-slate-800 z-10 opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2"
                          title="Tải ảnh mới"
                      >
                          <Camera size={18} />
                      </button>

                      {/* Delete Button - Floating Bottom Left (Only if image exists) - Hidden by default, show on hover */}
                      {isImageAvatar && (
                          <button
                              onClick={handleRemoveAvatar}
                              className="absolute bottom-1 left-1 p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-300 shadow-md border-2 border-white dark:border-slate-800 z-10 opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2"
                              title="Xóa ảnh"
                          >
                              <Trash2 size={18} />
                          </button>
                      )}

                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleAvatarUpload} 
                          className="hidden" 
                          accept="image/*"
                      />
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
                          {/* Error Message Display */}
                          {passwordError && (
                              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-top-1">
                                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                  <span>{passwordError}</span>
                              </div>
                          )}

                          <div>
                              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Mật khẩu hiện tại</label>
                              <div className="relative">
                                  <input 
                                      type="password" 
                                      value={passwordForm.current}
                                      onChange={e => {
                                          setPasswordForm({...passwordForm, current: e.target.value});
                                          if(passwordError) setPasswordError('');
                                      }}
                                      className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:text-slate-900 dark:focus:text-white transition-colors ${passwordError ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-600'}`}
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
                                      onChange={e => {
                                          setPasswordForm({...passwordForm, new: e.target.value});
                                          if(passwordError) setPasswordError('');
                                      }}
                                      className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:text-slate-900 dark:focus:text-white transition-colors ${passwordError ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-600'}`}
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
                                      onChange={e => {
                                          setPasswordForm({...passwordForm, confirm: e.target.value});
                                          if(passwordError) setPasswordError('');
                                      }}
                                      className={`w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:text-slate-900 dark:focus:text-white transition-colors ${passwordError ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-600'}`}
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

      {/* --- AVATAR LIGHTBOX / MODAL --- */}
      {isZoomOpen && isImageAvatar && (
        <div 
          className="fixed inset-0 z-[5000] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsZoomOpen(false)}
        >
           <button 
             onClick={() => setIsZoomOpen(false)}
             className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
           >
             <X size={24} />
           </button>

           <div 
             className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
             onClick={(e) => e.stopPropagation()} 
           >
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300"
              />
              <div className="mt-4 text-center">
                 <h3 className="text-white font-bold text-xl drop-shadow-md">{user.name}</h3>
                 <p className="text-white/60 text-sm mt-1">Ảnh đại diện</p>
              </div>
           </div>
        </div>
      )}
    </>
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
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 dark:text-slate-300 font-normal bg-slate-50/50 dark:bg-slate-700/50 focus:bg-white dark:focus:bg-slate-700 focus:text-slate-900 dark:focus:text-white transition-colors placeholder-slate-400"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">
                {icon}
            </div>
        </div>
    </div>
);
