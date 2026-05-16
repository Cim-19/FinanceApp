# FinanceApp 🐷

> Aplicación web SaaS de gestión de finanzas personales y familiares. Instalable como PWA en Android e iOS.

![FinanceApp Dashboard](.github/screenshots/dashboard.png)
<!-- TODO: Reemplazar con screenshot real del dashboard -->

**Demo en vivo:** [https://financeapp.vercel.app](https://financeapp.vercel.app)
<!-- TODO: Reemplazar con URL real de Vercel -->

---

## Funcionalidades

### Gestión financiera personal
- **Dashboard** — Resumen de balance, ingresos/egresos del mes, evolución histórica y últimas transacciones
- **Cuentas** — Corriente, Ahorro, Inversión y Crédito con colores e íconos personalizables
- **Transacciones** — Registro con categorías, etiquetas, búsqueda y filtros avanzados
- **Transferencias** — Entre cuentas propias con historial detallado y operación atómica
- **Presupuestos** — Por categoría y mes con barra de progreso y alertas de exceso
- **Categorías** — Personalizables + 19 categorías del sistema precargadas
- **Metas de ahorro** — Vinculadas a cuentas de ahorro con progreso visual y fecha límite
- **Transacciones recurrentes** — Reglas por frecuencia (diaria/semanal/mensual/anual)
- **Reportes** — Gráficos de ingresos vs egresos, por categoría, evolución de balance
- **Exportar** — CSV y PDF con diseño completo (plan Pro)
- **Búsqueda global** — `Ctrl+K` con resultados agrupados y navegación por teclado
- **Modo oscuro** — Tema claro/oscuro por preferencia del usuario
- **PWA** — Instalable en móvil, con caché offline de últimas transacciones

### Panel familiar (plan Family)
- Crear una familia e invitar hasta 4 miembros por email
- Dashboard consolidado: balance, ingresos y egresos de todos los miembros
- Gráfico de ingresos vs egresos por miembro
- Distribución de gastos por categoría (gráfico de torta + top categorías)
- **Presupuestos familiares** — Límite de gasto compartido por categoría y mes
- **Metas de ahorro familiares** — Objetivos en común con aporte vinculado a transacción real
- Insignia de plan visible en el sidebar para todos los miembros

---

## Planes

| Característica               | Free        | Pro ($4.99/mes) | Family ($8.99/mes) |
|------------------------------|:-----------:|:---------------:|:------------------:|
| Transacciones / mes          | 50          | Ilimitadas      | Ilimitadas         |
| Cuentas                      | 2           | Ilimitadas      | Ilimitadas         |
| Presupuestos                 | ✓           | ✓               | ✓                  |
| Categorías personalizadas    | ✓           | ✓               | ✓                  |
| Metas de ahorro              | ✓           | ✓               | ✓                  |
| Transacciones recurrentes    | ✓           | ✓               | ✓                  |
| Reportes avanzados           | ✗           | ✓               | ✓                  |
| Exportar CSV                 | ✗           | ✓               | ✓                  |
| Exportar PDF                 | ✗           | ✓               | ✓                  |
| Panel familiar               | ✗           | ✗               | ✓ (hasta 5 users)  |
| Presupuestos familiares      | ✗           | ✗               | ✓                  |
| Metas familiares compartidas | ✗           | ✗               | ✓                  |

---

## Screenshots

| Dashboard | Transacciones | Panel Familiar |
|-----------|---------------|----------------|
| ![Dashboard](.github/screenshots/dashboard.png) | ![Transacciones](.github/screenshots/transactions.png) | ![Familia](.github/screenshots/family.png) |
<!-- TODO: Agregar screenshots reales -->

---

## Stack tecnológico

### Frontend
| Tecnología | Uso |
|-----------|-----|
| React 18 + Vite | Framework y bundler |
| Tailwind CSS | Estilos utilitarios con soporte dark mode |
| Zustand | Estado global (auth, tema) |
| React Router v6 | Enrutamiento SPA |
| Recharts | Gráficos (barras, torta, línea) |
| lucide-react | Íconos |
| Axios | Cliente HTTP con interceptores JWT |
| vite-plugin-pwa + Workbox | PWA, service worker, caché offline |

### Backend
| Tecnología | Uso |
|-----------|-----|
| Node.js + Express | Servidor HTTP |
| Prisma ORM | Acceso a base de datos con migraciones |
| PostgreSQL 16 | Base de datos relacional |
| JWT (access 15min + refresh 7d) | Autenticación stateless |
| bcryptjs | Hash de contraseñas |
| PDFKit | Generación de reportes PDF |
| Nodemailer | Envío de emails (bienvenida, reset, invitaciones) |

### Infraestructura
| Herramienta | Entorno |
|------------|---------|
| Docker + Docker Compose | Desarrollo local |
| Railway | Backend + PostgreSQL en producción |
| Vercel | Frontend en producción |

---

## Arquitectura

```
┌─────────────────────┐        ┌──────────────────────────┐
│   Vercel (CDN)      │        │   Railway                │
│                     │        │                          │
│  React + Vite PWA  │──HTTPS─▶│  Express API  :3000     │
│  (financeapp.vercel │        │  Prisma ORM              │
│       .app)         │        │       │                  │
└─────────────────────┘        │       ▼                  │
                               │  PostgreSQL 16           │
                               └──────────────────────────┘
```

### Decisiones de arquitectura clave
- **Multi-tenant**: cada recurso tiene `userId` — todas las queries filtran por el usuario del JWT
- **Auth**: access token (15min) en memoria + refresh token (7d) en cookie httpOnly
- **Transferencias**: dos transacciones `isTransfer: true` en `prisma.$transaction()` — se excluyen de reportes
- **Plan familiar**: al crear o unirse a una familia el plan sube a `FAMILY` automáticamente; al salir o ser removido baja a `FREE`
- **Exportaciones**: PDF y CSV protegidos con middleware `planGuard('EXPORT')`
- **PWA offline**: Workbox con estrategias CacheFirst (fuentes), NetworkFirst (transacciones/cuentas), StaleWhileRevalidate (reportes)

---

## Modelos de base de datos

```
User ──┬── Account ── SavingGoal
       ├── Category
       ├── Transaction ── RecurringRule
       ├── Budget
       ├── Subscription
       ├── Notification
       └── FamilyMember ──▶ Family ──┬── FamilyInvitation
                                     ├── FamilyBudget ──▶ Category
                                     └── FamilySavingGoal
```

---

## Estructura del proyecto

```
financeapp/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 13 modelos
│   │   ├── seed.js              # 19 categorías del sistema
│   │   └── migrations/
│   └── src/
│       ├── app.js               # Entry point
│       ├── config/prisma.js     # Singleton Prisma Client
│       ├── controllers/         # auth, accounts, transactions, categories,
│       │                        # budgets, reports, transfers, search,
│       │                        # family, admin, users
│       ├── middlewares/         # authJWT, errorHandler, planGuard, validate
│       ├── routes/
│       └── services/
│           └── email.service.js # Nodemailer (bienvenida, reset, invitación)
│
└── frontend/
    └── src/
        ├── api/                 # Llamadas Axios por recurso
        ├── components/
        │   ├── layout/          # Sidebar, Navbar, BottomNav, AppLayout
        │   ├── accounts/        # AccountCard, TransferModal, SavingGoalModal
        │   ├── transfers/       # TransferHistory
        │   ├── charts/          # Gráficos Recharts
        │   ├── ui/              # Button, Modal, Badge, etc.
        │   └── pwa/             # UpdateNotification, InstallPrompt
        ├── hooks/               # useFamily, useTransactions, useAccounts, ...
        ├── pages/               # Dashboard, Accounts, Transactions, Budgets,
        │                        # Categories, Reports, Settings, Family,
        │                        # admin/, auth/
        ├── store/               # authStore (Zustand + persist)
        └── utils/               # formatCurrency, formatDate
```

---

## Setup local

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 20+ (solo si se corre sin Docker)

### 1. Clonar e iniciar

```bash
git clone https://github.com/TU_USUARIO/financeapp.git
# TODO: reemplazar con URL real del repositorio
cd financeapp
```

### 2. Variables de entorno del backend

```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores (ver sección siguiente)
```

### 3. Levantar con Docker

```bash
docker-compose up -d

# Esperar ~10 segundos y correr la migración inicial
docker-compose exec backend npm run db:migrate:dev
docker-compose exec backend npm run db:seed
```

### 4. Acceder

| Servicio     | URL                        | Credenciales              |
|-------------|----------------------------|---------------------------|
| Frontend    | http://localhost:5173       | —                         |
| Backend API | http://localhost:3000/api   | —                         |
| pgAdmin     | http://localhost:5050       | admin@financeapp.com / admin123 |
| Prisma Studio | `npm run db:studio`      | —                         |

---

## Variables de entorno

### `backend/.env`

```env
# Base de datos
DATABASE_URL=postgresql://financeapp:financeapp123@postgres:5432/financeapp_dev

# JWT — generar con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<tu_secret_aqui>
JWT_REFRESH_SECRET=<tu_refresh_secret_aqui>

# Servidor
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (Nodemailer) — opcional en desarrollo
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=tu_app_password
EMAIL_FROM="FinanceApp <noreply@financeapp.com>"
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Comandos útiles

```bash
# Logs del backend en tiempo real
docker-compose logs -f backend

# Entrar al contenedor backend (para Prisma CLI, etc.)
docker-compose exec backend sh

# Crear nueva migración después de cambiar el schema
docker-compose exec backend npm run db:migrate:dev

# Resetear la base de datos (¡borra todos los datos!)
docker-compose exec backend npx prisma migrate reset

# Abrir Prisma Studio (GUI de la base de datos)
docker-compose exec backend npm run db:studio

# Build del frontend
cd frontend && npm run build
```

---

## Deploy a producción

### Backend → Railway

1. Crear nuevo proyecto en [Railway](https://railway.app)
2. Agregar servicio **PostgreSQL** → copiar `DATABASE_URL`
3. Conectar el repositorio → configurar **Root Directory**: `backend/`
4. Agregar variables de entorno en Railway dashboard (todas las de `backend/.env`)
5. Cambiar `NODE_ENV=production` y `FRONTEND_URL=https://tu-app.vercel.app`
6. Railway usa `backend/Dockerfile` automáticamente
7. Post-deploy en Railway console:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### Frontend → Vercel

1. Importar repositorio en [Vercel](https://vercel.com)
2. **Root Directory**: `frontend/`
3. **Framework**: Vite (auto-detectado)
4. Agregar variable de entorno:
   ```
   VITE_API_URL=https://tu-backend.railway.app/api
   ```
5. Deploy automático en cada push a `main`

---

## API — Referencia rápida

**Base URL:** `https://tu-backend.railway.app/api`
<!-- TODO: Reemplazar con URL real -->

**Autenticación:** `Authorization: Bearer <accessToken>`

**Respuesta estándar:**
```json
{ "success": true,  "data": {} }
{ "success": false, "error": "Mensaje de error" }
```

| Módulo        | Endpoints principales |
|--------------|----------------------|
| Auth         | `POST /auth/login` · `POST /auth/register` · `POST /auth/refresh` · `GET /auth/me` |
| Cuentas      | `GET/POST /accounts` · `PUT/DELETE /accounts/:id` · `PUT /accounts/:id/goal` |
| Transacciones | `GET/POST /transactions` · `PUT/DELETE /transactions/:id` |
| Transferencias | `POST /transfers` · `GET /transfers` |
| Categorías   | `GET/POST /categories` · `PUT/DELETE /categories/:id` |
| Presupuestos | `GET/POST /budgets` · `PUT/DELETE /budgets/:id` |
| Reportes     | `GET /reports/monthly` · `GET /reports/by-category` · `GET /reports/export-pdf` · `GET /reports/export-csv` |
| Búsqueda     | `GET /search?q=texto` |
| Familia      | `GET/POST/PUT/DELETE /family` · `POST /family/invite` · `POST /family/join/:token` · `GET /family/dashboard` · `PUT /family/budgets` · `POST /family/goals` · `POST /family/goals/:id/contribute` |
| Admin        | `GET /admin/stats` · `GET /admin/users` · `GET /admin/config` |

---

## Licencia

MIT © 2026 — [Tu Nombre](https://github.com/TU_USUARIO)
<!-- TODO: Reemplazar con nombre real y URL de GitHub -->
