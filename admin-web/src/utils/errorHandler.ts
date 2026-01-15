import { Language } from './i18n';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Parse error from API response
 */
export function parseApiError(error: any, language: Language): ApiError {
  // Network error or no response
  if (!error.response) {
    return {
      message: language === 'en' 
        ? 'Network error. Please check your connection.' 
        : language === 'ua' 
        ? 'Помилка мережі. Перевірте підключення.' 
        : 'Ошибка сети. Проверьте подключение.',
      statusCode: 0,
    };
  }

  const response = error.response;
  const statusCode = response.status;
  const data = response.data;

  // Validation errors (400 with array of errors)
  if (statusCode === 400 && Array.isArray(data.message)) {
    return {
      message: language === 'en' 
        ? 'Please fix the errors below' 
        : language === 'ua' 
        ? 'Виправте помилки нижче' 
        : 'Исправьте ошибки ниже',
      statusCode,
      errors: data.message.map((err: any) => ({
        field: err.property || err.field || '',
        message: Object.values(err.constraints || {}).join(', ') || err.message || '',
      })),
    };
  }

  // Single validation error or custom message
  if (data.message) {
    // Check if it's a string or array
    const message = Array.isArray(data.message) 
      ? data.message.join(', ') 
      : data.message;

    return {
      message: translateErrorMessage(message, language),
      statusCode,
    };
  }

  // Default error messages by status code
  const defaultMessages: Record<number, Record<Language, string>> = {
    400: {
      en: 'Invalid request. Please check your input.',
      ua: 'Невірний запит. Перевірте введені дані.',
      ru: 'Неверный запрос. Проверьте введенные данные.',
    },
    401: {
      en: 'Invalid email or password.',
      ua: 'Невірна електронна пошта або пароль.',
      ru: 'Неверная электронная почта или пароль.',
    },
    403: {
      en: 'Access denied.',
      ua: 'Доступ заборонено.',
      ru: 'Доступ запрещен.',
    },
    404: {
      en: 'Resource not found.',
      ua: 'Ресурс не знайдено.',
      ru: 'Ресурс не найден.',
    },
    409: {
      en: 'User with this email already exists.',
      ua: 'Користувач з цією електронною поштою вже існує.',
      ru: 'Пользователь с этой электронной почтой уже существует.',
    },
    500: {
      en: 'Server error. Please try again later.',
      ua: 'Помилка сервера. Спробуйте пізніше.',
      ru: 'Ошибка сервера. Попробуйте позже.',
    },
  };

  return {
    message: defaultMessages[statusCode]?.[language] || 
      (language === 'en' ? 'An error occurred' : language === 'ua' ? 'Сталася помилка' : 'Произошла ошибка'),
    statusCode,
  };
}

/**
 * Translate common error messages
 */
function translateErrorMessage(message: string, language: Language): string {
  const translations: Record<string, Record<Language, string>> = {
    'User with this email already exists': {
      en: 'User with this email already exists',
      ua: 'Користувач з цією електронною поштою вже існує',
      ru: 'Пользователь с этой электронной почтой уже существует',
    },
    'Invalid credentials': {
      en: 'Invalid email or password',
      ua: 'Невірна електронна пошта або пароль',
      ru: 'Неверная электронная почта или пароль',
    },
    'email must be an email': {
      en: 'Please enter a valid email address',
      ua: 'Введіть дійсну адресу електронної пошти',
      ru: 'Введите действительный адрес электронной почты',
    },
    'password must be longer than or equal to 6 characters': {
      en: 'Password must be at least 6 characters long',
      ua: 'Пароль повинен містити мінімум 6 символів',
      ru: 'Пароль должен содержать минимум 6 символов',
    },
  };

  // Try to find exact match
  if (translations[message]) {
    return translations[message][language];
  }

  // Try to find partial match
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value[language];
    }
  }

  // Return original message if no translation found
  return message;
}
