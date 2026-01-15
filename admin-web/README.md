# LugaBus Admin Web

Админский фронтенд на Next.js для проекта LugaBus.

## Установка

```bash
npm install
```

## Запуск

```bash
# Разработка
npm run dev

# Production
npm run build
npm run start
```

Приложение будет доступно на `http://localhost:3002`

## Структура

- `src/app/` - Next.js App Router страницы и layout
- `src/api/` - API клиент для взаимодействия с backend (admin endpoints)
- `src/auth/` - Сервисы аутентификации
- `src/features/` - Feature-модули админки
- `src/ui/` - Переиспользуемые UI компоненты
