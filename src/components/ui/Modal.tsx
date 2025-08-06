import React, { useEffect } from 'react';
import { ModalProps } from '@/types';

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      // Add modal-specific scroll management
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      const body = document.body;
      const originalOverflow = body.style.overflow;
      const originalPaddingRight = body.style.paddingRight;

      // Prevent body scroll and compensate for scrollbar
      body.style.overflow = 'hidden';
      body.style.paddingRight = `${scrollBarWidth}px`;
      
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Restore original styles
        body.style.overflow = originalOverflow;
        body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          />

          {/* Modal panel */}
          <div className={`relative transform overflow-y-auto rounded-lg bg-white text-left shadow-xl transition-all w-full max-h-[90vh] ${sizeClasses[size]}`}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {title && (
                <div className="mb-4 flex items-center justify-between sticky top-0 bg-white z-10 pb-2 border-b">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="overflow-y-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;