import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

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
  const { palette } = useTheme();
  
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="rounded-lg shadow-lg p-6 w-full max-w-xs mx-2 animate-fade-in" style={{ backgroundColor: palette.colors.cardBg }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>{title}</h3>
        <p className="mb-6" style={{ color: palette.colors.textSecondary }}>{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded font-medium transition hover:opacity-80"
            style={{ backgroundColor: palette.colors.border, color: palette.colors.text }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded font-medium transition hover:opacity-80 text-white"
            style={{ backgroundColor: palette.colors.primary }}
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
