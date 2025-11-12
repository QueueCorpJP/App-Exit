'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

interface CarouselItem {
  id: string;
  title: string;
  image: string;
  category?: string | string[];
  price?: number;
}

interface InfiniteCarouselProps {
  items: CarouselItem[];
}

export default function InfiniteCarousel({ items }: InfiniteCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // アイテムがない場合は何も表示しない
  if (!items || items.length === 0) {
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  // transitionend イベントでアニメーション完了を検知
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTransitionEnd = () => {
      if (isAnimating) {
        // アニメーション完了後に次のインデックスに移動
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsAnimating(false);
      }
    };

    container.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      container.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [isAnimating, items.length]);

  const currentItem = items[currentIndex];
  const nextItem = items[(currentIndex + 1) % items.length];

  return (
    <div className="w-full overflow-hidden relative bg-black">
      <div
        ref={containerRef}
        className="relative w-full h-[225px] overflow-hidden"
      >
        {/* 現在の画像 */}
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            isAnimating ? '-translate-x-full' : 'translate-x-0'
          }`}
          style={{ willChange: 'transform' }}
        >
          <Link
            href={`/projects/${currentItem.id}`}
            className="block w-full h-full group cursor-pointer"
          >
            <Image
              src={currentItem.image}
              alt={currentItem.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 md:px-16">
              <div className="text-white max-w-2xl">
                {currentItem.category && (
                  <p className="text-sm md:text-base font-medium mb-2 opacity-90">
                    {Array.isArray(currentItem.category) ? currentItem.category[0] : currentItem.category}
                  </p>
                )}
                <h3 className="text-2xl md:text-4xl font-bold mb-3 line-clamp-2">
                  {currentItem.title}
                </h3>
                {currentItem.price && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-5xl font-bold">
                      {currentItem.price.toLocaleString()}
                    </span>
                    <span className="text-xl md:text-2xl">円</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* 次の画像（スワイプ時に右から入ってくる） */}
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
            isAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ willChange: 'transform' }}
        >
          <Link
            href={`/projects/${nextItem.id}`}
            className="block w-full h-full group cursor-pointer"
          >
            <Image
              src={nextItem.image}
              alt={nextItem.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 md:px-16">
              <div className="text-white max-w-2xl">
                {nextItem.category && (
                  <p className="text-sm md:text-base font-medium mb-2 opacity-90">
                    {Array.isArray(nextItem.category) ? nextItem.category[0] : nextItem.category}
                  </p>
                )}
                <h3 className="text-2xl md:text-4xl font-bold mb-3 line-clamp-2">
                  {nextItem.title}
                </h3>
                {nextItem.price && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-5xl font-bold">
                      {nextItem.price.toLocaleString()}
                    </span>
                    <span className="text-xl md:text-2xl">円</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* インジケーター */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
