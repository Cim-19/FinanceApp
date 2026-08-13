const { Prisma } = require('@prisma/client');

module.exports = (err, req, res, _next) => {
  console.error('[ErrorHandler]', err.message || err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Ya existe un registro con esos datos' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Registro no encontrado' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Referencia a un registro que no existe' });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ success: false, error: 'Datos inválidos para la base de datos' });
  }

  const status = err.statusCode || err.status || 500;

  // Para errores no reconocidos (500), en producción no se filtra el mensaje
  // crudo del error (puede contener detalles internos de conexión, stacks, etc.)
  const isProd = process.env.NODE_ENV === 'production';
  const message = (status >= 500 && isProd)
    ? 'Error interno del servidor'
    : (err.message || 'Error interno del servidor');

  res.status(status).json({ success: false, error: message });
};
