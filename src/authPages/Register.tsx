import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, UserRound } from "lucide-react"
import { useNavigate } from "react-router";
import { usePostHog } from "../lib/posthog";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

export default function RegisterMerchant(){
  const [name,setName] = useState<string>("")
  const [email,setEmail] = useState<string>("")
  const [password,setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [agree,setAgree] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const navigate = useNavigate()

  const ACCENT = "#D6293F"
  const INK = "#171717"
  const MUTE = "#6B7280"
  const BORDER = "#E7E5E4"
  const SOFT = "#FBF7F6"

  const { session } = UserAuth()
  const posthog = usePostHog()

  const isNative = Capacitor.isNativePlatform()

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    posthog.capture('button_clicked', { button_name: 'merchant_signup' })

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    if (!agree) {
      toast.error("Please agree to the Privacy Policy and Terms & Conditions to continue");
      return;
    }

    try {
      const role = "merchant";

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register-merchant`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || data?.message || "Registration failed");
        return;
      }

      toast.success("Check your email for the verification link");
    } catch {
      toast.error("Unable to connect to the server");
    }
  };

  // Shared: send the Google ID token to the backend, whichever
  // flow (web or native SocialLogin) produced it.
  const completeGoogleSignUp = async (idToken: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register-merchant-google`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || "Google sign-up failed");
        return;
      }

      toast.success("Account created!");
      navigate("/dashboard");
    } catch {
      toast.error("Unable to connect to the server");
    }
  };

  // Initialize SocialLogin once — used on both web and native
  useEffect(() => {
    SocialLogin.initialize({
      google: {
        webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Web Client ID, all platforms
        mode: "online",
      },
    }).catch((err) => {
      console.error("SocialLogin init failed:", err)
    })
  }, [])

  // Native (Android/iOS): SocialLogin-driven sign-in
  const handleNativeGoogleSignIn = async () => {
    if (googleLoading) return
    setGoogleLoading(true)
    try {
      const response = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["email", "profile"] },
      })

      if (response.provider !== "google") {
        toast.error("Google sign-up failed")
        return
      }

      const result = response.result
      const idToken = "idToken" in result ? result.idToken : null

      if (!idToken) {
        toast.error("Google sign-up failed")
        return
      }
      await completeGoogleSignUp(idToken)
    } catch (err: any) {
      if (err?.code !== "USER_CANCELLED") {
        toast.error("Google sign-up failed")
      }
    } finally {
      setGoogleLoading(false)
    }
  };

  // Web: also route through SocialLogin now (replaces the old GIS script/button)
  const handleWebGoogleSignIn = async () => {
    if (googleLoading) return
    setGoogleLoading(true)
    try {
      const response = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["email", "profile"] },
      })

      if (response.provider !== "google") {
        toast.error("Google sign-up failed")
        return
      }

      const result = response.result
      const idToken = "idToken" in result ? result.idToken : null

      if (!idToken) {
        toast.error("Google sign-up failed")
        return
      }
      await completeGoogleSignUp(idToken)
    } catch (err: any) {
      if (err?.code !== "USER_CANCELLED") {
        toast.error("Google sign-up failed")
      }
    } finally {
      setGoogleLoading(false)
    }
  };

  if(session){
    return(
      <div className="flex font-bold flex-col gap-y-4 text-lg min-h-screen items-center justify-center">
        <p>You are already Signed In</p>
        <button className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1"
          style={{ backgroundColor: ACCENT }} onClick={()=>navigate('/dashboard')}>Go to Dashboard</button>
      </div>
    )
  }
  return(
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: SOFT }}
    >
      <form
        onSubmit={registerUser}
        className="flex flex-col gap-y-5 bg-white p-8 rounded-2xl w-full max-w-sm border shadow-sm"
        style={{ borderColor: BORDER }}
      >
        <div>
          <h1 className="font-bold text-2xl" style={{ color: INK }}>
            Create Account
          </h1>
        </div>

        <button
  type="button"
  onClick={isNative ? handleNativeGoogleSignIn : handleWebGoogleSignIn}
  disabled={googleLoading}
  className="w-full flex items-center justify-center gap-x-2 border rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
  style={{ borderColor: BORDER, color: INK }}
>
  {!googleLoading && (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.58a5.86 5.86 0 0 1 0-3.16V7.89H3.3a9.75 9.75 0 0 0 0 8.22l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.39c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.39 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.7 5.39l3.24 2.53C7.31 8.11 9.46 6.39 12 6.39Z"
      />
    </svg>
  )}

  {googleLoading ? "Signing up..." : "Sign up with Google"}
</button>
        <div className="flex items-center gap-x-3">
          <div className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          <span className="text-xs" style={{ color: MUTE }}>or continue with email</span>
          <div className="h-px flex-1" style={{ backgroundColor: BORDER }} />
        </div>

        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: INK }}>
            Name
          </label>
          <div className="relative">
            <UserRound
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <input
              required
              type="text"
              className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: BORDER, color: INK, ["--tw-ring-color" as any]: "#F3D3D8" }}
              placeholder="John Doe"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: INK }}>
            Email
          </label>
          <div className="relative">
            <Mail
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <input
              required
              type="email"
              className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: BORDER, color: INK, ["--tw-ring-color" as any]: "#F3D3D8" }}
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-medium" style={{ color: INK }}>
            Password
          </label>
          <div className="relative">
            <Lock
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
            />
            <input
              required
              type={showPassword ? "text" : "password"}
              className="w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{ borderColor: BORDER, color: INK, ["--tw-ring-color" as any]: "#F3D3D8" }}
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: MUTE }}>
          Minimum 8 characters with uppercase, lowercase, number and special character.
        </p>

        <div className="flex items-start gap-x-2">
          <input
            id="terms"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5"
            required
          />
          <label
  htmlFor="terms"
  className="text-xs"
  style={{ color: INK }}
>
  I agree to the{" "}
  <a
    href="/privacy-policy"
    className="hover:underline"
    style={{ color: ACCENT }}
  >
    Privacy Policy
  </a>{" "}
  and{" "}
  <a
    href="/terms-and-conditions"
    className="hover:underline"
    style={{ color: ACCENT }}
  >
    Terms & Conditions
  </a>
</label>
        </div>
        <button
          disabled={!agree}
          type="submit"
          className={`p-3 rounded-xl font-semibold text-sm transition-all mt-1 ${
            agree
              ? "text-white hover:opacity-90 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          }`}
          style={{ backgroundColor: agree ? ACCENT : "#E5E5E5" }}
        >
          Sign Up
        </button>

        <p className="text-sm text-center" style={{ color: MUTE }}>
          Already have an account?{" "}
          <a className="font-semibold hover:underline" style={{ color: ACCENT }} href="/login">
            Log In
          </a>
        </p>
      </form>
    </div>
  )
}