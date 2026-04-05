import type {
  FamilyRestaurantData,
  FamilyMenuData,
  FamilyTemplateConfig,
} from "@/types/family-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Demo data for the Family Comfort template preview.
   In production, this comes from the database via props.
   ════════════════════════════════════════════════════════════════════════════ */

export const demoFamilyConfig: FamilyTemplateConfig = {
  template: "family-comfort",
  theme: {
    primary: "#C4622D",
    background: "#FFF8EE",
    accent: "#5C6B3A",
    text: "#3B2A1A",
  },
  sections: [
    { type: "hero", variant: "familyHero" },
    { type: "todaySpecial", variant: "storyCard" },
    { type: "story", variant: "timelineWarm" },
    { type: "menu", variant: "occasionTabs" },
    { type: "catering", variant: "simpleForm" },
    { type: "community", variant: "eventsWarm" },
  ],
};

export const demoFamilyRestaurant: FamilyRestaurantData = {
  name: "Nana's Kitchen",
  tagline:
    "Where every meal is a homecoming and every recipe carries a memory",
  heroImage:
    "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920",
  trustText:
    "Family-owned since 1994 · 4.9★ Google Rating · Over 100,000 meals served with love",
  phone: "+1 (555) 234-5678",
  whatsapp: "+15552345678",
  address: "12 Maple Lane, Willow Creek, CA 95006",
  todaySpecial: {
    name: "Grandma Rose's Pot Roast",
    image:
      "https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&cs=tinysrgb&w=800",
    story:
      "This recipe has been in our family for four generations. Grandma Rose would slow-cook it every Sunday with fresh herbs from her garden. We still use her exact method — because some things are too good to change.",
    price: 22.95,
    currency: "$",
  },
  storyTimeline: [
    {
      id: "t1",
      year: "1994",
      image:
        "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600",
      description:
        "Rose and Mario opened a small 20-seat diner on Maple Lane with nothing but family recipes and a big dream.",
      annotation: "Just us, a kitchen, and heart",
    },
    {
      id: "t2",
      year: "2003",
      image:
        "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600",
      description:
        "Featured in 'Best Family Restaurants in California.' The line started going around the block on Sundays.",
      annotation: "Our first write-up — we cried happy tears!",
    },
    {
      id: "t3",
      year: "2015",
      image:
        "https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=600",
      description:
        "Daughter Sofia takes over the kitchen, bringing new flavors while keeping the soul of Grandma Rose alive.",
      annotation: "Passing the apron to the next generation",
    },
    {
      id: "t4",
      year: "2024",
      image:
        "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=600",
      description:
        "Celebrating 30 years of serving Willow Creek. Expanded catering service launches to bring our food to your celebrations.",
    },
  ],
  community: [
    {
      id: "c1",
      title: "Sunday Family Brunch",
      description:
        "Every Sunday from 10 AM — live acoustic music, bottomless pancakes, and good vibes for the whole family.",
      image:
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
      tag: "Weekly Event",
      date: "Every Sunday, 10 AM - 2 PM",
    },
    {
      id: "c2",
      title: "Kids Cooking Class",
      description:
        "Little chefs learn to make pasta from scratch! Ages 5-12. Includes apron, ingredients, and a take-home recipe card.",
      image:
        "https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=600",
      tag: "Class",
      date: "Saturdays, 11 AM",
    },
    {
      id: "c3",
      title: "Loyalty Family Card",
      description:
        "Earn a stamp with every family meal. After 10 stamps, enjoy a free family platter on us. Because loyalty deserves love.",
      image:
        "https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=600",
      tag: "Loyalty",
    },
  ],
};

export const demoFamilyMenu: FamilyMenuData = {
  items: [
    /* ── Sunday Lunch ────────────────────────────────────────────────── */
    {
      id: "sl1",
      name: "Grandma Rose's Pot Roast",
      description:
        "Slow-braised beef with roasted root vegetables, garlic mash, and gravy",
      price: 22.95,
      currency: "$",
      image:
        "https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&cs=tinysrgb&w=400",
      occasion: "sunday-lunch",
    },
    {
      id: "sl2",
      name: "Roasted Chicken Family Platter",
      description:
        "Whole herb-roasted chicken, cornbread, seasonal greens — serves 3-4",
      price: 38.0,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2673353/pexels-photo-2673353.jpeg?auto=compress&cs=tinysrgb&w=400",
      occasion: "sunday-lunch",
    },
    {
      id: "sl3",
      name: "Mushroom & Thyme Risotto",
      description:
        "Creamy arborio rice, wild mushrooms, aged parmesan, truffle drizzle",
      price: 18.5,
      currency: "$",
      image:
        "https://images.pexels.com/photos/6287525/pexels-photo-6287525.jpeg?auto=compress&cs=tinysrgb&w=400",
      occasion: "sunday-lunch",
    },
    {
      id: "sl4",
      name: "Warm Apple Cobbler",
      description:
        "Cinnamon-spiced apples, buttery crumble, vanilla bean ice cream",
      price: 10.95,
      currency: "$",
      image:
        "https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400",
      occasion: "sunday-lunch",
    },

    /* ── Kids Menu ───────────────────────────────────────────────────── */
    {
      id: "k1",
      name: "Mini Cheese Burgers",
      description: "Two slider-size burgers with fries and a juice box",
      price: 8.95,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400",
      occasion: "kids",
    },
    {
      id: "k2",
      name: "Mac & Cheese Bites",
      description: "Crispy fried mac and cheese balls with ketchup",
      price: 6.5,
      currency: "$",
      occasion: "kids",
    },
    {
      id: "k3",
      name: "Dino Nuggets Plate",
      description: "Fun-shaped chicken nuggets, sweet potato fries, applesauce",
      price: 7.95,
      currency: "$",
      occasion: "kids",
    },
    {
      id: "k4",
      name: "PB&J Pancake Stack",
      description: "Fluffy pancakes layered with peanut butter and berry jam",
      price: 7.5,
      currency: "$",
      occasion: "kids",
    },

    /* ── Birthday Packages ───────────────────────────────────────────── */
    {
      id: "b1",
      name: "The Little Star Package",
      description:
        "Serves 10 kids — pizza, nuggets, fries, cake, party hats & balloons",
      price: 189.0,
      currency: "$",
      occasion: "birthday",
    },
    {
      id: "b2",
      name: "The Family Celebration",
      description:
        "Serves 20 — buffet of mains, sides, dessert bar, decorations included",
      price: 399.0,
      currency: "$",
      occasion: "birthday",
    },
    {
      id: "b3",
      name: "The Grand Party",
      description:
        "Serves 40 — full catering, private area, live music, custom cake",
      price: 799.0,
      currency: "$",
      occasion: "birthday",
    },

    /* ── Corporate Catering ──────────────────────────────────────────── */
    {
      id: "cc1",
      name: "Working Lunch Box",
      description:
        "Sandwich, salad, cookie, drink — individually boxed. Min 10 orders.",
      price: 14.95,
      currency: "$",
      occasion: "catering",
    },
    {
      id: "cc2",
      name: "Executive Buffet",
      description:
        "Premium spread — grilled proteins, salads, sides, desserts. Min 25 guests.",
      price: 32.0,
      currency: "$",
      occasion: "catering",
    },
    {
      id: "cc3",
      name: "Breakfast Meeting Platter",
      description:
        "Pastries, fruit, yogurt parfaits, fresh juice, coffee. Serves 15.",
      price: 119.0,
      currency: "$",
      occasion: "catering",
    },
  ],
};
