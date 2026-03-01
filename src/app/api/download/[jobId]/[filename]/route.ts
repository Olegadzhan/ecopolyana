// src/app/api/download/[jobId]/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string; filename: string } }
) {
  const { jobId, filename } = params;
  const filePath = path.join(process.cwd(), 'temp', jobId, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = filename.endsWith('.json') 
    ? 'application/json' 
    : 'text/plain';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
