
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, 
  Droplets, Camera, Activity, CloudRain, User, Moon, Sun, LogOut, 
  History, Mic, CornerDownLeft, Trash2, MicOff, Radio, AlertOctagon,
  BrainCircuit, Map as MapIcon, AlertCircle, Zap, Command, ArrowRight,
  Sparkles, Calculator, ChevronRight
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
  type: 'page' | 'sensor' | 'alert' | 'document' | 'action' | 'history' | 'ai';
  title: string;
  subtitle?: string;
  url?: string; 
  value?: string | number;
  status?: string;
  action?: () => void;
  icon?: React.ReactNode;
  group?: string;
}

// Quick Suggestions Data (Grid Layout)
const QUICK_SUGGESTIONS = [
  { id: 'quick-wl', title: 'Mực nước hồ', url: '/water-level', icon: <Droplets size={20} className="text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'quick-sensor', title: 'Cảm biến áp lực', url: '/sensors', icon: <Radio size={20} className="text-cyan-500" />, color: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'quick-alert', title: 'Cảnh báo mới', url: '/alerts', icon: <AlertCircle size={20} className="text-red-500" />, color: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'quick-ai', title: 'Hỏi AI Assistant', url: '/ai-safety', icon: <Sparkles size={20} className="text-purple-500" />, color: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'quick-map', title: 'Bản đồ số GIS', url: '/map', icon: <MapIcon size={20} className="text-emerald-500" />, color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'quick-cam', title: 'Camera Live', url: '/camera', icon: <Camera size={20} className="text-orange-500" />, color: 'bg-orange-50 dark:bg-orange-900/20' },
];

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  
  // History State
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('search_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const ui = useUI();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Save history
  const addToHistory = (term: string) => {
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  const removeFromHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h !== term);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  // Voice Search Handler
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        ui.showToast('warning', 'Trình duyệt không hỗ trợ nhận diện giọng nói.');
        return;
    }

    try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'vi-VN';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) {
        setIsListening(false);
    }
  };

  // --- SMART SEARCH ENGINE ---
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = removeAccents(query);
    const rawResults: SearchResult[] = [];

    // 1. Pages Navigation
    const pages = [
      { path: '/dashboard', label: 'Dashboard / Tổng quan', icon: LayoutDashboard },
      { path: '/map', label: 'Bản đồ GIS', icon: MapIcon },
      { path: '/sensors', label: 'Danh sách Cảm biến', icon: Radio },
      { path: '/alerts', label: 'Lịch sử Cảnh báo', icon: AlertCircle },
      { path: '/ai-safety', label: 'An toàn AI & Dự báo', icon: BrainCircuit },
      { path: '/water-level', label: 'Giám sát Mực nước', icon: Droplets },
      { path: '/forecast', label: 'Dự báo Thủy văn', icon: CloudRain },
      { path: '/documents', label: 'Văn bản & Quy định', icon: FileText },
      { path: '/camera', label: 'Camera Giám sát', icon: Camera },
      { path: '/images', label: 'Thư viện hình ảnh', icon: ImageIcon },
      { path: '/specs', label: 'Thông số kỹ thuật', icon: Settings },
      { path: '/users', label: 'Quản lý người dùng', icon: User },
    ];

    pages.forEach(page => {
      if (removeAccents(page.label).includes(lowerQuery)) {
        rawResults.push({ 
            id: `page-${page.path}`, 
            type: 'page',
            group: 'Điều hướng',
            title: page.label, 
            subtitle: 'Chuyển trang',
            url: page.path, 
            icon: <page.icon size={18} /> 
        });
      }
    });

    // 2. System Actions (Smart Commands)
    const actions = [
        { keywords: ['che do toi', 'dark', 'toi', 'dem'], title: 'Chuyển sang Chế độ Tối', icon: <Moon size={18}/>, action: () => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); ui.showToast('success', 'Đã chuyển giao diện Tối'); } },
        { keywords: ['che do sang', 'light', 'sang', 'ngay'], title: 'Chuyển sang Chế độ Sáng', icon: <Sun size={18}/>, action: () => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); ui.showToast('success', 'Đã chuyển giao diện Sáng'); } },
        { keywords: ['dang xuat', 'logout', 'thoat', 'exit'], title: 'Đăng xuất hệ thống', icon: <LogOut size={18}/>, action: () => { sessionStorage.removeItem('isAuthenticated'); window.location.reload(); } },
        { keywords: ['xoa thong bao', 'clear notif'], title: 'Đánh dấu đọc tất cả thông báo', icon: <Activity size={18}/>, action: () => { db.notifications.markAllRead(); ui.showToast('success', 'Đã đọc hết thông báo'); } }
    ];
    actions.forEach(act => {
        if (act.keywords.some(k => removeAccents(k).includes(lowerQuery))) {
            rawResults.push({ id: `act-${act.title}`, type: 'action', group: 'Lệnh hệ thống', title: act.title, subtitle: 'Thực thi ngay', icon: act.icon, action: act.action });
        }
    });

    // 3. Sensors Data (Rich Results)
    try {
        const sensors = db.sensors.get();
        sensors.filter(s => 
            removeAccents(s.name).includes(lowerQuery) || 
            removeAccents(s.code).includes(lowerQuery) ||
            removeAccents(s.type).includes(lowerQuery)
        ).slice(0, 5).forEach(s => {
            rawResults.push({
                id: `sensor-${s.id}`,
                type: 'sensor',
                group: 'Cảm biến & Dữ liệu',
                title: s.name,
                subtitle: `${s.type} • ${s.station}`,
                value: `${s.lastValue} ${s.unit}`,
                status: s.status,
                url: '/sensors',
                icon: <Radio size={18} />
            });
        });
    } catch(e) {}

    // 4. Documents
    try {
        const docs = db.documents.get();
        docs.filter(d => 
            removeAccents(d.title).includes(lowerQuery) || 
            removeAccents(d.number).includes(lowerQuery)
        ).slice(0, 3).forEach(d => {
            rawResults.push({
                id: `doc-${d.id}`,
                type: 'document',
                group: 'Văn bản',
                title: d.title,
                subtitle: `Số hiệu: ${d.number}`,
                url: '/documents',
                icon: <FileText size={18} />
            });
        });
    } catch(e) {}

    // 5. Ask AI (Always appearing if query is long enough or no results)
    if (query.length > 3) {
        rawResults.push({
            id: 'ai-ask',
            type: 'ai',
            group: 'Trí tuệ nhân tạo',
            title: `Hỏi AI: "${query}"`,
            subtitle: 'Phân tích dữ liệu & Trả lời câu hỏi',
            icon: <Sparkles size={18} className="text-purple-500" />,
            action: () => { 
                // In a real scenario, this would route to AI view with pre-filled query
                navigate('/ai-safety');
                ui.showToast('info', 'Đang chuyển câu hỏi đến AI Assistant...');
            }
        });
    }

    return rawResults;
  }, [query]);

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
        } else if (query) {
            // Default enter on empty results -> Search Google or AI
        }
      } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onClose]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (listRef.current && results.length > 0) {
        const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
  }, [selectedIndex, results]);

  const handleSelect = (result: SearchResult) => {
    addToHistory(result.title);
    if (result.action) {
        result.action();
    } else if (result.url) {
      navigate(result.url);
    }
    onClose();
  };

  const handleQuickSelect = (url: string) => {
      navigate(url);
      onClose();
  }

  const handleHistorySelect = (term: string) => {
      setQuery(term);
      inputRef.current?.focus();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-900/70 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 ring-1 ring-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Header & Input */}
        <div className="relative flex items-center px-5 py-5 gap-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="text-slate-400 dark:text-slate-500" size={24} strokeWidth={2.5} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-xl text-slate-800 dark:text-white placeholder-slate-400 font-medium tracking-tight"
            placeholder="Tìm kiếm, ra lệnh, hoặc hỏi AI..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            autoComplete="off"
          />
          <div className="flex items-center gap-3">
             <button 
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Ra lệnh bằng giọng nói"
             >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
             </button>
             
             <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

             <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 text-xs font-bold px-2.5 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-200 transition-colors">
                ESC
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[550px] overflow-y-auto p-3" ref={listRef}>
          {query ? (
             /* --- SMART LIST RESULTS --- */
             results.length > 0 ? (
                <div className="space-y-1">
                    {results.map((result, idx) => {
                        // Check if group header needed
                        const showHeader = idx === 0 || results[idx - 1].group !== result.group;
                        return (
                            <React.Fragment key={idx}>
                                {showHeader && (
                                    <div className="px-4 py-2 mt-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                                        {result.group}
                                    </div>
                                )}
                                <div
                                    data-index={idx}
                                    onClick={() => handleSelect(result)}
                                    className={`
                                        group flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 border border-transparent
                                        ${idx === selectedIndex 
                                            ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-md transform scale-[1.01]' 
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                                        }
                                    `}
                                >
                                    <div className={`p-2.5 rounded-lg backdrop-blur-sm ${
                                        idx === selectedIndex 
                                            ? 'bg-white/20 text-white' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-white group-hover:shadow-sm'
                                    }`}>
                                        {result.icon}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className={`font-semibold text-base ${idx === selectedIndex ? 'text-white' : ''}`}>
                                                {result.title}
                                            </span>
                                            
                                            {/* Sensor Live Value Badge */}
                                            {result.type === 'sensor' && (
                                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                                                    idx === selectedIndex 
                                                        ? 'bg-white/20 text-white' 
                                                        : result.status === 'online' 
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                    {result.value}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs truncate ${idx === selectedIndex ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {result.subtitle}
                                            </span>
                                        </div>
                                    </div>

                                    {idx === selectedIndex && (
                                        <ArrowRight size={18} className="text-white animate-pulse mr-1" />
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
             ) : (
                /* No Results but allow AI */
                <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <Sparkles size={32} className="text-purple-500"/>
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">Không tìm thấy kết quả</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mb-6">
                        Hệ thống không tìm thấy dữ liệu khớp với từ khóa của bạn.
                    </p>
                    <button 
                        onClick={() => { navigate('/ai-safety'); onClose(); }}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
                    >
                        <Sparkles size={18}/> Hỏi AI Assistant về "{query}"
                    </button>
                </div>
             )
          ) : (
            /* --- DEFAULT VIEW: History & Quick Grid --- */
            <div className="p-2 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* 1. Recent History */}
                {history.length > 0 && (
                    <div className="px-2">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tìm kiếm gần đây</h4>
                            <button onClick={clearHistory} className="text-[10px] text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 transition-colors">
                                <Trash2 size={12}/> Xóa lịch sử
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {history.map((hist, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => handleHistorySelect(hist)}
                                    className="group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer transition-all"
                                >
                                    <History size={12} className="text-slate-400"/>
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{hist}</span>
                                    <button 
                                        onClick={(e) => removeFromHistory(e, hist)}
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Quick Suggestions (Visual Grid) */}
                <div className="px-2">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-wide">Truy cập nhanh</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {QUICK_SUGGESTIONS.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleQuickSelect(item.url)}
                                className={`flex items-start gap-3 p-4 rounded-2xl transition-all text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 ${item.color} bg-opacity-30 dark:bg-opacity-10 hover:bg-opacity-50`}
                            >
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm block mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.title}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-5px] group-hover:translate-x-0 duration-300">
                                        Mở ngay <ChevronRight size={10}/>
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* 3. Helper Hint */}
                <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Command size={12}/> <b>Hành động</b></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1.5"><Calculator size={12}/> <b>Tính toán</b></span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1.5"><Zap size={12}/> <b>Điều khiển</b></span>
                </div>
            </div>
          )}
        </div>

        {/* Smart Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex justify-between items-center text-[10px] font-medium text-slate-400 dark:text-slate-500 backdrop-blur-md rounded-b-2xl">
            <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[20px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">↵</kbd> chọn</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[20px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">↑</kbd> <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[20px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">↓</kbd> di chuyển</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    <Sparkles size={10}/> AI Powered
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
