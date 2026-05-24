import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

const PUBLIC_PATHS = ['/login'];
const ADMIN_PATHS = ['/ajustes'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — skip
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    /\.(.+)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Root page — always serve so iOS can capture it as PWA start URL
  if (pathname === '/') {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  try {
    // Public routes
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      if (token) {
        const user = await verifyToken(token);
        if (user) return NextResponse.redirect(new URL('/personal', request.url));
      }
      return NextResponse.next();
    }

    // Protected routes: no token → login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const user = await verifyToken(token);
    if (!user) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // Force password change on first login
    if (user.mustChangePassword && pathname !== '/cambiar-password') {
      return NextResponse.redirect(new URL('/cambiar-password', request.url));
    }

    // Admin-only routes
    if (ADMIN_PATHS.some(p => pathname.startsWith(p)) && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/personal', request.url));
    }

    return NextResponse.next();
  } catch {
    // On any unexpected error, send to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
