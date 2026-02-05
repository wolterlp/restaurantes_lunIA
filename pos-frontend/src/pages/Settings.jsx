import React, { useState, useEffect } from "react";
import BackButton from "../components/shared/BackButton";
import BottomNav from "../components/shared/BottomNav";
import { useTheme } from "../context/ThemeContext";
import { updateRestaurantConfig } from "../https";
import { enqueueSnackbar } from "notistack";

const Settings = () => {
  const { theme, refreshTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    primaryColor: "",
    secondaryColor: "",
    logo: "",
    backgroundImage: "",
    // Nuevas secciones
    billing: { electronicBilling: false, apiKey: "", endpoint: "" },
    customization: { ticketFooter: "", paymentMethods: "", taxRate: 0, currencySymbol: "$", welcomeMessage: "" },
    devices: { printerName: "", cashDrawerCode: "" }
  });

  useEffect(() => {
    if (theme) {
      setFormData({
        name: theme.name || "",
        primaryColor: theme.primaryColor || "#ecab0f",
        secondaryColor: theme.secondaryColor || "#1f1f1f",
        logo: theme.logo || "",
        backgroundImage: theme.backgroundImage || "",
        // Mapeo de nuevas secciones con valores por defecto seguros
        billing: { 
            electronicBilling: theme.billing?.electronicBilling || false, 
            apiKey: theme.billing?.apiKey || "", 
            endpoint: theme.billing?.endpoint || "" 
        },
        customization: { 
            ticketFooter: theme.customization?.ticketFooter || "", 
            paymentMethods: theme.customization?.paymentMethods?.join(", ") || "", 
            taxRate: theme.customization?.taxRate || 0, 
            currencySymbol: theme.customization?.currencySymbol || "$",
            welcomeMessage: theme.customization?.welcomeMessage || "Brinda tu mejor servicio a los clientes 😀"
        },
        devices: { 
            printerName: theme.devices?.printerName || "", 
            cashDrawerCode: theme.devices?.cashDrawerCode || "" 
        }
      });
    }
  }, [theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejo de campos anidados
    if (name.includes('.')) {
        const [section, field] = name.split('.');
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: type === 'checkbox' ? checked : value
            }
        }));
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleResetColors = () => {
    setFormData({
      ...formData,
      primaryColor: "#ecab0f",
      secondaryColor: "#1f1f1f",
    });
  };

  const handleResetColombia = () => {
    setFormData(prev => ({
        ...prev,
        customization: {
            ...prev.customization,
            ticketFooter: "Gracias por su compra - Propina voluntaria sugerida",
            paymentMethods: "Efectivo, Tarjeta Crédito, Tarjeta Débito, Nequi, Daviplata",
            taxRate: 19,
            currencySymbol: "$"
        }
    }));
    enqueueSnackbar("Configuración aplicada para Colombia", { variant: "info" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Preparar datos para envío (convertir string de paymentMethods a array)
      const dataToSend = {
          ...formData,
          customization: {
              ...formData.customization,
              paymentMethods: formData.customization.paymentMethods.split(',').map(m => m.trim()).filter(m => m !== "")
          }
      };

      await updateRestaurantConfig(dataToSend);
      await refreshTheme();
      enqueueSnackbar("Configuración actualizada con éxito", { variant: "success" });
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Error al actualizar la configuración", { variant: "error" });
    }
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
      <div className="flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Configuración del Restaurante
          </h1>
        </div>
      </div>

      <div className="px-10 py-4 overflow-y-auto h-full pb-20">
        <div className="bg-[#2a2a2a] p-6 rounded-lg max-w-2xl mx-auto border border-[#383838]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Restaurant Name */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 font-semibold">Nombre del Restaurante</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                placeholder="Ej. Mi Restaurante"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                   <label className="text-gray-300 font-semibold">Color Primario (Botones/Acentos)</label>
                   <button 
                    type="button"
                    onClick={handleResetColors}
                    className="text-xs bg-transparent border border-[#ecab0f] text-[#ecab0f] px-2 py-1 rounded hover:bg-[#ecab0f] hover:text-white transition-colors"
                   >
                    Restaurar defecto
                   </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] flex-1"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-gray-300 font-semibold">Color Secundario (Fondos/Paneles)</label>
                    <div className="invisible text-xs px-2 py-1 border border-transparent">Espacio</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Logo URL */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 font-semibold">Logo URL</label>
              <input
                type="text"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                placeholder="https://ejemplo.com/logo.png"
              />
              {formData.logo && (
                <img src={formData.logo} alt="Logo Preview" className="h-16 w-auto object-contain mt-2 bg-white/10 p-2 rounded" />
              )}
            </div>

            {/* Background Image URL */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-300 font-semibold">Imagen de Fondo (Login/Inicio)</label>
              <input
                type="text"
                name="backgroundImage"
                value={formData.backgroundImage}
                onChange={handleChange}
                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                placeholder="https://ejemplo.com/fondo.jpg"
              />
              {formData.backgroundImage && (
                <img src={formData.backgroundImage} alt="Background Preview" className="h-32 w-full object-cover mt-2 rounded border border-[#383838]" />
              )}
            </div>

            <hr className="border-[#383838] my-4" />

            {/* Facturación */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[#ecab0f] text-xl font-bold">Facturación Electrónica</h2>
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        name="billing.electronicBilling"
                        checked={formData.billing.electronicBilling}
                        onChange={handleChange}
                        className="w-5 h-5 accent-[#ecab0f]"
                    />
                    <label className="text-gray-300">Habilitar Facturación Electrónica</label>
                </div>
                {formData.billing.electronicBilling && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-300 font-semibold">API Key</label>
                            <input type="password" name="billing.apiKey" value={formData.billing.apiKey} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="Clave de API" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-300 font-semibold">Endpoint URL</label>
                            <input type="text" name="billing.endpoint" value={formData.billing.endpoint} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="https://api.facturacion.com" />
                        </div>
                    </div>
                )}
            </div>

            <hr className="border-[#383838] my-4" />

            {/* Personalización */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-[#ecab0f] text-xl font-bold">Personalización</h2>
                    <button 
                        type="button"
                        onClick={handleResetColombia}
                        className="text-xs bg-transparent border border-[#ecab0f] text-[#ecab0f] px-2 py-1 rounded hover:bg-[#ecab0f] hover:text-white transition-colors"
                    >
                        Aplicar Defaults Colombia
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-gray-300 font-semibold">Mensaje de Bienvenida (Máx 60 caracteres)</label>
                        <input 
                            type="text" 
                            name="customization.welcomeMessage" 
                            value={formData.customization.welcomeMessage} 
                            onChange={handleChange} 
                            maxLength={60}
                            className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" 
                            placeholder="Brinda tu mejor servicio a los clientes 😀" 
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Pie de Ticket</label>
                        <input type="text" name="customization.ticketFooter" value={formData.customization.ticketFooter} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="Gracias por su visita" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Símbolo de Moneda</label>
                        <input type="text" name="customization.currencySymbol" value={formData.customization.currencySymbol} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="$" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Impuesto (%)</label>
                        <input type="number" name="customization.taxRate" value={formData.customization.taxRate} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="0" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Formas de Pago (separadas por coma)</label>
                        <input type="text" name="customization.paymentMethods" value={formData.customization.paymentMethods} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="Efectivo, Tarjeta, Transferencia" />
                    </div>
                </div>
            </div>

            <hr className="border-[#383838] my-4" />

            {/* Dispositivos */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[#ecab0f] text-xl font-bold">Dispositivos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Nombre Impresora Tickets</label>
                        <input type="text" name="devices.printerName" value={formData.devices.printerName} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="EPSON-TM88" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Código Cajón de Dinero</label>
                        <input type="text" name="devices.cashDrawerCode" value={formData.devices.cashDrawerCode} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]" placeholder="27,112,0,128,128" />
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                className="bg-[#ecab0f] text-white py-3 rounded font-bold hover:brightness-110 transition-all mt-4"
                style={{ backgroundColor: formData.primaryColor }}
            >
              Guardar Cambios
            </button>
          </form>
        </div>
        
        {/* Branding Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by <span className="font-bold text-[#ecab0f]">LunIA</span></p>
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default Settings;
