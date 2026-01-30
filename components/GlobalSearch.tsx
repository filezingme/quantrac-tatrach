
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, 
  Droplets, ArrowRight, Camera, Waves, Activity, Table as TableIcon, 
  CloudRain, User, Moon, Sun, LogOut, History, Bell, Mic, Command, 
  CornerDownLeft, MoveUp, MoveDown, Trash2, MicOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/db';
import { useUI } from './GlobalUI';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchType = 'all' | 'data' | 'navigation' | 'action' | 'user';

interface SearchResult {
  id: string;
  type: 'page' | 'document' | 'spec' | 'data' | 'image' | 'camera' | 'scenario' | 'operation' | 'user' | 'action' | 'history' | 'notification';
  title: string;
  subtitle?: string;
  url?: string; 
  value?: string;
  action?: () => void;
  icon?: React.ReactNode;
  category?: SearchType;
}

// Highlight helper
const HighlightedText = ({ text, highlight }: { text: string, highlight: string }) => {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === removeAccents(highlight) ? 
          <span key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-slate-900 dark:text-white rounded px-0.5 font-bold">{part}</span> : 
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
  const [activeFilter, setActiveFilter] = useState<SearchType>('all');
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
      const saved = localStorage.getItem('search_history');
      return saved ? JSON.parse(saved) : [];
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
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
      setActiveFilter('all');
      // Stop listening if closed
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Voice Search Handler
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    // Check support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        ui.showToast('warning', 'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Chỉ hỗ trợ Chrome/Edge/Safari).');
        return;
    }

    try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setQuery(''); // Clear previous query
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                ui.showToast('error', 'Vui lòng cấp quyền truy cập microphone để sử dụng tính năng này.');
            } else if (event.error === 'no-speech') {
                ui.showToast('info', 'Không nghe thấy giọng nói. Vui lòng thử lại.');
            } else {
                ui.showToast('error', 'Lỗi nhận diện giọng nói: ' + event.error);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) {
        console.error(e);
        ui.showToast('error', 'Không thể khởi động dịch vụ nhận diện giọng nói.');
        setIsListening(false);
    }
  };

  const filteredResults = useMemo(() => {
      if (activeFilter === 'all') return results;
      return results.filter(r => r.category === activeFilter);
  }, [results, activeFilter]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults.length > 0) {
          handleSelect(filteredResults[selectedIndex]);
        }
      } else if (e.key === 'Tab') {
          e.preventDefault();
          const filters: SearchType[] = ['all', 'data', 'navigation', 'action', 'user'];
          const currentIdx = filters.indexOf(activeFilter);
          const nextIdx = (currentIdx + 1) % filters.length;
          setActiveFilter(filters[nextIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, activeFilter, filteredResults]);

  // Ensure selected item is visible
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Main Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = removeAccents(query);
    const rawResults: SearchResult[] = [];
    const currentUser = db.user.get();

    // 1. SYSTEM ACTIONS
    const actions = [
      { keywords: ['che do toi', 'dark', 'toi'], title: 'Giao diện Tối', icon: <Moon size={16}/>, action: () => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); ui.showToast('success', 'Giao diện tối'); } },
      { keywords: ['che do sang', 'light', 'sang'], title: 'Giao diện Sáng', icon: <Sun size={16}/>, action: () => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); ui.showToast('success', 'Giao diện sáng'); } },
      { keywords: ['dang xuat', 'logout', 'thoat'], title: 'Đăng xuất', icon: <LogOut size={16}/>, action: () => { sessionStorage.removeItem('isAuthenticated'); window.location.reload(); } }
    ];
    actions.forEach(act => {
        if (act.keywords.some(k => removeAccents(k).includes(lowerQuery))) {
            rawResults.push({ id: `act-${act.title}`, type: 'action', category: 'action', title: act.title, subtitle: 'Lệnh hệ thống', icon: act.icon, action: act.action });
        }
    });

    // 2. PAGES
    const pages = [
      { path: '/dashboard', label: 'Dashboard / Bảng điều khiển' },
      { path: '/map', label: 'Bản đồ GIS' },
      { path: '/forecast', label: 'Dự báo' },
      { path: '/documents', label: 'Văn bản & Quy định' },
      { path: '/images', label: 'Thư viện hình ảnh' },
      { path: '/camera', label: 'Camera giám sát' },
      { path: '/specs', label: 'Thông số kỹ thuật' },
      { path: '/flood-forecast', label: 'Dự báo lũ' },
      { path: '/operation', label: 'Quy trình vận hành' },
      { path: '/ai-safety', label: 'An toàn AI' },
    ];
    if (currentUser.role === 'admin') pages.push({ path: '/users', label: 'Quản lý người dùng' });

    pages.forEach(page => {
      if (removeAccents(page.label).includes(lowerQuery)) {
        rawResults.push({ id: `page-${page.path}`, type: 'page', category: 'navigation', title: page.label, url: page.path, icon: <LayoutDashboard size={16} /> });
      }
    });

    // 3. DATA
    const obs = db.observation.get();
    if (removeAccents('mực nước hồ').includes(lowerQuery)) rawResults.push({ id: 'data-wl', type: 'data', category: 'data', title: 'Mực nước hồ', value: `${obs.waterLevel} m`, icon: <Droplets size={16}/>, url: '/dashboard' });
    if (removeAccents('dung tích').includes(lowerQuery)) rawResults.push({ id: 'data-cap', type: 'data', category: 'data', title: 'Dung tích', value: `${obs.capacity} tr.m³`, icon: <Activity size={16}/>, url: '/dashboard' });
    obs.rainfall.forEach(r => {
        if(removeAccents(r.name).includes(lowerQuery) || lowerQuery.includes('mua')) {
            rawResults.push({ id: `rain-${r.id}`, type: 'data', category: 'data', title: `Mưa: ${r.name}`, value: `${r.data.current} mm`, icon: <CloudRain size={16}/>, url: '/dashboard' });
        }
    });

    // 4. USERS (Admin)
    if (currentUser.role === 'admin') {
        db.users.getAll().forEach(u => {
            const str = removeAccents(`${u.name} ${u.email} ${u.phone}`);
            if (str.includes(lowerQuery)) {
                rawResults.push({ id: `user-${u.id}`, type: 'user', category: 'user', title: u.name, subtitle: u.email, url: '/users', icon: <User size={16} />, value: u.role });
            }
        });
    }

    // 5. DEEP SEARCH (Docs, Specs, Cameras)
    db.documents.get().forEach(d => {
        if (removeAccents(d.title).includes(lowerQuery) || removeAccents(d.number).includes(lowerQuery)) {
            rawResults.push({ id: `doc-${d.id}`, type: 'document', category: 'data', title: d.title, subtitle: d.number, url: '/documents', icon: <FileText size={16} /> });
        }
    });
    db.cameras.get().forEach(c => {
        if (removeAccents(c.name).includes(lowerQuery)) {
            rawResults.push({ id: `cam-${c.id}`, type: 'camera', category: 'data', title: c.name, subtitle: c.status, url: '/camera', icon: <Camera size={16} /> });
        }
    });

    setResults(rawResults);
    setSelectedIndex(0);
  }, [query]);

  const addToHistory = (text: string) => {
      const newHistory = [text, ...searchHistory.filter(h => h !== text)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
      setSearchHistory([]);
      localStorage.removeItem('search_history');
  }

  const handleSelect = (result: SearchResult) => {
    addToHistory(result.title); // Save to history
    if (result.action) {
        result.action();
    } else if (result.url) {
      navigate(result.url);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header & Input */}
        <div className="flex items-center px-4 py-4 gap-3 border-b border-slate-100 dark:border-slate-800 relative">
          <Search className="text-slate-400" size={20} strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-xl text-slate-800 dark:text-white placeholder-slate-400 font-medium"
            placeholder={isListening ? "Đang nghe... (Hãy nói từ khóa)" : "Tìm kiếm, ra lệnh, hoặc hỏi..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
             <button 
                onClick={toggleListening}
                className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
                title={isListening ? "Dừng nghe" : "Tìm bằng giọng nói"}
             >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
             <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-xs font-bold text-slate-500 px-2 transition-colors">
                ESC
             </button>
          </div>
        </div>

        {/* 2. Smart Tabs (Filters) */}
        {results.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
                {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'data', label: 'Dữ liệu' },
                    { id: 'navigation', label: 'Điều hướng' },
                    { id: 'action', label: 'Lệnh' },
                    { id: 'user', label: 'Người dùng' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id as SearchType)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                            activeFilter === tab.id 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        )}

        {/* 3. Results / History Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-950/30 min-h-[300px]" ref={listRef}>
          {query ? (
             filteredResults.length > 0 ? (
                <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider flex justify-between">
                        <span>Gợi ý tốt nhất</span>
                        <span>{filteredResults.length} kết quả</span>
                    </div>
                    {filteredResults.map((result, idx) => (
                        <div
                        key={`${result.id}-${idx}`}
                        onClick={() => handleSelect(result)}
                        className={`
                            px-3 py-3 mx-1 rounded-xl cursor-pointer flex items-center justify-between group transition-all duration-150
                            ${idx === selectedIndex 
                                ? 'bg-blue-600 text-white shadow-md scale-[1.01]' 
                                : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}
                        `}
                        >
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`
                                p-2 rounded-lg shrink-0 transition-colors
                                ${idx === selectedIndex 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}
                            `}>
                                {result.icon}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-semibold truncate text-sm ${idx === selectedIndex ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                        <HighlightedText text={result.title} highlight={query} />
                                    </span>
                                </div>
                                {result.subtitle && (
                                    <div className={`text-xs truncate mt-0.5 ${idx === selectedIndex ? 'text-blue-100' : 'text-slate-500 dark:text-slate-500'}`}>
                                        {result.subtitle}
                                    </div>
                                )}
                            </div>
                        </div>

                        {result.value && (
                            <div className={`
                                font-mono font-bold px-2 py-1 rounded text-xs whitespace-nowrap ml-2
                                ${idx === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}
                            `}>
                                {result.value}
                            </div>
                        )}
                        
                        <div className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${idx === selectedIndex ? 'opacity-100 text-white' : 'text-slate-400'}`}>
                            <CornerDownLeft size={16} />
                        </div>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-12">
                    <Search size={48} className="opacity-20 mb-4"/>
                    <p className="font-medium">Không tìm thấy kết quả</p>
                    <p className="text-sm mt-1">Thử từ khóa khác hoặc kiểm tra chính tả</p>
                </div>
             )
          ) : (
            /* Empty State / History */
            <div className="p-6">
                {searchHistory.length > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2 px-2">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tìm kiếm gần đây</h4>
                            <button onClick={clearHistory} className="text-[10px] text-red-500 hover:underline flex items-center gap-1"><Trash2 size={10}/> Xóa lịch sử</button>
                        </div>
                        <div className="space-y-1">
                            {searchHistory.map((hist, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setQuery(hist)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-left"
                                >
                                    <History size={14} className="text-slate-400 group-hover:text-blue-500"/>
                                    <span>{hist}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 px-2">Gợi ý nhanh</h4>
                <div className="grid grid-cols-2 gap-2">
                    <SuggestionItem icon={<Droplets size={14}/>} text="Mực nước hồ" onClick={() => setQuery("mực nước")} />
                    <SuggestionItem icon={<User size={14}/>} text="Quản lý người dùng" onClick={() => setQuery("người dùng")} />
                    <SuggestionItem icon={<Bell size={14}/>} text="Cảnh báo mới" onClick={() => setQuery("cảnh báo")} />
                    <SuggestionItem icon={<Camera size={14}/>} text="Camera đập tràn" onClick={() => setQuery("camera")} />
                </div>
            </div>
          )}
        </div>

        {/* 4. Footer (Shortcuts) */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-500 select-none">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 min-w-[20px] text-center font-sans">↵</kbd> chọn</span>
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 min-w-[20px] text-center font-sans"><MoveDown size={8} className="inline"/></kbd> <kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 min-w-[20px] text-center font-sans"><MoveUp size={8} className="inline"/></kbd> di chuyển</span>
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1 min-w-[20px] text-center font-sans">Tab</kbd> đổi nhóm</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
                <Command size={10}/> Super Search v2.0
            </div>
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
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
    >
        <span className="text-slate-400 group-hover:text-blue-500 transition-colors bg-slate-50 dark:bg-slate-700 p-1 rounded">{icon}</span>
        <span className="font-medium">{text}</span>
    </button>
);
