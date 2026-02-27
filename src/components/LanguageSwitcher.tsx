'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '@/context/LanguageContext';

const languages = [
  { code: 'ru', label: 'RU', nameKey: 'lang.ru' },
  { code: 'en', label: 'EN', nameKey: 'lang.en' },
  { code: 'zh', label: '中文', nameKey: 'lang.zh' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
        aria-label="Switch language"
      >
        <Globe size={18} className="text-green-400" />
        <span className="text-sm font-medium">{currentLang?.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-48 glass-panel rounded-lg border border-white/10 overflow-hidden z-50 shadow-xl"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                    language === lang.code
                      ? 'bg-green-600/20 text-green-400'
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <span className="font-bold w-12">{lang.label}</span>
                  <span className="text-gray-500">|</span>
                  <span>{t(lang.nameKey)}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
