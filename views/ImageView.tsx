import React, { useState, useRef } from 'react';
import { Folder, Plus, ExternalLink, Image as ImageIcon, ArrowLeft, Upload, Grid, Maximize2 } from 'lucide-react';
import { db } from '../utils/db';
import { ImageGroup, ImageItem } from '../types';
import { useUI } from '../components/GlobalUI';

export const ImageView: React.FC = () => {
  const [groups, setGroups] = useState<ImageGroup[]>(db.images.get());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const ui = useUI();
  
  // File Input Ref for uploading
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Group Management ---

  const handleAddGroup = () => {
    ui.prompt({
      title: 'Tạo Album mới',
      message: 'Nhập tên cho nhóm hình ảnh mới:',
      placeholder: 'Tên album...',
      onConfirm: (title) => {
        if (title.trim()) {
          const newGroup: ImageGroup = {
            id: Date.now().toString(),
            title,
            images: []
          };
          const updated = [...groups, newGroup];
          setGroups(updated);
          db.images.set(updated);
        }
      }
    });
  };

  // --- Image Management ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeGroupId || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        
        const updated = groups.map(g => {
          if (g.id !== activeGroupId) return g;
          return {
            ...g,
            images: [
              { id: Date.now().toString(), url: base64Url, title: file.name },
              ...g.images
            ]
          };
        });
        
        setGroups(updated);
        db.images.set(updated);
      }
    };

    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleAddImageViaUrl = () => {
    if (!activeGroupId) return;
    
    ui.prompt({
      title: 'Thêm ảnh từ URL',
      message: 'Nhập đường dẫn hình ảnh (URL):',
      placeholder: 'https://...',
      onConfirm: (url) => {
        if (!url.trim()) return;
        
        // After URL, prompt for Title
        setTimeout(() => {
          ui.prompt({
            title: 'Tiêu đề ảnh',
            message: 'Nhập tiêu đề hiển thị cho hình ảnh này:',
            defaultValue: 'Ảnh mới',
            placeholder: 'Tiêu đề...',
            onConfirm: (title) => {
              const finalTitle = title.trim() || 'Ảnh mới';
              const updated = groups.map(g => {
                if (g.id !== activeGroupId) return g;
                return {
                  ...g,
                  images: [{ id: Date.now().toString(), url, title: finalTitle }, ...g.images]
                };
              });
              setGroups(updated);
              db.images.set(updated);
            }
          });
        }, 100);
      }
    });
  }

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="space-y-6 pb-10 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* VIEW: DETAIL (Image List) */}
      {activeGroupId && activeGroup ? (
         <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveGroupId(null)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{activeGroup.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{activeGroup.images.length} hình ảnh</p>
                  </div>
               </div>
               
               <div className="flex gap-2">
                 <button 
                    onClick={handleAddImageViaUrl}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                 >
                    <ExternalLink size={16} /> Link URL
                 </button>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-200 dark:shadow-blue-900/50"
                 >
                    <Upload size={16} /> Tải ảnh lên
                 </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {activeGroup.images.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <ImageIcon size={48} className="mb-2 opacity-50"/>
                        <p>Chưa có hình ảnh nào trong nhóm này</p>
                        <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline">Tải ảnh đầu tiên</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {activeGroup.images.map((img) => (
                           <div key={img.id} className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden aspect-square cursor-pointer">
                               <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                   <p className="text-white text-sm font-medium truncate">{img.title}</p>
                                   <button className="absolute top-2 right-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                      <Maximize2 size={16}/>
                                   </button>
                               </div>
                           </div>
                        ))}
                    </div>
                )}
            </div>
         </div>
      ) : (
        /* VIEW: MASTER (Group List) */
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thư viện hình ảnh</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý kho tư liệu hình ảnh công trình</p>
                </div>
                <button 
                onClick={handleAddGroup}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 shadow-sm"
                >
                <Plus size={18} /> Tạo nhóm mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group) => (
                <div 
                    key={group.id} 
                    onClick={() => setActiveGroupId(group.id)}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                >
                    <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    {group.images.length > 0 ? (
                        <>
                            <img 
                                src={group.images[0].url} 
                                alt={group.title} 
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-700/50">
                            <Folder size={64} strokeWidth={1} />
                        </div>
                    )}
                    
                    {/* Badge Count */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm border border-white/20">
                        <ImageIcon size={12} /> {group.images.length}
                    </div>
                    </div>
                    
                    <div className="p-4 flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{group.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                             {group.images.length > 0 ? 'Nhấn để xem chi tiết' : 'Chưa có hình ảnh'}
                        </p>
                    </div>
                </div>
                ))}
                
                {/* Empty State / Add New Placeholder */}
                <button 
                    onClick={handleAddGroup}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center min-h-[250px] text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all bg-slate-50/50 dark:bg-slate-800/30"
                >
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center mb-3">
                        <Plus size={24} />
                    </div>
                    <span className="font-medium">Tạo Album mới</span>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};