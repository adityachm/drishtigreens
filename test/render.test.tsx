import { describe, expect, it } from 'vitest';
import { DEFAULTS } from '../src/content/defaults.ts';
import { mergeDocs } from '../src/content/store.ts';
import type { Site } from '../src/views/site/parts.tsx';
import type { Media } from '../src/lib/media.ts';
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
const page = (s: Site) => <HomePage site={s} contact={{ sent: false, errors: [], values: EMPTY_ENQUIRY }} />;
const fakeMedia = (id: string): Media => ({ id, alt: id, width: 800, height: 600, ext: 'webp', widths: [480, 800], original_key: null, original_name: null, bytes: 0, created_at: '' });
/** A site where every image the default content uses exists. */
function siteWithMedia(): Site {
  const ids = JSON.stringify(DEFAULTS).match(/seed-\d+/g)!;
  return site({ media: new Map(ids.map((id) => [id, fakeMedia(id)])) });
}

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

  it('shows major projects: photo cards first, then logo cards, with each client once', async () => {
    const html = await render(page(siteWithMedia()));
    expect(html.match(/class="mp-card"/g)).toHaveLength(3);
    expect(html.match(/class="mp-logo-card"/g)).toHaveLength(2);
    for (const p of DEFAULTS.projects.items) expect(html.split(`<h3>${p.name}</h3>`).length - 1, p.name).toBe(1);
    expect(html).toContain('href="https://pushkarcottages.com/"');
  });

  it('shows a project status only when one is set', async () => {
    const s = siteWithMedia();
    expect(await render(page(s))).not.toContain('class="status ');
    s.docs.projects.items[0].status = 'in-progress';
    s.docs.projects.items[2].status = 'completed';
    const html = await render(page(s));
    expect(html).toContain('<span class="status status-in-progress">In progress</span>');
    expect(html).toContain('<span class="status status-completed">Completed</span>');
  });

  it('hides the gallery until photos are uploaded', async () => {
    const s = siteWithMedia();
    expect(await render(page(s))).not.toContain('data-gallery');
    s.docs.projects.gallery = [{ image: 'seed-20', caption: 'New villa', visible: true }];
    const html = await render(page(s));
    expect(html).toContain('data-gallery');
    expect(html).toContain('<figcaption>New villa</figcaption>');
  });

  it('lays out seven services as full rows (4 columns, first card wide)', async () => {
    const html = await render(page(siteWithMedia()));
    expect(html).toContain('class="services-grid cols-4 wide-lead"');
  });

  it('uses the uploaded logo next to the name, and has no philosophy section', async () => {
    const html = await render(page(siteWithMedia()));
    expect(html).toMatch(/class="logo-mark"><img src="\/media\/seed-16\//);
    expect(html).toContain('DRISHTI GREENS');
    expect(html.toLowerCase()).not.toContain('philosophy');
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
    expect(html).toContain('achieves a 99% tree relocation success rate');
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
