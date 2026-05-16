const prisma = require('../config/prisma');

async function getConfig(key) {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  return row?.value || null;
}

const PLAN_KEYS = { PRO: 'price_pro', FAMILY: 'price_family' };
const PLAN_LABEL = { PRO: 'FinanceApp Pro', FAMILY: 'FinanceApp Family' };

exports.createCharge = async (req, res, next) => {
  try {
    const { token, plan } = req.body;
    if (!token || !plan) {
      return res.status(400).json({ success: false, error: 'Token y plan son requeridos' });
    }
    if (!PLAN_KEYS[plan]) {
      return res.status(400).json({ success: false, error: 'Plan inválido' });
    }

    const [privateKey, priceStr] = await Promise.all([
      getConfig('culqi_private_key'),
      getConfig(PLAN_KEYS[plan]),
    ]);

    if (!privateKey) {
      return res.status(503).json({ success: false, error: 'Pagos no configurados. Contacta al administrador.' });
    }

    const amount = parseInt(priceStr || '0', 10);
    if (!amount) {
      return res.status(503).json({ success: false, error: 'Precio del plan no configurado.' });
    }

    // Llamada a Culqi API
    const culqiRes = await fetch('https://api.culqi.com/v2/charges', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${privateKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        amount,
        currency_code: 'PEN',
        email:         req.user.email,
        source_id:     token,
        capture:       true,
        description:   PLAN_LABEL[plan],
      }),
    });

    const culqiData = await culqiRes.json();

    if (!culqiRes.ok || culqiData.object === 'error') {
      const msg = culqiData.user_message || culqiData.merchant_message || 'Error al procesar el pago';
      return res.status(402).json({ success: false, error: msg });
    }

    // Actualizar suscripción del usuario
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    await prisma.subscription.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, plan, status: 'ACTIVE', renewalDate },
      update: { plan, status: 'ACTIVE', startDate: new Date(), renewalDate },
    });

    res.json({
      success: true,
      message: `Plan ${PLAN_LABEL[plan]} activado correctamente`,
      data:    { plan, chargeId: culqiData.id },
    });
  } catch (err) { next(err); }
};
