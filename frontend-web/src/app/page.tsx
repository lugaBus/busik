'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { contentCreatorsApi, ContentCreator, Category, Ratio } from '@/api/contentCreators';
import { getI18nText, getBrowserLanguage, Language } from '@/utils/i18n';
import ContentCreatorCard from '@/components/ContentCreatorCard';
import ThemeToggle from '@/components/ThemeToggle';
import { authService } from '@/auth/auth.service';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Home() {
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('ua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 12,
    page: 1,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [ratios, setRatios] = useState<Ratio[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRatio, setSelectedRatio] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'createdAt' | 'updatedAt' | ''>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [ratiosError, setRatiosError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLanguage(getBrowserLanguage());
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    loadCategories();
    loadRatios();
  }, []);

  useEffect(() => {
    loadCreators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedCategory, selectedRatio, sortBy, sortOrder, itemsPerPage]);

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      setCategoriesError(null);
      const data = await contentCreatorsApi.getCategories();
      console.log('Categories loaded:', data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      setCategoriesError(error.response?.data?.message || error.message || 'Failed to load categories');
      setCategories([]);
    }
  };

  const loadRatios = async () => {
    try {
      console.log('Loading ratios...');
      setRatiosError(null);
      const data = await contentCreatorsApi.getRatios();
      console.log('Ratios loaded:', data);
      setRatios(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load ratios:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      setRatiosError(error.response?.data?.message || error.message || 'Failed to load ratios');
      setRatios([]);
    }
  };

  const loadCreators = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading creators with params:', { 
        page, 
        limit: 12, 
        search: search || undefined,
        category: selectedCategory || undefined,
        ratio: selectedRatio || undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder,
      });
      const params: {
        page: number;
        limit: number;
        search?: string;
        category?: string;
        ratio?: string;
        sortBy?: 'name' | 'rating' | 'createdAt' | 'updatedAt';
        sortOrder: 'asc' | 'desc';
      } = {
        page,
        limit: itemsPerPage,
        sortOrder: sortOrder,
      };
      
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedRatio) params.ratio = selectedRatio;
      if (sortBy) params.sortBy = sortBy;
      
      console.log('Calling getAll with params:', params);
      const response = await contentCreatorsApi.getAll(params);
      console.log('Response received:', response);
      setCreators(response.data || []);
      setPagination(response.pagination || {
        total: 0,
        totalPages: 0,
        limit: 12,
        page: 1,
      });
    } catch (error: any) {
      console.error('Failed to load content creators:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      setError(
        error.response?.data?.message || 
        error.message || 
        (language === 'en' ? 'Failed to load creators' : language === 'ua' ? 'Не вдалося завантажити креаторів' : 'Не удалось загрузить креаторов')
      );
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCreators();
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  const handleRatioChange = (value: string) => {
    setSelectedRatio(value);
    setPage(1);
  };

  const handleSortChange = (field: 'name' | 'rating' | 'createdAt' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedRatio('');
    setSortBy('');
    setSortOrder('asc');
    setPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setPage(1); // Reset to first page when changing items per page
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    router.push('/');
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
            {user ? (
              <>
                <span className="user-info">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </span>
                <button onClick={handleLogout} className="logout-button">
                  {language === 'en' ? 'Logout' : language === 'ua' ? 'Вийти' : 'Выйти'}
                </button>
              </>
            ) : (
              <Link href="/login" className="login-button">
                {language === 'en' ? 'Login' : language === 'ua' ? 'Вхід' : 'Вход'}
              </Link>
            )}
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
        <div className="search-section">
          <div className="search-row">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder={language === 'en' ? 'Search creators...' : language === 'ua' ? 'Пошук креаторів...' : 'Поиск креаторов...'}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>
            <div className="filters-section">
              <div className="filter-group">
                <label className="filter-label">
                  {language === 'en' ? 'Category' : language === 'ua' ? 'Категорія' : 'Категория'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="filter-select"
                  disabled={categories.length === 0 && !categoriesError}
                >
                  <option value="">{language === 'en' ? 'All' : language === 'ua' ? 'Всі' : 'Все'}</option>
                  {categoriesError ? (
                    <option value="" disabled>{categoriesError}</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {getI18nText(category.name, language)}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">
                  {language === 'en' ? 'Ratio' : language === 'ua' ? 'Рейтинг' : 'Рейтинг'}
                </label>
                <select
                  value={selectedRatio}
                  onChange={(e) => handleRatioChange(e.target.value)}
                  className="filter-select"
                  disabled={ratios.length === 0 && !ratiosError}
                >
                  <option value="">{language === 'en' ? 'All' : language === 'ua' ? 'Всі' : 'Все'}</option>
                  {ratiosError ? (
                    <option value="" disabled>{ratiosError}</option>
                  ) : (
                    ratios.map((ratio) => (
                      <option key={ratio.id} value={ratio.id}>
                        {getI18nText(ratio.name, language)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div className="sort-controls">
              <div className="filter-group">
                <label className="filter-label">
                  {language === 'en' ? 'Sort by' : language === 'ua' ? 'Сортувати за' : 'Сортировать по'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const value = e.target.value as 'name' | 'rating' | 'createdAt' | 'updatedAt' | '';
                    if (value) {
                      handleSortChange(value);
                    } else {
                      setSortBy('');
                      setSortOrder('asc');
                      setPage(1);
                    }
                  }}
                  className="filter-select"
                >
                  <option value="">{language === 'en' ? 'Default' : language === 'ua' ? 'За замовчуванням' : 'По умолчанию'}</option>
                  <option value="rating">{language === 'en' ? 'Rating' : language === 'ua' ? 'Рейтинг' : 'Рейтинг'}</option>
                  <option value="createdAt">{language === 'en' ? 'Date Added' : language === 'ua' ? 'Дата додавання' : 'Дата добавления'}</option>
                  <option value="updatedAt">{language === 'en' ? 'Last Updated' : language === 'ua' ? 'Останнє оновлення' : 'Последнее обновление'}</option>
                </select>
              </div>
              {sortBy && (
                <div className="filter-group">
                  <label className="filter-label" style={{ visibility: 'hidden' }}>Direction</label>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      setPage(1);
                    }}
                    className="sort-order-button"
                    title={sortOrder === 'asc' ? (language === 'en' ? 'Ascending' : language === 'ua' ? 'За зростанням' : 'По возрастанию') : (language === 'en' ? 'Descending' : language === 'ua' ? 'За спаданням' : 'По убыванию')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              )}
            </div>
            {(selectedCategory || selectedRatio || sortBy) && (
              <div className="filter-group">
                <label className="filter-label" style={{ visibility: 'hidden' }}>Clear</label>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="clear-filters-button"
                >
                  {language === 'en' ? 'Clear' : language === 'ua' ? 'Очистити' : 'Очистить'}
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{language === 'en' ? 'Loading...' : language === 'ua' ? 'Завантаження...' : 'Загрузка...'}</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <p style={{ color: 'var(--error)' }}>{error}</p>
            <button onClick={loadCreators} className="retry-button" style={{ marginTop: '1rem' }}>
              {language === 'en' ? 'Retry' : language === 'ua' ? 'Спробувати ще раз' : 'Попробовать снова'}
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="empty-state">
            <p>{language === 'en' ? 'No creators found' : language === 'ua' ? 'Креаторів не знайдено' : 'Креаторы не найдены'}</p>
            {search && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {language === 'en' ? 'Try a different search term' : language === 'ua' ? 'Спробуйте інший пошуковий запит' : 'Попробуйте другой поисковый запрос'}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="creators-grid">
              {creators.map((creator) => (
                <ContentCreatorCard key={creator.id} creator={creator} language={language} />
              ))}
            </div>

            {(pagination.totalPages > 1 || pagination.total > 0) && (
              <div className="pagination">
                <div className="pagination-items-per-page">
                  <label className="filter-label">
                    {language === 'en' ? 'Items per page' : language === 'ua' ? 'Елементів на сторінці' : 'Элементов на странице'}
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="filter-select"
                  >
                    <option value="6">6</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                  </select>
                </div>
                {pagination.totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="pagination-button"
                    >
                      {language === 'en' ? 'Previous' : language === 'ua' ? 'Попередня' : 'Предыдущая'}
                    </button>
                    <span className="pagination-info">
                      {language === 'en' ? 'Page' : language === 'ua' ? 'Сторінка' : 'Страница'} {page} {language === 'en' ? 'of' : language === 'ua' ? 'з' : 'из'} {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                      disabled={page === pagination.totalPages}
                      className="pagination-button"
                    >
                      {language === 'en' ? 'Next' : language === 'ua' ? 'Наступна' : 'Следующая'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
