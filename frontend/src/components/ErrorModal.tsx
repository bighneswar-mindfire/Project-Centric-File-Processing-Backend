import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-full">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{message}</p>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <Button
            type="button"
            onClick={onClose}
            className="h-9 px-4 w-auto bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
