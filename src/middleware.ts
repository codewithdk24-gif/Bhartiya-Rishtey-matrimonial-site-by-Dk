import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup');
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin');

    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

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
