import React, { useState } from 'react';
import { Camera, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { db } from '../utils/db';
import { CameraInfo } from '../types';
import { useUI } from '../components/GlobalUI';

// Custom Icons for precise grid visualization (CCTV Style with padding)
const IconGrid2 = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </svg>
);

const IconGrid3 = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Row 1 */}
    <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="9.5" y="2.5" width="5" height="5" rx="1" />
    <rect x="16.5" y="2.5" width="5" height="5" rx="1" />
    {/* Row 2 */}
    <rect x="2.5" y="9.5" width="5" height="5" rx="1" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <rect x="16.5" y="9.5" width="5" height="5" rx="1" />
    {/* Row 3 */}
    <rect x="2.5" y="16.5" width="5" height="5" rx="1" />
    <rect x="9.5" y="16.5" width="5" height="5" rx="1" />
    <rect x="16.5" y="16.5" width="5" height="5" rx="1" />
  </svg>
);

const IconGrid4 = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Row 1 */}
    <rect x="2.5" y="2.5" width="4" height="4" rx="0.5" />
    <rect x="8" y="2.5" width="4" height="4" rx="0.5" />
    <rect x="13.5" y="2.5" width="4" height="4" rx="0.5" />
    <rect x="19" y="2.5" width="4" height="4" rx="0.5" />
    {/* Row 2 */}
    <rect x="2.5" y="8" width="4" height="4" rx="0.5" />
    <rect x="8" y="8" width="4" height="4" rx="0.5" />
    <rect x="13.5" y="8" width="4" height="4" rx="0.5" />
    <rect x="19" y="8" width="4" height="4" rx="0.5" />
    {/* Row 3 */}
    <rect x="2.5" y="13.5" width="4" height="4" rx="0.5" />
    <rect x="8" y="13.5" width="4" height="4" rx="0.5" />
    <rect x="13.5" y="13.5" width="4" height="4" rx="0.5" />
    <rect x="19" y="13.5" width="4" height="4" rx="0.5" />
    {/* Row 4 */}
    <rect x="2.5" y="19" width="4" height="4" rx="0.5" />
    <rect x="8" y="19" width="4" height="4" rx="0.5" />
    <rect x="13.5" y="19" width="4" height="4" rx="0.5" />
    <rect x="19" y="19" width="4" height="4" rx="0.5" />
  </svg>
);

export const CameraView: React.FC = () => {
  const [cameras, setCameras] = useState<CameraInfo[]>(db.cameras.get());
  const [selectedCamera, setSelectedCamera] = useState<CameraInfo | null>(null);
  
  // Grid View State (2, 3, or 4 columns)
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(2);
  
  const ui = useUI();

  const handleAddCamera = () => {
    ui.prompt({
      title: 'Thêm Camera mới',
      message: 'Nhập tên hiển thị cho Camera:',
      placeholder: 'Tên Camera (VD: Cam Đập Tràn)...',
      onConfirm: (name) => {
        if (!name.trim()) return;
        
        // Chain prompt for URL
        setTimeout(() => {
          ui.prompt({
            title: 'Luồng Video',
            message: 'Nhập URL luồng Camera (Hỗ trợ Embed YouTube hoặc MJPEG):',
            defaultValue: 'https://www.youtube.com/embed/VIDEO_ID',
            placeholder: 'https://...',
            onConfirm: (url) => {
               if (!url.trim()) return;
               
               const newCam: CameraInfo = {
                id: Date.now().toString(),
                name,
                url,
                status: 'online'
              };
              
              const updated = [...cameras, newCam];
              setCameras(updated);
              db.cameras.set(updated);
            }
          });
        }, 100);
      }
    });
  };

  const handleDelete = (id: string) => {
    ui.confirm({
        message: 'Bạn có chắc chắn muốn xóa camera này?',
        type: 'danger',
        onConfirm: () => {
            const updated = cameras.filter(c => c.id !== id);
            setCameras(updated);
            db.cameras.set(updated);
        }
    });
  };

  const renderCameraContent = (cam: CameraInfo, isFullScreen = false) => {
    // Check if it's an iframe embeddable link (like YouTube)
    const isEmbed = cam.url.includes('embed') || cam.url.includes('youtube.com');
    
    if (isEmbed) {
      return (
        <iframe 
          src={cam.url} 
          title={cam.name}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      );
    }
    
    // Fallback to Image (MJPEG or Static)
    return (
      <img 
         src={cam.url} 
         alt={cam.name}
         className={`w-full h-full object-cover ${isFullScreen ? '' : 'opacity-90 group-hover:opacity-100 transition-opacity'}`}
         onError={(e) => {
           // Fallback if image fails
           (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Signal+Lost';
         }} 
       />
    );
  };

  // Dynamic Grid Class Calculation
  const getGridClass = () => {
    switch (gridCols) {
      case 3:
        // On tablet (md), show 3 columns
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 4:
        // On tablet (md), show 4 columns (dense view)
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
      default: // 2 cols
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2';
    }
  };

  return (
    <>
      <div className="space-y-6 pb-10 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hệ thống Camera giám sát</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Kết nối trực tiếp với các camera tại hiện trường</p>
          </div>
          
          <div className="flex items-center gap-3 self-end md:self-auto">
             {/* Grid View Controls (Visible on Tablet/Desktop) */}
             <div className="hidden sm:flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                <button 
                  onClick={() => setGridCols(2)}
                  className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${gridCols === 2 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  title="2 Camera / Hàng"
                >
                   <IconGrid2 size={18} />
                   <span className="text-xs font-bold">2</span>
                </button>
                <button 
                  onClick={() => setGridCols(3)}
                  className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${gridCols === 3 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  title="3 Camera / Hàng"
                >
                   <IconGrid3 size={18} />
                   <span className="text-xs font-bold">3</span>
                </button>
                <button 
                  onClick={() => setGridCols(4)}
                  className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${gridCols === 4 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  title="4 Camera / Hàng"
                >
                   <IconGrid4 size={18} />
                   <span className="text-xs font-bold">4</span>
                </button>
             </div>

             <button 
               onClick={handleAddCamera}
               className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-200 dark:shadow-blue-900/50 transition-all"
             >
               <Plus size={18} /> <span className="hidden sm:inline">Thêm Camera</span>
             </button>
          </div>
        </div>

        <div className={`grid ${getGridClass()} gap-6 transition-all duration-300`}>
          {cameras.map((cam) => (
            <div key={cam.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 relative group flex flex-col hover:shadow-lg transition-all">
              <div className="relative aspect-video bg-slate-100 dark:bg-black">
                
                {renderCameraContent(cam)}
                
                {/* Live Indicator (Overlay on top of video) */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                  <div className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs font-mono text-white font-bold tracking-widest">
                    {cam.status === 'online' ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>

                {/* Controls Overlay */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      onClick={() => handleDelete(cam.id)}
                      className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-md transition-colors shadow-sm"
                      title="Xóa Camera"
                    >
                      <Trash2 size={16} />
                    </button>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center z-10 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-blue-50 dark:bg-slate-700/50 rounded-full shrink-0">
                      <Camera size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                      <span className="text-slate-800 dark:text-slate-200 font-bold block truncate">{cam.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase truncate block">ID: {cam.id.slice(-6)}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedCamera(cam)}
                  className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors font-medium shrink-0"
                >
                  <span className="hidden sm:inline">Mở rộng</span> <ExternalLink size={12}/>
                </button>
              </div>
            </div>
          ))}

          {/* Add Placeholder */}
          <button 
            onClick={handleAddCamera}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center aspect-video text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 group-hover:border-blue-200 group-hover:shadow-md flex items-center justify-center mb-3 transition-all">
              <Plus size={28} />
            </div>
            <span className="font-semibold">Thêm vị trí mới</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hỗ trợ YouTube Embed & MJPEG</span>
          </button>
        </div>
      </div>

      {/* FULL SCREEN MODAL */}
      {selectedCamera && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col relative rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
             
             {/* Close Button */}
             <button 
               onClick={() => setSelectedCamera(null)}
               className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-white/20 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10"
             >
               <X size={24} />
             </button>

             {/* Content */}
             <div className="flex-1 relative">
                {renderCameraContent(selectedCamera, true)}
             </div>

             {/* Info Bar */}
             <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none">
                <h3 className="text-white font-bold text-2xl drop-shadow-md">{selectedCamera.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                   <div className={`flex items-center gap-2 px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10`}>
                      <div className={`w-2 h-2 rounded-full ${selectedCamera.status === 'online' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                      <span className="text-xs font-mono text-white/90 font-bold tracking-widest">{selectedCamera.status === 'online' ? 'LIVE' : 'OFFLINE'}</span>
                   </div>
                   <span className="text-xs text-white/60 font-mono">ID: {selectedCamera.id}</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};