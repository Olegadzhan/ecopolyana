// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  // Логи для Vercel
  console.log(`[API] Начало конвертации в ${new Date().toISOString()}`);

  try {
    // 1. Получаем formData
    console.log('[API] Получение formData...');
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const enablePostalSearch = formData.get('enablePostalSearch') === 'true';
    console.log('[API] enablePostalSearch:', enablePostalSearch);

    // 2. Проверка файла
    if (!file) {
      console.log('[API] Ошибка: файл не предоставлен');
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }
    console.log(`[API] Файл получен: ${file.name}, размер: ${file.size} байт`);

    // 3. Чтение файла в буфер
    console.log('[API] Чтение файла в буфер...');
    const bytes = await file.arrayBuffer();
    console.log('[API] Буфер прочитан, размер:', bytes.byteLength);

    // 4. Парсинг XLSX
    console.log('[API] Парсинг XLSX...');
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log('[API] Лист найден:', sheetName);

    // 5. Конвертация в JSON
    console.log('[API] Конвертация листа в JSON...');
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`[API] Получено ${jsonData.length} записей`);

    // 6. Базовая обработка (просто добавляем ID)
    console.log('[API] Обогащение данных...');
    const enrichedData = jsonData.map((record, index) => ({
      ...record,
      record_id: index + 1,
      processed_at: new Date().toISOString(),
      // Здесь можно добавить логику DaData позже
    }));

    // 7. Создаем JSON строку
    console.log('[API] Создание JSON строки...');
    const jsonString = JSON.stringify(enrichedData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');
    const endTime = Date.now();

    console.log(`[API] УСПЕХ. Конвертация завершена за ${endTime - startTime}ms`);

    // 8. Возвращаем файл
    return new NextResponse(jsonBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="converted_${Date.now()}.json"`,
      },
    });

  } catch (error: any) {
    const endTime = Date.now();
    console.error(`[API] ОШИБКА через ${endTime - startTime}ms:`, error);
    return NextResponse.json(
      {
        error: 'Ошибка при конвертации',
        details: error?.message || 'Неизвестная ошибка',
      },
      { status: 500 }
    );
  }
}

// Увеличиваем лимит времени для Vercel (макс. для hobby-плана - 10 или 15 сек, но попробуем)
export const maxDuration = 30; // секунд
