# MentorHub & StuBiz — MVP

Nền tảng kết nối sinh viên kỹ thuật với cố vấn thực chiến (MentorHub) và cơ hội việc làm (StuBiz).

## Stack

- **Next.js 15** (App Router, RSC, Server Actions) + **React 19** + **TypeScript** strict
- **ZenStack** (schema-first models + policies) trên **Prisma** + **PostgreSQL**
- **NextAuth v5** (Credentials provider, JWT, role-based)
- **Tailwind CSS** + shadcn-style primitives (Radix)
- **next-intl** với 2 ngôn ngữ: **Tiếng Việt** & **日本語**
- **TipTap** rich text editor cho câu trả lời
- Theme thiết kế lấy cảm hứng từ Claude (warm off-white + terracotta accent, không gradient/glassmorphism)

## Bắt đầu

### 1. Cài đặt

```powershell
npm install
```

Lệnh `postinstall` sẽ tự động:
1. `zenstack generate --schema ./prisma/schema.zmodel` → sinh ra Prisma schema + policies + TanStack Query hooks ở `src/lib/hooks`
2. `prisma generate` → sinh Prisma Client

### 2. Cấu hình môi trường

Sao chép `.env.example` thành `.env` rồi cập nhật:

```
DATABASE_URL=postgresql://user:password@localhost:5432/itss2_mentorhub
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### 3. Khởi tạo database

```powershell
npm run db:push     # đẩy schema lên PostgreSQL (dev)
npm run db:seed     # tạo dữ liệu mẫu
```

Tài khoản mẫu:
- `admin@itss.local` / `password123` — ADMIN
- `alice@student.local` / `password123` — STUDENT
- `mentor1@itss.local` / `password123` — MENTOR (đã verified)
- `hr@fpt.local` / `password123` — EMPLOYER

### 4. Chạy dev server

```powershell
npm run dev
```

Mở `http://localhost:3000`.

## Cấu trúc

```
prisma/
  schema.zmodel          # nguồn duy nhất cho models + access policies
  seed.ts                # dữ liệu mẫu
src/
  app/
    (auth)/              # login, register
    (main)/              # app shell với sidebar + topbar
      channels/          # P3 kênh thảo luận
      threads/[id]/      # P4-P5 thread detail + answer dialog (ẩn danh)
      mentors/           # P6 cố vấn
      companies/         # P7 doanh nghiệp
      jobs/              # P8 việc làm
      applications/      # P9 đơn ứng tuyển
      chat/              # P10 nhắn tin
      admin/             # P11 quản trị
      profile/           # CV upload + chỉnh sửa
    api/auth/[...nextauth]/  # NextAuth handler
    api/upload/cv/       # upload PDF local
  components/
    ui/                  # primitives (button, card, dialog, switch, ...)
    layout/              # sidebar, topbar, language switcher, theme toggle
    editor/rich-editor   # TipTap wrapper
    threads/answer-dialog # ⭐ dialog đăng câu trả lời + toggle ẩn danh
  lib/
    auth.ts              # NextAuth config
    db.ts                # Prisma singleton
    enhanced-db.ts       # Prisma + ZenStack enhance (policy-aware)
    anonymous.ts         # sanitize identity khi isAnonymous
  i18n/                  # next-intl request config
  middleware.ts          # bảo vệ route
messages/
  vi.json
  ja.json
```

## ⭐ Acceptance criteria trọng tâm — Ẩn danh

- ZenStack policy `@@allow` đảm bảo chỉ user đăng nhập mới đọc/tạo Answer.
- Trên server, `sanitizeAnonymous()` xoá `authorId` + `author` khỏi payload trước khi gửi xuống client (trừ khi viewer là chính chủ hoặc ADMIN).
- UI hiển thị "Người dùng ẩn danh" và avatar `?` cho answer có `isAnonymous=true`.
- Dialog "Viết câu trả lời" có Switch mặc định OFF = ẩn danh; toggle ON = công khai danh tính.
- Validate độ dài text (HTML đã strip) ≤ 40,000 ký tự cả ở schema (`@length(1, 40000)`) lẫn server action.

## Scripts hữu ích

- `npm run zen:generate` — sinh lại schema + policies + hooks
- `npm run db:push` — sync schema (dev)
- `npm run db:migrate` — tạo migration
- `npm run db:studio` — Prisma Studio
- `npm run db:seed` — chạy seed
- `npm run lint` / `npm run typecheck`

## Ngôn ngữ

Đổi ngôn ngữ qua menu góc trên — cookie `NEXT_LOCALE` được set và trang refresh. Hỗ trợ `vi` (default) và `ja`.
