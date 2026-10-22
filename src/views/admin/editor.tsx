import type { Field } from '../../content/fields.ts';
import type { DocDef } from '../../content/schema.ts';
import { urlAtLeast, type MediaMap } from '../../lib/media.ts';

type Value = Record<string, unknown>;

function blankItem(fields: Field[]): Value {
  const out: Value = {};
  for (const f of fields) {
    if (f.type === 'checkbox') out[f.key] = f.key === 'visible';
    else if (f.type === 'select') out[f.key] = f.options[0]?.value ?? '';
    else if (f.type === 'list' || f.type === 'lines') out[f.key] = [];
    else out[f.key] = '';
  }
  return out;
}

function ImageField({ name, id, media, label }: { name: string; id: string; media: MediaMap; label: string }) {
  const m = id ? media.get(id) : undefined;
  return (
    <div class="img-field" data-image-field>
      <input type="hidden" name={name} value={id} />
      <div class="img-preview">
        {m ? <img src={urlAtLeast(m, 480)} alt="" /> : <span class="muted">{id ? 'Image not found' : 'No image'}</span>}
      </div>
      <div class="img-actions">
        <button type="button" class="a-btn" data-pick-image aria-label={`Choose image for ${label}`}>
          Choose image
        </button>
        <button type="button" class="a-btn a-btn-quiet" data-clear-image hidden={!id}>
          Remove
        </button>
      </div>
    </div>
  );
}

function FieldRow({ f, prefix, value, media }: { f: Field; prefix: string; value: Value; media: MediaMap }) {
  const name = prefix + f.key;
  const id = 'f_' + name.replace(/[^A-Za-z0-9_]/g, '_');
  const v = value[f.key];
  const help = f.help ? <p class="help">{f.help}</p> : null;

  if (f.type === 'checkbox') {
    return (
      <div class="field field-check">
        <label>
          <input type="checkbox" name={name} checked={Boolean(v)} /> {f.label}
        </label>
        {help}
      </div>
    );
  }
  if (f.type === 'list') return <ListField f={f} name={name} items={(v as Value[]) ?? []} media={media} />;

  let control;
  switch (f.type) {
    case 'textarea':
      control = (
        <textarea id={id} name={name} rows={f.rows ?? 4} maxlength={f.max ?? 4000} placeholder={f.placeholder}>
          {String(v ?? '')}
        </textarea>
      );
      break;
    case 'lines':
      control = (
        <textarea id={id} name={name} rows={Math.min(8, Math.max(3, ((v as string[]) ?? []).length + 1))}>
          {((v as string[]) ?? []).join('\n')}
        </textarea>
      );
      break;
    case 'image':
      control = <ImageField name={name} id={String(v ?? '')} media={media} label={f.label} />;
      break;
    case 'select':
      control = (
        <select id={id} name={name}>
          {f.options.map((o) => (
            <option value={o.value} selected={o.value === v}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'slug':
      control = <input id={id} name={name} value={String(v ?? '')} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength={80} />;
      break;
    case 'link':
      control = <input id={id} name={name} value={String(v ?? '')} placeholder={f.placeholder} maxlength={500} />;
      break;
    default:
      control = (
        <input
          id={id}
          name={name}
          value={String(v ?? '')}
          maxlength={f.max ?? 200}
          placeholder={f.placeholder}
        />
      );
  }
  return (
    <div class="field">
      {f.type === 'image' ? <span class="label">{f.label}</span> : <label for={id}>{f.label}</label>}
      {control}
      {help}
    </div>
  );
}

function ListItem({ f, name, token, item, media, open }: { f: Extract<Field, { type: 'list' }>; name: string; token: string; item: Value; media: MediaMap; open?: boolean }) {
  const title = String(item[f.titleKey] ?? '') || `New ${f.itemLabel.toLowerCase()}`;
  const hiddenItem = item.visible === false;
  const img = f.fields.find((x) => x.type === 'image');
  const thumb = img ? media.get(String(item[img.key] ?? '')) : undefined;
  return (
    <details class="item" open={open} data-item data-title-key={f.titleKey}>
      <summary>
        {thumb ? <img class="item-thumb" src={urlAtLeast(thumb, 480)} alt="" /> : <span class="item-thumb" />}
        <span class="item-title">{title}</span>
        {hiddenItem && <span class="tag">Hidden</span>}
        {item.featured === true && <span class="tag tag-gold">Featured</span>}
        <span class="item-actions">
          <button type="button" class="icon-btn" data-move="-1" aria-label="Move up">↑</button>
          <button type="button" class="icon-btn" data-move="1" aria-label="Move down">↓</button>
          <button type="button" class="icon-btn danger" data-remove aria-label={`Remove this ${f.itemLabel.toLowerCase()}`}>✕</button>
        </span>
      </summary>
      <div class="item-body">
        <input type="hidden" name={`${name}.__order`} value={token} />
        {f.fields.map((sf) => (
          <FieldRow f={sf} prefix={`${name}.${token}.`} value={item} media={media} />
        ))}
      </div>
    </details>
  );
}

function ListField({ f, name, items, media }: { f: Extract<Field, { type: 'list' }>; name: string; items: Value[]; media: MediaMap }) {
  return (
    <div class="list" data-list={name} data-max={f.max ?? ''}>
      <div class="list-head">
        <span class="label">{f.label}</span>
        <span class="muted">{items.length} {items.length === 1 ? f.itemLabel.toLowerCase() : `${f.itemLabel.toLowerCase()}s`}</span>
      </div>
      <div class="items">
        {items.map((it, i) => (
          <ListItem f={f} name={name} token={`i${i}`} item={it} media={media} />
        ))}
      </div>
      <template>
        <ListItem f={f} name={name} token="__TOKEN__" item={blankItem(f.fields)} media={media} open />
      </template>
      <button type="button" class="a-btn" data-add-item>
        + Add {f.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

export function Editor({ def, value, media, errors }: { def: DocDef; value: Value; media: MediaMap; errors: string[] }) {
  return (
    <>
      <div class="page-head">
        <div>
          <h1>{def.title}</h1>
          <p class="muted">{def.description}</p>
        </div>
        <a class="a-btn a-btn-quiet" href={def.publicPath} target="_blank" rel="noopener">
          View page ↗
        </a>
      </div>
      {errors.length > 0 && (
        <div class="flash flash-error" role="alert">
          <strong>Nothing was saved. Please fix:</strong>
          <ul>
            {errors.map((e) => (
              <li>{e}</li>
            ))}
          </ul>
        </div>
      )}
      <form method="post" class="editor" data-editor>
        {def.sections.map((s) => (
          <section class="card">
            <h2>{s.title}</h2>
            {s.help && <p class="help">{s.help}</p>}
            {s.fields.map((f) => (
              <FieldRow f={f} prefix="" value={value} media={media} />
            ))}
          </section>
        ))}
        <div class="save-bar">
          <span class="muted" data-dirty-note hidden>
            You have unsaved changes
          </span>
          <button type="submit" class="a-btn a-btn-primary">
            Save and publish
          </button>
        </div>
      </form>
      <MediaPicker />
    </>
  );
}

export function MediaPicker() {
  return (
    <dialog class="picker" data-picker aria-labelledby="picker-title">
      <div class="picker-head">
        <h2 id="picker-title">Choose an image</h2>
        <button type="button" class="icon-btn" data-picker-close aria-label="Close">✕</button>
      </div>
      <div class="picker-upload">
        <label class="a-btn a-btn-primary">
          Upload new photo
          <input type="file" accept="image/*" data-picker-upload hidden />
        </label>
        <span class="muted" data-picker-status></span>
      </div>
      <div class="picker-grid" data-picker-grid>
        <p class="muted">Loading…</p>
      </div>
    </dialog>
  );
}
