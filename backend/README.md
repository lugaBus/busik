# LugaBus Backend

Backend API на NestJS для проекта LugaBus.

## Структура

- `src/modules/public/` - Публичные API эндпоинты для frontend-web
- `src/modules/admin/` - Защищенные API эндпоинты для admin-web
- `src/modules/shared/` - Общая доменная логика (entities, DTOs, services, repositories)
- `src/auth/` - JWT аутентификация, guards, strategies
- `src/infrastructure/` - Инфраструктурные модули (database, cache, mail)

## Установка

```bash
npm install
```

## Настройка базы данных

1. Создайте `.env` файл на основе `.env.example`
2. Настройте `DATABASE_URL`
3. Запустите миграции:

```bash
npx prisma generate
npx prisma migrate dev
```

## Запуск

```bash
# Разработка
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Документация

После запуска сервера, Swagger документация доступна по адресу:
`http://localhost:3001/api/docs`
