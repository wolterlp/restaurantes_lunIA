# Dockerfile para Backend - Restaurantes LunIA
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias primero para aprovechar la caché de capas de Docker
COPY package*.json ./
RUN npm install --production

# Copiar el resto del código
COPY . .

# Crear carpeta de uploads si no existe y asegurar permisos
RUN mkdir -p uploads

# Exponer el puerto configurado (por defecto 3000)
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar la aplicación
CMD ["node", "app.js"]
