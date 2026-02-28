import { NextResponse } from 'next/server';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

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
  const model = searchParams.get('model') || 'flux';
  const width = searchParams.get('width') || '1024';
  const height = searchParams.get('height') || '1024';

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
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
