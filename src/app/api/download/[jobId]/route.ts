// src/app/api/download/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  
  // Получаем данные из кэша
  const cache = (global as any).__conversionCache;
  
  if (!cache || !cache[jobId]) {
    return NextResponse.json(
      { error: 'Данные не найдены или истек срок хранения' },
      { status: 404 }
    );
  }
  
  const { hunters, tickets, expires } = cache[jobId];
  
  // Проверка срока жизни
  if (Date.now() > expires) {
    delete cache[jobId];
    return NextResponse.json(
      { error: 'Срок хранения данных истёк (1 час)' },
      { status: 410 }
    );
  }
  
  // Формируем комбинированный JSON
  const combined = {
    meta: {
      jobId,
      generatedAt: new Date().toISOString(),
      counts: {
        hunters: hunters.length,
        tickets: tickets.length,
      },
    },
    hunters,
    huntingtickets: tickets,
  };
  
  return new NextResponse(JSON.stringify(combined, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ecopolyana_converted_${jobId}.json"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
