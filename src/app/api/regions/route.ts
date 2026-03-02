// src/app/api/regions/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'templates', 'oktmo.csv');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Ручной парсинг CSV без библиотеки
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Определяем разделитель (пробуем ; или ,)
    const delimiter = fileContent.includes(';') ? ';' : ',';
    
    const regions = lines
      .map(line => {
        const parts = line.split(delimiter).map(p => p.trim());
        // Ожидаемая структура: code;parentCode;name;postal_code
        if (parts.length >= 3) {
          const code = parts[0].replace(/"/g, '');
          const name = parts[2].replace(/"/g, '');
          const parentCode = parts[1]?.replace(/"/g, '');
          
          // Только регионы первого уровня (parentCode пустой и code длиной 2)
          if ((!parentCode || parentCode === '') && code.length === 2) {
            return { code, name };
          }
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (regions.length === 0) {
      // Если не нашли регионы в CSV, возвращаем тестовые данные
      return NextResponse.json(getMockRegions());
    }

    return NextResponse.json(regions);
  } catch (error) {
    console.error('Ошибка загрузки справочника ОКТМО:', error);
    // В случае ошибки возвращаем тестовые данные
    return NextResponse.json(getMockRegions());
  }
}

// Тестовые данные на случай ошибки
function getMockRegions() {
  return [
    { code: '01', name: 'Республика Адыгея' },
    { code: '02', name: 'Республика Башкортостан' },
    { code: '03', name: 'Республика Бурятия' },
    { code: '04', name: 'Республика Алтай' },
    { code: '05', name: 'Республика Дагестан' },
    { code: '06', name: 'Республика Ингушетия' },
    { code: '07', name: 'Кабардино-Балкарская Республика' },
    { code: '08', name: 'Республика Калмыкия' },
    { code: '09', name: 'Карачаево-Черкесская Республика' },
    { code: '10', name: 'Республика Карелия' },
    { code: '11', name: 'Республика Коми' },
    { code: '12', name: 'Республика Марий Эл' },
    { code: '13', name: 'Республика Мордовия' },
    { code: '14', name: 'Республика Саха (Якутия)' },
    { code: '15', name: 'Республика Северная Осетия — Алания' },
    { code: '16', name: 'Республика Татарстан' },
    { code: '17', name: 'Республика Тыва' },
    { code: '18', name: 'Удмуртская Республика' },
    { code: '19', name: 'Республика Хакасия' },
    { code: '20', name: 'Чеченская Республика' },
    { code: '21', name: 'Чувашская Республика' },
    { code: '22', name: 'Алтайский край' },
    { code: '23', name: 'Краснодарский край' },
    { code: '24', name: 'Красноярский край' },
    { code: '25', name: 'Приморский край' },
    { code: '26', name: 'Ставропольский край' },
    { code: '27', name: 'Хабаровский край' },
    { code: '28', name: 'Амурская область' },
    { code: '29', name: 'Архангельская область' },
    { code: '30', name: 'Астраханская область' },
    { code: '31', name: 'Белгородская область' },
    { code: '32', name: 'Брянская область' },
    { code: '33', name: 'Владимирская область' },
    { code: '34', name: 'Волгоградская область' },
    { code: '35', name: 'Вологодская область' },
    { code: '36', name: 'Воронежская область' },
    { code: '37', name: 'Ивановская область' },
    { code: '38', name: 'Иркутская область' },
    { code: '39', name: 'Калининградская область' },
    { code: '40', name: 'Калужская область' },
    { code: '41', name: 'Камчатский край' },
    { code: '42', name: 'Кемеровская область' },
    { code: '43', name: 'Кировская область' },
    { code: '44', name: 'Костромская область' },
    { code: '45', name: 'Курганская область' },
    { code: '46', name: 'Курская область' },
    { code: '47', name: 'Ленинградская область' },
    { code: '48', name: 'Липецкая область' },
    { code: '49', name: 'Магаданская область' },
    { code: '50', name: 'Московская область' },
    { code: '51', name: 'Мурманская область' },
    { code: '52', name: 'Нижегородская область' },
    { code: '53', name: 'Новосибирская область' },
    { code: '54', name: 'Омская область' },
    { code: '55', name: 'Оренбургская область' },
    { code: '56', name: 'Орловская область' },
    { code: '57', name: 'Пензенская область' },
    { code: '58', name: 'Пермский край' },
    { code: '59', name: 'Псковская область' },
    { code: '60', name: 'Ростовская область' },
    { code: '61', name: 'Рязанская область' },
    { code: '62', name: 'Самарская область' },
    { code: '63', name: 'Саратовская область' },
    { code: '64', name: 'Сахалинская область' },
    { code: '65', name: 'Свердловская область' },
    { code: '66', name: 'Смоленская область' },
    { code: '67', name: 'Тамбовская область' },
    { code: '68', name: 'Тверская область' },
    { code: '69', name: 'Томская область' },
    { code: '70', name: 'Тульская область' },
    { code: '71', name: 'Тюменская область' },
    { code: '72', name: 'Ульяновская область' },
    { code: '73', name: 'Челябинская область' },
    { code: '74', name: 'Забайкальский край' },
    { code: '75', name: 'Ярославская область' },
    { code: '76', name: 'Москва' },
    { code: '77', name: 'Санкт-Петербург' },
    { code: '78', name: 'Еврейская автономная область' },
    { code: '79', name: 'Ненецкий автономный округ' },
    { code: '83', name: 'Ханты-Мансийский автономный округ' },
    { code: '86', name: 'Чукотский автономный округ' },
    { code: '87', name: 'Ямало-Ненецкий автономный округ' },
    { code: '89', name: 'Республика Крым' },
    { code: '91', name: 'Севастополь' }
  ];
}
