'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-400" />
          <span className="font-bold text-xl">ЭКОПОЛЯНА</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            Главная
          </Link>
          <Link href="/generator" className="text-gray-400 hover:text-white transition-colors text-sm">
            Генератор
          </Link>
        </div>
      </div>
    </nav>
  );
}
