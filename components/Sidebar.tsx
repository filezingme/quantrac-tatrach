
import React, { useEffect, useState } from 'react';
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
  Radio // Added for Sensor Icon
} from 'lucide-react';
import { db } from '../utils/db';
import { UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    // Check role initially and on storage change (if user updates profile)
    const updateUserRole = () => {
      const user = db.user.get();
      setUserRole(user.role);
    };
    updateUserRole();
    window.addEventListener('db-change', updateUserRole);
    return () => window.removeEventListener('db-change', updateUserRole);
  }, []);

  const menuItems = [
    { path: '/dashboard', label: 'Quan trắc & Giám sát', icon: LayoutDashboard, roles: ['admin', 'user'] },
    { path: '/alerts', label: 'Cảnh báo & Sự kiện', icon: AlertTriangle, roles: ['admin', 'user'] },
    { path: '/sensors', label: 'Danh sách Cảm biến', icon: Radio, roles: ['admin', 'user'] }, // New Item
    { path: '/ai-safety', label: 'Giám sát An toàn AI', icon: BrainCircuit, roles: ['admin', 'user'] }, 
    { path: '/map', label: 'Bản đồ GIS', icon: MapIcon, roles: ['admin', 'user'] },
    { path: '/water-level', label: 'Giám sát Mực nước', icon: TrendingUp, roles: ['admin', 'user'] },
    { path: '/forecast', label: 'Thông tin Dự báo', icon: CloudRain, roles: ['admin', 'user'] },
    { path: '/flood-forecast', label: 'Dự báo Lũ & Kịch bản', icon: Waves, roles: ['admin', 'user'] },
    { path: '/operation', label: 'Quy trình vận hành', icon: Activity, roles: ['admin'] }, // Admin only
    { path: '/documents', label: 'Văn bản & Quy định', icon: BookOpen, roles: ['admin', 'user'] },
    { path: '/camera', label: 'Camera', icon: Camera, roles: ['admin', 'user'] },
    { path: '/images', label: 'Thư viện Hình ảnh', icon: ImageIcon, roles: ['admin', 'user'] },
    { path: '/records', label: 'Hồ sơ & Biểu đồ', icon: FileText, roles: ['admin', 'user'] },
    { path: '/demo-charts', label: 'Thư viện Biểu đồ Demo', icon: PieChart, roles: ['admin', 'user'] },
    { path: '/specs', label: 'Thông số kỹ thuật', icon: Settings, roles: ['admin'] }, // Admin only
    { path: '/general-info', label: 'Thông tin chung', icon: Info, roles: ['admin', 'user'] },
    { path: '/manual-entry', label: 'Nhập liệu thủ công', icon: Edit3, roles: ['admin'] }, // Admin only
    { path: '/users', label: 'Quản lý người dùng', icon: Users, roles: ['admin'] }, // Admin only
  ];

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
            {menuItems.filter(item => item.roles.includes(userRole)).map((item) => {
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
                      {/* Tiny arrow pointing left */}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 transform"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {isCollapsed ? (
             <span className="text-[10px] font-bold text-slate-400">v3.0</span>
          ) : (
             <div className="flex justify-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Version 3.0.1 © 2026</p>
             </div>
          )}
        </div>
      </div>
    </>
  );
};
