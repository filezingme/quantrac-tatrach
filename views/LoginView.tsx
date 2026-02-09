
import React, { useState, useEffect } from 'react';
import { Waves, ArrowRight, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { db } from '../utils/db';
import { UserProfile, SystemSettings } from '../types';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(db.settings.get());

  useEffect(() => {
      // Keep settings fresh just in case
      setSettings(db.settings.get());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
      const users = db.users.getAll();
      const foundUser = users.find(u => u.username === username && u.password === password);

      if (foundUser) {
        if (foundUser.status === 'inactive') {
            setError('Tài khoản đã bị vô hiệu hóa');
            setIsLoading(false);
            return;
        }
        // Update last active
        const updatedUser = { ...foundUser, lastActive: new Date().toISOString() };
        db.users.update(updatedUser);
        
        onLogin(updatedUser);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-slate-100"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-600/5 skew-y-3 origin-top-left z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-blue-600/5 -skew-y-3 origin-bottom-right z-0"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-white border border-slate-200 rounded-2xl shadow-xl animate-slide-up">
        
        {/* Header */}
        <div className="text-center mb-8">
          {settings.logo ? (
             <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
                <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
             </div>
          ) : (
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
                <Waves className="text-white" size={32} />
             </div>
          )}
          {/* CHANGED: Use appName instead of appTitle/appname combo */}
          <h1 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
            {settings.appName}
          </h1>
          <p className="text-slate-500 text-sm font-medium">{settings.appSubtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Tài khoản</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all font-medium"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide ml-1">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all font-medium"
                placeholder="Nhập mật khẩu"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                Đăng nhập hệ thống <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-2">
            <ShieldCheck size={14} className="text-green-500" />
            <span>Bảo mật & An toàn dữ liệu</span>
          </div>
          <p className="text-[10px] text-slate-400">{settings.appFooter}</p>
        </div>
      </div>
    </div>
  );
};
