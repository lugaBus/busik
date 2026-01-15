# План публикации LugaBus на Digital Ocean

## 📋 Обзор проекта

Проект состоит из:
- **Backend**: NestJS API (порт 3001)
- **Frontend**: Next.js публичный сайт (порт 3000)
- **Admin Panel**: Next.js админ-панель (порт 3002)
- **Database**: PostgreSQL 16
- **Reverse Proxy**: Nginx

---

## 🎯 Варианты деплоя

### Вариант 1: Single Droplet (рекомендуется для старта)
Один сервер с Docker Compose - проще и дешевле для начала.

### Вариант 2: Managed Database + Droplet
Отдельный Managed PostgreSQL + Droplet для приложения - более масштабируемо.

### Вариант 3: Kubernetes (для продакшена)
Полноценный Kubernetes кластер - для высоких нагрузок.

---

## 🚀 Вариант 1: Single Droplet (Пошаговый план)

### Этап 1: Подготовка Digital Ocean

#### 1.1 Создание Droplet
- **Размер**: Basic Plan, 4GB RAM / 2 vCPU / 80GB SSD ($24/месяц) или выше
- **Регион**: Выбрать ближайший к вашей аудитории
- **Образ**: Ubuntu 22.04 LTS
- **Дополнительно**: 
  - ✅ Enable Monitoring
  - ✅ Enable IPv6 (опционально)
  - ✅ Add SSH Keys (рекомендуется)

#### 1.2 Настройка Firewall
В Digital Ocean Firewall добавить правила:
- **Inbound**:
  - HTTP (80) - для всех
  - HTTPS (443) - для всех
  - SSH (22) - только для вашего IP
- **Outbound**: Все разрешено

---

### Этап 2: Настройка сервера

#### 2.1 Первоначальная настройка
```bash
# Подключиться к серверу
ssh root@YOUR_DROPLET_IP

# Обновить систему
apt update && apt upgrade -y

# Установить базовые пакеты
apt install -y curl wget git ufw htop

# Настроить firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

#### 2.2 Создание пользователя (опционально, но рекомендуется)
```bash
# Создать пользователя
adduser deploy
usermod -aG sudo deploy

# Настроить SSH ключи для нового пользователя
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Переключиться на нового пользователя
su - deploy
```

#### 2.3 Установка Docker и Docker Compose
```bash
# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверить установку
docker --version
docker-compose --version
```

---

### Этап 3: Настройка базы данных

#### 3.1 Создание PostgreSQL контейнера (если используем Docker)
База данных будет в Docker Compose, но для продакшена рекомендуется:

**Вариант A: Managed Database (рекомендуется)**
- Создать Managed PostgreSQL в Digital Ocean
- Получить connection string
- Использовать его в `DATABASE_URL`

**Вариант B: PostgreSQL в Docker**
- Использовать PostgreSQL из docker-compose.yml
- Настроить регулярные бэкапы

#### 3.2 Настройка бэкапов базы данных
```bash
# Создать директорию для бэкапов
mkdir -p /home/deploy/backups

# Создать скрипт бэкапа
cat > /home/deploy/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec lugabus-postgres pg_dump -U postgres lugabus > "$BACKUP_DIR/lugabus_$DATE.sql"
# Удалить бэкапы старше 7 дней
find $BACKUP_DIR -name "lugabus_*.sql" -mtime +7 -delete
EOF

chmod +x /home/deploy/backup-db.sh

# Добавить в crontab (ежедневно в 2:00)
crontab -e
# Добавить строку:
# 0 2 * * * /home/deploy/backup-db.sh
```

---

### Этап 4: Подготовка кода

#### 4.1 Клонирование репозитория
```bash
# Создать директорию для проекта
mkdir -p /home/deploy/apps
cd /home/deploy/apps

# Клонировать репозиторий
git clone YOUR_REPOSITORY_URL lugabus
cd lugabus

# Инициализировать подмодули
git submodule update --init --recursive
```

#### 4.2 Настройка переменных окружения

**Backend** (`docker/env/backend.env`):
```env
# Database
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/lugabus?schema=public

# Server
PORT=3001
NODE_ENV=production

# JWT - ВАЖНО: Использовать сильный секретный ключ!
JWT_SECRET=GENERATE_STRONG_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=24h

# CORS - Заменить на реальные домены
FRONTEND_URL=https://yourdomain.com
ADMIN_URL=https://admin.yourdomain.com

# API
API_URL=https://api.yourdomain.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_AUTH_TTL=900000
THROTTLE_AUTH_LIMIT=5
```

**Frontend** (`docker/env/frontend.env`):
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

**Admin** (`docker/env/admin.env`):
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

#### 4.3 Генерация секретных ключей
```bash
# Генерация JWT_SECRET
openssl rand -base64 32

# Генерация пароля для PostgreSQL
openssl rand -base64 24
```

---

### Этап 5: Настройка Docker Compose для продакшена

#### 5.1 Обновление docker-compose.yml
Создать `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: lugabus-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-lugabus}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - lugabus-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: lugabus-backend
    env_file:
      - ./env/backend.env
    ports:
      - "127.0.0.1:3001:3001"  # Только localhost
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - lugabus-network
    volumes:
      - ../backend/public/uploads:/app/public/uploads  # Персистентное хранилище для загрузок
    restart: unless-stopped
    command: npm run start:prod

  frontend-web:
    build:
      context: ../frontend-web
      dockerfile: Dockerfile
    container_name: lugabus-frontend-web
    env_file:
      - ./env/frontend.env
    ports:
      - "127.0.0.1:3000:3000"  # Только localhost
    depends_on:
      - backend
    networks:
      - lugabus-network
    restart: unless-stopped

  admin-web:
    build:
      context: ../admin-web
      dockerfile: Dockerfile
    container_name: lugabus-admin-web
    env_file:
      - ./env/admin.env
    ports:
      - "127.0.0.1:3002:3002"  # Только localhost
    depends_on:
      - backend
    networks:
      - lugabus-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: lugabus-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # SSL сертификаты
    depends_on:
      - backend
      - frontend-web
      - admin-web
    networks:
      - lugabus-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  lugabus-network:
    driver: bridge
```

---

### Этап 6: Настройка Nginx для продакшена

#### 6.1 Создание nginx.prod.conf
```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

    # Upstreams
    upstream backend {
        server backend:3001;
        keepalive 32;
    }

    upstream frontend-web {
        server frontend-web:3000;
        keepalive 32;
    }

    upstream admin-web {
        server admin-web:3002;
        keepalive 32;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com admin.yourdomain.com;
        return 301 https://$host$request_uri;
    }

    # Frontend Web
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        location / {
            proxy_pass http://frontend-web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Admin Web
    server {
        listen 443 ssl http2;
        server_name admin.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://admin-web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Backend API
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Rate limiting для API
        limit_req zone=api_limit burst=20 nodelay;
        limit_req zone=auth_limit burst=5 nodelay;

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Swagger Docs (можно ограничить доступ)
        location /api/docs {
            # Опционально: ограничить доступ по IP
            # allow YOUR_IP;
            # deny all;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

### Этап 7: Настройка SSL сертификатов (Let's Encrypt)

#### 7.1 Установка Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 7.2 Получение сертификатов
```bash
# Для основного домена
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Для админ-панели
sudo certbot certonly --standalone -d admin.yourdomain.com

# Для API
sudo certbot certonly --standalone -d api.yourdomain.com
```

#### 7.3 Копирование сертификатов в Docker
```bash
# Создать директорию для SSL
mkdir -p /home/deploy/apps/lugabus/docker/ssl

# Скопировать сертификаты
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/deploy/apps/lugabus/docker/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/deploy/apps/lugabus/docker/ssl/
sudo chown -R deploy:deploy /home/deploy/apps/lugabus/docker/ssl
```

#### 7.4 Настройка автообновления сертификатов
```bash
# Добавить в crontab
sudo crontab -e
# Добавить:
# 0 3 * * * certbot renew --quiet && docker exec lugabus-nginx nginx -s reload
```

---

### Этап 8: Деплой приложения

#### 8.1 Сборка и запуск
```bash
cd /home/deploy/apps/lugabus/docker

# Остановить старые контейнеры (если есть)
docker-compose -f docker-compose.prod.yml down

# Собрать образы
docker-compose -f docker-compose.prod.yml build --no-cache

# Запустить контейнеры
docker-compose -f docker-compose.prod.yml up -d

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

#### 8.2 Запуск миграций и seed
```bash
# Запустить миграции
docker exec lugabus-backend npm run prisma:migrate deploy

# Запустить seed (только при первом деплое)
docker exec lugabus-backend npm run prisma:seed
```

---

### Этап 9: Настройка доменов

#### 9.1 DNS записи
В настройках домена добавить A-записи:
- `@` → IP вашего Droplet
- `www` → IP вашего Droplet
- `admin` → IP вашего Droplet
- `api` → IP вашего Droplet

#### 9.2 Проверка DNS
```bash
# Проверить DNS записи
dig yourdomain.com
nslookup yourdomain.com
```

---

### Этап 10: Мониторинг и логирование

#### 10.1 Настройка логирования
```bash
# Создать директорию для логов
mkdir -p /home/deploy/apps/lugabus/logs

# Настроить ротацию логов
sudo nano /etc/logrotate.d/lugabus
```

Содержимое `/etc/logrotate.d/lugabus`:
```
/home/deploy/apps/lugabus/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        docker exec lugabus-nginx nginx -s reload
    endscript
}
```

#### 10.2 Мониторинг ресурсов
```bash
# Установить monitoring tools
sudo apt install -y htop iotop nethogs

# Настроить alerts в Digital Ocean Dashboard
# Включить Monitoring в настройках Droplet
```

---

### Этап 11: Безопасность

#### 11.1 Дополнительные меры безопасности
```bash
# Настроить fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Настроить автоматические обновления безопасности
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### 11.2 Проверка безопасности
- ✅ Все порты кроме 80, 443, 22 закрыты
- ✅ SSH доступ только по ключам
- ✅ Сильные пароли для всех сервисов
- ✅ SSL сертификаты настроены
- ✅ Rate limiting включен
- ✅ CORS настроен правильно
- ✅ JWT_SECRET сильный и уникальный

---

## 🔄 Процесс обновления приложения

### Обновление кода
```bash
cd /home/deploy/apps/lugabus

# Получить последние изменения
git pull origin main
git submodule update --init --recursive

# Пересобрать и перезапустить
cd docker
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Запустить миграции (если есть)
docker exec lugabus-backend npm run prisma:migrate deploy

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Мониторинг и метрики

### Рекомендуемые инструменты
1. **Digital Ocean Monitoring** - встроенный мониторинг
2. **Uptime Robot** - мониторинг доступности
3. **Sentry** - отслеживание ошибок
4. **Google Analytics** - аналитика трафика

---

## 🚨 Troubleshooting

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

---

## 📝 Чеклист перед запуском

- [ ] Droplet создан и настроен
- [ ] Docker и Docker Compose установлены
- [ ] Домены настроены и указывают на IP сервера
- [ ] SSL сертификаты получены
- [ ] Переменные окружения настроены
- [ ] Сильные пароли и секретные ключи сгенерированы
- [ ] Firewall настроен
- [ ] Бэкапы базы данных настроены
- [ ] Мониторинг настроен
- [ ] Тестовый деплой выполнен успешно

---

## 💰 Ориентировочная стоимость

- **Droplet (4GB RAM)**: $24/месяц
- **Managed Database (опционально)**: $15-60/месяц
- **Domain**: $10-15/год
- **SSL (Let's Encrypt)**: Бесплатно
- **Итого**: ~$24-84/месяц

---

## 🔗 Полезные ссылки

- [Digital Ocean Documentation](https://docs.digitalocean.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)

---

## 📞 Поддержка

При возникновении проблем:
1. Проверить логи: `docker-compose logs`
2. Проверить статус контейнеров: `docker-compose ps`
3. Проверить ресурсы: `htop`, `df -h`
4. Проверить сеть: `docker network ls`
