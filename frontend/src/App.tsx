import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

export function App() {
  const auth = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage auth={auth} />} />
      <Route
        path="/"
        element={auth.isAuthenticated ? <DashboardPage auth={auth} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
