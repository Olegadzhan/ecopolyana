// src/components/ConverterModal.tsx
import React, { useState } from 'react';

interface ConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConverterModal: React.FC<ConverterModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl p-6 overflow-hidden bg-gray-900 border border-green-500/30 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-400 font-mono tracking-wider">
            Конвертер Excel в JSON
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description Comment */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border-l-4 border-green-500">
          <p className="text-sm text-gray-300">
            ℹ️ информация об охотниках и выданных и аннулированных охотничьих билетах
          </p>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-gray-200">Шаблон данных</span>
            </div>
            <a 
              href="/templates/шаблон.xlsx" 
              download
              className="px-4 py-2 text-sm font-medium text-black bg-green-400 rounded-lg hover:bg-green-300 transition-all shadow-[0_0_10px_rgba(74,222,128,0.5)]"
            >
              Скачать шаблон
            </a>
          </div>

          {/* Upload Area (Placeholder for next step) */}
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-green-500/50 transition-colors">
            <p className="text-gray-400 mb-4">Загрузите файл .xlsx для конвертации</p>
            <button className="px-6 py-2 border border-green-500 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors">
              Выбрать файл
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Отмена
          </button>
          <button className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg transition-all">
            Конвертировать
          </button>
        </div>
      </div>
    </div>
  );
};
