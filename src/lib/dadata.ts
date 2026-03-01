// src/lib/dadata.ts
const DADATA_API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById';
const DADATA_CLEAN_URL = 'https://cleaner.dadata.ru/api/v1/clean/address';

export interface DadataSuggestion {
  value: string;
  data: {
    postal_code?: string;
    region?: {
      value: string;
    };
    city?: {
      value: string;
    };
    street?: {
      value: string;
    };
    house?: {
      value: string;
    };
  };
}

export interface DadataCleanResponse {
  postal_code?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}

/**
 * Поиск почтового индекса по адресу через Dadata
 */
export async function findPostalCodeByAddress(
  address: string,
  apiKey: string
): Promise<string | null> {
  if (!address || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(DADATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      body: JSON.stringify({
        query: address,
        count: 1,
      }),
    });

    if (!response.ok) {
      console.error('Dadata API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      const suggestion = data.suggestions[0] as DadataSuggestion;
      return suggestion.data.postal_code || null;
    }

    return null;
  } catch (error) {
    console.error('Ошибка при запросе к Dadata:', error);
    return null;
  }
}

/**
 * Очистка и стандартизация адреса через Dadata Cleaner
 */
export async function cleanAddress(
  address: string,
  apiKey: string
): Promise<DadataCleanResponse | null> {
  if (!address || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(DADATA_CLEAN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
      body: JSON.stringify([address]),
    });

    if (!response.ok) {
      console.error('Dadata Cleaner API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      return data[0] as DadataCleanResponse;
    }

    return null;
  } catch (error) {
    console.error('Ошибка при очистке адреса через Dadata:', error);
    return null;
  }
}

/**
 * Массовое обогащение адресов почтовыми индексами
 */
export async function enrichAddressesWithPostalCodes(
  addresses: string[],
  apiKey: string,
  batchSize: number = 10
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Обрабатываем пакетно для ограничения запросов
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    const promises = batch.map(async (address) => {
      const postalCode = await findPostalCodeByAddress(address, apiKey);
      if (postalCode) {
        results.set(address, postalCode);
      }
    });

    await Promise.all(promises);
    
    // Небольшая задержка между пакетами
    if (i + batchSize < addresses.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
