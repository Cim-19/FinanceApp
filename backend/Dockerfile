FROM node:20-slim
WORKDIR /app

# OpenSSL requerido por Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# Corre como usuario sin privilegios en vez de root
RUN chown -R node:node /app
USER node

EXPOSE 3000
# Corre migraciones automáticamente en cada deploy, luego arranca el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
