/* ──────────────────────────────────────────────────────────────────────────────
   Demo data for the Authentic Regional Cuisine Template
   Restaurant: "Rasoi Heritage" — an authentic Indian regional cuisine restaurant
   ────────────────────────────────────────────────────────────────────────── */

import type {
  RegionalRestaurantData,
  RegionalMenuData,
  RegionalTemplateConfig,
} from "@/types/regional-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Restaurant Data
   ════════════════════════════════════════════════════════════════════════════ */
export const demoRegionalRestaurant: RegionalRestaurantData = {
  name: "Rasoi Heritage",
  tagline: "Recipes Passed Down. Never Written.",
  nativeText: "रसोई विरासत — पीढ़ियों का स्वाद",
  heroImage:
    "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=1920",

  awards: [
    { id: "a1", label: "Times Food Award 2024", icon: "🏆" },
    { id: "a2", label: "Culinary Heritage Award", icon: "🎖️" },
  ],

  heritage: [
    {
      id: "h1",
      year: "1947",
      heading: "Where It All Began",
      body: "In a small kitchen in Lucknow, our great-grandmother Savitri Devi cooked for the neighbourhood. Her dum biryani and slow-cooked curries became legendary within the old city walls. Recipes whispered from mother to daughter, never written, always tasted.",
      image:
        "https://images.pexels.com/photos/4057691/pexels-photo-4057691.jpeg?auto=compress&cs=tinysrgb&w=800",
      imageAlt: "Vintage kitchen with brass utensils",
    },
    {
      id: "h2",
      year: "1978",
      heading: "The First Rasoi",
      body: "Our grandfather opened the first Rasoi — a 10-seat eatery near Aminabad. The menu was simple: three curries, fresh rotis, and a dessert that changed with the season. Customers didn't choose. They trusted.",
      image:
        "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800",
      imageAlt: "Small traditional Indian restaurant interior",
    },
    {
      id: "h3",
      year: "2005",
      heading: "Heritage Rediscovered",
      body: "Chef Arjun returned from culinary school in Paris with a mission: honour the old recipes but present them with modern finesse. He preserved the soul — the spice blends, the slow-cooking methods — and elevated the presentation.",
      image:
        "https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=800",
      imageAlt: "Modern plated Indian dish",
    },
    {
      id: "h4",
      year: "Today",
      heading: "A Living Legacy",
      body: "Rasoi Heritage is more than a restaurant. It's a living archive of flavours from Lucknow, Hyderabad, Kolkata, and the Malabar coast. Every dish tells the story of a region, a family, and a tradition that refuses to be forgotten.",
      image:
        "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800",
      imageAlt: "Beautiful spread of Indian dishes on wooden table",
    },
  ],

  setMenu: {
    title: "The Grand Thali Experience",
    description:
      "A curated journey through India's regional flavours — 12 elements, one plate, one unforgettable meal. Each component is prepared using heirloom recipes and locally sourced ingredients.",
    image:
      "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=800",
    price: 1499,
    currency: "₹",
    items: [
      {
        id: "t1",
        name: "Dal Makhani",
        description: "24-hour slow-cooked black lentils with hand-churned butter",
      },
      {
        id: "t2",
        name: "Lucknowi Biryani",
        description: "Fragrant dum biryani with saffron and aged basmati",
      },
      {
        id: "t3",
        name: "Paneer Lababdar",
        description: "Cottage cheese in rich tomato and cashew gravy",
      },
      {
        id: "t4",
        name: "Malabar Fish Curry",
        description: "Coconut-based curry with fresh catch of the day",
      },
      {
        id: "t5",
        name: "Assorted Breads",
        description: "Tandoori roti, garlic naan, and laccha paratha",
      },
      {
        id: "t6",
        name: "Seasonal Raita",
        description: "Cucumber-mint yoghurt with roasted cumin",
      },
      {
        id: "t7",
        name: "Pickle Selection",
        description: "House-made mango, lime, and chilli pickles",
      },
      {
        id: "t8",
        name: "Gulab Jamun",
        description: "Saffron-soaked milk dumplings with pistachio dust",
      },
    ],
  },

  events: [
    {
      id: "e1",
      title: "Wedding & Sangeet Feasts",
      description:
        "Transform your celebration with authentic regional menus curated for 50 to 500 guests. Custom decor, live cooking stations, and dedicated event management.",
      image:
        "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "e2",
      title: "Festival Dining",
      description:
        "Celebrate Diwali, Eid, Pongal, and Navratri with curated festival menus that honour the culinary traditions of each occasion.",
      image:
        "https://images.pexels.com/photos/5713000/pexels-photo-5713000.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "e3",
      title: "Private Chef's Table",
      description:
        "An exclusive 8-course tasting menu served in our heritage room. Limited to 12 guests per evening. Book two weeks in advance.",
      image:
        "https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ],

  chef: {
    name: "Chef Arjun Malhotra",
    title: "Executive Chef & Third-Generation Keeper of Recipes",
    quote:
      "Every spice in our kitchen carries a memory. When I cook my grandmother's dal, I don't follow a recipe — I follow a feeling. That's what heritage means. It lives in your hands, not on paper.",
    videoUrl: "",
    videoPoster:
      "https://images.pexels.com/photos/3814446/pexels-photo-3814446.jpeg?auto=compress&cs=tinysrgb&w=800",
    credentials: [
      "Le Cordon Bleu, Paris",
      "15+ Years Experience",
      "Times Food Award Winner",
      "Heritage Cuisine Specialist",
    ],
    image:
      "https://images.pexels.com/photos/3814446/pexels-photo-3814446.jpeg?auto=compress&cs=tinysrgb&w=800",
  },

  whatsappNumber: "+919876543210",
  whatsappMessage: "Hi Rasoi Heritage! I'd like to know today's special 🌶️",
};

/* ══════════════════════════════════════════════════════════════════════════════
   Menu Data
   ════════════════════════════════════════════════════════════════════════════ */
export const demoRegionalMenu: RegionalMenuData = {
  signatureItems: [
    {
      id: "s1",
      name: "Lucknowi Galouti Kebab",
      origin: "Lucknow, Uttar Pradesh",
      story: "Invented for a toothless Nawab — so tender it melts before you chew.",
      image:
        "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=600",
      spiceLevel: 2,
      chefRecommended: true,
      price: 595,
      currency: "₹",
    },
    {
      id: "s2",
      name: "Hyderabadi Dum Biryani",
      origin: "Hyderabad, Telangana",
      story: "Layers of saffron rice and slow-cooked meat, sealed and steamed to perfection.",
      image:
        "https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=600",
      spiceLevel: 3,
      chefRecommended: true,
      price: 749,
      currency: "₹",
    },
    {
      id: "s3",
      name: "Malabar Prawn Curry",
      origin: "Kerala, Malabar Coast",
      story: "Tiger prawns in a coconut and raw mango curry — the taste of the coast.",
      image:
        "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=600",
      spiceLevel: 4,
      price: 895,
      currency: "₹",
    },
    {
      id: "s4",
      name: "Rajasthani Laal Maas",
      origin: "Jodhpur, Rajasthan",
      story: "A warrior's curry — fiery red chillies and slow-braised mutton from the desert.",
      image:
        "https://images.pexels.com/photos/2679501/pexels-photo-2679501.jpeg?auto=compress&cs=tinysrgb&w=600",
      spiceLevel: 5,
      price: 849,
      currency: "₹",
    },
    {
      id: "s5",
      name: "Bengali Shorshe Ilish",
      origin: "Kolkata, West Bengal",
      story: "Hilsa fish in a pungent mustard paste — Bengal's most revered delicacy.",
      image:
        "https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=600",
      spiceLevel: 3,
      chefRecommended: true,
      price: 945,
      currency: "₹",
    },
    {
      id: "s6",
      name: "Chettinad Chicken",
      origin: "Karaikudi, Tamil Nadu",
      story: "Stone-ground spices and fresh curry leaves create this South Indian masterpiece.",
      image:
        "https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=600",
      spiceLevel: 4,
      price: 695,
      currency: "₹",
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════════
   Template Config
   ════════════════════════════════════════════════════════════════════════════ */
export const demoRegionalConfig: RegionalTemplateConfig = {
  template: "regional-authentic",
  theme: {
    primary: "#FF6B35",
    background: "#FFF9F0",
    accent: "#6B2737",
    highlight: "#D4AF37",
    text: "#2B2B2B",
  },
  sections: [
    { type: "hero", variant: "culturalHero" },
    { type: "heritage", variant: "storyScroll" },
    { type: "signatureDishes", variant: "originCards" },
    { type: "setMenu", variant: "thaliExperience" },
    { type: "events", variant: "privateDining" },
    { type: "chef", variant: "videoStory" },
  ],
};
