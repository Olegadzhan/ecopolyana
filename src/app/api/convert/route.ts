// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const useDadata = formData.get('useDadata') === 'true';
  const includePostal = formData.get('includePostal') === 'true';
  const includeOktmo = formData.get('includeOktmo') === 'true';
  const regionCode = formData.get('regionCode') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Сохраняем файл временно
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const tempFilePath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
  await writeFile(tempFilePath, buffer);

  try {
    // Запускаем Python-скрипт как дочерний процесс
    const pythonProcess = spawn('python3', [
      'python-converter/converter_unified.py',
      tempFilePath,
      '--mode', 'smart',
      '--output', join(tmpdir(), `output-${Date.now()}`),
      '--dadata-api', 'http://localhost:3000/api/dadata', // 👈 передаем URL нашего API
      ...(useDadata ? ['--use-dadata'] : []),
      ...(includePostal ? ['--postal'] : []),
      ...(includeOktmo ? ['--oktmo'] : []),
      ...(regionCode ? ['--region', regionCode] : [])
    ]);

    let result = '';
    let error = '';

    for await (const chunk of pythonProcess.stdout) {
      result += chunk;
    }

    for await (const chunk of pythonProcess.stderr) {
      error += chunk;
    }

    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      throw new Error(error || 'Python script failed');
    }

    // Парсим результат (предполагаем, что Python скрипт выводит JSON)
    const output = JSON.parse(result);
    
    return NextResponse.json(output);

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Conversion failed', details: error.message },
      { status: 500 }
    );
  } finally {
    // Очищаем временный файл
    await unlink(tempFilePath).catch(console.error);
  }
}
