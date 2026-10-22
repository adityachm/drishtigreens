// Field definitions drive both the admin editor (form rendering) and validation of what it submits.
// Form names are dotted paths: `hero.<token>.title`. Each list item also submits `<list>.__order=<token>`,
// so item order follows the DOM, which the editor can reorder freely.

import { isSafeHref } from '../lib/util.ts';
import { MEDIA_ID } from '../lib/media.ts';

export type Option = { value: string; label: string };

type Base = { key: string; label: string; help?: string };

export type Field =
  | (Base & { type: 'text'; max?: number; required?: boolean; placeholder?: string })
  | (Base & { type: 'textarea'; max?: number; rows?: number; required?: boolean; placeholder?: string })
  | (Base & { type: 'link'; placeholder?: string })
  | (Base & { type: 'slug' })
  | (Base & { type: 'image'; required?: boolean })
  | (Base & { type: 'select'; options: Option[] })
  | (Base & { type: 'checkbox' })
  | (Base & { type: 'lines'; max?: number })
  | (Base & { type: 'list'; itemLabel: string; titleKey: string; fields: Field[]; min?: number; max?: number });

export type Section = { title: string; help?: string; fields: Field[] };

export interface FormSource {
  get(name: string): string | null;
  getAll(name: string): string[];
}

export function formSource(form: FormData): FormSource {
  return {
    get: (n) => {
      const v = form.get(n);
      return typeof v === 'string' ? v : null;
    },
    getAll: (n) => form.getAll(n).filter((v): v is string => typeof v === 'string'),
  };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOKEN = /^[A-Za-z0-9_]{1,40}$/;

export function parseFields(
  fields: Field[],
  src: FormSource,
  errors: string[],
  prefix = '',
  where = '',
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const name = prefix + f.key;
    const label = where + f.label;
    const raw = src.get(name) ?? '';
    switch (f.type) {
      case 'text': {
        const v = raw.trim();
        if (f.required && !v) errors.push(`${label} is required.`);
        if (v.length > (f.max ?? 200)) errors.push(`${label} is too long (max ${f.max ?? 200} characters).`);
        out[f.key] = v;
        break;
      }
      case 'textarea': {
        const v = raw.replace(/\r\n/g, '\n').trim();
        if (f.required && !v) errors.push(`${label} is required.`);
        if (v.length > (f.max ?? 4000)) errors.push(`${label} is too long (max ${f.max ?? 4000} characters).`);
        out[f.key] = v;
        break;
      }
      case 'link': {
        const v = raw.trim();
        if (!isSafeHref(v)) errors.push(`${label} must start with /, #, https://, mailto: or tel:.`);
        if (v.length > 500) errors.push(`${label} is too long.`);
        out[f.key] = v;
        break;
      }
      case 'slug': {
        const v = raw.trim().toLowerCase();
        if (!SLUG.test(v)) errors.push(`${label} must be lowercase words joined by hyphens, e.g. vertical-gardens.`);
        out[f.key] = v;
        break;
      }
      case 'image': {
        const v = raw.trim();
        if (v && !MEDIA_ID.test(v)) errors.push(`${label} has an invalid image.`);
        if (f.required && !v) errors.push(`${label} needs an image.`);
        out[f.key] = v;
        break;
      }
      case 'select': {
        const ok = f.options.some((o) => o.value === raw);
        if (!ok) errors.push(`${label} has an unknown choice.`);
        out[f.key] = ok ? raw : f.options[0]?.value ?? '';
        break;
      }
      case 'checkbox':
        out[f.key] = raw === 'on';
        break;
      case 'lines': {
        const lines = raw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > (f.max ?? 40)) errors.push(`${label} has too many lines (max ${f.max ?? 40}).`);
        if (lines.some((l) => l.length > 200)) errors.push(`${label} has a line longer than 200 characters.`);
        out[f.key] = lines;
        break;
      }
      case 'list': {
        const tokens = [...new Set(src.getAll(`${name}.__order`))].filter((t) => TOKEN.test(t));
        const items = tokens.map((t, i) => parseFields(f.fields, src, errors, `${name}.${t}.`, `${f.itemLabel} ${i + 1}: `));
        if (f.min !== undefined && items.length < f.min) errors.push(`${label} needs at least ${f.min} item(s).`);
        if (f.max !== undefined && items.length > f.max) errors.push(`${label} can have at most ${f.max} items.`);
        for (const sf of f.fields) {
          if (sf.type !== 'slug') continue;
          const seen = new Set<string>();
          for (const it of items) {
            const s = it[sf.key] as string;
            if (seen.has(s)) errors.push(`${label}: the ${sf.label.toLowerCase()} "${s}" is used twice.`);
            seen.add(s);
          }
        }
        out[f.key] = items;
        break;
      }
    }
  }
  return out;
}

export function parseSections(sections: Section[], src: FormSource, errors: string[]): Record<string, unknown> {
  return parseFields(
    sections.flatMap((s) => s.fields),
    src,
    errors,
  );
}

/** Flattens a document into form entries, the inverse of parseFields. Used by tests. */
export function toFormEntries(fields: Field[], value: Record<string, unknown>, prefix = ''): [string, string][] {
  const out: [string, string][] = [];
  for (const f of fields) {
    const name = prefix + f.key;
    const v = value[f.key];
    if (f.type === 'list') {
      (v as Record<string, unknown>[]).forEach((item, i) => {
        out.push([`${name}.__order`, `t${i}`]);
        out.push(...toFormEntries(f.fields, item, `${name}.t${i}.`));
      });
    } else if (f.type === 'checkbox') {
      if (v) out.push([name, 'on']);
    } else if (f.type === 'lines') {
      out.push([name, (v as string[]).join('\n')]);
    } else {
      out.push([name, String(v ?? '')]);
    }
  }
  return out;
}
