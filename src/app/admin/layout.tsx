import { redirect } from 'next/navigation';
import { validateAuth } from '@/lib/auth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    const isAuthenticated = await validateAuth();
    const pathname = await getPathname();
    const isLoginPage = pathname === '/admin/login';

    if (!isAuthenticated && !isLoginPage) {
      redirect('/admin/login');
    }

    if (isAuthenticated && isLoginPage) {
      redirect('/admin/dashboard');
    }

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="min-h-screen">{children}</div>
      </div>
    );
  } catch (error) {
    console.error('Admin layout error:', error);
    return <>{children}</>;
  }
}

// Helper function to get pathname safely
async function getPathname(): Promise<string> {
  // In client components, we can use window.location.pathname
  // In server components, we need to handle it differently
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  
  // For server-side rendering
  return '/admin/login'; // Default to login path for SSR
}

export const metadata = {
  title: 'Admin Dashboard - FutureNews',
  description: 'Admin dashboard for managing FutureNews content',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
