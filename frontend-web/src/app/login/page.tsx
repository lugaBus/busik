'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginCredentials } from '@/auth/auth.service';
import { getBrowserLanguage, Language } from '@/utils/i18n';
import { parseApiError, ApiError } from '@/utils/errorHandler';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('ua');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLanguage(getBrowserLanguage());
    // Redirect if already authenticated
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = language === 'en' ? 'Email is required' : language === 'ua' ? 'Електронна пошта обов\'язкова' : 'Электронная почта обязательна';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = language === 'en' ? 'Please enter a valid email address' : language === 'ua' ? 'Введіть дійсну адресу електронної пошти' : 'Введите действительный адрес электронной почты';
    }

    if (!password) {
      errors.password = language === 'en' ? 'Password is required' : language === 'ua' ? 'Пароль обов\'язковий' : 'Пароль обязателен';
    } else if (password.length < 6) {
      errors.password = language === 'en' ? 'Password must be at least 6 characters' : language === 'ua' ? 'Пароль повинен містити мінімум 6 символів' : 'Пароль должен содержать минимум 6 символов';
    }

    const isValid = Object.keys(errors).length === 0;
    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    console.log('[Login] ========== handleSubmit START ==========');
    console.log('[Login] Event details:', { 
      type: e.type, 
      defaultPrevented: e.defaultPrevented,
      cancelable: e.cancelable,
      bubbles: e.bubbles,
      currentTarget: e.currentTarget?.tagName,
      target: (e.target as HTMLElement)?.tagName,
      timeStamp: e.timeStamp,
    });
    
    // CRITICAL: preventDefault must be called FIRST, synchronously
    console.log('[Login] ⚡ Calling preventDefault IMMEDIATELY');
    e.preventDefault();
    console.log('[Login] ✅ preventDefault called, defaultPrevented:', e.defaultPrevented);
    
    console.log('[Login] ⚡ Calling stopPropagation');
    e.stopPropagation();
    console.log('[Login] ✅ stopPropagation called');
    
    // Process form synchronously first, then async
    handleFormSubmit();
    
    console.log('[Login] handleSubmit returning false (synchronously)');
    return false;
  };

  const handleFormSubmit = async () => {
    // Clear previous errors
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const credentials: LoginCredentials = { email, password };
      await authService.login(credentials);
      
      // Only redirect on success
      router.refresh();
      router.push('/');
    } catch (err: any) {
      const apiError: ApiError = parseApiError(err, language);
      setError(apiError.message);

      // Set field-specific errors if available
      if (apiError.errors && apiError.errors.length > 0) {
        const fieldErrs: Record<string, string> = {};
        apiError.errors.forEach((err) => {
          if (err.field) {
            fieldErrs[err.field] = err.message;
          }
        });
        setFieldErrors(fieldErrs);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" className="app-title-link" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <Logo size={40} />
              <h1 className="app-title">LugaBus</h1>
            </Link>
            <Link
              href="/creators/new"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'var(--accent)',
                color: 'white',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-hover, #4f46e5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
              }}
            >
              <span>
                {language === 'en' ? 'Add new blogger' : language === 'ua' ? 'Додати нового блогера' : 'Добавить нового блогера'}
              </span>
              <span style={{ fontSize: '1.25rem', lineHeight: '1' }}>+</span>
            </Link>
          </div>
          <div className="header-controls">
            <ThemeToggle />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="language-selector"
            >
              <option value="en">English</option>
              <option value="ua">Українська</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="auth-container">
          <div className="auth-card">
            <h2 className="auth-title">
              {language === 'en' ? 'Login' : language === 'ua' ? 'Вхід' : 'Вход'}
            </h2>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }} 
              className="auth-form" 
              noValidate
            >
              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">
                  {language === 'en' ? 'Email' : language === 'ua' ? 'Електронна пошта' : 'Электронная почта'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                  placeholder={language === 'en' ? 'your@email.com' : language === 'ua' ? 'ваша@пошта.com' : 'ваша@почта.com'}
                />
                {fieldErrors.email && (
                  <span className="form-error">{fieldErrors.email}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">
                  {language === 'en' ? 'Password' : language === 'ua' ? 'Пароль' : 'Пароль'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  className={`form-input ${fieldErrors.password ? 'form-input-error' : ''}`}
                  placeholder={language === 'en' ? 'Enter your password' : language === 'ua' ? 'Введіть пароль' : 'Введите пароль'}
                />
                {fieldErrors.password && (
                  <span className="form-error">{fieldErrors.password}</span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFormSubmit();
                }}
                disabled={loading}
                className="auth-button"
              >
                {loading
                  ? (language === 'en' ? 'Logging in...' : language === 'ua' ? 'Вхід...' : 'Вход...')
                  : (language === 'en' ? 'Login' : language === 'ua' ? 'Увійти' : 'Войти')
                }
              </button>
            </form>
            <div className="auth-footer">
              <span className="auth-footer-text">
                {language === 'en' ? "Don't have an account?" : language === 'ua' ? 'Немає облікового запису?' : 'Нет аккаунта?'}
              </span>
              <Link href="/register" className="auth-link">
                {language === 'en' ? 'Register' : language === 'ua' ? 'Зареєструватися' : 'Зарегистрироваться'}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
