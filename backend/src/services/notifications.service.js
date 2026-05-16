const prisma = require('../config/prisma');

async function createNotification(userId, { type, title, body, link = null }) {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
}

async function createIfNotToday(userId, { type, title, body, link = null }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.notification.findFirst({
    where: { userId, type, title, createdAt: { gte: today } },
  });
  if (existing) return null;

  return createNotification(userId, { type, title, body, link });
}

module.exports = { createNotification, createIfNotToday };
