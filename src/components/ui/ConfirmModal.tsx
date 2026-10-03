import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../theme/ThemeContext';
import Button from './Button';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  busy?: boolean;
  error?: string | null;
  intent?: 'primary' | 'danger';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Подтвердите действие',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Да',
  cancelText = 'Нет',
  busy = false,
  error,
  intent = 'primary',
}) => {
  const { palette } = useTheme();
  const titleId = useId();
  const messageId = useId();
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const current = useRef({ busy, onCancel });
  current.current = { busy, onCancel };

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.body.children)
      .filter(element => element !== backdropRef.current)
      .map(element => ({ element, wasInert: element.hasAttribute('inert') }));
    background.forEach(({ element }) => element.setAttribute('inert', ''));
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    const focusableElements = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    ) || []);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!current.current.busy) current.current.onCancel();
      } else if (event.key === 'Tab') {
        const elements = focusableElements();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          dialogRef.current?.focus();
        } else if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const keepFocusInside = (event: FocusEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) {
        (focusableElements()[0] || dialogRef.current)?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', keepFocusInside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', keepFocusInside);
      background.forEach(({ element, wasInert }) => { if (!wasInert) element.removeAttribute('inert'); });
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (busy) dialogRef.current?.focus();
    else if (error) errorRef.current?.focus();
  }, [open, busy, error]);
  
  if (!open) return null;
  return createPortal(
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId} aria-busy={busy} tabIndex={-1}
        className="rounded-lg shadow-lg p-6 w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto break-words animate-fade-in motion-reduce:animate-none"
        style={{ backgroundColor: palette.colors.cardBg }}>
        <h3 id={titleId} className="text-lg font-semibold mb-2" style={{ color: palette.colors.text }}>{title}</h3>
        <p id={messageId} className="mb-6" style={{ color: palette.colors.textSecondary }}>{message}</p>
        {(intent === 'danger' || busy || error) && (
          <div className="mb-4 min-h-[4.5rem]">
            {error && <p ref={errorRef} role="alert" tabIndex={-1} className="text-red-600">{error}</p>}
            {busy && <p role="status" style={{ color: palette.colors.textSecondary }}>Удаление…</p>}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            className="px-4 py-2 min-h-[44px] rounded font-medium transition cursor-pointer hover:opacity-80 focus-visible:outline focus-visible:outline-2 active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: palette.colors.border, color: palette.colors.text }}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <Button
            type="button"
            variant={intent}
            disabled={busy}
            aria-busy={busy}
            className="min-h-[44px] cursor-pointer hover:opacity-80 active:opacity-70"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
