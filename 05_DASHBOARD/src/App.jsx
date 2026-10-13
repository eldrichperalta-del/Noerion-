import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { supabase } from "./supabaseClient.js";

/* Public Pages */
import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import SetPassword from "./pages/login/SetPassword";
import Registration from "./pages/registration/Registration";
import Loading from "./pages/loading/Loading";
import Privacy from "./pages/privacy/Privacy";
import AssessorPrivacy from "./pages/privacy/AssessorPrivacy";
import CertificateVerification from "./pages/verification/CertificateVerification";
import CertificateSearch from "./pages/verification/CertificateSearch";

/* Route Groups */
import AdminRoutes from "./routes/AdminRoutes";
import AssessorRoutes from "./routes/AssessorRoutes";
import TraineeRoutes from "./routes/TraineeRoutes";

/**
 * RootRoute
 *
 * When a user opens NOERION at "/":
 * - Existing session: restore the authentication routing flow.
 * - No existing session: show the landing page.
 *
 * Loading.jsx remains responsible for resolving the user's role
 * and checking Assessor/Trainee privacy consent.
 */
function RootRoute() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Do not interfere with invitation or password-recovery links.
        const hash = window.location.hash;
        const search = window.location.search;

        const hasAuthToken =
          (hash &&
            (hash.includes("type=invite") ||
              hash.includes("type=recovery") ||
              hash.includes("access_token="))) ||
          (search &&
            (search.includes("type=invite") ||
              search.includes("type=recovery") ||
              search.includes("code=")));

        if (hasAuthToken) {
          if (isMounted) {
            setCheckingSession(false);
          }
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        if (session) {
          // Loading.jsx determines the correct role-based destination.
          navigate("/loading", { replace: true });
          return;
        }

        setCheckingSession(false);
      } catch (error) {
        console.error("Root session check failed:", error);

        if (isMounted) {
          // Do not redirect to login solely because session lookup failed.
          setCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef4f8]">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700"
          role="status"
          aria-label="Restoring session"
        />
      </main>
    );
  }

  return <Landing />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Preserve the existing Supabase invitation/recovery handling.
    const hash = window.location.hash;
    const search = window.location.search;

    const hasToken =
      (hash &&
        (hash.includes("type=invite") ||
          hash.includes("type=recovery") ||
          hash.includes("access_token="))) ||
      (search &&
        (search.includes("type=invite") ||
          search.includes("type=recovery") ||
          search.includes("code=")));

    if (hasToken && location.pathname !== "/set-password") {
      navigate(`/set-password${search}${hash}`, {
        replace: true,
      });
    }
  }, [navigate, location]);

  return (
    <Routes>
      {/* Root: restore an existing session before showing Landing */}
      <Route path="/" element={<RootRoute />} />

      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Registration />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/assessor-privacy"
        element={<AssessorPrivacy />}
      />

      {/* Certificate Verification */}
      <Route
        path="/verify-certificate/:certificateId?"
        element={<CertificateVerification />}
      />
      <Route
        path="/verify/:certificateId"
        element={<CertificateVerification />}
      />
      <Route
        path="/certificate-verification"
        element={<CertificateSearch />}
      />

      {/* Role-Based Dashboards */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/assessor/*" element={<AssessorRoutes />} />
      <Route path="/trainee/*" element={<TraineeRoutes />} />

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
