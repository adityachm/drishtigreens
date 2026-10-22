import { describe, expect, it } from 'vitest';
import { parseFields, parseSections, toFormEntries, type Field, type FormSource } from '../src/content/fields.ts';
import { DOCS, allFields } from '../src/content/schema.ts';
import { DEFAULTS } from '../src/content/defaults.ts';

function source(entries: [string, string][]): FormSource {
  return {
    get: (n) => entries.find(([k]) => k === n)?.[1] ?? null,
    getAll: (n) => entries.filter(([k]) => k === n).map(([, v]) => v),
  };
}

describe('content schema', () => {
  for (const def of DOCS) {
    it(`default ${def.key} content passes through the editor unchanged`, () => {
      const value = DEFAULTS[def.key] as unknown as Record<string, unknown>;
      const errors: string[] = [];
      const parsed = parseSections(def.sections, source(toFormEntries(allFields(def), value)), errors);
      expect(errors).toEqual([]);
      expect(parsed).toEqual(value);
    });
  }
});

describe('parseFields', () => {
  const list: Field[] = [
    {
      type: 'list',
      key: 'items',
      label: 'Items',
      itemLabel: 'Item',
      titleKey: 'title',
      fields: [
        { type: 'text', key: 'title', label: 'Title', required: true },
        { type: 'checkbox', key: 'visible', label: 'Visible' },
        { type: 'slug', key: 'slug', label: 'Web address' },
      ],
    },
  ];

  it('keeps list items in submitted order and reads unticked boxes as false', () => {
    const errors: string[] = [];
    const out = parseFields(
      list,
      source([
        ['items.__order', 'b'],
        ['items.b.title', 'Second'],
        ['items.b.slug', 'second'],
        ['items.__order', 'a'],
        ['items.a.title', 'First'],
        ['items.a.visible', 'on'],
        ['items.a.slug', 'first'],
      ]),
      errors,
    );
    expect(errors).toEqual([]);
    expect(out.items).toEqual([
      { title: 'Second', visible: false, slug: 'second' },
      { title: 'First', visible: true, slug: 'first' },
    ]);
  });

  it('reports duplicate slugs, bad slugs and missing required text', () => {
    const errors: string[] = [];
    parseFields(
      list,
      source([
        ['items.__order', 'a'],
        ['items.a.title', 'A'],
        ['items.a.slug', 'same'],
        ['items.__order', 'b'],
        ['items.b.title', ''],
        ['items.b.slug', 'same'],
        ['items.__order', 'c'],
        ['items.c.title', 'C'],
        ['items.c.slug', 'Not A Slug'],
      ]),
      errors,
    );
    expect(errors.some((e) => e.includes('used twice'))).toBe(true);
    expect(errors.some((e) => e.includes('Item 2: Title is required'))).toBe(true);
    expect(errors.some((e) => e.includes('Item 3: Web address'))).toBe(true);
  });

  it('rejects unsafe links, unknown choices and malformed image ids', () => {
    const errors: string[] = [];
    const out = parseFields(
      [
        { type: 'link', key: 'link', label: 'Link' },
        { type: 'select', key: 'pick', label: 'Pick', options: [{ value: 'a', label: 'A' }] },
        { type: 'image', key: 'img', label: 'Image', required: true },
      ],
      source([
        ['link', 'javascript:alert(1)'],
        ['pick', 'zzz'],
        ['img', '../../etc/passwd'],
      ]),
      errors,
    );
    expect(errors).toHaveLength(3);
    expect(out.pick).toBe('a');
  });
});
