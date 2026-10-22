-- Outcome of the email alert for each enquiry: '' (alerts off), 'sent', 'failed', or 'skipped'
-- (more than 20 enquiries in an hour, to stop a spam run from flooding the inbox).
ALTER TABLE enquiries ADD COLUMN email_status TEXT NOT NULL DEFAULT '';
