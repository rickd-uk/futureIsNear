// src/app/[secretPath]/dashboard/layout.tsx

import { validateAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a request object from headers
  const headersList = await headers();
  const request = new NextRequest('http://dummy', {
    headers: headersList,
  });
  
  const isAuthenticated = await validateAuth(request);

  if (!isAuthenticated) {
    redirect(`/${process.env.ADMIN_SECRET_PATH}/login`);
  }

  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
