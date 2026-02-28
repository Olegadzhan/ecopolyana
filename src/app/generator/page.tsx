'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Image as ImageIcon, Trash2, History, Palette, RefreshCw, X, Grid3X3, Server, CheckCircle, AlertCircle, Key, Music, Play, Pause, Volume2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Пресеты - популярные запросы для генерации (с понятными названиями)
const PRESETS = [
  { label: '🤖 Кибер-охотник', prompt: 'cybernetic hunter in neon forest, futuristic armor, drone companion, dark atmosphere' },
  { label: '🐺 Био-волк', prompt: 'genetically enhanced wolf, glowing blue eyes, cybernetic implants, snowy mountain landscape' },
  { label: '🌿 Эко-город', prompt: 'futuristic eco city, vertical gardens, flying vehicles, clean energy, harmony with nature' },
  { label: '🚀 Космо-исследователь', prompt: 'space explorer on alien planet, two moons, exotic flora, sci-fi suit, dramatic lighting' },
  { label: '🐉 Механический дракон', prompt: 'mechanical dragon, steampunk design, fire breath, medieval castle background, epic scene' },
  { label: '🌊 Подводная цивилизация', prompt: 'underwater civilization, bioluminescent creatures, coral architecture, deep ocean, mysterious' },
];

// Стили генерации - 6 стилей
const STYLES = [
  { id: 'cyberpunk', label: 'generator.styleCyberpunk', suffix: 'cyberpunk style, neon lights, dark atmosphere, high contrast' },
  { id: 'realistic', label: 'generator.styleRealistic', suffix: 'photorealistic, 8k, highly detailed, natural lighting, professional photography' },
  { id: 'artistic', label: 'generator.styleArtistic', suffix: 'digital art, concept art, artistic style, vibrant colors, painterly' },
  { id: 'anime', label: 'generator.styleAnime', suffix: 'anime style, studio ghibli, detailed animation, cel shaded' },
  { id: 'fantasy', label: 'generator.styleFantasy', suffix: 'fantasy art, magical atmosphere, ethereal lighting, mystical elements' },
  { id: 'scifi', label: 'generator.styleScifi', suffix: 'science fiction, futuristic technology, space age, advanced machinery' },
];

// Модели - БЕЗ NanoBanana
const MODELS = [
  { id: 'flux', label: 'Flux', description: 'Быстрый, качественный (бесплатно)', free: true },
  { id: 'zimage', label: 'ZImage', description: 'По умолчанию (бесплатно)', free: true },
  { id: 'klein', label: 'Klein', description: 'Художественный стиль', free: true },
  { id: 'kontext', label: 'Kontext', description: 'Контекстное понимание', free: false },
  { id: 'seedream', label: 'SeaDream', description: 'Премиум качество', free: false },
];

interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  timestamp: string;
  taskId: number;
  model?: string;
  musicUrl?: string;
  musicPrompt?: string;
}

interface GenerationTask {
  id: number;
  prompt: string;
  style: typeof STYLES[0];
  model: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  imageUrl: string;
  musicStatus: 'idle' | 'generating' | 'completed' | 'error';
  musicUrl: string;
  musicPrompt: string;
  isPlaying: boolean;
  error?: string;
  retryCount?: number;
}

export default function GeneratorPage() {
  const { t } = useLanguage();
  const [mainPrompt, setMainPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement | null }>({});
  const taskCounter = useRef(0);

  // Проверка наличия API ключа
  useEffect(() => {
    fetch('/api/generate?keycheck=true')
      .then(res => res.json())
      .then(data => {
        setApiKeyConfigured(data.configured || false);
      })
      .catch(() => {
        setApiKeyConfigured(false);
      });
  }, []);

  // Загрузка истории
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
  const saveToHistory = useCallback((url: string, promptText: string, taskId: number, model?: string, musicUrl?: string, musicPrompt?: string) => {
    try {
      const newImage: GeneratedImage = {
        id: Date.now(),
        url,
        prompt: promptText,
        timestamp: new Date().toISOString(),
        taskId,
        model,
        musicUrl,
        musicPrompt,
      };
      const updated = [newImage, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('ecopolyana-history', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving to history:', e);
    }
  }, [history]);

  // Генерация музыкального промпта на основе описания изображения
  const generateMusicPrompt = useCallback((imagePrompt: string, style: typeof STYLES[0]): string => {
    const styleToMusic: { [key: string]: string } = {
      cyberpunk: 'electronic synthwave, dark ambient, futuristic beats, neon atmosphere',
      realistic: 'cinematic orchestral, emotional soundtrack, epic strings, dramatic',
      artistic: 'ambient electronic, creative soundscape, experimental, artistic composition',
      anime: 'japanese anime soundtrack, orchestral pop, emotional piano, uplifting',
      fantasy: 'epic fantasy orchestra, magical atmosphere, mystical choir, adventure theme',
      scifi: 'sci-fi electronic, space ambient, futuristic sounds, cosmic atmosphere',
    };

    const musicStyle = styleToMusic[style.id] || 'ambient electronic';
    return `${imagePrompt.split(',')[0]}, ${musicStyle}, instrumental, 120 bpm`;
  }, []);

  // ✅ Генерация музыки - УВЕЛИЧЕНА ДЛИТЕЛЬНОСТЬ до 60 секунд
  const generateMusicTrack = useCallback(async (musicPrompt: string, taskId: number): Promise<string> => {
    const randomSeed = Math.floor(Math.random() * 10000);
    // Увеличена длительность с 30 до 60 секунд
    const musicUrl = `/api/audio?prompt=${encodeURIComponent(musicPrompt)}&model=elevenmusic&duration=60&instrumental=true&seed=${randomSeed}`;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Music timeout'));
      }, 90000); // 90 секунд таймаут
      
      const audio = new Audio(musicUrl);
      
      audio.oncanplaythrough = () => {
        clearTimeout(timeout);
        resolve(musicUrl);
      };
      
      audio.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Music generation failed'));
      };
      
      audio.load();
    });
  }, []);

  // Генерация изображения
  const generateSingleImage = useCallback(async (prompt: string, style: typeof STYLES[0], model: string, taskId: number): Promise<string> => {
    const fullPrompt = `${prompt}, ${style.suffix}, futuristic, high detail, 8k`;
    const randomSeed = Math.floor(Math.random() * 10000);
    
    const proxyUrl = `/api/generate?prompt=${encodeURIComponent(fullPrompt)}&seed=${randomSeed}&model=${model}&width=1024&height=1024`;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, 45000);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(proxyUrl);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Generation failed'));
      };
      
      img.src = proxyUrl;
    });
  }, []);

  // Генерация всех задач
  const generateAll = useCallback(async () => {
    if (!mainPrompt.trim()) return;
    
    setIsGenerating(true);
    
    const newTasks: GenerationTask[] = gridMode 
      ? [1, 2, 3, 4].map(() => ({
          id: ++taskCounter.current,
          prompt: mainPrompt,
          style: selectedStyle,
          model: selectedModel.id,
          status: 'pending' as const,
          imageUrl: '',
          musicStatus: 'idle' as const,
          musicUrl: '',
          musicPrompt: '',
          isPlaying: false,
        }))
      : [{
          id: ++taskCounter.current,
          prompt: mainPrompt,
          style: selectedStyle,
          model: selectedModel.id,
          status: 'pending' as const,
          imageUrl: '',
          musicStatus: 'idle' as const,
          musicUrl: '',
          musicPrompt: '',
          isPlaying: false,
        }];
    
    setTasks(newTasks);
    const updatedTasks = [...newTasks];
    
    const promises = updatedTasks.map(async (task) => {
      setTasks(prev => prev.map(taskObj => taskObj.id === task.id ? { 
        ...taskObj, 
        status: 'loading'
      } : taskObj));
      
      try {
        // 1. Генерация изображения
        const imageUrl = await generateSingleImage(task.prompt, task.style, task.model, task.id);
        
        setTasks(prev => prev.map(taskObj => taskObj.id === task.id ? { 
          ...taskObj, 
          status: 'completed', 
          imageUrl
        } : taskObj));
        
        // 2. Генерация музыки (если включено)
        let musicUrl = '';
        let musicPrompt = '';
        
        if (musicEnabled) {
          setTasks(prev => prev.map(taskObj => taskObj.id === task.id ? { 
            ...taskObj, 
            musicStatus: 'generating'
          } : taskObj));
          
          try {
            musicPrompt = generateMusicPrompt(task.prompt, task.style);
            musicUrl = await generateMusicTrack(musicPrompt, task.id);
            
            setTasks(prev => prev.map(taskObj => taskObj.id === task.id ? { 
              ...taskObj, 
              musicStatus: 'completed',
              musicUrl,
              musicPrompt
            } : taskObj));
          } catch (musicError) {
            console.warn('Music generation failed:', musicError);
            setTasks(prev => prev.map(taskObj => taskObj.id === task.id ? { 
              ...taskObj, 
              musicStatus: 'error'
            } : taskObj));
          }
        }
        
        saveToHistory(imageUrl, mainPrompt, task.id, task.model, musicUrl, musicPrompt);
      } catch (error: any) {
        console.error(`Task ${task.id} failed:`, error);
        const errorMessage = error.message?.includes('402') 
          ? '402: Недостаточно pollen. Выберите Flux или ZImage.' 
          : t('generator.error');
        
        setTasks(prev => prev.map(taskObj => taskObj.id === task.id ? { 
          ...taskObj, 
          status: 'error', 
          error: errorMessage
        } : taskObj));
      }
    });
    
    await Promise.all(promises);
    setIsGenerating(false);
  }, [mainPrompt, selectedStyle, selectedModel, gridMode, musicEnabled, generateMusicPrompt, saveToHistory, t, generateSingleImage, generateMusicTrack]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('ecopolyana-history');
  }, []);

  const loadFromHistory = useCallback((item: GeneratedImage) => {
    setMainPrompt(item.prompt);
    setShowHistory(false);
  }, []);

  const removeTask = useCallback((taskId: number) => {
    if (audioRefs.current[taskId]) {
      audioRefs.current[taskId]?.pause();
      audioRefs.current[taskId] = null;
    }
    setTasks(prev => prev.filter(taskObj => taskObj.id !== taskId));
  }, []);

  const clearAllTasks = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
      audio?.pause();
    });
    audioRefs.current = {};
    setTasks([]);
  }, []);

  const downloadImage = useCallback(async (url: string, taskId: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ecopolyana-${taskId}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  }, []);

  const downloadMusic = useCallback(async (url: string, taskId: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `ecopolyana-music-${taskId}-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  }, []);

  const togglePlayMusic = useCallback((taskId: number, musicUrl: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (parseInt(id) !== taskId && audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    setTasks(prev => prev.map(taskObj => {
      if (taskObj.id === taskId) {
        const existingAudio = audioRefs.current[taskId];
        
        if (existingAudio && !taskObj.isPlaying) {
          existingAudio.play();
          return { ...taskObj, isPlaying: true };
        } else if (existingAudio && taskObj.isPlaying) {
          existingAudio.pause();
          return { ...taskObj, isPlaying: false };
        } else {
          const audio = new Audio(musicUrl);
          audio.loop = false;
          audio.onended = () => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isPlaying: false } : t));
          };
          audioRefs.current[taskId] = audio;
          audio.play();
          return { ...taskObj, isPlaying: true };
        }
      }
      return taskObj;
    }));
  }, []);

  const completedTasks = tasks.filter(taskObj => taskObj.status === 'completed');

  return (
    <div className="min-h-screen p-6 flex flex-col items-center pt-24 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        {/* Заголовок */}
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
            {musicEnabled && <span className="text-cyan-400"> + 🎵 Music</span>}
          </p>
        </div>

        {/* Панель управления */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl mb-8">
          
          {/* Статус API ключа - ИСПРАВЛЕНО */}
          <div className="mb-6">
            <div className={`p-4 rounded-lg border flex items-center gap-3 ${
              apiKeyConfigured 
                ? 'bg-green-900/20 border-green-500/30' 
                : 'bg-yellow-900/20 border-yellow-500/30'
            }`}>
              {apiKeyConfigured ? (
                <>
                  <CheckCircle size={20} className="text-green-400" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">API ключ</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={20} className="text-yellow-400" />
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">API ключ не настроен</p>
                    <p className="text-gray-500 text-xs">
                      Получите ключ на <a href="https://enter.pollinations.ai" target="_blank" rel="noopener noreferrer" className="underline">enter.pollinations.ai</a>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Опция генерации музыки - ИСПРАВЛЕНО описание */}
          <div className="mb-6">
            <label className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <Music size={20} className="text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-white">Генерировать музыку</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={musicEnabled}
                onChange={(e) => setMusicEnabled(e.target.checked)}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"
              />
            </label>
          </div>

          {/* Выбор модели */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Server size={16} /> Модель генерации
              </label>
              <button
                onClick={() => setShowModels(!showModels)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {showModels ? 'Скрыть' : 'Показать все'}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedModel.id === model.id
                      ? 'bg-green-600 text-white border-green-500'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {model.label} {model.free && '🆓'}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {showModels && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-black/30 rounded-lg border border-white/10">
                    {MODELS.map((model) => (
                      <div key={model.id} className="text-xs">
                        <span className="text-gray-300 font-medium">{model.label}</span>
                        <span className="text-gray-500 block">{model.description}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-400" />
                    Модели с 🆓 бесплатные (не требуют pollen)
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Режим генерации */}
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
                {t('generator.singleMode')}
              </button>
              <button
                onClick={() => setGridMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  gridMode ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {t('generator.multiMode')}
              </button>
            </div>
          </div>

          {/* Выбор стиля - 6 стилей */}
          <div className="mb-6">
            <label htmlFor="style-select" className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Palette size={16} /> {t('generator.styleLabel')}
            </label>
            <div id="style-select" className="grid grid-cols-2 md:grid-cols-3 gap-2" role="group" aria-label={t('generator.styleLabel')}>
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                    selectedStyle.id === style.id
                      ? 'bg-green-600 text-white border-green-500'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                  aria-pressed={selectedStyle.id === style.id}
                >
                  {t(style.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Пресеты - ИСПРАВЛЕНО: понятные названия вместо технических ключей */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Sparkles size={16} /> {t('generator.presetsLabel')}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" role="group" aria-label={t('generator.presetsLabel')}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainPrompt(preset.prompt)}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 transition-all text-left truncate"
                >
                  {preset.label}
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

          {/* Активные задачи */}
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
                        <>
                          <button
                            onClick={() => downloadImage(taskObj.imageUrl, taskObj.id)}
                            className="p-2 bg-green-600/80 hover:bg-green-500 rounded-lg transition-colors"
                            aria-label={t('generator.download')}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => removeTask(taskObj.id)}
                            className="p-2 bg-red-600/80 hover:bg-red-500 rounded-lg transition-colors"
                            aria-label={t('generator.remove')}
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {taskObj.status === 'loading' && (
                      <div className="aspect-video flex flex-col items-center justify-center text-cyan-400">
                        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                        <span className="text-sm">{t('generator.generatingText')}</span>
                        <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Server size={10} /> {taskObj.model}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">{t('generator.generatingTime')}</span>
                      </div>
                    )}

                    {taskObj.status === 'completed' && taskObj.imageUrl && (
                      <>
                        <img 
                          src={taskObj.imageUrl} 
                          alt={`Generated ${taskObj.id}`}
                          className="w-full aspect-video object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-gray-400 flex items-center gap-1">
                          <CheckCircle size={10} className="text-green-400" />
                          {taskObj.model}
                        </div>
                        
                        {/* Музыкальный плеер */}
                        {taskObj.musicStatus === 'completed' && taskObj.musicUrl && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-2">
                            <button
                              onClick={() => togglePlayMusic(taskObj.id, taskObj.musicUrl)}
                              className="p-2 bg-cyan-600/80 hover:bg-cyan-500 rounded-full transition-colors"
                              aria-label={taskObj.isPlaying ? 'Pause' : 'Play'}
                            >
                              {taskObj.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button
                              onClick={() => downloadMusic(taskObj.musicUrl, taskObj.id)}
                              className="p-2 bg-purple-600/80 hover:bg-purple-500 rounded-full transition-colors"
                              aria-label="Download music"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Статус генерации музыки */}
                    {taskObj.musicStatus === 'generating' && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-cyan-900/80 rounded text-xs text-cyan-400 flex items-center gap-1">
                        <Music size={10} />
                        Генерация музыки...
                      </div>
                    )}

                    {taskObj.status === 'error' && (
                      <div className="aspect-video flex flex-col items-center justify-center text-red-400">
                        <span className="text-sm px-4 text-center">{taskObj.error || t('generator.error')}</span>
                        {taskObj.error?.includes('402') && (
                          <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                            <Key size={10} /> Выберите модель Flux или ZImage (бесплатно)
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setTasks(prev => prev.map(item => item.id === taskObj.id ? { ...item, status: 'pending' } : item));
                            generateAll();
                          }}
                          className="mt-2 flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                        >
                          <RefreshCw size={14} /> {t('generator.newGeneration')}
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

        {/* История */}
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
                      {item.model && (
                        <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/70 rounded text-[10px] text-gray-400">
                          {item.model}
                        </div>
                      )}
                      {item.musicUrl && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-cyan-900/70 rounded text-[10px] text-cyan-400 flex items-center gap-1">
                          <Music size={8} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Подсказки */}
        <div className="mt-12 glass-panel p-6 rounded-2xl">
          <h3 className="font-bold mb-4 text-green-400">{t('generator.tipsTitle')}</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>{t('generator.tips1')}</li>
            <li>{t('generator.tips2')} <code className="bg-white/10 px-2 py-0.5 rounded">{t('generator.tipsWords')}</code></li>
            <li>{t('generator.tips3')} <code className="bg-white/10 px-2 py-0.5 rounded">{t('generator.tipsLighting')}</code></li>
            <li>{t('generator.tips4')} <code className="bg-white/10 px-2 py-0.5 rounded">{t('generator.tipsHunting')}</code></li>
            <li className="text-cyan-400 flex items-center gap-2">
              <Music size={14} />
              Музыка генерируется автоматически на основе описания изображения (стиль соответствует визуалу)
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

