// src/lib/dadata.ts
// ============================================================================
// DADATA API INTEGRATION MODULE
// Полная реализация клиента для работы с API подсказок и очистки адресов
// ============================================================================

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================
const DADATA_API_BASE = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';
const DADATA_CLEAN_BASE = 'https://cleaner.dadata.ru/api/v1';

const DADATA_ENDPOINTS = {
  FIND_BY_ID: `${DADATA_API_BASE}/findById`,
  SUGGEST: `${DADATA_API_BASE}/suggest/address`,
  REVERSE_GEOLOCATE: `${DADATA_API_BASE}/geoLocate`,
  CLEAN_ADDRESS: `${DADATA_CLEAN_BASE}/clean/address`,
  CLEAN_NAME: `${DADATA_CLEAN_BASE}/clean/name`,
  CLEAN_PHONE: `${DADATA_CLEAN_BASE}/clean/phone`,
} as const;

const DADATA_RATE_LIMIT = {
  FREE_TIER_REQUESTS_PER_DAY: 100,
  FREE_TIER_REQUESTS_PER_SECOND: 1,
  PAID_TIER_REQUESTS_PER_SECOND: 10,
  BATCH_SIZE_RECOMMENDED: 10,
  RETRY_DELAY_MS: 1000,
  MAX_RETRIES: 3,
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface DadataAddressData {
  postal_code?: string;
  country?: string;
  country_code?: string;
  region?: {
    value: string;
    shorthand?: string;
    code?: string;
  };
  area?: {
    value: string;
    shorthand?: string;
    code?: string;
  };
  city?: {
    value: string;
    shorthand?: string;
    code?: string;
  };
  settlement?: {
    value: string;
    shorthand?: string;
    code?: string;
  };
  street?: {
    value: string;
    shorthand?: string;
    code?: string;
  };
  house?: {
    value: string;
    shorthand?: string;
  };
  block?: {
    value: string;
    shorthand?: string;
  };
  entrance?: {
    value: string;
  };
  floor?: {
    value: string;
  };
  flat?: {
    value: string;
  };
  kladr_id?: string;
  okato?: string;
  oktmo?: string;
  tax_office?: string;
  tax_office_legal?: string;
  timezone?: string;
  geo_lat?: string;
  geo_lon?: string;
  beltway_distance?: string;
  beltway_hit?: string;
  qc_geo?: string;
  qc_complete?: string;
  qc_house?: string;
  qc?: string;
  unparsed_parts?: {
    source: string;
  };
}

export interface DadataSuggestion {
  value: string;
  unrestricted_value: string;
   DadataAddressData;
  type?: string;
}

export interface DadataSuggestionsResponse {
  suggestions: DadataSuggestion[];
}

export interface DadataCleanAddressResponse {
  source: string;
  result: string;
  postal_code?: string;
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  flat?: string;
  qc?: string;
}

export interface DadataApiError {
  code: string;
  message: string;
  details?: any;
}

export interface DadataRequestOptions {
  count?: number;
  from_bound?: {
    value: string;
  };
  to_bound?: {
    value: string;
  };
  restrict_value?: boolean;
  locations?: {
    kladr_id?: string;
    city_fias_id?: string;
    city_okato?: string;
    city?: string;
  }[];
  locations_boost?: {
    kladr_id?: string;
    city_fias_id?: string;
    city_okato?: string;
    city?: string;
  }[];
  language?: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================
export class DadataApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: any,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'DadataApiError';
  }

  static fromResponse(response: Response, errorData?: any): DadataApiError {
    const code = errorData?.code || `HTTP_${response.status}`;
    const message = errorData?.message || response.statusText || 'Unknown Dadata API error';
    return new DadataApiError(code, message, errorData?.details, response.status);
  }
}

export class DadataRateLimitError extends DadataApiError {
  constructor(message: string, details?: any) {
    super('RATE_LIMIT', message, details, 429);
    this.name = 'DadataRateLimitError';
  }
}

export class DadataInvalidKeyError extends DadataApiError {
  constructor(message: string = 'Invalid API key') {
    super('INVALID_API_KEY', message, undefined, 403);
    this.name = 'DadataInvalidKeyError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidPostalCode(code: string): boolean {
  return /^\d{6}$/.test(code.replace(/\s/g, ''));
}

function normalizeAddress(address: string): string {
  return address
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim();
}

function extractPostalCodeFromAddress(address: string): string | null {
  const match = address.match(/\b\d{6}\b/);
  return match ? match[0] : null;
}

// ============================================================================
// MAIN API CLIENT CLASS
// ============================================================================
export class DadataClient {
  private apiKey: string;
  private baseUrl: string;
  private cleanUrl: string;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private readonly rateLimitDelay: number;

  constructor(apiKey: string, options?: { 
    baseUrl?: string; 
    cleanUrl?: string; 
    rateLimitDelay?: number;
  }) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Dadata API key is required');
    }
    
    this.apiKey = apiKey.trim();
    this.baseUrl = options?.baseUrl || DADATA_API_BASE;
    this.cleanUrl = options?.cleanUrl || DADATA_CLEAN_BASE;
    this.rateLimitDelay = options?.rateLimitDelay || DADATA_RATE_LIMIT.RETRY_DELAY_MS;
  }

  // --------------------------------------------------------------------------
  // INTERNAL REQUEST METHOD WITH RETRY LOGIC
  // --------------------------------------------------------------------------
  private async request<T>(
    endpoint: string,
    body: any,
    options?: { retries?: number; skipRateLimit?: boolean }
  ): Promise<T> {
    const maxRetries = options?.retries ?? DADATA_RATE_LIMIT.MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Rate limiting для free tier
        if (!options?.skipRateLimit) {
          await this.enforceRateLimit();
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Token ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        // Обработка ошибок HTTP
        if (!response.ok) {
          let errorData: any = null;
          try {
            errorData = await response.json();
          } catch {
            // Игнорируем ошибки парсинга JSON при HTTP ошибках
          }

          if (response.status === 429) {
            throw new DadataRateLimitError('Превышен лимит запросов к Dadata API', errorData);
          }

          if (response.status === 403) {
            throw new DadataInvalidKeyError(errorData?.message);
          }

          throw DadataApiError.fromResponse(response, errorData);
        }

        // Парсинг успешного ответа
        const data: T = await response.json();
        this.requestCount++;
        this.lastRequestTime = Date.now();
        
        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Не ретраим критические ошибки
        if (error instanceof DadataInvalidKeyError) {
          throw error;
        }
        
        // Ретраим только сетевые ошибки и 5xx
        if (attempt < maxRetries) {
          if (error instanceof DadataApiError && error.statusCode && error.statusCode >= 500) {
            await delay(this.rateLimitDelay * (attempt + 1));
            continue;
          }
          if (error instanceof TypeError && error.message.includes('fetch')) {
            await delay(this.rateLimitDelay * (attempt + 1));
            continue;
          }
        }
        
        break;
      }
    }

    throw lastError || new Error('Unknown error during Dadata API request');
  }

  // --------------------------------------------------------------------------
  // RATE LIMITING
  // --------------------------------------------------------------------------
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await delay(this.rateLimitDelay - timeSinceLastRequest);
    }
  }

  // --------------------------------------------------------------------------
  // PUBLIC API METHODS
  // --------------------------------------------------------------------------
  
  /**
   * Поиск адреса по строке запроса
   */
  async findAddress(
    query: string,
    options?: DadataRequestOptions
  ): Promise<DadataSuggestion[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    const response = await this.request<DadataSuggestionsResponse>(
      `${this.baseUrl}/suggest/address`,
      {
        query: query.trim(),
        count: options?.count || 10,
        from_bound: options?.from_bound,
        to_bound: options?.to_bound,
        restrict_value: options?.restrict_value,
        locations: options?.locations,
        locations_boost: options?.locations_boost,
        language: options?.language || 'ru',
      }
    );

    return response.suggestions || [];
  }

  /**
   * Поиск почтового индекса по адресу (упрощённый метод)
   */
  async findPostalCodeByAddress(
    address: string,
    options?: { count?: number }
  ): Promise<string | null> {
    if (!address || address.trim() === '') {
      return null;
    }

    // Сначала пробуем найти индекс в самом адресе
    const embeddedPostal = extractPostalCodeFromAddress(address);
    if (embeddedPostal && isValidPostalCode(embeddedPostal)) {
      return embeddedPostal;
    }

    try {
      const suggestions = await this.findAddress(address, {
        count: options?.count || 1,
      });

      if (suggestions.length > 0 && suggestions[0].data?.postal_code) {
        const postalCode = suggestions[0].data.postal_code;
        if (isValidPostalCode(postalCode)) {
          return postalCode;
        }
      }
    } catch (error) {
      console.warn('Dadata findPostalCodeByAddress error:', error);
      // Не пробрасываем ошибку, возвращаем null для graceful degradation
    }

    return null;
  }

  /**
   * Очистка и стандартизация адреса через Dadata Cleaner
   */
  async cleanAddress(address: string): Promise<DadataCleanAddressResponse | null> {
    if (!address || address.trim() === '') {
      return null;
    }

    try {
      const responses = await this.request<DadataCleanAddressResponse[]>(
        `${this.cleanUrl}/clean/address`,
        [normalizeAddress(address)]
      );

      if (responses && responses.length > 0) {
        return responses[0];
      }
    } catch (error) {
      console.warn('Dadata cleanAddress error:', error);
    }

    return null;
  }

  /**
   * Поиск кода ОКТМО по адресу
   */
  async findOktmoByAddress(address: string): Promise<string | null> {
    if (!address || address.trim() === '') {
      return null;
    }

    try {
      const suggestions = await this.findAddress(address, { count: 1 });

      if (suggestions.length > 0 && suggestions[0].data?.oktmo) {
        return suggestions[0].data.oktmo;
      }
    } catch (error) {
      console.warn('Dadata findOktmoByAddress error:', error);
    }

    return null;
  }

  /**
   * Массовое обогащение адресов почтовыми индексами
   */
  async enrichAddressesWithPostalCodes(
    addresses: string[],
    options?: { batchSize?: number; skipInvalid?: boolean }
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const batchSize = options?.batchSize || DADATA_RATE_LIMIT.BATCH_SIZE_RECOMMENDED;
    const skipInvalid = options?.skipInvalid ?? true;

    if (!addresses || addresses.length === 0) {
      return results;
    }

    // Убираем дубликаты и пустые значения
    const uniqueAddresses = Array.from(new Set(
      addresses
        .map(addr => normalizeAddress(addr))
        .filter(addr => addr && addr.length > 5)
    ));

    // Обрабатываем пакетно
    for (let i = 0; i < uniqueAddresses.length; i += batchSize) {
      const batch = uniqueAddresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (address) => {
        try {
          const postalCode = await this.findPostalCodeByAddress(address);
          if (postalCode) {
            results.set(address, postalCode);
          } else if (!skipInvalid) {
            results.set(address, '');
          }
        } catch (error) {
          console.warn(`Failed to enrich address "${address}":`, error);
          if (!skipInvalid) {
            results.set(address, '');
          }
        }
      });

      await Promise.all(batchPromises);

      // Пауза между пакетами для соблюдения rate limits
      if (i + batchSize < uniqueAddresses.length) {
        await delay(this.rateLimitDelay * 2);
      }
    }

    return results;
  }

  /**
   * Получение полной информации об адресе
   */
  async getAddressDetails(address: string): Promise<DadataAddressData | null> {
    if (!address || address.trim() === '') {
      return null;
    }

    try {
      const suggestions = await this.findAddress(address, { count: 1 });
      return suggestions.length > 0 ? suggestions[0].data : null;
    } catch (error) {
      console.warn('Dadata getAddressDetails error:', error);
      return null;
    }
  }

  /**
   * Проверка валидности API ключа
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.findAddress('Москва', { count: 1 });
      return true;
    } catch (error) {
      if (error instanceof DadataInvalidKeyError) {
        return false;
      }
      // Другие ошибки не означают невалидный ключ
      return true;
    }
  }

  /**
   * Получение статистики использования API
   */
  getStats(): { requestCount: number; lastRequestTime: Date | null } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime > 0 ? new Date(this.lastRequestTime) : null,
    };
  }

  /**
   * Сброс статистики (для тестов)
   */
  resetStats(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS (FUNCTIONAL API)
// ============================================================================

/**
 * Поиск почтового индекса по адресу (функциональный API)
 */
export async function findPostalCodeByAddress(
  address: string,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) return null;
  
  const client = new DadataClient(apiKey);
  return client.findPostalCodeByAddress(address);
}

/**
 * Очистка адреса (функциональный API)
 */
export async function cleanAddress(
  address: string,
  apiKey: string
): Promise<DadataCleanAddressResponse | null> {
  if (!apiKey) return null;
  
  const client = new DadataClient(apiKey);
  return client.cleanAddress(address);
}

/**
 * Массовое обогащение адресов (функциональный API)
 */
export async function enrichAddressesWithPostalCodes(
  addresses: string[],
  apiKey: string,
  options?: { batchSize?: number; skipInvalid?: boolean }
): Promise<Map<string, string>> {
  if (!apiKey || !addresses?.length) return new Map();
  
  const client = new DadataClient(apiKey);
  return client.enrichAddressesWithPostalCodes(addresses, options);
}

/**
 * Поиск ОКТМО по адресу (функциональный API)
 */
export async function findOktmoByAddress(
  address: string,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) return null;
  
  const client = new DadataClient(apiKey);
  return client.findOktmoByAddress(address);
}

// ============================================================================
// EXPORTS
// ============================================================================
export {
  DadataClient,
  DadataApiError,
  DadataRateLimitError,
  DadataInvalidKeyError,
  DADATA_ENDPOINTS,
  DADATA_RATE_LIMIT,
};

export type {
  DadataAddressData,
  DadataSuggestion,
  DadataSuggestionsResponse,
  DadataCleanAddressResponse,
  DadataApiError as DadataApiErrorType,
  DadataRequestOptions,
};
