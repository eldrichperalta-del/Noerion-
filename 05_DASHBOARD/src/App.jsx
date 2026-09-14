import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

/* Public Pages */
import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import SetPassword from "./pages/login/SetPassword";
import Registration from "./pages/registration/Registration";
import Loading from "./pages/loading/Loading";
import Privacy from "./pages/privacy/Privacy";
import CertificateVerification from "./pages/verification/CertificateVerification";
import CertificateSearch from "./pages/verification/CertificateSearch";

/* Route Groups */
import AdminRoutes from "./routes/AdminRoutes";
import AssessorRoutes from "./routes/AssessorRoutes";
import TraineeRoutes from "./routes/TraineeRoutes";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Detect Supabase invitation or recovery tokens in URL hash fragment or query params
    const hash = window.location.hash;
    const search = window.location.search;

    const hasToken =
      (hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("access_token="))) ||
      (search && (search.includes("type=invite") || search.includes("code=")));

    if (hasToken && location.pathname !== "/set-password") {
      // Preserve the entire token payload (hash + search) during navigation
      navigate(`/set-password${search}${hash}`, { replace: true });
    }
  }, [navigate, location]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Registration />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/verify-certificate/:certificateId?" element={<CertificateVerification />} />
      <Route
        path="/verify/:certificateId"
        element={<CertificateVerification />}
      />

      <Route
        path="/certificate-verification"
        element={<CertificateSearch />}
      />

      {/* Dashboards */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/assessor/*" element={<AssessorRoutes />} />
      <Route path="/trainee/*" element={<TraineeRoutes />} />

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;