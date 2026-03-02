// src/app/smart-hunting/page.tsx (упрощенная версия для теста)
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileJson, AlertCircle } from 'lucide-react';

export default function SmartHuntingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setErrorMessage('');
      setLogs([]);
      addLog(`Файл загружен: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleConvert = async () => {
    if (!file) return;

    setStatus('converting');
    setErrorMessage('');
    setLogs([]);
    addLog('Начало конвертации...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('enablePostalSearch', 'false');

    try {
      addLog('Отправка запроса к /api/convert...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addLog('❌ Таймаут 30 секунд');
      }, 30000);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      addLog(`Статус ответа: ${response.status}`);

      if (!response.ok) {
        const text = await response.text();
        addLog(`❌ Ошибка: ${text}`);
        throw new Error(text);
      }

      const blob = await response.blob();
      addLog(`✅ Получен файл размером ${(blob.size / 1024).toFixed(2)} KB`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      addLog('✅ Файл скачан');
      setStatus('success');

    } catch (error) {
      setStatus('error');
      const msg = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setErrorMessage(msg);
      addLog(`❌ Ошибка: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тест конвертера</h1>
        
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer mb-6
            ${isDragActive ? 'border-green-500 bg-green-500/10' : 'border-gray-600'}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div>
              <p className="text-green-400">{file.name}</p>
              <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <p>{isDragActive ? 'Перетащите файл' : 'Выберите XLSX файл'}</p>
          )}
        </div>

        {/* Кнопка */}
        <button
          onClick={handleConvert}
          disabled={!file || status === 'converting'}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded-lg mb-6"
        >
          {status === 'converting' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Конвертация...
            </span>
          ) : (
            'Начать конвертацию'
          )}
        </button>

        {/* Логи */}
        {logs.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
            <h3 className="text-lg mb-2">Лог:</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="text-gray-300 border-l-2 border-gray-600 pl-2">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ошибка */}
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
