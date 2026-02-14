import React, { useEffect, useState } from "react";
import restaurant from "../assets/images/auth/restaurant-img.jpg"
import logoLunia from "../assets/images/branding/logolunia.png"
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";
import { useTheme } from "../context/ThemeContext";

const Auth = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.title = `${theme?.name || "POS"} | Autenticación`
  }, [theme])

  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Section */}
      <div className="w-1/2 relative flex items-center justify-center bg-cover">
        {/* BG Image */}
        <img 
            className="w-full h-full object-cover" 
            src={theme?.backgroundImage || restaurant} 
            alt="Restaurant Image" 
        />

        {/* Black Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>

        {/* Quote at bottom */}
        <blockquote className="absolute bottom-40 px-8 text-2xl italic text-white">
          "Sirve a todos clientes como si fuera tu ser mas preciado, la mejor comida con un servicio rápido, amable y ellos seguirán regresando."
          <br />
          <span className="block mt-4 text-yellow-400" style={{ color: theme?.primaryColor }}>- Fundador de LunIA, Walter López</span>
        </blockquote>
      </div>

      {/* Right Section */}
      <div className="w-1/2 min-h-screen bg-[#1a1a1a] p-10" style={{ backgroundColor: theme?.secondaryColor }}>
        <div className="flex flex-col items-center gap-2">
          {/* Main Logo - Shows configured logo if exists, else shows LunIA logo */}
          {theme?.logo ? (
              <img src={theme.logo} alt="Restaurant Logo" className="h-20 w-auto object-contain rounded-lg" />
          ) : (
              <img src={logoLunia} alt="LunIA Logo" className="h-14 w-14 border-2 rounded-full p-1" />
          )}
          <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">{theme?.name || "LunIA"}</h1>
        </div>

        <h2 className="text-4xl text-center mt-10 font-semibold text-yellow-400 mb-10" style={{ color: theme?.primaryColor }}>
          {isRegister ? "Registro de Empleado" : "Inicio de Sesión"}
        </h2>

        {/* Components */}  
        {isRegister ? <Register setIsRegister={setIsRegister} /> : <Login />}


        <div className="flex justify-center mt-6">
          <p className="text-sm text-[#ababab]">
            {isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}
            <a onClick={() => setIsRegister(!isRegister)} className="text-yellow-400 font-semibold hover:underline" href="#" style={{ color: theme?.primaryColor }}>
              {isRegister ? " Iniciar Sesión" : " Registrarse"}
            </a>
          </p>
        </div>
        
        {/* Branding Footer */}
        <div className="absolute bottom-2 right-10 flex items-center gap-2 opacity-50">
            <span className="text-xs text-gray-400">Desarrollado por</span>
            <img src={logoLunia} alt="LunIA" className="h-6 w-6 rounded-full" />
            <span className="text-xs font-bold text-gray-400">LunIA</span>
        </div>

      </div>
    </div>
  );
};

export default Auth;
