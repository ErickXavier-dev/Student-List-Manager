import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /admin and sensitive /api routes
  const isPublicApi = request.method === 'GET' && (path.startsWith('/api/students') || path.startsWith('/api/collections'));
  const isAuthOrMigrate = path.startsWith('/api/auth') || path.startsWith('/api/migrate');

  if (path.startsWith('/admin') || (path.startsWith('/api') && !isPublicApi && !isAuthOrMigrate)) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      if (path.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const auth = JSON.parse(token);
      if (!auth || typeof auth !== 'object' || !auth.authenticated) {
        if (path.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (e) {
      if (path.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
