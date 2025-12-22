# YTRC Portal - Monorepo

A modern desktop application monorepo built with **Electron + Vue 3**, **NestJS**, **Prisma**, and **PostgreSQL**.

The application is designed for the **YTRC Portal Center**, providing a robust system for managing factory operations, including user management, suppliers, and queues.

## 🏗️ Architecture

```
my-app-monorepo/
├── apps/
│   ├── desktop/          # Electron + Vue 3 + Vite frontend
│   └── api/              # NestJS backend API
├── packages/
│   ├── database/         # Prisma schema and migrations
│   └── types/            # Shared TypeScript types
└── docker-compose.yml    # PostgreSQL for local development
```

## 🚀 Key Features

### Frontend (Desktop App)

- **Electron + Vue 3**: High-performance desktop experience.
- **Layout System**:
  - **Sidebar**: Admin-only navigation for managing modules.
  - **Navbar**: Context-aware top bar with navigation controls (Back, Forward, Refresh, Home).
  - **Global Background**: Consistent animated background across all pages.
- **Dynamic Routing**: Role-based access control (Admin vs User).
- **Authentication**:
  - Secure Login with "Remember Me".
  - **Force Change Password**: New users must change their password on first login.
- **Error Handling**: Custom 404 and Error pages.
- **UI Components**: Built with **Shadcn-Vue** (Radix Vue + Tailwind CSS) and **Lucide Icons**.

### Backend (API)

- **NestJS**: Scalable server-side application.
- **Prisma ORM**: Type-safe database access with PostgreSQL.
- **Role-Based Access Control (RBAC)**: Secure endpoints based on User roles.
- **User Management**: Creating users, password reset flows, and profile management.
- **Swagger Documentation**: API endpoints documented automatically.

## 📋 Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0
- **Docker** (optional): For local PostgreSQL
- **PostgreSQL**: If not using Docker

## 🛠️ Getting Started

### 1. Clone and Install

```bash
cd /path/to/project
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp?schema=public"
API_URL="http://localhost:3000"
JWT_SECRET="your-secret-key-change-in-production"
```

### 3. Start PostgreSQL

**Option A: Using Docker (Recommended)**

```bash
npm run dev:db
# or
docker-compose up -d
```

**Option B: Local PostgreSQL**

Install PostgreSQL locally and create a database named `myapp`.

### 4. Database Setup

Generate Prisma Client and run migrations:

```bash
cd packages/database
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

This will:

- Generate the Prisma Client
- Create database tables
- Seed with sample data (Default Admin: `admin@example.com` / `password`)

### 5. Start Development

From the root directory, run:

```bash
npm run dev
```

This starts:

- **API Server**: http://localhost:3000/api
- **Desktop App**: Electron window (Vite dev server)

Or start individually:

```bash
# API only
npm run dev:api

# Desktop app only
npm run dev:desktop
```

## 🔐 Credentials & Authentication

- **Default Admin**:
  - Email: `admin@example.com`
  - Password: `password` (You will be forced to change this on first login)

- **Force Change Password Flow**:
  - New users created by Admin will have `forceChangePassword: true`.
  - Upon login, they are redirected to `/change-password`.
  - They must set a new password to proceed to the Dashboard.

## 📦 Building for Production

### Build Desktop App

```bash
cd apps/desktop

# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win
npm run build:linux
```

Output will be in `dist/`.

### Build API

```bash
cd apps/api
npm run build
npm run start:prod
```

## 🗂️ Project Structure

### Apps

#### `apps/desktop` - Frontend

- `src/main/`: Electron main process.
- `src/preload/`: Context bridge.
- `src/renderer/`: Vue 3 application.
  - `components/layout/`: Sidebar, Navbar, MainLayout, GlobalBackground.
  - `views/`: Page components (Login, Home, NotFound, Error).
  - `stores/`: Pinia state management (Auth).

#### `apps/api` - Backend

- `src/auth/`: Authentication logic (Login, Change Password, Guards).
- `src/users/`: User management.
- `src/app.module.ts`: Root module.

### Packages

#### `packages/database`

- `prisma/schema.prisma`: Database schema definition.

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Run `npm run lint`
4. Submit a pull request

## 📄 License

MIT
