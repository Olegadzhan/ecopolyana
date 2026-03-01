import setuptools  # Явный импорт для избежания ошибки
from http.server import BaseHTTPRequestHandler
import json
import tempfile
import os
import sys
from pathlib import Path
import shutil
import cgi

# Добавляем путь к вашему конвертеру
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'python-converter'))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Парсим multipart/form-data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={
                    'REQUEST_METHOD': 'POST',
                    'CONTENT_TYPE': self.headers.get('Content-Type', ''),
                }
            )
            
            # Получаем файл
            file_item = form['file']
            
            # Создаем временный файл
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file_item.filename).suffix) as tmp:
                tmp.write(file_item.file.read())
                input_path = tmp.name
            
            # Получаем параметры
            use_dadata = form.getvalue('useDadata') == 'true'
            include_postal = form.getvalue('includePostal') == 'true'
            include_oktmo = form.getvalue('includeOktmo') == 'true'
            region_code = form.getvalue('regionCode', '')
            
            # Создаем временную папку для вывода
            output_dir = tempfile.mkdtemp()
            
            # Импортируем ваш конвертер
            from converter_unified import ExcelToJsonConverter
            
            converter = ExcelToJsonConverter()
            result = converter.convert(
                input_file=Path(input_path),
                output_folder=Path(output_dir),
                mode='smart',
                create_report=False,
                include_postal=include_postal,
                include_oktmo=include_oktmo,
                region_code=int(region_code) if region_code else None,
                use_dadata=use_dadata,
                dadata_api_url=f"https://{os.environ.get('VERCEL_URL', 'localhost:3000')}/api/dadata"
            )
            
            # Читаем результаты
            hunters = []
            tickets = []
            
            hunters_path = Path(output_dir) / 'hunters.json'
            if hunters_path.exists():
                with open(hunters_path, 'r', encoding='utf-8') as f:
                    hunters = json.load(f)
            
            tickets_path = Path(output_dir) / 'huntingtickets.json'
            if tickets_path.exists():
                with open(tickets_path, 'r', encoding='utf-8') as f:
                    tickets = json.load(f)
            
            # Очищаем временные файлы
            os.unlink(input_path)
            shutil.rmtree(output_dir, ignore_errors=True)
            
            # Отправляем ответ
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'success': True,
                'hunters': hunters,
                'tickets': tickets,
                'stats': {
                    'huntersCount': len(hunters),
                    'ticketsCount': len(tickets),
                    'useDadata': use_dadata,
                    'includePostal': include_postal,
                    'includeOktmo': include_oktmo,
                    'regionCode': region_code or None
                }
            }
            
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }, ensure_ascii=False).encode('utf-8'))
