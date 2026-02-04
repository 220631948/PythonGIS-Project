import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

/**
 * Accessible Modal component using Portals
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  className = ''
}) => {
  // Get portal root
  const modalRoot = document.getElementById('modal-root') || document.getElementById('root');
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
        window.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
    }

    return () => {
        window.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !modalRoot) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return createPortal(
    <div className="modal-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`modal-container bg-white rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]} ${className} animate-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header flex items-center justify-between p-4 border-b border-slate-100">
          {title ? (
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          ) : <div />}
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-content p-6">
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
