const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getImageSrc(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url}`;
}
