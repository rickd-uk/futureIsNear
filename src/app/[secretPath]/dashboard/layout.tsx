// src/app/[secretPath]/dashboard/layout.tsx
import { validateAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await validateAuth();
  
  if (!isAuthenticated) {
    redirect(`/${process.env.ADMIN_SECRET_PATH}/login`);
  }

  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
