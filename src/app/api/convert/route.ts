// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Поиск почтового индекса через DaData
async function findPostalCodeViaDadata(
  address: string,
  apiKey?: string
): Promise<string | null> {
  if (!apiKey || !address) return null;
  
  try {
    const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: JSON.stringify({ 
        query: address, 
        count: 1,
        language: 'ru'
      })
    });

    if (!response.ok) {
      console.warn(`DaData API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.suggestions?.[0]?.data?.postal_code || null;
  } catch (error) {
    console.error('Ошибка при запросе к DaData:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const regionCode = formData.get('regionCode') as string;
    const dadataApiKey = formData.get('dadataApiKey') as string;
    const enablePostalSearch = formData.get('enablePostalSearch') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    // Проверка размера файла (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимальный размер: 10MB' },
        { status: 400 }
      );
    }

    // Чтение XLSX файла
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертация в JSON
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    // Ограничение на количество записей (1000)
    if (jsonData.length > 1000) {
      return NextResponse.json(
        { error: 'Слишком много записей. Максимум: 1000' },
        { status: 400 }
      );
    }

    // Обогащение данных
    const enrichedData = [];
    
    for (let i = 0; i < jsonData.length; i++) {
      const record = jsonData[i];
      const enrichedRecord = { ...record };

      // Добавляем код региона, если выбран
      if (regionCode) {
        enrichedRecord.region_code = regionCode;
      }

      // Поиск почтового индекса через DaData
      if (enablePostalSearch && dadataApiKey && record.postal_address) {
        // Добавляем небольшую задержку между запросами, чтобы не превысить лимиты API
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const postalCode = await findPostalCodeViaDadata(record.postal_address, dadataApiKey);
        if (postalCode) {
          enrichedRecord.postal_code = postalCode;
        }
      }

      // Добавляем метаданные
      enrichedRecord.processed_at = new Date().toISOString();
      enrichedRecord.record_id = i + 1;

      enrichedData.push(enrichedRecord);
    }

    // Создаем JSON файл для скачивания
    const jsonString = JSON.stringify(enrichedData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');

    // Возвращаем файл
    return new NextResponse(jsonBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="converted_${Date.now()}.json"`,
        'Content-Length': jsonBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Ошибка конвертации:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при конвертации файла',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

// Настройки для Vercel
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 секунд максимальное время выполнения
