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
      setIsModalOpen(true);
  };

  const handleSaveCustomer = () => {
      if(!name.trim()) {
          enqueueSnackbar("El nombre es requerido", { variant: "warning" });
          return;
      }
      dispatch(setCustomer({
          name,
          phone: phone ? `${countryCode} ${phone}` : "",
          guests
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
          #{customerData.orderId || "N/A"} / Comer aquí
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

            <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Teléfono</label>
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
                    <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] border border-[#383838] flex-1">
                        <input 
                            value={phone} 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) setPhone(val);
                            }}
                            type="text" 
                            placeholder="Número de teléfono" 
                            className="bg-transparent flex-1 text-white focus:outline-none"  
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">Invitados</label>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-4 py-3 rounded-lg border border-[#383838]">
                    <button 
                        onClick={() => setGuests(prev => Math.max(1, prev - 1))} 
                        className="text-[#f6b100] text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-[#333] rounded"
                    >
                        &minus;
                    </button>
                    <span className="text-white font-medium">{guests} Persona(s)</span>
                    <button 
                        onClick={() => setGuests(prev => prev + 1)} 
                        className="text-[#f6b100] text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-[#333] rounded"
                    >
                        &#43;
                    </button>
                </div>
            </div>

            <button 
                onClick={handleSaveCustomer} 
                className="w-full bg-[#f6b100] text-[#1f1f1f] rounded-lg py-3 mt-4 font-bold hover:brightness-110 transition-all"
            >
                Guardar Información
            </button>
        </div>
    </Modal>
    </>
  );
};

export default CustomerInfo;
