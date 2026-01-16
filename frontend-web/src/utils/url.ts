/**
 * Get base API URL without /api suffix
 */
export function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  // Remove /api suffix if present
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * Build full URL for a resource path
 * @param path - Resource path (e.g., '/public/uploads/photo.jpg')
 * @returns Full URL (e.g., 'https://api.lugabus.cv/public/uploads/photo.jpg')
 */
export function buildResourceUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  // If path already starts with http, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build full URL
  return `${getApiBaseUrl()}${normalizedPath}`;
}
