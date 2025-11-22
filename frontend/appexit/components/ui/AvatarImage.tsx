import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface AvatarImageProps {
  path: string | null | undefined;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * アバター画像を表示するコンポーネント
 * プロフィール画像のパスを受け取り、自動的にSupabaseのURLに変換して表示
 */
export default function AvatarImage({ path, alt = 'Avatar', size = 'md', className = '' }: AvatarImageProps) {
  const avatarUrl = useAvatarUrl(path, 'avatars');

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span className="text-xl">👤</span>
        </div>
      )}
    </div>
  );
}
