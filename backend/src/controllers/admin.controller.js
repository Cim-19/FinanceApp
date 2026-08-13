const prisma = require('../config/prisma');

// ── Stats globales ────────────────────────────────────────────────────────────

exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      planBreakdown,
      totalTransactions,
      totalAccounts,
      totalBudgets,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true  } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.subscription.groupBy({ by: ['plan'], _count: true }),
      prisma.transaction.count(),
      prisma.account.count(),
      prisma.budget.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const plans = { FREE: 0, PRO: 0, FAMILY: 0 };
    planBreakdown.forEach((p) => { plans[p.plan] = p._count; });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        bannedUsers,
        newUsersThisMonth,
        totalTransactions,
        totalAccounts,
        totalBudgets,
        plans,
      },
    });
  } catch (err) { next(err); }
};

// ── Lista de usuarios ─────────────────────────────────────────────────────────

exports.listUsers = async (req, res, next) => {
  try {
    const { search = '', plan, isActive, page = 1, limit = 20 } = req.query;

    const where = {
      ...(search && {
        OR: [
          { name:  { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(plan && { subscription: { plan } }),
    };

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, createdAt: true, currency: true,
          subscription: { select: { plan: true, status: true } },
          _count: { select: { accounts: true, transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
};

// ── Detalle de usuario ────────────────────────────────────────────────────────

exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, currency: true, createdAt: true,
        subscription: true,
        _count: { select: { accounts: true, transactions: true, budgets: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    // Últimas 5 transacciones
    const recentTransactions = await prisma.transaction.findMany({
      where:   { userId: req.params.id },
      orderBy: { date: 'desc' },
      take: 5,
      select: { id: true, type: true, amount: true, description: true, date: true },
    });

    res.json({ success: true, data: { ...user, recentTransactions } });
  } catch (err) { next(err); }
};

// ── Cambiar plan ──────────────────────────────────────────────────────────────

exports.updatePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const validPlans = ['FREE', 'PRO', 'FAMILY'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, error: 'Plan inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    const subscription = await prisma.subscription.upsert({
      where:  { userId: req.params.id },
      update: { plan, status: 'ACTIVE' },
      create: { userId: req.params.id, plan, status: 'ACTIVE' },
    });

    res.json({ success: true, data: subscription });
  } catch (err) { next(err); }
};

// ── Activar / Desactivar usuario ──────────────────────────────────────────────

exports.toggleActive = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'No puedes desactivar tu propia cuenta' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { isActive: true, role: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    if (user.role === 'ADMIN') {
      return res.status(400).json({ success: false, error: 'No puedes desactivar a otro administrador' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data:  { isActive: !user.isActive },
      select: { id: true, isActive: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ── Promover / degradar a admin ───────────────────────────────────────────────

exports.updateRole = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'No puedes modificar tu propio rol' });
    }

    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Rol inválido' });
    }

    const updated = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { role },
      select: { id: true, role: true },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

// ── Test notification ─────────────────────────────────────────────────────────

exports.testNotification = async (req, res, next) => {
  try {
    const { createNotification } = require('../services/notifications.service');
    const types = ['BUDGET_WARNING', 'BUDGET_EXCEEDED', 'RECURRING_EXECUTED', 'SUBSCRIPTION_EXPIRING', 'WELCOME'];
    const type  = types[Math.floor(Math.random() * types.length)];

    const MESSAGES = {
      BUDGET_WARNING:        { title: 'Presupuesto al 85% — Alimentación', body: 'Has gastado S/. 85.00 de S/. 100.00 en Alimentación este mes.' },
      BUDGET_EXCEEDED:       { title: 'Presupuesto superado — Transporte',  body: 'Has gastado S/. 120.00 de S/. 100.00 en Transporte este mes.' },
      RECURRING_EXECUTED:    { title: 'Transacción recurrente ejecutada',   body: 'Se registró "Alquiler" por S/. 800.00.' },
      SUBSCRIPTION_EXPIRING: { title: 'Tu plan Pro se renueva en 3 días',   body: 'El cobro se realizará el 15 de junio de 2026.' },
      WELCOME:               { title: '¡Bienvenido a FinanceApp!',          body: 'Tu cuenta está lista. Empieza a gestionar tus finanzas.' },
    };

    const notif = await createNotification(req.user.id, {
      type,
      title: MESSAGES[type].title,
      body:  MESSAGES[type].body,
      link:  '/dashboard',
    });

    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

// ── Config del sistema ────────────────────────────────────────────────────────

const CONFIG_KEYS = ['culqi_public_key', 'culqi_private_key', 'price_pro', 'price_family'];
const SECRET_KEYS = ['culqi_private_key'];
const MASK_PREFIX = '••••••••';

function maskSecret(value) {
  if (!value) return '';
  return `${MASK_PREFIX}${value.slice(-4)}`;
}

// Nunca se devuelve el valor real de una llave secreta al cliente — solo un
// placeholder enmascarado. setConfig ignora ese placeholder si vuelve sin cambios,
// para no pisar el secreto real con la máscara.
exports.getConfig = async (req, res, next) => {
  try {
    const rows = await prisma.systemConfig.findMany({
      where: { key: { in: CONFIG_KEYS } },
    });
    const config = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    for (const key of SECRET_KEYS) {
      if (config[key]) config[key] = maskSecret(config[key]);
    }
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
};

exports.setConfig = async (req, res, next) => {
  try {
    const allowed = Object.entries(req.body).filter(([k]) => CONFIG_KEYS.includes(k));
    if (!allowed.length) {
      return res.status(400).json({ success: false, error: 'Sin campos válidos' });
    }

    const toSave = allowed.filter(([key, value]) => {
      if (SECRET_KEYS.includes(key) && typeof value === 'string' && value.startsWith(MASK_PREFIX)) {
        return false;
      }
      return true;
    });

    if (toSave.length) {
      await Promise.all(
        toSave.map(([key, value]) =>
          prisma.systemConfig.upsert({
            where:  { key },
            create: { key, value: String(value) },
            update: { value: String(value) },
          })
        )
      );
    }

    res.json({ success: true, message: 'Configuración guardada' });
  } catch (err) { next(err); }
};
