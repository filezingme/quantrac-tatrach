import React, { useState } from 'react';
import { Camera, Plus, Trash2, Radio, ExternalLink } from 'lucide-react';
import { db } from '../utils/db';
import { CameraInfo } from '../types';

export const CameraView: React.FC = () => {
  const [cameras, setCameras] = useState<CameraInfo[]>(db.cameras.get());

  const handleAddCamera = () => {
    const name = prompt('Tên Camera:');
    if (!name) return;
    
    const url = prompt('Nhập URL luồng Camera (Hỗ trợ link Embed YouTube hoặc MJPEG):', 'https://www.youtube.com/embed/VIDEO_ID');
    if (!url) return;
    
    const newCam: CameraInfo = {
      id: Date.now().toString(),
      name,
      url,
      status: 'online'
    };
    
    const updated = [...cameras, newCam];
    setCameras(updated);
    db.cameras.set(updated);
  };

  const handleDelete = (id: string) => {
    if(confirm('Xóa camera này?')) {
      const updated = cameras.filter(c => c.id !== id);
      setCameras(updated);
      db.cameras.set(updated);
    }
  };

  const renderCameraContent = (cam: CameraInfo) => {
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
         className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
         onError={(e) => {
           // Fallback if image fails
           (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x450?text=Signal+Lost';
         }} 
       />
    );
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hệ thống Camera giám sát</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kết nối trực tiếp với các camera tại hiện trường</p>
        </div>
        <button 
          onClick={handleAddCamera}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-200 dark:shadow-blue-900/50 transition-all"
        >
          <Plus size={18} /> Thêm Camera
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cameras.map((cam) => (
          <div key={cam.id} className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 relative group flex flex-col">
             <div className="relative aspect-video bg-black">
               
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

             <div className="p-4 bg-slate-800 flex justify-between items-center z-10">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-700 rounded-full">
                    <Camera size={18} className="text-blue-400" />
                 </div>
                 <div>
                    <span className="text-slate-200 font-bold block">{cam.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">ID: {cam.id.slice(-6)}</span>
                 </div>
               </div>
               
               <a 
                 href={cam.url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
               >
                 Mở rộng <ExternalLink size={12}/>
               </a>
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
  );
};