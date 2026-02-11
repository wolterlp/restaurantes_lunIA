import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Auth, Orders, Tables, Menu, Dashboard, Users, Settings, Reports } from "./pages";
import Header from "./components/shared/Header";
import ResponsiveLayout from "./components/shared/ResponsiveLayout";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader"
import LicenseLock from "./components/shared/LicenseLock";
import { useEffect } from "react";
import socket from "./socket";
import { useSnackbar } from "notistack";
import logoLunia from "./assets/images/branding/logolunia.png";
import SoundNotifications from "./components/shared/SoundNotifications";

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const hideHeaderRoutes = ["/auth"];
  const { isAuth, role } = useSelector(state => state.user);
  const { enqueueSnackbar } = useSnackbar();

  if(isLoading) return <FullScreenLoader />

  return (
    <>
      <LicenseLock />
      <SoundNotifications />
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ResponsiveLayout requiredRole="Admin">
              <Home />
            </ResponsiveLayout>
          }
        />
        <Route path="/auth" element={isAuth ? (role === "Admin" ? <Navigate to="/" /> : role === "Waiter" ? <Navigate to="/orders" /> : <Navigate to="/orders" />) : <Auth />} />
        <Route
          path="/orders"
          element={
            <ResponsiveLayout>
              <Orders />
            </ResponsiveLayout>
          }
        />
        <Route
          path="/tables"
          element={
            <ResponsiveLayout>
              <Tables />
            </ResponsiveLayout>
          }
        />
        <Route
          path="/menu"
          element={
            <ResponsiveLayout>
              <Menu />
            </ResponsiveLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ResponsiveLayout requiredRole="Cashier">
              <Dashboard />
            </ResponsiveLayout>
          }
        />
         <Route
          path="/users"
          element={
            <ResponsiveLayout requiredRole="Admin">
              <Users />
            </ResponsiveLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ResponsiveLayout requiredRole="Admin">
              <Settings />
            </ResponsiveLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <ResponsiveLayout requiredRole="Admin">
              <Reports />
            </ResponsiveLayout>
          }
        />
        <Route path="*" element={<div>No Encontrado</div>} />
      </Routes>
    </>
  );
}

function ProtectedRoutes({ children, allowedRoles }) {
  const { isAuth, role } = useSelector((state) => state.user);
  
  if (!isAuth) {
    return <Navigate to="/auth" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const redirectTo = role === "Admin" ? "/" : "/orders";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
