import services from "./data/services.json";

export const SITE = {
  name: "Bin Othaimeen Group",
  url: "https://othaimeengrp.com",
  description:
    "Bin Othaimeen Group is a Riyadh-based business services and holding company helping companies navigate the GCC through advisory, marketing and trading.",
  tagline: "Helping companies navigate the GCC.",
  email: "info@othaimeengrp.com",
  recruiting: "recruiting@othaimeengrp.com",
  press: "press@othaimeengrp.com",
  address: ["Diplomatic Quarter E 93-2", "Taibah Dist., B- Street", "Riyadh, Saudi Arabia"],
  hours: [
    ["Sunday to Thursday", "8:00 AM to 6:00 PM"],
    ["Friday and Saturday", "Closed"],
  ],
  social: {
    linkedin: "https://www.linkedin.com/company/bin-othaimeen-group",
    x: "https://twitter.com/othaimeengroup",
  },
  ceo: { name: "Abdulaziz Bin Othaimeen", title: "CEO, Bin Othaimeen Group" },
  // GA4 measurement ID (G-XXXXXXX). The old site had none set up; leave empty until BOG has a property.
  ga4: "",
  // true keeps the whole site out of search engines (the .htaccess also noindexes non-production hosts)
  noindex: false,
};

export type Service = (typeof services)[number];

export const GROUPS = [
  {
    key: "advisory",
    label: "Advisory & Consulting",
    blurb:
      "Through our extensive local network and partnerships, we can connect businesses with potential clients, investors, suppliers, or strategic partners to facilitate growth and expansion.",
  },
  {
    key: "marketing",
    label: "Marketing & Digital",
    blurb:
      "Our strategic partnerships with leading global companies in the field of digital marketing and SEO allow us to leverage their expertise and industry insights to deliver exceptional results.",
  },
] as const;

export const servicesIn = (group: string) => services.filter((s) => s.group === group);
export const serviceUrl = (slug: string) => `/service/${slug}/`;

export const NAV = [
  {
    label: "Services",
    href: "/services/",
    groups: GROUPS.map((g) => ({
      label: g.label,
      links: servicesIn(g.key).map((s) => ({ label: s.menu, href: serviceUrl(s.slug) })),
    })),
  },
  { label: "Our Brands", href: "/leadcrystal/", links: [{ label: "Leadcrystal", href: "/leadcrystal/" }] },
  { label: "News", href: "/news/" },
  {
    label: "About",
    href: "/company-overview/",
    links: [
      { label: "Company overview", href: "/company-overview/" },
      { label: "Partners", href: "/company-overview/our-partners/" },
      { label: "Careers", href: "/company-overview/careers/" },
    ],
  },
];

export const PARTNERS = [
  { name: "Lead Crystal Technologies", logo: "lead-crystal" },
  { name: "Servotel", logo: "servotel" },
  { name: "NP Digital (Neil Patel Digital)", logo: "np-digital" },
  { name: "SOHO Hospitality", logo: "soho-hospitality" },
  { name: "Keos", logo: "keos" },
  { name: "ECore", logo: "ecore" },
  { name: "Vibe Squad", logo: "vibe-squad" },
];

export const VALUES = [
  ["Integrity", "We prioritize honesty and transparency in every decision, ensuring that our actions always align with our ethical standards."],
  ["Client-Centricity", "We place our clients at the forefront of everything we do, tailoring solutions to fit their unique needs and objectives, focused on their success."],
  ["Accountability", "Owning our actions and decisions, we deliver on our promises, acknowledging and rectifying our mistakes with utmost responsibility."],
  ["Results Driven", "Our focus remains on delivering measurable outcomes, ensuring that every effort contributes tangibly to our clients' success stories."],
  ["Innovation", "Continuously evolving, we embrace new ideas and technologies to provide advanced solutions for today's dynamic market challenges."],
  ["Collaboration", "Believing in collective growth, we foster an environment of teamwork, combining diverse talents to achieve shared visions and goals."],
  ["Respect", "Recognizing the value in every individual and idea, we cultivate an inclusive culture where respect guides every interaction and decision."],
  ["Excellence", "With an unwavering commitment to quality, we push boundaries, striving for excellence in every service we render to our clients."],
] as const;
