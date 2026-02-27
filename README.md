# Trello Clone

A full-stack Kanban project management system built with modern technologies.

## Tech Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** MySQL with TypeORM
- **Queue:** Redis with BullMQ
- **Real-time:** Socket.io
- **Payment:** Stripe

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **State Management:** Zustand
- **Styling:** Tailwind CSS + ShadcnUI
- **Drag & Drop:** DnD Kit

## Project Structure

```
trello-clone/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
├── package.json      # Monorepo configuration
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- MySQL 8.0+
- Redis 7.0+

### Installation

1. Clone the repository
```bash
git clone https://github.com/Trinhtrongtinh/trello-clone.git
cd trello-clone
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

4. Set up the database
```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE trello_clone;"
```

5. Run development servers
```bash
npm run dev
```

This will start:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Development Scripts

```bash
# Run all services
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend

# Build all
npm run build

# Lint all
npm run lint

# Test all
npm run test
```

## Features
-	Secure Authentication: Implemented robust security using JWT (JSON Web Tokens) and Bcrypt password hashing, featuring a granular Role-Based Access Control (RBAC) system.
-	High-Performance Kanban Engine: Engineered a fluid Drag & Drop experience utilizing a Double-precision positioning algorithm, achieving $O(1)$ complexity for reordering without re-indexing the entire database.
-	Real-time Collaboration: Integrated Socket.io Gateways to ensure instantaneous state synchronization and live updates across all active project members.
-	Advanced Workspace Management: Supports multi-tenant workspace environments with member invitation workflows and customizable board visibility.
-	Comprehensive Task Details: Includes support for multiple checklists per card, file attachments, and a detailed Activity Log for full audit transparency.
-	Automated Background Processing: Leverages Redis & BullMQ to handle time-sensitive tasks, such as automated deadline reminders and transactional email delivery.
-	SaaS Monetization: Full integration with Stripe API, utilizing Webhooks to automate the subscription lifecycle and plan-based feature gating (Free vs. Pro).


## License

[TrinhTrongTinh](https://github.com/Trinhtrongtinh)
