# Docker Deployment Guide

## Быстрый старт

### 1. Подготовка переменных окружения

Скопируйте примеры файлов окружения и заполните их:

```bash
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env
cp env/admin.env.example env/admin.env
```

**ВАЖНО**: Обязательно измените:
- `JWT_SECRET` - сгенерируйте сильный секретный ключ
- `POSTGRES_PASSWORD` - установите надежный пароль
- `FRONTEND_URL` и `ADMIN_URL` - укажите реальные домены

### 2. Генерация секретных ключей

```bash
# JWT Secret
openssl rand -base64 32

# PostgreSQL Password
openssl rand -base64 24
```

### 3. Настройка SSL сертификатов

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификаты
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
sudo certbot certonly --standalone -d admin.yourdomain.com
sudo certbot certonly --standalone -d api.yourdomain.com

# Скопировать сертификаты
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/
```

### 4. Настройка Nginx

Скопируйте и отредактируйте конфигурацию Nginx:

```bash
cp nginx.prod.conf.example nginx.prod.conf
```

Замените `yourdomain.com` на ваш реальный домен в файле `nginx.prod.conf`.

### 5. Деплой

```bash
# Создать production docker-compose файл
cp docker-compose.prod.yml.example docker-compose.prod.yml

# Запустить деплой
./deploy.sh prod
```

## Полезные команды

### Просмотр логов
```bash
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend-web
docker-compose -f docker-compose.prod.yml logs -f admin-web
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Перезапуск сервисов
```bash
docker-compose -f docker-compose.prod.yml restart backend
docker-compose -f docker-compose.prod.yml restart frontend-web
docker-compose -f docker-compose.prod.yml restart admin-web
docker-compose -f docker-compose.prod.yml restart nginx
```

### Остановка и запуск
```bash
# Остановить все
docker-compose -f docker-compose.prod.yml down

# Запустить все
docker-compose -f docker-compose.prod.yml up -d
```

### Бэкап базы данных
```bash
./backup-db.sh
```

### Восстановление базы данных
```bash
./restore-db.sh /path/to/backup.sql.gz
```

### Выполнение миграций
```bash
docker exec lugabus-backend npm run prisma:migrate deploy
```

### Выполнение seed
```bash
docker exec lugabus-backend npm run prisma:seed
```

## Структура файлов

```
docker/
├── docker-compose.prod.yml          # Production конфигурация
├── docker-compose.prod.yml.example  # Пример конфигурации
├── nginx.prod.conf                  # Nginx конфигурация для продакшена
├── nginx.conf                       # Nginx конфигурация для разработки
├── deploy.sh                        # Скрипт деплоя
├── backup-db.sh                     # Скрипт бэкапа БД
├── restore-db.sh                    # Скрипт восстановления БД
├── env/
│   ├── backend.env                  # Переменные окружения backend
│   ├── frontend.env                 # Переменные окружения frontend
│   └── admin.env                    # Переменные окружения admin
└── ssl/                             # SSL сертификаты
    ├── fullchain.pem
    └── privkey.pem
```

## Troubleshooting

### Проблемы с подключением к базе данных
```bash
# Проверить статус PostgreSQL
docker exec lugabus-postgres pg_isready -U postgres

# Проверить логи
docker logs lugabus-postgres
```

### Проблемы с Nginx
```bash
# Проверить конфигурацию
docker exec lugabus-nginx nginx -t

# Перезагрузить конфигурацию
docker exec lugabus-nginx nginx -s reload
```

### Проблемы с памятью
```bash
# Очистить неиспользуемые Docker ресурсы
docker system prune -a --volumes
```

### Проблемы с портами
```bash
# Проверить какие порты заняты
sudo netstat -tulpn | grep LISTEN

# Освободить порт (если нужно)
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
```
