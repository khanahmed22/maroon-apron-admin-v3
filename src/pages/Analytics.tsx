import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import { TrendingUp, Package, DollarSign, ShoppingCart, RefreshCcw } from "lucide-react";

/* ---------------------- Types ---------------------- */
interface AnalyticsProps {
  restId: string | null;
}

interface OrderProps {
  id: string;
  orderNumber: string;
  createdAt: string;
  custName: string;
  custEmail: string;
  orderDetails: CartItemSnapshot[] | string | null;
  recieveMethod: string;
  status: string;
  orderTotal: number;
  restId: string | null;
  deliveryArea: string | null;
  deliveryFee: string | null;
}

interface CartItemSnapshot {
  dbId: string;
  name: string;
  price: number; // unit price * quantity, per addCart in PlaceOrder
  quantity: number;
  variantName?: string;
}

interface InventVariantProps {
  id: string;
  variantName: string;
  variantPrice: number;
}

interface InventProps {
  id: string;
  name: string;
  price: number;
  costPrice: string | null;
  category: string | null;
  stockAmount: number;
  variants: InventVariantProps[];
}

interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

interface RevenueByDay {
  date: string;
  revenue: number;
}

interface InventoryStatus {
  name: string;
  category: string;
  stockAmount: number;
  status: string;
  costPrice: number;
  price: number;
}

/* ---------------------- Helpers ---------------------- */
function isoDayKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ---------------------- KPI Card ---------------------- */
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  bgColor: string;
}

interface InventoryResponse {
  status: string;
  source: string;
  data: InventProps[];
}

function KPICard({ title, value, icon, trend, bgColor }: KPICardProps) {
  return (
    <Card className="bg-analytics-card border-analytics-border hover:border-analytics-accent/50 transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between flex-col space-y-2">
          <div className="p-3 rounded-lg opacity-90" style={{ backgroundColor: bgColor }}>
            <div className="text-white">{icon}</div>
          </div>
          <div className="flex-1">
            <p className="text-analytics-muted text-sm font-medium mb-2">{title}</p>
            <h3 className="text-lg sm:text-xl font-bold text-analytics-text mb-2">{value}</h3>
            {trend && <p className="text-green-400 text-xs sm:text-sm font-medium">{trend}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------------------- Component ---------------------- */
export default function Analytics({ restId }: AnalyticsProps) {

  /* ---------------------- Date range state ---------------------- */
  const [rangePreset, setRangePreset] = useState<string>("7d");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return isoDayKey(d);
  });
  const [endDate, setEndDate] = useState<string>(() => isoDayKey(new Date()));

  /* ---------------------- Data state ---------------------- */
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderProps[]>([]);
  const [menuItems, setMenuItems] = useState<InventProps[]>([]);
  const [error, setError] = useState<string>("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  /* ---------------------- Fetch orders + inventory ---------------------- */
  const fetchOrdersAndMenu = async () => {
    if (!restId) {
      setError("Missing restaurant");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const from = startOfDay(new Date(startDate)).toISOString();
      const to = endOfDay(new Date(endDate)).toISOString();

      const [ordersRes, menuRes] = await Promise.all([
  fetch(`${BACKEND_URL}/analytics/orders/${restId}?from=${from}&to=${to}`, {
    credentials: "include",
  }),
  fetch(`${BACKEND_URL}/inventory`, {
    credentials: "include",
  }),
]);

      if (!ordersRes.ok) throw new Error("Failed to load orders");
      if (!menuRes.ok) throw new Error("Failed to load inventory");

      const ordersData: OrderProps[] = await ordersRes.json();
     const menuData: InventoryResponse = await menuRes.json();



      setOrders(Array.isArray(ordersData) ? ordersData : []);
setMenuItems(menuData.data ?? []);    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics data");
      console.error("[Analytics] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restId) fetchOrdersAndMenu();
  }, [restId, startDate, endDate]);

  /* ---------------------- Presets ---------------------- */
  const applyPreset = (preset: string) => {
    setRangePreset(preset);
    const now = new Date();
    if (preset === "today") {
      setStartDate(isoDayKey(now));
      setEndDate(isoDayKey(now));
      return;
    }
    if (preset === "7d") {
      const s = new Date();
      s.setDate(now.getDate() - 6);
      setStartDate(isoDayKey(s));
      setEndDate(isoDayKey(now));
      return;
    }
    if (preset === "30d") {
      const s = new Date();
      s.setDate(now.getDate() - 29);
      setStartDate(isoDayKey(s));
      setEndDate(isoDayKey(now));
      return;
    }
    if (preset === "month") {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(isoDayKey(s));
      setEndDate(isoDayKey(e));
      return;
    }
  };

  /* ---------------------- Analytics ---------------------- */
  const analyticsData = useMemo(() => {
    // dbId -> costPrice, for computing cost of making per order line
    const costByDbId: Record<string, number> = {};
    menuItems.forEach((item) => {
      costByDbId[item.id] = toNumber(item.costPrice);
    });

    let totalRevenue = 0;
    let totalCostMaking = 0;
    let totalDeliveryFees = 0;
    const dailyRevenueMap: Record<string, number> = {};
    const itemSales: Record<string, TopItem> = {};

    orders.forEach((order) => {
      const dayKey = isoDayKey(new Date(order.createdAt));

      // orderTotal already includes delivery fee (see Checkout/PlaceOrder)
      const orderRevenue = toNumber(order.orderTotal);
      const deliveryFee = toNumber(order.deliveryFee);

      totalRevenue += orderRevenue;
      totalDeliveryFees += deliveryFee;

      if (!dailyRevenueMap[dayKey]) dailyRevenueMap[dayKey] = 0;
      dailyRevenueMap[dayKey] += orderRevenue;

      // orderDetails holds the cart array at time of purchase
      let details: CartItemSnapshot[] = [];
      if (typeof order.orderDetails === "string") {
        try { details = JSON.parse(order.orderDetails); } catch { details = []; }
      } else if (Array.isArray(order.orderDetails)) {
        details = order.orderDetails;
      }

      details.forEach((item) => {
        const name = item.variantName ? `${item.name} (${item.variantName})` : (item.name || "Unknown Item");
        const qty = Math.max(1, toNumber(item.quantity));
        // item.price is already unit price * quantity (see addCart)
        const itemRevenue = toNumber(item.price);

        const unitCost = costByDbId[item.dbId] ?? 0;
        const itemCost = unitCost * qty;
        totalCostMaking += itemCost;

        if (!itemSales[name]) itemSales[name] = { name, quantity: 0, revenue: 0 };
        itemSales[name].quantity += qty;
        itemSales[name].revenue += itemRevenue;
      });
    });

    // Profit excludes delivery fee — it's a pass-through, not margin
    const profit = totalRevenue - totalCostMaking - totalDeliveryFees;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const totalOrders = orders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const topItems: TopItem[] = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((x) => ({ ...x, revenue: parseFloat(x.revenue.toFixed(2)) }));

    const revenueByDay: RevenueByDay[] = Object.entries(dailyRevenueMap)
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const inventoryStatus: InventoryStatus[] = menuItems?.map((item) => ({
      name: item.name || "Unnamed",
      category: item.category || "",
      stockAmount: toNumber(item.stockAmount),
      status: toNumber(item.stockAmount) > 0 ? "In Stock" : "Out of Stock",
      costPrice: toNumber(item.costPrice),
      price: toNumber(item.price),
    })) || [];

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      topItems,
      revenueByDay,
      inventoryStatus,
    };
  }, [orders, menuItems]);

  const {
    totalRevenue = 0, totalOrders = 0, averageOrderValue = 0,
    profit = 0, profitMargin = 0, topItems = [], revenueByDay = [], inventoryStatus = []
  } = analyticsData || {};

  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
  const INK = "#171717"


  /* ---------------------- UI ---------------------- */
  return (
    <div className="min-h-screen bg-analytics-bg text-analytics-text p-2">

      <div className="border-b border-analytics-border bg-analytics-card/50 backdrop-blur">
        <h1 className="text-3xl font-extrabold mb-6" style={{ color: INK }}>
        Analytics
      </h1>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Button variant="outline" onClick={fetchOrdersAndMenu} disabled={loading} className="gap-2 w-fit bg-transparent">
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Filters */}
        <Card className="bg-analytics-card border-analytics-border rounded-2xl mb-8">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-3">
                <div className="text-xs text-analytics-muted mb-1">Range</div>
                <Select value={rangePreset} onValueChange={applyPreset}>
                  <SelectTrigger className="rounded-xl bg-analytics-bg border-analytics-border text-analytics-text">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-3">
                <div className="text-xs text-analytics-muted mb-1">Start Date</div>
                <Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} className="rounded-xl bg-analytics-bg border-analytics-border text-analytics-text" />
              </div>

              <div className="lg:col-span-3">
                <div className="text-xs text-analytics-muted mb-1">End Date</div>
                <Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} className="rounded-xl bg-analytics-bg border-analytics-border text-analytics-text" />
              </div>

              <div className="lg:col-span-3 flex items-end">
                <Button onClick={fetchOrdersAndMenu} disabled={loading} className="w-fit btn-accent">{loading ? "Loading..." : "Apply"}</Button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <KPICard title="Total Revenue" value={formatMoney(totalRevenue)} icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6" />} trend="" bgColor="#FF6B6B" />
          <KPICard title="Total Orders" value={totalOrders.toString()} icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />} trend="Orders in selected range" bgColor="#4ECDC4" />
          <KPICard title="Average Order Value" value={formatMoney(averageOrderValue)} icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />} trend="Revenue / Orders" bgColor="#45B7D1" />
          <KPICard title="Profit Margin" value={`${profitMargin.toFixed(1)}%`} icon={<Package className="w-5 h-5 md:w-6 md:h-6" />} trend="Based on actual costs" bgColor="#FFA07A" />
          <KPICard title="Actual Profit" value={formatMoney(profit)} icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6" />} trend="Revenue - Cost of Making - Delivery Fees" bgColor="#4CAF50" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full border border-zinc-800 rounded-lg">
            <TabsTrigger value="revenue" className="rounded-md text-zinc-900 data-[state=active]:bg-red-500 data-[state=active]:text-white">Revenue</TabsTrigger>
            <TabsTrigger value="items" className="rounded-md text-zinc-900 data-[state=active]:bg-red-500 data-[state=active]:text-white">Top Items</TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-md text-zinc-900 data-[state=active]:bg-red-500 data-[state=active]:text-white">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card className="bg-analytics-card border-analytics-border">
              <CardHeader><CardTitle className="text-analytics-text">Revenue Over Time</CardTitle></CardHeader>
              <CardContent>
                <div className="w-full h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--analytics-border)" />
                      <XAxis dataKey="date" stroke="var(--analytics-muted)" style={{ fontSize: "12px" }} />
                      <YAxis stroke="var(--analytics-muted)" style={{ fontSize: "12px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--analytics-card)", border: "1px solid var(--analytics-border)", borderRadius: "8px" }} labelStyle={{ color: "var(--analytics-text)" }} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#FF6B6B" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card className="bg-analytics-card border-analytics-border">
              <CardHeader><CardTitle className="text-analytics-text">Top Selling Items</CardTitle></CardHeader>
              <CardContent>
                <div className="w-full h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItems}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--analytics-border)" />
                      <XAxis dataKey="name" stroke="var(--analytics-muted)" angle={-45} textAnchor="end" height={80} style={{ fontSize: "12px" }} />
                      <YAxis stroke="var(--analytics-muted)" style={{ fontSize: "12px" }} />
                      <Tooltip contentStyle={{ backgroundColor: "var(--analytics-card)", border: "1px solid var(--analytics-border)", borderRadius: "8px" }} labelStyle={{ color: "var(--analytics-text)" }} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#4ECDC4" isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="bg-analytics-card border-analytics-border h-full">
                  <CardHeader><CardTitle className="text-analytics-text">Stock Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={inventoryStatus.slice(0, 5)} cx="50%" cy="50%" outerRadius={90} dataKey="stockAmount" nameKey="name"
                            label={({ name, value }) => `${String(name).slice(0, 10)}: ${value}`}>
                            {inventoryStatus.slice(0, 5).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "var(--analytics-card)", border: "1px solid var(--analytics-border)", borderRadius: "8px" }} labelStyle={{ color: "var(--analytics-text)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card className="bg-analytics-card border-analytics-border">
                  <CardHeader><CardTitle className="text-analytics-text">Stock Levels</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                      {inventoryStatus.map((item, index) => (
                        <div key={index} className="bg-analytics-bg rounded-lg p-4 border border-analytics-border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-analytics-text font-semibold text-sm sm:text-base">{item.name}</p>
                              <p className="text-analytics-muted text-xs sm:text-sm">{item.category}</p>
                            </div>
                            <span className="text-analytics-accent font-bold text-sm sm:text-base">{item.stockAmount} units</span>
                          </div>
                          <div className="w-full bg-analytics-border rounded-full h-2">
                            <div className="bg-gradient-to-r from-analytics-accent-1 to-analytics-accent-2 h-2 rounded-full"
                              style={{ width: `${Math.min((item.stockAmount / 100) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}