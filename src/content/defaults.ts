// Starting content, taken from the client's website brief and "About Us" document.
// A document saved from the admin panel replaces its defaults; fields added here later still
// fill in for documents saved before they existed. Image ids `seed-NN` are created by `npm run seed:*`.

import type { Docs } from './schema.ts';

export const DEFAULTS: Docs = {
  settings: {
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    consult_line: 'For site consultation, call',
    service_areas: ['Bengaluru', 'Karnataka', 'Hyderabad', 'Mumbai', 'Delhi', 'Across India'],
    logo: '',
    tagline: 'Bringing Nature to Life',
    footer_blurb:
      'Landscape design, horticulture and nursery expertise across Bengaluru, Hyderabad, Mumbai, Delhi and other parts of India.',
    footer_line: 'Rooted in nature. Designed for life.',
  },

  home: {
    seo_title: 'Drishti Greens | Landscaping, Garden Design & Nursery',
    seo_description:
      'Drishti Greens creates thoughtful landscapes, villa gardens, resort greens, public parks and horticultural spaces, with over 10 years of experience.',
    hero: [
      {
        image: 'seed-06',
        eyebrow: 'Landscape design · Horticulture · Nursery',
        title: 'Bringing Nature to Life',
        text: 'Landscape design, horticulture and nursery expertise for beautiful, functional and enduring green spaces.',
        primary_label: 'Discuss your project',
        primary_link: '/contact',
        secondary_label: 'Explore our work',
        secondary_link: '/projects',
      },
      {
        image: 'seed-09',
        eyebrow: 'Resorts, estates & large layouts',
        title: 'A green welcome along every path',
        text: 'Cohesive green environments with pathways, lawns, palms, ornamental planting and gathering spaces.',
        primary_label: 'View our work',
        primary_link: '/projects?category=resorts',
        secondary_label: '',
        secondary_link: '',
      },
      {
        image: 'seed-02',
        eyebrow: 'Public parks & community landscapes',
        title: 'Open spaces for everyone',
        text: 'Accessible pathways, open lawns, shade trees and layered planting that make shared outdoor spaces inviting.',
        primary_label: 'Request a quote',
        primary_link: '/contact',
        secondary_label: '',
        secondary_link: '',
      },
    ],
    intro_statement: 'Rooted in nature. Designed for life.',
    intro_body:
      'From private villa gardens and resort landscapes to public parks and large-layout developments, Drishti Greens combines practical experience with a genuine connection to nature. We create outdoor spaces that feel welcoming, grow beautifully and complement their surroundings.',
    services_heading: 'Landscaping & horticulture services',
    about_heading: 'We bring spaces to life with nature',
    about_body:
      'At Drishti Greens, we believe every space has the potential to become something extraordinary when nature meets thoughtful design. With over 10 years of industry experience, we transform ordinary outdoor spaces into vibrant, functional and naturally beautiful landscapes.\n\nBoth our founders grew up surrounded by nature, with a deep personal connection to plants, trees and the outdoors. That connection shapes every project, from residential gardens and large layouts to commercial green spaces, vertical gardens and specialised horticulture.',
    about_quote: 'A little greener. A lot more life.',
    about_image_main: 'seed-11',
    about_image_inset: 'seed-12',
    stat_value: '10+',
    stat_label: 'Years of experience',
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
    projects_heading: 'Selected work',
    approach_heading: 'From first visit to long-term growth',
    approach_steps: [
      { title: 'Understand', text: 'We discuss your vision, site conditions, needs and priorities.' },
      { title: 'Design', text: 'We develop a customised landscape concept suited to the space.' },
      { title: 'Select', text: 'We consider appropriate plants, natural materials and practical site requirements.' },
      { title: 'Execute', text: 'We carry out the work with care, coordination and attention to detail.' },
      { title: 'Grow', text: 'We consider long-term plant health, soil and water conservation, and aftercare.' },
    ],
    cta_eyebrow: 'Start a conversation',
    cta_heading: 'Have a space you would like to transform?',
    cta_text: 'Tell us about your villa, resort, public landscape or planting requirement.',
    cta_image: 'seed-10',
  },

  about: {
    seo_title: 'About Drishti Greens | Landscaping & Horticulture',
    seo_description:
      'Drishti Greens brings over 10 years of landscaping and horticulture experience to gardens, layouts and green spaces across India.',
    banner_image: 'seed-07',
    banner_title: 'About us',
    banner_text: 'We bring spaces to life with nature.',
    story_heading: 'Thoughtful design, rooted in nature',
    story_body:
      'At Drishti Greens, we believe every space has the potential to become something extraordinary when nature meets thoughtful design.\n\nWith over 10 years of industry experience, we transform ordinary outdoor spaces into vibrant, functional and naturally beautiful landscapes. From residential gardens and large-scale layouts to commercial green spaces, vertical gardens and specialised horticulture, we bring ideas to life through creativity, expertise and a genuine passion for nature.\n\nOur experience spans Bengaluru, Karnataka, Hyderabad, Mumbai, Delhi and other parts of India. Wherever we work, our approach remains the same: understand the space, work with nature and create landscapes that grow beautifully over time.\n\nFor us, landscaping isn’t just about planting trees or adding greenery. It’s about creating spaces that feel good, look beautiful and make everyday life a little greener.',
    story_image: 'seed-01',
    philosophy_heading: 'A little greener. A lot more life.',
    philosophy_body:
      'Nature has always been a part of who we are. Both our founders grew up surrounded by nature, developing a deep personal connection with plants, trees and the outdoors. That connection continues to inspire everything we do at Drishti Greens.\n\nWe believe great landscaping is about more than appearances. It’s about understanding the land, choosing the right plants, working with natural materials and creating an environment that can thrive for years to come.\n\nEvery site is different. Every plant has its own needs. Every landscape has a story waiting to unfold. That’s why we combine practical experience, horticultural knowledge and thoughtful execution to create spaces that feel natural, look beautiful and grow with time.\n\nOur goal is simple: create landscapes that people love and nature can thrive in.',
    philosophy_image: 'seed-15',
    closing_line: 'Rooted in nature. Designed for life.',
    closing_sub: 'Thoughtfully designed. Naturally beautiful. Built to grow.',
  },

  services: {
    seo_title: 'Landscaping & Horticulture Services | Drishti Greens',
    seo_description:
      'Explore landscape design, garden development, vertical gardens, mature trees, palms, tree relocation and nursery plants from Drishti Greens.',
    banner_image: 'seed-09',
    banner_title: 'Our services',
    banner_text: 'Landscape design, horticulture and nursery expertise, from first sketch to long-term care.',
    heading: 'Landscaping & horticulture services',
    items: [
      {
        visible: true,
        title: 'Landscape Architecture & Design',
        slug: 'landscape-design',
        image: 'seed-03',
        summary:
          'We listen to your vision and requirements, develop a customised landscape design, and execute it with care, creativity and attention to detail.',
        body:
          'We listen to your vision and requirements, develop a customised landscape design, and execute it with care, creativity and attention to detail.\n\nFrom beautiful home gardens to expansive residential layouts and commercial developments, we transform open spaces into thoughtfully designed landscapes that balance beauty, functionality and nature.',
        category: 'parks',
      },
      {
        visible: true,
        title: 'Villa & Residential Gardens',
        slug: 'villa-gardens',
        image: 'seed-01',
        summary:
          'From entrance pathways and lawn areas to private courtyards and vertical gardens, we shape outdoor spaces that feel connected to the home.',
        body:
          'From entrance pathways and lawn areas to private courtyards and vertical gardens, we shape outdoor spaces that feel connected to the home and easy to enjoy.',
        category: 'villa',
      },
      {
        visible: true,
        title: 'Resorts, Estates & Large Layouts',
        slug: 'resorts-and-layouts',
        image: 'seed-07',
        summary:
          'Cohesive green environments with pathways, lawns, palms, ornamental planting and gathering spaces that make a welcoming first impression.',
        body:
          'We plan cohesive green environments with pathways, lawns, palms, ornamental planting and gathering spaces that create a welcoming first impression.',
        category: 'resorts',
      },
      {
        visible: true,
        title: 'Public Parks & Community Landscapes',
        slug: 'public-parks',
        image: 'seed-04',
        summary: 'Accessible pathways, open lawns, shade trees and layered planting that create inviting shared outdoor spaces.',
        body:
          'We bring together accessible pathways, open lawns, shade trees and layered planting to create inviting shared outdoor spaces.',
        category: 'parks',
      },
      {
        visible: true,
        title: 'Vertical Gardens & Compact Spaces',
        slug: 'vertical-gardens',
        image: 'seed-05',
        summary: 'Living walls and carefully planned planting introduce greenery where ground space is limited.',
        body:
          'Living walls and carefully planned planting introduce greenery where ground space is limited.\n\nNo matter the size of the space, there’s always room for green. We create customised indoor gardens, terrace landscapes, balcony gardens and vertical green walls that bring nature into modern living and working environments.',
        category: 'vertical',
      },
      {
        visible: true,
        title: 'Mature Trees & Palms',
        slug: 'mature-trees-and-palms',
        image: 'seed-14',
        summary: 'We source and work with established trees and palms to add scale, shade and structure to landscape projects.',
        body: 'We source and work with established trees and palms to add scale, shade and structure to landscape projects.',
        category: 'trees',
      },
      {
        visible: true,
        title: 'Mature-Tree Relocation',
        slug: 'tree-relocation',
        image: 'seed-13',
        summary:
          'Assessment, root-ball preparation, lifting, transport, replanting and aftercare, planned around site conditions.',
        body:
          'Tree relocation requires planning and careful handling. We coordinate assessment, root-ball preparation, lifting, transport, replanting and aftercare according to site conditions.\n\nEvery mature tree has value. We undertake specialised tree relocation and transplantation, with careful attention to root protection, site conditions and post-transplant care, wherever feasible.',
        category: 'trees',
      },
      {
        visible: true,
        title: 'Nursery & Specimen Plants',
        slug: 'nursery-and-specimen-plants',
        image: 'seed-15',
        summary:
          'Established trees, palms, topiary and specimen plants selected to suit the character and scale of a landscape.',
        body:
          'Our plant offering includes established trees, palms, topiary and specimen plants selected to suit the character and scale of a landscape.\n\nOur passion for plants goes beyond landscaping. We nurture a diverse range of plant varieties, with a special interest in ferns and orchids, using growing methods suited to their individual needs.',
        category: 'nursery',
      },
      {
        visible: true,
        title: 'Garden Development & Maintenance',
        slug: 'garden-maintenance',
        image: 'seed-08',
        summary:
          'Thoughtful planting, lawn care and ongoing attention help landscapes establish well and stay attractive as they mature.',
        body:
          'Thoughtful planting, lawn care and ongoing attention help landscapes establish well and remain attractive as they mature.\n\nHealthy gardens start with the right care. From soil preparation and plant selection to planting, maintenance and horticultural support, we help green spaces grow, thrive and flourish.',
        category: 'villa',
      },
      // From the "About Us" document. Hidden until the client confirms them and adds photos.
      {
        visible: false,
        title: 'Natural Stone & Pebble Landscaping',
        slug: 'stone-and-pebble-landscaping',
        image: '',
        summary:
          'Stones, boulders, decorative pebbles and greenery combined to give outdoor spaces character, depth and a natural look.',
        body:
          'Natural textures make a landscape stand out. We combine stones, boulders, decorative pebbles and greenery to create outdoor spaces with character, depth and a distinctive natural aesthetic.',
        category: '',
      },
      {
        visible: false,
        title: 'Rock Gardens & Natural Landscapes',
        slug: 'rock-gardens',
        image: '',
        summary: 'Rock gardens and organic landscapes that bring together plants, stones, textures and landforms.',
        body:
          'Inspired by the beauty of the natural world, we design rock gardens and organic landscapes that bring together plants, stones, textures and landforms in a harmonious way.',
        category: '',
      },
      {
        visible: false,
        title: 'Reflexology & Wellness Gardens',
        slug: 'wellness-gardens',
        image: '',
        summary: 'Reflexology pathways, acupressure walking stones and natural elements for peaceful outdoor experiences.',
        body:
          'Spaces should do more than look good. They should feel good, too. Our wellness gardens feature reflexology pathways, acupressure walking stones and natural elements designed to create peaceful outdoor experiences.',
        category: '',
      },
    ],
  },

  projects: {
    seo_title: 'Landscaping Projects & Garden Gallery | Drishti Greens',
    seo_description:
      'View selected villa gardens, public parks, resort landscapes, vertical gardens and mature-tree work by Drishti Greens.',
    banner_image: 'seed-02',
    banner_title: 'Projects',
    banner_text: 'Selected villa gardens, public parks, resort landscapes, vertical gardens and mature-tree work.',
    heading: 'Our work',
    items: [
      { visible: true, featured: true, category: 'villa', image: 'seed-01', title: 'A Thoughtfully Designed Welcome', caption: 'A refined entrance pathway combining natural stone, dark pebbles, ornamental planting and subtle lighting to create a welcoming transition from architecture to garden.' },
      { visible: true, featured: false, category: 'villa', image: 'seed-06', title: 'A Calm Tropical Retreat', caption: 'A lawn framed by palms, clipped shrubs and stepping stones creates a relaxed garden setting with a strong connection to nature.' },
      { visible: true, featured: false, category: 'villa', image: 'seed-08', title: 'Careful Planting, Lasting Beauty', caption: 'Layered planting, a healthy lawn and a green wall demonstrate the attention to detail that helps residential gardens mature beautifully.' },
      { visible: true, featured: false, category: 'villa', image: 'seed-10', title: 'A Garden That Comes Alive After Dark', caption: 'Warm lighting, mature trees and illuminated pathways extend the garden experience into the evening.' },
      { visible: true, featured: true, category: 'parks', image: 'seed-02', title: 'Open Spaces for Everyone', caption: 'Curving pathways, a circular lawn and layered planting create an inviting public landscape for walking, gathering and enjoying the outdoors.' },
      { visible: true, featured: false, category: 'parks', image: 'seed-03', title: 'Pathways Framed by Greenery', caption: 'Curved paved walkways and carefully edged planting beds bring structure, shade and visual interest to shared outdoor spaces.' },
      { visible: true, featured: false, category: 'parks', image: 'seed-04', title: 'Colour, Texture and Seasonal Interest', caption: 'Contrasting foliage, well-defined beds and mature shade trees add depth and character to a public garden.' },
      { visible: true, featured: true, category: 'resorts', image: 'seed-07', title: 'Landscapes Designed for Escape', caption: 'A manicured lawn, ornamental borders and a pergola create a composed outdoor setting suited to resorts, estates and leisure properties.' },
      { visible: true, featured: false, category: 'resorts', image: 'seed-09', title: 'A Green Welcome Along Every Path', caption: 'A straight stone walkway with symmetrical planting establishes a clear, welcoming route through a tropical property.' },
      { visible: true, featured: true, category: 'vertical', image: 'seed-05', title: 'Green Living, Even in Compact Spaces', caption: 'A vertical garden brings a living layer of greenery to a compact residential courtyard, complemented by a simple lawn and stepping-stone path.' },
      { visible: true, featured: true, category: 'trees', image: 'seed-13', title: 'From Nursery to New Home', caption: 'Our tree-moving work focuses on careful lifting, secure handling and coordinated placement at the new site.' },
      { visible: true, featured: false, category: 'trees', image: 'seed-11', title: 'Moving Mature Trees with Care', caption: 'Specialist handling and careful coordination help move established trees while prioritising root-ball protection and safe replanting.' },
      { visible: true, featured: false, category: 'trees', image: 'seed-14', title: 'Tropical Character at Scale', caption: 'Mature palms create height, rhythm and a distinctive tropical identity in resorts, villas and large landscape projects.' },
      { visible: true, featured: false, category: 'nursery', image: 'seed-12', title: 'Mature Trees for Established Landscapes', caption: 'A nursery selection of established trees offers immediate structure, shade and scale for landscape development projects.' },
      { visible: true, featured: true, category: 'nursery', image: 'seed-15', title: 'Statement Plants with Natural Character', caption: 'Sculpted topiary and specimen plants bring form, texture and a finished look to entrances, courtyards and formal gardens.' },
    ],
  },

  contact: {
    seo_title: 'Contact Drishti Greens | Landscaping Enquiries',
    seo_description:
      'Tell Drishti Greens about your villa, resort, public landscape or planting requirement and arrange a site consultation.',
    banner_image: 'seed-10',
    banner_title: 'Contact',
    banner_text: 'Have a space you would like to transform? Tell us about it.',
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
