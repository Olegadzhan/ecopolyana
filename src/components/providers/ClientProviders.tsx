// src/components/providers/ClientProviders.tsx
'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}
