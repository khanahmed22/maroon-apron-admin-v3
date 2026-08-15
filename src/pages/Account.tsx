import { useNavigate } from "react-router"
import { UserAuth } from "../context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { initPaddle } from "../lib/paddle"
import { toast } from "sonner"
import { useState } from "react"
import {
  Mail,
  LogOut,
  Crown,
  Loader2,
  CreditCard,
} from "lucide-react"

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

export default function Account() {
  const navigate = useNavigate()
  const { session, checkAuth } = UserAuth()
  const [loading, setLoading] = useState(false)

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
      `${import.meta.env.VITE_BACKEND_URL}/paddle/account`,
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
    if (!merchantStatus?.subscription_id) {
      toast.error("No active subscription")
      return
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/paddle/create-paddle-link`,
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

  const handleChangePlan = () => {
    if (merchantStatus?.plan === "free") {
      handlePaddleCheckout()
      return
    }

    handleManageSubscription()
  }

  const isPro = merchantStatus?.plan === "pro"

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
        </div>

      </div>
    </div>
  )
}