'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ChevronDown } from 'lucide-react';

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero секция */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-green-950/20 to-gray-950" />
        <div className="absolute inset-0 opacity-30" 
          style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(74,222,128,0.15) 1px, transparent 0)`, backgroundSize: '40px 40px' }} 
        />
        
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
        
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Будущее охоты уже здесь
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
            style={{ textShadow: '0 0 40px rgba(74, 222, 128, 0.6), 0 0 80px rgba(34, 211, 238, 0.4)' }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          >
            Экополяна<br />
            <span className="text-white">Технологии будущего</span>
          </motion.h1>
          
          <motion.p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            Современная охота с использованием дронов, AI-ассистентов и генетических технологий 
            для восстановления экосистем
          </motion.p>
          
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <a href="/map" className="btn-primary px-8 py-4">🗺️ Карта</a>
            <a href="/generator" className="btn-secondary px-8 py-4">✨ AI Генератор</a>
          </motion.div>
          
          <motion.div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          >
            {[
              { value: '50+', label: 'Локаций', color: 'text-green-400' },
              { value: '24/7', label: 'Мониторинг', color: 'text-cyan-400' },
              { value: 'AI', label: 'Технологии', color: 'text-blue-400' },
            ].map((stat) => (
              <motion.div key={stat.label} className="text-center" whileHover={{ scale: 1.05 }}>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-green-400" />
        </motion.div>
      </section>

      {/* Features секция */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-gradient">Технологии проекта</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Инновационный подход к сохранению и изучению природы</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🚁', title: 'Умная охота', desc: 'Дроны и AI для мониторинга дикой природы', gradient: 'from-green-500 to-cyan-500' },
              { icon: '🧬', title: 'Биотехнологии', desc: 'Генетическое восстановление редких видов', gradient: 'from-cyan-500 to-blue-500' },
              { icon: '👁️', title: 'AI Vision', desc: 'Компьютерное зрение для анализа в реальном времени', gradient: 'from-blue-500 to-purple-500' },
            ].map((f, i) => (
              <motion.div key={i} className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white text-2xl mb-4 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About секция */}
      <section id="about" className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-black mb-6 text-gradient">О проекте Экополяна</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Экополяна — это инновационная платформа, объединяющая современные технологии охоты 
                с экологическим мониторингом и восстановлением природных экосистем.
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
            <motion.div className="relative" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="aspect-square rounded-2xl glass-panel border border-green-500/30 p-8">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 flex items-center justify-center">
                  <motion.span className="text-7xl" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>🌍</motion.span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
