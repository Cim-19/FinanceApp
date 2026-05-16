const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const systemCategories = [
  // ── EGRESO ──────────────────────────────────────────────────────────────
  { name: 'Alimentación',      icon: '🍔', color: '#ef4444', type: 'EGRESO' },
  { name: 'Transporte',        icon: '🚗', color: '#3b82f6', type: 'EGRESO' },
  { name: 'Vivienda',          icon: '🏠', color: '#8b5cf6', type: 'EGRESO' },
  { name: 'Salud',             icon: '💊', color: '#10b981', type: 'EGRESO' },
  { name: 'Educación',         icon: '📚', color: '#6366f1', type: 'EGRESO' },
  { name: 'Entretenimiento',   icon: '🎬', color: '#f97316', type: 'EGRESO' },
  { name: 'Ropa y calzado',    icon: '👗', color: '#ec4899', type: 'EGRESO' },
  { name: 'Tecnología',        icon: '💻', color: '#06b6d4', type: 'EGRESO' },
  { name: 'Deporte',           icon: '🏋️', color: '#eab308', type: 'EGRESO' },
  { name: 'Cuidado personal',  icon: '💆', color: '#f43f5e', type: 'EGRESO' },
  { name: 'Mascotas',          icon: '🐾', color: '#f59e0b', type: 'EGRESO' },
  { name: 'Viajes',            icon: '✈️', color: '#14b8a6', type: 'EGRESO' },
  { name: 'Restaurantes',      icon: '🍽️', color: '#e11d48', type: 'EGRESO' },
  // ── INGRESO ─────────────────────────────────────────────────────────────
  { name: 'Salario',           icon: '💼', color: '#22c55e', type: 'INGRESO' },
  { name: 'Freelance',         icon: '🖥️', color: '#0ea5e9', type: 'INGRESO' },
  { name: 'Inversiones',       icon: '📈', color: '#a855f7', type: 'INGRESO' },
  { name: 'Alquiler',          icon: '🏡', color: '#7c3aed', type: 'INGRESO' },
  // ── AMBOS ───────────────────────────────────────────────────────────────
  { name: 'Ahorro',            icon: '💰', color: '#16a34a', type: 'AMBOS'  },
  { name: 'Otros',             icon: '📦', color: '#6b7280', type: 'AMBOS'  },
];

async function main() {
  console.log('🌱  Iniciando seed...');

  for (const cat of systemCategories) {
    await prisma.category.upsert({
      where: {
        // No hay unique en (name, isSystem); usamos findFirst + create pattern
        id: `system_${cat.name.toLowerCase().replace(/\s+/g, '_')}`,
      },
      update: {},
      create: {
        id: `system_${cat.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isSystem: true,
        userId: null,
      },
    });
  }

  console.log(`✅  ${systemCategories.length} categorías del sistema creadas/actualizadas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
