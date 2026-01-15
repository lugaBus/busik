#!/bin/bash

# Скрипт для бэкапа базы данных LugaBus
# Использование: ./backup-db.sh

set -e

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lugabus_$DATE.sql"

echo "💾 Создаем бэкап базы данных..."

# Создать директорию для бэкапов если не существует
mkdir -p $BACKUP_DIR

# Создать бэкап
docker exec lugabus-postgres pg_dump -U postgres lugabus > $BACKUP_FILE

# Сжать бэкап
gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Бэкап создан: $BACKUP_FILE"

# Удалить бэкапы старше 7 дней
echo "🧹 Удаляем старые бэкапы (старше 7 дней)..."
find $BACKUP_DIR -name "lugabus_*.sql.gz" -mtime +7 -delete

echo "✅ Готово!"
