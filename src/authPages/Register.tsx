import { useState, useEffect, useRef } from "react"
import { UserAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, UserRound } from "lucide-react"
import { useNavigate } from "react-router";
import { usePostHog } from "../lib/posthog";

export default function RegisterCustomer(){
  const [name,setName] = useState<string>("")
  const [email,setEmail] = useState<string>("")
  const [password,setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [agree,setAgree] = useState(false)
  const navigate = useNavigate()

  const ACCENT = "#D6293F"
  const INK = "#171717"
  const MUTE = "#6B7280"
  const BORDER = "#E7E5E4"
  const SOFT = "#FBF7F6"

  const { session } = UserAuth()

  const posthog = usePostHog()

  const googleBtnRef = useRef<HTMLDivElement>(null)

  const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    posthog.capture('button_clicked', { button_name: 'customer_signup' })

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
      const role = "customer";

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            
          }),
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

  const handleGoogleResponse = async (response: { credential: string }) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register-customer-google`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: response.credential}),
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

  useEffect(() => {
  if (session) return

  let cancelled = false

  const tryRender = () => {
    // @ts-ignore
    if (window.google && googleBtnRef.current) {
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      })
      // @ts-ignore
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
        text: "signup_with",
      })
      return true
    }
    return false
  }

  if (!tryRender() && !cancelled) {
    const interval = setInterval(() => {
      if (tryRender() || cancelled) clearInterval(interval)
    }, 100)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }
}, [session])

  if(session){
    return(
      <div className="flex font-bold flex-col gap-y-4 text-lg min-h-screen items-center justify-center"><p>You are already Signed In</p>
      <button  className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1"
          style={{ backgroundColor: ACCENT }} onClick={()=>navigate('/dashboard')}>Go to Dashboard</button></div>
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

        <div ref={googleBtnRef} className="w-full flex justify-center" />

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

          <label htmlFor="terms" className="text-xs" style={{ color: INK }}>
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
          style={{
            backgroundColor: agree ? ACCENT : "#E5E5E5",
          }}
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