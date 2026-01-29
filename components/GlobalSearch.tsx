
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, 
  Droplets, ArrowRight, Camera, Waves, Activity, Table as TableIcon, 
  CloudRain, User, Phone, Mail, Moon, Sun, LogOut, History, Bell, Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/db';
import { useUI } from './GlobalUI';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'page' | 'document' | 'spec' | 'data' | 'image' | 'camera' | 'scenario' | 'operation' | 'user' | 'action' | 'history' | 'notification';
  title: string;
  subtitle?: string;
  url?: string; 
  value?: string;
  action?: () => void; // For executable actions
  icon?: React.ReactNode;
  score?: number; // Internal scoring for sorting
}

// Helper to highlight matching text
const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-slate-900 dark:text-white rounded px-0.5 font-bold">{part}</span> : 
          part
      )}
    </>
  );
};

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const ui = useUI();

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0) {
          handleSelect(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Ensure selected item is visible
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex + 1] as HTMLElement; // +1 due to header
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = removeAccents(query);
    const rawResults: SearchResult[] = [];
    const currentUser = db.user.get();

    // --- 1. SYSTEM ACTIONS (Advanced) ---
    const actions = [
      { 
        keywords: ['che do toi', 'dark mode', 'giao dien toi'], 
        title: 'Chuyển sang Giao diện Tối', 
        type: 'action',
        icon: <Moon size={16}/>,
        action: () => { 
            document.documentElement.classList.add('dark'); 
            localStorage.setItem('theme', 'dark'); 
            ui.showToast('success', 'Đã chuyển sang giao diện tối');
        } 
      },
      { 
        keywords: ['che do sang', 'light mode', 'giao dien sang'], 
        title: 'Chuyển sang Giao diện Sáng', 
        type: 'action',
        icon: <Sun size={16}/>,
        action: () => { 
            document.documentElement.classList.remove('dark'); 
            localStorage.setItem('theme', 'light'); 
            ui.showToast('success', 'Đã chuyển sang giao diện sáng');
        } 
      },
      {
        keywords: ['dang xuat', 'logout', 'thoat'],
        title: 'Đăng xuất hệ thống',
        type: 'action',
        icon: <LogOut size={16}/>,
        action: () => {
            // This is a bit of a hack since we can't access parent props easily
            // In a real app, use Context for Auth
            sessionStorage.removeItem('isAuthenticated');
            window.location.reload();
        }
      }
    ];

    actions.forEach(act => {
        if (act.keywords.some(k => removeAccents(k).includes(lowerQuery))) {
            rawResults.push({
                id: `act-${act.title}`,
                type: 'action',
                title: act.title,
                subtitle: 'Thao tác hệ thống',
                icon: act.icon,
                action: act.action
            } as SearchResult);
        }
    });

    // --- 2. SEARCH PAGES (Navigation) ---
    const pages = [
      { path: '/dashboard', label: 'Bảng điều khiển / Dashboard' },
      { path: '/map', label: 'Bản đồ số GIS' },
      { path: '/forecast', label: 'Dự báo' },
      { path: '/documents', label: 'Văn bản & Quy định' },
      { path: '/images', label: 'Thư viện hình ảnh' },
      { path: '/camera', label: 'Camera giám sát' },
      { path: '/specs', label: 'Thông số kỹ thuật' },
      { path: '/flood-forecast', label: 'Dự báo lũ & Điều hành' },
      { path: '/operation', label: 'Quy trình vận hành' },
      { path: '/manual-entry', label: 'Nhập liệu thủ công' },
      { path: '/ai-safety', label: 'Giám sát An toàn AI' },
      { path: '/profile', label: 'Hồ sơ cá nhân' },
    ];

    if (currentUser.role === 'admin') {
        pages.push(
            { path: '/users', label: 'Quản lý người dùng' },
            { path: '/settings', label: 'Cài đặt hệ thống' }
        );
    }

    pages.forEach(page => {
      if (removeAccents(page.label).includes(lowerQuery)) {
        rawResults.push({
          id: `page-${page.path}`,
          type: 'page',
          title: page.label,
          url: page.path,
          icon: <LayoutDashboard size={16} />
        });
      }
    });

    // --- 3. SEARCH USERS (Admin Only) ---
    if (currentUser.role === 'admin') {
        const users = db.users.getAll();
        users.forEach(user => {
            const searchStr = removeAccents(`${user.name} ${user.email} ${user.username} ${user.phone}`);
            if (searchStr.includes(lowerQuery)) {
                rawResults.push({
                    id: `user-${user.id}`,
                    type: 'user',
                    title: user.name,
                    subtitle: `${user.role.toUpperCase()} • ${user.email}`,
                    url: '/users', // Navigate to user management
                    icon: <User size={16} />,
                    value: user.phone
                });
            }
        });
    }

    // --- 4. SEARCH DATA (Observation) ---
    const obs = db.observation.get();
    if (removeAccents('mực nước hồ').includes(lowerQuery) || removeAccents('water level').includes(lowerQuery)) {
      rawResults.push({ id: 'data-wl', type: 'data', title: 'Mực nước hồ hiện tại', value: `${obs.waterLevel} m`, icon: <Droplets size={16}/>, url: '/dashboard' });
    }
    if (removeAccents('dung tích').includes(lowerQuery) || removeAccents('capacity').includes(lowerQuery)) {
      rawResults.push({ id: 'data-cap', type: 'data', title: 'Dung tích hiện tại', value: `${obs.capacity} tr.m³`, icon: <Activity size={16}/>, url: '/dashboard' });
    }
    // Deep Search Rainfall Stations
    obs.rainfall.forEach(r => {
        if(removeAccents(r.name).includes(lowerQuery) || lowerQuery.includes('mua')) {
            rawResults.push({ id: `rain-${r.id}`, type: 'data', title: `Mưa tại ${r.name}`, value: `${r.data.current} mm`, icon: <CloudRain size={16}/>, url: '/dashboard' });
        }
    });

    // --- 5. SEARCH HISTORY DATA (Deep) ---
    // Search water level records if query looks like a date or year (e.g., "2026", "19/01")
    if (query.match(/[\d\/\-]{2,}/)) {
        const history = db.waterLevels.get();
        const matches = history.filter(h => h.time.includes(query) || h.time.replace('T', ' ').includes(query));
        // Limit historical results to avoid flooding
        matches.slice(0, 3).forEach(h => {
            const dateStr = new Date(h.time).toLocaleString('vi-VN');
            rawResults.push({
                id: `hist-${h.id}`,
                type: 'history',
                title: `Lịch sử mực nước: ${dateStr}`,
                value: `${h.level} m`,
                url: '/water-level',
                icon: <History size={16} />
            });
        });
    }

    // --- 6. SEARCH NOTIFICATIONS ---
    const notifs = db.notifications.get();
    notifs.forEach(n => {
        if (removeAccents(n.title).includes(lowerQuery) || removeAccents(n.message).includes(lowerQuery)) {
            rawResults.push({
                id: `notif-${n.id}`,
                type: 'notification',
                title: n.title,
                subtitle: n.message, // Shows truncated message
                icon: <Bell size={16} />,
                // Notification doesn't really have a detail page, just open dashboard sidebar?
                // For now, no URL action or maybe open notification panel (complex)
                value: n.time
            });
        }
    });

    // --- 7. SEARCH SPECS (Deep) ---
    const specs = db.specs.get();
    specs.forEach(group => {
      // Main items
      group.items.forEach(item => {
        if (removeAccents(item.name).includes(lowerQuery)) {
          rawResults.push({
            id: `spec-${item.id}`,
            type: 'spec',
            title: item.name,
            value: `${item.value} ${item.unit || ''}`,
            subtitle: group.title,
            url: '/specs',
            icon: <Settings size={16} />
          });
        }
      });
      // Subgroups
      if(group.subGroups) {
          group.subGroups.forEach(sg => {
              sg.items.forEach(item => {
                  if (removeAccents(item.name).includes(lowerQuery)) {
                    rawResults.push({
                        id: `spec-${item.id}`,
                        type: 'spec',
                        title: `${sg.title} - ${item.name}`,
                        value: `${item.value} ${item.unit || ''}`,
                        subtitle: group.title,
                        url: '/specs',
                        icon: <Settings size={16} />
                    });
                  }
              });
          });
      }
    });

    // --- 8. SEARCH DOCUMENTS ---
    const docs = db.documents.get();
    docs.forEach(doc => {
      if (removeAccents(doc.title).includes(lowerQuery) || removeAccents(doc.number).includes(lowerQuery)) {
        rawResults.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: doc.title,
          subtitle: doc.number,
          url: '/documents',
          icon: <FileText size={16} />
        });
      }
    });

    // --- 9. SEARCH CAMERAS ---
    const cameras = db.cameras.get();
    cameras.forEach(cam => {
        if (removeAccents(cam.name).includes(lowerQuery)) {
            rawResults.push({
                id: `cam-${cam.id}`,
                type: 'camera',
                title: cam.name,
                subtitle: cam.status === 'online' ? 'Trực tuyến' : 'Ngoại tuyến',
                url: '/camera',
                icon: <Camera size={16} />
            });
        }
    });

    // --- 10. SEARCH SCENARIOS ---
    const scenarios = db.scenarios.get();
    scenarios.forEach(sc => {
        if (removeAccents(sc.name).includes(lowerQuery)) {
             rawResults.push({
                id: `sc-${sc.id}`,
                type: 'scenario',
                title: sc.name,
                subtitle: 'Kịch bản lũ',
                url: '/flood-forecast',
                icon: <Waves size={16} />
            });
        }
    });

    // --- 11. SEARCH OPERATIONS (Deep) ---
    const opTables = db.operationTables.get();
    opTables.forEach(table => {
        // Table content search
        table.data.forEach(row => {
             const content = `${row.col1} ${row.col2} ${row.col3 || ''}`;
             if (removeAccents(content).includes(lowerQuery)) {
                 rawResults.push({
                    id: `opt-row-${row.id}`,
                    type: 'operation',
                    title: `Quy trình: ${table.name}`,
                    value: content,
                    url: '/operation',
                    icon: <TableIcon size={16} />
                });
             }
        });
    });

    setResults(rawResults.slice(0, 15)); // Limit to 15 results
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.action) {
        result.action();
    } else if (result.url) {
      navigate(result.url);
    }
    onClose();
  };

  // Render Icon helper
  const renderTypeBadge = (type: string) => {
      switch(type) {
          case 'user': return <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">User</span>;
          case 'action': return <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">System</span>;
          case 'data': return <span className="text-[10px] uppercase font-bold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">Data</span>;
          case 'history': return <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">History</span>;
          default: return null;
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-700 px-4 py-4 gap-3 bg-white dark:bg-slate-800">
          <Search className="text-blue-600 dark:text-blue-400" size={24} strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-xl text-slate-800 dark:text-white placeholder-slate-400 font-medium"
            placeholder="Tìm kiếm dữ liệu, lệnh hệ thống, người dùng..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
             <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono">
                <span className="text-base leading-none">↵</span> <span>to select</span>
             </div>
             <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                <X size={20}/>
             </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[65vh] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30" ref={listRef}>
          {results.length > 0 ? (
            <div className="py-2 space-y-0.5">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Kết quả phù hợp nhất</span>
                  <span>{results.length} tìm thấy</span>
              </div>
              
              {results.map((result, idx) => (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`
                    px-4 py-3 mx-2 rounded-xl cursor-pointer flex items-center justify-between group transition-all
                    ${idx === selectedIndex 
                        ? 'bg-blue-600 text-white shadow-md scale-[1.01]' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                  `}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`
                        p-2.5 rounded-lg shrink-0 transition-colors
                        ${idx === selectedIndex 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'}
                    `}>
                        {result.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                          <div className={`font-semibold truncate text-sm ${idx === selectedIndex ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                             <HighlightedText text={result.title} highlight={query} />
                          </div>
                          {renderTypeBadge(result.type)}
                      </div>
                      
                      {result.subtitle && (
                          <div className={`text-xs truncate mt-0.5 ${idx === selectedIndex ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                             <HighlightedText text={result.subtitle} highlight={query} />
                          </div>
                      )}
                    </div>
                  </div>

                  {result.value ? (
                      <div className={`
                          font-mono font-bold px-2 py-1 rounded text-xs whitespace-nowrap ml-2
                          ${idx === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}
                      `}>
                          {result.value}
                      </div>
                  ) : (
                      <ArrowRight size={18} className={`opacity-0 group-hover:opacity-100 transition-opacity ${idx === selectedIndex ? 'opacity-100 text-white' : 'text-slate-400'}`} />
                  )}
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
               <Search size={48} className="mx-auto mb-4 opacity-20"/>
               <p className="font-medium">Không tìm thấy kết quả nào cho "{query}"</p>
               <p className="text-sm mt-2 opacity-60">Thử tìm kiếm từ khóa khác như "mực nước", "người dùng", "camera"...</p>
            </div>
          ) : (
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 px-2">Lệnh hệ thống</h4>
                        <div className="space-y-1">
                            <SuggestionItem icon={<Moon size={14}/>} text="Chế độ tối" onClick={() => setQuery("che do toi")} />
                            <SuggestionItem icon={<Sun size={14}/>} text="Chế độ sáng" onClick={() => setQuery("che do sang")} />
                            <SuggestionItem icon={<LogOut size={14}/>} text="Đăng xuất" onClick={() => setQuery("dang xuat")} />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 px-2">Gợi ý tìm kiếm</h4>
                        <div className="space-y-1">
                            <SuggestionItem icon={<Droplets size={14}/>} text="Mực nước hồ" onClick={() => setQuery("mực nước")} />
                            <SuggestionItem icon={<User size={14}/>} text="Quản lý người dùng" onClick={() => setQuery("người dùng")} />
                            <SuggestionItem icon={<History size={14}/>} text="Lịch sử vận hành" onClick={() => setQuery("lịch sử")} />
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        <span className="font-bold border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 mx-1">↑</span>
                        <span className="font-bold border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 mx-1">↓</span>
                        để di chuyển
                        <span className="font-bold border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 mx-2">Enter</span>
                        để chọn
                        <span className="font-bold border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 mx-2">Esc</span>
                        để đóng
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop click handler */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
    </div>
  );
};

const SuggestionItem = ({ icon, text, onClick }: { icon: any, text: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
    >
        <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</span>
        <span>{text}</span>
    </button>
);
