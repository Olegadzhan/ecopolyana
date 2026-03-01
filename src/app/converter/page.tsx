// src/app/converter/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hunters: any[]; tickets: any[] } | null>(null);
  const [useDadata, setUseDadata] = useState(true);
  const [includePostal, setIncludePostal] = useState(true);
  const [includeOktmo, setIncludeOktmo] = useState(false);
  const [regionCode, setRegionCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
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
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при конвертации');
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
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-emerald-900 text-white py-20">
      <div className="container mx-auto px-4">
        <motion.h1 
          className="text-5xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🚀 Конвертер охотничьих билетов
        </motion.h1>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & drop зона */}
            <div className="border-2 border-dashed border-emerald-500 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-lg mb-2">
                  {file ? file.name : 'Нажмите для выбора файла'}
                </p>
                <p className="text-sm text-emerald-300">
                  Поддерживаются форматы: .xlsx, .xls, .csv
                </p>
              </label>
            </div>

            {/* Настройки */}
            <div className="bg-emerald-800/30 rounded-lg p-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">⚙️ Настройки конвертации</h3>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={useDadata}
                  onChange={(e) => setUseDadata(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-emerald-500"
                />
                <span>Использовать DaData для поиска индексов</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includePostal}
                  onChange={(e) => setIncludePostal(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-emerald-500"
                />
                <span>Включить почтовые индексы</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeOktmo}
                  onChange={(e) => setIncludeOktmo(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-emerald-500"
                />
                <span>Включить коды ОКТМО</span>
              </label>

              <div>
                <label className="block mb-2">Код региона (опционально):</label>
                <input
                  type="text"
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  placeholder="например: 77"
                  className="w-full px-4 py-2 bg-emerald-900/50 border border-emerald-600 rounded-lg text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 rounded-lg font-semibold text-lg transition-colors"
            >
              {loading ? '⏳ Конвертация...' : '🚀 Начать конвертацию'}
            </button>
          </form>

          {/* Результаты */}
          {result && (
            <motion.div 
              className="mt-8 bg-emerald-800/30 rounded-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4">✅ Конвертация завершена!</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => downloadJSON(result.hunters, 'hunters.json')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  📥 Скачать hunters.json
                </button>
                <button
                  onClick={() => downloadJSON(result.tickets, 'huntingtickets.json')}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  📥 Скачать huntingtickets.json
                </button>
              </div>
              <p className="mt-4 text-center text-emerald-300">
                Найдено {result.hunters?.length || 0} записей
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
