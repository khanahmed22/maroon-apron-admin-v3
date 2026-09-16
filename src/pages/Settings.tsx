import { useQuery } from "@tanstack/react-query";
import { UserAuth } from "../context/AuthContext";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "../components/ui/label";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Tag,
  FileText,
  Loader2,
  Store,
  Globe,
  Lock,
  Palette,
  PartyPopper,
  Clock,
  X,
  BadgeCheck,
  HelpCircle,
  ReceiptTextIcon,
  Bike,
  Handbag,
  Search,
  PanelTop,
  GlobeCheckIcon,
  Megaphone,
  Contact,
  MessageCircle,
  DatabaseSearch,
  SunMoon,
} from "lucide-react";
import { THEME_NAMES, DEFAULT_THEME } from "../lib/themes";
import type { ThemeName } from "../lib/themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import Map from "./Map";
import { Bell } from "lucide-react";
import { enableNotifications, disableNotifications, fetchNotificationStatus } from "../lib/firebase";
import { Switch } from "../components/ui/switch";

const CRIMSON_BASE_DOMAIN = "crimsoncastle.shop";

const ACCENT = "#D6293F";
const INK = "#171717";
const MUTE = "#6B7280";
const BORDER = "#E7E5E4";
const SOFT = "#FBF7F6";
const THEME_META: Record<ThemeName, { label: string; swatch: string }> = {
  red: { label: "Red", swatch: "oklch(0.637 0.237 25.331)" },
  pink: { label: "Pink", swatch: "oklch(0.637 0.237 350)" },
  blue: { label: "Blue", swatch: "oklch(0.637 0.237 255)" },
  green: { label: "Green", swatch: "oklch(0.637 0.237 150)" },
  purple: { label: "Purple", swatch: "oklch(0.637 0.237 300)" },
};

interface UploadResponse {
  imageUrl: string;
  publicId: string;
}
interface RestListProps {
  id?: string;
  restName: string;
  restPhone: string;
  restEmail: string;
  restAnnouncement: string;
  restAddress: string;
  restLogo: string;
  restBanner: string;
  restInstagram: string;
  restFB: string;
  metaTitle: string;
  metaDesc: string;
  logoId: string;
  bannerId: string;
  customDomain: string;
  restTheme: string;
  restSite?: string;
  preOrdersEnabled: boolean;
  preOrderMinHours: number;
  preOrderMaxDays: number;
  pickUpWindows: string[];
  deliveryWindows: string[];
  lat: number;
  long: number;
  crimsonBranding: boolean;
  subdomain: string;
  orderingDisabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}
interface RestResponse {
  getRest: RestListProps;
}

interface PreorderPayload {
  preOrdersEnabled?: boolean;
  preOrderMinHours?: number;
  preOrderMaxDays?: number;
  pickUpWindows?: string[];
  deliveryWindows?: string[];
}

function FieldLabel({
  icon,
  children,
}: {
  icon: LucideIcon | string;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex items-center gap-2 text-sm font-semibold">
      {typeof icon === "string" ? (
        <img src={icon} className="w-4 h-4" />
      ) : (
        (() => {
          const Icon = icon;
          return <Icon className="w-4 h-4" style={{ color: ACCENT }} />;
        })()
      )}

      {children}
    </Label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-bold uppercase tracking-wide mt-8 mb-2 px-1"
      style={{ color: MUTE }}
    >
      {children}
    </h3>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: LucideIcon | string;
  label: string;
  value?: string | number;
}) {
  return (
    <div
      className="flex items-start gap-3 py-3 border-t first:border-t-0"
      style={{ borderColor: BORDER }}
    >
      {typeof icon === "string" ? (
        <img src={icon} alt={label} className="w-4.5 h-4.5 mt-0.5 shrink-0" />
      ) : (
        (() => {
          const Icon = icon;
          return (
            <Icon
              className="w-4.5 h-4.5 mt-0.5 shrink-0"
              style={{ color: ACCENT }}
            />
          );
        })()
      )}

      <div>
        <p className="text-sm font-medium" style={{ color: MUTE }}>
          {label}
        </p>
        <p
          className="text-base max-md:text-xs"
          style={{ color: value ? INK : MUTE }}
        >
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
}

function EditToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-8 rounded-lg text-xs px-3 gap-1.5 shrink-0"
    >
      <Pencil className="w-3.5 h-3.5" />
      Edit
    </Button>
  );
}

function SectionSaveRow({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button
        variant="outline"
        className="flex-1 h-10 rounded-xl text-sm"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        disabled={saving}
        className="flex-1 h-10 rounded-xl text-sm text-white disabled:opacity-60"
        style={{ backgroundColor: ACCENT }}
        onClick={onSave}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export default function Settings({ restId }: { restId: string | null }) {
  const [preOrdersEnabled, setPreOrderEnabled] = useState<boolean>(true);
  const [preOrderMinHours, setPreOrderMinHours] = useState<number>(2);
  const [preOrderMaxDays, setPreOrderMaxDays] = useState<number>(7);
  const [preOrderEditMode, setPreOrderEditMode] = useState<boolean>(false);
  const [deliveryWindows, setDeliveryWindows] = useState<string[]>([]);
  const [pickUpWindows, setPickupWindows] = useState<string[]>([]);

  const [newWindow, setNewWindow] = useState("");

  const [newPickupWindow, setNewPickupWindow] = useState<string>("");
  const [crimsonBranding, setCrimsonBranding] = useState<boolean>(true);
  const [orderingDisabled, setOrderingDisabled] = useState<boolean>(false);

  const [pickupLocEditMode, setPickupLocEditMode] = useState<boolean>(false);

  const [deliveryEnabled, setSetDeliveryEnabled] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(false);

  // ================= SETTINGS SEARCH =================
  const [settingsSearch, setSettingsSearch] = useState("");

  const matchesSearch = (keywords: string[]) => {
    const term = settingsSearch.trim().toLowerCase();
    if (!term) return true;
    return keywords.some((k) => k.toLowerCase().includes(term));
  };

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const getPaymentStatus = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/paddle/account`,
      {
        credentials: "include",
      },
    );
    if (!res.ok) {
      throw new Error("Failed to fetch account");
    }
    return res.json();
  };

  const { data: merchantStatus } = useQuery({
    queryKey: ["account"],
    queryFn: getPaymentStatus,
    refetchOnWindowFocus: false,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [updateRest, setUpdateRest] = useState<RestListProps>({
    restName: "",
    restPhone: "",
    restEmail: "",
    restAnnouncement: "",
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
    restTheme: "",
    preOrdersEnabled: true,
    preOrderMinHours: 2,
    preOrderMaxDays: 7,
    pickUpWindows: [],
    deliveryWindows: [],
    lat: 0,
    long: 0,
    crimsonBranding: true,
    subdomain: "",
    orderingDisabled: false,
    pickupEnabled: true,
    deliveryEnabled: true,
  });
  const { session } = UserAuth();

  const isFreePlan = !merchantStatus?.plan || merchantStatus.plan === "free";

 

  const isValidCustomDomain = (domain: string, sub?: string) => {
    if (!domain || !sub) return false;
    const value = domain.trim().toLowerCase();
    const prefix = `${sub.toLowerCase()}.`;
    if (!value.startsWith(prefix)) return false;
    const suffix = value.slice(prefix.length);

    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(
      suffix,
    );
  };

  const fetchRestDetails = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/restDetails/merchant`,
        {
          credentials: "include",
        },
      );
      return res.json();
    } catch (err) {
      console.log(err);
    }
  };

  const { data: restDetails, isPending } = useQuery<RestResponse>({
    queryKey: ["restDetails", restId],
    queryFn: fetchRestDetails,
    enabled: !!session?.id,
    staleTime: 5 * 60 * 1000,
  });

  const lockedSubdomain = restDetails?.getRest?.subdomain;

  const customDomainError =
    !isFreePlan &&
    updateRest.customDomain &&
    !isValidCustomDomain(updateRest.customDomain, lockedSubdomain)
      ? `Must be your subdomain (${lockedSubdomain}) followed by a domain ending, e.g. ${lockedSubdomain}.com`
      : null;

  useEffect(() => {
    if (!restDetails?.getRest) return;

    setPreOrderEnabled(restDetails.getRest.preOrdersEnabled ?? true);
    setPreOrderMinHours(restDetails.getRest.preOrderMinHours ?? 2);
    setPreOrderMaxDays(restDetails.getRest.preOrderMaxDays ?? 7);

    setDeliveryWindows(restDetails.getRest.deliveryWindows ?? []);
    setPickupWindows(restDetails.getRest.pickUpWindows ?? []);
    setCrimsonBranding(restDetails.getRest.crimsonBranding ?? true);
    setOrderingDisabled(restDetails.getRest.orderingDisabled ?? false);
    setPickupEnabled(restDetails.getRest.pickupEnabled ?? true);
    setSetDeliveryEnabled(restDetails.getRest.deliveryEnabled ?? true);
  }, [restDetails]);

  // ================= PER-SECTION EDIT MODE =================

  const [domainEditMode, setDomainEditMode] = useState(false);
  const [announcementEditMode, setAnnouncementEditMode] = useState(false);
  const [contactEditMode, setContactEditMode] = useState(false);
  const [socialsEditMode, setSocialsEditMode] = useState(false);
  const [seoEditMode, setSeoEditMode] = useState(false);
  const [brandingEditMode, setBrandingEditMode] = useState(false);

  const resetPreorderFields = () => {
    if (restDetails?.getRest) {
      setPreOrderMinHours(restDetails.getRest.preOrderMinHours ?? 2);
      setPreOrderMaxDays(restDetails.getRest.preOrderMaxDays ?? 7);
      setDeliveryWindows(restDetails.getRest.deliveryWindows ?? []);
      setPickupWindows(restDetails.getRest.pickUpWindows ?? []);
    }
  };

  const openDomainEdit = () => {
    setUpdateRest((prev) => ({
      ...prev,
      customDomain: restDetails?.getRest?.customDomain ?? "",
    }));
    setDomainEditMode(true);
  };
  const openAnnouncementEdit = () => {
    setUpdateRest((prev) => ({
      ...prev,
      restAnnouncement: restDetails?.getRest?.restAnnouncement ?? "",
    }));
    setAnnouncementEditMode(true);
  };
  const openContactEdit = () => {
    setUpdateRest((prev) => ({
      ...prev,
      restPhone: restDetails?.getRest?.restPhone ?? "",
      restEmail: restDetails?.getRest?.restEmail ?? "",
      restAddress: restDetails?.getRest?.restAddress ?? "",
    }));
    setContactEditMode(true);
  };
  const openSocialsEdit = () => {
    setUpdateRest((prev) => ({
      ...prev,
      restInstagram: restDetails?.getRest?.restInstagram ?? "",
      restFB: restDetails?.getRest?.restFB ?? "",
    }));
    setSocialsEditMode(true);
  };
  const openSeoEdit = () => {
    setUpdateRest((prev) => ({
      ...prev,
      metaTitle: restDetails?.getRest?.metaTitle ?? "",
      metaDesc: restDetails?.getRest?.metaDesc ?? "",
    }));
    setSeoEditMode(true);
  };
  const openBrandingEdit = () => {
    setUpdateRest((prev) => ({
      ...prev,
      restTheme: restDetails?.getRest?.restTheme ?? "",
      restLogo: restDetails?.getRest?.restLogo ?? "",
      restBanner: restDetails?.getRest?.restBanner ?? "",
      logoId: restDetails?.getRest?.logoId ?? "",
      bannerId: restDetails?.getRest?.bannerId ?? "",
    }));
    setLogoFile(null);
    setBannerFile(null);
    setBrandingEditMode(true);
  };

  const uploadImage = async (
    file: File,
    folder: string,
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/assets/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await res.json();
    if (!res.ok) {
      const error = data?.message;
      toast.error(`Error: ${error}`);
      throw new Error(error);
    }
    return data;
  };

  const { mutate: saveLogoM, isPending: logoSaving } = useMutation({
    mutationKey: ["saveLogoM"],
    mutationFn: async (file: File) => {
      const uploaded = await uploadImage(file, "restaurant/logos");
      return savePartialSettings({
        restLogo: uploaded.imageUrl,
        logoId: uploaded.publicId,
      });
    },
    onSuccess: () => {
      toast.success("Logo updated");
      queryClient.invalidateQueries({ queryKey: ["restDetails"] });
      setLogoFile(null);
    },
    onError: () => {
      toast.error("Failed to update logo");
      setLogoFile(null);
    },
  });

  const { mutate: saveBannerM, isPending: bannerSaving } = useMutation({
    mutationKey: ["saveBannerM"],
    mutationFn: async (file: File) => {
      const uploaded = await uploadImage(file, "restaurant/banners");
      return savePartialSettings({
        restBanner: uploaded.imageUrl,
        bannerId: uploaded.publicId,
      });
    },
    onSuccess: () => {
      toast.success("Banner updated");
      queryClient.invalidateQueries({ queryKey: ["restDetails"] });
      setBannerFile(null);
    },
    onError: () => {
      toast.error("Failed to update banner");
      setBannerFile(null);
    },
  });

  const savePartialSettings = async (payload: Record<string, unknown>) => {
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
    });
    if (!res.ok) {
      throw new Error("Failed to update settings");
    }
    return res.json();
  };

  const { mutate: savePartialSettingsM, isPending: partialSaving } =
    useMutation({
      mutationKey: ["savePartialSettingsM"],
      mutationFn: savePartialSettings,
      onSuccess: () => {
        toast.success("Details Updated");
        queryClient.invalidateQueries({ queryKey: ["restDetails"] });
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    });

  const saveDomainSettings = () => {
    if (customDomainError) {
      toast.error(customDomainError);
      return;
    }

    const previousCustomDomain = restDetails?.getRest?.customDomain ?? "";
    const nextCustomDomain =
      !isFreePlan &&
      isValidCustomDomain(updateRest.customDomain, lockedSubdomain)
        ? updateRest.customDomain.trim().toLowerCase()
        : previousCustomDomain;

    savePartialSettingsM(
      { customDomain: nextCustomDomain },
      {
        onSuccess: () => {
          if (nextCustomDomain && nextCustomDomain !== previousCustomDomain) {
            updateNetlifyAliasM({
              oldDomain: previousCustomDomain || undefined,
              newDomain: nextCustomDomain,
            });
          }
          setDomainEditMode(false);
        },
      },
    );
  };

  const saveAnnouncementSettings = () => {
    savePartialSettingsM(
      { restAnnouncement: updateRest.restAnnouncement },
      { onSuccess: () => setAnnouncementEditMode(false) },
    );
  };

  const saveContactSettings = () => {
    savePartialSettingsM(
      {
        restPhone: updateRest.restPhone,
        restEmail: updateRest.restEmail,
        restAddress: updateRest.restAddress,
      },
      { onSuccess: () => setContactEditMode(false) },
    );
  };

  const saveSocialsSettings = () => {
    savePartialSettingsM(
      { restInstagram: updateRest.restInstagram, restFB: updateRest.restFB },
      { onSuccess: () => setSocialsEditMode(false) },
    );
  };

  const saveSeoSettings = () => {
    savePartialSettingsM(
      { metaTitle: updateRest.metaTitle, metaDesc: updateRest.metaDesc },
      { onSuccess: () => setSeoEditMode(false) },
    );
  };

  const updateNetlifyAlias = async ({
    oldDomain,
    newDomain,
  }: {
    oldDomain?: string;
    newDomain: string;
  }) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/netlify/domain-alias`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldDomain,
          newDomain,
        }),
      },
    );

    if (!res.ok) {
      throw new Error("Failed to update domain alias");
    }

    return res.json();
  };

  const { mutate: updateNetlifyAliasM } = useMutation({
    mutationKey: ["updateNetlifyAliasM"],
    mutationFn: updateNetlifyAlias,
    onError: () => {
      toast.error(
        "Saved, but the live domain link couldn't be updated - contact support",
      );
    },
  });

  

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
    });

    if (!res.ok) {
      throw new Error("Failed to update preorder settings");
    }

    return res.json();
  };

  const { mutate: updatePreorderSettingsM, isPending: preorderLoading } =
    useMutation({
      mutationKey: ["updatePreorderSettingsM"],
      mutationFn: updatePreorderSettings,
      onSuccess: () => {
        toast.success("Preorder settings updated");
        queryClient.invalidateQueries({ queryKey: ["restDetails"] });
      },
      onError: () => {
        toast.error("Failed to update preorder settings");
      },
    });

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

    if (!res.ok) {
      throw new Error("Branding not updated");
    }

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

  function handleBranding(checked: boolean) {
    setCrimsonBranding(checked);
    enableBrandM(checked);
  }

  //disable ordering

  const disableOrdering = async (disabled: boolean) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restId,
        orderingDisabled: disabled,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to disable Ordering");
    }

    return res.json();
  };

  const { mutate: disableOrderingM } = useMutation({
    mutationKey: ["disableOrderingM"],
    mutationFn: disableOrdering,
    onSuccess: () => {
      toast.success("Ordering setting updated");

      queryClient.invalidateQueries({
        queryKey: ["restDetails"],
      });
    },
    onError: () => {
      toast.error("Ordering setting was not updated");
    },
  });

  function handleDisableOrdering(checked: boolean) {
    setOrderingDisabled(checked);
    disableOrderingM(checked);
  }

  // enable pickup

  const enablePickup = async (enabled: boolean) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restId,
        pickupEnabled: enabled,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to disable Ordering");
    }

    return res.json();
  };

  const { mutate: enablePickupM } = useMutation({
    mutationKey: ["enablePickupM"],
    mutationFn: enablePickup,
    onSuccess: () => {
      toast.success("Pickup setting updated");

      queryClient.invalidateQueries({
        queryKey: ["restDetails"],
      });
    },
    onError: () => {
      toast.error("Pick Up settting not updated");
    },
  });

  function handlePickupEnable(checked: boolean) {
    setPickupEnabled(checked);
    enablePickupM(checked);
  }

  // enable delivery

  const enableDelivery = async (enabled: boolean) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restId,
        deliveryEnabled: enabled,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update delivery setting");
    }

    return res.json();
  };

  const { mutate: enableDeliveryM } = useMutation({
    mutationKey: ["enableDeliveryM"],
    mutationFn: enableDelivery,
    onSuccess: () => {
      toast.success("Delivery setting updated");

      queryClient.invalidateQueries({
        queryKey: ["restDetails"],
      });
    },
    onError: () => {
      toast.error("Delivery setting not updated");
    },
  });

  function handleDeliveryEnable(checked: boolean) {
    setSetDeliveryEnabled(checked);
    enableDeliveryM(checked);
  }

  //enable preorders

  const enablePreorders = async (enabled: boolean) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: restDetails?.getRest?.id,
        preOrdersEnabled: enabled,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update preorder setting");
    }

    return res.json();
  };

  const { mutate: enablePreordersM } = useMutation({
    mutationKey: ["enablePreordersM"],
    mutationFn: enablePreorders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restDetails"] });
    },
    onError: () => {
      toast.error("Preorder setting not updated");
    },
  });

  function handlePreorderToggle(checked: boolean) {
    setPreOrderEnabled(checked);
    enablePreordersM(checked);
    if (!checked) {
      resetPreorderFields();
    }
  }

  //enable notification

  const { data: notificationsEnabled, isLoading: notifLoading } = useQuery({
    queryKey: ["notificationStatus"],
    queryFn: fetchNotificationStatus,
    enabled: !!session?.id,
    refetchOnWindowFocus: false,
  });

  const [enablingNotifs, setEnablingNotifs] = useState(false);
  const [disablingNotifs, setDisablingNotifs] = useState(false);

  const handleEnableNotifications = async () => {
    setEnablingNotifs(true);
    try {
      const token = await enableNotifications();
      if (token) {
        toast.success("Notifications enabled");
        queryClient.invalidateQueries({ queryKey: ["notificationStatus"] });
      } else {
        toast.error("Notification permission was denied");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to enable notifications");
    } finally {
      setEnablingNotifs(false);
    }
  };

  const handleDisableNotifications = async () => {
    setDisablingNotifs(true);
    try {
      await disableNotifications();
      toast.success("Notifications disabled");
      queryClient.invalidateQueries({ queryKey: ["notificationStatus"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to disable notifications");
    } finally {
      setDisablingNotifs(false);
    }
  };

  const lat = restDetails?.getRest?.lat || 0;
  const long = restDetails?.getRest?.long || 0;

  // ================= PICKUP LOCATION (VIEW MODE MAP EDIT) =================
  const [pendingLocation, setPendingLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);
  const [locationResetToken, setLocationResetToken] = useState(0);

  const updateLocation = async ({
    lat,
    long,
  }: {
    lat: number;
    long: number;
  }) => {
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
    });

    if (!res.ok) {
      throw new Error("Failed to update location");
    }

    return res.json();
  };

  const { mutate: updateLocationM, isPending: locationSaving } = useMutation({
    mutationKey: ["updateLocationM"],
    mutationFn: updateLocation,
    onSuccess: () => {
      toast.success("Pickup location updated");
      queryClient.invalidateQueries({ queryKey: ["restDetails"] });
      setPendingLocation(null);
    },
    onError: () => {
      toast.error("Failed to update location");
    },
  });

  const cancelLocationEdit = () => {
    setPendingLocation(null);
    setLocationResetToken((t) => t + 1);
  };

  function isValidTimeWindow(value: string): boolean {
    const timePattern = /^(\d{1,2})(:\d{2})?\s*(am|pm)?$/i;
    const parts = value.split("-").map((p) => p.trim());

    if (parts.length !== 2) return false;
    const [start, end] = parts;
    if (!start || !end) return false;

    return timePattern.test(start) && timePattern.test(end);
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
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: SOFT }}>
      {/* ================= FIRST-TIME SETUP MODAL ================= */}
      

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1
            className="text-3xl max-md:text-xl font-extrabold"
            style={{ color: INK }}
          >
            Settings
          </h1>
        </div>

        {/* ================= SETTINGS SEARCH ================= */}
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: MUTE }}
          />
          <Input
            value={settingsSearch}
            onChange={(e) => setSettingsSearch(e.target.value)}
            placeholder="Search settings - e.g. delivery, branding, preorder..."
            className="h-11 pl-11 pr-4 rounded-xl bg-white text-base"
            style={{ borderColor: BORDER }}
          />
        </div>

        {/* ================= PROFILE HEADER ================= */}
        <div
          className="bg-white rounded-2xl border overflow-hidden mb-6"
          style={{ borderColor: BORDER }}
        >
          <div
            className="relative h-32 sm:h-40"
            style={{ backgroundColor: SOFT }}
          >
            {(
              bannerFile
                ? URL.createObjectURL(bannerFile)
                : restDetails?.getRest?.restBanner
            ) ? (
              <img
                src={
                  bannerFile
                    ? URL.createObjectURL(bannerFile)
                    : restDetails!.getRest!.restBanner
                }
                alt="Restaurant banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ color: MUTE }}
              >
                <Store className="w-8 h-8" />
              </div>
            )}
            <label
              className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer border-2 border-white disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
            >
              {bannerSaving ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Pencil className="w-4 h-4 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={bannerSaving}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setBannerFile(f);
                    saveBannerM(f);
                  }
                }}
              />
            </label>
          </div>
          <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white bg-white overflow-hidden"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
              >
                {(
                  logoFile
                    ? URL.createObjectURL(logoFile)
                    : restDetails?.getRest?.restLogo
                ) ? (
                  <img
                    src={
                      logoFile
                        ? URL.createObjectURL(logoFile)
                        : restDetails!.getRest!.restLogo
                    }
                    alt="Restaurant logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: MUTE, backgroundColor: SOFT }}
                  >
                    <Store className="w-8 h-8" />
                  </div>
                )}
              </div>
              <label
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer border-2 border-white disabled:opacity-60"
                style={{ backgroundColor: ACCENT }}
              >
                {logoSaving ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Pencil className="w-3.5 h-3.5 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={logoSaving}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setLogoFile(f);
                      saveLogoM(f);
                    }
                  }}
                />
              </label>
            </div>
            <p
              className="text-2xl max-md:text-lg font-extrabold pb-1"
              style={{ color: INK }}
            >
              {restDetails?.getRest?.restName || "Your Restaurant"}
            </p>
            {restDetails?.getRest?.restSite && (
              <div className="mb-2">
  <a
    className="bg-red-500 text-white p-3 rounded-2xl font-bold shadow-lg max-md:text-xs"
    href={restDetails?.getRest?.restSite}
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="max-md:hidden">Visit Store</span>
    <span className="md:hidden">Store</span>
  </a>
</div>
            )}
          </div>
        </div>

        {/* ================= DOMAIN MANAGEMENT ================= */}
        {matchesSearch([
          "domain",
          "domain management",
          "store url",
          "custom domain",
          "subdomain",
        ]) && (
          <div
            className="bg-white rounded-2xl border p-6 mb-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" style={{ color: ACCENT }} />
                <h2 className="text-lg font-bold" style={{ color: INK }}>
                  Domain Management
                </h2>
              </div>
              {!domainEditMode && <EditToggleButton onClick={openDomainEdit} />}
            </div>
            {!domainEditMode ? (
              <>
                <InfoRow
                  icon={PanelTop}
                  label="Store URL"
                  value={
                    restDetails?.getRest?.subdomain
                      ? `${restDetails.getRest.subdomain}.${CRIMSON_BASE_DOMAIN}`
                      : undefined
                  }
                />
                <InfoRow
                  icon={GlobeCheckIcon}
                  label="Custom Domain"
                  value={restDetails?.getRest?.customDomain}
                />
              </>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-y-1.5">
                  <FieldLabel icon={Store}>Restaurant Name</FieldLabel>
                  <Input
                    value={restDetails?.getRest?.restName ?? ""}
                    disabled
                    className="h-11 rounded-xl text-base disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ borderColor: BORDER }}
                  />
                  <p className="text-xs" style={{ color: MUTE }}>
                    Store URL:{" "}
                    <span className="font-semibold" style={{ color: INK }}>
                      {lockedSubdomain}.{CRIMSON_BASE_DOMAIN}
                    </span>{" "}
                    - locked, <a href="/support">contact support</a> to change
                  </p>
                </div>

                <div className="flex flex-col gap-y-1.5">
                  <div className="flex items-center justify-between">
                    <FieldLabel icon={isFreePlan ? Lock : Globe}>
                      Custom Domain
                    </FieldLabel>
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
                        : lockedSubdomain
                          ? `${lockedSubdomain}.com`
                          : "yoursubdomain.com"
                    }
                    value={updateRest.customDomain}
                    disabled={isFreePlan}
                    className="h-11 rounded-xl text-base disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: customDomainError ? "#DC2626" : BORDER,
                    }}
                    onChange={(e) =>
                      setUpdateRest({
                        ...updateRest,
                        customDomain: e.target.value,
                      })
                    }
                  />
                  {!isFreePlan && (
                    <p
                      className="text-xs"
                      style={{ color: customDomainError ? "#DC2626" : MUTE }}
                    >
                      {customDomainError ??
                        `Must start with your subdomain - e.g. ${lockedSubdomain}.com, ${lockedSubdomain}.lol`}
                    </p>
                  )}
                  {!isFreePlan &&
                    updateRest.customDomain &&
                    !customDomainError && (
                      <p className="text-xs" style={{ color: MUTE }}>
                        In your domain provider, add a CNAME record pointing to{" "}
                        <span className="font-semibold" style={{ color: INK }}>
                          {lockedSubdomain}.{CRIMSON_BASE_DOMAIN}
                        </span>
                      </p>
                    )}
                </div>

                <SectionSaveRow
                  onCancel={() => setDomainEditMode(false)}
                  onSave={saveDomainSettings}
                  saving={partialSaving}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= ANNOUNCEMENT ================= */}
        {matchesSearch(["announcement", "banner message", "promo text"]) && (
          <div
            className="bg-white rounded-2xl border p-6 mb-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5" style={{ color: ACCENT }} />
                <h2 className="text-lg font-bold" style={{ color: INK }}>
                  Announcement 
                </h2>
              </div>
              {!announcementEditMode && (
                <EditToggleButton onClick={openAnnouncementEdit} />
              )}
            </div>
            {!announcementEditMode ? (
              <InfoRow
                icon={Megaphone}
                label="Announcement will appear on top of your store"
                value={restDetails?.getRest?.restAnnouncement}
              />
            ) : (
              <div className="flex flex-col gap-y-1.5 pt-2">
                <FieldLabel icon={PartyPopper}>Announcement</FieldLabel>
                <Input
                  type="text"
                  placeholder="Text here will show on top of store"
                  value={updateRest.restAnnouncement}
                  className="h-11 rounded-xl text-base"
                  style={{ borderColor: BORDER }}
                  onChange={(e) =>
                    setUpdateRest({
                      ...updateRest,
                      restAnnouncement: e.target.value,
                    })
                  }
                />
                <SectionSaveRow
                  onCancel={() => setAnnouncementEditMode(false)}
                  onSave={saveAnnouncementSettings}
                  saving={partialSaving}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= CONTACT DETAILS ================= */}
        {matchesSearch([
          "contact",
          "contact details",
          "phone",
          "email",
          "address",
        ]) && (
          <div
            className="bg-white rounded-2xl border p-6 mb-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Contact className="w-5 h-5" style={{ color: ACCENT }} />
                <h2 className="text-lg font-bold" style={{ color: INK }}>
                  Contact Details
                </h2>
              </div>
              {!contactEditMode && (
                <EditToggleButton onClick={openContactEdit} />
              )}
            </div>
            {!contactEditMode ? (
              <>
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={restDetails?.getRest?.restPhone}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={restDetails?.getRest?.restEmail}
                />
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={restDetails?.getRest?.restAddress}
                />
              </>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={Phone}>Phone</FieldLabel>
                    <Input
                      type="number"
                      placeholder="Phone"
                      value={updateRest.restPhone}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({
                          ...updateRest,
                          restPhone: e.target.value,
                        })
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
                        setUpdateRest({
                          ...updateRest,
                          restEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5 sm:col-span-2">
                    <FieldLabel icon={MapPin}>Address</FieldLabel>
                    <Input
                      placeholder="Address"
                      value={updateRest.restAddress}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({
                          ...updateRest,
                          restAddress: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <SectionSaveRow
                  onCancel={() => setContactEditMode(false)}
                  onSave={saveContactSettings}
                  saving={partialSaving}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= SOCIALS ================= */}
        {matchesSearch(["social", "socials", "instagram", "facebook"]) && (
          <div
            className="bg-white rounded-2xl border p-6 mb-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" style={{ color: ACCENT }} />
                <h2 className="text-lg font-bold" style={{ color: INK }}>
                  Socials
                </h2>
              </div>
              {!socialsEditMode && (
                <EditToggleButton onClick={openSocialsEdit} />
              )}
            </div>
            {!socialsEditMode ? (
              <>
                <InfoRow
                  icon="/instagram.svg"
                  label="Instagram"
                  value={restDetails?.getRest?.restInstagram}
                />
                <InfoRow
                  icon="/facebook.svg"
                  label="Facebook"
                  value={restDetails?.getRest?.restFB}
                />
              </>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon="/instagram.svg">Instagram</FieldLabel>
                    <Input
                      placeholder="Instagram"
                      value={updateRest.restInstagram}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({
                          ...updateRest,
                          restInstagram: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon="/facebook.svg">Facebook</FieldLabel>
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
                <SectionSaveRow
                  onCancel={() => setSocialsEditMode(false)}
                  onSave={saveSocialsSettings}
                  saving={partialSaving}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= SEO ================= */}
        {matchesSearch(["seo", "meta title", "meta description"]) && (
          <div
            className="bg-white rounded-2xl border p-6 mb-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <DatabaseSearch className="w-5 h-5" style={{ color: ACCENT }} />
                <h2 className="text-lg font-bold" style={{ color: INK }}>
                  SEO
                </h2>
              </div>
              {!seoEditMode && <EditToggleButton onClick={openSeoEdit} />}
            </div>
            {!seoEditMode ? (
              <>
                <InfoRow
                  icon={Tag}
                  label="Meta Title"
                  value={restDetails?.getRest?.metaTitle}
                />
                <InfoRow
                  icon={FileText}
                  label="Meta Description"
                  value={restDetails?.getRest?.metaDesc}
                />
              </>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-y-1.5">
                    <FieldLabel icon={Tag}>Meta Title</FieldLabel>
                    <Input
                      placeholder="Meta Title"
                      value={updateRest.metaTitle}
                      className="h-11 rounded-xl text-base"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setUpdateRest({
                          ...updateRest,
                          metaTitle: e.target.value,
                        })
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
                        setUpdateRest({
                          ...updateRest,
                          metaDesc: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <SectionSaveRow
                  onCancel={() => setSeoEditMode(false)}
                  onSave={saveSeoSettings}
                  saving={partialSaving}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= THEME ================= */}
        {matchesSearch(["theme", "store theme", "appearance"]) && (
          <div
            className="bg-white rounded-2xl border p-6 mb-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <SunMoon className="w-5 h-5" style={{ color: ACCENT }} />
                <h2 className="text-lg font-bold" style={{ color: INK }}>
                  Store Theme
                </h2>
              </div>
              {!brandingEditMode && (
                <EditToggleButton onClick={openBrandingEdit} />
              )}
            </div>
            {!brandingEditMode ? (
              <InfoRow
                icon={Palette}
                label="Theme"
                value={restDetails?.getRest?.restTheme}
              />
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-y-1.5">
                  <FieldLabel icon={Palette}>Theme</FieldLabel>
                  <Select
                    value={updateRest.restTheme || DEFAULT_THEME}
                    onValueChange={(value) =>
                      setUpdateRest({
                        ...updateRest,
                        restTheme: value as ThemeName,
                      })
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
                              style={{
                                backgroundColor: THEME_META[theme].swatch,
                              }}
                            />
                            {THEME_META[theme].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SectionSaveRow
                  onCancel={() => setBrandingEditMode(false)}
                  onSave={() =>
                    savePartialSettingsM(
                      { restTheme: updateRest.restTheme },
                      { onSuccess: () => setBrandingEditMode(false) },
                    )
                  }
                  saving={partialSaving}
                />
              </div>
            )}
          </div>
        )}

        {matchesSearch(["branding", "footer", "notifications", "push"]) && (
          <SectionHeading>Storefront</SectionHeading>
        )}

        {matchesSearch([
          "branding",
          "powered by Maroon Apron",
          "footer",
          "white label",
        ]) && (
          <div
            className="bg-white rounded-2xl border p-6"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Maroon Apron Branding
                  </h2>
                </div>

                <p className="text-sm text-gray-500">
                  {isFreePlan
                    ? "Upgrade to Pro to remove the 'Powered by Maroon Apron' footer from your storefront."
                    : crimsonBranding
                      ? "Your storefront currently displays the 'Powered by Maroon Apron' footer."
                      : "The 'Powered by Maroon Apron' footer has been removed from your storefront."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  disabled={isFreePlan}
                  checked={crimsonBranding}
                  onCheckedChange={handleBranding}
                />

                {isFreePlan && (
                  <span className="text-sm text-muted-foreground">
                    Pro Required
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {matchesSearch(["notifications", "push", "alerts", "orders"]) && (
          <div
            className="bg-white rounded-2xl border p-6 mt-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="w-5 h-5" style={{ color: ACCENT }} />
                  <h2 className="text-lg font-bold" style={{ color: INK }}>
                    Push Notifications
                  </h2>
                </div>
                <p className="text-sm" style={{ color: MUTE }}>
                  Get notified when orders or events happen
                </p>
              </div>

              {notifLoading ? (
                <Button
                  disabled
                  variant="outline"
                  className="rounded-xl min-w-40"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : notificationsEnabled ? (
                <Button
                  onClick={handleDisableNotifications}
                  disabled={disablingNotifs}
                  variant="outline"
                  className="rounded-xl min-w-40 text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-60"
                >
                  {disablingNotifs ? "Disabling…" : "Disable Notifications"}
                </Button>
              ) : (
                <Button
                  onClick={handleEnableNotifications}
                  disabled={enablingNotifs}
                  className="rounded-xl min-w-40 text-white disabled:opacity-60"
                  style={{ backgroundColor: ACCENT }}
                >
                  {enablingNotifs ? "Enabling…" : "Enable Notifications"}
                </Button>
              )}
            </div>
          </div>
        )}

        {matchesSearch([
          "ordering",
          "pickup",
          "delivery",
          "fulfillment",
          "store open",
          "store closed",
        ]) && <SectionHeading>Order Fulfillment</SectionHeading>}

        {matchesSearch([
          "ordering",
          "pickup",
          "delivery",
          "fulfillment",
          "store open",
          "store closed",
          "collect",
          "courier",
        ]) && (
          <div
            className="bg-white rounded-2xl border p-6 divide-y"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-3">
                <ReceiptTextIcon
                  className="w-5 h-5 shrink-0"
                  style={{ color: ACCENT }}
                />
                <div>
                  <h2 className="text-base font-bold" style={{ color: INK }}>
                    Ordering
                  </h2>
                  <p className="text-xs" style={{ color: MUTE }}>
                    {orderingDisabled
                      ? "Customers can't place any orders right now."
                      : "Customers can currently place orders."}
                  </p>
                </div>
              </div>
              <Switch
                checked={!orderingDisabled}
                onCheckedChange={(checked) => handleDisableOrdering(!checked)}
              />
            </div>

            <div className="flex flex-col gap-4 py-4">
              {/* Pickup header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Handbag
                    className="w-5 h-5 shrink-0"
                    style={{ color: ACCENT }}
                  />

                  <div>
                    <h2 className="text-base font-bold" style={{ color: INK }}>
                      Pickup
                    </h2>
                    <p className="text-xs" style={{ color: MUTE }}>
                      {pickupEnabled
                        ? "Pickup is offered at checkout."
                        : "Pickup is currently turned off."}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  {pickupEnabled && (
                    <Button
                      className="h-8 rounded-lg text-xs px-3 gap-1.5 shrink-0"
                      variant="outline"
                      onClick={() => setPickupLocEditMode(!pickupLocEditMode)}
                    >
                      {pickupLocEditMode ? "Close" : "Edit"}
                    </Button>
                  )}

                  <Switch
                    checked={pickupEnabled}
                    onCheckedChange={handlePickupEnable}
                  />
                </div>
              </div>

              {/* Pickup location editor */}
              {pickupLocEditMode && (
                <div
                  className="bg-white rounded-2xl border p-6"
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
                    Click on the map, or drag the pin, to update your pickup
                    location
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
              )}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-3">
                <Bike className="w-5 h-5 shrink-0" style={{ color: ACCENT }} />
                <div>
                  <h2 className="text-base font-bold" style={{ color: INK }}>
                    Delivery
                  </h2>
                  <p className="text-xs" style={{ color: MUTE }}>
                    {deliveryEnabled
                      ? "Delivery is offered at checkout."
                      : "Delivery is currently turned off."}
                  </p>
                </div>
              </div>
              <Switch
                checked={deliveryEnabled}
                onCheckedChange={handleDeliveryEnable}
              />
            </div>
          </div>
        )}

        {/* ================= PREORDER SETTINGS ================= */}
        {matchesSearch([
          "preorder",
          "pre-order",
          "schedule",
          "time window",
          "minimum notice",
          "advance order",
        ]) && (
          <div
            className="bg-white rounded-2xl border p-6 mt-3"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="text-lg font-bold" style={{ color: INK }}>
                Preorder Settings
              </h2>
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
                <Switch
                  checked={preOrdersEnabled}
                  onCheckedChange={handlePreorderToggle}
                />
              </div>

              {preOrdersEnabled && (
                <button
                  style={{ backgroundColor: ACCENT }}
                  className="flex items-center gap-x-2 rounded-xl text-white p-2 text-xs"
                  onClick={() => setPreOrderEditMode(!preOrderEditMode)}
                >
                  <span> Change Pre-Order Settings</span>
                </button>
              )}

              {preOrdersEnabled && preOrderEditMode && (
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
                      value={preOrderMinHours}
                      className="h-11 rounded-xl text-base bg-white"
                      style={{ borderColor: BORDER }}
                      onChange={(e) =>
                        setPreOrderMinHours(Number(e.target.value))
                      }
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
                      onChange={(e) =>
                        setPreOrderMaxDays(Number(e.target.value))
                      }
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
                          const w = newWindow.trim();
                          if (!w) return;

                          if (!isValidTimeWindow(w)) {
                            toast.error(
                              "Use a format like '7pm - 9pm' or '15:00 - 16:00'",
                            );
                            return;
                          }

                          setDeliveryWindows([...deliveryWindows, w]);
                          setNewWindow("");
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
                                setDeliveryWindows(
                                  deliveryWindows.filter((_, i) => i !== idx),
                                );
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
                          const w = newPickupWindow.trim();
                          if (!w) return;

                          if (!isValidTimeWindow(w)) {
                            toast.error(
                              "Use a format like '6pm - 8pm' or '18:00 - 20:00'",
                            );
                            return;
                          }

                          setPickupWindows([...pickUpWindows, w]);
                          setNewPickupWindow("");
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
                                setPickupWindows(
                                  pickUpWindows.filter((_, i) => i !== idx),
                                );
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
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl text-base"
                      onClick={() => setPreOrderEditMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={preorderLoading}
                      className="flex-1 h-11 rounded-xl text-base text-white disabled:opacity-60"
                      style={{ backgroundColor: ACCENT }}
                      onClick={() => {
                        updatePreorderSettingsM({
                          preOrderMinHours,
                          preOrderMaxDays,
                          deliveryWindows,
                          pickUpWindows,
                        });
                        setPreOrderEditMode(false);
                      }}
                    >
                      Save Preorder Settings
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {matchesSearch(["support", "help", "question", "contact"]) && (
          <SectionHeading>Support</SectionHeading>
        )}

        {matchesSearch(["support", "help", "question", "contact"]) && (
          <div
            className="bg-white rounded-2xl border p-6 flex flex-col gap-y-5"
            style={{ borderColor: BORDER }}
          >
            <div className="flex items-center gap-2 ">
              <HelpCircle className="w-5 h-5" style={{ color: ACCENT }} />
              <h2 className="text-lg font-bold" style={{ color: INK }}>
                Have a question?
              </h2>
            </div>
            <Button
              onClick={() => navigate("/support")}
              className="rounded-xl gap-2 text-white w-fit p-4 font-bold"
              style={{ backgroundColor: ACCENT }}
            >
              Contact Support
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}