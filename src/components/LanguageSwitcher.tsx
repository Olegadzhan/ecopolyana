// src/components/LanguageSwitcher.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '@/context/LanguageContext'; // ✅ Теперь Language экспортирован

const languages = [
  { code: 'ru' as Language, label: 'RU', nameKey: 'lang.ru' },
  { code: 'en' as Language, label: 'EN', nameKey: 'lang.en' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 
                   border border-white/10 text-gray-300 hover:text-white transition-all text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe size={16} />
        <span>{currentLang.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-32 bg-gray-900/95 backdrop-blur-md 
                       border border-white/10 rounded-xl overflow-hidden shadow-xl z-[1000]"
            role="listbox"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                  language === lang.code
                    ? 'bg-emerald-600/30 text-emerald-300'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
                role="option"
                aria-selected={language === lang.code}
              >
                <span>{lang.label}</span>
                {language === lang.code && <span className="text-emerald-400">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
