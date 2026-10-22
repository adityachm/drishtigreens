/** The Cloudflare tunnel talks plain HTTP to this server and says the visitor used HTTPS in
 *  X-Forwarded-Proto. The app needs the real scheme for secure cookies and same-origin checks. */
export function withForwardedProto(req: Request): Request {
  if (req.headers.get('x-forwarded-proto') !== 'https' || req.url.startsWith('https:')) return req;
  const url = 'https:' + req.url.slice(req.url.indexOf(':') + 1);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? req.body : undefined,
    signal: req.signal,
    ...(hasBody ? { duplex: 'half' } : {}),
  } as RequestInit);
}
