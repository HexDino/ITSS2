# MentorHub & StuBiz — MVP

Nền tảng kết nối **sinh viên kỹ thuật** với **cố vấn thực chiến** (MentorHub) và **cơ hội việc làm** (StuBiz).

> Next.js 15 · React 19 · TypeScript strict · ZenStack + Prisma + PostgreSQL · NextAuth v5 · TailwindCSS · next-intl (vi / ja)

---

## 1. Yêu cầu hệ thống

| Công cụ          | Phiên bản tối thiểu |
| ---------------- | ------------------- |
| Node.js          | **20.x LTS**        |
| npm              | 10+                 |
| PostgreSQL       | 14+ (hoặc Docker)   |
| Docker Desktop   | 24+ (tuỳ chọn)      |

---

## 2. Chạy nhanh bằng Docker (khuyến nghị)

```powershell
# 1. Clone
git clone https://github.com/HexDino/ITSS2.git
cd ITSS2/itss2-mentorhub

# 2. Tạo file .env (chỉ cần dòng AUTH_SECRET nếu muốn override)
Copy-Item .env.example .env

# 3. Khởi động cả Postgres + app + Adminer (auto seed lần đầu)
docker compose up -d --build

# 4. Theo dõi log
docker compose logs -f app
```

| Service  | URL                       | Ghi chú                            |
| -------- | ------------------------- | ---------------------------------- |
| App      | http://localhost:3000     | Next.js                            |
| Adminer  | http://localhost:8088     | Server `db`, user/pass `mentorhub` |
| Postgres | `localhost:5433`          | DB `mentorhub`                     |

Dừng / xoá:

```powershell
docker compose down            # giữ dữ liệu
docker compose down -v         # xoá luôn volume DB + uploads
```

---

## 3. Chạy ở chế độ dev (local Node.js)

```powershell
# 1. Cài deps (postinstall sẽ tự chạy zenstack generate + prisma generate)
npm install

# 2. Tạo .env và sửa DATABASE_URL trỏ vào Postgres local của bạn
Copy-Item .env.example .env

# 3. Tạo schema + dữ liệu mẫu
npm run db:push
npm run db:seed

# 4. Start dev server (http://localhost:3000)
npm run dev
```

### Tài khoản mẫu

| Email                 | Mật khẩu      | Vai trò           |
| --------------------- | ------------- | ----------------- |
| `admin@itss.local`    | `password123` | ADMIN             |
| `alice@student.local` | `password123` | STUDENT           |
| `mentor1@itss.local`  | `password123` | MENTOR (verified) |
| `hr@fpt.local`        | `password123` | EMPLOYER          |

---

## 4. Scripts npm hữu ích

| Lệnh                   | Mục đích                                           |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Dev server                                         |
| `npm run build`        | Build production (chạy zenstack + prisma generate) |
| `npm run start`        | Start production build                             |
| `npm run lint`         | ESLint                                             |
| `npm run zen:generate` | Sinh lại Prisma schema + policies + hooks          |
| `npm run db:push`      | Sync schema sang DB (dev)                          |
| `npm run db:migrate`   | Tạo migration                                      |
| `npm run db:seed`      | Seed dữ liệu mẫu                                   |
| `npm run db:studio`    | Mở Prisma Studio                                   |

---

## 5. Cấu hình môi trường (`.env`)

```env
DATABASE_URL="postgresql://USER:PASS@localhost:5432/mentorhub?schema=public"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MentorHub & StuBiz"
```

> Khi chạy Docker, `DATABASE_URL` đã được set sẵn trong `docker-compose.yml`.

---

## 6. Tính năng đã hoàn thiện

### Cộng đồng & thảo luận
- Kênh thảo luận theo category + tag; tạo thread; trả lời (TipTap); upvote; accept solution.
- **Tìm kiếm** thread theo title / content / tag, phân trang 20/trang.
- **Đăng ẩn danh**: ZenStack policy + server-side `sanitizeAnonymous()` đảm bảo không lộ `authorId` xuống client.

### Việc làm / Doanh nghiệp
- Doanh nghiệp tự tạo company khi chưa link, ADMIN duyệt.
- Đăng tin tuyển dụng (validate **không nhận deadline đã qua**, chuẩn hoá về cuối ngày).
- **Tìm kiếm + sort** việc làm (mới nhất / hạn nộp gần nhất), lọc theo loại hình.
- Ứng tuyển có CV (PDF) — lưu **private**, proxy `/api/cv/[filename]` chỉ trả về cho:
  - chính chủ student,
  - employer có application trùng `companyId`,
  - ADMIN.
- Magic-bytes check `%PDF` ngăn spoof MIME.

### Mentor & chat
- Danh sách mentor đã verified, **tìm kiếm** theo tên/công ty/skill, phân trang.
- Nhắn tin 1-1 với mentor (room auto-create), polling **3s** khi tab active, **dừng** khi tab ẩn.

### Quản trị (ADMIN)
- Duyệt mentor / channel / report — **phân trang 15/tab**, badge tổng count.
- Notification bell: i18n, dấu chấm unread, thời gian tương đối theo locale.

### Bảo mật & chống lạm dụng
- Rate-limit token-bucket per user cho: tạo answer, thread, message, ứng tuyển, upload CV.
- Mật khẩu đăng ký **≥ 8 ký tự, gồm cả chữ và số**.
- `getEnhancedDb()` áp policy ZenStack cho mọi query qua user session.
- CV nằm trong `/private/uploads` (không serve trực tiếp).

### UX
- 2 ngôn ngữ: 🇻🇳 Tiếng Việt + 🇯🇵 日本語 (đổi qua menu góc trên, cookie `NEXT_LOCALE`).
- Dark / light theme (`next-themes`).

---

## 7. Cấu trúc thư mục

```
prisma/
  schema.zmodel            # nguồn duy nhất cho models + policies (ZenStack)
  prisma/schema.prisma     # generated
  seed.ts                  # dữ liệu mẫu
src/
  app/
    (auth)/                # login, register
    (main)/                # app shell (sidebar + topbar)
      channels/            # kênh thảo luận + search + paging
      threads/[id]/        # thread detail + answer dialog
      mentors/             # danh sách + search + paging
      companies/           # danh sách + search + paging
      jobs/                # search + sort + filter
      applications/        # đơn ứng tuyển của student
      chat/                # nhắn tin 1-1 (polling visibility-aware)
      employer/            # đăng tin, quản lý ứng viên, tạo company
      admin/               # duyệt mentor / channel / report (paging)
      profile/             # CV upload + chỉnh sửa
    api/
      auth/[...nextauth]/  # NextAuth handler
      upload/cv/           # POST PDF (magic-bytes + rate-limit)
      cv/[filename]/       # GET PDF có RBAC
  components/
    ui/                    # primitives
    layout/                # sidebar, topbar, notification-bell
    editor/rich-editor     # TipTap
    threads/ jobs/ chat/ employer/ admin/
  lib/
    auth.ts                # NextAuth v5 config
    db.ts                  # Prisma singleton (raw)
    enhanced-db.ts         # Prisma + ZenStack enhance (policy)
    rate-limit.ts          # token bucket in-process
    anonymous.ts           # strip identity khi isAnonymous
    sanitize.ts            # DOMPurify wrapper
messages/
  vi.json
  ja.json
docker-compose.yml         # db + app + adminer
Dockerfile
```

---

## 8. Push code lên GitHub

```powershell
# Sync với remote trước khi commit (tránh non-fast-forward)
git pull --rebase origin main

# Stage tất cả thay đổi
git add -A

# Xem lại trước khi commit
git status
git diff --cached --stat

# Commit
git commit -m "feat: search/paging, rate-limit, CV private, i18n, password strength"

# Push
git push origin main
```

> **Bảo mật**: `.env` đã được `.gitignore` — **không** commit. Cũng tránh commit `private/` và `public/uploads/`.

---

## 9. Troubleshooting

| Lỗi                                | Cách xử lý                                                            |
| ---------------------------------- | --------------------------------------------------------------------- |
| `prisma generate` báo thiếu schema | Chạy `npm run zen:generate` rồi `npx prisma generate`                 |
| Docker app báo `auth secret`       | Set `AUTH_SECRET` trong `.env` (≥ 32 ký tự)                           |
| Port 5433 / 3000 / 8088 đã chiếm   | Sửa mapping ở `docker-compose.yml`                                    |
| Đăng ký báo `WEAK_PASSWORD`        | Mật khẩu phải ≥ 8 ký tự, gồm cả chữ và số                             |
| CV không xem được                  | Phải đăng nhập đúng vai (student chủ CV / employer trùng job / ADMIN) |

---

## 10. Giấy phép

Internal — ITSS2 project.
