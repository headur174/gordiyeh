import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PortalContextValue {
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export const PortalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const openModal = (content: ReactNode) => setModalContent(content);
  const closeModal = () => setModalContent(null);

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  return (
    <PortalContext.Provider value={{ openModal, closeModal, showToast }}>
      {children}
      {/* Global Overlay Layer for Modals */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {modalContent}
          </div>
        </div>
      )}

      {/* Global Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-800' :
            toast.type === 'error' ? 'bg-rose-950 text-rose-100 border-rose-800' :
            toast.type === 'warning' ? 'bg-amber-950 text-amber-100 border-amber-800' :
            'bg-slate-900 text-slate-100 border-slate-800'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </PortalContext.Provider>
  );
};

export const usePortal = (): PortalContextValue => {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('usePortal must be used within PortalProvider');
  }
  return ctx;
};
