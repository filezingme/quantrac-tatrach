
import React, { useState, useEffect } from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, 
  ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, Tooltip, Scatter, Cell, ReferenceLine 
} from 'recharts';
import { 
  BrainCircuit, Activity, AlertTriangle, CheckCircle, Zap, Search, 
  Terminal, ShieldCheck, Thermometer, Droplets, Maximize2, X, Minimize2
} from 'lucide-react';

// --- MOCK DATA ---

const turbineHealthData = [
  { subject: 'Độ rung trục', A: 92, fullMark: 100 },
  { subject: 'Nhiệt độ ổ đỡ', A: 98, fullMark: 100 },
  { subject: 'Áp suất dầu', A: 86, fullMark: 100 },
  { subject: 'Hiệu suất', A: 95, fullMark: 100 },
  { subject: 'Tiếng ồn', A: 85, fullMark: 100 },
  { subject: 'Cách điện', A: 90, fullMark: 100 },
];

const gateHealthData = [
  { subject: 'Xi lanh thủy lực', A: 95, fullMark: 100 },
  { subject: 'Gioăng chắn nước', A: 75, fullMark: 100 }, // Lower, indicates wear
  { subject: 'Kết cấu thép', A: 98, fullMark: 100 },
  { subject: 'Động cơ bơm', A: 92, fullMark: 100 },
  { subject: 'Cảm biến vị trí', A: 88, fullMark: 100 },
];

// Scatter plot data for Anomaly Detection (Water Level vs Seepage Flow)
// Normal behavior: Higher Level -> Higher Seepage. Anomalies break this trend.
const anomalyData = Array.from({ length: 50 }, (_, i) => {
  const level = 30 + Math.random() * 20; // 30-50m
  const isAnomaly = Math.random() > 0.92;
  const seepage = isAnomaly 
    ? (level * 0.5) + (Math.random() * 10 + 5) // Abnormal high seepage
    : (level * 0.5) + (Math.random() * 2 - 1); // Normal correlation
  
  return { x: parseFloat(level.toFixed(1)), y: parseFloat(seepage.toFixed(1)), isAnomaly, id: i };
});

const logMessages = [
  "Quét cảm biến áp lực thấm P12... OK",
  "Phân tích phổ rung động Tuabin H1... Bình thường",
  "Kiểm tra nhiệt độ máy biến áp T1... 55°C (Ổn định)",
  "Đối chiếu mực nước hồ với lưu lượng thấm... Phát hiện sai lệch nhỏ tại K3+200",
  "Dự báo phụ tải điện 24h tới... Tăng nhẹ vào giờ cao điểm",
  "Kiểm tra camera an ninh khu vực đập tràn... Tín hiệu tốt",
  "Đồng bộ dữ liệu thủy văn từ trạm Thượng Quảng...",
  "Đánh giá rủi ro sạt lở bờ phải... Mức độ thấp",
];

export const AISafetyView: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [fullScreenChart, setFullScreenChart] = useState<'radar' | 'scatter' | null>(null);
  
  // Terminal effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < logMessages.length) {
        // Randomly pick a message to add to top
        const randomMsg = logMessages[Math.floor(Math.random() * logMessages.length)];
        const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        setLogs(prev => [`[${time}] ${randomMsg}`, ...prev.slice(0, 7)]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to render charts (reused for both card and modal)
  const renderChartContent = (type: 'radar' | 'scatter', isFullScreen = false) => {
    if (type === 'radar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius={isFullScreen ? "80%" : "70%"} data={turbineHealthData}>
            <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: isFullScreen ? 14 : 10, fontWeight: 'bold' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Tuabin H1" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
            <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '12px'}} itemStyle={{color: '#fff'}}/>
            <Legend wrapperStyle={{fontSize: isFullScreen ? '14px' : '11px', paddingTop: '10px'}}/>
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis type="number" dataKey="x" name="Mực nước hồ" unit="m" stroke="#94a3b8" label={{ value: 'Mực nước hồ (m)', position: 'bottom', fill: '#94a3b8', fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="Lưu lượng thấm" unit="l/s" stroke="#94a3b8" label={{ value: 'Lưu lượng thấm (l/s)', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip 
               cursor={{ strokeDasharray: '3 3' }} 
               contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
            />
            <Scatter name="Dữ liệu quan trắc" data={anomalyData} fill="#8884d8">
              {anomalyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isAnomaly ? '#ef4444' : '#3b82f6'} />
              ))}
            </Scatter>
            {/* Trend Line Visual */}
            <ReferenceLine segment={[{ x: 30, y: 15 }, { x: 50, y: 25 }]} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={2} label={{ value: 'Đường xu hướng chuẩn', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BrainCircuit className="text-purple-600 dark:text-purple-400" size={28}/> 
            Trung tâm Giám sát An toàn AI
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Hệ thống phân tích dữ liệu và cảnh báo sớm thông minh</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-800 animate-pulse">
           <Activity size={14}/> AI ENGINE ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Predictive Maintenance Radar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Zap size={18} className="text-amber-500"/> Sức khỏe thiết bị
             </h3>
             <button 
                onClick={() => setFullScreenChart('radar')}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Phóng to"
             >
                <Maximize2 size={18}/>
             </button>
           </div>
           
           <div className="flex-1 relative min-h-[300px]">
              <div className="absolute top-0 right-0 z-10 flex flex-col gap-2">
                 <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Tuabin H1: 91/100</div>
                 <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Cửa van: 85/100</div>
              </div>
              {renderChartContent('radar')}
           </div>
           
           <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-start gap-2">
                 <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"/>
                 <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Dự báo bảo trì:</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">Gioăng chắn nước cửa van số 2 có dấu hiệu lão hóa (Score: 75). Khuyến nghị kiểm tra trong 30 ngày tới.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Anomaly Detection Scatter */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Search size={18} className="text-blue-500"/> Phát hiện bất thường (Anomaly Detection)
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex gap-2 text-[10px] font-bold">
                   <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Bình thường</span>
                   <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"><div className="w-2 h-2 rounded-full bg-red-500"></div> Bất thường</span>
                </div>
                <button 
                  onClick={() => setFullScreenChart('scatter')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Phóng to"
                >
                  <Maximize2 size={18}/>
                </button>
              </div>
           </div>

           <div className="flex-1 min-h-[300px]">
              {renderChartContent('scatter')}
           </div>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic text-center">
             Biểu đồ phân tích tương quan giữa Mực nước hồ và Lưu lượng thấm qua thân đập. Các điểm đỏ thể hiện giá trị thấm cao bất thường so với mực nước tương ứng.
           </p>
        </div>

        {/* 3. Real-time Analysis Log (Terminal Style) */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl shadow-lg overflow-hidden border border-slate-700 flex flex-col h-64 md:h-auto">
           <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-2">
                 <Terminal size={16} className="text-green-400"/>
                 <span className="text-xs font-mono font-bold text-green-400">SYSTEM_LOG_MONITOR_V3.1</span>
              </div>
              <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
           </div>
           <div className="flex-1 p-4 font-mono text-xs md:text-sm overflow-y-hidden relative bg-slate-950/50">
              {/* Scan line effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-scan-down pointer-events-none z-10"></div>
              
              <style>{`
                @keyframes scan-down {
                  0% { top: 0%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 100%; opacity: 0; }
                }
                .animate-scan-down {
                  animation: scan-down 3s linear infinite;
                }
              `}</style>

              <div className="flex flex-col-reverse h-full gap-2">
                 {logs.map((log, i) => (
                    <div key={i} className={`flex gap-2 ${i === 0 ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
                       <span className="shrink-0">{`>`}</span>
                       <span>{log}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 4. KPI Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <KPICard title="Chỉ số An toàn đập" value="98.5%" status="good" icon={<ShieldCheck size={18}/>} sub="Theo QC 04-05" />
           <KPICard title="Nhiệt độ Bê tông đập" value="28.4°C" status="normal" icon={<Thermometer size={18}/>} sub="Ổn định" />
           <KPICard title="Tổng lượng thấm" value="12.5 l/s" status="warning" icon={<Droplets size={18}/>} sub="Tăng nhẹ 2%" />
           <KPICard title="Độ tin cậy cảm biến" value="99.2%" status="good" icon={<Activity size={18}/>} sub="342/345 Online" />
        </div>

      </div>

      {/* FULLSCREEN CHART MODAL */}
      {fullScreenChart && (
        <div 
          className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ marginTop: 0 }}
        >
          <div className="bg-white dark:bg-slate-800 w-full h-full max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                 <Maximize2 size={18} className="text-blue-600 dark:text-blue-400"/> 
                 {fullScreenChart === 'radar' ? 'Chi tiết Sức khỏe Thiết bị' : 'Phân tích Dữ liệu Bất thường'}
              </h3>
              <button 
                onClick={() => setFullScreenChart(null)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 p-6 bg-white dark:bg-slate-800 overflow-hidden">
              {renderChartContent(fullScreenChart, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KPICard = ({ title, value, status, icon, sub }: { title: string, value: string, status: 'good' | 'normal' | 'warning', icon: any, sub: string }) => {
  const colors = {
    good: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    normal: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[status]} shadow-sm flex items-center justify-between`}>
       <div>
          <p className="text-xs font-bold opacity-80 uppercase mb-1">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-[10px] opacity-70 mt-1">{sub}</p>
       </div>
       <div className={`p-2 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm`}>
          {icon}
       </div>
    </div>
  );
};
