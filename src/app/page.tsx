'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Map, Sparkles, Leaf, Drone, Dna, Eye, ChevronDown, ExternalLink } from 'lucide-react';
import DynamicMap from '@/components/map/DynamicMap';

export type UserLocation = [number, number] | null;

/*
.glass-panel {
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.text-gradient {
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(74, 222, 128, 0.3);
}
*/

// ============================================
// КОМПОНЕНТЫ
// ============================================

function Header() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/30">
              🌿
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
              style={{ textShadow: '0 0 30px rgba(74, 222, 128, 0.5)' }}
            >
              Экополяна
            </span>
          </motion.div>
          
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '#map', label: 'Карта', icon: Map },
              { href: '#features', label: 'Технологии', icon: Sparkles },
              { href: '#about', label: 'О проекте', icon: Leaf },
            ].map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={16} />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.a>
            ))}
            <motion.a
              href="/generator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-cyan-600 text-white font-medium hover:from-green-500 hover:to-cyan-500 transition-all shadow-lg shadow-green-500/20"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles size={16} />
              <span>AI Генератор</span>
              <ExternalLink size={14} />
            </motion.a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-green-950/20 to-gray-950" />
      <div className="absolute inset-0 opacity-30" 
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(74,222,128,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Glow эффекты */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Будущее охоты уже здесь
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
          style={{ textShadow: '0 0 40px rgba(74, 222, 128, 0.6), 0 0 80px rgba(34, 211, 238, 0.4)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Экополяна
          <br />
          <span className="text-white">Технологии будущего</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Современная охота с использованием дронов, AI-ассистентов и генетических технологий 
          для восстановления экосистем
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.a 
            href="#map" 
            className="bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(74, 222, 128, 0.5)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Map size={20} />
            Исследовать карту
          </motion.a>
          <motion.a 
            href="/generator" 
            className="glass-panel px-8 py-4 rounded-xl font-bold text-white hover:bg-white/10 transition-all border border-green-500/30 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={20} />
            AI Генератор
            <ExternalLink size={16} />
          </motion.a>
        </motion.div>

        {/* Статистика */}
        <motion.div 
          className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { value: '50+', label: 'Локаций', color: 'text-green-400' },
            { value: '24/7', label: 'Мониторинг', color: 'text-cyan-400' },
            { value: 'AI', label: 'Технологии', color: 'text-blue-400' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-green-400" />
      </motion.div>
    </section>
  );
}

function Features() {
  const features = [
    { 
      icon: Drone, 
      title: 'Умная охота', 
      description: 'Дроны и AI-ассистенты для эффективного мониторинга дикой природы',
      gradient: 'from-green-500 to-cyan-500',
      glow: 'shadow-green-500/30'
    },
    { 
      icon: Dna, 
      title: 'Биотехнологии', 
      description: 'Генетическое восстановление редких видов с помощью CRISPR',
      gradient: 'from-cyan-500 to-blue-500',
      glow: 'shadow-cyan-500/30'
    },
    { 
      icon: Eye, 
      title: 'AI Vision', 
      description: 'Компьютерное зрение для анализа поведения животных в реальном времени',
      gradient: 'from-blue-500 to-purple-500',
      glow: 'shadow-blue-500/30'
    },
  ];

  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4 text-gradient">
            Технологии проекта
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Инновационный подход к сохранению и изучению природы
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={feature.title}
              className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(74,222,128,0.2)` }}
            >
              <motion.div 
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white text-2xl mb-4 shadow-lg ${feature.glow} group-hover:scale-110 transition-transform`}
                whileHover={{ rotate: 5 }}
              >
                <feature.icon size={24} />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
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
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-6 text-gradient">
              О проекте Экополяна
            </h2>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Экополяна — это инновационная платформа, объединяющая современные технологии 
              охоты с экологическим мониторингом и восстановлением природных экосистем.
            </p>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Мы используем дроны, искусственный интеллект и генетические технологии для 
              создания устойчивой модели взаимодействия человека с природой.
            </p>
            <div className="flex flex-wrap gap-3">
              {['🌱 Экология', '🤖 AI/ML', '🚁 Дроны', '🧬 Биотех'].map((badge) => (
                <span key={badge} className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="aspect-square rounded-2xl glass-panel border border-green-500/30 p-8">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 flex items-center justify-center">
                <motion.span 
                  className="text-7xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  🌍
                </motion.span>
              </div>
            </div>
            <motion.div 
              className="absolute -top-4 -right-4 w-24 h-24 bg-green-500/20 rounded-full blur-2xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div 
              className="absolute -bottom-4 -left-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl"
              animate={{ scale: [1.2, 1, 1.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/10 glass-panel">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                🌿
              </div>
              <span className="text-xl font-black text-gradient">Экополяна</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Инновационная платформа для современной охоты и экологического мониторинга
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Навигация</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#map" className="hover:text-green-400 transition-colors flex items-center gap-2"><Map size={14}/> Карта</a></li>
              <li><a href="#features" className="hover:text-green-400 transition-colors flex items-center gap-2"><Sparkles size={14}/> Технологии</a></li>
              <li><a href="/generator" className="hover:text-green-400 transition-colors flex items-center gap-2"><Sparkles size={14}/> AI Генератор <ExternalLink size={12}/></a></li>
              <li><a href="#about" className="hover:text-green-400 transition-colors flex items-center gap-2"><Leaf size={14}/> О проекте</a></li>
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
        <div className="pt-20"><Hero /></div>
        <Features />
        <section className="py-16 px-4"><div className="max-w-7xl mx-auto"><div className="w-full h-[500px] glass-panel rounded-2xl animate-pulse border border-green-500/30" /></div></section>
        <About />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 selection:bg-green-500/30 selection:text-green-200">
      {/* Глобальные фоновые эффекты */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />
        <motion.div 
          className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 4 }}
        />
      </div>

      <Header />
      <Hero />
      <Features />
      
      {/* 🗺️ Карта */}
      <section id="map" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-gradient">
              🗺️ Интерактивная карта
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Исследуйте территорию проекта с переключением слоёв и геолокацией
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel rounded-2xl overflow-hidden border border-green-500/30 shadow-2xl shadow-green-500/10"
          >
            <Suspense fallback={
              <div className="w-full h-[500px] bg-gray-900/50 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <DynamicMap userLocation={userLocation} />
            </Suspense>
          </motion.div>

          <motion.div 
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {[
              { icon: '🎯', text: 'Геолокация' },
              { icon: '🗂️', text: '4 слоя карты' },
              { icon: '📍', text: 'Маркеры локаций' },
            ].map((item) => (
              <div key={item.text} className="p-3 glass-panel rounded-xl border border-white/10">
                <span className="text-green-400 font-medium">{item.icon}</span> {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>
      
      <About />
      <Footer />
    </main>
  );
}
