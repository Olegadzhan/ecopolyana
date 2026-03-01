// src/components/ConverterModal.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { FileUpload } from './FileUpload';
import { ConversionProgress } from './ConversionProgress';

interface ConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversionOptions {
  enrichPostal: boolean;
  enrichOktmo: boolean;
  report: boolean;
  region: string;
  dadataKey: string;
}

export const ConverterModal: React.FC<ConverterModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<ConversionOptions>({
    enrichPostal: true,
    enrichOktmo: false,
    report: true,
    region: '',
    dadataKey: '',
  });

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);
  }, []);

  const handleConvert = async () => {
    if (!file) {
      setError('Выберите файл для конвертации');
      return;
    }

    setIsConverting(true);
    setError(null);
    setProgress(0);
    setStatus('Подготовка...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      // Имитация прогресса
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 500);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка конвертации');
      }

      const data = await response.json();
      setProgress(100);
      setStatus('✅ Конвертация завершена!');
      setResult(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setProgress(0);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError('Ошибка при скачивании файла');
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatus('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-green-500/30 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-green-400 font-mono tracking-wider">
              Конвертер Excel в JSON
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              ℹ️ информация об охотниках и выданных и аннулированных охотничьих билетах
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* File Upload */}
          <FileUpload 
            onFileSelect={handleFileSelect}
            acceptedFormats={['.xlsx', '.xls', '.csv']}
            templatePath="/templates/шаблон.xlsx"
          />

          {/* Options */}
          <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">⚙️ Настройки конвертации</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dadata API Key */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-2">
                  🔑 Dadata API Key (для обогащения почтовых индексов)
                </label>
                <input
                  type="password"
                  value={options.dadataKey}
                  onChange={(e) => setOptions({...options, dadataKey: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="Введите API ключ Dadata"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Получите ключ на <a href="https://dadata.ru" target="_blank" className="text-green-400 hover:underline">dadata.ru</a>
                </p>
              </div>

              {/* Enrich Postal */}
              <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={options.enrichPostal}
                  onChange={(e) => setOptions({...options, enrichPostal: e.target.checked})}
                  className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-white font-medium">📮 Почтовые индексы (Dadata)</span>
                  <p className="text-xs text-gray-400">Автоматический поиск по адресу</p>
                </div>
              </label>

              {/* Enrich OKTMO */}
              <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={options.enrichOktmo}
                  onChange={(e) => setOptions({...options, enrichOktmo: e.target.checked})}
                  className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-white font-medium">🏛️ ОКТМО коды</span>
                  <p className="text-xs text-gray-400">Обогащение из справочника</p>
                </div>
              </label>

              {/* Report */}
              <label className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={options.report}
                  onChange={(e) => setOptions({...options, report: e.target.checked})}
                  className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-white font-medium">📊 Создать отчет</span>
                  <p className="text-xs text-gray-400">Детальный отчет о конвертации</p>
                </div>
              </label>

              {/* Region Filter */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">📍 Регион РФ</label>
                <select
                  value={options.region}
                  onChange={(e) => setOptions({...options, region: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                >
                  <option value="">Все регионы</option>
                  <option value="01">Адыгея</option>
                  <option value="77">Москва</option>
                  <option value="78">Санкт-Петербург</option>
                  <option value="64">Саратовская область</option>
                  {/* Добавить все регионы из справочника */}
                </select>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isConverting && (
            <ConversionProgress 
              progress={progress} 
              status={status} 
            />
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-xl">
              <h3 className="text-lg font-semibold text-green-400 mb-3">✅ Результаты конвертации</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-gray-400 text-sm">Охотники</p>
                  <p className="text-2xl font-bold text-white">{result.huntersCount}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-gray-400 text-sm">Билеты</p>
                  <p className="text-2xl font-bold text-white">{result.ticketsCount}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {result.downloadUrls.hunters && (
                  <button
                    onClick={() => handleDownload(result.downloadUrls.hunters, 'hunters.json')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    📥 hunters.json
                  </button>
                )}
                {result.downloadUrls.tickets && (
                  <button
                    onClick={() => handleDownload(result.downloadUrls.tickets, 'huntingtickets.json')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    📥 huntingtickets.json
                  </button>
                )}
                {result.downloadUrls.report && (
                  <button
                    onClick={() => handleDownload(result.downloadUrls.report, 'report.txt')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    📥 Отчет
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 p-6 bg-gray-900 border-t border-gray-800 flex justify-end space-x-3">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Закрыть
          </button>
          {!result && (
            <button
              onClick={handleConvert}
              disabled={isConverting || !file}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg shadow-lg transition-all"
            >
              {isConverting ? '⏳ Конвертация...' : '🚀 Начать конвертацию'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
