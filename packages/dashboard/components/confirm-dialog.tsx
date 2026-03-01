'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: async () => false });

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl animate-slide-up">
            <div className="flex items-start gap-3 mb-4">
              <div className={`mt-0.5 rounded-full p-2 ${dialog.danger ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                <AlertTriangle size={18} className={dialog.danger ? 'text-red-400' : 'text-yellow-400'} />
              </div>
              <div>
                <h3 className="font-semibold">{dialog.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{dialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => handleClose(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => handleClose(true)}
                className={dialog.danger ? 'btn-danger' : 'btn-primary'}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
