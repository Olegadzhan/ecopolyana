'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Download, Image as ImageIcon } from 'lucide-react';

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateImage = () => {
    if (!prompt) return;
    setLoading(true);
    const encodedPrompt = encodeURIComponent(prompt + " futuristic style, cyberpunk, high detail, 8k");
    const randomSeed = Math.floor(Math.random() * 1000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${randomSeed}&nologo=true`;
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setImageUrl(url);
      setLoading(false);
    };
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <h2 className="text-4xl font-bold mb-8 text-center">
          NEURAL <span className="text-cyan-400">VISION</span>
        </h2>

        <div className="glass-panel p-8 rounded-2xl mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Опиши, что хочешь увидеть (на английском для лучшего результата):
          </label>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: A cybernetic wolf hunting in neon forest..."
              className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500 transition-colors text-white"
              onKeyDown={(e) => e.key === 'Enter' && generateImage()}
            />
            <button 
              onClick={generateImage}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Processing...' : <><Sparkles size={18} /> Generate</>}
            </button>
          </div>
        </div>

        <div className="relative w-full aspect-video bg-black/40 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="text-cyan-400 animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
              <span>Rendering Reality...</span>
            </div>
          )}
          
          {!loading && !imageUrl && (
            <div className="text-gray-600 flex flex-col items-center">
              <ImageIcon size={48} className="mb-2 opacity-50" />
              <span>Ожидание ввода данных</span>
            </div>
          )}

          {imageUrl && !loading && (
            <motion.img 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              src={imageUrl} 
              alt="Generated content" 
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {imageUrl && !loading && (
          <div className="mt-4 flex justify-end">
            <a 
              href={imageUrl} 
              download="ecopolyana-art.jpg"
              target="_blank"
              className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
            >
              <Download size={16} /> Скачать
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
