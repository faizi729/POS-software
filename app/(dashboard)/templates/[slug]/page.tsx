"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Info,
  MapPin,
  Monitor,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  RefreshCw,
  Save,
  Share2,
  Smartphone,
  Tablet,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Template meta: theme keys & default values per template ─────────────── */
interface TemplateMeta {
  slug: string;
  name: string;
  themeKeys: { key: string; label: string }[];
  defaults: {
    theme: Record<string, string>;
    restaurant: {
      name: string;
      tagline: string;
      description: string;
      heroImage: string;
      aboutImage: string;
      phone: string;
      whatsapp: string;
      location: string;
      weekdayHours: string;
      weekendHours: string;
      instagram: string;
      facebook: string;
      twitter: string;
      youtube: string;
    };
  };
}

const TEMPLATE_META: Record<string, TemplateMeta> = {
  "city-restaurant": {
    slug: "city-restaurant",
    name: "City Restaurant",
    themeKeys: [
      { key: "primary", label: "Primary Color" },
      { key: "accent", label: "Accent Color" },
      { key: "background", label: "Background" },
      { key: "text", label: "Text Color" },
    ],
    defaults: {
      theme: { primary: "#C4622D", accent: "#D4AF37", background: "#0D0D0D", text: "#F5F0EB" },
      restaurant: {
        name: "Ember & Oak",
        tagline: "Where Fire Meets Flavour",
        description:
          "Nestled in the heart of the city, Ember & Oak is a celebration of fire-kissed cuisine and artisan cocktails.",
        heroImage:
          "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1920",
        aboutImage:
          "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800",
        phone: "+91 11 4567 8900",
        whatsapp: "+911145678900",
        location: "42 Connaught Place, New Delhi 110001",
        weekdayHours: "11:00 AM – 11:00 PM",
        weekendHours: "10:00 AM – 12:00 AM",
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        youtube: "https://youtube.com",
      },
    },
  },
  "luxury-fine-dining": {
    slug: "luxury-fine-dining",
    name: "Luxury Fine Dining",
    themeKeys: [
      { key: "primary", label: "Primary (Gold)" },
      { key: "background", label: "Background" },
      { key: "text", label: "Text Color" },
    ],
    defaults: {
      theme: { primary: "#c9a84c", background: "#1a1a1a", text: "#f5f0eb" },
      restaurant: {
        name: "Aurum & Sage",
        tagline: "Where every course tells a story, and every flavor leaves a legacy",
        description:
          "Aurum Dining blends timeless elegance with modern culinary artistry. Every dish is a masterpiece.",
        heroImage:
          "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1920",
        aboutImage:
          "https://images.pexels.com/photos/3814446/pexels-photo-3814446.jpeg?auto=compress&cs=tinysrgb&w=800",
        phone: "+91 11 4567 8900",
        whatsapp: "+911145678900",
        location: "42 Connaught Place, New Delhi 110001",
        weekdayHours: "6:00 PM – 11:00 PM",
        weekendHours: "12:00 PM – 11:00 PM",
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        youtube: "https://youtube.com",
      },
    },
  },
  "fast-casual-street": {
    slug: "fast-casual-street",
    name: "Fast Casual Street",
    themeKeys: [
      { key: "primary", label: "Primary (Neon)" },
      { key: "accent", label: "Accent" },
      { key: "background", label: "Background" },
      { key: "text", label: "Text Color" },
    ],
    defaults: {
      theme: { primary: "#FFE600", accent: "#FF4D4D", background: "#000000", text: "#ffffff" },
      restaurant: {
        name: "BLAZE BITES",
        tagline: "NO BORING FOOD. EVER.",
        description:
          "Bold flavours, loud vibes, and food that slaps. Blaze Kitchen is where street meets gourmet.",
        heroImage:
          "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=1920",
        aboutImage:
          "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800",
        phone: "+91 98765 43210",
        whatsapp: "+919876543210",
        location: "12 Brigade Road, Bengaluru 560001",
        weekdayHours: "11:00 AM – 12:00 AM",
        weekendHours: "11:00 AM – 1:00 AM",
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        twitter: "https://twitter.com",
        youtube: "https://youtube.com",
      },
    },
  },
  "family-comfort": {
    slug: "family-comfort",
    name: "Family Comfort",
    themeKeys: [
      { key: "primary", label: "Primary (Warm)" },
      { key: "accent", label: "Accent" },
      { key: "background", label: "Background" },
      { key: "text", label: "Text Color" },
    ],
    defaults: {
      theme: { primary: "#C4622D", accent: "#5C6B3A", background: "#FFF8EE", text: "#3B2A1A" },
      restaurant: {
        name: "Nana's Kitchen",
        tagline: "Where every meal is a homecoming and every recipe carries a memory",
        description:
          "Family recipes passed down three generations. Real food, real love, real good.",
        heroImage:
          "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1920",
        aboutImage:
          "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800",
        phone: "+91 22 3456 7890",
        whatsapp: "+912234567890",
        location: "8 Hill Road, Bandra West, Mumbai 400050",
        weekdayHours: "8:00 AM – 10:00 PM",
        weekendHours: "8:00 AM – 11:00 PM",
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        twitter: "",
        youtube: "",
      },
    },
  },
  "minimal-cafe": {
    slug: "minimal-cafe",
    name: "Minimal Aesthetic Cafe",
    themeKeys: [
      { key: "primary", label: "Primary" },
      { key: "accent", label: "Accent" },
      { key: "background", label: "Background" },
      { key: "text", label: "Text Color" },
    ],
    defaults: {
      theme: { primary: "#D4A574", accent: "#87A96B", background: "#F7F3EE", text: "#1C1917" },
      restaurant: {
        name: "Komorebi",
        tagline: "Your Third Place — between work and home, there's us.",
        description:
          "Calm space, great coffee, minimal vibes. Work, read, or just be.",
        heroImage:
          "https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1920",
        aboutImage:
          "https://images.pexels.com/photos/683039/pexels-photo-683039.jpeg?auto=compress&cs=tinysrgb&w=800",
        phone: "+91 80 1234 5678",
        whatsapp: "+918012345678",
        location: "5 Indiranagar, Bengaluru 560038",
        weekdayHours: "7:30 AM – 9:00 PM",
        weekendHours: "8:00 AM – 10:00 PM",
        instagram: "https://instagram.com",
        facebook: "",
        twitter: "",
        youtube: "",
      },
    },
  },
  "regional-authentic": {
    slug: "regional-authentic",
    name: "Regional Authentic Cuisine",
    themeKeys: [
      { key: "primary", label: "Primary" },
      { key: "accent", label: "Accent" },
      { key: "background", label: "Background" },
      { key: "highlight", label: "Highlight" },
      { key: "text", label: "Text Color" },
    ],
    defaults: {
      theme: {
        primary: "#FF6B35",
        accent: "#6B2737",
        background: "#FFF9F0",
        highlight: "#D4AF37",
        text: "#2B2B2B",
      },
      restaurant: {
        name: "Rasoi Heritage",
        tagline: "Recipes Passed Down. Never Written.",
        description:
          "Authentic flavours from the heartland, served with stories and soul.",
        heroImage:
          "https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=1920",
        aboutImage:
          "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800",
        phone: "+91 141 234 5678",
        whatsapp: "+911412345678",
        location: "14 MI Road, Jaipur 302001",
        weekdayHours: "11:00 AM – 11:00 PM",
        weekendHours: "11:00 AM – 12:00 AM",
        instagram: "https://instagram.com",
        facebook: "https://facebook.com",
        twitter: "",
        youtube: "",
      },
    },
  },
};

/* ── Responsive preview sizes ────────────────────────────────────────────── */
type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

const DEVICE_ICONS: Record<Device, React.ReactNode> = {
  desktop: <Monitor className="h-3.5 w-3.5" />,
  tablet: <Tablet className="h-3.5 w-3.5" />,
  mobile: <Smartphone className="h-3.5 w-3.5" />,
};

/* ── Section collapse component ──────────────────────────────────────────── */
function EditorSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg-surface"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-text-primary">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="border-t border-border-subtle p-4 space-y-4">{children}</div>}
    </div>
  );
}

/* ── Color input ─────────────────────────────────────────────────────────── */
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-lg border border-border-subtle bg-transparent p-0.5"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-text-primary">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-[11px] font-mono text-text-secondary outline-none transition-colors focus:border-accent-primary"
        />
      </div>
    </div>
  );
}

/* ── Text input ──────────────────────────────────────────────────────────── */
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-primary">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary"
        />
      )}
    </div>
  );
}

/* ── Image input ─────────────────────────────────────────────────────────── */
function ImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-text-primary">{label}</label>
      <div className="space-y-2">
        {value && (
          <div className="relative h-24 w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image URL…"
          className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary"
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Template Editor Page — Full Control, Full Preview
   ════════════════════════════════════════════════════════════════════════════ */
export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const meta = TEMPLATE_META[slug];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect if template slug is invalid
  useEffect(() => {
    if (!meta) {
      router.replace("/templates");
    }
  }, [meta, router]);

  /* ── Editor state ──────────────────────────────────────────────────────── */
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [restaurant, setRestaurant] = useState({
    name: "",
    tagline: "",
    description: "",
    heroImage: "",
    aboutImage: "",
    phone: "",
    whatsapp: "",
    location: "",
    weekdayHours: "",
    weekendHours: "",
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
  });
  const [saved, setSaved] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [device, setDevice] = useState<Device>("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("preview");

  // Load saved data or defaults
  useEffect(() => {
    if (!meta) return;
    const stored = localStorage.getItem(`__pos_tpl_${slug}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTheme(parsed.theme || meta.defaults.theme);
        setRestaurant({ ...meta.defaults.restaurant, ...parsed.restaurant });
      } catch {
        setTheme({ ...meta.defaults.theme });
        setRestaurant({ ...meta.defaults.restaurant });
      }
    } else {
      setTheme({ ...meta.defaults.theme });
      setRestaurant({ ...meta.defaults.restaurant });
    }
    setHasLoaded(true);
  }, [meta, slug]);

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const updateTheme = (key: string, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateRestaurant = (key: string, value: string) => {
    setRestaurant((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const refreshPreview = useCallback(() => {
    setIframeKey((k) => k + 1);
  }, []);

  const handleSave = useCallback(() => {
    localStorage.setItem(
      `__pos_tpl_${slug}`,
      JSON.stringify({ theme, restaurant })
    );
    localStorage.setItem("__pos_selected_template", slug);
    setSaved(true);
    refreshPreview();
    setTimeout(() => setSaved(false), 2500);
  }, [slug, theme, restaurant, refreshPreview]);

  const handleReset = () => {
    if (!meta) return;
    setTheme({ ...meta.defaults.theme });
    setRestaurant({ ...meta.defaults.restaurant });
    localStorage.removeItem(`__pos_tpl_${slug}`);
    setSaved(false);
    refreshPreview();
  };

  if (!meta || !hasLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-text-muted">Loading editor…</p>
      </div>
    );
  }

  /* ── Editor panel content (shared between desktop & mobile) ────────── */
  const editorPanelContent = (
    <div className="space-y-4">
      {/* ─── Theme Colors ──────────────────────────────────────────────── */}
      <EditorSection
        title="Theme Colors"
        icon={<Palette className="h-4 w-4 text-accent-primary" />}
      >
        <div className="grid gap-3">
          {meta.themeKeys.map((tk) => (
            <ColorInput
              key={tk.key}
              label={tk.label}
              value={theme[tk.key] || "#000000"}
              onChange={(v) => updateTheme(tk.key, v)}
            />
          ))}
        </div>
      </EditorSection>

      {/* ─── Branding ──────────────────────────────────────────────────── */}
      <EditorSection
        title="Branding"
        icon={<Type className="h-4 w-4 text-violet-500" />}
      >
        <TextInput
          label="Restaurant Name"
          value={restaurant.name}
          onChange={(v) => updateRestaurant("name", v)}
          placeholder="Your Restaurant Name"
        />
        <TextInput
          label="Tagline"
          value={restaurant.tagline}
          onChange={(v) => updateRestaurant("tagline", v)}
          placeholder="Your catchy tagline"
        />
        <TextInput
          label="Description"
          value={restaurant.description}
          onChange={(v) => updateRestaurant("description", v)}
          placeholder="Tell your story…"
          multiline
        />
      </EditorSection>

      {/* ─── Images ────────────────────────────────────────────────────── */}
      <EditorSection
        title="Images"
        icon={<ImageIcon className="h-4 w-4 text-emerald-500" />}
      >
        <ImageInput
          label="Hero Image"
          value={restaurant.heroImage}
          onChange={(v) => updateRestaurant("heroImage", v)}
        />
        <ImageInput
          label="About / Chef Image"
          value={restaurant.aboutImage}
          onChange={(v) => updateRestaurant("aboutImage", v)}
        />
      </EditorSection>

      {/* ─── Contact Info ──────────────────────────────────────────────── */}
      <EditorSection
        title="Contact Info"
        icon={<Phone className="h-4 w-4 text-blue-500" />}
      >
        <TextInput
          label="Phone Number"
          value={restaurant.phone}
          onChange={(v) => updateRestaurant("phone", v)}
          placeholder="+91 XX XXXX XXXX"
        />
        <TextInput
          label="WhatsApp Number"
          value={restaurant.whatsapp}
          onChange={(v) => updateRestaurant("whatsapp", v)}
          placeholder="+91XXXXXXXXXX"
        />
      </EditorSection>

      {/* ─── Location & Hours ──────────────────────────────────────────── */}
      <EditorSection
        title="Location & Hours"
        icon={<MapPin className="h-4 w-4 text-red-500" />}
      >
        <TextInput
          label="Address"
          value={restaurant.location}
          onChange={(v) => updateRestaurant("location", v)}
          placeholder="Full restaurant address"
        />
        <TextInput
          label="Weekday Hours"
          value={restaurant.weekdayHours}
          onChange={(v) => updateRestaurant("weekdayHours", v)}
          placeholder="e.g. 11:00 AM – 11:00 PM"
        />
        <TextInput
          label="Weekend Hours"
          value={restaurant.weekendHours}
          onChange={(v) => updateRestaurant("weekendHours", v)}
          placeholder="e.g. 10:00 AM – 12:00 AM"
        />
      </EditorSection>

      {/* ─── Social Links ──────────────────────────────────────────────── */}
      <EditorSection
        title="Social Links"
        icon={<Share2 className="h-4 w-4 text-pink-500" />}
        defaultOpen={false}
      >
        <TextInput
          label="Instagram"
          value={restaurant.instagram}
          onChange={(v) => updateRestaurant("instagram", v)}
          placeholder="https://instagram.com/yourpage"
        />
        <TextInput
          label="Facebook"
          value={restaurant.facebook}
          onChange={(v) => updateRestaurant("facebook", v)}
          placeholder="https://facebook.com/yourpage"
        />
        <TextInput
          label="Twitter / X"
          value={restaurant.twitter}
          onChange={(v) => updateRestaurant("twitter", v)}
          placeholder="https://twitter.com/yourpage"
        />
        <TextInput
          label="YouTube"
          value={restaurant.youtube}
          onChange={(v) => updateRestaurant("youtube", v)}
          placeholder="https://youtube.com/yourchannel"
        />
      </EditorSection>

      {/* ─── Save button (inside panel) ────────────────────────────────── */}
      <button
        onClick={handleSave}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all",
          saved
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-accent-primary hover:bg-accent-primary-hover"
        )}
      >
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? "Saved & Applied!" : "Save & Apply Changes"}
      </button>

      {/* Tip */}
      <div className="flex items-start gap-2 rounded-lg bg-accent-primary/5 px-3 py-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-primary" />
        <p className="text-[11px] leading-relaxed text-text-secondary">
          Click <strong>Save &amp; Apply</strong> to update the live preview. Your
          changes are saved locally and will reflect in the template preview.
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        margin: "-1.5rem -1rem 0",
        height: "calc(100vh - 10rem)",
      }}
    >
      {/* ── Top toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border-subtle bg-bg-elevated px-4 py-2.5">
        {/* Left: Back + name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/templates")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-text-primary">
              Editing: {meta.name}
            </h2>
          </div>
        </div>

        {/* Center: Device selector (desktop only) */}
        <div className="hidden items-center gap-1 rounded-lg border border-border-subtle bg-bg-surface p-0.5 md:flex">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                device === d
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {DEVICE_ICONS[d]}
              <span className="hidden lg:inline capitalize">{d}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="hidden items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary md:flex"
            title={panelOpen ? "Hide editor panel" : "Show editor panel"}
          >
            {panelOpen ? (
              <PanelLeftClose className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">
              {panelOpen ? "Hide Panel" : "Edit"}
            </span>
          </button>

          <button
            onClick={refreshPreview}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
            title="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="hidden rounded-lg border border-border-subtle px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary sm:block"
          >
            Reset
          </button>

          <button
            onClick={handleSave}
            className={cn(
              "hidden items-center gap-1.5 rounded-lg px-4 py-1.5 text-[11px] font-semibold text-white transition-all sm:flex",
              saved
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-accent-primary hover:bg-accent-primary-hover"
            )}
          >
            {saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Saved!" : "Save & Apply"}
          </button>

          <Link
            href={`/template/${slug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Tab</span>
          </Link>
        </div>
      </div>

      {/* ── Mobile tab switcher ──────────────────────────────────────────── */}
      <div className="flex flex-shrink-0 border-b border-border-subtle md:hidden">
        <button
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 py-2.5 text-center text-xs font-semibold transition-colors",
            mobileTab === "preview"
              ? "border-b-2 border-accent-primary text-accent-primary"
              : "text-text-muted"
          )}
        >
          Preview
        </button>
        <button
          onClick={() => setMobileTab("edit")}
          className={cn(
            "flex-1 py-2.5 text-center text-xs font-semibold transition-colors",
            mobileTab === "edit"
              ? "border-b-2 border-accent-primary text-accent-primary"
              : "text-text-muted"
          )}
        >
          Customize
        </button>
      </div>

      {/* ── Main body: Editor panel + Iframe preview ─────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Editor panel — desktop (side panel) */}
        <div
          className={cn(
            "hidden flex-shrink-0 flex-col border-r border-border-subtle bg-bg-base transition-all duration-300 md:flex",
            panelOpen
              ? "w-[340px] lg:w-[380px]"
              : "w-0 overflow-hidden border-r-0"
          )}
        >
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {editorPanelContent}
          </div>
        </div>

        {/* Editor panel — mobile (full screen tab) */}
        <div
          className={cn(
            "absolute inset-0 z-10 overflow-y-auto bg-bg-base p-4 md:hidden",
            mobileTab === "edit" ? "block" : "hidden"
          )}
        >
          {editorPanelContent}
        </div>

        {/* Iframe preview area */}
        <div
          className={cn(
            "flex flex-1 flex-col items-center overflow-hidden bg-[#1a1a1a]",
            mobileTab === "edit" && "hidden md:flex"
          )}
        >
          <div
            className="flex h-full w-full justify-center overflow-hidden transition-all duration-300"
            style={{ padding: device === "desktop" ? "0" : "16px" }}
          >
            <div
              className={cn(
                "relative h-full overflow-hidden transition-all duration-300",
                device !== "desktop" &&
                  "rounded-xl border border-white/10 shadow-2xl"
              )}
              style={{
                width: DEVICE_WIDTHS[device],
                maxWidth: "100%",
              }}
            >
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={`/template/${slug}`}
                className="h-full w-full border-0"
                title={`${meta.name} Preview`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
