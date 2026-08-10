import { useQuery } from "@tanstack/react-query"
import { UserAuth } from "../context/AuthContext"
import { Input } from "../components/ui/input"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "../components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { Label } from "../components/ui/label"
import { useEffect } from "react"
import type { LucideIcon } from "lucide-react";
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
  Palette,
  PartyPopper,
  Clock,
  X,
  BadgeCheck
} from "lucide-react"
import { THEME_NAMES, DEFAULT_THEME } from "../lib/themes"
import type { ThemeName } from "../lib/themes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import Map from "./Map"

import * as Sentry from "@sentry/react";

const ACCENT = "#D6293F"
const INK = "#171717"
const MUTE = "#6B7280"
const BORDER = "#E7E5E4"
const SOFT = "#FBF7F6"
const THEME_META: Record<ThemeName, { label: string; swatch: string }> = {
  red: { label: "Red", swatch: "oklch(0.637 0.237 25.331)" },
  pink: { label: "Pink", swatch: "oklch(0.637 0.237 350)" },
  blue: { label: "Blue", swatch: "oklch(0.637 0.237 255)" },
  green: { label: "Green", swatch: "oklch(0.637 0.237 150)" },
  purple: { label: "Purple", swatch: "oklch(0.637 0.237 300)" },
}

interface UploadResponse {
  imageUrl: string
  publicId: string
}
interface RestListProps {
  id?: string
  restName: string
  restPhone: string
  restEmail: string
  restAnnouncement:string,
  restAddress: string
  restLogo: string
  restBanner: string
  restInstagram: string
  restFB: string
  metaTitle: string
  metaDesc: string
  logoId: string
  bannerId: string
  customDomain: string,
  restTheme: string
  restSite?:string
  preOrdersEnabled:boolean
  preoOrderMinHours:number
  preOrderMaxDays:number
  pickUpWindows:string[]
  deliveryWindows:string[]
  lat:number,
  long:number,
  crimsonBranding:boolean
}
interface RestResponse {
  getRest: RestListProps
}


interface PreorderPayload {
  preOrdersEnabled?: boolean
  preoOrderMinHours?: number
  preOrderMaxDays?: number
  pickUpWindows?: string[]
  deliveryWindows?: string[]
}

function FieldLabel({
  icon,
  children,
}: {
  icon: LucideIcon | string
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
  icon: LucideIcon | string
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
          className="w-4.5 h-4.5 mt-0.5 shrink-0"
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
   const [preOrdersEnabled, setPreOrderEnabled] = useState<boolean>(true);
   const [preoOrderMinHours, setPreOrderMinHours] = useState<number>(2);
   const [preOrderMaxDays, setPreOrderMaxDays] = useState<number>(7);

  const [deliveryWindows, setDeliveryWindows] = useState<string[]>([]);
  const [pickUpWindows, setPickupWindows] = useState<string[]>([]);

  const [newWindow, setNewWindow] = useState("");

  const [newPickupWindow, setNewPickupWindow] = useState("");
  const [crimsonBranding,setCrimsonBranding] = useState(true)
  
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
    restPhone: "",
    restEmail: "",
    restAnnouncement:"",
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
    restTheme:"",
    preOrdersEnabled: true,
    preoOrderMinHours: 2,
    preOrderMaxDays: 7,
    pickUpWindows: [],
    deliveryWindows: [],
    lat:0,
    long:0,
    crimsonBranding:true
  })
  const { session, subdomain } = UserAuth()

 
  const isFreePlan = !merchantStatus?.plan || merchantStatus.plan === "free"

  
  const isValidCustomDomain = (domain: string, sub?: string) => {
    if (!domain || !sub) return false
    const value = domain.trim().toLowerCase()
    const prefix = `${sub.toLowerCase()}.`
    if (!value.startsWith(prefix)) return false
    const suffix = value.slice(prefix.length)
   
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

   useEffect(() => {
  if (!restDetails?.getRest) return;

  setPreOrderEnabled(restDetails.getRest.preOrdersEnabled ?? true);
  setPreOrderMinHours(restDetails.getRest.preoOrderMinHours ?? 2);
  setPreOrderMaxDays(restDetails.getRest.preOrderMaxDays ?? 7);

  setDeliveryWindows(restDetails.getRest.deliveryWindows ?? []);
  setPickupWindows(restDetails.getRest.pickUpWindows ?? []);
}, [restDetails]);

  const [editMode, setEditMode] = useState(false)
  const [preorderEditMode, setPreorderEditMode] = useState(false)

  const cancelPreorderEdit = () => {
    if (restDetails?.getRest) {
      setPreOrderEnabled(restDetails.getRest.preOrdersEnabled ?? true)
      setPreOrderMinHours(restDetails.getRest.preoOrderMinHours ?? 2)
      setPreOrderMaxDays(restDetails.getRest.preOrderMaxDays ?? 7)
      setDeliveryWindows(restDetails.getRest.deliveryWindows ?? [])
      setPickupWindows(restDetails.getRest.pickUpWindows ?? [])
    }
    setPreorderEditMode(false)
  }

  const openEdit = () => {
    if (!restDetails?.getRest) return

    setUpdateRest({
      id: restDetails.getRest.id,
      restName: restDetails.getRest.restName,
      restPhone: restDetails.getRest.restPhone ?? "",
      restEmail: restDetails.getRest.restEmail ?? "",
      restAnnouncement: restDetails.getRest.restAnnouncement ?? "",
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
      restTheme: restDetails.getRest.restTheme ?? "",
      preOrdersEnabled: restDetails.getRest.preOrdersEnabled ?? true,
      preoOrderMinHours: restDetails.getRest.preoOrderMinHours ?? 2,
      preOrderMaxDays: restDetails.getRest.preOrderMaxDays ?? 7,
      pickUpWindows: restDetails.getRest.pickUpWindows ?? [],
      deliveryWindows: restDetails.getRest.deliveryWindows ?? [],
      lat:restDetails.getRest.lat ?? 0,
      long:restDetails.getRest.long ?? 0,
      crimsonBranding:restDetails.getRest.crimsonBranding ?? true
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

     
      const customDomain =
        isFreePlan || !isValidCustomDomain(updateRest.customDomain, subdomain)
          ? restDetails?.getRest?.customDomain ?? ""
          : updateRest.customDomain

      
      const { lat: _lat, long: _long, ...restFieldsWithoutLocation } = updateRest

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...restFieldsWithoutLocation,
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

 
  const updatePreorderSettings = async (
    payload: PreorderPayload,
  ): Promise<RestListProps> => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restDetails?.getRest?.id,
        ...payload,
      }),
    })

    if (!res.ok) {
      throw new Error("Failed to update preorder settings")
    }

    return res.json()
  }

  const { mutate: updatePreorderSettingsM, isPending: preorderLoading } = useMutation({
    mutationKey: ["updatePreorderSettingsM"],
    mutationFn: updatePreorderSettings,
    onSuccess: () => {
      toast.success("Preorder settings updated")
      queryClient.invalidateQueries({ queryKey: ["restDetails"] })
    },
    onError: () => {
      toast.error("Failed to update preorder settings")
    },
  })

  //enable disable branding
  
  const enableBranding = async (enabled: boolean) => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: restId,
      crimsonBranding: enabled,
    }),
  });

  return res.json();
};

 const { mutate: enableBrandM } = useMutation({
  mutationKey: ["enableBranding"],
  mutationFn: enableBranding,
  onSuccess: () => {
    toast.success("Branding updated");

    queryClient.invalidateQueries({
      queryKey: ["restDetails"],
    });
  },
  onError: () => {
    toast.error("Branding not updated");
  },
});

 function handleBranding() {
  const newValue = !crimsonBranding;

  setCrimsonBranding(newValue);
  enableBrandM(newValue);
}

  const lat = restDetails?.getRest?.lat || 0
  const long = restDetails?.getRest?.long || 0

  // ================= PICKUP LOCATION (VIEW MODE MAP EDIT) =================
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; long: number } | null>(null)
  const [locationResetToken, setLocationResetToken] = useState(0)

  const updateLocation = async ({ lat, long }: { lat: number; long: number }) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restDetails?.getRest?.id,
        lat,
        long,
      }),
    })

    if (!res.ok) {
      throw new Error("Failed to update location")
    }

    return res.json()
  }

  const { mutate: updateLocationM, isPending: locationSaving } = useMutation({
    mutationKey: ["updateLocationM"],
    mutationFn: updateLocation,
    onSuccess: () => {
      toast.success("Pickup location updated")
      queryClient.invalidateQueries({ queryKey: ["restDetails"] })
      setPendingLocation(null)
    },
    onError: () => {
      toast.error("Failed to update location")
    },
  })

  const cancelLocationEdit = () => {
    setPendingLocation(null)
    setLocationResetToken((t) => t + 1)
  }

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
            <p className="text-2xl max-md:text-lg font-extrabold pb-1" style={{ color: INK }}>
              {restDetails?.getRest?.restName || "Your Restaurant"}
            </p>
            {
              restDetails?.getRest?.restSite && 
              <div className="mb-2 ">
<a
  className="bg-red-500 text-white p-3 rounded-2xl font-bold shadow-lg max-md:text-xs "
  href={restDetails?.getRest?.restSite}
  target="_blank"
  rel="noopener noreferrer"
>
  Visit Store
</a>
            </div>
            }
            
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
            <InfoRow icon={Palette} label="Theme" value={restDetails?.getRest?.restTheme} />
            <InfoRow icon={PartyPopper} label="Announcement" value={restDetails?.getRest?.restAnnouncement} />
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
                    <FieldLabel icon={PartyPopper}>Announcement</FieldLabel>
                    <Input
                      type="text"
                      placeholder="Text here will show on top of store"
                      value={updateRest.restAnnouncement}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({ ...updateRest, restAnnouncement:e.target.value })
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
                        setUpdateRest({ ...updateRest, restPhone:e.target.value })
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
                  <div className="flex flex-col gap-y-1.5">
  <FieldLabel icon={Palette}>Theme</FieldLabel>
  <Select
    value={updateRest.restTheme || DEFAULT_THEME}
    onValueChange={(value) =>
      setUpdateRest({ ...updateRest, restTheme: value as ThemeName })
    }
  >
    <SelectTrigger className="h-11 rounded-xl text-base w-full">
      <SelectValue placeholder="Select a theme" />
    </SelectTrigger>
    <SelectContent>
      {THEME_NAMES.map((theme) => (
        <SelectItem key={theme} value={theme}>
          <span className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
              style={{ backgroundColor: THEME_META[theme].swatch }}
            />
            {THEME_META[theme].label}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
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

        

<div className="bg-white rounded-2xl border p-6 mt-6">
  <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BadgeCheck className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900">
          Crimson Castle Branding
        </h2>
      </div>

      <p className="text-sm text-gray-500">
        {isFreePlan
          ? "Upgrade to Pro to remove the 'Powered by Crimson Castle' footer from your storefront."
          : crimsonBranding
          ? "Your storefront currently displays the 'Powered by Crimson Castle' footer."
          : "The 'Powered by Crimson Castle' footer has been removed from your storefront."}
      </p>
    </div>

    {isFreePlan ? (
      <Button
        disabled
        variant="outline"
        className="rounded-xl"
      >
        Pro Required
      </Button>
    ) : (
      <Button
        onClick={handleBranding}
        className="rounded-xl min-w-40"
        variant={crimsonBranding ? "destructive" : "destructive"}
      >
        {crimsonBranding ? "Remove Branding" : "Enable Branding"}
      </Button>
    )}
  </div>
</div>
        {/* ================= PICKUP LOCATION ================= */}
        <div
          className="bg-white rounded-2xl border p-6 mt-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="text-lg font-bold" style={{ color: INK }}>
                Pickup Location
              </h2>
            </div>
            {pendingLocation && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-8 rounded-lg text-xs px-3"
                  onClick={cancelLocationEdit}
                >
                  Cancel
                </Button>
                <Button
                  disabled={locationSaving}
                  className="h-8 rounded-lg text-xs px-3 text-white disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                  onClick={() => updateLocationM(pendingLocation)}
                >
                  {locationSaving ? "Saving…" : "Save Location"}
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: MUTE }}>
            Click on the map, or drag the pin, to update your pickup location
          </p>

          <Map
            latitude={pendingLocation?.lat ?? lat}
            longitude={pendingLocation?.long ?? long}
            editable
            resetToken={locationResetToken}
            onLocationChange={(newLat, newLong) =>
              setPendingLocation({ lat: newLat, long: newLong })
            }
          />
        </div>

        {/* ================= PREORDER SETTINGS ================= */}
        <div
          className="bg-white rounded-2xl border p-6 mt-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="text-lg font-bold" style={{ color: INK }}>
                Preorder Settings
              </h2>
            </div>
            {!preorderEditMode && (
              <Button
                onClick={() => setPreorderEditMode(true)}
                className="rounded-xl gap-2 text-white"
                style={{ backgroundColor: ACCENT }}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {/* Enable preorders */}
            <div
              className="flex items-center justify-between rounded-xl border p-4"
              style={{ borderColor: BORDER, backgroundColor: SOFT }}
            >
              <div>
                <p className="font-semibold" style={{ color: INK }}>
                  Enable Preorders
                </p>
                <p className="text-xs" style={{ color: MUTE }}>
                  Customers can schedule orders for a later time
                </p>
              </div>
              <Button
                disabled={!preorderEditMode}
                className="rounded-xl text-white disabled:opacity-60"
                style={{ backgroundColor: preOrdersEnabled ? ACCENT : MUTE }}
                onClick={() => setPreOrderEnabled(!preOrdersEnabled)}
              >
                {preOrdersEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {preorderEditMode && preOrdersEnabled && (
              <>
                {/* Minimum notice */}
                <div
                  className="rounded-xl border p-4 space-y-2"
                  style={{ borderColor: BORDER, backgroundColor: SOFT }}
                >
                  <FieldLabel icon={Clock}>Minimum notice (hours)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={preoOrderMinHours}
                    className="h-11 rounded-xl text-base bg-white"
                    style={{ borderColor: BORDER }}
                    onChange={(e) => setPreOrderMinHours(Number(e.target.value))}
                  />
                </div>

                {/* Max days */}
                <div
                  className="rounded-xl border p-4 space-y-2"
                  style={{ borderColor: BORDER, backgroundColor: SOFT }}
                >
                  <FieldLabel icon={Clock}>Max days in advance</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={preOrderMaxDays}
                    className="h-11 rounded-xl text-base bg-white"
                    style={{ borderColor: BORDER }}
                    onChange={(e) => setPreOrderMaxDays(Number(e.target.value))}
                  />
                </div>

                {/* Delivery windows */}
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: BORDER, backgroundColor: SOFT }}
                >
                  <FieldLabel icon={Clock}>Delivery time windows</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      value={newWindow}
                      placeholder="e.g. 7pm - 9pm"
                      className="h-11 rounded-xl text-base bg-white"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => setNewWindow(e.target.value)}
                    />
                    <Button
                      className="rounded-xl text-white shrink-0"
                      style={{ backgroundColor: ACCENT }}
                      onClick={() => {
                        const w = newWindow.trim()
                        if (!w) return
                        setDeliveryWindows([...deliveryWindows, w])
                        setNewWindow("")
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {deliveryWindows.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {deliveryWindows.map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1 rounded-full border bg-white text-sm"
                          style={{ borderColor: BORDER }}
                        >
                          <span>{w}</span>
                          <X
                            className="w-4 h-4 cursor-pointer"
                            style={{ color: ACCENT }}
                            onClick={() => {
                              setDeliveryWindows(deliveryWindows.filter((_, i) => i !== idx))
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: MUTE }}>
                      No windows added yet
                    </p>
                  )}
                </div>

                {/* Pickup windows */}
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: BORDER, backgroundColor: SOFT }}
                >
                  <FieldLabel icon={Clock}>Pickup time windows</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      value={newPickupWindow}
                      placeholder="e.g. 6pm - 8pm"
                      className="h-11 rounded-xl text-base bg-white"
                      style={{ borderColor: BORDER }}
                      onChange={(e) => setNewPickupWindow(e.target.value)}
                    />
                    <Button
                      className="rounded-xl text-white shrink-0"
                      style={{ backgroundColor: ACCENT }}
                      onClick={() => {
                        const w = newPickupWindow.trim()
                        if (!w) return
                        setPickupWindows([...pickUpWindows, w])
                        setNewPickupWindow("")
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {pickUpWindows.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {pickUpWindows.map((w, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1 rounded-full border bg-white text-sm"
                          style={{ borderColor: BORDER }}
                        >
                          <span>{w}</span>
                          <X
                            className="w-4 h-4 cursor-pointer"
                            style={{ color: ACCENT }}
                            onClick={() => {
                              setPickupWindows(pickUpWindows.filter((_, i) => i !== idx))
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: MUTE }}>
                      No windows added yet
                    </p>
                  )}
                </div>
              </>
            )}

            {preorderEditMode && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl text-base"
                  onClick={cancelPreorderEdit}
                >
                  Cancel
                </Button>
                <Button
                  disabled={preorderLoading}
                  className="flex-1 h-11 rounded-xl text-base text-white disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                  onClick={() => {
                    updatePreorderSettingsM({
                      preOrdersEnabled,
                      preoOrderMinHours,
                      preOrderMaxDays,
                      deliveryWindows,
                      pickUpWindows,
                    })
                    setPreorderEditMode(false)
                  }}
                >
                  Save Preorder Settings
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
    </div>
  )
}