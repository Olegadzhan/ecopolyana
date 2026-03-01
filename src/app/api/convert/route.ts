import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

interface ChangeLog {
  row: number;
  field: string;
  original: string;
  converted: string;
  type: 'change' | 'error' | 'enrichment' | 'missing';
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

interface ProcessingResult {
  hunters: any[];
  tickets: any[];
  logs: {
    changes: ChangeLog[];
    errors: ValidationError[];
    enrichments: ChangeLog[];
    missingRequired: { row: number; field: string; value: string }[];
    skippedRows: { row: number; reason: string }[];
  };
  stats: {
    processedRows: number;
    skippedRows: number;
    changesCount: number;
    errorsCount: number;
    enrichmentsCount: number;
  };
}

// ============================================================================
// СПРАВОЧНИКИ
// ============================================================================

const CANCELLATION_REASONS: Record<string, string> = {
  "1": "Несоответствие лица, получившего разрешение, требованиям частей 1 и 2 статьи 49 Федерального закона N 209-ФЗ",
  "2": "Подача лицом, получившим разрешение, заявления об аннулировании разрешения",
  "3": "Ликвидация получившего разрешение юридического лица или смерти физического лица, зарегистрированного в качестве индивидуального предпринимателя, получившего разрешение"
};

const RUSSIAN_REGIONS: Record<string, string> = {
  "01": "Республика Адыгея (Адыгея)",
  "02": "Республика Башкортостан",
  "03": "Республика Бурятия",
  "04": "Республика Алтай",
  "05": "Республика Дагестан",
  "06": "Республика Ингушетия",
  "07": "Кабардино-Балкарская Республика",
  "08": "Республика Калмыкия",
  "09": "Карачаево-Черкесская Республика",
  "10": "Республика Карелия",
  "11": "Республика Коми",
  "12": "Республика Марий Эл",
  "13": "Республика Мордовия",
  "14": "Республика Саха (Якутия)",
  "15": "Республика Северная Осетия - Алания",
  "16": "Республика Татарстан (Татарстан)",
  "17": "Республика Тыва",
  "18": "Удмуртская Республика",
  "19": "Республика Хакасия",
  "20": "Чеченская Республика",
  "21": "Чувашская Республика - Чувашия",
  "22": "Алтайский край",
  "23": "Краснодарский край",
  "24": "Красноярский край",
  "25": "Приморский край",
  "26": "Ставропольский край",
  "27": "Хабаровский край",
  "28": "Амурская область",
  "29": "Архангельская область",
  "30": "Астраханская область",
  "31": "Белгородская область",
  "32": "Брянская область",
  "33": "Владимирская область",
  "34": "Волгоградская область",
  "35": "Вологодская область",
  "36": "Воронежская область",
  "37": "Ивановская область",
  "38": "Иркутская область",
  "39": "Калининградская область",
  "40": "Калужская область",
  "41": "Камчатский край",
  "42": "Кемеровская область - Кузбасс",
  "43": "Кировская область",
  "44": "Костромская область",
  "45": "Курганская область",
  "46": "Курская область",
  "47": "Ленинградская область",
  "48": "Липецкая область",
  "49": "Магаданская область",
  "50": "Московская область",
  "51": "Мурманская область",
  "52": "Нижегородская область",
  "53": "Новгородская область",
  "54": "Новосибирская область",
  "55": "Омская область",
  "56": "Оренбургская область",
  "57": "Орловская область",
  "58": "Пензенская область",
  "59": "Пермский край",
  "60": "Псковская область",
  "61": "Ростовская область",
  "62": "Рязанская область",
  "63": "Самарская область",
  "64": "Саратовская область",
  "65": "Сахалинская область",
  "66": "Свердловская область",
  "67": "Смоленская область",
  "68": "Тамбовская область",
  "69": "Тверская область",
  "70": "Томская область",
  "71": "Тульская область",
  "72": "Тюменская область",
  "73": "Ульяновская область",
  "74": "Челябинская область",
  "75": "Забайкальский край",
  "76": "Ярославская область",
  "77": "г. Москва",
  "78": "г. Санкт-Петербург",
  "79": "Еврейская автономная область",
  "83": "Ненецкий автономный округ",
  "86": "Ханты-Мансийский автономный округ - Югра",
  "87": "Чукотский автономный округ",
  "89": "Ямало-Ненецкий автономный округ",
  "90": "Запорожская область",
  "91": "Республика Крым",
  "92": "г. Севастополь",
  "93": "Донецкая Народная Республика",
  "94": "Луганская Народная Республика",
  "95": "Херсонская область"
};

const REQUIRED_FIELDS = [
  'surname', 'hunter_name', 'patronymic',
  'birth_date', 'birth_place',
  'date_issue_ticket', 'series_ticket', 'number_ticket'
];

// ============================================================================
// ВАЛИДАТОРЫ
// ============================================================================

class Validators {
  static validateDate(dateStr: string, fieldName: string = 'Дата'): { isValid: boolean; error?: string } {
    if (!dateStr) return { isValid: true };
    
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(dateStr)) {
      return { isValid: false, error: `${fieldName}: неверный формат (требуется ГГГГ-ММ-ДД)` };
    }
    
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return { isValid: false, error: `${fieldName}: некорректная дата` };
      }
      
      if (year < 1900 || year > 2100) {
        return { isValid: false, error: `${fieldName}: год вне допустимого диапазона (1900-2100)` };
      }
      
      return { isValid: true };
    } catch {
      return { isValid: false, error: `${fieldName}: ошибка валидации` };
    }
  }
  
  static validatePhone(phone: string): { isValid: boolean; error?: string } {
    if (!phone) return { isValid: true };
    
    const pattern = /^\+7\d{10}$/;
    if (!pattern.test(phone)) {
      return { isValid: false, error: 'Телефон: неверный формат (требуется +7XXXXXXXXXX)' };
    }
    
    return { isValid: true };
  }
  
  static validateSnils(snils: string): { isValid: boolean; error?: string } {
    if (!snils) return { isValid: true };
    
    const pattern = /^\d{3}-\d{3}-\d{3}\s\d{2}$/;
    if (!pattern.test(snils)) {
      return { isValid: false, error: 'СНИЛС: неверный формат (должен быть XXX-XXX-XXX XX)' };
    }
    
    const digits = snils.replace(/\D/g, '');
    if (digits.length !== 11) {
      return { isValid: false, error: 'СНИЛС: должно быть 11 цифр' };
    }
    
    return { isValid: true };
  }
  
  static validateTicketSeries(series: string): { isValid: boolean; error?: string } {
    if (!series) return { isValid: true };
    
    if (series.length > 4) {
      return { isValid: false, error: 'Серия билета: максимум 4 символа' };
    }
    
    if (!/^[A-Za-zА-Яа-я0-9]+$/.test(series)) {
      return { isValid: false, error: 'Серия билета: только буквы и цифры' };
    }
    
    return { isValid: true };
  }
  
  static validateTicketNumber(number: string): { isValid: boolean; error?: string } {
    if (!number) return { isValid: true };
    
    if (number.length > 6) {
      return { isValid: false, error: 'Номер билета: максимум 6 цифр' };
    }
    
    if (!/^\d+$/.test(number)) {
      return { isValid: false, error: 'Номер билета: только цифры' };
    }
    
    return { isValid: true };
  }
  
  static validatePassportSeries(series: string): { isValid: boolean; error?: string } {
    if (!series) return { isValid: true };
    
    if (series.length > 4) {
      return { isValid: false, error: 'Серия паспорта: максимум 4 цифры' };
    }
    
    if (!/^\d+$/.test(series)) {
      return { isValid: false, error: 'Серия паспорта: только цифры' };
    }
    
    return { isValid: true };
  }
  
  static validatePassportNumber(number: string): { isValid: boolean; error?: string } {
    if (!number) return { isValid: true };
    
    if (number.length > 6) {
      return { isValid: false, error: 'Номер паспорта: максимум 6 цифр' };
    }
    
    if (!/^\d+$/.test(number)) {
      return { isValid: false, error: 'Номер паспорта: только цифры' };
    }
    
    return { isValid: true };
  }
  
  static validateText(text: string, fieldName: string, minLength: number = 2): { isValid: boolean; error?: string } {
    if (!text) return { isValid: true };
    
    if (text.length < minLength) {
      return { isValid: false, error: `${fieldName}: минимум ${minLength} символа` };
    }
    
    if (text.length > 100) {
      return { isValid: false, error: `${fieldName}: максимум 100 символов` };
    }
    
    return { isValid: true };
  }
}

// ============================================================================
// ФОРМАТТЕРЫ
// ============================================================================

class Formatters {
  static formatDate(value: any): string {
    if (!value || value === '') return '';
    
    try {
      // Если это число (Excel дата)
      if (typeof value === 'number' && value > 25569) {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      }
      
      // Если это строка
      const strValue = String(value).trim();
      
      // Проверяем ISO формат
      if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
        return strValue;
      }
      
      // Парсим DD.MM.YYYY
      const ddmmyyyy = strValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (ddmmyyyy) {
        return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${dddmmyyyy[1]}`;
      }
      
      // Парсим DD.MM.YY
      const ddmmyy = strValue.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
      if (ddmmyy) {
        const year = parseInt(ddmmyy[3]) < 30 ? `20${ddmmyy[3]}` : `19${ddmmyy[3]}`;
        return `${year}-${ddmmyy[2]}-${ddmmyy[1]}`;
      }
      
      // Пробуем через Date
      const date = new Date(strValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return strValue;
    } catch {
      return String(value || '');
    }
  }
  
  static formatPhone(value: any): string {
    if (!value || value === '') return '';
    
    const strValue = String(value).trim();
    
    // Если есть E+ (научная нотация)
    if (strValue.includes('e+') || strValue.includes('E+')) {
      try {
        const num = parseInt(strValue);
        if (!isNaN(num)) {
          const digits = String(num).replace(/\D/g, '');
          return this.formatPhoneFromDigits(digits);
        }
      } catch {}
    }
    
    const digits = strValue.replace(/\D/g, '');
    return this.formatPhoneFromDigits(digits);
  }
  
  private static formatPhoneFromDigits(digits: string): string {
    if (!digits) return '';
    
    if (digits.startsWith('7') || digits.startsWith('8')) {
      if (digits.length >= 11) {
        return `+7${digits.slice(-10)}`;
      }
      return `+7${digits.slice(-9).padStart(10, '0')}`;
    }
    
    if (digits.startsWith('9') && digits.length === 10) {
      return `+7${digits}`;
    }
    
    if (digits.length === 10) {
      return `+7${digits}`;
    }
    
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+7${digits.slice(1)}`;
    }
    
    return digits ? `+7${digits.slice(-10)}` : '';
  }
  
  static formatSnils(value: any): string {
    if (!value || value === '') return '';
    
    const strValue = String(value).trim();
    const digits = strValue.replace(/\D/g, '');
    
    if (digits.length === 11) {
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6,9)} ${digits.slice(9,11)}`;
    }
    
    return strValue;
  }
  
  static formatPostalCode(value: any): string {
    if (!value || value === '') return '';
    
    const digits = String(value).replace(/\D/g, '');
    return digits.length === 6 ? digits : String(value);
  }
  
  static formatIndigenous(value: any): string {
    if (!value || value === '') return '';
    
    const strValue = String(value).toLowerCase().trim();
    
    if (['true', '1', 'да', 'yes', 'истина'].includes(strValue)) {
      return 'true';
    }
    
    if (['false', '0', 'нет', 'no', 'ложь'].includes(strValue)) {
      return 'false';
    }
    
    return 'false';
  }
  
  static cleanString(value: any): string {
    if (!value || value === '') return '';
    
    // Если число и оно целое
    if (typeof value === 'number' && Number.isInteger(value)) {
      return String(value);
    }
    
    return String(value).trim().replace(/\s+/g, ' ');
  }
  
  static cleanCode(value: any): string {
    if (!value || value === '') return '';
    
    // Если число и оно целое
    if (typeof value === 'number' && Number.isInteger(value)) {
      return String(value);
    }
    
    return String(value).trim().replace(/\s/g, '');
  }
}

// ============================================================================
// ОСНОВНОЙ ПРОЦЕССОР
// ============================================================================

class DataProcessor {
  private logs: ChangeLog[] = [];
  private errors: ValidationError[] = [];
  private enrichments: ChangeLog[] = [];
  private missingRequired: { row: number; field: string; value: string }[] = [];
  private skippedRows: { row: number; reason: string }[] = [];
  
  processRow(row: any, rowNum: number): any | null {
    const result: any = {};
    
    // Проверка на пустую строку
    const values = Object.values(row);
    if (values.every(v => !v || v === '')) {
      this.skippedRows.push({ row: rowNum, reason: 'Пустая строка' });
      return null;
    }
    
    // Проверка обязательных полей
    const missingFields: string[] = [];
    for (const field of REQUIRED_FIELDS) {
      const value = row[field] || row[this.getRussianFieldName(field)];
      if (!value || value === '') {
        missingFields.push(field);
        this.missingRequired.push({
          row: rowNum,
          field,
          value: String(value || '')
        });
      }
    }
    
    if (missingFields.length > 0) {
      this.skippedRows.push({
        row: rowNum,
        reason: `Отсутствуют обязательные поля: ${missingFields.join(', ')}`
      });
      return null;
    }
    
    // Обрабатываем каждое поле
    for (const [key, value] of Object.entries(row)) {
      const fieldName = this.normalizeFieldName(key);
      if (!fieldName) continue;
      
      try {
        // Дата
        if (fieldName.includes('date') || fieldName.includes('issue')) {
          const original = String(value || '');
          const formatted = Formatters.formatDate(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // СНИЛС
        else if (fieldName.includes('snils')) {
          const original = String(value || '');
          const formatted = Formatters.formatSnils(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // Телефон
        else if (fieldName.includes('phone') || fieldName.includes('tel')) {
          const original = String(value || '');
          const formatted = Formatters.formatPhone(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // Почтовый индекс
        else if (fieldName.includes('postal') && fieldName.includes('code')) {
          const original = String(value || '');
          const formatted = Formatters.formatPostalCode(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // Коренные народы
        else if (fieldName.includes('indigenous')) {
          const original = String(value || '');
          const formatted = Formatters.formatIndigenous(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // Серии и номера (коды)
        else if (fieldName.includes('series') || fieldName.includes('number') || fieldName.includes('code')) {
          const original = String(value || '');
          const formatted = Formatters.cleanCode(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // Обычный текст
        else {
          const original = String(value || '');
          const formatted = Formatters.cleanString(value);
          result[fieldName] = formatted;
          
          if (original !== formatted) {
            this.logs.push({
              row: rowNum,
              field: fieldName,
              original,
              converted: formatted,
              type: 'change'
            });
          }
        }
        
        // Валидация после форматирования
        this.validateField(fieldName, result[fieldName], rowNum);
        
      } catch (error) {
        console.warn(`Error processing field ${fieldName} at row ${rowNum}:`, error);
        result[fieldName] = String(value || '');
      }
    }
    
    return result;
  }
  
  private validateField(field: string, value: string, rowNum: number) {
    if (!value) return;
    
    let validation: { isValid: boolean; error?: string } = { isValid: true };
    
    switch (field) {
      case 'birth_date':
      case 'date_issue':
      case 'date_issue_ticket':
      case 'date_entry':
        validation = Validators.validateDate(value, field);
        break;
      case 'phone':
        validation = Validators.validatePhone(value);
        break;
      case 'snils_code':
        validation = Validators.validateSnils(value);
        break;
      case 'series_ticket':
        validation = Validators.validateTicketSeries(value);
        break;
      case 'number_ticket':
        validation = Validators.validateTicketNumber(value);
        break;
      case 'series_passport':
        validation = Validators.validatePassportSeries(value);
        break;
      case 'number_passport':
        validation = Validators.validatePassportNumber(value);
        break;
      case 'surname':
      case 'hunter_name':
      case 'patronymic':
        validation = Validators.validateText(value, field, 2);
        break;
    }
    
    if (!validation.isValid && validation.error) {
      this.errors.push({
        row: rowNum,
        field,
        value,
        error: validation.error
      });
    }
  }
  
  private getRussianFieldName(engField: string): string {
    const map: Record<string, string> = {
      'surname': 'Фамилия',
      'hunter_name': 'Имя',
      'patronymic': 'Отчество',
      'birth_date': 'Дата рождения',
      'birth_place': 'Место рождения',
      'date_issue_ticket': 'Дата выдачи билета',
      'series_ticket': 'Серия билета',
      'number_ticket': 'Номер билета',
      'series_passport': 'Серия паспорта',
      'number_passport': 'Номер паспорта',
      'date_issue': 'Дата выдачи паспорта',
      'issued_by': 'Кем выдан',
      'snils_code': 'СНИЛС',
      'phone': 'Телефон',
      'email': 'Email',
      'address': 'Адрес',
      'postal_code': 'Индекс',
      'postal_address': 'Почтовый адрес'
    };
    
    return map[engField] || engField;
  }
  
  private normalizeFieldName(rusName: string): string {
    const map: Record<string, string> = {
      'Фамилия': 'surname',
      'Имя': 'hunter_name',
      'Отчество': 'patronymic',
      'Дата рождения': 'birth_date',
      'Место рождения': 'birth_place',
      'Дата выдачи билета': 'date_issue_ticket',
      'Серия билета': 'series_ticket',
      'Номер билета': 'number_ticket',
      'Серия паспорта': 'series_passport',
      'Номер паспорта': 'number_passport',
      'Дата выдачи паспорта': 'date_issue',
      'Кем выдан': 'issued_by',
      'СНИЛС': 'snils_code',
      'Телефон': 'phone',
      'Email': 'email',
      'Адрес': 'address',
      'Индекс': 'postal_code',
      'Почтовый адрес': 'postal_address',
      'Дата внесения': 'date_entry',
      'Код МО': 'municipality_code',
      'Наименование МО': 'municipality_name',
      'Код национальности': 'nationality_code',
      'Национальность': 'nationality_name',
      'Код документа': 'identity_type_code',
      'Документ': 'identity_type_name',
      'КМНС': 'is_belonged_to_indigenous_people',
      'Тип организации': 'organization_type',
      'ИНН организации': 'organization_inn',
      'Ссылка': 'link',
      'Дата аннулирования': 'cancellation_date',
      'Код аннулирования': 'cancellation_reason_code'
    };
    
    // Прямое соответствие
    if (map[rusName]) return map[rusName];
    
    // Поиск по вхождению
    for (const [rus, eng] of Object.entries(map)) {
      if (rusName.toLowerCase().includes(rus.toLowerCase())) {
        return eng;
      }
    }
    
    // Если ничего не нашли, возвращаем оригинал в нижнем регистре
    return rusName.toLowerCase().replace(/\s+/g, '_');
  }
  
  getResults(): ProcessingResult['logs'] & { stats: ProcessingResult['stats'] } {
    return {
      changes: this.logs,
      errors: this.errors,
      enrichments: this.enrichments,
      missingRequired: this.missingRequired,
      skippedRows: this.skippedRows,
      stats: {
        processedRows: 0, // будет заполнено позже
        skippedRows: this.skippedRows.length,
        changesCount: this.logs.length,
        errorsCount: this.errors.length,
        enrichmentsCount: this.enrichments.length
      }
    };
  }
}

// ============================================================================
// ФОРМАТТЕРЫ JSON (по эталону)
// ============================================================================

class JsonFormatter {
  static formatHunter(row: any, selectedRegion?: string): any {
    const toStr = (val: any): string => {
      if (val === null || val === undefined || val === '') return '';
      return String(val);
    };
    
    return {
      date_entry: toStr(row.date_entry),
      municipality: {
        code: toStr(row.municipality_code),
        name: row.municipality_code && row.municipality_name 
          ? toStr(`${row.municipality_code} - ${row.municipality_name}`)
          : toStr(row.municipality_name || row.municipality_code)
      },
      surname: toStr(row.surname),
      hunter_name: toStr(row.hunter_name),
      patronymic: toStr(row.patronymic),
      birth_date: toStr(row.birth_date),
      birth_place: toStr(row.birth_place),
      postal_address: toStr(row.postal_address),
      postal_code: toStr(row.postal_code),
      phone: toStr(row.phone),
      email: toStr(row.email),
      address: toStr(row.address),
      snils_code: toStr(row.snils_code),
      identity_type: {
        code: toStr(row.identity_type_code),
        name: toStr(row.identity_type_name)
      },
      series_passport: toStr(row.series_passport),
      number_passport: toStr(row.number_passport),
      date_issue: toStr(row.date_issue),
      issued_by: toStr(row.issued_by),
      nationality: {
        code: toStr(row.nationality_code),
        name: toStr(row.nationality_name)
      },
      link: toStr(row.link),
      traditional_residence_places: [],
      organization_id: {},
      series_ticket: toStr(row.series_ticket),
      number_ticket: toStr(row.number_ticket),
      date_issue_ticket: toStr(row.date_issue_ticket),
      ...(selectedRegion && {
        region_name: toStr(selectedRegion),
        region_code: toStr(Object.entries(RUSSIAN_REGIONS).find(([_, name]) => name === selectedRegion)?.[0] || '')
      })
    };
  }
  
  static formatTicket(row: any): any {
    const toStr = (val: any): string => {
      if (val === null || val === undefined || val === '') return '';
      return String(val);
    };
    
    const indigenous = row.is_belonged_to_indigenous_people;
    const indigenousStr = indigenous && ['true', '1', 'да', 'yes'].includes(String(indigenous).toLowerCase()) 
      ? 'true' : 'false';
    
    return {
      date_entry: toStr(row.date_entry),
      series: toStr(row.series_ticket),
      number: toStr(row.number_ticket),
      date_issue: toStr(row.date_issue_ticket),
      hunter_id: {
        series_passport: toStr(row.series_passport),
        number_passport: toStr(row.number_passport),
        date_issue: toStr(row.date_issue),
        issued_by: toStr(row.issued_by)
      },
      is_belonged_to_indigenous_people: indigenousStr,
      cancellation_date: toStr(row.cancellation_date),
      cancellation_reason: {
        name: CANCELLATION_REASONS[row.cancellation_reason_code] || ''
      }
    };
  }
}

// ============================================================================
// ЗАГРУЗЧИК ФАЙЛОВ
// ============================================================================

class FileLoader {
  static async loadFromBuffer(buffer: Buffer, filename: string): Promise<any[]> {
    try {
      if (filename.toLowerCase().endsWith('.csv')) {
        return this.loadCSV(buffer);
      } else {
        return this.loadExcel(buffer);
      }
    } catch (error) {
      console.error('File loading error:', error);
      throw new Error(`Ошибка загрузки файла: ${error}`);
    }
  }
  
  private static loadExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Получаем данные как массив массивов для анализа заголовков
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (data.length < 2) return [];
    
    // Анализируем заголовки
    const firstRow = data[0].map(cell => String(cell || '').trim());
    const secondRow = data[1].map(cell => String(cell || '').trim());
    
    // Проверяем наличие латиницы в первой строке и кириллицы во второй
    const hasLatin = firstRow.some(cell => /[a-zA-Z]/.test(cell));
    const hasCyrillic = secondRow.some(cell => /[а-яА-Я]/.test(cell));
    
    let headers: string[];
    let startRow: number;
    
    if (hasLatin && hasCyrillic) {
      // Две строки заголовков - используем первую (английскую)
      headers = firstRow;
      startRow = 2;
    } else {
      // Одна строка заголовков
      headers = firstRow;
      startRow = 1;
    }
    
    // Преобразуем в объекты
    const result: any[] = [];
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => !cell || cell === '')) continue;
      
      const obj: any = {};
      headers.forEach((header, idx) => {
        if (header) {
          obj[header] = row[idx];
        }
      });
      result.push(obj);
    }
    
    return result;
  }
  
  private static loadCSV(buffer: Buffer): any[] {
    const content = buffer.toString('utf-8');
    
    // Пробуем разные разделители
    const firstLine = content.split('\n')[0];
    const delimiter = firstLine.includes(',') ? ',' : ';';
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      delimiter,
      relax_quotes: true,
      relax_column_count: true
    });
    
    return records;
  }
}

// ============================================================================
// API ОБРАБОТЧИК
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const processor = new DataProcessor();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const useDadata = formData.get('useDadata') === 'true';
    const includePostal = formData.get('includePostal') === 'true';
    const includeOktmo = formData.get('includeOktmo') === 'true';
    const regionCode = formData.get('regionCode') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не выбран' },
        { status: 400 }
      );
    }
    
    // Проверка расширения
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Неверный формат файла. Поддерживаются: .xlsx, .xls, .csv' 
        },
        { status: 400 }
      );
    }
    
    // Загружаем данные
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await FileLoader.loadFromBuffer(buffer, filename);
    
    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Файл пуст или не содержит данных' },
        { status: 400 }
      );
    }
    
    // Обрабатываем каждую строку
    const hunters: any[] = [];
    const tickets: any[] = [];
    let processedCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const rowNum = i + 2; // +2 для учета заголовка
      const processed = processor.processRow(data[i], rowNum);
      
      if (processed) {
        // Форматируем в соответствии с эталонами
        const hunter = JsonFormatter.formatHunter(processed, regionCode ? RUSSIAN_REGIONS[regionCode.padStart(2, '0')] : undefined);
        const ticket = JsonFormatter.formatTicket(processed);
        
        hunters.push(hunter);
        tickets.push(ticket);
        processedCount++;
      }
    }
    
    // Получаем логи
    const logs = processor.getResults();
    logs.stats.processedRows = processedCount;
    
    // Если включен DaData, обогащаем
    if (useDadata && process.env.DADATA_API_KEY) {
      try {
        // Здесь будет логика обогащения через DaData API
        // Можно вызвать ваш существующий /api/dadata эндпоинт
        console.log('DaData enrichment would happen here');
      } catch (error) {
        console.error('DaData error:', error);
      }
    }
    
    const elapsed = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      hunters,
      tickets,
      stats: {
        huntersCount: hunters.length,
        ticketsCount: tickets.length,
        processedRows: processedCount,
        skippedRows: logs.stats.skippedRows,
        changesCount: logs.stats.changesCount,
        errorsCount: logs.stats.errorsCount,
        enrichmentsCount: logs.stats.enrichmentsCount,
        useDadata,
        includePostal,
        includeOktmo,
        regionCode: regionCode || null,
        processingTimeMs: elapsed
      },
      logs: {
        changes: logs.changes.slice(0, 100), // Ограничиваем для ответа
        errors: logs.errors.slice(0, 100),
        enrichments: logs.enrichments.slice(0, 100),
        missingRequired: logs.missingRequired.slice(0, 100),
        skippedRows: logs.skippedRows
      }
    });
    
  } catch (error: any) {
    console.error('Conversion error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ошибка при конвертации',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

export const maxDuration = 60; // 60 секунд максимум
export const dynamic = 'force-dynamic';
