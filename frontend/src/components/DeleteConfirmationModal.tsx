import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during project deletion:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    //clicking outside closes the modal
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/*modal card container*/}
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/*modal header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-full">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Delete Project?</h3>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          Are you sure you want to delete this project.
        </p>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 h-9 px-4 w-auto cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="h-9 px-4 w-auto bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </div>
      </div>
    </div>
  );
};
