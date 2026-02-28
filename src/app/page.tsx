'use client';

import { useState, useEffect, Suspense } from 'react';
import DynamicMap from '@/components/map/DynamicMap';

export type UserLocation = [number, number] | null;

// ============================================
// ВСТРОЕННЫЕ КОМПОНЕНТЫ
// ============================================

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Экополяна
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#map" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">Карта</a>
            <a href="#features" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">Технологии</a>
            <a href="/generator" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">✨ Генератор</a>
            <a href="#about" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">О проекте</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBWMGg0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDE2LDE4NSwxMjksMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6 animate-fade-in-up">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Будущее охоты уже здесь
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up delay-100">
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Экополяна
          </span>
          <br />
          <span className="text-white">Технологии будущего</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl mx-auto animate-fade-in-up delay-200">
          Современная охота с использованием дронов, AI-ассистентов и генетических технологий 
          для восстановления экосистем
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
          <a href="#map" className="btn-primary px-8 py-4 text-base">
            🗺️ Исследовать карту
          </a>
          <a href="/generator" className="btn-secondary px-8 py-4 text-base">
            ✨ AI Генератор
          </a>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10 animate-fade-in-up delay-400">
          <div>
            <p className="text-3xl font-bold text-emerald-400">50+</p>
            <p className="text-sm text-gray-500 mt-1">Локаций</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-cyan-400">24/7</p>
            <p className="text-sm text-gray-500 mt-1">Мониторинг</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-400">AI</p>
            <p className="text-sm text-gray-500 mt-1">Технологии</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: '🚁', title: 'Умная охота', description: 'Дроны и AI-ассистенты для мониторинга', color: 'from-emerald-500 to-cyan-500' },
    { icon: '🧬', title: 'Биотехнологии', description: 'Генетическое восстановление видов', color: 'from-cyan-500 to-purple-500' },
  ];

  return (
    <section id="features" className="py-20 px-4 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">Технологии проекта</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Инновационный подход к сохранению природы</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card group">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gradient">О проекте Экополяна</h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Экополяна — это инновационная платформа, объединяющая современные технологии 
              охоты с экологическим мониторингом и восстановлением природных экосистем.
            </p>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Мы используем дроны, искусственный интеллект и генетические технологии для 
              создания устойчивой модели взаимодействия человека с природой.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="badge">🌱 Экология</span>
              <span className="badge">🤖 AI/ML</span>
              <span className="badge">🚁 Дроны</span>
              <span className="badge">🧬 Биотех</span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-8">
              <div className="w-full h-full rounded-xl bg-gray-900/50 flex items-center justify-center">
                <span className="text-6xl">🌍</span>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌿</span>
              <span className="text-xl font-bold text-white">Экополяна</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Инновационная платформа для современной охоты и экологического мониторинга
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Навигация</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#map" className="hover:text-emerald-400 transition-colors">Карта</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Технологии</a></li>
              <li><a href="/generator" className="hover:text-emerald-400 transition-colors">Генератор</a></li>
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">О проекте</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          <p>© 2025 Экополяна. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<UserLocation>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const requestLocation = () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
          () => {},
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
        );
      }
    };
    const timer = setTimeout(requestLocation, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100">
        <Header />
        <Hero />
        <Features />
        <section className="py-16 px-4"><div className="max-w-7xl mx-auto"><div className="w-full h-[500px] bg-emerald-900/20 rounded-2xl animate-pulse border border-emerald-500/30" /></div></section>
        <About />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Header />
      <Hero />
      <Features />
      
      {/* 🗺️ Карта */}
      <section id="map" className="py-16 px-4 bg-gradient-to-b from-gray-900 to-emerald-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
              🗺️ Интерактивная карта
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Исследуйте территорию проекта</p>
          </div>
          <Suspense fallback={<div className="w-full h-[500px] bg-emerald-900/20 rounded-2xl animate-pulse border border-emerald-500/30" />}>
            <DynamicMap userLocation={userLocation} />
          </Suspense>
        </div>
      </section>
      
      <About />
      <Footer />
    </main>
  );
}
