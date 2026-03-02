// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Типы
type OktmoRecord = {
  code: string;
  parentCode: string | null;
  name: string;
  postal_code?: string;
};

// Загрузка справочника ОКТМО (с кэшированием)
let oktmoCache: OktmoRecord[] | null = null;

async function loadOktmoFromCsv(): Promise<OktmoRecord[]> {
  if (oktmoCache) return oktmoCache;
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'templates', 'oktmo.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: ['code', 'parentCode', 'name', 'postal_code'],
      skip_empty_lines: true,
      delimiter: ';',
      relax_quotes: true,
    });
    
    oktmoCache = records.map((r: any) => ({
      ...r,
      parentCode: r.parentCode || null,
    }));
    
    return oktmoCache;
  } catch (error) {
    console.error('Ошибка загрузки справочника ОКТМО:', error);
    return [];
  }
}

// Поиск почтового индекса
async function findPostalCode(
  address: string, 
  dadataApiKey?: string
): Promise<string | null> {
  if (!address) return null;

  // 1. Поиск по локальному справочнику
  const oktmoRecords = await loadOktmoFromCsv();
  
  // Простой поиск по вхождению названия (можно улучшить)
  const localMatch = oktmoRecords.find(record => 
    record.postal_code && 
    address.toLowerCase().includes(record.name.toLowerCase())
  );
  
  if (localMatch?.postal_code) {
    return localMatch.postal_code;
  }

  // 2. Поиск через DaData (если есть ключ)
  if (dadataApiKey) {
    try {
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${dadataApiKey}`
        },
        body: JSON.stringify({ 
          query: address, 
          count: 1,
          language: 'ru'
        })
      });

      if (!response.ok) {
        throw new Error(`DaData API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        return data.suggestions[0].data.postal_code || null;
      }
    } catch (error) {
      console.error('Ошибка при запросе к DaData:', error);
      return null;
    }
  }

  return null;
}

// Поиск кода ОКТМО по адресу
async function findOktmoCode(address: string): Promise<string | null> {
  if (!address) return null;
  
  const oktmoRecords = await loadOktmoFromCsv();
  
  // Поиск по вхождению названия
  const match = oktmoRecords.find(record => 
    address.toLowerCase().includes(record.name.toLowerCase())
  );
  
  return match?.code || null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const regionCode = formData.get('regionCode') as string;
    const dadataApiKey = formData.get('dadataApiKey') as string;
    const enablePostalSearch = formData.get('enablePostalSearch') === 'true';
    const enableOktmo = formData.get('enableOktmo') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
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

    // Обогащение данных
    const enrichedData = await Promise.all(
      jsonData.map(async (record, index) => {
        const enrichedRecord = { ...record };

        // Добавляем код региона, если выбран
        if (regionCode) {
          enrichedRecord.region_code = regionCode;
        }

        // Поиск почтового индекса
        if (enablePostalSearch && record.postal_address) {
          const postalCode = await findPostalCode(record.postal_address, dadataApiKey);
          if (postalCode) {
            enrichedRecord.postal_code = postalCode;
          }
        }

        // Поиск кода ОКТМО
        if (enableOktmo && record.address) {
          const oktmoCode = await findOktmoCode(record.address);
          if (oktmoCode) {
            enrichedRecord.oktmo_code = oktmoCode;
          }
        }

        // Добавляем метаданные
        enrichedRecord.processed_at = new Date().toISOString();
        enrichedRecord.record_id = index + 1;

        return enrichedRecord;
      })
    );

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

// Увеличиваем лимит на размер файла
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
};
