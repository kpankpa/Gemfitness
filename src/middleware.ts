import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard/member': ['MEMBER', 'RECEPTIONIST', 'MANAGER', 'ADMIN'],
  '/dashboard/receptionist': ['RECEPTIONIST', 'MANAGER', 'ADMIN'],
  '/dashboard/manager': ['MANAGER', 'ADMIN'],
  '/dashboard/admin': ['ADMIN'],
  '/admin/dashboard': ['RECEPTIONIST', 'MANAGER', 'ADMIN'],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/signup',
  '/login',
  '/admin/login',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/classes',
  '/events',
  '/trainers',
  '/membership',
  '/success',
  '/payment/success',
  '/payment/failed',
  '/verify-email',
];

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp', 
  '/api/auth/skip-verification',
  '/api/auth/check-availability',
  '/api/auth/create-user-from-payment',
  '/api/payment/initialize',
  '/api/payment/verify',
  '/api/public/classes', // Public class listing for landing page
  '/api/public/events',  // Public event listing for landing page
  '/api/public/plans',   // Public membership plans
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('🔍 Middleware invoked for:', path, 'Method:', request.method);

  // Allow Next.js internal routes immediately
  if (path.startsWith('/_next') || path.startsWith('/static') || path.startsWith('/videos/') || path.startsWith('/images/') || path.startsWith('/trainers/')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // CRITICAL: Check public API routes FIRST before session check
  // This allows unauthenticated access to public endpoints
  if (publicApiRoutes.some((route) => path.startsWith(route))) {
    console.log('✅ Public API route, allowing:', path);
    return NextResponse.next();
  }

  // Get session from cookies (only needed for protected routes below)
  const session = request.cookies.get('session')?.value;
  console.log('🔍 Middleware: Session cookie exists?', !!session);
  
  const sessionData = await decrypt(session);
  console.log('🔍 Middleware: Session decrypted?', !!sessionData, 'Role:', sessionData?.role);

  // For remaining API routes, check session and allow if valid
  if (path.startsWith('/api/')) {
    console.log('🔍 Middleware: Protected API request to', path, 'Method:', request.method);
    if (!sessionData) {
      console.log('❌ Middleware: BLOCKING - No valid session for API path:', path);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ Middleware: ALLOWING API request to', path, 'Role:', sessionData.role);
    return NextResponse.next(); // Allow authenticated API calls
  }

  // Redirect to login if no session (for page routes)
  if (!sessionData) {
    console.log('⚠️ Middleware: No session for path:', path);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('✅ Middleware: Session valid for', path, 'Role:', sessionData.role);

  // Check if route requires specific role
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (path.startsWith(route)) {
      if (!allowedRoles.includes(sessionData.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboardMap: Record<string, string> = {
          MEMBER: '/dashboard/member',
          RECEPTIONIST: '/dashboard/receptionist',
          MANAGER: '/dashboard/manager',
          ADMIN: '/dashboard/admin',
        };

        const userDashboard = dashboardMap[sessionData.role] || '/';
        
        if (path.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }
  }

  // Check if user is accessing base /dashboard and redirect to their specific dashboard
  if (path === '/dashboard') {
    const dashboardMap: Record<string, string> = {
      MEMBER: '/dashboard/member',
      RECEPTIONIST: '/dashboard/receptionist',
      MANAGER: '/dashboard/manager',
      ADMIN: '/dashboard/admin',
    };

    const userDashboard = dashboardMap[sessionData.role] || '/';
    return NextResponse.redirect(new URL(userDashboard, request.url));
  }

  // Update session expiration
  const response = NextResponse.next();
  
  // Refresh session cookie with updated expiration
  if (sessionData) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    response.cookies.set('session', session || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|mp3|wav)$).*)',
  ],
};
