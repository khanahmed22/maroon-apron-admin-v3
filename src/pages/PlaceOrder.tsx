import { useState } from "react";
import { useCart } from "../zustand/cartStore.ts";
import { v4 as uuidv4 } from "uuid";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../components/ui/button.tsx";
import { Input } from "../components/ui/input.tsx";
import { Plus, Minus, Trash2, ShoppingBag, Store, Truck, Package, Loader2, Tag, X } from "lucide-react"
import { UserAuth } from "../context/AuthContext.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.tsx";
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
  description?: string;
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
  deliveryArea:string
  deliveryFee:string
  discountAmount: String,
  isPreOrder:boolean,
  scheduledDate: string,
  scheduledWindow: string,
  
}

interface RestResponse{
  restId:string | null,
  restName:string | null,
  
}
interface Selection {
  variantId?: string;
  quantity: number;
}

interface AreaProps {
  areaId: string;
  areaName: string;
  cityName: string;
  deliveryFee: string;
  minOrder: string;
}


interface AppliedCoupon {
  code: string;
  couponId: string;
  discount: number;
}

interface FixRate {
  rate: number,
  fixMode: boolean,
  FixMinOrder: number
}

export default function PlaceOrder({ restId ,restName}:RestResponse) {
  const { cart, addCart, clearCart, deleteCart } = useCart();
const [selections, setSelections] = useState<Record<string, Selection>>({});

const {subdomain,deliveryWindows,pickUpWindows,preOrdersEnabled} = UserAuth()
 
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
    deliveryArea: "",
    deliveryFee:"",
    orderTotal: 0,
    discountAmount: "",
    isPreOrder: false,
    scheduledDate: "",
    scheduledWindow: "",
    
  });

  // ================= ADD TO CART MODAL =================
  const [modalItem, setModalItem] = useState<InventProps | null>(null);
  const [variantError, setVariantError] = useState(false);

  const openItemModal = (item: InventProps) => {
    setModalItem(item);
    setVariantError(false);
  };

  const closeItemModal = () => {
    setModalItem(null);
    setVariantError(false);
  };

  const confirmAddToCart = (item: InventProps) => {
    const selection = getSelection(item.id);

    if (item.variants?.length > 0 && !selection.variantId) {
      setVariantError(true);
      return;
    }

    const selectedVariant = item.variants.find(
      (v) => v.id === selection.variantId
    );

    addCart({
      id: generateUUID(),
      dbId: item.id,
      name: item.name,
      price:
        (selectedVariant?.variantPrice ?? item.price) * selection.quantity,
      quantity: selection.quantity,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.variantName,
      variantPrice: selectedVariant?.variantPrice,
    });

    setItemQuantity(item.id, 1, item.stockAmount);
    toast.success(`${item.name} added to cart`);
    closeItemModal();
  };


  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    if (!trimmedCode) return;

    if (!custDetails.custEmail) {
      toast.error("Enter your email above before applying a coupon");
      return;
    }
    if (!restId || subtotal <= 0) return;

    setApplyingCoupon(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmedCode,
          cartTotal: subtotal,
          userId: custDetails.custEmail,
          restId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid coupon");
        return;
      }

      setAppliedCoupon({
        code: trimmedCode,
        couponId: data.couponId,
        discount: data.discount,
      });
      toast.success(`"${trimmedCode}" applied`);
    } catch {
      toast.error("Failed to apply coupon");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const fetchInventory = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/inventory/${subdomain}`, {
      credentials: "include",
    });

    const result = await res.json()
    return result?.data
  };

  const { data: InventQuery = [], isPending } = useQuery<InventProps[]>({
    queryKey: ["inventory"],
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

    if (custDetails.recieveMethod === "delivery") {
      if (!custDetails.custAddress) {
        return toast.error("Address is required for delivery");
      }
      if (!custDetails.deliveryArea) {
        return toast.error("Please select a delivery area");
      }
      if (belowMinimumOrder) {
        return toast.error(
          fixRateM?.fixMode
            ? `Minimum order is Rs.${minimumOrder}`
            : `Minimum order for ${selectedArea?.areaName} is Rs.${minimumOrder}`
        );
      }
    }

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        custDetails: {
          ...custDetails,
          orderTotal: finalTotal,
          deliveryArea:
            custDetails.recieveMethod === "delivery"
              ? selectedArea?.areaName ?? ""
              : "",
         
          deliveryFee:
            custDetails.recieveMethod === "delivery"
              ? String(deliveryFee)
              : "",
          restId,
          restName
        },
        cart,
        coupon: appliedCoupon
          ? {
              couponId: appliedCoupon.couponId,
              code: appliedCoupon.code,
              discount: appliedCoupon.discount,
            }
          : null,
      }),
    });
    clearCart();
    setAppliedCoupon(null);
    setCouponCode("");
    return res.json();
  };

  const { mutate: placeOrderM } = useMutation({
    mutationKey: ["place-order"],
    mutationFn: placeOrder,
    onSuccess: () => {
      toast.success("Order Placed");
    },
    onError:()=>{
      toast.error('Order could not be placed')
    }
  });

  function generateUUID(): string {
    return uuidv4();
  }

  const fetchDeliveryZones = async (): Promise<AreaProps[]> => {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/area-list/${restId}/view`
      );
  
      if (!res.ok) {
        throw new Error("Failed to fetch delivery zones");
      }
  
      return res.json();
    };
  
    const { data: deliveryList } = useQuery({
      queryKey: ["deliveryZone", restId],
      queryFn: fetchDeliveryZones,
      enabled: !!restId,
    });

 
  const selectedArea = deliveryList?.find(
    (area) => area.areaId === custDetails.deliveryArea
  );

  const fetchFixRate = async()=>{
   try{
     const fixRate = await fetch(`${import.meta.env.VITE_BACKEND_URL}/fix-rate/${restId}/view`)
     const data = await fixRate.json()
     return data
   }
   catch(err){
     console.log(err)
   }
  }

  const {data:fixRateM} = useQuery<FixRate>({
   queryKey:['fixRates', restId],
   queryFn: fetchFixRate,
   enabled:!!restId,
   staleTime: 5 * 60 * 1000, //5min
  })

  // If fix rate mode is enabled, use the flat fixed rate for delivery.
  // Otherwise fall back to the area-based delivery fee.
  const deliveryFee =
    custDetails.recieveMethod === "delivery"
      ? fixRateM?.fixMode
        ? Number(fixRateM?.rate ?? 0)
        : Number(selectedArea?.deliveryFee ?? 0)
      : 0;

  // Same fix-mode-first logic for minimum order: fixed min order takes
  // precedence over the area-based minimum when fix mode is enabled.
  const minimumOrder =
    custDetails.recieveMethod === "delivery"
      ? fixRateM?.fixMode
        ? Number(fixRateM?.FixMinOrder ?? 0)
        : Number(selectedArea?.minOrder ?? 0)
      : 0;

  const discountAmount = appliedCoupon?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  
  const belowMinimumOrder =
    custDetails.recieveMethod === "delivery" &&
    (fixRateM?.fixMode || !!selectedArea) &&
    subtotal < minimumOrder;

  const deliveryAreaMissing =
    custDetails.recieveMethod === "delivery" && !custDetails.deliveryArea;

  const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"
const SUCCESS = "#16A34A"

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
                    src={f.imageUrl || "/cc.jpg"}
                    alt={f.name}
                    className="w-full h-40 object-cover"
                  />
 
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex flex-col items-start justify-between gap-2 mb-2">
                      <span className="text-lg font-bold" style={{ color: INK }}>
                        {f.name}
                      </span>
                      {f.variants?.length > 0 ? (
  <div>
    Starting from Rs.{" "}
    {Math.min(...f.variants.map(v => v.variantPrice))}
  </div>
) : (
  <span
    className="text-lg font-bold shrink-0"
    style={{ color: ACCENT }}
  >
    Rs: {f.price}
  </span>
)}
                      <p className="text-sm mt-2" style={{ color: MUTE }}>
  Stock: {f.stockAmount}
</p>
                    </div>
 
                    <button
  disabled={f.stockAmount === 0}
  onClick={() => openItemModal(f)}
  className="w-full text-base font-semibold text-white rounded-full py-2 px-4 mt-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              onClick={() => {
                clearCart()
                handleRemoveCoupon()
              }}
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

            {/* ================= COUPON CODE ================= */}
            {cart?.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                <label className="text-sm font-semibold flex items-center gap-1.5" style={{ color: INK }}>
                  <Tag className="w-4 h-4" style={{ color: MUTE }} />
                  Coupon Code
                </label>

                {appliedCoupon ? (
                  <div
                    className="flex items-center justify-between mt-1.5 rounded-xl border px-3 py-2.5"
                    style={{ borderColor: ACCENT, backgroundColor: SOFT }}
                  >
                    <span className="text-sm font-semibold" style={{ color: ACCENT }}>
                      {appliedCoupon.code} · Rs. {appliedCoupon.discount} off
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      aria-label="Remove coupon"
                    >
                      <X className="w-4 h-4" style={{ color: MUTE }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE20"
                      className="h-11 rounded-xl text-base uppercase"
                      style={{ borderColor: BORDER }}
                    />
                    <Button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="h-11 rounded-xl text-white shrink-0 disabled:opacity-60"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {applyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>
            )}
 
            <div
              className="flex items-center justify-between mt-4 pt-4 border-t text-base"
              style={{ borderColor: BORDER, color: INK }}
            >
              <span>Subtotal</span>
              <span>Rs. {subtotal || 0}</span>
            </div>

            {custDetails.recieveMethod === "delivery" && (fixRateM?.fixMode || selectedArea) && (
              <div
                className="flex items-center justify-between mt-2 text-base"
                style={{ color: INK }}
              >
                <span>Delivery Fee</span>
                <span>Rs. {deliveryFee}</span>
              </div>
            )}

            {appliedCoupon && (
              <div
                className="flex items-center justify-between mt-2 text-base font-medium"
                style={{ color: SUCCESS }}
              >
                <span>Discount ({appliedCoupon.code})</span>
                <span>- Rs. {appliedCoupon.discount}</span>
              </div>
            )}

            <div
              className="flex items-center justify-between mt-2 pt-2 border-t text-lg font-bold"
              style={{ borderColor: BORDER, color: INK }}
            >
              <span>Final Total</span>
              <span>Rs. {finalTotal || 0}</span>
            </div>

            {belowMinimumOrder && (
              <p className="mt-3 text-sm font-medium" style={{ color: ACCENT }}>
                {fixRateM?.fixMode
                  ? `Minimum order is Rs.${minimumOrder}`
                  : `Minimum order for ${selectedArea?.areaName} is Rs.${minimumOrder}`}
              </p>
            )}
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
                          deliveryArea: "",
                          custAddress: "",
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
  <div className="flex flex-col gap-y-4">
    <div className="flex flex-col gap-y-1.5">
      <label
        className="text-sm font-semibold"
        style={{ color: INK }}
      >
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

    <div className="flex flex-col gap-y-1.5">
      <label
        className="text-sm font-semibold"
        style={{ color: INK }}
      >
        Delivery Area
      </label>

      <Select
        value={custDetails.deliveryArea}
        onValueChange={(value) =>
          setCustDetails({
            ...custDetails,
            deliveryArea: value,
          })
        }
      >
        <SelectTrigger className="w-full h-11 rounded-xl">
          <SelectValue placeholder="Select your delivery area" />
        </SelectTrigger>

        <SelectContent>
          {deliveryList?.map((area) => (
            <SelectItem
              key={area.areaId}
              value={area.areaId}
            >
              {area.areaName} ({area.cityName}) 
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
)}
 {preOrdersEnabled &&
  (custDetails.recieveMethod === "pickup" ||
    custDetails.recieveMethod === "delivery") && (
    <div className="space-y-4 rounded-xl border p-4" style={{ borderColor: BORDER }}>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={custDetails.isPreOrder}
          onChange={(e) =>
            setCustDetails({
              ...custDetails,
              isPreOrder: e.target.checked,
              scheduledDate: "",
              scheduledWindow: "",
            })
          }
        />
        Schedule your Order
      </label>

      {custDetails.isPreOrder && (
        <>
          <Input
            type="date"
            value={custDetails.scheduledDate}
            onChange={(e) =>
              setCustDetails({
                ...custDetails,
                scheduledDate: e.target.value,
              })
            }
          />

          <Select
            value={custDetails.scheduledWindow}
            onValueChange={(value) =>
              setCustDetails({
                ...custDetails,
                scheduledWindow: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  custDetails.recieveMethod === "pickup"
                    ? "Select Pickup Window"
                    : "Select Delivery Window"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {(custDetails.recieveMethod === "pickup"
                ? pickUpWindows
                : deliveryWindows
              )?.map((window) => (
                <SelectItem key={window} value={window}>
                  {window}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  )}
              <Button
                type="submit"
                disabled={deliveryAreaMissing || belowMinimumOrder}
                className="h-11 rounded-xl text-base font-semibold text-white mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: ACCENT }}
              >
                Place Order
              </Button>
            </form>
          </div>
        </section>
      </div>

      {/* ================= ADD TO CART MODAL ================= */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeItemModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={modalItem.imageUrl || "/cc.jpg"}
                alt={modalItem.name}
                className="w-full h-48 object-cover rounded-t-2xl"
              />
              <button
                onClick={closeItemModal}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow"
              >
                <X className="w-4 h-4" style={{ color: INK }} />
              </button>
            </div>

            <div className="p-5">
              <h3 className="text-xl font-bold" style={{ color: INK }}>
                {modalItem.name}
              </h3>

              {modalItem.description && (
                <p className="text-sm mt-1.5" style={{ color: MUTE }}>
                  {modalItem.description}
                </p>
              )}

              <p className="text-sm mt-2" style={{ color: MUTE }}>
                Stock: {modalItem.stockAmount}
              </p>

              {modalItem.variants?.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2" style={{ color: INK }}>
                    Choose an option
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {modalItem.variants.map((v) => (
                      <label
                        key={v.id}
                        className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border cursor-pointer"
                        style={
                          getSelection(modalItem.id).variantId === v.id
                            ? { backgroundColor: SOFT, borderColor: ACCENT, color: ACCENT }
                            : { borderColor: BORDER, color: MUTE }
                        }
                      >
                        <input
                          type="radio"
                          name={`modal-variant-${modalItem.id}`}
                          checked={getSelection(modalItem.id).variantId === v.id}
                          onChange={() => {
                            setItemVariant(modalItem.id, v.id);
                            setVariantError(false);
                          }}
                          className="sr-only"
                        />
                        {v.variantName} · Rs. {v.variantPrice}
                      </label>
                    ))}
                  </div>
                  {variantError && (
                    <p className="text-xs mt-2 font-medium" style={{ color: ACCENT }}>
                      Please select an option to continue
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-bold mt-3" style={{ color: ACCENT }}>
                  Rs. {modalItem.price}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  onClick={() =>
                    setItemQuantity(
                      modalItem.id,
                      getSelection(modalItem.id).quantity - 1,
                      modalItem.stockAmount
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full border"
                  style={{ borderColor: BORDER, color: MUTE }}
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="text-base font-semibold w-5 text-center" style={{ color: INK }}>
                  {getSelection(modalItem.id).quantity}
                </span>

                <button
                  disabled={getSelection(modalItem.id).quantity >= modalItem.stockAmount}
                  onClick={() =>
                    setItemQuantity(
                      modalItem.id,
                      getSelection(modalItem.id).quantity + 1,
                      modalItem.stockAmount
                    )
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: BORDER, color: MUTE }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                disabled={modalItem.stockAmount === 0}
                onClick={() => confirmAddToCart(modalItem)}
                className="w-full text-base font-semibold text-white rounded-full py-2.5 px-4 mt-5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: modalItem.stockAmount === 0 ? "#9CA3AF" : ACCENT,
                }}
              >
                {modalItem.stockAmount === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}