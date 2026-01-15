import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Add token for all endpoints if user is authenticated
      // Public endpoints support optional JWT authentication
      const token = localStorage.getItem('token');
      const url = config.url || '';
      
      // Log for content-creator-submissions endpoints
      if (url.includes('content-creator-submissions')) {
        console.log('[ApiClient Interceptor]', {
          url,
          hasToken: !!token,
          tokenLength: token?.length,
          method: config.method,
        });
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        if (url.includes('content-creator-submissions')) {
          console.log('[ApiClient Interceptor] Token added to headers');
        }
      } else {
        if (url.includes('content-creator-submissions')) {
          console.log('[ApiClient Interceptor] No token found in localStorage');
        }
      }
      
      // Add submitter-id for proof submissions if not already set
      if (config.url?.includes('/proof-submissions') && !config.headers['x-submitter-id']) {
        const submitterId = localStorage.getItem('submitterId');
        if (submitterId) {
          config.headers['x-submitter-id'] = submitterId;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle auth errors for non-public endpoints
    // НЕ делаем редирект для /auth/login и /auth/register - пусть компонент сам обработает ошибку
    if (
      typeof window !== 'undefined' && 
      error.response?.status === 401 && 
      !error.config?.url?.includes('/public/') &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
