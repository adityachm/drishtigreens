// Emailing new enquiries. Runs after the enquiry is saved, so a mail problem never loses one;
// the outcome is stored on the enquiry and shown in the admin inbox.

import type { Bindings } from '../env.ts';
import type { Docs } from '../content/schema.ts';
import { enquiryEmail, isEmail, type EnquiryForMail } from './mail.ts';

/** More enquiries than this in an hour stops the emails (they're still saved), so a spam run can't flood the inbox. */
export const MAX_ALERTS_PER_HOUR = 20;

export type AlertStatus = '' | 'sent' | 'failed' | 'skipped';

export function alertRecipients(docs: Docs): string[] {
  const list = docs.settings.notify_emails.filter(isEmail);
  if (list.length) return list;
  return isEmail(docs.settings.email) ? [docs.settings.email] : [];
}

export async function sendEnquiryAlert(env: Bindings, docs: Docs, e: EnquiryForMail, origin: string): Promise<AlertStatus> {
  const to = alertRecipients(docs);
  let status: AlertStatus = '';
  if (env.MAILER && to.length) {
    const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM enquiries WHERE created_at > datetime('now', '-1 hour')").first<{ n: number }>();
    if ((recent?.n ?? 0) > MAX_ALERTS_PER_HOUR) {
      status = 'skipped';
    } else {
      try {
        await env.MAILER.send(enquiryEmail(e, to, `${origin}/admin/enquiries`));
        status = 'sent';
      } catch (err) {
        console.error(`Enquiry ${e.id}: email alert failed:`, (err as Error).message);
        status = 'failed';
      }
    }
  }
  if (status) await env.DB.prepare('UPDATE enquiries SET email_status = ? WHERE id = ?').bind(status, e.id).run();
  return status;
}
