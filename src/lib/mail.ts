// Email messages: building a plain-text UTF-8 message and the enquiry alert itself.
// Sending is done by a Mailer (src/platform/smtp.ts on the server; a fake in tests).

export type MailMessage = {
  to: string[];
  subject: string;
  text: string;
  /** Where replies go, e.g. the person who sent the enquiry. */
  replyTo?: string;
};

export interface Mailer {
  /** The address mail is sent from, shown in the admin panel. */
  readonly from: string;
  send(msg: MailMessage): Promise<void>;
}

const EMAIL = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[A-Za-z]{2,}$/;

export function isEmail(s: string): boolean {
  return s.length <= 254 && EMAIL.test(s);
}

/** RFC 2047 encoded-word, only when the text isn't plain ASCII. */
function encodeHeader(s: string): string {
  const clean = s.replace(/[\r\n]+/g, ' ').trim();
  return /^[\x20-\x7e]*$/.test(clean) ? clean : `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?=`;
}

function wrap76(b64: string): string {
  return b64.replace(/.{1,76}/g, '$&\r\n');
}

/** A complete message (headers and base64 body) with CRLF line endings. */
export function buildMessage(from: { name: string; address: string }, msg: MailMessage, date = new Date(), id = crypto.randomUUID()): string {
  for (const a of [from.address, ...msg.to, ...(msg.replyTo ? [msg.replyTo] : [])]) {
    if (!isEmail(a)) throw new Error(`Invalid email address: ${a}`);
  }
  const domain = from.address.split('@')[1];
  const headers = [
    `From: ${encodeHeader(from.name)} <${from.address}>`,
    `To: ${msg.to.join(', ')}`,
    ...(msg.replyTo ? [`Reply-To: ${msg.replyTo}`] : []),
    `Subject: ${encodeHeader(msg.subject.slice(0, 200))}`,
    `Date: ${date.toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${id}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
  ];
  const body = wrap76(Buffer.from(msg.text.replace(/\r?\n/g, '\r\n'), 'utf8').toString('base64'));
  return headers.join('\r\n') + '\r\n\r\n' + body;
}

export type EnquiryForMail = {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  project_type: string;
  message: string;
};

export function enquiryEmail(e: EnquiryForMail, to: string[], adminUrl: string): MailMessage {
  const lines = [
    'A new enquiry came in through the Drishti Greens website.',
    '',
    `Name:     ${e.name}`,
    `Phone:    ${e.phone}`,
    ...(e.email ? [`Email:    ${e.email}`] : []),
    ...(e.city ? [`City:     ${e.city}`] : []),
    ...(e.project_type ? [`Project:  ${e.project_type}`] : []),
    '',
    ...(e.message ? ['Message:', e.message, ''] : []),
    e.email ? 'Reply to this email to answer them directly.' : 'They did not leave an email address; call them back on the number above.',
    '',
    `All enquiries: ${adminUrl}`,
  ];
  return {
    to,
    subject: `New enquiry: ${e.name}${e.project_type ? ` · ${e.project_type}` : ''}`,
    text: lines.join('\n'),
    replyTo: e.email && isEmail(e.email) ? e.email : undefined,
  };
}
