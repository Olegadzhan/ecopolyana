/** @type {import('next').NextConfig} */
const nextConfig = {
  // === РЕЖИМ ВЫВОДА ДЛЯ VERCEL ===
  // 'standalone' уменьшает размер сборки, копируя только необходимые файлы
  output: 'standalone',

  // === НАСТРОЙКИ API ROUTES ===
  api: {
    // Максимальный размер тела запроса для API routes
    bodyParser: {
      sizeLimit: '50mb', // Лимит для загрузки Excel файлов
    },
    // Таймаут для API routes (в миллисекундах)
    responseLimit: false, // Отключаем автоматическое ограничение ответа
  },

  // === РЕАКТ СТРОГИЙ РЕЖИМ (отключаем для продакшена) ===
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // === ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ ===
  images: {
    // Разрешенные домены для оптимизации изображений
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Форматы изображений для оптимизации
    formats: ['image/webp', 'image/avif'],
    // Минимальное качество для сжатия
    minimumCacheTTL: 60,
  },

  // === WEBPACK КОНФИГУРАЦИЯ ===
  webpack: (config, { isServer, dev, webpack }) => {
    // Настройки только для серверной сборки
    if (isServer) {
      // Разрешаем нативные Node.js модули для работы с Python
      config.externals = [
        ...(config.externals || []),
        'child_process',
        'fs',
        'path',
        'os',
        'util',
        'stream',
        'crypto',
        'zlib',
      ];

      // Игнорируем предупреждения о динамических импортах Python
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(python|pyinstaller|pywin32)$/,
        })
      );
    }

    // Настройки для клиентской сборки
    if (!isServer) {
      // Оптимизация клиентского бандла
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Выделяем общие зависимости в отдельный чанк
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            // Выделяем библиотеки UI в отдельный чанк
            ui: {
              test: /[\\/]node_modules[\\/](react|react-dom|@mui|@headlessui)[\\/]/,
              name: 'ui-libraries',
              priority: -10,
            },
          },
        },
      };
    }

    // Отключаем source maps в продакшене для уменьшения размера
    if (!dev) {
      config.devtool = false;
    }

    return config;
  },

  // === ENVIRONMENT VARIABLES ===
  // Переменные окружения, доступные на клиенте (префикс NEXT_PUBLIC_)
  env: {
    // Пример: NEXT_PUBLIC_API_URL будет доступен в браузере
    NEXT_PUBLIC_APP_NAME: 'Экополяна',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // === ASSET PREFIX ДЛЯ CDN (опционально) ===
  // assetPrefix: process.env.ASSET_PREFIX || '',

  // === BASE PATH ДЛЯ РАЗВЕРТЫВАНИЯ В ПОДПАПКЕ ===
  // basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // === TRAILING SLASH ===
  // Добавляет слэш в конце URL (для SEO и кэширования)
  trailingSlash: false,

  // === COMPRESS ===
  // Включает gzip сжатие для статики
  compress: true,

  // === POWERED BY HEADER ===
  // Убирает заголовок X-Powered-By: Next.js (безопасность)
  poweredByHeader: false,

  // === EXPERIMENTAL FEATURES (с осторожностью) ===
  experimental: {
    // Оптимизация серверных компонентов (если используете RSC)
    serverComponentsExternalPackages: [
      'sharp',
      'canvas',
      'python',
    ],
    // Улучшенная обработка больших файлов
    largePageDataBytes: 10 * 1024 * 1024, // 10MB лимит для page data
    // Оптимизация сборки
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-*',
      'date-fns',
    ],
  },

  // === TYPESCRIPT CONFIG ===
  typescript: {
    // Игнорировать ошибки TypeScript при сборке (для CI/CD)
    ignoreBuildErrors: process.env.CI === 'true',
    // Путь к tsconfig.json
    tsconfigPath: './tsconfig.json',
  },

  // === ESLINT CONFIG ===
  eslint: {
    // Игнорировать ошибки ESLint при сборке (для CI/CD)
    ignoreDuringBuilds: process.env.CI === 'true',
    // Директории для проверки
    dirs: ['src/app', 'src/components', 'src/lib'],
  },

  // === REDIRECTS (перенаправления) ===
  async redirects() {
    return [
      // Пример: редирект со старой страницы на новую
      {
        source: '/old-converter',
        destination: '/smart-hunting',
        permanent: true,
      },
      // Редирект API для совместимости
      {
        source: '/api/v1/convert',
        destination: '/api/convert',
        permanent: false,
      },
    ];
  },

  // === REWRITES (проксирование) ===
  async rewrites() {
    return [
      // Пример: проксирование запросов к внешнему API
      {
        source: '/api/dadata/:path*',
        destination: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/:path*',
      },
    ];
  },

  // === HEADERS (CORS и безопасность) ===
  async headers() {
    return [
      {
        // Заголовки для всех API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Заголовки безопасности для всего приложения
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
