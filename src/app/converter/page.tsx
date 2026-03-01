'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Типы данных
interface ConversionResult {
  success: boolean;
  hunters?: any[];
  tickets?: any[];
  stats?: {
    huntersCount: number;
    ticketsCount: number;
    useDadata: boolean;
    includePostal: boolean;
    includeOktmo: boolean;
    regionCode: string | null;
  };
  error?: string;
}

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Настройки
  const [useDadata, setUseDadata] = useState(true);
  const [includePostal, setIncludePostal] = useState(true);
  const [includeOktmo, setIncludeOktmo] = useState(false);
  const [regionCode, setRegionCode] = useState('');

  // Обработка drag & drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Пожалуйста, выберите файл в формате .xlsx, .xls или .csv');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Выберите файл для конвертации');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('useDadata', String(useDadata));
    formData.append('includePostal', String(includePostal));
    formData.append('includeOktmo', String(includeOktmo));
    formData.append('regionCode', regionCode);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Произошла ошибка при конвертации');
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-teal-900 text-white">
      {/* Фоновый эффект */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Навигация */}
      <nav className="relative z-10 border-b border-emerald-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              🌿 Экополяна
            </Link>
            <Link 
              href="/" 
              className="px-4 py-2 rounded-lg bg-emerald-800/50 hover:bg-emerald-700/50 transition-colors"
            >
              ← На главную
            </Link>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              🚀 Конвертер охотничьих билетов
            </h1>
            <p className="text-emerald-200/80 text-lg">
              Загрузите Excel или CSV файл для конвертации в JSON формат
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Drag & Drop зона */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive 
                  ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]' 
                  : 'border-emerald-700/50 hover:border-emerald-500/50 hover:bg-emerald-800/20'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              
              <label htmlFor="file-upload" className="cursor-pointer block">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="text-7xl mb-4"
                >
                  📁
                </motion.div>
                
                <p className="text-2xl font-semibold mb-2">
                  {file ? file.name : 'Нажмите для выбора файла'}
                </p>
                
                {file && (
                  <p className="text-emerald-300 mb-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
                
                <p className="text-emerald-300/70">
                  или перетащите файл сюда
                </p>
              </label>

              {file && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                >
                  ✕
                </motion.button>
              )}
            </div>

            {/* Настройки */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-emerald-900/30 backdrop-blur-sm rounded-2xl p-8 border border-emerald-800/50 space-y-6"
            >
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span className="text-3xl">⚙️</span>
                Настройки конвертации
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* DaData */}
                <label className="flex items-start gap-3 p-4 rounded-xl bg-emerald-800/20 hover:bg-emerald-800/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDadata}
                    onChange={(e) => setUseDadata(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium block">🌐 Использовать DaData</span>
                    <span className="text-sm text-emerald-300/70">
                      Автоматический поиск почтовых индексов
                    </span>
                  </div>
                </label>

                {/* Почтовые индексы */}
                <label className="flex items-start gap-3 p-4 rounded-xl bg-emerald-800/20 hover:bg-emerald-800/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePostal}
                    onChange={(e) => setIncludePostal(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium block">📮 Почтовые индексы</span>
                    <span className="text-sm text-emerald-300/70">
                      Включить индексы в выходные данные
                    </span>
                  </div>
                </label>

                {/* ОКТМО */}
                <label className="flex items-start gap-3 p-4 rounded-xl bg-emerald-800/20 hover:bg-emerald-800/30 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeOktmo}
                    onChange={(e) => setIncludeOktmo(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-medium block">🏛️ Коды ОКТМО</span>
                    <span className="text-sm text-emerald-300/70">
                      Добавить коды муниципальных образований
                    </span>
                  </div>
                </label>

                {/* Регион */}
                <div className="p-4 rounded-xl bg-emerald-800/20">
                  <label className="block">
                    <span className="font-medium block mb-2">📍 Код региона (опционально)</span>
                    <input
                      type="text"
                      value={regionCode}
                      onChange={(e) => setRegionCode(e.target.value)}
                      placeholder="например: 77"
                      maxLength={2}
                      className="w-full px-4 py-2 bg-emerald-900/50 border border-emerald-700 rounded-lg text-white placeholder-emerald-700/50 focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            </motion.div>

            {/* Ошибка */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200"
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Кнопка отправки */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!file || loading}
              className={`w-full py-6 rounded-2xl font-bold text-xl transition-all ${
                !file || loading
                  ? 'bg-gray-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Конвертация...
                </span>
              ) : (
                '🚀 Начать конвертацию'
              )}
            </motion.button>
          </form>

          {/* Результаты */}
          <AnimatePresence>
            {result?.success && result.hunters && result.tickets && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 bg-emerald-900/30 backdrop-blur-sm rounded-2xl p-8 border border-emerald-800/50"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
                    ✅
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Конвертация завершена!</h2>
                    <p className="text-emerald-300/70">
                      Найдено {result.stats?.huntersCount || 0} записей
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => downloadJSON(result.hunters, 'hunters.json')}
                    className="p-6 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all text-left"
                  >
                    <div className="text-4xl mb-2">📄</div>
                    <div className="font-semibold">hunters.json</div>
                    <div className="text-sm text-blue-200">
                      {result.stats?.huntersCount} записей
                    </div>
                  </button>

                  <button
                    onClick={() => downloadJSON(result.tickets, 'huntingtickets.json')}
                    className="p-6 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all text-left"
                  >
                    <div className="text-4xl mb-2">🎫</div>
                    <div className="font-semibold">huntingtickets.json</div>
                    <div className="text-sm text-purple-200">
                      {result.stats?.ticketsCount} записей
                    </div>
                  </button>
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {result.stats?.useDadata && (
                    <div className="p-3 rounded-lg bg-emerald-800/30 text-center">
                      <div className="text-2xl mb-1">🌐</div>
                      <div className="text-sm">DaData</div>
                      <div className="text-xs text-emerald-300/70">включен</div>
                    </div>
                  )}
                  {result.stats?.includePostal && (
                    <div className="p-3 rounded-lg bg-emerald-800/30 text-center">
                      <div className="text-2xl mb-1">📮</div>
                      <div className="text-sm">Индексы</div>
                      <div className="text-xs text-emerald-300/70">добавлены</div>
                    </div>
                  )}
                  {result.stats?.includeOktmo && (
                    <div className="p-3 rounded-lg bg-emerald-800/30 text-center">
                      <div className="text-2xl mb-1">🏛️</div>
                      <div className="text-sm">ОКТМО</div>
                      <div className="text-xs text-emerald-300/70">добавлены</div>
                    </div>
                  )}
                  {result.stats?.regionCode && (
                    <div className="p-3 rounded-lg bg-emerald-800/30 text-center">
                      <div className="text-2xl mb-1">📍</div>
                      <div className="text-sm">Регион</div>
                      <div className="text-xs text-emerald-300/70">{result.stats.regionCode}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={resetForm}
                  className="w-full py-3 rounded-xl bg-emerald-800/50 hover:bg-emerald-700/50 transition-colors"
                >
                  🔄 Конвертировать другой файл
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-800/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-emerald-300/50 text-sm">
          © 2024 Экополяна. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
