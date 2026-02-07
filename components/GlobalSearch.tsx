
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, 
  Droplets, ArrowRight, Camera, Waves, Activity, Table as TableIcon, 
  CloudRain, User, Moon, Sun, LogOut, History, Bell, Mic, Command, 
  CornerDownLeft, MoveUp, MoveDown, Trash2, MicOff, Radio, AlertOctagon,
  BrainCircuit, Map as MapIcon, BarChart2, AlertCircle
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
  title: string;
  subtitle?: string;
  url?: string; 
  value?: string;
  action?: () => void;
  icon?: React.ReactNode;
}

// Quick Suggestions Data matching the screenshot
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

  // Main Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = removeAccents(query);
    const rawResults: SearchResult[] = [];
    const currentUser = db.user.get();

    // 1. Pages
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
    ];

    pages.forEach(page => {
      if (removeAccents(page.label).includes(lowerQuery)) {
        rawResults.push({ 
            id: `page-${page.path}`, 
            title: page.label.split('/')[0].trim(), 
            subtitle: 'Điều hướng',
            url: page.path, 
            icon: <page.icon size={18} /> 
        });
      }
    });

    // 2. Data (Sensors)
    try {
        const sensors = db.sensors.get();
        sensors.filter(s => 
            removeAccents(s.name).includes(lowerQuery) || 
            removeAccents(s.code).includes(lowerQuery)
        ).slice(0, 3).forEach(s => {
            rawResults.push({
                id: `sensor-${s.id}`,
                title: s.name,
                subtitle: `${s.type} - ${s.lastValue} ${s.unit}`,
                url: '/sensors',
                icon: <Radio size={18} />
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

  const handleSelect = (result: SearchResult) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Input */}
        <div className="flex items-center px-4 py-4 gap-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-lg text-slate-700 dark:text-white placeholder-slate-400 font-medium"
            placeholder="Tìm kiếm dữ liệu, cảm biến, ra lệnh..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
             <button 
                onClick={toggleListening}
                className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
             >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>
             
             <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[400px] overflow-y-auto p-2" ref={listRef}>
          {query ? (
             /* Search Results */
             results.length > 0 ? (
                <div className="space-y-1">
                    {results.map((result, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleSelect(result)}
                            className={`
                                px-4 py-3 rounded-lg cursor-pointer flex items-center gap-4 transition-colors
                                ${idx === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                            `}
                        >
                            <div className={`text-slate-500 dark:text-slate-400 ${idx === selectedIndex ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {result.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm ${idx === selectedIndex ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {result.title}
                                </div>
                                {result.subtitle && (
                                    <div className="text-xs text-slate-400 truncate">{result.subtitle}</div>
                                )}
                            </div>
                            {idx === selectedIndex && <CornerDownLeft size={16} className="text-blue-400"/>}
                        </div>
                    ))}
                </div>
             ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                    Không tìm thấy kết quả
                </div>
             )
          ) : (
            /* Quick Suggestions (Original Design) */
            <div className="p-4 pt-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-wide">Gợi ý nhanh</h4>
                <div className="grid grid-cols-2 gap-4">
                    {QUICK_SUGGESTIONS.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => handleQuickSelect(item.url)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group"
                        >
                            <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.icon}
                            </div>
                            <span className="font-medium text-slate-600 dark:text-slate-300 text-sm group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {item.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Simple Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 px-4 py-2.5 flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <div className="flex gap-3">
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 min-w-[16px] text-center font-sans shadow-sm">↵</kbd> chọn</span>
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 min-w-[16px] text-center font-sans shadow-sm">↑↓</kbd> di chuyển</span>
                <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded px-1 min-w-[16px] text-center font-sans shadow-sm">Tab</kbd> đổi nhóm</span>
            </div>
            <div>Global Search v3.0</div>
        </div>
      </div>
    </div>
  );
};
