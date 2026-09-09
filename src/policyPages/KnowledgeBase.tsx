import { useState } from "react";
import {
  Search,
  ChevronDown,
  Settings,
  ShoppingCart,
  Package,
  Clock,
  BarChart3,
  Truck,
  Tag,
  Users,
  User,
  HelpCircle,
} from "lucide-react";
import { Input } from "../components/ui/input";
import type { LucideIcon } from "lucide-react";

type KnowledgeBaseItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  content: string | string[];
};

type AccordionItemProps = {
  item: KnowledgeBaseItem;
  isOpen: boolean;
  onToggle: () => void;
};
const knowledgeBaseItems: KnowledgeBaseItem[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: HelpCircle,
    description: "Pick your Restaurant name",
    content:
      "On first setup go to settings, a dialog will appear where you can enter your Restaurant Name. Note: Pick name wisely as it also sets up your subdomain and it cannot be changed unless you contact support.",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Customize and change your store's functionality and look",
    content: [
      "Change Restaurant Logo",
      "Change Restaurant Cover Photo/Banner",
      "Change Theme (Pink, Blue, Green, Purple, Orange)",
      "Add Announcement (e.g: 20% OFF Ramadan Offer)",

      "Add Store info (Phone, Email, Address, Pickup location)",
      "Attach Instagram and Facebook links",

      "Use .crimsoncastle.shop domain or custom domain (Pro Plan)",
      "Add Meta Title and Meta Description for SEO",

      "Enable or disable Pre orders",
    ],
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    description: "Manage customer orders with different statuses",
    content: [
      'New Orders are marked "Pending" by default in the Pending Tab',
      'Mark orders as "Confirmed"  show in Confirmed Tab',

      'Orders marked "Pickedup" show in PickedUp Tab',
      "Delivered orders show in Delivered Tab",
      "Cancelled Tab shows Cancelled Orders",
      "All Orders Tab shows all orders list",
      "Search through Orders by Order No",
      "",
      "Note: The quantity of items in orders marked as Confirmed will be automatically deducted from inventory. For example, if 1 Zinger Burger is marked as Confirmed, then 1 unit of Zinger Burger will be subtracted from the inventory of Zinger Burgers.",
    ],
  },
  {
    id: "place-order",
    title: "Place Order",
    icon: Package,
    description: "Manually place delivery or pickup orders for customers",
    content:
      "Create orders for customers who called or messaged their orders directly. This feature helps you manage orders received through alternative channels like WhatsApp or phone calls.",
  },
  {
    id: "inventory",
    title: "Manage Inventory",
    icon: Package,
    description: "Manage your restaurant's complete inventory",
    content: [
      "Add items in three ways:",
      "  1. Manually",
      "  2. Import CSV Excel file",
      "  3. Upload Image/PDF - AI scans and adds items",
      "",
      "Item Details:",
      "  • Name",
      "  • Description",
      "  • Price (selling price)",
      "  • Cost Price (ingredient cost)",
      "  • Category",
      "  • Stock Amount",
      "  • Food Image",
      "",
      "Note: Price and Cost Price can be left blank if the item has variants (for e.g: Small, Medium, Large) as each variant has its own Price and Cost Price.",
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    description: "Monitor how your business is doing with real-time insights",
    content: [
      "Track Revenue, Profit Margin and actual profit",
      "See which items are selling the most",
      "View stock distribution at a glance",
    ],
  },
  {
    id: "pre-order",
    title: "Pre-order Setting",
    icon: Clock,
    description: "Let customers schedule orders in advance",
    content:
      "Enable pre-orders so customers pick a future date and time slot instead of ordering for right now - ideal since home-chef orders need prep time. Set a minimum notice period (e.g. 2 hours), how many days ahead customers can schedule, and separate time windows for pickup and delivery.",
  },
  {
    id: "delivery-charges",
    title: "Delivery Charges",
    icon: Truck,
    description: "Set delivery rates for your zones",
    content:
      "Set either a fixed delivery rate for all zones or configure different rates for each delivery zone based on distance and location.",
  },
  {
    id: "coupon-manager",
    title: "Coupon Manager",
    icon: Tag,
    description: "Create coupons to drive sales",
    content:
      "Create coupons with 10%, 20%, and other discounts to drive sales and build your customer base. Coupons are a great marketing tool to increase order frequency.",
  },

  {
    id: "customers",
    title: "Customers",
    icon: Users,
    description: "View all registered customers",
    content:
      "View all customers who have signed up to your restaurant. Access their information, and contact details.",
  },

  {
    id: "account",
    title: "Account",
    icon: User,
    description: "Manage your subscription plan",
    content:
      "Upgrade or downgrade your plan based on your restaurant's needs and growth.",
  },
  {
    id: "support",
    title: "Support",
    icon: HelpCircle,
    description: "Get help from our support team",
    content:
      "If you have any questions or issues, contact our support team for assistance.",
  },
];

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  const IconComponent = item.icon;

  return (
    <div className="border border-[#e0e0e0] rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-6 bg-[#ffffff] hover:bg-[#f9f9f9] transition-colors"
      >
        <div className="flex items-center gap-4 text-left min-w-0">
          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-[#a53122] flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-[#1a1a1a] text-sm sm:text-base">
              {item.title}
            </h3>
            <p className="text-[#666666] text-xs sm:text-sm truncate">
              {item.description}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-[#a53122] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 sm:px-6 py-4 sm:py-6 bg-[#f8f9fa] border-t border-[#e0e0e0]">
          {typeof item.content === "string" ? (
            <p className="text-[#1a1a1a] text-sm sm:text-base leading-relaxed">
              {item.content}
            </p>
          ) : (
            <ul className="space-y-2">
              {item.content.map((point, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-[#1a1a1a] text-sm sm:text-base"
                >
                  <span className="text-[#a53122] font-bold flex-shrink-0">
                    •
                  </span>
                  <span className="whitespace-pre-wrap">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  const [openItem, setOpenItem] = useState<string | null>("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = knowledgeBaseItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-[#ffffff] border-b border-[#e0e0e0] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1a1a] mb-2">
                Maroon Apron
              </h1>
              <p className="text-[#666666] text-base sm:text-lg">
                Complete guide to managing your restaurant
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <Input
                placeholder="Search features, settings, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-[#f8f9fa] border-[#e0e0e0] text-[#1a1a1a] placeholder-[#666666] rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#666666] text-lg">
              No results found for "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 bg-[#a53122] text-white rounded-lg hover:bg-[#c45647] transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <AccordionItem
                key={item.id}
                item={item}
                isOpen={openItem === item.id}
                onToggle={() =>
                  setOpenItem(openItem === item.id ? null : item.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#ffffff] border-t border-[#e0e0e0] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">
                Still have questions?
              </h3>
              <p className="text-[#666666] mb-4">
                Can't find what you're looking for? Our support team is here to
                help.
              </p>
              <a
                href="mailto:support@maroonapron.com"
                className="hover:text-foreground transition-colors flex items-center gap-x-1 text-sm font-semibold"
              >
                Email Us : support@maroonapron.com
              </a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-3">
                Quick Tips
              </h3>
              <ul className="space-y-2 text-[#666666] text-sm">
                <li>
                  ✓ Set up your store settings first before adding menu items
                </li>
                <li>✓ Use categories to organize your menu effectively</li>
                <li>
                  ✓ Check analytics regularly to track business performance
                </li>
                <li>
                  ✓ Keep your inventory updated for accurate order management
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
