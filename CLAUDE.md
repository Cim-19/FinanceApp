# FinanceApp — Personal Finance SaaS

Aplicación web SaaS para gestión de finanzas personales con soporte PWA (instalable en móvil).
Stack: React + Vite (Vercel) · Node.js + Express + Prisma + PostgreSQL (Railway) · Docker (local).

---

## Project Structure

```
financeapp/
├── docker-compose.yml         # Orquesta: postgres + pgadmin + backend + frontend
├── .gitignore
├── CLAUDE.md
│
├── backend/                   # Node.js + Express + Prisma (→ Railway)
│   ├── prisma/
│   │   ├── schema.prisma      # Modelos: User, Account, Transaction, Category, Budget, SavingGoal
│   │   ├── seed.js            # Categorías del sistema precargadas
│   │   └── migrations/
│   ├── src/
│   │   ├── app.js             # Entry point Express
│   │   ├── config/prisma.js   # Prisma client singleton
│   │   ├── routes/            # auth, users, accounts, transactions, categories, budgets, reports, transfers
│   │   ├── controllers/       # Lógica por recurso
│   │   ├── middlewares/       # authJWT, errorHandler, planGuard, validate
│   │   └── services/          # (reportes avanzados, recurrentes — Fase 5+)
│   ├── Dockerfile             # Producción → Railway
│   ├── Dockerfile.dev         # Desarrollo con hot reload
│   ├── .env.example
│   └── package.json
│
└── frontend/                  # React + Vite + Tailwind + Recharts (→ Vercel)
    ├── public/
    │   ├── manifest.webmanifest  # PWA manifest (generado por vite-plugin-pwa)
    │   └── icons/             # Íconos PWA 192x192 y 512x512
    ├── src/
    │   ├── api/               # Axios instances y llamadas al backend
    │   ├── components/ui/     # Botones, inputs, modales, badges
    │   ├── components/charts/ # Gráficas con Recharts
    │   ├── components/layout/ # Sidebar, Navbar, BottomNav (mobile)
    │   ├── pages/             # Dashboard, Transactions, Accounts, Budgets, Reports, Settings
    │   ├── hooks/             # useAuth, useTransactions, useAccounts, useBudgets
    │   ├── store/             # Estado global con Zustand
    │   └── utils/             # formatCurrency, formatDate, helpers
    ├── Dockerfile.dev
    ├── vite.config.js         # Incluye vite-plugin-pwa
    └── package.json
```

---

## Commands

### Docker (desarrollo local — usar siempre estos)
```bash
docker-compose up -d              # Levantar todos los servicios
docker-compose up -d postgres     # Solo la base de datos
docker-compose down               # Bajar servicios
docker-compose logs -f backend    # Ver logs del backend
docker-compose exec backend sh    # Entrar al contenedor backend

# Prisma desde el contenedor
docker-compose exec backend npm run db:migrate:dev
docker-compose exec backend npm run db:seed
docker-compose exec backend npm run db:studio
```

### Backend (si se corre sin Docker)
```bash
cd backend
cp .env.example .env              # Configurar variables
npm install
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev                       # Puerto 3000
```

### Frontend (si se corre sin Docker)
```bash
cd frontend
npm install
npm run dev                       # Puerto 5173
npm run build
npm run lint
```

### URLs locales
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health check**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050 (admin@financeapp.com / admin123)
- **Prisma Studio**: http://localhost:5555 (con `npm run db:studio`)

---

## Architecture & Key Decisions

### Auth
- JWT access token (15min) + refresh token (7d) en httpOnly cookie
- Middleware `authJWT` protege todas las rutas privadas
- Contraseñas con bcrypt (salt rounds: 12)

### Multi-tenant SaaS
- Cada recurso tiene `userId` — **siempre filtrar por el usuario autenticado**
- Middleware `planGuard` verifica límites del plan Free
- Planes: Free · Pro ($4.99/mes) · Family ($8.99/mes)
- Free: 50 transacciones/mes, máx 2 cuentas, sin exportar

### Account Types
- `CORRIENTE` — cuenta de gastos del día a día
- `AHORRO` — 🐷 tiene `SavingGoal` opcional; sección separada en dashboard
- `INVERSION` — cuenta de inversión
- `CREDITO` — tarjeta de crédito

### Transfers
- Transferencia = 2 transacciones con `isTransfer: true`
- Se excluyen de reportes de ingresos/egresos
- Operación atómica con `prisma.$transaction()`

### Currency
- Por defecto: PEN (S/.) · Soporte adicional: USD
- Configurado a nivel de usuario

### PWA
- `vite-plugin-pwa` con Workbox
- Caché offline de últimas 50 transacciones
- Instalable en Android e iOS

---

## Database Models

Ver `backend/prisma/schema.prisma` para el schema completo.
- `User` → `Account` → `SavingGoal`
- `User` → `Category` (+ categorías del sistema con `isSystem: true`)
- `User` → `Transaction` → `RecurringRule`
- `User` → `Budget` (por categoría/mes)
- `User` → `Subscription`

---

## API Conventions

- Base URL: `http://localhost:3000/api` (dev) / `https://<app>.railway.app/api` (prod)
- Header requerido: `Authorization: Bearer <accessToken>`
- Respuesta estándar:
  ```json
  { "success": true,  "data": {},    "message": "OK"    }
  { "success": false, "error": "..." }
  ```
- Paginación: `?page=1&limit=20`
- Filtros transacciones: `?type=EGRESO&categoryId=x&desde=2026-01-01&hasta=2026-01-31&accountId=y&search=texto`

---

## Important Rules

- NUNCA hardcodear credenciales — siempre variables de entorno
- NUNCA commitear `.env` — solo `.env.example`
- Siempre filtrar queries por `userId` del token JWT
- Los endpoints de exportación requieren plan Pro (`checkExportPermission`)
- Usar `prisma.$transaction()` para transferencias y ediciones que afecten balance
- `isTransfer: true` excluye transacciones de reportes financieros
- `manifest.webmanifest` se genera en `frontend/public/` vía `vite-plugin-pwa` y se referencia en `index.html`
- En Docker, el backend conecta a postgres por hostname `postgres` (no localhost)

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://financeapp:financeapp123@postgres:5432/financeapp_dev
JWT_SECRET=<generar con crypto.randomBytes(64)>
JWT_REFRESH_SECRET=<generar con crypto.randomBytes(64)>
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3000/api
```

---

## Deployment

### Railway (Backend)
1. Conectar repo a Railway → seleccionar carpeta `backend/`
2. Agregar servicio PostgreSQL en Railway → copiar `DATABASE_URL`
3. Configurar variables de entorno en Railway dashboard
4. Railway usa `Dockerfile` (producción) automáticamente
5. Post-deploy: correr `npm run db:migrate` y `npm run db:seed`

### Vercel (Frontend)
1. Conectar repo → Root Directory: `frontend/`
2. Framework: Vite (auto-detectado)
3. Agregar variable: `VITE_API_URL=https://<tu-app>.railway.app/api`
4. Deploy automático en cada push a `main`