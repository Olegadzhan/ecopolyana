'use client';

import { usePageMeta } from '@/hooks/usePageMeta';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Image as ImageIcon, Trash2, History, Palette, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PRESETS = [
  { label: 'generator.presetCyberHunter', prompt: 'cybernetic hunter in neon forest, futuristic armor, drone companion' },
  { label: 'generator.presetBioWolf', prompt: 'genetically enhanced wolf, glowing eyes, cybernetic implants, dark forest' },
  { label: 'generator.presetDroneFalcon', prompt: 'mechanical falcon drone, surveillance, golden hour, mountain landscape' },
  { label: 'generator.presetEcoStation', prompt: 'futuristic eco station, vertical gardens, solar panels, harmony with nature' },
];

const STYLES = [
  { id: 'cyberpunk', label: 'generator.styleCyberpunk', suffix: 'cyberpunk style, neon lights, dark atmosphere' },
  { id: 'realistic', label: 'generator.styleRealistic', suffix: 'photorealistic, 8k, highly detailed, natural lighting' },
  { id: 'artistic', label: 'generator.styleArtistic', suffix: 'digital art, concept art, artistic style, vibrant colors' },
  { id: 'anime', label: 'generator.styleAnime', suffix: 'anime style, studio ghibli, detailed animation' },
];

interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  timestamp: string;
}

export default function GeneratorPage() {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
 
  usePageMeta(
    t('meta.title'),
    t('meta.description')
  );
  
  // Загрузка истории из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecopolyana-history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading history:', e);
    }
  }, []);

  // Сохранение в историю
  const saveToHistory = useCallback((url: string, promptText: string) => {
    try {
      const newImage: GeneratedImage = {
        id: Date.now(),
        url,
        prompt: promptText,
        timestamp: new Date().toISOString(),
      };
      const updated = [newImage, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('ecopolyana-history', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving to history:', e);
    }
  }, [history]);

  const generateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError(t('generator.errorNoPrompt') || 'Please enter a prompt');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const fullPrompt = `${prompt}, ${selectedStyle.suffix}, futuristic, high detail, 8k`;
    const randomSeed = Math.floor(Math.random() * 10000);
    
    try {
      // Пробуем через наш API прокси
      const apiUrl = `/api/generate?prompt=${encodeURIComponent(fullPrompt)}&width=1024&height=1024&seed=${randomSeed}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/jpeg, application/json',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('image')) {
          // Получили изображение напрямую
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          saveToHistory(objectUrl, prompt);
          setRetryCount(0);
        } else {
          // Получили JSON с fallback URL
          const data = await response.json();
          if (data.url) {
            setImageUrl(data.url);
            saveToHistory(data.url, prompt);
            setRetryCount(0);
          } else {
            throw new Error('No image URL received');
          }
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (apiError) {
      console.warn('API proxy failed, trying direct URL:', apiError);
      
      // Fallback: прямая ссылка на Pollinations
      try {
        const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${randomSeed}&nologo=true&referer=${encodeURIComponent(window.location.origin)}`;
        
        // Проверяем доступность изображения
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            setImageUrl(directUrl);
            saveToHistory(directUrl, prompt);
            setRetryCount(0);
            resolve(true);
          };
          img.onerror = () => {
            reject(new Error('Image failed to load'));
          };
          img.src = directUrl;
        });
      } catch (fallbackError) {
        console.error('All generation methods failed:', fallbackError);
        setError(t('generator.error') || 'Ошибка генерации. Попробуйте другой запрос.');
        setRetryCount(prev => prev + 1);
        
        if (retryCount >= 2) {
          setError(t('generator.errorMultiple') || 'Превышено количество попыток. Подождите и попробуйте снова.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedStyle, saveToHistory, retryCount, t]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('ecopolyana-history');
  }, []);

  const loadFromHistory = useCallback((item: GeneratedImage) => {
    setImageUrl(item.url);
    setPrompt(item.prompt);
    setShowHistory(false);
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    setError('');
    generateImage();
  }, [generateImage]);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center pt-24 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl"
      >
        {/* Заголовок */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-3">
            {t('generator.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">{t('generator.title2')}</span>
          </h2>
          <p className="text-gray-400">{t('generator.subtitle')}</p>
        </div>

        {/* Панель управления */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl mb-8">
          
          {/* Выбор стиля */}
          <div className="mb-6">
            <label htmlFor="style-select" className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Palette size={16} /> {t('generator.styleLabel')}
            </label>
            <div id="style-select" className="flex flex-wrap gap-2" role="group" aria-label={t('generator.styleLabel')}>
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStyle.id === style.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  aria-pressed={selectedStyle.id === style.id}
                >
                  {t(style.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Пресеты */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Sparkles size={16} /> {t('generator.presetsLabel')}
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('generator.presetsLabel')}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(preset.prompt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 transition-all"
                >
                  {t(preset.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Поле ввода */}
          <div className="mb-6">
            <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-400 mb-2">
              {t('generator.inputLabel')}
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                id="prompt-input"
                name="prompt"
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('generator.inputPlaceholder')}
                className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white placeholder-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && generateImage()}
                aria-label={t('generator.inputLabel')}
                autoComplete="off"
              />
              <button 
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                aria-label={t('generator.generate')}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Sparkles size={18} /> {t('generator.generate')}</>
                )}
              </button>
            </div>
          </div>

          {/* Сообщение об ошибке */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center justify-between"
            >
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <RefreshCw size={14} /> Повторить
              </button>
            </motion.div>
          )}

          {/* Кнопка истории */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              aria-expanded={showHistory}
              aria-controls="history-panel"
            >
              <History size={16} />
              {showHistory ? t('generator.hideHistory') : t('generator.history')} ({history.length})
            </button>
          </div>
        </div>

        {/* История генераций */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              id="history-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel p-6 rounded-2xl mb-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('generator.historyTitle')}</h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                    aria-label={t('generator.clearHistory')}
                  >
                    <Trash2 size={14} /> {t('generator.clearHistory')}
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('generator.historyEmpty')}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-500 transition-colors"
                      aria-label={`Load image: ${item.prompt}`}
                    >
                      <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Результат генерации */}
        <div className="relative w-full aspect-video bg-black/40 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center min-h-[400px]">
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-cyan-400 flex flex-col items-center"
              role="status"
              aria-live="polite"
            >
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
              <span className="text-lg font-medium">{t('generator.generatingText')}</span>
              <span className="text-sm text-gray-500 mt-2">{t('generator.generatingTime')}</span>
            </motion.div>
          )}
          
          {!loading && !imageUrl && !error && (
            <div className="text-gray-600 flex flex-col items-center">
              <ImageIcon size={64} className="mb-4 opacity-30" />
              <span className="text-lg">{t('generator.waiting')}</span>
            </div>
          )}

          {imageUrl && !loading && (
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src={imageUrl} 
              alt="Generated content" 
              className="w-full h-full object-contain bg-black"
              crossOrigin="anonymous"
              loading="eager"
            />
          )}
        </div>

        {/* Кнопки действий */}
        {imageUrl && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-wrap gap-4 justify-center"
          >
            <a 
              href={imageUrl} 
              download={`ecopolyana-${Date.now()}.jpg`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={t('generator.download')}
            >
              <Download size={18} /> {t('generator.download')}
            </a>
            <button
              onClick={() => setImageUrl('')}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={t('generator.newGeneration')}
            >
              <ImageIcon size={18} /> {t('generator.newGeneration')}
            </button>
          </motion.div>
        )}

        {/* Подсказки */}
        <div className="mt-12 glass-panel p-6 rounded-2xl">
          <h3 className="font-bold mb-4 text-green-400">{t('generator.tipsTitle')}</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>{t('generator.tips1')}</li>
            <li>{t('generator.tips2')} <code className="bg-white/10 px-2 py-0.5 rounded">{t('generator.tipsWords')}</code></li>
            <li>{t('generator.tips3')} <code className="bg-white/10 px-2 py-0.5 rounded">{t('generator.tipsLighting')}</code></li>
            <li>{t('generator.tips4')} <code className="bg-white/10 px-2 py-0.5 rounded">{t('generator.tipsHunting')}</code></li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
