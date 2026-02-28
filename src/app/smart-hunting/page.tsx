// src/app/smart-hunting/page.tsx
'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Database, MapPin, Search, Settings, Info } from 'lucide-react';
import Image from 'next/image';

// ============================================
// ТИПЫ
// ============================================
interface ConversionResult {
  success: boolean;
  data?: any[];
  errors?: string[];
  statistics?: {
    total: number;
    processed: number;
    enriched: number;
    failed: number;
  };
}

interface DadataSuggestion {
  value: string;
  unparsed_parts?: {
    region?: string;
    city?: string;
    street?: string;
    house?: string;
  };
  geo_lat?: string;
  geo_lon?: string;
  confidence?: number;
}

interface FiasAddress {
  aoid: string;
  formalname: string;
  shortname?: string;
  regioncode?: string;
  okato?: string;
  latitude?: string;
  longitude?: string;
}

// ============================================
// КОНВЕРТЕР КОМПОНЕНТ
// ============================================
export default function SmartHuntingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dadataKey, setDadataKey] = useState('');
  const [fiasEndpoint, setFiasEndpoint] = useState('https://fias.nalog.ru/api');
  const [useDadata, setUseDadata] = useState(true);
  const [useFias, setUseFias] = useState(false);
  const [enrichmentOptions, setEnrichmentOptions] = useState({
    standardizeAddresses: true,
    addCoordinates: true,
    addRegionCodes: true,
    validateHuntingZones: true,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // ФУНКЦИИ КОНВЕРТЕРА
  // ============================================

  // 📥 Загрузка файла
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    // Проверка типа
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!validTypes.includes(uploadedFile.type)) {
      alert('Пожалуйста, загрузите файл .xls или .xlsx');
      return;
    }
    
    setFile(uploadedFile);
    parseXLSX(uploadedFile);
  }, []);

  // 📊 Парсинг XLSX (упрощённая реализация)
  const parseXLSX = async (file: File) => {
    try {
      // В продакшене используйте библиотеку xlsx или sheetjs
      // Здесь имитация для демонстрации
      const mockData = [
        { id: 1, location: 'Ленинградская обл., Приозерский р-н', species: 'Лось', count: 12, date: '2024-03-15' },
        { id: 2, location: 'Карелия, Сортавальский р-н', species: 'Олень', count: 8, date: '2024-03-16' },
        { id: 3, location: 'Мурманская обл., Кандалакшский р-н', species: 'Кабан', count: 5, date: '2024-03-17' },
      ];
      setPreview(mockData);
    } catch (error) {
      console.error('Parse error:', error);
      alert('Ошибка при чтении файла');
    }
  };

  // 🔍 Обогащение через Dadata API
  const enrichWithDadata = async (address: string): Promise<DadataSuggestion | null> => {
    if (!dadataKey || !useDadata) return null;
    
    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${dadataKey}`,
        },
        body: JSON.stringify({ query: address, count: 1 }),
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.suggestions?.[0] || null;
    } catch {
      return null;
    }
  };

  // 🗺️ Проверка через FIAS API
  const verifyWithFias = async (address: string): Promise<FiasAddress | null> => {
    if (!useFias) return null;
    
    try {
      // FIAS API требует авторизации через ЕСИА
      // Здесь пример структуры запроса
      const response = await fetch(`${fiasEndpoint}/addresses/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: address,
          region_code: null,
          limit: 1 
        }),
      });
      
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  // ⚙️ Основная конвертация
  const handleConvert = useCallback(async () => {
    if (!file || preview.length === 0) return;
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const enrichedData = [];
      let enrichedCount = 0;
      let failedCount = 0;
      
      for (const row of preview) {
        let enrichedRow = { ...row };
        
        // Обогащение адреса через Dadata
        if (enrichmentOptions.standardizeAddresses && row.location) {
          const dadataResult = await enrichWithDadata(row.location);
          if (dadataResult) {
            enrichedRow.address_standardized = dadataResult.value;
            enrichedRow.address_parts = dadataResult.unparsed_parts;
            enrichedCount++;
          }
        }
        
        // Добавление координат
        if (enrichmentOptions.addCoordinates) {
          const coords = dadataResult?.geo_lat && dadataResult?.geo_lon 
            ? { lat: parseFloat(dadataResult.geo_lat), lon: parseFloat(dadataResult.geo_lon) }
            : null;
          if (coords) {
            enrichedRow.coordinates = coords;
          }
        }
        
        // Проверка через FIAS
        if (enrichmentOptions.validateHuntingZones && useFias) {
          const fiasResult = await verifyWithFias(row.location);
          if (fiasResult) {
            enrichedRow.fias_verified = true;
            enrichedRow.fias_code = fiasResult.aoid;
            enrichedRow.region_okato = fiasResult.okato;
          }
        }
        
        // Добавление мета-данных
        enrichedRow.processed_at = new Date().toISOString();
        enrichedRow.source_file = file.name;
        
        enrichedData.push(enrichedRow);
      }
      
      setResult({
        success: true,
        data: enrichedData,
        statistics: {
          total: preview.length,
          processed: preview.length,
          enriched: enrichedCount,
          failed: failedCount,
        },
      });
      
    } catch (error) {
      console.error('Conversion error:', error);
      setResult({
        success: false,
        errors: ['Ошибка при конвертации. Проверьте подключение к API.'],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, preview, dadataKey, useDadata, useFias, enrichmentOptions]);

  // 💾 Скачивание результата
  const downloadJSON = useCallback(() => {
    if (!result?.data) return;
    
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecopolyana-hunting-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result]);

  // 📥 Скачивание шаблона
  const downloadTemplate = useCallback(() => {
    // Создаём пример шаблона в JSON (в продакшене — реальный .xlsx файл)
    const template = [
      { id: 1, location: 'Область, район, населённый пункт', species: 'Вид животного', count: 0, date: 'YYYY-MM-DD' },
      { id: 2, location: 'Ленинградская обл., Приозерский р-н', species: 'Лось', count: 12, date: '2024-03-15' },
    ];
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'шаблон_охотничьих_данных.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // ============================================
  // JSX РЕНДЕР
  // ============================================
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Фоновые эффекты */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }} />
      </div>

      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Заголовок */}
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-4">
              <span>🦌</span> Умная охота
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Конвертер охотничьих данных
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Преобразование XLS-отчётов в структурированный JSON с обогащением через Dadata и FIAS
            </p>
          </motion.div>

          {/* Панель настроек API */}
          <motion.div className="glass-panel p-6 rounded-2xl mb-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Settings size={20} className="text-emerald-400" />
              Настройки интеграций
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Dadata */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Dadata API</p>
                      <p className="text-xs text-gray-500">Стандартизация адресов</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={useDadata} onChange={(e) => setUseDadata(e.target.checked)} 
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-cyan-500" />
                </label>
                
                {useDadata && (
                  <input
                    type="password"
                    value={dadataKey}
                    onChange={(e) => setDadataKey(e.target.value)}
                    placeholder="Введите API-ключ Dadata"
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 text-sm focus:border-cyan-500 focus:outline-none"
                  />
                )}
                <p className="text-xs text-gray-500">
                  Получите ключ: <a href="https://dadata.ru/api/" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">dadata.ru/api</a>
                </p>
              </div>
              
              {/* FIAS */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">FIAS (ФНС)</p>
                      <p className="text-xs text-gray-500">Верификация адресов</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={useFias} onChange={(e) => setUseFias(e.target.checked)} 
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500" />
                </label>
                
                {useFias && (
                  <input
                    type="text"
                    value={fiasEndpoint}
                    onChange={(e) => setFiasEndpoint(e.target.value)}
                    placeholder="https://fias.nalog.ru/api"
                    className="w-full px-4 py-2 rounded-lg bg-black/50 border border-gray-700 text-sm focus:border-purple-500 focus:outline-none"
                  />
                )}
                <p className="text-xs text-gray-500">
                  Документация: <a href="https://fias.nalog.ru/Frontend" target="_blank" rel="noopener" className="text-purple-400 hover:underline">fias.nalog.ru</a>
                </p>
              </div>
            </div>
            
            {/* Опции обогащения */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm font-medium text-gray-300 mb-3">Опции обработки:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'standardizeAddresses', label: 'Стандартизация адресов' },
                  { key: 'addCoordinates', label: 'Добавить координаты' },
                  { key: 'addRegionCodes', label: 'Коды регионов (ОКАТО)' },
                  { key: 'validateHuntingZones', label: 'Проверка охотничьих зон' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={enrichmentOptions[opt.key as keyof typeof enrichmentOptions]}
                      onChange={(e) => setEnrichmentOptions({
                        ...enrichmentOptions,
                        [opt.key]: e.target.checked
                      })}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Загрузка файла */}
          <motion.div className="glass-panel p-8 rounded-2xl mb-6 border border-white/10 text-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            
            {!file ? (
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center border-2 border-dashed border-green-500/40">
                  <Upload size={32} className="text-green-400" />
                </div>
                <p className="text-lg font-medium text-white mb-2">Загрузите XLS-файл</p>
                <p className="text-sm text-gray-400 mb-4">Поддерживаются .xls и .xlsx</p>
                <button className="btn-primary px-6 py-2">Выбрать файл</button>
              </label>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FileSpreadsheet size={24} className="text-green-400" />
                  <span className="font-medium">{file.name}</span>
                  <button onClick={() => { setFile(null); setPreview([]); }} className="text-red-400 hover:text-red-300">✕</button>
                </div>
                <p className="text-sm text-gray-400 mb-4">{preview.length} строк для обработки</p>
                <button 
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="btn-primary px-8 py-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Обработка...</span>
                  ) : (
                    'Конвертировать в JSON'
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Превью данных */}
          {preview.length > 0 && !result && (
            <motion.div className="glass-panel p-6 rounded-2xl mb-6 border border-white/10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="font-bold text-lg mb-4">Превью данных</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/10">
                      {Object.keys(preview[0]).map((key) => (
                        <th key={key} className="pb-3 pr-4 font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="py-3 pr-4 text-gray-300">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <p className="text-xs text-gray-500 mt-3">+ ещё {preview.length - 5} строк</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Результат */}
          {result && (
            <motion.div className="glass-panel p-6 rounded-2xl mb-6 border border-white/10"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {result.success ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-400" />
                      Конвертация успешна
                    </h3>
                    <button onClick={downloadJSON} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
                      <Download size={16} /> Скачать JSON
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Всего записей', value: result.statistics?.total, color: 'text-white' },
                      { label: 'Обработано', value: result.statistics?.processed, color: 'text-green-400' },
                      { label: 'Обогащено', value: result.statistics?.enriched, color: 'text-cyan-400' },
                      { label: 'Ошибок', value: result.statistics?.failed || 0, color: 'text-red-400' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-3 bg-white/5 rounded-lg">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-300 hover:text-white mb-3">Просмотр результата (первые 3 записи)</summary>
                    <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-xs text-gray-300 max-h-64">
                      {JSON.stringify(result.data?.slice(0, 3), null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 font-medium mb-2">Ошибка конвертации</p>
                  {result.errors?.map((err, i) => (
                    <p key={i} className="text-sm text-gray-400">{err}</p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Скачать шаблон */}
          <motion.div className="text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <button onClick={downloadTemplate} className="btn-secondary px-6 py-3 flex items-center gap-2 mx-auto">
              <Download size={18} />
              Скачать шаблон файла
            </button>
            <p className="text-xs text-gray-500 mt-2">Пример структуры данных для загрузки</p>
          </motion.div>

          {/* Документация API */}
          <motion.div className="mt-12 glass-panel p-6 rounded-2xl border border-white/10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Info size={20} className="text-emerald-400" />
              Дополнительные возможности API
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
              <div>
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Database size={16} className="text-cyan-400" /> Dadata
                </h4>
                <ul className="space-y-2">
                  <li>• Автодополнение адресов при вводе</li>
                  <li>• Определение охотничьих угодий по координатам</li>
                  <li>• Валидация лицензий и разрешений</li>
                  <li>• Геокодирование для нанесения на карту</li>
                  <li>• Проверка принадлежности к субъектам РФ</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-purple-400" /> FIAS (ФНС)
                </h4>
                <ul className="space-y-2">
                  <li>• Официальная верификация адресов охотхозяйств</li>
                  <li>• Получение кодов ОКАТО/ОКТМО для отчётности</li>
                  <li>• Сопоставление с реестром охотничьих угодий</li>
                  <li>• Проверка границ муниципальных образований</li>
                  <li>• Интеграция с государственными реестрами</li>
                </ul>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
