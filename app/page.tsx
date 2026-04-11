import type { Metadata, Viewport } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BellRing,
  Building2,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Layers,
  MousePointerClick,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Webhook,
  Zap
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "The POS that Publishes Your Website Menu — Instantly",
  description:
    "Update once in POS → instantly updates on your website. Stop refunds, stop double entry, and keep your menu accurate everywhere automatically."
};

/** Ensures correct mobile layout even if root layout metadata is customized elsewhere. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover"
};

const PRIMARY_CTA_HREF = "/demo" as const;
const LOGIN_HREF = "/login" as const;
const SECONDARY_CTA_HREF = "#proof";
const PRIMARY_CTA_TEXT = "See your menu sync";
/** Shorter label for narrow viewports so CTAs stay usable */
const PRIMARY_CTA_TEXT_SHORT = "See menu sync live (15 min)";
const SECONDARY_CTA_TEXT = "Watch the 20‑second proof";

export default function HomePage() {
  return (
    <main className="relative w-full max-w-full min-w-0 overflow-x-clip break-words">
      <SkipLink />
      <TopNav />

      <div id="main" className="scroll-mt-[max(5rem,env(safe-area-inset-top,0px)+3.5rem)] sm:scroll-mt-24">
        <Hero />
        <HardPain />
        <OldVsNew />
        <Problem />
        <Solution />
        <UniqueMechanism />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </div>

      <MobileStickyCTA />
      <Footer />
    </main>
  );
}

function buttonClass({
  variant = "primary",
  size = "default",
  className
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const variants = {
    primary:
      "bg-accent-primary text-white hover:bg-accent-primary-hover active:scale-[0.99]",
    secondary:
      "border border-border-subtle bg-bg-surface text-text-primary hover:border-border-strong hover:bg-white active:scale-[0.99]",
    ghost:
      "bg-transparent text-text-secondary hover:bg-bg-surface hover:text-text-primary active:scale-[0.99]"
  } as const;

  const sizes = {
    default: "h-10 px-4",
    sm: "h-9 px-3",
    lg: "h-12 px-5",
    icon: "h-9 w-9"
  } as const;

  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-primary focus:shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
    >
      Skip to content
    </a>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-[rgba(255,253,249,0.82)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(255,253,249,0.72)]">
      <div className="section-shell py-3 sm:py-4">
        <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-3">
          <Link
            href="/"
            className="group inline-flex min-w-0 max-w-[min(100%,11.5rem)] flex-1 items-center gap-1.5 sm:max-w-none sm:flex-none sm:gap-2"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl border border-border-subtle bg-bg-elevated shadow-soft sm:size-10">
              <UtensilsCrossed className="size-[1.125rem] text-accent-primary sm:size-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[0.8125rem] font-semibold text-text-primary sm:text-sm">Restaurant OS</p>
              <p className="hidden text-xs text-text-muted sm:block">POS + Website + Menu Sync</p>
            </div>
          </Link>

          <nav className="hidden min-w-0 items-center gap-0.5 lg:flex lg:gap-1">
            <NavLink href="#features">Outcomes</NavLink>
            <NavLink href="#how">How it works</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            <details className="group relative lg:hidden">
              <summary
                className="flex h-10 min-h-10 cursor-pointer list-none items-center gap-1 rounded-xl border border-border-subtle bg-bg-surface px-2.5 py-0 text-xs font-semibold text-text-primary shadow-sm transition hover:border-border-strong sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm [&::-webkit-details-marker]:hidden"
                aria-label="Open page sections menu"
              >
                Menu
                <ChevronRight className="size-3.5 shrink-0 transition group-open:rotate-90 sm:size-4" />
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100dvw-1.25rem))] rounded-2xl border border-border-subtle bg-bg-elevated p-2 shadow-soft">
                <div className="flex flex-col gap-0.5">
                  <MobileNavRow href="#features">Outcomes</MobileNavRow>
                  <MobileNavRow href="#how">How it works</MobileNavRow>
                  <MobileNavRow href="#pricing">Pricing</MobileNavRow>
                  <MobileNavRow href="#faq">FAQ</MobileNavRow>
                  <MobileNavRow href="#proof">Live proof</MobileNavRow>
                </div>
              </div>
            </details>

            <Link
              href={LOGIN_HREF}
              className="hidden rounded-xl px-2 py-2 text-sm font-semibold text-text-secondary transition hover:bg-bg-surface hover:text-text-primary sm:inline-flex md:px-3"
            >
              Sign in
            </Link>
            <Link
              href={PRIMARY_CTA_HREF}
              className={cn(
                "hidden md:inline-flex lg:hidden",
                buttonClass({ size: "sm", variant: "primary", className: "shrink-0 px-2.5 sm:px-3" })
              )}
              title={PRIMARY_CTA_TEXT}
            >
              <span className="sm:hidden">Demo</span>
              <span className="hidden sm:inline">Book demo</span>{" "}
              <ArrowRight className="size-4 shrink-0" />
            </Link>
            <Link
              href={PRIMARY_CTA_HREF}
              className={cn(
                "hidden lg:inline-flex",
                buttonClass({ size: "default", variant: "primary", className: "max-w-[min(100%,20rem)]" })
              )}
              title={PRIMARY_CTA_TEXT}
            >
              <span className="truncate">{PRIMARY_CTA_TEXT}</span> <ArrowRight className="size-4 shrink-0" />
            </Link>
            <a
              href="#pricing"
              title="View pricing"
              className={cn("md:hidden", buttonClass({ size: "sm", variant: "secondary", className: "px-2 sm:px-4" }))}
            >
              <span className="sm:hidden">Plans</span>
              <span className="hidden sm:inline">Pricing</span> <ChevronRight className="size-4 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileNavRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-bg-surface"
    >
      {children}
    </a>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary transition hover:bg-bg-surface hover:text-text-primary"
    >
      {children}
    </a>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[min(420px,85vw)] w-[min(56rem,100%)] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.18),transparent_60%)] blur-2xl sm:-top-40 sm:h-[520px] sm:w-[min(920px,100%)]" />
        <div className="absolute -bottom-36 left-1/2 h-[min(420px,85vw)] w-[min(56rem,100%)] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.14),transparent_60%)] blur-2xl sm:-bottom-44 sm:h-[520px] sm:w-[min(920px,100%)]" />
      </div>

      <div className="section-shell pt-8 sm:pt-10 md:pt-14">
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="min-w-0">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Badge className="w-full max-w-full justify-start rounded-2xl border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-left text-accent-primary sm:w-auto">
                The only POS that publishes your website menu
              </Badge>
              <Badge className="w-full max-w-full justify-start rounded-2xl border border-border-subtle bg-bg-elevated text-left text-text-secondary sm:w-auto">
                <Sparkles className="mr-1.5 size-3.5 shrink-0 text-accent-primary" />
                Restaurant OS (POS + Website)
              </Badge>
              <Badge className="w-full max-w-full justify-start rounded-2xl border border-border-subtle bg-bg-elevated text-left text-text-secondary sm:w-auto">
                <Webhook className="mr-1.5 size-3.5 shrink-0 text-accent-secondary" />
                POS → Website auto‑sync
              </Badge>
            </div>

            <h1 className="mt-5 text-balance text-[clamp(1.28rem,5vw+0.45rem,3rem)] leading-[1.1] tracking-[-0.035em] sm:leading-[1.06] md:leading-[1.03] lg:text-5xl">
              If your website menu is wrong, you’re <span className="text-accent-primary">bleeding money</span>.
              <br className="hidden sm:block" />
              Fix it once in POS—your website updates instantly.
            </h1>

            <p className="mt-4 max-w-[62ch] text-pretty text-base leading-7 text-text-secondary md:text-[1.025rem]">
              Stop the “sir website pe kuch aur dikh raha hai” argument at the counter. Change prices, photos, modifiers,
              combos, or “sold out” in the POS—your live website menu updates in seconds. No duplicate work. No follow‑ups.
              No peak‑hour drama.
            </p>

            <div className="mt-6 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-stretch sm:items-center">
              <Link
                href={PRIMARY_CTA_HREF}
                className={buttonClass({
                  size: "lg",
                  variant: "primary",
                  className:
                    "w-full min-[480px]:w-auto whitespace-normal px-4 text-center text-xs leading-snug sm:text-sm"
                })}
                title={PRIMARY_CTA_TEXT}
              >
                <span className="min-[480px]:hidden">{PRIMARY_CTA_TEXT_SHORT}</span>
                <span className="hidden min-[480px]:inline">{PRIMARY_CTA_TEXT}</span>{" "}
                <ArrowRight className="inline size-4 shrink-0" />
              </Link>
              <a
                href={SECONDARY_CTA_HREF}
                className={buttonClass({
                  size: "lg",
                  variant: "secondary",
                  className: "w-full min-[480px]:w-auto whitespace-normal px-4 text-center text-xs leading-snug sm:text-sm"
                })}
              >
                {SECONDARY_CTA_TEXT} <MousePointerClick className="inline size-4 shrink-0" />
              </a>
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl border border-border-subtle bg-bg-surface p-3 sm:p-4">
              <p className="text-sm font-semibold text-text-primary">In 15 minutes, we’ll prove 3 things (live):</p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <HeroBullet
                  icon={Zap}
                  title="The sync is real"
                  body="POS edit → website update, live."
                />
                <HeroBullet
                  icon={Layers}
                  title="Where you’re losing money"
                  body="Wrong price, sold‑out, modifiers → refunds."
                />
                <HeroBullet
                  icon={Clock}
                  title="Exactly how you switch"
                  body="Setup + training + go‑live plan."
                />
              </ul>
              <p className="text-xs text-text-muted">
                No signup. We’ll do it on WhatsApp/Meet. If we can’t show it live, don’t buy.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MiniTrust icon={Zap} title="Menu updates in seconds" description="POS is the source of truth." />
              <MiniTrust icon={Clock} title="Training: one shift" description="Built for real service flow." />
              <MiniTrust icon={ShieldCheck} title="Reliable by design" description="Clean ops, fewer mistakes." />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
                <BadgeCheck className="size-4 text-success" /> Guided onboarding included
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
                <FileText className="size-4 text-accent-secondary" /> GST invoices + taxes (configurable)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
                <Banknote className="size-4 text-accent-primary" /> Faster billing + cleaner day close
              </span>
            </div>

            <TrustStrip />
          </div>

          <div className="relative min-w-0" id="proof">
            <ProofWidget />
            <p className="mt-3 text-center text-xs text-text-muted">
              This is the point: <span className="font-semibold text-text-secondary">change once</span>, publish everywhere.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniTrust({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-0.5 text-xs text-text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

function HeroBullet({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-white px-3 py-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-text-muted">{body}</p>
      </div>
    </li>
  );
}

function TrustStrip() {
  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-text-muted">
        For teams that can’t afford menu mistakes
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {["Cafe", "Cloud kitchen", "Quick service", "Multi‑outlet"].map((t) => (
          <div
            key={t}
            className="flex items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface px-3 py-2 text-xs font-semibold text-text-secondary"
          >
            {t}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Add your customer logos + one real metric here and watch conversions jump.
      </p>
    </div>
  );
}

function ProofWidget() {
  return (
    <div className="surface-card relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.10),transparent_60%)]" />

      <div className="relative p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="label-text">Live proof</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              Edit in POS → Website updates instantly
            </p>
          </div>
          <Badge className="w-fit shrink-0 border border-border-subtle bg-bg-surface text-text-secondary">
            <Zap className="mr-1.5 size-3.5 text-accent-primary" />
            Updated in 2s
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary">POS</p>
              <span className="text-xs text-text-muted">Menu editor</span>
            </div>
            <div className="mt-3 space-y-3">
              <ProofRow icon={ScanLine} label="Item" value="Chicken Bowl" />
              <ProofRow icon={TrendingUp} label="Price" value="199 → 219" highlight />
              <ProofRow icon={BellRing} label="Availability" value="Mark Sold Out" />
            </div>
            <div className="mt-4 rounded-2xl border border-border-subtle bg-white p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">Save changes</span>
                <span className="inline-flex items-center gap-1 text-text-muted">
                  Sync <ArrowRight className="size-3.5" />
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(15,118,110,0.10)]">
                <div className="h-full w-[86%] rounded-full bg-accent-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary">Website</p>
              <span className="text-xs text-text-muted">Live menu</span>
            </div>
            <div className="mt-3 space-y-3">
              <WebsiteItem
                name="Chicken Bowl"
                description="Rice, grilled chicken, house sauce"
                price="219"
                badge="Updated"
              />
              <WebsiteItem
                name="Paneer Wrap"
                description="Toasted wrap, spicy paneer, salad"
                price="179"
                badge="Popular"
              />
              <WebsiteItem
                name="Iced Latte"
                description="Cold brew, milk, vanilla"
                price="149"
                badge="Sold out"
                soldOut
              />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-border-subtle bg-white px-3 py-2 text-xs">
              <span className="text-text-muted">Last published</span>
              <span className="font-semibold text-text-primary">2 seconds ago</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProofToggle label="Price change" active />
          <ProofToggle label="Sold out toggle" />
          <ProofToggle label="New item" />
        </div>
      </div>
    </div>
  );
}

function ProofRow({
  icon: Icon,
  label,
  value,
  highlight
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-white px-3 py-2 sm:gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            highlight ? "bg-[rgba(217,119,6,0.12)] text-accent-secondary" : "bg-[rgba(15,118,110,0.10)] text-accent-primary"
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-xs font-semibold text-text-primary">{label}</p>
          <p className="break-words text-[0.75rem] text-text-muted">{value}</p>
        </div>
      </div>
      <Check className="size-4 shrink-0 text-success" />
    </div>
  );
}

function WebsiteItem({
  name,
  description,
  price,
  badge,
  soldOut
}: {
  name: string;
  description: string;
  price: string;
  badge: string;
  soldOut?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-white px-3 py-2.5 transition",
        soldOut ? "opacity-70" : "hover:-translate-y-[1px] hover:shadow-soft"
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">{name}</p>
          <p className="mt-0.5 text-xs text-text-muted">{description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-text-primary">₹{price}</p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
              soldOut
                ? "bg-[rgba(180,35,24,0.10)] text-danger"
                : badge === "Popular"
                  ? "bg-[rgba(217,119,6,0.12)] text-accent-secondary"
                  : "bg-[rgba(15,118,110,0.10)] text-accent-primary"
            )}
          >
            {badge}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProofToggle({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-bg-surface px-3 py-3 text-sm font-semibold transition sm:px-4",
        active
          ? "border-[rgba(15,118,110,0.35)] bg-[rgba(15,118,110,0.08)] text-text-primary"
          : "text-text-secondary hover:border-border-strong"
      )}
    >
      <span className="min-w-0 flex-1 break-words leading-snug">{label}</span>
      <span
        className={cn(
          "ml-0 inline-flex h-6 w-10 shrink-0 items-center rounded-full p-1 sm:ml-1",
          active ? "bg-accent-primary" : "bg-[rgba(142,136,126,0.35)]"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-soft transition",
            active ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
    </div>
  );
}

function Problem() {
  return (
    <section className="section-shell" id="problem">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionHeading
          eyebrow="The hard truth"
          title="You’re not busy. You’re leaking money through broken ops."
          description="When POS and website don’t match, the cost shows up as refunds, angry customers, and staff stress—during peak hours."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <PainCard
            icon={Flame}
            title="Wrong menu = lost trust"
            body="Customers order from outdated prices and items—then you’re apologizing, refunding, and comping."
          />
          <PainCard
            icon={Layers}
            title="Double entry kills time"
            body="You update the POS… then someone has to redo everything on the website. It never stays accurate."
          />
          <PainCard
            icon={Building2}
            title="Peak hour magnifies errors"
            body="One mismatch becomes a chain reaction: re-rings, kitchen confusion, delays, and bad reviews."
          />
          <PainCard
            icon={BellRing}
            title="You’re dependent on “the website person”"
            body="Small changes become tickets, delays, and extra bills—exactly when you need speed."
          />
        </div>
      </div>
    </section>
  );
}

function HardPain() {
  return (
    <section className="section-shell">
      <div className="surface-card relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(180,35,24,0.08),transparent_60%)]" />
        <div className="relative grid gap-5 p-4 sm:gap-6 sm:p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="min-w-0">
            <p className="label-text">Hard pain (what owners won’t say out loud)</p>
            <h2 className="mt-2 text-balance text-xl font-bold leading-snug tracking-[-0.02em] text-text-primary sm:text-2xl sm:leading-tight md:text-3xl md:leading-tight">
              Your menu changes daily. Your website lies daily.
            </h2>
            <p className="mt-2 text-pretty text-sm leading-6 sm:text-base sm:leading-7">
              Every mismatch costs you: refunds, counter arguments, staff stress, and reviews you can’t undo. In India,
              one wrong price during rush hour becomes a scene. This isn’t a “website issue.” It’s a revenue leak.
            </p>
          </div>
          <div className="grid min-w-0 gap-3">
            {[
              "A customer arrives for an item that’s sold out online.",
              "A promo price is live in POS… but not on the website.",
              "Staff gets blamed for “extra charge” because the website is outdated.",
              "Your captain calls you mid‑service: “menu update kaun karega?”"
            ].map((line) => (
              <div
                key={line}
                className="flex min-w-0 items-start gap-3 rounded-2xl border border-border-subtle bg-bg-surface px-3 py-3 sm:px-4"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-[rgba(180,35,24,0.10)] text-danger">
                  <Flame className="size-4" />
                </span>
                <p className="min-w-0 break-words text-sm font-semibold text-text-primary">{line}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-border-subtle bg-white p-3 sm:p-4">
              <p className="text-sm font-semibold text-text-primary">This is the “menu mismatch tax.”</p>
              <p className="mt-1 text-sm">
                If your menu lives in two places, you’ll always be wrong in one of them—and customers will punish you for it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OldVsNew() {
  return (
    <section className="section-shell" id="compare">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="Old vs new"
            title="Most POS setups create double work. This one deletes it."
            description="Old systems make you maintain two menus. This system makes the POS publish the website automatically—so you stop firefighting."
          />
        </div>
        <div className="hidden shrink-0 md:block">
          <Link href={PRIMARY_CTA_HREF} className={buttonClass({ variant: "primary" })}>
            {PRIMARY_CTA_TEXT} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Old system (what you’re doing now)</CardTitle>
            <p className="mt-1 text-sm">
              Two menus. Two sources of truth. One constant headache.
            </p>
          </CardHeader>
          <CardContent>
            <CompareList
              tone="bad"
              items={[
                "Update POS, then update website separately",
                "Sold‑out changes lag behind reality",
                "Wrong prices → arguments, refunds, comps",
                "Every menu tweak becomes a task + delay"
              ]}
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-[rgba(15,118,110,0.35)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.10),transparent_60%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-base">New system (POS publishes the website)</CardTitle>
            <p className="mt-1 text-sm">
              One menu. One update. Everything stays aligned automatically.
            </p>
          </CardHeader>
          <CardContent className="relative">
            <CompareList
              tone="good"
              items={[
                "Change once in POS → live on website in seconds",
                "Sold‑out toggle updates instantly",
                "Pricing, photos, modifiers stay consistent",
                "Less stress for staff, fewer complaints for you"
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function CompareList({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  const icon =
    tone === "good" ? (
      <Check className="size-3.5" />
    ) : (
      <Flame className="size-3.5" />
    );
  const iconClass =
    tone === "good"
      ? "bg-[rgba(21,128,61,0.12)] text-success"
      : "bg-[rgba(180,35,24,0.10)] text-danger";

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
          <span className={cn("mt-0.5 grid size-5 place-items-center rounded-full", iconClass)}>{icon}</span>
          <span className="font-semibold text-text-primary">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PainCard({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card className="group overflow-hidden transition hover:-translate-y-[1px] hover:shadow-soft">
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(180,35,24,0.08)] text-danger">
          <Icon className="size-5" />
        </span>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-sm">{body}</p>
        </div>
      </CardHeader>
    </Card>
  );
}

function Solution() {
  return (
    <section className="section-shell" id="solution">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="The upgrade"
            title="One system that runs service—and keeps your website correct automatically."
            description="This is a restaurant operating system: POS, billing, inventory, and a website that stays in sync without manual updates."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <OutcomePill icon={Zap} title="Fewer refunds & complaints" body="Because the website matches the POS—always." />
            <OutcomePill icon={Clock} title="Hours saved every week" body="No duplicate edits. No chasing updates." />
            <OutcomePill icon={ShieldCheck} title="Less staff stress" body="Fewer exceptions, fewer arguments, cleaner flow." />
            <OutcomePill icon={TrendingUp} title="Higher ticket size" body="Modifiers and combos that upsell naturally." />
          </div>
        </div>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.10),transparent_60%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-lg">The “single source of truth” difference</CardTitle>
            <p className="mt-1 text-sm">
              Stop maintaining two menus. Your team works in the POS, and your website publishes from it.
            </p>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-3">
              <FlowRow left="POS menu" right="Live website menu" />
              <FlowRow left="POS price update" right="Website price update" />
              <FlowRow left="POS sold-out toggle" right="Website sold-out badge" />
            </div>

            <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-surface p-4">
              <p className="text-sm font-semibold text-text-primary">Translation:</p>
              <p className="mt-1 text-sm">
                If you’re changing menus manually today, you’re paying for it with time, mistakes, and customer trust.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function OutcomePill({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3 transition hover:border-border-strong">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-0.5 text-xs text-text-muted">{body}</p>
        </div>
      </div>
    </div>
  );
}

function FlowRow({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border-subtle bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm font-semibold text-text-primary">{left}</span>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary">
        <ArrowRight className="size-4 shrink-0 text-accent-primary" />
        <span className="min-w-0">{right}</span>
      </span>
    </div>
  );
}

function UniqueMechanism() {
  return (
    <section className="section-shell">
      <div className="surface-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="p-4 sm:p-6 md:p-8">
            <p className="label-text">Unique mechanism</p>
            <h2 className="mt-2 text-balance text-xl font-bold leading-snug tracking-[-0.02em] text-text-primary sm:text-2xl sm:leading-tight md:text-3xl md:leading-tight">
              POS = source of truth. Website = auto‑published.
            </h2>
            <p className="mt-2 text-pretty text-sm leading-6 sm:text-base sm:leading-7">
              Most setups treat your website like a separate project. So your menu lives in two places… and reality breaks the
              moment you change anything.
            </p>
            <div className="mt-6 space-y-3">
              <MechanismPoint
                icon={Webhook}
                title="Auto‑Sync Website System"
                body="Your website isn’t “updated.” It’s published from the POS—items, prices, photos, modifiers, availability."
              />
              <MechanismPoint
                icon={ShieldCheck}
                title="Consistency across channels"
                body="Customers see the same truth your staff rings up. Fewer exceptions. Fewer arguments. Better reviews."
              />
            </div>
          </div>

          <div className="relative border-t border-border-subtle bg-[linear-gradient(180deg,rgba(15,118,110,0.06),transparent_55%)] p-4 sm:p-6 md:p-8 lg:border-l lg:border-t-0">
            <div className="grid gap-4">
              <Card className="transition hover:-translate-y-[1px] hover:shadow-soft">
                <CardHeader className="flex flex-row items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
                    <UtensilsCrossed className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">One menu to manage</CardTitle>
                    <p className="mt-1 text-sm">Set it once in the POS. Never duplicate it again.</p>
                  </div>
                </CardHeader>
              </Card>

              <Card className="transition hover:-translate-y-[1px] hover:shadow-soft">
                <CardHeader className="flex flex-row items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(217,119,6,0.12)] text-accent-secondary">
                    <WebHookIcon />
                  </span>
                  <div>
                    <CardTitle className="text-base">Instant publish</CardTitle>
                    <p className="mt-1 text-sm">Every change goes live in seconds—without “website work.”</p>
                  </div>
                </CardHeader>
              </Card>

              <Card className="transition hover:-translate-y-[1px] hover:shadow-soft">
                <CardHeader className="flex flex-row items-start gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[rgba(21,128,61,0.12)] text-success">
                    <BadgeCheck className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">Fewer refunds, less chaos</CardTitle>
                    <p className="mt-1 text-sm">Because customers see the right menu the first time.</p>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WebHookIcon() {
  return <Webhook className="size-5" />;
}

function MechanismPoint({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-white shadow-soft">
        <Icon className="size-5 text-accent-primary" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-sm">{body}</p>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Webhook,
      title: "Menu Auto‑Sync (POS → Website)",
      outcome: "Stop double entry. Stop mismatches.",
      blurb:
        "Edit prices, photos, modifiers, and availability in the POS—your website updates automatically in seconds."
    },
    {
      icon: Zap,
      title: "Fast Billing + Payments",
      outcome: "Shorter queues. Cleaner closes.",
      blurb: "Speed up checkout and reduce errors during rush hour with a billing flow built for service."
    },
    {
      icon: Layers,
      title: "Orders + Table Flow",
      outcome: "Fewer misses. Smoother peaks.",
      blurb: "Keep handoffs clean from counter to kitchen with an order flow that doesn’t fall apart under load."
    },
    {
      icon: BellRing,
      title: "Inventory + Low‑Stock Alerts",
      outcome: "Fewer 86 moments. Better margins.",
      blurb: "Know what’s running low before service does. Reduce waste, prevent lost orders, protect margins."
    },
    {
      icon: TrendingUp,
      title: "Modifiers / Add‑ons / Combos",
      outcome: "Higher ticket size, naturally.",
      blurb: "Make upsells effortless with modifiers and combos that staff can’t mess up."
    },
    {
      icon: Sparkles,
      title: "Modern Restaurant Website",
      outcome: "A site that sells—without dependency.",
      blurb: "Launch a clean, fast site that converts visitors—without waiting on a developer for changes."
    }
  ];

  return (
    <section className="section-shell" id="features">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <SectionHeading
            eyebrow="Outcomes, not features"
            title="Everything here buys back time—and removes mistakes."
            description="Built to reduce refunds, speed up service, and keep every channel aligned automatically."
          />
        </div>
        <div className="hidden shrink-0 md:block">
          <a href="#pricing" className={buttonClass({ variant: "secondary" })}>
            See pricing <ChevronRight className="size-4" />
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.title}
            className="group relative overflow-hidden transition hover:-translate-y-[2px] hover:shadow-soft"
          >
            <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
              <div className="absolute -top-12 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.14),transparent_60%)] blur-xl" />
            </div>

            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl border border-border-subtle bg-bg-surface text-accent-primary transition group-hover:border-[rgba(15,118,110,0.35)]">
                  <item.icon className="size-5" />
                </span>
                <span className="rounded-full border border-border-subtle bg-bg-surface px-2.5 py-1 text-[0.7rem] font-semibold text-text-muted">
                  Outcome
                </span>
              </div>
              <CardTitle className="mt-4 text-base">{item.title}</CardTitle>
              <p className="mt-1 text-sm font-semibold text-text-primary">{item.outcome}</p>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm">{item.blurb}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-primary">
                See in demo <ChevronRight className="size-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: UtensilsCrossed,
      title: "Set your menu in the POS",
      body: "Items, prices, photos, modifiers, availability—done once where your team already works."
    },
    {
      icon: Webhook,
      title: "Publish your website instantly",
      body: "Your live website pulls directly from the POS. No copy‑pasting. No “website updates.”"
    },
    {
      icon: Zap,
      title: "Run service. Update anytime",
      body: "New item? Sold out? Price change? Update in POS → website updates automatically."
    }
  ];

  return (
    <section className="section-shell" id="how">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps. Zero maintenance."
        description="It feels simple because it is: one menu, one system, always aligned."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, idx) => (
          <Card key={s.title} className="relative overflow-hidden">
            <div className="absolute right-4 top-4 text-xs font-semibold text-text-muted">
              Step {idx + 1}
            </div>
            <CardHeader>
              <span className="grid size-12 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
                <s.icon className="size-5" />
              </span>
              <CardTitle className="mt-4 text-base">{s.title}</CardTitle>
              <p className="mt-1 text-sm">{s.body}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-4 sm:p-5 md:flex-row md:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">Want to see it with your real menu?</p>
          <p className="mt-1 text-sm">In the demo, we’ll show a live POS edit updating a live website instantly.</p>
        </div>
        <Link
          href={PRIMARY_CTA_HREF}
          className={buttonClass({
            size: "default",
            variant: "primary",
            className: "h-11 w-full shrink-0 px-5 text-center whitespace-normal sm:w-auto"
          })}
          title={PRIMARY_CTA_TEXT}
        >
          Book a 15‑minute demo <ArrowRight className="inline size-4 shrink-0" />
        </Link>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Aarav, Cafe Owner",
      role: "Single outlet, 12 staff",
      quote:
        "We stopped getting complaints about wrong prices online. That alone paid for it. The team updates once and it’s live."
    },
    {
      name: "Meera, Cloud Kitchen Ops",
      role: "High‑change menu, daily promos",
      quote:
        "Launching new items is finally fast. Before, it was a day of messages. Now it’s one edit and done."
    },
    {
      name: "Rohan, Restaurant Manager",
      role: "Dine‑in + takeaway",
      quote:
        "Training was simple. Peak hours feel calmer because fewer orders are wrong and billing is faster."
    }
  ];

  return (
    <section className="section-shell" id="testimonials">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Trust"
          title="Owners don’t want another tool. They want less chaos."
          description="These are the outcomes restaurants care about: fewer mistakes, faster flow, and a website that stays correct."
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted md:max-w-[min(100%,24rem)] md:justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
            <Clock className="size-4 shrink-0 text-accent-primary" /> Setup in days (typical)
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
            <ShieldCheck className="size-4 shrink-0 text-success" /> Guided onboarding
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quotes.map((q) => (
          <Card key={q.name} className="group transition hover:-translate-y-[1px] hover:shadow-soft">
            <CardHeader>
              <p className="text-sm font-semibold text-text-primary">“{q.quote}”</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{q.name}</p>
                <p className="text-xs text-text-muted">{q.role}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-[rgba(15,118,110,0.10)] text-accent-primary">
                <BadgeCheck className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Case study blueprint (what we measure)</CardTitle>
            <p className="mt-1 text-sm">
              We focus on what moves the business: time saved, fewer complaints, and faster throughput.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <MetricChip icon={Clock} value="3–6 hrs/wk" label="Saved on menu updates" />
              <MetricChip icon={ShieldCheck} value="↓ refunds" label="From menu mismatches" />
              <MetricChip icon={Zap} value="↓ queue time" label="Faster billing" />
              <MetricChip icon={TrendingUp} value="↑ ticket size" label="Modifiers & combos" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.10),transparent_60%)]" />
          <CardHeader className="relative">
            <CardTitle className="text-base">One line that sells it</CardTitle>
            <p className="mt-1 text-sm">
              “If it’s updated in the POS, it’s already live.” That’s what removes the chaos.
            </p>
          </CardHeader>
          <CardContent className="relative">
            <Link href={PRIMARY_CTA_HREF} className={cn("w-full", buttonClass({ variant: "primary" }))}>
              Book a 15‑minute demo <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricChip({
  icon: Icon,
  value,
  label
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-white shadow-soft">
        <Icon className="size-5 text-accent-primary" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{value}</p>
        <p className="mt-0.5 text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter",
      tagline: "Get clean & live",
      price: "From ₹799",
      highlight: false,
      description: "For small cafes and single counters that want less chaos.",
      features: ["POS essentials (orders + billing)", "Website menu sync", "Basic reports", "Standard support"],
      cta: "See your menu sync live",
    },
    {
      name: "Growth",
      tagline: "Run like a pro",
      price: "From ₹1,200",
      highlight: true,
      description: "For busy locations that change menus often and need control.",
      features: [
        "Everything in Starter",
        "Modifiers / add‑ons & combos",
        "Inventory + low‑stock alerts",
        "Staff roles",
        "Advanced reports",
        "Faster onboarding support"
      ],
      badge: "Most Popular",
      cta: "Get the Growth walkthrough",
    },
    {
      name: "Scale",
      tagline: "Central command",
      price: "From ₹2,000",
      highlight: false,
      description: "For multi‑outlet groups and cloud kitchens.",
      features: [
        "Everything in Growth",
        "Multi‑outlet management",
        "Centralized menu governance",
        "Priority support / onboarding"
      ],
      cta: "Talk to sales",
    }
  ];

  return (
    <section className="section-shell" id="pricing">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Pricing"
          title="Pricing that matches reality: per location, per month."
          description="Every plan includes POS ↔ Website auto‑sync. We confirm your exact monthly total in the walkthrough—no surprises after you commit."
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
            <BadgeCheck className="size-4 text-success" /> Guided onboarding
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface px-3 py-1.5">
            <ShieldCheck className="size-4 text-accent-primary" /> Risk‑free demo
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={cn(
              "relative overflow-hidden transition hover:-translate-y-[2px] hover:shadow-soft",
              p.highlight && "border-[rgba(15,118,110,0.35)] shadow-soft"
            )}
          >
            {p.highlight ? (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary via-[rgba(15,118,110,0.65)] to-accent-secondary" />
            ) : null}

            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{p.tagline}</p>
                </div>
                {p.badge ? (
                  <Badge className="border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-accent-primary">
                    {p.badge}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-2 gap-y-1">
                <p className="text-2xl font-extrabold tracking-[-0.02em] text-text-primary">
                  {p.price}
                </p>
                <p className="max-w-[12rem] text-right text-xs text-text-muted sm:max-w-none">
                  {p.name === "Scale" ? "multi‑outlet" : "/ month / location"}
                </p>
              </div>
              <p className="mt-2 text-sm">{p.description}</p>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="mt-0.5 grid size-5 place-items-center rounded-full bg-[rgba(21,128,61,0.12)] text-success">
                      <Check className="size-3.5" />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                <Link
                  href={PRIMARY_CTA_HREF}
                  className={cn("w-full whitespace-normal text-center leading-snug", buttonClass({ variant: "primary" }))}
                >
                  {p.cta} <ArrowRight className="inline size-4 shrink-0" />
                </Link>
                <p className="mt-2 text-center text-xs text-text-muted">Bring your real menu. We’ll demo the sync live.</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-border-subtle bg-bg-surface p-4 text-sm">
        <p className="font-semibold text-text-primary">What’s included (every plan):</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <div className="flex items-start gap-2 text-text-secondary">
            <Check className="mt-0.5 size-4 text-success" />
            <span>Instant menu publish (POS → website)</span>
          </div>
          <div className="flex items-start gap-2 text-text-secondary">
            <Check className="mt-0.5 size-4 text-success" />
            <span>Guided onboarding + staff training</span>
          </div>
          <div className="flex items-start gap-2 text-text-secondary">
            <Check className="mt-0.5 size-4 text-success" />
            <span>Go‑live plan (no service disruption)</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Pricing depends on outlets, terminals, and integrations (UPI/cards, printers/KOT, KDS). We confirm the exact monthly total before you switch.
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Is the website menu really updated automatically?",
      a: "Yes. The POS is the single source of truth. When you change items, prices, photos, modifiers, or availability in the POS, your live website menu updates automatically."
    },
    {
      q: "We already use a POS. Can we still use this?",
      a: "If your current POS can’t keep your website menu accurate automatically, you’re still doing double work. The demo is designed to show exactly what you gain—fast."
    },
    {
      q: "Will my staff be able to use it quickly?",
      a: "It’s built for service flow: simple screens, fast search, and clear actions. Most teams learn the basics in one shift with guided onboarding."
    },
    {
      q: "What if we change our menu often?",
      a: "That’s exactly who this is for. Daily promos, sold-out toggles, price updates—change once in POS and it’s live everywhere."
    },
    {
      q: "How do we start without disruption?",
      a: "We run a demo using your real menu structure and help you migrate in a controlled go-live. The goal is fast adoption, not chaos."
    }
  ];

  return (
    <section className="section-shell" id="faq">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <SectionHeading
          eyebrow="Objection destroyer"
          title="The questions every owner asks (answered)."
          description="If you’re thinking it, you’re not alone. Here’s the straight answer."
        />

        <div className="min-w-0 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group min-w-0 w-full max-w-full rounded-2xl border border-border-subtle bg-bg-surface px-3 py-3 transition hover:border-border-strong sm:px-4"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-2 sm:items-center sm:gap-3">
                <span className="min-w-0 flex-1 text-pretty text-sm font-semibold text-text-primary">{f.q}</span>
                <span className="grid size-9 place-items-center rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary transition group-open:rotate-90">
                  <ChevronRight className="size-4" />
                </span>
              </summary>
              <p className="mt-2 text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section-shell" id="cta">
      <div className="surface-card relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.12),transparent_60%)]" />
        <div className="relative p-4 sm:p-6 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="min-w-0">
              <p className="label-text">Final CTA</p>
              <h2 className="mt-2 text-balance text-xl leading-[1.15] tracking-[-0.03em] sm:text-2xl sm:leading-[1.12] md:text-3xl lg:text-4xl">
                Watch your menu update live in seconds—then decide.
              </h2>
              <p className="mt-2 text-pretty text-base leading-7">
                No commitment. No pressure. Just proof. Bring your real menu—we’ll show the POS edit syncing to a live website instantly.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={PRIMARY_CTA_HREF}
                  className={buttonClass({
                    size: "lg",
                    variant: "primary",
                    className:
                      "w-full whitespace-normal px-5 text-center text-xs leading-snug sm:w-auto sm:text-sm"
                  })}
                  title={PRIMARY_CTA_TEXT}
                >
                  <span className="sm:hidden">{PRIMARY_CTA_TEXT_SHORT}</span>
                  <span className="hidden sm:inline">{PRIMARY_CTA_TEXT}</span> <ArrowRight className="inline size-4 shrink-0" />
                </Link>
                <a
                  href="#pricing"
                  className={buttonClass({ size: "lg", variant: "secondary", className: "w-full px-5 text-center sm:w-auto" })}
                >
                  Compare plans <ChevronRight className="inline size-4 shrink-0" />
                </a>
              </div>
            </div>

            <div className="grid gap-3">
              <CTAProofRow icon={Webhook} title="Instant menu auto‑sync" body="Change once in POS, live on website." />
              <CTAProofRow icon={Zap} title="Faster billing flow" body="Shorter queues, fewer mistakes." />
              <CTAProofRow icon={ShieldCheck} title="Guided onboarding" body="Go live fast with support." />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTAProofRow({
  icon: Icon,
  title,
  body
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-bg-surface px-4 py-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-white shadow-soft">
        <Icon className="size-5 text-accent-primary" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 text-sm">{body}</p>
      </div>
    </div>
  );
}

function MobileStickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-[rgba(255,253,249,0.92)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pt-3 backdrop-blur supports-[backdrop-filter]:bg-[rgba(255,253,249,0.78)] md:hidden">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 min-[360px]:flex-row min-[360px]:flex-wrap min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">Update once. Sync everywhere.</p>
          <p className="text-xs text-text-muted">See the sync live in 15 minutes.</p>
        </div>
        <a
          href={PRIMARY_CTA_HREF}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-primary px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25 min-[360px]:w-auto"
        >
          See live <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="section-shell pb-24 md:pb-10">
      <div className="flex flex-col gap-4 border-t border-border-subtle pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-2xl border border-border-subtle bg-bg-elevated shadow-soft">
            <UtensilsCrossed className="size-5 text-accent-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text-primary">Restaurant OS</p>
            <p className="text-xs text-text-muted">POS + Website + Instant Menu Sync</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <a className="rounded-xl px-3 py-2 transition hover:bg-bg-surface" href="#features">
            Outcomes
          </a>
          <a className="rounded-xl px-3 py-2 transition hover:bg-bg-surface" href="#pricing">
            Pricing
          </a>
          <Link className="rounded-xl px-3 py-2 transition hover:bg-bg-surface" href={LOGIN_HREF}>
            Sign in
          </Link>
          <Link className="rounded-xl px-3 py-2 transition hover:bg-bg-surface" href={PRIMARY_CTA_HREF}>
            Book demo
          </Link>
        </div>
      </div>

      <div className="mt-4 text-xs text-text-muted">
        <p>
          © {new Date().getFullYear()} Restaurant OS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
