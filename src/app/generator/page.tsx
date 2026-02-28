'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Image as ImageIcon, Trash2, History, Palette, RefreshCw, X, Grid3X3, Server, CheckCircle, AlertCircle, Key, Music, Play, Pause } from 'lucide-react';

// ... (PRESETS, STYLES, MODELS, интерфейсы — без изменений) ...

export default function GeneratorPage() {
  // ... (useState, useRef — без изменений) ...

  // ✅ ПРЯМОЙ URL для генерации изображения (без /api/generate)
  const generateSingleImage = useCallback(async (prompt: string, style: any, model: string): Promise<string> => {
    const fullPrompt = `${prompt}, ${style.suffix}, futuristic, high detail, 8k`;
    const randomSeed = Math.floor(Math.random() * 10000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${randomSeed}&model=${model}&nologo=true&enhance=true`;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 45000);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { clearTimeout(timeout); resolve(imageUrl); };
      img.onerror = () => { clearTimeout(timeout); resolve(`https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${randomSeed}`); };
      img.src = imageUrl;
    });
  }, []);

  // ✅ ПРЯМОЙ URL для генерации музыки (без /api/audio)
  const generateMusicTrack = useCallback(async (musicPrompt: string): Promise<string> => {
    const randomSeed = Math.floor(Math.random() * 10000);
    const musicUrl = `https://pollinations.ai/p/${encodeURIComponent(musicPrompt)}.mp3?model=musicgen&duration=30&seed=${randomSeed}&noinfo=true`;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(''), 60000);
      fetch(musicUrl, { method: 'HEAD', mode: 'no-cors' })
        .then(() => { clearTimeout(timeout); resolve(musicUrl); })
        .catch(() => { clearTimeout(timeout); resolve(''); });
    });
  }, []);

  // ... (остальной код компонента — JSX без изменений) ...
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-20 px-4">
      {/* ... JSX контента генератора ... */}
    </div>
  );
}
