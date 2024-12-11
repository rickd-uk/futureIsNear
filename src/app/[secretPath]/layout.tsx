import { validateAuth } from '@/lib/auth';

export default async function Layout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const isAuthenticated = await validateAuth();

  if (!isAuthenticated) {
    return null;
  }

  return <div className="min-h-screen bg-gray-100">{children}</div>;
}
