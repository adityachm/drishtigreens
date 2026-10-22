import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/content/defaults.ts';
import { mergeDocs } from '../src/content/store.ts';
import type { Site } from '../src/views/site/parts.tsx';
import { EMPTY_ENQUIRY, HomePage } from '../src/views/site/pages.tsx';
import { SECTIONS } from '../src/views/site/parts.tsx';

function site(overrides: Partial<Site> = {}): Site {
  return {
    docs: structuredClone(DEFAULTS),
    media: new Map(),
    v: 'test',
    path: '/',
    origin: 'https://drishtigreens.com',
    turnstileKey: '',
    ...overrides,
  };
}

const render = async (el: unknown) => String(await (el as Promise<string>));
const page = (s: Site, category = '') => <HomePage site={s} category={category} contact={{ sent: false, errors: [], values: EMPTY_ENQUIRY }} />;

describe('public pages', () => {
  it('escapes HTML typed into the admin panel', async () => {
    const s = site();
    s.docs.home.hero[0].title = '<script>alert(1)</script>';
    const html = await render(page(s));
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('hides empty contact details instead of showing placeholders', async () => {
    const html = await render(page(site()));
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('tel:');
  });

  it('shows only featured projects on the home page at first', async () => {
    const html = await render(page(site()));
    const shown = html.match(/<article class="proj"[^>]*>/g)!.filter((t) => !/\shidden/.test(t));
    expect(shown).toHaveLength(DEFAULTS.projects.items.filter((p) => p.featured).length);
  });

  it('opens the gallery on the category in the link', async () => {
    const html = await render(page(site(), 'trees'));
    expect(html).toMatch(/data-cat="trees" aria-pressed="true"/);
  });

  it('is one page: every menu item has its section and every internal link points at one', async () => {
    const html = await render(page(site()));
    for (const [id] of SECTIONS) {
      expect(html, id).toContain(`id="${id}"`);
      expect(html, id).toContain(`href="/#${id}"`);
    }
    const internal = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]).filter((h) => !h.startsWith('/static/'));
    const ids = new Set(SECTIONS.map(([id]) => id));
    for (const h of internal) expect(ids.has(h.slice(2)) && h.startsWith('/#'), h).toBe(true);
  });

  it('puts each service’s full description behind its Learn more button', async () => {
    const html = await render(page(site()));
    const visible = DEFAULTS.services.items.filter((x) => x.visible);
    expect(html.match(/data-service="\d+"/g)).toHaveLength(visible.length);
    expect(html).toContain('Tree relocation requires planning and careful handling');
    expect(html).toContain('data-show-category="trees"');
  });
});

describe('mergeDocs', () => {
  it('fills fields missing from a saved document with defaults and ignores corrupt rows', () => {
    const docs = mergeDocs([
      { key: 'home', value: JSON.stringify({ intro_statement: 'Changed' }) },
      { key: 'about', value: '{not json' },
      { key: 'unknown', value: '{}' },
    ]);
    expect(docs.home.intro_statement).toBe('Changed');
    expect(docs.home.hero).toEqual(DEFAULTS.home.hero);
    expect(docs.about).toEqual(DEFAULTS.about);
  });
});
