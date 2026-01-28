
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Image as ImageIcon, LayoutDashboard, Settings, Droplets, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/db';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'page' | 'document' | 'spec' | 'data' | 'image';
  title: string;
  subtitle?: string;
  url?: string; // For navigation
  value?: string; // For displaying data directly
  icon?: React.ReactNode;
}

const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = removeAccents(query);
    const searchResults: SearchResult[] = [];

    // 1. SEARCH PAGES (Navigation)
    const pages = [
      { path: '/dashboard', label: 'Bảng điều khiển / Dashboard' },
      { path: '/map', label: 'Bản đồ số GIS' },
      { path: '/forecast', label: 'Dự báo' },
      { path: '/documents', label: 'Văn bản & Quy định' },
      { path: '/images', label: 'Thư viện hình ảnh' },
      { path: '/camera', label: 'Camera giám sát' },
      { path: '/specs', label: 'Thông số kỹ thuật' },
      { path: '/flood-forecast', label: 'Dự báo lũ & Điều hành' },
    ];

    pages.forEach(page => {
      if (removeAccents(page.label).includes(lowerQuery)) {
        searchResults.push({
          id: `page-${page.path}`,
          type: 'page',
          title: page.label,
          url: page.path,
          icon: <LayoutDashboard size={16} />
        });
      }
    });

    // 2. SEARCH DATA (Observation)
    const obs = db.observation.get();
    if (removeAccents('mực nước').includes(lowerQuery) || removeAccents('water level').includes(lowerQuery)) {
      searchResults.push({ id: 'data-wl', type: 'data', title: 'Mực nước hồ hiện tại', value: `${obs.waterLevel} m`, icon: <Droplets size={16}/> });
    }
    if (removeAccents('dung tích').includes(lowerQuery) || removeAccents('capacity').includes(lowerQuery)) {
      searchResults.push({ id: 'data-cap', type: 'data', title: 'Dung tích hiện tại', value: `${obs.capacity} tr.m³`, icon: <Droplets size={16}/> });
    }
    if (removeAccents('lưu lượng đến').includes(lowerQuery) || removeAccents('inflow').includes(lowerQuery)) {
      searchResults.push({ id: 'data-in', type: 'data', title: 'Lưu lượng đến', value: `${obs.inflow} m³/s`, icon: <Droplets size={16}/> });
    }
    obs.rainfall.forEach(r => {
        if(removeAccents(r.name).includes(lowerQuery)) {
            searchResults.push({ id: `rain-${r.id}`, type: 'data', title: `Mưa tại ${r.name}`, value: `${r.data.current} mm`, icon: <Droplets size={16}/> });
        }
    });

    // 3. SEARCH DOCUMENTS
    const docs = db.documents.get();
    docs.forEach(doc => {
      if (removeAccents(doc.title).includes(lowerQuery) || removeAccents(doc.number).includes(lowerQuery)) {
        searchResults.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title: doc.title,
          subtitle: doc.number,
          url: '/documents', // In real app, could link to specific doc viewer
          icon: <FileText size={16} />
        });
      }
    });

    // 4. SEARCH SPECS
    const specs = db.specs.get();
    specs.forEach(group => {
      group.items.forEach(item => {
        if (removeAccents(item.name).includes(lowerQuery)) {
          searchResults.push({
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
      // Search subgroups
      if(group.subGroups) {
          group.subGroups.forEach(sg => {
              sg.items.forEach(item => {
                  if (removeAccents(item.name).includes(lowerQuery)) {
                    searchResults.push({
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

    // 5. SEARCH IMAGES
    const images = db.images.get();
    images.forEach(group => {
        if (removeAccents(group.title).includes(lowerQuery)) {
            searchResults.push({
                id: `img-g-${group.id}`,
                type: 'image',
                title: `Album: ${group.title}`,
                subtitle: `${group.images.length} ảnh`,
                url: '/images',
                icon: <ImageIcon size={16} />
            });
        }
    });

    setResults(searchResults.slice(0, 8)); // Limit results
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.url) {
      navigate(result.url);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center border-b border-slate-100 dark:border-slate-700 px-4 py-3 gap-3">
          <Search className="text-slate-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-lg text-slate-800 dark:text-white placeholder-slate-400 font-medium"
            placeholder="Tìm kiếm dữ liệu, văn bản, thông số..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Enter' && results.length > 0) handleSelect(results[0]);
            }}
          />
          <button onClick={onClose} className="p-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 text-xs font-bold px-2">ESC</button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kết quả phù hợp nhất</div>
              {results.map((result, idx) => (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`
                    px-4 py-3 mx-2 rounded-lg cursor-pointer flex items-center justify-between group
                    ${idx === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                  `}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`
                        p-2 rounded-lg shrink-0
                        ${result.type === 'page' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 
                          result.type === 'data' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' :
                          result.type === 'document' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}
                    `}>
                        {result.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{result.title}</div>
                      {result.subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{result.subtitle}</div>}
                    </div>
                  </div>

                  {result.value ? (
                      <div className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm whitespace-nowrap">
                          {result.value}
                      </div>
                  ) : (
                      <ArrowRight size={16} className={`text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${idx === 0 ? 'opacity-100' : ''}`} />
                  )}
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
               <p>Không tìm thấy kết quả nào cho "{query}"</p>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <p>Gõ để tìm kiếm điều hướng, văn bản, thông số...</p>
                <div className="flex gap-2 justify-center mt-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Mực nước</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Văn bản</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">Bản đồ</span>
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
