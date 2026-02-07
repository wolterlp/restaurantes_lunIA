import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Auth, Orders, Tables, Menu, Dashboard, Users, Settings } from "./pages";
import Header from "./components/shared/Header";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader"
import { useEffect } from "react";
import socket from "./socket";
import { useSnackbar } from "notistack";
import logoLunia from "./assets/images/logolunia.png";
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
      <SoundNotifications />
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes allowedRoles={["Admin"]}>
              <Home />
            </ProtectedRoutes>
          }
        />
        <Route path="/auth" element={isAuth ? (role === "Admin" ? <Navigate to="/" /> : role === "Waiter" ? <Navigate to="/orders" /> : <Navigate to="/orders" />) : <Auth />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoutes allowedRoles={["Admin", "Waiter", "Kitchen", "Cashier"]}>
              <Orders />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoutes allowedRoles={["Admin", "Waiter"]}>
              <Tables />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoutes allowedRoles={["Admin", "Waiter"]}>
              <Menu />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoutes allowedRoles={["Admin", "Cashier"]}>
              <Dashboard />
            </ProtectedRoutes>
          }
        />
         <Route
          path="/users"
          element={
            <ProtectedRoutes allowedRoles={["Admin"]}>
              <Users />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoutes allowedRoles={["Admin"]}>
              <Settings />
            </ProtectedRoutes>
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
    return <div className="text-white text-center mt-20">No tienes permisos para acceder a esta página.</div>;
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
