/** Splits text on blank lines into paragraphs. */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

/** Returns the link if it is a relative path, anchor, http(s), mailto or tel link; otherwise '#'. */
export function safeHref(href: string | undefined): string {
  const h = (href ?? '').trim();
  return SAFE_HREF.test(h) ? h : '#';
}

export function isSafeHref(href: string): boolean {
  return href === '' || SAFE_HREF.test(href.trim());
}

export function digitsOnly(s: string | undefined): string {
  return (s ?? '').replace(/\D/g, '');
}

export function telHref(phone: string | undefined): string {
  const p = (phone ?? '').replace(/[^\d+]/g, '');
  return p ? `tel:${p}` : '';
}

export function whatsappHref(number: string | undefined, text?: string): string {
  const d = digitsOnly(number);
  if (!d) return '';
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function clientIp(headers: Headers): string {
  return headers.get('cf-connecting-ip') ?? 'local';
}

export async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip !== 'local') body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
