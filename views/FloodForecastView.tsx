import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Play, Settings, Plus, Trash2, Save, Edit, 
  Droplets, Clock, ArrowDownToLine, AlertTriangle, 
  BarChart2, MoreVertical, RefreshCw, ArrowLeft,
  Activity, Power, Sliders, AlertOctagon, Gauge
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { db } from '../utils/db';
import { FloodScenario, SimulationStep } from '../types';

export const FloodForecastView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'scenario'>('scenario');
  const [scenarios, setScenarios] = useState<FloodScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  
  // Edit/Create Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FloodScenario>>({});

  // Simulation State
  const [isRunning, setIsRunning] = useState(false);

  // Realtime Operation State
  const [realtimeData, setRealtimeData] = useState({
    waterLevel: 45.2,
    inflow: 120,
    outflow: 80,
    gate1Open: 15, // %
    gate2Open: 15, // %
    turbinePower: 21, // MW
    status: 'NORMAL'
  });
  const [realtimeHistory, setRealtimeHistory] = useState<any[]>([]);

  // Load scenarios on mount
  useEffect(() => {
    const list = db.scenarios.get();
    setScenarios(list);
    // On Tablet/Desktop, select first item if available.
    if (window.innerWidth >= 768 && list.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(list[0].id);
    }
  }, []);

  // Real-time Simulation Effect
  useEffect(() => {
    if (activeTab !== 'realtime') return;

    const interval = setInterval(() => {
      setRealtimeData(prev => {
        // Simulate small fluctuations
        const inflowFluctuation = (Math.random() - 0.5) * 5;
        const newInflow = Math.max(0, prev.inflow + inflowFluctuation);
        
        // Outflow depends on gates (Simplified physics: Q ~ Open% * C)
        const newOutflow = (prev.gate1Open * 5) + (prev.gate2Open * 5) + 30; // 30 is base flow/turbine

        // Level change dH = (Qin - Qout) * dt / Area
        const dH = (newInflow - newOutflow) * 0.0001; 
        const newLevel = Math.max(20, Math.min(60, prev.waterLevel + dH));

        return {
          ...prev,
          waterLevel: parseFloat(newLevel.toFixed(2)),
          inflow: parseFloat(newInflow.toFixed(1)),
          outflow: parseFloat(newOutflow.toFixed(1))
        };
      });

      setRealtimeHistory(prev => {
        const now = new Date();
        const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newPoint = { 
          time: timeLabel, 
          wl: realtimeData.waterLevel, 
          in: realtimeData.inflow, 
          out: realtimeData.outflow 
        };
        const newHistory = [...prev, newPoint];
        if (newHistory.length > 20) newHistory.shift(); // Keep last 20 points
        return newHistory;
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab, realtimeData]);

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  // --- Handlers ---

  const handleCreateNew = () => {
    // Robust unique ID generation
    const newId = `sc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    const newScenario: FloodScenario = {
      id: newId,
      name: 'Kịch bản mới',
      description: 'Mô tả kịch bản...',
      createdDate: new Date().toISOString(),
      inputs: {
        rainfallTotal: 200,
        rainDuration: 12,
        initialWaterLevel: 35.0,
        soilMoisture: 'normal',
        baseInflow: 20
      }
    };
    setEditForm(newScenario);
    setIsEditing(true);
    // We set selectedScenarioId, but note that it won't appear in the list until saved
    setSelectedScenarioId(newId); 
  };

  const handleEdit = (scenario: FloodScenario) => {
    setEditForm({ ...scenario });
    setIsEditing(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    // Critical: Stop propagation to prevent selecting the row we are about to delete
    e.preventDefault();
    e.stopPropagation();
    
    if(window.confirm('Bạn chắc chắn muốn xóa kịch bản này?')) {
      // 1. Delete from DB
      db.scenarios.delete(id);
      
      // 2. Immediately read back from DB to update state
      const updatedList = db.scenarios.get();
      setScenarios(updatedList);
      
      // 3. Handle selection state cleanup
      if (selectedScenarioId === id || (isEditing && editForm.id === id)) {
        setSelectedScenarioId(null);
        setIsEditing(false);
        setEditForm({});
      }
    }
  };

  const handleSaveForm = () => {
    if (!editForm.name) return alert('Vui lòng nhập tên kịch bản');
    if (!editForm.id) return alert('Lỗi: Thiếu ID kịch bản');

    // 1. Check if it's an update or create
    const currentList = db.scenarios.get();
    const isUpdate = currentList.some(s => s.id === editForm.id);
    
    if (isUpdate) {
      db.scenarios.update(editForm as FloodScenario);
    } else {
      db.scenarios.add(editForm as FloodScenario);
    }
    
    // 2. Refresh list from DB
    const refreshedList = db.scenarios.get();
    setScenarios(refreshedList);
    
    // 3. Reset view mode
    setIsEditing(false);
    setSelectedScenarioId(editForm.id);
  };

  const handleRunSimulation = () => {
    if (!selectedScenario) return;
    setIsRunning(true);

    // SIMULATION ENGINE LOGIC
    setTimeout(() => {
      const { inputs } = selectedScenario;
      const duration = inputs.rainDuration; // hours
      const totalRain = inputs.rainfallTotal; // mm
      const runoffCoef = inputs.soilMoisture === 'dry' ? 0.4 : inputs.soilMoisture === 'wet' ? 0.8 : 0.6;
      
      const timeSeries: SimulationStep[] = [];
      let currentLevel = inputs.initialWaterLevel;
      let maxQ = 0;
      let maxZ = 0;
      
      for (let t = 1; t <= 48; t++) {
        let rainIntensity = 0;
        if (t <= duration) {
           const peakTime = Math.ceil(duration / 2);
           if (t <= peakTime) {
             rainIntensity = (t / peakTime) * (2 * totalRain / duration);
           } else {
             rainIntensity = ((duration - t) / (duration - peakTime)) * (2 * totalRain / duration);
           }
        }
        
        const qRain = rainIntensity * runoffCoef * 15; 
        const prevQ = timeSeries[t-2]?.inflow || inputs.baseInflow;
        const inflow = (prevQ * 0.7) + (qRain * 0.3) + inputs.baseInflow;

        let outflow = 0;
        if (currentLevel > 45) {
          outflow = 20 * Math.pow(currentLevel - 45, 1.5); 
        } else {
           outflow = 10; 
        }
        
        const dV = (inflow - outflow) * 3600; 
        const dZ = dV / (20 * 1000000); 
        
        currentLevel += dZ;

        timeSeries.push({
          hour: t,
          rainfall: parseFloat(rainIntensity.toFixed(1)),
          inflow: parseFloat(inflow.toFixed(1)),
          outflow: parseFloat(outflow.toFixed(1)),
          waterLevel: parseFloat(currentLevel.toFixed(2))
        });

        if (inflow > maxQ) maxQ = inflow;
        if (currentLevel > maxZ) maxZ = currentLevel;
      }

      let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (maxZ > 45) risk = 'medium';
      if (maxZ > 48) risk = 'high';
      if (maxZ > 50) risk = 'critical';

      const updatedScenario: FloodScenario = {
        ...selectedScenario,
        lastRun: new Date().toISOString(),
        results: {
          maxInflow: parseFloat(maxQ.toFixed(1)),
          maxLevel: parseFloat(maxZ.toFixed(2)),
          peakTime: timeSeries.findIndex(s => s.inflow === parseFloat(maxQ.toFixed(1))) + 1,
          riskLevel: risk,
          timeSeries
        }
      };

      db.scenarios.update(updatedScenario);
      setScenarios(db.scenarios.get());
      setIsRunning(false);
    }, 1500); 
  };

  const riskColor = (risk?: string) => {
    switch(risk) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900';
      default: return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900';
    }
  };

  const isNewScenario = !scenarios.find(s => s.id === editForm.id);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in pb-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Dự báo lũ & Điều hành</h2>
        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm self-start md:self-auto">
           <button onClick={() => setActiveTab('scenario')} className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'scenario' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Mô phỏng Kịch bản</button>
           <button onClick={() => setActiveTab('realtime')} className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'realtime' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Vận hành Thời gian thực</button>
        </div>
      </div>

      {activeTab === 'realtime' ? (
         <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            {/* Realtime Dashboard Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
               <div className="flex items-center gap-3">
                 <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                 </div>
                 <h3 className="font-bold text-slate-800 dark:text-white tracking-wide">SCADA MONITORING SYSTEM</h3>
               </div>
               <div className="text-xs font-mono text-slate-500 dark:text-slate-400">UPDATE: LIVE</div>
            </div>

            {/* TABLET OPTIMIZED LAYOUT: 2 ROWS (Top: Indicators/Control, Bottom: Chart) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BLOCK 1: Left - Water Level & Flow (Top Row on Tablet/Desktop) */}
              <div className="space-y-6">
                 {/* Main Level Gauge */}
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Mực nước thượng lưu</h4>
                    <div className="flex items-end gap-2">
                       <span className="text-5xl font-mono font-bold text-blue-600 dark:text-blue-400">{realtimeData.waterLevel.toFixed(2)}</span>
                       <span className="text-lg text-slate-600 dark:text-slate-300 mb-1">m</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                       <div className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-1000" style={{width: `${(realtimeData.waterLevel / 60) * 100}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                       <span>0m</span>
                       <span>MNDBT: 45m</span>
                       <span>60m</span>
                    </div>
                 </div>

                 {/* Flow Gauges */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <ArrowDownToLine size={16} className="text-green-600 dark:text-green-400"/>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Lưu lượng đến</span>
                       </div>
                       <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{realtimeData.inflow} <span className="text-sm text-slate-400">m³/s</span></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                          <Activity size={16} className="text-amber-500"/>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Tổng xả</span>
                       </div>
                       <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{realtimeData.outflow} <span className="text-sm text-slate-400">m³/s</span></div>
                    </div>
                 </div>
              </div>

              {/* BLOCK 2: Right - Controls & Power (Top Row on Tablet/Desktop) */}
              <div className="space-y-6">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
                    <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                      <Sliders size={16}/> Điều khiển Cửa van
                    </h4>
                    
                    {/* Gate 1 */}
                    <div className="mb-4">
                       <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Van số 1</span>
                          <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{realtimeData.gate1Open}%</span>
                       </div>
                       <input 
                         type="range" 
                         min="0" max="100" 
                         value={realtimeData.gate1Open}
                         onChange={(e) => setRealtimeData({...realtimeData, gate1Open: parseInt(e.target.value)})}
                         className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                       />
                    </div>

                    {/* Gate 2 */}
                    <div className="mb-4">
                       <div className="flex justify-between mb-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Van số 2</span>
                          <span className="text-sm font-mono text-blue-600 dark:text-blue-400">{realtimeData.gate2Open}%</span>
                       </div>
                       <input 
                         type="range" 
                         min="0" max="100" 
                         value={realtimeData.gate2Open}
                         onChange={(e) => setRealtimeData({...realtimeData, gate2Open: parseInt(e.target.value)})}
                         className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                       />
                    </div>
                    
                    {/* Power Info Compact */}
                     <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-100 dark:border-slate-600 mt-auto">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Zap size={14} className="text-yellow-500"/>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Phát điện</span>
                           </div>
                           <span className="text-sm font-mono font-bold text-slate-800 dark:text-white">{realtimeData.turbinePower} MW</span>
                        </div>
                     </div>
                 </div>
              </div>

              {/* BLOCK 3: Chart - Full Width (Bottom Row) */}
              <div className="md:col-span-2 flex flex-col">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex-1 min-h-[300px]">
                    <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-4 flex items-center gap-2">
                      <Activity size={16}/> Biểu đồ diễn biến thời gian thực
                    </h4>
                    <ResponsiveContainer width="100%" height="90%">
                       <AreaChart data={realtimeHistory}>
                          <defs>
                             <linearGradient id="colorWl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" strokeOpacity={0.5}/>
                          <XAxis dataKey="time" hide/>
                          <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#64748b'}} stroke="#94a3b8"/>
                          <Tooltip 
                             contentStyle={{backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                             itemStyle={{color: '#334155'}}
                          />
                          <Area type="monotone" dataKey="wl" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWl)" strokeWidth={2} isAnimationActive={false}/>
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

            </div>
         </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-hidden relative">
          
          {/* LEFT: Scenario List - Persistent on Tablet/Desktop */}
          <div className={`
             w-full md:w-64 lg:w-80 min-w-[250px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col 
             ${selectedScenarioId && !isEditing ? 'hidden md:flex' : 'flex'} 
             ${isEditing ? 'hidden md:flex' : ''}
          `}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Kịch bản</h3>
              <button onClick={handleCreateNew} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" title="Thêm mới"><Plus size={16}/></button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
              {scenarios.map(sc => (
                <div 
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setIsEditing(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all group relative ${
                    selectedScenarioId === sc.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-semibold text-sm line-clamp-1 ${selectedScenarioId === sc.id ? 'text-blue-800 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>{sc.name}</span>
                    <button 
                      onClick={(e) => handleDelete(sc.id, e)} 
                      className="relative z-20 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-all"
                      title="Xóa kịch bản"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">{sc.description}</p>
                  
                  {/* Mini Badges */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                       <Droplets size={10}/> {sc.inputs.rainfallTotal}mm
                    </span>
                    {sc.results && (
                       <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border font-medium ${riskColor(sc.results.riskLevel)}`}>
                         <AlertTriangle size={10}/> {sc.results.riskLevel.toUpperCase()}
                       </span>
                    )}
                  </div>
                </div>
              ))}
              {scenarios.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm italic">Chưa có kịch bản nào</div>
              )}
            </div>
          </div>

          {/* RIGHT: Detail / Edit View */}
          <div className={`
             flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col
             ${selectedScenarioId || isEditing ? 'flex' : 'hidden md:flex'}
          `}>
            {isEditing ? (
              // EDIT FORM with Fixed Header/Footer and Scrollable Body
              <div className="flex flex-col h-full">
                 {/* Fixed Header */}
                 <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex-none">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <Edit size={18} className="text-blue-600 dark:text-blue-400"/> 
                      {isNewScenario ? 'Tạo kịch bản mới' : 'Chỉnh sửa kịch bản'}
                    </h3>
                 </div>
                 
                 {/* Scrollable Content */}
                 <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên kịch bản</label>
                        <input value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg focus:ring-2 ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"/>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mô tả chi tiết</label>
                        <textarea rows={2} value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg focus:ring-2 ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"/>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 border-b dark:border-slate-700 pb-2">Thông số đầu vào</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tổng lượng mưa (mm)</label>
                         <input type="number" value={editForm.inputs?.rainfallTotal} onChange={e => setEditForm({...editForm, inputs: {...editForm.inputs!, rainfallTotal: Number(e.target.value)}})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"/>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Thời gian mưa (giờ)</label>
                         <input type="number" value={editForm.inputs?.rainDuration} onChange={e => setEditForm({...editForm, inputs: {...editForm.inputs!, rainDuration: Number(e.target.value)}})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"/>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Mực nước hồ ban đầu (m)</label>
                         <input type="number" value={editForm.inputs?.initialWaterLevel} onChange={e => setEditForm({...editForm, inputs: {...editForm.inputs!, initialWaterLevel: Number(e.target.value)}})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"/>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Lưu lượng cơ bản (m³/s)</label>
                         <input type="number" value={editForm.inputs?.baseInflow} onChange={e => setEditForm({...editForm, inputs: {...editForm.inputs!, baseInflow: Number(e.target.value)}})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"/>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Độ ẩm đất (AMC)</label>
                         <select value={editForm.inputs?.soilMoisture} onChange={e => setEditForm({...editForm, inputs: {...editForm.inputs!, soilMoisture: e.target.value as any}})} className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                           <option value="dry">Khô (Dry)</option>
                           <option value="normal">Trung bình (Normal)</option>
                           <option value="wet">Bão hòa (Wet)</option>
                         </select>
                       </div>
                    </div>
                 </div>

                 {/* Fixed Footer */}
                 <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 flex-none">
                   <button onClick={() => { setIsEditing(false); if(isNewScenario) setSelectedScenarioId(null); }} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Hủy bỏ</button>
                   <button onClick={handleSaveForm} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-200 dark:shadow-blue-900/50"><Save size={16}/> Lưu kịch bản</button>
                 </div>
              </div>
            ) : selectedScenario ? (
              // DETAIL VIEW & SIMULATION DASHBOARD
              <div className="flex-1 flex flex-col h-full">
                {/* Header Actions */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-start">
                   <div className="flex gap-3 items-center">
                     <button onClick={() => setSelectedScenarioId(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <ArrowLeft size={20}/>
                     </button>
                     <div>
                       <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 flex-wrap">
                         {selectedScenario.name}
                         {selectedScenario.results && (
                           <span className={`text-xs px-2 py-1 rounded-full border ${riskColor(selectedScenario.results.riskLevel)}`}>
                             {selectedScenario.results.riskLevel.toUpperCase()}
                           </span>
                         )}
                       </h2>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedScenario.description}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={handleRunSimulation} 
                       disabled={isRunning}
                       className={`px-3 md:px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-all ${isRunning ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 dark:shadow-none'}`}
                     >
                       {isRunning ? <RefreshCw size={16} className="animate-spin"/> : <Play size={16} fill="currentColor"/>}
                       <span className="hidden md:inline">{isRunning ? 'Đang chạy...' : 'Chạy mô phỏng'}</span>
                     </button>
                     <button onClick={() => handleEdit(selectedScenario)} className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                       <Edit size={18}/>
                     </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30">
                  {/* Input Summary Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <SummaryCard icon={<Droplets size={18}/>} label="Tổng lượng mưa" value={`${selectedScenario.inputs.rainfallTotal} mm`} />
                     <SummaryCard icon={<Clock size={18}/>} label="Thời gian mưa" value={`${selectedScenario.inputs.rainDuration} giờ`} />
                     <SummaryCard icon={<ArrowDownToLine size={18}/>} label="MN ban đầu" value={`${selectedScenario.inputs.initialWaterLevel} m`} />
                     <SummaryCard icon={<Zap size={18}/>} label="Độ ẩm đất" value={selectedScenario.inputs.soilMoisture === 'wet' ? 'Bão hòa' : selectedScenario.inputs.soilMoisture === 'dry' ? 'Khô' : 'Trung bình'} />
                  </div>

                  {/* Results Section */}
                  {selectedScenario.results ? (
                    <>
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Đỉnh lũ (Qmax)</p>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-500">{selectedScenario.results.maxInflow} <span className="text-sm text-slate-400">m³/s</span></p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Mực nước Max (Zmax)</p>
                          <p className={`text-2xl font-bold ${selectedScenario.results.maxLevel > 45 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {selectedScenario.results.maxLevel} <span className="text-sm text-slate-400">m</span>
                          </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Thời gian đạt đỉnh</p>
                          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">T + {selectedScenario.results.peakTime} <span className="text-sm text-slate-400">giờ</span></p>
                        </div>
                      </div>

                      {/* Charts */}
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
                        <h4 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                          <BarChart2 size={18} className="text-blue-500"/> Diễn biến quá trình lũ & Mực nước hồ
                        </h4>
                        <ResponsiveContainer width="100%" height="90%">
                          <ComposedChart data={selectedScenario.results.timeSeries}>
                            <CartesianGrid strokeDasharray="3 3" vertical={true} strokeOpacity={0.5} stroke="#e2e8f0" />
                            <XAxis dataKey="hour" label={{value: 'Thời gian (giờ)', position: 'insideBottom', offset: -5, fill: '#94a3b8'}} tick={{fill: '#94a3b8'}} />
                            <YAxis yAxisId="left" orientation="left" label={{value: 'Lưu lượng (m³/s)', angle: -90, position: 'insideLeft', fill: '#94a3b8'}} tick={{fill: '#94a3b8'}} />
                            <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} label={{value: 'Mực nước (m)', angle: 90, position: 'insideRight', fill: '#94a3b8'}} tick={{fill: '#94a3b8'}} />
                            <Tooltip 
                              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg, #fff)'}}
                              labelFormatter={(label) => `Giờ thứ ${label}`}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="rainfall" name="Mưa (mm)" fill="#93c5fd" barSize={10} />
                            <Area yAxisId="left" type="monotone" dataKey="inflow" name="Q đến (m³/s)" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                            <Line yAxisId="right" type="monotone" dataKey="waterLevel" name="Mực nước (m)" stroke="#2563eb" strokeWidth={3} dot={false} />
                            
                            {/* Alert Lines */}
                            <Line yAxisId="right" type="monotone" dataKey={() => 45} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} name="MN Dâng BT (+45.0)"/>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 min-h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <Zap size={48} className="mb-4 opacity-50"/>
                      <p>Chưa có kết quả mô phỏng.</p>
                      <button onClick={handleRunSimulation} className="mt-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Chạy mô phỏng ngay</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <p>Chọn một kịch bản hoặc tạo mới để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const SummaryCard = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
    <div className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md">{icon}</div>
    <div>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);