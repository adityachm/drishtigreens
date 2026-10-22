import type { Field, Option, Section } from './fields.ts';

export const PROJECT_CATEGORIES: Option[] = [
  { value: 'villa', label: 'Villa & Residential Gardens' },
  { value: 'parks', label: 'Public Parks' },
  { value: 'resorts', label: 'Resorts & Layouts' },
  { value: 'vertical', label: 'Vertical Gardens' },
  { value: 'trees', label: 'Mature Trees & Relocation' },
  { value: 'nursery', label: 'Nursery & Specimen Plants' },
];

export const WHY_ICONS: Option[] = [
  { value: 'clock', label: 'Clock' },
  { value: 'compass', label: 'Set square' },
  { value: 'leaf', label: 'Leaves' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'shield', label: 'Shield' },
  { value: 'drop', label: 'Water drop' },
];

// ---- Document types (what views read) ----

export type HeroSlide = {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  primary_label: string;
  primary_link: string;
  secondary_label: string;
  secondary_link: string;
};
export type TitleText = { title: string; text: string };
export type WhyItem = TitleText & { icon: string };
export type Seo = { seo_title: string; seo_description: string };
export type Banner = { banner_image: string; banner_title: string; banner_text: string };

export type Settings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  consult_line: string;
  service_areas: string[];
  logo: string;
  tagline: string;
  footer_blurb: string;
  footer_line: string;
};

export type Home = Seo & {
  hero: HeroSlide[];
  intro_statement: string;
  intro_body: string;
  services_heading: string;
  about_heading: string;
  about_body: string;
  about_quote: string;
  about_image_main: string;
  about_image_inset: string;
  stat_value: string;
  stat_label: string;
  why_heading: string;
  why_items: WhyItem[];
  care_title: string;
  care_text: string;
  projects_heading: string;
  approach_heading: string;
  approach_steps: TitleText[];
  cta_eyebrow: string;
  cta_heading: string;
  cta_text: string;
  cta_image: string;
};

export type About = Seo &
  Banner & {
    story_heading: string;
    story_body: string;
    story_image: string;
    philosophy_heading: string;
    philosophy_body: string;
    philosophy_image: string;
    closing_line: string;
    closing_sub: string;
  };

export type Service = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  image: string;
  category: string;
  visible: boolean;
};
export type Services = Seo & Banner & { heading: string; items: Service[] };

export type Project = {
  title: string;
  caption: string;
  category: string;
  image: string;
  featured: boolean;
  visible: boolean;
};
export type Projects = Seo & Banner & { heading: string; items: Project[] };

export type Contact = Seo &
  Banner & {
    heading: string;
    intro: string;
    project_types: string[];
    success_message: string;
  };

export type Docs = {
  settings: Settings;
  home: Home;
  about: About;
  services: Services;
  projects: Projects;
  contact: Contact;
};
export type DocKey = keyof Docs;

// ---- Editor definitions ----

const seo = (page: string): Section => ({
  title: 'Search engines',
  help: `How the ${page} appears in Google results and link previews.`,
  fields: [
    { type: 'text', key: 'seo_title', label: 'Page title', max: 70, required: true },
    { type: 'textarea', key: 'seo_description', label: 'Description', max: 170, rows: 3 },
  ],
});

const banner: Section = {
  title: 'Page banner',
  fields: [
    { type: 'image', key: 'banner_image', label: 'Banner image' },
    { type: 'text', key: 'banner_title', label: 'Banner title', required: true },
    { type: 'textarea', key: 'banner_text', label: 'Banner text', rows: 2, max: 300 },
  ],
};

const paraHelp = 'Leave a blank line between paragraphs.';

export type DocDef = { key: DocKey; title: string; description: string; publicPath: string; sections: Section[] };

export const DOCS: DocDef[] = [
  {
    key: 'home',
    title: 'Home page',
    description: 'Hero slider, introduction and the sections that appear on the home page.',
    publicPath: '/',
    sections: [
      {
        title: 'Hero slider',
        help: 'Large photos at the top of the home page. Use wide landscape photos; text sits on the left.',
        fields: [
          {
            type: 'list',
            key: 'hero',
            label: 'Slides',
            itemLabel: 'Slide',
            titleKey: 'title',
            min: 1,
            max: 6,
            fields: [
              { type: 'image', key: 'image', label: 'Photo', required: true },
              { type: 'text', key: 'eyebrow', label: 'Small label above the title', max: 80 },
              { type: 'text', key: 'title', label: 'Title', required: true, max: 80 },
              { type: 'textarea', key: 'text', label: 'Text', rows: 2, max: 240 },
              { type: 'text', key: 'primary_label', label: 'Main button label', max: 40 },
              { type: 'link', key: 'primary_link', label: 'Main button link', placeholder: '/contact' },
              { type: 'text', key: 'secondary_label', label: 'Second button label', max: 40 },
              { type: 'link', key: 'secondary_link', label: 'Second button link', placeholder: '/projects' },
            ],
          },
        ],
      },
      {
        title: 'Introduction',
        fields: [
          { type: 'text', key: 'intro_statement', label: 'Statement', max: 80 },
          { type: 'textarea', key: 'intro_body', label: 'Text', rows: 4, help: paraHelp },
        ],
      },
      {
        title: 'Services section',
        help: 'The service cards come from the Services editor.',
        fields: [{ type: 'text', key: 'services_heading', label: 'Heading' }],
      },
      {
        title: 'Profile',
        fields: [
          { type: 'text', key: 'about_heading', label: 'Heading' },
          { type: 'textarea', key: 'about_body', label: 'Text', rows: 6, help: paraHelp },
          { type: 'text', key: 'about_quote', label: 'Quote' },
          { type: 'image', key: 'about_image_main', label: 'Main photo (portrait works best)' },
          { type: 'image', key: 'about_image_inset', label: 'Small overlapping photo' },
          { type: 'text', key: 'stat_value', label: 'Highlight number', max: 10, help: 'For example 10+. Leave empty to hide.' },
          { type: 'text', key: 'stat_label', label: 'Highlight label', max: 40 },
        ],
      },
      {
        title: 'Why choose us',
        fields: [
          { type: 'text', key: 'why_heading', label: 'Heading' },
          {
            type: 'list',
            key: 'why_items',
            label: 'Reasons',
            itemLabel: 'Reason',
            titleKey: 'title',
            max: 8,
            fields: [
              { type: 'select', key: 'icon', label: 'Icon', options: WHY_ICONS },
              { type: 'text', key: 'title', label: 'Title', required: true, max: 60 },
              { type: 'textarea', key: 'text', label: 'Text', rows: 3, max: 400 },
            ],
          },
          { type: 'text', key: 'care_title', label: 'Aftercare box title' },
          { type: 'textarea', key: 'care_text', label: 'Aftercare box text', rows: 4 },
        ],
      },
      {
        title: 'Projects section',
        help: 'Projects marked "Featured" in the Projects editor show here.',
        fields: [{ type: 'text', key: 'projects_heading', label: 'Heading' }],
      },
      {
        title: 'Our approach',
        help: 'Shown on the home and About pages, numbered in this order.',
        fields: [
          { type: 'text', key: 'approach_heading', label: 'Heading' },
          {
            type: 'list',
            key: 'approach_steps',
            label: 'Steps',
            itemLabel: 'Step',
            titleKey: 'title',
            max: 8,
            fields: [
              { type: 'text', key: 'title', label: 'Title', required: true, max: 40 },
              { type: 'textarea', key: 'text', label: 'Text', rows: 2, max: 300 },
            ],
          },
        ],
      },
      {
        title: 'Call to action band',
        help: 'Shown near the bottom of most pages.',
        fields: [
          { type: 'text', key: 'cta_eyebrow', label: 'Small label' },
          { type: 'text', key: 'cta_heading', label: 'Heading' },
          { type: 'textarea', key: 'cta_text', label: 'Text', rows: 3 },
          { type: 'image', key: 'cta_image', label: 'Background photo' },
        ],
      },
      seo('home page'),
    ],
  },
  {
    key: 'about',
    title: 'About page',
    description: 'Company story and philosophy. "Why choose us" and "Our approach" come from the Home page editor.',
    publicPath: '/about',
    sections: [
      banner,
      {
        title: 'Our story',
        fields: [
          { type: 'text', key: 'story_heading', label: 'Heading' },
          { type: 'textarea', key: 'story_body', label: 'Text', rows: 10, help: paraHelp },
          { type: 'image', key: 'story_image', label: 'Photo' },
        ],
      },
      {
        title: 'Philosophy',
        fields: [
          { type: 'text', key: 'philosophy_heading', label: 'Heading' },
          { type: 'textarea', key: 'philosophy_body', label: 'Text', rows: 10, help: paraHelp },
          { type: 'image', key: 'philosophy_image', label: 'Photo' },
        ],
      },
      {
        title: 'Closing line',
        fields: [
          { type: 'text', key: 'closing_line', label: 'Line' },
          { type: 'text', key: 'closing_sub', label: 'Smaller line below' },
        ],
      },
      seo('About page'),
    ],
  },
  {
    key: 'services',
    title: 'Services',
    description: 'The service cards on the home and Services pages, and each service’s own page.',
    publicPath: '/services',
    sections: [
      banner,
      { title: 'Heading', fields: [{ type: 'text', key: 'heading', label: 'Heading above the cards' }] },
      {
        title: 'Services',
        help: 'The first 9 visible services appear on the home page. Untick "Show on website" to hide one without deleting it.',
        fields: [
          {
            type: 'list',
            key: 'items',
            label: 'Services',
            itemLabel: 'Service',
            titleKey: 'title',
            max: 30,
            fields: [
              { type: 'checkbox', key: 'visible', label: 'Show on website' },
              { type: 'text', key: 'title', label: 'Name', required: true, max: 80 },
              { type: 'slug', key: 'slug', label: 'Web address', help: 'The page will be at /services/<this>. Changing it breaks old links.' },
              { type: 'image', key: 'image', label: 'Photo' },
              { type: 'textarea', key: 'summary', label: 'Short description (card)', rows: 3, max: 300 },
              { type: 'textarea', key: 'body', label: 'Full description (service page)', rows: 8, help: paraHelp },
              {
                type: 'select',
                key: 'category',
                label: 'Show projects from',
                options: [{ value: '', label: 'No related projects' }, ...PROJECT_CATEGORIES],
              },
            ],
          },
        ],
      },
      seo('Services page'),
    ],
  },
  {
    key: 'projects',
    title: 'Projects',
    description: 'The project gallery, grouped by category. Featured projects also appear on the home page.',
    publicPath: '/projects',
    sections: [
      banner,
      { title: 'Heading', fields: [{ type: 'text', key: 'heading', label: 'Heading above the gallery' }] },
      {
        title: 'Projects',
        fields: [
          {
            type: 'list',
            key: 'items',
            label: 'Projects',
            itemLabel: 'Project',
            titleKey: 'title',
            max: 200,
            fields: [
              { type: 'checkbox', key: 'visible', label: 'Show on website' },
              { type: 'checkbox', key: 'featured', label: 'Feature on the home page' },
              { type: 'image', key: 'image', label: 'Photo', required: true },
              { type: 'select', key: 'category', label: 'Category', options: PROJECT_CATEGORIES },
              { type: 'text', key: 'title', label: 'Title', required: true, max: 80 },
              { type: 'textarea', key: 'caption', label: 'Caption', rows: 3, max: 400 },
            ],
          },
        ],
      },
      seo('Projects page'),
    ],
  },
  {
    key: 'contact',
    title: 'Contact page',
    description: 'Enquiry form text. Phone, email and address are under Site settings.',
    publicPath: '/contact',
    sections: [
      banner,
      {
        title: 'Enquiry form',
        fields: [
          { type: 'text', key: 'heading', label: 'Heading' },
          { type: 'textarea', key: 'intro', label: 'Text', rows: 3 },
          { type: 'lines', key: 'project_types', label: 'Project types in the dropdown', help: 'One per line.', max: 20 },
          { type: 'textarea', key: 'success_message', label: 'Message after sending', rows: 2 },
        ],
      },
      seo('Contact page'),
    ],
  },
  {
    key: 'settings',
    title: 'Site settings',
    description: 'Contact details, service areas and footer text used across the whole site.',
    publicPath: '/contact',
    sections: [
      {
        title: 'Contact details',
        help: 'Anything left empty is hidden on the website.',
        fields: [
          { type: 'text', key: 'phone', label: 'Phone', placeholder: '+91 98450 12345', max: 40 },
          { type: 'text', key: 'whatsapp', label: 'WhatsApp number', placeholder: '919845012345', help: 'With country code, digits only. Leave empty to hide the WhatsApp button.', max: 20 },
          { type: 'text', key: 'email', label: 'Email', max: 120 },
          { type: 'textarea', key: 'address', label: 'Business address', rows: 3, max: 400 },
          { type: 'text', key: 'consult_line', label: 'Header line before the phone number', max: 80 },
        ],
      },
      {
        title: 'Service areas',
        fields: [{ type: 'lines', key: 'service_areas', label: 'Areas', help: 'One per line.', max: 20 }],
      },
      {
        title: 'Brand',
        fields: [
          { type: 'image', key: 'logo', label: 'Logo', help: 'Optional. A wide PNG or WebP with a transparent background. Leave empty to use the built-in mark.' },
          { type: 'text', key: 'tagline', label: 'Tagline under the name', max: 60 },
          { type: 'textarea', key: 'footer_blurb', label: 'Footer description', rows: 3, max: 400 },
          { type: 'text', key: 'footer_line', label: 'Footer closing line', max: 100 },
        ],
      },
    ],
  },
];

export function docDef(key: string): DocDef | undefined {
  return DOCS.find((d) => d.key === key);
}

export function allFields(def: DocDef): Field[] {
  return def.sections.flatMap((s) => s.fields);
}
