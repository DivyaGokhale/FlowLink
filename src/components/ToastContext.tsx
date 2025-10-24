import React, { createContext, useContext, useState, ReactNode } from "react";

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage>({
    id: 0,
    message: "",
    type: 'info',
    visible: false,
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    const newId = Date.now(); // 🔑 unique each call
    setToast({ id: newId, message, type, visible: true });

    setTimeout(() => {
      setToast((prev) =>
        prev.id === newId ? { ...prev, visible: false } : prev
      );
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 animate-fade-in-up px-4 py-3 rounded-lg shadow-xl ring-1 ring-black/5 z-50 ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error' 
                ? 'bg-red-500 text-white' 
                : toast.type === 'warning' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-blue-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
