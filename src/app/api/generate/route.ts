import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  const width = searchParams.get('width') || '1024';
  const height = searchParams.get('height') || '1024';
  const seed = searchParams.get('seed') || Math.floor(Math.random() * 10000).toString();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  try {
    // Пробуем получить изображение через наш сервер
    const response = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    // Получаем изображение как blob
    const imageBuffer = await response.arrayBuffer();
    
    // Возвращаем как изображение
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // Если прокси не сработал, возвращаем URL напрямую
    return NextResponse.json({ 
      url: pollinationsUrl,
      fallback: true 
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
