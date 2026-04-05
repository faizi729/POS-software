/* ──────────────────────────────────────────────────────────────────────────────
   Demo data for the City Restaurant Template
   Restaurant: "Ember & Oak" — A premium dark-themed city restaurant
   ────────────────────────────────────────────────────────────────────────── */

import type {
  CityRestaurantData,
  CityMenuData,
  CityRestaurantTemplateConfig,
} from "@/types/city-restaurant-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Restaurant Data
   ════════════════════════════════════════════════════════════════════════════ */
export const demoCityRestaurant: CityRestaurantData = {
  name: "Ember & Oak",
  tagline: "Where Fire Meets Flavour",
  description:
    "Nestled in the heart of the city, Ember & Oak is a celebration of fire-kissed cuisine and artisan cocktails. Our chefs combine time-honoured techniques with modern innovation to deliver an unforgettable dining experience. Every dish tells a story of craft, passion, and the finest locally sourced ingredients.",
  heroImage:
    "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1920",
  aboutImage:
    "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800",
  gallery: [
    "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=600",
  ],
  rating: 4.8,
  reviews: 1247,
  established: "2011",
  location: "42 Connaught Place, New Delhi 110001",
  phone: "+91 11 4567 8900",
  whatsapp: "+911145678900",
  openingHours: {
    weekdays: "11:00 AM – 11:00 PM",
    weekends: "10:00 AM – 12:00 AM",
  },
  features: [
    "Farm-to-table ingredients",
    "Wood-fired kitchen",
    "Craft cocktail bar",
    "Private dining rooms",
    "Live jazz weekends",
    "Valet parking",
  ],
  stats: {
    customers: 25000,
    years: 14,
    dishes: 85,
  },
  testimonials: [
    {
      id: "t1",
      name: "Priya Sharma",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      text: "An absolutely magical experience. The wood-fired lamb was perfection, and the ambiance is unmatched in the city. Will definitely return!",
      date: "March 2026",
    },
    {
      id: "t2",
      name: "Arjun Mehta",
      avatar:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      text: "Celebrated our anniversary here and it was beyond expectations. The chef's tasting menu paired with their wine selection — outstanding.",
      date: "February 2026",
    },
    {
      id: "t3",
      name: "Sneha Kapoor",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 4,
      text: "Beautiful interiors, great cocktails, and the starters are genuinely some of the best I've had. Service was prompt and warm.",
      date: "January 2026",
    },
    {
      id: "t4",
      name: "Rahul Verma",
      avatar:
        "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      text: "Hosted a corporate dinner for 20 guests. The private dining room, custom menu, and attentive staff made it flawless. Highly recommend.",
      date: "December 2025",
    },
    {
      id: "t5",
      name: "Ananya Joshi",
      avatar:
        "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100",
      rating: 5,
      text: "The dessert game here is next level. Saffron crème brûlée and the chocolate lava cake are absolute must-tries.",
      date: "November 2025",
    },
  ],
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    youtube: "https://youtube.com",
  },
  navLinks: [
    { label: "Home", href: "#hero" },
    { label: "Menu", href: "#menu" },
    { label: "About", href: "#about" },
    { label: "Gallery", href: "#gallery" },
    { label: "Reviews", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════════
   Menu Data
   ════════════════════════════════════════════════════════════════════════════ */
export const demoCityMenu: CityMenuData = {
  items: [
    {
      id: "m1",
      name: "Truffle Mushroom Bruschetta",
      description: "Sourdough toast with wild mushroom duxelles, truffle oil, and aged parmesan shavings.",
      price: 495,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "starters",
      badge: "bestseller",
    },
    {
      id: "m2",
      name: "Charred Prawn Skewers",
      description: "Tiger prawns with lemon-herb butter, grilled over open flame. Served with sriracha aioli.",
      price: 695,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "starters",
    },
    {
      id: "m3",
      name: "Smoked Lamb Seekh Kebab",
      description: "Hand-minced lamb with aromatic spices, smoked in our tandoor. Served with mint chutney.",
      price: 595,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "starters",
      badge: "chef",
    },
    {
      id: "m4",
      name: "Wood-Fired Ribeye Steak",
      description: "28-day dry-aged ribeye, seared over oak wood. Served with roasted garlic butter and truffle fries.",
      price: 2495,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "mains",
      badge: "bestseller",
    },
    {
      id: "m5",
      name: "Slow-Braised Lamb Shank",
      description: "Fall-off-the-bone lamb in red wine reduction, creamy polenta, and seasonal vegetables.",
      price: 1895,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/2679501/pexels-photo-2679501.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "mains",
      badge: "chef",
    },
    {
      id: "m6",
      name: "Pan-Seared Sea Bass",
      description: "Chilean sea bass with saffron risotto, asparagus, and citrus beurre blanc.",
      price: 1695,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "mains",
    },
    {
      id: "m7",
      name: "Saffron Crème Brûlée",
      description: "Classic crème brûlée infused with Kashmiri saffron and torched to perfection.",
      price: 445,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/3026804/pexels-photo-3026804.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "desserts",
      badge: "bestseller",
    },
    {
      id: "m8",
      name: "Molten Chocolate Lava Cake",
      description: "Dark Belgian chocolate with a liquid centre, served with vanilla bean ice cream.",
      price: 495,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/4110008/pexels-photo-4110008.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "desserts",
    },
    {
      id: "m9",
      name: "Smoked Old Fashioned",
      description: "Bourbon, maple syrup, Angostura bitters — smoked tableside with applewood chips.",
      price: 795,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "drinks",
      badge: "chef",
    },
    {
      id: "m10",
      name: "Espresso Martini",
      description: "Freshly pulled espresso, vodka, Kahlúa, with a coffee bean garnish.",
      price: 695,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "drinks",
    },
    {
      id: "m11",
      name: "Rose & Lychee Spritz",
      description: "Refreshing rose-infused gin, lychee juice, and sparkling water. Garnished with edible flowers.",
      price: 595,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "drinks",
    },
    {
      id: "m12",
      name: "Masala Chai Panna Cotta",
      description: "Silky panna cotta infused with house-blend masala chai, topped with caramelised jaggery.",
      price: 395,
      currency: "₹",
      image:
        "https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "desserts",
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════════
   Template Config
   ════════════════════════════════════════════════════════════════════════════ */
export const demoCityConfig: CityRestaurantTemplateConfig = {
  template: "city-restaurant",
  theme: {
    primary: "#C4622D",
    accent: "#D4AF37",
    background: "#0D0D0D",
    text: "#F5F0EB",
  },
  sections: [
    { type: "hero", variant: "fullBleed" },
    { type: "stats", variant: "animatedBar" },
    { type: "menu", variant: "filterGrid" },
    { type: "about", variant: "splitLayout" },
    { type: "gallery", variant: "gridModal" },
    { type: "testimonials", variant: "carousel" },
    { type: "reservation", variant: "inlineForm" },
    { type: "info", variant: "contactStrip" },
  ],
};
