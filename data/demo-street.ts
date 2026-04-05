import type {
  StreetRestaurantData,
  StreetMenuData,
  StreetTemplateConfig,
} from "@/types/street-template";

/* ══════════════════════════════════════════════════════════════════════════════
   Demo data for the Fast Casual Street template preview.
   In production, this comes from the database via props.
   ════════════════════════════════════════════════════════════════════════════ */

export const demoStreetConfig: StreetTemplateConfig = {
  template: "fast-casual-street",
  theme: {
    background: "#000000",
    primary: "#FFE600",
    accent: "#FF4D4D",
    text: "#ffffff",
  },
  sections: [
    { type: "hero", variant: "streetHero" },
    { type: "menu", variant: "filterGridStreet" },
    { type: "builder", variant: "customBuilder" },
    { type: "social", variant: "instagramWall" },
    { type: "rewards", variant: "loyaltyPunch" },
    { type: "location", variant: "mapHours" },
  ],
};

export const demoStreetRestaurant: StreetRestaurantData = {
  name: "BLAZE BITES",
  tagline: "NO BORING FOOD. EVER.",
  subheading:
    "Smashed burgers, loaded fries, and zero regrets. Built for flavor chasers.",
  heroImage:
    "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1920",
  waitTime: "~12 min wait",
  loyaltyText: "🎉 Earn 2x points this weekend!",
  socialImages: [
    {
      id: "s1",
      src: "https://images.pexels.com/photos/1556688/pexels-photo-1556688.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Loaded burger",
    },
    {
      id: "s2",
      src: "https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Fries close-up",
    },
    {
      id: "s3",
      src: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Bowl plating",
    },
    {
      id: "s4",
      src: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Pizza spread",
    },
    {
      id: "s5",
      src: "https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Taco lineup",
    },
    {
      id: "s6",
      src: "https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Milkshake pair",
    },
    {
      id: "s7",
      src: "https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Burger drip",
    },
    {
      id: "s8",
      src: "https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=600",
      alt: "Neon dining",
    },
  ],
  rewards: {
    current: 7,
    total: 10,
    rewardText: "Buy 9 meals, get the 10th FREE 🎁",
  },
  location: {
    address: "88 Neon Strip, Downtown Food District, Block C",
    phone: "+1 (555) 420-6969",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.835434509374!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ2JzI5LjYiTiAxMjLCsDI1JzA5LjgiVw!5e0!3m2!1sen!2sus!4v1",
    hours: [
      { day: "Mon - Thu", open: "11:00 AM", close: "11:00 PM" },
      { day: "Fri - Sat", open: "11:00 AM", close: "2:00 AM" },
      { day: "Sunday", open: "12:00 PM", close: "10:00 PM" },
    ],
    isOpen: true,
  },
  builderSteps: [
    {
      id: "base",
      label: "Pick Your Base",
      options: [
        { id: "b1", name: "Smash Bun", price: 4.99 },
        { id: "b2", name: "Tortilla Wrap", price: 3.99 },
        { id: "b3", name: "Rice Bowl", price: 4.49 },
        { id: "b4", name: "Lettuce Wrap", price: 3.49 },
      ],
    },
    {
      id: "protein",
      label: "Choose Protein",
      options: [
        { id: "p1", name: "Smashed Beef", price: 5.99 },
        { id: "p2", name: "Crispy Chicken", price: 4.99 },
        { id: "p3", name: "Grilled Paneer", price: 4.49 },
        { id: "p4", name: "Pulled Pork", price: 5.49 },
        { id: "p5", name: "Falafel", price: 3.99 },
      ],
    },
    {
      id: "toppings",
      label: "Load Toppings",
      multi: true,
      options: [
        { id: "t1", name: "Caramelized Onions", price: 0.99 },
        { id: "t2", name: "Jalapeños", price: 0.79 },
        { id: "t3", name: "Pickled Slaw", price: 0.99 },
        { id: "t4", name: "Avocado", price: 1.49 },
        { id: "t5", name: "Bacon Bits", price: 1.29 },
        { id: "t6", name: "Crispy Onion Rings", price: 1.19 },
      ],
    },
    {
      id: "sauce",
      label: "Drip Your Sauce",
      options: [
        { id: "sc1", name: "Blaze Sauce 🔥", price: 0 },
        { id: "sc2", name: "Truffle Mayo", price: 0.49 },
        { id: "sc3", name: "Chipotle Ranch", price: 0 },
        { id: "sc4", name: "Korean BBQ", price: 0.49 },
        { id: "sc5", name: "Garlic Butter", price: 0 },
      ],
    },
  ],
};

export const demoStreetMenu: StreetMenuData = {
  items: [
    {
      id: "m1",
      name: "The OG Smash",
      price: 12.99,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1556688/pexels-photo-1556688.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Burgers",
      tags: ["non-veg", "bestseller"],
      spiceLevel: 2,
      calories: 680,
      allergens: ["gluten", "dairy"],
      description: "Double smashed patty, American cheese, secret sauce",
    },
    {
      id: "m2",
      name: "Blaze Chicken Wrap",
      price: 10.99,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Wraps",
      tags: ["non-veg", "bestseller"],
      spiceLevel: 4,
      calories: 520,
      allergens: ["gluten"],
    },
    {
      id: "m3",
      name: "Paneer Inferno Bowl",
      price: 11.49,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Bowls",
      tags: ["veg", "bestseller"],
      spiceLevel: 5,
      calories: 450,
      allergens: ["dairy"],
    },
    {
      id: "m4",
      name: "Loaded Beast Fries",
      price: 8.99,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Sides",
      tags: ["non-veg"],
      spiceLevel: 3,
      calories: 780,
      allergens: ["dairy", "gluten"],
    },
    {
      id: "m5",
      name: "Veg Crunch Tacos",
      price: 9.49,
      currency: "$",
      image:
        "https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Tacos",
      tags: ["veg"],
      spiceLevel: 2,
      calories: 340,
      allergens: ["gluten"],
    },
    {
      id: "m6",
      name: "BBQ Pulled Pork Slider",
      price: 7.99,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Sliders",
      tags: ["non-veg"],
      spiceLevel: 1,
      calories: 420,
      allergens: ["gluten"],
    },
    {
      id: "m7",
      name: "Falafel Street Bowl",
      price: 10.49,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Bowls",
      tags: ["veg"],
      spiceLevel: 2,
      calories: 390,
      allergens: [],
    },
    {
      id: "m8",
      name: "Double Trouble Shake",
      price: 6.99,
      currency: "$",
      image:
        "https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=600",
      category: "Drinks",
      tags: ["veg", "bestseller"],
      spiceLevel: 0,
      calories: 560,
      allergens: ["dairy"],
    },
  ],
};
