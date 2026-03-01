'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Интерфейс для результата конвертации
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

export default function SmartHuntingPage() {
  // Состояния для файла и загрузки
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Состояния для настроек (ПОЛНОСТЬЮ СООТВЕТСТВУЮТ converter_unified.py)
  const [useDadata, setUseDadata] = useState(true);
  const [includePostal, setIncludePostal] = useState(true);
  const [includeOktmo, setIncludeOktmo] = useState(false);
  const [regionCode, setRegionCode] = useState('');

  // --- Обработчики Drag & Drop ---
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && /\.(xlsx|xls|csv)$/i.test(droppedFile.name)) {
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

  // --- Отправка формы на API ---
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

  // --- Скачивание JSON ---
  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Сброс формы ---
  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-900 to-teal-900 text-white">
      {/* Декоративные фоновые элементы (как на других страницах) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* Навигация (как на главной) */}
      <nav className="relative z-10 border-b border-emerald-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              🌿 Экополяна
            </Link>
            <div className="flex gap-6">
              <Link href="/map" className="hover:text-emerald-300 transition">🗺️ Карта</Link>
              <Link href="/tech" className="hover:text-emerald-300 transition">⚡ Технологии</Link>
              <Link href="/about" className="hover:text-emerald-300 transition">ℹ️ О проекте</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Основной контент - стилизован как диалоговое окно */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Заголовок страницы в стиле "Умная охота" */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              🦌 Умная охота
            </h1>
            <p className="text-emerald-200/80 text-lg">
              Конвертер охотничьих данных с обогащением через DaData и FIAS
            </p>
          </div>

          {/* КАРТОЧКА-ДИАЛОГ с конвертером */}
          <motion.div
            className="bg-emerald-900/40 backdrop-blur-md rounded-3xl border border-emerald-700/50 shadow-2xl overflow-hidden"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Верхняя полоса диалога (имитация окна) */}
            <div className="bg-emerald-800/60 px-6 py-3 flex items-center gap-2 border-b border-emerald-700/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="text-sm text-emerald-300/70 ml-2">Конвертер данных</span>
            </div>

            {/* Тело диалога - ФОРМА КОНВЕРТЕРА */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Drag & Drop зона (стилизована) */}
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    dragActive 
                      ? 'border-emerald-400 bg-emerald-500/10 scale-[1.02]' 
                      : 'border-emerald-700/50 hover:border-emerald-500/50 hover:bg-emerald-800/20'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-7xl mb-4"
                  >
                    {file ? '📄' : '📁'}
                  </motion.div>
                  
                  <p className="text-2xl font-semibold mb-2">
                    {file ? file.name : 'Выберите файл'}
                  </p>
                  
                  {file && (
                    <p className="text-emerald-300 mb-2">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  
                  <p className="text-emerald-300/70">
                    {file ? 'Нажмите чтобы выбрать другой' : 'или перетащите файл сюда'}
                  </p>

                  {file && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="absolute top-4 right-4 p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Настройки конвертации (ПОЛНОСТЬЮ СООТВЕТСТВУЮТ converter_unified.py) */}
                <div className="bg-emerald-800/30 rounded-xl p-6 space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                    <span className="text-2xl">⚙️</span>
                    Настройки интеграций
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* DaData */}
                    <label className="flex items-start gap-3 p-4 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/30 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useDadata}
                        onChange={(e) => setUseDadata(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-medium block">🌐 DaData</span>
                        <span className="text-sm text-emerald-300/70">
                          Автопоиск индексов
                        </span>
                      </div>
                    </label>

                    {/* Почтовые индексы */}
                    <label className="flex items-start gap-3 p-4 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/30 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includePostal}
                        onChange={(e) => setIncludePostal(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-medium block">📮 Почтовые индексы</span>
                        <span className="text-sm text-emerald-300/70">
                          Включить в выходные данные
                        </span>
                      </div>
                    </label>

                    {/* ОКТМО */}
                    <label className="flex items-start gap-3 p-4 rounded-lg bg-emerald-800/20 hover:bg-emerald-800/30 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOktmo}
                        onChange={(e) => setIncludeOktmo(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-medium block">🏛️ Коды ОКТМО</span>
                        <span className="text-sm text-emerald-300/70">
                          Коды муниципальных образований
                        </span>
                      </div>
                    </label>

                    {/* Регион */}
                    <div className="p-4 rounded-lg bg-emerald-800/20">
                      <label className="block">
                        <span className="font-medium block mb-2">📍 Код региона</span>
                        <input
                          type="text"
                          value={regionCode}
                          onChange={(e) => setRegionCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          placeholder="77"
                          maxLength={2}
                          className="w-full px-4 py-2 bg-emerald-900/50 border border-emerald-700 rounded-lg text-white placeholder-emerald-700/50 focus:border-emerald-500 focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Информация о ключах (в стиле smart-hunting) */}
                  <div className="mt-4 p-4 bg-emerald-900/30 rounded-lg text-sm text-emerald-300/70">
                    <p className="flex items-center gap-2">
                      <span>🔑</span>
                      DaData API ключ настраивается в файле .env.local
                    </p>
                    <p className="flex items-center gap-2 mt-1">
                      <span>📚</span>
                      Документация: dadata.ru/api | fias.nalog.ru
                    </p>
                  </div>
                </div>

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

                {/* Кнопка конвертации */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!file || loading}
                  className={`w-full py-6 rounded-xl font-bold text-xl transition-all ${
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

              {/* Результаты конвертации */}
              <AnimatePresence>
                {result?.success && result.hunters && result.tickets && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 bg-emerald-800/30 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
                        ✅
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Конвертация завершена!</h3>
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

                    <button
                      onClick={resetForm}
                      className="w-full py-3 rounded-xl bg-emerald-800/50 hover:bg-emerald-700/50 transition-colors"
                    >
                      🔄 Конвертировать другой файл
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Дополнительные возможности API (как на старой smart-hunting) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid md:grid-cols-2 gap-8"
          >
            <div className="bg-emerald-900/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-800/50">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🌐</span> Dadata
              </h3>
              <ul className="space-y-2 text-emerald-300/80">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Автодополнение адресов при вводе
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Определение охотничьих угодий по координатам
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Валидация лицензий и разрешений
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Геокодирование для нанесения на карту
                </li>
              </ul>
            </div>

            <div className="bg-emerald-900/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-800/50">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🏛️</span> FIAS (ФНС)
              </h3>
              <ul className="space-y-2 text-emerald-300/80">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Официальная верификация адресов охотхозяйств
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Получение кодов ОКАТО/ОКТМО для отчётности
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Сопоставление с реестром охотничьих угодий
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Интеграция с государственными реестрами
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-800/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-emerald-300/50 text-sm">
          © 2024 Экополяна. Технологии будущего для устойчивого развития.
        </div>
      </footer>
    </div>
  );
}
