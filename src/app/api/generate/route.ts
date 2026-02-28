import { NextResponse } from 'next/server';

const providers = [
  {
    id: 'puter',
    url: (prompt: string, seed: number) => 
      `https://api.puter.com/v1/image/generate?prompt=${encodeURIComponent(prompt)}&width=1024&height=1024&seed=${seed}`,
  },
  {
    id: 'raphael',
    url: (prompt: string, seed: number) => 
      `https://api.raphael.app/v1/generate?prompt=${encodeURIComponent(prompt)}&width=1024&height=1024&seed=${seed}`,
  },
  {
    id: 'imagerouter',
    url: (prompt: string, seed: number) => 
      `https://api.imagerouter.io/v1/generate?prompt=${encodeURIComponent(prompt)}&width=1024&height=1024&seed=${seed}&model=flux`,
  },
  {
    id: 'pollinations',
    url: (prompt: string, seed: number) => 
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`,
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
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'image/*',
        },
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
      }
    } catch (error) {
      console.warn(`Provider ${provider.id} failed:`, error);
      continue;
    }
  }

  return NextResponse.json(
    { error: 'All providers failed', providers: providers.map(p => p.id) }, 
    { status: 503 }
  );
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
