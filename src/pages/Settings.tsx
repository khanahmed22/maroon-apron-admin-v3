import { useQuery } from "@tanstack/react-query"
import { UserAuth } from "../context/AuthContext"
import { Input } from "../components/ui/input"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "../components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { Label } from "../components/ui/label"
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Tag,
  FileText,
  ImagePlus,
  Loader2,
  Store,
  Globe,
  Lock,
} from "lucide-react"

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"

interface UploadResponse {
  imageUrl: string
  publicId: string
}
interface RestListProps {
  id?: string
  restName: string
  restPhone: number
  restEmail: string
  restAddress: string
  restLogo: string
  restBanner: string
  restInstagram: string
  restFB: string
  metaTitle: string
  metaDesc: string
  logoId: string
  bannerId: string
  customDomain: string
}
interface RestResponse {
  getRest: RestListProps
}

function FieldLabel({
  icon,
  children,
}: {
  icon: any
  children: React.ReactNode
}) {
  return (
    <Label className="flex items-center gap-2 text-sm font-semibold">
      {typeof icon === "string" ? (
        <img src={icon} className="w-4 h-4" />
      ) : (
        (() => {
          const Icon = icon
          return <Icon className="w-4 h-4" style={{ color: ACCENT }} />
        })()
      )}

      {children}
    </Label>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any
  label: string
  value?: string | number
}) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-t first:border-t-0"
      style={{ borderColor: BORDER }}
    >
      {typeof icon === "string" ? (
        <img
          src={icon}
          alt={label}
          className="w-[18px] h-[18px] mt-0.5 shrink-0"
        />
      ) : (
        (() => {
          const Icon = icon
          return (
            <Icon
              className="w-[18px] h-[18px] mt-0.5 shrink-0"
              style={{ color: ACCENT }}
            />
          )
        })()
      )}

      <div>
        <p className="text-sm font-medium" style={{ color: MUTE }}>
          {label}
        </p>
        <p className="text-base" style={{ color: value ? INK : MUTE }}>
          {value || "Not set"}
        </p>
      </div>
    </div>
  )
}

export default function Settings({ restId }: { restId: string | null }) {
  const queryClient = useQueryClient()

  const getPaymentStatus = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/paddle/account`, {
      credentials: "include",
    })
    if (!res.ok) {
      throw new Error("Failed to fetch account")
    }
    return res.json()
  }

  const { data: merchantStatus } = useQuery({
    queryKey: ["account"],
    queryFn: getPaymentStatus,
    refetchOnWindowFocus: false,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [updateRest, setUpdateRest] = useState<RestListProps>({
    restName: "",
    restPhone: 0,
    restEmail: "",
    restAddress: "",
    restLogo: "",
    restBanner: "",
    restInstagram: "",
    restFB: "",
    metaTitle: "",
    metaDesc: "",
    logoId: "",
    bannerId: "",
    customDomain: "",
  })
  const { session, subdomain } = UserAuth()

  // Free plan merchants can't set a custom domain — treat a missing plan
  // the same as "free" so the field stays locked until we actually know
  // the merchant is on a paid plan.
  const isFreePlan = !merchantStatus?.plan || merchantStatus.plan === "free"

  // A custom domain must be the merchant's subdomain plus a TLD, e.g.
  // subdomain "pizzatown" only allows "pizzatown.com", "pizzatown.lol", etc.
  // — never an unrelated domain or a different prefix.
  const isValidCustomDomain = (domain: string, sub?: string) => {
    if (!domain || !sub) return false
    const value = domain.trim().toLowerCase()
    const prefix = `${sub.toLowerCase()}.`
    if (!value.startsWith(prefix)) return false
    const suffix = value.slice(prefix.length)
    // suffix must look like a real domain tail: letters/numbers/hyphens,
    // one or more dot-separated labels (e.g. "com", "co.uk", "lol")
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(suffix)
  }

  const customDomainError =
    !isFreePlan && updateRest.customDomain && !isValidCustomDomain(updateRest.customDomain, subdomain)
      ? `Must be your subdomain (${subdomain}) followed by a domain ending, e.g. ${subdomain}.com`
      : null

  const fetchRestDetails = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/restDetails/merchant`, {
        credentials: "include",
      })
      return res.json()
    } catch (err) {
      console.log(err)
    }
  }

  const { data: restDetails, isPending } = useQuery<RestResponse>({
    queryKey: ["restDetails", restId],
    queryFn: fetchRestDetails,
    enabled: !!session?.id,
    staleTime: 5 * 60 * 1000,
  })

  const [editMode, setEditMode] = useState(false)

  const openEdit = () => {
    if (!restDetails?.getRest) return

    setUpdateRest({
      id: restDetails.getRest.id,
      restName: restDetails.getRest.restName,
      restPhone: restDetails.getRest.restPhone ?? 0,
      restEmail: restDetails.getRest.restEmail ?? "",
      restAddress: restDetails.getRest.restAddress ?? "",
      restLogo: restDetails.getRest.restLogo ?? "",
      restBanner: restDetails.getRest.restBanner ?? "",
      restInstagram: restDetails.getRest.restInstagram ?? "",
      restFB: restDetails.getRest.restFB ?? "",
      metaTitle: restDetails.getRest.metaTitle ?? "",
      metaDesc: restDetails.getRest.metaDesc ?? "",
      logoId: restDetails.getRest.logoId ?? "",
      bannerId: restDetails.getRest.bannerId ?? "",
      customDomain: restDetails.getRest.customDomain ?? "",
    })

    setEditMode(true)
  }

  const uploadImage = async (file: File, folder: string): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("folder", folder)

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/assets/upload`, {
      method: "POST",
      body: formData,
    })
    return res.json()
  }

  const updateRestDetails = async ({ id }: { id: string | undefined }) => {
    try {
      let restLogo = updateRest.restLogo
      let restBanner = updateRest.restBanner
      let logoId = updateRest.logoId
      let bannerId = updateRest.bannerId

      if (logoFile) {
        const uploadedLogo = await uploadImage(logoFile, "restaurant/logos")
        restLogo = uploadedLogo.imageUrl
        logoId = uploadedLogo.publicId
      }

      if (bannerFile) {
        const uploadedBanner = await uploadImage(bannerFile, "restaurant/banners")
        restBanner = uploadedBanner.imageUrl
        bannerId = uploadedBanner.publicId
      }

      // Belt-and-braces: never send a custom domain change for a free-plan
      // merchant, or one that doesn't match their subdomain, even if the
      // disabled/validated input were somehow bypassed client-side.
      const customDomain =
        isFreePlan || !isValidCustomDomain(updateRest.customDomain, subdomain)
          ? restDetails?.getRest?.customDomain ?? ""
          : updateRest.customDomain

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...updateRest,
          restLogo,
          restBanner,
          logoId,
          bannerId,
          customDomain,
        }),
      })

      setEditMode(false)
      return await res.json()
    } catch (err) {
      console.log(err)
    }
  }

  const { mutate: changeNameM } = useMutation({
    mutationKey: ["changeNameM"],
    mutationFn: updateRestDetails,
    onSuccess: () => {
      toast.success("Details Updated")
      queryClient.invalidateQueries({ queryKey: ["restDetails"] })
    },
  })

  if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading settings…</p>
      </div>
    )
  }

  // Instant preview for a newly picked file, falling back to the saved URL
  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : updateRest.restLogo
  const bannerPreview = bannerFile ? URL.createObjectURL(bannerFile) : updateRest.restBanner

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: SOFT }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-extrabold" style={{ color: INK }}>
            Settings
          </h1>
          {!editMode && (
            <Button
              onClick={openEdit}
              className="rounded-xl gap-2 text-base text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>

        {/* ================= PROFILE HEADER ================= */}
        <div
          className="bg-white rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: BORDER }}
        >
          <div className="h-32 sm:h-40" style={{ backgroundColor: SOFT }}>
            {restDetails?.getRest?.restBanner ? (
              <img
                src={restDetails.getRest.restBanner}
                alt="Restaurant banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: MUTE }}>
                <Store className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
            <div
              className="w-20 h-20 rounded-2xl border-4 border-white bg-white overflow-hidden shrink-0"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              {restDetails?.getRest?.restLogo ? (
                <img
                  src={restDetails.getRest.restLogo}
                  alt="Restaurant logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: MUTE, backgroundColor: SOFT }}>
                  <Store className="w-8 h-8" />
                </div>
              )}
            </div>
            <p className="text-2xl font-extrabold pb-1" style={{ color: INK }}>
              {restDetails?.getRest?.restName || "Your Restaurant"}
            </p>
          </div>
        </div>

        {!editMode ? (
          /* ================= VIEW MODE ================= */
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: BORDER }}>
            <InfoRow icon={Phone} label="Phone" value={restDetails?.getRest?.restPhone} />
            <InfoRow icon={Mail} label="Email" value={restDetails?.getRest?.restEmail} />
            <InfoRow icon={MapPin} label="Address" value={restDetails?.getRest?.restAddress} />
            <InfoRow icon='/instagram.svg' label="Instagram" value={restDetails?.getRest?.restInstagram} />
            <InfoRow icon='/facebook.svg' label="Facebook" value={restDetails?.getRest?.restFB} />
            <InfoRow icon={Tag} label="Meta Title" value={restDetails?.getRest?.metaTitle} />
            <InfoRow icon={FileText} label="Meta Description" value={restDetails?.getRest?.metaDesc} />
            <InfoRow icon={Globe} label="Custom Domain" value={restDetails?.getRest?.customDomain} />
          </div>
        ) : (
          /* ================= EDIT MODE ================= */
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: BORDER }}>
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold mb-4" style={{ color: INK }}>
                  Restaurant Info
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={Store}>Name</FieldLabel>
                    <Input
                      value={updateRest.restName}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restName: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={Phone}>Phone</FieldLabel>
                    <Input
                      type="number"
                      placeholder="Phone"
                      value={updateRest.restPhone}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restPhone: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={Mail}>Email</FieldLabel>
                    <Input
                      placeholder="Email"
                      value={updateRest.restEmail}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={MapPin}>Address</FieldLabel>
                    <Input
                      placeholder="Address"
                      value={updateRest.restAddress}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restAddress: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel icon={isFreePlan ? Lock : Globe}>Custom Domain</FieldLabel>
                      {isFreePlan && (
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: SOFT, color: ACCENT }}
                        >
                          Pro plan required
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder={
                        isFreePlan
                          ? "Upgrade to Pro to set a custom domain"
                          : subdomain
                          ? `${subdomain}.com`
                          : "yoursubdomain.com"
                      }
                      value={updateRest.customDomain}
                      disabled={isFreePlan}
                      className="h-11 rounded-xl text-base disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: customDomainError ? "#DC2626" : BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, customDomain: e.target.value })
                      }
                    />
                    {!isFreePlan && (
                      <p className="text-xs" style={{ color: customDomainError ? "#DC2626" : MUTE }}>
                        {customDomainError ??
                          `Must start with your subdomain - e.g. ${subdomain}.com, ${subdomain}.lol`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold mb-4" style={{ color: INK }}>
                  Social Links
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon='/instagram.svg'>Instagram</FieldLabel>
                    <Input
                      placeholder="Instagram"
                      value={updateRest.restInstagram}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restInstagram: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon='/facebook.svg'>Facebook</FieldLabel>
                    <Input
                      placeholder="Facebook"
                      value={updateRest.restFB}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restFB: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold mb-4" style={{ color: INK }}>
                  SEO
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={Tag}>Meta Title</FieldLabel>
                    <Input
                      placeholder="Meta Title"
                      value={updateRest.metaTitle}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, metaTitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={FileText}>Meta Description</FieldLabel>
                    <Input
                      placeholder="Meta Description"
                      value={updateRest.metaDesc}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, metaDesc: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold mb-4" style={{ color: INK }}>
                  Images
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-2">
                    <FieldLabel icon={ImagePlus}>Restaurant Logo</FieldLabel>
                    <label
                      className="flex items-center gap-2 h-11 rounded-xl border border-dashed px-4 text-base cursor-pointer"
                      style={{ borderColor: BORDER, color: MUTE }}
                    >
                      <ImagePlus className="w-[18px] h-[18px]" />
                      Choose a logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        className="w-24 h-24 object-cover rounded-xl border"
                        style={{ borderColor: BORDER }}
                        alt="Logo preview"
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-y-2">
                    <FieldLabel icon={ImagePlus}>Restaurant Banner</FieldLabel>
                    <label
                      className="flex items-center gap-2 h-11 rounded-xl border border-dashed px-4 text-base cursor-pointer"
                      style={{ borderColor: BORDER, color: MUTE }}
                    >
                      <ImagePlus className="w-[18px] h-[18px]" />
                      Choose a banner
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {bannerPreview && (
                      <img
                        src={bannerPreview}
                        className="w-full h-28 object-cover rounded-xl border"
                        style={{ borderColor: BORDER }}
                        alt="Banner preview"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl text-base"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl text-base text-white disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                  disabled={!!customDomainError}
                  onClick={() => {
                    if (customDomainError) {
                      toast.error(customDomainError)
                      return
                    }
                    changeNameM({ id: restDetails?.getRest?.id })
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}