import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import jsPDF from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import { TrendingUp, Package, DollarSign, ShoppingCart, RefreshCcw, Download, Loader2 } from "lucide-react";

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
  price: number; 
  quantity: number;
  variantId?: string;
  variantName?: string;
}

interface InventVariantProps {
  id: string;
  variantName: string;
  variantPrice: number;
  variantCostPrice: number | null;
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

interface InventoryResponse {
  status: string;
  source: string;
  data: InventProps[];
}

interface AnalyticsQueryResult {
  orders: OrderProps[];
  menuItems: InventProps[];
}

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

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getUnitCost(cartItem: CartItemSnapshot, menuItem?: InventProps): number {
  if (!menuItem) return 0;

  const hasVariants = (menuItem.variants?.length ?? 0) > 0;

  if (hasVariants) {
    const matchedVariant = cartItem.variantId
      ? menuItem.variants.find((v) => v.id === cartItem.variantId)
      : menuItem.variants.find((v) => v.variantName === cartItem.variantName);
    return toNumber(matchedVariant?.variantCostPrice);
  }

  return toNumber(menuItem.costPrice);
}

// Pulled out of the component so both the live dashboard (via useMemo) and
// the on-demand PDF report generator can compute the same figures for
// whatever date range each of them needs, without duplicating the logic.
function computeAnalytics(orders: OrderProps[], menuItems: InventProps[]) {
  const menuById: Record<string, InventProps> = {};
  menuItems.forEach((item) => {
    menuById[item.id] = item;
  });

  let totalRevenue = 0;
  let totalCostMaking = 0;
  let totalDeliveryFees = 0;
  const dailyRevenueMap: Record<string, number> = {};
  const itemSales: Record<string, TopItem> = {};

  orders.forEach((order) => {
    const dayKey = isoDayKey(new Date(order.createdAt));

    const orderRevenue = toNumber(order.orderTotal);
    const deliveryFee = toNumber(order.deliveryFee);

    totalRevenue += orderRevenue;
    totalDeliveryFees += deliveryFee;

    if (!dailyRevenueMap[dayKey]) dailyRevenueMap[dayKey] = 0;
    dailyRevenueMap[dayKey] += orderRevenue;

    let details: CartItemSnapshot[] = [];
    if (typeof order.orderDetails === "string") {
      try { details = JSON.parse(order.orderDetails); } catch { details = []; }
    } else if (Array.isArray(order.orderDetails)) {
      details = order.orderDetails;
    }

    details.forEach((item) => {
      const menuItem = menuById[item.dbId];
      const name = item.variantName ? `${item.name} (${item.variantName})` : (item.name || "Unknown Item");
      const qty = Math.max(1, toNumber(item.quantity));
      const itemRevenue = toNumber(item.price);

      const unitCost = getUnitCost(item, menuItem);
      const itemCost = unitCost * qty;
      totalCostMaking += itemCost;

      if (!itemSales[name]) itemSales[name] = { name, quantity: 0, revenue: 0 };
      itemSales[name].quantity += qty;
      itemSales[name].revenue += itemRevenue;
    });
  });

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
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  bgColor: string;
}

const ACCENT = "#D6293F"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"
const KPI_TINTS = ["#D6293F", "#C2600A", "#2563EB", "#7C3AED", "#059669"]


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


export default function Analytics({ restId }: AnalyticsProps) {

  const queryClient = useQueryClient();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [rangePreset, setRangePreset] = useState<string>("7d");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return isoDayKey(d);
  });
  const [endDate, setEndDate] = useState<string>(() => isoDayKey(new Date()));

  // Today, in the same yyyy-mm-dd shape as the date inputs use — the hard
  // ceiling for both the dashboard range and the report range.
  const todayKey = isoDayKey(new Date());

  const [reportOpen, setReportOpen] = useState(false);
  const [reportStart, setReportStart] = useState<string>(startDate);
  const [reportEnd, setReportEnd] = useState<string>(todayKey);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string>("");

  // ---- Orders + inventory for the dashboard's selected range ----
  const fetchOrdersAndMenu = async (): Promise<AnalyticsQueryResult> => {
    if (!restId) throw new Error("Missing restaurant");

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

    return {
      orders: Array.isArray(ordersData) ? ordersData : [],
      menuItems: menuData.data ?? [],
    };
  };

  const {
    data: analyticsQueryData,
    isPending: loading,
    isError,
    error: queryError,
    refetch,
  } = useQuery<AnalyticsQueryResult>({
    queryKey: ["analytics", restId, startDate, endDate],
    queryFn: fetchOrdersAndMenu,
    enabled: !!restId,
    staleTime: 5 * 60 * 1000,
  });

  const orders = analyticsQueryData?.orders ?? [];
  const menuItems = analyticsQueryData?.menuItems ?? [];
  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load analytics data"
    : "";

  // ---- Earliest order date, used as the floor for the report's picker ----
  const fetchEarliestOrderDate = async (): Promise<string | null> => {
    if (!restId) return null;
    const from = new Date(2015, 0, 1).toISOString();
    const to = endOfDay(new Date()).toISOString();
    const res = await fetch(
      `${BACKEND_URL}/analytics/orders/${restId}?from=${from}&to=${to}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error("Failed to determine sales history");

    const allOrders: OrderProps[] = await res.json();
    if (!Array.isArray(allOrders) || allOrders.length === 0) return null;

    const earliest = allOrders.reduce(
      (min, o) => Math.min(min, new Date(o.createdAt).getTime()),
      Infinity
    );
    return Number.isFinite(earliest) ? isoDayKey(new Date(earliest)) : null;
  };

  const { data: earliestOrderDate = null } = useQuery<string | null>({
    queryKey: ["earliestOrderDate", restId],
    queryFn: fetchEarliestOrderDate,
    enabled: !!restId,
    // The first-ever order date only ever moves forward once new sales
    // history exists; there's no need to refetch this often.
    staleTime: 30 * 60 * 1000,
  });

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

  // Manual refresh: invalidate rather than just refetch, so every cached
  // date-range variation of this restaurant's analytics (and the earliest-
  // order lookup) is marked stale and refetched, not just the active one.
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics", restId] });
    queryClient.invalidateQueries({ queryKey: ["earliestOrderDate", restId] });
  };

  const analyticsData = useMemo(
    () => computeAnalytics(orders, menuItems),
    [orders, menuItems]
  );

  const {
    totalRevenue = 0, totalOrders = 0, averageOrderValue = 0,
    profit = 0, profitMargin = 0, topItems = [], revenueByDay = [], inventoryStatus = []
  } = analyticsData || {};

  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
  const INK = "#171717"

  // Report data for an arbitrary merchant-picked range is fetched through
  // the query client too (not a plain fetch), so it benefits from the same
  // cache/dedupe as the dashboard and stays consistent with it — a range
  // that matches what's already on screen won't refire the request.
  const fetchReportOrders = async (from: string, to: string): Promise<OrderProps[]> => {
    if (!restId) throw new Error("Missing restaurant");
    const res = await fetch(
      `${BACKEND_URL}/analytics/orders/${restId}?from=${from}&to=${to}`,
      { credentials: "include" }
    );
    if (!res.ok) throw new Error("Failed to load report data");
    const data: OrderProps[] = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const handleDownloadReport = async () => {
    if (!restId) return;
    setReportLoading(true);
    setReportError("");
    try {
      const from = startOfDay(new Date(reportStart)).toISOString();
      const to = endOfDay(new Date(reportEnd)).toISOString();

      const reportOrders = await queryClient.fetchQuery({
        queryKey: ["reportOrders", restId, reportStart, reportEnd],
        queryFn: () => fetchReportOrders(from, to),
        staleTime: 5 * 60 * 1000,
      });

      const report = computeAnalytics(reportOrders, menuItems);

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 15;
      let y = 20;

      const checkPageBreak = (needed = 10) => {
        if (y + needed > pageHeight - 15) {
          doc.addPage();
          y = 20;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Sales Report", pageWidth / 2, y, { align: "center" });
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(
        `${formatDisplayDate(reportStart)} - ${formatDisplayDate(reportEnd)}`,
        pageWidth / 2,
        y,
        { align: "center" }
      );
      y += 5;
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, y, {
        align: "center",
      });
      y += 10;
      doc.setTextColor(23, 23, 23);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Summary", marginX, y);
      y += 7;

      const kpis: [string, string][] = [
        ["Total Revenue", formatMoney(report.totalRevenue)],
        ["Total Orders", String(report.totalOrders)],
        ["Average Order Value", formatMoney(report.averageOrderValue)],
        ["Profit Margin", `${report.profitMargin.toFixed(1)}%`],
        ["Actual Profit", formatMoney(report.profit)],
      ];

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      kpis.forEach(([label, value]) => {
        checkPageBreak(8);
        doc.text(label, marginX, y);
        doc.text(value, pageWidth - marginX, y, { align: "right" });
        y += 7;
      });
      y += 5;

      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Revenue by Day", marginX, y);
      y += 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Date", marginX, y);
      doc.text("Revenue", pageWidth - marginX, y, { align: "right" });
      y += 5;
      doc.setDrawColor(231, 229, 228);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      if (report.revenueByDay.length === 0) {
        doc.text("No orders in this range", marginX, y);
        y += 6;
      } else {
        report.revenueByDay.forEach((row) => {
          checkPageBreak(7);
          doc.text(row.date, marginX, y);
          doc.text(formatMoney(row.revenue), pageWidth - marginX, y, { align: "right" });
          y += 6;
        });
      }
      y += 6;

      checkPageBreak(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Top Selling Items", marginX, y);
      y += 7;

      doc.setFontSize(10);
      doc.text("Item", marginX, y);
      doc.text("Qty", pageWidth - marginX - 35, y, { align: "right" });
      doc.text("Revenue", pageWidth - marginX, y, { align: "right" });
      y += 5;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      if (report.topItems.length === 0) {
        doc.text("No items sold in this range", marginX, y);
        y += 6;
      } else {
        report.topItems.forEach((item) => {
          checkPageBreak(7);
          const label = item.name.length > 40 ? item.name.slice(0, 40) + "…" : item.name;
          doc.text(label, marginX, y);
          doc.text(String(item.quantity), pageWidth - marginX - 35, y, { align: "right" });
          doc.text(formatMoney(item.revenue), pageWidth - marginX, y, { align: "right" });
          y += 6;
        });
      }

      const fileName = `sales-report-${reportStart}-to-${reportEnd}.pdf`;

      if (Capacitor.isNativePlatform()) {
        // There's no OS "Downloads" folder API on native without an extra
        // plugin, so mirror the print flow in Orders.tsx: write to cache,
        // then hand off to the native share sheet so the merchant can save
        // it to Files, Drive, email, etc.
        const base64 = doc.output("datauristring").split(",")[1];

        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        const { uri } = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache,
        });

        await Share.share({
          title: "Sales Report",
          text: `Sales report ${reportStart} to ${reportEnd}`,
          url: uri,
          dialogTitle: "Save or Share Report",
        });
      } else {
        // Browser / PC — normal download.
        doc.save(fileName);
      }

      setReportOpen(false);
    } catch (e) {
      console.error("[Analytics] Failed to generate report:", e);
      setReportError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  

  return (
     <div className="min-h-screen p-3 sm:p-6" style={{ backgroundColor: SOFT }}>
      <div className="max-w-7xl mx-auto">
      
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: INK }}>
            Analytics
          </h1>

          <div className="flex items-center gap-2 sm:gap-3">
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReportStart(earliestOrderDate ?? todayKey);
                    setReportEnd(todayKey);
                    setReportError("");
                  }}
                  className="gap-2 w-fit rounded-xl h-9 sm:h-11 text-sm sm:text-base bg-white"
                >
                  <Download className="h-4 w-4" style={{ color: ACCENT }} />
                  Download Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle>Download Sales Report</DialogTitle>
                  <DialogDescription>
                    Choose a date range to include in the PDF report.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-2">
                  <div>
                    <div className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>
                      Start Date
                    </div>
                    <Input
                      type="date"
                      value={reportStart}
                      min={earliestOrderDate ?? undefined}
                      max={reportEnd}
                      onChange={(e) => setReportStart(e.target.value)}
                      className="rounded-xl h-10 text-sm"
                      style={{ borderColor: BORDER }}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>
                      End Date
                    </div>
                    <Input
                      type="date"
                      value={reportEnd}
                      min={reportStart}
                      max={todayKey}
                      onChange={(e) => setReportEnd(e.target.value)}
                      className="rounded-xl h-10 text-sm"
                      style={{ borderColor: BORDER }}
                    />
                  </div>
                </div>

                {!earliestOrderDate && (
                  <p className="text-xs" style={{ color: MUTE }}>
                    No sales history found yet — showing today by default.
                  </p>
                )}
                {reportError && (
                  <p className="text-xs font-medium" style={{ color: ACCENT }}>
                    {reportError}
                  </p>
                )}

                <DialogFooter>
                  <Button
                    onClick={handleDownloadReport}
                    disabled={reportLoading}
                    className="w-full sm:w-fit rounded-xl text-white gap-2"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {reportLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Generate PDF
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-2 w-fit rounded-xl h-9 sm:h-11 text-sm sm:text-base bg-white"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} style={{ color: ACCENT }} />
              Refresh
            </Button>
          </div>
        </div>
 
        <div className="bg-white rounded-2xl border p-3 sm:p-5 mb-5 sm:mb-8" style={{ borderColor: BORDER }}>
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3">
            <div className="col-span-2 lg:col-span-3">
              <div className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Range</div>
              <Select value={rangePreset} onValueChange={applyPreset}>
                <SelectTrigger className="rounded-xl h-10 sm:h-11 text-sm sm:text-base" style={{ borderColor: BORDER }}>
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
 
            <div className="col-span-1 lg:col-span-3">
              <div className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>Start Date</div>
              <Input
                type="date"
                value={startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                className="rounded-xl h-10 sm:h-11 text-sm sm:text-base"
                style={{ borderColor: BORDER }}
              />
            </div>
 
            <div className="col-span-1 lg:col-span-3">
              <div className="text-xs font-medium mb-1.5" style={{ color: MUTE }}>End Date</div>
              <Input
                type="date"
                value={endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                className="rounded-xl h-10 sm:h-11 text-sm sm:text-base"
                style={{ borderColor: BORDER }}
              />
            </div>
 
            <div className="col-span-2 lg:col-span-3 flex items-end">
              <Button
                onClick={() => refetch()}
                disabled={loading}
                className="w-full lg:w-fit h-10 sm:h-11 rounded-xl text-sm sm:text-base text-white"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? "Loading..." : "Apply"}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm mt-3 font-medium" style={{ color: ACCENT }}>
              {error}
            </p>
          )}
        </div>
 
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-6 mb-5 sm:mb-8">
          <KPICard
            title="Total Revenue"
            value={formatMoney(totalRevenue)}
            icon={<DollarSign className="w-5 h-5" />}
            trend=""
            bgColor={KPI_TINTS[0]}
          />
          <KPICard
            title="Total Orders"
            value={totalOrders.toString()}
            icon={<ShoppingCart className="w-5 h-5" />}
            trend="Orders in selected range"
            bgColor={KPI_TINTS[1]}
          />
          <KPICard
            title="Average Order Value"
            value={formatMoney(averageOrderValue)}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="Revenue / Orders"
            bgColor={KPI_TINTS[2]}
          />
          <KPICard
            title="Profit Margin"
            value={`${profitMargin.toFixed(1)}%`}
            icon={<Package className="w-5 h-5" />}
            trend="Based on actual costs"
            bgColor={KPI_TINTS[3]}
          />
          <KPICard
            title="Actual Profit"
            value={formatMoney(profit)}
            icon={<DollarSign className="w-5 h-5" />}
            trend="Revenue - Cost of Making - Delivery Fees"
            bgColor={KPI_TINTS[4]}
            
          />
        </div>
 
        <Tabs defaultValue="revenue" className="space-y-4 sm:space-y-6">
          <TabsList
  className="bg-white border p-1 sm:p-1.5 rounded-xl h-auto gap-1 w-full sm:w-fit overflow-x-auto"
  style={{ borderColor: BORDER }}
>
  <TabsTrigger
    value="revenue"
    className="rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-gray-500 data-[state=active]:bg-red-600 data-[state=active]:text-white whitespace-nowrap"
  >
    Revenue
  </TabsTrigger>

  <TabsTrigger
    value="items"
    className="rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-gray-500 data-[state=active]:bg-red-600 data-[state=active]:text-white whitespace-nowrap"
  >
    Top Items
  </TabsTrigger>

  <TabsTrigger
    value="inventory"
    className="rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-gray-500 data-[state=active]:bg-red-600 data-[state=active]:text-white whitespace-nowrap"
  >
    Inventory
  </TabsTrigger>
</TabsList>
 
          <TabsContent value="revenue">
            <Card className="bg-white rounded-2xl" style={{ borderColor: BORDER }}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: INK }}>
                  Revenue Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="w-full h-64 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="date" stroke={MUTE} style={{ fontSize: "11px" }} />
                      <YAxis stroke={MUTE} style={{ fontSize: "11px" }} width={40} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}
                        labelStyle={{ color: INK }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
 
          <TabsContent value="items">
            <Card className="bg-white rounded-2xl" style={{ borderColor: BORDER }}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: INK }}>
                  Top Selling Items
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="w-full h-64 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItems}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                      <XAxis dataKey="name" stroke={MUTE} angle={-45} textAnchor="end" height={70} style={{ fontSize: "11px" }} />
                      <YAxis stroke={MUTE} style={{ fontSize: "11px" }} width={40} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}
                        labelStyle={{ color: INK }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill={ACCENT} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
 
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-1">
                <Card className="bg-white rounded-2xl h-full" style={{ borderColor: BORDER }}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg font-bold" style={{ color: INK }}>
                      Stock Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 sm:px-6">
                    <div className="w-full h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inventoryStatus.slice(0, 5)}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="stockAmount"
                            nameKey="name"
                            label={({ name, value }) => `${String(name).slice(0, 8)}: ${value}`}
                          >
                            {inventoryStatus.slice(0, 5).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#FFFFFF", border: `1px solid ${BORDER}`, borderRadius: "12px" }}
                            labelStyle={{ color: INK }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
 
              <div className="lg:col-span-2">
                <Card className="bg-white rounded-2xl" style={{ borderColor: BORDER }}>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg font-bold" style={{ color: INK }}>
                      Stock Levels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-2 sm:space-y-3 max-h-72 sm:max-h-96 overflow-y-auto">
                      {inventoryStatus.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-xl p-3 sm:p-4 border"
                          style={{ borderColor: BORDER, backgroundColor: SOFT }}
                        >
                          <div className="flex items-start justify-between mb-1.5 sm:mb-2 gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate" style={{ color: INK }}>
                                {item.name}
                              </p>
                              <p className="text-xs sm:text-sm" style={{ color: MUTE }}>
                                {item.category}
                              </p>
                            </div>
                            <span className="font-bold text-sm sm:text-base whitespace-nowrap" style={{ color: ACCENT }}>
                              {item.stockAmount} units
                            </span>
                          </div>
                          <div className="w-full rounded-full h-1.5" style={{ backgroundColor: BORDER }}>
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${Math.min((item.stockAmount / 100) * 100, 100)}%`,
                                backgroundColor: ACCENT,
                              }}
                            />
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