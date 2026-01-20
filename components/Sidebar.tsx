import React from 'react';
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
  PieChart
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
  { path: '/dashboard', label: 'Quan trắc & Giám sát', icon: LayoutDashboard },
  { path: '/map', label: 'Bản đồ GIS', icon: MapIcon },
  { path: '/water-level', label: 'Giám sát Mực nước', icon: TrendingUp },
  { path: '/forecast', label: 'Thông tin Dự báo', icon: CloudRain },
  { path: '/flood-forecast', label: 'Dự báo Lũ & Kịch bản', icon: Waves },
  { path: '/operation', label: 'Quy trình vận hành', icon: Activity },
  { path: '/documents', label: 'Văn bản & Quy định', icon: BookOpen },
  { path: '/camera', label: 'Camera', icon: Camera },
  { path: '/images', label: 'Thư viện Hình ảnh', icon: ImageIcon },
  { path: '/records', label: 'Hồ sơ & Biểu đồ', icon: FileText },
  { path: '/demo-charts', label: 'Thư viện Biểu đồ Demo', icon: PieChart },
  { path: '/specs', label: 'Thông số kỹ thuật', icon: Settings },
  { path: '/general-info', label: 'Thông tin chung', icon: Info },
  { path: '/manual-entry', label: 'Nhập liệu thủ công', icon: Edit3 },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-lg md:shadow-none flex flex-col`}>
      {/* Header - Adjusted to h-16 to match App header height and remove gap */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 dark:shadow-none shadow-md">
            <Waves size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Hồ Tả Trạch</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Hệ thống quản lý</p>
          </div>
        </div>
        <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            // Check if active (dashboard is also root)
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <item.icon 
                    size={20} 
                    className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} 
                  />
                  {item.label}
                  {isActive && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30">
        <div className="flex justify-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Version 3.0.1 © 2026</p>
        </div>
      </div>
    </div>
  );
};