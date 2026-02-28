import { NextResponse } from 'next/server';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

if (!POLLINATIONS_API_KEY) {
  console.warn('⚠️ POLLINATIONS_API_KEY not configured');
}

const providers = [
  {
    id: 'pollinations-gen',
    url: (prompt: string, seed: number) => 
      `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`,
    requiresAuth: true,
  },
  {
    id: 'pollinations-image',
    url: (prompt: string, seed: number) => 
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`,
    requiresAuth: false,
  },
  {
    id: 'pollinations-p',
    url: (prompt: string, seed: number) => 
      `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}`,
    requiresAuth: false,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  const seed = searchParams.get('seed') || Math.floor(Math.random() * 10000).toString();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }

  // Пробуем каждый провайдер по очереди
  for (const provider of providers) {
    try {
      const url = provider.url(prompt, parseInt(seed));
      
      const headers: HeadersInit = {
        'Accept': 'image/*',
      };

      // Добавляем API ключ если требуется
      if (provider.requiresAuth && POLLINATIONS_API_KEY) {
        headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'X-Provider': provider.id,
          },
        });
      } else {
        console.warn(`Provider ${provider.id} returned ${response.status}`);
      }
    } catch (error) {
      console.warn(`Provider ${provider.id} failed:`, error);
      continue;
    }
  }

  return NextResponse.json(
    { 
      error: 'All providers failed', 
      message: 'Try again in a few moments or check your API key',
      providers: providers.map(p => p.id) 
    }, 
    { status: 503 }
  );
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
