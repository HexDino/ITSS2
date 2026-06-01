import { NextResponse } from 'next/server';

// Bản demo: toàn bộ nội dung public, không yêu cầu đăng nhập.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
