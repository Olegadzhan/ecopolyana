// src/app/smart-hunting/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function SmartHuntingPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setError('');
      setDownloadUrl('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 1024 * 1024 // 1MB для скорости
  });

  const handleConvert = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setDownloadUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Автоскачивание
      const a = document.createElement('a');
      a.href = url;
      a.download = 'result.json';
      a.click();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Конвертер XLSX → JSON</h1>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-8 text-center rounded cursor-pointer
            ${isDragActive ? 'border-green-500 bg-green-500/10' : 'border-gray-600'}
            ${file ? 'bg-green-900/20' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <p className="text-green-400">{file.name}</p>
          ) : (
            <p className="text-gray-400">
              {isDragActive ? 'Бросьте файл сюда' : 'Кликните или перетащите XLSX'}
            </p>
          )}
        </div>

        {file && (
          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 p-3 rounded mt-4"
          >
            {loading ? 'Конвертация...' : 'Конвертировать'}
          </button>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 p-4 rounded mt-4">
            <p className="text-red-400">Ошибка: {error}</p>
          </div>
        )}

        {downloadUrl && (
          <div className="text-center mt-4">
            <a
              href={downloadUrl}
              download="result.json"
              className="text-green-400 underline"
            >
              Скачать результат
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
