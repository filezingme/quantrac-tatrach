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
  Maximize2, X, Share2, CircleDot, Download
} from 'lucide-react';
import { exportToExcel } from '../utils/excel';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444', '#3b82f6'];

const complexHydroData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}h`,
  rain: Math.random() * 20 > 15 ? Math.random() * 50 : 0, 
  inflow: 50 + Math.sin(i / 4) * 100 + Math.random() * 20,
  outflow: 40 + Math.sin((i - 2) / 4) * 80, 
  level: 35 + i * 0.1 + Math.sin(i / 6) * 0.5,
  spillway: i > 12 ? (i - 12) * 10 : 0
}));

const sensorData = Array.from({ length: 20 }, (_, i) => ({
  time: `T${i}`,
  sensorA: 20 + Math.random() * 5,
  sensorB: 22 + Math.random() * 6,
  sensorC: 19 + Math.random() * 4,
  sensorD: 25 + Math.random() * 8,
}));

const longTermData = Array.from({ length: 100 }, (_, i) => ({
  date: `Day ${i + 1}`,
  value: 500 + Math.random() * 200 - 100 + Math.sin(i / 10) * 100,
  ma: 500 + Math.sin(i / 10) * 100 
}));

const monthlyFlowData = [
  { month: 'T1', qIn: 120, qOut: 100, evaporation: 10 },
  { month: 'T2', qIn: 150, qOut: 130, evaporation: 12 },
  { month: 'T3', qIn: 180, qOut: 160, evaporation: 15 },
  { month: 'T4', qIn: 200, qOut: 210, evaporation: 20 },
  { month: 'T5', qIn: 250, qOut: 240, evaporation: 25 },
  { month: 'T6', qIn: 300, qOut: 280, evaporation: 30 },
];

const deviationData = [
  { name: 'T2', uv: 400 },
  { name: 'T3', uv: -300 },
  { name: 'T4', uv: -200 },
  { name: 'T5', uv: 278 },
  { name: 'T6', uv: 189 },
  { name: 'T7', uv: 239 },
  { name: 'T8', uv: -349 },
];

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

const bubbleData = [
  { hour: 1, intensity: 10, volume: 100, name: 'Trận 1' },
  { hour: 2, intensity: 30, volume: 500, name: 'Trận 2' },
  { hour: 5, intensity: 50, volume: 1200, name: 'Trận 3 (Lớn)' },
  { hour: 10, intensity: 20, volume: 300, name: 'Trận 4' },
  { hour: 12, intensity: 45, volume: 900, name: 'Trận 5' },
  { hour: 18, intensity: 15, volume: 200, name: 'Trận 6' },
];

const percentData = [
  { month: '2015', a: 4000, b: 2400, c: 2400 },
  { month: '2016', a: 3000, b: 1398, c: 2210 },
  { month: '2017', a: 2000, b: 9800, c: 2290 },
  { month: '2018', a: 2780, b: 3908, c: 2000 },
  { month: '2019', a: 1890, b: 4800, c: 2181 },
];

const radarData = [
  { subject: 'pH', A: 120, B: 110, fullMark: 150 },
  { subject: 'DO', A: 98, B: 130, fullMark: 150 },
  { subject: 'BOD5', A: 86, B: 130, fullMark: 150 },
  { subject: 'COD', A: 99, B: 100, fullMark: 150 },
  { subject: 'TSS', A: 85, B: 90, fullMark: 150 },
  { subject: 'NH4+', A: 65, B: 85, fullMark: 150 },
];

const radialData = [
  { name: 'Tổ máy 1', uv: 90, fill: '#10b981' },
  { name: 'Tổ máy 2', uv: 45, fill: '#f59e0b' },
  { name: 'Tự dùng', uv: 15, fill: '#64748b' },
];

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

interface ChartCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  colSpan?: string;
  onExport: (id: string) => void;
  onMaximize: (id: string) => void;
  renderContent: (id: string, isFullScreen?: boolean) => React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ id, title, icon, colSpan = "col-span-1", onExport, onMaximize, renderContent }) => (
  <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col ${colSpan}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">{icon} {title}</h3>
      <div className="flex gap-1">
        <button onClick={() => onExport(id)} className="p-1.5 text-slate-400 hover:text-green-600 rounded transition-colors" title="Xuất Excel"><Download size={18}/></button>
        <button onClick={() => onMaximize(id)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors" title="Phóng to"><Maximize2 size={18} /></button>
      </div>
    </div>
    <div className="flex-1 min-h-[300px]">{renderContent(id)}</div>
  </div>
);

export const DemoChartsView: React.FC = () => {
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);

  const handleExport = (id: string) => {
    let exportData: any[] = [];
    let name = "Chart_Data";
    switch(id) {
      case 'hydro': exportData = complexHydroData; name = "Du_lieu_dieu_tiet"; break;
      case 'multi-sensor': exportData = sensorData; name = "Du_lieu_cam_bien"; break;
      case 'monthly-bar': exportData = monthlyFlowData; name = "Can_bang_nuoc_thang"; break;
      default: exportData = [];
    }
    if(exportData.length > 0) exportToExcel(exportData, name);
  };

  const renderChartContent = (id: string, isFullScreen: boolean = false) => {
    const height = '100%'; 
    switch (id) {
      case 'hydro':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={complexHydroData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <defs><linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="#f1f5f9" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis yAxisId="flow" stroke="#94a3b8"/><YAxis yAxisId="level" orientation="right" stroke="#94a3b8"/>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="flow" dataKey="rain" name="Mưa (mm)" fill="#93c5fd" barSize={10} />
              <Area yAxisId="flow" type="monotone" dataKey="inflow" name="Q đến" fill="url(#colorIn)" stroke="#3b82f6" fillOpacity={0.1} />
              <Line yAxisId="flow" type="monotone" dataKey="outflow" name="Q xả" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line yAxisId="level" type="monotone" dataKey="level" name="Mực nước" stroke="#10b981" strokeWidth={3} dot={true} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'multi-sensor':
        return (
          <ResponsiveContainer width="100%" height={height}>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#94a3b8"/>
                <XAxis dataKey="time" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: '10px'}}/>
                <Line type="monotone" dataKey="sensorA" stroke="#8884d8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sensorB" stroke="#82ca9d" strokeWidth={2} dot={false} />
              </LineChart>
          </ResponsiveContainer>
        );
      case 'monthly-bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
              <BarChart data={monthlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} stroke="#94a3b8"/>
                <XAxis dataKey="month" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/>
                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} /><Legend />
                <Bar dataKey="qIn" fill="#3b82f6" name="Q đến" radius={[4, 4, 0, 0]} />
                <Bar dataKey="qOut" fill="#ef4444" name="Q xả" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
        );
      default: return <div>No Chart</div>;
    }
  };

  return (
    <div className="pb-20 animate-fade-in relative">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Thư viện Biểu đồ Nâng cao</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Phân tích dữ liệu chuyên sâu.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ChartCard 
            id="hydro" 
            title="Diễn biến Lũ & Điều tiết" 
            icon={<Activity className="text-blue-600"/>} 
            colSpan="col-span-1 md:col-span-2 xl:col-span-3"
            onExport={handleExport}
            onMaximize={setFullScreenChart}
            renderContent={renderChartContent}
        />
        <ChartCard 
            id="multi-sensor" 
            title="So sánh Đa cảm biến" 
            icon={<GitMerge className="text-green-600"/>}
            onExport={handleExport}
            onMaximize={setFullScreenChart}
            renderContent={renderChartContent}
        />
        <ChartCard 
            id="monthly-bar" 
            title="Cân bằng nước hàng tháng" 
            icon={<BarChart2 className="text-slate-600 dark:text-slate-400"/>}
            onExport={handleExport}
            onMaximize={setFullScreenChart}
            renderContent={renderChartContent}
        />
      </div>
      {fullScreenChart && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full h-full max-w-[95vw] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Maximize2 size={18} className="text-blue-600"/> Chế độ xem chi tiết</h3>
              <button onClick={() => setFullScreenChart(null)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 p-6 bg-white dark:bg-slate-800 overflow-hidden">{renderChartContent(fullScreenChart, true)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
