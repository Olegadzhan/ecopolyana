// src/components/map/SearchBox.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function SearchBox({ onLocationSelect }: { 
  onLocationSelect: (pos: [number, number], address: string) => void 
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const searchAddress = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=ru`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    
    if (value.length >= 3) {
      searchAddress(value);
    } else {
      setResults([]);
    }
  };

  const handleSelect = (result: any) => {
    const pos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    onLocationSelect(pos, result.display_name);
    setQuery(result.display_name);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl px-4 py-3 shadow-lg">
        <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Введите адрес для поиска..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
        />
        {isLoading && (
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-md border border-emerald-500/30 rounded-xl overflow-hidden shadow-xl z-[1000]">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <p className="text-sm text-white font-medium truncate">{result.display_name}</p>
              <p className="text-xs text-gray-400 capitalize">{result.type.replace('_', ' ')}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
