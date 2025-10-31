import Image from 'next/image';
import Link from 'next/link';
import { UserProfile } from '@/types';

interface ProfileCardProps {
  profile: UserProfile;
  showActions?: boolean;
}

export default function ProfileCard({ profile, showActions = false }: ProfileCardProps) {
  return (
    <div className="bg-white py-6 px-12">
      <div className="flex items-center space-x-6">
        <div className="w-20 h-20 bg-gray-200 overflow-hidden flex items-center justify-center">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name}
              width={80}
              height={80}
              className="object-cover"
            />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full text-xs ${
              profile.user_type === 'seller' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {profile.user_type === 'seller' ? '売り手' : '買い手'}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              profile.entity_type === 'company' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {profile.entity_type === 'company' ? '企業' : '個人'}
            </span>
            {profile.company_name && (
              <span className="text-gray-600">{profile.company_name}</span>
            )}
            {profile.age && (
              <span className="text-gray-600">{profile.age}歳</span>
            )}
            {profile.nda_accepted && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                NDA対応
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            登録日: {profile.created_at.toLocaleDateString('ja-JP')}
          </p>
        </div>
        {showActions && (
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              メッセージを送る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
