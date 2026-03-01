// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// ✅ НОВЫЙ СИНТАКСИС: Route Segment Config для Next.js 14+
export const runtime = 'nodejs'; // Требуется для spawn/child_process
export const dynamic = 'force-dynamic'; // Отключаем статическую генерацию
export const maxDuration = 300; // 5 минут таймаут для Vercel (максимум для Pro)

// ⚠️ bodyParser.sizeLimit теперь настраивается в next.config.js
// или обрабатывается вручную в коде

export async function POST(request: NextRequest) {
  const jobId = uuidv4();
  const tempDir = path.join(process.cwd(), 'temp', jobId);
  
  try {
    // Создаем временную директорию
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const options = JSON.parse(formData.get('options') as string);
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не загружен' },
        { status: 400 }
      );
    }

    // Проверка размера файла (ручная, т.к. bodyParser config устарел)
    const fileSize = file.size;
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимум 50MB' },
        { status: 413 }
      );
    }

    // Сохраняем загруженный файл
    const inputPath = path.join(tempDir, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(inputPath, fileBuffer);

    // Путь к Python скрипту
    const pythonScript = path.join(process.cwd(), 'python-converter', 'converter.py');
    
    // Аргументы для конвертера
    const args = [
      pythonScript,
      inputPath,
      '--output', tempDir,
      '--mode', 'smart',
      '--dadata-key', options.dadataKey || process.env.DADATA_API_KEY || '',
      '--enrich-postal', options.enrichPostal ? 'true' : 'false',
      '--enrich-oktmo', options.enrichOktmo ? 'true' : 'false',
      '--region', options.region || '',
    ];

    if (options.report) {
      args.push('--report');
    }

    // Запускаем Python конвертер
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', args, {
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // Очищаем временные файлы
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
          console.error('Ошибка очистки temp:', e);
        }

        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            jobId,
            message: 'Конвертация завершена',
            // В реальном проекте здесь были бы ссылки на скачивание
          }));
        } else {
          resolve(NextResponse.json(
            { error: 'Ошибка конвертации', details: stderr.substring(0, 500) },
            { status: 500 }
          ));
        }
      });

      pythonProcess.on('error', (err) => {
        resolve(NextResponse.json(
          { error: 'Ошибка запуска Python', details: err.message },
          { status: 500 }
        ));
      });
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error?.message },
      { status: 500 }
    );
  }
}
