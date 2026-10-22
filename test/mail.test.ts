import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server, type Socket } from 'node:net';
import { buildMessage, enquiryEmail, isEmail } from '../src/lib/mail.ts';
import { SmtpMailer, mailerFromEnv } from '../src/platform/smtp.ts';

/** A tiny SMTP server that records what it receives. `rejectAuth` makes sign-in fail. */
function fakeSmtp(opts: { rejectAuth?: boolean } = {}) {
  const log: string[] = [];
  const messages: string[] = [];
  const server: Server = createServer((sock: Socket) => {
    let buf = '';
    let inData = false;
    sock.write('220 fake ESMTP\r\n');
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      if (inData) {
        const end = buf.indexOf('\r\n.\r\n');
        if (end < 0) return;
        messages.push(buf.slice(0, end));
        buf = buf.slice(end + 5);
        inData = false;
        sock.write('250 queued\r\n');
      }
      let i;
      while (!inData && (i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        log.push(line);
        const cmd = line.split(' ')[0].toUpperCase();
        if (cmd === 'EHLO') sock.write('250-fake\r\n250-AUTH PLAIN\r\n250 OK\r\n');
        else if (cmd === 'AUTH') sock.write(opts.rejectAuth ? '535 5.7.8 Bad credentials\r\n' : '235 ok\r\n');
        else if (cmd === 'MAIL' || cmd === 'RCPT') sock.write('250 ok\r\n');
        else if (cmd === 'DATA') {
          inData = true;
          sock.write('354 go ahead\r\n');
        } else if (cmd === 'QUIT') sock.end('221 bye\r\n');
        else sock.write('500 what\r\n');
      }
    });
  });
  return { server, log, messages };
}

function decodeBody(raw: string): string {
  const body = raw.slice(raw.indexOf('\r\n\r\n') + 4).replace(/\r\n/g, '');
  return Buffer.from(body, 'base64').toString('utf8');
}

describe('SMTP client', () => {
  const ok = fakeSmtp();
  const bad = fakeSmtp({ rejectAuth: true });
  let okPort = 0;
  let badPort = 0;

  beforeAll(async () => {
    await new Promise<void>((r) => ok.server.listen(0, '127.0.0.1', r));
    await new Promise<void>((r) => bad.server.listen(0, '127.0.0.1', r));
    okPort = (ok.server.address() as { port: number }).port;
    badPort = (bad.server.address() as { port: number }).port;
  });
  afterAll(() => {
    ok.server.close();
    bad.server.close();
  });

  const mailer = (port: number) =>
    new SmtpMailer({ host: '127.0.0.1', port, security: 'none', user: 'alerts@example.com', pass: 'secret$pass', from: 'alerts@example.com', fromName: 'Drishti Greens Website' });

  it('signs in, sends to every recipient and delivers the message intact', async () => {
    await mailer(okPort).send({ to: ['a@example.com', 'b@example.com'], subject: 'Hello', text: 'Line one\n.starts with a dot\nनमस्ते', replyTo: 'asha@example.com' });
    expect(ok.log).toContain('MAIL FROM:<alerts@example.com>');
    expect(ok.log).toContain('RCPT TO:<a@example.com>');
    expect(ok.log).toContain('RCPT TO:<b@example.com>');
    const auth = ok.log.find((l) => l.startsWith('AUTH PLAIN '))!;
    expect(Buffer.from(auth.slice(11), 'base64').toString()).toBe('\0alerts@example.com\0secret$pass');
    const raw = ok.messages[0];
    expect(raw).toContain('Reply-To: asha@example.com');
    expect(decodeBody(raw)).toBe('Line one\r\n.starts with a dot\r\nनमस्ते');
  });

  it('reports a rejected sign-in', async () => {
    await expect(mailer(badPort).send({ to: ['a@example.com'], subject: 'x', text: 'x' })).rejects.toThrow('SMTP AUTH failed: 535');
  });

  it('reports an unreachable server instead of hanging', async () => {
    await expect(mailer(1).send({ to: ['a@example.com'], subject: 'x', text: 'x' })).rejects.toThrow();
  });

  it('refuses unencrypted SMTP to another machine', () => {
    expect(() => new SmtpMailer({ host: 'smtp.example.com', port: 25, security: 'none', user: '', pass: '', from: 'a@example.com', fromName: 'x' })).toThrow(
      'only allowed to this machine',
    );
  });

  it('is off without SMTP_HOST and picks TLS for port 465', () => {
    expect(mailerFromEnv(() => '')).toBeNull();
    const env: Record<string, string> = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'me@gmail.com', SMTP_PASS: 'x' };
    const m = mailerFromEnv((k) => env[k] ?? '')!;
    expect(m.config.port).toBe(465);
    expect(m.config.security).toBe('tls');
    expect(m.from).toBe('me@gmail.com');
  });
});

describe('messages', () => {
  it('encodes non-ASCII subjects and keeps headers on one line', () => {
    const raw = buildMessage({ name: 'Drishti Greens', address: 'a@example.com' }, { to: ['b@example.com'], subject: 'नया\r\nBcc: evil@example.com', text: 'x' });
    expect(raw).toMatch(/^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m);
    expect(raw).not.toMatch(/^Bcc:/m);
  });

  it('rejects malformed addresses', () => {
    expect(isEmail('asha@example.com')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('x@example.com>\r\nRCPT TO:<y@example.com')).toBe(false);
    expect(() => buildMessage({ name: 'x', address: 'a@example.com' }, { to: ['not an email'], subject: 's', text: 't' })).toThrow();
  });

  it('builds the enquiry alert with Reply-To set to the enquirer', () => {
    const m = enquiryEmail({ id: 1, name: 'Asha', phone: '98450 12345', email: 'asha@example.com', city: 'Bengaluru', project_type: 'Garden maintenance', message: 'Lawn' }, ['owner@example.com'], 'https://drishtigreens.com/admin/enquiries');
    expect(m.subject).toBe('New enquiry: Asha · Garden maintenance');
    expect(m.replyTo).toBe('asha@example.com');
    expect(m.text).toContain('Phone:    98450 12345');
    expect(m.text).toContain('https://drishtigreens.com/admin/enquiries');
    const noEmail = enquiryEmail({ id: 2, name: 'Ravi', phone: '1234567', email: '', city: '', project_type: '', message: '' }, ['o@example.com'], 'u');
    expect(noEmail.replyTo).toBeUndefined();
    expect(noEmail.text).toContain('call them back');
  });
});
