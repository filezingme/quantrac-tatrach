import React from 'react';
import { ViewMode } from '../types';
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
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
  { id: ViewMode.DASHBOARD, label: 'Quan trắc & Giám sát', icon: LayoutDashboard },
  { id: ViewMode.MAP, label: 'Bản đồ GIS', icon: MapIcon },
  { id: ViewMode.WATER_LEVEL, label: 'Giám sát Mực nước', icon: TrendingUp },
  { id: ViewMode.FORECAST, label: 'Thông tin Dự báo', icon: CloudRain },
  { id: ViewMode.FLOOD_FORECAST, label: 'Dự báo Lũ & Kịch bản', icon: Waves },
  { id: ViewMode.OPERATION, label: 'Quy trình vận hành', icon: Activity },
  { id: ViewMode.DOCUMENTS, label: 'Văn bản & Quy định', icon: BookOpen },
  { id: ViewMode.CAMERA, label: 'Camera', icon: Camera },
  { id: ViewMode.IMAGES, label: 'Thư viện Hình ảnh', icon: ImageIcon },
  { id: ViewMode.RECORDS, label: 'Hồ sơ & Biểu đồ', icon: FileText },
  { id: ViewMode.DEMO_CHARTS, label: 'Thư viện Biểu đồ Demo', icon: PieChart },
  { id: ViewMode.TECHNICAL_SPECS, label: 'Thông số kỹ thuật', icon: Settings },
  { id: ViewMode.GENERAL_INFO, label: 'Thông tin chung', icon: Info },
  { id: ViewMode.MANUAL_ENTRY, label: 'Nhập liệu thủ công', icon: Edit3 },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, toggleSidebar }) => {
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
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onViewChange(item.id);
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
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Version 2.4.2 © 2024</p>
        </div>
      </div>
    </div>
  );
};