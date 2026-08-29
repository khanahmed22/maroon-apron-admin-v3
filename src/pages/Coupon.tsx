import { useState } from "react";
import {  useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus,Loader2 } from "lucide-react";


interface RestProps {
  restId: string | null;
}

interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  minOrder: string; // Decimal fields come back from Prisma as strings
  expiry: string;
  maxUses: number;
  maxUsesPerUser: number;
  usedCount: number;
  isActive: boolean;
  userId: string | null;
  restId: string;
}


interface CouponFormState {
  code: string;
  discountPercentage: string;
  minOrder: string;
  expiry: string;
  maxUses: string;
  maxUsesPerUser: string;
}

const EMPTY_FORM: CouponFormState = {
  code: "",
  discountPercentage: "",
  minOrder: "",
  expiry: "",
  maxUses: "",
  maxUsesPerUser: "",
};

export default function Coupon({ restId }: RestProps) {
  const queryClient = useQueryClient();
  const MUTE = "#6B7280"
  const ACCENT = "#D6293F"
  const INK = "#171717"



  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async (): Promise<Coupon[]> => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/coupons/${restId}/view`,
      { credentials: "include" }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch coupons");
    }

    return res.json();
  };

  const { data: couponQuery, isPending } = useQuery({
    queryKey: ["coupons", restId],
    queryFn: fetchCoupons,
    enabled: !!restId,
    staleTime: 5 * 60 * 1000,

  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/coupons/${restId}/add`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: form.code.toUpperCase(),
            discountPercentage: Number(form.discountPercentage),
            minOrder: form.minOrder ? Number(form.minOrder) : 0,
            expiry: form.expiry,
            maxUses: form.maxUses ? Number(form.maxUses) : 1,
            maxUsesPerUser: form.maxUsesPerUser
              ? Number(form.maxUsesPerUser)
              : 1,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create coupon");
      } else {
        toast.success("Coupon created successfully");
        queryClient.invalidateQueries({ queryKey: ["coupons", restId] });
        setForm(EMPTY_FORM);
      }
    } catch {
      toast.error("Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupM = async (id: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/coupons/${restId}/delete`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete coupon");
      } else {
        toast.success("Coupon deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["coupons", restId] });
      }
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading Coupons…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-5  sm:p-6">
      <div className="max-w-7xl mx-auto">
         <h1 className="text-3xl max-md:text-xl font-extrabold mb-6" style={{ color: INK }}>
        Coupons
      </h1>
        <div className="grid lg:grid-cols-3 gap-8 max-md:gap-4">
          {/* Create Form */}
          <div className="lg:col-span-1">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-md p-6 border border-slate-200 sticky top-6"
            >
              <h2 className="text-2xl max-md:text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-red-600" />
                Create Coupon
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Coupon Code
                  </label>
                  <Input
                    name="code"
                    placeholder="e.g., SAVE20"
                    value={form.code}
                    onChange={handleChange}
                    required
                    className="uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Percentage e.g 20%
                  </label>
                  <Input
                    name="discountPercentage"
                    type="number"
                    placeholder="e.g., 20"
                    value={form.discountPercentage}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Order (Optional) e.g: 500
                  </label>
                  <Input
                    name="minOrder"
                    type="number"
                    placeholder="e.g., 500"
                    value={form.minOrder}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expiry Date & Time
                  </label>
                  <Input
  name="expiry"
  type="datetime-local"
  value={form.expiry}
  min={new Date().toISOString().slice(0, 16)}
  onChange={handleChange}
  required
/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    How many Customers can use it e.g: 100
                  </label>
                  <Input
                    name="maxUses"
                    type="number"
                    placeholder="e.g 100 Customers"
                    value={form.maxUses}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Max Uses Per Customer e.g: 1
                  </label>
                  <Input
                    name="maxUsesPerUser"
                    type="number"
                    placeholder="e.g 1 per Customer"
                    value={form.maxUsesPerUser}
                    onChange={handleChange}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-red-600  hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>

          {/* Coupons Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl max-md:text-lg font-bold text-slate-900 mb-6">
              Active Coupons
            </h2>

            {!isPending && couponQuery?.length === 0 && (
              <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
                <p className="text-slate-600 text-lg">
                  No coupons yet. Create your first one!
                </p>
              </div>
            )}

            <div className="grid gap-6 max-md:place-content-center">
              {couponQuery?.map((c) => {
                const isExpired = new Date(c.expiry) < new Date();

                return (
                  <div
                    key={c.id}
                    className=" relative bg-gradient-to-r from-red-500 to-red-600 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-full max-md:w-[260px]"
                  >
                    {/* Perforated left edge */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 opacity-40"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.5) 8px, rgba(255,255,255,0.5) 10px)",
                      }}
                    ></div>

                    <div className="flex items-center justify-between p-6 pl-8 gap-6 max-md:flex-col max-md:text-center max-md:p-4">
                      {/* Left Section */}
                      <div className="flex items-center gap-8  max-md:flex-col max-md:gap-3 max-md:w-full">
                        <div>
                          <p className="text-white text-xs font-semibold opacity-80 mb-1">
                            COUPON CODE
                          </p>
                          <p className="text-white text-3xl max-md:text-2xl font-black tracking-wider">
                            {c.code}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="h-20 w-1 bg-white opacity-20 max-md:hidden"></div>

                        <div>
                          <p className="text-white text-xs font-semibold opacity-80 mb-1">
                            SAVE
                          </p>
                          <p className="text-white text-4xl max-md:text-3xl font-black">
                            {c.discountPercentage}%
                          </p>

                          {Number(c.minOrder) > 0 && (
                            <p className="text-white text-xs opacity-80 mt-1">
                              Min: Rs. {c.minOrder}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="text-right max-md:text-center max-md:w-full">
                        <p className="text-white text-xs opacity-80 mb-1">
                          EXPIRES
                        </p>
                        <p
                          className={`text-sm font-semibold mb-3 ${
                            isExpired ? "text-red-200" : "text-white"
                          }`}
                        >
                          {new Date(c.expiry).toLocaleDateString()}
                        </p>

                        <button
                          onClick={() => deleteCoupM(c.id)}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded transition-all mx-auto"
                          title="Delete coupon"
                        >
                          <Trash2 color="red" />
                        </button>
                      </div>
                    </div>

                    {/* Expired Badge */}
                    {isExpired && (
                      <div className="absolute top-2 right-2 bg-red-900 bg-opacity-70 text-white text-xs font-bold px-3 py-1 rounded-full">
                        EXPIRED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}