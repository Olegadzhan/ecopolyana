// src/components/ConverterModal.tsx
'use client';

// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FileUpload } from './FileUpload';
import { ConversionProgress } from './ConversionProgress';
import { ConversionOptions } from '@/app/api/convert/route';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================
export interface ConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversionComplete?: (result: ConversionResult) => void;
  defaultOptions?: Partial<ConversionOptions>;
}

export interface ConversionResult {
  success: boolean;
  jobId: string;
  message: string;
  huntersCount: number;
  ticketsCount: number;
  enrichedCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  downloadUrls: {
    hunters?: string;
    tickets?: string;
    report?: string;
    enriched?: string;
  };
  processingTime: number;
}

export interface ConversionState {
  isConverting: boolean;
  progress: number;
  status: string;
  error: string | null;
  result: ConversionResult | null;
  file: File | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const ACCEPTED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};

const DEFAULT_OPTIONS: ConversionOptions = {
  enrichPostal: true,
  enrichOktmo: false,
  report: true,
  region: '',
  dadataKey: '',
  batchSize: 10,
};

const RUSSIAN_REGIONS: Record<string, string> = {
  '01': 'Республика Адыгея',
  '02': 'Республика Башкортостан',
  '03': 'Республика Бурятия',
  '04': 'Республика Алтай',
  '05': 'Республика Дагестан',
  '06': 'Республика Ингушетия',
  '07': 'Кабардино-Балкарская Республика',
  '08': 'Республика Калмыкия',
  '09': 'Карачаево-Черкесская Республика',
  '10': 'Республика Карелия',
  '11': 'Республика Коми',
  '12': 'Республика Марий Эл',
  '13': 'Республика Мордовия',
  '14': 'Республика Саха (Якутия)',
  '15': 'Республика Северная Осетия - Алания',
  '16': 'Республика Татарстан',
  '17': 'Республика Тыва',
  '18': 'Удмуртская Республика',
  '19': 'Республика Хакасия',
  '20': 'Чеченская Республика',
  '21': 'Чувашская Республика',
  '22': 'Алтайский край',
  '23': 'Краснодарский край',
  '24': 'Красноярский край',
  '25': 'Приморский край',
  '26': 'Ставропольский край',
  '27': 'Хабаровский край',
  '28': 'Амурская область',
  '29': 'Архангельская область',
  '30': 'Астраханская область',
  '31': 'Белгородская область',
  '32': 'Брянская область',
  '33': 'Владимирская область',
  '34': 'Волгоградская область',
  '35': 'Вологодская область',
  '36': 'Воронежская область',
  '37': 'Ивановская область',
  '38': 'Иркутская область',
  '39': 'Калининградская область',
  '40': 'Калужская область',
  '41': 'Камчатский край',
  '42': 'Кемеровская область - Кузбасс',
  '43': 'Кировская область',
  '44': 'Костромская область',
  '45': 'Курганская область',
  '46': 'Курская область',
  '47': 'Ленинградская область',
  '48': 'Липецкая область',
  '49': 'Магаданская область',
  '50': 'Московская область',
  '51': 'Мурманская область',
  '52': 'Нижегородская область',
  '53': 'Новгородская область',
  '54': 'Новосибирская область',
  '55': 'Омская область',
  '56': 'Оренбургская область',
  '57': 'Орловская область',
  '58': 'Пензенская область',
  '59': 'Пермский край',
  '60': 'Псковская область',
  '61': 'Ростовская область',
  '62': 'Рязанская область',
  '63': 'Самарская область',
  '64': 'Саратовская область',
  '65': 'Сахалинская область',
  '66': 'Свердловская область',
  '67': 'Смоленская область',
  '68': 'Тамбовская область',
  '69': 'Тверская область',
  '70': 'Томская область',
  '71': 'Тульская область',
  '72': 'Тюменская область',
  '73': 'Ульяновская область',
  '74': 'Челябинская область',
  '75': 'Забайкальский край',
  '76': 'Ярославская область',
  '77': 'г. Москва',
  '78': 'г. Санкт-Петербург',
  '79': 'Еврейская автономная область',
  '83': 'Ненецкий автономный округ',
  '86': 'Ханты-Мансийский автономный округ - Югра',
  '87': 'Чукотский автономный округ',
  '89': 'Ямало-Ненецкий автономный округ',
  '91': 'Республика Крым',
  '92': 'г. Севастополь',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const ConverterModal: React.FC<ConverterModalProps> = ({
  isOpen,
  onClose,
  onConversionComplete,
  defaultOptions,
}) => {
  // ========================================================================
  // STATE
  // ========================================================================
  const [conversionState, setConversionState] = useState<ConversionState>({
    isConverting: false,
    progress: 0,
    status: '',
    error: null,
    result: null,
    file: null,
  });

  const [options, setOptions] = useState<ConversionOptions>(() => ({
    ...DEFAULT_OPTIONS,
    ...defaultOptions,
  }));

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  // Обработка клика вне модального окна
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Блокируем прокрутку фона
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!isOpen) {
      setConversionState(prev => ({
        ...prev,
        isConverting: false,
        progress: 0,
        status: '',
        error: null,
        result: null,
        file: null,
      }));
    }
  }, [isOpen]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleFileSelect = useCallback((selectedFile: File) => {
    setConversionState(prev => ({
      ...prev,
      file: selectedFile,
      error: null,
      result: null,
      progress: 0,
    }));
  }, []);

  const handleOptionChange = useCallback(<K extends keyof ConversionOptions>(
    key: K,
    value: ConversionOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const simulateProgress = useCallback((targetProgress: number, callback?: () => void) => {
    let current = conversionState.progress;
    const interval = setInterval(() => {
      current += Math.random() * 5 + 2;
      if (current >= targetProgress) {
        current = targetProgress;
        clearInterval(interval);
        setConversionState(prev => ({ ...prev, progress: current }));
        callback?.();
      } else {
        setConversionState(prev => ({ ...prev, progress: current }));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [conversionState.progress]);

  const handleConvert = useCallback(async () => {
    const { file } = conversionState;
    
    if (!file) {
      setConversionState(prev => ({
        ...prev,
        error: 'Выберите файл для конвертации',
      }));
      return;
    }

    setConversionState(prev => ({
      ...prev,
      isConverting: true,
      error: null,
      result: null,
      progress: 0,
      status: 'Инициализация...',
    }));

    try {
      // Подготовка FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      // Запуск симуляции прогресса
      const stopProgress = simulateProgress(90);

      // Отправка запроса к API
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      stopProgress?.();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      const result: ConversionResult = await response.json();

      setConversionState(prev => ({
        ...prev,
        progress: 100,
        status: result.success ? '✅ Конвертация завершена!' : '⚠️ Конвертация с предупреждениями',
        result,
        isConverting: false,
      }));

      // Вызов коллбэка если есть
      if (result.success && onConversionComplete) {
        onConversionComplete(result);
      }

    } catch (error) {
      console.error('Conversion error:', error);
      
      setConversionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Произошла неизвестная ошибка',
        progress: 0,
        isConverting: false,
      }));
    }
  }, [conversionState.file, options, onConversionComplete, simulateProgress]);

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      setConversionState(prev => ({
        ...prev,
        error: 'Ошибка при скачивании файла',
      }));
    }
  }, []);

  const handleClose = useCallback(() => {
    if (conversionState.isConverting) {
      if (!window.confirm('Конвертация выполняется. Закрыть окно?')) {
        return;
      }
    }
    onClose();
  }, [conversionState.isConverting, onClose]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="converter-modal-title"
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden bg-gray-900 border border-green-500/30 rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.3)] flex flex-col"
      >
        {/* ==================================================================
            HEADER
        ================================================================== */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-gray-900/95 backdrop-blur border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 id="converter-modal-title" className="text-2xl font-bold text-green-400 font-mono tracking-wide">
                Конвертер Excel в JSON
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                ℹ️ Информация об охотниках и выданных/аннулированных охотничьих билетах
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            aria-label="Закрыть"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ==================================================================
            SCROLLABLE CONTENT
        ================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ----------------------------------------------------------------
              FILE UPLOAD SECTION
          ---------------------------------------------------------------- */}
          <section aria-labelledby="file-upload-heading">
            <h3 id="file-upload-heading" className="sr-only">Загрузка файла</h3>
            <FileUpload 
              onFileSelect={handleFileSelect}
              acceptedFormats={ACCEPTED_FILE_TYPES}
              templatePath="/templates/шаблон.xlsx"
              maxSizeMB={50}
              disabled={conversionState.isConverting}
            />
          </section>

          {/* ----------------------------------------------------------------
              OPTIONS SECTION
          ---------------------------------------------------------------- */}
          <section 
            className="p-5 bg-gray-800/50 rounded-xl border border-gray-700"
            aria-labelledby="options-heading"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="options-heading" className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Настройки конвертации
              </h3>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
              >
                {showAdvancedOptions ? 'Скрыть' : 'Расширенные'}
                <svg className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dadata API Key */}
              <div className="md:col-span-2">
                <label htmlFor="dadata-key" className="block text-sm font-medium text-gray-300 mb-2">
                  🔑 Dadata API Key <span className="text-gray-500">(для обогащения почтовых индексов)</span>
                </label>
                <div className="relative">
                  <input
                    id="dadata-key"
                    type="password"
                    value={options.dadataKey}
                    onChange={(e) => handleOptionChange('dadataKey', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
                    placeholder="Введите API ключ с dadata.ru"
                    disabled={conversionState.isConverting}
                  />
                  {options.dadataKey && (
                    <button
                      type="button"
                      onClick={() => handleOptionChange('dadataKey', '')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Получите бесплатный ключ на{' '}
                  <a 
                    href="https://dadata.ru/apikey/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-400 hover:underline"
                  >
                    dadata.ru/apikey/
                  </a>
                  {' '}• 100 запросов/день бесплатно
                </p>
              </div>

              {/* Enrich Postal */}
              <label className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.enrichPostal}
                  onChange={(e) => handleOptionChange('enrichPostal', e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-500 rounded border-gray-600 bg-gray-700 focus:ring-green-500 focus:ring-offset-gray-800"
                  disabled={conversionState.isConverting}
                />
                <div className="flex-1">
                  <span className="text-white font-medium block">📮 Почтовые индексы (Dadata)</span>
                  <p className="text-xs text-gray-400 mt-1">
                    Автоматический поиск индексов по адресу через API Dadata
                  </p>
                </div>
              </label>

              {/* Enrich OKTMO */}
              <label className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.enrichOktmo}
                  onChange={(e) => handleOptionChange('enrichOktmo', e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-500 rounded border-gray-600 bg-gray-700 focus:ring-green-500 focus:ring-offset-gray-800"
                  disabled={conversionState.isConverting}
                />
                <div className="flex-1">
                  <span className="text-white font-medium block">🏛️ ОКТМО коды</span>
                  <p className="text-xs text-gray-400 mt-1">
                    Обогащение данных кодами ОКТМО из справочника
                  </p>
                </div>
              </label>

              {/* Report */}
              <label className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={options.report}
                  onChange={(e) => handleOptionChange('report', e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-500 rounded border-gray-600 bg-gray-700 focus:ring-green-500 focus:ring-offset-gray-800"
                  disabled={conversionState.isConverting}
                />
                <div className="flex-1">
                  <span className="text-white font-medium block">📊 Создать отчет</span>
                  <p className="text-xs text-gray-400 mt-1">
                    Генерация детального отчета о процессе конвертации
                  </p>
                </div>
              </label>

              {/* Region Filter */}
              <div>
                <label htmlFor="region-select" className="block text-sm font-medium text-gray-300 mb-2">
                  📍 Фильтр по региону РФ
                </label>
                <select
                  id="region-select"
                  value={options.region}
                  onChange={(e) => handleOptionChange('region', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors disabled:opacity-50"
                  disabled={conversionState.isConverting}
                >
                  <option value="">Все регионы</option>
                  {Object.entries(RUSSIAN_REGIONS).map(([code, name]) => (
                    <option key={code} value={name}>
                      {code} — {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Size (Advanced) */}
              {showAdvancedOptions && (
                <div>
                  <label htmlFor="batch-size" className="block text-sm font-medium text-gray-300 mb-2">
                    📦 Размер пакета запросов к Dadata
                  </label>
                  <input
                    id="batch-size"
                    type="number"
                    min="1"
                    max="50"
                    value={options.batchSize}
                    onChange={(e) => handleOptionChange('batchSize', Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
                    disabled={conversionState.isConverting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Рекомендуется 10 для бесплатного тарифа
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ----------------------------------------------------------------
              PROGRESS SECTION
          ---------------------------------------------------------------- */}
          {conversionState.isConverting && (
            <section aria-live="polite" aria-atomic="true">
              <ConversionProgress 
                progress={conversionState.progress} 
                status={conversionState.status}
                estimatedTime={conversionState.progress > 0 && conversionState.progress < 100}
              />
            </section>
          )}

          {/* ----------------------------------------------------------------
              ERROR SECTION
          ---------------------------------------------------------------- */}
          {conversionState.error && (
            <div 
              className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-400 font-medium">Ошибка</p>
                  <p className="text-red-300 text-sm mt-1">{conversionState.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------
              RESULTS SECTION
          ---------------------------------------------------------------- */}
          {conversionState.result && (
            <section 
              className={`p-5 rounded-xl border ${
                conversionState.result.success 
                  ? 'bg-green-900/30 border-green-500/50' 
                  : 'bg-yellow-900/30 border-yellow-500/50'
              }`}
              aria-labelledby="results-heading"
            >
              <h3 id="results-heading" className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                conversionState.result.success ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {conversionState.result.success ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Результаты конвертации
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Конвертация завершена с предупреждениями
                  </>
                )}
              </h3>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">Охотники</p>
                  <p className="text-2xl font-bold text-white mt-1">{conversionState.result.huntersCount}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">Билеты</p>
                  <p className="text-2xl font-bold text-white mt-1">{conversionState.result.ticketsCount}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">Обогащено</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{conversionState.result.enrichedCount}</p>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                  <p className="text-gray-400 text-sm">Время</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{(conversionState.result.processingTime / 1000).toFixed(1)}с</p>
                </div>
              </div>

              {/* Errors List */}
              {conversionState.result.errors.length > 0 && (
                <div className="mb-5">
                  <p className="text-yellow-400 text-sm font-medium mb-2">
                    ⚠️ Предупреждения ({conversionState.result.errors.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                    {conversionState.result.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-gray-300">
                        • Строка {err.row}: {err.field} — {err.message}
                      </p>
                    ))}
                    {conversionState.result.errors.length > 5 && (
                      <p className="text-gray-500 italic">
                        ... и ещё {conversionState.result.errors.length - 5} предупреждений
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Download Buttons */}
              <div className="flex flex-wrap gap-3">
                {conversionState.result.downloadUrls.hunters && (
                  <button
                    onClick={() => handleDownload(conversionState.result.downloadUrls.hunters!, 'hunters.json')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    hunters.json
                  </button>
                )}
                {conversionState.result.downloadUrls.tickets && (
                  <button
                    onClick={() => handleDownload(conversionState.result.downloadUrls.tickets!, 'huntingtickets.json')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    huntingtickets.json
                  </button>
                )}
                {conversionState.result.downloadUrls.report && (
                  <button
                    onClick={() => handleDownload(conversionState.result.downloadUrls.report!, 'conversion_report.txt')}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Отчет
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ==================================================================
            FOOTER ACTIONS
        ================================================================== */}
        <div className="sticky bottom-0 p-6 bg-gray-900/95 backdrop-blur border-t border-gray-800 flex justify-end gap-3">
          <button 
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors font-medium"
            disabled={conversionState.isConverting}
          >
            {conversionState.result ? 'Закрыть' : 'Отмена'}
          </button>
          
          {!conversionState.result && (
            <button
              onClick={handleConvert}
              disabled={conversionState.isConverting || !conversionState.file}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                conversionState.isConverting || !conversionState.file
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
              }`}
            >
              {conversionState.isConverting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Начать конвертацию
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export default ConverterModal;
