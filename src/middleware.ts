import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;
    
    // DEBUG LOGS
    const cookieHeader = req.headers.get("cookie") || "NONE";
    console.log(`[Middleware] Path: ${pathname} | Token: ${token ? "YES" : "NO"} | Cookies: ${cookieHeader.substring(0, 50)}...`);

    // Only redirect to dashboard if authenticated user visits the landing page
    if (pathname === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    const isAdminPage = pathname.startsWith('/admin');

    if (isAdminPage && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicRoutes = ['/', '/login', '/signup'];
        const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

        if (isPublicRoute) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/search/:path*",
    "/chat/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/login",
    "/signup"
  ],
};
