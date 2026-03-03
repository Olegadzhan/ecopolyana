// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Отключаем все лишнее для максимальной скорости
export const runtime = 'nodejs';
export const maxDuration = 10; // Vercel Hobby лимит

export async function POST(request: NextRequest) {
  console.time('total');
  
  try {
    // 1. Максимально быстро получаем файл
    console.time('formData');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    console.timeEnd('formData');

    if (!file) {
      return NextResponse.json({ error: 'Нет файла' }, { status: 400 });
    }

    // 2. Читаем файл
    console.time('arrayBuffer');
    const bytes = await file.arrayBuffer();
    console.timeEnd('arrayBuffer');

    // 3. Парсим XLSX
    console.time('xlsx');
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.timeEnd('xlsx');

    // 4. Минимальная обработка (только ID)
    console.time('process');
    const enrichedData = jsonData.map((record: any, index) => ({
      ...record,
      record_id: index + 1
    }));
    console.timeEnd('process');

    // 5. Отправляем результат
    console.time('response');
    const jsonString = JSON.stringify(enrichedData);
    const response = new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="result.json"`,
      },
    });
    console.timeEnd('response');
    console.timeEnd('total');
    
    return response;

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Ошибка' },
      { status: 500 }
    );
  }
}
