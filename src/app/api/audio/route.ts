import { NextResponse } from 'next/server';

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;

/**
 * GET /api/audio
 * Генерация музыки через Pollinations Audio API
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const prompt = searchParams.get('prompt');
  const model = searchParams.get('model') || 'elevenmusic';
  const duration = searchParams.get('duration') || '30';
  const instrumental = searchParams.get('instrumental') || 'true';
  const seed = searchParams.get('seed') || Math.floor(Math.random() * 10000).toString();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
  }

  // URL для генерации музыки
  const audioUrl = `https://gen.pollinations.ai/audio/${encodeURIComponent(prompt)}?` + new URLSearchParams({
    model,
    duration,
    instrumental,
    seed,
  }).toString();

  console.log(`🎵 Generating music: ${prompt}`);

  try {
    const headers: HeadersInit = {
      'Accept': 'audio/mpeg, audio/*',
    };

    if (POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${POLLINATIONS_API_KEY}`;
    }

    const response = await fetch(audioUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(90000), // 90 секунд для музыки
    });

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Model': model,
          'X-Duration': duration,
        },
      });
    }

    if (response.status === 402) {
      return NextResponse.json(
        { 
          error: 'Insufficient pollen balance', 
          status: 402,
          message: 'Недостаточно средств для генерации музыки',
        }, 
        { status: 402 }
      );
    }

    const errorText = await response.text().catch(() => 'Unknown error');
    console.warn(`Audio API error: ${response.status}`, errorText);

    return NextResponse.json(
      { 
        error: 'Generation failed', 
        status: response.status,
      }, 
      { status: response.status }
    );

  } catch (error: any) {
    console.error('Audio proxy error:', error);
    
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Timeout', status: 504, message: 'Превышено время ожидания' }, 
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', status: 500 }, 
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
