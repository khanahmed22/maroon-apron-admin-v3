
import { useQuery,useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Button } from "../components/ui/button";
import jsPDF from "jspdf";
import { Search, RefreshCw, Printer, Eye, Receipt, Store, Truck ,Loader2} from "lucide-react"

interface CartItem {
  id: string;
  name: string;
  price: number;
  variantId?: string;
  variantName?: string;
  variantPrice?: number;
  quantity?:number
}
interface OrderProps{
  id: string ,
  orderNumber: string,
  custName :string,
  custEmail: string,
  custPhone: number,
  custAddress :string,
  orderDetails: CartItem[],
  recieveMethod :string,
  status: string,
  createdAt: string,
  orderTotal:number,
  deliveryArea:string,
  deliveryFee:string,
  discountAmount: String,
  isPreOrder:boolean,
  scheduledDate: string,
  scheduledWindow: string,

  
}

interface InvoiceItem {
  name: string;
  quantity?: number;
  price?: number;
  variantPrice?: number;
  
  variantName?: string;
}

export default function Orders({restId}:{restId:string | null}){

  const queryClient = useQueryClient()
  
  const [statusTab,setStatusTab] = useState<string>("all")
  const [search,setSearch] = useState<string>("")
  const fetchOrders = async()=>{
    try{
     
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders/${restId}`)
      return res.json()
      
    }
    catch(err){
      console.log(err)
    }
  }

  const {data:orderQuery=[],isPending,refetch} = useQuery<OrderProps[]>({
    queryKey: ['orderData',restId],
    queryFn: fetchOrders,
      staleTime: 5 * 60 * 1000, 
      enabled: !!restId

    
  })

  const handleStatusChange = async ({
  id,
  status,
}: {
  id: string;
  status: string;
}) => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials:'include',
    body: JSON.stringify({ id, status }),
  });

  if (!res.ok) throw new Error("Failed to update order");

  return res.json();
};
 const { mutate: updateStatusM } = useMutation({
  mutationKey: ["updateStatusM"],
  mutationFn: handleStatusChange,
  onSuccess: (_, variables) => {
    toast.success(`Order ${variables.status}`);
    queryClient.invalidateQueries({queryKey:['orderData',restId]})
  },
  onError: ()=>toast.error('Failed to update Order Status')
});

function formatDate(date: Date | string): string {
  const d = new Date(date);

  return d.toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  
}

const filterOrders = orderQuery?.filter((o) => {
  const matchStatus = statusTab === "all" || o.status === statusTab
  const matchSearch = o.orderNumber.toString().includes(search)

  return matchStatus && matchSearch
})



//print receipt

const handlePrint = async (orderNumber: string) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/order-placed/${orderNumber}`
    );

    if (!res.ok) {
      toast.error("Unable to fetch receipt");
      return;
    }

    const receipt = await res.json();

    const doc = new jsPDF({
      unit: "mm",
      format: [58, 200],
    });

    let y = 10;

    doc.setFont("courier", "bold");
    doc.setFontSize(10);

    // Header
    doc.text(receipt.restName || "Restaurant", 29, y, {
      align: "center",
    });

    y += 6;

    doc.setFont("courier", "normal");
    doc.text(`Invoice: ${receipt.orderNumber}`, 29, y, {
      align: "center",
    });

    y += 4;

    doc.text(
      `Date: ${new Date(receipt.createdAt).toLocaleDateString()}`,
      29,
      y,
      {
        align: "center",
      }
    );

    y += 6;

    doc.text("----------------------------", 29, y, {
      align: "center",
    });

    y += 5;

    doc.setFont("courier", "bold");
    doc.text("Your Order", 29, y, {
      align: "center",
    });

    y += 6;

    doc.setFont("courier", "normal");
    doc.text("----------------------------", 29, y, {
      align: "center",
    });

    y += 5;

    const items:InvoiceItem[] =
      typeof receipt.orderDetails === "string"
        ? JSON.parse(receipt.orderDetails)
        : receipt.orderDetails ?? [];

    items.forEach((item) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.variantPrice ?? item.price ?? 0;
      const total = unitPrice * quantity;

      // Item Name
      doc.setFont("courier", "bold");
      doc.text(String(item.name), 5, y);
      y += 4;

      doc.setFont("courier", "normal");

      // Variant
      if (item.variantName) {
        doc.text(`Variant: ${item.variantName}`, 5, y);
        y += 4;
      }

      // Price
      doc.text(`Price: ${unitPrice}`, 5, y);
      y += 4;

      // Quantity
      doc.text(`Qty: ${quantity}`, 5, y);
      y += 4;

      // Total
      doc.text(`Total: ${total}`, 5, y);
      y += 5;

      doc.text("----------------------------", 29, y, {
        align: "center",
      });

      y += 5;
    });

    // Grand Total
    doc.setFont("courier", "bold");
    doc.text("Grand Total", 5, y);

    y += 5;

    doc.setFont("courier", "normal");
    doc.text(String(receipt.orderTotal), 5, y);

    y += 8;

    doc.text("----------------------------", 29, y, {
      align: "center",
    });

    y += 5;

    doc.text("Thank you for your order!", 29, y, {
      align: "center",
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);

    const win = window.open(url);

    if (win) {
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to print receipt");
  }
};
const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"
 
const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#FEF3C7", fg: "#92400E" },
  confirmed: { bg: "#DCFCE7", fg: "#166534" },
  cancelled: { bg: "#FEE2E2", fg: "#991B1B" },
  delivered: { bg:"#DCFCE7",fg:"#166534"},
  pickedup :{ bg: "#EDE9FE", fg: "#6D28D9" },
}
function formatPreorderDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}



if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading Orders…</p>
      </div>
    )
  }

  function OrderDetailsDialog({ o }: { o: OrderProps }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-base font-medium hover:underline"
          style={{ color: ACCENT }}
        >
          <Eye className="w-4.5 h-4.5" />
          View
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Receipt className="w-5 h-5" style={{ color: ACCENT }} />
            Order #{o.orderNumber}
          </DialogTitle>
          <DialogDescription className="text-base">
            Placed {formatDate(o.createdAt)}
          </DialogDescription>
        </DialogHeader>
        {o?.isPreOrder && <div>
          <p>Scheduled Date: {formatPreorderDate(o?.scheduledDate)}</p>
          <p>Scheduled Window: {o?.scheduledWindow}</p></div>}
 
        <div className="space-y-2.5">
          {o.orderDetails.map((c: CartItem, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-xl border p-3.5"
              style={{ borderColor: BORDER }}
            >
              <div className="min-w-0">
                <p className="font-medium text-base truncate" style={{ color: INK }}>
                  {c.name}
                </p>
                {c.variantName && (
                  <span
                    className="inline-block mt-1 text-sm font-medium px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: SOFT, color: ACCENT }}
                  >
                    {c.variantName}
                  </span>
                )}
              </div>
              <span className="font-semibold text-base shrink-0" style={{ color: INK }}>
                Qty. {c.quantity}
              </span>
              <span className="font-semibold text-base shrink-0" style={{ color: INK }}>
                Rs. {c.price}
              </span>

            </div>
          ))}
        </div>
        <div>
          {o?.deliveryFee && <div className="flex justify-between items-center font-semibold text-sm p-2">
            <span>Delivery Fee</span>
            <span>Rs. {o?.deliveryFee || 0}</span>
            </div>}
        </div>
 
        <div
          className="flex items-center justify-between mt-3 pt-3 border-t text-lg font-bold"
          style={{ borderColor: BORDER, color: INK }}
        >
          <span>Grand Total</span>
          <span>Rs. {o?.orderTotal || 0}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
 
function StatusSelect({ o }: { o: OrderProps }) {
  const statusStyle = STATUS_STYLES[o.status] ?? { bg: SOFT, fg: MUTE }
  return (
    <select
      value={o.status}
      onChange={(e) =>
        updateStatusM({
          id: o.id,
          status: e.target.value,
        })
      }
      className="text-sm font-semibold capitalize rounded-full px-3.5 py-2 border-0 outline-none cursor-pointer"
      style={{ backgroundColor: statusStyle.bg, color: statusStyle.fg }}
    >
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
      <option value="cancelled">Cancelled</option>
      <option value="delivered">Delivered</option>
      <option value="pickedup">Picked Up</option>
    </select>
  )
}
 
function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full capitalize"
      style={{ backgroundColor: SOFT, color: MUTE }}
    >
      {method === "delivery" ? (
        <Truck className="w-4 h-4" />
      ) : (
        <Store className="w-4 h-4" />
      )}
      {method}
    </span>
  )
}
  
  return (
    <div className="p-4 sm:p-6" style={{ backgroundColor: SOFT, minHeight: "100vh" }}>
      <h1 className="text-3xl max-md:text-xl font-extrabold mb-6" style={{ color: INK }}>
        Orders
      </h1>
 
      {/* ================= TOOLBAR ================= */}
      <div className="flex flex-col gap-4 mb-6">
  {/* Top Row */}
  <div className="flex flex-col sm:flex-row gap-3">
    <div className="relative flex-1">
      <Search
        className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2"
        style={{ color: MUTE }}
      />
      <Input
        placeholder="Search order no."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-11 h-11 rounded-xl bg-white text-base"
        style={{ borderColor: BORDER }}
      />
    </div>

    <Button
      variant="outline"
      onClick={() => refetch()}
      className="rounded-xl gap-2 bg-white h-11 text-base px-5 shrink-0"
    >
      <RefreshCw className="w-[18px] h-[18px]" />
      Reload
    </Button>
  </div>

  {/* Tabs */}
  <Tabs
    value={statusTab}
    onValueChange={setStatusTab}
    className="w-full "
  >
    <TabsList
      className="  w-fit gap-2 grid grid-cols-6 max-md:grid-cols-3 justify-start mb-11"
      style={{ borderColor: BORDER }}
    >
      {["all", "pending", "confirmed", "cancelled", "delivered", "pickedup"].map(
        (s) => (
          <TabsTrigger
            key={s}
            value={s}
            className="rounded-lg capitalize text-sm sm:text-base font-medium px-4 py-2.5 shrink-0 data-[state=active]:text-white"
            style={
              statusTab === s
                ? { backgroundColor: ACCENT }
                : { color: MUTE }
            }
          >
            {s}
          </TabsTrigger>
        )
      )}
    </TabsList>
  </Tabs>
</div>
 
      {/* ================= MOBILE: STACKED CARDS ================= */}
      <div className="md:hidden space-y-4">
        {filterOrders?.length > 0 ? (
          filterOrders?.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-2xl border p-4"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-lg" style={{ color: INK }}>
                    #{o.orderNumber}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: MUTE }}>
                    {formatDate(o.createdAt)}
                  </p>
                </div>
                <StatusSelect o={o} />
              </div>
 
              <div className="mb-3">
                <p className="font-medium text-base" style={{ color: INK }}>Customer Name: {o.custName}</p>
                <p className="text-sm mt-0.5" style={{ color: MUTE }}>Customer Phone: {o.custPhone}</p>
                <p className="text-sm" style={{ color: MUTE }}>Customer Email: {o.custEmail}</p>
                {o.custAddress && (
                  <p className="text-sm" style={{ color: MUTE }}>Delivery Address: {o.custAddress}</p>
                )}
                {o.deliveryArea && (
                  <p className="text-sm" style={{ color: MUTE }}>Delivery Area: {o.deliveryArea}</p>
                )}
                {o.deliveryFee && (
                  <p className="text-sm" style={{ color: MUTE }}>Delivery Fee: Rs.{o.deliveryFee}</p>
                )}
                
              </div>
 
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <MethodBadge method={o.recieveMethod} />
                
                <div className="flex items-center gap-4">
                  <OrderDetailsDialog o={o} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrint(o.orderNumber)}
                    className="rounded-lg gap-1.5 text-base"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="bg-white rounded-2xl border p-10 text-center text-base"
            style={{ borderColor: BORDER, color: MUTE }}
          >
            No orders here
          </div>
        )}
      </div>
 
      {/* ================= DESKTOP: TABLE ================= */}
      <div
        className="hidden md:block bg-white rounded-2xl border overflow-hidden overflow-x-auto"
        style={{ borderColor: BORDER }}
      >
        <table className="w-full text-base min-w-[900px]">
          <thead>
            <tr style={{ backgroundColor: SOFT }}>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Order</th>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Placed At</th>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Customer</th>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Details</th>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Method</th>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Status</th>
              <th className="p-4 text-left font-semibold" style={{ color: MUTE }}>Print</th>
            </tr>
          </thead>
 
          <tbody>
            {filterOrders?.length > 0 ? (
              filterOrders?.map((o) => (
                <tr
                  key={o.id}
                  className="border-t hover:bg-black/[0.015] transition-colors"
                  style={{ borderColor: BORDER }}
                >
                  <td className="p-4 font-semibold" style={{ color: INK }}>
                    #{o.orderNumber}
                  </td>
                  <td className="p-4" style={{ color: MUTE }}>
                    {formatDate(o.createdAt)}
                  </td>
 
                  <td className="p-4">
                    <p className="font-medium" style={{ color: INK }}>{o.custName}</p>
                    <p className="text-sm mt-0.5" style={{ color: MUTE }}>{o.custPhone}</p>
                    <p className="text-sm" style={{ color: MUTE }}>{o.custEmail}</p>
                    {o.custAddress && (
                      <p className="text-sm" style={{ color: MUTE }}>{o.custAddress}</p>
                    )}
                  </td>
 
                  <td className="p-4">
                    <OrderDetailsDialog o={o} />
                  </td>
 
                  <td className="p-4">
                    <MethodBadge method={o.recieveMethod} />
                  </td>
 
                  <td className="p-4">
                    <StatusSelect o={o} />
                  </td>
 
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(o.orderNumber)}
                      className="rounded-lg gap-1.5 text-base"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-10 text-center text-base" style={{ color: MUTE }}>
                  No orders here
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}