const prisma = require('../config/prisma');

exports.getVapidPublicKey = (req, res) => {
  res.json({ success: true, data: { publicKey: process.env.VAPID_PUBLIC_KEY } });
};

exports.subscribe = async (req, res) => {
  const { endpoint, p256dh, auth } = req.body;
  const userId = req.user.id;

  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({ success: false, error: 'Datos de suscripción incompletos' });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { userId, p256dh, auth },
    create: { userId, endpoint, p256dh, auth },
  });

  res.json({ success: true, message: 'Suscripción guardada' });
};

exports.unsubscribe = async (req, res) => {
  const { endpoint } = req.body;
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
  res.json({ success: true, message: 'Suscripción eliminada' });
};
