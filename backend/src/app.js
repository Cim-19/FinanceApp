require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middlewares/errorHandler');

// Routes
const authRoutes         = require('./routes/auth.routes');
const usersRoutes        = require('./routes/users.routes');
const accountsRoutes     = require('./routes/accounts.routes');
const transactionsRoutes = require('./routes/transactions.routes');
const categoriesRoutes   = require('./routes/categories.routes');
const budgetsRoutes      = require('./routes/budgets.routes');
const reportsRoutes      = require('./routes/reports.routes');
const transfersRoutes    = require('./routes/transfers.routes');
const adminRoutes        = require('./routes/admin.routes');
const recurringRoutes    = require('./routes/recurring.routes');
const configRoutes       = require('./routes/config.routes');
const paymentsRoutes     = require('./routes/payments.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const searchRoutes        = require('./routes/search.routes');
const familyRoutes        = require('./routes/family.routes');
const pushRoutes          = require('./routes/push.routes');
const { startRecurringJob }  = require('./services/recurring.service');
const { startSubscriptionJob } = require('./services/subscription.service');
const { startPushCrons }     = require('./services/push.cron');

const app = express();

// ── Seguridad y parsers ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(cookieParser());

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        usersRoutes);
app.use('/api/accounts',     accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories',   categoriesRoutes);
app.use('/api/budgets',      budgetsRoutes);
app.use('/api/reports',      reportsRoutes);
app.use('/api/transfers',    transfersRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/recurring',      recurringRoutes);
app.use('/api/config',         configRoutes);
app.use('/api/payments',       paymentsRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/search',         searchRoutes);
app.use('/api/family',         familyRoutes);
app.use('/api/push',           pushRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// ── Error handler (debe ir al final) ─────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡  API: http://localhost:${PORT}/api`);
  startRecurringJob();
  startSubscriptionJob();
  startPushCrons();
});

module.exports = app;
