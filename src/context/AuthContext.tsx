import { createContext, useContext, useEffect, useState } from "react";
import { fetchRestId } from "../lib/fetchResId";
import { useQuery } from "@tanstack/react-query";
import type{ ReactNode } from "react";
interface UserProps {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthContextType {
  session: UserProps | null;
  loading: boolean;
  restId: string | null;
  restName: string | null,
  subdomain: string | undefined,
  setSession: React.Dispatch<React.SetStateAction<UserProps | null>>;
  checkAuth: () => Promise<void>;
}
interface AuthProviderProps {
  children: ReactNode;
}


const AuthContext = createContext<AuthContextType | null>(null)

export const AuthContextProvider = ({children}:AuthProviderProps)=>{

  const [session, setSession] = useState<UserProps | null>(null);
  const [loading, setLoading] = useState(true);
   const { data } = useQuery({
    queryKey: ["restId"],
    queryFn: fetchRestId,
    enabled: !!session?.id,
    staleTime: 5 * 60 * 1000,
  });

  const restId = data?.getId?.id ?? null;

  const restName = data?.getId?.restName ?? null
  const subdomain = data?.getId?.subdomain ?? null;
  
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
  } finally {
    setLoading(false);
  }
}
  
   useEffect(() => {
  checkAuth();
}, []);
  

  return(
    <AuthContext.Provider value={{session,setSession,checkAuth,loading,restId,restName,subdomain}}>
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