'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow access to public routes
    const publicRoutes = ['/login', '/verify-magic-link'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (!loading && !user && !isPublicRoute) {
      router.push('/login');
    }
  }, [user, loading, router, pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Allow public routes through
  const publicRoutes = ['/login', '/verify-magic-link'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Don't render content for protected routes when user is not authenticated
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
