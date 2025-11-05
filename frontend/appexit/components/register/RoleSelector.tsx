import React from 'react';

type RoleKey = 'seller' | 'buyer' | 'advisor';

export interface RoleSelectorProps {
  selectedRoles: string[];
  onToggle: (role: string) => void;
}

const ROLE_OPTIONS: { key: RoleKey; title: string; description: string }[] = [
  { key: 'seller', title: '売り手', description: '自分のプロダクトを出品・査定したい' },
  { key: 'buyer', title: '買い手', description: 'プロダクト買収・投資案件を探したい' },
  { key: 'advisor', title: '提案者', description: '改善提案や運営支援を行いたい' },
];

export default function RoleSelector({ selectedRoles, onToggle }: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      {ROLE_OPTIONS.map(({ key, title, description }) => (
        <label key={key} className="flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            className="h-4 w-4 border-gray-300"
            style={{ accentColor: '#323232' }}
            checked={selectedRoles.includes(key)}
            onChange={() => onToggle(key)}
          />
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold text-gray-900">{title}</span>
            <span className="text-sm text-gray-600">— {description}</span>
          </div>
        </label>
      ))}
    </div>
  );
}


