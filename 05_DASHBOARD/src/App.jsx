import { Routes, Route, Navigate } from "react-router-dom";

/* =========================
   Public Pages
========================= */

import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import Registration from "./pages/registration/Registration";
import Loading from "./pages/loading/Loading";
import Privacy from "./pages/privacy/Privacy";
import CertificateVerification from "./pages/verification/CertificateVerification";
import CertificateSearch from "./pages/verification/CertificateSearch";

/* =========================
   Route Groups
========================= */

import AdminRoutes from "./routes/AdminRoutes";
import AssessorRoutes from "./routes/AssessorRoutes";
import TraineeRoutes from "./routes/TraineeRoutes";

function App() {
  return (
    <Routes>
<<<<<<< HEAD
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Registration />} />
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
=======
      {/* =========================
          Public Routes
      ========================= */}
>>>>>>> AC_BRANCH

      <Route
        path="/"
        element={<Landing />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Registration />}
      />

      <Route
        path="/loading"
        element={<Loading />}
      />

      <Route
        path="/privacy"
        element={<Privacy />}
      />

      <Route
        path="/verify-certificate/:certificateId?"
        element={<CertificateVerification />}
      />

      <Route
        path="/certificate-verification"
        element={<CertificateSearch />}
      />

      {/* =========================
          Dashboard Route Groups
      ========================= */}

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/*"
        element={<AdminRoutes />}
      />

      {/* ASSESSOR ROUTES */}
      <Route
        path="/assessor/*"
        element={<AssessorRoutes />}
      />

      {/* TRAINEE ROUTES */}
      <Route
        path="/trainee/*"
        element={<TraineeRoutes />}
      />

      {/* =========================
          Catch-All Route
      ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;