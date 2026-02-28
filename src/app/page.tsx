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
            <a href="#ai-vision" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">AI Vision</a>
            <a href="#about" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">О проекте</a>
          </nav>
          {/* ✅ Кнопка "Войти" удалена */}
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
          <a href="#ai-vision" className="btn-secondary px-8 py-4 text-base">
            ✨ AI Vision
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
    {
      icon: '🚁',
      title: 'Умная охота',
      description: 'Использование дронов и AI-ассистентов для эффективного мониторинга',
      color: 'from-emerald-500 to-cyan-500'
    },
    {
      icon: '🧬',
      title: 'Биотехнологии',
      description: 'Генетическое восстановление редких видов животных',
      color: 'from-cyan-500 to-purple-500'
    },
  ];

  return (
    <section id="features" className="py-20 px-4 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient">Технологии проекта</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Инновационный подход к сохранению и изучению природы
          </p>
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

// ✅ НОВЫЙ РАЗДЕЛ: AI Vision - Генерация образов будущего
function AIVision() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const samplePrompts = [
    'Лес будущего с биолюминесцентными растениями',
    'Дрон-охотник с AI-визором в туманном лесу',
    'Генетически восстановленный олень в цифровой среде',
    'Эко-поселение с вертикальными садами и солнечными панелями',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Имитация генерации изображения (замените на реальный API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Placeholder изображение (замените на реальный результат от AI API)
    setGeneratedImage(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/600`);
    setIsGenerating(false);
  };

  return (
    <section id="ai-vision" className="py-20 px-4 bg-gradient-to-b from-emerald-950/30 to-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-4">
            <span>✨</span> AI Vision
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Генерация образов будущего
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Создавайте визуализации экосистем будущего с помощью искусственного интеллекта
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Панель управления */}
          <div className="card space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Опишите образ будущего</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Например: Биолюминесцентный лес с летающими дронами-наблюдателями..."
                className="input min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{prompt.length}/500</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-3">Примеры запросов:</p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(sample)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 
                               text-gray-300 hover:text-white border border-white/10 
                               transition-all truncate max-w-[200px]"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Сгенерировать образ
                </>
              )}
            </button>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500">
                💡 <strong>Совет:</strong> Чем детальнее описание, тем точнее результат. 
                Указывайте стиль, освещение, композицию.
              </p>
            </div>
          </div>

          {/* Результат генерации */}
          <div className="card min-h-[400px] flex items-center justify-center">
            {generatedImage ? (
              <div className="relative w-full">
                <img 
                  src={generatedImage} 
                  alt="Сгенерированный образ"
                  className="w-full rounded-xl border border-emerald-500/30 shadow-2xl"
                />
                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                  <button className="flex-1 btn-secondary py-2 text-sm">
                    📥 Скачать
                  </button>
                  <button 
                    onClick={() => setGeneratedImage(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 
                               text-gray-300 transition-colors"
                  >
                    🔄 Новая
                  </button>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-400 
                                rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">AI создаёт ваш образ...</p>
                <p className="text-xs text-gray-500 mt-2">Это может занять до 30 секунд</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-4">🎨</div>
                <p>Введите запрос и нажмите "Сгенерировать"</p>
                <p className="text-sm mt-2">для создания визуализации будущего</p>
              </div>
            )}
          </div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-gradient">О проекте Экополяна</span>
            </h2>
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

// ✅ Раздел "Контакты" УДАЛЁН по запросу

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
              <li><a href="#ai-vision" className="hover:text-emerald-400 transition-colors">AI Vision</a></li>
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
// ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ
// ============================================

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<UserLocation>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const requestLocation = () => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation([
              position.coords.latitude,
              position.coords.longitude
            ]);
          },
          () => {
            // Тихий фолбэк
          },
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
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="w-full h-[500px] bg-emerald-900/20 rounded-2xl animate-pulse border border-emerald-500/30" />
          </div>
        </section>
        <AIVision />
        <About />
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Фоновые эффекты */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Header />
      <Hero />
      <Features />
      
      {/* 🗺️ СЕКЦИЯ КАРТЫ */}
      <section id="map" className="py-16 px-4 bg-gradient-to-b from-gray-900 to-emerald-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
              🗺️ Интерактивная карта Экополяны
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Исследуйте территорию проекта, переключайте слои карты и находите 
              интересные локации
            </p>
          </div>
          
          <Suspense fallback={
            <div className="w-full h-[500px] bg-emerald-900/20 rounded-2xl animate-pulse border border-emerald-500/30" />
          }>
            <DynamicMap userLocation={userLocation} />
          </Suspense>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-400">
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-emerald-400 font-medium">🎯</span> Геолокация
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-emerald-400 font-medium">🗂️</span> 4 слоя карты
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-emerald-400 font-medium">📍</span> Маркеры локаций
            </div>
          </div>
        </div>
      </section>
      
      {/* ✨ AI VISION - Генерация образов */}
      <AIVision />
      
      <About />
      
      {/* ✅ Контакты удалены */}
      
      <Footer />
    </main>
  );
}
