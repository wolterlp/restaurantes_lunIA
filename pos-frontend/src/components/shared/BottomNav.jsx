import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";
import { useDispatch, useSelector } from "react-redux";
import { setCustomer } from "../../redux/slices/customerSlice";
import { useSnackbar } from "notistack";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState("Dine-In");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  
  const { role, permissions } = useSelector(state => state.user);

  const countryCodes = [
    { code: "+1", country: "US/CA" },
    { code: "+52", country: "MX" },
    { code: "+57", country: "CO" },
    { code: "+34", country: "ES" },
    { code: "+54", country: "AR" },
    { code: "+56", country: "CL" },
    { code: "+51", country: "PE" },
    { code: "+593", country: "EC" },
    { code: "+58", country: "VE" },
    { code: "+503", country: "SV" },
    { code: "+502", country: "GT" },
    { code: "+504", country: "HN" },
    { code: "+505", country: "NI" },
    { code: "+506", country: "CR" },
    { code: "+507", country: "PA" },
    { code: "+591", country: "BO" },
    { code: "+595", country: "PY" },
    { code: "+598", country: "UY" },
    { code: "+86", country: "CN" },
    { code: "+91", country: "IN" },
  ];

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Helper to check permission or role (fallback)
  const canManageOrders = permissions?.includes("MANAGE_ORDERS") || role === "Waiter" || role === "Admin";
  const canManageTables = permissions?.includes("MANAGE_ORDERS") || role === "Admin" || role === "Waiter"; // Tables usually go with orders
  const canSeeMore = role === "Admin" || role === "Cashier"; // Keep this restricted for now unless permission added

  const increment = () => {
    if(guestCount >= 6) return;
    setGuestCount((prev) => prev + 1);
  }
  const decrement = () => {
    if(guestCount <= 0) return;
    setGuestCount((prev) => prev - 1);
  }

  const isActive = (path) => location.pathname === path;

  const handleCreateOrder = () => {
    if (!name) {
      enqueueSnackbar("¡Por favor ingrese el nombre del cliente!", { variant: "warning" });
      return;
    }

    if (orderType === "Delivery" && !deliveryAddress) {
      enqueueSnackbar("¡Por favor ingrese la dirección de entrega!", { variant: "warning" });
      return;
    }

    // send the data to store
    // Combine country code and phone if phone is provided
    const fullPhone = phone ? `${countryCode} ${phone}` : "";
    dispatch(setCustomer({
      name, 
      phone: fullPhone, 
      guests: orderType === "Dine-In" ? guestCount : 0,
      orderType,
      deliveryAddress: orderType === "Delivery" ? deliveryAddress : ""
    }));

    if (orderType === "Delivery" || orderType === "Takeaway") {
      navigate("/menu");
    } else {
      navigate("/tables");
    }
    
    // Reset fields
    setName("");
    setPhone("");
    setGuestCount(0);
    setDeliveryAddress("");
    setOrderType("Dine-In");
    closeModal();
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] h-16 flex items-center justify-between gap-2 px-2 sm:px-4">
      {(role === "Admin") && (
        <button
          onClick={() => navigate("/")}
          className={`flex items-center justify-center font-semibold ${
            isActive("/") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } flex-1 min-w-[90px] rounded-[20px] py-2 px-3 text-sm sm:text-base`}
        >
          <FaHome className="inline mr-2" size={20} /> <p>Inicio</p>
        </button>
      )}
      
      <button
        onClick={() => navigate("/orders")}
        className={`flex items-center justify-center font-semibold ${
          isActive("/orders") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
        } flex-1 min-w-[90px] rounded-[20px] py-2 px-3 text-sm sm:text-base`}
      >
        <MdOutlineReorder className="inline mr-2" size={20} /> <p>Pedidos</p>
      </button>

      {(canManageTables) && (
        <button
          onClick={() => navigate("/tables")}
          className={`flex items-center justify-center font-semibold ${
            isActive("/tables") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } flex-1 min-w-[90px] rounded-[20px] py-2 px-3 text-sm sm:text-base`}
        >
          <MdTableBar className="inline mr-2" size={20} /> <p>Mesas</p>
        </button>
      )}

      {(canManageOrders) && (
        <button
            disabled={isActive("/tables") || isActive("/menu")}
            onClick={openModal}
            className="absolute bottom-12 bg-[#F6B100] text-[#1f1f1f] rounded-full p-3 items-center shadow-md left-1/2 -translate-x-1/2"
        >
            <BiSolidDish size={28} className="sm:size-[32px]" />
        </button>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Crear Pedido">
        <div className="flex gap-2 mb-4 bg-[#1f1f1f] p-1 rounded-lg">
          <button 
            onClick={() => setOrderType("Dine-In")}
            className={`flex-1 py-2 rounded-md transition-colors ${orderType === "Dine-In" ? "bg-[#F6B100] text-[#1f1f1f] font-bold" : "text-[#ababab] hover:text-white"}`}
          >
            Para Mesa
          </button>
          <button 
            onClick={() => setOrderType("Takeaway")}
            className={`flex-1 py-2 rounded-md transition-colors ${orderType === "Takeaway" ? "bg-[#F6B100] text-[#1f1f1f] font-bold" : "text-[#ababab] hover:text-white"}`}
          >
            Para Llevar
          </button>
          <button 
            onClick={() => setOrderType("Delivery")}
            className={`flex-1 py-2 rounded-md transition-colors ${orderType === "Delivery" ? "bg-[#F6B100] text-[#1f1f1f] font-bold" : "text-[#ababab] hover:text-white"}`}
          >
            Domicilio
          </button>
        </div>

        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre del Cliente</label>
          <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
            <input value={name} onChange={(e) => setName(e.target.value)} type="text" name="" placeholder="Ingrese nombre del cliente" id="" className="bg-transparent flex-1 text-white focus:outline-none"  />
          </div>
        </div>
        <div>
          <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">Teléfono del Cliente</label>
          <div className="flex gap-2">
            <div className="flex items-center rounded-lg bg-[#1f1f1f] border border-[#383838] w-28">
                 <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent w-full p-3 text-white outline-none appearance-none text-center cursor-pointer"
                  >
                    {countryCodes.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#1f1f1f]">
                            {c.code} {c.country}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] flex-1">
              <input 
                value={phone} 
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                        setPhone(val);
                    }
                }}
                type="text" 
                placeholder="Teléfono (solo números)" 
                className="bg-transparent flex-1 text-white focus:outline-none"  
              />
            </div>
          </div>
        </div>

        {orderType === "Dine-In" ? (
          <div>
            <label className="block mb-2 mt-3 text-sm font-medium text-[#ababab]">Invitados</label>
            <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg">
              <button onClick={decrement} className="text-yellow-500 text-2xl">&minus;</button>
              <span className="text-white">{guestCount} Persona(s)</span>
              <button onClick={increment} className="text-yellow-500 text-2xl">&#43;</button>
            </div>
          </div>
        ) : orderType === "Delivery" ? (
          <div>
            <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">Dirección de Entrega</label>
            <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
              <textarea 
                value={deliveryAddress} 
                onChange={(e) => setDeliveryAddress(e.target.value)} 
                placeholder="Ingrese la dirección completa..." 
                className="bg-transparent flex-1 text-white focus:outline-none resize-none h-20"
              />
            </div>
          </div>
        ) : null}
        <button onClick={handleCreateOrder} className="w-full bg-[#F6B100] text-[#f5f5f5] rounded-lg py-3 mt-8 hover:bg-yellow-700 font-bold uppercase tracking-wider">
          {orderType === "Dine-In" ? "Continuar a Mesas" : "Continuar al Menú"}
        </button>
      </Modal>
    </div>
  );
};

export default BottomNav;
