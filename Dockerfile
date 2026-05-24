# 1. Etapa de dependencias
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ unixodbc-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Etapa de construcción (Build)
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 3. Etapa de ejecución (Runner)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario de seguridad para no usar root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

# El comando de inicio para modo standalone
CMD ["node", "server.js"]
