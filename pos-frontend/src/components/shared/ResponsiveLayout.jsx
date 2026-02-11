import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";

const ResponsiveLayout = ({ children, requiredRole = null }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { role } = useSelector((state) => state.user);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  
  // Check if user has required role
  const hasRequiredRole = !requiredRole || role === requiredRole || role === "Admin";
  
  // Check if view is restricted to large screens only
  const isRestrictedToLargeScreens = requiredRole === "Admin" || requiredRole === "Cashier";
  
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    if (!hasRequiredRole) {
      enqueueSnackbar("No tienes permisos para acceder a esta vista", { variant: "error" });
      navigate("/orders");
      return;
    }
    
    if (isRestrictedToLargeScreens && !isLargeScreen) {
      enqueueSnackbar("Esta vista solo está disponible en tablets o pantallas más grandes", { variant: "warning" });
      navigate("/orders");
      return;
    }
  }, [hasRequiredRole, isRestrictedToLargeScreens, isLargeScreen, navigate, enqueueSnackbar]);
  
  // Don't render if user doesn't have permission or screen is too small for restricted views
  if (!hasRequiredRole || (isRestrictedToLargeScreens && !isLargeScreen)) {
    return null;
  }
  
  return (
    <div className={`${!isLargeScreen ? 'mobile-layout' : ''}`}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;