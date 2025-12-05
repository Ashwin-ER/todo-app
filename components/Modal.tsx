import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else setTimeout(() => setShouldRender(false), 300);
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-[100] flex items-center justify-center p-6
        transition-all duration-300
        ${isOpen ? 'visible' : 'invisible'}
      `}
    >
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md
          transition-opacity duration-300 
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `} 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div 
        className={`
          relative w-full max-w-sm 
          bg-white dark:bg-dark-card border border-white/40 dark:border-white/5
          rounded-[2rem] shadow-2xl
          transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-center pt-6 pb-2 relative">
          <h2 className="text-lg font-medium text-light-text dark:text-dark-text tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-dark-subtext hover:text-light-text dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;