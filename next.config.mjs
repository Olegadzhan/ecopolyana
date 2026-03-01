/** @type {import('next').NextConfig} */
const nextConfig = {
  // === РЕЖИМ ВЫВОДА ДЛЯ VERCEL ===
  // 'standalone' уменьшает размер сборки, копируя только необходимые файлы
  output: 'standalone',

  // === REACT STRICT MODE ===
  // Отключаем строгий режим в продакшене для производительности
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // === ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ ===
  images: {
    // Разрешенные домены для оптимизации изображений Next.js Image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Форматы изображений для автоматической конвертации
    formats: ['image/webp', 'image/avif'],
    // Минимальное время кэширования оптимизированных изображений
    minimumCacheTTL: 60,
    // Качественное сжатие
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // === WEBPACK КОНФИГУРАЦИЯ ===
  webpack: (config, { isServer, dev, webpack, buildId }) => {
    // Настройки только для серверной сборки
    if (isServer) {
      // Разрешаем нативные Node.js модули для работы с внешними API
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
        'https',
        'http',
        'url',
        'querystring',
      ];

      // Игнорируем предупреждения о динамических импортах Python-скриптов
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(python|pyinstaller|pywin32|pandas|openpyxl)$/,
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
              test: /[\\/]node_modules[\\/](react|react-dom|@mui|@headlessui|lucide-react)[\\/]/,
              name: 'ui-libraries',
              priority: -10,
            },
            // Выделяем утилиты в отдельный чанк
            utils: {
              test: /[\\/]node_modules[\\/](lodash|date-fns|axios|uuid)[\\/]/,
              name: 'utils-libraries',
              priority: -15,
            },
          },
        },
      };
    }

    // Отключаем source maps в продакшене для уменьшения размера сборки
    if (!dev) {
      config.devtool = false;
    }

    // Добавляем алиасы для удобства импортов
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(process.cwd(), 'src'),
      '@components': path.join(process.cwd(), 'src/components'),
      '@lib': path.join(process.cwd(), 'src/lib'),
      '@api': path.join(process.cwd(), 'src/app/api'),
      '@utils': path.join(process.cwd(), 'src/utils'),
    };

    return config;
  },

  // === ENVIRONMENT VARIABLES ===
  // Переменные окружения, доступные на клиенте (префикс NEXT_PUBLIC_)
  env: {
    NEXT_PUBLIC_APP_NAME: 'Экополяна',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_API_BASE: '/api',
    NEXT_PUBLIC_DADATA_BASE_URL: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
  },

  // === TRAILING SLASH ===
  // Не добавляем слэш в конце URL для чистоты маршрутов
  trailingSlash: false,

  // === COMPRESS ===
  // Включаем gzip сжатие для статики и API ответов
  compress: true,

  // === POWERED BY HEADER ===
  // Убираем заголовок X-Powered-By: Next.js для безопасности
  poweredByHeader: false,

  // === EXPERIMENTAL FEATURES ===
  experimental: {
    // Оптимизация серверных компонентов (если используете RSC)
    serverComponentsExternalPackages: [
      'sharp',
      'canvas',
      'python',
      'pandas',
      'openpyxl',
    ],
    // Улучшенная обработка больших файлов для API routes
    largePageDataBytes: 10 * 1024 * 1024, // 10MB лимит для page data
    // Оптимизация сборки для указанных пакетов
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-*',
      'date-fns',
      'lodash',
      'axios',
    ],
    // Включаем турбо-пак для ускорения сборки
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // === TYPESCRIPT CONFIG ===
  typescript: {
    // Игнорировать ошибки TypeScript при сборке в CI/CD
    ignoreBuildErrors: process.env.CI === 'true',
    // Путь к tsconfig.json
    tsconfigPath: './tsconfig.json',
  },

  // === ESLINT CONFIG ===
  eslint: {
    // Игнорировать ошибки ESLint при сборке в CI/CD
    ignoreDuringBuilds: process.env.CI === 'true',
    // Директории для проверки линтером
    dirs: ['src/app', 'src/components', 'src/lib', 'src/utils'],
  },

  // === REDIRECTS (перенаправления) ===
  async redirects() {
    return [
      // Редирект со старой страницы конвертера на новую
      {
        source: '/old-converter',
        destination: '/smart-hunting',
        permanent: true,
      },
      // Редирект API v1 для обратной совместимости
      {
        source: '/api/v1/convert',
        destination: '/api/convert',
        permanent: false,
      },
      // Редирект документации
      {
        source: '/docs',
        destination: '/smart-hunting',
        permanent: true,
      },
    ];
  },

  // === REWRITES (проксирование) ===
  async rewrites() {
    return [
      // Проксирование запросов к Dadata API через наш сервер для CORS
      {
        source: '/api/dadata/:path*',
        destination: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/:path*',
      },
      // Проксирование запросов к внешнему Python-конвертеру (если вынесен)
      {
        source: '/api/external-convert/:path*',
        destination: 'https://your-python-server.com/:path*',
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
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-API-Key' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Заголовки безопасности для всего приложения
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
