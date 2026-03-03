// src/app/smart-hunting/page.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Download, Upload, MapPin, Key, Loader2, 
  FileJson, CheckCircle2, AlertCircle, Wifi,
  WifiOff, Clock, FileText, Database,
  CheckCircle, XCircle, ExternalLink
} from 'lucide-react';

// Типы для данных
type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

type DadataStatus = {
  status: 'idle' | 'checking' | 'valid' | 'invalid' | 'disabled';
  message?: string;
  balance?: number;
};

type LogEntry = {
  id: number;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  stage: 'file' | 'parse' | 'dadata' | 'process' | 'complete';
  message: string;
  details?: any;
};

export default function SmartHuntingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dadataApiKey, setDadataApiKey] = useState<string>('');
  const [dadataStatus, setDadataStatus] = useState<DadataStatus>({ status: 'idle' });
  const [enablePostalSearch, setEnablePostalSearch] = useState<boolean>(true);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(true);
  const [dadataStats, setDadataStats] = useState({ requests: 0, success: 0, errors: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Автоскролл логов
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Добавление записи в лог
  const addLog = (
    level: LogEntry['level'],
    stage: LogEntry['stage'],
    message: string,
    details?: any
  ) => {
    const newLog: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('ru-RU', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      level,
      stage,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Очистка логов
  const clearLogs = () => {
    setLogs([]);
    setDadataStats({ requests: 0, success: 0, errors: 0 });
  };

  // Проверка API ключа DaData через сервер
  const checkDadataKey = async (key: string) => {
    if (!key || key.length < 10) {
      setDadataStatus({ status: 'idle' });
      return;
    }

    setDadataStatus({ status: 'checking', message: 'Проверка ключа...' });
    addLog('info', 'dadata', 'Проверка API ключа DaData...');

    try {
      const response = await fetch('/api/check-dadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: key })
      });

      const data = await response.json();

      if (data.valid) {
        setDadataStatus({ 
          status: 'valid', 
          message: data.message || 'Ключ действителен',
          balance: data.balance 
        });
        addLog('success', 'dadata', `✅ ${data.message || 'Ключ действителен'}`);
      } else {
        setDadataStatus({ 
          status: 'invalid', 
          message: data.error || 'Недействительный ключ' 
        });
        addLog('error', 'dadata', `❌ ${data.error || 'Недействительный ключ'}`);
      }
    } catch (error: any) {
      setDadataStatus({ 
        status: 'invalid', 
        message: 'Ошибка проверки' 
      });
      addLog('error', 'dadata', `❌ Ошибка проверки: ${error.message}`);
    }
  };

  // Debounce для проверки ключа
  useEffect(() => {
    const timer = setTimeout(() => {
      if (enablePostalSearch && dadataApiKey) {
        checkDadataKey(dadataApiKey);
      } else if (!enablePostalSearch) {
        setDadataStatus({ status: 'disabled', message: 'Поиск отключен' });
      } else {
        setDadataStatus({ status: 'idle' });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dadataApiKey, enablePostalSearch]);

  // Обработчик загрузки файла
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newFile = acceptedFiles[0];
      setFile(newFile);
      setStatus('idle');
      setErrorMessage('');
      setDownloadUrl('');
      clearLogs();
      
      addLog('success', 'file', `Файл загружен: ${newFile.name} (${(newFile.size / 1024).toFixed(2)} KB)`);
      
      // Определяем тип файла
      const ext = newFile.name.split('.').pop()?.toLowerCase();
      addLog('info', 'file', `Формат: ${ext === 'csv' ? 'CSV' : 'Excel'} файл`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Отмена конвертации
  const cancelConversion = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('warning', 'process', 'Конвертация отменена пользователем');
    }
  };

  // Обработчик конвертации
  const handleConvert = async () => {
    if (!file) {
      setErrorMessage('Пожалуйста, выберите файл');
      addLog('error', 'file', 'Ошибка: файл не выбран');
      return;
    }

    if (enablePostalSearch && dadataStatus.status !== 'valid') {
      setErrorMessage('Для поиска индексов нужен валидный API ключ DaData');
      addLog('error', 'dadata', 'Ошибка: невалидный API ключ DaData');
      return;
    }

    // Создаем новый AbortController для этой конвертации
    abortControllerRef.current = new AbortController();
    
    setStatus('converting');
    setProgress(0);
    setErrorMessage('');
    setDownloadUrl('');
    clearLogs();
    setDadataStats({ requests: 0, success: 0, errors: 0 });
    
    addLog('info', 'file', 'Начало конвертации...');
    addLog('info', 'file', `Размер файла: ${(file.size / 1024).toFixed(2)} KB`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dadataApiKey', enablePostalSearch ? dadataApiKey : '');
    formData.append('enablePostalSearch', String(enablePostalSearch));

    try {
      addLog('info', 'process', 'Отправка запроса к серверу...');
      
      const timeoutId = setTimeout(() => {
        addLog('warning', 'process', 'Запрос выполняется дольше ожидаемого...');
      }, 5000);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);

      addLog('info', 'process', `Статус ответа: ${response.status}`);

      // Проверяем тип ответа по заголовкам
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');

      // Если это файл для скачивания
      if (contentDisposition?.includes('attachment') || contentType?.includes('application/json') === false) {
        addLog('info', 'process', 'Получение файла...');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        setProgress(100);
        setStatus('success');
        
        addLog('success', 'complete', '✅ Конвертация успешно завершена!');
        addLog('success', 'complete', `Размер файла: ${(blob.size / 1024).toFixed(2)} KB`);

        // Автоматическое скачивание
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        addLog('success', 'complete', 'Файл скачан автоматически');
        return;
      }

      // Если это JSON ответ (ошибка или данные)
      if (contentType?.includes('application/json')) {
        addLog('info', 'process', 'Обработка JSON ответа...');
        
        // Читаем тело ответа ТОЛЬКО ОДИН РАЗ
        const data = await response.json();

        if (!response.ok) {
          // Это ошибка
          const errorMsg = data.error || data.message || `HTTP ошибка ${response.status}`;
          addLog('error', 'process', `❌ Ошибка сервера: ${errorMsg}`);
          
          if (data.logs) {
            data.logs.forEach((log: any) => {
              addLog(log.level, log.stage, log.message, log.details);
            });
          }
          
          throw new Error(errorMsg);
        }

        // Это успешный JSON с данными
        if (data.logs) {
          data.logs.forEach((log: any) => {
            addLog(log.level, log.stage, log.message, log.details);
            
            if (log.stage === 'dadata') {
              setDadataStats(prev => ({
                requests: prev.requests + 1,
                success: prev.success + (log.level === 'success' ? 1 : 0),
                errors: prev.errors + (log.level === 'error' ? 1 : 0)
              }));
            }
          });
        }

        addLog('success', 'complete', `Конвертация завершена. Обработано записей: ${data.data?.length || 0}`);
        
        // Если есть данные, предлагаем скачать
        if (data.data) {
          const jsonString = JSON.stringify(data.data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          setDownloadUrl(url);
          
          addLog('info', 'complete', 'Данные готовы, нажмите кнопку "Скачать файл снова"');
        }
        
        setProgress(100);
        setStatus('success');
        return;
      }

      // Если неизвестный тип ответа
      throw new Error(`Неизвестный тип ответа: ${contentType}`);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        addLog('warning', 'process', 'Конвертация прервана');
        setStatus('idle');
      } else {
        setStatus('error');
        const msg = error.message || 'Неизвестная ошибка';
        setErrorMessage(msg);
        addLog('error', 'process', `❌ Ошибка: ${msg}`);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Сброс формы
  const handleReset = () => {
    setFile(null);
    setDadataApiKey('');
    setDadataStatus({ status: 'idle' });
    setEnablePostalSearch(true);
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setDownloadUrl('');
    clearLogs();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (downloadUrl) window.URL.revokeObjectURL(downloadUrl);
  };

  // Получение иконки для лога
  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      case 'error': return <XCircle size={14} className="text-red-400" />;
      case 'warning': return <AlertCircle size={14} className="text-yellow-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  // Получение цвета для stage
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'file': return 'text-blue-400';
      case 'parse': return 'text-purple-400';
      case 'dadata': return 'text-green-400';
      case 'process': return 'text-yellow-400';
      case 'complete': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  // Получение иконки статуса DaData
  const getDadataIcon = () => {
    if (!enablePostalSearch) {
      return <WifiOff size={16} className="text-gray-500" />;
    }
    
    switch (dadataStatus.status) {
      case 'checking':
        return <Loader2 size={16} className="animate-spin text-yellow-400" />;
      case 'valid':
        return <Wifi size={16} className="text-green-400" />;
      case 'invalid':
        return <WifiOff size={16} className="text-red-400" />;
      case 'disabled':
        return <WifiOff size={16} className="text-gray-500" />;
      default:
        return <Key size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Конвертер охотничьих данных
            </h1>
            <p className="text-gray-400 text-lg">
              Преобразуйте Excel/CSV файлы в JSON с автоматическим обогащением данных через DaData
            </p>
          </div>

          {/* Кнопка скачивания шаблона */}
          <div className="flex justify-end mb-6">
            <a
              href="/templates/template.xlsx"
              download
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition transform hover:scale-105 shadow-lg"
            >
              <Download size={20} />
              Скачать шаблон XLSX
            </a>
          </div>

          {/* Форма конвертации */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
            {/* Область загрузки файла */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition mb-8
                ${isDragActive ? 'border-green-500 bg-green-500/10' : 'border-gray-600 hover:border-green-500 hover:bg-gray-700/50'}
                ${file ? 'bg-gray-700/30' : ''}`}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 size={48} className="text-green-500" />
                  <div>
                    <p className="text-xl font-medium text-green-400">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="text-sm text-red-400 hover:text-red-300 mt-2"
                  >
                    Удалить файл
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload size={48} className="text-gray-500" />
                  <div>
                    <p className="text-xl font-medium mb-2">
                      {isDragActive ? 'Перетащите файл сюда' : 'Выберите файл или перетащите'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Поддерживаются форматы XLSX, XLS, CSV (макс. 10 МБ)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Настройки конвертации */}
            <div className="space-y-6 mb-8">
              {/* Чекбокс опции */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enablePostalSearch}
                    onChange={(e) => {
                      setEnablePostalSearch(e.target.checked);
                      if (!e.target.checked) {
                        setDadataStatus({ status: 'disabled', message: 'Поиск отключен' });
                      } else if (dadataApiKey) {
                        checkDadataKey(dadataApiKey);
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-gray-300 group-hover:text-white transition flex items-center gap-2">
                    <MapPin size={16} className={enablePostalSearch ? 'text-green-400' : 'text-gray-500'} />
                    Автопоиск почтовых индексов через DaData
                  </span>
                </label>
              </div>

              {/* API ключ DaData с проверкой (показываем только если включен поиск) */}
              {enablePostalSearch && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    {getDadataIcon()}
                    API ключ DaData
                    <a 
                      href="https://dadata.ru/api/#api-key" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:text-green-300 ml-2 flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      получить ключ
                    </a>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={dadataApiKey}
                      onChange={(e) => setDadataApiKey(e.target.value)}
                      placeholder="Введите ваш API ключ"
                      className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition pr-40
                        ${dadataStatus.status === 'invalid' ? 'border-red-500' : 
                          dadataStatus.status === 'valid' ? 'border-green-500' : 'border-gray-600'}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className={`text-sm px-2 py-1 rounded ${
                        dadataStatus.status === 'valid' ? 'bg-green-500/20 text-green-400' :
                        dadataStatus.status === 'invalid' ? 'bg-red-500/20 text-red-400' :
                        dadataStatus.status === 'checking' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-600/50 text-gray-400'
                      }`}>
                        {dadataStatus.status === 'valid' && dadataStatus.balance 
                          ? `${dadataStatus.balance} ₽` 
                          : dadataStatus.status === 'valid' 
                            ? '✓ OK' 
                            : dadataStatus.status === 'checking' 
                              ? 'Проверка...' 
                              : dadataStatus.status === 'invalid'
                                ? 'Ошибка'
                                : 'Ожидание'}
                      </span>
                    </div>
                  </div>
                  {dadataStatus.message && (
                    <p className={`text-sm ${
                      dadataStatus.status === 'valid' ? 'text-green-400' : 
                      dadataStatus.status === 'invalid' ? 'text-red-400' : 'text-gray-400'
                    } flex items-center gap-1 mt-1`}>
                      {dadataStatus.status === 'valid' && <CheckCircle size={14} />}
                      {dadataStatus.status === 'invalid' && <AlertCircle size={14} />}
                      {dadataStatus.message}
                    </p>
                  )}
                </div>
              )}

              {/* Кнопка показа логов */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2"
                >
                  <FileText size={16} />
                  {showLogs ? 'Скрыть' : 'Показать'} процесс конвертации
                </button>
                
                {status === 'converting' && (
                  <button
                    onClick={cancelConversion}
                    className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Отменить
                  </button>
                )}
              </div>
            </div>

            {/* Лог процесса */}
            {showLogs && (
              <div className="mb-8 bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-green-400" />
                    <span className="text-sm font-medium">Лог процесса</span>
                    {dadataStats.requests > 0 && (
                      <span className="text-xs text-gray-400 ml-2">
                        DaData: {dadataStats.success}/{dadataStats.requests} успешных
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearLogs}
                    className="text-xs text-gray-400 hover:text-white transition"
                  >
                    Очистить
                  </button>
                </div>
                <div className="p-4 font-mono text-xs h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      Нет записей. Начните конвертацию...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div 
                          key={log.id} 
                          className={`flex items-start gap-2 border-l-2 pl-2 py-1
                            ${log.level === 'error' ? 'border-red-500' : 
                              log.level === 'success' ? 'border-green-500' : 
                              log.level === 'warning' ? 'border-yellow-500' : 'border-gray-600'}`}
                        >
                          <div className="flex-shrink-0 w-16 text-gray-500">
                            {log.timestamp}
                          </div>
                          <div className="flex-shrink-0 mt-0.5">
                            {getLogIcon(log.level)}
                          </div>
                          <div className="flex-1">
                            <span className={`${getStageColor(log.stage)} font-medium`}>
                              [{log.stage}]
                            </span>
                            <span className={`ml-2 ${
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'success' ? 'text-green-400' :
                              log.level === 'warning' ? 'text-yellow-400' :
                              'text-gray-300'
                            }`}>
                              {log.message}
                            </span>
                            {log.details && (
                              <div className="text-gray-500 text-xs mt-1 ml-4">
                                {JSON.stringify(log.details)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Кнопка конвертации */}
            <button
              onClick={handleConvert}
              disabled={!file || status === 'converting' || (enablePostalSearch && dadataStatus.status !== 'valid')}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {status === 'converting' ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Конвертация... {progress}%
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle2 size={24} />
                  Готово! Файл скачан
                </>
              ) : (
                <>
                  <FileJson size={24} />
                  Начать конвертацию
                </>
              )}
            </button>

            {/* Прогресс бар */}
            {status === 'converting' && (
              <div className="mt-6">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Сообщение об ошибке */}
            {status === 'error' && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Ссылка на повторное скачивание */}
            {status === 'success' && downloadUrl && (
              <div className="mt-6 text-center">
                <a
                  href={downloadUrl}
                  download={`converted_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`}
                  className="text-green-400 hover:text-green-300 underline flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Скачать файл снова
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
