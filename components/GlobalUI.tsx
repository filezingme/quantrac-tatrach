import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  type?: 'primary' | 'danger';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface PromptOptions {
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
}

interface UIContextType {
  showToast: (type: ToastType, message: string) => void;
  confirm: (options: ConfirmOptions) => void;
  prompt: (options: PromptOptions) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [promptState, setPromptState] = useState<PromptOptions | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    setPromptValue(options.defaultValue || '');
    setPromptState(options);
  }, []);

  const handleConfirmAction = () => {
    if (confirmState) {
      confirmState.onConfirm();
      setConfirmState(null);
    }
  };

  const handleConfirmCancel = () => {
    if (confirmState?.onCancel) {
      confirmState.onCancel();
    }
    setConfirmState(null);
  };

  const handlePromptSubmit = () => {
    if (promptState) {
      promptState.onConfirm(promptValue);
      setPromptState(null);
      setPromptValue('');
    }
  };

  const handlePromptCancel = () => {
    if (promptState?.onCancel) {
      promptState.onCancel();
    }
    setPromptState(null);
    setPromptValue('');
  };

  return (
    <UIContext.Provider value={{ showToast, confirm, prompt }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none items-center w-full max-w-md px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full p-4 rounded-xl shadow-lg border flex items-center gap-3 animate-slide-up bg-white dark:bg-slate-800 ${
              toast.type === 'success' ? 'border-green-500 text-green-700 dark:text-green-400' :
              toast.type === 'error' ? 'border-red-500 text-red-700 dark:text-red-400' :
              toast.type === 'warning' ? 'border-amber-500 text-amber-700 dark:text-amber-400' :
              'border-blue-500 text-blue-700 dark:text-blue-400'
            }`}
          >
            <div className="shrink-0">
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

      {/* Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{confirmState.title || 'Xác nhận'}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{confirmState.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {confirmState.cancelText || 'Hủy'}
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-transform active:scale-95 ${
                  confirmState.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.confirmText || 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptState && (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{promptState.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{promptState.message}</p>
            <input 
              autoFocus
              type="text"
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={promptState.placeholder}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg mb-6 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePromptSubmit();
                if (e.key === 'Escape') handlePromptCancel();
              }}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={handlePromptCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handlePromptSubmit}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-transform active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};