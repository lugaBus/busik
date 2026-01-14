// Скрипт для генерации хеша пароля для создания админа через SQL
// Использование: node create-admin-helper.js YOUR_PASSWORD

const bcrypt = require('bcrypt');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10)
  .then(hash => {
    console.log('\n✅ Хеш пароля для SQL:');
    console.log(hash);
    console.log('\n📝 Используйте этот хеш в SQL запросе в файле create-admin.sql\n');
  })
  .catch(err => {
    console.error('Ошибка при генерации хеша:', err);
    process.exit(1);
  });
