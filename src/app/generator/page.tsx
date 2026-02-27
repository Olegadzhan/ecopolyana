'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Image as ImageIcon, Trash2, History, Palette } from 'lucide-react';

// Пресеты для тематических запросов
const PRESETS = [
  { label: '🤖 Кибер-охотник', prompt: 'cybernetic hunter in neon forest, futuristic armor, drone companion' },
  { label: '🐺 Био-волк', prompt: 'genetically enhanced wolf, glowing eyes, cybernetic implants, dark forest' },
  { label: '🦅 Дрон-сокол', prompt: 'mechanical falcon drone, surveillance, golden hour, mountain landscape' },
  { label: '🌿 Эко-станция', prompt: 'futuristic eco station, vertical gardens, solar panels, harmony with nature' },
];

// Стили генерации
const STYLES = [
  { id: 'cyberpunk', label: 'Киберпанк', suffix: 'cyberpunk style, neon lights, dark atmosphere' },
  { id: 'realistic', label: 'Реализм', suffix: 'photorealistic, 8k, highly detailed, natural lighting' },
  { id: 'artistic', label: 'Арт', suffix: 'digital art, concept art, artistic style, vibrant colors' },
  { id: 'anime', label: 'Аниме', suffix: 'anime style, studio ghibli, detailed animation' },
];

interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  timestamp: Date;
}

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Загрузка истории из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecopolyana-history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Сохранение в историю
  const saveToHistory = (url: string, promptText: string) => {
    const newImage: GeneratedImage = {
      id: Date.now(),
      url,
      prompt: promptText,
      timestamp: new Date(),
    };
    const updated = [newImage, ...history].slice(0, 10); // Храним последние 10
    setHistory(updated);
    localStorage.setItem('ecopolyana-history', JSON.stringify(updated));
  };

  const generateImage = () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const fullPrompt = `${prompt}, ${selectedStyle.suffix}, futuristic, high detail, 8k`;
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const randomSeed = Math.floor(Math.random() * 10000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`;
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageUrl(url);
      saveToHistory(url, prompt);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
      alert('Ошибка генерации. Попробуйте другой запрос.');
    };
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ecopolyana-history');
  };

  const loadFromHistory = (item: GeneratedImage) => {
    setImageUrl(item.url);
    setPrompt(item.prompt);
    setShowHistory(false);
  };

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
            NEURAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">VISION</span>
          </h2>
          <p className="text-gray-400">Генератор образов будущего мира</p>
        </div>

        {/* Панель управления */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl mb-8">
          
          {/* Выбор стиля */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Palette size={16} /> Стиль генерации
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStyle.id === style.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Пресеты */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <Sparkles size={16} /> Быстрые пресеты
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(preset.prompt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Поле ввода */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ваш запрос (лучше на английском):
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Опишите, что хотите увидеть..."
                className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white placeholder-gray-600"
                onKeyDown={(e) => e.key === 'Enter' && generateImage()}
              />
              <button 
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Sparkles size={18} /> Создать</>
                )}
              </button>
            </div>
          </div>

          {/* Кнопка истории */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <History size={16} />
              {showHistory ? 'Скрыть' : 'История'} ({history.length})
            </button>
          </div>
        </div>

        {/* История генераций */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel p-6 rounded-2xl mb-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">История генераций</h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={14} /> Очистить
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">История пуста</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-green-500 transition-colors"
                    >
                      <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
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
            >
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
              <span className="text-lg font-medium">Генерация образа...</span>
              <span className="text-sm text-gray-500 mt-2">Обычно занимает 5-15 секунд</span>
            </motion.div>
          )}
          
          {!loading && !imageUrl && (
            <div className="text-gray-600 flex flex-col items-center">
              <ImageIcon size={64} className="mb-4 opacity-30" />
              <span className="text-lg">Введите запрос и нажмите "Создать"</span>
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
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Download size={18} /> Скачать
            </a>
            <button
              onClick={() => setImageUrl('')}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ImageIcon size={18} /> Новая генерация
            </button>
          </motion.div>
        )}

        {/* Подсказки */}
        <div className="mt-12 glass-panel p-6 rounded-2xl">
          <h3 className="font-bold mb-4 text-green-400">💡 Советы для лучших результатов</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Используйте подробные описания на английском языке</li>
            <li>• Добавляйте слова: <code className="bg-white/10 px-2 py-0.5 rounded">futuristic</code>, <code className="bg-white/10 px-2 py-0.5 rounded">cyberpunk</code>, <code className="bg-white/10 px-2 py-0.5 rounded">neon</code></li>
            <li>• Указывайте освещение: <code className="bg-white/10 px-2 py-0.5 rounded">golden hour</code>, <code className="bg-white/10 px-2 py-0.5 rounded">night</code>, <code className="bg-white/10 px-2 py-0.5 rounded">dramatic lighting</code></li>
            <li>• Для охотничьей тематики: <code className="bg-white/10 px-2 py-0.5 rounded">hunter</code>, <code className="bg-white/10 px-2 py-0.5 rounded">wildlife</code>, <code className="bg-white/10 px-2 py-0.5 rounded">forest</code></li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
