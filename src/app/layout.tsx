// src/app/layout.tsx
// ❌ УДАЛИТЬ: 'use client' — layout должен быть серверным для metadata
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import ClientProviders from '@/components/providers/ClientProviders';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

// ✅ metadata работает только в серверных компонентах
export const metadata: Metadata = {
  title: 'Экополяна — Технологии будущего',
  description: 'Современная охота с AI, дронами и биотехнологиями',
  icons: { icon: '/logo.png' },
  metadataBase: new URL('https://ecopolyana.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased min-h-screen flex flex-col`}>
        
        {/* ✅ Клиентские провайдеры внутри серверного layout */}
        <ClientProviders>
          
          {/* Единый Header */}
          <Header />
          
          {/* Контент с отступом под фиксированный header */}
          <main className="pt-16 flex-1">
            {children}
          </main>
          
          <Footer />
          
        </ClientProviders>
      </body>
    </html>
  );
}

// ============================================
// HEADER КОМПОНЕНТ (встроен в layout)
// ============================================
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="Экополяна"
                fill
                className="object-contain drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(74,222,128,0.8)] transition-all"
                priority
              />
            </div>
            <span className="text-lg font-black bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Экополяна
            </span>
          </a>
          
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/map', label: 'Карта', icon: '🗺️' },
              { href: '/#features', label: 'Технологии', icon: '⚡' },
              { href: '/#about', label: 'О проекте', icon: 'ℹ️' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
            <a
              href="/generator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-cyan-600 text-white font-medium hover:from-green-500 hover:to-cyan-500 transition-all shadow-lg shadow-green-500/20 text-sm"
            >
              ✨ AI Генератор
            </a>
          </nav>
          
          {/* Мобильное меню */}
          <div className="md:hidden flex items-center gap-2">
            <a href="/map" className="p-2 text-gray-300 hover:text-white">🗺️</a>
            <a href="/generator" className="p-2 text-gray-300 hover:text-white">✨</a>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================
// FOOTER КОМПОНЕНТ
// ============================================
function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
        <p>© 2025 Экополяна. Все права защищены.</p>
      </div>
    </footer>
  );
}
