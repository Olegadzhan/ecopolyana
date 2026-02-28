import { NextResponse } from 'next/server';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

// Бесплатные модели (работают без pollen или с минимальным балансом)
const FREE_MODELS = ['flux', 'zimage', 'klein', 'nanobanana'];

// Премиум модели (требуют pollen)
const PREMIUM_MODELS = ['kontext', 'seedream', 'seedream-pro', 'gptimage', 'gptimage-large'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Проверка наличия ключа
  if (searchParams.get('keycheck') === 'true') {
    return NextResponse.json({ 
      configured: !!POLLINATIONS_API_KEY 
    });
  }
  
  const prompt = searchParams.get('prompt');
  const seed = searchParams.get('seed') || Math.floor(Math.random() * 10000).toString();
  let model = searchParams.get('model') || 'flux';
  const width = searchParams.get('width') || '1024';
  const height = searchParams.get('height') || '1024';

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }

  // Если премиум модель - пробуем бесплатную альтернативу
  if (PREMIUM_MODELS.includes(model)) {
    console.warn(`Premium model ${model} requested, falling back to flux`);
    model = 'flux'; // Автоматический fallback
  }

  // Официальный API Pollinations.ai
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
  
  try {
    const headers: HeadersInit = {
      'Accept': 'image/*',
    };

    // Добавляем API ключ если есть
    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(45000),
    });

    if (response.ok) {
      const imageBuffer = await response.arrayBuffer();
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Model': model,
        },
      });
    } else if (response.status === 402) {
      // Обработка ошибки 402 - недостаточно pollen
      console.error('402 Payment Required - insufficient pollen balance');
      
      // Пробуем fallback на бесплатную модель
      if (!FREE_MODELS.includes(model)) {
        const fallbackUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(45000),
        });
        
        if (fallbackResponse.ok) {
          const imageBuffer = await fallbackResponse.arrayBuffer();
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
              'X-Model': 'flux (fallback)',
              'X-Original-Model': model,
            },
          });
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Insufficient pollen balance', 
          status: 402,
          message: 'Premium models require pollen. Try Flux or ZImage (free).',
          freeModels: FREE_MODELS,
        }, 
        { status: 402 }
      );
    } else {
      const errorText = await response.text();
      console.warn(`Pollinations API error: ${response.status}`, errorText);
      
      return NextResponse.json(
        { 
          error: 'Generation failed', 
          status: response.status,
          details: errorText 
        }, 
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
