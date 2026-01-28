
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Sparkles, BarChart2, HelpCircle, ChevronRight, Loader2, Maximize2, Minimize2, Scaling, Key } from 'lucide-react';
import { db } from '../utils/db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';

// --- TYPES ---
interface Message {
  id: string;
  role: 'user' | 'model';
  type: 'text' | 'chart' | 'error';
  content: string;
  chartData?: any;
}

interface ChartConfig {
  title: string;
  type: 'area' | 'bar' | 'line';
  data: any[];
  keys: { key: string; color: string; name: string }[];
  xAxisKey: string;
}

const SAMPLE_PROMPTS = [
  "Mực nước hồ hiện tại là bao nhiêu?",
  "Vẽ biểu đồ mực nước và lưu lượng đến trong 24h qua",
  "So sánh lượng mưa tại trạm Đầu mối và Hương Sơn",
  "Dự báo mực nước trong 3 ngày tới",
  "Tóm tắt tình hình hồ chứa hôm nay",
  "Quy trình vận hành trong mùa lũ như thế nào?"
];

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // New state for Full Screen
  const [showGuide, setShowGuide] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      type: 'text',
      content: 'Xin chào! Tôi là Trợ lý AI của Hồ Tả Trạch. Tôi có thể giúp bạn tra cứu số liệu, vẽ biểu đồ hoặc giải đáp quy trình vận hành. Hãy thử hỏi tôi xem!'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Check for AI Studio environment support
  const [canSelectKey, setCanSelectKey] = useState(false);

  useEffect(() => {
    // Check if window.aistudio exists using type assertion to avoid TS errors with conflicting global types
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      setCanSelectKey(true);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isExpanded, isFullScreen]);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        alert("Đã chọn API Key thành công. Vui lòng thử lại câu hỏi của bạn.");
      } catch (e) {
        console.error("Failed to select key", e);
      }
    }
  };

  // --- AI LOGIC ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', type: 'text', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setShowGuide(false);

    try {
      // 1. Gather Context Data
      const contextData = {
        observation: db.observation.get(),
        forecast: db.forecast.get(),
        generalInfo: db.generalInfo.get(),
        specs: db.specs.get(), 
        waterLevels: db.waterLevels.get().slice(0, 24) 
      };

      // 2. Prepare System Prompt
      const systemInstruction = `
        Bạn là Trợ lý AI chuyên gia của Hệ thống Quản lý Hồ chứa Tả Trạch.
        
        DỮ LIỆU HIỆN TẠI CỦA HỆ THỐNG (Context):
        ${JSON.stringify(contextData)}

        NHIỆM VỤ:
        Trả lời câu hỏi của người dùng dựa trên dữ liệu trên. 
        
        QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG):
        Bạn phải trả về kết quả dưới dạng JSON thuần túy (không có markdown code block) theo cấu trúc sau:
        {
          "type": "text" | "chart",
          "content": "Nội dung trả lời text (có thể dùng markdown đơn giản)",
          "chartConfig": { ... } // Chỉ bắt buộc nếu type="chart"
        }

        CẤU TRÚC CHART CONFIG (nếu người dùng yêu cầu vẽ biểu đồ, so sánh số liệu):
        {
          "title": "Tên biểu đồ",
          "type": "area" | "bar" | "line",
          "xAxisKey": "time" (hoặc tên trường trục hoành),
          "keys": [ { "key": "tên_trường_dữ_liệu", "color": "#hex", "name": "Tên hiển thị" } ],
          "data": [ ...mảng dữ liệu JSON... ]
        }
        
        Lưu ý về dữ liệu biểu đồ:
        - Nếu vẽ mực nước/lưu lượng 24h, hãy dùng dữ liệu từ 'waterLevels' hoặc tạo dữ liệu giả lập hợp lý dựa trên 'observation'.
        - Trả lời ngắn gọn, chuyên nghiệp, tập trung vào số liệu thủy văn.
      `;

      // 3. Call Gemini API
      let responseText = "";
      let apiKey = process.env.API_KEY;
      
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview", 
          contents: input,
          config: {
            systemInstruction: systemInstruction,
          }
        });
        responseText = result.text || "";
      } else {
        // --- SIMULATION MODE (FALLBACK) ---
        await new Promise(r => setTimeout(r, 1500)); // Fake delay
        
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes('biểu đồ') || lowerInput.includes('đồ thị') || lowerInput.includes('chart')) {
           const mockChartData = contextData.waterLevels.map(r => ({
             time: r.time.split('T')[1].slice(0,5),
             level: r.level,
             inflow: 120 + Math.random() * 50
           })).reverse();
           
           responseText = JSON.stringify({
             type: "chart",
             content: "⚠️ **Chế độ mô phỏng**: Dưới đây là biểu đồ mẫu (Do chưa cấu hình API Key).\n\nĐể sử dụng dữ liệu thực và AI thông minh, vui lòng cấu hình API Key trong file `.env` hoặc chọn Key.",
             chartConfig: {
               title: "Diễn biến Mực nước & Lưu lượng đến (Mô phỏng)",
               type: "area",
               xAxisKey: "time",
               keys: [
                 { key: "level", color: "#3b82f6", name: "Mực nước (m)" },
                 { key: "inflow", color: "#10b981", name: "Lưu lượng đến (m³/s)" }
               ],
               data: mockChartData
             }
           });
        } else {
           const wl = contextData.observation.waterLevel;
           responseText = JSON.stringify({
             type: "text",
             content: `⚠️ **Chế độ mô phỏng** (Chưa có API Key)\n\nHiện tại hệ thống đang trả về câu trả lời mặc định. Để kích hoạt trí tuệ nhân tạo Gemini, bạn cần:\n1. Tạo file \`.env\` với nội dung \`API_KEY=your_key\`\n2. Hoặc nếu đang dùng Project IDX, nhấn nút **"Chọn API Key"** phía trên.\n\nThông tin hiện tại:\n- Mực nước: ${wl} m\n- Dung tích: ${contextData.observation.capacity} triệu m³`
           });
        }
      }

      // 4. Parse Response
      let parsedRes;
      try {
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedRes = JSON.parse(cleanJson);
      } catch (e) {
        parsedRes = { type: 'text', content: responseText };
      }

      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        type: parsedRes.type || 'text',
        content: parsedRes.content,
        chartData: parsedRes.chartConfig
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error: any) {
      console.error("AI Error:", error);
      
      let errorMsg = 'Xin lỗi, tôi gặp sự cố khi kết nối với máy chủ AI.';
      if (error.message?.includes('API key not found') || error.toString().includes('API key')) {
          errorMsg = 'Lỗi: Không tìm thấy API Key hợp lệ. Vui lòng kiểm tra cấu hình.';
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        type: 'error',
        content: errorMsg
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- RENDER HELPERS ---
  const renderChart = (config: ChartConfig) => {
    const ChartComponent = config.type === 'bar' ? BarChart : config.type === 'line' ? LineChart : AreaChart;
    const height = isFullScreen ? 450 : 256; // Taller chart in full screen

    return (
      <div className={`mt-3 bg-white dark:bg-slate-900 rounded-lg p-2 border border-slate-200 dark:border-slate-700 w-full`} style={{ height: `${height}px` }}>
        <p className="text-xs font-bold text-center text-slate-500 mb-2">{config.title}</p>
        <ResponsiveContainer width="100%" height="90%">
          <ChartComponent data={config.data} margin={{top: 5, right: 0, left: -20, bottom: 0}}>
            <defs>
              {config.keys.map((k, i) => (
                <linearGradient key={k.key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={k.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={k.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis dataKey={config.xAxisKey} style={{fontSize: '10px'}} tick={{fill: '#94a3b8'}} />
            <YAxis style={{fontSize: '10px'}} tick={{fill: '#94a3b8'}} />
            <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
            <Legend wrapperStyle={{fontSize: '10px'}}/>
            {config.keys.map((k, i) => (
              config.type === 'bar' ? 
                <Bar key={k.key} dataKey={k.key} fill={k.color} name={k.name} radius={[4,4,0,0]} /> :
              config.type === 'line' ?
                <Line key={k.key} type="monotone" dataKey={k.key} stroke={k.color} name={k.name} dot={false} strokeWidth={2} /> :
                <Area key={k.key} type="monotone" dataKey={k.key} stroke={k.color} fill={`url(#grad-${i})`} name={k.name} strokeWidth={2} />
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[3000] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-110 active:scale-95 group"
        title="Trợ lý ảo AI"
      >
        <Sparkles size={24} className="animate-pulse" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg text-sm font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Hỏi Trợ lý AI
        </span>
      </button>
    );
  }

  // Calculate container classes based on state priority: FullScreen > Expanded > Default
  const containerClasses = isFullScreen 
    ? 'inset-0 z-[4000] rounded-none' // Full Screen mode
    : isExpanded 
      ? 'inset-4 md:inset-20 z-[3000] rounded-2xl' // Expanded mode
      : 'bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] z-[3000] rounded-2xl'; // Default mode

  return (
    <div className={`fixed transition-all duration-300 ease-in-out shadow-2xl flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden ${containerClasses}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Trợ lý ảo Tả Trạch</h3>
            <p className="text-[10px] text-white/80">Hệ thống hỗ trợ ra quyết định</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canSelectKey && !process.env.API_KEY && (
             <button 
                onClick={handleSelectKey} 
                className="p-1.5 bg-yellow-400 text-yellow-900 rounded-lg transition-colors text-xs font-bold mr-2 hover:bg-yellow-300" 
                title="Chọn API Key"
             >
                <Key size={14} className="inline mr-1"/> Key
             </button>
          )}
          <button onClick={() => setShowGuide(!showGuide)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Hướng dẫn">
            <HelpCircle size={18} />
          </button>
          
          {/* Full Screen Toggle */}
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" 
            title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Expand/Collapse (Hide in FullScreen) */}
          {!isFullScreen && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors hidden md:block" 
              title={isExpanded ? "Thu gọn" : "Mở rộng"}
            >
              {isExpanded ? <ChevronRight size={20} /> : <Scaling size={18} />}
            </button>
          )}
          
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Đóng">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Guide Panel (Overlay) */}
      {showGuide && (
        <div className="absolute top-16 left-0 right-0 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-sm">
              <HelpCircle size={16} className="text-blue-500"/> Gợi ý câu hỏi
            </h4>
            <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button 
                key={idx}
                onClick={() => { setInput(prompt); setShowGuide(false); }}
                className="text-left text-xs text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-2 rounded-lg transition-colors border border-slate-100 dark:border-slate-700 flex items-center justify-between group"
              >
                {prompt}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-indigo-500"/>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 custom-scrollbar relative" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-r-xl rounded-tl-xl'} p-3 shadow-sm`}>
              
              {/* Text Content */}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>

              {/* Chart Content */}
              {msg.type === 'chart' && msg.chartData && renderChart(msg.chartData)}
              
              {/* Timestamp/Status */}
              <div className={`text-[10px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-white text-right' : 'text-slate-500'}`}>
                {msg.role === 'model' ? 'Trợ lý AI' : 'Bạn'} • {new Date(parseInt(msg.id) || Date.now()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-r-xl rounded-tl-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600"/>
              <span className="text-xs text-slate-500">Đang phân tích dữ liệu...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
        <div className="relative flex items-center gap-2">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="Gợi ý"
          >
            <BarChart2 size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập câu hỏi hoặc yêu cầu vẽ biểu đồ..."
            className="flex-1 bg-slate-100 dark:bg-slate-700 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
            autoFocus
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400 dark:text-slate-500">
             {!process.env.API_KEY ? 'Chế độ mô phỏng (Chưa cấu hình API Key)' : 'AI có thể đưa ra thông tin không chính xác.'}
           </p>
        </div>
      </div>
    </div>
  );
};
