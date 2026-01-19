import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { ForecastView } from './views/ForecastView';
import { TechnicalSpecsView } from './views/TechnicalSpecsView';
import { OperationView } from './views/OperationView';
import { DocumentsView } from './views/DocumentsView';
import { ChartsView } from './views/ChartsView';
import { ImageView } from './views/ImageView';
import { FloodForecastView } from './views/FloodForecastView';
import { ManualEntryView } from './views/ManualEntryView';
import { GeneralInfoView } from './views/GeneralInfoView';
import { CameraView } from './views/CameraView';
import { MapView } from './views/MapView';
import { WaterLevelView } from './views/WaterLevelView';
import { DemoChartsView } from './views/DemoChartsView';
import { UserProfileView } from './views/UserProfileView';
import { SystemSettingsView } from './views/SystemSettingsView';
import { LoginView } from './views/LoginView';
import { UIProvider, useUI } from './components/GlobalUI';
import { ViewMode, AppNotification, UserProfile } from './types';
import { Menu, Bell, Check, LogOut, User, Settings as SettingsIcon, X } from 'lucide-react';
import { db } from './utils/db';

// Extract the main layout to a separate component to use the UI Context
const MainLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<UserProfile>(db.user.get());

  // Global UI hook
  const ui = useUI();

  // Refs for click outside
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // Initial load
    setNotifications(db.notifications.get());
    setUser(db.user.get());

    // Listen for DB changes
    const handleDbChange = () => {
      setNotifications(db.notifications.get());
      setUser(db.user.get());
    };
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleMarkAllRead = () => {
    db.notifications.markAllRead();
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    ui.confirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
      confirmText: 'Đăng xuất',
      type: 'danger',
      onConfirm: () => {
        onLogout();
        ui.showToast('info', 'Đã đăng xuất thành công');
      }
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderView = () => {
    switch (currentView) {
      case ViewMode.DASHBOARD:
        return <DashboardView />;
      case ViewMode.MAP:
        return <MapView />;
      case ViewMode.WATER_LEVEL:
        return <WaterLevelView />;
      case ViewMode.FORECAST: 
        return <ForecastView />;
      case ViewMode.TECHNICAL_SPECS:
        return <TechnicalSpecsView />;
      case ViewMode.OPERATION:
        return <OperationView />;
      case ViewMode.DOCUMENTS:
        return <DocumentsView />;
      case ViewMode.RECORDS:
        return <ChartsView />;
      case ViewMode.IMAGES:
        return <ImageView />;
      case ViewMode.FLOOD_FORECAST:
        return <FloodForecastView />;
      case ViewMode.MANUAL_ENTRY:
        return <ManualEntryView />;
      case ViewMode.GENERAL_INFO:
        return <GeneralInfoView />;
      case ViewMode.CAMERA:
        return <CameraView />;
      case ViewMode.DEMO_CHARTS:
        return <DemoChartsView />;
      case ViewMode.USER_PROFILE:
        return <UserProfileView />;
      case ViewMode.SYSTEM_SETTINGS:
        return <SystemSettingsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 dark:text-slate-500">
            <p className="text-xl">Chức năng đang được phát triển</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-200">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 sm:px-6 z-20 shadow-sm relative transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
              Hệ thống hỗ trợ ra quyết định
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Notifications */}
             <div className="relative" ref={notifRef}>
               <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 transition-colors ${isNotifOpen ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg' : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400'}`}
               >
                 <Bell size={20} />
                 {unreadCount > 0 && (
                   <>
                     <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                     <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
                   </>
                 )}
               </button>

               {/* Notification Dropdown */}
               {isNotifOpen && (
                 <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                     <h3 className="font-semibold text-slate-800 dark:text-slate-100">Thông báo</h3>
                     {unreadCount > 0 && (
                       <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400">
                         <Check size={12} /> Đánh dấu đã đọc
                       </button>
                     )}
                   </div>
                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                     {notifications.length === 0 ? (
                       <div className="p-6 text-center text-slate-400 text-sm">Không có thông báo mới</div>
                     ) : (
                       notifications.map(notif => (
                         <div key={notif.id} className={`p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-sm font-medium ${notif.type === 'alert' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {notif.type === 'alert' && '⚠️ '}{notif.title}
                              </span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{notif.time}</span>
                            </div>
                            <p className={`text-xs ${notif.read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{notif.message}</p>
                         </div>
                       ))
                     )}
                   </div>
                   <div className="p-2 border-t border-slate-100 dark:border-slate-700 text-center">
                     <button className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium w-full py-1">Xem tất cả</button>
                   </div>
                 </div>
               )}
             </div>

             {/* User Profile */}
             <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700" ref={userRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 group outline-none"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{user.name}</p>
                    <p className="text-[10px] text-slate-400">{user.role}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-blue-200 shadow-md ring-2 ring-transparent group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all ${isUserMenuOpen ? 'ring-blue-200 dark:ring-blue-800' : ''}`}>
                    {user.avatar}
                  </div>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                       <button 
                         onClick={() => { setCurrentView(ViewMode.USER_PROFILE); setIsUserMenuOpen(false); }}
                         className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                       >
                         <User size={16} /> Hồ sơ cá nhân
                       </button>
                       <button 
                         onClick={() => { setCurrentView(ViewMode.SYSTEM_SETTINGS); setIsUserMenuOpen(false); }}
                         className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                       >
                         <SettingsIcon size={16} /> Cài đặt hệ thống
                       </button>
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                      <button 
                        onClick={handleLogoutClick}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors font-medium"
                      >
                        <LogOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-900 transition-colors duration-200">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- AUTHENTICATION STATE ---
  // Initialize from localStorage to persist login across reloads
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <UIProvider>
      {isAuthenticated ? (
        <MainLayout onLogout={handleLogout} />
      ) : (
        <LoginView onLogin={handleLogin} />
      )}
    </UIProvider>
  );
};

export default App;