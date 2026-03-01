import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const tempDir = join(tmpdir(), `converter-${Date.now()}`);
  let inputPath = '';
  let outputPath = '';

  try {
    // 1. Получаем данные из формы
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

    // 2. Проверяем расширение файла
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExt = fileName.substring(fileName.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExt)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Неверный формат файла. Поддерживаются: .xlsx, .xls, .csv' 
        },
        { status: 400 }
      );
    }

    // 3. Сохраняем файл во временную директорию
    await mkdir(tempDir, { recursive: true });
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    inputPath = join(tempDir, `input${fileExt}`);
    outputPath = join(tempDir, 'output');
    
    await writeFile(inputPath, buffer);

    // 4. Формируем команду для Python скрипта
    const pythonScript = join(process.cwd(), 'python-converter', 'converter_unified.py');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dadataUrl = `${baseUrl}/api/dadata`;
    
    // Определяем команду Python в зависимости от ОС
    const isWindows = process.platform === 'win32';
    const pythonCommand = isWindows ? 'python' : 'python3';
    
    let command = `${pythonCommand} "${pythonScript}" "${inputPath}" -o "${outputPath}" --mode smart`;
    
    if (useDadata) {
      command += ` --use-dadata --dadata-api ${dadataUrl}`;
    }
    if (includePostal) {
      command += ` --postal`;
    }
    if (includeOktmo) {
      command += ` --oktmo`;
    }
    if (regionCode && regionCode.trim() !== '') {
      command += ` --region ${regionCode}`;
    }

    console.log('Executing command:', command);

    // 5. Выполняем Python скрипт с таймаутом 5 минут
    const { stdout, stderr } = await execAsync(command, {
      timeout: 300000, // 5 минут
      maxBuffer: 50 * 1024 * 1024, // 50MB
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8'
      }
    });

    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    console.log('Python stdout:', stdout);

    // 6. Читаем результаты
    const huntersPath = join(outputPath, 'hunters.json');
    const ticketsPath = join(outputPath, 'huntingtickets.json');
    
    let hunters = [];
    let tickets = [];
    
    try {
      const huntersContent = await readFile(huntersPath, 'utf-8');
      hunters = JSON.parse(huntersContent);
    } catch (e) {
      console.error('Error reading hunters.json:', e);
    }
    
    try {
      const ticketsContent = await readFile(ticketsPath, 'utf-8');
      tickets = JSON.parse(ticketsContent);
    } catch (e) {
      console.error('Error reading huntingtickets.json:', e);
    }

    // 7. Возвращаем успешный результат
    return NextResponse.json({
      success: true,
      hunters,
      tickets,
      stats: {
        huntersCount: hunters.length,
        ticketsCount: tickets.length,
        useDadata,
        includePostal,
        includeOktmo,
        regionCode: regionCode || null
      }
    });

  } catch (error: any) {
    console.error('Conversion error:', error);
    
    // Обработка разных типов ошибок
    let errorMessage = 'Ошибка при конвертации';
    let statusCode = 500;

    if (error.code === 'ETIMEDOUT' || error.code === 'TIMEOUT') {
      errorMessage = 'Превышено время ожидания (более 5 минут)';
      statusCode = 504;
    } else if (error.message?.includes('ENOENT')) {
      errorMessage = 'Python скрипт не найден. Проверьте наличие файла python-converter/converter_unified.py';
    } else if (error.message?.includes('python not found') || error.message?.includes('python3 not found')) {
      errorMessage = 'Python не установлен или не добавлен в PATH';
    } else if (error.stderr) {
      errorMessage = `Ошибка Python: ${error.stderr.substring(0, 200)}`;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.message
      },
      { status: statusCode }
    );

  } finally {
    // 8. Очищаем временные файлы (асинхронно, не ждем)
    Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(join(outputPath, 'hunters.json')).catch(() => {}),
      unlink(join(outputPath, 'huntingtickets.json')).catch(() => {}),
      unlink(outputPath).catch(() => {}),
      unlink(tempDir).catch(() => {})
    ]).catch(() => {});
  }
}

// ✅ УДАЛЕН УСТАРЕВШИЙ БЛОК export const config
// В Next.js 14+ настройки для API роутов задаются по-другому
