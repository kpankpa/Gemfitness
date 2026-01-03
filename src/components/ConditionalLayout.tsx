'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Hide navigation and footer for dashboard routes
  const isDashboard = pathname?.startsWith('/admin/dashboard') || 
                      pathname?.startsWith('/dashboard/member') ||
                      pathname?.startsWith('/dashboard/receptionist');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main className="pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}
