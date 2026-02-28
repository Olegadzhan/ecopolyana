import { NextResponse } from 'next/server';

// Получаем API ключ из переменных окружения
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

// Бесплатные модели изображений (не требуют pollen или минимальный баланс)
const FREE_IMAGE_MODELS = ['flux', 'zimage', 'klein', 'nanobanana'];

// Премиум модели (требуют pollen - автоматически заменяем на бесплатные)
const PREMIUM_IMAGE_MODELS = ['kontext', 'seedream', 'seedream-pro', 'gptimage', 'gptimage-large', 'nanobanana-pro', 'klein-large', 'imagen-4', 'grok-imagine'];

// Базовый URL официального API Pollinations
const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai';

/**
 * GET /api/generate
 * Генерация изображений через Pollinations.ai API
 * 
 * Параметры:
 * - prompt: текст запроса (обязательно)
 * - model: модель генерации (по умолчанию: flux)
 * - width: ширина изображения (по умолчанию: 1024)
 * - height: высота изображения (по умолчанию: 1024)
 * - seed: случайное зерно (по умолчанию: случайное)
 * - enhance: улучшить промпт через AI (по умолчанию: false)
 * - negative_prompt: что избегать в изображении (только flux, zimage)
 * - quality: качество изображения (только gptimage: low, medium, high, hd)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Проверка наличия API ключа (для админки)
  if (searchParams.get('keycheck') === 'true') {
    return NextResponse.json({ 
      configured: !!POLLINATIONS_API_KEY,
      key: POLLINATIONS_API_KEY ? `${POLLINATIONS_API_KEY.substring(0, 6)}...` : null
    });
  }
  
  // Получаем параметры запроса
  const prompt = searchParams.get('prompt');
  const model = searchParams.get('model') || 'flux';
  const seed = searchParams.get('seed') || Math.floor(Math.random() * 10000).toString();
  const width = searchParams.get('width') || '1024';
  const height = searchParams.get('height') || '1024';
  const enhance = searchParams.get('enhance') || 'false';
  const negativePrompt = searchParams.get('negative_prompt') || 'worst quality, blurry';
  const quality = searchParams.get('quality') || 'medium';

  // Проверка обязательного параметра
  if (!prompt) {
    return NextResponse.json(
      { 
        error: 'Prompt required',
        message: 'Параметр prompt обязателен для генерации изображения',
        status: 400
      }, 
      { status: 400 }
    );
  }

  // Проверка и замена премиум модели на бесплатную
  let activeModel = model;
  let modelWarning = null;
  
  if (PREMIUM_IMAGE_MODELS.includes(model)) {
    console.warn(`⚠️ Premium model "${model}" requested, falling back to flux`);
    modelWarning = `Model "${model}" requires pollen. Using flux instead.`;
    activeModel = 'flux';
  } else if (!FREE_IMAGE_MODELS.includes(model)) {
    console.warn(`⚠️ Unknown model "${model}", using flux`);
    activeModel = 'flux';
  }

  // Формируем URL официального API Pollinations
  // Документация: https://gen.pollinations.ai/image/{prompt}
  const imageUrl = `${POLLINATIONS_BASE_URL}/image/${encodeURIComponent(prompt)}?` + new URLSearchParams({
    model: activeModel,
    width: width,
    height: height,
    seed: seed,
    enhance: enhance,
    nologo: 'true',
    ...(activeModel === 'flux' || activeModel === 'zimage' ? { negative_prompt: negativePrompt } : {}),
    ...(activeModel.includes('gptimage') ? { quality } : {}),
  }).toString();

  console.log(`🖼️ Generating image with ${activeModel}...`);
  console.log(`URL: ${imageUrl}`);

  try {
    // Формируем заголовки запроса
    const headers: HeadersInit = {
      'Accept': 'image/jpeg, image/png, image/*',
      'User-Agent': 'Ecopolyana/1.0',
    };

    // Добавляем API ключ если есть (рекомендуется для стабильности)
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
      console.log('🔑 Using API key for authentication');
    } else {
      console.log('⚠️ No API key configured - using anonymous access');
    }
    
    // Делаем запрос к API Pollinations
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(60000), // 60 секунд таймаут
    });

    // Обработка успешного ответа
    if (response.ok) {
      const imageBuffer = await response.arrayBuffer();
      
      console.log(`✅ Image generated successfully (${imageBuffer.byteLength} bytes)`);
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable', // Кэш на 1 год
          'Access-Control-Allow-Origin': '*',
          'X-Model': activeModel,
          'X-Seed': seed,
          'X-Width': width,
          'X-Height': height,
          ...(modelWarning ? { 'X-Model-Warning': modelWarning } : {}),
        },
      });
    }
    
    // Обработка ошибки 402 (Payment Required - недостаточно pollen)
    if (response.status === 402) {
      console.error('❌ 402 Payment Required - insufficient pollen balance');
      
      const errorData = await response.json().catch(() => ({}));
      
      return NextResponse.json(
        { 
          error: 'Insufficient pollen balance', 
          status: 402,
          message: 'Недостаточно средств на балансе API ключа',
          details: errorData,
          suggestion: 'Используйте бесплатные модели: flux, zimage, klein, nanobanana',
          freeModels: FREE_IMAGE_MODELS,
        }, 
        { status: 402 }
      );
    }
    
    // Обработка ошибки 401 (Unauthorized - неверный API ключ)
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - invalid API key');
      
      return NextResponse.json(
        { 
          error: 'Invalid API key', 
          status: 401,
          message: 'Неверный или отсутствующий API ключ',
          suggestion: 'Проверьте POLLINATIONS_API_KEY в .env.local и Vercel Environment Variables',
        }, 
        { status: 401 }
      );
    }
    
    // Обработка ошибки 403 (Forbidden - нет доступа к модели)
    if (response.status === 403) {
      console.error('❌ 403 Forbidden - model access denied');
      
      return NextResponse.json(
        { 
          error: 'Model access denied', 
          status: 403,
          message: 'У вас нет доступа к этой модели',
          suggestion: 'Используйте бесплатные модели: flux, zimage, klein, nanobanana',
        }, 
        { status: 403 }
      );
    }
    
    // Обработка ошибки 429 (Rate Limited - слишком много запросов)
    if (response.status === 429) {
      console.error('❌ 429 Rate Limited - too many requests');
      
      return NextResponse.json(
        { 
          error: 'Rate limited', 
          status: 429,
          message: 'Слишком много запросов. Подождите немного.',
          suggestion: 'Повторите запрос через 30-60 секунд',
        }, 
        { status: 429 }
      );
    }
    
    // Обработка остальных ошибок
    console.warn(`❌ Pollinations API error: ${response.status}`);
    const errorText = await response.text().catch(() => 'Unknown error');
    
    return NextResponse.json(
      { 
        error: 'Generation failed', 
        status: response.status,
        message: `Ошибка API Pollinations: ${response.status}`,
        details: errorText,
      }, 
      { status: response.status }
    );
    
  } catch (error: any) {
    // Обработка ошибок сети и таймаутов
    console.error('❌ API proxy error:', error);
    
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Timeout', 
          status: 504,
          message: 'Превышено время ожидания генерации (60 секунд)',
          suggestion: 'Попробуйте снова или используйте меньшее разрешение',
        }, 
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        status: 500,
        message: 'Внутренняя ошибка сервера',
        details: error.message,
      }, 
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/generate
 * CORS preflight request
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 часа
    },
  });
}
