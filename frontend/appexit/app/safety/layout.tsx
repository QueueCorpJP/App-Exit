import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '安全管理方針 | APPEXIT',
  description: 'APPEXITの安全管理に関する基本方針をご説明します。',
};

export default function SafetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
