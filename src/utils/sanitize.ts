// Remove tags HTML perigosas para prevenir XSS em conteúdo dinâmico
const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'br', 'p']);

export function sanitizeHTML(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .replace(/<(?!\/?(?:b|i|em|strong|br|p)\b)[^>]+>/gi, '');
}

export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Para campos de texto livre (bio, descrição de post, etc.)
export function sanitizeFreeText(input: string): string {
  return sanitizeHTML(input).trim();
}
