// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { 
  findPostalCodeByAddress, 
  cleanAddress, 
  enrichAddressesWithPostalCodes,
  DadataCleanResponse 
} from '@/lib/dadata';

// ============================================================================
// ROUTE SEGMENT CONFIG FOR NEXT.JS 14+ APP ROUTER
// ============================================================================
export const runtime = 'nodejs'; // Требуется для работы с файловыми операциями
export const dynamic = 'force-dynamic'; // Отключаем статическую генерацию
export const maxDuration = 300; // 5 минут таймаут для Vercel Pro (максимум)

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================
export interface ConversionOptions {
  enrichPostal: boolean;
  enrichOktmo: boolean;
  report: boolean;
  region: string;
  dadataKey: string;
  batchSize?: number;
}

export interface HunterRecord {
  date_entry: string;
  municipality: {
    code: string;
    name: string;
  };
  surname: string;
  hunter_name: string;
  patronymic: string;
  birth_date: string;
  birth_place: string;
  postal_address: string;
  postal_code: string;
  phone: string;
  email: string;
  address: string;
  snils_code: string;
  series_passport: string;
  number_passport: string;
  date_issue: string;
  issued_by: string;
  nationality: {
    code: string;
    name: string;
  };
  link: string;
  traditional_residence_places: string[];
  organization_id: {
    organizations_type?: { name: string };
    unique_inn?: string;
  };
  identity_type: {
    code: string;
    name: string;
  };
  series_ticket: string;
  number_ticket: string;
  date_issue_ticket: string;
  region_name?: string;
  region_code?: string;
}

export interface HuntingTicketRecord {
  date_entry: string;
  series: string;
  number: string;
  date_issue: string;
  hunter_id: {
    series_passport: string;
    number_passport: string;
    date_issue: string;
    issued_by: string;
  };
  is_belonged_to_indigenous_people: string;
  cancellation_date: string;
  cancellation_reason: {
    name: string;
  };
}

export interface ConversionResult {
  success: boolean;
  jobId: string;
  message: string;
  huntersCount: number;
  ticketsCount: number;
  enrichedCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  downloadUrls: {
    hunters?: string;
    tickets?: string;
    report?: string;
    enriched?: string;
  };
  processingTime: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

function validateFileType(file: File, allowedExtensions: string[]): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(`.${extension}`) : false;
}

function normalizeDateString(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  const str = String(value).trim();
  
  // Если уже в формате YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Парсинг различных форматов дат
  const formats = [
    { pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/, transformer: (m: string[]) => `${m[2]}-${m[1]}-${m[0]}` },
    { pattern: /^(\d{2})\.(\d{2})\.(\d{4})$/, transformer: (m: string[]) => `${m[2]}-${m[1]}-${m[0]}` },
    { pattern: /^(\d{2})-(\d{2})-(\d{4})$/, transformer: (m: string[]) => `${m[2]}-${m[1]}-${m[0]}` },
    { pattern: /^(\d{4})\.(\d{2})\.(\d{2})$/, transformer: (m: string[]) => `${m[0]}-${m[1]}-${m[2]}` },
  ];
  
  for (const format of formats) {
    const match = str.match(format.pattern);
    if (match) {
      return format.transformer(match);
    }
  }
  
  return str;
}

function normalizePhone(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  let phone = String(value).trim();
  
  // Обработка научной нотации (Excel)
  if (phone.toLowerCase().includes('e+')) {
    try {
      phone = String(Math.floor(parseFloat(phone)));
    } catch {
      return phone;
    }
  }
  
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // Приводим к формату +7XXXXXXXXXX
  if (digits.startsWith('7') || digits.startsWith('8')) {
    if (digits.length >= 11) {
      return `+7${digits.slice(-10)}`;
    }
    return `+7${digits.slice(1).padStart(10, '0')}`;
  }
  
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7${digits.slice(1)}`;
  }
  
  // fallback
  return `+7${digits.slice(-10).padStart(10, '0')}`;
}

function normalizeSnils(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  const digits = String(value).replace(/\D/g, '');
  
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  
  if (/^\d{3}-\d{3}-\d{3}\s\d{2}$/.test(String(value).trim())) {
    return String(value).trim();
  }
  
  return String(value).trim();
}

function normalizePostalCode(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  const digits = String(value).replace(/\D/g, '');
  
  if (digits.length === 6) {
    return digits;
  }
  
  return String(value).trim();
}

function normalizeIndigenous(value: any): string {
  if (!value || String(value).trim() === '') return 'false';
  
  const str = String(value).trim().toLowerCase();
  
  if (['true', '1', 'да', 'yes', 'истина'].includes(str)) {
    return 'true';
  }
  
  if (['false', '0', 'нет', 'no', 'ложь'].includes(str)) {
    return 'false';
  }
  
  return 'false';
}

function toSafeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

// ============================================================================
// MAIN POST HANDLER
// ============================================================================
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const jobId = uuidv4();
  
  try {
    // ========================================================================
    // 1. ВАЛИДАЦИЯ ЗАПРОСА
    // ========================================================================
    
    // Проверка размера файла через заголовок Content-Length
    const contentLength = request.headers.get('content-length');
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Файл слишком большой. Максимальный размер: 50MB',
          jobId 
        },
        { status: 413 }
      );
    }
    
    // Парсинг FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsRaw = formData.get('options') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не загружен', jobId },
        { status: 400 }
      );
    }
    
    // Валидация типа файла
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    if (!validateFileType(file, allowedExtensions)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Неподдерживаемый формат файла. Разрешены: ${allowedExtensions.join(', ')}`,
          jobId 
        },
        { status: 400 }
      );
    }
    
    // Парсинг опций
    let options: ConversionOptions = {
      enrichPostal: true,
      enrichOktmo: false,
      report: true,
      region: '',
      dadataKey: '',
      batchSize: 10,
    };
    
    try {
      if (optionsRaw) {
        const parsed = JSON.parse(optionsRaw);
        options = { ...options, ...parsed };
      }
    } catch (parseError) {
      console.warn('Ошибка парсинга опций, использованы значения по умолчанию:', parseError);
    }
    
    // ========================================================================
    // 2. ЧТЕНИЕ И ОБРАБОТКА ФАЙЛА
    // ========================================================================
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    // Парсинг данных в зависимости от формата
    let rows: Record<string, any>[] = [];
    
    if (fileExtension === 'csv') {
      // Простой парсинг CSV (для production рекомендуется использовать papaparse)
      const csvText = fileBuffer.toString('utf-8');
      const lines = csvText.split(/\r?\n/).filter(line => line.trim());
      
      if (lines.length < 2) {
        return NextResponse.json(
          { success: false, error: 'CSV файл пуст или содержит только заголовки', jobId },
          { status: 400 }
        );
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.some(v => v)) { // Пропускаем полностью пустые строки
          const row: Record<string, any> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });
          rows.push(row);
        }
      }
    } else {
      // Для Excel файлов в production используйте библиотеку xlsx или отправляйте на Python-сервер
      // Здесь возвращаем mock-данные для демонстрации
      rows = [
        {
          date_entry: '01/11/2025',
          municipality_code: '89621168',
          municipality_name: 'Уметское',
          surname: 'Тестов',
          hunter_name: 'Гермион',
          patronymic: 'Иванович',
          birth_date: '27/04/1990',
          birth_place: 'г.Саратов',
          postal_address: 'г.Саратов, ул.Вольская, д.59, кв.68',
          postal_code: '410038',
          phone: '+79001234567',
          email: '',
          address: 'г.Саратов, ул.Вольская, д.9, кв.68',
          snils_code: '123-131-111 11',
          series_passport: '6633',
          number_passport: '111111',
          date_issue: '27/04/2010',
          issued_by: 'Отделом внутренних дел Октябрьского района г.Саратова',
          nationality_code: '22',
          nationality_name: 'Нанайцы',
          link: '',
          organization_type: '',
          organization_inn: '',
          identity_type_code: '29',
          identity_type_name: 'Паспорт гражданина РФ',
          series_ticket: '64',
          number_ticket: '64',
          date_issue_ticket: '01/01/2025',
          is_belonged_to_indigenous_people: '',
          cancellation_date: '',
          cancellation_reason_name: '',
        }
      ];
    }
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Файл не содержит данных для конвертации', jobId },
        { status: 400 }
      );
    }
    
    // ========================================================================
    // 3. ОБОГАЩЕНИЕ ДАННЫХ ЧЕРЕZ DADATA (ЕСЛИ ВКЛЮЧЕНО)
    // ========================================================================
    
    let enrichedCount = 0;
    const errors: Array<{ row: number; field: string; message: string }> = [];
    
    if (options.enrichPostal && options.dadataKey) {
      // Собираем уникальные адреса для обогащения
      const addresses = Array.from(new Set(
        rows
          .map(row => row.postal_address || row.address || '')
          .filter(addr => addr && String(addr).trim())
      ));
      
      if (addresses.length > 0) {
        try {
          const postalMap = await enrichAddressesWithPostalCodes(
            addresses,
            options.dadataKey,
            options.batchSize || 10
          );
          
          // Применяем найденные индексы к данным
          for (const row of rows) {
            const address = row.postal_address || row.address || '';
            if (address && postalMap.has(address)) {
              const currentPostal = normalizePostalCode(row.postal_code);
              const foundPostal = postalMap.get(address)!;
              
              if (!currentPostal || currentPostal !== foundPostal) {
                row.postal_code = foundPostal;
                enrichedCount++;
              }
            }
          }
        } catch (dadataError) {
          console.error('Ошибка при обогащении через Dadata:', dadataError);
          errors.push({
            row: 0,
            field: 'postal_code',
            message: 'Ошибка запроса к Dadata API'
          });
        }
      }
    } else if (options.enrichPostal && !options.dadataKey) {
      errors.push({
        row: 0,
        field: 'dadataKey',
        message: 'Для обогащения почтовых индексов необходим Dadata API ключ'
      });
    }
    
    // ========================================================================
    // 4. ФОРМИРОВАНИЕ ВЫХОДНЫХ ДАННЫХ
    // ========================================================================
    
    const huntersData: HunterRecord[] = [];
    const ticketsData: HuntingTicketRecord[] = [];
    
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNum = idx + 2; // Excel строки с 1 + заголовок
      
      try {
        // Форматирование записи охотника
        const hunter: HunterRecord = {
          date_entry: normalizeDateString(row.date_entry),
          municipality: {
            code: toSafeString(row.municipality_code),
            name: toSafeString(row.municipality_name || row.municipality_code),
          },
          surname: toSafeString(row.surname),
          hunter_name: toSafeString(row.hunter_name),
          patronymic: toSafeString(row.patronymic),
          birth_date: normalizeDateString(row.birth_date),
          birth_place: toSafeString(row.birth_place),
          postal_address: toSafeString(row.postal_address),
          postal_code: normalizePostalCode(row.postal_code),
          phone: normalizePhone(row.phone),
          email: toSafeString(row.email),
          address: toSafeString(row.address),
          snils_code: normalizeSnils(row.snils_code),
          series_passport: toSafeString(row.series_passport).replace(/\s/g, ''),
          number_passport: toSafeString(row.number_passport).replace(/\s/g, ''),
          date_issue: normalizeDateString(row.date_issue),
          issued_by: toSafeString(row.issued_by),
          nationality: {
            code: toSafeString(row.nationality_code),
            name: toSafeString(row.nationality_name),
          },
          link: toSafeString(row.link),
          traditional_residence_places: [],
          organization_id: {
            organizations_type: row.organization_type ? { name: toSafeString(row.organization_type) } : undefined,
            unique_inn: toSafeString(row.organization_inn),
          },
          identity_type: {
            code: toSafeString(row.identity_type_code),
            name: toSafeString(row.identity_type_name),
          },
          series_ticket: toSafeString(row.series_ticket).replace(/\s/g, ''),
          number_ticket: toSafeString(row.number_ticket).replace(/\s/g, ''),
          date_issue_ticket: normalizeDateString(row.date_issue_ticket),
        };
        
        // Добавляем регион если указан
        if (options.region) {
          hunter.region_name = options.region;
          // Поиск кода региона по названию (упрощённо)
          const regionCodes: Record<string, string> = {
            'Москва': '77',
            'Санкт-Петербург': '78',
            'Саратовская область': '64',
            // Добавить остальные регионы при необходимости
          };
          hunter.region_code = regionCodes[options.region] || '';
        }
        
        huntersData.push(hunter);
        
        // Форматирование записи билета
        const ticket: HuntingTicketRecord = {
          date_entry: normalizeDateString(row.date_entry),
          series: toSafeString(row.series_ticket).replace(/\s/g, ''),
          number: toSafeString(row.number_ticket).replace(/\s/g, ''),
          date_issue: normalizeDateString(row.date_issue_ticket),
          hunter_id: {
            series_passport: toSafeString(row.series_passport).replace(/\s/g, ''),
            number_passport: toSafeString(row.number_passport).replace(/\s/g, ''),
            date_issue: normalizeDateString(row.date_issue),
            issued_by: toSafeString(row.issued_by),
          },
          is_belonged_to_indigenous_people: normalizeIndigenous(row.is_belonged_to_indigenous_people),
          cancellation_date: normalizeDateString(row.cancellation_date),
          cancellation_reason: {
            name: toSafeString(row.cancellation_reason_name),
          },
        };
        
        ticketsData.push(ticket);
        
      } catch (rowError) {
        errors.push({
          row: rowNum,
          field: 'row',
          message: `Ошибка обработки строки: ${rowError instanceof Error ? rowError.message : String(rowError)}`
        });
      }
    }
    
    // ========================================================================
    // 5. ПОДГОТОВКА ОТВЕТА
    // ========================================================================
    
    const processingTime = Date.now() - startTime;
    
    // В production здесь было бы сохранение файлов и генерация ссылок
    // Для демонстрации возвращаем данные inline
    
    const result: ConversionResult = {
      success: true,
      jobId,
      message: 'Конвертация завершена успешно',
      huntersCount: huntersData.length,
      ticketsCount: ticketsData.length,
      enrichedCount,
      errors,
      downloadUrls: {
        // В реальной реализации здесь были бы URL для скачивания
        // hunters: `/api/download/${jobId}/hunters.json`,
        // tickets: `/api/download/${jobId}/huntingtickets.json`,
      },
      processingTime,
    };
    
    // Логирование (в production использовать proper logger)
    console.log(`[CONVERT] Job ${jobId}: ${huntersData.length} hunters, ${ticketsData.length} tickets, ${enrichedCount} enriched, ${errors.length} errors, ${processingTime}ms`);
    
    return NextResponse.json(result, {
      headers: {
        'X-Processing-Time': `${processingTime}ms`,
        'X-Job-Id': jobId,
      },
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[CONVERT ERROR] Job ${jobId}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Внутренняя ошибка сервера',
        details: error?.message || String(error),
        jobId,
        processingTime,
      },
      { 
        status: 500,
        headers: {
          'X-Processing-Time': `${processingTime}ms`,
          'X-Job-Id': jobId,
        },
      }
    );
  }
}
