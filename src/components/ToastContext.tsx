import React, { createContext, useContext, useState, ReactNode } from "react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ id: number; message: string; visible: boolean }>({
    id: 0,
    message: "",
    visible: false,
  });

  const showToast = (message: string) => {
    const newId = Date.now(); // 🔑 unique each call
    setToast({ id: newId, message, visible: true });

    setTimeout(() => {
      setToast((prev) =>
        prev.id === newId ? { ...prev, visible: false } : prev
      );
    }, 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <div
          key={toast.id} // 🔑 forces React to remount
          className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50"
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
