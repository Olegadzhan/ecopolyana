// src/components/SmartHuntingSection.tsx
import React, { useState } from 'react';
import { ConverterModal } from './ConverterModal';

export const SmartHuntingSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="relative py-20 bg-gray-950 overflow-hidden">
      {/* Future World Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-gray-950 to-gray-950 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Умная <span className="text-green-400">Охота</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Технологии будущего для управления охотничьими ресурсами
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Stats */}
          <div className="p-6 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl hover:border-green-500/30 transition-all">
            <h3 className="text-xl font-semibold text-white mb-2">Статистика</h3>
            <p className="text-gray-400 text-sm">Мониторинг популяции в реальном времени</p>
          </div>

          {/* Card 2: Map */}
          <div className="p-6 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl hover:border-green-500/30 transition-all">
            <h3 className="text-xl font-semibold text-white mb-2">Карта угодий</h3>
            <p className="text-gray-400 text-sm">Интерактивная навигация по зонам</p>
          </div>

          {/* Card 3: Converter Trigger */}
          <div 
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer group p-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/20 rounded-2xl hover:border-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:shadow-[0_0_25px_rgba(34,197,94,0.3)]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-green-400 group-hover:text-green-300">
                Конвертер Excel в JSON
              </h3>
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Инструмент обработки реестров
            </p>
            <span className="inline-block px-3 py-1 text-xs font-mono text-green-900 bg-green-400 rounded">
              Открыть инструмент
            </span>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      <ConverterModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
};
