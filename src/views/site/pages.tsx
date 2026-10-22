import type { Service } from '../../content/schema.ts';
import { telHref, whatsappHref } from '../../lib/util.ts';
import { Approach, Banner, Btn, CtaBand, Gallery, Img, Layout, Paras, WhyBand, type Site } from './parts.tsx';

export function HomePage({ site }: { site: Site }) {
  const h = site.docs.home;
  const services = site.docs.services.items.filter((s) => s.visible).slice(0, 9);
  const projects = site.docs.projects.items.filter((p) => p.visible);
  return (
    <Layout site={site} meta={{ title: h.seo_title, description: h.seo_description, image: h.hero[0]?.image }}>
      <section class="hero" aria-roledescription="carousel" aria-label="Featured landscapes">
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
              <a class="btn btn-line" href="/about">About Drishti Greens</a>
              <a class="text-link" href="/contact">Ask our team</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section-head split">
            <div>
              <span class="eyebrow">What we do</span>
              <h2 class="h2">{h.services_heading}</h2>
            </div>
            <a class="text-link" href="/services">All services</a>
          </div>
          <ServiceGrid site={site} items={services} />
        </div>
      </section>

      <section class="profile section">
        <div class="wrap">
          <div class="photo-stack">
            <Img site={site} id={h.about_image_main} class="a" sizes="(max-width: 960px) 90vw, 560px" />
            {h.about_image_inset && (
              <div class="b-wrap">
                <Img site={site} id={h.about_image_inset} class="b" sizes="(max-width: 960px) 45vw, 280px" />
              </div>
            )}
            {h.stat_value && (
              <div class="years">
                <b>{h.stat_value}</b>
                <span>{h.stat_label}</span>
              </div>
            )}
          </div>
          <div class="copy">
            <span class="eyebrow">Our profile</span>
            <h2 class="h2">{h.about_heading}</h2>
            <Paras text={h.about_body} />
            {h.about_quote && <p class="quote">{h.about_quote}</p>}
            <div>
              <a class="btn btn-line" href="/about">Read our story</a>
            </div>
          </div>
        </div>
      </section>

      <WhyBand site={site} />

      <section class="section">
        <div class="wrap">
          <div class="section-head split">
            <div>
              <span class="eyebrow">Projects &amp; gallery</span>
              <h2 class="h2">{h.projects_heading}</h2>
            </div>
            <a class="text-link" href="/projects">View all projects</a>
          </div>
          <Gallery site={site} items={projects} initial="featured" chips="home" />
        </div>
      </section>

      <Approach site={site} white />
      <CtaBand site={site} />
    </Layout>
  );
}

function ServiceGrid({ site, items }: { site: Site; items: Service[] }) {
  return (
    <div class="services-grid">
      {items.map((s) => (
        <a class="svc" href={`/services/${s.slug}`}>
          <figure>
            <Img site={site} id={s.image} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px" />
          </figure>
          <div class="txt">
            <h3>{s.title}</h3>
            <p>{s.summary}</p>
            <span class="more">Learn more</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function AboutPage({ site }: { site: Site }) {
  const a = site.docs.about;
  return (
    <Layout site={site} meta={{ title: a.seo_title, description: a.seo_description, image: a.banner_image }}>
      <Banner site={site} image={a.banner_image} title={a.banner_title} text={a.banner_text} />
      <section class="section split-section">
        <div class="wrap">
          <div class="copy">
            <span class="eyebrow">Our story</span>
            <h2 class="h2">{a.story_heading}</h2>
            <Paras text={a.story_body} />
          </div>
          <Img site={site} id={a.story_image} class="split-img" sizes="(max-width: 960px) 90vw, 560px" />
        </div>
      </section>
      <section class="section split-section reverse white">
        <div class="wrap">
          <div class="copy">
            <span class="eyebrow">Our philosophy</span>
            <h2 class="h2">{a.philosophy_heading}</h2>
            <Paras text={a.philosophy_body} />
          </div>
          <Img site={site} id={a.philosophy_image} class="split-img" sizes="(max-width: 960px) 90vw, 560px" />
        </div>
      </section>
      <WhyBand site={site} />
      <Approach site={site} white />
      {a.closing_line && (
        <section class="closing section">
          <div class="wrap">
            <p class="closing-line">{a.closing_line}</p>
            {a.closing_sub && <p class="closing-sub">{a.closing_sub}</p>}
          </div>
        </section>
      )}
      <CtaBand site={site} />
    </Layout>
  );
}

export function ServicesPage({ site }: { site: Site }) {
  const s = site.docs.services;
  return (
    <Layout site={site} meta={{ title: s.seo_title, description: s.seo_description, image: s.banner_image }}>
      <Banner site={site} image={s.banner_image} title={s.banner_title} text={s.banner_text} />
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">What we do</span>
            <h2 class="h2">{s.heading}</h2>
          </div>
          <ServiceGrid site={site} items={s.items.filter((x) => x.visible)} />
        </div>
      </section>
      <Approach site={site} white />
      <CtaBand site={site} />
    </Layout>
  );
}

export function ServicePage({ site, service }: { site: Site; service: Service }) {
  const related = service.category
    ? site.docs.projects.items.filter((p) => p.visible && p.category === service.category)
    : [];
  const others = site.docs.services.items.filter((x) => x.visible && x.slug !== service.slug);
  const st = site.docs.settings;
  const wa = whatsappHref(st.whatsapp, `Hello Drishti Greens, I would like to discuss ${service.title.toLowerCase()}.`);
  return (
    <Layout
      site={site}
      meta={{ title: `${service.title} | Drishti Greens`, description: service.summary, image: service.image }}
    >
      <Banner site={site} image={service.image} title={service.title} text={service.summary} crumb={['/services', 'Services']} />
      <section class="section">
        <div class="wrap service-detail">
          <div class="copy">
            <Paras text={service.body} />
          </div>
          <aside class="enquire">
            <h2>Discuss your project</h2>
            <p>Tell us about your site and what you would like to achieve. We will get back to you to arrange a consultation.</p>
            <a class="btn btn-gold" href="/contact">Send an enquiry</a>
            {wa && <a class="btn btn-line" href={wa} rel="noopener">WhatsApp us</a>}
            {st.phone && <p class="enquire-phone">Or call <a href={telHref(st.phone)}>{st.phone}</a></p>}
          </aside>
        </div>
      </section>
      {related.length > 0 && (
        <section class="section white">
          <div class="wrap">
            <div class="section-head">
              <span class="eyebrow">Related work</span>
              <h2 class="h2">Projects</h2>
            </div>
            <Gallery site={site} items={related} initial="all" chips="none" />
          </div>
        </section>
      )}
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">More services</span>
          </div>
          <ul class="other-services">
            {others.map((o) => (
              <li><a href={`/services/${o.slug}`}>{o.title}</a></li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand site={site} />
    </Layout>
  );
}

export function ProjectsPage({ site, category }: { site: Site; category: string }) {
  const p = site.docs.projects;
  const items = p.items.filter((x) => x.visible);
  const initial = items.some((x) => x.category === category) ? category : 'all';
  return (
    <Layout site={site} meta={{ title: p.seo_title, description: p.seo_description, image: p.banner_image }}>
      <Banner site={site} image={p.banner_image} title={p.banner_title} text={p.banner_text} />
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <span class="eyebrow">Projects &amp; gallery</span>
            <h2 class="h2">{p.heading}</h2>
          </div>
          <Gallery site={site} items={items} initial={initial} chips="all" />
        </div>
      </section>
      <CtaBand site={site} />
    </Layout>
  );
}

export type EnquiryValues = { name: string; phone: string; email: string; city: string; project_type: string; message: string };

export function ContactPage({ site, sent, errors, values }: { site: Site; sent: boolean; errors: string[]; values: EnquiryValues }) {
  const c = site.docs.contact;
  const s = site.docs.settings;
  const wa = whatsappHref(s.whatsapp);
  const scripts = site.turnstileKey ? (
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  ) : undefined;
  return (
    <Layout site={site} meta={{ title: c.seo_title, description: c.seo_description, image: c.banner_image }} scripts={scripts}>
      <Banner site={site} image={c.banner_image} title={c.banner_title} text={c.banner_text} />
      <section class="contact section" id="enquiry">
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
          {sent ? (
            <div class="form form-done" role="status">
              <h3>Enquiry sent</h3>
              <p>{c.success_message}</p>
              <a class="btn btn-line" href="/">Back to home</a>
            </div>
          ) : (
            <form class="form" method="post" action="/contact#enquiry">
              {errors.length > 0 && (
                <div class="form-errors" role="alert">
                  {errors.map((e) => (
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
    </Layout>
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
            <a class="btn btn-gold" href="/">Go to the home page</a>
            <a class="btn btn-line" href="/projects">See our projects</a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
