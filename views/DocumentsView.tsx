import React, { useState } from 'react';
import { Search, Download, FileText, Filter, Calendar, ShieldCheck, Book, AlertTriangle, User, ChevronRight } from 'lucide-react';

// Types for local use
interface Document {
  id: string;
  number: string;
  date: string;
  title: string;
  signer: string;
  type: string;
}

const docCategories = [
  { id: 'legal', label: 'Văn bản pháp quy', icon: ShieldCheck },
  { id: 'internal', label: 'Quy trình nội bộ', icon: Book },
  { id: 'emergency', label: 'Phương án PCTT', icon: AlertTriangle },
  { id: 'reports', label: 'Báo cáo định kỳ', icon: FileText },
];

const mockDocuments: Record<string, Document[]> = {
  legal: [
    { id: '1', number: '114/2018/NĐ-CP', date: '04/09/2018', title: 'Nghị định về quản lý an toàn đập, hồ chứa nước', signer: 'Chính phủ', type: 'Nghị định' },
    { id: '2', number: '03/2022/TT-BNNPTNT', date: '15/04/2022', title: 'Quy định kỹ thuật về vận hành hồ chứa', signer: 'Bộ NN&PTNT', type: 'Thông tư' },
    { id: '3', number: '15/2023/QĐ-UBND', date: '20/10/2023', title: 'Quyết định phê duyệt quy trình vận hành liên hồ chứa', signer: 'UBND Tỉnh', type: 'Quyết định' },
  ],
  internal: [
    { id: '4', number: 'NB-01/2024', date: '01/01/2024', title: 'Quy trình kiểm tra đập hàng ngày', signer: 'Giám đốc', type: 'Nội bộ' },
    { id: '5', number: 'NB-05/2023', date: '15/12/2023', title: 'Quy định về an toàn lao động tại nhà máy', signer: 'Giám đốc', type: 'Nội bộ' },
  ],
  emergency: [
    { id: '6', number: 'PA-PCTT-2024', date: '01/05/2024', title: 'Phương án ứng phó thiên tai năm 2024', signer: 'BCH PCTT Tỉnh', type: 'Phương án' },
    { id: '7', number: 'PA-XALU-24', date: '05/09/2024', title: 'Kịch bản xả lũ khẩn cấp', signer: 'Công ty', type: 'Phương án' },
  ],
  reports: [
    { id: '8', number: 'BC-Q1-2024', date: '30/03/2024', title: 'Báo cáo tình hình thủy văn Quý I/2024', signer: 'Phòng Kỹ thuật', type: 'Báo cáo' },
    { id: '9', number: 'BC-NAM-2023', date: '31/12/2023', title: 'Báo cáo tổng kết công tác vận hành năm 2023', signer: 'Giám đốc', type: 'Báo cáo' },
  ]
};

export const DocumentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('legal');
  const [searchTerm, setSearchTerm] = useState('');

  const currentDocs = mockDocuments[activeTab] || [];
  const filteredDocs = currentDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Văn bản & Quy định</h2>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm kiếm văn bản..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        </div>
      </div>

      {/* Top Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex overflow-x-auto custom-scrollbar gap-6">
          {docCategories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium whitespace-nowrap transition-all relative ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <cat.icon size={18} />
                {cat.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {/* Table Header / Summary */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
             <Filter size={16} />
             <span>Hiển thị <b>{filteredDocs.length}</b> kết quả</span>
          </div>
          <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Tải về danh sách
          </button>
        </div>

        {filteredDocs.length > 0 ? (
          <>
            {/* --- DESKTOP VIEW (Table) --- */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-3 w-40">Số hiệu</th>
                    <th className="px-6 py-3 w-32">Ngày BH</th>
                    <th className="px-6 py-3">Trích yếu nội dung</th>
                    <th className="px-6 py-3 w-48">Người ký</th>
                    <th className="px-6 py-3 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                      <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{doc.number}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                         {doc.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 mb-1 line-clamp-2">{doc.title}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400"/>
                          <span className="truncate max-w-[120px]" title={doc.signer}>{doc.signer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Tải về">
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- MOBILE/TABLET VIEW (Cards) --- */}
            <div className="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                   {/* Card Header */}
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                         <span className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-1">{doc.number}</span>
                         <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Calendar size={10}/> {doc.date}
                         </span>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase tracking-wide">
                        {doc.type}
                      </span>
                   </div>
                   
                   {/* Card Body */}
                   <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 line-clamp-3 leading-relaxed">
                     {doc.title}
                   </h3>

                   {/* Card Footer */}
                   <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                         <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <User size={12}/>
                         </div>
                         <span className="font-medium">{doc.signer}</span>
                      </div>
                      
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold active:scale-95 transition-transform">
                         <Download size={14}/> Tải về
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} className="text-slate-300 dark:text-slate-600"/>
            </div>
            <h3 className="text-slate-900 dark:text-white font-medium mb-1">Không tìm thấy văn bản</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
};