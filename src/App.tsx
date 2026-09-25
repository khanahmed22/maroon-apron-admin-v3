import { Route, Routes, Navigate, Outlet } from "react-router";
import { lazy, Suspense, useEffect } from "react";
import Home from "./pages/Home";
import { UserAuth } from "./context/AuthContext";
import {  Toaster } from "sonner";
import ScrollToTop from "./lib/ScrollToTop";
import { Capacitor } from "@capacitor/core";

const Login = lazy(() => import("./authPages/Login"));
const Register = lazy(() => import("./authPages/Register"));
const VerifyEmail = lazy(() => import("./authPages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./authPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./authPages/ResetPassword"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Account = lazy(() => import("./pages/Account"));
const Orders = lazy(() => import("./pages/Orders"));
const PlaceOrder = lazy(() => import("./pages/PlaceOrder"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Customers = lazy(() => import("./pages/Customers"));
const Settings = lazy(() => import("./pages/Settings"));
const DeliveryZones = lazy(() => import("./pages/DeliveryZones"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Contact = lazy(() => import("./pages/Contact"));
const Coupon = lazy(() => import("./pages/Coupon"));
const Support = lazy(() => import("./pages/Support"));
const NotFound = lazy(() => import("./pages/NotFound"));
const KnowledgeBase = lazy(() => import("./policyPages/KnowledgeBase"));
const DeliveryPolicy = lazy(() => import("./policyPages/DeliveryPolicy"));
const PrivacyPolicy = lazy(() => import("./policyPages/PrivacyPolicy"));
const MerchantRefundPolicy = lazy(() => import("./policyPages/RefundPolicy"));
const MerchantTermsAndConditions = lazy(
  () => import("./policyPages/TermsConditions"),
);
const FirstTimeSetup = lazy(()=> import("./pages/FirstTimeSetup"))

const Cancellation = lazy(() => import("./policyPages/CancellationPolicy"));

const SideBar = lazy(() => import("./components/Sidebar"));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF7F6]">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-[#E7E5E4]" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-[#D6293F] animate-spin" />
      </div>

      <p className="mt-4 text-sm font-medium text-[#6B7280]">Loading...</p>
    </div>
  );
}

function ProtectedRoute() {
  const { session, loading,restLoading } = UserAuth();

 if (loading || restLoading) {
     return <PageLoader />;
   }


  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AuthLayout() {
  const { restId} = UserAuth();
  return (
    <div className="flex max-md:flex-col">
      <Suspense fallback={<PageLoader />}>
        <SideBar restId={restId}/>
      </Suspense>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  const { restId, restName, session, subdomain } = UserAuth();
 
 

 useEffect(() => {
  async function configurePurchases() {
    if (!Capacitor.isNativePlatform()) return;
    if (!session?.id) return;

    const { Purchases, LOG_LEVEL } = await import(
      "@revenuecat/purchases-capacitor"
    );

    await Purchases.setLogLevel({
      level: LOG_LEVEL.DEBUG,
    });

    await Purchases.configure({
      apiKey: import.meta.env.VITE_REVENUECAT_KEY,
    });

    await Purchases.logIn({
      appUserID: session.id,
    });
  }

  configurePurchases();
}, [session?.id]);
  


 return (
  <>
    <ScrollToTop />

    {/* Non-lazy root route */}
   

    {/* Lazy-loaded routes */}
    <Suspense fallback={<PageLoader />}>
    
      <Routes>

        {/* Public */}
        <Route
        path="/"
        element={
          Capacitor.isNativePlatform() ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Home />
          )
        }
      />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/verify-email/:role/:token"
          element={<VerifyEmail />}
        />

        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Policies */}
        <Route path="/delivery-policy" element={<DeliveryPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/refund-policy" element={<MerchantRefundPolicy />} />
        <Route path="/cancellation-policy" element={<Cancellation />} />

        <Route
          path="/terms-and-conditions"
          element={<MerchantTermsAndConditions />}
        />

        <Route path="/knowledge-base" element={<KnowledgeBase />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          {restName && subdomain ? (
            <Route element={<AuthLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/account" element={<Account />} />
              <Route path="/support" element={<Support />} />

              <Route
                path="/delivery-zones"
                element={<DeliveryZones restId={restId} />}
              />

              <Route
                path="/orders"
                element={<Orders restId={restId} />}
              />

              <Route
                path="/analytics"
                element={<Analytics restId={restId} />}
              />

              <Route
                path="/place-order"
                element={
                  <PlaceOrder
                    restName={restName}
                    restId={restId}
                  />
                }
              />

              <Route
                path="/inventory"
                element={
                  <Inventory
                    restName={restName}
                    restId={restId}
                  />
                }
              />

              <Route
                path="/coupon"
                element={<Coupon restId={restId} />}
              />

              <Route
                path="/customers"
                element={<Customers restId={restId} />}
              />

              <Route
                path="/settings"
                element={<Settings restId={restId} />}
              />

              <Route
                path="/first-time-setup"
                element={<Navigate to="/dashboard" replace />}
              />
            </Route>
          ) : (
            <Route
              path="/first-time-setup"
              element={<FirstTimeSetup restId={restId} />}
            />
          )}

          {/* Catch-all */}
          <Route
            path="*"
            element={
              restName && subdomain ? (
                <NotFound />
              ) : (
                <Navigate to="/first-time-setup" replace />
              )
            }
          />
        </Route>
      </Routes>
    </Suspense>

    <Toaster richColors position="top-center" />
  </>
);
}
export default App