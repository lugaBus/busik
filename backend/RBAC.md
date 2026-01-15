# RBAC (Role-Based Access Control) Documentation

## Обзор

Система RBAC реализована с использованием ролей и прав доступа. Каждый пользователь может иметь несколько ролей, а каждая роль может иметь несколько прав.

## Структура

- **User** - пользователь системы
- **Role** - роль (например, `admin`, `user`)
- **Permission** - право доступа (например, `users:read`, `content:create`)
- **UserRole** - связь пользователя с ролью (many-to-many)
- **RolePermission** - связь роли с правом (many-to-many)

## Использование в контроллерах

### Проверка ролей

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  // Только пользователи с ролью 'admin' имеют доступ
}
```

### Проверка прав

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('users:read')
export class UsersController {
  // Только пользователи с правом 'users:read' имеют доступ
}
```

### Комбинированная проверка

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
@Permissions('users:read', 'users:write')
export class AdminUsersController {
  // Пользователь должен иметь роль 'admin' И права 'users:read' или 'users:write'
}
```

## Инициализация данных

После создания миграций запустите seed скрипт:

```bash
npm run prisma:seed
```

Это создаст:
- Базовые роли: `admin`, `user`
- Базовые права доступа для users, roles, audit, content
- Тестового администратора: `admin42@lugabus.com` / `Test1234$%`
- Тестового пользователя: `user@lugabus.com` / `user123`

## API Endpoints

### Авторизация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/refresh` - Обновление токена (TODO)

### Admin API

Все admin endpoints требуют:
- JWT токен в заголовке `Authorization: Bearer <token>`
- Роль `admin`

- `GET /api/admin` - Информация о текущем админе

## Формат прав доступа

Права имеют формат: `resource:action`

Примеры:
- `users:read` - чтение пользователей
- `users:create` - создание пользователей
- `users:update` - обновление пользователей
- `users:delete` - удаление пользователей
- `content:read` - чтение контента
- `roles:manage` - управление ролями

## Получение информации о пользователе

После успешной авторизации, JWT токен содержит:
- `userId` - ID пользователя
- `email` - Email пользователя
- `roles` - Массив ролей пользователя
- `permissions` - Массив прав пользователя

В контроллерах доступ через `@Request() req`:
```typescript
@Get()
getInfo(@Request() req) {
  const user = req.user; // { userId, email, roles, permissions }
}
```
