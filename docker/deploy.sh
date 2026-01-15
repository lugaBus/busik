#!/bin/bash

# Скрипт для деплоя LugaBus на продакшен сервер
# Использование: ./deploy.sh [environment]
# environment: prod (по умолчанию)

set -e  # Остановить при ошибке

ENVIRONMENT=${1:-prod}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo "🚀 Начинаем деплой LugaBus (${ENVIRONMENT})..."

# Проверка наличия docker-compose файла
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Файл $COMPOSE_FILE не найден!"
    exit 1
fi

# Остановка старых контейнеров
echo "📦 Останавливаем старые контейнеры..."
docker-compose -f $COMPOSE_FILE down

# Получение последних изменений (если в git репозитории)
if [ -d "../.git" ]; then
    echo "📥 Получаем последние изменения из git..."
    cd ..
    git pull origin main || git pull origin master
    git submodule update --init --recursive
    cd docker
fi

# Сборка образов
echo "🔨 Собираем Docker образы..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Запуск контейнеров
echo "▶️  Запускаем контейнеры..."
docker-compose -f $COMPOSE_FILE up -d

# Ожидание готовности сервисов
echo "⏳ Ожидаем готовности сервисов..."
sleep 10

# Проверка статуса
echo "📊 Статус контейнеров:"
docker-compose -f $COMPOSE_FILE ps

# Запуск миграций базы данных
echo "🗄️  Запускаем миграции базы данных..."
docker exec lugabus-backend npm run prisma:migrate deploy || echo "⚠️  Миграции не выполнены (возможно, уже применены)"

# Проверка логов
echo "📋 Последние логи:"
docker-compose -f $COMPOSE_FILE logs --tail=50

echo "✅ Деплой завершен!"
echo "🔍 Проверьте логи: docker-compose -f $COMPOSE_FILE logs -f"
