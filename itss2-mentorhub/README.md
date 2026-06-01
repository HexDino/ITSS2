# MentorHub & StuBiz — MVP

Nền tảng kết nối **sinh viên kỹ thuật** với **cố vấn thực chiến** (MentorHub) và **cơ hội việc làm** (StuBiz).

> **Stack:** Next.js 15 (App Router, standalone) · React 19 · TypeScript strict · ZenStack 2 + Prisma 5 + PostgreSQL 16 · NextAuth v5 · TailwindCSS · next-intl (vi / ja)

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cách 1 — Chạy bằng Docker (khuyến nghị)](#2-cách-1--chạy-bằng-docker-khuyến-nghị)
3. [Cách 2 — Chạy local (Node.js + Postgres)](#3-cách-2--chạy-local-nodejs--postgres)
4. [Tài khoản mẫu](#4-tài-khoản-mẫu)
5. [Biến môi trường (`.env`)](#5-biến-môi-trường-env)
6. [Scripts npm](#6-scripts-npm)
7. [Tính năng chính](#7-tính-năng-chính)
8. [Cấu trúc thư mục](#8-cấu-trúc-thư-mục)
9. [Quy trình push code](#9-quy-trình-push-code)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Yêu cầu hệ thống

| Công cụ          | Phiên bản tối thiểu | Bắt buộc với cách nào |
| ---------------- | ------------------- | --------------------- |
| **Docker Desktop** | 24+               | Cách 1                |
| **Node.js**      | 20.x LTS            | Cách 2                |
| **npm**          | 10+                 | Cách 2                |
| **PostgreSQL**   | 14+                 | Cách 2 (nếu không dùng Docker DB) |
| **Git**          | bất kỳ              | cả hai                |

Hệ điều hành: Windows (đã test với Docker Desktop / WSL2), macOS, Linux.

---

## 2. Cách 1 — Chạy bằng Docker (khuyến nghị)

> Lệnh duy nhất sẽ dựng **Postgres + app Next.js + Adminer**, tự `db push` schema và chạy seed lần đầu.

### Bước 1. Clone repo

```powershell
git clone https://github.com/HexDino/ITSS2.git
cd ITSS2/itss2-mentorhub
```

### Bước 2. Tạo file `.env` (tuỳ chọn)

`docker-compose.yml` đã set sẵn `DATABASE_URL`, `AUTH_SECRET` (dev), `NEXTAUTH_URL`.
Nếu muốn override (ví dụ deploy public), tạo `.env` ở thư mục gốc:

```env
AUTH_SECRET="<chuỗi >= 32 ký tự, ví dụ: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
RUN_SEED="true"   # đặt "false" sau lần seed đầu tiên nếu không muốn seed lại
```

### Bước 3. Build + start

```powershell
docker compose up -d --build
```

Build lần đầu mất ~3–6 phút (npm ci + zenstack + next build). Các lần sau chỉ vài chục giây nhờ layer cache.

### Bước 4. Kiểm tra trạng thái

```powershell
docker compose ps                 # phải thấy cả 3 container "Up (healthy)"
docker compose logs -f app        # theo dõi log app
curl http://localhost:3000/api/health
# -> {"ok":true,"db":"up","ts":"..."}
```

| Service       | URL                       | Ghi chú                                                |
| ------------- | ------------------------- | ------------------------------------------------------ |
| **App**       | http://localhost:3000     | Next.js                                                |
| **Adminer**   | http://localhost:8088     | System `PostgreSQL`, Server `db`, user/pass `mentorhub` |
| **Postgres**  | `localhost:5433`          | DB `mentorhub` (mapping host → container 5432)         |

### Bước 5. Dừng / xoá

```powershell
docker compose stop           # dừng nhưng giữ container
docker compose down           # xoá container, GIỮ volume (DB + uploads)
docker compose down -v        # xoá luôn volume (reset toàn bộ DB và file upload)
docker compose up -d --build  # build lại sau khi sửa code
```

---

## 3. Cách 2 — Chạy local (Node.js + Postgres)

### Bước 1. Cài deps

```powershell
git clone https://github.com/HexDino/ITSS2.git
cd ITSS2/itss2-mentorhub
npm install
```

> `postinstall` sẽ tự chạy `zenstack generate` + `prisma generate`. Nếu có lỗi, chạy `npm run zen:generate` thủ công.

### Bước 2. Chuẩn bị Postgres + `.env`

Cài Postgres local (hoặc dùng container `db` từ `docker-compose.yml`):

```powershell
docker compose up -d db        # chỉ chạy Postgres trên cổng 5433
```

Tạo `.env` từ template và sửa `DATABASE_URL`:

```powershell
Copy-Item .env.example .env
```

Ví dụ `.env` khi dùng container `db`:

```env
DATABASE_URL="postgresql://mentorhub:mentorhub_dev_pw@localhost:5433/mentorhub?schema=public"
AUTH_SECRET="dev-secret-please-change-min-32-chars-xxxxxxxx"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MentorHub & StuBiz"
```

### Bước 3. Khởi tạo DB + seed

```powershell
npm run db:push     # đồng bộ schema (không cần migration cho dev)
npm run db:seed     # tạo dữ liệu mẫu (kênh, mentor, tài khoản)
```

### Bước 4. Start dev server

```powershell
npm run dev
# -> http://localhost:3000
```

Build / start production cục bộ:

```powershell
npm run build
npm run start
```

---

## 4. Tài khoản mẫu

Tất cả mật khẩu: **`password123`**

| Email                 | Vai trò             |
| --------------------- | ------------------- |
| `admin@itss.local`    | ADMIN               |
| `alice@student.local` | STUDENT             |
| `mentor1@itss.local`  | MENTOR (đã verify)  |
| `hr@fpt.local`        | EMPLOYER            |

---

## 5. Biến môi trường (`.env`)

| Biến                  | Mô tả                                                              | Bắt buộc |
| --------------------- | ------------------------------------------------------------------ | -------- |
| `DATABASE_URL`        | Chuỗi kết nối Postgres                                             | ✅       |
| `AUTH_SECRET`         | Khoá ký JWT của NextAuth — **≥ 32 ký tự** ngẫu nhiên               | ✅       |
| `AUTH_TRUST_HOST`     | `"true"` khi chạy sau proxy / Docker                               | ✅       |
| `NEXTAUTH_URL`        | URL public của app (ví dụ `http://localhost:3000`)                 | ✅       |
| `NEXT_PUBLIC_APP_NAME`| Tên hiển thị trên UI                                               |          |
| `RUN_SEED`            | `"true"` để entrypoint Docker chạy seed lần đầu                    |          |

> Khi dùng Docker, các biến trên đã có sẵn trong `docker-compose.yml`; bạn chỉ cần override những gì muốn đổi.

---

## 6. Scripts npm

| Lệnh                   | Tác dụng                                            |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Dev server (HMR)                                    |
| `npm run build`        | `zenstack generate` → `prisma generate` → `next build` |
| `npm run start`        | Chạy bản production đã build                        |
| `npm run lint`         | ESLint                                              |
| `npm run zen:generate` | Sinh lại Prisma schema + policies + hooks từ zmodel |
| `npm run db:push`      | Đồng bộ schema vào DB (dev)                         |
| `npm run db:migrate`   | Tạo migration                                       |
| `npm run db:seed`      | Seed dữ liệu mẫu                                    |
| `npm run db:studio`    | Mở Prisma Studio                                    |

---

## 7. Tính năng chính

**Cộng đồng & thảo luận**

- Kênh thảo luận theo category + tag; tạo thread; trả lời (TipTap); upvote; accept solution.
- Tìm kiếm thread theo title / content / tag, phân trang 20/trang.
- Đăng ẩn danh: ZenStack policy + server-side `sanitizeAnonymous()` không lộ `authorId`.

**Việc làm / Doanh nghiệp**

- Employer tự tạo company khi chưa link; ADMIN duyệt.
- Đăng tin tuyển dụng, validate **không nhận deadline đã qua**.
- Tìm kiếm + sort việc làm (mới nhất / hạn nộp gần nhất), filter theo loại hình.
- Ứng tuyển kèm CV (PDF) — lưu **private**, proxy `/api/cv/[filename]` chỉ trả về cho chính chủ / employer trùng job / ADMIN. Magic-bytes `%PDF` chống spoof MIME.

**Mentor & chat**

- Danh sách mentor đã verified, tìm kiếm theo tên / công ty / skill, phân trang.
- Nhắn tin 1-1 với mentor (room auto-create), polling 3s khi tab active, dừng khi tab ẩn.

**Quản trị (ADMIN)**

- Duyệt mentor / channel / report — phân trang 15/tab, badge tổng count.
- Notification bell: i18n, dấu chấm unread, thời gian tương đối theo locale.

**Bảo mật & chống lạm dụng**

- Rate-limit token-bucket per user cho: tạo answer, thread, message, ứng tuyển, upload CV.
- Mật khẩu đăng ký ≥ 8 ký tự, gồm cả chữ và số.
- `getEnhancedDb()` áp policy ZenStack cho mọi query qua session.
- CV nằm trong `/private/uploads`, không serve trực tiếp qua web.

**UX**

- 2 ngôn ngữ: 🇻🇳 Tiếng Việt + 🇯🇵 日本語 (cookie `NEXT_LOCALE`).
- Dark / light theme (`next-themes`).

---

## 8. Cấu trúc thư mục

```
prisma/
  schema.zmodel            # nguồn duy nhất cho models + policies (ZenStack)
  prisma/schema.prisma     # generated (không commit)
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
      chat/                # nhắn tin 1-1
      employer/            # đăng tin, duyệt ứng viên
      admin/               # duyệt mentor / channel / report
      profile/             # CV upload + chỉnh sửa
    api/
      auth/[...nextauth]/  # NextAuth handler
      upload/cv/           # POST PDF (magic-bytes + rate-limit)
      cv/[filename]/       # GET PDF có RBAC
      health/              # /api/health (dùng cho Docker HEALTHCHECK)
  components/
    ui/                    # primitives
    layout/                # sidebar, topbar, notification-bell
    editor/rich-editor     # TipTap
    threads/ jobs/ chat/ employer/ admin/
  lib/
    auth.ts                # NextAuth v5 config
    db.ts                  # Prisma singleton
    enhanced-db.ts         # Prisma + ZenStack enhance (policy)
    rate-limit.ts          # token bucket in-process
    anonymous.ts           # strip identity khi isAnonymous
    sanitize.ts            # DOMPurify wrapper
messages/
  vi.json
  ja.json
docker/
  entrypoint.sh            # wait DB → db push → seed → next start
Dockerfile                 # multi-stage: deps → builder → runner (standalone)
docker-compose.yml         # db + app + adminer
```

---

## 9. Quy trình push code

```powershell
# Xem branch và tình trạng hiện tại
git status
git branch --show-current

# Đồng bộ với remote trước (tránh non-fast-forward)
git pull --rebase origin <branch>

# Stage + commit
git add -A
git commit -m "feat: <mô tả ngắn gọn>"

# Push
git push origin <branch>
```

> **Bảo mật:** `.env`, `private/`, `public/uploads/`, `docker_build.log`, `node_modules/`, `.next/`, `prisma/prisma/schema.prisma` đã được `.gitignore` — **không commit**.

---

## 10. Troubleshooting

| Triệu chứng                                                | Nguyên nhân & cách xử lý                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine` | Docker Desktop chưa chạy. Mở Docker Desktop và đợi tới khi icon xanh. |
| `port is already allocated` (3000 / 5433 / 8088)           | Sửa mapping ở `docker-compose.yml` hoặc dừng tiến trình đang chiếm.                      |
| Container `app` báo `auth secret`                          | Set `AUTH_SECRET` ≥ 32 ký tự trong `.env`.                                               |
| `prisma generate` báo thiếu schema                         | `npm run zen:generate` rồi `npx prisma generate`.                                        |
| Đăng ký báo `WEAK_PASSWORD`                                | Mật khẩu phải ≥ 8 ký tự, gồm cả chữ và số.                                               |
| Không xem được CV                                          | Phải đăng nhập đúng vai: chính chủ student / employer trùng job / ADMIN.                 |
| Seed lỗi nhưng app vẫn chạy                                | Entrypoint cố tình `\|\| echo "Seed failed (continuing)"`. Xem log app để debug seed.    |
| Muốn reset toàn bộ DB                                      | `docker compose down -v && docker compose up -d --build`                                 |
| Build Docker bị `EBUSY` / `permission denied` trên Windows | Đóng các trình khác đang giữ `node_modules/` (VS Code, antivirus) rồi build lại.         |

---

## Giấy phép

Internal — ITSS2 project.
