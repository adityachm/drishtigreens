import { DOCS } from '../../content/schema.ts';
import { urlAtLeast, type Media } from '../../lib/media.ts';
import { telHref } from '../../lib/util.ts';

export type Enquiry = {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  project_type: string;
  message: string;
  status: 'new' | 'handled';
  created_at: string;
};

function when(sqlDate: string): string {
  const d = new Date(sqlDate.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function Dashboard({ recent, newCount }: { recent: Enquiry[]; newCount: number }) {
  return (
    <>
      <div class="page-head">
        <div>
          <h1>Dashboard</h1>
          <p class="muted">Choose what you want to change. Saved changes go live on the website straight away.</p>
        </div>
      </div>
      <div class="tiles">
        {DOCS.map((d) => (
          <a class="tile" href={`/admin/edit/${d.key}`}>
            <h2>{d.title}</h2>
            <p>{d.description}</p>
          </a>
        ))}
        <a class="tile" href="/admin/media">
          <h2>Photos</h2>
          <p>Upload photos, edit their descriptions and remove ones you no longer use.</p>
        </a>
      </div>
      <section class="card">
        <div class="card-head">
          <h2>Latest enquiries</h2>
          <a href="/admin/enquiries">{newCount > 0 ? `${newCount} new · ` : ''}See all</a>
        </div>
        {recent.length === 0 ? (
          <p class="muted">No enquiries yet. Messages sent from the website’s contact form will appear here.</p>
        ) : (
          <ul class="enq-mini">
            {recent.map((e) => (
              <li>
                <strong>{e.name}</strong> · {e.project_type || 'Enquiry'} · <span class="muted">{when(e.created_at)}</span>
                {e.status === 'new' && <span class="tag tag-gold">New</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function MediaPage({ items, used }: { items: Media[]; used: Set<string> }) {
  return (
    <>
      <div class="page-head">
        <div>
          <h1>Photos</h1>
          <p class="muted">
            Photos are resized automatically for phones and computers. Add a short description of each photo for people using
            screen readers and for Google.
          </p>
        </div>
        <label class="a-btn a-btn-primary">
          Upload photos
          <input type="file" accept="image/*" multiple data-media-upload hidden />
        </label>
      </div>
      <p class="muted" data-upload-status role="status"></p>
      {items.length === 0 ? (
        <p class="card muted">No photos yet. Upload your first photo with the button above.</p>
      ) : (
        <div class="media-grid">
          {items.map((m) => (
            <article class="media-card">
              <a href={urlAtLeast(m, 1600)} target="_blank" rel="noopener">
                <img src={urlAtLeast(m, 480)} alt={m.alt} loading="lazy" />
              </a>
              <form method="post" action={`/admin/media/${m.id}`} class="stack">
                <label for={`alt-${m.id}`}>Description</label>
                <textarea id={`alt-${m.id}`} name="alt" rows={2} maxlength={250}>
                  {m.alt}
                </textarea>
                <div class="row">
                  <button type="submit" class="a-btn">Save</button>
                  <span class="muted small">
                    {m.width}×{m.height}
                  </span>
                </div>
              </form>
              {used.has(m.id) ? (
                <p class="small muted">Used on the website</p>
              ) : (
                <details class="confirm">
                  <summary>Delete</summary>
                  <form method="post" action={`/admin/media/${m.id}/delete`}>
                    <p class="small">This photo is not used anywhere. Delete it permanently?</p>
                    <button type="submit" class="a-btn a-btn-danger">Yes, delete</button>
                  </form>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function EnquiriesPage({ items, filter }: { items: Enquiry[]; filter: string }) {
  const tabs: [string, string][] = [
    ['new', 'New'],
    ['handled', 'Handled'],
    ['all', 'All'],
  ];
  return (
    <>
      <div class="page-head">
        <div>
          <h1>Enquiries</h1>
          <p class="muted">Messages from the contact form. Mark each one as handled once you have replied.</p>
        </div>
      </div>
      <nav class="tabs" aria-label="Filter enquiries">
        {tabs.map(([k, label]) => (
          <a href={`/admin/enquiries?show=${k}`} class={filter === k ? 'active' : undefined} aria-current={filter === k ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </nav>
      {items.length === 0 ? (
        <p class="card muted">Nothing here.</p>
      ) : (
        <div class="enq-list">
          {items.map((e) => (
            <article class={`card enq ${e.status}`}>
              <div class="card-head">
                <h2>
                  {e.name} {e.status === 'new' && <span class="tag tag-gold">New</span>}
                </h2>
                <span class="muted small">{when(e.created_at)}</span>
              </div>
              <dl class="enq-meta">
                <div><dt>Phone</dt><dd><a href={telHref(e.phone)}>{e.phone}</a></dd></div>
                {e.email && <div><dt>Email</dt><dd><a href={`mailto:${e.email}`}>{e.email}</a></dd></div>}
                {e.city && <div><dt>City</dt><dd>{e.city}</dd></div>}
                {e.project_type && <div><dt>Project</dt><dd>{e.project_type}</dd></div>}
              </dl>
              {e.message && <p class="enq-msg">{e.message}</p>}
              <div class="row">
                <form method="post" action={`/admin/enquiries/${e.id}/status`}>
                  <input type="hidden" name="status" value={e.status === 'new' ? 'handled' : 'new'} />
                  <button type="submit" class="a-btn">{e.status === 'new' ? 'Mark as handled' : 'Mark as new'}</button>
                </form>
                <details class="confirm">
                  <summary>Delete</summary>
                  <form method="post" action={`/admin/enquiries/${e.id}/delete`}>
                    <button type="submit" class="a-btn a-btn-danger">Yes, delete</button>
                  </form>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export function AccountPage({ errors }: { errors: string[] }) {
  return (
    <>
      <div class="page-head">
        <div>
          <h1>Change password</h1>
          <p class="muted">Changing the password signs out every other device.</p>
        </div>
      </div>
      {errors.length > 0 && (
        <div class="flash flash-error" role="alert">
          {errors.map((e) => (
            <p>{e}</p>
          ))}
        </div>
      )}
      <form method="post" class="card stack narrow">
        <input type="text" name="username" value="admin" autocomplete="username" hidden />
        <label for="current">Current password</label>
        <input id="current" name="current" type="password" autocomplete="current-password" required />
        <label for="next">New password</label>
        <input id="next" name="next" type="password" autocomplete="new-password" required minlength={10} />
        <p class="help">At least 10 characters. A short sentence is easy to remember and hard to guess.</p>
        <label for="confirm">Repeat new password</label>
        <input id="confirm" name="confirm" type="password" autocomplete="new-password" required minlength={10} />
        <div>
          <button type="submit" class="a-btn a-btn-primary">Change password</button>
        </div>
      </form>
    </>
  );
}
