// Starting content, taken from the client's website brief and "About Us" document.
// A section saved from the admin panel replaces its defaults; fields added here later still
// fill in for sections saved before they existed. Image ids `seed-NN` are created by `npm run seed`.

import type { Docs } from './schema.ts';

export const DEFAULTS: Docs = {
  settings: {
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    consult_line: 'For site consultation, call',
    notify_emails: [],
    service_areas: ['Bengaluru', 'Karnataka', 'Hyderabad', 'Mumbai', 'Delhi', 'Across India'],
    logo: 'seed-16',
    tagline: 'Bringing Nature to Life',
    footer_blurb:
      'Landscape design, horticulture and nursery expertise across Bengaluru, Hyderabad, Mumbai, Delhi and other parts of India.',
    footer_line: 'Rooted in nature. Designed for life.',
  },


  home: {
    seo_title: 'Drishti Greens | Landscaping, Forest Creation & Tree Relocation',
    seo_description:
      'Forest creation and carbon credit projects, mature tree relocation, and landscaping for resorts, parks, villas and interiors. Over 10 years of experience.',
    hero: [
      {
        image: 'seed-17',
        eyebrow: '',
        title: 'Carbon Credit Projects',
        text: 'Creating thriving forests through native tree plantation, ecological restoration and sustainable green-space development, while supporting forest creation and carbon credit projects for a greener future.',
        primary_label: 'Discuss your project',
        primary_link: '/#contact',
        secondary_label: 'Our services',
        secondary_link: '/#services',
      },
      {
        image: 'seed-18',
        eyebrow: '',
        title: 'Mature Tree Relocation',
        text: 'We bring life to green spaces through expert tree transplantation, achieving a 99% regrowth success rate and creating greener, more sustainable environments.',
        primary_label: 'Discuss your project',
        primary_link: '/#contact',
        secondary_label: 'Our services',
        secondary_link: '/#services',
      },
      {
        image: 'seed-19',
        eyebrow: '',
        title: 'Large Parks, Resorts & Beachside Landscaping',
        text: 'At Drishti Greens, we create beautiful parks, resort landscapes and beachside green spaces featuring lush lawns, landscaped gardens and elegant walking pathways.',
        primary_label: 'Discuss your project',
        primary_link: '/#contact',
        secondary_label: 'Our services',
        secondary_link: '/#services',
      },
      {
        image: 'seed-20',
        eyebrow: '',
        title: 'Villa Projects',
        text: 'We create beautiful villa landscapes with customised gardens, lush lawns, elegant pathways and carefully selected plants to complement your home and lifestyle.',
        primary_label: 'Discuss your project',
        primary_link: '/#contact',
        secondary_label: 'Our services',
        secondary_link: '/#services',
      },
      {
        image: 'seed-21',
        eyebrow: '',
        title: 'Indoor Projects',
        text: 'Bringing interiors to life with beautiful indoor plants and customised greenery that create fresh, welcoming and naturally elegant spaces.',
        primary_label: 'Discuss your project',
        primary_link: '/#contact',
        secondary_label: 'Our services',
        secondary_link: '/#services',
      },
    ],
    intro_statement: 'Rooted in nature. Designed for life.',
    intro_image: 'seed-06',
    intro_body:
      'At Drishti Greens, nature is more than our profession — it is a part of who we are. With both partners hailing from the beautiful Western Ghats, we share a deep-rooted love for greenery and a personal commitment to preserving nature.\n\nFrom designing beautiful gardens and landscapes to creating forests through native tree plantation, afforestation and ecological restoration, we strive to bring people closer to nature. We also support forest creation and carbon credit projects, helping businesses explore sustainable environmental initiatives for a greener future.',
  },

  about: {
    about_heading: 'We bring spaces to life with nature',
    about_image: 'seed-22',
    stat_value: '10+',
    stat_label: 'Years of experience',
    about_body:
      'At Drishti Greens, both our partners hail from the beautiful Western Ghats, where a deep connection with nature and a love for greenery have shaped our vision. We believe every space has the potential to become extraordinary when nature meets thoughtful design.\n\nWith over 10 years of industry experience, we create beautiful, functional and sustainable green spaces that bring people closer to nature. From residential gardens, villa landscapes and large-scale developments to commercial landscapes, vertical gardens and specialised horticulture, we combine creativity, expertise and a genuine passion for greenery to bring every vision to life.\n\nOur expertise also extends to forest creation, native tree plantation, afforestation and ecological restoration, helping restore natural ecosystems and build greener landscapes. Through our carbon credit projects, we support sustainability initiatives that contribute to a more environmentally responsible future.\n\nOur experience spans Bengaluru and other parts of Karnataka, Hyderabad, Mumbai, Delhi and locations across India. Every project begins with understanding the space, respecting its natural character and creating landscapes that flourish beautifully over time.\n\nFor us, landscaping is more than planting trees or adding greenery. It is about creating spaces that inspire, restore and enrich everyday life while contributing to a healthier planet. Through thoughtful design and a deep-rooted love for nature, we aim to make every space greener, more inviting and more connected to the natural world.',
    about_quote: '',
    why_heading: 'Practical experience, a genuine love of plants',
    why_items: [
      {
        icon: 'clock',
        title: 'Experience that makes a difference',
        text: 'Over 10 years of practical knowledge in landscaping, horticulture and large-scale green-space development.',
      },
      {
        icon: 'compass',
        title: 'Design with purpose',
        text: 'Landscapes that complement their surroundings, combine function with beauty and make the most of each space.',
      },
      {
        icon: 'leaf',
        title: 'A genuine connection with nature',
        text: 'Our founders’ lifelong bond with plants and the natural environment shapes our approach to every project.',
      },
      {
        icon: 'calendar',
        title: 'From planning to planting',
        text: 'Landscape development, plant selection, planting, execution and ongoing horticultural care, according to the agreed scope.',
      },
    ],
    care_title: 'Care that continues after completion',
    care_text:
      'A landscape needs time and the right care to flourish. We monitor plant establishment under the agreed maintenance plan, and where plants fail to establish we assess the cause and agree corrective measures with you, including replacement where covered.',
  },

  services: {
    heading: 'Landscaping, horticulture, forest creation & carbon credit projects',
    items: [
      {
        visible: true,
        title: 'Forest Creation & Carbon Credit Projects',
        image: 'seed-17',
        summary:
          'Native tree plantation, afforestation and ecological restoration that establish thriving forests and support carbon credit projects for a greener future.',
        body:
          'At Drishti Greens, we focus on forest creation and carbon credit projects, developing sustainable green initiatives that contribute to a greener future. Through native tree plantation, afforestation and ecological restoration, we help establish thriving forests, restore natural ecosystems and enhance carbon sequestration potential.\n\nOur focus is on supporting projects that combine environmental conservation with long-term sustainability, enabling businesses and landowners to explore carbon credit opportunities while contributing to biodiversity, climate action and a healthier planet.',
      },
      {
        visible: true,
        title: 'Landscape Design & Development',
        image: 'seed-23',
        summary: 'Customised landscape designs tailored to your requirements, preferences and space, from concept development to thoughtful planning.',
        body:
          "At Drishti Greens, we create customised landscape designs tailored to each client's unique requirements, preferences and available space. From concept development to thoughtful planning, we combine creativity, natural elements and practical design to transform your vision into beautiful, functional and sustainable green spaces.\n\nEvery design is carefully crafted to complement its surroundings and reflect your individual style.",
      },
      {
        visible: true,
        title: 'Mature Tree Relocation',
        image: 'seed-24',
        summary: 'Careful relocation of mature trees with the right equipment and expert handling, achieving a 99% relocation success rate.',
        body:
          'At Drishti Greens, we specialise in the careful relocation of mature trees using appropriate equipment and expert handling to protect root systems and promote healthy regrowth.\n\nOur approach preserves established greenery, accelerates landscape development and achieves a 99% tree relocation success rate.',
      },
      {
        visible: true,
        title: 'Resorts, Estates, Parks & Large Layouts',
        image: 'seed-25',
        summary: 'Lush lawns, landscaped gardens, walking pathways, vibrant plantations and peaceful recreational areas for large outdoor spaces.',
        body:
          'At Drishti Greens, we design and develop beautiful, sustainable outdoor spaces that blend natural beauty with thoughtful planning.\n\nFrom lush green lawns and landscaped gardens to elegant walking pathways, vibrant plantations and peaceful recreational areas, we create inviting environments that enhance everyday living and bring people closer to nature.',
      },
      {
        visible: true,
        title: 'Plant Nursery & Specimen Trees',
        image: 'seed-26',
        summary: 'Quality plants, ornamental palms, mature trees and specimen plants for landscaping projects of every scale.',
        body:
          'At Drishti Greens, we nurture and source a diverse selection of quality plants, ornamental palms, mature trees and specimen plants for landscaping projects of every scale.\n\nFrom elegant palms to carefully grown avenue trees and lush green shrubs, our collection helps bring character, structure and lasting beauty to outdoor spaces. We focus on healthy plant growth and selecting the right greenery to complement each landscape design.',
      },
      {
        visible: true,
        title: 'Vertical Gardens',
        image: 'seed-27',
        summary: 'Customised living walls that turn plain walls into vibrant green landscapes for homes, offices and outdoor spaces.',
        body:
          'At Drishti Greens, we transform plain walls into vibrant living landscapes with customised vertical garden solutions tailored to your space and design preferences.\n\nBy combining carefully selected plants, creative layouts and thoughtful planning, we bring natural beauty to residential, commercial and outdoor environments. Our vertical gardens make efficient use of space, enhance visual appeal and introduce refreshing greenery into modern architecture.',
      },
      {
        visible: true,
        title: 'Indoor Landscaping & Greenery',
        image: 'seed-28',
        summary: 'Plant arrangements, elegant planters, green walls and indoor gardens for homes, offices, hotel lobbies and commercial spaces.',
        body:
          'At Drishti Greens, we transform indoor spaces with thoughtfully designed plant arrangements, elegant planters, green walls and natural indoor gardens.\n\nFrom residential interiors to corporate offices, hotel lobbies and commercial spaces, we create refreshing, welcoming environments that blend greenery with modern architecture.',
      },
    ],
  },

  projects: {
    heading: 'Our major projects',
    intro: 'A selection of our major projects, completed and in progress.',
    items: [
      { visible: true, name: 'Pushkar Cottages', status: '', photo: 'seed-33', logo: 'seed-29', description: '', link: 'https://pushkarcottages.com/' },
      { visible: true, name: 'Dandeli River Inn Resort', status: '', photo: 'seed-35', logo: '', description: '', link: '' },
      { visible: true, name: 'Tata Hitachi', status: '', photo: 'seed-36', logo: 'seed-32', description: '', link: '' },
      { visible: true, name: 'Bharat Petroleum Corporation Limited', status: '', photo: '', logo: 'seed-30', description: '', link: '' },
      { visible: true, name: 'HP Gas', status: '', photo: '', logo: 'seed-31', description: '', link: '' },
    ],
    gallery_heading: 'New projects',
    gallery_intro: '',
    gallery: [],
  },
  approach: {
    heading: 'From first visit to long-term growth',
    steps: [
      { title: 'Understand', text: 'We discuss your vision, site conditions, needs and priorities.' },
      { title: 'Design', text: 'We develop a customised landscape concept suited to the space.' },
      { title: 'Select', text: 'We consider appropriate plants, natural materials and practical site requirements.' },
      { title: 'Execute', text: 'We carry out the work with care, coordination and attention to detail.' },
      { title: 'Grow', text: 'We consider long-term plant health, soil and water conservation, and aftercare.' },
    ],
  },

  contact: {
    cta_eyebrow: 'Start a conversation',
    cta_heading: 'Have a space you would like to transform?',
    cta_text: 'Tell us about your villa, resort, public landscape or planting requirement.',
    cta_image: 'seed-10',
    heading: 'Tell us about your space',
    intro: 'Share a few details and our team will get back to you to arrange a site consultation.',
    project_types: [
      'Villa or residential garden',
      'Resort, estate or large layout',
      'Public park or community space',
      'Vertical, terrace or indoor garden',
      'Mature trees, palms or relocation',
      'Nursery and specimen plants',
      'Garden maintenance',
      'Something else',
    ],
    success_message: 'Thank you. We have received your enquiry and will be in touch soon.',
  },
};
