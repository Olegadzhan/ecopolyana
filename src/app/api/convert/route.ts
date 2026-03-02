// src/app/api/convert/route.ts
// ============================================================================
// API ROUTE: Конвертер Excel/CSV в JSON для охотничьих данных
// Проект: Экополяна | Версия: 1.0.0 | Совместимость: Next.js 14.2.5 + Vercel
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs'; // Требуется для работы с буферами и внешними библиотеками
export const dynamic = 'force-dynamic'; // Отключаем статическую генерацию
export const maxDuration = 60; // 60 секунд (требуется Pro тариф Vercel)
export const revalidate = 0; // Не кэшировать ответы

export interface ConversionOptions {
  enablePostalSearch: boolean;
  dadataApiKey?: string;
  batchSize?: number;
}

export interface ConversionResult {
  success: boolean;
  jobId: string;
  message: string;
  huntersCount: number;
  ticketsCount: number;
  enrichedCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
  downloadUrl: string;
  processingTime: number;
}

export interface HunterRecord {
  date_entry: string;
  municipality: { code: string; name: string };
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
  nationality: { code: string; name: string };
  link: string;
  traditional_residence_places: string[];
  organization_id: { organizations_type?: { name: string }; unique_inn?: string };
  identity_type: { code: string; name: string };
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
  cancellation_reason: { name: string };
}

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB лимит для Vercel
const DADATA_API_BASE = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// Справочник регионов РФ
const RUSSIAN_REGIONS: Record<string, string> = {
  '01': 'Республика Адыгея', '02': 'Республика Башкортостан', '03': 'Республика Бурятия',
  '04': 'Республика Алтай', '05': 'Республика Дагестан', '06': 'Республика Ингушетия',
  '07': 'Кабардино-Балкарская Республика', '08': 'Республика Калмыкия',
  '09': 'Карачаево-Черкесская Республика', '10': 'Республика Карелия',
  '11': 'Республика Коми', '12': 'Республика Марий Эл', '13': 'Республика Мордовия',
  '14': 'Республика Саха (Якутия)', '15': 'Республика Северная Осетия - Алания',
  '16': 'Республика Татарстан', '17': 'Республика Тыва', '18': 'Удмуртская Республика',
  '19': 'Республика Хакасия', '20': 'Чеченская Республика', '21': 'Чувашская Республика',
  '22': 'Алтайский край', '23': 'Краснодарский край', '24': 'Красноярский край',
  '25': 'Приморский край', '26': 'Ставропольский край', '27': 'Хабаровский край',
  '28': 'Амурская область', '29': 'Архангельская область', '30': 'Астраханская область',
  '31': 'Белгородская область', '32': 'Брянская область', '33': 'Владимирская область',
  '34': 'Волгоградская область', '35': 'Вологодская область', '36': 'Воронежская область',
  '37': 'Ивановская область', '38': 'Иркутская область', '39': 'Калининградская область',
  '40': 'Калужская область', '41': 'Камчатский край', '42': 'Кемеровская область - Кузбасс',
  '43': 'Кировская область', '44': 'Костромская область', '45': 'Курганская область',
  '46': 'Курская область', '47': 'Ленинградская область', '48': 'Липецкая область',
  '49': 'Магаданская область', '50': 'Московская область', '51': 'Мурманская область',
  '52': 'Нижегородская область', '53': 'Новгородская область', '54': 'Новосибирская область',
  '55': 'Омская область', '56': 'Оренбургская область', '57': 'Орловская область',
  '58': 'Пензенская область', '59': 'Пермский край', '60': 'Псковская область',
  '61': 'Ростовская область', '62': 'Рязанская область', '63': 'Самарская область',
  '64': 'Саратовская область', '65': 'Сахалинская область', '66': 'Свердловская область',
  '67': 'Смоленская область', '68': 'Тамбовская область', '69': 'Тверская область',
  '70': 'Томская область', '71': 'Тульская область', '72': 'Тюменская область',
  '73': 'Ульяновская область', '74': 'Челябинская область', '75': 'Забайкальский край',
  '76': 'Ярославская область', '77': 'г. Москва', '78': 'г. Санкт-Петербург',
  '79': 'Еврейская автономная область', '83': 'Ненецкий автономный округ',
  '86': 'Ханты-Мансийский автономный округ - Югра', '87': 'Чукотский автономный округ',
  '89': 'Ямало-Ненецкий автономный округ', '91': 'Республика Крым', '92': 'г. Севастополь',
};

// ============================================================================
// HELPER: VALIDATION FUNCTIONS
// ============================================================================
function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

function validateFileType(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  return ext ? SUPPORTED_EXTENSIONS.includes(`.${ext}`) : false;
}

function isValidPostalCode(code: string): boolean {
  return /^\d{6}$/.test(code.replace(/\s/g, ''));
}

function isValidPhone(phone: string): boolean {
  return /^\+7\d{10}$/.test(phone);
}

// ============================================================================
// HELPER: DATE NORMALIZATION
// ============================================================================
function normalizeDate(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  const str = String(value).trim();
  
  // Уже в нужном формате
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  // Обработка Excel serial date (число дней с 1899-12-30)
  if (typeof value === 'number' && value > 10000 && value < 100000) {
    try {
      const baseDate = new Date('1899-12-30');
      baseDate.setDate(baseDate.getDate() + Math.floor(value));
      return baseDate.toISOString().split('T')[0];
    } catch {
      // fallback
    }
  }
  
  // Обработка научной нотации
  if (str.toLowerCase().includes('e+')) {
    try {
      const num = Math.floor(parseFloat(str));
      if (num > 10000 && num < 100000) {
        const baseDate = new Date('1899-12-30');
        baseDate.setDate(baseDate.getDate() + num);
        return baseDate.toISOString().split('T')[0];
      }
    } catch {
      return str;
    }
  }
  
  // Парсинг различных форматов дат
  const formats: Array<{ pattern: RegExp; transformer: (m: RegExpMatchArray) => string }> = [
    { pattern: /^(\d{2})\/(\d{2})\/(\d{4})$/, transformer: (m) => `${m[3]}-${m[2]}-${m[1]}` },
    { pattern: /^(\d{2})\.(\d{2})\.(\d{4})$/, transformer: (m) => `${m[3]}-${m[2]}-${m[1]}` },
    { pattern: /^(\d{2})-(\d{2})-(\d{4})$/, transformer: (m) => `${m[3]}-${m[2]}-${m[1]}` },
    { pattern: /^(\d{4})\.(\d{2})\.(\d{2})$/, transformer: (m) => `${m[1]}-${m[2]}-${m[3]}` },
    { pattern: /^(\d{4})\/(\d{2})\/(\d{2})$/, transformer: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  ];
  
  for (const fmt of formats) {
    const match = str.match(fmt.pattern);
    if (match) {
      return fmt.transformer(match);
    }
  }
  
  // Попытка через Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return str;
}

// ============================================================================
// HELPER: PHONE NORMALIZATION (+7XXXXXXXXXX)
// ============================================================================
function normalizePhone(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  let phone = String(value).trim();
  
  // Обработка научной нотации Excel
  if (phone.toLowerCase().includes('e+')) {
    try {
      phone = String(Math.floor(parseFloat(phone)));
    } catch {
      return phone;
    }
  }
  
  // Удаляем все нецифровые символы кроме +
  const digits = phone.replace(/[^\d+]/g, '');
  
  if (!digits) return '';
  
  // Удаляем все + кроме первого
  const cleanDigits = digits.replace(/\+/g, (m, i) => i === 0 ? m : '');
  
  // Приводим к формату +7XXXXXXXXXX
  if (cleanDigits.startsWith('+7')) {
    const nums = cleanDigits.slice(2).replace(/\D/g, '');
    if (nums.length >= 10) return `+7${nums.slice(0, 10)}`;
    return `+7${nums.padEnd(10, '0')}`;
  }
  
  if (cleanDigits.startsWith('7') || cleanDigits.startsWith('8')) {
    const nums = cleanDigits.slice(1).replace(/\D/g, '');
    if (nums.length >= 10) return `+7${nums.slice(0, 10)}`;
    return `+7${nums.padEnd(10, '0')}`;
  }
  
  if (cleanDigits.length === 10) {
    return `+7${cleanDigits}`;
  }
  
  if (cleanDigits.length === 11 && cleanDigits.startsWith('7')) {
    return `+7${cleanDigits.slice(1)}`;
  }
  
  // fallback: берем последние 10 цифр
  const nums = cleanDigits.replace(/\D/g, '').slice(-10);
  return `+7${nums.padStart(10, '0')}`;
}

// ============================================================================
// HELPER: SNILS NORMALIZATION (XXX-XXX-XXX XX)
// ============================================================================
function normalizeSnils(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  const digits = String(value).replace(/\D/g, '');
  
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  
  // Если уже в правильном формате
  if (/^\d{3}-\d{3}-\d{3}\s\d{2}$/.test(String(value).trim())) {
    return String(value).trim();
  }
  
  return String(value).trim();
}

// ============================================================================
// HELPER: POSTAL CODE NORMALIZATION (6 цифр)
// ============================================================================
function normalizePostalCode(value: any): string {
  if (!value || String(value).trim() === '') return '';
  
  const digits = String(value).replace(/\D/g, '');
  
  if (digits.length === 6) {
    return digits;
  }
  
  return String(value).trim();
}

// ============================================================================
// HELPER: INDIGENOUS PEOPLE NORMALIZATION (true/false string)
// ============================================================================
function normalizeIndigenous(value: any): string {
  if (!value || String(value).trim() === '') return 'false';
  
  const str = String(value).trim().toLowerCase();
  
  if (['true', '1', 'да', 'yes', 'истина', 'y'].includes(str)) {
    return 'true';
  }
  
  if (['false', '0', 'нет', 'no', 'ложь', 'n'].includes(str)) {
    return 'false';
  }
  
  return 'false';
}

// ============================================================================
// HELPER: SAFE STRING CONVERSION
// ============================================================================
function toSafeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number' && Number.isInteger(value)) return String(value);
  return String(value).trim();
}

// ============================================================================
// HELPER: DADATA API — ПОИСК ПОЧТОВОГО ИНДЕКСА
// ============================================================================
async function findPostalCodeByDadata(
  address: string,
  apiKey: string
): Promise<string | null> {
  if (!address || !apiKey) return null;
  
  try {
    const response = await fetch(`${DADATA_API_BASE}/suggest/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      body: JSON.stringify({ query: address, count: 1 }),
    });
    
    if (!response.ok) {
      console.error(`Dadata API error: ${response.status}`);
      return null;
    }
    
    const  { suggestions } = await response.json();
    
    if (suggestions && suggestions.length > 0) {
      const postalCode = suggestions[0].data?.postal_code;
      if (postalCode && isValidPostalCode(postalCode)) {
        return postalCode;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Dadata API request failed:', error);
    return null;
  }
}

// ============================================================================
// HELPER: PARSE FILE (Excel/CSV)
// ============================================================================
function parseFile(buffer: Buffer, fileName: string): Record<string, any>[] {
  const ext = fileName.toLowerCase().split('.').pop();
  
  // === CSV PARSING ===
  if (ext === 'csv') {
    const text = buffer.toString('utf-8');
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      delimiter: '', // auto-detect
    });
    
    return (result.data as Record<string, any>[]).filter(row =>
      row && Object.values(row).some(v => v && String(v).trim())
    );
  }
  
  // === EXCEL PARSING ===
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: false, cellText: false });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Конвертируем в JSON с сохранением типов
  const data = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false, // Получаем отформатированные значения
    dateNF: 'yyyy-mm-dd', // Формат дат
  });
  
  return (data as Record<string, any>[]).filter(row =>
    row && Object.values(row).some(v => v && String(v).trim())
  );
}

// ============================================================================
// HELPER: FORMAT HUNTER RECORD (по эталону)
// ============================================================================
function formatHunter(row: Record<string, any>, selectedRegion?: string): HunterRecord {
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
// HELPER: FORMAT HUNTING TICKET RECORD (по эталону)
// ============================================================================
function formatTicket(row: Record<string, any>): HuntingTicketRecord {
  const indigenous = normalizeIndigenous(row['is_belonged_to_indigenous_people'] || row['true/false']);
  
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
    is_belonged_to_indigenous_people: indigenous,
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
  const errors: Array<{ row: number; field: string; message: string }> = [];
  
  try {
    // ------------------------------------------------------------------------
    // 1. ВАЛИДАЦИЯ ЗАПРОСА
    // ------------------------------------------------------------------------
    const contentLength = request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Файл слишком большой. Максимальный размер: 10MB', jobId },
        { status: 413 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsRaw = formData.get('options') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не загружен', jobId },
        { status: 400 }
      );
    }
    
    if (!validateFileType(file.name)) {
      return NextResponse.json(
        { success: false, error: `Неподдерживаемый формат. Разрешены: ${SUPPORTED_EXTENSIONS.join(', ')}`, jobId },
        { status: 400 }
      );
    }
    
    // Парсинг опций
    let options: ConversionOptions = {
      enablePostalSearch: true,
      dadataApiKey: '',
      batchSize: 10,
    };
    
    try {
      if (optionsRaw) {
        const parsed = JSON.parse(optionsRaw);
        options = { ...options, ...parsed };
      }
    } catch {
      // Используем значения по умолчанию при ошибке парсинга
    }
    
    // ------------------------------------------------------------------------
    // 2. ЧТЕНИЕ И ПАРСИНГ ФАЙЛА
    // ------------------------------------------------------------------------
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const rows = parseFile(fileBuffer, file.name);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Файл не содержит данных для конвертации', jobId },
        { status: 400 }
      );
    }
    
    // ------------------------------------------------------------------------
    // 3. ОБОГАЩЕНИЕ ПОЧТОВЫХ ИНДЕКСОВ ЧЕРЕЗ DADATA (ЕСЛИ ВКЛЮЧЕНО)
    // ------------------------------------------------------------------------
    let enrichedCount = 0;
    
    if (options.enablePostalSearch && options.dadataApiKey) {
      // Собираем уникальные адреса с пустыми индексами
      const addressesToEnrich = Array.from(
        new Set(
          rows
            .map(row => {
              const address = row['postal_address'] || row['Почтовый адрес'] || row['address'] || '';
              const postalCode = normalizePostalCode(row['postal_code'] || row['Почтовый индекс']);
              return { address: String(address).trim(), postalCode };
            })
            .filter(item => item.address && !item.postalCode)
            .map(item => item.address)
        )
      );
      
      if (addressesToEnrich.length > 0) {
        const batchSize = options.batchSize || 10;
        
        for (let i = 0; i < addressesToEnrich.length; i += batchSize) {
          const batch = addressesToEnrich.slice(i, i + batchSize);
          
          const enrichPromises = batch.map(async (address) => {
            const postalCode = await findPostalCodeByDadata(address, options.dadataApiKey!);
            if (postalCode) {
              // Находим и обновляем соответствующие строки
              for (const row of rows) {
                const rowAddress = String(row['postal_address'] || row['Почтовый адрес'] || row['address'] || '').trim();
                if (rowAddress === address && !normalizePostalCode(row['postal_code'] || row['Почтовый индекс'])) {
                  row['postal_code'] = postalCode;
                  enrichedCount++;
                }
              }
            }
          });
          
          await Promise.all(enrichPromises);
          
          // Пауза между пакетами для соблюдения rate limit Dadata
          if (i + batchSize < addressesToEnrich.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }
    
    // ------------------------------------------------------------------------
    // 4. ФОРМИРОВАНИЕ ВЫХОДНЫХ ДАННЫХ
    // ------------------------------------------------------------------------
    const huntersData: HunterRecord[] = [];
    const ticketsData: HuntingTicketRecord[] = [];
    
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const rowNum = idx + 2; // Excel строки с 1 + заголовок
      
      try {
        // Пропускаем строки без обязательных полей
        const requiredFields = ['surname', 'hunter_name', 'birth_date', 'series_ticket', 'number_ticket'];
        const hasRequired = requiredFields.some(field => {
          const value = row[field] || row[Object.keys(row).find(k => k.toLowerCase().includes(field.toLowerCase())) || ''];
          return value && String(value).trim();
        });
        
        if (!hasRequired) {
          continue;
        }
        
        const hunter = formatHunter(row);
        const ticket = formatTicket(row);
        
        huntersData.push(hunter);
        ticketsData.push(ticket);
        
      } catch (rowError: any) {
        errors.push({
          row: rowNum,
          field: 'row',
          message: `Ошибка обработки: ${rowError?.message || String(rowError)}`
        });
      }
    }
    
    // ------------------------------------------------------------------------
    // 5. ПОДГОТОВКА И ВОЗВРАТ ОТВЕТА
    // ------------------------------------------------------------------------
    const processingTime = Date.now() - startTime;
    
    const result: ConversionResult = {
      success: true,
      jobId,
      message: 'Конвертация завершена успешно',
      huntersCount: huntersData.length,
      ticketsCount: ticketsData.length,
      enrichedCount,
      errors,
      downloadUrl: `/api/download/${jobId}`,
      processingTime,
    };
    
    // Кэшируем данные для скачивания (в памяти, для production используйте Redis/S3)
    (global as any).__conversionCache = (global as any).__conversionCache || {};
    (global as any).__conversionCache[jobId] = {
      hunters: huntersData,
      tickets: ticketsData,
      expires: Date.now() + 3600000, // 1 час
    };
    
    // Логирование
    console.log(`[CONVERT] Job ${jobId}: ${huntersData.length} hunters, ${ticketsData.length} tickets, ${enrichedCount} enriched, ${errors.length} errors, ${processingTime}ms`);
    
    return NextResponse.json(result, {
      headers: {
        'X-Processing-Time': `${processingTime}ms`,
        'X-Job-Id': jobId,
        'Cache-Control': 'no-store, max-age=0',
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
