// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Начало конвертации:', new Date().toISOString());

  try {
    // 1. Получаем данные формы
    console.log('📦 Получение formData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dadataApiKey = formData.get('dadataApiKey') as string;
    const enablePostalSearch = formData.get('enablePostalSearch') === 'true';

    console.log('📁 Файл:', file?.name, 'Размер:', file?.size, 'DaData:', enablePostalSearch);

    // 2. Проверка файла
    if (!file) {
      console.log('❌ Файл не предоставлен');
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ Файл слишком большой:', file.size);
      return NextResponse.json({ error: 'Файл слишком большой. Максимум: 10MB' }, { status: 400 });
    }

    // 3. Чтение файла
    console.log('📖 Чтение файла...');
    const bytes = await file.arrayBuffer();
    console.log('📊 Размер буфера:', bytes.byteLength);

    // 4. Парсинг XLSX
    console.log('🔄 Парсинг XLSX...');
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 5. Конвертация в JSON
    console.log('🔄 Конвертация в JSON...');
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
    console.log('📊 Количество записей:', jsonData.length);

    if (jsonData.length > 1000) {
      console.log('❌ Слишком много записей:', jsonData.length);
      return NextResponse.json({ error: 'Слишком много записей. Максимум: 1000' }, { status: 400 });
    }

    // 6. Обработка данных
    console.log('🔄 Обработка данных...');
    const enrichedData = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const record = jsonData[i];
      const enrichedRecord = { ...record };

      // Добавляем метаданные
      enrichedRecord.processed_at = new Date().toISOString();
      enrichedRecord.record_id = i + 1;
      
      enrichedData.push(enrichedRecord);
      
      // Лог каждые 100 записей
      if ((i + 1) % 100 === 0) {
        console.log(`✅ Обработано ${i + 1} записей`);
      }
    }

    console.log('✅ Всего обработано:', enrichedData.length, 'записей');

    // 7. Создание JSON файла
    console.log('📝 Создание JSON...');
    const jsonString = JSON.stringify(enrichedData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');
    
    const endTime = Date.now();
    console.log('✅ Конвертация завершена за', endTime - startTime, 'ms');

    // 8. Отправка файла
    return new NextResponse(jsonBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="converted_${Date.now()}.json"`,
        'Content-Length': jsonBuffer.length.toString()
      }
    });

  } catch (error) {
    const endTime = Date.now();
    console.error('❌ Ошибка конвертации через', endTime - startTime, 'ms:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при конвертации файла',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка',
        time: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
