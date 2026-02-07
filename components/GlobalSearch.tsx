
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, 
  Droplets, Camera, Activity, CloudRain, User, Moon, Sun, LogOut, 
  History, Mic, CornerDownLeft, Trash2, MicOff, Radio, AlertOctagon,
  BrainCircuit, Map as MapIcon, AlertCircle, Zap, Command, ArrowRight,
  Sparkles, Calculator, ChevronRight, Video, Gauge, Eye
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
  type: 'page' | 'sensor' | 'alert' | 'document' | 'action' | 'history' | 'ai' | 'camera' | 'image';
  title: string;
  subtitle?: string;
  url?: string; 
  value?: string | number;
  status?: string;
  meta?: any; // Store extra data like image URL
  action?: () => void;
  icon?: React.ReactNode;
  group?: string;
}

// Quick Suggestions Data (Grid Layout)
const QUICK_SUGGESTIONS = [
  { id: 'quick-wl', title: 'Mực nước hồ', url: '/water-level', icon: <Droplets size={20} className="text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'quick-sensor', title: 'Cảm biến áp lực', url: '/sensors', icon: <Radio size={20} className="text-cyan-500" />, color: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'quick-alert', title: 'Cảnh báo mới', url: '/alerts', icon: <AlertCircle size={20} className="text-red-500" />, color: 'bg-red-50 dark:bg-red-900/20' },
  { id: 'quick-ai', title: 'Hỏi AI Assistant', url: '#ai', icon: <Sparkles size={20} className="text-purple-500" />, color: 'bg-purple-50 dark:bg-purple-900/20' },
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
  const [historyList, setHistoryList] = useState<string[]>(() => {
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
    const newHistory = [term, ...historyList.filter(h => h !== term)].slice(0, 5);
    setHistoryList(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistoryList([]);
    localStorage.removeItem('search_history');
  };

  const removeFromHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const newHistory = historyList.filter(h => h !== term);
    setHistoryList(newHistory);
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
        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
        };
        
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    } catch (e) {
        console.error(e);
        setIsListening(false);
        ui.showToast('error', 'Không thể khởi động Microphone.');
    }
  };

  // --- SEARCH LOGIC ---
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    
    const term = removeAccents(query);
    const res: SearchResult[] = [];

    // 1. Pages
    const pages = [
      { title: 'Dashboard', url: '/dashboard', icon: <LayoutDashboard size={18}/> },
      { title: 'Bản đồ GIS', url: '/map', icon: <MapIcon size={18}/> },
      { title: 'Cảnh báo & Sự kiện', url: '/alerts', icon: <AlertCircle size={18}/> },
      { title: 'Dữ liệu Cảm biến', url: '/sensors', icon: <Radio size={18}/> },
      { title: 'Camera Giám sát', url: '/camera', icon: <Camera size={18}/> },
      { title: 'Hồ sơ hình ảnh', url: '/images', icon: <ImageIcon size={18}/> },
      { title: 'Văn bản quy định', url: '/documents', icon: <FileText size={18}/> },
      { title: 'Thông số kỹ thuật', url: '/specs', icon: <Settings size={18}/> },
      { title: 'Dự báo & Điều tiết', url: '/forecast', icon: <CloudRain size={18}/> },
      { title: 'Giám sát Mực nước', url: '/water-level', icon: <Droplets size={18}/> },
      { title: 'Hồ sơ cá nhân', url: '/profile', icon: <User size={18}/> },
    ];

    pages.forEach(p => {
      if (removeAccents(p.title).includes(term)) {
        res.push({ id: `page-${p.url}`, type: 'page', title: p.title, url: p.url, icon: p.icon, group: 'Trang' });
      }
    });

    // 2. Sensors
    const sensors = db.sensors.get();
    sensors.forEach(s => {
      if (removeAccents(s.name).includes(term) || s.code.toLowerCase().includes(term)) {
        res.push({ 
          id: `sensor-${s.id}`, 
          type: 'sensor', 
          title: s.name, 
          subtitle: `${s.station} • ${s.lastValue} ${s.unit}`,
          url: '/sensors', 
          group: 'Cảm biến',
          status: s.status,
          action: () => navigate('/sensors', { state: { openSensorId: s.id } })
        });
      }
    });

    // 3. Documents
    const docs = db.documents.get();
    docs.forEach(d => {
      if (removeAccents(d.title).includes(term) || d.number.toLowerCase().includes(term)) {
        res.push({
          id: `doc-${d.id}`,
          type: 'document',
          title: d.number,
          subtitle: d.title,
          url: '/documents',
          group: 'Văn bản',
          icon: <FileText size={18}/>
        });
      }
    });

    return res.slice(0, 8); // Limit results
  }, [query]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0) {
          handleSelect(results[selectedIndex]);
        } else if (query) {
           // AI Search fallback
           handleSelect({ id: 'ai-fallback', type: 'ai', title: 'Hỏi AI', url: '#ai' });
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query]);

  const handleSelect = (item: SearchResult | { type: 'ai', title: string, url: string, id: string }) => {
    addToHistory(query);
    onClose();
    
    if (item.type === 'ai') {
        const event = new CustomEvent('open-ai-assistant', { detail: query });
        window.dispatchEvent(event);
        return;
    }

    if ((item as SearchResult).action) {
        (item as SearchResult).action!();
    } else if (item.url) {
        if (item.url === '#ai') {
             const event = new CustomEvent('open-ai-assistant', { detail: '' });
             window.dispatchEvent(event);
        } else {
             navigate(item.url);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700 max-h-[80vh]">
        
        {/* Search Bar */}
        <div className="flex items-center p-4 border-b border-slate-100 dark:border-slate-700 gap-3">
           <Search size={20} className="text-slate-400 shrink-0" />
           <input 
             ref={inputRef}
             type="text" 
             value={query}
             onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
             className="flex-1 bg-transparent text-lg outline-none text-slate-800 dark:text-white placeholder-slate-400"
             placeholder="Tìm kiếm, hỏi AI, tra cứu cảm biến..."
           />
           <button 
             onClick={toggleListening}
             className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}
           >
             {isListening ? <MicOff size={20}/> : <Mic size={20}/>}
           </button>
           <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
              <span>ESC</span>
           </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={listRef}>
           
           {/* 1. Search Results */}
           {query && results.length > 0 && (
             <div className="p-2">
                <div className="text-xs font-bold text-slate-400 uppercase px-3 py-2">Kết quả tìm kiếm</div>
                {results.map((item, index) => (
                   <div 
                     key={item.id}
                     onClick={() => handleSelect(item)}
                     className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer group ${index === selectedIndex ? 'bg-blue-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                   >
                      <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 shadow-sm shrink-0`}>
                         {item.icon || (item.type === 'sensor' ? <Activity size={18}/> : <FileText size={18}/>)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</span>
                            {item.group && <span className="text-[10px] bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded">{item.group}</span>}
                         </div>
                         {item.subtitle && <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>}
                      </div>
                      {index === selectedIndex && <CornerDownLeft size={16} className="text-slate-400 mr-2"/>}
                   </div>
                ))}
             </div>
           )}

           {/* 2. No Results / AI Suggestion */}
           {query && results.length === 0 && (
              <div className="p-4">
                 <div 
                   onClick={() => handleSelect({ id: 'ai-fallback', type: 'ai', title: 'Hỏi AI', url: '#ai' })}
                   className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-all ${selectedIndex === 0 ? 'ring-2 ring-indigo-500' : ''}`}
                 >
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-indigo-600">
                       <Sparkles size={20} className="animate-pulse"/>
                    </div>
                    <div>
                       <p className="font-bold text-slate-800 dark:text-white">Hỏi Trợ lý AI về "{query}"</p>
                       <p className="text-xs text-slate-500">Phân tích dữ liệu, tra cứu thông tin...</p>
                    </div>
                    <ArrowRight size={18} className="ml-auto text-indigo-400"/>
                 </div>
              </div>
           )}

           {/* 3. Default View (History & Quick Links) */}
           {!query && (
             <div className="p-4 space-y-6">
                
                {/* Recent History */}
                {historyList.length > 0 && (
                   <div>
                      <div className="flex items-center justify-between px-1 mb-2">
                         <span className="text-xs font-bold text-slate-400 uppercase">Tìm kiếm gần đây</span>
                         <button onClick={clearHistory} className="text-[10px] text-red-500 hover:underline">Xóa lịch sử</button>
                      </div>
                      <div className="space-y-1">
                         {historyList.map((term, i) => (
                            <div 
                              key={i}
                              onClick={() => setQuery(term)}
                              className="flex items-center justify-between group px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer text-sm text-slate-600 dark:text-slate-300 transition-colors"
                            >
                               <div className="flex items-center gap-3">
                                  <History size={14} className="text-slate-400"/>
                                  <span>{term}</span>
                               </div>
                               <button 
                                 onClick={(e) => removeFromHistory(e, term)}
                                 className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded"
                               >
                                  <X size={14}/>
                               </button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Quick Suggestions */}
                <div>
                   <div className="text-xs font-bold text-slate-400 uppercase px-1 mb-3">Truy cập nhanh</div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {QUICK_SUGGESTIONS.map((item) => (
                         <div 
                           key={item.id}
                           onClick={() => handleSelect({ id: item.id, type: 'action', title: item.title, url: item.url })}
                           className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all gap-2 text-center group"
                         >
                            <div className={`p-2.5 rounded-full ${item.color} group-hover:scale-110 transition-transform`}>
                               {item.icon}
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.title}</span>
                         </div>
                      ))}
                   </div>
                </div>

                {/* Footer Hint */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-4 text-[10px] text-slate-400">
                   <span className="flex items-center gap-1"><Command size={10}/> <span className="font-mono">K</span> để mở</span>
                   <span className="flex items-center gap-1"><ArrowRight size={10}/> để chọn</span>
                   <span className="flex items-center gap-1"><span className="font-mono">ESC</span> để đóng</span>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
