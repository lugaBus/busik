#!/bin/bash

# Скрипт для восстановления базы данных LugaBus из бэкапа
# Использование: ./restore-db.sh [backup_file]

set -e

if [ -z "$1" ]; then
    echo "❌ Укажите файл бэкапа для восстановления"
    echo "Использование: ./restore-db.sh /path/to/backup.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Файл бэкапа не найден: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ВНИМАНИЕ: Это действие перезапишет текущую базу данных!"
read -p "Вы уверены? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Восстановление отменено"
    exit 1
fi

echo "🔄 Восстанавливаем базу данных из $BACKUP_FILE..."

# Распаковать если сжат
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Распаковываем бэкап..."
    gunzip -c $BACKUP_FILE | docker exec -i lugabus-postgres psql -U postgres -d lugabus
else
    cat $BACKUP_FILE | docker exec -i lugabus-postgres psql -U postgres -d lugabus
fi

echo "✅ База данных восстановлена!"
