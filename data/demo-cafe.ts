import type {
  CafeRestaurantData,
  CafeMenuData,
  CafeTemplateConfig,
} from "@/types/cafe-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Demo data for the Minimal Aesthetic Cafe template preview.
   In production, this comes from the database via props.
   ════════════════════════════════════════════════════════════════════════════ */

export const demoCafeConfig: CafeTemplateConfig = {
  template: "minimal-cafe",
  theme: {
    background: "#F7F3EE",
    primary: "#D4A574",
    accent: "#87A96B",
    text: "#1C1917",
  },
  sections: [
    { type: "hero", variant: "splitMinimal" },
    { type: "menu", variant: "seasonalGrid" },
    { type: "space", variant: "interactiveGallery" },
    { type: "subscription", variant: "coffeePlans" },
    { type: "events", variant: "calendarCards" },
    { type: "gift", variant: "giftFlow" },
  ],
};

export const demoCafeRestaurant: CafeRestaurantData = {
  name: "Komorebi",
  tagline: "Your Third Place — between work and home, there's us.",
  heroImage:
    "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1200",
  todayBrew: "Ethiopian Yirgacheffe, light roast",
  workspaceInfo: "Free Wi-Fi · Power outlets at every seat",
  followers: "12.4k",
  instagramHandle: "komorebi.cafe",
  giftCardAmounts: [15, 25, 50, 75],
  giftCurrency: "$",

  spaceImages: [
    {
      id: "sp1",
      src: "https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Window seat with natural light",
      zone: "window-seat",
    },
    {
      id: "sp2",
      src: "https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Window corner workspace",
      zone: "window-seat",
    },
    {
      id: "sp3",
      src: "https://images.pexels.com/photos/1813466/pexels-photo-1813466.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Window reading nook",
      zone: "window-seat",
    },
    {
      id: "sp4",
      src: "https://images.pexels.com/photos/2747901/pexels-photo-2747901.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Cozy couch corner",
      zone: "couch",
    },
    {
      id: "sp5",
      src: "https://images.pexels.com/photos/1024359/pexels-photo-1024359.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Lounge sofa area",
      zone: "couch",
    },
    {
      id: "sp6",
      src: "https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Couch with plants",
      zone: "couch",
    },
    {
      id: "sp7",
      src: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Coffee bar counter",
      zone: "bar",
    },
    {
      id: "sp8",
      src: "https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Bar stools",
      zone: "bar",
    },
    {
      id: "sp9",
      src: "https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Barista at work",
      zone: "bar",
    },
  ],

  subscriptionPlans: [
    {
      id: "sub1",
      tier: "Basic",
      price: 19,
      currency: "$",
      period: "month",
      benefits: [
        "5 drip coffees per month",
        "10% off pastries",
        "Free refills on batch brew",
      ],
    },
    {
      id: "sub2",
      tier: "Standard",
      price: 39,
      currency: "$",
      period: "month",
      highlighted: true,
      benefits: [
        "Unlimited drip coffee",
        "3 specialty drinks per month",
        "15% off food menu",
        "Priority seating reservations",
      ],
    },
    {
      id: "sub3",
      tier: "Premium",
      price: 69,
      currency: "$",
      period: "month",
      benefits: [
        "Unlimited all drinks",
        "20% off everything",
        "Monthly cupping session invite",
        "Free guest drink per visit",
        "Exclusive merch drops",
      ],
    },
  ],

  events: [
    {
      id: "ev1",
      name: "Latte Art Workshop",
      date: "Apr 12, 2026",
      time: "2:00 PM",
      description:
        "Learn to pour hearts, rosettas, and tulips with our head barista. All skill levels. Materials included.",
      image:
        "https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: "ev2",
      name: "Vinyl & Pourover Evening",
      date: "Apr 19, 2026",
      time: "6:00 PM",
      description:
        "Bring your favorite records. We'll pour V60s and spin wax. Chill vibes only.",
      image:
        "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      id: "ev3",
      name: "Monthly Cupping: Colombia",
      date: "Apr 26, 2026",
      time: "11:00 AM",
      description:
        "Explore three single-origin Colombian lots. Guided tasting with flavor notes and origin stories.",
      image:
        "https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ],

  instagramImages: [
    {
      id: "ig1",
      src: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Latte art",
    },
    {
      id: "ig2",
      src: "https://images.pexels.com/photos/1813466/pexels-photo-1813466.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Interior light",
    },
    {
      id: "ig3",
      src: "https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Pour over",
    },
    {
      id: "ig4",
      src: "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Bar view",
    },
    {
      id: "ig5",
      src: "https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Barista pouring",
    },
    {
      id: "ig6",
      src: "https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=400",
      alt: "Window seat",
    },
  ],
};

export const demoCafeMenu: CafeMenuData = {
  items: [
    {
      id: "c1",
      name: "Single Origin Pourover",
      price: 6.5,
      currency: "$",
      image:
        "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600",
      tags: ["Seasonal", "Black"],
      ingredientStory:
        "Ethiopian Yirgacheffe, washed process. Notes of jasmine, bergamot, and stone fruit. Sourced from Konga cooperative.",
    },
    {
      id: "c2",
      name: "Oat Milk Flat White",
      price: 5.75,
      currency: "$",
      image:
        "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=600",
      tags: ["Vegan", "Popular"],
      ingredientStory:
        "Double ristretto shot with Oatly Barista, micro-foamed to velvety perfection. Our most ordered drink.",
    },
    {
      id: "c3",
      name: "Matcha Ceremonial Latte",
      price: 7.0,
      currency: "$",
      image:
        "https://images.pexels.com/photos/5946720/pexels-photo-5946720.jpeg?auto=compress&cs=tinysrgb&w=600",
      tags: ["Vegan", "GF"],
      ingredientStory:
        "Uji ceremonial grade matcha from Kyoto, whisked traditionally and topped with your choice of milk.",
    },
    {
      id: "c4",
      name: "Cardamom Rose Latte",
      price: 6.75,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2615323/pexels-photo-2615323.jpeg?auto=compress&cs=tinysrgb&w=600",
      tags: ["Seasonal", "Signature"],
      ingredientStory:
        "House-made cardamom syrup with Persian rosewater. A meditative cup inspired by Middle Eastern coffee houses.",
    },
    {
      id: "c5",
      name: "Sourdough Toast & Ricotta",
      price: 9.5,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=600",
      tags: ["Vegetarian"],
      ingredientStory:
        "48-hour fermented sourdough from our partner bakery, topped with fresh ricotta, raw honey, and seasonal fruit.",
    },
    {
      id: "c6",
      name: "Almond Croissant",
      price: 5.25,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=600",
      tags: ["Vegetarian", "Popular"],
      ingredientStory:
        "Twice-baked with frangipane filling and toasted almond flakes. Baked fresh every morning at 6 AM.",
    },
  ],
};
