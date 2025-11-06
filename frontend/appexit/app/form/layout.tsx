import type { Metadata } from "next";

export const metadata: Metadata = {
  title: '新規登録 | APPEXIT',
  description: 'APPEXITの新規登録フォーム',
};

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
