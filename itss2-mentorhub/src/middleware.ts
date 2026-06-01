import { NextResponse, type NextRequest } from 'next/server';

const VISITOR_COOKIE = 'mh_visitor';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Bản demo: toàn bộ nội dung public, không yêu cầu đăng nhập.
 *
 * Ngoài ra middleware đảm bảo mỗi khách (chưa đăng nhập) được gán sẵn một
 * `mh_visitor` cookie ngẫu nhiên — dùng làm hạt giống ổn định cho avatar
 * "con vật ẩn danh" ở góc phải. Cookie này chỉ phục vụ hiển thị, không cấp
 * quyền và không tạo bản ghi DB cho tới khi khách thực sự thao tác.
 */
export default function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(VISITOR_COOKIE)) {
    // Web Crypto is available on the edge runtime; 16 random bytes → 32 hex chars.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    res.cookies.set({
      name: VISITOR_COOKIE,
      value: id,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: VISITOR_MAX_AGE,
    });
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
