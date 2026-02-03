
import React, { useState, useRef } from 'react';
import { Search, Download, FileText, Filter, Calendar, ShieldCheck, Book, AlertTriangle, User, ChevronRight, Plus, UploadCloud, X, Save, Check } from 'lucide-react';
import { db } from '../utils/db';
import { DocumentItem } from '../types';
import { useUI } from '../components/GlobalUI';

const docCategories = [
  { id: 'legal', label: 'Văn bản pháp quy', icon: ShieldCheck },
  { id: 'internal', label: 'Quy trình nội bộ', icon: Book },
  { id: 'emergency', label: 'Phương án PCTT', icon: AlertTriangle },
  { id: 'reports', label: 'Báo cáo định kỳ', icon: FileText },
];

export const DocumentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('legal');
  const [searchTerm, setSearchTerm] = useState('');
  const [docs, setDocs] = useState<DocumentItem[]>(db.documents.get());
  const ui = useUI();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<DocumentItem>>({
    category: 'legal',
    type: 'Quyết định'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtering Logic
  const currentDocs = docs.filter(doc => doc.category === activeTab);
  const filteredDocs = currentDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Handlers ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSaveDocument = () => {
    // Validation
    if (!newDoc.number || !newDoc.title || !newDoc.date || !newDoc.signer) {
        ui.showToast('error', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)');
        return;
    }

    const docToAdd: DocumentItem = {
        id: `doc-${Date.now()}`,
        number: newDoc.number,
        title: newDoc.title,
        date: newDoc.date, // Should be formatted properly in a real app
        signer: newDoc.signer,
        type: newDoc.type || 'Văn bản',
        category: newDoc.category as any || activeTab
    };

    // Save to DB
    const updatedDocs = [docToAdd, ...docs];
    db.documents.set(updatedDocs);
    setDocs(updatedDocs); // Update local state immediately

    // Reset and Close
    setIsModalOpen(false);
    setNewDoc({ category: activeTab as any, type: 'Quyết định' });
    setSelectedFile(null);
    ui.showToast('success', 'Đã tải lên văn bản mới thành công');
  };

  return (
    <>
      <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Văn bản & Quy định</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý và tra cứu hồ sơ pháp lý, quy trình vận hành</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm văn bản..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
             </div>
             
             <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-blue-200 dark:shadow-blue-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"
             >
                <Plus size={18}/> <span className="hidden sm:inline">Thêm mới</span>
             </button>
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

      {/* --- UPLOAD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ marginTop: 0 }}>
           <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                 <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                    <UploadCloud size={20} className="text-blue-600 dark:text-blue-400"/> Tải lên văn bản
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <X size={24}/>
                 </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                 
                 {/* File Dropzone Simulation */}
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                 >
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" />
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                       <UploadCloud size={24} className="text-blue-500 dark:text-blue-400"/>
                    </div>
                    {selectedFile ? (
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nhấn để chọn file hoặc kéo thả vào đây</p>
                            <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF, Word, Excel (Max 10MB)</p>
                        </div>
                    )}
                 </div>

                 {/* Form Fields */}
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Số hiệu *</label>
                          <input 
                             type="text" 
                             value={newDoc.number || ''}
                             onChange={(e) => setNewDoc({...newDoc, number: e.target.value})}
                             placeholder="VD: 12/2024/QĐ-UBND"
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ngày ban hành *</label>
                          <input 
                             type="date" 
                             value={newDoc.date || ''}
                             onChange={(e) => setNewDoc({...newDoc, date: e.target.value})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                          />
                       </div>
                    </div>

                    <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Trích yếu nội dung *</label>
                       <textarea 
                          rows={3}
                          value={newDoc.title || ''}
                          onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                          placeholder="Nhập nội dung tóm tắt của văn bản..."
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Người ký / Cơ quan *</label>
                          <input 
                             type="text" 
                             value={newDoc.signer || ''}
                             onChange={(e) => setNewDoc({...newDoc, signer: e.target.value})}
                             placeholder="VD: Giám đốc..."
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                          />
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Danh mục</label>
                          <select 
                             value={newDoc.category}
                             onChange={(e) => setNewDoc({...newDoc, category: e.target.value as any})}
                             className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                          >
                             {docCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                 <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                    onClick={handleSaveDocument}
                    className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                 >
                    <Save size={16}/> Lưu văn bản
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
