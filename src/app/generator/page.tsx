'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Image as ImageIcon, Trash2, History, Palette, RefreshCw, X, Grid3X3 } from 'lucide-react';
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
  taskId: number;
}

interface GenerationTask {
  id: number;
  prompt: string;
  style: typeof STYLES[0];
  status: 'pending' | 'loading' | 'completed' | 'error';
  imageUrl: string;
  error?: string;
}

export default function GeneratorPage() {
  const { t } = useLanguage();
  const [mainPrompt, setMainPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const taskCounter = useRef(0);

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

  const saveToHistory = useCallback((url: string, promptText: string, taskId: number) => {
    try {
      const newImage: GeneratedImage = {
        id: Date.now(),
        url,
        prompt: promptText,
        timestamp: new Date().toISOString(),
        taskId,
      };
      const updated = [newImage, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('ecopolyana-history', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving to history:', e);
    }
  }, [history]);

  const generateSingleImage = useCallback(async (task: GenerationTask): Promise<string | null> => {
    const fullPrompt = `${task.prompt}, ${task.style.suffix}, futuristic, high detail, 8k`;
    const randomSeed = Math.floor(Math.random() * 10000);
    
    try {
      const directUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${randomSeed}&nologo=true`;
      
      return await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const timeout = setTimeout(() => {
          resolve(null);
        }, 30000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve(directUrl);
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        
        img.src = directUrl;
      });
    } catch (error) {
      console.error('Generation error:', error);
      return null;
    }
  }, []);

  const generateAll = useCallback(async () => {
    if (!mainPrompt.trim()) return;
    
    setIsGenerating(true);
    
    const newTasks: GenerationTask[] = gridMode 
      ? [1, 2, 3, 4].map(() => ({
          id: ++taskCounter.current,
          prompt: mainPrompt,
          style: selectedStyle,
          status: 'pending' as const,
          imageUrl: '',
        }))
      : [{
          id: ++taskCounter.current,
          prompt: mainPrompt,
          style: selectedStyle,
          status: 'pending' as const,
          imageUrl: '',
        }];
    
    setTasks(newTasks);
    
    const updatedTasks = [...newTasks];
    
    for (let i = 0; i < updatedTasks.length; i++) {
      // ИСПРАВЛЕНО: t -> taskObj
      setTasks(prev => prev.map(taskObj => taskObj.id === updatedTasks[i].id ? { ...taskObj, status: 'loading' } : taskObj));
      
      const imageUrl = await generateSingleImage(updatedTasks[i]);
      
      if (imageUrl) {
        // ИСПРАВЛЕНО: t -> taskObj
        setTasks(prev => prev.map(taskObj => taskObj.id === updatedTasks[i].id ? { ...taskObj, status: 'completed', imageUrl } : taskObj));
        saveToHistory(imageUrl, mainPrompt, updatedTasks[i].id);
      } else {
        // ИСПРАВЛЕНО: t -> taskObj
        setTasks(prev => prev.map(taskObj => taskObj.id === updatedTasks[i].id ? { ...taskObj, status: 'error', error: t('generator.error') } : taskObj));
      }
    }
    
    setIsGenerating(false);
  }, [mainPrompt, selectedStyle, gridMode, saveToHistory, t]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('ecopolyana-history');
  }, []);

  const loadFromHistory = useCallback((item: GeneratedImage) => {
    setMainPrompt(item.prompt);
    setShowHistory(false);
  }, []);

  const removeTask = useCallback((taskId: number) => {
    setTasks(prev => prev.filter(taskObj => taskObj.id !== taskId));
  }, []);

  const clearAllTasks = useCallback(() => {
    setTasks([]);
  }, []);

  const downloadImage = useCallback((url: string, taskId: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecopolyana-${taskId}-${Date.now()}.jpg`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const completedTasks = tasks.filter(taskObj => taskObj.status === 'completed');

  return (
    <div className="min-h-screen p-6 flex flex-col items-center pt-24 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-4 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
            style={{ 
              textShadow: '0 0 40px rgba(0, 255, 157, 0.6), 0 0 80px rgba(0, 240, 255, 0.4)',
              filter: 'drop-shadow(0 0 30px rgba(0, 255, 157, 0.5))',
            }}
          >
            {t('generator.subtitle')}
          </motion.h1>
          <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-2">
            <Grid3X3 size={14} />
            {gridMode ? 'Multi-Generator 4x Mode' : 'Single Generator Mode'}
          </p>
        </div>

        <div className="glass-panel p-6 md:p-8 rounded-2xl mb-8">
          
          <div className="mb-6 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <Grid3X3 size={16} /> Режим генерации
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setGridMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !gridMode ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Одиночный
              </button>
              <button
                onClick={() => setGridMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  gridMode ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                4 одновременно
              </button>
            </div>
          </div>

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

          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Sparkles size={16} /> {t('generator.presetsLabel')}
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('generator.presetsLabel')}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainPrompt(preset.prompt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 transition-all"
                >
                  {t(preset.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-400 mb-2">
              {t('generator.inputLabel')}
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                id="prompt-input"
                name="prompt-input"
                type="text" 
                value={mainPrompt}
                onChange={(e) => setMainPrompt(e.target.value)}
                placeholder={t('generator.inputPlaceholder')}
                className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white placeholder-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && generateAll()}
                aria-label={t('generator.inputLabel')}
                autoComplete="off"
              />
              <button 
                onClick={generateAll}
                disabled={isGenerating || !mainPrompt.trim()}
                className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                aria-label={t('generator.generate')}
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Sparkles size={18} /> {gridMode ? '4x ' : ''}{t('generator.generate')}</>
                )}
              </button>
            </div>
          </div>

          {tasks.length > 0 && (
            <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ImageIcon size={20} className="text-green-400" />
                  {t('generator.activeGenerations')} ({completedTasks.length}/{tasks.length})
                </h3>
                <button
                  onClick={clearAllTasks}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={14} /> {t('generator.clearAll')}
                </button>
              </div>
              
              <div className={`grid gap-4 ${gridMode ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {tasks.map((taskObj) => (
                  <motion.div
                    key={taskObj.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-black/40 rounded-lg overflow-hidden border border-gray-700"
                  >
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      {taskObj.status === 'completed' && (
                        <button
                          onClick={() => downloadImage(taskObj.imageUrl, taskObj.id)}
                          className="p-2 bg-green-600/80 hover:bg-green-500 rounded-lg transition-colors"
                          aria-label={t('generator.download')}
                        >
                          <Download size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => removeTask(taskObj.id)}
                        className="p-2 bg-red-600/80 hover:bg-red-500 rounded-lg transition-colors"
                        aria-label={t('generator.remove')}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {taskObj.status === 'loading' && (
                      <div className="aspect-video flex flex-col items-center justify-center text-cyan-400">
                        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                        <span className="text-sm">{t('generator.generating')}</span>
                      </div>
                    )}

                    {taskObj.status === 'completed' && taskObj.imageUrl && (
                      <img 
                        src={taskObj.imageUrl} 
                        alt={`Generated ${taskObj.id}`}
                        className="w-full aspect-video object-cover"
                        crossOrigin="anonymous"
                        loading="lazy"
                      />
                    )}

                    {taskObj.status === 'error' && (
                      <div className="aspect-video flex flex-col items-center justify-center text-red-400">
                        <span className="text-sm">{taskObj.error || t('generator.error')}</span>
                        <button
                          onClick={() => {
                            setTasks(prev => prev.map(item => item.id === taskObj.id ? { ...item, status: 'pending' } : item));
                            generateAll();
                          }}
                          className="mt-2 flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                        >
                          <RefreshCw size={14} /> Повторить
                        </button>
                      </div>
                    )}

                    {taskObj.status === 'pending' && (
                      <div className="aspect-video flex items-center justify-center text-gray-500">
                        <span>{t('generator.pending')}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

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
