
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, 
  Droplets, Camera, Activity, CloudRain, User, Moon, Sun, LogOut, 
  History, Mic, CornerDownLeft, Trash2, MicOff, Radio, AlertOctagon,
  BrainCircuit, Map as MapIcon, AlertCircle, Zap
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
  type: 'page' | 'sensor' | 'alert' | 'document' | 'action' | 'history';
  title: string;
  subtitle?: string;
  url?: string; 
  value?: string;
  action?: () => void;
  icon?: React.ReactNode;
}

// Quick Suggestions Data matching the screenshot layout
const QUICK_SUGGESTIONS = [
  { id: 'quick-wl', title: 'Mực nước hồ', url: '/water-level', icon: <Droplets size={18} /> },
  { id: 'quick-sensor', title: 'Cảm biến áp lực', url: '/sensors', icon: <Radio size={18} /> },
  { id: 'quick-alert', title: 'Cảnh báo mới', url: '/alerts', icon: <AlertCircle size={18} /> },
  { id: 'quick-ai', title: 'An toàn AI', url: '/ai-safety', icon: <BrainCircuit size={18} /> },
  { id: 'quick-map', title: 'Bản đồ số', url: '/map', icon: <MapIcon size={18} /> },
  { id: 'quick-cam', title: 'Camera', url: '/camera', icon: <Camera size={18} /> },
];

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
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

  // Main Search Logic (Rich Content)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = removeAccents(query);
    const rawResults: SearchResult[] = [];
    const currentUser = db.user.get();

    // 1. Pages Navigation
    const pages = [
      { path: '/dashboard', label: 'Dashboard / Tổng quan', icon: LayoutDashboard },
      { path: '/map', label: 'Bản đồ GIS', icon: MapIcon },
      { path: '/sensors', label: 'Danh sách Cảm biến', icon: Radio },
      { path: '/alerts', label: 'Lịch sử Cảnh báo', icon: AlertCircle },
      { path: '/ai-safety', label: 'An toàn AI', icon: BrainCircuit },
      { path: '/water-level', label: 'Giám sát Mực nước', icon: Droplets },
      { path: '/forecast', label: 'Dự báo', icon: CloudRain },
      { path: '/documents', label: 'Văn bản & Quy định', icon: FileText },
      { path: '/camera', label: 'Camera', icon: Camera },
      { path: '/images', label: 'Thư viện hình ảnh', icon: ImageIcon },
      { path: '/specs', label: 'Thông số kỹ thuật', icon: Settings },
    ];

    pages.forEach(page => {
      if (removeAccents(page.label).includes(lowerQuery)) {
        rawResults.push({ 
            id: `page-${page.path}`, 
            type: 'page',
            title: page.label.split('/')[0].trim(), 
            subtitle: 'Điều hướng',
            url: page.path, 
            icon: <page.icon size={18} /> 
        });
      }
    });

    // 2. System Actions
    const actions = [
        { keywords: ['che do toi', 'dark', 'toi'], title: 'Giao diện Tối', icon: <Moon size={18}/>, action: () => { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); ui.showToast('success', 'Giao diện tối'); } },
        { keywords: ['che do sang', 'light', 'sang'], title: 'Giao diện Sáng', icon: <Sun size={18}/>, action: () => { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); ui.showToast('success', 'Giao diện sáng'); } },
        { keywords: ['dang xuat', 'logout', 'thoat'], title: 'Đăng xuất', icon: <LogOut size={18}/>, action: () => { sessionStorage.removeItem('isAuthenticated'); window.location.reload(); } }
    ];
    actions.forEach(act => {
        if (act.keywords.some(k => removeAccents(k).includes(lowerQuery))) {
            rawResults.push({ id: `act-${act.title}`, type: 'action', title: act.title, subtitle: 'Lệnh hệ thống', icon: act.icon, action: act.action });
        }
    });

    // 3. Sensors Data
    try {
        const sensors = db.sensors.get();
        sensors.filter(s => 
            removeAccents(s.name).includes(lowerQuery) || 
            removeAccents(s.code).includes(lowerQuery) ||
            removeAccents(s.type).includes(lowerQuery)
        ).slice(0, 3).forEach(s => {
            rawResults.push({
                id: `sensor-${s.id}`,
                type: 'sensor',
                title: s.name,
                subtitle: `${s.type} • ${s.station}`,
                value: `${s.lastValue} ${s.unit}`,
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
                title: d.title,
                subtitle: d.number,
                url: '/documents',
                icon: <FileText size={18} />
            });
        });
    } catch(e) {}

    setResults(rawResults);
    setSelectedIndex(0);
  }, [query]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (query) {
            setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (query) {
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (query && results.length > 0) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && query) {
        const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [selectedIndex, query]);

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
    <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Input */}
        <div className="flex items-center px-5 py-4 gap-4 border-b border-slate-100 dark:border-slate-700">
          <Search className="text-slate-400" size={24} strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-xl text-slate-700 dark:text-white placeholder-slate-400 font-medium"
            placeholder="Tìm kiếm dữ liệu, cảm biến, ra lệnh..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
             <button 
                onClick={toggleListening}
                className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                title="Tìm bằng giọng nói"
             >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>
             
             <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[500px] overflow-y-auto p-2" ref={listRef}>
          {query ? (
             /* --- RICH SEARCH RESULTS --- */
             results.length > 0 ? (
                <div className="space-y-1 p-2">
                    {results.map((result, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(result)}
                            className={`
                                px-4 py-3 rounded-xl cursor-pointer flex items-center gap-4 transition-colors group
                                ${idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                            `}
                        >
                            <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-white dark:bg-slate-800 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                {result.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm ${idx === selectedIndex ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {result.title}
                                </div>
                                {result.subtitle && (
                                    <div className="text-xs text-slate-400 truncate mt-0.5">{result.subtitle}</div>
                                )}
                            </div>
                            {result.value && (
                                <div className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                    {result.value}
                                </div>
                            )}
                            {idx === selectedIndex && <CornerDownLeft size={16} className="text-blue-400"/>}
                        </div>
                    ))}
                </div>
             ) : (
                <div className="py-12 text-center text-slate-400 text-sm">
                    Không tìm thấy kết quả phù hợp
                </div>
             )
          ) : (
            /* --- DEFAULT VIEW (History + Suggestions) --- */
            <div className="p-4 space-y-6">
                
                {/* 1. History Section */}
                {history.length > 0 && (
                    <div className="animate-in slide-in-from-top-1">
                        <div className="flex justify-between items-center mb-3 px-2">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tìm kiếm gần đây</h4>
                            <button onClick={clearHistory} className="text-[10px] text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 transition-colors">
                                <Trash2 size={10}/> Xóa lịch sử
                            </button>
                        </div>
                        <div className="space-y-1">
                            {history.map((hist, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => handleHistorySelect(hist)}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group transition-colors"
                                >
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <History size={16} className="text-slate-400"/>
                                        <span className="text-sm font-medium">{hist}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => removeFromHistory(e, hist)}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                        <X size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Quick Suggestions (Grid Layout) */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 px-2 tracking-wide">Gợi ý nhanh</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {QUICK_SUGGESTIONS.map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleQuickSelect(item.url)}
                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all text-left group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-sm"
                            >
                                <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors bg-slate-50 dark:bg-slate-800 p-2 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                                    {item.icon}
                                </div>
                                <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                    {item.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 px-5 py-3 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[20px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">↵</kbd> chọn</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[20px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">↑</kbd> <kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[20px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">↓</kbd> di chuyển</span>
                <span className="flex items-center gap-1.5"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 min-w-[30px] text-center font-sans shadow-sm text-slate-600 dark:text-slate-300">Tab</kbd> đổi nhóm</span>
            </div>
            <div className="flex items-center gap-2">
                <LayoutDashboard size={12}/> Global Search v3.0
            </div>
        </div>
      </div>
    </div>
  );
};
