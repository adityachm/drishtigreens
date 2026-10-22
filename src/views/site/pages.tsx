import { urlAtLeast } from '../../lib/media.ts';
import { telHref, whatsappHref } from '../../lib/util.ts';
import { Btn, Gallery, Img, Layout, Paras, WhyBand, categoryLabel, type Site } from './parts.tsx';

export type EnquiryValues = { name: string; phone: string; email: string; city: string; project_type: string; message: string };

export type ContactState = { sent: boolean; errors: string[]; values: EnquiryValues };

export const EMPTY_ENQUIRY: EnquiryValues = { name: '', phone: '', email: '', city: '', project_type: '', message: '' };

/** The whole website: one page, one section per menu item. */
export function HomePage({ site, category, contact }: { site: Site; category: string; contact: ContactState }) {
  const { home: h, about: a, services, projects, approach, contact: c, settings: st } = site.docs;
  const visibleServices = services.items.filter((s) => s.visible);
  const visibleProjects = projects.items.filter((p) => p.visible);
  const initial = visibleProjects.some((p) => p.category === category) ? category : 'featured';
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
      <section class="profile section" id="about">
        <div class="wrap">
          <div class="photo-stack">
            <Img site={site} id={a.about_image_main} class="a" sizes="(max-width: 960px) 90vw, 560px" />
            {a.about_image_inset && (
              <div class="b-wrap">
                <Img site={site} id={a.about_image_inset} class="b" sizes="(max-width: 960px) 45vw, 280px" />
              </div>
            )}
            {a.stat_value && (
              <div class="years">
                <b>{a.stat_value}</b>
                <span>{a.stat_label}</span>
              </div>
            )}
          </div>
          <div class="copy">
            <span class="eyebrow">About us</span>
            <h2 class="h2">{a.about_heading}</h2>
            <Paras text={a.about_body} />
            {a.about_quote && <p class="quote">{a.about_quote}</p>}
          </div>
        </div>
      </section>

      {a.philosophy_body && (
        <section class="section split-section reverse">
          <div class="wrap">
            <div class="copy">
              <span class="eyebrow">Our philosophy</span>
              <h2 class="h2">{a.philosophy_heading}</h2>
              <Paras text={a.philosophy_body} />
            </div>
            <Img site={site} id={a.philosophy_image} class="split-img" sizes="(max-width: 960px) 90vw, 560px" />
          </div>
        </section>
      )}

      <WhyBand site={site} />

      {/* ---- Services ---- */}
      <section class="section" id="services">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">What we do</span>
            <h2 class="h2">{services.heading}</h2>
          </div>
          <div class="services-grid">
            {visibleServices.map((s, i) => {
              const m = site.media.get(s.image);
              const hasRelated = s.category && visibleProjects.some((p) => p.category === s.category);
              return (
                <article class="svc">
                  <figure>
                    <Img site={site} id={s.image} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px" />
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
                        {hasRelated && (
                          <a class="btn btn-line" href="/#projects" data-show-category={s.category} data-close-service>
                            See {categoryLabel(s.category).toLowerCase()}
                          </a>
                        )}
                      </div>
                    </div>
                  </template>
                </article>
              );
            })}
          </div>
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
            <span class="eyebrow">Projects &amp; gallery</span>
            <h2 class="h2">{projects.heading}</h2>
          </div>
          <Gallery site={site} items={visibleProjects} initial={initial} chips="home" />
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
