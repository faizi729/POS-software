"use client";

import Link from "next/link";
import { ExternalLink, LayoutTemplate, Palette } from "lucide-react";

/* ── Template catalogue ───────────────────────────────────────────────────── */
const TEMPLATES = [
  {
    slug: "luxury-fine-dining",
    name: "Luxury Fine Dining",
    description:
      "A cinematic, premium, conversion-focused restaurant landing page. Dark tones, gold accents, serif elegance — designed for Michelin-star vibes.",
    vibe: "Cinematic · Premium · Elegant",
    color: "#c9a84c",
    bg: "#1a1a1a",
    preview:
      "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600",
    features: ["Video Hero", "Chef Story", "Masonry Gallery", "Reservation Form"],
  },
  {
    slug: "fast-casual-street",
    name: "Fast Casual Street",
    description:
      "A bold, high-energy, streetwear-style landing page. Black + neon, chunky type, Gen-Z approved — built to maximise order conversions.",
    vibe: "Bold · High-Energy · Gen-Z",
    color: "#FFE600",
    bg: "#000000",
    preview:
      "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600",
    features: ["Order Toggle", "Menu Filter Grid", "Build Your Own", "Loyalty Punch"],
  },
  {
    slug: "family-comfort",
    name: "Family Comfort",
    description:
      "A warm, nostalgic, emotionally inviting landing page that feels like Sunday at grandma's. Trust, emotion, and family bookings.",
    vibe: "Warm · Nostalgic · Trustworthy",
    color: "#C4622D",
    bg: "#FFF8EE",
    preview:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600",
    features: ["Story Timeline", "Occasion Tabs", "Catering Form", "Community Events"],
  },
  {
    slug: "minimal-cafe",
    name: "Minimal Aesthetic Cafe",
    description:
      "A calm, minimal, highly aesthetic cafe landing page. Scandinavian + Tokyo coffee culture — atmosphere, clarity, and subtle conversion.",
    vibe: "Calm · Minimal · Instagram-worthy",
    color: "#D4A574",
    bg: "#F7F3EE",
    preview:
      "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600",
    features: ["Split Hero", "Space Gallery", "Coffee Subscriptions", "Gift Cards"],
  },
  {
    slug: "regional-authentic",
    name: "Regional Authentic Cuisine",
    description:
      "A rich, immersive, story-driven landing page. Cultural storytelling, heritage scroll, and WhatsApp opt-in — designed for authenticity.",
    vibe: "Cultural · Immersive · Story-driven",
    color: "#FF6B35",
    bg: "#FFF9F0",
    preview:
      "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600",
    features: ["Heritage Scroll", "Origin Cards", "Thali Experience", "Chef Video"],
  },
  {
    slug: "city-restaurant",
    name: "City Restaurant",
    description:
      "A dark, premium, full-featured restaurant landing page. Fixed navbar, animated stats, menu filters, gallery lightbox, testimonial carousel, reservation form, and cookie notice.",
    vibe: "Dark · Premium · Full-featured",
    color: "#D4AF37",
    bg: "#0D0D0D",
    preview:
      "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600",
    features: ["Fixed Navbar", "Animated Stats", "Gallery Lightbox", "Reservation Form"],
  },
];

/* ══════════════════════════════════════════════════════════════════════════════
   Templates Gallery Page
   ════════════════════════════════════════════════════════════════════════════ */
export default function TemplatesGalleryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10">
            <LayoutTemplate className="h-5 w-5 text-accent-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Website Templates</h2>
            <p className="text-sm text-text-secondary">
              Choose a template and fully customize it — colors, images, text,
              contact info, social links — everything.
            </p>
          </div>
        </div>
      </div>

      {/* Template grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.slug}
            className="group surface-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            {/* Preview image */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={tpl.preview}
                alt={tpl.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Overlay gradient */}
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  background: `linear-gradient(to top, ${tpl.bg}, transparent)`,
                }}
              />
              {/* Accent bar */}
              <div
                className="absolute bottom-0 left-0 h-1 w-full"
                style={{ backgroundColor: tpl.color }}
              />
              {/* Open icon */}
              <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-primary opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded"
                  style={{ backgroundColor: `${tpl.color}22` }}
                >
                  <span
                    className="block h-2 w-2 rounded-full"
                    style={{ backgroundColor: tpl.color }}
                  />
                </span>
                <h3 className="text-sm font-bold text-text-primary">{tpl.name}</h3>
              </div>

              <p className="mb-3 text-xs leading-relaxed text-text-secondary line-clamp-2">
                {tpl.description}
              </p>

              {/* Vibe tag */}
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                {tpl.vibe}
              </p>

              {/* Feature pills */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {tpl.features.map((feat) => (
                  <span
                    key={feat}
                    className="rounded-full border border-border-subtle bg-bg-surface px-2 py-0.5 text-[10px] font-medium text-text-secondary"
                  >
                    {feat}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={{ pathname: "/templates/[slug]", query: { slug: tpl.slug } }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-accent-primary-hover"
                >
                  <Palette className="h-3.5 w-3.5" />
                  Select &amp; Customize
                </Link>
                <Link
                  href={{ pathname: "/template/[slug]", query: { slug: tpl.slug } }}
                  target="_blank"
                  className="flex items-center justify-center rounded-xl border border-border-subtle px-3 py-2.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                  title="Preview"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
