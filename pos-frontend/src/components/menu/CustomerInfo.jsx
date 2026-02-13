import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { formatDate, getAvatarName } from "../../utils";
import Modal from "../shared/Modal";
import { setCustomer } from "../../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";

const CustomerInfo = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const customerData = useSelector((state) => state.customer);
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [guests, setGuests] = useState(1);
  const [orderType, setOrderType] = useState("Dine-In");
  const [deliveryAddress, setDeliveryAddress] = useState("");

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

  const handleOpenModal = () => {
      setName(customerData.customerName || "");
      setPhone(customerData.customerPhone || "");
      setGuests(customerData.guests || 1);
      setOrderType(customerData.orderType || "Dine-In");
      setDeliveryAddress(customerData.deliveryAddress || "");
      setIsModalOpen(true);
  };

  const handleSaveCustomer = () => {
      if(!name.trim()) {
          enqueueSnackbar("El nombre es requerido", { variant: "warning" });
          return;
      }
      if (orderType === "Delivery" && !deliveryAddress.trim()) {
          enqueueSnackbar("La dirección de entrega es requerida", { variant: "warning" });
          return;
      }
      dispatch(setCustomer({
          name,
          phone: phone ? `${countryCode} ${phone}` : "",
          guests: orderType === "Dine-In" ? guests : 0,
          orderType,
          deliveryAddress: orderType === "Delivery" ? deliveryAddress : ""
      }));
      setIsModalOpen(false);
      enqueueSnackbar("Información del cliente actualizada", { variant: "success" });
  };

  return (
    <>
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex flex-col items-start">
        <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
          {customerData.customerName || "Nombre del Cliente"}
        </h1>
        <p className="text-xs text-[#ababab] font-medium">
          #{customerData.orderId || "N/A"} / {customerData.orderType === "Delivery" ? "Domicilio" : customerData.orderType === "Takeaway" ? "Para Llevar" : "Comer aquí"}
        </p>
        <p className="text-xs text-[#ababab] font-medium">
          {formatDate(dateTime)}
        </p>
      </div>
      <button 
        onClick={handleOpenModal}
        className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg hover:brightness-110 transition-all"
        title="Editar Información del Cliente"
      >
        {getAvatarName(customerData.customerName) || "CN"}
      </button>
    </div>

    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Información del Cliente">
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

        <div className="space-y-4">
            <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre del Cliente</label>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#383838]">
                    <input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        type="text" 
                        placeholder="Ingrese nombre" 
                        className="bg-transparent flex-1 text-white focus:outline-none"  
                    />
                </div>
            </div>
            
            {orderType === "Dine-In" && (
                <div>
                    <label className="block text-[#ababab] mb-2 text-sm font-medium">Invitados</label>
                    <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg border border-[#383838]">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="text-yellow-500 text-2xl font-bold">&minus;</button>
                        <span className="text-white font-medium">{guests} Persona(s)</span>
                        <button onClick={() => setGuests(Math.min(20, guests + 1))} className="text-yellow-500 text-2xl font-bold">&#43;</button>
                    </div>
                </div>
            )}

            {orderType === "Delivery" && (
                <div>
                    <label className="block text-[#ababab] mb-2 text-sm font-medium">Dirección de Entrega</label>
                    <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#383838]">
                        <textarea 
                            value={deliveryAddress} 
                            onChange={(e) => setDeliveryAddress(e.target.value)} 
                            placeholder="Ingrese la dirección completa..." 
                            className="bg-transparent flex-1 text-white focus:outline-none resize-none h-20"
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Teléfono del Cliente</label>
                <div className="flex gap-2">
                    <div className="flex items-center rounded-lg bg-[#1f1f1f] border border-[#383838] w-24">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="bg-transparent w-full p-2 text-white outline-none appearance-none text-center cursor-pointer text-sm"
                        >
                            {countryCodes.map((c) => (
                                <option key={c.code} value={c.code} className="bg-[#1f1f1f]">
                                    {c.code}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#383838] flex-1">
                        <input 
                            value={phone.replace(countryCode, "").trim()} 
                            onChange={(e) => setPhone(e.target.value)} 
                            type="text" 
                            placeholder="Teléfono" 
                            className="bg-transparent flex-1 text-white focus:outline-none"  
                        />
                    </div>
                </div>
            </div>
        </div>

        <button 
            onClick={handleSaveCustomer}
            className="w-full bg-[#F6B100] text-[#1f1f1f] font-bold rounded-lg py-3 mt-8 hover:brightness-110 transition-all uppercase tracking-wider"
        >
            Guardar Cambios
        </button>
    </Modal>
    </>
  );
};

export default CustomerInfo;
