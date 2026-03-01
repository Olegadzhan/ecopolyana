// ============================================================================
// NEXT.JS CONFIGURATION - PRODUCTION READY
// Файл: next.config.mjs (ES Module syntax)
// Проект: Экополяна - Конвертер охотничьих данных
// ============================================================================

// ============================================================================
// ES MODULE IMPORTS (обязательно для .mjs файлов)
// ============================================================================
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ========================================================================
  // РЕЖИМ ВЫВОДА ДЛЯ VERCEL
  // ========================================================================
  // 'standalone' уменьшает размер сборки, копируя только необходимые файлы
  output: 'standalone',

  // ========================================================================
  // REACT STRICT MODE
  // ========================================================================
  // Отключаем строгий режим в продакшене для производительности
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // ========================================================================
  // ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ NEXT.JS
  // ========================================================================
  images: {
    // Разрешенные домены для оптимизации изображений Next.js Image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ecopolyana.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
      },
    ],
    // Форматы изображений для автоматической конвертации
    formats: ['image/webp', 'image/avif'],
    // Минимальное время кэширования оптимизированных изображений (в секундах)
    minimumCacheTTL: 60,
    // Разрешения для адаптивных изображений
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Качественное сжатие (массив значений, не одиночное число!)
    qualities: [75, 90],
    // Разрешить загрузку изображений с невалидным SSL (только для dev)
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // ========================================================================
  // WEBPACK КОНФИГУРАЦИЯ
  // ========================================================================
  webpack: (config, { isServer, dev, webpack, buildId }) => {
    // --------------------------------------------------------------------
    // Настройки только для серверной сборки
    // --------------------------------------------------------------------
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
        'net',
        'tls',
        'dns',
        'buffer',
        'events',
        'assert',
        'string_decoder',
        'tty',
        'constants',
        'module',
        'vm',
        'readline',
        'repl',
        'inspector',
        'async_hooks',
        'trace_events',
        'perf_hooks',
        'worker_threads',
        'wasi',
      ];

      // Игнорируем предупреждения о динамических импортах Python-скриптов
      // и библиотек, которые не нужны в серверной сборке Next.js
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(python|pyinstaller|pywin32|pandas|openpyxl|xlrd|numpy|requests|packaging)$/,
        })
      );

      // Добавляем алиасы для удобства импортов на сервере
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.join(process.cwd(), 'src'),
        '@components': path.join(process.cwd(), 'src/components'),
        '@lib': path.join(process.cwd(), 'src/lib'),
        '@api': path.join(process.cwd(), 'src/app/api'),
        '@utils': path.join(process.cwd(), 'src/utils'),
        '@types': path.join(process.cwd(), 'src/types'),
        '@hooks': path.join(process.cwd(), 'src/hooks'),
        '@styles': path.join(process.cwd(), 'src/styles'),
        '@public': path.join(process.cwd(), 'public'),
      };
    }

    // --------------------------------------------------------------------
    // Настройки для клиентской сборки
    // --------------------------------------------------------------------
    if (!isServer) {
      // Оптимизация клиентского бандла - code splitting
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
              test: /[\\/]node_modules[\\/](react|react-dom|@mui|@headlessui|lucide-react|@radix-ui)[\\/]/,
              name: 'ui-libraries',
              priority: -10,
            },
            // Выделяем утилиты в отдельный чанк
            utils: {
              test: /[\\/]node_modules[\\/](lodash|date-fns|axios|uuid|papaparse|xlsx)[\\/]/,
              name: 'utils-libraries',
              priority: -15,
            },
            // Выделяем стили в отдельный чанк
            styles: {
              type: 'css/mini-extract',
              name: 'styles',
              priority: -5,
              enforce: true,
            },
          },
        },
      };
    }

    // --------------------------------------------------------------------
    // Отключаем source maps в продакшене для уменьшения размера сборки
    // --------------------------------------------------------------------
    if (!dev) {
      config.devtool = false;
    }

    // --------------------------------------------------------------------
    // Настройка обработки SVG файлов через @svgr/webpack (опционально)
    // --------------------------------------------------------------------
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );
    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/;
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      });
    }

    return config;
  },

  // ========================================================================
  // ENVIRONMENT VARIABLES (доступные на клиенте)
  // ========================================================================
  // Переменные с префиксом NEXT_PUBLIC_ будут доступны в браузере
  env: {
    NEXT_PUBLIC_APP_NAME: 'Экополяна',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_API_BASE: '/api',
    NEXT_PUBLIC_DADATA_BASE_URL: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Платформа умной охоты с конвертером данных',
  },

  // ========================================================================
  // URL НАСТРОЙКИ
  // ========================================================================
  // Не добавляем слэш в конце URL для чистоты маршрутов
  trailingSlash: false,
  // Включаем gzip сжатие для статики и API ответов
  compress: true,
  // Убираем заголовок X-Powered-By: Next.js для безопасности
  poweredByHeader: false,

  // ========================================================================
  // EXPERIMENTAL FEATURES (использовать с осторожностью)
  // ========================================================================
  experimental: {
    // Оптимизация серверных компонентов (если используете RSC)
    serverComponentsExternalPackages: [
      'sharp',
      'canvas',
      'python',
      'pandas',
      'openpyxl',
      'xlrd',
      'requests',
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
      'uuid',
      'papaparse',
      'xlsx',
    ],
    // Включаем турбо-пак для ускорения сборки
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
      resolveAlias: {
        '@': './src',
        '@components': './src/components',
        '@lib': './src/lib',
      },
    },
    // Оптимизация CSS
    optimizeCss: true,
  },

  // ========================================================================
  // TYPESCRIPT CONFIGURATION
  // ========================================================================
  typescript: {
    // Игнорировать ошибки TypeScript при сборке в CI/CD
    ignoreBuildErrors: process.env.CI === 'true' || process.env.VERCEL === '1',
    // Путь к tsconfig.json
    tsconfigPath: './tsconfig.json',
  },

  // ========================================================================
  // ESLINT CONFIGURATION
  // ========================================================================
  eslint: {
    // Игнорировать ошибки ESLint при сборке в CI/CD
    ignoreDuringBuilds: process.env.CI === 'true' || process.env.VERCEL === '1',
    // Директории для проверки линтером
    dirs: ['src/app', 'src/components', 'src/lib', 'src/utils', 'src/hooks'],
  },

  // ========================================================================
  // REDIRECTS (перенаправления URL)
  // ========================================================================
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
      // Редирект корня на главную страницу
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // ========================================================================
  // REWRITES (проксирование запросов)
  // ========================================================================
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
      // Проксирование статических файлов из public
      {
        source: '/static/:path*',
        destination: '/:path*',
      },
    ];
  },

  // ========================================================================
  // SECURITY HEADERS (CORS и защита)
  // ========================================================================
  async headers() {
    return [
      {
        // Заголовки для всех API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-API-Key, X-Request-ID' },
          { key: 'Access-Control-Max-Age', value: '86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
      {
        // Кэширование для статических ассетов
        source: '/:path*.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot|otf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Кэширование для CSS и JS бандлов
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

// ============================================================================
// ES MODULE EXPORT (обязательно для .mjs файлов)
// ============================================================================
export default nextConfig;
