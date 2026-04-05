import type {
  RestaurantData,
  MenuData,
  TemplateConfig,
} from "@/types/luxury-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Demo data for the Luxury Fine Dining template preview.
   In production, this data comes from the database via props.
   ════════════════════════════════════════════════════════════════════════════ */

export const demoConfig: TemplateConfig = {
  template: "luxury-fine-dining",
  theme: {
    primary: "#c9a84c",
    background: "#1a1a1a",
    text: "#f5f0eb",
  },
  sections: [
    { type: "hero", variant: "videoLuxury" },
    { type: "signatureDishes", variant: "carouselLuxury" },
    { type: "chefStory", variant: "splitLuxury" },
    { type: "gallery", variant: "masonryLuxury" },
    { type: "testimonials", variant: "luxuryQuotes" },
    { type: "reservation", variant: "inlineLuxury" },
  ],
};

export const demoRestaurantData: RestaurantData = {
  name: "Aurum & Sage",
  tagline: "Where every course tells a story, and every flavor leaves a legacy",
  heroVideo:
    "https://videos.pexels.com/video-files/3997793/3997793-uhd_2560_1440_30fps.mp4",
  heroPoster:
    "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1920",
  availability: "Open Tuesday – Sunday · Dinner from 6:00 PM",
  nextAvailable: "Tonight, 7:30 PM",
  award: {
    label: "Michelin Starred",
    icon: "⭐",
  },
  chef: {
    name: "Chef Isabella Marchetti",
    title: "Executive Chef & Founder",
    image:
      "https://images.pexels.com/photos/3814446/pexels-photo-3814446.jpeg?auto=compress&cs=tinysrgb&w=800",
    quote:
      "Cooking is not about ingredients — it is about intention, memory, and the courage to create something that has never existed before.",
    bio: "Trained in the kitchens of Lyon and Tokyo, Chef Marchetti brings 18 years of mastery to every plate. Her philosophy weaves seasonal produce with ancestral techniques, earning Aurum & Sage its coveted Michelin star within two years of opening.",
  },
  gallery: [
    {
      id: "g1",
      src: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Plated fine dining dish",
      span: "tall",
    },
    {
      id: "g2",
      src: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Restaurant interior ambiance",
    },
    {
      id: "g3",
      src: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Cocktail bar setting",
      span: "wide",
    },
    {
      id: "g4",
      src: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Signature pasta dish",
    },
    {
      id: "g5",
      src: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Chef plating in kitchen",
      span: "tall",
    },
    {
      id: "g6",
      src: "https://images.pexels.com/photos/541216/pexels-photo-541216.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Wine cellar",
    },
    {
      id: "g7",
      src: "https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Dessert presentation",
    },
    {
      id: "g8",
      src: "https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "Table setting detail",
      span: "wide",
    },
  ],
  reviews: [
    {
      id: "r1",
      author: "James Worthington",
      rating: 5,
      text: "An extraordinary dining experience from start to finish. The tasting menu was a journey — every bite meticulously crafted, every pairing inspired. This is what fine dining should feel like.",
      source: "Google",
      date: "2025-11-14",
    },
    {
      id: "r2",
      author: "Sophia Laurent",
      rating: 5,
      text: "We celebrated our anniversary here and it was nothing short of magical. The ambiance, the service, the food — everything was flawless. Chef Marchetti is a true artist.",
      source: "TripAdvisor",
      date: "2025-10-08",
    },
    {
      id: "r3",
      author: "David Chen",
      rating: 5,
      text: "The wagyu course alone is worth the visit. Paired with their curated sake selection, it was a revelation. Already planning my next reservation.",
      source: "Google",
      date: "2025-12-02",
    },
    {
      id: "r4",
      author: "Amelia Thornton",
      rating: 4,
      text: "Impeccable flavors and beautiful presentation. The sommelier's pairings elevated every course. A truly memorable evening in every sense.",
      source: "TripAdvisor",
      date: "2026-01-19",
    },
  ],
  phone: "+1 (555) 987-6543",
  address: "42 Gold Leaf Avenue, Downtown Arts District",
};

export const demoMenuData: MenuData = {
  featuredItems: [
    {
      id: "f1",
      name: "Seared Wagyu A5",
      description:
        "Japanese wagyu with truffle jus, roasted bone marrow, and smoked potato purée",
      price: 145,
      currency: "$",
      image:
        "https://images.pexels.com/photos/3535383/pexels-photo-3535383.jpeg?auto=compress&cs=tinysrgb&w=600",
      tag: "Chef's Pick",
    },
    {
      id: "f2",
      name: "Black Truffle Risotto",
      description:
        "Carnaroli rice, aged Parmigiano-Reggiano, shaved Périgord truffle",
      price: 78,
      currency: "$",
      image:
        "https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "f3",
      name: "Lobster Thermidor",
      description:
        "Whole Maine lobster, cognac cream, gruyère gratin, tarragon butter",
      price: 120,
      currency: "$",
      image:
        "https://images.pexels.com/photos/8694614/pexels-photo-8694614.jpeg?auto=compress&cs=tinysrgb&w=600",
      tag: "New",
    },
    {
      id: "f4",
      name: "Omakase Sashimi",
      description:
        "Seven-piece selection of seasonal fish, yuzu ponzu, wasabi, pickled ginger",
      price: 95,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2323398/pexels-photo-2323398.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "f5",
      name: "Duck Confit Royale",
      description:
        "72-hour slow-cooked duck leg, cherry gastrique, foie gras mousse",
      price: 88,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      id: "f6",
      name: "Gold Leaf Tiramisu",
      description:
        "Mascarpone cream, espresso-soaked savoiardi, 24k edible gold",
      price: 42,
      currency: "$",
      image:
        "https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=600",
      tag: "Signature",
    },
  ],
};
