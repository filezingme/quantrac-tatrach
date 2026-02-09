
import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  X, 
  Pencil, 
  Check, 
  GripVertical,
  Sliders
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

// Master list with specific colors for each icon
const MASTER_MENU_ITEMS = [
  { path: '/dashboard', label: 'Quan trắc & Giám sát', icon: LayoutDashboard, roles: ['admin', 'user'], color: 'text-blue-600 dark:text-blue-400' },
  { path: '/map', label: 'Bản đồ GIS', icon: MapIcon, roles: ['admin', 'user'], color: 'text-emerald-500 dark:text-emerald-400' },
  { path: '/alerts', label: 'Cảnh báo & Sự kiện', icon: AlertTriangle, roles: ['admin', 'user'], color: 'text-red-500 dark:text-red-400' },
  { path: '/sensors', label: 'Danh sách Cảm biến', icon: Radio, roles: ['admin', 'user'], color: 'text-cyan-500 dark:text-cyan-400' },
  { path: '/ai-safety', label: 'Giám sát An toàn AI', icon: BrainCircuit, roles: ['admin', 'user'], color: 'text-purple-600 dark:text-purple-400' }, 
  { path: '/water-level', label: 'Giám sát Mực nước', icon: TrendingUp, roles: ['admin', 'user'], color: 'text-sky-500 dark:text-sky-400' },
  { path: '/forecast', label: 'Thông tin Dự báo', icon: CloudRain, roles: ['admin', 'user'], color: 'text-indigo-500 dark:text-indigo-400' },
  { path: '/flood-forecast', label: 'Dự báo Lũ & Kịch bản', icon: Waves, roles: ['admin', 'user'], color: 'text-blue-700 dark:text-blue-300' },
  { path: '/operation', label: 'Quy trình vận hành', icon: Activity, roles: ['admin'], color: 'text-amber-500 dark:text-amber-400' },
  { path: '/documents', label: 'Văn bản & Quy định', icon: BookOpen, roles: ['admin', 'user'], color: 'text-slate-500 dark:text-slate-400' },
  { path: '/camera', label: 'Camera', icon: Camera, roles: ['admin', 'user'], color: 'text-rose-500 dark:text-rose-400' },
  { path: '/images', label: 'Thư viện Hình ảnh', icon: ImageIcon, roles: ['admin', 'user'], color: 'text-pink-500 dark:text-pink-400' },
  { path: '/records', label: 'Hồ sơ & Biểu đồ', icon: FileText, roles: ['admin', 'user'], color: 'text-teal-500 dark:text-teal-400' },
  { path: '/demo-charts', label: 'Thư viện Biểu đồ Demo', icon: PieChart, roles: ['admin', 'user'], color: 'text-orange-500 dark:text-orange-400' },
  { path: '/specs', label: 'Thông số kỹ thuật', icon: Settings, roles: ['admin'], color: 'text-gray-600 dark:text-gray-400' },
  { path: '/general-info', label: 'Thông tin chung', icon: Info, roles: ['admin', 'user'], color: 'text-blue-400 dark:text-blue-300' },
  { path: '/manual-entry', label: 'Nhập liệu thủ công', icon: Edit3, roles: ['admin'], color: 'text-green-600 dark:text-green-500' },
  { path: '/users', label: 'Quản lý người dùng', icon: Users, roles: ['admin'], color: 'text-fuchsia-500 dark:text-fuchsia-400' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Initialize role directly from DB to avoid flash of wrong state
  const [userRole, setUserRole] = useState<'admin' | 'user'>(() => {
    try {
        return db.user.get().role;
    } catch {
        return 'user';
    }
  });
  
  // Dynamic Menu State
  const [orderedItems, setOrderedItems] = useState(MASTER_MENU_ITEMS);
  const [config, setConfig] = useState<SidebarConfigItem[]>([]);
  
  // Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SidebarConfigItem[]>([]);
  
  // Renaming State
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // App Settings (Name/Subtitle)
  const [appSettings, setAppSettings] = useState(db.settings.get());

  // Settings Menu Popover State
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  const ui = useUI();

  // Load User Role, Sidebar Config & App Settings
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

    const updateAppSettings = () => {
        setAppSettings(db.settings.get());
    };

    updateUserRole();
    updateSidebarConfig();
    updateAppSettings();

    window.addEventListener('db-change', updateUserRole);
    window.addEventListener('db-change', updateSidebarConfig);
    window.addEventListener('db-change', updateAppSettings);
    
    return () => {
      window.removeEventListener('db-change', updateUserRole);
      window.removeEventListener('db-change', updateSidebarConfig);
      window.removeEventListener('db-change', updateAppSettings);
    };
  }, []);

  // Click outside listener for Settings Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    setEditingPath(null); // Reset edit mode
    setIsConfigOpen(true);
    setIsSettingsMenuOpen(false); // Close popover
  };

  const handleGoToSystemSettings = () => {
    navigate('/settings');
    setIsSettingsMenuOpen(false);
    if (window.innerWidth < 768) toggleSidebar();
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

  const handleStartEdit = (path: string, currentLabel: string) => {
    setEditingPath(path);
    setEditValue(currentLabel);
  };

  const handleSaveLabel = (path: string) => {
    setTempConfig(prev => prev.map(item => 
        item.path === path ? { ...item, customLabel: editValue } : item
    ));
    setEditingPath(null);
  };

  const handleCancelEdit = () => {
    setEditingPath(null);
    setEditValue('');
  };

  const handleSaveConfig = () => {
    db.sidebar.set(tempConfig);
    setIsConfigOpen(false);
    ui.showToast('success', 'Đã cập nhật giao diện menu');
  };

  const handleResetConfig = () => {
    ui.confirm({
      title: 'Khôi phục mặc định',
      message: 'Bạn có chắc muốn đặt lại thứ tự và tên menu về mặc định?',
      onConfirm: () => {
        db.sidebar.reset();
        setIsConfigOpen(false);
        ui.showToast('info', 'Đã khôi phục menu mặc định');
      }
    });
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); 
    if (draggedIndex === null || draggedIndex === index) return;

    const newConfig = [...tempConfig];
    const draggedItem = newConfig[draggedIndex];
    
    newConfig.splice(draggedIndex, 1);
    newConfig.splice(index, 0, draggedItem);

    setTempConfig(newConfig.map((item, idx) => ({ ...item, order: idx })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-md 
          border-r border-slate-200/50 dark:border-slate-700/50 
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
        <div className={`flex items-center h-16 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 transition-all duration-300 overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
            {appSettings.logo ? (
                <img src={appSettings.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
            ) : (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/30 shrink-0 flex items-center justify-center">
                  <Waves size={20} />
                </div>
            )}
            {!isCollapsed && (
              <div className="transition-opacity duration-200 opacity-100 w-auto min-w-0">
                <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight truncate max-w-[180px]">{appSettings.appName}</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate max-w-[180px]">{appSettings.appSubtitle}</p>
              </div>
            )}
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 sidebar-scrollbar ${isCollapsed ? 'px-0' : ''}`}>
          <ul className={`space-y-1.5 ${isCollapsed ? 'px-0 flex flex-col items-center ml-[4px]' : 'px-3'}`}>
            {visibleItems.map((item) => {
              const isActive = currentPath === item.path || (item.path === '/dashboard' && currentPath === '/');
              const conf = config.find(c => c.path === item.path);
              const label = conf?.customLabel || item.label;

              return (
                <li key={item.path} className={`group relative ${isCollapsed ? 'w-full flex justify-center' : ''}`}>
                  <button
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 768) toggleSidebar();
                    }}
                    className={`
                      relative flex items-center 
                      ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'justify-start w-full px-4 py-3'} 
                      text-sm font-medium rounded-xl transition-all duration-200 
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-200/50 dark:border-blue-700/50'
                        : 'hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400'
                      }
                    `}
                    title={isCollapsed ? label : undefined}
                  >
                    <item.icon 
                      size={20} 
                      className={`shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : item.color} ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}`} 
                    />
                    
                    {/* Text Label - Hidden when collapsed */}
                    <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isActive ? 'font-bold' : ''} ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                      {label}
                    </span>

                    {/* Active Indicator Dot - Reduced intensity blue */}
                    {isActive && !isCollapsed && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-400/50" />
                    )}
                  </button>

                  {/* Floating Tooltip for Collapsed State */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 shadow-lg whitespace-nowrap z-50">
                      {label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 transform"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Unified Settings Menu */}
        <div 
          className={`relative p-4 border-t border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-slate-900/30 transition-all duration-300 flex items-center select-none ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-center'}`}
          ref={settingsMenuRef}
        >
          {!isCollapsed && (
             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[180px]">{appSettings.appFooter}</p>
          )}
          
          {/* Popover Menu */}
          {isSettingsMenuOpen && (
            <div className={`absolute bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-56 overflow-hidden z-[1100] animate-in fade-in duration-200 ${
              isCollapsed 
                ? 'left-full ml-3 bottom-0 slide-in-from-left-2' 
                : 'bottom-full mb-2 right-0 slide-in-from-bottom-2'
            }`}>
               <div className="p-1 space-y-0.5">
                  <button 
                    onClick={handleOpenConfig}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <Sliders size={16} className="text-slate-400"/>
                    Tùy chỉnh Menu
                  </button>
                  
                  {userRole === 'admin' && (
                    <button 
                      onClick={handleGoToSystemSettings}
                      className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <Settings size={16} className="text-slate-400"/>
                      Cài đặt hệ thống
                    </button>
                  )}
               </div>
            </div>
          )}

          <button 
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            className={`p-1.5 rounded-lg transition-colors ${isSettingsMenuOpen ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'} ${isCollapsed ? '' : 'absolute right-3'}`}
            title="Cài đặt & Tùy chỉnh"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* --- CONFIGURATION MODAL (Existing logic preserved) --- */}
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
                 Kéo thả để sắp xếp vị trí hoặc đổi tên các mục.
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <div className="space-y-2">
                    {tempConfig.map((item, index) => {
                       const masterItem = MASTER_MENU_ITEMS.find(m => m.path === item.path);
                       if (!masterItem) return null;
                       
                       const currentLabel = item.customLabel || masterItem.label;
                       const isEditing = editingPath === item.path;
                       const isDragging = draggedIndex === index;

                       return (
                          <div 
                            key={item.path} 
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`
                                flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move
                                ${item.isVisible 
                                    ? 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600' 
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-60'
                                }
                                ${isDragging ? 'opacity-50 scale-95 border-blue-400 border-dashed' : ''}
                                hover:border-blue-300 dark:hover:border-slate-500
                            `}
                          >
                             {/* Drag Handle */}
                             <div className="text-slate-300 dark:text-slate-500 cursor-grab active:cursor-grabbing">
                                <GripVertical size={16}/>
                             </div>
                             
                             <div className={`p-2 rounded-md bg-slate-50 dark:bg-slate-600 ${masterItem.color}`}>
                                <masterItem.icon size={18}/>
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={editValue} 
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveLabel(item.path);
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            className="w-full text-sm border border-blue-400 rounded px-2 py-1 outline-none bg-white dark:bg-slate-800 dark:text-white"
                                        />
                                        <button onClick={() => handleSaveLabel(item.path)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check size={14}/></button>
                                        <button onClick={handleCancelEdit} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                                    </div>
                                ) : (
                                    <div className="group flex items-center gap-2">
                                        <span className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate" title={currentLabel}>
                                            {currentLabel}
                                        </span>
                                        <button 
                                            onClick={() => handleStartEdit(item.path, currentLabel)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity"
                                            title="Đổi tên"
                                        >
                                            <Pencil size={12}/>
                                        </button>
                                    </div>
                                )}
                             </div>

                             {/* Manual Sort Buttons (kept for accessibility) */}
                             <div className="flex flex-col gap-0.5 text-slate-300">
                                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="hover:text-blue-600 disabled:opacity-20"><MoveUp size={10}/></button>
                                <button onClick={() => moveItem(index, 'down')} disabled={index === tempConfig.length - 1} className="hover:text-blue-600 disabled:opacity-20"><MoveDown size={10}/></button>
                             </div>

                             <button 
                                onClick={() => toggleVisibility(item.path)}
                                className={`p-2 rounded-lg transition-colors ml-1 ${item.isVisible ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600' : 'text-slate-300 hover:text-slate-500'}`}
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
