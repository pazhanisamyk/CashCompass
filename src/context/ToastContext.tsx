import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextProps {
  toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((t) => {
          let bgColor = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
          let textColor = 'text-slate-800 dark:text-slate-200';
          let Icon = Info;
          let iconColor = 'text-blue-500';

          if (t.type === 'success') {
            bgColor = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50';
            iconColor = 'text-emerald-500';
            Icon = CheckCircle;
          } else if (t.type === 'error') {
            bgColor = 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50';
            iconColor = 'text-rose-500';
            Icon = AlertCircle;
          } else if (t.type === 'warning') {
            bgColor = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
            iconColor = 'text-amber-500';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-slide-in transition-all ${bgColor} ${textColor}`}
              role="alert"
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <div className="text-sm font-medium flex-1">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
