import React, { useState } from 'react';
import { Search, Download, FileText, Filter, Calendar, ShieldCheck, Book, AlertTriangle } from 'lucide-react';
import { exportToExcel } from '../utils/excel';

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

  const handleExport = () => {
    const exportData = filteredDocs.map(doc => ({
        'Số hiệu': doc.number,
        'Ngày ban hành': doc.date,
        'Tiêu đề': doc.title,
        'Người ký': doc.signer,
        'Loại': doc.type
    }));
    exportToExcel(exportData, 'Danh_sach_van_ban');
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
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
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
             <Filter size={16} />
             <span>Hiển thị <b>{filteredDocs.length}</b> kết quả</span>
          </div>
          <button onClick={handleExport} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Xuất Excel danh sách
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-3 w-32">Số hiệu</th>
                <th className="px-6 py-3 w-32">Ngày BH</th>
                <th className="px-6 py-3">Trích yếu nội dung</th>
                <th className="px-6 py-3 w-40">Người ký</th>
                <th className="px-6 py-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{doc.number}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-2">
                       <Calendar size={14}/> {doc.date}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 mb-1">{doc.title}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{doc.signer}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Tải về">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="opacity-20"/>
                      <p>Không tìm thấy văn bản nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};