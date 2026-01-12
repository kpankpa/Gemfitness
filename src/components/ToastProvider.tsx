"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ToastType = 'info' | 'success' | 'error';
type Toast = { id: number; type: ToastType; message: string };

const ToastContext = createContext<{ push: (message: string, type?: ToastType) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      {/* Global toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto max-w-sm w-full px-4 py-2 rounded shadow-md text-sm font-medium ${t.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : t.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-800 border border-gray-200'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
