# Kanban

Kanban là một ứng dụng quản lý công việc dạng Kanban được xây dựng theo mô hình monorepo, gồm backend NestJS và frontend Next.js. Dự án tập trung vào các luồng cốt lõi như xác thực, workspace/board/list/card, kéo thả thẻ, thông báo thời gian thực, tải tệp đính kèm và thanh toán Stripe.

## Mục Tiêu Dự Án

- Sản phẩm full-stack đủ rõ để mang đi phỏng vấn CV fresher/intern.
- Demo được các luồng chính từ đăng ký/đăng nhập đến tạo và quản lý board/card.
- Có cấu trúc code dễ giải thích khi hỏi về kiến trúc, state management, API và realtime.

## Kiến Trúc Tổng Quan

```text
frontend/  -> Next.js App Router, giao diện người dùng, state, gọi API, realtime socket
backend/   -> NestJS API, auth, board/card/workspace logic, cache, queue, upload, payment
MySQL      -> Lưu dữ liệu chính
Redis      -> Cache, rate limit, BullMQ jobs
Socket.io  -> Cập nhật realtime
Stripe     -> Thanh toán / plan
```

### Backend

- NestJS + TypeScript
- TypeORM + MySQL
- Redis cho cache/rate limit
- Socket.io cho realtime
- BullMQ cho background jobs
- Stripe cho payment flow

### Frontend

- Next.js App Router
- React + TypeScript
- Zustand cho state
- Tailwind CSS + shadcn/ui
- DnD Kit cho drag & drop

## Tính Năng Chính

- Đăng ký, đăng nhập, refresh session, logout
- Quản lý workspace, board, list, card
- Kéo thả card giữa các list
- Checklist, comment, label, attachment
- Thông báo realtime
- Search / filter / rate limit cơ bản
- Thanh toán Stripe ở mức demo

## Cấu Trúc Thư Mục

```text
kanban-clone/
├── backend/          # NestJS API server
├── frontend/         # Next.js web app
├── docker-compose.yml
├── package.json      # Monorepo scripts
└── README.md
```

## Chạy Local

### 1) Yêu cầu

- Node.js 20+
- MySQL 8+
- Redis 7+

### 2) Cài dependency

```bash
npm install
```

### 3) Tạo file env

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 4) Khởi động database và redis

```bash
docker compose up -d mysql redis
```

### 5) Chạy ứng dụng

```bash
npm run dev
```

Mặc định:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Scripts Hữu Ích

```bash
npm run dev            # chạy cả backend + frontend
npm run dev:backend    # chạy backend
npm run dev:frontend   # chạy frontend
npm run build          # build toàn bộ workspace
npm run lint           # lint toàn bộ workspace
npm run lint:ci        # lint gate dùng cho CI
npm run test:backend   # test backend
```

## Environment Variables

### Backend: `backend/.env.example`

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=kanban_user
DB_PASSWORD=kanban_pass
DB_DATABASE=kanban_clone

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
```

### Frontend: `frontend/.env.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### File gốc tham khảo

File `.env.example` ở root chứa bộ biến đầy đủ hơn cho cả backend/frontend khi bạn cần map lại cấu hình local hoặc production.
