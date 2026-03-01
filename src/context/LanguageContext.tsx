// src/context/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ru: {
    'generator.subtitle': 'AI Генератор',
    'generator.styleCyberpunk': 'Киберпанк',
    'generator.styleRealistic': 'Фотореализм',
    'generator.styleArtistic': 'Цифровое искусство',
    'generator.styleAnime': 'Аниме',
    'generator.styleFantasy': 'Фэнтези',
    'generator.styleScifi': 'Научная фантастика',
    'generator.inputLabel': 'Ваш запрос',
    'generator.inputPlaceholder': 'Опишите изображение, которое хотите создать...',
    'generator.generate': 'Генерировать',
    'generator.singleMode': 'Одиночный',
    'generator.multiMode': '4x Вариации',
    'generator.styleLabel': 'Стиль',
    'generator.presetsLabel': 'Пресеты',
    'generator.activeGenerations': 'Активные генерации',
    'generator.clearAll': 'Очистить всё',
    'generator.download': 'Скачать',
    'generator.remove': 'Удалить',
    'generator.generatingText': 'Генерация...',
    'generator.generatingTime': '~30-45 сек',
    'generator.pending': 'Ожидание...',
    'generator.error': 'Ошибка генерации. Попробуйте ещё раз.',
    'generator.newGeneration': 'Повторить',
    'generator.hideHistory': 'Скрыть историю',
    'generator.history': 'История',
    'generator.historyTitle': 'История генераций',
    'generator.clearHistory': 'Очистить',
    'generator.historyEmpty': 'История пуста',
    'generator.tipsTitle': '💡 Советы для лучших результатов',
    'generator.tips1': '• Используйте конкретные описания: объекты, цвета, освещение, атмосфера',
    'generator.tips2': '• Добавляйте ключевые слова:',
    'generator.tips3': '• Указывайте стиль: киберпанк, фотореализм, аниме, фэнтези',
    'generator.tips4': '• Для охотничьих сцен: добавьте night vision, thermal imaging, drone view',
    'generator.tipsWords': 'futuristic, 8k, dramatic lighting',
    'generator.tipsLighting': 'dramatic lighting, neon, ethereal',
    'generator.tipsHunting': 'night vision, thermal imaging, drone view',
  },
  en: {
    'generator.subtitle': 'AI Generator',
    'generator.styleCyberpunk': 'Cyberpunk',
    'generator.styleRealistic': 'Photorealistic',
    'generator.styleArtistic': 'Digital Art',
    'generator.styleAnime': 'Anime',
    'generator.styleFantasy': 'Fantasy',
    'generator.styleScifi': 'Sci-Fi',
    'generator.inputLabel': 'Your prompt',
    'generator.inputPlaceholder': 'Describe the image you want to create...',
    'generator.generate': 'Generate',
    'generator.singleMode': 'Single',
    'generator.multiMode': '4x Variations',
    'generator.styleLabel': 'Style',
    'generator.presetsLabel': 'Presets',
    'generator.activeGenerations': 'Active generations',
    'generator.clearAll': 'Clear all',
    'generator.download': 'Download',
    'generator.remove': 'Remove',
    'generator.generatingText': 'Generating...',
    'generator.generatingTime': '~30-45 sec',
    'generator.pending': 'Pending...',
    'generator.error': 'Generation error. Try again.',
    'generator.newGeneration': 'Retry',
    'generator.hideHistory': 'Hide history',
    'generator.history': 'History',
    'generator.historyTitle': 'Generation history',
    'generator.clearHistory': 'Clear',
    'generator.historyEmpty': 'History is empty',
    'generator.tipsTitle': '💡 Tips for best results',
    'generator.tips1': '• Use specific descriptions: objects, colors, lighting, atmosphere',
    'generator.tips2': '• Add keywords:',
    'generator.tips3': '• Specify style: cyberpunk, photorealistic, anime, fantasy',
    'generator.tips4': '• For hunting scenes: add night vision, thermal imaging, drone view',
    'generator.tipsWords': 'futuristic, 8k, dramatic lighting',
    'generator.tipsLighting': 'dramatic lighting, neon, ethereal',
    'generator.tipsHunting': 'night vision, thermal imaging, drone view',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
