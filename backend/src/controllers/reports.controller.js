const prisma  = require('../config/prisma');
const { stringify } = require('csv-stringify/sync');
const PDFDocument = require('pdfkit');

// ── Helpers ───────────────────────────────────────────────────────────────────

const monthRange = (year, month) => ({
  start: new Date(year, month - 1, 1),
  end:   new Date(year, month, 0, 23, 59, 59),
});

const baseWhere = (userId, extraFilters = {}) => ({
  userId,
  isTransfer: false,
  ...extraFilters,
});

// ── Controllers ───────────────────────────────────────────────────────────────

exports.monthly = async (req, res, next) => {
  try {
    const now   = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year  = req.query.year  ? Number(req.query.year)  : now.getFullYear();
    const { start, end } = monthRange(year, month);

    const dateFilter = { date: { gte: start, lte: end } };

    const [incomeAgg, expenseAgg, grouped] = await Promise.all([
      prisma.transaction.aggregate({
        where: baseWhere(req.user.id, { type: 'INGRESO', ...dateFilter }),
        _sum: { amount: true }, _count: true,
      }),
      prisma.transaction.aggregate({
        where: baseWhere(req.user.id, { type: 'EGRESO', ...dateFilter }),
        _sum: { amount: true }, _count: true,
      }),
      prisma.transaction.groupBy({
        by:    ['categoryId', 'type'],
        where: baseWhere(req.user.id, dateFilter),
        _sum:  { amount: true },
        _count: true,
      }),
    ]);

    const income  = Number(incomeAgg._sum.amount  || 0);
    const expense = Number(expenseAgg._sum.amount || 0);

    const catIds = [...new Set(grouped.map((r) => r.categoryId).filter(Boolean))];
    const cats   = await prisma.category.findMany({ where: { id: { in: catIds } } });
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    const categoryBreakdown = grouped.map((r) => ({
      categoryId: r.categoryId,
      category:   r.categoryId ? catMap[r.categoryId] : null,
      type:       r.type,
      total:      Number(r._sum.amount || 0),
      count:      r._count,
    }));

    res.json({
      success: true,
      data: {
        month, year, income, expense,
        net:           income - expense,
        incomeCount:   incomeAgg._count,
        expenseCount:  expenseAgg._count,
        categoryBreakdown,
      },
    });
  } catch (err) { next(err); }
};

exports.weekly = async (req, res, next) => {
  try {
    const now   = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const year  = req.query.year  ? Number(req.query.year)  : now.getFullYear();

    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks = [
      { label: 'Sem 1', from: 1,  to: 7  },
      { label: 'Sem 2', from: 8,  to: 14 },
      { label: 'Sem 3', from: 15, to: 21 },
      { label: 'Sem 4', from: 22, to: daysInMonth },
    ];

    const result = await Promise.all(weeks.map(async ({ label, from, to }) => {
      const start = new Date(year, month - 1, from);
      const end   = new Date(year, month - 1, to, 23, 59, 59);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: baseWhere(req.user.id, { type: 'INGRESO', date: { gte: start, lte: end } }),
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: baseWhere(req.user.id, { type: 'EGRESO', date: { gte: start, lte: end } }),
          _sum: { amount: true },
        }),
      ]);

      return {
        label,
        income:  Number(inc._sum.amount || 0),
        expense: Number(exp._sum.amount || 0),
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.byCategory = async (req, res, next) => {
  try {
    const { desde, hasta, type } = req.query;

    const where = baseWhere(req.user.id, {
      ...(type && { type }),
      ...((desde || hasta) && {
        date: {
          ...(desde && { gte: new Date(desde) }),
          ...(hasta && { lte: new Date(`${hasta}T23:59:59`) }),
        },
      }),
    });

    const grouped = await prisma.transaction.groupBy({
      by:      ['categoryId', 'type'],
      where,
      _sum:    { amount: true },
      _count:  true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const catIds = [...new Set(grouped.map((r) => r.categoryId).filter(Boolean))];
    const cats   = await prisma.category.findMany({ where: { id: { in: catIds } } });
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    const total = grouped.reduce((sum, r) => sum + Number(r._sum.amount || 0), 0);

    const data = grouped.map((r) => ({
      categoryId:  r.categoryId,
      category:    r.categoryId ? catMap[r.categoryId] : null,
      type:        r.type,
      total:       Number(r._sum.amount || 0),
      count:       r._count,
      percentage:  total > 0 ? +((Number(r._sum.amount || 0) / total) * 100).toFixed(2) : 0,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.balanceEvolution = async (req, res, next) => {
  try {
    const months = Math.min(Number(req.query.months || 6), 24);
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const { start, end } = monthRange(year, month);

      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({
          where: baseWhere(req.user.id, { type: 'INGRESO', date: { gte: start, lte: end } }),
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: baseWhere(req.user.id, { type: 'EGRESO', date: { gte: start, lte: end } }),
          _sum: { amount: true },
        }),
      ]);

      result.push({
        year, month,
        label:   `${year}-${String(month).padStart(2, '0')}`,
        income:  Number(inc._sum.amount || 0),
        expense: Number(exp._sum.amount || 0),
        net:     Number(inc._sum.amount || 0) - Number(exp._sum.amount || 0),
      });
    }

    let cumulative = 0;
    for (const r of result) {
      cumulative += r.net;
      r.cumulativeBalance = +cumulative.toFixed(2);
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: req.user.id,
        ...((desde || hasta) && {
          date: {
            ...(desde && { gte: new Date(desde) }),
            ...(hasta && { lte: new Date(`${hasta}T23:59:59`) }),
          },
        }),
      },
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
    });

    const rows = transactions.map((t) => ({
      Fecha:        t.date.toISOString().split('T')[0],
      Tipo:         t.type,
      Monto:        Number(t.amount),
      Descripcion:  t.description || '',
      Categoria:    t.category?.name || '',
      Cuenta:       t.account.name,
      Tags:         t.tags.join(', '),
      Transferencia: t.isTransfer ? 'Sí' : 'No',
    }));

    const csv = stringify(rows, { header: true });
    const filename = `transacciones_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM para compatibilidad con Excel
  } catch (err) { next(err); }
};

exports.exportPdf = async (req, res, next) => {
  try {
    const { desde, hasta, month, year } = req.query;
    const userId = req.user.id;

    const now        = new Date();
    const rMonth     = month ? Number(month) : now.getMonth() + 1;
    const rYear      = year  ? Number(year)  : now.getFullYear();
    const { start: mStart, end: mEnd } = monthRange(rYear, rMonth);

    const dateLabel = desde && hasta
      ? `${desde} al ${hasta}`
      : `${rMonth.toString().padStart(2,'0')}/${rYear}`;

    const txWhere = {
      userId,
      isTransfer: false,
      date: desde && hasta
        ? { gte: new Date(desde), lte: new Date(`${hasta}T23:59:59`) }
        : { gte: mStart, lte: mEnd },
    };

    const [user, transactions, accounts, incomeAgg, expenseAgg, grouped] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
      prisma.transaction.findMany({
        where: txWhere,
        include: { category: true, account: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      prisma.account.findMany({ where: { userId }, select: { name: true, type: true, balance: true } }),
      prisma.transaction.aggregate({ where: { ...txWhere, type: 'INGRESO' }, _sum: { amount: true }, _count: true }),
      prisma.transaction.aggregate({ where: { ...txWhere, type: 'EGRESO'  }, _sum: { amount: true }, _count: true }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...txWhere, type: 'EGRESO' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 8,
      }),
    ]);

    const income  = Number(incomeAgg._sum.amount  || 0);
    const expense = Number(expenseAgg._sum.amount || 0);
    const net     = income - expense;

    const catIds = grouped.map((r) => r.categoryId).filter(Boolean);
    const cats   = await prisma.category.findMany({ where: { id: { in: catIds } } });
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    const fmt = (n) => `S/. ${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    // ── PDF ──────────────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 45, size: 'A4', compress: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${dateLabel.replace(/\//g,'-')}.pdf"`);
    doc.pipe(res);

    const W      = doc.page.width  - 90; // ancho útil
    const VIOLET = '#7c3aed';
    const ROSE   = '#f43f5e';
    const EMERALD= '#10b981';
    const GRAY   = '#6b7280';
    const DARK   = '#111827';

    // ── Header ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(VIOLET);

    doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
       .text('FinanceApp', 45, 22);
    doc.fontSize(10).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
       .text('Reporte Financiero Personal', 45, 48);

    doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
       .text(user?.name || 'Usuario', doc.page.width - 200, 22, { width: 160, align: 'right' });
    doc.fontSize(9).fillColor('rgba(255,255,255,0.75)').font('Helvetica')
       .text(user?.email || '', doc.page.width - 200, 40, { width: 160, align: 'right' })
       .text(`Período: ${dateLabel}`, doc.page.width - 200, 56, { width: 160, align: 'right' })
       .text(`Generado: ${now.toLocaleDateString('es-PE')}`, doc.page.width - 200, 70, { width: 160, align: 'right' });

    let y = 110;

    // ── Sección helper ────────────────────────────────────────────────────────
    const sectionTitle = (title, icon = '') => {
      doc.fontSize(12).fillColor(VIOLET).font('Helvetica-Bold')
         .text(`${icon} ${title}`, 45, y);
      doc.moveTo(45, y + 16).lineTo(45 + W, y + 16).lineWidth(1).strokeColor('#e5e7eb').stroke();
      y += 24;
    };

    // ── KPIs ─────────────────────────────────────────────────────────────────
    sectionTitle('Resumen del período', '📊');

    const kpiW   = W / 3 - 8;
    const kpis   = [
      { label: 'Ingresos', value: fmt(income),  color: EMERALD, count: incomeAgg._count  },
      { label: 'Egresos',  value: fmt(expense), color: ROSE,    count: expenseAgg._count },
      { label: 'Neto',     value: fmt(net),      color: net >= 0 ? EMERALD : ROSE, count: null },
    ];

    kpis.forEach(({ label, value, color, count }, i) => {
      const x = 45 + i * (kpiW + 12);
      doc.roundedRect(x, y, kpiW, 60, 8).fill('#f9fafb');
      doc.fontSize(9).fillColor(GRAY).font('Helvetica').text(label, x + 10, y + 10);
      doc.fontSize(16).fillColor(color).font('Helvetica-Bold').text(value, x + 10, y + 24, { width: kpiW - 20 });
      if (count !== null) {
        doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(`${count} transacciones`, x + 10, y + 46);
      }
    });
    y += 76;

    // ── Cuentas ───────────────────────────────────────────────────────────────
    if (accounts.length > 0) {
      sectionTitle('Cuentas', '🏦');
      const TYPE_ES = { CORRIENTE: 'Corriente', AHORRO: 'Ahorro', INVERSION: 'Inversión', CREDITO: 'Crédito' };
      const colW = [W * 0.5, W * 0.25, W * 0.25];

      // Cabecera tabla
      doc.fontSize(8).fillColor(GRAY).font('Helvetica-Bold');
      ['Cuenta', 'Tipo', 'Saldo'].forEach((h, i) => {
        const x = 45 + colW.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(h, x, y, { width: colW[i], align: i === 2 ? 'right' : 'left' });
      });
      y += 14;
      doc.moveTo(45, y).lineTo(45 + W, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
      y += 5;

      accounts.forEach((a, idx) => {
        if (idx % 2 === 0) doc.rect(45, y - 2, W, 18).fill('#f9fafb');
        doc.fontSize(9).fillColor(DARK).font('Helvetica').text(a.name, 45, y, { width: colW[0] });
        doc.text(TYPE_ES[a.type] || a.type, 45 + colW[0], y, { width: colW[1] });
        doc.fillColor(Number(a.balance) >= 0 ? DARK : ROSE)
           .text(fmt(a.balance), 45 + colW[0] + colW[1], y, { width: colW[2], align: 'right' });
        y += 18;
      });
      y += 8;
    }

    // ── Top categorías ────────────────────────────────────────────────────────
    if (grouped.length > 0) {
      if (y > 620) { doc.addPage(); y = 45; }
      sectionTitle('Top gastos por categoría', '🏷️');

      const maxCat = Number(grouped[0]._sum.amount || 0);
      grouped.forEach((r) => {
        const cat     = r.categoryId ? catMap[r.categoryId] : null;
        const amount  = Number(r._sum.amount || 0);
        const barW    = maxCat > 0 ? (amount / maxCat) * (W - 130) : 0;
        const name    = cat?.name || 'Sin categoría';
        const pct     = expense > 0 ? ((amount / expense) * 100).toFixed(1) : '0';

        doc.fontSize(9).fillColor(DARK).font('Helvetica').text(name, 45, y + 2, { width: 110 });
        doc.rect(160, y + 3, barW, 10).fill(cat?.color || VIOLET);
        doc.rect(160, y + 3, W - 130, 10).fillOpacity(0.08).fill(VIOLET).fillOpacity(1);
        doc.fontSize(9).fillColor(DARK).text(fmt(amount), 45 + W - 120, y + 2, { width: 80, align: 'right' });
        doc.fontSize(8).fillColor(GRAY).text(`${pct}%`, 45 + W - 40, y + 2, { width: 40, align: 'right' });
        y += 20;
      });
      y += 6;
    }

    // ── Transacciones recientes ───────────────────────────────────────────────
    if (transactions.length > 0) {
      if (y > 560) { doc.addPage(); y = 45; }
      sectionTitle(`Transacciones recientes (últimas ${Math.min(transactions.length, 30)})`, '💸');

      const cols = [W * 0.14, W * 0.35, W * 0.22, W * 0.15, W * 0.14];
      const hdrs = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto'];

      doc.fontSize(8).fillColor(GRAY).font('Helvetica-Bold');
      hdrs.forEach((h, i) => {
        const x = 45 + cols.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(h, x, y, { width: cols[i], align: i === 4 ? 'right' : 'left' });
      });
      y += 14;
      doc.moveTo(45, y).lineTo(45 + W, y).lineWidth(0.5).strokeColor('#e5e7eb').stroke();
      y += 5;

      for (const t of transactions) {
        if (y > 760) { doc.addPage(); y = 45; }
        if (transactions.indexOf(t) % 2 === 0) doc.rect(45, y - 2, W, 16).fill('#f9fafb');

        const date = t.date.toISOString().split('T')[0];
        const desc = (t.description || t.category?.name || '—').slice(0, 32);
        const cat  = (t.category?.name || '—').slice(0, 20);
        const acc  = (t.account?.name || '—').slice(0, 18);

        doc.fontSize(8).fillColor(DARK).font('Helvetica');
        doc.text(date, 45, y, { width: cols[0] });
        doc.text(desc, 45 + cols[0], y, { width: cols[1] });
        doc.text(cat,  45 + cols[0] + cols[1], y, { width: cols[2] });
        doc.text(acc,  45 + cols[0] + cols[1] + cols[2], y, { width: cols[3] });
        doc.fillColor(t.type === 'INGRESO' ? EMERALD : ROSE)
           .text((t.type === 'INGRESO' ? '+' : '-') + fmt(t.amount),
             45 + cols[0] + cols[1] + cols[2] + cols[3], y, { width: cols[4], align: 'right' });
        y += 16;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.fontSize(8).fillColor(GRAY).font('Helvetica')
         .text(
           `FinanceApp · Reporte generado el ${now.toLocaleDateString('es-PE')} · Página ${i + 1} de ${pages.count}`,
           45, doc.page.height - 30, { width: W, align: 'center' }
         );
    }

    doc.end();
  } catch (err) { next(err); }
};
