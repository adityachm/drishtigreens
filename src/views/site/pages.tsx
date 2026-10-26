import { urlAtLeast } from '../../lib/media.ts';
import { safeHref, telHref, whatsappHref } from '../../lib/util.ts';
import type { MajorProject, Service } from '../../content/schema.ts';
import { Btn, Gallery, Img, Layout, Paras, WhyBand, type Site } from './parts.tsx';

export type EnquiryValues = { name: string; phone: string; email: string; city: string; project_type: string; message: string };

export type ContactState = { sent: boolean; errors: string[]; values: EnquiryValues };

export const EMPTY_ENQUIRY: EnquiryValues = { name: '', phone: '', email: '', city: '', project_type: '', message: '' };

/** The whole website: one page, one section per menu item. */
export function HomePage({ site, contact }: { site: Site; contact: ContactState }) {
  const { home: h, about: a, services, projects, approach, contact: c, settings: st } = site.docs;
  const visibleServices = services.items.filter((s) => s.visible);
  const majorProjects = projects.items.filter((p) => p.visible);
  const galleryPhotos = projects.gallery.filter((p) => p.visible && site.media.has(p.image));
  const wa = whatsappHref(st.whatsapp, 'Hello Drishti Greens, I would like to discuss a landscaping project.');
  const scripts = site.turnstileKey ? <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script> : undefined;

  return (
    <Layout site={site} meta={{ title: h.seo_title, description: h.seo_description, image: h.hero[0]?.image }} scripts={scripts}>
      {/* ---- Home ---- */}
      <section class="hero" id="home" aria-roledescription="carousel" aria-label="Featured landscapes">
        {h.hero.map((s, i) => (
          <div class={`slide${i === 0 ? ' active' : ''}`} aria-roledescription="slide" aria-label={`${i + 1} of ${h.hero.length}`}>
            <Img site={site} id={s.image} sizes="100vw" eager={i === 0} />
            <div class="slide-copy on-photo">
              <div class="wrap">
                <div class="inner">
                  {s.eyebrow && <span class="eyebrow">{s.eyebrow}</span>}
                  {i === 0 ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
                  {s.text && <p>{s.text}</p>}
                  <div class="actions">
                    <Btn href={s.primary_link} label={s.primary_label} kind="gold" />
                    <Btn href={s.secondary_link} label={s.secondary_label} kind="ghost" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {h.hero.length > 1 && (
          <div class="hero-ctrl">
            <div class="wrap">
              <button type="button" data-hero="prev" aria-label="Previous slide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button type="button" data-hero="next" aria-label="Next slide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>
              <span class="counter">
                <b data-hero="cur">01</b> <span>/ {String(h.hero.length).padStart(2, '0')}</span>
              </span>
              <span class="progress" aria-hidden="true"><i data-hero="bar"></i></span>
            </div>
          </div>
        )}
      </section>

      <section class="intro section">
        <div class="wrap">
          <h2 class="statement">{h.intro_statement}</h2>
          <div class="body">
            <Paras text={h.intro_body} />
            <div class="actions">
              <a class="btn btn-line" href="/#about">About Drishti Greens</a>
              <a class="text-link" href="/#contact">Ask our team</a>
            </div>
          </div>
        </div>
      </section>

      {/* ---- About ---- */}
      <section class="about-sec section" id="about">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">About us</span>
            <h2 class="h2">{a.about_heading}</h2>
          </div>
          {a.about_image && (
            <figure class="about-photo">
              <Img site={site} id={a.about_image} sizes="(max-width: 1240px) 100vw, 1180px" />
              {a.stat_value && (
                <figcaption class="years">
                  <b>{a.stat_value}</b>
                  <span>{a.stat_label}</span>
                </figcaption>
              )}
            </figure>
          )}
          <div class="about-text">
            <Paras text={a.about_body} />
          </div>
          {a.about_quote && <p class="quote about-quote">{a.about_quote}</p>}
        </div>
      </section>

      <WhyBand site={site} />

      {/* ---- Services ---- */}
      <section class="section" id="services">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">What we do</span>
            <h2 class="h2">{services.heading}</h2>
          </div>
          <ServiceGrid site={site} items={visibleServices} />
        </div>
        <dialog class="svc-modal" aria-label="Service details">
          <button type="button" class="svc-modal-close" aria-label="Close">
            ×
          </button>
          <div class="svc-modal-body"></div>
        </dialog>
      </section>

      {/* ---- Projects ---- */}
      <section class="section white" id="projects">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Projects</span>
            <h2 class="h2">{projects.heading}</h2>
            {projects.intro && <p class="lede">{projects.intro}</p>}
          </div>
          <MajorProjects site={site} items={majorProjects} />
          {galleryPhotos.length > 0 && (
            <div class="gallery-block">
              <div class="section-head">
                <span class="eyebrow">Gallery</span>
                <h3 class="h2">{projects.gallery_heading}</h3>
                {projects.gallery_intro && <p class="lede">{projects.gallery_intro}</p>}
              </div>
              <Gallery site={site} items={galleryPhotos} />
            </div>
          )}
        </div>
      </section>

      {/* ---- Approach ---- */}
      <section class="section" id="approach">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Our approach</span>
            <h2 class="h2">{approach.heading}</h2>
          </div>
          <ol class="steps">
            {approach.steps.map((s) => (
              <li class="step">
                <span class="dot" aria-hidden="true"></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Contact ---- */}
      <section class="cta on-photo">
        <Img site={site} id={c.cta_image} sizes="100vw" alt="" />
        <div class="wrap">
          {c.cta_eyebrow && <span class="eyebrow">{c.cta_eyebrow}</span>}
          <h2 class="h2">{c.cta_heading}</h2>
          {c.cta_text && <p>{c.cta_text}</p>}
          <div class="actions">
            <a class="btn btn-gold" href="/#contact">
              Start a conversation
            </a>
            {wa && (
              <a class="btn btn-ghost" href={wa} rel="noopener">
                WhatsApp us
              </a>
            )}
          </div>
        </div>
      </section>

      <ContactSection site={site} state={contact} />
    </Layout>
  );
}

/** Seven cards fill a 4-column grid when the first spans two columns (2+1+1, then 4); other counts
 *  get the column count and lead card that leave no gaps where possible. */
function gridLayout(n: number): { cols: 3 | 4; wideLead: boolean } {
  if (n % 3 === 0) return { cols: 3, wideLead: false };
  if (n % 4 === 0) return { cols: 4, wideLead: false };
  if ((n + 1) % 4 === 0) return { cols: 4, wideLead: true };
  if ((n + 1) % 3 === 0) return { cols: 3, wideLead: true };
  return { cols: 3, wideLead: false };
}

function ServiceGrid({ site, items }: { site: Site; items: Service[] }) {
  const { cols, wideLead } = gridLayout(items.length);
  return (
    <div class={`services-grid cols-${cols}${wideLead ? ' wide-lead' : ''}`}>
      {items.map((s, i) => {
        const m = site.media.get(s.image);
        return (
          <article class="svc">
            <figure>
              <Img site={site} id={s.image} sizes={i === 0 && wideLead ? '(max-width: 640px) 100vw, 620px' : '(max-width: 640px) 100vw, (max-width: 960px) 50vw, 310px'} />
            </figure>
            <div class="txt">
              <h3>{s.title}</h3>
              <p>{s.summary}</p>
              <button type="button" class="more" data-service={i} aria-haspopup="dialog">
                Learn more<span class="sr-only"> about {s.title}</span>
              </button>
            </div>
            <template data-service-body={i}>
              {m && <img class="svc-modal-img" src={urlAtLeast(m, 960)} alt={m.alt} />}
              <div class="svc-modal-copy">
                <span class="eyebrow">Service</span>
                <h2 class="h2">{s.title}</h2>
                <Paras text={s.body || s.summary} />
                <div class="actions">
                  <a class="btn btn-gold" href="/#contact" data-close-service>
                    Discuss this service
                  </a>
                </div>
              </div>
            </template>
          </article>
        );
      })}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = { completed: 'Completed', 'in-progress': 'In progress' };

function ProjectMeta({ p }: { p: MajorProject }) {
  return (
    <>
      <div class="mp-head">
        <h3>{p.name}</h3>
        {p.status && <span class={`status status-${p.status}`}>{STATUS_LABEL[p.status]}</span>}
      </div>
      {p.description && <p>{p.description}</p>}
      {p.link && (
        <a class="text-link" href={safeHref(p.link)} target="_blank" rel="noopener">
          Visit website<span class="sr-only"> of {p.name} (opens in a new tab)</span>
        </a>
      )}
    </>
  );
}

/** Projects with a photo as large cards (with the client's logo if there is one); the rest as logo cards. */
function MajorProjects({ site, items }: { site: Site; items: MajorProject[] }) {
  const withPhoto = items.filter((p) => site.media.has(p.photo));
  const logoOnly = items.filter((p) => !site.media.has(p.photo));
  return (
    <>
      {withPhoto.length > 0 && (
        <div class={`mp-grid count-${Math.min(withPhoto.length, 3)}`}>
          {withPhoto.map((p) => (
            <article class="mp-card">
              <figure>
                <Img site={site} id={p.photo} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px" alt={`${p.name}: project photo`} />
              </figure>
              <div class="mp-body">
                {site.media.has(p.logo) && (
                  <span class="mp-logo">
                    <Img site={site} id={p.logo} sizes="200px" alt={`${p.name} logo`} />
                  </span>
                )}
                <ProjectMeta p={p} />
              </div>
            </article>
          ))}
        </div>
      )}
      {logoOnly.length > 0 && (
        <div class="mp-logos">
          {logoOnly.map((p) => (
            <article class="mp-logo-card">
              <span class="mp-logo mp-logo-lg">
                {site.media.has(p.logo) ? <Img site={site} id={p.logo} sizes="260px" alt={`${p.name} logo`} /> : <span class="mp-initial">{p.name}</span>}
              </span>
              <div class="mp-body">
                <ProjectMeta p={p} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function ContactSection({ site, state }: { site: Site; state: ContactState }) {
  const c = site.docs.contact;
  const s = site.docs.settings;
  const wa = whatsappHref(s.whatsapp);
  const { values } = state;
  return (
    <section class="contact section" id="contact">
      <div class="wrap">
        <div class="info">
          <div class="section-head">
            <span class="eyebrow">Contact</span>
            <h2 class="h2">{c.heading}</h2>
            <p class="lede">{c.intro}</p>
          </div>
          {(s.phone || s.whatsapp || s.email || s.address) && (
            <dl class="info-list">
              {s.phone && (
                <div><dt>Phone</dt><dd><a href={telHref(s.phone)}>{s.phone}</a></dd></div>
              )}
              {wa && (
                <div><dt>WhatsApp</dt><dd><a href={wa} rel="noopener">Chat on WhatsApp</a></dd></div>
              )}
              {s.email && (
                <div><dt>Email</dt><dd><a href={`mailto:${s.email}`}>{s.email}</a></dd></div>
              )}
              {s.address && (
                <div><dt>Office</dt><dd class="addr">{s.address}</dd></div>
              )}
            </dl>
          )}
          {s.service_areas.length > 0 && (
            <div class="areas-block">
              <span class="eyebrow">Areas we serve</span>
              <div class="areas">
                {s.service_areas.map((a) => (
                  <span>{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        {state.sent ? (
          <div class="form form-done" role="status">
            <h3>Enquiry sent</h3>
            <p>{c.success_message}</p>
            <a class="btn btn-line" href="/#home">Back to top</a>
          </div>
        ) : (
          <form class="form" method="post" action="/contact#contact">
            {state.errors.length > 0 && (
              <div class="form-errors" role="alert">
                {state.errors.map((e) => (
                  <p>{e}</p>
                ))}
              </div>
            )}
            <div class="field">
              <label for="f-name">Name</label>
              <input id="f-name" name="name" autocomplete="name" required maxlength={100} value={values.name} />
            </div>
            <div class="field">
              <label for="f-phone">Phone</label>
              <input id="f-phone" name="phone" type="tel" autocomplete="tel" required maxlength={30} value={values.phone} />
            </div>
            <div class="field">
              <label for="f-email">Email <span class="opt">(optional)</span></label>
              <input id="f-email" name="email" type="email" autocomplete="email" maxlength={120} value={values.email} />
            </div>
            <div class="field">
              <label for="f-city">City</label>
              <input id="f-city" name="city" autocomplete="address-level2" maxlength={80} value={values.city} />
            </div>
            {c.project_types.length > 0 && (
              <div class="field full">
                <label for="f-type">Project type</label>
                <select id="f-type" name="project_type">
                  {c.project_types.map((t) => (
                    <option selected={t === values.project_type}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <div class="field full">
              <label for="f-msg">About your space</label>
              <textarea id="f-msg" name="message" rows={5} maxlength={3000} placeholder="Site size, location, what you would like to change">
                {values.message}
              </textarea>
            </div>
            <div class="hp" aria-hidden="true">
              <label for="f-website">Leave this empty</label>
              <input id="f-website" name="website" tabindex={-1} autocomplete="off" />
            </div>
            {site.turnstileKey && <div class="cf-turnstile full" data-sitekey={site.turnstileKey}></div>}
            <button class="btn btn-gold" type="submit">Send enquiry</button>
          </form>
        )}
      </div>
    </section>
  );
}

export function NotFoundPage({ site }: { site: Site }) {
  return (
    <Layout site={site} meta={{ title: 'Page not found | Drishti Greens', description: 'This page could not be found.' }}>
      <section class="section notfound">
        <div class="wrap">
          <span class="eyebrow">404</span>
          <h1 class="h2">This page could not be found</h1>
          <p class="lede">The link may be old, or the page may have moved.</p>
          <div class="actions">
            <a class="btn btn-gold" href="/#home">Go to the website</a>
            <a class="btn btn-line" href="/#projects">See our projects</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
