import { Link } from "react-router"
import { UserAuth } from "../context/AuthContext"
import {
  ClipboardList,
  PlusCircle,
  Boxes,
  Users,
  Settings,
  User,
  ChefHat,
  UtensilsCrossed,
  Soup,
  ArrowRight,
} from "lucide-react"

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"


const quickLinks = [
  {
    label: "Orders",
    link: "/orders",
    icon: ClipboardList,
    desc: "View and manage incoming orders",
  },
  {
    label: "Place Order",
    link: "/place-order",
    icon: PlusCircle,
    desc: "Add an order on a customer's behalf",
  },
  {
    label: "Inventory",
    link: "/inventory",
    icon: Boxes,
    desc: "Update your menu and stock levels",
  },
  {
    label: "Customers",
    link: "/customers",
    icon: Users,
    desc: "See who's ordering from your store",
  },
  {
    label: "Settings",
    link: "/settings",
    icon: Settings,
    desc: "Update your restaurant's profile",
  },
  {
    label: "Account",
    link: "/account",
    icon: User,
    desc: "Manage your login and subscription",
  },
]

export default function Dashboard() {
  const { session } = UserAuth()

  return (
    <div
      className="min-h-screen p-4 sm:p-6 max-md:p-3"
      style={{ backgroundColor: SOFT }}
    >
      <div className="max-w-5xl mx-auto">
        {/* ================= GREETING HERO ================= */}
        <div
          className="relative overflow-hidden rounded-2xl mb-8 px-6 sm:px-8 py-8 sm:py-10 flex items-center justify-between gap-6 max-md:mb-4 max-md:rounded-xl max-md:px-4 max-md:py-4 max-md:gap-3"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #8E1522 100%)` }}
        >
          <UtensilsCrossed className="absolute -left-4 -top-6 w-28 h-28 text-white/10 rotate-[-15deg] max-md:hidden" />
          <Soup className="absolute right-10 -bottom-8 w-32 h-32 text-white/10 rotate-[10deg] max-md:hidden" />

          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/70 mb-2 max-md:text-[10px] max-md:mb-0.5">
              Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl max-md:text-lg font-extrabold text-white">
              Welcome back{session?.name ? `, ${session.name}` : ""}
            </h1>
            <p className="text-white/80 text-base mt-2 max-w-md max-md:text-xs max-md:mt-1">
              Here's a quick way to get to everything you manage day to day.
            </p>
          </div>

          <div
            className="relative z-10 hidden sm:flex w-20 h-20 rounded-2xl items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <ChefHat className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* ================= QUICK LINKS ================= */}
        <h2
          className="text-lg max-md:text-sm font-bold mb-4 max-md:mb-2"
          style={{ color: INK }}
        >
          Quick Links
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-md:grid-cols-2 max-md:gap-2.5">
          {quickLinks.map((q) => (
            <Link
              key={q.link}
              to={q.link}
              className="group bg-white rounded-2xl border p-5 flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all max-md:p-3 max-md:rounded-xl"
              style={{ borderColor: BORDER }}
            >
              <div
                className="w-11 h-11 max-md:w-7 max-md:h-7 rounded-xl flex items-center justify-center mb-4 max-md:mb-2"
                style={{ backgroundColor: SOFT, color: ACCENT }}
              >
                <q.icon className="w-5 h-5 max-md:w-4 max-md:h-4" />
              </div>
              <div className="flex items-center justify-between gap-2 mb-1 max-md:mb-0.5">
                <span
                  className="font-bold text-base max-md:text-sm"
                  style={{ color: INK }}
                >
                  {q.label}
                </span>
                <ArrowRight
                  className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  style={{ color: ACCENT }}
                />
              </div>
              <p
                className="text-sm max-md:text-xs max-md:leading-snug"
                style={{ color: MUTE }}
              >
                {q.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}