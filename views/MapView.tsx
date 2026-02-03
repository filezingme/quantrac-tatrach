
import React, { useEffect, useRef, useState } from 'react';
import { Layers, MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { db } from '../utils/db';

// Declare Leaflet globally since it's loaded via script tag
declare const L: any;

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null); // Ref for the outer wrapper to go fullscreen
  const mapInstanceRef = useRef<any>(null);
  
  const [activeLayer, setActiveLayer] = useState<'streets' | 'satellite'>('streets');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generalInfo] = useState(db.generalInfo.get());

  // Coordinates for Ta Trach Reservoir (Approximate based on Thua Thien Hue)
  const centerLat = 16.326; 
  const centerLng = 107.585;

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;

    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Listen for fullscreen changes (e.g. user pressing ESC)
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Force Leaflet to resize after transition
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Map
    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    // Add Tile Layers
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });

    // Default layer
    streetLayer.addTo(map);

    // Save layers to toggle later
    (map as any)._layers_custom = { streets: streetLayer, satellite: satelliteLayer };

    // --- SVG STRINGS FOR ICONS ---
    const damSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`; // Activity/Wave icon
    const rainSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v2"/><path d="M12 19v2"/><path d="M16 19v2"/></svg>`; // CloudRain icon

    // --- Markers ---

    // 1. Main Dam Marker (Big, Red, Pulsating)
    const mainIcon = L.divIcon({
      className: 'custom-dam-marker',
      html: `
        <div class="relative flex flex-col items-center justify-center w-16 h-16 group">
          <span class="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-red-500 opacity-75"></span>
          <div class="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-600 to-rose-500 rounded-full shadow-xl border-[3px] border-white z-10 transition-transform duration-300 hover:scale-110">
            ${damSvg}
          </div>
          <div class="absolute -bottom-3 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-slate-700 whitespace-nowrap z-20">Đập chính</div>
        </div>
      `,
      iconSize: [64, 64],
      iconAnchor: [32, 32],
      popupAnchor: [0, -36]
    });

    L.marker([centerLat, centerLng], { icon: mainIcon })
      .addTo(map)
      .bindPopup(`
        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
          <div style="background: linear-gradient(to right, #ef4444, #be123c); padding: 8px; border-radius: 6px 6px 0 0; color: white; margin: -13px -20px 10px -20px;">
             <h3 style="font-weight: 700; margin: 0; font-size: 14px; text-align: center;">HỒ TẢ TRẠCH</h3>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
             <div style="text-align: center; background: #eff6ff; padding: 6px; border-radius: 6px;">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Mực nước</div>
                <div style="font-size: 16px; font-weight: 700; color: #2563eb;">${db.observation.get().waterLevel} m</div>
             </div>
             <div style="text-align: center; background: #f0fdf4; padding: 6px; border-radius: 6px;">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Dung tích</div>
                <div style="font-size: 16px; font-weight: 700; color: #16a34a;">${db.observation.get().capacity}</div>
             </div>
          </div>
          <div style="margin-top: 10px; font-size: 11px; color: #475569; display: flex; align-items: center; gap: 4px;">
            <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block;"></span>
            Trạng thái: <b>Vận hành bình thường</b>
          </div>
        </div>
      `, { className: 'custom-popup-clean' }) // We can add CSS for this class if needed, or rely on inline styles
      .openPopup();

    // 2. Simulated Rainfall Stations (Blue, Stylish Pins)
    const stations = [
      { name: 'Hương Sơn', lat: centerLat + 0.04, lng: centerLng - 0.03, rain: 15.0 },
      { name: 'Thượng Quảng', lat: centerLat - 0.03, lng: centerLng + 0.02, rain: 10.2 },
      { name: 'Đầu mối', lat: centerLat + 0.01, lng: centerLng + 0.01, rain: 5.5 },
    ];

    stations.forEach(st => {
      const stationIcon = L.divIcon({
        className: 'custom-rain-marker',
        html: `
          <div class="relative flex flex-col items-center justify-center w-12 h-12 group transition-transform duration-300 hover:-translate-y-1">
            <div class="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-lg border-[2px] border-white z-10 group-hover:shadow-blue-300/50 group-hover:shadow-xl">
              ${rainSvg}
            </div>
            <div class="absolute -bottom-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap border border-slate-100 pointer-events-none z-20 transform scale-90 group-hover:scale-100">
               ${st.name}
            </div>
            <!-- Pin Triangle -->
            <div class="absolute bottom-2 w-3 h-3 bg-cyan-500 rotate-45 z-0 mb-[1px]"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 40], // Point at bottom
        popupAnchor: [0, -40]
      });

      L.marker([st.lat, st.lng], { icon: stationIcon })
        .addTo(map)
        .bindPopup(`
           <div style="text-align: center; font-family: 'Inter', sans-serif;">
              <h4 style="margin: 0 0 4px 0; color: #0f172a; font-size: 13px;">Trạm ${st.name}</h4>
              <div style="font-size: 12px; color: #334155;">
                 Mưa hiện tại: <b style="color: #0284c7;">${st.rain} mm</b>
              </div>
           </div>
        `);
    });

    // --- CRITICAL FIX: Invalidate Size to ensure map renders fully ---
    // 1. Force resize shortly after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // 2. Observer for container resize (e.g. sidebar toggle)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Layer Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._layers_custom) return;

    if (activeLayer === 'streets') {
      map.removeLayer(map._layers_custom.satellite);
      map.addLayer(map._layers_custom.streets);
    } else {
      map.removeLayer(map._layers_custom.streets);
      map.addLayer(map._layers_custom.satellite);
    }
  }, [activeLayer]);

  return (
    <div ref={wrapperRef} className={`flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in relative ${isFullscreen ? 'h-screen w-screen rounded-none border-0 fixed inset-0 z-[9999]' : 'h-[calc(100vh-8rem)]'}`}>
      
      {/* Top Right Controls Container */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Layer Controls */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-1 flex gap-1">
          <button
            onClick={() => setActiveLayer('streets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeLayer === 'streets' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Bản đồ
          </button>
          <button
            onClick={() => setActiveLayer('satellite')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeLayer === 'satellite' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Vệ tinh
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-white hover:bg-slate-50 text-slate-600 rounded-lg shadow-md border border-slate-200 p-2 self-end transition-colors"
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-4 max-w-xs">
         <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
           <MapPin size={16} className="text-blue-600"/> Chú giải bản đồ
         </h4>
         <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 border-2 border-white shadow-sm flex items-center justify-center">
                 <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-700">Vị trí đập chính</p>
                 <p className="text-[10px] text-slate-500">Trung tâm điều hành</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-white shadow-sm flex items-center justify-center">
                 <div className="w-4 h-[2px] bg-white rounded-full"></div>
              </div>
              <div>
                 <p className="text-xs font-bold text-slate-700">Trạm đo mưa</p>
                 <p className="text-[10px] text-slate-500">Cảm biến tự động</p>
              </div>
            </div>
         </div>
         <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 font-mono">
           GPS: {generalInfo.latitude}, {generalInfo.longitude}
         </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100 relative z-0" />
    </div>
  );
};
