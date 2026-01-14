-- SQL скрипт для создания нового админа
-- 
-- ШАГ 1: Сначала нужно сгенерировать хеш пароля через Node.js
-- Запустите в терминале:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 10).then(hash => console.log(hash));"
-- 
-- Или используйте готовый хеш для пароля 'admin123':
-- $2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq
--
-- ШАГ 2: Замените значения ниже на свои:
-- - 'newadmin@example.com' - email нового админа
-- - 'HASHED_PASSWORD_HERE' - хеш пароля из шага 1
-- - 'Admin' - имя (опционально)
-- - 'User' - фамилия (опционально)

-- Создание пользователя
INSERT INTO users (id, email, password, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),  -- или используйте конкретный UUID
  'newadmin@example.com',  -- ЗАМЕНИТЕ на email нового админа
  '$2b$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',  -- ЗАМЕНИТЕ на хеш пароля
  'Admin',  -- опционально
  'User',   -- опционально
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Получение ID созданного пользователя и роли admin
-- Затем создание связи в user_roles
WITH new_user AS (
  SELECT id FROM users WHERE email = 'newadmin@example.com'  -- ЗАМЕНИТЕ на email
),
admin_role AS (
  SELECT id FROM roles WHERE name = 'admin'
)
INSERT INTO user_roles (id, "userId", "roleId", "createdAt")
SELECT 
  gen_random_uuid(),
  new_user.id,
  admin_role.id,
  NOW()
FROM new_user, admin_role
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE "userId" = new_user.id AND "roleId" = admin_role.id
)
ON CONFLICT ("userId", "roleId") DO NOTHING;

-- Проверка результата
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur."userId"
JOIN roles r ON ur."roleId" = r.id
WHERE u.email = 'newadmin@example.com';  -- ЗАМЕНИТЕ на email
