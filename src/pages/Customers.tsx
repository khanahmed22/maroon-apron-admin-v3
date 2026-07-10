import { useQuery } from "@tanstack/react-query"
import { UserAuth } from "../context/AuthContext"
import { Loader2, Users, Mail } from "lucide-react"

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

const AVATAR_TINTS = [
  { bg: "#FFF3E8", fg: "#C2600A" },
  { bg: "#EFF6FF", fg: "#2563EB" },
  { bg: "#F3EEFF", fg: "#7C3AED" },
  { bg: "#ECFDF5", fg: "#059669" },
  { bg: "#FBF7F6", fg: ACCENT },
]

interface RestResponse {
  restId: string | null
}
interface CustomerDetails {
  email: string
  name: string
}

export default function Customers({ restId }: RestResponse) {
  const { subdomain } = UserAuth()

  const getCustomers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/customers/${subdomain}`)
      return res.json()
    } catch (err) {
      console.log(err)
    }
  }

  const { data: custQuery = [], isPending } = useQuery<CustomerDetails[]>({
    queryKey: ["custData", restId],
    queryFn: getCustomers,
    enabled: !!restId,
    staleTime: 5 * 60 * 1000,
  })

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-base font-medium">Loading customers…</p>
      </div>
    )
  }

  console.log(subdomain)

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: SOFT }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6" style={{ color: ACCENT }} />
          <h1 className="text-3xl font-extrabold" style={{ color: INK }}>
            Your Customers
          </h1>
        </div>

        {custQuery?.length > 0 ? (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
            {custQuery?.map((c, i) => {
              const tint = AVATAR_TINTS[i % AVATAR_TINTS.length]
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 border-t first:border-t-0"
                  style={{ borderColor: BORDER }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0"
                    style={{ backgroundColor: tint.bg, color: tint.fg }}
                  >
                    {c.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-base truncate" style={{ color: INK }}>
                      {c.name}
                    </p>
                    <p
                      className="flex items-center gap-1.5 text-sm truncate"
                      style={{ color: MUTE }}
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {c.email}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl border flex flex-col items-center justify-center gap-2 py-20 text-center"
            style={{ borderColor: BORDER, color: MUTE }}
          >
            <Users className="w-10 h-10" style={{ color: BORDER }} />
            <p className="text-lg font-semibold" style={{ color: INK }}>
              No customers yet
            </p>
          </div>
        )}
      </div>
    </div>
  )
}