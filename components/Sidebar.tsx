
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CloudRain, 
  Camera, 
  Info, 
  Settings, 
  Image as ImageIcon, 
  FileText, 
  Activity, 
  Edit3, 
  Waves,
  Map as MapIcon,
  BookOpen,
  TrendingUp,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Users,
  BrainCircuit,
  AlertTriangle,
  Radio,
  MoreHorizontal,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  X
} from 'lucide-react';
import { db } from '../utils/db';
import { SidebarConfigItem } from '../types';
import { useUI } from './GlobalUI';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

// Master list of all available items
const MASTER_MENU_ITEMS = [
  { path: '/dashboard', label: 'Quan trắc & Giám sát', icon: LayoutDashboard, roles: ['admin', 'user'] },
  { path: '/map', label: 'Bản đồ GIS', icon: MapIcon, roles: ['admin', 'user'] },
  { path: '/alerts', label: 'Cảnh báo & Sự kiện', icon: AlertTriangle, roles: ['admin', 'user'] },
  { path: '/sensors', label: 'Danh sách Cảm biến', icon: Radio, roles: ['admin', 'user'] },
  { path: '/ai-safety', label: 'Giám sát An toàn AI', icon: BrainCircuit, roles: ['admin', 'user'] }, 
  { path: '/water-level', label: 'Giám sát Mực nước', icon: TrendingUp, roles: ['admin', 'user'] },
  { path: '/forecast', label: 'Thông tin Dự báo', icon: CloudRain, roles: ['admin', 'user'] },
  { path: '/flood-forecast', label: 'Dự báo Lũ & Kịch bản', icon: Waves, roles: ['admin', 'user'] },
  { path: '/operation', label: 'Quy trình vận hành', icon: Activity, roles: ['admin'] },
  { path: '/documents', label: 'Văn bản & Quy định', icon: BookOpen, roles: ['admin', 'user'] },
  { path: '/camera', label: 'Camera', icon: Camera, roles: ['admin', 'user'] },
  { path: '/images', label: 'Thư viện Hình ảnh', icon: ImageIcon, roles: ['admin', 'user'] },
  { path: '/records', label: 'Hồ sơ & Biểu đồ', icon: FileText, roles: ['admin', 'user'] },
  { path: '/demo-charts', label: 'Thư viện Biểu đồ Demo', icon: PieChart, roles: ['admin', 'user'] },
  { path: '/specs', label: 'Thông số kỹ thuật', icon: Settings, roles: ['admin'] },
  { path: '/general-info', label: 'Thông tin chung', icon: Info, roles: ['admin', 'user'] },
  { path: '/manual-entry', label: 'Nhập liệu thủ công', icon: Edit3, roles: ['admin'] },
  { path: '/users', label: 'Quản lý người dùng', icon: Users, roles: ['admin'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  
  // Dynamic Menu State
  const [orderedItems, setOrderedItems] = useState(MASTER_MENU_ITEMS);
  const [config, setConfig] = useState<SidebarConfigItem[]>([]);
  
  // Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SidebarConfigItem[]>([]);

  const ui = useUI();

  // Load User Role & Sidebar Config
  useEffect(() => {
    const updateUserRole = () => {
      const user = db.user.get();
      setUserRole(user.role);
    };
    
    const updateSidebarConfig = () => {
      const savedConfig = db.sidebar.get();
      setConfig(savedConfig);
      
      // Merge saved config with master list to handle order & visibility
      if (savedConfig && savedConfig.length > 0) {
        const newOrderedItems = [...MASTER_MENU_ITEMS].sort((a, b) => {
          const itemA = savedConfig.find(c => c.path === a.path);
          const itemB = savedConfig.find(c => c.path === b.path);
          return (itemA?.order ?? 999) - (itemB?.order ?? 999);
        });
        setOrderedItems(newOrderedItems);
      }
    };

    updateUserRole();
    updateSidebarConfig();

    window.addEventListener('db-change', updateUserRole);
    window.addEventListener('db-change', updateSidebarConfig);
    
    return () => {
      window.removeEventListener('db-change', updateUserRole);
      window.removeEventListener('db-change', updateSidebarConfig);
    };
  }, []);

  // Filter items based on Role AND Visibility
  const visibleItems = useMemo(() => {
    return orderedItems.filter(item => {
      // 1. Role Check
      if (!item.roles.includes(userRole)) return false;
      
      // 2. Visibility Check (default to true if not in config)
      const conf = config.find(c => c.path === item.path);
      return conf ? conf.isVisible : true;
    });
  }, [orderedItems, userRole, config]);

  // --- Configuration Handlers ---

  const handleOpenConfig = () => {
    // Initialize temp config with current state or default if missing
    let currentConfig = db.sidebar.get();
    
    // Ensure all master items are present in temp config
    const mergedConfig = MASTER_MENU_ITEMS.map((item, index) => {
      const existing = currentConfig.find(c => c.path === item.path);
      return existing || { path: item.path, isVisible: true, order: index };
    }).sort((a, b) => a.order - b.order);

    setTempConfig(mergedConfig);
    setIsConfigOpen(true);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tempConfig.length - 1) return;

    const newConfig = [...tempConfig];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newConfig[index], newConfig[targetIndex]] = [newConfig[targetIndex], newConfig[index]];
    
    // Re-assign order based on new array index
    const reordered = newConfig.map((item, idx) => ({ ...item, order: idx }));
    setTempConfig(reordered);
  };

  const toggleVisibility = (path: string) => {
    setTempConfig(prev => prev.map(item => 
      item.path === path ? { ...item, isVisible: !item.isVisible } : item
    ));
  };

  const handleSaveConfig = () => {
    db.sidebar.set(tempConfig);
    setIsConfigOpen(false);
    ui.showToast('success', 'Đã cập nhật giao diện menu');
  };

  const handleResetConfig = () => {
    ui.confirm({
      title: 'Khôi phục mặc định',
      message: 'Bạn có chắc muốn đặt lại thứ tự menu về mặc định?',
      onConfirm: () => {
        db.sidebar.reset();
        setIsConfigOpen(false);
        ui.showToast('info', 'Đã khôi phục menu mặc định');
      }
    });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`
          fixed inset-0 z-[990] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={toggleSidebar}
      />

      <div 
        className={`
          fixed inset-y-0 left-0 z-[1000] 
          bg-white dark:bg-slate-800 
          border-r border-slate-200 dark:border-slate-700 
          text-slate-600 dark:text-slate-300 
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 
          ${isCollapsed ? 'md:w-20' : 'md:w-72'}
          shadow-lg md:shadow-none
        `}
      >
        {/* Desktop Toggle Button */}
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 z-50 transition-colors"
          title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Header - Strictly aligned */}
        <div className={`flex items-center h-16 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 transition-all duration-300 overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 dark:shadow-none shadow-md shrink-0 flex items-center justify-center">
              <Waves size={20} />
            </div>
            {!isCollapsed && (
              <div className="transition-opacity duration-200 opacity-100 w-auto">
                <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight whitespace-nowrap">Hồ Tả Trạch</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">Hệ thống quản lý</p>
              </div>
            )}
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 sidebar-scrollbar ${isCollapsed ? 'pr-0' : ''}`}>
          <ul className={`space-y-1.5 ${isCollapsed ? 'pl-[11px] pr-0' : 'px-3'}`}>
            {visibleItems.map((item) => {
              // Check if active (dashboard is also root)
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
              
              return (
                <li key={item.path} className="group relative">
                  <button
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                    className={`
                      relative w-full flex items-center 
                      ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} 
                      py-3 text-sm font-medium rounded-xl transition-all duration-200 
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon 
                      size={20} 
                      className={`shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} 
                    />
                    
                    {/* Text Label - Hidden when collapsed */}
                    <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                      {item.label}
                    </span>

                    {/* Active Indicator Dot */}
                    {isActive && !isCollapsed && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>

                  {/* Floating Tooltip for Collapsed State */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 transform"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Edit Menu */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 transition-all duration-300 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
          {!isCollapsed && (
             <p className="text-[10px] text-slate-400 dark:text-slate-500">v3.0.1 © 2026</p>
          )}
          
          <button 
            onClick={handleOpenConfig}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${isCollapsed ? '' : 'ml-auto'}`}
            title="Tùy chỉnh Menu"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* --- CONFIGURATION MODAL --- */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MoreHorizontal size={20} className="text-blue-600 dark:text-blue-400"/> Tùy chỉnh Menu
                 </h3>
                 <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
              </div>

              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-[11px] text-yellow-800 dark:text-yellow-400 text-center font-medium border-b border-yellow-100 dark:border-yellow-900/30">
                 Kéo hoặc dùng nút mũi tên để sắp xếp. Ẩn các mục không cần thiết.
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <div className="space-y-2">
                    {tempConfig.map((item, index) => {
                       const masterItem = MASTER_MENU_ITEMS.find(m => m.path === item.path);
                       if (!masterItem) return null;

                       return (
                          <div key={item.path} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.isVisible ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60'}`}>
                             <div className="flex flex-col gap-1 text-slate-400">
                                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-30"><MoveUp size={14}/></button>
                                <button onClick={() => moveItem(index, 'down')} disabled={index === tempConfig.length - 1} className="hover:text-blue-600 disabled:opacity-30"><MoveDown size={14}/></button>
                             </div>
                             
                             <div className={`p-2 rounded-md ${item.isVisible ? 'bg-blue-50 dark:bg-slate-600 text-blue-600 dark:text-blue-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                <masterItem.icon size={18}/>
                             </div>
                             
                             <div className="flex-1 font-medium text-sm text-slate-700 dark:text-slate-200">
                                {masterItem.label}
                             </div>

                             <button 
                                onClick={() => toggleVisibility(item.path)}
                                className={`p-2 rounded-lg transition-colors ${item.isVisible ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600' : 'text-slate-300 hover:text-slate-500'}`}
                                title={item.isVisible ? "Đang hiện" : "Đang ẩn"}
                             >
                                {item.isVisible ? <Eye size={18}/> : <EyeOff size={18}/>}
                             </button>
                          </div>
                       );
                    })}
                 </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between gap-3">
                 <button 
                    onClick={handleResetConfig}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                 >
                    <RotateCcw size={16}/> Mặc định
                 </button>
                 <button 
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all"
                 >
                    <Save size={16}/> Lưu thay đổi
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
