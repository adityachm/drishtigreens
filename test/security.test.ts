import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, ITERATIONS } from '../src/lib/password.ts';
import { safeHref, paragraphs, whatsappHref } from '../src/lib/util.ts';

describe('passwords', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith(`pbkdf2-sha256$${ITERATIONS}$`)).toBe(true);
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('correct horse batterY', hash)).toBe(false);
  });

  it('salts each hash differently', async () => {
    expect(await hashPassword('same password')).not.toBe(await hashPassword('same password'));
  });

  it('rejects malformed hashes and iteration counts the Worker cannot run', async () => {
    const hash = await hashPassword('another password');
    const [, , salt, h] = hash.split('$');
    expect(await verifyPassword('another password', 'garbage')).toBe(false);
    expect(await verifyPassword('another password', `md5$1$${salt}$${h}`)).toBe(false);
    expect(await verifyPassword('another password', `pbkdf2-sha256$${ITERATIONS + 1}$${salt}$${h}`)).toBe(false);
  });
});

describe('links', () => {
  it('allows site paths, anchors, web, mail and phone links only', () => {
    expect(safeHref('/contact')).toBe('/contact');
    expect(safeHref('#approach')).toBe('#approach');
    expect(safeHref('https://wa.me/91')).toBe('https://wa.me/91');
    expect(safeHref('tel:+919845012345')).toBe('tel:+919845012345');
    expect(safeHref('javascript:alert(1)')).toBe('#');
    expect(safeHref('//evil.example')).toBe('#');
    expect(safeHref(' JaVaScRiPt:alert(1)')).toBe('#');
  });

  it('builds WhatsApp links from any number format', () => {
    expect(whatsappHref('+91 98450-12345')).toBe('https://wa.me/919845012345');
    expect(whatsappHref('')).toBe('');
  });

  it('splits paragraphs on blank lines', () => {
    expect(paragraphs('One\nstill one\n\n  Two  \n\n\n')).toEqual(['One\nstill one', 'Two']);
  });
});
