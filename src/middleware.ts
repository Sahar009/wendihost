import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Log subdomain/custom domain for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Host:', host);
  }

  // Check if this is a custom domain (not wendi.app or subdomain.wendi.app)
  const isCustomDomain = !host.includes('wendi.app') && !host.includes('localhost') && !host.includes('127.0.0.1');
  
  // Check if this is a subdomain of wendi.app (e.g., devy.wendi.app)
  const isSubdomain = host.includes('.wendi.app') && host !== 'wendi.app' && !host.startsWith('www.');
  
  if (isCustomDomain) {
    // Add custom domain header for server-side detection
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-custom-domain', host);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isSubdomain) {
    // Add subdomain header for server-side detection
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-subdomain', host);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

