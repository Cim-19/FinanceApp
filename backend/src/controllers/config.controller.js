const prisma = require('../config/prisma');

const PUBLIC_KEYS = ['culqi_public_key', 'price_pro', 'price_family'];

exports.getPublicConfig = async (req, res, next) => {
  try {
    const rows = await prisma.systemConfig.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    });
    const config = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
};
