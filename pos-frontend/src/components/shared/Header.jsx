import React, { useState, useEffect } from "react";
import { FaSearch, FaEllipsisH } from "react-icons/fa";
import { FaUserFriends, FaChartBar, FaUserCircle } from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import logo from "../../assets/images/branding/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation, useQuery } from "@tanstack/react-query";
import { logout, getOrders, getTables } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import logoLunia from "../../assets/images/branding/logolunia.png";
import { keepPreviousData } from "@tanstack/react-query";

const Header = () => {
  const { theme } = useTheme();
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showLogoMenu, setShowLogoMenu] = useState(false);

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
      navigate("/orders");
    } else {
      navigate("/orders");
    }
  };

  // Fetch orders for search functionality
  const { data: ordersData } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  // Fetch tables for search functionality
  const { data: tablesData } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const searchTermLower = value.toLowerCase();
    const results = [];

    // Buscar en pedidos
    if (ordersData?.data?.data) {
      ordersData.data.data.forEach(order => {
        const orderIdMatch = order._id?.toLowerCase().includes(searchTermLower);
        const customerMatch = order.customerDetails?.name?.toLowerCase().includes(searchTermLower);
        const tableMatch = order.table?.tableNo?.toString().includes(searchTermLower);
        
        if (orderIdMatch || customerMatch || tableMatch) {
          results.push({
            type: 'order',
            id: order._id,
            title: `Pedido ${order._id?.slice(-6)}`,
            subtitle: `${order.customerDetails?.name || 'Cliente'} - Mesa ${order.table?.tableNo || 'N/A'}`,
            data: order
          });
        }
      });
    }

    // Buscar en mesas
    if (tablesData?.data?.data) {
      tablesData.data.data.forEach(table => {
        const tableNameMatch = table.name?.toLowerCase().includes(searchTermLower);
        const tableNoMatch = table.tableNo?.toString().includes(searchTermLower);
        
        if (tableNameMatch || tableNoMatch) {
          results.push({
            type: 'table',
            id: table._id,
            title: `Mesa ${table.tableNo}`,
            subtitle: table.status === 'Booked' ? 'Ocupada' : 'Disponible',
            data: table
          });
        }
      });
    }

    setSearchResults(results.slice(0, 5)); // Limitar a 5 resultados
    setShowResults(results.length > 0);
  };

  const handleResultClick = (result) => {
    if (result.type === 'order') {
      navigate(`/orders`);
      // Esperar un momento para que la navegación complete y luego filtrar
      setTimeout(() => {
        // Usar el estado global o localStorage para pasar el filtro
        localStorage.setItem('searchFilter', JSON.stringify({
          type: 'order',
          value: result.id,
          customerName: result.data.customerDetails?.name,
          tableNo: result.data.table?.tableNo
        }));
        window.dispatchEvent(new Event('searchFilterUpdated'));
      }, 100);
    } else if (result.type === 'table') {
      navigate(`/tables`);
      setTimeout(() => {
        localStorage.setItem('searchFilter', JSON.stringify({
          type: 'table',
          value: result.id, // Usar el _id para que coincida con TableCard
          tableName: result.data.name
        }));
        window.dispatchEvent(new Event('searchFilterUpdated'));
      }, 100);
    }
    
    setShowResults(false);
    setSearchTerm('');
  };

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResults && !event.target.closest('.search-container')) {
        setShowResults(false);
      }
      if (showLogoMenu && !event.target.closest('.logo-menu-container')) {
        setShowLogoMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResults, showLogoMenu]);

  return (
    <header className="flex justify-between items-center py-3 px-4 md:px-8 bg-[#1a1a1a] relative" style={{ backgroundColor: theme?.secondaryColor }}>
      {/* LOGO AND MENU */}
      <div className="flex items-center gap-4">
        <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer min-w-max">
          {theme?.logo ? (
              <img src={theme.logo} className="h-8 w-8 md:h-10 md:w-10 object-cover rounded-full border border-[#3a3a3a]" alt="Restaurant Logo" />
          ) : (
              <img src={logo} className="h-6 w-6 md:h-8 md:w-8" alt="lunia logo" />
          )}
          <h1 className="hidden sm:block text-sm md:text-lg font-semibold text-[#f5f5f5] tracking-wide whitespace-nowrap">
            {theme?.name || "LunIA"}
          </h1>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative flex items-center gap-2 md:gap-4 bg-[#1f1f1f] rounded-[15px] px-3 md:px-5 py-2 w-full max-w-[180px] md:max-w-[500px] border border-transparent focus-within:border-[#ecab0f] search-container mx-2">
        <FaSearch className="text-[#f5f5f5] text-sm md:text-base" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full text-xs md:text-base"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
        />
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] rounded-lg shadow-lg border border-[#3a3a3a] z-50 max-h-64 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={`${result.type}-${result.id}-${index}`}
                className="px-4 py-3 hover:bg-[#3a3a3a] cursor-pointer border-b border-[#3a3a3a] last:border-b-0"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[#f5f5f5] font-semibold text-sm">
                      {result.title}
                    </div>
                    <div className="text-[#ababab] text-xs mt-1">
                      {result.subtitle}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    result.type === 'order' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                  }`}>
                    {result.type === 'order' ? 'PEDIDO' : 'MESA'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOGGED USER DETAILS */}
      <div className="flex items-center gap-2 md:gap-4 relative logo-menu-container">
        
        {/* LUNIA DEVELOPER LOGO (Trigger Menu) */}
        <div 
          onClick={() => setShowLogoMenu(!showLogoMenu)} 
          className="rounded-full select-none flex items-center justify-center w-10 h-10 md:w-14 md:h-14 overflow-hidden shadow-md cursor-pointer hover:ring-2 hover:ring-[#ecab0f] transition-all" 
          title="Menú de opciones"
        >
            <img src={logoLunia} alt="LunIA" className="h-full w-full object-cover" />
        </div>

        {/* Logo Dropdown Menu (Positioned near Lunia Logo) */}
        {showLogoMenu && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-[#2a2a2a] rounded-xl shadow-2xl border border-[#3a3a3a] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 flex flex-col gap-1">
              {userData.role === "Admin" && (
                <>
                  <button 
                    onClick={() => { navigate("/reports"); setShowLogoMenu(false); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-[#3a3a3a] text-[#f5f5f5] rounded-lg transition-colors"
                  >
                    <div className="bg-[#1f1f1f] p-2 rounded-lg">
                      <FaChartBar className="text-xl" />
                    </div>
                    <span className="font-medium">Informes</span>
                  </button>

                  <button 
                    onClick={() => { navigate("/users"); setShowLogoMenu(false); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-[#3a3a3a] text-[#f5f5f5] rounded-lg transition-colors"
                  >
                    <div className="bg-[#1f1f1f] p-2 rounded-lg">
                      <FaUserFriends className="text-xl" />
                    </div>
                    <span className="font-medium">Usuarios</span>
                  </button>

                  <button 
                    onClick={() => { navigate("/settings"); setShowLogoMenu(false); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-[#3a3a3a] text-[#f5f5f5] rounded-lg transition-colors"
                  >
                    <div className="bg-[#1f1f1f] p-2 rounded-lg">
                      <FaCog className="text-xl" />
                    </div>
                    <span className="font-medium">Configuración</span>
                  </button>

                  <button 
                    onClick={() => { navigate("/dashboard"); setShowLogoMenu(false); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-[#3a3a3a] text-[#f5f5f5] rounded-lg transition-colors"
                  >
                    <div className="bg-[#1f1f1f] p-2 rounded-lg">
                      <FaEllipsisH className="text-xl" />
                    </div>
                    <span className="font-medium">Más</span>
                  </button>
                </>
              )}

              <div className="h-px bg-[#3a3a3a] my-1 mx-2"></div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full p-3 hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
              >
                <div className="bg-[#1f1f1f] p-2 rounded-lg">
                  <IoLogOut className="text-xl" />
                </div>
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-3">
          <FaUserCircle className="text-[#f5f5f5] text-2xl md:text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-sm md:text-md text-[#f5f5f5] font-semibold tracking-wide">
              {userData.name || "USUARIO"}
            </h1>
            <p className="text-[10px] md:text-xs text-[#ababab] font-medium">
              {userData.role === "Waiter" ? "Mesero/a" : 
               userData.role === "Cashier" ? "Cajero/a" : 
               userData.role === "Kitchen" ? "Cocina" : 
               userData.role === "Delivery" ? "Repartidor/a" : 
               userData.role === "Admin" ? "Administrador" : 
               userData.role || "Rol"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
