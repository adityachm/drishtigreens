import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/content/defaults.ts';
import { mergeDocs } from '../src/content/store.ts';
import type { Site } from '../src/views/site/parts.tsx';
import { HomePage, ProjectsPage } from '../src/views/site/pages.tsx';

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

describe('public pages', () => {
  it('escapes HTML typed into the admin panel', async () => {
    const s = site();
    s.docs.home.hero[0].title = '<script>alert(1)</script>';
    const html = await render(<HomePage site={s} />);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('hides empty contact details instead of showing placeholders', async () => {
    const html = await render(<HomePage site={site()} />);
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('tel:');
  });

  it('shows only featured projects on the home page at first', async () => {
    const html = await render(<HomePage site={site()} />);
    const shown = html.match(/<article class="proj"[^>]*>/g)!.filter((t) => !/\shidden/.test(t));
    expect(shown).toHaveLength(DEFAULTS.projects.items.filter((p) => p.featured).length);
  });

  it('opens the projects page on the category in the link', async () => {
    const html = await render(<ProjectsPage site={site({ path: '/projects' })} category="trees" />);
    expect(html).toMatch(/data-cat="trees" aria-pressed="true"/);
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
