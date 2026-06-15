# =========================================================
# Dockerfile - Optimizado para Producción e Integración Portainer
# =========================================================
# Multi-stage build para reducir drásticamente el tamaño de los contenedores
# y asegurar que el código fuente no quede expuesto en el servidor de producción.

# STAGE 1: Entorno de compilación
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias esenciales para compilación
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación React y el Servidor Express (con esbuild tipo bundle)
RUN npm run build


# STAGE 2: Entorno de ejecución en producción unificado (Hardened)
FROM node:20-alpine AS runner

WORKDIR /app

# Definir variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Instalar solo dependencias requeridas para ejecución (limpieza de devDependencies)
COPY package*.json ./
RUN npm ci --only=production

# Copiar solo los artefactos finales construidos del "builder"
COPY --from=builder /app/dist ./dist

# Finding 10: Hardening de seguridad para ejecutar la aplicación como usuario no-root en Docker
RUN chown -R node:node /app
USER node

# Exponer el puerto del servidor unificado (Vite Frontend + Express Backend)
EXPOSE 3000

# Finding 9: Docker healthcheck unificado de aplicación
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Ejecutar el servidor compilado de Node de forma segura
CMD ["npm", "run", "start"]
