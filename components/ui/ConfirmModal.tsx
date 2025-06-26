import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Подтвердите действие',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Да',
  cancelText = 'Нет',
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-2 animate-fade-in">
        <h3 className="text-lg font-semibold mb-2 text-black">{title}</h3>
        <p className="mb-6 text-neutral-700">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-neutral-200 hover:bg-neutral-300 text-black font-medium transition"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded bg-black hover:bg-neutral-800 text-white font-medium transition"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal; 