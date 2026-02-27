'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ru' | 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  ru: {
    // Header
    'nav.home': 'Главная',
    'nav.generator': 'Генератор',
    
    // Home Page
    'home.system': 'System Online // v.2077',
    'home.title1': 'ЭКО',
    'home.title2': 'ПОЛЯНА',
    'home.description': 'Центр симбиоза природы и технологий. Современная охота, кибер-разведение и восстановление биосферы.',
    'home.smartHunting': 'Smart Hunting',
    'home.smartHuntingDesc': 'Охота с использованием дронов и AI-ассистентов.',
    'home.bioTech': 'Bio-Tech',
    'home.bioTechDesc': 'Генетическое восстановление редких видов.',
    'home.aiVision': 'AI Vision',
    'home.aiVisionDesc': 'Генерация образов будущего мира.',
    'home.launchGenerator': 'ЗАПУСТИТЬ ГЕНЕРАТОР',
    
    // Generator Page
    'generator.title1': 'NEURAL',
    'generator.title2': 'VISION',
    'generator.subtitle': 'Генератор образов будущего мира',
    'generator.styleLabel': 'Стиль генерации',
    'generator.styleCyberpunk': 'Киберпанк',
    'generator.styleRealistic': 'Реализм',
    'generator.styleArtistic': 'Арт',
    'generator.styleAnime': 'Аниме',
    'generator.presetsLabel': 'Быстрые пресеты',
    'generator.presetCyberHunter': '🤖 Кибер-охотник',
    'generator.presetBioWolf': '🐺 Био-волк',
    'generator.presetDroneFalcon': '🦅 Дрон-сокол',
    'generator.presetEcoStation': '🌿 Эко-станция',
    'generator.inputLabel': 'Ваш запрос (лучше на английском):',
    'generator.inputPlaceholder': 'Опишите, что хотите увидеть...',
    'generator.generate': 'Создать',
    'generator.generating': 'Генерация...',
    'generator.history': 'История',
    'generator.hideHistory': 'Скрыть',
    'generator.historyTitle': 'История генераций',
    'generator.clearHistory': 'Очистить',
    'generator.historyEmpty': 'История пуста',
    'generator.waiting': 'Введите запрос и нажмите "Создать"',
    'generator.generatingText': 'Генерация образа...',
    'generator.generatingTime': 'Обычно занимает 5-15 секунд',
    'generator.download': 'Скачать',
    'generator.newGeneration': 'Новая генерация',
    'generator.tipsTitle': '💡 Советы для лучших результатов',
    'generator.tips1': '• Используйте подробные описания на английском языке',
    'generator.tips2': '• Добавляйте слова:',
    'generator.tips3': '• Указывайте освещение:',
    'generator.tips4': '• Для охотничьей тематики:',
    
    // Footer
    'footer.rights': 'Все права защищены',
  },
  en: {
    // Header
    'nav.home': 'Home',
    'nav.generator': 'Generator',
    
    // Home Page
    'home.system': 'System Online // v.2077',
    'home.title1': 'ECO',
    'home.title2': 'POLYANA',
    'home.description': 'Center of nature and technology symbiosis. Modern hunting, cyber-breeding and biosphere restoration.',
    'home.smartHunting': 'Smart Hunting',
    'home.smartHuntingDesc': 'Hunting with drones and AI assistants.',
    'home.bioTech': 'Bio-Tech',
    'home.bioTechDesc': 'Genetic restoration of rare species.',
    'home.aiVision': 'AI Vision',
    'home.aiVisionDesc': 'Generating images of the future world.',
    'home.launchGenerator': 'LAUNCH GENERATOR',
    
    // Generator Page
    'generator.title1': 'NEURAL',
    'generator.title2': 'VISION',
    'generator.subtitle': 'Future World Image Generator',
    'generator.styleLabel': 'Generation Style',
    'generator.styleCyberpunk': 'Cyberpunk',
    'generator.styleRealistic': 'Realistic',
    'generator.styleArtistic': 'Art',
    'generator.styleAnime': 'Anime',
    'generator.presetsLabel': 'Quick Presets',
    'generator.presetCyberHunter': '🤖 Cyber Hunter',
    'generator.presetBioWolf': '🐺 Bio Wolf',
    'generator.presetDroneFalcon': '🦅 Drone Falcon',
    'generator.presetEcoStation': '🌿 Eco Station',
    'generator.inputLabel': 'Your prompt (English works best):',
    'generator.inputPlaceholder': 'Describe what you want to see...',
    'generator.generate': 'Generate',
    'generator.generating': 'Generating...',
    'generator.history': 'History',
    'generator.hideHistory': 'Hide',
    'generator.historyTitle': 'Generation History',
    'generator.clearHistory': 'Clear',
    'generator.historyEmpty': 'History is empty',
    'generator.waiting': 'Enter a prompt and click "Generate"',
    'generator.generatingText': 'Generating image...',
    'generator.generatingTime': 'Usually takes 5-15 seconds',
    'generator.download': 'Download',
    'generator.newGeneration': 'New Generation',
    'generator.tipsTitle': '💡 Tips for Best Results',
    'generator.tips1': '• Use detailed descriptions in English',
    'generator.tips2': '• Add words:',
    'generator.tips3': '• Specify lighting:',
    'generator.tips4': '• For hunting themes:',
    
    // Footer
    'footer.rights': 'All rights reserved',
  },
  zh: {
    // Header
    'nav.home': '首页',
    'nav.generator': '生成器',
    
    // Home Page
    'home.system': '系统在线 // v.2077',
    'home.title1': '生态',
    'home.title2': '原野',
    'home.description': '自然与技术共生中心。现代狩猎、赛博养殖和生物圈恢复。',
    'home.smartHunting': '智能狩猎',
    'home.smartHuntingDesc': '使用无人机和 AI 助手的狩猎。',
    'home.bioTech': '生物技术',
    'home.bioTechDesc': '稀有物种的基因恢复。',
    'home.aiVision': 'AI 视觉',
    'home.aiVisionDesc': '生成未来世界的图像。',
    'home.launchGenerator': '启动生成器',
    
    // Generator Page
    'generator.title1': '神经',
    'generator.title2': '视觉',
    'generator.subtitle': '未来世界图像生成器',
    'generator.styleLabel': '生成风格',
    'generator.styleCyberpunk': '赛博朋克',
    'generator.styleRealistic': '写实',
    'generator.styleArtistic': '艺术',
    'generator.styleAnime': '动漫',
    'generator.presetsLabel': '快速预设',
    'generator.presetCyberHunter': '🤖 赛博猎人',
    'generator.presetBioWolf': '🐺 生物狼',
    'generator.presetDroneFalcon': '🦅 无人机猎鹰',
    'generator.presetEcoStation': '🌿 生态站',
    'generator.inputLabel': '您的提示（最好用英文）：',
    'generator.inputPlaceholder': '描述您想看到的内容...',
    'generator.generate': '生成',
    'generator.generating': '生成中...',
    'generator.history': '历史',
    'generator.hideHistory': '隐藏',
    'generator.historyTitle': '生成历史',
    'generator.clearHistory': '清除',
    'generator.historyEmpty': '历史为空',
    'generator.waiting': '输入提示并点击"生成"',
    'generator.generatingText': '正在生成图像...',
    'generator.generatingTime': '通常需要 5-15 秒',
    'generator.download': '下载',
    'generator.newGeneration': '新生成',
    'generator.tipsTitle': '💡 获得最佳效果的建议',
    'generator.tips1': '• 使用详细的英文描述',
    'generator.tips2': '• 添加词语：',
    'generator.tips3': '• 指定照明：',
    'generator.tips4': '• 狩猎主题：',
    
    // Footer
    'footer.rights': '版权所有',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ecopolyana-language') as Language;
    if (saved && ['ru', 'en', 'zh'].includes(saved)) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ecopolyana-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ru']] || key;
  };

  if (!mounted) {
    return null;
  }

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
