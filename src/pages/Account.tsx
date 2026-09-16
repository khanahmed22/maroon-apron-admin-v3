import { useNavigate } from "react-router"
import { UserAuth } from "../context/AuthContext"
import { useQuery,useMutation } from "@tanstack/react-query"
import { initPaddle } from "../lib/paddle"
import { toast } from "sonner"
import { useState } from "react"
import { Capacitor } from "@capacitor/core"
import { Purchases } from "@revenuecat/purchases-capacitor"
import {
  Mail,
  LogOut,
  Crown,
  Loader2,
  CreditCard,
  Smartphone,
  Globe,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

import { Input } from "../components/ui/input";

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"
const GOOGLE_PLAY_ENTITLEMENT = "maroon_apron_pro"

export default function Account() {
  const navigate = useNavigate()
  const { session, checkAuth } = UserAuth()
  const [loading, setLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const isNative = Capacitor.isNativePlatform() // true inside the Android/iOS Capacitor shell, false on web

  const fetchLogout = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const data = await res.json()
      console.log(data)

      await checkAuth()
      navigate("/login")
    } catch (err) {
      console.log(err)
    }
  }

  const getPaymentStatus = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/account/paddle`,
      {
        credentials: "include",
      }
    )

    if (!res.ok) {
      throw new Error("Failed to fetch account")
    }

    return res.json()
  }

  const { data: merchantStatus, isPending } = useQuery({
    queryKey: ["account"],
    queryFn: getPaymentStatus,
    refetchOnWindowFocus: false,
  })

  const handleManageSubscription = async () => {
    if (!merchantStatus?.paddleSubscription_id) {
      toast.error("No active subscription")
      return
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/account/create-paddle-link`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      if (!res.ok) {
        throw new Error("Failed to create portal")
      }

      const { url } = await res.json()

      window.location.href = url
    } catch (err) {
      console.error(err)
      toast.error("Unable to open subscription manager")
    }
  }

  const handlePaddleCheckout = async () => {
    try {
      setLoading(true)

      const paddle = await initPaddle()

      if (!paddle) {
        toast.error("Failed to initialize Paddle")
        return
      }

      if (!session?.email || !session?.id) {
        toast.error("Please sign in again.")
        return
      }

      paddle.Checkout.open({
        items: [
          {
            priceId: import.meta.env.VITE_PADDLE_PRICE_ID,
            quantity: 1,
          },
        ],
        customer: {
          email: session.email,
        },
        customData: {
          userId: session.id,
        },
      })
    } catch (err) {
      console.error(err)
      toast.error("Unable to start checkout")
    } finally {
      setLoading(false)
    }
  }

  const handleGooglePlayPurchase = async () => {
    try {
      setLoading(true)

      const eligibilityRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/account-google/eligibility`,
        { credentials: "include" }
      )

      const eligibility = await eligibilityRes.json()

      if (!eligibilityRes.ok || !eligibility.eligible) {
        toast.error(eligibility.error || "Unable to subscribe through Google Play")
        return
      }

      const offerings = await Purchases.getOfferings()
      const currentOffering = offerings.current ?? offerings.all["pro_monthly_cat"]

      if (!currentOffering || currentOffering.availablePackages.length === 0) {
        toast.error("No subscription plans available right now")
        return
      }

      await Purchases.purchasePackage({
        aPackage: currentOffering.availablePackages[0],
      })

      // Confirm entitlement immediately instead of waiting on the webhook
      const { customerInfo } = await Purchases.getCustomerInfo()

      if (typeof customerInfo.entitlements.active[GOOGLE_PLAY_ENTITLEMENT] !== "undefined") {
        toast.success("Subscribed! Refreshing your account...")
        await checkAuth()
      } else {
        toast.error("Purchase completed but entitlement not found. Please contact support.")
      }
    } catch (err:any) {
      if (err.userCancelled) return // don't show an error toast on user-cancelled purchase
      console.error(err)
      toast.error("Unable to complete purchase")
    } finally {
      setLoading(false)
    }
  }

  const isPro = merchantStatus?.plan === "pro"

  // A user can access Pro features cross-platform regardless of where they
  // paid — but managing/cancelling the subscription only works on the
  // platform that sold it (Paddle portal vs. Play Store subscriptions page).
  const managementMismatch =
    isPro &&
    ((merchantStatus?.billingProvider === "paddle" && isNative) ||
      (merchantStatus?.billingProvider === "googleplay" && !isNative))

  const handleChangePlan = () => {
    if (merchantStatus?.plan === "free") {
      if (isNative) {
        handleGooglePlayPurchase()
      } else {
        handlePaddleCheckout()
      }
      return
    }

    if (managementMismatch) return // shouldn't be reachable — button is swapped out below

    // Already subscribed — route to the right management surface
    if (merchantStatus?.billingProvider === "googleplay") {
      // Google Play subscriptions can't be managed via a custom portal —
      // deep-link to the Play Store's own subscription management page
      window.location.href = "https://play.google.com/store/account/subscriptions"
      return
    }

    handleManageSubscription() // Paddle portal
  }

  // delete account 

  const deleteAccount = async () => {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delete-account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
  userConfirm: "DELETE",
}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete account");
  }
  

  return data;
};

const deleteAccountMutation = useMutation({
  mutationFn: deleteAccount,

  onSuccess: async () => {
    toast.success("Account deleted successfully");

    await checkAuth()
    navigate("/login")
  },

  onError: (error) => {
    toast.error(error.message);
  },
});

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: ACCENT }}
        />

        <p className="text-sm font-medium">
          Loading Account…
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen px-4 py-6 sm:p-6"
      style={{ backgroundColor: SOFT }}
    >
      <div className="max-w-md w-full mx-auto">

        {/* ================= HEADER ================= */}
        <div
          className="bg-white rounded-2xl border p-5 sm:p-6 mb-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: SOFT,
                  color: ACCENT,
                }}
              >
                <Mail className="w-5 h-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-medium"
                  style={{ color: MUTE }}
                >
                  Signed in as
                </p>

                <p
                  className="font-bold text-sm sm:text-base truncate"
                  style={{ color: INK }}
                >
                  {session?.email}
                </p>
              </div>
            </div>

            <button
              onClick={fetchLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border hover:bg-black/5 transition-colors"
              style={{
                borderColor: BORDER,
                color: INK,
              }}
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>

        {/* ================= ACCOUNT DETAILS ================= */}
        <div
          className="bg-white rounded-2xl border p-5 sm:p-6 mb-6"
          style={{ borderColor: BORDER }}
        >
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: INK }}
          >
            Account
          </h2>

          <div className="space-y-4">

            {/* Email */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span
                className="text-sm font-medium"
                style={{ color: MUTE }}
              >
                Email
              </span>

              <span
                className="text-sm font-semibold break-all sm:text-right"
                style={{ color: INK }}
              >
                {session?.email}
              </span>
            </div>

            {/* Plan */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: MUTE }}
              >
                Plan
              </span>

              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full capitalize w-fit"
                style={
                  isPro
                    ? {
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                      }
                    : {
                        backgroundColor: SOFT,
                        color: MUTE,
                      }
                }
              >
                {isPro && (
                  <Crown className="w-3.5 h-3.5" />
                )}

                {merchantStatus?.plan ?? "free"}
              </span>
            </div>

          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="space-y-3">
          {managementMismatch ? (
            <div
              className="w-full rounded-xl border p-4 flex items-start gap-3"
              style={{ borderColor: BORDER, backgroundColor: "white" }}
            >
              <div className="shrink-0 mt-0.5" style={{ color: ACCENT }}>
                {isNative ? <Globe className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <p className="text-sm" style={{ color: INK }}>
                Your subscription was purchased through{" "}
                <span className="font-semibold">
                  {merchantStatus?.billingProvider === "paddle" ? "the web app" : "the Android app"}
                </span>
                . To manage or cancel it, please open Maroon Apron{" "}
                {merchantStatus?.billingProvider === "paddle" ? "in your browser" : "on your Android device"}.
              </p>
            </div>
          ) : (
            <button
              onClick={handleChangePlan}
              disabled={loading || isPending}
              className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white rounded-xl py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="w-4.5 h-4.5" />
                  {isPro
                    ? "Manage Subscription"
                    : "Upgrade to Pro"}
                </>
              )}
            </button>
          )}
        </div>

      </div>

      <div
  className="max-w-md w-full mx-auto rounded-2xl border bg-white p-5 sm:p-6 mt-44"
  style={{ borderColor: "#FECACA" }}
>
  <div className="mb-4">
    <h2 className="text-lg font-bold text-red-600">
      Danger Zone
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      Deleting your account is permanent and cannot be undone.
    </p>
  </div>

  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button
        className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
      >
        Delete Account
      </button>
    </AlertDialogTrigger>

    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Are you absolutely sure?
        </AlertDialogTitle>

        <AlertDialogDescription>
          This will permanently delete your account and all
          associated data. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-2 py-2">
        <p className="text-sm font-medium">
          Type <span className="font-bold">DELETE</span> to confirm.
        </p>

        <Input
          value={deleteConfirmation}
          onChange={(e) => setDeleteConfirmation(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel
          onClick={() => setDeleteConfirmation("")}
        >
          Cancel
        </AlertDialogCancel>

        <AlertDialogAction
          disabled={
            deleteConfirmation !== "DELETE" ||
            deleteAccountMutation.isPending
          }
          onClick={() => deleteAccountMutation.mutate()}
          className="bg-red-600 hover:bg-red-700"
        >
          {deleteAccountMutation.isPending
            ? "Deleting..."
            : "Permanently Delete Account"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>


    </div>
  )
}