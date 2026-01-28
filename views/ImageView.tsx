
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Plus, ExternalLink, Image as ImageIcon, ArrowLeft, Upload, Grid, Maximize2, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { db } from '../utils/db';
import { ImageGroup, ImageItem } from '../types';
import { useUI } from '../components/GlobalUI';

export const ImageView: React.FC = () => {
  const [groups, setGroups] = useState<ImageGroup[]>(db.images.get());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // Lightbox State
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<number>(0); // 0: none, 1: next (slide right), -1: prev (slide left)

  const ui = useUI();
  
  // File Input Ref for uploading
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Touch Handling Refs
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  // --- Keyboard Navigation for Lightbox ---
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateImage(-1);
      } else if (e.key === 'ArrowRight') {
        navigateImage(1);
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
        setDirection(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, activeGroup]);

  const navigateImage = (dir: number) => {
    if (!activeGroup || selectedIndex === null) return;
    const count = activeGroup.images.length;
    if (count === 0) return;

    let newIndex = selectedIndex + dir;
    // Loop navigation
    if (newIndex < 0) newIndex = count - 1;
    if (newIndex >= count) newIndex = 0;
    
    setDirection(dir);
    setSelectedIndex(newIndex);
  };

  // --- Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const diffX = touchStartRef.current.x - touchEnd.x;
    const diffY = touchStartRef.current.y - touchEnd.y;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);
    const threshold = 40; // Reduced threshold for better sensitivity

    // Ignore taps/small movements
    if (Math.max(absDiffX, absDiffY) < threshold) {
        touchStartRef.current = null;
        return;
    }

    if (absDiffX > absDiffY) {
      // Horizontal Swipe
      if (diffX > 0) {
        // Swiped Left (finger moves left) -> Next Image
        navigateImage(1);
      } else {
        // Swiped Right (finger moves right) -> Previous Image
        navigateImage(-1);
      }
    } else {
      // Vertical Swipe -> Close Modal
      setSelectedIndex(null);
      setDirection(0);
    }
    
    touchStartRef.current = null;
  };

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

  const handleDeleteGroup = (e: React.MouseEvent, groupId: string, groupTitle: string) => {
    e.stopPropagation(); // Prevent opening the group when clicking delete
    ui.confirm({
      title: 'Xóa Album',
      message: `Bạn có chắc chắn muốn xóa album "${groupTitle}" và toàn bộ ảnh bên trong?`,
      type: 'danger',
      onConfirm: () => {
        const updated = groups.filter(g => g.id !== groupId);
        setGroups(updated);
        db.images.set(updated);
        ui.showToast('success', 'Đã xóa album thành công');
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

  const handleDeleteImage = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation(); // Prevent opening lightbox
    if (!activeGroupId) return;

    ui.confirm({
      message: 'Bạn có chắc chắn muốn xóa hình ảnh này?',
      type: 'danger',
      onConfirm: () => {
        const updated = groups.map(g => {
          if (g.id !== activeGroupId) return g;
          return {
            ...g,
            images: g.images.filter(img => img.id !== imageId)
          };
        });
        setGroups(updated);
        db.images.set(updated);
        ui.showToast('success', 'Đã xóa ảnh');
      }
    });
  };

  return (
    <>
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
                          {activeGroup.images.map((img, index) => (
                             <div 
                               key={img.id} 
                               onClick={() => {
                                 setDirection(0);
                                 setSelectedIndex(index);
                               }}
                               className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden aspect-square cursor-pointer hover:shadow-md transition-all"
                             >
                                 <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                 
                                 {/* Hover Overlay */}
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                     <p className="text-white text-sm font-medium truncate pr-16">{img.title}</p>
                                     
                                     {/* Action Buttons */}
                                     <div className="absolute top-2 right-2 flex gap-2">
                                        <button 
                                          onClick={(e) => handleDeleteImage(e, img.id)}
                                          className="text-white/80 hover:text-white bg-red-500/80 hover:bg-red-600 p-1.5 rounded-full backdrop-blur-sm transition-colors"
                                          title="Xóa ảnh"
                                        >
                                          <Trash2 size={16}/>
                                        </button>
                                        <div className="text-white/80 hover:text-white bg-black/20 hover:bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                                            <Maximize2 size={16}/>
                                        </div>
                                     </div>
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
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative"
                  >
                      {/* Delete Group Button (Visible on Hover) */}
                      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleDeleteGroup(e, group.id, group.title)}
                          className="p-2 bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full shadow-sm backdrop-blur-sm transition-all border border-slate-200 dark:border-slate-600"
                          title="Xóa Album"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

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

      {/* LIGHTBOX MODAL */}
      {selectedIndex !== null && activeGroup && activeGroup.images[selectedIndex] && (
        <div 
          className="fixed inset-0 z-[5000] bg-slate-900/80 backdrop-blur-md flex flex-col animate-in fade-in duration-300"
          style={{ marginTop: 0 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
           {/* Custom iOS-like Slide Animations */}
           <style>{`
             @keyframes slide-next {
               from { transform: translateX(100vw); }
               to { transform: translateX(0); }
             }
             @keyframes slide-prev {
               from { transform: translateX(-100vw); }
               to { transform: translateX(0); }
             }
             .animate-slide-next { animation: slide-next 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
             .animate-slide-prev { animation: slide-prev 0.3s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
           `}</style>

           {/* Top Controls (Overlay) */}
           <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
              <span className="text-white/90 text-sm font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-auto border border-white/10">
                {selectedIndex + 1} / {activeGroup.images.length}
              </span>
              <button 
                onClick={() => setSelectedIndex(null)}
                className="p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-colors backdrop-blur-sm pointer-events-auto border border-white/10"
              >
                <X size={24} />
              </button>
           </div>

           {/* Main Image Area */}
           <div 
             className="flex-1 w-full h-full flex items-center justify-center relative group select-none overflow-hidden"
             onClick={() => setSelectedIndex(null)} // Click outside to close
           >
              {/* Previous Button - Hidden on Mobile */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}
                className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-md transition-all z-40 opacity-0 group-hover:opacity-100 border border-white/10"
              >
                <ChevronLeft size={32} />
              </button>

              {/* Image with iOS-like slide transition */}
              <img 
                key={selectedIndex} // Forces re-mount to trigger animation
                src={activeGroup.images[selectedIndex].url} 
                alt={activeGroup.images[selectedIndex].title}
                className={`max-h-full max-w-full h-full object-contain shadow-2xl ${
                  direction === 1 ? 'animate-slide-next' : 
                  direction === -1 ? 'animate-slide-prev' : 
                  'animate-in zoom-in-95 duration-200'
                }`}
                onClick={(e) => e.stopPropagation()} 
              />

              {/* Next Button - Hidden on Mobile */}
              <button 
                onClick={(e) => { e.stopPropagation(); navigateImage(1); }}
                className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white bg-black/20 hover:bg-black/50 rounded-full backdrop-blur-md transition-all z-40 opacity-0 group-hover:opacity-100 border border-white/10"
              >
                <ChevronRight size={32} />
              </button>
           </div>

           {/* Caption Footer (Overlay) */}
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-center pb-8 z-40 pointer-events-none flex flex-col items-center gap-2">
              <h3 className="text-white font-bold text-lg pointer-events-auto inline-block drop-shadow-md">
                {activeGroup.images[selectedIndex].title}
              </h3>
              {/* Mobile Interaction Hint */}
              <p className="text-white/60 text-xs md:hidden animate-pulse">
                Vuốt ngang để chuyển ảnh • Vuốt dọc để đóng
              </p>
           </div>
        </div>
      )}
    </>
  );
};
