// ============================================================================
// NEXT.JS CONFIGURATION - PRODUCTION READY
// Файл: next.config.mjs (ES Module syntax)
// Проект: Экополяна - Конвертер охотничьих данных
// Совместимость: Next.js 14.2.5 + Vercel
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
  // 'standalone' уменьшает размер сборки, но может вызывать проблемы с critters
  // Если возникают ошибки, попробуйте закомментировать эту строку
  output: 'standalone',

  // ========================================================================
  // REACT STRICT MODE
  // ========================================================================
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // ========================================================================
  // ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ NEXT.JS (ТОЛЬКО ВАЛИДНЫЕ СВОЙСТВА ДЛЯ 14.2.5)
  // ========================================================================
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: 'ecopolyana.vercel.app' },
      { protocol: 'https', hostname: '*.vercel.app' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: process.env.NODE_ENV === 'development',
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: 'inline',
  },

  // ========================================================================
  // WEBPACK КОНФИГУРАЦИЯ
  // ========================================================================
  webpack: (config, { isServer, dev, webpack, buildId }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'child_process', 'fs', 'path', 'os', 'util', 'stream', 'crypto',
        'zlib', 'https', 'http', 'url', 'querystring', 'net', 'tls', 'dns',
        'buffer', 'events', 'assert', 'string_decoder', 'tty', 'constants',
        'module', 'vm', 'readline', 'repl', 'inspector', 'async_hooks',
        'trace_events', 'perf_hooks', 'worker_threads', 'wasi',
      ];

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(python|pyinstaller|pywin32|pandas|openpyxl|xlrd|numpy|requests|packaging)$/,
        })
      );

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

    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            ui: {
              test: /[\\/]node_modules[\\/](react|react-dom|@mui|@headlessui|lucide-react|@radix-ui)[\\/]/,
              name: 'ui-libraries',
              priority: -10,
            },
            utils: {
              test: /[\\/]node_modules[\\/](lodash|date-fns|axios|uuid|papaparse|xlsx)[\\/]/,
              name: 'utils-libraries',
              priority: -15,
            },
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

    if (!dev) {
      config.devtool = false;
    }

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
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,

  // ========================================================================
  // EXPERIMENTAL FEATURES (использовать с осторожностью)
  // ========================================================================
  experimental: {
    // Оптимизация серверных компонентов
    serverComponentsExternalPackages: [
      'sharp', 'canvas', 'python', 'pandas', 'openpyxl', 'xlrd', 'requests',
    ],
    // Улучшенная обработка больших файлов для API routes
    largePageDataBytes: 10 * 1024 * 1024,
    // Оптимизация сборки для указанных пакетов
    optimizePackageImports: [
      'lucide-react', '@radix-ui/react-*', 'date-fns', 'lodash', 'axios', 'uuid', 'papaparse', 'xlsx',
    ],
    // Турбо-пак для ускорения сборки
    turbo: {
      rules: {
        '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
      },
      resolveAlias: {
        '@': './src',
        '@components': './src/components',
        '@lib': './src/lib',
      },
    },
    // ❌ ОТКЛЮЧЕНО: optimizeCss вызывает ошибку critters на Vercel
    // optimizeCss: true, // <-- ЗАКОММЕНТИРОВАНО
  },

  // ========================================================================
  // TYPESCRIPT CONFIGURATION
  // ========================================================================
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true' || process.env.VERCEL === '1',
    tsconfigPath: './tsconfig.json',
  },

  // ========================================================================
  // ESLINT CONFIGURATION
  // ========================================================================
  eslint: {
    ignoreDuringBuilds: process.env.CI === 'true' || process.env.VERCEL === '1',
    dirs: ['src/app', 'src/components', 'src/lib', 'src/utils', 'src/hooks'],
  },

  // ========================================================================
  // REDIRECTS
  // ========================================================================
  async redirects() {
    return [
      { source: '/old-converter', destination: '/smart-hunting', permanent: true },
      { source: '/api/v1/convert', destination: '/api/convert', permanent: false },
      { source: '/docs', destination: '/smart-hunting', permanent: true },
      { source: '/home', destination: '/', permanent: true },
    ];
  },

  // ========================================================================
  // REWRITES
  // ========================================================================
  async rewrites() {
    return [
      {
        source: '/api/dadata/:path*',
        destination: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/:path*',
      },
      {
        source: '/api/external-convert/:path*',
        destination: 'https://your-python-server.com/:path*',
      },
      { source: '/static/:path*', destination: '/:path*' },
    ];
  },

  // ========================================================================
  // SECURITY HEADERS
  // ========================================================================
  async headers() {
    return [
      {
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
        source: '/:path*.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot|otf)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
