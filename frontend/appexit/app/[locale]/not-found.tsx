import Link from 'next/link';

export default function NotFound() {
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
        className="mt-8 inline-flex items-center justify-center gap-2 px-12 py-3 text-base font-semibold text-white rounded-full transition-colors hover:bg-[#D14C54]"
        style={{
          backgroundColor: '#E65D65',
        }}
      >
        <span>←</span>
        <span>ホームに戻る</span>
      </Link>
    </div>
  );
}
