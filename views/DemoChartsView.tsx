import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart, Line, Legend, ComposedChart, Scatter, ScatterChart, ZAxis,
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar, Treemap, Brush, ReferenceLine, Sankey, LabelList
} from 'recharts';
import { 
  PieChart as PieChartIcon, BarChart2, Activity, Droplets, 
  Wind, Thermometer, Zap, Layers, ZoomIn, GitMerge, TrendingUp,
  Maximize2, X, Share2, CircleDot
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444', '#3b82f6'];

// --- DATA SETS ---

// 1. Hydrograph (Mixed)
const complexHydroData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}h`,
  rain: Math.random() * 20 > 15 ? Math.random() * 50 : 0, 
  inflow: 50 + Math.sin(i / 4) * 100 + Math.random() * 20,
  outflow: 40 + Math.sin((i - 2) / 4) * 80, 
  level: 35 + i * 0.1 + Math.sin(i / 6) * 0.5,
  spillway: i > 12 ? (i - 12) * 10 : 0
}));

// 2. Sensor Multi-line
const sensorData = Array.from({ length: 20 }, (_, i) => ({
  time: `T${i}`,
  sensorA: 20 + Math.random() * 5,
  sensorB: 22 + Math.random() * 6,
  sensorC: 19 + Math.random() * 4,
  sensorD: 25 + Math.random() * 8,
}));

// 3. Long term (Zoom)
const longTermData = Array.from({ length: 100 }, (_, i) => ({
  date: `Day ${i + 1}`,
  value: 500 + Math.random() * 200 - 100 + Math.sin(i / 10) * 100,
  ma: 500 + Math.sin(i / 10) * 100 
}));

// 4. Monthly Flow
const monthlyFlowData = [
  { month: 'T1', qIn: 120, qOut: 100, evaporation: 10 },
  { month: 'T2', qIn: 150, qOut: 130, evaporation: 12 },
  { month: 'T3', qIn: 180, qOut: 160, evaporation: 15 },
  { month: 'T4', qIn: 200, qOut: 210, evaporation: 20 },
  { month: 'T5', qIn: 250, qOut: 240, evaporation: 25 },
  { month: 'T6', qIn: 300, qOut: 280, evaporation: 30 },
];

// 5. Deviation
const deviationData = [
  { name: 'T2', uv: 400 },
  { name: 'T3', uv: -300 },
  { name: 'T4', uv: -200 },
  { name: 'T5', uv: 278 },
  { name: 'T6', uv: 189 },
  { name: 'T7', uv: 239 },
  { name: 'T8', uv: -349 },
];

// 6. Treemap - Updated to hierarchical structure for Recharts
const treeMapData = [
  {
    name: 'Dung tích hồ',
    children: [
      { name: 'Dung tích hữu ích', size: 509, fill: '#3b82f6' },
      { name: 'Dung tích chết', size: 80, fill: '#64748b' },
      { name: 'Dung tích phòng lũ', size: 120, fill: '#f59e0b' },
      { name: 'Dung tích bồi lắng', size: 20, fill: '#94a3b8' },
    ]
  }
];

// 7. Sankey Data (Water Balance)
const sankeyData = {
  nodes: [
    { name: 'Tổng lượng về' }, // 0
    { name: 'Mưa trực tiếp' }, // 1
    { name: 'Hồ chứa' },      // 2
    { name: 'Phát điện' },    // 3
    { name: 'Xả tràn' },      // 4
    { name: 'Cống tưới' },    // 5
    { name: 'Bốc hơi' },      // 6
    { name: 'Thấm' }          // 7
  ],
  links: [
    { source: 0, target: 2, value: 500 },
    { source: 1, target: 2, value: 50 },
    { source: 2, target: 3, value: 300 },
    { source: 2, target: 4, value: 100 },
    { source: 2, target: 5, value: 80 },
    { source: 2, target: 6, value: 50 },
    { source: 2, target: 7, value: 20 }
  ]
};

// 8. Bubble Data (Rainfall Events Analysis)
const bubbleData = [
  { hour: 1, intensity: 10, volume: 100, name: 'Trận 1' },
  { hour: 2, intensity: 30, volume: 500, name: 'Trận 2' },
  { hour: 5, intensity: 50, volume: 1200, name: 'Trận 3 (Lớn)' },
  { hour: 10, intensity: 20, volume: 300, name: 'Trận 4' },
  { hour: 12, intensity: 45, volume: 900, name: 'Trận 5' },
  { hour: 18, intensity: 15, volume: 200, name: 'Trận 6' },
];

// 9. Percent Area Data
const percentData = [
  { month: '2015', a: 4000, b: 2400, c: 2400 },
  { month: '2016', a: 3000, b: 1398, c: 2210 },
  { month: '2017', a: 2000, b: 9800, c: 2290 },
  { month: '2018', a: 2780, b: 3908, c: 2000 },
  { month: '2019', a: 1890, b: 4800, c: 2181 },
];

// 10. Radar Data
const radarData = [
  { subject: 'pH', A: 120, B: 110, fullMark: 150 },
  { subject: 'DO', A: 98, B: 130, fullMark: 150 },
  { subject: 'BOD5', A: 86, B: 130, fullMark: 150 },
  { subject: 'COD', A: 99, B: 100, fullMark: 150 },
  { subject: 'TSS', A: 85, B: 90, fullMark: 150 },
  { subject: 'NH4+', A: 65, B: 85, fullMark: 150 },
];

// 11. Radial Data
const radialData = [
  { name: 'Tổ máy 1', uv: 90, fill: '#10b981' },
  { name: 'Tổ máy 2', uv: 45, fill: '#f59e0b' },
  { name: 'Tự dùng', uv: 15, fill: '#64748b' },
];

// --- COMPONENTS ---

// Safer Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg text-xs z-50">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ color: entry.color || entry.fill }} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
            <span>{entry.name}: <b>{Number(entry.value).toFixed(1)}</b> {entry.unit}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, payload, colors, name, value } = props;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: payload?.fill || colors[index % colors.length] || '#8884d8',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          dominantBaseline="middle"
        >
          {name} ({value})
        </text>
      ) : null}
    </g>
  );
};

export const DemoChartsView: React.FC = () => {
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);

  // Function to render chart based on ID (used for both Card and Modal)
  const renderChartContent = (id: string, isFullScreen: boolean = false) => {
    // Determine dimensions based on context
    const height = isFullScreen ? '100%' : '100%'; 

    switch (id) {
      case 'hydro':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={complexHydroData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <defs>
                 <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                 </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="time" scale="point" padding={{ left: 10, right: 10 }} stroke="#94a3b8" />
              <YAxis yAxisId="flow" label={{ value: 'Q (m³/s)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} stroke="#94a3b8"/>
              <YAxis yAxisId="level" orientation="right" domain={['auto', 'auto']} label={{ value: 'Z (m)', angle: 90, position: 'insideRight', fill: '#94a3b8' }} stroke="#94a3b8"/>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="flow" dataKey="rain" name="Mưa (mm)" fill="#93c5fd" barSize={10} />
              <Area yAxisId="flow" type="monotone" dataKey="inflow" name="Q đến" fill="url(#colorIn)" stroke="#3b82f6" fillOpacity={0.1} />
              <Line yAxisId="flow" type="monotone" dataKey="outflow" name="Q xả" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line yAxisId="level" type="monotone" dataKey="level" name="Mực nước" stroke="#10b981" strokeWidth={3} dot={true} />
              <Area yAxisId="flow" type="step" dataKey="spillway" name="Q tràn" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      case 'zoom':
        return (
           <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={longTermData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} stroke="#94a3b8"/>
                <XAxis dataKey="date" hide />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8"/>
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} name="Giá trị thực" />
                <Line type="monotone" dataKey="ma" stroke="#ff7300" strokeWidth={2} dot={false} name="Trung bình trượt" />
                <Brush dataKey="date" height={30} stroke="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
        );

      case 'multi-sensor':
        return (
          <ResponsiveContainer width="100%" height={height}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8"/>
                <XAxis dataKey="time" stroke="#94a3b8"/>
                <YAxis stroke="#94a3b8"/>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: '10px'}}/>
                <Line type="monotone" dataKey="sensorA" stroke="#8884d8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sensorB" stroke="#82ca9d" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sensorC" stroke="#ffc658" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sensorD" stroke="#ff7300" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
        );

      case 'water-balance': // New Sankey
        return (
          <ResponsiveContainer width="100%" height={height}>
             <Sankey
              data={sankeyData}
              node={{ stroke: '#777', strokeWidth: 0 }}
              nodePadding={50}
              margin={{left: 20, right: 20, top: 20, bottom: 20}}
              link={{ stroke: '#3b82f6', fill: 'none' }}
            >
              <Tooltip />
            </Sankey>
          </ResponsiveContainer>
        );

      case 'bubble-rain': // New Bubble
         return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeOpacity={0.2} stroke="#94a3b8"/>
              <XAxis type="number" dataKey="hour" name="Thời gian (h)" unit="h" stroke="#94a3b8"/>
              <YAxis type="number" dataKey="intensity" name="Cường độ (mm/h)" unit="mm/h" stroke="#94a3b8"/>
              <ZAxis type="number" dataKey="volume" range={[60, 400]} name="Tổng lượng" unit="mm" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Legend />
              <Scatter name="Sự kiện mưa" data={bubbleData} fill="#8884d8" shape="circle">
                  {bubbleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList dataKey="name" position="top" style={{ fill: '#94a3b8' }}/>
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
         );
      
      case 'percent-area': // New Percent Area
         const toPercent = (decimal: number, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`;
         const getPercent = (value: number, total: number) => {
            const ratio = total > 0 ? value / total : 0;
            return toPercent(ratio, 2);
         };
         const renderTooltipContent = (o: any) => {
            const { payload, label } = o;
            const total = payload.reduce((result: any, entry: any) => result + entry.value, 0);
            return (
              <div className="bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 shadow-lg rounded text-xs text-slate-800 dark:text-slate-200">
                <p className="font-bold mb-1">{label}</p>
                {payload.map((entry: any, index: any) => (
                  <div key={`item-${index}`} style={{ color: entry.color }}>
                    {entry.name}: {entry.value} ({getPercent(entry.value, total)})
                  </div>
                ))}
              </div>
            );
         };
         return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={percentData} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8"/>
              <XAxis dataKey="month" stroke="#94a3b8"/>
              <YAxis tickFormatter={(t) => toPercent(t, 0)} stroke="#94a3b8"/>
              <Tooltip content={renderTooltipContent} />
              <Legend />
              <Area type="monotone" dataKey="a" name="Phát điện" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="b" name="Xả tràn" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              <Area type="monotone" dataKey="c" name="Cống tưới" stackId="1" stroke="#ffc658" fill="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
         );
      
      case 'synchronized': // New Sync Charts
         return (
           <div className="flex flex-col h-full gap-4">
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complexHydroData} syncId="anyId">
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8"/>
                    <XAxis dataKey="time" stroke="#94a3b8"/>
                    <YAxis label={{ value: 'Mưa (mm)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} stroke="#94a3b8"/>
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="rain" stroke="#8884d8" fill="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
             </div>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={complexHydroData} syncId="anyId">
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8"/>
                    <XAxis dataKey="time" stroke="#94a3b8"/>
                    <YAxis label={{ value: 'Mực nước (m)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} domain={['auto', 'auto']} stroke="#94a3b8"/>
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="level" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
         );

      case 'monthly-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
              <BarChart data={monthlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} stroke="#94a3b8"/>
                <XAxis dataKey="month" stroke="#94a3b8"/>
                <YAxis stroke="#94a3b8"/>
                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="qIn" fill="#3b82f6" name="Q đến" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qOut" fill="#ef4444" name="Q xả" radius={[4, 4, 0, 0]} />
                <Bar dataKey="evaporation" fill="#fbbf24" name="Bốc hơi" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        );

      case 'positive-negative':
        return (
           <ResponsiveContainer width="100%" height={height}>
              <BarChart data={deviationData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8"/>
                <XAxis dataKey="name" stroke="#94a3b8"/>
                <YAxis stroke="#94a3b8"/>
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <Bar dataKey="uv" fill="#8884d8">
                  {deviationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.uv > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        );

      case 'treemap':
        return (
           <ResponsiveContainer width="100%" height={height}>
               <Treemap
                 data={treeMapData}
                 dataKey="size"
                 aspectRatio={4 / 3}
                 stroke="#fff"
                 content={<CustomizedContent colors={COLORS} />}
               />
            </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#94a3b8"/>
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8' }}/>
                <PolarRadiusAxis angle={30} domain={[0, 150]}/>
                <Radar name="Thượng lưu" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Hạ lưu" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
        );

      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={height}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={15} data={radialData}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  dataKey="uv"
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{top: '50%', right: 0, transform: 'translate(0, -50%)'}} />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
        );

      default:
        return <div>No Chart</div>;
    }
  };

  // Wrapper Card Component
  const ChartCard = ({ id, title, icon, colSpan = "col-span-1" }: { id: string, title: string, icon: React.ReactNode, colSpan?: string }) => (
    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col ${colSpan}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
           {icon} {title}
        </h3>
        <button 
          onClick={() => setFullScreenChart(id)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          title="Phóng to toàn màn hình"
        >
          <Maximize2 size={18} />
        </button>
      </div>
      <div className="flex-1 min-h-[300px]">
        {renderChartContent(id)}
      </div>
    </div>
  );

  return (
    <div className="pb-20 animate-fade-in relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thư viện Biểu đồ Nâng cao</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Tập hợp các loại biểu đồ phức tạp phục vụ phân tích dữ liệu chuyên sâu.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* 1. Combo Hydrograph (Large) */}
        <ChartCard 
          id="hydro" 
          title="Diễn biến Lũ & Điều tiết (Combo)" 
          icon={<Activity className="text-blue-600"/>} 
          colSpan="col-span-1 md:col-span-2 xl:col-span-3"
        />

        {/* 2. Synchronized Charts (New) */}
        <ChartCard 
          id="synchronized" 
          title="Đồng bộ Mưa & Mực nước" 
          icon={<GitMerge className="text-teal-600"/>} 
          colSpan="col-span-1 md:col-span-2"
        />

        {/* 3. Water Balance Sankey (New) */}
        <ChartCard 
          id="water-balance" 
          title="Cân bằng nước (Sankey)" 
          icon={<Share2 className="text-indigo-600"/>} 
        />

        {/* 4. Brush & Zoom */}
        <ChartCard 
          id="zoom" 
          title="Lịch sử Dữ liệu (Zoom & Pan)" 
          icon={<ZoomIn className="text-indigo-600"/>} 
        />

        {/* 5. Percent Area (New) */}
        <ChartCard 
          id="percent-area" 
          title="Tỷ trọng Xả (Percent Area)" 
          icon={<Layers className="text-pink-600"/>} 
        />

        {/* 6. Bubble Chart (New) */}
        <ChartCard 
          id="bubble-rain" 
          title="Phân tích sự kiện Mưa (Bubble)" 
          icon={<CircleDot className="text-orange-500"/>} 
        />

        {/* 7. Multi-sensor Line */}
        <ChartCard 
          id="multi-sensor" 
          title="So sánh Đa cảm biến" 
          icon={<GitMerge className="text-green-600"/>} 
        />

        {/* 8. Grouped Bar */}
        <ChartCard 
          id="monthly-bar" 
          title="Cân bằng nước hàng tháng" 
          icon={<BarChart2 className="text-slate-600 dark:text-slate-400"/>} 
        />

        {/* 9. Positive/Negative */}
        <ChartCard 
          id="positive-negative" 
          title="Biến động so với TBNN" 
          icon={<TrendingUp className="text-purple-600"/>} 
        />

        {/* 10. Treemap */}
        <ChartCard 
          id="treemap" 
          title="Phân bổ dung tích hồ" 
          icon={<Layers className="text-cyan-600"/>} 
        />

        {/* 11. Radar */}
        <ChartCard 
          id="radar" 
          title="Chất lượng nước (Radar)" 
          icon={<Droplets className="text-blue-500"/>} 
        />

        {/* 12. Radial Bar */}
        <ChartCard 
          id="radial" 
          title="Trạng thái Tổ máy" 
          icon={<Zap className="text-yellow-500"/>} 
        />

      </div>

      {/* FULLSCREEN MODAL */}
      {fullScreenChart && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full h-full max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                 <Maximize2 size={18} className="text-blue-600 dark:text-blue-400"/> Chế độ xem chi tiết
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