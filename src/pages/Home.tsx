'use client'
import { useState } from "react";
import { motion } from "motion/react";
import {

  Menu,
  X,
  MessageSquareOff,
  Clock,
  Boxes,
  Ticket,
  MapPin,
  Palette,
  ShoppingBag,
  LayoutDashboard,
  Check,
  MessageCircle,
  ArrowDown,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Store,
  Mail,
  Phone,
  StickyNote,
  Package,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { HTMLMotionProps } from "motion/react";
import { UserAuth } from "../context/AuthContext";
import type { Variants } from "motion/react";


import { DotLottieReact } from "@lottiefiles/dotlottie-react";
interface NavLink {
  label: string;
  href: string;
}

interface Tint {
  bg: string;
  fg: string;
}

interface Problem {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface Step {
  n: string;
  title: string;
  body: string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
  videoId: string;
}

interface Plan {
  name: string;
  price: string;
  tag: string;
  badge?: string;
  highlighted: boolean;
  features: string[];
}

interface FAQ {
  q: string;
  a: string;
}
interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  
}

interface EyebrowProps {
  children: ReactNode;
}

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
}

interface FeaturePreviewProps {
  videoId: string;
  title: string;
}




const ACCENT = "#D6293F";
const INK = "#171717";
const MUTE = "#6B7280";
const BORDER = "#E7E5E4";
const SOFT = "#FBF7F6"; // a very light tint of the accent, not a second background

const DEMO_STORE_URL = "https://pizzatown.crimsoncastle.shop";

// Real product footage, served straight from Cloudinary  no SDK needed,
// just the standard delivery URL pattern.
const CLOUD_NAME = "dkkvyxpdc";
const cldVideo = (
  id: string,
  w: number = 900,
  h: number = 560
): string =>
  `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_auto,c_fill,w_${w},h_${h}/${id}.webm`;

const cldImage = (
  id: string,
  w: number = 1400
): string =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,c_fill,w_${w}/${id}`;

const NAV_LINKS:NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "Our Product", href: "#product" },
  { label: "Why Crimson?", href: "#why" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

// A little warm color per card instead of one flat gray icon everywhere —
// still built entirely around the brand accent, just less monotone.
const TINTS :Tint[]= [
  { bg: "#FFF3E8", fg: "#C2600A" }, // warm amber
  { bg: "#EFF6FF", fg: "#2563EB" }, // sky
  { bg: "#F3EEFF", fg: "#7C3AED" }, // violet
  { bg: "#ECFDF5", fg: "#059669" }, // emerald
];

const PROBLEMS:Problem[] = [
  {
    icon: MessageSquareOff,
    title: "Orders spread across three apps",
    body: "Facebook messages, Instagram DMs, WhatsApp texts. Orders get missed and customers get confused.",
  },
  {
    icon: Store,
    title: "No storefront of your own",
    body: "Running a food business from a personal social media account doesn't look like a real business.",
  },
  {
    icon: Boxes,
    title: "Everything tracked by hand",
    body: "Notebooks and spreadsheets. No stock tracking, no record of what sold or what didn't.",
  },
  {
    icon: Clock,
    title: "Hard to take more orders",
    body: "More orders means more chats to manage manually. There's no system to handle the extra volume.",
  },
];

const STEPS :Step[]= [
  {
    n: "01",
    title: "Create your account",
    body: "Sign up with your email. Takes about two minutes.",
  },
  {
    n: "02",
    title: "Upload your menu",
    body: "Send it as an Excel file, PDF, or photo. We set it up for you.",
  },
  {
    n: "03",
    title: "Start taking orders",
    body: "Share your store link and orders start coming in.",
  },
];

// Every feature now shows the real screen it's describing.
const FEATURES :Feature[]= [
  {
    icon: LayoutDashboard,
    title: "Order management",
    body: "Orders come in as they're placed. Move each one from received to preparing to dispatched.",
    videoId: "Live_Orders_lt53hy",
  },
  {
    icon: Boxes,
    title: "Inventory tracking",
    body: "Stock levels update as orders come in, so you know what's running low.",
    videoId: "Inventory_htfojx",
  },
  {
    icon: ShoppingBag,
    title: "Place an order",
    body: "Add an order yourself from the dashboard when a customer orders by phone.",
    videoId: "Place_Order_amjwki",
  },
  {
    icon: MapPin,
    title: "Delivery zones",
    body: "Set the areas you deliver to and the charge for each one.",
    videoId: "Delivery_Charges_bvj6ae",
  },
  {
    icon: Ticket,
    title: "Coupons",
    body: "Create discount codes for promotions without doing the math by hand.",
    videoId: "Coupon_b4kkvo",
  },
  {
    icon: Palette,
    title: "Store styling",
    body: "Set your store's colors and logo so it looks like your business, not a template.",
    videoId: "Settings_njbvmq",
  },
];

const PLANS:Plan[] = [
  {
    name: "Free",
    price: "Rs. 0",
    tag: "For getting started",
    features: [
      "Up to 5 products",
      "Basic order management",
      "Stock tracking",
      "Crimson Castle subdomain",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "Rs. 1,399",
    tag: "For scaling up",
    badge: "Most popular",
    features: [
      "100 products",
      "Advanced order management",
      "Low-stock alerts",
      "Custom domain",
      "Priority support",
      "No Crimson Castle branding",
    ],
    highlighted: true,
  },
];

const FAQS :FAQ[]= [
  {
    q: "What is Crimson Castle?",
    a: "Crimson Castle helps home chefs run their food business from one dashboard. You get your own branded online store, orders in one place, and tools built for home kitchens rather than restaurant chains.",
  },
  {
    q: "Where are you based?",
    a: "Crimson Castle is based in Karachi, Pakistan.",
  },
  {
    q: "How long does setup take?",
    a: "Around 24 hours, depending on when you submit the merchant registration form from your dashboard.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes. There's no contract and no cancellation fee.",
  },
  {
    q: "Are there hidden fees?",
    a: "No. There are no mandatory fees beyond your monthly plan.",
  },
  {
    q: "Do you handle delivery?",
    a: "No. Crimson Castle handles ordering. Delivery is arranged by you.",
  },
  {
    q: "Does this work outside Karachi?",
    a: "Right now Crimson Castle is focused on home chefs in Karachi only.",
  },
];

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

function Reveal({ children, className = "", delay = 0 }:RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }:EyebrowProps) {
  return (
    <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: ACCENT }}>
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, subtitle, center = true }:SectionHeadingProps) {
  return (
    <div className={`max-w-xl ${center ? "mx-auto text-center" : ""} mb-12`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-bold leading-[1.2]" style={{ color: INK }}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[15px] leading-[1.7]" style={{ color: MUTE }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function PrimaryButton({ children, className = "", ...props }:ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white ${className}`}
      style={{ backgroundColor: ACCENT }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function SecondaryButton({ children, className = "", ...props }:ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm ${className}`}
      style={{ color: INK, border: `1px solid ${BORDER}` }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** A muted, autoplaying loop of the real product screen for a feature card. */
function FeaturePreview({ videoId, title }:FeaturePreviewProps) {
  return (
    <video
      src={cldVideo(videoId)}
      className="mt-auto pt-2 w-full rounded-xl border object-cover aspect-video"
      style={{ borderColor: BORDER }}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={`${title} preview`}
    />
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = UserAuth();

  const handleNavClick =
  (href: string) =>
  (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    setMenuOpen(false);

    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div
      className="w-full min-h-screen antialiased"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", color: INK, backgroundColor: "#FFFFFF" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html { scroll-behavior: smooth; }
        section[id] { scroll-margin-top: 90px; }
      `}</style>

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white overflow-hidden" style={{ backgroundColor: ACCENT }}>
              <img src="/cc.jpg" alt="Crimson Castle logo" className="rounded-sm w-full h-full object-cover" />
            </div>
            <span className="font-bold text-[15px]">Crimson Castle</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleNavClick(link.href)}
                className="text-sm font-medium hover:opacity-70 transition-opacity"
                style={{ color: MUTE }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {session ? (
            <a href="/dashboard" className="hidden md:block">
              <SecondaryButton>Dashboard</SecondaryButton>
            </a>
          ) : (
            <a href="/login" className="hidden md:block">
              <SecondaryButton>Sign In</SecondaryButton>
            </a>
          )}

          <button className="md:hidden p-2 -mr-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t px-6 py-4 space-y-1" style={{ borderColor: BORDER }}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleNavClick(link.href)}
                className="block py-2.5 text-sm font-medium"
                style={{ color: INK }}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2">
              <SecondaryButton className="w-full justify-center">Sign In</SecondaryButton>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
        {/* soft decorative color, not stock imagery  keeps things warm without being noisy */}
        <div
          aria-hidden
          className="absolute -top-10 -left-16 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: "#FFFFFF" }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: "#FFF3D6" }}
        />

        <Reveal className="max-w-2xl flex-1 relative">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full"
              style={{ color: ACCENT, backgroundColor: SOFT }}
            >
               Built for home chefs
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.15]" style={{ color: INK }}>
            Run your food business from one place, not three chat apps
          </h1>

          <p className="mt-6 text-[17px] leading-[1.7]" style={{ color: MUTE }}>
            Crimson Castle replaces WhatsApp, Instagram, and Facebook order-taking
            with a proper storefront and dashboard. You keep 100% of what you earn,
            with no commission on any order.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <PrimaryButton>
              Start now <ArrowRight size={16} />
            </PrimaryButton>

            <SecondaryButton onClick={handleNavClick("#demo")}>
              See the demo store
            </SecondaryButton>
          </div>
        </Reveal>

        <div className="flex-1 flex justify-center relative">
          <DotLottieReact
            src="/Cooking.lottie"
            loop
            autoplay
            className="w-full max-w-[500px] h-[500px] relative z-10"
          />
        </div>
      </section>

      {/* ================= PROBLEM ================= */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading eyebrow=" The problem" title="What running a home kitchen on chat apps looks like" center={false} />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROBLEMS.map((p, i) => {
            const tint = TINTS[i % TINTS.length];
            return (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="p-6 rounded-2xl border h-full" style={{ borderColor: BORDER }}>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: tint.bg }}
                  >
                    <p.icon size={22} style={{ color: tint.fg }} />
                  </div>
                  <h3 className="font-semibold text-[15px] mb-2 leading-snug">{p.title}</h3>
                  <p className="text-sm leading-[1.7]" style={{ color: MUTE }}>{p.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= WHATSAPP VS CRIMSON CASTLE ================= */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading
            eyebrow=" The difference"
            title="From scattered messages to one organized business"
            subtitle="Every order starts as a message. Crimson Castle turns it into a complete workflow."
          />
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-10 items-center">
          {/* LEFT */}
          <div className="rounded-3xl border p-8 relative overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="absolute right-6 top-6 opacity-10 text-8xl">💬</div>

            <h3 className="text-xl font-bold mb-8" style={{ color: MUTE }}>
              WhatsApp &amp; Social Media
            </h3>

            <div className="space-y-5">
              <div className="rounded-xl border p-4 flex gap-4 items-start" style={{ borderColor: BORDER }}>
                <svg
  className="h-5 w-5"
  viewBox="0 0 24 24"
  fill="currentColor"
>
  <path d="M12.04 2C6.54 2 2.08 6.46 2.08 11.96c0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.92 9.92 0 004.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm0 18.12a8.13 8.13 0 01-4.14-1.13l-.3-.18-3.08.81.82-3-.2-.31a8.1 8.1 0 01-1.25-4.35c0-4.49 3.66-8.15 8.15-8.15 2.18 0 4.23.85 5.77 2.39a8.1 8.1 0 012.38 5.76c0 4.49-3.66 8.16-8.15 8.16zm4.47-6.12c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06a6.64 6.64 0 01-1.95-1.2 7.34 7.34 0 01-1.35-1.68c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.65.58.25 1.03.4 1.38.52.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
</svg>
                <div>
                  <p style={{ color: INK }}>Hi, is biryani available?</p>
                  <p className="text-sm mt-1" style={{ color: MUTE }}>Customer asks in WhatsApp</p>
                </div>
              </div>

              <ArrowDown className="mx-auto" style={{ color: "#D1D5DB" }} />

              <div className="rounded-xl border p-4 flex gap-4 items-start" style={{ borderColor: BORDER }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8A4 4 0 0 1 16 11.37m1.5-4.87h.01" /></svg>
                <div>
                  <p style={{ color: INK }}>Another customer orders from Instagram</p>
                </div>
              </div>

              <ArrowDown className="mx-auto" style={{ color: "#D1D5DB" }} />

              <div className="rounded-xl border p-4 flex gap-4 items-start" style={{ borderColor: BORDER }}>
                <StickyNote size={20} style={{ color: "#9CA3AF" }} />
                <div>
                  <p style={{ color: INK }}>Write everything manually...</p>
                  <p className="text-sm mt-2" style={{ color: MUTE }}>Easy to miss orders or forget payments.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rounded-3xl border p-8 relative overflow-hidden" style={{ borderColor: BORDER }}>
            <div className="absolute right-6 top-6 opacity-10 text-8xl font-black" style={{ color: ACCENT }}>✓</div>

            <h3 className="text-xl font-bold mb-8" style={{ color: ACCENT }}>
              Crimson Castle
            </h3>

            <div className="space-y-5">
              <div className="rounded-xl border p-4 flex gap-4 items-center" style={{ borderColor: BORDER }}>
                <Store size={20} style={{ color: ACCENT }} />
                <div>
                  <p style={{ color: INK }}>Customer orders from your store</p>
                </div>
              </div>

              <ArrowDown className="mx-auto" style={{ color: ACCENT }} />

              <div className="rounded-xl border p-4 flex gap-4 items-center" style={{ borderColor: BORDER }}>
                <Package size={20} style={{ color: ACCENT }} />
                <div>
                  <p style={{ color: INK }}>Order appears instantly in dashboard</p>
                </div>
              </div>

              <ArrowDown className="mx-auto" style={{ color: ACCENT }} />

              <div className="rounded-xl border p-4 flex gap-4 items-center" style={{ borderColor: BORDER }}>
                <Wallet size={20} style={{ color: ACCENT }} />
                <div>
                  <p style={{ color: INK }}>Track payments, customers and sales</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OUR PRODUCT ================= */}
      <section id="product" className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading
            eyebrow=" Our product"
            title="Two systems, one platform"
            subtitle="Crimson Castle is built for Pakistan's home chef industry - a centralized system for running a food business, in place of fragmented chat-based ordering."
          />
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6">
          <Reveal>
            <div className="p-8 rounded-2xl border h-full flex flex-col" style={{ borderColor: BORDER }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: SOFT }}>
                <Store size={22} style={{ color: ACCENT }} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Storefront</h3>
              <p className="text-sm leading-[1.7] mb-4" style={{ color: MUTE }}>
                A customer-facing store where people browse your menu and place
                orders directly, without going through a chat.
              </p>
              <video
                src={cldVideo("Place_Order_amjwki")}
                className="mt-auto w-full rounded-xl border object-cover aspect-video"
                style={{ borderColor: BORDER }}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="p-8 rounded-2xl border h-full flex flex-col" style={{ borderColor: BORDER }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: SOFT }}>
                <LayoutDashboard size={22} style={{ color: ACCENT }} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Admin dashboard</h3>
              <p className="text-sm leading-[1.7] mb-4" style={{ color: MUTE }}>
                Where you manage orders, stock, customers, and dispatching - the
                day-to-day operations of the business, in one screen.
              </p>
              <img
                src={cldImage("dashboard_h9ikdc")}
                alt="Crimson Castle admin dashboard"
                className="mt-auto w-full rounded-xl border object-cover aspect-video"
                style={{ borderColor: BORDER }}
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= 3 STEPS ================= */}
      <section id="why" className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading eyebrow=" Getting started" title="Live in three steps" subtitle="From signup to your first order, usually within a day." />
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05}>
              <div>
                <span
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full text-sm font-bold mb-3"
                  style={{ backgroundColor: SOFT, color: ACCENT }}
                >
                  {s.n}
                </span>
                <h3 className="font-semibold text-base mt-2 mb-2">{s.title}</h3>
                <p className="text-sm leading-[1.7]" style={{ color: MUTE }}>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading eyebrow="Features" title="What you get" subtitle="The tools needed to run a food business, without the extra clutter." />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.05}>
              <div className="p-6 rounded-2xl border h-full flex flex-col" style={{ borderColor: BORDER }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: SOFT }}>
                  <f.icon size={20} style={{ color: ACCENT }} />
                </div>
                <h3 className="font-semibold text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm leading-[1.7] mb-4" style={{ color: MUTE }}>{f.body}</p>
                <FeaturePreview videoId={f.videoId} title={f.title} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= DEMO STORE ================= */}
      <section id="demo" className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <div className="rounded-2xl border p-8 sm:p-10" style={{ borderColor: BORDER }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <Eyebrow> See it for yourself</Eyebrow>
                <h2 className="text-2xl font-bold mb-2">This is the store your customers will see</h2>
                <p className="text-sm leading-[1.7] max-w-md" style={{ color: MUTE }}>
                  Visit the live demo storefront to see exactly what a customer
                  sees when they land on your store and place an order.
                </p>
              </div>
              <a href={DEMO_STORE_URL} target="_blank" rel="noreferrer">
                <PrimaryButton>
                  Visit demo store <ExternalLink size={16} />
                </PrimaryButton>
              </a>
            </div>

            <div className="mt-8 rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: BORDER, backgroundColor: SOFT }}>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BORDER }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BORDER }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BORDER }} />
                </div>
                <span className="text-xs ml-2" style={{ color: MUTE }}>{DEMO_STORE_URL.replace("https://", "")}</span>
              </div>
              {/* Swap this for a real storefront screenshot once you have one */}
              <a
                href={DEMO_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="h-40 flex flex-col items-center justify-center gap-2 hover:bg-black/[0.02] transition-colors"
                style={{ color: MUTE }}
              >
                <Store size={28} style={{ color: ACCENT }} />
                <p className="text-sm">Opens in a new tab</p>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= PRICING ================= */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading eyebrow=" Pricing" title="Simple pricing" subtitle="Start free. Move to Pro when you outgrow it." />
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.05}>
              <div className="relative p-8 rounded-2xl border h-full" style={{ borderColor: plan.highlighted ? ACCENT : BORDER }}>
                {plan.badge && (
                  <span
                    className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-semibold text-base mb-1">{plan.name}</h3>
                <p className="text-sm mb-6" style={{ color: MUTE }}>{plan.tag}</p>
                <p className="mb-8">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="text-sm" style={{ color: MUTE }}> /month</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm leading-[1.5]">
                      <Check size={15} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                      <span style={{ color: INK }}>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.highlighted ? (
                  <PrimaryButton className="w-full justify-center">Start now</PrimaryButton>
                ) : (
                  <SecondaryButton className="w-full justify-center">Start now</SecondaryButton>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <SectionHeading eyebrow="❓ Questions" title="Frequently asked questions" />
        </Reveal>
        <div className="space-y-2">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-sm">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform duration-200"
                    style={{ color: ACCENT, transform: open ? "rotate(180deg)" : "none" }}
                  />
                </button>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                    className="px-5 pb-4 text-sm leading-[1.7]"
                    style={{ color: MUTE }}
                  >
                    {f.a}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t" style={{ borderColor: BORDER }}>
        <Reveal>
          <div className="rounded-2xl p-10 sm:p-14 text-center" style={{ backgroundColor: INK }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-[1.3]">
              Stop paying commission on your own orders
            </h2>
            <p className="mt-3 text-sm" style={{ color: "#A3A3A3" }}>
              Set up your store today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <PrimaryButton>Start now</PrimaryButton>
              <a href={DEMO_STORE_URL} target="_blank" rel="noreferrer">
                <SecondaryButton style={{ color: "#fff", borderColor: "#3A3A3A" }}>
                  See demo store
                </SecondaryButton>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= CONTACT ================= */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <Reveal>
          <div className="rounded-2xl border p-8 flex flex-col sm:flex-row items-center justify-between gap-6" style={{ borderColor: BORDER }}>
            <div>
              <h3 className="font-semibold text-base mb-1">Have questions?</h3>
              <p className="text-sm" style={{ color: MUTE }}>Send us a message and we'll get back to you.</p>
            </div>
            <PrimaryButton>Contact us</PrimaryButton>
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: ACCENT }}>
                <img src="/cc.jpg" alt="Crimson Castle logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[15px]">Crimson Castle</span>
            </div>
            <p className="text-sm leading-[1.7]" style={{ color: MUTE }}>
              Helping home chefs run their food business online.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm" style={{ color: MUTE }}>
              <li>
  <a href="/privacy-policy" className="hover:underline">
    Privacy Policy
  </a>
</li>

<li>
  <a href="/terms-and-conditions" className="hover:underline">
    Terms and Conditions
  </a>
</li>

<li>
  <a href="/refund-policy" className="hover:underline">
    Refund Policy
  </a>
</li>

<li>
  <a href="/cancellation-policy" className="hover:underline">
    Cancellation Policy
  </a>
</li>

<li>
  <a href="/delivery-policy" className="hover:underline">
    Delivery Policy
  </a>
</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm" style={{ color: MUTE }}>
              <li>Mon–Fri, 9am–6pm PKT</li>
              <li className="flex items-center gap-2"><Mail size={14} /> info@crimsoncastle.biz</li>
              <li className="flex items-center gap-2"><Phone size={14} /> 0334-8204806</li>
            </ul>
          </div>

          <ul className="flex items-center gap-x-3 sm:gap-x-5 text-muted-foreground">
  <li>
    <a
      href="https://www.instagram.com/crimsoncastle.biz"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Crimson Castle Instagram Page"
      className="transition-colors hover:text-[#B1111C]"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7.75 2C4.574 2 2 4.574 2 7.75v8.5C2 19.426 4.574 22 7.75 22h8.5C19.426 22 22 19.426 22 16.25v-8.5C22 4.574 19.426 2 16.25 2h-8.5zm0 1.8h8.5a3.95 3.95 0 013.95 3.95v8.5a3.95 3.95 0 01-3.95 3.95h-8.5a3.95 3.95 0 01-3.95-3.95v-8.5A3.95 3.95 0 017.75 3.8zm8.95 1.35a1.05 1.05 0 100 2.1 1.05 1.05 0 000-2.1zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.8A3.2 3.2 0 1112 15.2 3.2 3.2 0 0112 8.8z" />
      </svg>
    </a>
  </li>

  <li>
    <a
      href="https://www.facebook.com/profile.php?id=61570768106092"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Crimson Castle Facebook Page"
      className="transition-colors hover:text-[#B1111C]"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.25.2 2.25.2v2.46H15.2c-1.25 0-1.64.77-1.64 1.57V12h2.8l-.45 2.89h-2.35v6.99A10 10 0 0022 12z" />
      </svg>
    </a>
  </li>

  <li>
    <a
      href="https://linkedin.com/company/crimson-castle-pk"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Crimson Castle LinkedIn Page"
      className="transition-colors hover:text-[#B1111C]"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6A2.5 2.5 0 010 3.5 2.5 2.5 0 012.49 1a2.5 2.5 0 012.49 2.5zM.5 8h4V23h-4V8zm7 0h3.83v2.05h.05c.53-1.01 1.84-2.08 3.79-2.08 4.05 0 4.8 2.66 4.8 6.12V23h-4v-7.79c0-1.86-.03-4.26-2.6-4.26-2.6 0-3 2.03-3 4.13V23h-4V8z" />
      </svg>
    </a>
  </li>

  <li>
    <a
      href="https://www.youtube.com/@crimsoncastle-o9e"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Crimson Castle Youtube Page"
      className="transition-colors hover:text-[#B1111C]"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.57A3.02 3.02 0 00.5 6.2 31.72 31.72 0 000 12a31.72 31.72 0 00.5 5.8 3.02 3.02 0 002.12 2.13c1.88.57 9.38.57 9.38.57s7.5 0 9.38-.57a3.02 3.02 0 002.12-2.13A31.72 31.72 0 0024 12a31.72 31.72 0 00-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
      </svg>
    </a>
  </li>
</ul>
        </div>
        <div className="border-t py-6 text-center text-xs" style={{ borderColor: BORDER, color: MUTE }}>
          © 2026 Crimson Castle. All rights reserved.
        </div>
      </footer>
    </div>
  );
}