import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = '600px' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-grey-accent-200 w-full mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" style={{ maxWidth }}>
        <div className="flex justify-between items-center p-6 border-b border-grey-accent-100">
          <h2 className="text-xl font-semibold text-grey-accent-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-grey-accent-500 hover:text-grey-accent-700 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-grey-accent-100 transition-all duration-200"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}