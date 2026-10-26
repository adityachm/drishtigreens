import type { Child } from 'hono/jsx';
import { raw } from 'hono/html';
import type { Docs, GalleryPhoto } from '../../content/schema.ts';
import { srcset, urlAtLeast, type MediaMap } from '../../lib/media.ts';
import { paragraphs, safeHref, telHref, whatsappHref } from '../../lib/util.ts';

export type Site = {
  docs: Docs;
  media: MediaMap;
  /** Cache-busting version for /static files. */
  v: string;
  path: string;
  origin: string;
  turnstileKey: string;
};

export type PageMeta = { title: string; description: string; image?: string };

/** The page's sections, in order. The menu, footer and buttons all link to these. */
export const SECTIONS: [string, string][] = [
  ['home', 'Home'],
  ['about', 'About'],
  ['services', 'Services'],
  ['projects', 'Projects'],
  ['approach', 'Approach'],
  ['contact', 'Contact'],
];

// ---- Small building blocks ----

export function Img(props: {
  site: Site;
  id: string | undefined;
  sizes: string;
  alt?: string;
  class?: string;
  eager?: boolean;
  style?: string;
}) {
  const m = props.id ? props.site.media.get(props.id) : undefined;
  if (!m) return <div class={`img-missing ${props.class ?? ''}`} aria-hidden="true"></div>;
  return (
    <img
      src={urlAtLeast(m, 960)}
      srcset={srcset(m)}
      sizes={props.sizes}
      width={m.width}
      height={m.height}
      alt={props.alt ?? m.alt}
      class={props.class}
      style={props.style}
      loading={props.eager ? 'eager' : 'lazy'}
      fetchpriority={props.eager ? 'high' : undefined}
      decoding="async"
    />
  );
}

export function Paras({ text, class: cls }: { text: string; class?: string }) {
  return (
    <>
      {paragraphs(text).map((p) => (
        <p class={cls}>{p}</p>
      ))}
    </>
  );
}

function LogoMark({ light }: { light?: boolean }) {
  const line = light ? '#E9EDE6' : '#1E3A2A';
  const gold = light ? '#D9B76A' : '#B48A36';
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M3 20C9 9 31 9 37 20C31 31 9 31 3 20Z" stroke={line} stroke-width="2" />
      <path d="M8 20H32" stroke={gold} stroke-width="1.5" />
      <path d="M14 20L19 14.5M20 20L25 14.5M14 20L19 25.5M20 20L25 25.5" stroke={line} stroke-width="1.3" stroke-linecap="round" />
      <circle cx="20" cy="20" r="2.6" fill={gold} />
    </svg>
  );
}

/** The brand mark (the uploaded logo, or a drawn fallback) beside the name. On the dark footer
 *  the mark sits on a light badge so its green stays visible. */
function Logo({ site, light, tagline }: { site: Site; light?: boolean; tagline: string }) {
  const logo = site.docs.settings.logo ? site.media.get(site.docs.settings.logo) : undefined;
  return (
    <a class="logo" href="/#home" aria-label="Drishti Greens, home">
      {logo ? (
        <span class={light ? 'logo-mark logo-badge' : 'logo-mark'}>
          <img src={urlAtLeast(logo, 480)} alt="" width={logo.width} height={logo.height} />
        </span>
      ) : (
        <LogoMark light={light} />
      )}
      <span class="logo-text">
        <b>DRISHTI GREENS</b>
        <small>{tagline}</small>
      </span>
    </a>
  );
}

const ICONS: Record<string, string> = {
  clock: '<circle cx="18" cy="18" r="14"/><path d="M18 9v9l6 4"/>',
  compass: '<path d="M5 31L31 5M5 31h9M5 31v-9"/><path d="M14 6h16v16"/>',
  leaf: '<path d="M18 32V14"/><path d="M18 20C18 12 12 7 5 7c0 8 5 13 13 13ZM18 16c0-7 5-11 13-11 0 7-5 11-13 11Z"/>',
  calendar: '<rect x="5" y="7" width="26" height="24" rx="1"/><path d="M5 14h26M12 4v6M24 4v6M11 21l5 4 9-8"/>',
  shield: '<path d="M18 4l12 5v9c0 7-5 12-12 14-7-2-12-7-12-14V9l12-5Z"/><path d="M12 18l4 4 8-8"/>',
  drop: '<path d="M18 4c6 8 10 13 10 18a10 10 0 0 1-20 0c0-5 4-10 10-18Z"/>',
};

export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
      {raw(ICONS[name] ?? ICONS.leaf)}
    </svg>
  );
}

function Btn({ href, label, kind }: { href: string; label: string; kind: 'gold' | 'ghost' | 'line' }) {
  if (!label) return null;
  return (
    <a class={`btn btn-${kind}`} href={safeHref(href)}>
      {label}
    </a>
  );
}
export { Btn };

// ---- Page chrome ----

export function Layout({ site, meta, children, scripts }: { site: Site; meta: PageMeta; children: Child; scripts?: Child }) {
  const s = site.docs.settings;
  const tel = telHref(s.phone);
  const wa = whatsappHref(s.whatsapp, 'Hello Drishti Greens, I would like to discuss a landscaping project.');
  const ogImage = meta.image ? site.media.get(meta.image) : undefined;
  const canonical = site.origin + site.path;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LandscapingBusiness',
    name: 'Drishti Greens',
    url: site.origin + '/',
    slogan: s.tagline,
    areaServed: s.service_areas,
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    ...(s.address ? { address: s.address } : {}),
  };

  return (
    <html lang="en-IN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Drishti Greens" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={canonical} />
        {ogImage && <meta property="og:image" content={site.origin + urlAtLeast(ogImage, 1200)} />}
        <meta name="theme-color" content="#1E3A2A" />
        <link rel="icon" href={`/static/favicon.png?v=${site.v}`} type="image/png" />
        <link rel="apple-touch-icon" href={`/static/apple-touch-icon.png?v=${site.v}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Marcellus&display=swap"
        />
        <link rel="stylesheet" href={`/static/site.css?v=${site.v}`} />
        <script src={`/static/site.js?v=${site.v}`} defer></script>
        {scripts}
        <script type="application/ld+json">{raw(JSON.stringify(ld).replace(/</g, '\\u003c'))}</script>
      </head>
      <body>
        <a class="skip" href="#main">
          Skip to content
        </a>
        <div class="topbar">
          <div class="wrap">
            <span>
              {s.phone ? (
                <>
                  {s.consult_line}{' '}
                  <a href={tel}>
                    <strong>{s.phone}</strong>
                  </a>
                </>
              ) : (
                s.tagline
              )}
            </span>
            <span class="topbar-areas">{s.service_areas.slice(0, 5).join(' · ')}</span>
          </div>
        </div>
        <header class="header" id="header">
          <div class="wrap">
            <Logo site={site} tagline={s.tagline} />
            <nav class="nav" id="nav" aria-label="Main">
              {SECTIONS.map(([id, label]) => (
                <a href={`/#${id}`} data-section={id}>
                  {label}
                </a>
              ))}
            </nav>
            <a class="btn btn-gold header-cta" href="/#contact">
              Discuss your project
            </a>
            <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer class="footer">
          <div class="wrap cols">
            <div class="about">
              <Logo site={site} light tagline="Rooted in nature" />
              <p>{s.footer_blurb}</p>
            </div>
            <div>
              <h2 class="footer-h">Explore</h2>
              <ul>
                {SECTIONS.slice(1).map(([id, label]) => (
                  <li><a href={`/#${id}`}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 class="footer-h">Areas we serve</h2>
              <ul>
                {s.service_areas.map((a) => (
                  <li>{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 class="footer-h">Get in touch</h2>
              <ul>
                {s.phone && <li><a href={tel}>{s.phone}</a></li>}
                {wa && <li><a href={wa} rel="noopener">WhatsApp</a></li>}
                {s.email && <li><a href={`mailto:${s.email}`}>{s.email}</a></li>}
                {s.address && <li class="addr">{s.address}</li>}
                <li><a href="/#contact">Send an enquiry</a></li>
              </ul>
            </div>
          </div>
          <div class="wrap legal">
            <span>© {new Date().getFullYear()} Drishti Greens. All rights reserved.</span>
            <span>{s.footer_line}</span>
          </div>
        </footer>

        {wa && (
          <a class="wa" href={wa} rel="noopener" aria-label="Chat on WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3Z" />
            </svg>
          </a>
        )}
      </body>
    </html>
  );
}

// ---- Shared sections ----

export function WhyBand({ site }: { site: Site }) {
  const a = site.docs.about;
  return (
    <section class="dark section">
      <div class="wrap">
        <div class="section-head">
          <span class="eyebrow">Why choose Drishti Greens</span>
          <h2 class="h2">{a.why_heading}</h2>
        </div>
        <div class="why-grid">
          {a.why_items.map((w) => (
            <div class="why-item">
              <Icon name={w.icon} />
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
        {a.care_title && (
          <div class="care">
            <h3>{a.care_title}</h3>
            <div class="copy">
              <Paras text={a.care_text} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Photo grid with a lightbox. */
export function Gallery({ site, items }: { site: Site; items: GalleryPhoto[] }) {
  return (
    <div class="gallery-wrap" data-gallery>
      <div class="gallery">
        {items.map((p) => {
          const m = site.media.get(p.image);
          if (!m) return null;
          return (
            <figure class="proj">
              <button
                type="button"
                class="proj-open"
                aria-label={`Enlarge photo${p.caption ? `: ${p.caption}` : ''}`}
                data-full={urlAtLeast(m, 1600)}
                data-caption={p.caption}
                data-alt={m.alt}
              >
                <Img site={site} id={p.image} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px" />
              </button>
              {p.caption && <figcaption>{p.caption}</figcaption>}
            </figure>
          );
        })}
      </div>
      <dialog class="lightbox" aria-label="Project photo">
        <img src="" alt="" />
        <div class="cap">
          <p></p>
          <button type="button" class="lb-close" aria-label="Close">
            ×
          </button>
        </div>
      </dialog>
    </div>
  );
}
