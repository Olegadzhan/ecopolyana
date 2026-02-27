'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Leaf, Target } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Home() {
  const { t } = useLanguage();
  
  usePageMeta(t('meta.title'), t('meta.description'));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 max-w-4xl w-full text-center space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="px-3 py-1 border border-green-500/30 rounded-full text-xs text-green-400 uppercase tracking-widest mb-4 inline-block bg-green-900/10">
            {t('home.system')}
          </span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">
            {t('home.title1')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">{t('home.title2')}</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            {t('home.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <FeatureCard 
            icon={<Target className="w-8 h-8 text-cyan-400" />}
            title={t('home.smartHunting')}
            desc={t('home.smartHuntingDesc')}
          />
          <FeatureCard 
            icon={<Leaf className="w-8 h-8 text-green-400" />}
            title={t('home.bioTech')}
            desc={t('home.bioTechDesc')}
          />
          <FeatureCard 
            icon={<Cpu className="w-8 h-8 text-purple-400" />}
            title={t('home.aiVision')}
            desc={t('home.aiVisionDesc')}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="pt-12"
        >
          <Link href="/generator">
            <button className="group relative px-8 py-4 bg-white text-black font-bold rounded-none overflow-hidden transition-all hover:scale-105">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                {t('home.launchGenerator')} <ArrowRight size={20} />
              </span>
            </button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-colors text-left">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}
