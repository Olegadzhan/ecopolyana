'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function usePageMeta(title: string, description: string) {
  const { language } = useLanguage();

  useEffect(() => {
    // Безопасное обновление title без eval
    document.title = title;
    
    // Безопасное обновление meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
    
    // Обновление lang атрибута
    document.documentElement.lang = language;
  }, [title, description, language]);
}
