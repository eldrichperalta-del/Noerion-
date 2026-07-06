import { Routes, Route, Navigate } from "react-router-dom";

/* Public Pages */
import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import Loading from "./pages/loading/Loading";
import Privacy from "./pages/privacy/Privacy";

/* Route Groups */
import AdminRoutes from "./routes/AdminRoutes";
import AssessorRoutes from "./routes/AssessorRoutes";
import TraineeRoutes from "./routes/TraineeRoutes";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/loading" element={<Loading />} />
      <Route path="/privacy" element={<Privacy />} />

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