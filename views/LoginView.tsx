import React, { useState } from 'react';
import { Waves, ArrowRight, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
      if (username === 'admin' && password === '123') {
        onLogin();
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 font-sans">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-sm scale-105"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1582236357908-144c4c237d6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")' }}
      ></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-900 via-slate-900/90 to-blue-900/40"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-slide-up">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 shadow-lg shadow-blue-500/30 mb-4 animate-bounce">
            <Waves className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Hệ thống Quản lý</h1>
          <p className="text-blue-200 text-sm font-medium">Hồ chứa nước Tả Trạch</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider ml-1">Tài khoản</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider ml-1">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nhập mật khẩu"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
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
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-2">
            <ShieldCheck size={14} className="text-green-400" />
            <span>Hệ thống bảo mật & an toàn dữ liệu</span>
          </div>
          <p className="text-[10px] text-slate-500">Version 2.4.3 © 2024 Ta Trach Management System</p>
        </div>
        
        <div className="absolute top-4 right-4 bg-white/5 backdrop-blur rounded px-2 py-1 text-[10px] text-slate-400 border border-white/5">
           Default: admin / 123
        </div>
      </div>
    </div>
  );
};