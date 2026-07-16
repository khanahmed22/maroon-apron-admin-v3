import {
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router";
import {
  lazy,
  Suspense,
  useEffect,
} from "react";

import { UserAuth } from "./context/AuthContext";
import { toast, Toaster } from "sonner";
import { socket } from "./lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import ScrollToTop from "./lib/ScrollToTop";

/* Lazy Loaded Pages */
const Login = lazy(() => import("./authPages/Login"));
const Register = lazy(() => import("./authPages/Register"));
const VerifyEmail = lazy(() => import("./authPages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./authPages/ForgotPassword"));
const ResetPassword = lazy(() => import("./authPages/ResetPassword"));

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Account = lazy(() => import("./pages/Account"));
const Orders = lazy(() => import("./pages/Orders"));
const PlaceOrder = lazy(() => import("./pages/PlaceOrder"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Customers = lazy(() => import("./pages/Customers"));
const Settings = lazy(() => import("./pages/Settings"));
const MerchantApp = lazy(() => import("./pages/MerchantApp"));
const DeliveryZones = lazy(()=>import("./pages/DeliveryZones"))
const Analytics = lazy(()=>import("./pages/Analytics"))

const DeliveryPolicy = lazy(
  () => import("./policyPages/DeliveryPolicy")
);
const PrivacyPolicy = lazy(
  () => import("./policyPages/PrivacyPolicy")
);
const MerchantRefundPolicy = lazy(
  () => import("./policyPages/RefundPolicy")
);
const MerchantTermsAndConditions = lazy(
  () => import("./policyPages/TermsConditions")
);

const Cancellation = lazy(
  () => import("./policyPages/CancellationPolicy")
);

const SideBar = lazy(() => import("./components/Sidebar"));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FBF7F6]">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-[#E7E5E4]" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-[#D6293F] animate-spin" />
      </div>

      <p className="mt-4 text-sm font-medium text-[#6B7280]">
        Loading...
      </p>
    </div>
  );
}

/* 🔒 Auth Guard */
function ProtectedRoute() {
  const { session, loading } = UserAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/* 🧱 Layout */
function AuthLayout() {
  return (
    <div className="flex max-md:flex-col">
      <Suspense fallback={<PageLoader />}>
        <SideBar />
      </Suspense>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  const { restId, restName } = UserAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!restId) return;

    socket.connect();
    socket.emit("joinRestaurant", restId);

    return () => {
      socket.disconnect();
    };
  }, [restId]);

  useEffect(() => {
    socket.on("newOrder", (order) => {
      console.log("New order:", order);

      toast.info(`New order #${order.orderNumber}`);

      queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    });

    return () => {
      socket.off("newOrder");
    };
  }, [queryClient]);

  return (
    <>
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/verify-email/:token"
            element={<VerifyEmail />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password/:token"
            element={<ResetPassword />}
          />

          {/* Policies */}
          <Route
            path="/delivery-policy"
            element={<DeliveryPolicy />}
          />
          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy />}
          />
          <Route
            path="/refund-policy"
            element={<MerchantRefundPolicy />}
          />

          <Route
            path="/cancellation-policy"
            element={<Cancellation/>}
          />
          <Route
            path="/terms-and-conditions"
            element={<MerchantTermsAndConditions />}
          />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthLayout />}>
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />
              <Route
                path="/account"
                element={<Account />}
              />

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
                path="/customers"
                element={<Customers restId={restId} />}
              />
              <Route
                path="/settings"
                element={<Settings restId={restId} />}
              />
              <Route
                path="/merchant-app"
                element={<MerchantApp />}
              />
            </Route>
          </Route>
        </Routes>
      </Suspense>

      <Toaster richColors position="top-center" />
    </>
  );
}

export default App;