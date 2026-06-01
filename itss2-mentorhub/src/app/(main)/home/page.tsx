import { redirect } from 'next/navigation';

// Bản demo bỏ trang chủ — luôn chuyển hướng sang danh sách kênh thảo luận.
export default function HomePage() {
  redirect('/channels');
}
