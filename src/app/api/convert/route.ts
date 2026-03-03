// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Типы данных
interface ProcessedRow {
  [key: string]: any;
}

interface ConversionResult {
  success: boolean;
  data?: any[];
  error?: string;
  stats?: {
    total: number;
    processed: number;
    enriched: number;
    errors: number;
  };
  logs?: ConversionLog[];
}

interface ConversionLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  stage: 'file' | 'parse' | 'dadata' | 'process' | 'complete';
  message: string;
  details?: any;
}

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 секунд для Vercel Pro

export async function POST(request: NextRequest) {
  const logs: ConversionLog[] = [];
  const startTime = Date.now();

  const addLog = (
    level: ConversionLog['level'],
    stage: ConversionLog['stage'],
    message: string,
    details?: any
  ) => {
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      details
    });
  };

  try {
    addLog('info', 'file', 'Начало конвертации');
    
    // Получаем данные формы
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dadataApiKey = formData.get('dadataApiKey') as string;
    const enablePostalSearch = formData.get('enablePostalSearch') === 'true';

    if (!file) {
      addLog('error', 'file', 'Файл не предоставлен');
      return NextResponse.json({ 
        success: false, 
        error: 'Файл не предоставлен',
        logs 
      }, { status: 400 });
    }

    addLog('success', 'file', `Файл получен: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Проверка размера
    if (file.size > 10 * 1024 * 1024) {
      addLog('error', 'file', 'Файл превышает 10MB');
      return NextResponse.json({ 
        success: false, 
        error: 'Файл слишком большой. Максимум 10MB',
        logs 
      }, { status: 400 });
    }

    // Чтение файла
    addLog('info', 'parse', 'Чтение файла...');
    const bytes = await file.arrayBuffer();
    addLog('success', 'parse', `Файл прочитан: ${(bytes.byteLength / 1024).toFixed(2)} KB`);

    // Парсинг XLSX
    addLog('info', 'parse', 'Парсинг XLSX...');
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертация в JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    addLog('success', 'parse', `Найдено ${rawData.length} записей`);

    if (rawData.length === 0) {
      addLog('warning', 'parse', 'Файл не содержит данных');
      return NextResponse.json({ 
        success: true, 
        data: [],
        stats: { total: 0, processed: 0, enriched: 0, errors: 0 },
        logs 
      });
    }

    if (rawData.length > 1000) {
      addLog('warning', 'parse', `Превышен лимит записей (${rawData.length} > 1000)`);
      return NextResponse.json({ 
        success: false, 
        error: 'Слишком много записей. Максимум 1000',
        logs 
      }, { status: 400 });
    }

    // Обработка данных
    addLog('info', 'process', 'Начало обработки данных...');
    const processedData: ProcessedRow[] = [];
    let enrichedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 1;
      
      try {
        // Базовая обработка строки
        const processedRow: ProcessedRow = {};
        
        // Обработка всех полей
        for (const [key, value] of Object.entries(row)) {
          if (value === null || value === undefined || value === '') {
            processedRow[key] = '';
          } else if (typeof value === 'number' && Number.isInteger(value)) {
            // Целые числа сохраняем как числа (без кавычек)
            processedRow[key] = value;
          } else {
            processedRow[key] = String(value).trim();
          }
        }

        // Добавляем метаданные
        processedRow.record_id = i + 1;
        processedRow.processed_at = new Date().toISOString();

        // Поиск почтового индекса через DaData (если включено)
        if (enablePostalSearch && dadataApiKey && row.postal_address) {
          addLog('info', 'dadata', `Строка ${rowNum}: запрос к DaData для "${row.postal_address}"`);
          
          try {
            const dadataResponse = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Token ${dadataApiKey}`
              },
              body: JSON.stringify({ 
                query: row.postal_address,
                count: 1,
                language: 'ru'
              })
            });

            if (dadataResponse.ok) {
              const dadataData = await dadataResponse.json();
              if (dadataData.suggestions && dadataData.suggestions.length > 0) {
                const postalCode = dadataData.suggestions[0].data.postal_code;
                if (postalCode) {
                  processedRow.postal_code = String(postalCode);
                  enrichedCount++;
                  addLog('success', 'dadata', `Строка ${rowNum}: найден индекс ${postalCode}`);
                } else {
                  addLog('warning', 'dadata', `Строка ${rowNum}: индекс не найден`);
                }
              } else {
                addLog('warning', 'dadata', `Строка ${rowNum}: адрес не найден`);
              }
            } else {
              addLog('error', 'dadata', `Строка ${rowNum}: ошибка API (${dadataResponse.status})`);
            }
          } catch (error: any) {
            addLog('error', 'dadata', `Строка ${rowNum}: ошибка запроса - ${error.message}`);
          }

          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        processedData.push(processedRow);

        // Лог прогресса каждые 10 строк
        if ((i + 1) % 10 === 0) {
          addLog('info', 'process', `Обработано ${i + 1} из ${rawData.length} строк`);
        }

      } catch (error: any) {
        errorCount++;
        addLog('error', 'process', `Строка ${rowNum}: ошибка обработки - ${error.message}`);
        // Добавляем исходные данные с пометкой об ошибке
        processedData.push({
          ...row,
          record_id: i + 1,
          processed_at: new Date().toISOString(),
          processing_error: error.message
        });
      }
    }

    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);

    addLog('success', 'complete', `Конвертация завершена за ${processingTime} сек.`);
    addLog('success', 'complete', `Обработано: ${processedData.length}, Обогащено: ${enrichedCount}, Ошибок: ${errorCount}`);

    // Создаем JSON для скачивания
    const jsonString = JSON.stringify(processedData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');

    return new NextResponse(jsonBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="converted_${Date.now()}.json"`,
        'Content-Length': jsonBuffer.length.toString()
      }
    });

  } catch (error: any) {
    addLog('error', 'process', `Критическая ошибка: ${error.message}`);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Неизвестная ошибка',
      logs
    }, { status: 500 });
  }
}
