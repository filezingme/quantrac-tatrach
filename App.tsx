import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ForecastView } from './views/ForecastView';
import { CameraView } from './views/CameraView';
import { GeneralInfoView } from './views/GeneralInfoView';
import { TechnicalSpecsView } from './views/TechnicalSpecsView';
import { ImageView } from './views/ImageView';
import { DocumentsView } from './views/DocumentsView';
import { OperationView } from './views/OperationView';
import { ManualEntryView } from './views/ManualEntryView';
import { FloodForecastView } from './views/FloodForecastView';
import { MapView } from './views/MapView';
import { WaterLevelView } from './views/WaterLevelView';
import { DemoChartsView } from './views/DemoChartsView';
import { UserProfileView } from './views/UserProfileView';
import { SystemSettingsView } from './views/SystemSettingsView';
import { UserManagementView } from './views/UserManagementView';
import { AISafetyView } from './views/AISafetyView';
import { LoginView } from './views/LoginView';
import { GlobalSearch } from './components/GlobalSearch';
import { AIAssistant } from './components/AIAssistant';
import { UIProvider } from './components/GlobalUI';
import { db } from './utils/db';
import { UserProfile } from './types';
import { Search, Bell, Menu, LogOut, User as UserIcon, Settings, Waves } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  user: UserProfile;
  onLogout: () => void;
}

// Layout Component
const MainLayout: React.FC<MainLayoutProps> = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 transition-colors duration-200">
          
          {/* LEFT: Menu & Title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <Menu size={20} />
            </button>
            
            {/* App Title Restored */}
            <div className="flex items-center gap-2">
               <div className="md:hidden bg-blue-600 p-1.5 rounded-lg text-white shadow-sm">
                  <Waves size={16} />
               </div>
               <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight tracking-tight">
                 Hệ thống Quản lý Hồ Tả Trạch
               </h1>
            </div>
          </div>

          {/* RIGHT: Search, Notifications, User */}
          <div className="flex items-center gap-2 sm:gap-4">
             {/* Search Bar (Moved Here) */}
             <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-sm transition-colors"
              title="Tìm kiếm (Ctrl+K)"
            >
              <Search size={18} />
              <span className="hidden md:inline w-20 lg:w-32 text-left">Tìm kiếm...</span>
              <div className="hidden lg:flex gap-1 ml-2">
                 <kbd className="bg-white dark:bg-slate-700 px-1.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-600 shadow-sm">Ctrl</kbd>
                 <kbd className="bg-white dark:bg-slate-700 px-1.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-600 shadow-sm">K</kbd>
              </div>
            </button>

             {/* Notifications */}
             <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
             </button>

             {/* User Menu */}
             <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700" ref={userRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 group outline-none pl-2"
                >
                  <div className="flex flex-col items-end hidden sm:flex mr-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 tracking-wide whitespace-nowrap">
                      Admin
                    </span>
                  </div>
                  <div className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-blue-200 shadow-md ring-2 ring-transparent group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all ${isUserMenuOpen ? 'ring-blue-200 dark:ring-blue-800' : ''}`}>
                    {user.avatar}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-2">
                          <p className="font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <UserIcon size={16} /> Hồ sơ cá nhân
                      </Link>
                      <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          <Settings size={16} /> Cài đặt hệ thống
                      </Link>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-2"></div>
                      <button 
                        onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                          <LogOut size={16} /> Đăng xuất
                      </button>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 md:p-6 transition-colors duration-200">
           {children}
        </main>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AIAssistant />
    </div>
  );
};

export const App = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = sessionStorage.getItem('isAuthenticated');
    return saved ? db.user.get() : null;
  });

  const handleLogin = (userProfile: UserProfile) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    db.user.set(userProfile);
    setUser(userProfile);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setUser(null);
  };

  if (!user) {
    return (
      <UIProvider>
        <LoginView onLogin={handleLogin} />
      </UIProvider>
    );
  }

  return (
    <UIProvider>
      <HashRouter>
        <MainLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/forecast" element={<ForecastView />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/water-level" element={<WaterLevelView />} />
            <Route path="/flood-forecast" element={<FloodForecastView />} />
            <Route path="/camera" element={<CameraView />} />
            <Route path="/images" element={<ImageView />} />
            <Route path="/documents" element={<DocumentsView />} />
            <Route path="/records" element={<DashboardView />} /> {/* Placeholder mapping */}
            <Route path="/general-info" element={<GeneralInfoView />} />
            <Route path="/demo-charts" element={<DemoChartsView />} />
            <Route path="/ai-safety" element={<AISafetyView />} />
            <Route path="/users" element={<UserManagementView />} />
            <Route path="/profile" element={<UserProfileView />} />
            <Route path="/settings" element={<SystemSettingsView />} />
            
            {/* Admin Routes */}
            <Route path="/specs" element={user.role === 'admin' ? <TechnicalSpecsView /> : <Navigate to="/dashboard" />} />
            <Route path="/operation" element={user.role === 'admin' ? <OperationView /> : <Navigate to="/dashboard" />} />
            <Route path="/manual-entry" element={user.role === 'admin' ? <ManualEntryView /> : <Navigate to="/dashboard" />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </MainLayout>
      </HashRouter>
    </UIProvider>
  );
};