'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Настройки конвертации
  const [useDadata, setUseDadata] = useState(true);
  const [includePostal, setIncludePostal] = useState(true);
  const [includeOktmo, setIncludeOktmo] = useState(false);
  const [regionCode, setRegionCode] = useState('');

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

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
    
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Фоновые элементы */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 items-center w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
            style={{ textShadow: '0 0 40px rgba(74, 222, 128, 0.6), 0 0 80px rgba(34, 211, 238, 0.4)' }}
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
          >
            Умная охота
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
          >
          Конвертер охотничьих данных
          </motion.p>
          {/* Основная карточка конвертера */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 md:p-12">
              {/* Drag & Drop зона */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-emerald-400 bg-emerald-500/10' 
                    : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'
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
                
                <div className="text-7xl mb-4">
                  {file ? '📄' : '📁'}
                </div>
                
                <p className="text-2xl font-semibold mb-2">
                  {file ? file.name : 'Выберите файл'}
                </p>
                
                {file && (
                  <p className="text-emerald-400 mb-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
                
                <p className="text-gray-500">
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

              {/* Настройки конвертации */}
              <div className="mt-8 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* DaData */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                    <input
                      type="checkbox"
                      checked={useDadata}
                      onChange={(e) => setUseDadata(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-white/10"
                    />
                    <div>
                      <span className="font-medium block">🌐 DaData</span>
                      <span className="text-sm text-gray-500">
                        Автопоиск индексов
                      </span>
                    </div>
                  </label>

                  {/* Почтовые индексы */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                    <input
                      type="checkbox"
                      checked={includePostal}
                      onChange={(e) => setIncludePostal(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-white/10"
                    />
                    <div>
                      <span className="font-medium block">📮 Почтовые индексы</span>
                      <span className="text-sm text-gray-500">
                        Включить в выходные данные
                      </span>
                    </div>
                  </label>

                  {/* ОКТМО */}
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                    <input
                      type="checkbox"
                      checked={includeOktmo}
                      onChange={(e) => setIncludeOktmo(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-white/10"
                    />
                    <div>
                      <span className="font-medium block">🏛️ Коды ОКТМО</span>
                      <span className="text-sm text-gray-500">
                        Коды муниципальных образований
                      </span>
                    </div>
                  </label>

                  {/* Регион */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <label className="block">
                      <span className="font-medium block mb-2">📍 Код региона</span>
                      <input
                        type="text"
                        value={regionCode}
                        onChange={(e) => setRegionCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        placeholder="77"
                        maxLength={2}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Ошибка */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200"
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
                onClick={handleSubmit}
                disabled={!file || loading}
                className={`w-full mt-6 py-6 rounded-xl font-bold text-xl transition-all ${
                  !file || loading
                    ? 'bg-gray-800 cursor-not-allowed text-gray-500'
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

              {/* Результаты */}
              <AnimatePresence>
                {result?.success && result.hunters && result.tickets && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8"
                  >
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
                          ✅
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">Конвертация завершена!</h3>
                          <p className="text-gray-500">
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
                        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                      >
                        🔄 Конвертировать другой файл
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Статистика в стиле главной страницы */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-16 text-center"
          >
            <div>
              <div className="text-4xl font-bold text-emerald-400">50+</div>
              <div className="text-gray-500 mt-2">Локаций</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400">24/7</div>
              <div className="text-gray-500 mt-2">Мониторинг</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400">AI</div>
              <div className="text-gray-500 mt-2">Технологии</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-emerald-400">JSON</div>
              <div className="text-gray-500 mt-2">Конвертер</div>
            </div>
          </motion.div>

          {/* Технологии в стиле главной страницы */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mt-16 text-2xl"
          >
            <span className="px-6 py-3 bg-white/5 rounded-full border border-white/10">🌱 Экология</span>
            <span className="px-6 py-3 bg-white/5 rounded-full border border-white/10">🤖 AI/ML</span>
            <span className="px-6 py-3 bg-white/5 rounded-full border border-white/10">🚁 Дроны</span>
            <span className="px-6 py-3 bg-white/5 rounded-full border border-white/10">🧬 Биотех</span>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
