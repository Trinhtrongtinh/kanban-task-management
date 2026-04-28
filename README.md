# Trello Clone

Trello Clone là một ứng dụng quản lý công việc dạng Kanban được xây dựng theo mô hình monorepo, gồm backend NestJS và frontend Next.js. Dự án tập trung vào các luồng cốt lõi như xác thực, workspace/board/list/card, kéo thả thẻ, thông báo thời gian thực, tải tệp đính kèm và thanh toán Stripe.

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
trello-clone/
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
DB_USERNAME=trello_user
DB_PASSWORD=trello_pass
DB_DATABASE=trello_clone

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

## Tài Khoản Demo

Repo hiện tại chưa commit seed data hay tài khoản demo cố định, nên cách nhanh nhất để demo local là:

1. Chạy backend + frontend.
2. Tạo tài khoản mới từ màn hình đăng ký.
3. Tạo workspace/board/list/card từ UI.

Nếu bạn muốn có tài khoản cố định cho phỏng vấn, nên thêm seed script riêng cho project.

## Deploy

### Cách deploy dễ nhất cho người mới trên Google Cloud

Với mục tiêu demo CV/fresher, cách đơn giản nhất là dùng **1 Compute Engine VM** rồi chạy toàn bộ app bằng Docker Compose:

- MySQL trong container
- Redis trong container
- Backend NestJS trong container
- Frontend Next.js trong container

#### 1) Tạo VM trên Google Cloud

1. Vào Google Cloud Console.
2. Tạo project mới hoặc dùng project hiện tại.
3. Bật billing để dùng trial $300.
4. Vào `Compute Engine` → `VM instances` → `Create instance`.
5. Chọn:
	- Machine type: `e2-medium` hoặc `e2-small`
	- Boot disk: `Ubuntu 22.04 LTS`
6. Mở firewall cho TCP ports `3000` và `3001`.

#### 2) Cài Docker trên VM

SSH vào VM, rồi chạy:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

#### 3) Clone repo và chuẩn bị env

```bash
git clone https://github.com/Trinhtrongtinh/trello-clone.git
cd trello-clone
cp .env.gcp.example .env.gcp
```

Mở file `.env.gcp` và thay `YOUR_VM_EXTERNAL_IP` bằng IP public của VM.

#### 4) Khởi động hệ thống

```bash
docker compose --env-file .env.gcp -f docker-compose.gcp.yml up -d --build
```

#### 5) Kiểm tra trạng thái

```bash
docker compose --env-file .env.gcp -f docker-compose.gcp.yml ps
docker compose --env-file .env.gcp -f docker-compose.gcp.yml logs -f backend
```

#### 6) Truy cập app

- Frontend: `http://YOUR_VM_EXTERNAL_IP:3000`
- Backend: `http://YOUR_VM_EXTERNAL_IP:3001`

#### 7) Lưu ý cho lần deploy đầu

- Hãy demo bằng đăng ký/đăng nhập nội bộ trước.
- Google OAuth và Stripe có thể để trống nếu bạn chưa cấu hình xong.
- Nếu muốn dùng Google login thật, bạn nên có domain riêng và HTTPS sau.

### Link live demo

Khi đã deploy xong, điền link thật vào đây:

- Frontend live demo: `<your-live-frontend-url>`
- Backend API: `<your-live-backend-url>`
- Repository: https://github.com/Trinhtrongtinh/trello-clone

## Checklist Trước Khi Gửi CV

- `npm run build` pass
- `npm run lint:ci` pass
- `npm run test:backend` pass
- Có ảnh chụp màn hình hoặc video demo
- Có link live demo nếu đã deploy

## Ghi Chú

- Tên miền local backend mặc định là `http://localhost:3001`.
- Frontend đang dùng App Router và gọi API qua biến môi trường `NEXT_PUBLIC_API_URL`.
- Nếu bạn đổi host/port, nhớ cập nhật cả backend CORS và frontend env.
