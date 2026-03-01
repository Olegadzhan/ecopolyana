/** @type {import('next').NextConfig} */
const nextConfig = {
  // === РЕЖИМ ВЫВОДА ДЛЯ VERCEL ===
  output: 'standalone',

  // === НАСТРОЙКИ API ROUTES ===
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },

  // === REACT STRICT MODE ===
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // === ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ ===
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // === WEBPACK КОНФИГУРАЦИЯ ===
  webpack: (config, { isServer, dev, webpack }) => {
    if (isServer) {
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

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(python|pyinstaller|pywin32)$/,
        })
      );
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
              test: /[\\/]node_modules[\\/](react|react-dom|@mui|@headlessui)[\\/]/,
              name: 'ui-libraries',
              priority: -10,
            },
          },
        },
      };
    }

    if (!dev) {
      config.devtool = false;
    }

    return config;
  },

  // === ENVIRONMENT VARIABLES ===
  env: {
    NEXT_PUBLIC_APP_NAME: 'Экополяна',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // === TRAILING SLASH ===
  trailingSlash: false,

  // === COMPRESS ===
  compress: true,

  // === POWERED BY HEADER ===
  poweredByHeader: false,

  // === EXPERIMENTAL FEATURES ===
  experimental: {
    serverComponentsExternalPackages: [
      'sharp',
      'canvas',
      'python',
    ],
    largePageDataBytes: 10 * 1024 * 1024,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-*',
      'date-fns',
    ],
  },

  // === TYPESCRIPT CONFIG ===
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true',
    tsconfigPath: './tsconfig.json',
  },

  // === ESLINT CONFIG ===
  eslint: {
    ignoreDuringBuilds: process.env.CI === 'true',
    dirs: ['src/app', 'src/components', 'src/lib'],
  },

  // === REDIRECTS ===
  async redirects() {
    return [
      {
        source: '/old-converter',
        destination: '/smart-hunting',
        permanent: true,
      },
      {
        source: '/api/v1/convert',
        destination: '/api/convert',
        permanent: false,
      },
    ];
  },

  // === REWRITES ===
  async rewrites() {
    return [
      {
        source: '/api/dadata/:path*',
        destination: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/:path*',
      },
    ];
  },

  // === HEADERS ===
  async headers() {
    return [
      {
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

// ✅ ES MODULE EXPORT (вместо module.exports)
export default nextConfig;
