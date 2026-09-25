import { Link, useLocation } from "react-router";
import { useState ,useEffect} from "react";
import { socket } from "../lib/socket";
import { toast } from "sonner";
import { notif } from "../zustand/notifStore";
import { useQueryClient } from "@tanstack/react-query";
import { UserAuth } from "../context/AuthContext";

import useSound from "use-sound";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Boxes,
  Users,
  Settings,
  User,
  Menu,
  X,
  MotorbikeIcon,
  TrendingUp,
  Ticket,
} from "lucide-react";
import NotificationPanel from "./NotificationPanel";

const ACCENT = "#D6293F";
const INK = "#171717";
const BORDER = "#FFFFFF";

const navLinks = [
  { label: "Home", link: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", link: "/analytics", icon: TrendingUp },
  { label: "Orders", link: "/orders", icon: ClipboardList },
  { label: "Place Order", link: "/place-order", icon: PlusCircle },
  { label: "Inventory", link: "/inventory", icon: Boxes },
  { label: "Delivery Zones", link: "/delivery-zones", icon: MotorbikeIcon },
  { label: "Coupons", link: "/coupon", icon: Ticket },
  { label: "Customers", link: "/customers", icon: Users },
  { label: "Settings", link: "/settings", icon: Settings },

  { label: "Account", link: "/account", icon: User },
];

function NavItem({
  n,
  active,
  onClick,
}: {
  n: (typeof navLinks)[number];
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={n.link}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
        active ? "text-white" : "text-black hover:bg-gray-100"
      }`}
      style={
        active
          ? {
              backgroundColor: ACCENT,
            }
          : {
              backgroundColor: "transparent",
            }
      }
    >
      <n.icon className="w-5 h-5 shrink-0" />
      <span>{n.label}</span>
    </Link>
  );
}

export default function SideBar({restId}:{restId:string | null}) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {session} = UserAuth()
  const isActive = (link: string) =>
    location.pathname === link || location.pathname.startsWith(link + "/");

   const queryClient = useQueryClient();

   const [playNewOrder, { sound }] = useSound("/sound.webm", {
     volume: 0.7,
     interrupt: true,
    preload: true,
   });

   useEffect(() => {
     if (!sound) return;
     const load = () => {
      if (sound.state() === "unloaded") sound.load();
     };
     window.addEventListener("pointerdown", load, { once: true });
     return () => window.removeEventListener("pointerdown", load);
   }, [sound]);
   
     useEffect(() => {
       const unlock = () => {
         try {
           const AudioCtx = window.AudioContext || window.AudioContext;
           const ctx = new AudioCtx();
   
           if (ctx.state === "suspended") {
             ctx.resume();
           }
         } catch (err) {
           console.error(err);
         }
   
         window.removeEventListener("click", unlock);
       };
   
       window.addEventListener("click", unlock);
   
       return () => {
         window.removeEventListener("click", unlock);
       };
     }, []);
   //socket

     useEffect(() => {
  if (!session?.id || !restId) return;

  socket.connect();

  const handleConnect = () => {
    socket.emit("joinRestaurant", restId);
  };

  socket.on("connect", handleConnect);

  return () => {
    socket.off("connect", handleConnect);

    if (socket.connected) {
      socket.emit("leaveRestaurant", restId);
    }

    socket.disconnect();
  };
}, [session?.id, restId]);

     useEffect(() => {
         socket.on("newOrder", (order) => {
           console.log("New order:", order);
           playNewOrder();
     
           toast.info(`New order #${order.orderNumber}`);
           notif(`New order placed! #${order.orderNumber}`, {});
     
           queryClient.invalidateQueries({
             queryKey: ["orders"],
           });
         });
     
         return () => {
           socket.off("newOrder");
         };
       }, [queryClient, playNewOrder]);
     
     
     
     

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <div
        className="md:hidden flex items-center justify-between px-4 h-16 sticky top-0 z-40 border-b bg-white"
        style={{ borderColor: BORDER }}
      >
        <div className="flex items-center gap-3 max-md:hidden">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: ACCENT }}
          >
            <img
              src="/maroonapron-logo.png"
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="font-bold text-base" style={{ color: INK }}>
            Maroon Apron
          </span>
        </div>

        {/* Bell + menu */}
        <div className="flex items-center justify-between gap-2 -ml-8">
          <div className="flex h-9 w-9 items-center justify-center">
            <NotificationPanel />
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="p-2"
            style={{ color: INK }}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* ================= MOBILE DRAWER ================= */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer */}
        <div
          className={`relative h-full w-72 bg-white flex flex-col p-5 shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: ACCENT }}
              >
                <img
                  src="/maroonapron-logo.png"
                  alt="logo"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="font-bold text-lg" style={{ color: INK }}>
                Maroon Apron
              </span>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1"
              style={{ color: INK }}
              aria-label="Close menu"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {navLinks.map((n) => (
              <NavItem
                key={n.link}
                n={n}
                active={isActive(n.link)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div
        className="hidden md:flex flex-col w-72 h-screen sticky top-0 shrink-0 p-5 border-r bg-white"
        style={{ borderColor: BORDER }}
      >
        <div className="relative flex items-center gap-3 mb-10 pr-9">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: ACCENT }}
          >
            <img
              src="/maroonapron-logo.png"
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="font-bold text-lg" style={{ color: INK }}>
            Maroon Apron
          </span>

          <div className="absolute right-0 -translate-y-1/2 w-9 h-9 flex items-center justify-center">
            <NotificationPanel />
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navLinks.map((n) => (
            <NavItem key={n.link} n={n} active={isActive(n.link)} />
          ))}
        </nav>
      </div>
    </>
  );
}
