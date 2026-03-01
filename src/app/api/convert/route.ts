// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

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
      const pythonProcess = spawn('python3', args);
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Читаем результаты
          const huntersFile = path.join(tempDir, 'hunters.json');
          const ticketsFile = path.join(tempDir, 'huntingtickets.json');
          const reportFile = path.join(tempDir, `${path.basename(file.name, path.extname(file.name))}_conversion_report.txt`);
          
          const result: any = {
            success: true,
            jobId,
            huntersCount: 0,
            ticketsCount: 0,
            downloadUrls: {}
          };

          if (fs.existsSync(huntersFile)) {
            const huntersData = JSON.parse(fs.readFileSync(huntersFile, 'utf-8'));
            result.huntersCount = huntersData.length;
            result.downloadUrls.hunters = `/api/download/${jobId}/hunters.json`;
          }

          if (fs.existsSync(ticketsFile)) {
            const ticketsData = JSON.parse(fs.readFileSync(ticketsFile, 'utf-8'));
            result.ticketsCount = ticketsData.length;
            result.downloadUrls.tickets = `/api/download/${jobId}/huntingtickets.json`;
          }

          if (fs.existsSync(reportFile)) {
            result.downloadUrls.report = `/api/download/${jobId}/report.txt`;
          }

          resolve(NextResponse.json(result));
        } else {
          resolve(NextResponse.json(
            { error: 'Ошибка конвертации', details: stderr },
            { status: 500 }
          ));
        }
      });

      pythonProcess.on('error', (err) => {
        resolve(NextResponse.json(
          { error: 'Ошибка запуска конвертера', details: err.message },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error },
      { status: 500 }
    );
  }
}
