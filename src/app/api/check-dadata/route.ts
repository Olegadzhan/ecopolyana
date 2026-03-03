// src/app/api/check-dadata/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Ключ слишком короткий' 
      });
    }

    console.log('🔑 Проверка ключа DaData...');

    // Пробуем сначала получить баланс (более информативно)
    try {
      const balanceResponse = await fetch('https://dadata.ru/api/v2/profile/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        const balance = balanceData.balance || 0;
        
        console.log(`✅ Ключ действителен, баланс: ${balance} ₽`);
        
        return NextResponse.json({ 
          valid: true, 
          balance: balance,
          message: `Ключ действителен, баланс: ${balance} ₽`
        });
      }
    } catch (error) {
      console.log('⚠️ Не удалось получить баланс, пробуем тестовый запрос...');
    }

    // Если баланс не получили, пробуем тестовый запрос к suggestions
    const testResponse = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${apiKey}`
      },
      body: JSON.stringify({ 
        query: 'Москва', 
        count: 1,
        language: 'ru'
      })
    });

    if (testResponse.ok) {
      console.log('✅ Ключ действителен (тестовый запрос успешен)');
      return NextResponse.json({ 
        valid: true,
        message: 'Ключ действителен'
      });
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Ошибка проверки ключа:', testResponse.status, errorText);
      
      let errorMessage = 'Недействительный ключ';
      if (testResponse.status === 401) {
        errorMessage = 'Неверный API ключ (401 Unauthorized)';
      } else if (testResponse.status === 403) {
        errorMessage = 'Доступ запрещен (403 Forbidden)';
      } else if (testResponse.status === 429) {
        errorMessage = 'Слишком много запросов (429 Rate Limit)';
      }

      return NextResponse.json({ 
        valid: false, 
        error: errorMessage,
        status: testResponse.status
      });
    }

  } catch (error: any) {
    console.error('❌ Ошибка при проверке ключа:', error);
    return NextResponse.json({ 
      valid: false, 
      error: error.message || 'Ошибка проверки ключа'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
