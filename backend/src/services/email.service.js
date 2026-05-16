const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || `"FinanceApp" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

exports.sendPasswordReset = async (toEmail, toName, token) => {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: '🔐 Recupera tu contraseña — FinanceApp',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:36px 40px;text-align:center">
            <div style="font-size:48px;margin-bottom:12px">🐷</div>
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">FinanceApp</h1>
            <p style="color:#c4b5fd;margin:6px 0 0;font-size:14px">Tu dinero, seguro</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 12px">
              Hola, ${toName.split(' ')[0]} 👋
            </h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 24px">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Haz clic en el botón para crear una nueva contraseña.
            </p>

            <div style="text-align:center;margin:28px 0">
              <a href="${resetUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);
                color:#fff;text-decoration:none;font-size:15px;font-weight:700;
                padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(124,58,237,0.4)">
                🔐 Restablecer contraseña
              </a>
            </div>

            <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0 0 8px">
              ⏰ Este enlace expira en <strong>1 hora</strong>.
            </p>
            <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0">
              Si no solicitaste este cambio, ignora este correo. Tu contraseña no cambiará.
            </p>

            <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0">

            <p style="color:#cbd5e1;font-size:12px;margin:0;word-break:break-all">
              O copia este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color:#7c3aed">${resetUrl}</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #f1f5f9">
            <p style="color:#94a3b8;font-size:12px;margin:0">
              © ${new Date().getFullYear()} FinanceApp · Hecho con ❤️ en Perú
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

exports.sendWelcome = async (toEmail, toName) => {
  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: '🎉 ¡Bienvenido a FinanceApp!',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#10b981,#059669);padding:36px 40px;text-align:center">
            <div style="font-size:48px;margin-bottom:12px">🐷</div>
            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800">¡Bienvenido!</h1>
            <p style="color:#a7f3d0;margin:6px 0 0;font-size:14px">Tu cuenta está lista</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 12px">
              Hola, ${toName.split(' ')[0]} 👋
            </h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 16px">
              Tu cuenta en FinanceApp ha sido creada exitosamente.
              Ya puedes empezar a gestionar tus finanzas personales.
            </p>
            <ul style="color:#64748b;font-size:14px;line-height:2;padding-left:20px">
              <li>💳 Agrega tus cuentas bancarias</li>
              <li>📝 Registra ingresos y gastos</li>
              <li>🎯 Define presupuestos mensuales</li>
              <li>📊 Analiza tus reportes</li>
            </ul>
            <div style="text-align:center;margin:28px 0">
              <a href="${APP_URL}/dashboard"
                style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);
                color:#fff;text-decoration:none;font-size:15px;font-weight:700;
                padding:14px 36px;border-radius:12px">
                🚀 Ir al dashboard
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #f1f5f9">
            <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} FinanceApp</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

exports.sendBudgetExceeded = async (toEmail, toName, categoryName, spent, limit) => {
  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `⚠️ Presupuesto superado — ${categoryName}`,
    html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:36px 40px;text-align:center">
            <div style="font-size:48px;margin-bottom:12px">⚠️</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Presupuesto superado</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Hola, ${toName.split(' ')[0]} 👋</h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 20px">
              Has superado tu presupuesto de <strong>${categoryName}</strong> este mes.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;padding:16px 20px;margin-bottom:20px">
              <tr>
                <td style="color:#64748b;font-size:14px">Gastado:</td>
                <td style="color:#dc2626;font-weight:700;font-size:16px;text-align:right">S/. ${Number(spent).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:14px;padding-top:8px">Presupuesto:</td>
                <td style="color:#1e293b;font-weight:700;font-size:16px;text-align:right;padding-top:8px">S/. ${Number(limit).toFixed(2)}</td>
              </tr>
            </table>
            <div style="text-align:center">
              <a href="${APP_URL}/budgets" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:12px">
                Ver presupuestos
              </a>
            </div>
          </td>
        </tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #f1f5f9">
          <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} FinanceApp</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  });
};

exports.sendSubscriptionExpiring = async (toEmail, toName, planName, renewalDate) => {
  const dateStr = new Date(renewalDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: `🔔 Tu plan ${planName} se renueva en 3 días`,
    html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:36px 40px;text-align:center">
            <div style="font-size:48px;margin-bottom:12px">🔔</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800">Renovación próxima</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <h2 style="color:#1e293b;font-size:18px;font-weight:700;margin:0 0 12px">Hola, ${toName.split(' ')[0]} 👋</h2>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 20px">
              Tu plan <strong>${planName}</strong> se renovará automáticamente el <strong>${dateStr}</strong>.
              Se realizará el cobro correspondiente en esa fecha.
            </p>
            <div style="background:#f5f3ff;border-radius:12px;padding:16px 20px;margin-bottom:20px;border-left:4px solid #7c3aed">
              <p style="margin:0;color:#5b21b6;font-size:14px;font-weight:600">📅 Fecha de cobro: ${dateStr}</p>
            </div>
            <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0">
              Si deseas cancelar tu suscripción antes de esa fecha, puedes hacerlo desde tu configuración.
            </p>
          </td>
        </tr>
        <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #f1f5f9">
          <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} FinanceApp</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  });
};

exports.sendFamilyInvitation = async (toEmail, adminName, familyName, token) => {
  const acceptUrl = `${APP_URL}/family/join/${token}`;
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `🏠 ${adminName} te invitó a la familia "${familyName}" — FinanceApp`,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
      <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">🏠</div>
        <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800">Invitación familiar</h1>
      </td></tr>
      <tr><td style="padding:32px 40px">
        <p style="color:#374151;font-size:15px;margin:0 0 16px">Hola,</p>
        <p style="color:#374151;font-size:15px;margin:0 0 24px">
          <strong>${adminName}</strong> te ha invitado a unirte a la familia <strong>"${familyName}"</strong> en FinanceApp.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px">
            ✅ Aceptar invitación
          </a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">Expira en 7 días.</p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #f1f5f9">
        <p style="color:#94a3b8;font-size:12px;margin:0">© FinanceApp</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
  });
};
