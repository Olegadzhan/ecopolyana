'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function usePageMeta(title: string, description: string) {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    document.documentElement.lang = language;
  }, [title, description, language]);
}
