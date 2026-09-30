import { createContext, useContext, useEffect, useState } from "react";
import { fetchRestId } from "../lib/fetchResId";
import { useQuery } from "@tanstack/react-query";
import type{ ReactNode } from "react";
interface UserProps {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  tourCompleted: boolean
}

interface AuthContextType {
  session: UserProps | null;
  loading: boolean;

  restId: string | null;
  restName: string | null;
  restPhone: string | null;
  restEmail: string | null;
  restAnnouncement: string | null;
  restAddress: string | null;
  restLogo: string | null;
  restBanner: string | null;
  restInstagram: string | null;
  restFB: string | null;

  metaTitle: string | null;
  metaDesc: string | null;

  logoId: string | null;
  bannerId: string | null;

  customDomain: string | null;
  subdomain: string | undefined;
  restTheme: string | null;

  preOrdersEnabled?: boolean;
  preOrderMinHours?: number;
  preOrderMaxDays?: number;

  pickUpWindows?: string[];
  deliveryWindows?: string[];

  lat: number;
  long: number;

  crimsonBranding: boolean | null;
  orderingDisabled: boolean | null;
  pickupEnabled: boolean | null;
  deliveryEnabled: boolean | null;

  setSession: React.Dispatch<React.SetStateAction<UserProps | null>>;
  checkAuth: () => Promise<void>;
  restLoading: boolean;
}
interface AuthProviderProps {
  children: ReactNode;
}


const AuthContext = createContext<AuthContextType | null>(null)

export const AuthContextProvider = ({children}:AuthProviderProps)=>{

  const [session, setSession] = useState<UserProps | null>(null);
  const [loading, setLoading] = useState(true);
   const { data, isLoading: restLoading } = useQuery({
     queryKey: ["restId"],
     queryFn: fetchRestId,
     enabled: !!session?.id,
     staleTime: 5 * 60 * 1000,
   });

  const restId = data?.getId?.id ?? null;

 const restName = data?.getId?.restName ?? null;
const subdomain = data?.getId?.subdomain ?? null;

const deliveryWindows = data?.getId?.deliveryWindows ?? [];
const pickUpWindows = data?.getId?.pickUpWindows ?? [];

const preOrdersEnabled = data?.getId?.preOrdersEnabled ?? null;
const preOrderMinHours = data?.getId?.preOrderMinHours ?? null;
const preOrderMaxDays = data?.getId?.preOrderMaxDays ?? null;

const restPhone = data?.getId?.restPhone ?? null;
const restEmail = data?.getId?.restEmail ?? null;
const restAnnouncement = data?.getId?.restAnnouncement ?? null;
const restAddress = data?.getId?.restAddress ?? null;
const restLogo = data?.getId?.restLogo ?? null;
const restBanner = data?.getId?.restBanner ?? null;
const restInstagram = data?.getId?.restInstagram ?? null;
const restFB = data?.getId?.restFB ?? null;

const metaTitle = data?.getId?.metaTitle ?? null;
const metaDesc = data?.getId?.metaDesc ?? null;

const logoId = data?.getId?.logoId ?? null;
const bannerId = data?.getId?.bannerId ?? null;

const customDomain = data?.getId?.customDomain ?? null;
const restTheme = data?.getId?.restTheme ?? null;

const lat = data?.getId?.lat ?? 0;
const long = data?.getId?.long ?? 0;

const crimsonBranding = data?.getId?.crimsonBranding ?? null;
const orderingDisabled = data?.getId?.orderingDisabled ?? null;

const pickupEnabled = data?.getId?.pickupEnabled ?? null;
const deliveryEnabled = data?.getId?.deliveryEnabled ?? null;
    async function checkAuth() {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) {
      setSession(null);
      return;
    }

    const data = await res.json();
    setSession(data.user);
  } catch (err) {
    setSession(null);
    console.log(err)
  } finally {
    setLoading(false);
  }
}
  
   useEffect(() => {
  checkAuth();
}, []);
  

  return(
   <AuthContext.Provider
  value={{
    session,
    setSession,
    checkAuth,
    loading,
    restId,
    restName,
    subdomain,

    deliveryWindows,
    pickUpWindows,
    preOrdersEnabled,
    preOrderMaxDays,
    preOrderMinHours,

    restPhone,
    restEmail,
    restAnnouncement,
    restAddress,
    restLogo,
    restBanner,
    restInstagram,
    restFB,
    metaTitle,
    metaDesc,
    logoId,
    bannerId,
    customDomain,
    restTheme,
    lat,
    long,
    crimsonBranding,
    orderingDisabled,
    pickupEnabled,
    deliveryEnabled,
    restLoading
  }}
>
      {children}
    </AuthContext.Provider>
  )
}

export const UserAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "UserAuth must be used within AuthContextProvider"
    );
  }

  return context;
};