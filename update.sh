#!/bin/bash

# --- SCRIPT DE ACTUALIZACIÓN PROFESIONAL - RESTAURANTES LUNIA ---
# Este script actualiza el código y las imágenes sin afectar los volúmenes de datos.

echo "====================================================="
echo "   INICIANDO ACTUALIZACIÓN DEL SISTEMA POS"
echo "====================================================="

# 1. Cargar variables de entorno
if [ -f .env ]; then
    # Cargamos variables ignorando comentarios
    export $(cat .env | grep -v '^#' | xargs)
    echo "[OK] Configuración cargada para: $EMPRESA_ID"
else
    echo "[ERROR] No se encontró el archivo .env"
    exit 1
fi

# 2. Realizar Backup preventivo antes de actualizar
# Usamos el contenedor de backup que ya configuramos o un comando directo
echo "[1/4] Realizando backup de seguridad preventivo..."
BACKUP_NAME="pre-update-$(date +%F_%H-%M)"
docker exec pos-mongodb-$EMPRESA_ID mongodump --archive=/data/db/$BACKUP_NAME.archive --gzip
if [ $? -eq 0 ]; then
    echo "[OK] Backup completado: $BACKUP_NAME.archive"
else
    echo "[ALERTA] El backup falló. ¿Deseas continuar de todas formas? (s/n)"
    read -r response
    if [[ ! $response =~ ^([sS][iI]|[sS])$ ]]; then
        exit 1
    fi
fi

# 3. Descargar nuevas versiones
echo "[2/4] Descargando últimas mejoras..."
# Si usas un repositorio Git:
git pull origin main

# 4. Reconstruir y Reiniciar servicios
echo "[3/4] Aplicando cambios y reiniciando contenedores..."
# --build reconstruye las imágenes si el código cambió
# --remove-orphans elimina servicios que ya no existan en el compose
docker compose up -d --build --remove-orphans

# 5. Limpieza de imágenes antiguas (opcional para ahorrar espacio)
echo "[4/4] Limpiando archivos temporales..."
docker image prune -f

echo "====================================================="
echo "   ACTUALIZACIÓN COMPLETADA EXITOSAMENTE"
echo "   Instancia: $EMPRESA_ID"
echo "   Dominio: $DOMAIN"
echo "====================================================="
