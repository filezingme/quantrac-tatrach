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

    // --- Markers ---

    // 1. Main Dam Marker
    const mainIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    L.marker([centerLat, centerLng], { icon: mainIcon })
      .addTo(map)
      .bindPopup(`
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; color: #1e40af; margin-bottom: 4px;">Hồ Tả Trạch</h3>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Mực nước: <b>${db.observation.get().waterLevel} m</b></p>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Dung tích: <b>${db.observation.get().capacity} tr.m³</b></p>
          <div style="margin-top: 8px; font-size: 11px; background: #eff6ff; padding: 4px; border-radius: 4px;">
            Trạng thái: <b>Vận hành bình thường</b>
          </div>
        </div>
      `)
      .openPopup();

    // 2. Simulated Rainfall Stations
    const stations = [
      { name: 'Hương Sơn', lat: centerLat + 0.04, lng: centerLng - 0.03 },
      { name: 'Thượng Quảng', lat: centerLat - 0.03, lng: centerLng + 0.02 },
      { name: 'Đầu mối', lat: centerLat + 0.01, lng: centerLng + 0.01 },
    ];

    stations.forEach(st => {
      const stationIcon = L.divIcon({
        className: 'station-icon',
        html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 1px solid white;"></div>`,
        iconSize: [10, 10]
      });
      L.marker([st.lat, st.lng], { icon: stationIcon })
        .addTo(map)
        .bindPopup(`<b>Trạm đo mưa: ${st.name}</b>`);
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
      <div className="absolute bottom-6 left-6 z-[400] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-4 max-w-xs">
         <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
           <MapPin size={16} className="text-blue-600"/> Chú giải
         </h4>
         <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm block"></span>
              <span className="text-xs text-slate-600">Vị trí đập chính / Hồ chứa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm block"></span>
              <span className="text-xs text-slate-600">Trạm đo mưa / Thủy văn</span>
            </div>
         </div>
         <div className="mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
           Tọa độ tâm: {generalInfo.latitude}, {generalInfo.longitude}
         </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100 relative z-0" />
    </div>
  );
};