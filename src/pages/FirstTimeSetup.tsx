
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
interface RestProps {
  restId: string | null;
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

export default function FirstTimeSetup({ restId }: RestProps) {
  const CRIMSON_BASE_DOMAIN = "crimsoncastle.shop";

  const ACCENT = "#D6293F";
  const INK = "#171717";
  const MUTE = "#6B7280";
  const BORDER = "#E7E5E4";

  const queryClient = useQueryClient();
 

  const { session } = UserAuth();

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

  // ================= FIRST-TIME SETUP =================
  const [setupName, setSetupName] = useState("");
  const [setupSubdomain, setSetupSubdomain] = useState("");

 

  const completeSetup = async ({
    restName,
    subdomain,
  }: {
    restName: string;
    subdomain: string;
  }) => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/settings`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: restId, restName, subdomain }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to complete setup");
    }

    return res.json();
  };

  const { mutate: completeSetupM, isPending: setupSaving } = useMutation({
    mutationKey: ["completeSetup"],
    mutationFn: completeSetup,
    onSuccess: () => {
      toast.success("Store set up!");
      queryClient.invalidateQueries({ queryKey: ["restDetails"] });

      updateNetlifyAliasM({
        newDomain: `${setupSubdomain}.${CRIMSON_BASE_DOMAIN}`,
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  if (restDetails?.getRest?.restName && restDetails?.getRest?.subdomain) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "#FDF0F2" }}
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: INK }}
        >
          Setup complete
        </h1>

        <p
          className="mt-2 text-sm leading-6"
          style={{ color: MUTE }}
        >
          Your store is ready to go. You can now manage your products,
          orders, and store settings from your dashboard.
        </p>

        <div
          className="mt-6 rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: BORDER,
            backgroundColor: "#FBF7F6",
          }}
        >
          <span style={{ color: MUTE }}>Your store</span>

          <div
            className="mt-1 font-medium"
            style={{ color: INK }}
          >
            {restDetails.getRest.restName}
          </div>

          <div
            className="mt-1 text-xs"
            style={{ color: MUTE }}
          >
            {restDetails.getRest.subdomain}.{CRIMSON_BASE_DOMAIN}
          </div>
        </div>

        <a
  href="/dashboard"
  className="mt-6 flex h-11 w-full items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90"
  style={{ backgroundColor: ACCENT }}
>
  Go to Dashboard
</a>
      </div>
    </div>
  );
}

if (isPending) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ color: MUTE }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
        <p className="text-sm font-medium">Loading Store Setup…</p>
      </div>
    );
  }


  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
  <div className="w-full max-w-md">
    <div className="mb-8 text-center">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ color: INK }}
      >
        Set up your store
      </h1>

      <p
        className="mt-2 text-sm leading-6"
        style={{ color: MUTE }}
      >
        Choose your restaurant name and store URL. These can't be changed
        later - contact support if you need to.
      </p>
    </div>

    <div className="space-y-5">
      <div className="flex flex-col gap-y-2">
        <label
          className="text-sm font-medium"
          style={{ color: INK }}
        >
          Restaurant Name
        </label>

        <input
          value={setupName}
          placeholder="e.g. Pizza Town"
          className="h-11 w-full rounded-xl border bg-white px-3 text-base outline-none transition focus:ring-2"
          style={{
            borderColor: BORDER,
            color: INK,
          }}
          onChange={(e) => {
            setSetupName(e.target.value);
            setSetupSubdomain(slugify(e.target.value));
          }}
        />
      </div>

      {setupSubdomain && (
        <div
          className="rounded-xl border px-4 py-3"
          style={{
            borderColor: BORDER,
            backgroundColor: "#FBF7F6",
          }}
        >
          <p
            className="text-xs"
            style={{ color: MUTE }}
          >
            Your store URL
          </p>

          <p
            className="mt-1 text-sm font-medium break-all"
            style={{ color: INK }}
          >
            {setupSubdomain}.{CRIMSON_BASE_DOMAIN}
          </p>
        </div>
      )}

      <Button
        className="h-11 w-full rounded-xl text-white disabled:opacity-60"
        style={{ backgroundColor: ACCENT }}
        disabled={!setupName.trim() || setupSaving}
        onClick={() =>
          completeSetupM({
            restName: setupName.trim(),
            subdomain: setupSubdomain,
          })
        }
      >
        {setupSaving ? "Setting up…" : "Continue"}
      </Button>
    </div>
  </div>
</div>
  );
}
