import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
}

interface UIContextType {
  showToast: (type: Toast['type'], message: string) => void;
  confirm: (options: ConfirmOptions) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);

  const showToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const confirm = (options: ConfirmOptions) => {
    setConfirmModal(options);
  };

  const handleConfirm = () => {
    if (confirmModal?.onConfirm) confirmModal.onConfirm();
    setConfirmModal(null);
  };

  const handleCancel = () => {
    if (confirmModal?.onCancel) confirmModal.onCancel();
    setConfirmModal(null);
  };

  return (
    <UIContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-slide-up bg-white dark:bg-slate-800 ${
              toast.type === 'success' ? 'border-green-500 text-green-700 dark:text-green-400' :
              toast.type === 'error' ? 'border-red-500 text-red-700 dark:text-red-400' :
              toast.type === 'warning' ? 'border-amber-500 text-amber-700 dark:text-amber-400' :
              'border-blue-500 text-blue-700 dark:text-blue-400'
            }`}
          >
            <div className="mt-0.5 shrink-0">
               {toast.type === 'success' && <CheckCircle size={20} />}
               {toast.type === 'error' && <AlertCircle size={20} />}
               {toast.type === 'warning' && <AlertTriangle size={20} />}
               {toast.type === 'info' && <Info size={20} />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal Overlay */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all scale-100">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                confirmModal.type === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              }`}>
                {confirmModal.type === 'danger' ? <AlertTriangle size={24}/> : <Info size={24}/>}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {confirmModal.title || 'Xác nhận'}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                {confirmModal.cancelText || 'Hủy bỏ'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all transform active:scale-95 ${
                   confirmModal.type === 'danger' 
                   ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/30' 
                   : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-900/30'
                }`}
              >
                {confirmModal.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};