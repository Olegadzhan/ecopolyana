// src/app/sunting/page.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { 
  Download, Upload, MapPin, Building2, 
  Key, Loader2, FileJson, CheckCircle2, 
  AlertCircle, FileQuestion 
} from 'lucide-react';

// Типы для данных
type Region = {
  code: string;
  name: string;
};

type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

export default function SmartHuntingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [dadataApiKey, setDadataApiKey] = useState<string>('');
  const [enablePostalSearch, setEnablePostalSearch] = useState<boolean>(true);
  const [enableOktmo, setEnableOktmo] = useState<boolean>(true);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isTemplateAvailable, setIsTemplateAvailable] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка списка регионов и проверка шаблона при монтировании
  useEffect(() => {
    fetchRegions();
    checkTemplateExistence();
  }, []);

  // Проверка существования файла шаблона
  const checkTemplateExistence = async () => {
    try {
      const response = await fetch('/templates/шаблон.xlsx', { method: 'HEAD' });
      setIsTemplateAvailable(response.ok);
    } catch {
      setIsTemplateAvailable(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await fetch('/api/regions');
      if (!response.ok) throw new Error('Ошибка загрузки регионов');
      const data = await response.json();
      setRegions(data);
    } catch (error) {
      console.error('Ошибка загрузки регионов:', error);
      // Заглушка на случай ошибки API
      setRegions([
        { code: '77', name: 'Москва' },
        { code: '78', name: 'Санкт-Петербург' },
        { code: '50', name: 'Московская область' },
      ]);
    }
  };

  // Обработчик загрузки файла
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setErrorMessage('');
      setDownloadUrl('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Обработчик конвертации
  const handleConvert = async () => {
    if (!file) {
      setErrorMessage('Пожалуйста, выберите файл');
      return;
    }

    setStatus('converting');
    setProgress(0);
    setErrorMessage('');
    setDownloadUrl('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('regionCode', selectedRegion);
    formData.append('dadataApiKey', dadataApiKey);
    formData.append('enablePostalSearch', String(enablePostalSearch));
    formData.append('enableOktmo', String(enableOktmo));

    try {
      // Используем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Проверка на ошибки HTTP
      if (!response.ok) {
        let errorText = `HTTP ошибка ${response.status}`;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.details || errorText;
        } catch {
          // Если не JSON, пробуем текст
          const text = await response.text();
          if (text) errorText = text;
        }
        throw new Error(errorText);
      }

      // Проверяем, что пришёл именно файл, а не JSON с ошибкой
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.error) throw new Error(data.error);
      }

      // Получаем blob и создаём ссылку
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(100);
      setStatus('success');

      // Автоматическое скачивание
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // НЕ освобождаем URL сразу, чтобы ссылка "Скачать снова" работала

    } catch (error) {
      setStatus('error');
      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage('Превышено время ожидания. Попробуйте файл меньшего размера.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Неизвестная ошибка');
      }
      setProgress(0);
    }
  };

  // Сброс формы
  const handleReset = () => {
    setFile(null);
    setSelectedRegion('');
    setDadataApiKey('');
    setEnablePostalSearch(true);
    setEnableOktmo(true);
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
    setDownloadUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Освобождаем URL при сбросе
    if (downloadUrl) window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Навигация */}
      <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Экополяна
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/map" className="hover:text-green-400 transition flex items-center gap-2">
              <MapPin size={18} /> Карта
            </Link>
            <Link href="/tech" className="hover:text-green-400 transition flex items-center gap-2">
              <Building2 size={18} /> Технологии
            </Link>
            <Link href="/smart-hunting" className="text-green-400 border-b-2 border-green-400 pb-1 flex items-center gap-2">
              <FileJson size={18} /> Умная охота
            </Link>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Конвертер охотничьих данных
            </h1>
            <p className="text-gray-400 text-lg">
              Преобразуйте XLSX файлы в JSON с автоматическим обогащением данных
            </p>
          </div>

          {/* Кнопка скачивания шаблона с проверкой наличия */}
          <div className="flex justify-end mb-6">
            {isTemplateAvailable ? (
              <a
                href="/templates/шаблон.xlsx"
                download
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition transform hover:scale-105 shadow-lg"
              >
                <Download size={20} />
                Скачать шаблон XLSX
              </a>
            ) : (
              <div className="flex items-center gap-3 text-yellow-500 bg-yellow-500/10 px-6 py-3 rounded-lg border border-yellow-500/30">
                <FileQuestion size={20} />
                <span className="text-sm">Файл шаблона временно недоступен</span>
              </div>
            )}
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
                      Поддерживаются форматы XLSX, XLS (макс. 10 МБ)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Настройки конвертации */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Регион */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <MapPin size={16} className="text-green-400" />
                  Код региона
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
                >
                  <option value="">Выберите регион</option>
                  {regions.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.code} - {region.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* API ключ DaData */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <Key size={16} className="text-green-400" />
                  API ключ DaData (опционально)
                </label>
                <input
                  type="password"
                  value={dadataApiKey}
                  onChange={(e) => setDadataApiKey(e.target.value)}
                  placeholder="Введите ваш API ключ"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
                />
              </div>

              {/* Чекбоксы опций */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enablePostalSearch}
                    onChange={(e) => setEnablePostalSearch(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-gray-300 group-hover:text-white transition flex items-center gap-2">
                    <MapPin size={16} className="text-green-400" />
                    Автопоиск почтовых индексов
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={enableOktmo}
                    onChange={(e) => setEnableOktmo(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                  />
                  <span className="text-gray-300 group-hover:text-white transition flex items-center gap-2">
                    <Building2 size={16} className="text-green-400" />
                    Добавить коды ОКТМО
                  </span>
                </label>
              </div>

              {/* Информация о справочнике */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <p className="text-sm text-gray-400 flex items-start gap-2">
                  <AlertCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Поиск индексов сначала выполняется по локальному справочнику, затем через DaData
                  </span>
                </p>
              </div>
            </div>

            {/* Кнопка конвертации */}
            <button
              onClick={handleConvert}
              disabled={!file || status === 'converting'}
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

          {/* Информационные блоки */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-2">50+</div>
              <div className="text-gray-400">Локаций</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-2">24/7</div>
              <div className="text-gray-400">Мониторинг</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-3xl mb-2">AI</div>
              <div className="text-gray-400">Технологии</div>
            </div>
          </div>

          {/* Технологические теги */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm">
            <span className="px-4 py-2 bg-gray-800 rounded-full border border-gray-700">🌱 Экология</span>
            <span className="px-4 py-2 bg-gray-800 rounded-full border border-gray-700">🤖 AI/ML</span>
            <span className="px-4 py-2 bg-gray-800 rounded-full border border-gray-700">🚁 Дроны</span>
            <span className="px-4 py-2 bg-gray-800 rounded-full border border-gray-700">🧬 Биотех</span>
          </div>
        </div>
      </main>
    </div>
  );
}
