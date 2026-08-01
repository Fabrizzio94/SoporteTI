# ==========================================
# 1. Etapa de dependencias y construcción (Builder)
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

# Instalar herramientas para compilar módulos nativos de C++
RUN apk add --no-cache libc6-compat python3 make g++ unixodbc-dev

# Copiar archivos de configuración para aprovechar la caché de Docker
COPY package.json package-lock.json ./

# Instalar dependencias compilando msnodesqlv8 de forma nativa
RUN npm ci

# Copiar el resto del código del proyecto
COPY . .

# Desactivar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED=1

# Construir la aplicación (Genera el standalone)
RUN npm run build


# ==========================================
# 2. Etapa de ejecución (Runner)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

# msnodesqlv8 necesita unixodbc-dev en ejecución para conectarse a SQL Server
RUN apk add --no-cache unixodbc-dev tzdata

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=America/Guayaquil

# Crear usuario de seguridad para no usar root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios del standalone desde el builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

# El comando de inicio para modo standalone de Next.js
CMD ["node", "server.js"]
