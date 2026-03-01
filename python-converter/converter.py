#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WEB-КОНВЕРТЕР EXCEL/CSV В JSON С DADATA API
Версия: 8.0.0 (Web + Dadata Integration)
"""

import sys
import os
import json
import pandas as pd
import requests
from pathlib import Path
import argparse
from typing import Dict, List, Optional, Any
from datetime import datetime
import re

# === DADATA API INTEGRATION ===
class DadataClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById"
        self.clean_url = "https://cleaner.dadata.ru/api/v1/clean/address"
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Token {api_key}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def find_postal_code(self, address: str) -> Optional[str]:
        """Поиск почтового индекса по адресу"""
        if not address or not self.api_key:
            return None
        
        try:
            response = self.session.post(
                self.base_url,
                json={"query": address, "count": 1},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('suggestions'):
                    return data['suggestions'][0]['data'].get('postal_code')
        except Exception as e:
            print(f"Dadata API error: {e}", file=sys.stderr)
        
        return None
    
    def clean_address(self, address: str) -> Optional[Dict]:
        """Очистка и стандартизация адреса"""
        if not address or not self.api_key:
            return None
        
        try:
            response = self.session.post(
                self.clean_url,
                json=[address],
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]
        except Exception as e:
            print(f"Dadata Cleaner error: {e}", file=sys.stderr)
        
        return None
    
    def enrich_addresses(self, addresses: List[str], batch_size: int = 10) -> Dict[str, str]:
        """Массовое обогащение адресов почтовыми индексами"""
        results = {}
        
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            for address in batch:
                postal_code = self.find_postal_code(address)
                if postal_code:
                    results[address] = postal_code
            
            # Задержка между пакетами
            if i + batch_size < len(addresses):
                import time
                time.sleep(0.1)
        
        return results


# === MAIN CONVERTER CLASS ===
class WebExcelConverter:
    def __init__(self, dadata_api_key: str = None):
        self.dadata_client = DadataClient(dadata_api_key) if dadata_api_key else None
        self.logger_messages = []
    
    def log(self, message: str, level: str = "INFO"):
        msg = f"[{datetime.now().strftime('%H:%M:%S')}] [{level}] {message}"
        self.logger_messages.append(msg)
        print(msg, file=sys.stderr)
    
    def convert(self, 
                input_file: Path,
                output_folder: Path,
                enrich_postal: bool = False,
                enrich_oktmo: bool = False,
                region: str = None,
                create_report: bool = False) -> Dict[str, Any]:
        """Основной метод конвертации"""
        
        self.log("🚀 Начало конвертации")
        self.log(f"📁 Входной файл: {input_file}")
        self.log(f"📁 Выходная папка: {output_folder}")
        
        # Загрузка данных
        df = self._load_data(input_file)
        self.log(f"📊 Загружено строк: {len(df)}")
        
        # Обогащение почтовых индексов через Dadata
        if enrich_postal and self.dadata_client:
            self.log("📮 Обогащение почтовых индексов через Dadata...")
            addresses = df['postal_address'].dropna().unique().tolist()
            postal_codes = self.dadata_client.enrich_addresses(addresses)
            
            # Применяем найденные индексы
            enriched_count = 0
            for idx, row in df.iterrows():
                address = row.get('postal_address')
                if address and address in postal_codes:
                    if pd.isna(row.get('postal_code')) or str(row.get('postal_code')).strip() == '':
                        df.at[idx, 'postal_code'] = postal_codes[address]
                        enriched_count += 1
            
            self.log(f"✅ Обогащено индексов: {enriched_count}")
        elif enrich_postal and not self.dadata_client:
            self.log("⚠️ Dadata API ключ не предоставлен, обогащение пропущено")
        
        # Обработка данных
        hunters_data = []
        tickets_data = []
        
        for idx, row in df.iterrows():
            hunter = self._format_hunter(row, region)
            ticket = self._format_ticket(row)
            
            hunters_data.append(hunter)
            tickets_data.append(ticket)
        
        # Создание выходной директории
        output_folder.mkdir(parents=True, exist_ok=True)
        
        # Сохранение JSON файлов
        hunters_file = output_folder / "hunters.json"
        tickets_file = output_folder / "huntingtickets.json"
        
        self._save_json(hunters_data, hunters_file)
        self._save_json(tickets_data, tickets_file)
        
        self.log(f"✅ hunters.json: {len(hunters_data)} записей")
        self.log(f"✅ huntingtickets.json: {len(tickets_data)} записей")
        
        # Создание отчета
        report_file = None
        if create_report:
            report_file = self._create_report(input_file, output_folder, len(hunters_data))
        
        return {
            'success': True,
            'hunters_count': len(hunters_data),
            'tickets_count': len(tickets_data),
            'output_folder': str(output_folder),
            'report_file': str(report_file) if report_file else None
        }
    
    def _load_data(self, input_file: Path) -> pd.DataFrame:
        """Загрузка Excel/CSV"""
        ext = input_file.suffix.lower()
        
        if ext in ['.xlsx', '.xls']:
            return pd.read_excel(input_file)
        elif ext == '.csv':
            return pd.read_csv(input_file, encoding='utf-8-sig')
        else:
            raise ValueError(f"Неподдерживаемый формат: {ext}")
    
    def _format_hunter(self, row: pd.Series, region: str = None) -> Dict:
        """Форматирование записи охотника"""
        def to_str(val):
            return str(val).strip() if pd.notna(val) and str(val).strip() else ""
        
        return {
            "date_entry": to_str(row.get('date_entry')),
            "municipality": {
                "code": to_str(row.get('municipality_code')),
                "name": to_str(row.get('municipality_name'))
            },
            "surname": to_str(row.get('surname')),
            "hunter_name": to_str(row.get('hunter_name')),
            "patronymic": to_str(row.get('patronymic')),
            "birth_date": self._normalize_date(row.get('birth_date')),
            "birth_place": to_str(row.get('birth_place')),
            "postal_address": to_str(row.get('postal_address')),
            "postal_code": to_str(row.get('postal_code')),
            "phone": self._normalize_phone(row.get('phone')),
            "snils_code": self._normalize_snils(row.get('snils_code')),
            "series_ticket": to_str(row.get('series_ticket')).replace(" ", ""),
            "number_ticket": to_str(row.get('number_ticket')).replace(" ", ""),
            "date_issue_ticket": self._normalize_date(row.get('date_issue_ticket')),
        }
    
    def _format_ticket(self, row: pd.Series) -> Dict:
        """Форматирование записи билета"""
        def to_str(val):
            return str(val).strip() if pd.notna(val) and str(val).strip() else ""
        
        indigenous = to_str(row.get('is_belonged_to_indigenous_people')).lower()
        if indigenous in ['true', 'false']:
            indigenous_val = indigenous
        else:
            indigenous_val = "false"
        
        return {
            "date_entry": self._normalize_date(row.get('date_entry')),
            "series": to_str(row.get('series_ticket')).replace(" ", ""),
            "number": to_str(row.get('number_ticket')).replace(" ", ""),
            "date_issue": self._normalize_date(row.get('date_issue_ticket')),
            "hunter_id": {
                "series_passport": to_str(row.get('series_passport')).replace(" ", ""),
                "number_passport": to_str(row.get('number_passport')).replace(" ", ""),
            },
            "is_belonged_to_indigenous_people": indigenous_val,
            "cancellation_date": self._normalize_date(row.get('cancellation_date')),
            "cancellation_reason": {
                "name": to_str(row.get('cancellation_reason_name'))
            }
        }
    
    def _normalize_date(self, value) -> str:
        """Нормализация даты в формат YYYY-MM-DD"""
        if pd.isna(value) or str(value).strip() == '':
            return ""
        
        try:
            if isinstance(value, (pd.Timestamp, datetime)):
                return value.strftime('%Y-%m-%d')
            
            # Пробуем распарсить различные форматы
            date_str = str(value).strip()
            for fmt in ['%d/%m/%Y', '%d.%m.%Y', '%Y-%m-%d', '%d-%m-%Y']:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime('%Y-%m-%d')
                except:
                    continue
            
            return date_str
        except:
            return str(value)
    
    def _normalize_phone(self, value) -> str:
        """Нормализация телефона в формат +7XXXXXXXXXX"""
        if pd.isna(value) or str(value).strip() == '':
            return ""
        
        phone = re.sub(r'\D', '', str(value))
        
        if len(phone) == 11 and phone.startswith('7'):
            return f"+7{phone[1:]}"
        elif len(phone) == 11 and phone.startswith('8'):
            return f"+7{phone[1:]}"
        elif len(phone) == 10:
            return f"+7{phone}"
        elif len(phone) >= 10:
            return f"+7{phone[-10:]}"
        
        return str(value)
    
    def _normalize_snils(self, value) -> str:
        """Нормализация СНИЛС в формат XXX-XXX-XXX XX"""
        if pd.isna(value) or str(value).strip() == '':
            return ""
        
        digits = re.sub(r'\D', '', str(value))
        
        if len(digits) == 11:
            return f"{digits[0:3]}-{digits[3:6]}-{digits[6:9]} {digits[9:11]}"
        
        return str(value)
    
    def _save_json(self, data: List[Dict], output_file: Path):
        """Сохранение JSON с правильным форматированием"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _create_report(self, input_file: Path, output_folder: Path, records_count: int) -> Path:
        """Создание отчета"""
        report_file = output_folder / "conversion_report.txt"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("ОТЧЕТ О КОНВЕРТАЦИИ\n")
            f.write("=" * 60 + "\n")
            f.write(f"Дата: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Файл: {input_file.name}\n")
            f.write(f"Записей: {records_count}\n")
            f.write("=" * 60 + "\n")
        
        return report_file


# === MAIN ===
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('inputfile', help='Входной файл')
    parser.add_argument('--output', default='output', help='Выходная папка')
    parser.add_argument('--dadata-key', default='', help='Dadata API ключ')
    parser.add_argument('--enrich-postal', default='false', help='Обогащать индексы')
    parser.add_argument('--enrich-oktmo', default='false', help='Обогащать ОКТМО')
    parser.add_argument('--region', default='', help='Регион')
    parser.add_argument('--report', action='store_true', help='Создать отчет')
    
    args = parser.parse_args()
    
    converter = WebExcelConverter(dadata_api_key=args.dadata_key)
    
    result = converter.convert(
        input_file=Path(args.inputfile),
        output_folder=Path(args.output),
        enrich_postal=args.enrich_postal.lower() == 'true',
        enrich_oktmo=args.enrich_oktmo.lower() == 'true',
        region=args.region if args.region else None,
        create_report=args.report
    )
    
    print(json.dumps(result, ensure_ascii=False))
