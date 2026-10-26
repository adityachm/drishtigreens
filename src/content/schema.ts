import type { Field, Option, Section } from './fields.ts';

export const PROJECT_STATUSES: Option[] = [
  { value: '', label: 'Don’t show a status' },
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In progress' },
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
// The site is one page. Each document is one section of it, edited on its own admin screen.

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

export type Settings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  consult_line: string;
  notify_emails: string[];
  service_areas: string[];
  logo: string;
  tagline: string;
  footer_blurb: string;
  footer_line: string;
};

/** Top of the page: slider and introduction, plus the page's title for search engines. */
export type Home = {
  seo_title: string;
  seo_description: string;
  hero: HeroSlide[];
  intro_statement: string;
  intro_body: string;
};

export type About = {
  about_heading: string;
  about_body: string;
  about_quote: string;
  about_image: string;
  stat_value: string;
  stat_label: string;
  why_heading: string;
  why_items: WhyItem[];
  care_title: string;
  care_text: string;
};

export type Service = {
  title: string;
  summary: string;
  body: string;
  image: string;
  visible: boolean;
};
export type Services = { heading: string; items: Service[] };

/** A major project (client). Projects with a photo show as large cards, the rest as logo cards. */
export type MajorProject = {
  name: string;
  status: '' | 'completed' | 'in-progress';
  photo: string;
  logo: string;
  description: string;
  link: string;
  visible: boolean;
};
export type GalleryPhoto = { image: string; caption: string; visible: boolean };
export type Projects = {
  heading: string;
  intro: string;
  items: MajorProject[];
  gallery_heading: string;
  gallery_intro: string;
  gallery: GalleryPhoto[];
};

export type Approach = { heading: string; steps: TitleText[] };

export type Contact = {
  cta_eyebrow: string;
  cta_heading: string;
  cta_text: string;
  cta_image: string;
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
  approach: Approach;
  contact: Contact;
};
export type DocKey = keyof Docs;

// ---- Editor definitions, in the order the sections appear on the page ----

const paraHelp = 'Leave a blank line between paragraphs.';

export type DocDef = { key: DocKey; title: string; description: string; publicPath: string; sections: Section[] };

export const DOCS: DocDef[] = [
  {
    key: 'home',
    title: 'Top of page',
    description: 'The photo slider and introduction at the top of the website, and how it appears in Google.',
    publicPath: '/#home',
    sections: [
      {
        title: 'Photo slider',
        help: 'Large photos at the top of the page. Use wide landscape photos; text sits on the left.',
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
              { type: 'link', key: 'primary_link', label: 'Main button goes to', placeholder: '/#contact', help: 'A section: /#about, /#services, /#projects, /#approach or /#contact.' },
              { type: 'text', key: 'secondary_label', label: 'Second button label', max: 40 },
              { type: 'link', key: 'secondary_link', label: 'Second button goes to', placeholder: '/#projects' },
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
        title: 'Search engines',
        help: 'How the website appears in Google results and link previews.',
        fields: [
          { type: 'text', key: 'seo_title', label: 'Page title', max: 70, required: true },
          { type: 'textarea', key: 'seo_description', label: 'Description', max: 170, rows: 3 },
        ],
      },
    ],
  },
  {
    key: 'about',
    title: 'About',
    description: 'Company story and “Why choose us”.',
    publicPath: '/#about',
    sections: [
      {
        title: 'About us',
        fields: [
          { type: 'text', key: 'about_heading', label: 'Heading' },
          { type: 'image', key: 'about_image', label: 'Wide photo', help: 'Shown wide above the text. Landscape photos work best.' },
          { type: 'text', key: 'stat_value', label: 'Highlight number', max: 10, help: 'Shown on the photo, for example 10+. Leave empty to hide.' },
          { type: 'text', key: 'stat_label', label: 'Highlight label', max: 40 },
          { type: 'textarea', key: 'about_body', label: 'Text', rows: 14, help: paraHelp },
          { type: 'text', key: 'about_quote', label: 'Closing line (optional)' },
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
    ],
  },
  {
    key: 'services',
    title: 'Services',
    description: 'The service cards. “Learn more” on a card opens its full description.',
    publicPath: '/#services',
    sections: [
      { title: 'Heading', fields: [{ type: 'text', key: 'heading', label: 'Heading above the cards', max: 120 }] },
      {
        title: 'Services',
        help: 'Untick "Show on website" to hide a service without deleting it.',
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
              { type: 'image', key: 'image', label: 'Photo' },
              { type: 'textarea', key: 'summary', label: 'Short description (card)', rows: 3, max: 300 },
              { type: 'textarea', key: 'body', label: 'Full description (opens from “Learn more”)', rows: 8, help: paraHelp },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'projects',
    title: 'Projects',
    description: 'Major projects, completed and in progress, and a gallery of new project photos.',
    publicPath: '/#projects',
    sections: [
      {
        title: 'Major projects',
        help: 'Projects with a photo show as large cards; the others show their logo.',
        fields: [
          { type: 'text', key: 'heading', label: 'Heading' },
          { type: 'textarea', key: 'intro', label: 'Text', rows: 2, max: 300 },
          {
            type: 'list',
            key: 'items',
            label: 'Projects',
            itemLabel: 'Project',
            titleKey: 'name',
            max: 40,
            fields: [
              { type: 'checkbox', key: 'visible', label: 'Show on website' },
              { type: 'text', key: 'name', label: 'Client or project name', required: true, max: 80 },
              { type: 'select', key: 'status', label: 'Status', options: PROJECT_STATUSES },
              { type: 'image', key: 'photo', label: 'Project photo' },
              { type: 'image', key: 'logo', label: 'Client logo' },
              { type: 'textarea', key: 'description', label: 'Short description (optional)', rows: 2, max: 300 },
              { type: 'link', key: 'link', label: 'Website (optional)', placeholder: 'https://' },
            ],
          },
        ],
      },
      {
        title: 'Gallery of new projects',
        help: 'Upload photos of new projects here. This part of the page appears once you add the first photo.',
        fields: [
          { type: 'text', key: 'gallery_heading', label: 'Heading' },
          { type: 'textarea', key: 'gallery_intro', label: 'Text (optional)', rows: 2, max: 300 },
          {
            type: 'list',
            key: 'gallery',
            label: 'Photos',
            itemLabel: 'Photo',
            titleKey: 'caption',
            max: 200,
            fields: [
              { type: 'checkbox', key: 'visible', label: 'Show on website' },
              { type: 'image', key: 'image', label: 'Photo', required: true },
              { type: 'text', key: 'caption', label: 'Caption (optional)', max: 160 },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'approach',
    title: 'Our approach',
    description: 'The numbered steps of how a project runs.',
    publicPath: '/#approach',
    sections: [
      {
        title: 'Our approach',
        help: 'Shown numbered, in this order.',
        fields: [
          { type: 'text', key: 'heading', label: 'Heading' },
          {
            type: 'list',
            key: 'steps',
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
    ],
  },
  {
    key: 'contact',
    title: 'Contact',
    description: 'The photo band and enquiry form at the bottom of the page. Phone, email and address are under Site settings.',
    publicPath: '/#contact',
    sections: [
      {
        title: 'Photo band above the form',
        fields: [
          { type: 'text', key: 'cta_eyebrow', label: 'Small label' },
          { type: 'text', key: 'cta_heading', label: 'Heading' },
          { type: 'textarea', key: 'cta_text', label: 'Text', rows: 3 },
          { type: 'image', key: 'cta_image', label: 'Background photo' },
        ],
      },
      {
        title: 'Enquiry form',
        fields: [
          { type: 'text', key: 'heading', label: 'Heading' },
          { type: 'textarea', key: 'intro', label: 'Text', rows: 3 },
          { type: 'lines', key: 'project_types', label: 'Project types in the dropdown', help: 'One per line.', max: 20 },
          { type: 'textarea', key: 'success_message', label: 'Message after sending', rows: 2 },
        ],
      },
    ],
  },
  {
    key: 'settings',
    title: 'Site settings',
    description: 'Contact details, service areas and footer text used across the whole site.',
    publicPath: '/#contact',
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
        title: 'Enquiry alerts',
        help: 'Each new enquiry from the contact form is emailed to these addresses. Replying to the email answers the person who sent it.',
        fields: [
          {
            type: 'lines',
            key: 'notify_emails',
            label: 'Send new enquiries to',
            help: 'One email address per line. Leave empty to use the business email above.',
            max: 5,
            emails: true,
          },
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
