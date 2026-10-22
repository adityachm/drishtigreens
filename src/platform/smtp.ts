// A minimal SMTP client on Node's built-in net/tls: implicit TLS (port 465) or STARTTLS (587),
// AUTH PLAIN, one message per connection. Enough for the enquiry alerts; nothing else.

import { connect as netConnect, type Socket } from 'node:net';
import { connect as tlsConnect, type TLSSocket } from 'node:tls';
import { buildMessage, isEmail, type Mailer, type MailMessage } from '../lib/mail.ts';

export type SmtpConfig = {
  host: string;
  port: number;
  /** 'tls' = encrypted from the start (465); 'starttls' = upgrade after connecting (587).
   *  'none' is only allowed for a server on this machine (tests). */
  security: 'tls' | 'starttls' | 'none';
  user: string;
  pass: string;
  from: string;
  fromName: string;
  timeoutMs?: number;
};

type Reply = { code: number; text: string };

class Connection {
  socket: Socket | TLSSocket;
  buffer = '';
  lines: string[] = [];
  replies: Reply[] = [];
  waiting: { resolve: (r: Reply) => void; reject: (e: Error) => void } | null = null;
  failed: Error | null = null;

  constructor(socket: Socket | TLSSocket) {
    this.socket = socket;
    this.attach(socket);
  }

  attach(socket: Socket | TLSSocket) {
    this.socket = socket;
    // SMTP replies are ASCII; read raw bytes so the socket can still be handed to TLS for STARTTLS.
    socket.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString('latin1');
      let i;
      while ((i = this.buffer.indexOf('\r\n')) >= 0) {
        const line = this.buffer.slice(0, i);
        this.buffer = this.buffer.slice(i + 2);
        this.lines.push(line);
        // The last line of a reply has a space (not "-") after the code.
        if (/^\d{3}(?: |$)/.test(line)) {
          this.replies.push({ code: Number(line.slice(0, 3)), text: this.lines.join('\n') });
          this.lines = [];
          this.deliver();
        }
      }
    });
    socket.on('error', (e) => this.fail(e));
    socket.on('close', () => this.fail(new Error('SMTP connection closed')));
  }

  deliver() {
    if (!this.waiting) return;
    const w = this.waiting;
    if (this.replies.length) {
      this.waiting = null;
      w.resolve(this.replies.shift()!);
    } else if (this.failed) {
      this.waiting = null;
      w.reject(this.failed);
    }
  }

  fail(e: Error) {
    if (this.failed) return;
    this.failed = e;
    this.deliver();
  }

  read(): Promise<Reply> {
    return new Promise((resolve, reject) => {
      this.waiting = { resolve, reject };
      this.deliver();
    });
  }

  async command(line: string | null, expect: number[], label = line?.split(' ')[0] ?? 'greeting'): Promise<Reply> {
    if (line !== null) this.socket.write(line + '\r\n');
    const r = await this.read();
    if (!expect.includes(r.code)) throw new Error(`SMTP ${label} failed: ${r.text}`);
    return r;
  }
}

export class SmtpMailer implements Mailer {
  readonly config: SmtpConfig;

  constructor(config: SmtpConfig) {
    if (!isEmail(config.from)) throw new Error('SMTP_FROM must be an email address');
    if (config.security === 'none' && !['127.0.0.1', 'localhost', '::1'].includes(config.host)) {
      throw new Error('Unencrypted SMTP is only allowed to this machine');
    }
    this.config = config;
  }

  get from(): string {
    return this.config.from;
  }

  async send(msg: MailMessage): Promise<void> {
    const c = this.config;
    const data = buildMessage({ name: c.fromName, address: c.from }, msg);
    const timeout = c.timeoutMs ?? 20_000;
    const socket: Socket | TLSSocket =
      c.security === 'tls' ? tlsConnect({ host: c.host, port: c.port, servername: c.host }) : netConnect({ host: c.host, port: c.port });
    socket.setTimeout(timeout, () => socket.destroy(new Error('SMTP timed out')));
    const conn = new Connection(socket);
    try {
      await conn.command(null, [220]);
      const hello = `EHLO ${c.from.split('@')[1]}`;
      await conn.command(hello, [250]);
      if (c.security === 'starttls') {
        await conn.command('STARTTLS', [220]);
        socket.removeAllListeners('data').removeAllListeners('error').removeAllListeners('close');
        const secure = tlsConnect({ socket: socket as Socket, servername: c.host });
        secure.setTimeout(timeout, () => secure.destroy(new Error('SMTP timed out')));
        await new Promise<void>((resolve, reject) => {
          secure.once('secureConnect', resolve);
          secure.once('error', reject);
        });
        conn.attach(secure);
        await conn.command(hello, [250]);
      }
      if (c.user) {
        const token = Buffer.from(`\0${c.user}\0${c.pass}`, 'utf8').toString('base64');
        await conn.command(`AUTH PLAIN ${token}`, [235], 'AUTH');
      }
      await conn.command(`MAIL FROM:<${c.from}>`, [250], 'MAIL FROM');
      for (const to of msg.to) await conn.command(`RCPT TO:<${to}>`, [250, 251], 'RCPT TO');
      await conn.command('DATA', [354]);
      // Dot-stuffing: a line starting with "." gets another "." so it can't end the message early.
      const stuffed = data.replace(/(^|\r\n)\./g, '$1..');
      await conn.command(stuffed + '\r\n.', [250], 'message');
      await conn.command('QUIT', [221]).catch(() => {});
    } finally {
      conn.socket.destroy();
    }
  }
}

/** A mailer from SMTP_* settings, or null when email alerts are not configured. */
export function mailerFromEnv(get: (k: string) => string): SmtpMailer | null {
  const host = get('SMTP_HOST');
  if (!host) return null;
  const port = Number(get('SMTP_PORT') || '465');
  const security = (get('SMTP_SECURITY') || (port === 465 ? 'tls' : 'starttls')) as SmtpConfig['security'];
  if (!['tls', 'starttls', 'none'].includes(security)) throw new Error('SMTP_SECURITY must be tls or starttls');
  const user = get('SMTP_USER');
  return new SmtpMailer({
    host,
    port,
    security,
    user,
    pass: get('SMTP_PASS'),
    from: get('SMTP_FROM') || user,
    fromName: get('SMTP_FROM_NAME') || 'Drishti Greens Website',
  });
}
