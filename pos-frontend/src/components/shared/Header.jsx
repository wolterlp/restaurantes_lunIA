import React from "react";
import { FaSearch } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";
import { useTheme } from "../../context/ThemeContext";
import logoLunia from "../../assets/images/logolunia.png";

const Header = () => {
  const { theme } = useTheme();
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLogoClick = () => {
    if (userData.role === "Admin") {
      navigate("/");
    } else if (userData.role === "Waiter") {
      navigate("/tables");
    } else {
      navigate("/orders");
    }
  };

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]" style={{ backgroundColor: theme?.secondaryColor }}>
      {/* LOGO */}
      <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
        {theme?.logo ? (
            <img src={theme.logo} className="h-8 w-auto object-contain" alt="Restaurant Logo" />
        ) : (
            <img src={logo} className="h-8 w-8" alt="lunia logo" />
        )}
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
          {theme?.name || "LunIA"}
        </h1>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-[500px] border border-transparent focus-within:border-[#ecab0f]">
        <FaSearch className="text-[#f5f5f5]" />
        <input
          type="text"
          placeholder="Buscar"
          className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full"
        />
      </div>

      {/* LOGGED USER DETAILS */}
      <div className="flex items-center gap-4">
        
        {/* LUNIA DEVELOPER LOGO */}
        <div className="rounded-full select-none flex items-center justify-center w-14 h-14 overflow-hidden shadow-md" title="Desarrollado por LunIA">
            <img src={logoLunia} alt="LunIA" className="h-full w-full object-cover" />
        </div>

        {(userData.role === "Admin" || userData.role === "Cashier") && (
          <div onClick={() => navigate("/dashboard")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer hover:bg-[#2a2a2a]" title="Dashboard">
            <MdDashboard className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        
        {userData.role === "Admin" && (
           <div onClick={() => navigate("/users")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer hover:bg-[#2a2a2a]" title="Gestión de Usuarios">
            <FaUserCircle className="text-[#f5f5f5] text-2xl" />
          </div>
        )}

        {userData.role === "Admin" && (
           <div onClick={() => navigate("/settings")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer hover:bg-[#2a2a2a]" title="Configuración">
            <FaCog className="text-[#f5f5f5] text-2xl" />
          </div>
        )}

{/* Notification button removed */}
        <div className="flex items-center gap-3 cursor-pointer">
          <FaUserCircle className="text-[#f5f5f5] text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
              {userData.name || "USUARIO"}
            </h1>
            <p className="text-xs text-[#ababab] font-medium">
              {userData.role || "Rol"}
            </p>
          </div>
          <IoLogOut
            onClick={handleLogout}
            className="text-[#f5f5f5] ml-2 hover:text-red-500 transition-colors"
            size={40}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
