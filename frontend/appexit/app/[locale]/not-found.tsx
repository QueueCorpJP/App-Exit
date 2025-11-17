'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NotFound() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center pt-8" style={{ backgroundColor: '#fff' }}>
      <div className="flex justify-center">
        <img
          src="/404.png"
          alt="404 Not Found"
          style={{ width: '400px', height: 'auto', objectFit: 'contain' }}
        />
      </div>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-2 px-12 py-3 text-base font-semibold text-white rounded-full transition-colors"
        style={{
          backgroundColor: isHovered ? '#D14C54' : '#E65D65',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <span>←</span>
        <span>ホームに戻る</span>
      </Link>
    </div>
  );
}
