import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { UserAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { SocialLogin } from "@capgo/capacitor-social-login";

export default function Login() {
  const { session, checkAuth ,loading:authLoading} = UserAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const ACCENT = "#D6293F";
  const INK = "#171717";
  const MUTE = "#6B7280";
  const BORDER = "#E7E5E4";
  const SOFT = "#FBF7F6";


  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login-merchant`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!res.ok) {
        await res.json().catch(() => null);

        toast.error("Invalid email or password");
        return;
      }

      await checkAuth();
navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  // Shared: send the Google ID token to the backend, whichever
  // flow (web or native SocialLogin) produced it.
  const completeGoogleSignIn = async (idToken: string) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login-merchant-google`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error || "Google sign-in failed");
        return;
      }

      await checkAuth();
      navigate("/dashboard");
    } catch {
      toast.error("Unable to connect to the server");
    }
  };

  // Initialize SocialLogin once — used on both web and native
  useEffect(() => {
    SocialLogin.initialize({
      google: {
        webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        mode: "online",
      },
    }).catch((err) => {
      console.error("SocialLogin init failed:", err);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const response = await SocialLogin.login({
        provider: "google",
        options: { scopes: ["email", "profile"] },
      });

      if (response.provider !== "google") {
        toast.error("Google sign-in failed");
        return;
      }

      const result = response.result;
      const idToken = "idToken" in result ? result.idToken : null;

      if (!idToken) {
        toast.error("Google sign-in failed");
        return;
      }
      await completeGoogleSignIn(idToken);
    } catch (err: any) {
      if (err?.code !== "USER_CANCELLED") {
        toast.error("Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  if(authLoading){
    return (
    <div className="min-h-screen flex items-center justify-center">
      <LoaderCircle
        className="w-6 h-6 animate-spin"
        style={{ color: ACCENT }}
      />
    </div>)
  }

  if (session) {
    return (
      <div className="flex font-bold flex-col gap-y-4 text-lg min-h-screen items-center justify-center">
        <p>You are already Signed In</p>
        <button
          className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1"
          style={{ backgroundColor: ACCENT }}
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: SOFT }}
    >
      <form
        onSubmit={loginUser}
        autoComplete="on"
        className="flex flex-col gap-y-5 bg-white p-8 rounded-2xl w-full max-w-sm border shadow-sm"
        style={{ borderColor: BORDER }}
      >
        <div>
          <h1 className="font-bold text-2xl" style={{ color: INK }}>
            Welcome back
          </h1>
        </div>

        <button
  type="button"
  onClick={handleGoogleSignIn}
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

  {googleLoading ? "Signing in..." : "Sign in with Google"}
</button>

        <div className="flex items-center gap-x-3">
          <div className="h-px flex-1" style={{ backgroundColor: BORDER }} />
          <span className="text-xs" style={{ color: MUTE }}>or continue with email</span>
          <div className="h-px flex-1" style={{ backgroundColor: BORDER }} />
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
              name="username"
              autoComplete="username"
              className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{
                borderColor: BORDER,
                color: INK,
                ["--tw-ring-color" as any]: "#F3D3D8",
              }}
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
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
              name="password"
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              className="w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 transition-shadow"
              style={{
                borderColor: BORDER,
                color: INK,
                ["--tw-ring-color" as any]: "#F3D3D8",
              }}
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: MUTE }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="text-white p-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity mt-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: ACCENT }}
        >
          {loading ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Logging In...
            </>
          ) : (
            "Log In"
          )}
        </button>
        <p className="text-sm text-center" style={{ color: MUTE }}>
          Don&apos;t have an account?{" "}
          <a
            className="font-semibold hover:underline"
            style={{ color: ACCENT }}
            href="/register"
          >
            Sign up
          </a>
        </p>
        <p className="text-sm text-center" style={{ color: MUTE }}>
          <a
            className="font-semibold hover:underline"
            style={{ color: ACCENT }}
            href="/forgot-password"
          >
            Forgot Password ?
          </a>
        </p>
      </form>
    </div>
  );
}