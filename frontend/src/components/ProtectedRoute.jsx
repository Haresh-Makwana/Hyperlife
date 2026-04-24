import { Navigate } from "react-router-dom";
import { getToken } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token) {
    // ✅ Send to 3D auth page
    return <Navigate to="/" replace />;
  }

  return children;
}
