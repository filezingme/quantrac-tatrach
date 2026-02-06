
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { UserManagementView } from './views/UserManagementView';
import { AISafetyView } from './views/AISafetyView';
import { AlertHistoryView } from './views/AlertHistoryView'; 
import { SensorListView } from './views/SensorListView'; 
import { LoginView } from './views/LoginView';
import { MaintenanceView } from './views/MaintenanceView'; // NEW IMPORT
import { UIProvider, useUI } from './components/GlobalUI';
import { AIAssistant } from './components/AIAssistant'; 
import { GlobalSearch } from './components/GlobalSearch';
import { AppNotification, UserProfile, SystemSettings } from './types';
import { Menu, Bell, Check, LogOut, User, Settings as SettingsIcon, X, AlertTriangle, AlertCircle, Info, Clock, ChevronLeft, Mail, Search, Command, Wrench } from 'lucide-react';
import { db } from './utils/db';

const ProtectedRoute = ({ children, role }: { children?: React.ReactNode; role?: 'admin' | 'user' }) => {
  const user = db.user.get();
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const MainLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [viewNotification, setViewNotification] = useState<AppNotification | null>(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [user, setUser] = useState<UserProfile>(db.user.get());
  const [settings, setSettings] = useState<SystemSettings>(db.settings.get());

  const navigate = useNavigate();
  const location = useLocation();

  const ui = useUI();

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    setNotifications(db.notifications.get());
    setUser(db.user.get());
    setSettings(db.settings.get());

    const handleDbChange = () => {
      setNotifications(db.notifications.get());
      setUser(db.user.get());
      setSettings(db.settings.get());
    };
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Update Document Title based on settings
  useEffect(() => {
    document.title = settings.appTitle || 'Hệ thống Quản lý Hồ Tả Trạch';
  }, [settings.appTitle]);

  // Scroll to top on route change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // --- MAINTENANCE MODE CHECK ---
  if (settings.maintenanceMode && user.role !== 'admin') {
      return <MaintenanceView onLogout={onLogout} />;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
        if (isNotifOpen) setViewNotification(null);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    localStorage.setItem('sidebarCollapsed', String(!isSidebarCollapsed));
  };

  const handleMarkAllRead = () => {
    db.notifications.markAllRead();
    ui.showToast('success', 'Đã đánh dấu tất cả là đã đọc');
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    db.notifications.set(updated);
  };

  const handleMarkAsUnread = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = notifications.map(n => n.id === id ? { ...n, read: false } : n);
    db.notifications.set(updated);
    setViewNotification(null);
    ui.showToast('info', 'Đã đánh dấu chưa đọc');
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    onLogout();
  };

  const openNotificationDetail = (notif: AppNotification) => {
    setViewNotification(notif);
    handleMarkAsRead(notif.id);
  };

  const closeNotificationDetail = () => {
    setViewNotification(null);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'alert': return <AlertCircle size={18} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const getNotifBg = (type: string, read: boolean) => {
    if (read) return 'hover:bg-slate-50 dark:hover:bg-slate-700/30';
    switch(type) {
      case 'alert': return 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20';
      case 'warning': return 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20';
      default: return 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors duration-200">
      
      {/* MAINTENANCE BANNER FOR ADMINS */}
      {settings.maintenanceMode && user.role === 'admin' && (
        <div className="absolute top-0 left-0 right-0 z-[600] bg-red-600 text-white text-xs font-bold py-1 px-4 text-center shadow-md flex items-center justify-center gap-2">
           <Wrench size={12} className="animate-spin-slow"/>
           CHẾ ĐỘ BẢO TRÌ ĐANG BẬT - Người dùng thường không thể truy cập
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
      />

      <div className={`flex-1 flex flex-col min-w-0 relative ${settings.maintenanceMode && user.role === 'admin' ? 'pt-6' : ''}`}>
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 sm:px-6 z-[500] shadow-sm relative transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              <Menu size={24} />
            </button>
            {/* CHANGED: Use settings.appTitle instead of settings.appName */}
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">
              {settings.appTitle || settings.appName}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
             {/* ... (Search, Notification, User Menu - keeping same structure) ... */}
             <button 
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center w-full max-w-[200px] lg:max-w-[320px] gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 text-sm transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
             >
                <Search size={16} />
                <span className="flex-1 text-left truncate">Tìm kiếm...</span>
                <div className="flex items-center gap-0.5 ml-2">
                   <kbd className="hidden lg:inline-flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-[10px] font-bold shadow-sm text-slate-500 dark:text-slate-400">
                      Ctrl + K
                   </kbd>
                </div>
             </button>
             <button 
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
             >
                <Search size={20} />
             </button>

             <div className="relative" ref={notifRef}>
               <button 
                onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (isNotifOpen) setViewNotification(null);
                }}
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

               {isNotifOpen && (
                 <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                   <div className="relative overflow-hidden h-[450px]">
                       <div 
                          className="flex h-full transition-transform duration-300 ease-in-out"
                          style={{ transform: viewNotification ? 'translateX(-100%)' : 'translateX(0)' }}
                       >
                          <div className="w-full h-full shrink-0 flex flex-col">
                             <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 flex-none">
                               <h3 className="font-semibold text-slate-800 dark:text-slate-100">Thông báo</h3>
                               {unreadCount > 0 && (
                                 <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1 dark:text-blue-400">
                                   <Check size={12} /> Đánh dấu đã đọc
                                 </button>
                               )}
                             </div>
                             
                             <div className="flex-1 hover-scrollbar">
                               {notifications.length === 0 ? (
                                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                    <Bell size={32} className="mb-2 opacity-20"/>
                                    Không có thông báo mới
                                 </div>
                               ) : (
                                 notifications.slice(0, 5).map(notif => (
                                   <div 
                                      key={notif.id} 
                                      onClick={() => openNotificationDetail(notif)}
                                      className={`p-4 border-b border-slate-50 dark:border-slate-700 transition-colors cursor-pointer group ${getNotifBg(notif.type, notif.read)}`}
                                   >
                                      <div className="flex justify-between items-start mb-1 gap-2">
                                        <div className="flex items-center gap-2">
                                          {getNotifIcon(notif.type)}
                                          <span className={`text-sm font-medium line-clamp-1 ${notif.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                                            {notif.title}
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                                      </div>
                                      <p className={`text-xs ml-6 line-clamp-2 ${notif.read ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{notif.message}</p>
                                   </div>
                                 ))
                               )}
                             </div>
                             
                             <div className="p-2 border-t border-slate-100 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-800/50 flex-none">
                               <button 
                                  onClick={() => { setIsNotifOpen(false); setShowAllNotifications(true); }}
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold w-full py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                               >
                                  Xem tất cả thông báo
                               </button>
                             </div>
                          </div>

                          <div className="w-full h-full shrink-0 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                             {viewNotification && (
                               <>
                                 <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-800 shadow-sm flex-none z-10">
                                    <button 
                                      onClick={closeNotificationDetail}
                                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                                      title="Quay lại danh sách"
                                    >
                                      <ChevronLeft size={20}/>
                                    </button>
                                    <div className="flex-1 min-w-0">
                                       <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">Chi tiết thông báo</h3>
                                    </div>
                                    <button
                                      onClick={(e) => handleMarkAsUnread(viewNotification.id, e)}
                                      className="relative p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors group"
                                      title="Đánh dấu chưa đọc"
                                    >
                                        <Mail size={18} />
                                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
                                    </button>
                                 </div>
                                 
                                 <div className="p-5 overflow-y-auto flex-1 hover-scrollbar bg-white dark:bg-slate-800">
                                    <div className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
                                       viewNotification.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 
                                       viewNotification.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' : 
                                       'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                    }`}>
                                       <div className="mt-0.5 shrink-0">
                                          {getNotifIcon(viewNotification.type)}
                                       </div>
                                       <div>
                                          <h4 className="font-bold text-sm mb-1">{viewNotification.title}</h4>
                                          <span className="text-[10px] opacity-80 flex items-center gap-1">
                                             <Clock size={10}/> {viewNotification.time}
                                          </span>
                                       </div>
                                    </div>
                                    
                                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                       {viewNotification.message}
                                    </div>
                                 </div>
                               </>
                             )}
                          </div>
                       </div>
                   </div>
                 </div>
               )}
             </div>

             <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700" ref={userRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 group outline-none pl-2"
                >
                  <div className="flex flex-col items-end hidden sm:flex mr-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {user.role === 'admin' ? 'ADMIN' : 'USER'}
                    </span>
                  </div>
                  <div className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-blue-200 shadow-md ring-2 ring-transparent group-hover:ring-blue-100 dark:group-hover:ring-blue-900 transition-all ${isUserMenuOpen ? 'ring-blue-200 dark:ring-blue-800' : ''}`}>
                    {user.avatar}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                       <button 
                         onClick={() => { navigate('/profile'); setIsUserMenuOpen(false); }}
                         className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                       >
                         <User size={16} /> Hồ sơ cá nhân
                       </button>
                       {user.role === 'admin' && (
                         <button 
                           onClick={() => { navigate('/settings'); setIsUserMenuOpen(false); }}
                           className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition-colors"
                         >
                           <SettingsIcon size={16} /> Cài đặt hệ thống
                         </button>
                       )}
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

        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-900 transition-colors duration-200">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/ai-safety" element={<AISafetyView />} />
            <Route path="/water-level" element={<WaterLevelView />} />
            <Route path="/forecast" element={<ForecastView />} />
            <Route path="/documents" element={<DocumentsView />} />
            <Route path="/records" element={<ChartsView />} />
            <Route path="/images" element={<ImageView />} />
            <Route path="/flood-forecast" element={<FloodForecastView />} />
            <Route path="/general-info" element={<GeneralInfoView />} />
            <Route path="/camera" element={<CameraView />} />
            <Route path="/demo-charts" element={<DemoChartsView />} />
            <Route path="/profile" element={<UserProfileView />} />
            <Route path="/alerts" element={<AlertHistoryView />} />
            <Route path="/sensors" element={<SensorListView />} />
            
            <Route 
              path="/users" 
              element={
                <ProtectedRoute role="admin">
                  <UserManagementView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute role="admin">
                  <SystemSettingsView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manual-entry" 
              element={
                <ProtectedRoute role="admin">
                  <ManualEntryView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/specs" 
              element={
                <ProtectedRoute role="admin">
                  <TechnicalSpecsView />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/operation" 
              element={
                <ProtectedRoute role="admin">
                  <OperationView />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {settings.features.enableAIAssistant && <AIAssistant />}

        {/* ... (Existing Notification Modal Logic) ... */}
        {showAllNotifications && (
          <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                <div className="relative overflow-hidden flex-1 flex flex-col">
                   <div 
                      className="flex h-full w-full transition-transform duration-300 ease-in-out"
                      style={{ transform: viewNotification ? 'translateX(-100%)' : 'translateX(0)' }}
                   >
                      <div className="w-full h-full shrink-0 flex flex-col">
                         <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 flex-none">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                               <Bell size={20} className="text-blue-600 dark:text-blue-400"/> Trung tâm thông báo
                            </h3>
                            <div className="flex items-center gap-2">
                               {unreadCount > 0 && (
                                  <button 
                                     onClick={handleMarkAllRead} 
                                     className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors mr-2"
                                  >
                                     Đánh dấu tất cả đã đọc
                                  </button>
                               )}
                               <button 
                                  onClick={() => { setShowAllNotifications(false); setViewNotification(null); }} 
                                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                               >
                                  <X size={20}/>
                               </button>
                            </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20 hover-scrollbar">
                            {notifications.length === 0 ? (
                               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                  <Bell size={48} className="mb-4 opacity-20"/>
                                  <p>Không có thông báo nào</p>
                               </div>
                            ) : (
                               notifications.map(notif => (
                                  <div 
                                     key={notif.id} 
                                     onClick={() => openNotificationDetail(notif)}
                                     className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md flex gap-4 ${
                                        notif.read 
                                           ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                                           : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                                     }`}
                                  >
                                     <div className={`mt-1 p-2 rounded-full h-fit ${
                                        notif.type === 'alert' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 
                                        notif.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 
                                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                     }`}>
                                        {getNotifIcon(notif.type)}
                                     </div>
                                     <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                           <h4 className={`text-sm font-bold ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                              {notif.title}
                                           </h4>
                                           <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{notif.time}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                                           {notif.message}
                                        </p>
                                     </div>
                                     {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                     )}
                                  </div>
                               ))
                            )}
                         </div>
                      </div>

                      <div className="w-full h-full shrink-0 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                         {viewNotification && (
                            <>
                               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-white dark:bg-slate-800 shadow-sm flex-none z-10">
                                  <button 
                                    onClick={closeNotificationDetail}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                                    title="Quay lại danh sách"
                                  >
                                    <ChevronLeft size={24}/>
                                  </button>
                                  <div className="flex-1 min-w-0">
                                     <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">Chi tiết thông báo</h3>
                                  </div>
                                  <button
                                      onClick={(e) => handleMarkAsUnread(viewNotification.id, e)}
                                      className="relative p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors group"
                                      title="Đánh dấu chưa đọc"
                                  >
                                      <Mail size={20} />
                                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
                                  </button>
                                  <button 
                                     onClick={() => { setShowAllNotifications(false); setViewNotification(null); }}
                                     className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                                  >
                                     <X size={20}/>
                                  </button>
                                </div>
                               
                               <div className="p-8 overflow-y-auto flex-1 hover-scrollbar bg-white dark:bg-slate-800">
                                  <div className={`mb-6 p-4 rounded-xl flex items-start gap-4 ${
                                     viewNotification.type === 'alert' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 
                                     viewNotification.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200' : 
                                     'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                                  }`}>
                                     <div className="mt-1 shrink-0 p-2 bg-white/50 dark:bg-black/10 rounded-full">
                                        {getNotifIcon(viewNotification.type)}
                                     </div>
                                     <div className="flex-1">
                                        <h4 className="font-bold text-lg mb-2">{viewNotification.title}</h4>
                                        <span className="text-xs opacity-80 flex items-center gap-1.5 font-medium">
                                           <Clock size={12}/> {viewNotification.time}
                                        </span>
                                     </div>
                                  </div>
                                  
                                  <div className="prose dark:prose-invert max-w-none">
                                     <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
                                        {viewNotification.message}
                                     </p>
                                  </div>
                               </div>
                            </>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = (user: UserProfile) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    // Ensure the logged in user is set in our DB store for the session
    db.user.set(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <UIProvider>
      {isAuthenticated ? (
        <HashRouter>
          <MainLayout onLogout={handleLogout} />
        </HashRouter>
      ) : (
        <LoginView onLogin={handleLogin} />
      )}
    </UIProvider>
  );
};
