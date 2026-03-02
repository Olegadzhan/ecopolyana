// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// ============================================================================
// ROUTE SEGMENT CONFIG - КРИТИЧЕСКИ ВАЖНО ДЛЯ VERCEL
// ============================================================================
export const runtime = 'nodejs'; // Не edge!
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 секунд (требуется Pro тариф Vercel)
export const revalidate = 0;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface ConversionOptions {
  enablePostalSearch: boolean;
  dadataApiKey?: string;
}

interface ConversionResult {
  success: boolean;
  jobId: string;
  message: string;
  huntersCount: number;
  ticketsCount: number;
  downloadUrl: string;
  processingTime: number;
}

// ============================================================================
// HELPER: PARSE EXCEL/CSV
// ============================================================================
function parseFile(buffer: Buffer, fileName: string): any[] {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    return result.data.filter((row: any) => 
      row && Object.values(row).some(v => v && String(v).trim())
    );
  }
  
  // Excel
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  return data.filter((row: any) => 
    row && Object.values(row).some(v => v && String(v).trim())
  );
}

// ============================================================================
// HELPER: NORMALIZE DATA
// ============================================================================
function normalizeDate(value: any): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().split('T')[0];
  
  const str = String(value).trim();
  
  // Уже в нужном формате
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  // Парсинг различных форматов
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];
  
  for (const fmt of formats) {
    const match = str.match(fmt);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  
  return str;
}

function normalizePhone(value: any): string {
  if (!value) return '';
  
  let phone = String(value).trim();
  
  // Обработка научной нотации Excel
  if (phone.toLowerCase().includes('e+')) {
    try {
      phone = String(Math.floor(parseFloat(phone)));
    } catch {
      return phone;
    }
  }
  
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  
  if (digits.startsWith('7') || digits.startsWith('8')) {
    if (digits.length >= 11) return `+7${digits.slice(-10)}`;
    return `+7${digits.slice(1).padStart(10, '0')}`;
  }
  
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+7${digits.slice(1)}`;
  
  return `+7${digits.slice(-10).padStart(10, '0')}`;
}

function normalizeSnils(value: any): string {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return String(value).trim();
}

function normalizePostalCode(value: any): string {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 6 ? digits : String(value).trim();
}

function toSafeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

// ============================================================================
// HELPER: FORMAT HUNTER RECORD
// ============================================================================
function formatHunter(row: Record<string, any>, selectedRegion?: string) {
  return {
    date_entry: normalizeDate(row['date_entry'] || row['Дата внесения в реестр']),
    municipality: {
      code: toSafeString(row['municipality_code'] || row['Код муниципального образования']),
      name: toSafeString(row['municipality_name'] || row['Название муниципального образования']),
    },
    surname: toSafeString(row['surname'] || row['Фамилия']),
    hunter_name: toSafeString(row['hunter_name'] || row['Имя']),
    patronymic: toSafeString(row['patronymic'] || row['Отчество']),
    birth_date: normalizeDate(row['birth_date'] || row['Дата рождения']),
    birth_place: toSafeString(row['birth_place'] || row['Место рождения']),
    postal_address: toSafeString(row['postal_address'] || row['Почтовый адрес']),
    postal_code: normalizePostalCode(row['postal_code'] || row['Почтовый индекс']),
    phone: normalizePhone(row['phone'] || row['Телефон']),
    email: toSafeString(row['email'] || row['Email']),
    address: toSafeString(row['address'] || row['Адрес проживания']),
    snils_code: normalizeSnils(row['snils_code'] || row['СНИЛС']),
    series_passport: toSafeString(row['series_passport'] || row['Серия паспорта']).replace(/\s/g, ''),
    number_passport: toSafeString(row['number_passport'] || row['Номер паспорта']).replace(/\s/g, ''),
    date_issue: normalizeDate(row['date_issue'] || row['Дата выдачи паспорта']),
    issued_by: toSafeString(row['issued_by'] || row['Кем выдан']),
    nationality: {
      code: toSafeString(row['nationality_code'] || row['Код национальности из справочника «Национальность»']),
      name: toSafeString(row['nationality_name'] || row['Национальность из справочника «Национальность»']),
    },
    link: toSafeString(row['link'] || row['Ссылка']),
    traditional_residence_places: [],
    organization_id: {
      organizations_type: row['organization_type'] ? { name: toSafeString(row['organization_type']) } : undefined,
      unique_inn: toSafeString(row['organization_inn'] || row['ИНН организации']),
    },
    identity_type: {
      code: toSafeString(row['identity_type_code'] || row['Код типа документа']),
      name: toSafeString(row['identity_type_name'] || row['Название типа документа']),
    },
    series_ticket: toSafeString(row['series_ticket'] || row['Серия билета']).replace(/\s/g, ''),
    number_ticket: toSafeString(row['number_ticket'] || row['Номер билета']).replace(/\s/g, ''),
    date_issue_ticket: normalizeDate(row['date_issue_ticket'] || row['Дата выдачи']),
    ...(selectedRegion && { region_name: selectedRegion }),
  };
}

// ============================================================================
// HELPER: FORMAT TICKET RECORD
// ============================================================================
function formatTicket(row: Record<string, any>) {
  const indigenous = String(row['is_belonged_to_indigenous_people'] || '').trim().toLowerCase();
  const indigenousValue = ['true', '1', 'да', 'yes'].includes(indigenous) 
    ? 'true' 
    : 'false';
  
  return {
    date_entry: normalizeDate(row['date_entry'] || row['Дата внесения в реестр']),
    series: toSafeString(row['series_ticket'] || row['Серия билета']).replace(/\s/g, ''),
    number: toSafeString(row['number_ticket'] || row['Номер билета']).replace(/\s/g, ''),
    date_issue: normalizeDate(row['date_issue_ticket'] || row['Дата выдачи']),
    hunter_id: {
      series_passport: toSafeString(row['series_passport'] || row['Серия паспорта']).replace(/\s/g, ''),
      number_passport: toSafeString(row['number_passport'] || row['Номер паспорта']).replace(/\s/g, ''),
      date_issue: normalizeDate(row['date_issue'] || row['Дата выдачи паспорта']),
      issued_by: toSafeString(row['issued_by'] || row['Кем выдан']),
    },
    is_belonged_to_indigenous_people: indigenousValue,
    cancellation_date: normalizeDate(row['cancellation_date'] || row['Дата аннулирования']),
    cancellation_reason: {
      name: toSafeString(row['cancellation_reason_name'] || row['основания для аннулирования']),
    },
  };
}

// ============================================================================
// MAIN POST HANDLER
// ============================================================================
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const jobId = uuidv4();
  
  try {
    // ------------------------------------------------------------------------
    // 1. ВАЛИДАЦИЯ ЗАПРОСА
    // ------------------------------------------------------------------------
    const contentLength = request.headers.get('content-length');
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB для Vercel
    
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Файл слишком большой. Максимум 10MB' },
        { status: 413 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsRaw = formData.get('enablePostalSearch') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не загружен' },
        { status: 400 }
      );
    }
    
    const options: ConversionOptions = {
      enablePostalSearch: optionsRaw === 'true',
      dadataApiKey: formData.get('dadataApiKey') as string,
    };
    
    // ------------------------------------------------------------------------
    // 2. ЧТЕНИЕ И ПАРСИНГ ФАЙЛА
    // ------------------------------------------------------------------------
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const rows = parseFile(fileBuffer, file.name);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Файл не содержит данных' },
        { status: 400 }
      );
    }
    
    // ------------------------------------------------------------------------
    // 3. ОБРАБОТКА ДАННЫХ (БЕЗ DADATA если отключено)
    // ------------------------------------------------------------------------
    const huntersData: any[] = [];
    const ticketsData: any[] = [];
    
    for (const row of rows) {
      // Пропускаем полностью пустые строки
      if (!Object.values(row).some(v => v && String(v).trim())) {
        continue;
      }
      
      const hunter = formatHunter(row);
      const ticket = formatTicket(row);
      
      huntersData.push(hunter);
      ticketsData.push(ticket);
    }
    
    // ------------------------------------------------------------------------
    // 4. ПОДГОТОВКА ОТВЕТА
    // ------------------------------------------------------------------------
    const processingTime = Date.now() - startTime;
    
    // Возвращаем JSON напрямую (без сохранения файлов на Vercel)
    const result: ConversionResult = {
      success: true,
      jobId,
      message: 'Конвертация завершена',
      huntersCount: huntersData.length,
      ticketsCount: ticketsData.length,
      downloadUrl: `/api/download/${jobId}`,
      processingTime,
    };
    
    // Кэшируем данные в памяти для скачивания (упрощённо)
    // В продакшене используйте Redis или S3
    (global as any).__conversionCache = (global as any).__conversionCache || {};
    (global as any).__conversionCache[jobId] = {
      hunters: huntersData,
      tickets: ticketsData,
      expires: Date.now() + 3600000, // 1 час
    };
    
    return NextResponse.json(result, {
      headers: {
        'X-Processing-Time': `${processingTime}ms`,
        'X-Job-Id': jobId,
      },
    });
    
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[CONVERT ERROR]', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Внутренняя ошибка сервера',
        details: error?.message || String(error),
        jobId,
        processingTime,
      },
      { status: 500 }
    );
  }
}
