// src/app/[secretPath]/layout.tsx
import { validateAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth check needed - just render children
  return <>{children}</>;
}
