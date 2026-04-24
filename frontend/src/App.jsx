import { Routes, Route, useLocation } from "react-router-dom";

// ✅ Import Layout Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// ✅ Import Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TestUniverse from "./pages/TestUniverse";
import TestPlanet from "./pages/TestPlanet";
import Universe3D from "./pages/Universe3D";
import AddActivity from "./pages/AddActivity";
import EditActivity from "./pages/EditActivity";
import ThreeDashboard from "./pages/ThreeDashboard";
import Habits from "./pages/Habits";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Arsenal from './pages/Arsenal';
import NeuralGrid from './pages/NeuralGrid';
import Colosseum from './pages/Colosseum';
import CaptainsLog from './pages/CaptainsLog';
import ForgotPassword from "./pages/ForgotPassword";
import Checkout from './pages/Checkout';

// 🚀 Import the Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";

export default function App() {
  const location = useLocation();
  
  // 🔍 Check current URL routes
  const isAdminPage = location.pathname.startsWith("/admin");
  
  // 🚀 THE FIX: Detect full-screen 3D immersive pages
  const isUniversePage = location.pathname.startsWith("/universe-3d") || 
                         location.pathname.startsWith("/test-universe") || 
                         location.pathname.startsWith("/test-planet");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      
      {/* 🌌 Hide Header ONLY on Admin Page */}
      {!isAdminPage && <Header />}

      {/* 🚀 Main Content Area */}
      <main style={{ flex: 1, paddingTop: isAdminPage ? "0px" : "70px" }}>
        <Routes>
          {/* ✅ Landing Page */}
          <Route path="/" element={<Home />} />

          {/* ✅ Auth Pages */}
          <Route path="/login" element={<ThreeDashboard />} />
          <Route path="/register" element={<ThreeDashboard />} />

          {/* 👑 DEDICATED ADMIN ROUTES */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* ✅ Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ✅ Protected Activity Routes */}
          <Route
            path="/add-activity"
            element={
              <ProtectedRoute>
                <AddActivity />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-activity/:id"
            element={
              <ProtectedRoute>
                <EditActivity />
              </ProtectedRoute>
            }
          />

          {/* ✅ 3D Universe Routes */}
          <Route
            path="/test-universe"
            element={
              <ProtectedRoute>
                <TestUniverse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/test-planet"
            element={
              <ProtectedRoute>
                <TestPlanet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/universe-3d"
            element={
              <ProtectedRoute>
                <Universe3D />
              </ProtectedRoute>
            }
          />

          <Route
            path="/habits"
            element={
              <ProtectedRoute>
                <Habits />
              </ProtectedRoute>
            }
          />

          {/* ✅ Public Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/arsenal" element={<Arsenal />} />
          <Route path="/neural-grid" element={<NeuralGrid />} />
          <Route path="/colosseum" element={<Colosseum />} />
          <Route path="/captains-log" element={<CaptainsLog />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/checkout" element={<Checkout />} />
          
        </Routes>
      </main>

      {/* 🌍 THE FIX: Hide Footer on Admin Pages AND Full-Screen 3D Universe Pages */}
      {!isAdminPage && !isUniversePage && <Footer />}
      
    </div>
  );
}