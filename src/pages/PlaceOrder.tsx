import { useState } from "react";
import { useCart } from "../zustand/cartStore.ts";
import { v4 as uuidv4 } from "uuid";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Plus, Minus, Trash2, ShoppingBag, Store, Truck, Package ,Loader2} from "lucide-react"
import { UserAuth } from "../context/AuthContext.tsx";
interface VariantProps {
  id: string;
  variantName: string;
  variantPrice: number;
  variantId: number;
}
interface InventProps {
  id: string;
  name: string;
  price: number;
  variants: VariantProps[];
  imageUrl: string;
  stockAmount:number
}

interface CustomerProps {
  orderNumber: string;
  custName: string;
  custEmail: string;
  custPhone: string;
  custAddress: string;
  recieveMethod: string;
  status: string;
  createdAt: Date;
  
  orderTotal: number;
  
}

interface RestResponse{
  restId:string | null,
  restName:string | null
}
interface Selection {
  variantId?: string;
  quantity: number;
}

export default function PlaceOrder({ restId ,restName}:RestResponse) {
  const { cart, addCart, clearCart, deleteCart } = useCart();
const [selections, setSelections] = useState<Record<string, Selection>>({});

const {subdomain} = UserAuth()
 
  function generateOrderNumber(): number {
    return Date.now();
  }
  const getSelection = (itemId: string): Selection =>
  selections[itemId] ?? { quantity: 1 };

const setItemVariant = (itemId: string, variantId: string) =>
  setSelections((prev) => ({
    ...prev,
    [itemId]: {
      ...getSelection(itemId),
      variantId,
    },
  }));

const setItemQuantity = (
  itemId: string,
  quantity: number,
  stockAmount: number
) =>
  setSelections((prev) => ({
    ...prev,
    [itemId]: {
      ...getSelection(itemId),
      quantity: Math.min(Math.max(1, quantity), stockAmount),
    },
  }));

  const subtotal = cart.reduce((prev, item) => prev + item.price, 0);
  const [custDetails, setCustDetails] = useState<CustomerProps>({
    orderNumber: String(generateOrderNumber()),
    custName: "",
    custEmail: "",
    custPhone: "",
    custAddress: "",
    recieveMethod: "",
    status: "pending",
    createdAt: new Date(),
  
    orderTotal: 0,
    
  });

  const fetchInventory = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory/${subdomain}`, {
      credentials: "include",
    });

    const result = await res.json()
    return result?.data
  };

  const { data: InventQuery = [], isPending } = useQuery<InventProps[]>({
    queryKey: ["inventoryforOrder"],
    queryFn: fetchInventory,
    staleTime: 5 * 60 * 1000, //5min
    enabled:!!subdomain
  });

  const placeOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !custDetails.custName ||
      !custDetails.custEmail ||
      !custDetails.custPhone ||
      !custDetails.recieveMethod
    ) {
      return toast.error("Fill all fields");
    }
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        custDetails: {
          ...custDetails,
          orderTotal: subtotal,
          restId,
          restName
        },
        cart,
      }),
    });
    clearCart();
    return res.json();
  };

  const { mutate: placeOrderM } = useMutation({
    mutationKey: ["place-order"],
    mutationFn: placeOrder,
    onSuccess: () => {
      toast.success("Order Placed");
    },
  });

  function generateUUID(): string {
    return uuidv4();
  }

  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

 if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading Place Order…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: SOFT }}>
      <h1 className="text-3xl font-extrabold mb-6" style={{ color: INK }}>
        Place Order
      </h1>
 
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* ================= MENU ================= */}
        <section>
          {InventQuery?.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {InventQuery?.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl border overflow-hidden flex flex-col"
                  style={{ borderColor: BORDER }}
                >
                  <img
                    src={f.imageUrl || "https://placehold.co/300x300"}
                    alt={f.name}
                    className="w-full h-40 object-cover"
                  />
 
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex flex-col items-start justify-between gap-2 mb-2">
                      <span className="text-lg font-bold" style={{ color: INK }}>
                        {f.name}
                      </span>
                      <span className="text-lg font-bold shrink-0" style={{ color: ACCENT }}>
                        Rs. {f.price}
                      </span>
                      <p className="text-sm mt-2" style={{ color: MUTE }}>
  Stock: {f.stockAmount}
</p>
                    </div>
 
                    <div className="mb-3">
                      {f.variants?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {f.variants.map((v) => (
                            <label
                              key={v.id}
                              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border cursor-pointer"
                              style={
  getSelection(f.id).variantId === v.id
    ? { backgroundColor: SOFT, borderColor: ACCENT, color: ACCENT }
    : { borderColor: BORDER, color: MUTE }
}
                            >
                              <input
                                type="radio"
                                value={f.id}
                                name={f.id}
                               checked={getSelection(f.id).variantId === v.id}
onChange={() => setItemVariant(f.id, v.id)}
                                className="sr-only"
                              />
                              {v.variantName} · Rs. {v.variantPrice}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
 
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <button
  onClick={() =>
    setItemQuantity(
      f.id,
      getSelection(f.id).quantity - 1,
      f.stockAmount
    )
  }
>
                        <Minus className="w-4 h-4" />
                      </button>
 
                      <span className="text-base font-semibold w-5 text-center" style={{ color: INK }}>
                        {getSelection(f.id).quantity}
                      </span>
 
                      <button
  disabled={getSelection(f.id).quantity >= f.stockAmount}
  onClick={() =>
    setItemQuantity(
      f.id,
      getSelection(f.id).quantity + 1,
      f.stockAmount
    )
  }
  className="w-8 h-8 flex items-center justify-center rounded-full border disabled:opacity-40 disabled:cursor-not-allowed"
  style={{ borderColor: BORDER, color: MUTE }}
>
  <Plus className="w-4 h-4" />
</button>
                    </div>
 
                    <button
  disabled={f.stockAmount === 0}
  onClick={() => {
    const selection = getSelection(f.id);

    const selectedVariant = f.variants.find(
      (v) => v.id === selection.variantId
    );

    addCart({
      id: generateUUID(),
      dbId: f.id,
      name: f.name,
      price:
        (selectedVariant?.variantPrice ?? f.price) *
        selection.quantity,
      quantity: selection.quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.variantName,
      variantPrice: selectedVariant?.variantPrice,
    });

    setItemQuantity(f.id, 1, f.stockAmount);
  }}
  className="w-full text-base font-semibold text-white rounded-full py-2 px-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
  style={{
    backgroundColor: f.stockAmount === 0 ? "#9CA3AF" : ACCENT,
  }}
>
  {f.stockAmount === 0 ? "Out of Stock" : "Add to Cart"}
</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="bg-white rounded-2xl border flex flex-col items-center justify-center gap-2 py-20 text-center"
              style={{ borderColor: BORDER, color: MUTE }}
            >
              <Package className="w-10 h-10" style={{ color: BORDER }} />
              <p className="text-lg font-semibold" style={{ color: INK }}>
                Nothing in inventory
              </p>
            </div>
          )}
        </section>
 
        {/* ================= CART + CUSTOMER DETAILS ================= */}
        <section className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="text-lg font-bold" style={{ color: INK }}>
                Cart Details
              </h2>
            </div>
 
            <p className="text-base mb-4" style={{ color: MUTE }}>
              Items in Cart: <span style={{ color: INK }}>{cart?.length}</span>
            </p>
 
            <button
              className="mb-4 text-base font-semibold px-4 py-2 rounded-full border"
              style={{ borderColor: BORDER, color: INK }}
              onClick={() => clearCart()}
            >
              Clear Cart
            </button>
 
            {cart?.length > 0 ? (
              <div className="space-y-3">
                {cart?.map((c) => {
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border p-3"
                      style={{ borderColor: BORDER }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-base" style={{ color: INK }}>
                          {c.name} x {c.quantity}
                        </span>
                        <span className="font-semibold text-base shrink-0" style={{ color: INK }}>
                          Rs. {c.price}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm" style={{ color: MUTE }}>
                          {c?.variantName} {c?.variantPrice ? `· Rs. ${c.variantPrice}` : ""}
                        </span>
                        <button onClick={() => deleteCart(c.id)} aria-label={`Remove ${c.name}`}>
                          <Trash2 className="w-4 h-4" style={{ color: MUTE }} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-base text-center py-6" style={{ color: MUTE }}>
                nothing in cart
              </p>
            )}
 
            <div
              className="flex items-center justify-between mt-4 pt-4 border-t text-lg font-bold"
              style={{ borderColor: BORDER, color: INK }}
            >
              <span>Subtotal</span>
              <span>Rs. {subtotal || 0}</span>
            </div>
          </div>
 
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: BORDER }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: INK }}>
              Customer Details
            </h2>
 
            <form onSubmit={placeOrderM} className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-semibold" style={{ color: INK }}>
                  Name
                </label>
                <Input
                  type="text"
                  value={custDetails.custName}
                  className="h-11 rounded-xl text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCustDetails({ ...custDetails, custName: e.target.value })
                  }}
                  required
                />
              </div>
 
              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-semibold" style={{ color: INK }}>
                  Email
                </label>
                <Input
                  type="email"
                  value={custDetails.custEmail}
                  className="h-11 rounded-xl text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCustDetails({ ...custDetails, custEmail: e.target.value })
                  }}
                  required
                />
              </div>
 
              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-semibold" style={{ color: INK }}>
                  Phone
                </label>
                <Input
                  value={custDetails.custPhone}
                  className="h-11 rounded-xl text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCustDetails({
                      ...custDetails,
                      custPhone: e.target.value,
                    })
                  }}
                  type="number"
                  required
                />
              </div>
 
              <div className="flex flex-col gap-y-1.5">
                <label className="text-sm font-semibold" style={{ color: INK }}>
                  Receive Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors"
                    style={
                      custDetails.recieveMethod === "pickup"
                        ? { backgroundColor: SOFT, borderColor: ACCENT }
                        : { borderColor: BORDER }
                    }
                  >
                    <input
                      type="radio"
                      name="receiveMethod"
                      value="pickup"
                      checked={custDetails.recieveMethod === "pickup"}
                      onChange={(e) =>
                        setCustDetails({
                          ...custDetails,
                          recieveMethod: e.target.value,
                        })
                      }
                      className="sr-only"
                    />
                    <Store
                      className="w-[18px] h-[18px]"
                      style={{ color: custDetails.recieveMethod === "pickup" ? ACCENT : MUTE }}
                    />
                    <span
                      className="text-base font-medium"
                      style={{ color: custDetails.recieveMethod === "pickup" ? ACCENT : INK }}
                    >
                      Pickup
                    </span>
                  </label>
 
                  <label
                    className="flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors"
                    style={
                      custDetails.recieveMethod === "delivery"
                        ? { backgroundColor: SOFT, borderColor: ACCENT }
                        : { borderColor: BORDER }
                    }
                  >
                    <input
                      type="radio"
                      name="receiveMethod"
                      value="delivery"
                      checked={custDetails.recieveMethod === "delivery"}
                      onChange={(e) =>
                        setCustDetails({
                          ...custDetails,
                          recieveMethod: e.target.value,
                        })
                      }
                      className="sr-only"
                    />
                    <Truck
                      className="w-[18px] h-[18px]"
                      style={{ color: custDetails.recieveMethod === "delivery" ? ACCENT : MUTE }}
                    />
                    <span
                      className="text-base font-medium"
                      style={{ color: custDetails.recieveMethod === "delivery" ? ACCENT : INK }}
                    >
                      Delivery
                    </span>
                  </label>
                </div>
              </div>
 
              {custDetails.recieveMethod === "delivery" && (
                <div className="flex flex-col gap-y-1.5">
                  <label className="text-sm font-semibold" style={{ color: INK }}>
                    Address
                  </label>
                  <Input
                    value={custDetails.custAddress}
                    onChange={(e) =>
                      setCustDetails({
                        ...custDetails,
                        custAddress: e.target.value,
                      })
                    }
                    type="text"
                    placeholder="e.g: C-423, Block 1, Gulshan"
                    className="h-11 rounded-xl text-base"
                    style={{ borderColor: BORDER }}
                    required
                  />
                </div>
              )}
 
              <Button
                className="h-11 rounded-xl text-base font-semibold text-white mt-1"
                style={{ backgroundColor: ACCENT }}
              >
                Place Order
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
