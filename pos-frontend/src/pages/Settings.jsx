import React, { useState, useEffect } from "react";
import BackButton from "../components/shared/BackButton";
import BottomNav from "../components/shared/BottomNav";
import { useTheme } from "../context/ThemeContext";
import { updateRestaurantConfig } from "../https";
import { enqueueSnackbar } from "notistack";
import ImageUpload from "../components/shared/ImageUpload";

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
    customization: { 
            ticketFooter: "", 
            paymentMethods: "", 
            taxRate: 0, 
            currencySymbol: "$", 
            thousandsSeparator: ".", 
            decimalSeparator: ",", 
            welcomeMessage: "", 
            orderTimeThresholds: { green: 15, orange: 30, red: 45 },
            businessHours: { openTime: "08:00", closeTime: "22:00" },
            earningsPeriod: "shift" 
        },
    devices: { printerName: "", cashDrawerCode: "" }
  });

  const knownPrinters = ["Microsoft Print to PDF", "EPSON TM-T20II", "EPSON TM-T88V", "Star TSP100", "Generic / Text Only", "Xprinter XP-58", "POS-58", "POS-80"];
  const knownDrawers = ["27,112,0,128,128", "27,112,48,55,121", "7"];
  const [manualMode, setManualMode] = useState({ printer: false, cashDrawer: false });

  useEffect(() => {
    if (theme) {
      const pName = theme.devices?.printerName || "";
      const dCode = theme.devices?.cashDrawerCode || "";
      
      setManualMode({
        printer: pName !== "" && !knownPrinters.includes(pName),
        cashDrawer: dCode !== "" && !knownDrawers.includes(dCode)
      });

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
            thousandsSeparator: theme.customization?.thousandsSeparator || ".",
            decimalSeparator: theme.customization?.decimalSeparator || ",",
            welcomeMessage: theme.customization?.welcomeMessage || "Brinda tu mejor servicio a los clientes 😀",
            orderTimeThresholds: {
                green: theme.customization?.orderTimeThresholds?.green || 15,
                orange: theme.customization?.orderTimeThresholds?.orange || 30,
                red: theme.customization?.orderTimeThresholds?.red || 45
            },
            businessHours: {
                openTime: theme.customization?.businessHours?.openTime || "08:00",
                closeTime: theme.customization?.businessHours?.closeTime || "22:00"
            },
            earningsPeriod: theme.customization?.earningsPeriod || "shift"
        },
        devices: { 
            printerName: pName, 
            cashDrawerCode: dCode 
        }
      });
    }
  }, [theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejo de campos anidados
    if (name.includes('.')) {
        const parts = name.split('.');
        if(parts.length === 3) {
            const [section, subSection, field] = parts;
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [subSection]: {
                        ...prev[section][subSection],
                        [field]: value
                    }
                }
            }));
        } else {
            const [section, field] = parts;
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: type === 'checkbox' ? checked : value
                }
            }));
        }
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
            currencySymbol: "$",
            thousandsSeparator: ".",
            decimalSeparator: ","
        }
    }));
    enqueueSnackbar("Configuración aplicada para Colombia", { variant: "info" });
  };

  const handleResetUSA = () => {
    setFormData(prev => ({
        ...prev,
        customization: {
            ...prev.customization,
            ticketFooter: "Thank you for your dining with us",
            paymentMethods: "Cash, Credit Card, Debit Card, Apple Pay",
            taxRate: 8,
            currencySymbol: "$",
            thousandsSeparator: ",",
            decimalSeparator: "."
        }
    }));
    enqueueSnackbar("USA Configuration Applied", { variant: "info" });
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

            {/* Logo Upload */}
            <ImageUpload 
                label="Logo del Restaurante" 
                currentImage={formData.logo} 
                onImageUpload={(url) => setFormData(prev => ({ ...prev, logo: url }))} 
                placeholder="Recomendado: 500x500px PNG"
            />

            {/* Background Image Upload */}
            <ImageUpload 
                label="Imagen de Fondo (Login/Inicio)" 
                currentImage={formData.backgroundImage} 
                onImageUpload={(url) => setFormData(prev => ({ ...prev, backgroundImage: url }))} 
                placeholder="Recomendado: 1920x1080px JPG"
            />

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
                    <button 
                        type="button"
                        onClick={handleResetUSA}
                        className="text-xs bg-transparent border border-blue-500 text-blue-500 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors ml-2"
                    >
                        Aplicar Defaults USA
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
                </div>

                {/* Horario Laboral */}
                <div className="flex flex-col gap-4 mt-2 p-4 bg-[#1f1f1f] rounded border border-[#383838]">
                    <h3 className="text-gray-200 font-bold border-b border-[#383838] pb-2">Horario Laboral (Cortes y Reportes)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-300 font-semibold text-sm">Hora Apertura</label>
                            <input 
                                type="time" 
                                name="customization.businessHours.openTime"
                                value={formData.customization.businessHours?.openTime || "08:00"}
                                onChange={handleChange}
                                className="bg-[#2a2a2a] text-white p-2 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-300 font-semibold text-sm">Hora Cierre</label>
                            <input 
                                type="time" 
                                name="customization.businessHours.closeTime"
                                value={formData.customization.businessHours?.closeTime || "22:00"}
                                onChange={handleChange}
                                className="bg-[#2a2a2a] text-white p-2 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 italic">
                        Define el rango de operación para el cálculo correcto de cortes de caja y reportes diarios.
                    </p>
                </div>

                {/* Configuración de Ganancias */}
                <div className="flex flex-col gap-4 mt-4 p-4 bg-[#1f1f1f] rounded border border-[#383838]">
                    <h3 className="text-gray-200 font-bold border-b border-[#383838] pb-2">Visualización de Ganancias</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-300 font-semibold text-sm">Período de Tiempo</label>
                                <p className="text-xs text-gray-400 mt-1">
                                    Controla qué período de tiempo se muestra en las ganancias totales del panel principal
                                </p>
                            </div>
                            <select 
                                name="customization.earningsPeriod"
                                value={formData.customization.earningsPeriod || 'shift'}
                                onChange={handleChange}
                                className="bg-[#2a2a2a] text-white p-2 rounded outline-none border border-[#383838] focus:border-[#ecab0f] min-w-[120px]"
                            >
                                <option value="daily">Diaria</option>
                                <option value="shift">Jornada</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                                <option value="all">Todo el tiempo</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                            Este ajuste afecta directamente el valor mostrado en "Ganancias Totales" del panel principal.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Separador de Miles</label>
                        <select name="customization.thousandsSeparator" value={formData.customization.thousandsSeparator} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]">
                            <option value=".">Punto (.)</option>
                            <option value=",">Coma (,)</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Separador Decimal</label>
                        <select name="customization.decimalSeparator" value={formData.customization.decimalSeparator} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]">
                            <option value=",">Coma (,)</option>
                            <option value=".">Punto (.)</option>
                        </select>
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

            {/* Semáforo de Tiempos de Pedido */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[#ecab0f] text-xl font-bold">Semáforo de Tiempos de Pedido (Minutos)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-green-500 font-semibold">Tiempo Verde (&lt; X min)</label>
                        <input type="number" name="customization.orderTimeThresholds.green" value={formData.customization.orderTimeThresholds?.green} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-green-500" placeholder="15" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-orange-500 font-semibold">Tiempo Naranja (&gt; X min)</label>
                        <input type="number" name="customization.orderTimeThresholds.orange" value={formData.customization.orderTimeThresholds?.orange} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-orange-500" placeholder="30" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-red-500 font-semibold">Tiempo Rojo (&gt; X min)</label>
                        <input type="number" name="customization.orderTimeThresholds.red" value={formData.customization.orderTimeThresholds?.red} onChange={handleChange} className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-red-500" placeholder="45" />
                    </div>
                </div>
            </div>

            <hr className="border-[#383838] my-4" />

            {/* Dispositivos */}
            <div className="flex flex-col gap-4">
                <h2 className="text-[#ecab0f] text-xl font-bold">Dispositivos (Cliente)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Printer Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Impresora de Tickets</label>
                        <select 
                            className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                            value={manualMode.printer ? "manual" : (formData.devices.printerName || "")}
                            onChange={(e) => {
                                if (e.target.value === "manual") {
                                    setManualMode(prev => ({ ...prev, printer: true }));
                                    handleChange({ target: { name: "devices.printerName", value: "" } });
                                } else {
                                    setManualMode(prev => ({ ...prev, printer: false }));
                                    handleChange({ target: { name: "devices.printerName", value: e.target.value } });
                                }
                            }}
                        >
                            <option value="">-- Seleccionar --</option>
                            {knownPrinters.map(p => <option key={p} value={p}>{p}</option>)}
                            <option value="manual">Otro (Ingresar nombre)</option>
                        </select>
                        
                        {manualMode.printer && (
                            <input 
                                type="text" 
                                name="devices.printerName" 
                                value={formData.devices.printerName} 
                                onChange={handleChange} 
                                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f] animate-fade-in" 
                                placeholder="Nombre exacto de la impresora (Ej. EPSON-TM88)" 
                                autoFocus
                            />
                        )}
                    </div>

                    {/* Cash Drawer Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-gray-300 font-semibold">Cajón de Dinero (Código ASCII)</label>
                        <select 
                            className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f]"
                            value={manualMode.cashDrawer ? "manual" : (formData.devices.cashDrawerCode || "")}
                            onChange={(e) => {
                                if (e.target.value === "manual") {
                                    setManualMode(prev => ({ ...prev, cashDrawer: true }));
                                    handleChange({ target: { name: "devices.cashDrawerCode", value: "" } });
                                } else {
                                    setManualMode(prev => ({ ...prev, cashDrawer: false }));
                                    handleChange({ target: { name: "devices.cashDrawerCode", value: e.target.value } });
                                }
                            }}
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="27,112,0,128,128">Estándar ESC/POS (27,112,0...)</option>
                            <option value="27,112,48,55,121">EPSON (27,112,48...)</option>
                            <option value="7">Star Micronics (Bell)</option>
                            <option value="manual">Otro (Ingresar código)</option>
                        </select>

                        {manualMode.cashDrawer && (
                            <input 
                                type="text" 
                                name="devices.cashDrawerCode" 
                                value={formData.devices.cashDrawerCode} 
                                onChange={handleChange} 
                                className="bg-[#1f1f1f] text-white p-3 rounded outline-none border border-[#383838] focus:border-[#ecab0f] animate-fade-in" 
                                placeholder="Ej. 27,112,0,128,128" 
                                autoFocus
                            />
                        )}
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
            <p>Desarrollado por <span className="font-bold text-[#ecab0f]">LunIA</span></p>
        </div>
      </div>

      <BottomNav />
    </section>
  );
};

export default Settings;
