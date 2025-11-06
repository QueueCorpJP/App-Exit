'use client';

import { useEffect } from 'react';
import StorageImage from './StorageImage';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imagePath: string;
  imageIndex: number;
  totalImages: number;
}

export default function ImageModal({ isOpen, onClose, imagePath, imageIndex, totalImages }: ImageModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="閉じる"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="absolute top-4 left-4 text-white text-sm">
        {imageIndex + 1} / {totalImages}
      </div>

      <div
        className="max-w-[90vw] max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <StorageImage
          path={imagePath}
          alt={`画像 ${imageIndex + 1}`}
          width={1200}
          height={800}
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain"
        />
      </div>
    </div>
  );
}
