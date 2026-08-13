const prisma  = require('../config/prisma');
const { sendFamilyInvitation } = require('../services/email.service');

const MAX_MEMBERS = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMyFamily(userId) {
  const member = await prisma.familyMember.findUnique({
    where: { userId },
    include: {
      family: {
        include: {
          admin:   { select: { id: true, name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { joinedAt: 'asc' },
          },
          invitations: {
            where: { status: 'PENDING', expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
  return member?.family ?? null;
}

async function upgradePlan(tx, userId) {
  await tx.subscription.upsert({
    where:  { userId },
    update: { plan: 'FAMILY', status: 'ACTIVE' },
    create: { userId, plan: 'FAMILY', status: 'ACTIVE' },
  });
}

async function downgradePlan(tx, userId) {
  await tx.subscription.upsert({
    where:  { userId },
    update: { plan: 'FREE', status: 'ACTIVE' },
    create: { userId, plan: 'FREE', status: 'ACTIVE' },
  });
}

// ── Family CRUD ───────────────────────────────────────────────────────────────

exports.createFamily = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const existing = await getMyFamily(userId);
    if (existing) return res.status(400).json({ success: false, error: 'Ya perteneces a una familia.' });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'El nombre de la familia es requerido.' });

    const family = await prisma.$transaction(async (tx) => {
      const f = await tx.family.create({ data: { name: name.trim(), adminId: userId } });
      await tx.familyMember.create({ data: { familyId: f.id, userId, role: 'ADMIN' } });
      await upgradePlan(tx, userId);
      return f;
    });

    res.status(201).json({ success: true, data: family });
  } catch (err) { next(err); }
};

exports.getFamily = async (req, res, next) => {
  try {
    const family = await getMyFamily(req.user.id);
    if (!family) return res.status(404).json({ success: false, error: 'No perteneces a ninguna familia.' });
    res.json({ success: true, data: family });
  } catch (err) { next(err); }
};

exports.updateFamily = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const family = await prisma.family.findUnique({ where: { adminId: userId } });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede editar la familia.' });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'El nombre es requerido.' });
    const updated = await prisma.family.update({ where: { id: family.id }, data: { name: name.trim() } });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteFamily = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const family  = await prisma.family.findUnique({
      where:   { adminId },
      include: { members: true },
    });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede eliminar la familia.' });

    const memberIds = family.members.map((m) => m.userId);

    await prisma.$transaction(async (tx) => {
      await tx.family.delete({ where: { id: family.id } });
      // Downgrade todos los miembros a FREE
      await Promise.all(memberIds.map((uid) => downgradePlan(tx, uid)));
    });

    res.json({ success: true, message: 'Familia eliminada.' });
  } catch (err) { next(err); }
};

// ── Invitations ───────────────────────────────────────────────────────────────

exports.inviteMember = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ success: false, error: 'El email es requerido.' });

    const family = await prisma.family.findUnique({
      where:   { adminId: userId },
      include: {
        members:     true,
        invitations: { where: { status: 'PENDING', expiresAt: { gt: new Date() } } },
      },
    });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede invitar miembros.' });

    if (family.members.length >= MAX_MEMBERS) {
      return res.status(400).json({ success: false, error: `El plan Family permite un máximo de ${MAX_MEMBERS} miembros.` });
    }

    // Si el email ya existe como usuario, verificar que no sea ya miembro
    const targetUser = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (targetUser) {
      const isMember = family.members.some((m) => m.userId === targetUser.id);
      if (isMember) return res.status(400).json({ success: false, error: 'Este usuario ya es miembro de la familia.' });
    }

    const dupInvite = family.invitations.find((i) => i.email === email.trim());
    if (dupInvite) return res.status(400).json({ success: false, error: 'Ya existe una invitación pendiente para este email.' });

    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await prisma.familyInvitation.create({
      data: { familyId: family.id, email: email.trim(), expiresAt },
    });

    const admin = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await sendFamilyInvitation(email.trim(), admin?.name || 'Un usuario', family.name, invitation.token)
      .catch(() => {});

    res.status(201).json({ success: true, data: invitation, message: 'Invitación enviada correctamente.' });
  } catch (err) { next(err); }
};

exports.acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const userId    = req.user.id;

    const invitation = await prisma.familyInvitation.findUnique({
      where:   { token },
      include: { family: true },
    });

    if (!invitation) return res.status(404).json({ success: false, error: 'Invitación no encontrada.' });
    if (invitation.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Esta invitación ya fue usada.' });
    if (invitation.expiresAt < new Date()) {
      await prisma.familyInvitation.update({ where: { token }, data: { status: 'EXPIRED' } });
      return res.status(400).json({ success: false, error: 'Esta invitación ha expirado.' });
    }
    if (invitation.email.trim().toLowerCase() !== req.user.email.trim().toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Esta invitación fue enviada a otro email. Inicia sesión con la cuenta invitada.' });
    }

    const existingMember = await prisma.familyMember.findUnique({ where: { userId } });
    if (existingMember) return res.status(400).json({ success: false, error: 'Ya perteneces a una familia.' });

    const memberCount = await prisma.familyMember.count({ where: { familyId: invitation.familyId } });
    if (memberCount >= MAX_MEMBERS) {
      return res.status(400).json({ success: false, error: 'La familia ya alcanzó el límite de miembros.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.familyMember.create({ data: { familyId: invitation.familyId, userId, role: 'MEMBER' } });
      await tx.familyInvitation.update({ where: { token }, data: { status: 'ACCEPTED' } });
      await upgradePlan(tx, userId);
    });

    res.json({ success: true, message: `¡Bienvenido a la familia ${invitation.family.name}!` });
  } catch (err) { next(err); }
};

exports.cancelInvitation = async (req, res, next) => {
  try {
    const adminId      = req.user.id;
    const { inviteId } = req.params;
    const family = await prisma.family.findUnique({ where: { adminId } });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede cancelar invitaciones.' });

    await prisma.familyInvitation.updateMany({
      where: { id: inviteId, familyId: family.id },
      data:  { status: 'REJECTED' },
    });
    res.json({ success: true, message: 'Invitación cancelada.' });
  } catch (err) { next(err); }
};

// ── Members ───────────────────────────────────────────────────────────────────

exports.removeMember = async (req, res, next) => {
  try {
    const adminId      = req.user.id;
    const { memberId } = req.params;

    const family = await prisma.family.findUnique({ where: { adminId } });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede eliminar miembros.' });

    const member = await prisma.familyMember.findFirst({ where: { familyId: family.id, userId: memberId } });
    if (!member) return res.status(404).json({ success: false, error: 'Miembro no encontrado.' });
    if (member.role === 'ADMIN') return res.status(400).json({ success: false, error: 'No puedes eliminarte a ti mismo como administrador.' });

    await prisma.$transaction(async (tx) => {
      await tx.familyMember.delete({ where: { id: member.id } });
      await downgradePlan(tx, memberId);
    });

    res.json({ success: true, message: 'Miembro eliminado de la familia.' });
  } catch (err) { next(err); }
};

exports.leaveFamily = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const member = await prisma.familyMember.findUnique({ where: { userId } });
    if (!member) return res.status(404).json({ success: false, error: 'No perteneces a ninguna familia.' });
    if (member.role === 'ADMIN') return res.status(400).json({ success: false, error: 'El administrador no puede abandonar la familia. Elimínala o transfiere el rol.' });

    await prisma.$transaction(async (tx) => {
      await tx.familyMember.delete({ where: { userId } });
      await downgradePlan(tx, userId);
    });

    res.json({ success: true, message: 'Has abandonado la familia.' });
  } catch (err) { next(err); }
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.getFamilyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const member = await prisma.familyMember.findUnique({ where: { userId } });
    if (!member) return res.status(404).json({ success: false, error: 'No perteneces a ninguna familia.' });

    const family = await prisma.family.findUnique({
      where:   { id: member.familyId },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const memberStats = await Promise.all(
      family.members.map(async (m) => {
        const [accounts, incomeAgg, expenseAgg, topCategories] = await Promise.all([
          prisma.account.findMany({
            where:  { userId: m.userId },
            select: { name: true, type: true, balance: true },
          }),
          prisma.transaction.aggregate({
            where: { userId: m.userId, type: 'INGRESO', isTransfer: false, date: { gte: start, lte: end } },
            _sum:  { amount: true },
          }),
          prisma.transaction.aggregate({
            where: { userId: m.userId, type: 'EGRESO', isTransfer: false, date: { gte: start, lte: end } },
            _sum:  { amount: true },
          }),
          // Top categorías de gasto este mes
          prisma.transaction.groupBy({
            by:      ['categoryId'],
            where:   { userId: m.userId, type: 'EGRESO', isTransfer: false, date: { gte: start, lte: end }, categoryId: { not: null } },
            _sum:    { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take:    5,
          }),
        ]);

        // Enriquecer categorías con nombre e icono
        const categoryIds = topCategories.map((c) => c.categoryId).filter(Boolean);
        const categories  = categoryIds.length
          ? await prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true, icon: true, color: true } })
          : [];
        const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

        const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
        const income       = Number(incomeAgg._sum.amount  || 0);
        const expense      = Number(expenseAgg._sum.amount || 0);

        return {
          userId:       m.userId,
          name:         m.user.name,
          email:        m.user.email,
          role:         m.role,
          totalBalance,
          income,
          expense,
          net:          income - expense,
          accounts,
          topCategories: topCategories.map((c) => ({
            ...catMap[c.categoryId],
            amount: Number(c._sum.amount || 0),
          })),
        };
      })
    );

    const consolidated = {
      totalBalance: memberStats.reduce((s, m) => s + m.totalBalance, 0),
      income:       memberStats.reduce((s, m) => s + m.income,       0),
      expense:      memberStats.reduce((s, m) => s + m.expense,      0),
      net:          memberStats.reduce((s, m) => s + m.net,          0),
    };

    // Presupuestos familiares del mes actual con gasto real
    const [familyBudgets, familyGoals] = await Promise.all([
      prisma.familyBudget.findMany({
        where:   { familyId: family.id, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
      prisma.familySavingGoal.findMany({ where: { familyId: family.id }, orderBy: { createdAt: 'asc' } }),
    ]);

    // Gasto real por categoría de todos los miembros para los presupuestos familiares
    const budgetCategoryIds = familyBudgets.map((b) => b.categoryId);
    const allMemberIds      = family.members.map((m) => m.userId);

    const realSpending = budgetCategoryIds.length
      ? await prisma.transaction.groupBy({
          by:      ['categoryId'],
          where:   { userId: { in: allMemberIds }, type: 'EGRESO', isTransfer: false, categoryId: { in: budgetCategoryIds }, date: { gte: start, lte: end } },
          _sum:    { amount: true },
        })
      : [];
    const spendMap = Object.fromEntries(realSpending.map((r) => [r.categoryId, Number(r._sum.amount || 0)]));

    const budgetsWithSpending = familyBudgets.map((b) => ({
      ...b,
      amount:  Number(b.amount),
      spent:   spendMap[b.categoryId] || 0,
    }));

    res.json({
      success: true,
      data: {
        family:       { id: family.id, name: family.name },
        consolidated,
        members:      memberStats,
        budgets:      budgetsWithSpending,
        goals:        familyGoals.map((g) => ({ ...g, targetAmount: Number(g.targetAmount), currentAmount: Number(g.currentAmount) })),
      },
    });
  } catch (err) { next(err); }
};

// ── Family Budgets ────────────────────────────────────────────────────────────

exports.upsertFamilyBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const family = await prisma.family.findUnique({ where: { adminId: userId } });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede gestionar presupuestos familiares.' });

    const { categoryId, amount, month, year } = req.body;
    if (!categoryId || !amount || !month || !year) {
      return res.status(400).json({ success: false, error: 'categoryId, amount, month y year son requeridos.' });
    }

    const budget = await prisma.familyBudget.upsert({
      where:  { familyId_categoryId_month_year: { familyId: family.id, categoryId, month: Number(month), year: Number(year) } },
      update: { amount: Number(amount) },
      create: { familyId: family.id, categoryId, amount: Number(amount), month: Number(month), year: Number(year) },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

    res.json({ success: true, data: { ...budget, amount: Number(budget.amount) } });
  } catch (err) { next(err); }
};

exports.deleteFamilyBudget = async (req, res, next) => {
  try {
    const userId     = req.user.id;
    const { budgetId } = req.params;
    const family     = await prisma.family.findUnique({ where: { adminId: userId } });
    if (!family) return res.status(403).json({ success: false, error: 'Solo el administrador puede eliminar presupuestos familiares.' });

    await prisma.familyBudget.deleteMany({ where: { id: budgetId, familyId: family.id } });
    res.json({ success: true, message: 'Presupuesto eliminado.' });
  } catch (err) { next(err); }
};

// ── Family Goals ──────────────────────────────────────────────────────────────

exports.createFamilyGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const member = await prisma.familyMember.findUnique({ where: { userId } });
    if (!member) return res.status(403).json({ success: false, error: 'No perteneces a ninguna familia.' });
    if (member.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Solo el administrador puede crear metas familiares.' });

    const { name, targetAmount, deadline, emoji } = req.body;
    if (!name?.trim() || !targetAmount) {
      return res.status(400).json({ success: false, error: 'Nombre y monto objetivo son requeridos.' });
    }

    const goal = await prisma.familySavingGoal.create({
      data: {
        familyId:     member.familyId,
        name:         name.trim(),
        targetAmount: Number(targetAmount),
        deadline:     deadline ? new Date(deadline) : null,
        emoji:        emoji || '🎯',
      },
    });

    res.status(201).json({ success: true, data: { ...goal, targetAmount: Number(goal.targetAmount), currentAmount: Number(goal.currentAmount) } });
  } catch (err) { next(err); }
};

exports.updateFamilyGoal = async (req, res, next) => {
  try {
    const userId    = req.user.id;
    const { goalId } = req.params;
    const member    = await prisma.familyMember.findUnique({ where: { userId } });
    if (!member || member.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Solo el administrador puede editar metas familiares.' });

    const { name, targetAmount, currentAmount, deadline, emoji } = req.body;
    await prisma.familySavingGoal.updateMany({
      where: { id: goalId, familyId: member.familyId },
      data: {
        ...(name          !== undefined && { name: name.trim() }),
        ...(targetAmount  !== undefined && { targetAmount:  Number(targetAmount)  }),
        ...(currentAmount !== undefined && { currentAmount: Number(currentAmount) }),
        ...(deadline      !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(emoji         !== undefined && { emoji }),
      },
    });

    const updated = await prisma.familySavingGoal.findUnique({ where: { id: goalId } });
    res.json({ success: true, data: { ...updated, targetAmount: Number(updated.targetAmount), currentAmount: Number(updated.currentAmount) } });
  } catch (err) { next(err); }
};

exports.deleteFamilyGoal = async (req, res, next) => {
  try {
    const userId     = req.user.id;
    const { goalId } = req.params;
    const member     = await prisma.familyMember.findUnique({ where: { userId } });
    if (!member || member.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Solo el administrador puede eliminar metas familiares.' });

    await prisma.familySavingGoal.deleteMany({ where: { id: goalId, familyId: member.familyId } });
    res.json({ success: true, message: 'Meta eliminada.' });
  } catch (err) { next(err); }
};

exports.contributeToGoal = async (req, res, next) => {
  try {
    const userId     = req.user.id;
    const { goalId } = req.params;
    const { amount, accountId, createTransaction } = req.body;

    const val = Number(amount);
    if (!val || val <= 0) return res.status(400).json({ success: false, error: 'El monto debe ser mayor a 0.' });

    // Verificar que el usuario pertenece a la familia que tiene esta meta
    const member = await prisma.familyMember.findUnique({ where: { userId } });
    if (!member) return res.status(403).json({ success: false, error: 'No perteneces a ninguna familia.' });

    const goal = await prisma.familySavingGoal.findFirst({ where: { id: goalId, familyId: member.familyId } });
    if (!goal) return res.status(404).json({ success: false, error: 'Meta no encontrada.' });

    const newAmount = Math.min(Number(goal.currentAmount) + val, Number(goal.targetAmount));

    await prisma.$transaction(async (tx) => {
      // Actualizar progreso de la meta
      await tx.familySavingGoal.update({
        where: { id: goalId },
        data:  { currentAmount: newAmount },
      });

      // Crear transacción real si se solicitó
      if (createTransaction && accountId) {
        const account = await tx.account.findFirst({ where: { id: accountId, userId } });
        if (!account) throw new Error('Cuenta no encontrada.');
        if (Number(account.balance) < val) throw new Error('Saldo insuficiente en la cuenta seleccionada.');

        await tx.transaction.create({
          data: {
            userId,
            accountId,
            type:        'EGRESO',
            amount:      val,
            description: `Aporte meta familiar: ${goal.name}`,
            date:        new Date(),
            tags:        ['meta-familiar'],
          },
        });

        await tx.account.update({
          where: { id: accountId },
          data:  { balance: { decrement: val } },
        });
      }
    });

    const updated = await prisma.familySavingGoal.findUnique({ where: { id: goalId } });
    res.json({
      success: true,
      data: { ...updated, targetAmount: Number(updated.targetAmount), currentAmount: Number(updated.currentAmount) },
      message: createTransaction ? 'Aporte registrado y transacción creada.' : 'Aporte registrado.',
    });
  } catch (err) {
    if (err.message === 'Saldo insuficiente en la cuenta seleccionada.' || err.message === 'Cuenta no encontrada.') {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  }
};
